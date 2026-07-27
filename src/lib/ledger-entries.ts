import { ulid } from 'ulid'
import { parseAmount } from '@/lib/beancount/decimal'
import { CLEARING_ACCOUNT, type TxnEntry } from '@/lib/beancount/types'

export type ManualEntryInput = {
  type: 'purchase' | 'refund' | 'payment'
  date: string
  cardAccount: string
  payee: string
  narration?: string
  // Required for purchase/refund; ignored for payment.
  categoryAccount?: string
  categorySlug?: string
  mcc?: string
  amount: string // positive decimal, e.g. "1234.56"
}

// Builds the M2 two-posting entries. Signs follow the beancount conventions:
// purchase (expense +, card −) · refund mirrors it · payment (card +,
// clearing −; the bank side settles the clearing leg via its own statement).
// M3's earn engine appends the reward legs to purchases/refunds.
export function buildManualEntry(input: ManualEntryInput): TxnEntry {
  const amount = parseAmount(input.amount)
  if (amount.scaled <= 0) throw new Error('amount must be positive')
  const inr = (scaled: number) => ({ scaled, scale: amount.scale, commodity: 'INR' })

  const base = {
    kind: 'txn' as const,
    id: ulid(),
    date: input.date,
    flag: '*' as const,
    payee: input.payee.trim(),
    narration: input.narration?.trim() ?? '',
    meta: {
      ...(input.mcc ? { mcc: input.mcc } : {}),
      ...(input.categorySlug ? { category: input.categorySlug } : {}),
      source: 'manual' as const,
    },
  }

  switch (input.type) {
    case 'purchase':
    case 'refund': {
      if (!input.categoryAccount) throw new Error('category is required')
      const sign = input.type === 'purchase' ? 1 : -1
      return {
        ...base,
        postings: [
          { account: input.categoryAccount, amount: inr(sign * amount.scaled) },
          { account: input.cardAccount, amount: inr(-sign * amount.scaled) },
        ],
      }
    }
    case 'payment':
      return {
        ...base,
        postings: [
          { account: input.cardAccount, amount: inr(amount.scaled) },
          { account: CLEARING_ACCOUNT, amount: inr(-amount.scaled) },
        ],
      }
  }
}
