import { rescale } from './decimal'
import {
  ACCOUNT_RE,
  CC_ACCOUNT_RE,
  CC_PREFIX,
  DATE_RE,
  VOID_ACCOUNT,
  type Entry,
  type TxnEntry,
} from './types'

// Fail-closed entry validation — the gate every write passes through
// (manual, ingest, agent; the LedgerDO calls this before persisting).
// Returns a list of human-readable errors; empty = valid.

export type AccountInfo = {
  // Commodity constraint from the account's `open` (empty = unconstrained).
  currencies: string[]
  closed?: boolean
}

export type ValidateContext = {
  // Resolve an account opened in this ledger; undefined = not opened.
  getAccount: (name: string) => AccountInfo | undefined
  // Extra commodities treated as fiat, beyond the ISO-code rule.
  fiatCurrencies: ReadonlySet<string>
}

// Fiat = a 3-letter uppercase ISO-style code (INR, USD, …) or an explicit
// extra. The shape rule (not an allowlist) is deliberate: forex legs need
// arbitrary ISO codes, and the KB ticker schema bars reward tickers from the
// 3-letter shape, so points can never pass as fiat on an Expenses/Income leg.
// Accepted residual risk (Codex review — kept by design): a caller can invent
// a nonsense "ABC" commodity in their OWN ledger; self-inflicted, no
// cross-user or points-integrity impact.
export function isFiat(commodity: string, ctx: ValidateContext): boolean {
  return /^[A-Z]{3}$/.test(commodity) || ctx.fiatCurrencies.has(commodity)
}

// Strict calendar check — Date.parse alone normalizes impossible dates
// (2026-02-31 → Mar 3), so round-trip the components through a UTC date.
export function isValidDate(date: string): boolean {
  if (!DATE_RE.test(date)) return false
  const [y, mo, d] = date.split('-').map(Number)
  const dt = new Date(Date.UTC(y, mo - 1, d))
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d
}

export function validateEntry(entry: Entry, ctx: ValidateContext): string[] {
  const errors: string[] = []
  if (!isValidDate(entry.date)) {
    errors.push(`invalid date: ${entry.date}`)
  }

  switch (entry.kind) {
    case 'txn':
      errors.push(...validateTxn(entry, ctx))
      break
    case 'open':
      errors.push(...validateAccountName(entry.account))
      if (entry.currencies.length === 0) errors.push('open: at least one currency required')
      break
    case 'close':
    case 'balance':
    case 'pad':
      errors.push(...validateAccountName(entry.account))
      break
  }
  return errors
}

export function validateAccountName(name: string): string[] {
  if (!ACCOUNT_RE.test(name)) {
    return [`invalid account: ${name} (five roots, CapitalCamelCase segments, no spaces)`]
  }
  if (name.startsWith(CC_PREFIX) && !CC_ACCOUNT_RE.test(name)) {
    return [
      `invalid card account: ${name} (must be Liabilities:CreditCards:<Issuer>:<Card>[:<Id>] — fold variants into one segment)`,
    ]
  }
  return []
}

function validateTxn(txn: TxnEntry, ctx: ValidateContext): string[] {
  const errors: string[] = []
  if (txn.postings.length < 2) errors.push('a transaction needs at least 2 postings')
  if (!txn.payee.trim()) errors.push('payee is required')

  // Zero-sum per commodity. A leg's weight is its @@ total price when
  // present (in the price's commodity), else its own amount.
  const sums = new Map<string, number>()
  for (const [i, p] of txn.postings.entries()) {
    errors.push(...validateAccountName(p.account).map((e) => `posting ${i + 1}: ${e}`))

    if (!p.amount || !Number.isSafeInteger(p.amount.scaled)) {
      errors.push(`posting ${i + 1}: explicit amount required`)
      continue
    }
    if (p.amount.scaled === 0) errors.push(`posting ${i + 1}: zero amount`)
    if (!p.amount.commodity) errors.push(`posting ${i + 1}: commodity required`)

    // @@ price sanity (Codex review): a total price converts INTO another
    // commodity and is stated positive. Same-commodity or non-positive prices
    // could otherwise cancel each other while raw postings stay unbalanced.
    if (p.priceTotal) {
      if (p.priceTotal.commodity === p.amount.commodity) {
        errors.push(
          `posting ${i + 1}: @@ price must be in a different commodity than the amount (${p.amount.commodity})`,
        )
        continue
      }
      if (!Number.isSafeInteger(p.priceTotal.scaled) || p.priceTotal.scaled <= 0) {
        errors.push(`posting ${i + 1}: @@ price must be a positive amount`)
        continue
      }
    }

    let weight
    try {
      weight = p.priceTotal
        ? { ...rescale(p.priceTotal), sign: Math.sign(p.amount.scaled) }
        : { ...rescale(p.amount), sign: 1 }
    } catch (e) {
      errors.push(`posting ${i + 1}: ${e instanceof Error ? e.message : String(e)}`)
      continue
    }
    const commodity = p.priceTotal ? p.priceTotal.commodity : p.amount.commodity
    // An @@ price is stated positive; it carries the sign of its own leg.
    const contribution = p.priceTotal ? Math.abs(weight.scaled) * weight.sign : weight.scaled
    sums.set(commodity, (sums.get(commodity) ?? 0) + contribution)

    errors.push(...validateCommodityUse(p.account, p.amount.commodity, i, ctx))
  }
  for (const [commodity, sum] of sums) {
    if (sum !== 0) errors.push(`postings do not balance for ${commodity} (off by ${sum / 10_000})`)
  }
  return errors
}

function validateCommodityUse(
  account: string,
  commodity: string,
  idx: number,
  ctx: ValidateContext,
): string[] {
  const label = `posting ${idx + 1} (${account})`

  // Equity:Void balances reward mints/burns — any commodity.
  if (account === VOID_ACCOUNT) return []

  // Expenses/Income legs are always fiat; points live only on Assets:Rewards.
  if (account.startsWith('Expenses:') || account.startsWith('Income:')) {
    return isFiat(commodity, ctx)
      ? []
      : [`${label}: ${commodity} is not a fiat currency — points belong on Assets:Rewards legs`]
  }

  // Opened accounts enforce their commodity constraint; Assets/Liabilities
  // legs must reference an opened, unclosed account.
  const info = ctx.getAccount(account)
  if (!info) return [`${label}: account is not opened`]
  if (info.closed) return [`${label}: account is closed`]
  if (info.currencies.length > 0 && !info.currencies.includes(commodity)) {
    return [`${label}: ${commodity} not allowed (constraint: ${info.currencies.join(', ')})`]
  }
  return []
}
