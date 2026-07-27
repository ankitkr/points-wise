import type { SurchargeInput } from '@/lib/kb/schema'

// The "extra paid" that erodes the real earn rate. Most Indian-issuer fees are
// BANK-WIDE (keyed by bank slug in BANK_SURCHARGES); per-card fuel-surcharge
// waivers and forex markup live in CARD_SURCHARGES. scripts/seed-kb.ts merges
// bank-wide + card-specific into each card's earn rule (rule.surcharges) before
// validation, so the data lands in rule_json.
//
// `verified: true` ONLY where an official bank page was read successfully.
// Where the official MITC/fee PDF was unreadable (binary) or only aggregator
// sources existed, verified:false and the source/confidence is in `notes` — an
// admin confirms in /admin/kb. Researched July 2026.

// --- reusable builders ------------------------------------------------------
const forex = (percent: number, verified: boolean, notes: string, effectiveFrom?: string): SurchargeInput => ({
  kind: 'international',
  percent,
  thresholdBasis: 'per-transaction',
  applies: 'full',
  plusGst: true,
  verified,
  ...(effectiveFrom ? { effectiveFrom } : {}),
  notes,
})

// 1% fuel surcharge waived up to `waiverCapPerCycle` ₹/cycle for txns in
// [txnMin, txnMax]. A waiver ≈ levied then reversed; net fuel cost ~0 in-band.
const fuelWaiver = (
  waiverCapPerCycle: number,
  opts: {
    txnMin?: number
    txnMax?: number
    effectiveFrom?: string
    notes: string
    verified?: boolean
    waiverPeriod?: 'cycle' | 'quarter' | 'year'
  },
): SurchargeInput => ({
  kind: 'fuel',
  category: 'fuel',
  percent: 1,
  ...(opts.txnMin !== undefined ? { txnMin: opts.txnMin } : {}),
  ...(opts.txnMax !== undefined ? { txnMax: opts.txnMax } : {}),
  waiverCapPerCycle,
  ...(opts.waiverPeriod ? { waiverPeriod: opts.waiverPeriod } : {}),
  thresholdBasis: 'per-transaction',
  applies: 'full',
  plusGst: true,
  verified: opts.verified ?? false,
  ...(opts.effectiveFrom ? { effectiveFrom: opts.effectiveFrom } : {}),
  notes: opts.notes,
})

// ---------------------------------------------------------------------------
// Bank-wide surcharges (apply to every card of the bank).

export const BANK_SURCHARGES: Record<string, SurchargeInput[]> = {
  // Axis — Dec-2024 fee revision. Official MITC PDF was unreadable (binary), so
  // all values are secondary (cardinsider/finowings) → verified:false.
  axis: [
    { kind: 'rent', category: 'rent', mccs: ['6513'], percent: 1, thresholdBasis: 'per-transaction', applies: 'full', plusGst: true, effectiveFrom: '2024-12-20', verified: false, notes: 'Secondary (cardinsider/finowings). 1% on all rent (MCC 6513); prior ₹1,500/txn cap removed 20-Dec-2024; earns nothing.' },
    { kind: 'utilities', category: 'utilities', percent: 1, threshold: 25000, thresholdBasis: 'monthly', applies: 'above-threshold', plusGst: true, effectiveFrom: '2024-12-20', verified: false, notes: 'Secondary. 1% on cumulative utility ≥ ₹25,000/cycle, charged on the excess.' },
    { kind: 'fuel', category: 'fuel', percent: 1, threshold: 50000, thresholdBasis: 'monthly', applies: 'above-threshold', plusGst: true, effectiveFrom: '2024-12-20', verified: false, notes: 'Secondary. 1% on cumulative fuel ≥ ₹50,000/cycle (distinct from the per-card small-txn waiver).' },
    { kind: 'education', category: 'education', percent: 1, thresholdBasis: 'per-transaction', applies: 'full', plusGst: true, effectiveFrom: '2024-12-20', verified: false, notes: 'Secondary. 1% on 3rd-party education apps; direct-to-institution exempt.' },
    { kind: 'wallet', category: 'wallet', mccs: ['6540'], percent: 1, threshold: 10000, thresholdBasis: 'monthly', applies: 'above-threshold', plusGst: true, effectiveFrom: '2024-12-20', verified: false, notes: 'Secondary. 1% on cumulative wallet loads ≥ ₹10,000/cycle.' },
    { kind: 'gaming', mccs: ['7995'], percent: 1, threshold: 10000, thresholdBasis: 'monthly', applies: 'above-threshold', plusGst: true, effectiveFrom: '2024-12-20', verified: false, notes: 'Secondary. 1% on skill-gaming (MCC 7995) cumulative ≥ ₹10,000/cycle.' },
  ],

  // ICICI — Nov-2024 fee revision. Official upcoming-changes + international
  // pages were readable → core fees verified:true.
  icici: [
    { kind: 'rent', category: 'rent', mccs: ['6513'], percent: 1, thresholdBasis: 'per-transaction', applies: 'full', plusGst: true, effectiveFrom: '2024-11-15', verified: true, notes: 'Official ICICI upcoming-changes page. 1% on rent (MCC 6513); earns nothing; no per-txn cap in official HTML.' },
    { kind: 'utilities', category: 'utilities', percent: 1, threshold: 50000, thresholdBasis: 'per-transaction', applies: 'full', plusGst: true, effectiveFrom: '2024-11-15', verified: true, notes: 'Official ICICI. 1% on a SINGLE utility transaction exceeding ₹50,000 (per-transaction, not cumulative — verified vs official card pages). Contrast SBI which is cumulative/cycle.' },
    { kind: 'education', category: 'education', percent: 1, thresholdBasis: 'per-transaction', applies: 'full', plusGst: true, effectiveFrom: '2024-11-15', verified: true, notes: 'Official ICICI page. 1% on 3rd-party education apps; direct-to-institution 0%.' },
    { kind: 'wallet', category: 'wallet', mccs: ['6540', '6541'], percent: 1, thresholdBasis: 'per-transaction', applies: 'full', plusGst: true, effectiveFrom: '2026-01-15', verified: true, notes: 'Official ICICI upcoming-changes page. 1% on wallet loads from 15-Jan-2026; no floor stated.' },
  ],

  // SBI — official MITC + customer-notices HTML were readable → verified:true.
  sbi: [
    { kind: 'rent', category: 'rent', mccs: ['6513'], flat: 199, thresholdBasis: 'per-transaction', applies: 'full', plusGst: true, effectiveFrom: '2023-03-17', verified: true, notes: 'Official SBI customer-notices + MITC. FLAT ₹199 + taxes per rent txn (MCC 6513); non-reversible on refund.' },
    { kind: 'utilities', category: 'utilities', percent: 1, threshold: 50000, thresholdBasis: 'monthly', applies: 'full', plusGst: true, effectiveFrom: '2024-12-01', verified: true, notes: 'Official SBI MITC. 1% of TOTAL utility amount when cumulative > ₹50,000/cycle ("total amount" ⇒ full spend, not just the excess).' },
    { kind: 'education', category: 'education', percent: 1, thresholdBasis: 'per-transaction', applies: 'full', plusGst: true, effectiveFrom: '2025-11-01', verified: true, notes: 'Official SBI customer-notices. 1% on 3rd-party education apps; direct-to-institution 0%.' },
    { kind: 'wallet', category: 'wallet', mccs: ['6540', '6541'], percent: 1, threshold: 1000, thresholdBasis: 'per-transaction', applies: 'full', plusGst: true, effectiveFrom: '2025-11-01', verified: true, notes: 'Official SBI customer-notices. 1% on wallet-load txns exceeding ₹1,000 (fee on the full txn amount).' },
  ],

  // Standard Chartered — rent fee bank-wide (secondary). Fuel/forex per card.
  'standard-chartered': [
    { kind: 'rent', category: 'rent', mccs: ['6513'], percent: 1, thresholdBasis: 'per-transaction', applies: 'full', plusGst: true, effectiveFrom: '2023-04-02', verified: false, notes: 'Secondary (cardinsider). 1% + taxes on all rent, all SC cards, from 2-Apr-2023. No cap published.' },
  ],

  // HSBC — rent + wallet bank-wide (secondary; official MITC PDF binary). Fuel/forex per card.
  hsbc: [
    { kind: 'rent', category: 'rent', mccs: ['6513', '7012', '7349'], percent: 1, thresholdBasis: 'per-transaction', applies: 'full', plusGst: true, verified: false, notes: 'Secondary (Premier MITC PDF snippet + hexcode). 1% + GST on rent/property-management (MCC 6513/7012/7349), all HSBC India cards. No cap published.' },
    { kind: 'wallet', category: 'wallet', percent: 1, threshold: 10000, thresholdBasis: 'monthly', applies: 'above-threshold', plusGst: true, verified: false, notes: 'Secondary. 1% on cumulative wallet loads > ₹10,000/statement.' },
  ],

  // HDFC — Aug-2024 + Jul-2025 revisions. Official MITC PDF unreadable → secondary.
  // rent/education/wallet/gaming are bank-wide; utility & fuel vary per card (below).
  // Official HDFC MITC v4.4 (dated 21-Jul-2026), read via PDF. Consumer per-txn
  // fee cap ₹4,999 (BizBlack ₹3,000). 1% rent from 1-Jul-2025.
  hdfc: [
    { kind: 'rent', category: 'rent', mccs: ['6513'], percent: 1, thresholdBasis: 'per-transaction', applies: 'full', perTxnCap: 4999, plusGst: true, effectiveFrom: '2025-07-01', verified: true, notes: 'Official HDFC MITC v4.4 (Jul-2026), clause j. 1% per rent txn (MCC 6513), cap ₹4,999/txn (BizBlack ₹3,000); earns nothing.' },
    { kind: 'education', category: 'education', mccs: ['8211', '8220', '8241', '8244', '8249', '8299'], percent: 1, thresholdBasis: 'per-transaction', applies: 'full', perTxnCap: 4999, plusGst: true, effectiveFrom: '2024-08-01', verified: true, notes: 'Official HDFC MITC v4.4. 1% on 3rd-party education apps; direct-to-institution & international exempt.' },
    { kind: 'wallet', category: 'wallet', percent: 1, threshold: 10000, thresholdBasis: 'monthly', applies: 'full', perTxnCap: 4999, plusGst: true, effectiveFrom: '2025-07-01', verified: true, notes: 'Official HDFC MITC v4.4. 1% on monthly wallet loads > ₹10,000; PayZapp exempt.' },
    { kind: 'gaming', mccs: ['7995'], percent: 1, threshold: 10000, thresholdBasis: 'monthly', applies: 'full', perTxnCap: 4999, plusGst: true, effectiveFrom: '2025-07-01', verified: true, notes: 'Official HDFC MITC v4.4. 1% on monthly skill-gaming > ₹10,000; earns nothing.' },
  ],

  // IndusInd — 2023–2026 revisions (secondary; official MITC binary). Fuel & forex per card.
  indusind: [
    { kind: 'rent', category: 'rent', mccs: ['6513'], percent: 1, thresholdBasis: 'per-transaction', applies: 'full', plusGst: true, effectiveFrom: '2023-04-01', verified: false, notes: 'Secondary (cardinsider/technofino). 1% on rent (MCC 6513).' },
    { kind: 'utilities', category: 'utilities', percent: 1, threshold: 25000, thresholdBasis: 'monthly', applies: 'above-threshold', plusGst: true, effectiveFrom: '2024-10-01', verified: false, notes: 'Secondary. 1% on cumulative utility ≥ ₹25,000/cycle.' },
    { kind: 'education', category: 'education', percent: 1, threshold: 45000, thresholdBasis: 'monthly', applies: 'above-threshold', plusGst: true, effectiveFrom: '2025-01-01', verified: false, notes: 'Secondary. 1% on cumulative education ≥ ₹45,000/cycle.' },
    { kind: 'wallet', category: 'wallet', percent: 1, threshold: 20000, thresholdBasis: 'monthly', applies: 'above-threshold', plusGst: true, effectiveFrom: '2024-10-01', verified: false, notes: 'Secondary. 1% on cumulative wallet loads ≥ ₹20,000/cycle.' },
    { kind: 'other', category: 'commute', mccs: ['4111', '4112', '4131', '4784'], percent: 1, threshold: 40000, thresholdBasis: 'monthly', applies: 'above-threshold', plusGst: true, effectiveFrom: '2026-06-15', verified: false, notes: 'Secondary. 1% on cumulative transport (cabs/rail/bus/tolls, excl. air) ≥ ₹40,000/cycle; Pioneer/Solitaire exempt.' },
  ],

  // Amex — no bank-wide rent/utility/wallet surcharge documented (those are
  // reward exclusions, not fees). Fees are per-card (fuel/forex) below.
}

// ---------------------------------------------------------------------------
// Card-specific surcharges (appended AFTER the bank-wide set for that card).
// Mostly per-card fuel-surcharge waivers and forex markup.

// ICICI standard fuel (waiver band ₹400–5,000, ₹200/mo cap per aggregators).
const ICICI_FUEL: SurchargeInput = { kind: 'fuel', category: 'fuel', mccs: ['5541', '5542'], percent: 1, txnMin: 400, txnMax: 5000, waiverCapPerCycle: 200, thresholdBasis: 'per-transaction', applies: 'full', plusGst: true, verified: false, notes: 'Standard 1% fuel surcharge, waiver band ₹400–5,000; ₹200/mo cap per aggregators (not in official HTML).' }
// SBI standard fuel (band ₹400–5,000; per-card waiver cap not in bank-wide HTML).
const SBI_FUEL: SurchargeInput = { kind: 'fuel', category: 'fuel', mccs: ['5541', '5542'], percent: 1, txnMin: 400, txnMax: 5000, thresholdBasis: 'per-transaction', applies: 'full', plusGst: true, verified: false, notes: 'Standard 1% fuel surcharge, waiver band ₹400–5,000; card-specific waiver cap not in bank-wide HTML.' }
// Amex standard fuel (petroleum-company 1%; Amex adds no extra fee, no waiver documented).
const AMEX_FUEL: SurchargeInput = { kind: 'fuel', category: 'fuel', percent: 1, thresholdBasis: 'per-transaction', applies: 'full', plusGst: true, verified: false, notes: 'Standard petroleum-company 1% fuel surcharge; Amex adds no extra fee; no waiver documented (secondary).' }
// HDFC personal utility (₹50k). Business (BizBlack) overrides to ₹75k inline.
const HDFC_UTIL_50K: SurchargeInput = { kind: 'utilities', category: 'utilities', percent: 1, threshold: 50000, thresholdBasis: 'monthly', applies: 'full', perTxnCap: 4999, plusGst: true, effectiveFrom: '2024-08-01', verified: true, notes: 'Official HDFC MITC v4.4 (Jul-2026), clause s. Personal: 1% on monthly utility > ₹50,000, cap ₹4,999/mo; insurance excluded.' }
// HDFC fuel: 1% surcharge on high-value txns (above `threshold`/txn) + optional small-txn waiver.
const hdfcFuel = (threshold: number, waiverCap?: number): SurchargeInput[] => [
  { kind: 'fuel', category: 'fuel', percent: 1, threshold, thresholdBasis: 'per-transaction', applies: 'full', perTxnCap: 4999, plusGst: true, effectiveFrom: '2024-08-01', verified: false, notes: `Secondary. 1% on fuel txns above ₹${threshold}/txn (HDFC Aug-2024).` },
  ...(waiverCap ? [fuelWaiver(waiverCap, { txnMin: 400, txnMax: 5000, notes: `Standard 1% fuel-surcharge waiver on ₹400–5,000 txns, cap ₹${waiverCap}/cycle (secondary).` })] : []),
]
// IndusInd fuel: 1% on cumulative monthly fuel above a tier threshold.
const indusindFuel = (threshold: number): SurchargeInput => ({ kind: 'fuel', category: 'fuel', percent: 1, threshold, thresholdBasis: 'monthly', applies: 'above-threshold', plusGst: true, effectiveFrom: '2026-06-15', verified: false, notes: `Secondary. 1% on cumulative fuel ≥ ₹${threshold}/cycle.` })
// IDFC per-card rent / utility / education (Wealth & Mayura; Vistara is exempt).
const IDFC_RENT: SurchargeInput = { kind: 'rent', category: 'rent', mccs: ['6513'], percent: 1, flat: 249, combine: 'max', thresholdBasis: 'per-transaction', applies: 'full', plusGst: true, verified: false, notes: 'Secondary (cardinsider). max(₹249, 1%) per rent txn + GST.' }
const IDFC_UTILITY: SurchargeInput = { kind: 'utilities', category: 'utilities', percent: 1, threshold: 20000, thresholdBasis: 'monthly', applies: 'above-threshold', plusGst: true, effectiveFrom: '2024-05-01', verified: false, notes: 'Secondary. 1% on aggregate utility above ₹20,000/cycle.' }
const IDFC_EDU: SurchargeInput = { kind: 'education', category: 'education', percent: 1, flat: 249, combine: 'max', thresholdBasis: 'per-transaction', applies: 'full', plusGst: true, verified: false, notes: 'Secondary. max(₹249, 1%) on 3rd-party education apps.' }
// BoB per-card wallet (Eterna/Premier).
const BOB_WALLET: SurchargeInput = { kind: 'wallet', category: 'wallet', percent: 1, thresholdBasis: 'per-transaction', applies: 'full', plusGst: true, verified: false, notes: 'Secondary (low). 1% on wallet loads.' }

export const CARD_SURCHARGES: Record<string, SurchargeInput[]> = {
  // --- Axis: fuel waiver (₹400/cycle; ACE ₹500) + forex ---------------------
  'axis-magnus': [fuelWaiver(400, { txnMin: 400, txnMax: 4000, notes: 'Standard Axis 1% fuel-surcharge waiver, ₹400–4,000 txns, cap ₹400/cycle (secondary).' }), forex(2, false, 'cardinsider forex table (secondary): Magnus 2%.')],
  'axis-magnus-burgundy': [fuelWaiver(400, { txnMin: 400, txnMax: 4000, notes: 'Standard Axis fuel waiver, cap ₹400/cycle (secondary).' }), forex(2, false, 'cardinsider (secondary): Magnus-for-Burgundy 2%.')],
  'axis-atlas': [fuelWaiver(400, { txnMin: 400, txnMax: 4000, notes: 'Standard Axis fuel waiver, cap ₹400/cycle (secondary).' }), forex(3.5, false, 'Secondary consensus: Atlas 3.5%.')],
  'axis-privilege': [fuelWaiver(400, { txnMin: 400, txnMax: 4000, notes: 'Standard Axis fuel waiver (secondary).' }), forex(3.5, false, 'Inferred: most Axis cards 3.5%.')],
  'axis-ace': [fuelWaiver(500, { txnMin: 400, txnMax: 4000, notes: 'ACE 1% fuel-surcharge waiver, ₹400–4,000 txns, cap ₹500/cycle (secondary).' }), forex(3.5, false, 'Inferred: most Axis cards 3.5%.')],
  'axis-flipkart': [fuelWaiver(400, { txnMin: 400, txnMax: 4000, notes: 'Standard Axis fuel waiver (secondary).' }), forex(3.5, false, 'Inferred: most Axis cards 3.5%.')],
  'axis-airtel': [fuelWaiver(400, { txnMin: 400, txnMax: 4000, notes: 'Standard Axis fuel waiver (secondary).' }), forex(3.5, false, 'Inferred: most Axis cards 3.5%.')],

  // --- ICICI: fuel + forex --------------------------------------------------
  'icici-emeralde': [{ kind: 'fuel', category: 'fuel', mccs: ['5541', '5542'], percent: 1, txnMin: 400, txnMax: 5000, thresholdBasis: 'per-transaction', applies: 'full', plusGst: true, verified: false, notes: 'Emeralde: fuel-surcharge waiver up to ₹1L/YEAR (businesstoday); annual cap not encoded per-cycle.' }, forex(2, true, 'Official ICICI international page: Emeralde 2%.', '2024-11-15')],
  'icici-sapphiro': [ICICI_FUEL, forex(3.5, false, 'Default 3.5%; Sapphiro not listed among reduced-rate cards on official page.')],
  'icici-amazon-pay': [ICICI_FUEL, forex(1.99, true, 'Official: Amazon Pay ICICI 1.99% from 11-Oct-2025.', '2025-10-11')],
  'icici-coral': [ICICI_FUEL, forex(3.5, false, 'Default 3.5%; Coral not listed among reduced-rate cards on official page.')],
  'icici-makemytrip': [ICICI_FUEL, forex(0.99, true, 'Official ICICI international page: MakeMyTrip ICICI 0.99%.')],

  // --- SBI: fuel + forex (Elite/Prime 1.99%, others 3.5%) -------------------
  'sbi-cashback': [SBI_FUEL, forex(3.5, true, 'Official SBI MITC: 3.5%.')],
  'sbi-elite': [SBI_FUEL, forex(1.99, true, 'Official SBI MITC: Elite 1.99%.')],
  'sbi-simplyclick': [SBI_FUEL, forex(3.5, true, 'Official SBI MITC: 3.5%.')],
  'sbi-prime': [SBI_FUEL, forex(1.99, true, 'Official SBI MITC: Prime 1.99%.')],

  // --- Amex: fuel + forex (no rent surcharge; earns MR on rent) -------------
  'amex-platinum-travel': [AMEX_FUEL, forex(3.5, false, 'Amex India 3.5% forex on all cards (secondary).')],
  'amex-mrcc': [{ kind: 'fuel', category: 'fuel', percent: 0, txnMax: 5000, thresholdBasis: 'per-transaction', applies: 'full', plusGst: false, verified: false, notes: '0% fuel convenience fee at HPCL for txns < ₹5,000 (secondary); standard 1% may apply elsewhere.' }, forex(3.5, false, 'Amex India 3.5% forex (secondary).')],
  'amex-platinum': [AMEX_FUEL, forex(3.5, false, 'Amex India 3.5% forex (secondary).')],
  'amex-smartearn': [AMEX_FUEL, forex(3.5, false, 'Amex India 3.5% forex (secondary).')],

  // --- Standard Chartered: fuel + forex (rent is bank-wide) -----------------
  'sc-ultimate': [{ kind: 'fuel', category: 'fuel', percent: 1, waiverCapPerCycle: 1000, thresholdBasis: 'per-transaction', applies: 'full', plusGst: true, verified: false, notes: 'SC Ultimate 1% fuel-surcharge waiver, cap ₹1,000/mo (secondary).' }, forex(2, false, 'SC Ultimate 2% forex (secondary).')],
  'sc-smart': [{ kind: 'fuel', category: 'fuel', percent: 1, waiverCapPerCycle: 1000, thresholdBasis: 'per-transaction', applies: 'full', plusGst: true, verified: false, notes: 'SC Smart 1% fuel-surcharge waiver (₹10 or 1%, whichever higher; secondary).' }, forex(3.5, false, 'SC Smart 3.5% forex (secondary).')],
  'sc-easemytrip': [{ kind: 'fuel', category: 'fuel', percent: 1, thresholdBasis: 'per-transaction', applies: 'full', plusGst: true, verified: false, notes: 'SC EaseMyTrip: 1% fuel surcharge, no waiver documented (secondary).' }, forex(3.5, false, 'SC EaseMyTrip 3.5% forex (secondary).')],

  // --- HSBC: fuel + forex (rent + wallet are bank-wide) ---------------------
  'hsbc-travelone': [fuelWaiver(250, { notes: 'HSBC TravelOne 1% fuel-surcharge waiver, cap ₹250/mo (secondary).' }), forex(3.5, false, 'cardinsider: TravelOne 3.5% (rivo cites 1.5% — discrepancy).')],
  'hsbc-premier': [{ kind: 'fuel', category: 'fuel', percent: 1, txnMin: 400, txnMax: 4000, thresholdBasis: 'per-transaction', applies: 'full', plusGst: true, verified: false, notes: 'HSBC Premier: 1% fuel-surcharge waiver on ₹400–4,000 txns; per-cycle cap not published (secondary).' }, forex(0.99, true, 'Official hsbc.co.in international page: Premier 0.99%.')],
  'hsbc-live-plus': [fuelWaiver(250, { effectiveFrom: '2026-07-26', waiverPeriod: 'quarter', notes: 'Live+ post-26-Jul-2026: contactless fuel cashback, cap ~₹250/quarter; standard 1% surcharge otherwise (secondary).' }), forex(1.99, false, 'Live+ forex reduced 3.5%→1.99% eff 26-Jul-2026 (secondary).', '2026-07-26')],

  // --- HDFC: utility (personal ₹50k / biz ₹75k) + fuel (per-txn + waiver) + forex
  'hdfc-infinia': [HDFC_UTIL_50K, ...hdfcFuel(15000, 1000), forex(2, true, 'Official HDFC MITC v4.4 (Jul-2026): Infinia FCY 2%.')],
  'hdfc-diners-black': [HDFC_UTIL_50K, ...hdfcFuel(15000, 1000), forex(2, false, 'Diners Black 2% forex (secondary).')],
  'hdfc-bizblack': [{ kind: 'utilities', category: 'utilities', percent: 1, threshold: 75000, thresholdBasis: 'monthly', applies: 'full', plusGst: true, effectiveFrom: '2024-08-01', verified: false, notes: 'Secondary. Business card: 1% on full monthly utility once > ₹75,000.' }, ...hdfcFuel(30000), forex(2, false, 'BizBlack 2% forex (secondary).')],
  'hdfc-regalia-gold': [HDFC_UTIL_50K, ...hdfcFuel(15000, 500), forex(2, true, 'Official HDFC MITC v4.4: Regalia Gold FCY 2%; DCC markup 1.75% eff 15-May-2026 (separate from FCY).', '2026-05-15')],
  'hdfc-millennia': [HDFC_UTIL_50K, ...hdfcFuel(15000, 250), forex(3.5, false, 'Millennia 3.5% forex (secondary).')],
  'hdfc-marriott': [HDFC_UTIL_50K, ...hdfcFuel(15000), forex(3.5, false, 'Marriott 3.5% forex assumed (secondary, low).')],
  'hdfc-neu-infinity': [HDFC_UTIL_50K, ...hdfcFuel(15000, 250), forex(2, false, 'Tata Neu Infinity 2% forex (secondary).')],
  'hdfc-neu-plus': [HDFC_UTIL_50K, ...hdfcFuel(15000), forex(3.5, false, 'Tata Neu Plus 3.5% forex assumed (secondary, low).')],
  'hdfc-swiggy': [HDFC_UTIL_50K, ...hdfcFuel(15000), forex(3.5, false, 'Swiggy HDFC 3.5% forex (secondary).')],

  // --- IndusInd: fuel (tier threshold) + forex (rent/util/edu/wallet/transport bank-wide)
  'indusind-qatar-avios': [indusindFuel(50000), forex(3.5, false, 'Avios 3.5% forex; 1.5% on preferred destinations (secondary).')],
  'indusind-legend': [indusindFuel(30000), forex(1.8, false, 'Legend 1.8% forex (secondary).')],
  'indusind-eazydiner': [indusindFuel(30000), forex(3.5, false, 'EazyDiner 3.5% forex assumed (secondary, low).')],

  // --- AU: fuel + forex only. Rent/utility surcharge unconfirmed (official PDF binary) — omitted.
  'au-ixigo': [fuelWaiver(250, { txnMin: 400, txnMax: 5000, notes: 'AU ixigo 1% fuel waiver ₹400–5,000, cap ₹250/mo (secondary).' }), forex(0, false, 'ixigo AU 0% forex (secondary).')],
  'au-zenith': [fuelWaiver(250, { txnMin: 400, txnMax: 5000, notes: 'AU Zenith 1% fuel waiver, cap ~₹250/mo; Zenith+ higher (secondary).' }), forex(1.99, false, 'Zenith 1.99% forex; Zenith+ 0.99% (secondary).')],
  'au-lit': [{ kind: 'fuel', category: 'fuel', percent: 1, thresholdBasis: 'per-transaction', applies: 'full', plusGst: true, verified: false, notes: 'AU LIT: no fuel-surcharge waiver; standard 1% applies (secondary).' }, forex(3.5, false, 'LIT ~3.5% forex assumed (secondary, low).')],

  // --- IDFC FIRST: Wealth/Mayura carry rent/util/edu; Vistara is exempt (winding down)
  'idfc-vistara': [fuelWaiver(200, { txnMin: 200, txnMax: 5000, notes: 'IDFC standard fuel waiver ₹200–5,000, cap ₹200/cycle (secondary). Club Vistara winding down 30-Sep-2026; EXEMPT from rent/utility/education fees.' }), forex(3.5, false, 'Vistara 3.5% forex assumed (secondary, low).')],
  'idfc-wealth': [IDFC_RENT, IDFC_UTILITY, IDFC_EDU, fuelWaiver(300, { txnMin: 200, txnMax: 5000, notes: 'IDFC Wealth fuel waiver ₹200–5,000, cap ₹300/cycle (secondary).' }), { kind: 'fuel', category: 'fuel', percent: 1, threshold: 30000, thresholdBasis: 'monthly', applies: 'above-threshold', plusGst: true, verified: false, notes: 'Secondary. Also 1% on cumulative fuel above ₹30,000/cycle.' }, forex(1.5, false, 'Wealth 1.5% forex (secondary).')],
  'idfc-mayura': [IDFC_RENT, IDFC_UTILITY, IDFC_EDU, fuelWaiver(300, { txnMin: 200, txnMax: 5000, notes: 'IDFC Mayura fuel waiver ₹200–5,000, cap ₹300/cycle (secondary).' }), forex(0, false, 'Mayura 0% forex (secondary).')],

  // --- BoB: utility/wallet/fuel + forex. Rent/education earn nothing; no surcharge confirmed.
  'bob-eterna': [{ kind: 'utilities', category: 'utilities', percent: 1, threshold: 50000, thresholdBasis: 'monthly', applies: 'above-threshold', plusGst: true, verified: false, notes: 'Secondary (low). 1% on utility above ₹50,000/mo.' }, BOB_WALLET, fuelWaiver(250, { txnMin: 400, txnMax: 5000, notes: 'BoB Eterna fuel waiver ₹400–5,000, cap ₹250/cycle (secondary).' }), forex(2, false, 'Eterna 2% forex (secondary).')],
  'bob-premier': [{ kind: 'utilities', category: 'utilities', percent: 1, threshold: 50000, thresholdBasis: 'monthly', applies: 'above-threshold', plusGst: true, verified: false, notes: 'Secondary (low). 1% on utility above threshold assumed ₹50,000/mo (same as Eterna; unconfirmed).' }, BOB_WALLET, fuelWaiver(250, { txnMin: 400, txnMax: 5000, notes: 'BoB Premier fuel waiver ₹400–5,000, cap ₹250/mo (secondary).' }), forex(3.5, false, 'Premier 3.5% forex (secondary).')],
  'bob-etihad': [fuelWaiver(250, { txnMin: 500, txnMax: 5000, notes: 'BoB Etihad fuel waiver ₹500–5,000, cap ₹250/cycle (secondary).' }), forex(0, false, 'Etihad Guest Premium 0% forex (secondary).')],
}

// Pure composition — bank-wide THEN card-specific surcharges for one card.
// Defined here (not inline in seed-kb.ts) so the seed generator and its unit
// test exercise the EXACT same merge. Appends in a stable order; there is no
// dedup/override policy yet (no duplicate `kind`s exist today, and the two
// deliberate fuel entries — a high-value fee + a small-txn waiver — must both
// survive), so introduce identity+override semantics before adding overrides.
export function surchargesFor(bankSlug: string, cardSlug: string): SurchargeInput[] {
  return [...(BANK_SURCHARGES[bankSlug] ?? []), ...(CARD_SURCHARGES[cardSlug] ?? [])]
}

// Guards against a typo silently orphaning a whole surcharge set: every map key
// MUST resolve to a real bank/card slug. Returns the offending keys (empty = ok).
export function unknownSurchargeKeys(bankSlugs: Set<string>, cardSlugs: Set<string>): string[] {
  const bad: string[] = []
  for (const k of Object.keys(BANK_SURCHARGES)) if (!bankSlugs.has(k)) bad.push(`BANK_SURCHARGES["${k}"]`)
  for (const k of Object.keys(CARD_SURCHARGES)) if (!cardSlugs.has(k)) bad.push(`CARD_SURCHARGES["${k}"]`)
  return bad
}
