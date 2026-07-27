import { describe, expect, it } from 'vitest'
import { buildManualEntry } from './ledger-entries'

const CARD = 'Liabilities:CreditCards:Axis:Magnus'

describe('buildManualEntry', () => {
  it('rejects non-card cardAccount (Codex finding: forged card leg)', () => {
    expect(() =>
      buildManualEntry({
        type: 'purchase',
        date: '2026-07-01',
        cardAccount: 'Expenses:Adjustments',
        payee: 'X',
        categoryAccount: 'Expenses:Misc',
        amount: '100',
      }),
    ).toThrow(/cardAccount must be a card account/)
  })

  it('payments carry no category or MCC metadata', () => {
    const e = buildManualEntry({
      type: 'payment',
      date: '2026-07-01',
      cardAccount: CARD,
      payee: 'Bill payment',
      categorySlug: 'misc', // leaked by a defaulted form select — must be dropped
      mcc: '5411',
      amount: '500',
    })
    expect(e.meta).toEqual({ source: 'manual' })
    expect(e.postings[1].account).toBe('Assets:Clearing:CardPayments')
  })

  it('purchases keep category + MCC metadata and balance', () => {
    const e = buildManualEntry({
      type: 'purchase',
      date: '2026-07-01',
      cardAccount: CARD,
      payee: 'Store',
      categoryAccount: 'Expenses:Food:Groceries',
      categorySlug: 'groceries',
      mcc: '5411',
      amount: '250.50',
    })
    expect(e.meta).toEqual({ mcc: '5411', category: 'groceries', source: 'manual' })
    const sum = e.postings.reduce((n, p) => n + p.amount.scaled, 0)
    expect(sum).toBe(0)
  })

  it('rejects zero/negative amounts', () => {
    expect(() =>
      buildManualEntry({
        type: 'payment', date: '2026-07-01', cardAccount: CARD, payee: 'X', amount: '0',
      }),
    ).toThrow(/positive/)
  })
})
