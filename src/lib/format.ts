import { formatScaled } from '@/lib/beancount/decimal'

// Display helpers for scaled amounts.
export function money(scaled: number, scale: number, currency = 'INR'): string {
  const s = formatScaled({ scaled, scale }, 2)
  return currency === 'INR' ? `₹${s}` : `${s} ${currency}`
}

export function points(scaled: number, scale: number, ticker: string): string {
  return `${formatScaled({ scaled, scale })} ${ticker}`
}
