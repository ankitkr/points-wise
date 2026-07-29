import { commodityValueSchema, type CommodityValueInput } from '@/lib/kb/schema'

// Per-programme point valuations (₹ per point) — milesvault's "pricing index".
// Keyed by reward-commodity TICKER (the same tickers cards carry in cards.ts:
// `pool.ticker`). A shared pool (AMEX_MR, EDGE_RP) is priced ONCE here, not per
// card. Three qualities per programme: floor (cash/statement-credit equivalent)
// ≤ realistic (typical portal/voucher/economy transfer) ≤ best (optimised
// premium-cabin / sweet-spot award). Read by the M3 earn engine (real earn rate
// = base rate × realisticInr) and the net-worth view (balance × chosen quality).
//
// Sourcing: community consensus (CardInsider, CardExpert, LiveFromALounge,
// pointsmath, TechnoFino, CardMaven) cross-checked across two independent July-
// 2026 passes (Grok + web research), UNLESS an issuer publishes a fixed rate
// (cashback / 1:1 portal) → source:'official'. Community figures stay
// verified:false; premium "best" numbers are the most availability-sensitive.
// Reward-point values in India drift downward — revisit on each KB refresh.

const cashback = (notes: string): CommodityValueInput => ({
  floorInr: 1.0,
  realisticInr: 1.0,
  bestInr: 1.0,
  source: 'official',
  verified: true,
  notes,
})

export const COMMODITY_VALUES: Record<string, CommodityValueInput> = {
  // ---- Bank reward points (transferable / portal) ----
  HDFC_RP: {
    floorInr: 0.2,
    realisticInr: 0.5,
    bestInr: 1.0,
    notes:
      'Floor: cashback. Realistic: SmartBuy on Regalia/Millennia. Best: Infinia/Diners Black — SmartBuy 1 RP=₹1 or 1:1 airline transfer (KrisFlyer/Flying Blue) for intl premium cabin. Card-dependent; premium cards realise the top end.',
  },
  HDFC_CB: {
    floorInr: 0.3,
    realisticInr: 1.0,
    bestInr: 1.0,
    notes:
      'HDFC Millennia CashPoints — near-cash: 1 CashPoint = ₹1 statement credit (the designed use). AirMiles conversion is worse (~₹0.30). Distinct currency from HDFC_RP.',
  },
  AMEX_MR: {
    floorInr: 0.33,
    realisticInr: 0.58,
    bestInr: 1.0,
    notes:
      'Shared MR pool (Platinum Travel, MRCC, Platinum Charge, SmartEarn). Floor: 2 MR→1 airline mile at economy rates. Realistic: 24K Gold Collection Taj vouchers ~₹0.58/MR. Best: Marriott 1:1 or airline business class. MR never expires while fee is paid.',
  },
  EDGE_RP: {
    floorInr: 0.2,
    realisticInr: 0.4,
    bestInr: 1.0,
    notes:
      'Shared Axis EDGE Reward Points pool. Floor: EDGE portal ₹0.20. Realistic: 5:2 transfer → ₹0.40 economy. Best: premium cabin via KrisFlyer/Flying Blue. Weaker since the Apr-2026 partner cull (Accor/Marriott/Qatar removed).',
  },
  EDGE_MILES: {
    floorInr: 0.5,
    realisticInr: 1.0,
    bestInr: 3.0,
    notes:
      'Axis Atlas EDGE Miles (NOT pooled with EDGE RP). Floor: low domestic transfer. Realistic: statement/Travel EDGE 1 mile=₹1. Best: 1:2 KrisFlyer → SQ Suites / premium cabin. Availability-sensitive.',
  },
  ICICI_RP: {
    floorInr: 0.25,
    realisticInr: 0.25,
    bestInr: 0.5,
    notes:
      'Largely flat at ₹0.25 (catalogue/statement). Best: iShop 1 RP=₹1 on flights is the real upside on premium cards but capped monthly; Amazon/Flipkart vouchers ₹0.60. No mainstream airline transfer except Air India 1:1 on Emeralde PM.',
  },
  SBI_RP: {
    floorInr: 0.2,
    realisticInr: 0.25,
    bestInr: 1.0,
    notes:
      'Standard ₹0.25 statement credit (60k RP/mo cap, ₹99+GST fee). Best: co-branded redemptions (IRCTC/OLA/Paytm SBI) at ₹1/RP. No premium airline transfer.',
  },
  IDFC_RP: {
    floorInr: 0.25,
    realisticInr: 0.25,
    bestInr: 1.0,
    notes:
      'Flat ₹0.25 for most cardholders. Best: Mayura travel-portal ₹0.50 and select premium redemptions up to ₹1. Standard cards realise only the floor.',
  },
  AU_RP: {
    floorInr: 0.2,
    realisticInr: 0.25,
    bestInr: 0.5,
    notes:
      'Base AU cards (ixigo/Zenith/LIT). Floor: e-vouchers ₹0.20. Realistic: ₹0.25 standard. Best: ixigo Money ₹0.50 (ixigo card) or Air India Maharaja 6:1 transfer. Limited. (AU Zenith+ is a distinct ₹1 model → AU_RP_PREMIUM.)',
  },
  AU_RP_PREMIUM: {
    floorInr: 1.0,
    realisticInr: 1.0,
    bestInr: 1.0,
    notes:
      'AU Zenith+ Reward Points — a flat 1 RP = ₹1 for direct redemption / catalogue (Gemini audit mid-2026), making Zenith+ a ~1–2% flat-return card rather than a point-multiplier. Distinct ledger commodity from base AU_RP (₹0.25). Airline transfer (CV historically; Air India 6:1) is worse than direct and unconfirmed post-Vistara.',
  },
  INDUS_RP: {
    floorInr: 0.5,
    realisticInr: 0.75,
    bestInr: 1.0,
    notes:
      'Tier-dependent cash value ₹0.50 (Regular/Gold/Titanium) to ₹0.75 (Duo); up to ₹1 on select redemptions. KrisFlyer/Air India 4:1 transfer on Legend.',
  },
  BOB_RP: {
    floorInr: 0.2,
    realisticInr: 0.25,
    bestInr: 0.5,
    notes: 'BoB Reward Points ~₹0.25 cashback/catalogue; premium/select variants up to ₹0.50. No airline transfer (Eterna points are lifetime-valid).',
  },
  SC_RP: {
    floorInr: 0.25,
    realisticInr: 1.0,
    bestInr: 1.0,
    notes:
      'Standard Chartered 360° Rewards — no airline transfer in India. Ultimate: 1 RP=₹1 vouchers (Titan/ITC). EaseMyTrip variant only ₹0.25 via R360 portal. ₹99+GST redemption fee.',
  },
  HSBC_PTS: {
    floorInr: 0.5,
    realisticInr: 1.0,
    bestInr: 1.5,
    notes:
      'HSBC TravelOne/Premier points. Realistic: Travel With Points portal 1 pt=₹1. Best: 1:1 transfer to ~20 airlines/hotels for premium cabin. Premier points never expire.',
  },

  // ---- Airline / hotel currencies earned DIRECTLY by co-brand cards ----
  MAHARAJA_PTS: {
    floorInr: 0.4,
    realisticInr: 0.7,
    bestInr: 1.2,
    notes:
      'Air India Maharaja Club miles (ex-Vistara CV pool; earned directly by IDFC Vistara → Maharaja). Economy floor; best on Air India / Star Alliance premium cabins. Community-valued, route-dependent.',
  },
  BONVOY: {
    floorInr: 0.45,
    realisticInr: 0.5,
    bestInr: 1.0,
    notes:
      'Marriott Bonvoy (earned directly by HDFC Marriott). "Never buy above 45 paise." Typically ~₹0.50/point; ₹1+ at sweet-spot properties (e.g. Westin Rishikesh). Dynamic pricing.',
  },
  AVIOS: {
    floorInr: 0.59,
    realisticInr: 0.9,
    bestInr: 1.5,
    notes:
      'Avios (IndusInd Qatar/BA card earns directly; 1:1 between Qatar Privilege Club and BA Executive Club). Long-haul economy realistic; intra-Europe/short-haul premium best. High taxes cap value.',
  },
  ETIHAD_MILES: {
    floorInr: 0.6,
    realisticInr: 0.8,
    bestInr: 1.5,
    notes:
      'Etihad Guest miles (BoB Etihad Premium + Standard earn directly; not transferable onward). Realistic ~₹0.80 standard redemption (Gemini audit mid-2026); Etihad-metal business/first stretches to ₹1.50+. Same currency for both variants — the cards differ on EARN rate, not mile value.',
  },
  NEUCOINS: {
    floorInr: 1.0,
    realisticInr: 1.0,
    bestInr: 1.0,
    source: 'official',
    verified: true,
    notes: 'Tata NeuCoins are cash within the Tata Neu ecosystem: 1 NeuCoin = ₹1. No partner transfer exceeds face value. 12-month expiry.',
  },

  // ---- Cashback currencies (designed 1 unit = ₹1; no transfer upside) ----
  AXIS_CB: cashback('Axis auto-cashback (Ace/Flipkart/Airtel) — statement credit at ₹1/unit.'),
  SC_CB: cashback('Standard Chartered Smart cashback — statement credit at ₹1/unit.'),
  SBI_CB: cashback('SBI Cashback card — auto statement credit at ₹1/unit (₹4,000/cycle cap).'),
  SWIGGY_CB: cashback('HDFC Swiggy cashback — Swiggy-wallet/statement credit at ₹1/unit (₹99 on-demand fee).'),
  AMZN_CB: cashback('ICICI Amazon Pay — cashback credited as Amazon Pay balance at ₹1/unit; never expires, not encashable.'),
  HSBC_CB: cashback('HSBC Live+ cashback — auto statement credit at ₹1/unit (category caps apply).'),
  MYCASH: cashback('ICICI MakeMyTrip myCash — ₹1/unit inside the MMT wallet only (flights/hotels/holidays); not encashable.'),
}

// Validate every entry at module load so a malformed valuation fails the seed
// (and the seed test) rather than silently mispricing a portfolio.
for (const [ticker, v] of Object.entries(COMMODITY_VALUES)) {
  const parsed = commodityValueSchema.safeParse(v)
  if (!parsed.success) throw new Error(`COMMODITY_VALUES["${ticker}"] invalid: ${parsed.error.message}`)
}

// Pure lookups (mirror surcharges.ts / milestones.ts / redemptions.ts).
export function valuationFor(ticker: string): CommodityValueInput | undefined {
  return COMMODITY_VALUES[ticker]
}
// Tickers a card carries but that we have NOT priced — a gap the seed must reject
// (an unpriced programme can't be valued or have its real earn rate computed).
export function unpricedTickers(cardTickers: Set<string>): string[] {
  return [...cardTickers].filter((t) => !(t in COMMODITY_VALUES)).sort()
}
// Priced tickers that no active card uses — a stale/typo'd valuation key.
export function orphanValuationTickers(cardTickers: Set<string>): string[] {
  return Object.keys(COMMODITY_VALUES).filter((t) => !cardTickers.has(t)).sort()
}
