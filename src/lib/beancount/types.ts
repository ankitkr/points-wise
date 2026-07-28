// The beancount-shaped entry model. Entries are BUILT as structured objects
// (forms, ingest, agent tools) and validated before persisting — there is no
// text parser; text exists only as serialized output for display/export.

export type Amount = {
  scaled: number // fixed-point integer (see decimal.ts)
  scale: number
  commodity: string // "INR", "HDFC_RP", …
}

export type Posting = {
  account: string
  amount: Amount
  // Total price (`@@`) in the OTHER commodity — the leg's weight for the
  // zero-sum check (forex / points conversions). Absent for same-commodity.
  priceTotal?: Amount
}

export type TxnMeta = {
  mcc?: string
  category?: string // kb category slug
  source?: 'manual' | 'email' | 'telegram' | 'statement' | 'agent'
}

export type TxnEntry = {
  kind: 'txn'
  // A ULID minted by the LedgerDO at write time — an OPAQUE per-entry handle,
  // safe to expose to the owning client. (The server-only secrecy rule covers
  // users.id, the DO-addressing ULID; entry ids carry no such capability.)
  id: string
  date: string // YYYY-MM-DD
  flag: '*' | '!'
  payee: string
  narration: string
  postings: Posting[]
  meta?: TxnMeta
}

export type OpenEntry = {
  kind: 'open'
  id: string
  date: string
  account: string
  currencies: string[] // commodity constraint for the account
}

export type CloseEntry = { kind: 'close'; id: string; date: string; account: string }

export type BalanceEntry = {
  kind: 'balance'
  id: string
  date: string
  account: string
  amount: Amount
}

export type PadEntry = { kind: 'pad'; id: string; date: string; account: string; source: string }

export type Entry = TxnEntry | OpenEntry | CloseEntry | BalanceEntry | PadEntry

export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

// Account shape: five roots, colon-separated segments, each starting with a
// capital or digit, no spaces.
export const ACCOUNT_RE =
  /^(Assets|Liabilities|Equity|Income|Expenses)(:[A-Z0-9][A-Za-z0-9-]*)+$/

// Credit-card liabilities are strictly 4–5 segments:
// Liabilities:CreditCards:<Issuer>:<Card>[:<Id>]
export const CC_PREFIX = 'Liabilities:CreditCards:'
export const CC_ACCOUNT_RE =
  /^Liabilities:CreditCards:[A-Z0-9][A-Za-z0-9-]*:[A-Z0-9][A-Za-z0-9-]*(:[A-Za-z0-9]+)?$/

export const CLEARING_ACCOUNT = 'Assets:Clearing:CardPayments'
export const VOID_ACCOUNT = 'Equity:Void'
