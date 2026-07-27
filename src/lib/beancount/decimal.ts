// Fixed-point decimal helpers. Amounts are ALWAYS (scaled integer, scale)
// pairs — never floats. Storage canonicalizes to SCALE (4 decimal places),
// which is exact for fiat (2dp) and integral points, and keeps
// balance_totals to one row per (account, currency).

export const SCALE = 4
const POW = [1, 10, 100, 1_000, 10_000, 100_000, 1_000_000]

export type Scaled = { scaled: number; scale: number }

// "1234.56" | "-0.5" | "1,234" → scaled integer at SCALE. Throws on junk,
// >SCALE decimals, or magnitudes beyond safe-integer range.
export function parseAmount(input: string): Scaled {
  const raw = input.trim().replaceAll(',', '')
  const m = /^(-?)(\d+)(?:\.(\d+))?$/.exec(raw)
  if (!m) throw new Error(`invalid amount: ${input}`)
  const [, sign, whole, fracRaw = ''] = m
  if (fracRaw.length > SCALE) throw new Error(`too many decimal places (max ${SCALE}): ${input}`)
  const frac = fracRaw.padEnd(SCALE, '0')
  const scaled = Number(whole) * POW[SCALE] + Number(frac)
  if (!Number.isSafeInteger(scaled)) throw new Error(`amount out of range: ${input}`)
  return { scaled: sign === '-' ? -scaled : scaled, scale: SCALE }
}

// Render a scaled integer as a plain decimal string, trimming trailing
// zeros but always keeping at least `minDp` decimals.
export function formatScaled(s: Scaled, minDp = 0): string {
  const neg = s.scaled < 0
  const abs = Math.abs(s.scaled)
  const pow = POW[s.scale]
  const whole = Math.floor(abs / pow)
  let frac = String(abs % pow).padStart(s.scale, '0')
  while (frac.length > minDp && frac.endsWith('0')) frac = frac.slice(0, -1)
  return `${neg ? '-' : ''}${whole}${frac.length ? '.' + frac : ''}`
}

// Bring a value to SCALE (exact — throws if precision would be lost).
export function rescale(s: Scaled): Scaled {
  if (s.scale === SCALE) return s
  if (s.scale < SCALE) {
    const scaled = s.scaled * POW[SCALE - s.scale]
    if (!Number.isSafeInteger(scaled)) throw new Error('amount out of range')
    return { scaled, scale: SCALE }
  }
  const div = POW[s.scale - SCALE]
  if (s.scaled % div !== 0) throw new Error('precision beyond storage scale')
  return { scaled: s.scaled / div, scale: SCALE }
}
