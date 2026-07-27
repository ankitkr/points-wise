import { describe, expect, it } from 'vitest'
import { parseAmount, formatScaled, rescale } from './decimal'
import { validateEntry, type ValidateContext } from './validate'
import type { TxnEntry } from './types'

const FIAT = new Set(['INR'])

// A ledger with one card, its pool, and the clearing account opened.
const ctx: ValidateContext = {
  fiatCurrencies: FIAT,
  getAccount: (name) =>
    ({
      'Liabilities:CreditCards:Axis:Magnus': { currencies: ['INR'] },
      'Assets:Rewards:Axis': { currencies: ['EDGE_MILES'] },
      'Assets:Clearing:CardPayments': { currencies: ['INR'] },
      'Liabilities:CreditCards:HDFC:Old': { currencies: ['INR'], closed: true },
    })[name],
}

const inr = (v: string) => ({ ...parseAmount(v), commodity: 'INR' })
const pts = (v: string) => ({ ...parseAmount(v), commodity: 'EDGE_MILES' })

function txn(postings: TxnEntry['postings']): TxnEntry {
  return {
    kind: 'txn',
    id: '01TEST',
    date: '2026-07-01',
    flag: '*',
    payee: 'Test Merchant',
    narration: '',
    postings,
  }
}

describe('decimal', () => {
  it('parses and formats without floats', () => {
    expect(parseAmount('1234.56')).toEqual({ scaled: 12345600, scale: 4 })
    expect(parseAmount('-0.5').scaled).toBe(-5000)
    expect(parseAmount('1,234').scaled).toBe(12340000)
    expect(formatScaled({ scaled: 12345600, scale: 4 }, 2)).toBe('1234.56')
    expect(formatScaled({ scaled: 120000, scale: 4 })).toBe('12')
    expect(() => parseAmount('12.34.5')).toThrow()
    expect(() => parseAmount('abc')).toThrow()
    expect(() => parseAmount('1.00001')).toThrow() // beyond storage scale
  })

  it('rescales exactly or throws', () => {
    expect(rescale({ scaled: 5, scale: 0 })).toEqual({ scaled: 50000, scale: 4 })
    expect(() => rescale({ scaled: 123456789, scale: 6 })).toThrow()
  })
})

describe('validateEntry — zero-sum', () => {
  it('accepts a balanced purchase', () => {
    const e = txn([
      { account: 'Expenses:Food:Groceries', amount: inr('1000') },
      { account: 'Liabilities:CreditCards:Axis:Magnus', amount: inr('-1000') },
    ])
    expect(validateEntry(e, ctx)).toEqual([])
  })

  it('rejects an unbalanced transaction', () => {
    const e = txn([
      { account: 'Expenses:Food:Groceries', amount: inr('1000') },
      { account: 'Liabilities:CreditCards:Axis:Magnus', amount: inr('-999') },
    ])
    expect(validateEntry(e, ctx).join()).toContain('do not balance for INR')
  })

  it('balances per commodity independently (reward legs)', () => {
    const e = txn([
      { account: 'Expenses:Food:Groceries', amount: inr('1000') },
      { account: 'Liabilities:CreditCards:Axis:Magnus', amount: inr('-1000') },
      { account: 'Assets:Rewards:Axis', amount: pts('12') },
      { account: 'Equity:Void', amount: pts('-12') },
    ])
    expect(validateEntry(e, ctx)).toEqual([])
  })

  it('uses @@ total price as the weight for conversion legs', () => {
    const e = txn([
      {
        account: 'Expenses:Shopping:Online',
        amount: { ...parseAmount('10'), commodity: 'USD' },
        priceTotal: inr('840'),
      },
      { account: 'Liabilities:CreditCards:Axis:Magnus', amount: inr('-840') },
    ])
    expect(validateEntry(e, ctx)).toEqual([])
  })

  it('rejects single-posting and zero-amount entries', () => {
    expect(validateEntry(txn([{ account: 'Expenses:Misc', amount: inr('1') }]), ctx).join()).toContain(
      'at least 2 postings',
    )
    const zero = txn([
      { account: 'Expenses:Misc', amount: inr('0') },
      { account: 'Liabilities:CreditCards:Axis:Magnus', amount: inr('0') },
    ])
    expect(validateEntry(zero, ctx).join()).toContain('zero amount')
  })
})

describe('validateEntry — account shape', () => {
  it('rejects non-root and malformed accounts', () => {
    const e = txn([
      { account: 'Spending:Food', amount: inr('10') },
      { account: 'Liabilities:CreditCards:Axis:Magnus', amount: inr('-10') },
    ])
    expect(validateEntry(e, ctx).join()).toContain('invalid account')
  })

  it('rejects 6-segment card accounts (variant must fold into one segment)', () => {
    const e = txn([
      { account: 'Expenses:Misc', amount: inr('10') },
      { account: 'Liabilities:CreditCards:Axis:Select:Plus:1234', amount: inr('-10') },
    ])
    expect(validateEntry(e, ctx).join()).toContain('invalid card account')
  })
})

describe('validateEntry — commodity constraints', () => {
  it('rejects points on an expense leg', () => {
    const e = txn([
      { account: 'Expenses:Travel', amount: pts('500') },
      { account: 'Equity:Void', amount: pts('-500') },
    ])
    expect(validateEntry(e, ctx).join()).toContain('not a fiat currency')
  })

  it('rejects a commodity outside the account constraint', () => {
    const e = txn([
      { account: 'Assets:Rewards:Axis', amount: inr('100') },
      { account: 'Equity:Void', amount: inr('-100') },
    ])
    expect(validateEntry(e, ctx).join()).toContain('not allowed (constraint: EDGE_MILES)')
  })

  it('rejects unopened and closed Assets/Liabilities accounts', () => {
    const unopened = txn([
      { account: 'Expenses:Misc', amount: inr('10') },
      { account: 'Liabilities:CreditCards:HDFC:Infinia', amount: inr('-10') },
    ])
    expect(validateEntry(unopened, ctx).join()).toContain('not opened')

    const closed = txn([
      { account: 'Expenses:Misc', amount: inr('10') },
      { account: 'Liabilities:CreditCards:HDFC:Old', amount: inr('-10') },
    ])
    expect(validateEntry(closed, ctx).join()).toContain('closed')
  })

  it('rejects invalid dates', () => {
    const e = txn([
      { account: 'Expenses:Misc', amount: inr('10') },
      { account: 'Liabilities:CreditCards:Axis:Magnus', amount: inr('-10') },
    ])
    expect(validateEntry({ ...e, date: '2026-13-99' }, ctx).join()).toContain('invalid date')
  })
})
