import { formatScaled } from './decimal'
import type { Amount, Entry } from './types'

// Serialize entries to beancount text — display/export only (never parsed back).

function amt(a: Amount, minDp = 2): string {
  return `${formatScaled(a, a.commodity.length === 3 ? minDp : 0)} ${a.commodity}`
}

export function entryToText(entry: Entry): string {
  switch (entry.kind) {
    case 'txn': {
      const header = `${entry.date} ${entry.flag} "${escapeQ(entry.payee)}" "${escapeQ(entry.narration)}"`
      const width = Math.max(...entry.postings.map((p) => p.account.length)) + 2
      const lines = entry.postings.map((p) => {
        const price = p.priceTotal ? ` @@ ${amt(p.priceTotal)}` : ''
        return `  ${p.account.padEnd(width)}${amt(p.amount)}${price}`
      })
      return [header, ...lines].join('\n')
    }
    case 'open':
      return `${entry.date} open ${entry.account} ${entry.currencies.join(',')}`
    case 'close':
      return `${entry.date} close ${entry.account}`
    case 'balance':
      return `${entry.date} balance ${entry.account} ${amt(entry.amount)}`
    case 'pad':
      return `${entry.date} pad ${entry.account} ${entry.source}`
  }
}

function escapeQ(s: string): string {
  return s.replaceAll('"', '\\"')
}
