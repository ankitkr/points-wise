import { DurableObject } from 'cloudflare:workers'
import { ulid } from 'ulid'
import { rescale, SCALE } from '@/lib/beancount/decimal'
import { validateEntry, type AccountInfo } from '@/lib/beancount/validate'
import { CLEARING_ACCOUNT, type Entry, type Posting, type TxnEntry } from '@/lib/beancount/types'

// Per-user ledger. One instance per user, addressed by the server-only ULID
// (`idFromName(users.id)`) — the Worker authorizes every call before the stub
// is created; the DO never authorizes (it cannot authenticate its caller).
//
// This is the single write gate: every path (manual, ingest, agent) converges
// on postEntry, which validates via beancount-core before persisting.
// balance_totals is maintained by SQLite triggers on postings (insert/delete;
// edits are delete+insert) so balances can never drift from history.

export type CardMeta = {
  kbSlug: string
  nickname?: string
  last4?: string
  statementDay?: number
  poolAccount: string
  poolTicker: string
}

export type CardRow = {
  account: string
  openedDate: string
  meta: CardMeta
  balances: BalanceRow[]
}

export type BalanceRow = { account: string; currency: string; scaled: number; scale: number }

export type EntryRow = TxnEntry & { createdAt: number }

export type PostResult = { ok: true; id: string } | { ok: false; errors: string[] }

export type ListEntriesQuery = {
  account?: string
  from?: string
  to?: string
  limit?: number
  cursor?: string // "<date>|<id>" of the last row of the previous page
}

const FIAT = new Set(['INR'])

export class LedgerDO extends DurableObject<CloudflareEnv> {
  constructor(ctx: DurableObjectState, env: CloudflareEnv) {
    super(ctx, env)
    ctx.blockConcurrencyWhile(async () => this.migrate())
  }

  private migrate(): void {
    this.ctx.storage.sql.exec(`
      CREATE TABLE IF NOT EXISTS accounts (
        name         TEXT PRIMARY KEY,
        kind         TEXT,                -- 'card' | 'rewards' | 'clearing' | 'expense' | NULL
        opened_date  TEXT NOT NULL,
        closed_date  TEXT,
        currencies   TEXT NOT NULL DEFAULT '[]',
        card_meta    TEXT,
        created_at   INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS entries (
        id         TEXT PRIMARY KEY,
        date       TEXT NOT NULL,
        kind       TEXT NOT NULL,
        flag       TEXT,
        payee      TEXT NOT NULL DEFAULT '',
        narration  TEXT NOT NULL DEFAULT '',
        meta_json  TEXT NOT NULL DEFAULT '{}',
        created_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS entries_date ON entries(date, id);
      CREATE TABLE IF NOT EXISTS postings (
        entry_id       TEXT NOT NULL,
        idx            INTEGER NOT NULL,
        account        TEXT NOT NULL,
        amount_scaled  INTEGER NOT NULL,
        scale          INTEGER NOT NULL,
        currency       TEXT NOT NULL,
        price_scaled   INTEGER,
        price_scale    INTEGER,
        price_currency TEXT,
        PRIMARY KEY (entry_id, idx)
      );
      CREATE INDEX IF NOT EXISTS postings_account ON postings(account, currency);
      CREATE TABLE IF NOT EXISTS balance_totals (
        account        TEXT NOT NULL,
        currency       TEXT NOT NULL,
        scale          INTEGER NOT NULL,
        balance_scaled INTEGER NOT NULL,
        PRIMARY KEY (account, currency, scale)
      );
      CREATE TRIGGER IF NOT EXISTS postings_ai AFTER INSERT ON postings BEGIN
        INSERT INTO balance_totals (account, currency, scale, balance_scaled)
        VALUES (NEW.account, NEW.currency, NEW.scale, NEW.amount_scaled)
        ON CONFLICT(account, currency, scale)
        DO UPDATE SET balance_scaled = balance_scaled + NEW.amount_scaled;
      END;
      CREATE TRIGGER IF NOT EXISTS postings_ad AFTER DELETE ON postings BEGIN
        UPDATE balance_totals
        SET balance_scaled = balance_scaled - OLD.amount_scaled
        WHERE account = OLD.account AND currency = OLD.currency AND scale = OLD.scale;
      END;
    `)
  }

  // --- cards -----------------------------------------------------------------

  async openCard(input: {
    account: string // canonical Liabilities:CreditCards:<Issuer>:<Card>[:<Id>]
    openedDate: string
    meta: CardMeta
  }): Promise<PostResult> {
    const exists = this.getAccountRow(input.account)
    if (exists) return { ok: false, errors: [`card account already open: ${input.account}`] }

    const openEntry: Entry = {
      kind: 'open',
      id: ulid(),
      date: input.openedDate,
      account: input.account,
      currencies: ['INR'],
    }
    const errors = validateEntry(openEntry, this.validateCtx())
    if (errors.length) return { ok: false, errors }

    this.ctx.storage.transactionSync(() => {
      this.insertAccount(input.account, 'card', input.openedDate, ['INR'], input.meta)
      // The card's reward pool (shared per issuer) and the payment clearing
      // account come along for free so later milestones can post to them.
      // An issuer pool holds one commodity PER PROGRAMME — a second card from
      // the same bank with a different ticker WIDENS the constraint (Codex
      // review: the first card must not fix the pool's commodity forever).
      const pool = this.getAccountRow(input.meta.poolAccount)
      if (!pool) {
        this.insertAccount(input.meta.poolAccount, 'rewards', input.openedDate, [input.meta.poolTicker], null)
      } else {
        const currencies = JSON.parse(pool.currencies) as string[]
        if (!currencies.includes(input.meta.poolTicker)) {
          this.ctx.storage.sql.exec(
            `UPDATE accounts SET currencies = ? WHERE name = ?`,
            JSON.stringify([...currencies, input.meta.poolTicker]),
            input.meta.poolAccount,
          )
        }
      }
      if (!this.getAccountRow(CLEARING_ACCOUNT)) {
        this.insertAccount(CLEARING_ACCOUNT, 'clearing', input.openedDate, ['INR'], null)
      }
      this.insertEntryRow(openEntry)
    })
    return { ok: true, id: openEntry.id }
  }

  async listCards(): Promise<CardRow[]> {
    const rows = this.ctx.storage.sql
      .exec(`SELECT name, opened_date, card_meta FROM accounts WHERE kind = 'card' ORDER BY created_at`)
      .toArray() as Array<{ name: string; opened_date: string; card_meta: string | null }>
    const balances = await this.balances()
    return rows.map((r) => {
      const meta = JSON.parse(r.card_meta ?? '{}') as CardMeta
      return {
        account: r.name,
        openedDate: r.opened_date,
        meta,
        // Pool balances are matched by account AND the card's own ticker —
        // same-bank cards share one issuer wallet but earn different
        // programmes (Codex review: account-only matching mislabelled pools).
        balances: balances.filter(
          (b) =>
            b.account === r.name ||
            (b.account === meta.poolAccount && b.currency === meta.poolTicker),
        ),
      }
    })
  }

  // --- entries ---------------------------------------------------------------

  async postEntry(entry: TxnEntry): Promise<PostResult> {
    // Normalize all amounts to the canonical storage scale first.
    let postings: Posting[]
    try {
      postings = entry.postings.map((p) => ({
        ...p,
        amount: { ...rescale(p.amount), commodity: p.amount.commodity },
        ...(p.priceTotal ? { priceTotal: { ...rescale(p.priceTotal), commodity: p.priceTotal.commodity } } : {}),
      }))
    } catch (e) {
      return { ok: false, errors: [e instanceof Error ? e.message : String(e)] }
    }
    // The id is ALWAYS minted here — caller-supplied ids are ignored (Codex
    // review: a duplicate caller id would surface as an unhandled constraint
    // error; minting at the trusted boundary removes the class entirely).
    const normalized: TxnEntry = { ...entry, id: ulid(), postings }

    const errors = validateEntry(normalized, this.validateCtx())
    if (errors.length) return { ok: false, errors }

    // Auto-open expense accounts on first use (INR-constrained).
    this.ctx.storage.transactionSync(() => {
      for (const p of normalized.postings) {
        if (p.account.startsWith('Expenses:') && !this.getAccountRow(p.account)) {
          this.insertAccount(p.account, 'expense', normalized.date, ['INR'], null)
        }
      }
      this.insertEntryRow(normalized)
    })
    return { ok: true, id: normalized.id }
  }

  async deleteEntry(id: string): Promise<PostResult> {
    const row = this.ctx.storage.sql
      .exec(`SELECT id, kind FROM entries WHERE id = ?`, id)
      .toArray()[0] as { id: string; kind: string } | undefined
    if (!row) return { ok: false, errors: ['entry not found'] }
    if (row.kind !== 'txn') return { ok: false, errors: ['only transactions can be deleted'] }
    this.ctx.storage.transactionSync(() => {
      // Delete postings first — the delete trigger reverses balance_totals.
      this.ctx.storage.sql.exec(`DELETE FROM postings WHERE entry_id = ?`, id)
      this.ctx.storage.sql.exec(`DELETE FROM entries WHERE id = ?`, id)
    })
    return { ok: true, id }
  }

  async getEntry(id: string): Promise<EntryRow | null> {
    const rows = this.entriesByIds([id])
    return rows[0] ?? null
  }

  async listEntries(q: ListEntriesQuery): Promise<{ entries: EntryRow[]; cursor: string | null }> {
    const limit = Math.min(Math.max(q.limit ?? 50, 1), 200)
    const where: string[] = [`e.kind = 'txn'`]
    const params: (string | number)[] = []
    if (q.from) { where.push('e.date >= ?'); params.push(q.from) }
    if (q.to) { where.push('e.date <= ?'); params.push(q.to) }
    if (q.cursor) {
      const [d, i] = q.cursor.split('|')
      where.push('(e.date < ? OR (e.date = ? AND e.id < ?))')
      params.push(d, d, i)
    }
    if (q.account) {
      where.push('e.id IN (SELECT entry_id FROM postings WHERE account = ?)')
      params.push(q.account)
    }
    const ids = this.ctx.storage.sql
      .exec(
        `SELECT e.id FROM entries e WHERE ${where.join(' AND ')} ORDER BY e.date DESC, e.id DESC LIMIT ?`,
        ...params,
        limit,
      )
      .toArray()
      .map((r) => (r as { id: string }).id)
    const entries = this.entriesByIds(ids)
    const last = entries[entries.length - 1]
    return { entries, cursor: entries.length === limit && last ? `${last.date}|${last.id}` : null }
  }

  async balances(): Promise<BalanceRow[]> {
    return this.ctx.storage.sql
      .exec(`SELECT account, currency, scale, balance_scaled FROM balance_totals WHERE balance_scaled != 0 ORDER BY account`)
      .toArray()
      .map((r) => {
        const row = r as { account: string; currency: string; scale: number; balance_scaled: number }
        return { account: row.account, currency: row.currency, scale: row.scale, scaled: row.balance_scaled }
      })
  }

  // --- internals ---------------------------------------------------------------

  private validateCtx() {
    return {
      getAccount: (name: string): AccountInfo | undefined => {
        const row = this.getAccountRow(name)
        if (!row) return undefined
        return { currencies: JSON.parse(row.currencies) as string[], closed: row.closed_date != null }
      },
      fiatCurrencies: FIAT,
    }
  }

  private getAccountRow(name: string) {
    return this.ctx.storage.sql
      .exec(`SELECT name, currencies, closed_date FROM accounts WHERE name = ?`, name)
      .toArray()[0] as { name: string; currencies: string; closed_date: string | null } | undefined
  }

  private insertAccount(
    name: string,
    kind: string,
    openedDate: string,
    currencies: string[],
    meta: CardMeta | null,
  ): void {
    this.ctx.storage.sql.exec(
      `INSERT INTO accounts (name, kind, opened_date, currencies, card_meta, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
      name,
      kind,
      openedDate,
      JSON.stringify(currencies),
      meta ? JSON.stringify(meta) : null,
      Date.now(),
    )
  }

  private insertEntryRow(entry: Entry): void {
    const isTxn = entry.kind === 'txn'
    this.ctx.storage.sql.exec(
      `INSERT INTO entries (id, date, kind, flag, payee, narration, meta_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      entry.id,
      entry.date,
      entry.kind,
      isTxn ? entry.flag : null,
      isTxn ? entry.payee : '',
      isTxn ? entry.narration : '',
      isTxn ? JSON.stringify(entry.meta ?? {}) : '{}',
      Date.now(),
    )
    if (isTxn) {
      entry.postings.forEach((p, idx) => {
        this.ctx.storage.sql.exec(
          `INSERT INTO postings (entry_id, idx, account, amount_scaled, scale, currency, price_scaled, price_scale, price_currency) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          entry.id,
          idx,
          p.account,
          p.amount.scaled,
          p.amount.scale,
          p.amount.commodity,
          p.priceTotal?.scaled ?? null,
          p.priceTotal?.scale ?? null,
          p.priceTotal?.commodity ?? null,
        )
      })
    }
  }

  private entriesByIds(ids: string[]): EntryRow[] {
    if (ids.length === 0) return []
    const qs = ids.map(() => '?').join(',')
    const entryRows = this.ctx.storage.sql
      .exec(`SELECT * FROM entries WHERE id IN (${qs})`, ...ids)
      .toArray() as Array<{
      id: string; date: string; kind: string; flag: string | null; payee: string; narration: string; meta_json: string; created_at: number
    }>
    const postingRows = this.ctx.storage.sql
      .exec(`SELECT * FROM postings WHERE entry_id IN (${qs}) ORDER BY entry_id, idx`, ...ids)
      .toArray() as Array<{
      entry_id: string; idx: number; account: string; amount_scaled: number; scale: number; currency: string
      price_scaled: number | null; price_scale: number | null; price_currency: string | null
    }>
    const byEntry = new Map<string, Posting[]>()
    for (const p of postingRows) {
      const list = byEntry.get(p.entry_id) ?? []
      list.push({
        account: p.account,
        amount: { scaled: p.amount_scaled, scale: p.scale, commodity: p.currency },
        ...(p.price_scaled != null && p.price_currency
          ? { priceTotal: { scaled: p.price_scaled, scale: p.price_scale ?? SCALE, commodity: p.price_currency } }
          : {}),
      })
      byEntry.set(p.entry_id, list)
    }
    const byId = new Map(entryRows.map((e) => [e.id, e]))
    return ids
      .map((id) => byId.get(id))
      .filter((e): e is NonNullable<typeof e> => !!e)
      .map((e) => ({
        kind: 'txn' as const,
        id: e.id,
        date: e.date,
        flag: (e.flag ?? '*') as '*' | '!',
        payee: e.payee,
        narration: e.narration,
        postings: byEntry.get(e.id) ?? [],
        meta: JSON.parse(e.meta_json),
        createdAt: e.created_at,
      }))
  }
}
