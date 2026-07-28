import { env } from 'cloudflare:test'
import { describe, expect, it } from 'vitest'
import { ulid } from 'ulid'
import { buildManualEntry } from '@/lib/ledger-entries'
import type { LedgerDO } from './ledger-do'

// Each test gets its own DO instance (fresh SQLite) by using a unique name.
function freshLedger(): DurableObjectStub<LedgerDO> {
  const name = `test-${ulid()}`
  return env.LEDGER_DO.get(env.LEDGER_DO.idFromName(name))
}

const CARD = 'Liabilities:CreditCards:Axis:Magnus'
const META = {
  kbSlug: 'axis-magnus',
  poolAccount: 'Assets:Rewards:Axis:Magnus',
  poolTicker: 'EDGE_MILES',
}

async function openTestCard(ledger: DurableObjectStub<LedgerDO>) {
  return ledger.openCard({ account: CARD, openedDate: '2026-01-01', meta: META })
}

describe('LedgerDO', () => {
  it('opens a card (with pool + clearing accounts) exactly once', async () => {
    const ledger = freshLedger()
    const first = await openTestCard(ledger)
    expect(first.ok).toBe(true)

    const again = await openTestCard(ledger)
    expect(again.ok).toBe(false)

    const cards = await ledger.listCards()
    expect(cards).toHaveLength(1)
    expect(cards[0].account).toBe(CARD)
    expect(cards[0].meta.poolTicker).toBe('EDGE_MILES')
  })

  it('posts a purchase and maintains balance_totals', async () => {
    const ledger = freshLedger()
    await openTestCard(ledger)

    const entry = buildManualEntry({
      type: 'purchase',
      date: '2026-07-02',
      cardAccount: CARD,
      payee: 'Grocery Store',
      categoryAccount: 'Expenses:Food:Groceries',
      categorySlug: 'groceries',
      mcc: '5411',
      amount: '1234.56',
    })
    const res = await ledger.postEntry(entry)
    expect(res.ok).toBe(true)

    const balances = await ledger.balances()
    const card = balances.find((b) => b.account === CARD)
    const exp = balances.find((b) => b.account === 'Expenses:Food:Groceries')
    expect(card).toMatchObject({ currency: 'INR', scaled: -12345600 })
    expect(exp).toMatchObject({ currency: 'INR', scaled: 12345600 })
  })

  it('refund and payment reverse/settle the card balance', async () => {
    const ledger = freshLedger()
    await openTestCard(ledger)

    const post = (input: Parameters<typeof buildManualEntry>[0]) =>
      ledger.postEntry(buildManualEntry(input))

    await post({
      type: 'purchase', date: '2026-07-02', cardAccount: CARD, payee: 'Store',
      categoryAccount: 'Expenses:Shopping', categorySlug: 'shopping', amount: '1000',
    })
    await post({
      type: 'refund', date: '2026-07-03', cardAccount: CARD, payee: 'Store',
      categoryAccount: 'Expenses:Shopping', categorySlug: 'shopping', amount: '400',
    })
    await post({ type: 'payment', date: '2026-07-05', cardAccount: CARD, payee: 'Bill payment', amount: '600' })

    const balances = await ledger.balances()
    // -1000 + 400 + 600 = 0 → zero rows are filtered out of balance_totals.
    expect(balances.find((b) => b.account === CARD)).toBeUndefined()
    expect(balances.find((b) => b.account === 'Assets:Clearing:CardPayments')).toMatchObject({
      scaled: -6000000,
    })
  })

  it('rejects invalid entries fail-closed (unbalanced, unopened card, bad shape)', async () => {
    const ledger = freshLedger()
    await openTestCard(ledger)

    const good = buildManualEntry({
      type: 'purchase', date: '2026-07-02', cardAccount: CARD, payee: 'X',
      categoryAccount: 'Expenses:Misc', categorySlug: 'misc', amount: '100',
    })

    // Unbalanced: tamper one leg.
    const unbalanced = { ...good, postings: [good.postings[0], { ...good.postings[1], amount: { ...good.postings[1].amount, scaled: -990000 } }] }
    const r1 = await ledger.postEntry(unbalanced)
    expect(r1.ok).toBe(false)
    if (!r1.ok) expect(r1.errors.join()).toContain('do not balance')

    // Unopened card account.
    const unopened = buildManualEntry({
      type: 'purchase', date: '2026-07-02', cardAccount: 'Liabilities:CreditCards:HDFC:Infinia',
      payee: 'X', categoryAccount: 'Expenses:Misc', categorySlug: 'misc', amount: '100',
    })
    const r2 = await ledger.postEntry(unopened)
    expect(r2.ok).toBe(false)
    if (!r2.ok) expect(r2.errors.join()).toContain('not opened')

    // Nothing persisted from the failures.
    expect((await ledger.listEntries({})).entries).toHaveLength(0)
  })

  it('delete reverses balances; list paginates newest-first', async () => {
    const ledger = freshLedger()
    await openTestCard(ledger)

    const ids: string[] = []
    for (const [date, amount] of [
      ['2026-07-01', '100'],
      ['2026-07-02', '200'],
      ['2026-07-03', '300'],
    ] as const) {
      const res = await ledger.postEntry(
        buildManualEntry({
          type: 'purchase', date, cardAccount: CARD, payee: `P${date}`,
          categoryAccount: 'Expenses:Misc', categorySlug: 'misc', amount,
        }),
      )
      if (res.ok) ids.push(res.id)
    }

    const page1 = await ledger.listEntries({ limit: 2 })
    expect(page1.entries.map((e) => e.date)).toEqual(['2026-07-03', '2026-07-02'])
    expect(page1.cursor).not.toBeNull()
    const page2 = await ledger.listEntries({ limit: 2, cursor: page1.cursor! })
    expect(page2.entries.map((e) => e.date)).toEqual(['2026-07-01'])

    const del = await ledger.deleteEntry(ids[2])
    expect(del.ok).toBe(true)
    const balances = await ledger.balances()
    expect(balances.find((b) => b.account === CARD)).toMatchObject({ scaled: -3000000 }) // 100+200
    expect((await ledger.listEntries({})).entries).toHaveLength(2)

    // Metadata round-trips.
    const one = await ledger.getEntry(ids[0])
    expect(one?.meta).toMatchObject({ category: 'misc', source: 'manual' })
  })

  it('filters by account', async () => {
    const ledger = freshLedger()
    await openTestCard(ledger)
    await ledger.postEntry(
      buildManualEntry({
        type: 'purchase', date: '2026-07-02', cardAccount: CARD, payee: 'A',
        categoryAccount: 'Expenses:Food:Dining', categorySlug: 'dining', amount: '50',
      }),
    )
    const hits = await ledger.listEntries({ account: 'Expenses:Food:Dining' })
    expect(hits.entries).toHaveLength(1)
    const misses = await ledger.listEntries({ account: 'Expenses:Travel' })
    expect(misses.entries).toHaveLength(0)
  })
})
