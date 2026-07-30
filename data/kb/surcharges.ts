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

// Dynamic Currency Conversion markup — levied when a foreign merchant/website
// bills the transaction in INR (the cardholder is "offered" INR at POS). This is
// SEPARATE from the forex markup (which applies when billed in foreign currency)
// and is often the WORSE of the two. Same shape as forex, kind:'dcc'.
const dcc = (percent: number, verified: boolean, notes: string, effectiveFrom?: string): SurchargeInput => ({
  kind: 'dcc',
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
  // Axis — Dec-2024 fee revision. Verified against the OFFICIAL Axis MITC PDF
  // (axis.bank.in mitc-credit-cards.pdf, read Jul-2026) → verified:true.
  axis: [
    { kind: 'rent', category: 'rent', mccs: ['6513'], percent: 1, thresholdBasis: 'per-transaction', applies: 'full', plusGst: true, effectiveFrom: '2024-12-20', verified: true, notes: 'Official Axis MITC. 1% + GST per rent txn (MCC 6513); no cap (prior ₹1,500/txn cap removed 20-Dec-2024 — some card pages carry stale cap text). Earns nothing.' },
    { kind: 'utilities', category: 'utilities', percent: 1, threshold: 25000, thresholdBasis: 'monthly', applies: 'full', plusGst: true, effectiveFrom: '2024-12-20', verified: true, notes: 'Official Axis MITC (MCC 4814/4899/4900): 1% on the FULL cumulative utility spend once ≥ ₹25,000/cycle (official example: ₹25,000 → ₹250 fee) — not just the excess.' },
    { kind: 'fuel', category: 'fuel', percent: 1, threshold: 50000, thresholdBasis: 'monthly', applies: 'full', plusGst: true, effectiveFrom: '2024-12-20', verified: true, notes: 'Official Axis MITC. 1% "Fuel Transaction Fee" on cumulative fuel ≥ ₹50,000/cycle (distinct from the per-card small-txn waiver).' },
    { kind: 'education', category: 'education', percent: 1, thresholdBasis: 'per-transaction', applies: 'full', plusGst: true, effectiveFrom: '2024-12-20', verified: true, notes: 'Official Axis MITC. 1% on 3rd-party education apps; direct-to-institution / institutional POS exempt.' },
    { kind: 'wallet', category: 'wallet', mccs: ['6540'], percent: 1, threshold: 10000, thresholdBasis: 'monthly', applies: 'full', plusGst: true, effectiveFrom: '2024-12-20', verified: true, notes: 'Official Axis MITC. 1% on cumulative wallet loads (MCC 6540) ≥ ₹10,000/cycle.' },
    { kind: 'gaming', mccs: ['5816'], percent: 1, threshold: 10000, thresholdBasis: 'monthly', applies: 'full', plusGst: true, effectiveFrom: '2024-12-20', verified: true, notes: 'Official Axis MITC. 1% on online skill-gaming (MCC 5816 — corrected from 7995) cumulative ≥ ₹10,000/cycle.' },
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
    { kind: 'rent', category: 'rent', mccs: ['6513'], percent: 1, thresholdBasis: 'per-transaction', applies: 'full', plusGst: true, effectiveFrom: '2023-04-02', verified: true, notes: 'Official SC FAQ (rental processing fee) + community (Jul-2026 verification): 1% + taxes on all rent (MCC 6513/7349), all SC cards, from 2-Apr-2023. No cap published.' },
  ],

  // HSBC — rent + wallet bank-wide (secondary; official MITC PDF binary). Fuel/forex per card.
  hsbc: [
    { kind: 'rent', category: 'rent', mccs: ['6513', '7012', '7349'], percent: 1, thresholdBasis: 'per-transaction', applies: 'full', plusGst: true, verified: true, notes: 'Confirmed Jul-2026 (community-consistent; HSBC FAQ marks MCC 6513/7012/7349 as rewards-excluded). 1% + GST on rent/property-management, all HSBC India cards. No cap published.' },
    { kind: 'wallet', category: 'wallet', percent: 1, threshold: 10000, thresholdBasis: 'monthly', applies: 'above-threshold', plusGst: true, verified: false, notes: 'UNCONFIRMED — the ₹10,000/statement wallet-load threshold could not be sourced (HSBC MITC PDF is image-based; not in any accessible community source). Wallet is a rewards-excluded category. Verify against the HSBC MITC before relying on the threshold.' },
  ],

  // HDFC — Aug-2024 + Jul-2025 revisions. Official MITC PDF unreadable → secondary.
  // rent/education/wallet/gaming are bank-wide; utility & fuel vary per card (below).
  // Official HDFC MITC v4.4 (dated 21-Jul-2026), read via PDF. Per-txn fee cap
  // ₹4,999 across HDFC cards (incl. BizBlack). 1% rent from 1-Jul-2025.
  hdfc: [
    { kind: 'rent', category: 'rent', mccs: ['6513'], percent: 1, thresholdBasis: 'per-transaction', applies: 'full', perTxnCap: 4999, plusGst: true, effectiveFrom: '2025-07-01', verified: true, notes: 'Official HDFC MITC v4.4 (Jul-2026), clause j. 1% per rent txn (MCC 6513), cap ₹4,999/txn; earns nothing. (BizBlack is the same ₹4,999 per user verification 2025-07-01 — the earlier ₹3,000 carve-out was incorrect.)' },
    { kind: 'education', category: 'education', mccs: ['8211', '8220', '8241', '8244', '8249', '8299'], percent: 1, thresholdBasis: 'per-transaction', applies: 'full', perTxnCap: 4999, plusGst: true, effectiveFrom: '2024-08-01', verified: true, notes: 'Official HDFC MITC v4.4. 1% on 3rd-party education apps; direct-to-institution & international exempt.' },
    { kind: 'wallet', category: 'wallet', percent: 1, threshold: 10000, thresholdBasis: 'monthly', applies: 'full', perTxnCap: 4999, plusGst: true, effectiveFrom: '2025-07-01', verified: true, notes: 'Official HDFC MITC v4.4. 1% on monthly wallet loads > ₹10,000; PayZapp exempt.' },
    { kind: 'gaming', mccs: ['7995'], percent: 1, threshold: 10000, thresholdBasis: 'monthly', applies: 'full', perTxnCap: 4999, plusGst: true, effectiveFrom: '2025-07-01', verified: true, notes: 'Official HDFC MITC v4.4. 1% on monthly skill-gaming > ₹10,000; earns nothing.' },
  ],

  // IndusInd — 2023–2026 revisions. Confirmed Jul-2026 (community-consistent across
  // cardinsider; official IndusInd Rent-Information/fee PDFs exist but are binary).
  indusind: [
    { kind: 'rent', category: 'rent', mccs: ['6513'], percent: 1, thresholdBasis: 'per-transaction', applies: 'full', plusGst: true, effectiveFrom: '2023-04-01', verified: true, notes: 'Confirmed Jul-2026 (cardinsider; official IndusInd Rent-Information PDF). 1% + GST on rent (MCC 6513) via 3rd-party merchants.' },
    { kind: 'utilities', category: 'utilities', percent: 1, threshold: 25000, thresholdBasis: 'monthly', applies: 'above-threshold', plusGst: true, effectiveFrom: '2024-10-01', verified: true, notes: 'Confirmed Jul-2026 (cardinsider). 1% + GST on cumulative utility ≥ ₹25,000/cycle.' },
    { kind: 'education', category: 'education', percent: 1, threshold: 45000, thresholdBasis: 'monthly', applies: 'above-threshold', plusGst: true, effectiveFrom: '2025-01-01', verified: true, notes: 'Confirmed Jul-2026 (cardinsider). 1% + GST on cumulative 3rd-party education ≥ ₹45,000/cycle; direct-to-institution exempt.' },
    { kind: 'wallet', category: 'wallet', percent: 1, threshold: 20000, thresholdBasis: 'monthly', applies: 'above-threshold', plusGst: true, effectiveFrom: '2024-10-01', verified: true, notes: 'Confirmed Jul-2026 (cardinsider). 1% + GST on cumulative wallet loads ≥ ₹20,000/cycle.' },
    { kind: 'other', category: 'commute', mccs: ['4111', '4112', '4131', '4784'], percent: 1, threshold: 40000, thresholdBasis: 'monthly', applies: 'above-threshold', plusGst: true, effectiveFrom: '2026-06-15', verified: true, notes: 'Confirmed Jul-2026 (cardinsider): 1% on cumulative transport (cabs/rail/bus/tolls, excl. air) ≥ ₹40,000/cycle eff 15-Jun-2026. Pioneer/Solitaire exemption unconfirmed (source 403).' },
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
// HDFC personal utility (₹50k). BizBlack also ₹50k, defined inline (user-verified).
const HDFC_UTIL_50K: SurchargeInput = { kind: 'utilities', category: 'utilities', percent: 1, threshold: 50000, thresholdBasis: 'monthly', applies: 'full', perTxnCap: 4999, plusGst: true, effectiveFrom: '2024-08-01', verified: true, notes: 'Official HDFC MITC v4.4 (Jul-2026), clause s. Personal: 1% on monthly utility > ₹50,000, cap ₹4,999/mo; insurance excluded.' }
// HDFC fuel: 1% surcharge on high-value txns (above `threshold`/txn) + optional small-txn waiver.
const hdfcFuel = (threshold: number, waiverCap?: number): SurchargeInput[] => [
  { kind: 'fuel', category: 'fuel', percent: 1, threshold, thresholdBasis: 'per-transaction', applies: 'full', perTxnCap: 4999, plusGst: true, effectiveFrom: '2024-08-01', verified: false, notes: `Secondary. 1% on fuel txns above ₹${threshold}/txn (HDFC Aug-2024).` },
  ...(waiverCap ? [fuelWaiver(waiverCap, { txnMin: 400, txnMax: 5000, notes: `Standard 1% fuel-surcharge waiver on ₹400–5,000 txns, cap ₹${waiverCap}/cycle (secondary).` })] : []),
]
// IndusInd fuel: 1% on cumulative monthly fuel above a tier threshold.
const indusindFuel = (threshold: number): SurchargeInput => ({ kind: 'fuel', category: 'fuel', percent: 1, threshold, thresholdBasis: 'monthly', applies: 'above-threshold', plusGst: true, effectiveFrom: '2026-06-15', verified: false, notes: `Secondary. 1% on cumulative fuel ≥ ₹${threshold}/cycle.` })
// IDFC per-card rent / utility / education (Wealth & Mayura; Vistara is exempt).
const IDFC_RENT: SurchargeInput = { kind: 'rent', category: 'rent', mccs: ['6513'], percent: 1, flat: 249, combine: 'max', thresholdBasis: 'per-transaction', applies: 'full', plusGst: true, verified: true, notes: 'Official IDFC MITC (confirmed Jul-2026): max(₹249, 1%) per rent txn + GST.' }
const IDFC_UTILITY: SurchargeInput = { kind: 'utilities', category: 'utilities', percent: 1, threshold: 20000, thresholdBasis: 'monthly', applies: 'above-threshold', plusGst: true, effectiveFrom: '2024-05-01', verified: true, notes: 'Official IDFC MITC (confirmed Jul-2026): 1% + GST on aggregate utility above ₹20,000/cycle.' }
const IDFC_EDU: SurchargeInput = { kind: 'education', category: 'education', percent: 1, flat: 249, combine: 'max', thresholdBasis: 'per-transaction', applies: 'full', plusGst: true, verified: true, notes: 'Official IDFC MITC (confirmed Jul-2026): max(₹249, 1%) on 3rd-party education apps; direct-to-institute exempt.' }
// BoB per-card wallet (Eterna/Premier).
const BOB_WALLET: SurchargeInput = { kind: 'wallet', category: 'wallet', percent: 1, thresholdBasis: 'per-transaction', applies: 'full', plusGst: true, verified: true, notes: 'Confirmed Jul-2026 (cardinsider/paisabazaar): 1% on wallet loads.' }

export const CARD_SURCHARGES: Record<string, SurchargeInput[]> = {
  // --- Axis: fuel waiver (₹400/cycle; ACE ₹500) + forex ---------------------
  'axis-magnus': [fuelWaiver(400, { txnMin: 400, txnMax: 4000, verified: true, notes: 'Official Axis MITC: 1% fuel-surcharge waiver ₹400–4,000 txns, cap ₹400/cycle.' }), forex(2, true, 'Confirmed Jul-2026 (cardinsider/TechnoFino): Magnus 2%.'), dcc(2, false, 'Axis 28-Jul-2026 T&C: Magnus DCC markup 1.5% → 2% (eff 28-Aug-2026). Distinct from the 2% forex markup. Community (Moneycontrol/@ccg33k).', '2026-08-28')],
  'axis-magnus-burgundy': [fuelWaiver(400, { txnMin: 400, txnMax: 4000, verified: true, notes: 'Official Axis MITC fuel waiver, cap ₹400/cycle.' }), forex(2, true, 'Confirmed Jul-2026 (cardinsider): Magnus-for-Burgundy 2%.'), dcc(2, false, 'Axis 28-Jul-2026 T&C: Magnus-for-Burgundy DCC 1.5% → 2% (eff 28-Aug-2026). Community.', '2026-08-28')],
  'axis-atlas': [fuelWaiver(400, { txnMin: 400, txnMax: 4000, verified: true, notes: 'Official Axis MITC fuel waiver, cap ₹400/cycle.' }), forex(3.5, true, 'Confirmed Jul-2026 (cardinsider): Atlas 3.5%.')],
  'axis-privilege': [fuelWaiver(400, { txnMin: 400, txnMax: 4000, verified: true, notes: 'Official Axis MITC fuel waiver.' }), forex(3.5, true, 'Confirmed Jul-2026: Axis standard 3.5%.'), dcc(3.5, false, 'Axis 28-Jul-2026 T&C: mid-tier DCC 1.5% → 3.5% (eff 28-Aug-2026; MyZone/Select/Privilege/Neo). Community (cardinsider).', '2026-08-28')],
  'axis-ace': [fuelWaiver(500, { txnMin: 400, txnMax: 4000, verified: true, notes: 'Official Axis MITC: ACE fuel-surcharge waiver ₹400–4,000 txns, cap ₹500/cycle.' }), forex(3.5, true, 'Confirmed Jul-2026: ACE 3.5%.')],
  'axis-flipkart': [fuelWaiver(400, { txnMin: 400, txnMax: 4000, verified: true, notes: 'Official Axis MITC fuel waiver.' }), forex(3.5, true, 'Confirmed Jul-2026: Axis standard 3.5%.')],
  'axis-airtel': [fuelWaiver(500, { txnMin: 400, txnMax: 4000, verified: true, notes: 'Official Axis MITC: Airtel fuel-surcharge waiver cap ₹500/cycle (same as ACE — corrected from ₹400).' }), forex(3.5, true, 'Confirmed Jul-2026: Axis standard 3.5%.')],

  // --- ICICI: fuel + forex --------------------------------------------------
  'icici-emeralde-private-metal': [{ kind: 'fuel', category: 'fuel', mccs: ['5541', '5542'], percent: 1, txnMin: 400, txnMax: 5000, thresholdBasis: 'per-transaction', applies: 'full', plusGst: true, verified: false, notes: 'Emeralde PM: fuel-surcharge waiver up to ₹1L/YEAR (businesstoday); annual cap not encoded per-cycle.' }, forex(2, true, 'Official ICICI international page: Emeralde PM 2%.', '2024-11-15')],
  // Legacy non-metal ICICI Emeralde: 1% fuel-surcharge waiver (all stations) + 2% forex.
  'icici-emeralde': [{ kind: 'fuel', category: 'fuel', mccs: ['5541', '5542'], percent: 1, txnMin: 400, txnMax: 5000, thresholdBasis: 'per-transaction', applies: 'full', plusGst: true, verified: false, notes: 'Legacy Emeralde: 1% fuel-surcharge waiver across fuel stations (cardinsider; per-cycle cap not published).' }, forex(2, true, 'Legacy Emeralde 2% forex (cardinsider).')],
  'icici-sapphiro': [ICICI_FUEL, forex(3.5, true, 'Official ICICI international page: default 3.5% (Sapphiro not among the reduced-rate cards).')],
  'icici-amazon-pay': [ICICI_FUEL, forex(1.99, true, 'Official: Amazon Pay ICICI 1.99% from 11-Oct-2025.', '2025-10-11')],
  'icici-coral': [ICICI_FUEL, forex(3.5, true, 'Official ICICI international page: default 3.5% (Coral not among the reduced-rate cards).')],
  'icici-makemytrip': [ICICI_FUEL, forex(0.99, true, 'Official ICICI international page: MakeMyTrip ICICI 0.99%.')],

  // --- SBI: fuel + forex (Elite/Prime 1.99%, others 3.5%) -------------------
  'sbi-cashback': [SBI_FUEL, forex(3.5, true, 'Official SBI MITC: 3.5%.')],
  'sbi-elite': [SBI_FUEL, forex(1.99, true, 'Official SBI MITC: Elite 1.99%.')],
  'sbi-simplyclick': [SBI_FUEL, forex(3.5, true, 'Official SBI MITC: 3.5%.')],
  'sbi-prime': [SBI_FUEL, forex(1.99, true, 'Official SBI MITC: Prime 1.99%.')],

  // --- Amex: fuel + forex (no rent surcharge; earns MR on rent) -------------
  'amex-platinum-travel': [AMEX_FUEL, forex(3.5, true, 'Confirmed Jul-2026 (cardinsider): all Amex India cards 3.5% forex.')],
  'amex-mrcc': [{ kind: 'fuel', category: 'fuel', percent: 0, txnMax: 5000, thresholdBasis: 'per-transaction', applies: 'full', plusGst: false, verified: false, notes: '0% fuel convenience fee at HPCL for txns < ₹5,000 (secondary); standard 1% may apply elsewhere.' }, forex(3.5, true, 'Confirmed Jul-2026: Amex India 3.5% forex.')],
  'amex-platinum': [AMEX_FUEL, forex(3.5, true, 'Confirmed Jul-2026: Amex India 3.5% forex.')],
  'amex-smartearn': [AMEX_FUEL, forex(3.5, true, 'Confirmed Jul-2026: Amex India 3.5% forex.')],

  // --- Standard Chartered: fuel + forex (rent is bank-wide) -----------------
  'sc-ultimate': [{ kind: 'fuel', category: 'fuel', percent: 1, waiverCapPerCycle: 1000, thresholdBasis: 'per-transaction', applies: 'full', plusGst: true, verified: false, notes: 'SC Ultimate 1% fuel-surcharge waiver, cap ₹1,000/mo (secondary).' }, forex(2, true, 'Official SC page: Ultimate 2% forex (eff 25-Aug-2024).', '2024-08-25')],
  'sc-smart': [{ kind: 'fuel', category: 'fuel', percent: 1, waiverCapPerCycle: 1000, thresholdBasis: 'per-transaction', applies: 'full', plusGst: true, verified: false, notes: 'SC Smart 1% fuel-surcharge waiver (₹10 or 1%, whichever higher; secondary).' }, forex(3.5, true, 'Confirmed Jul-2026: SC standard 3.5% forex.')],
  'sc-easemytrip': [{ kind: 'fuel', category: 'fuel', percent: 1, thresholdBasis: 'per-transaction', applies: 'full', plusGst: true, verified: false, notes: 'SC EaseMyTrip: 1% fuel surcharge, no waiver documented (secondary).' }, forex(3.5, true, 'Confirmed Jul-2026 (cardinsider): SC EaseMyTrip 3.5% forex.')],

  // --- HSBC: fuel + forex (rent + wallet are bank-wide) ---------------------
  'hsbc-travelone': [fuelWaiver(250, { notes: 'HSBC TravelOne 1% fuel-surcharge waiver, cap ₹250/mo (secondary).' }), forex(3.5, true, 'Confirmed Jul-2026: TravelOne base forex 3.5% (the "low"/zero figure was a promo cashback, not a 1.5% base — discrepancy resolved).')],
  'hsbc-premier': [{ kind: 'fuel', category: 'fuel', percent: 1, txnMin: 400, txnMax: 4000, thresholdBasis: 'per-transaction', applies: 'full', plusGst: true, verified: false, notes: 'HSBC Premier: 1% fuel-surcharge waiver on ₹400–4,000 txns; per-cycle cap not published (secondary).' }, forex(0.99, true, 'Official hsbc.co.in international page: Premier 0.99%.')],
  'hsbc-live-plus': [fuelWaiver(250, { effectiveFrom: '2026-07-26', waiverPeriod: 'quarter', notes: 'Live+ post-26-Jul-2026: contactless fuel cashback, cap ~₹250/quarter; standard 1% surcharge otherwise (secondary).' }), forex(1.99, true, 'Confirmed Jul-2026: Live+ forex 1.99% (reduced from 3.5%). Effective date ~26-Jul-2026 unconfirmed (a 13-Jul-2026 review already quoted 1.99%).', '2026-07-26')],

  // --- HDFC: utility (₹50k personal & BizBlack) + fuel (per-txn + waiver) + forex
  'hdfc-infinia': [HDFC_UTIL_50K, ...hdfcFuel(15000, 1000), forex(2, true, 'Official HDFC MITC v4.4 (Jul-2026): Infinia FCY 2%.')],
  'hdfc-diners-black': [HDFC_UTIL_50K, ...hdfcFuel(15000, 1000), forex(2, true, 'Confirmed Jul-2026 (cardinsider forex page): HDFC Diners Black 2%.')],
  'hdfc-bizblack': [{ kind: 'utilities', category: 'utilities', percent: 1, threshold: 50000, thresholdBasis: 'monthly', applies: 'full', perTxnCap: 4999, plusGst: true, effectiveFrom: '2025-07-01', verified: true, notes: 'User verification 2025-07-01: 1% on monthly utility > ₹50,000, cap ₹4,999 (corrects the earlier secondary ₹75,000 assumption).' }, { kind: 'fuel', category: 'fuel', percent: 1, threshold: 15000, thresholdBasis: 'per-transaction', applies: 'full', perTxnCap: 4999, plusGst: true, effectiveFrom: '2025-07-01', verified: true, notes: 'User verification 2025-07-01: 1% on a single fuel txn > ₹15,000, cap ₹4,999.' }, forex(2, true, 'Confirmed Jul-2026 (cardinsider forex page): HDFC premium/business 2%.')],
  'hdfc-regalia-gold': [HDFC_UTIL_50K, ...hdfcFuel(15000, 500), forex(2, true, 'Official HDFC MITC v4.4: Regalia Gold FCY 2%; DCC markup 1.75% eff 15-May-2026 (separate from FCY).', '2026-05-15'), dcc(1.75, true, 'Official HDFC MITC v4.4: Regalia Gold DCC markup 1.75% (eff 15-May-2026), separate from the 2% FCY/forex markup.', '2026-05-15')],
  'hdfc-millennia': [HDFC_UTIL_50K, ...hdfcFuel(15000, 250), forex(3.5, true, 'Confirmed Jul-2026 (cardinsider forex page): non-premium HDFC 3.5%.')],
  'hdfc-marriott': [HDFC_UTIL_50K, ...hdfcFuel(15000), forex(3.5, true, 'Confirmed Jul-2026 (cardinsider forex page): co-brand 3.5%.')],
  'hdfc-neu-infinity': [HDFC_UTIL_50K, ...hdfcFuel(15000, 250), forex(2, true, 'Confirmed Jul-2026 (cardinsider/search): Tata Neu Infinity 2%.')],
  'hdfc-neu-plus': [HDFC_UTIL_50K, ...hdfcFuel(15000), forex(3.5, true, 'Confirmed Jul-2026 (cardinsider forex page): non-premium HDFC 3.5%.')],
  'hdfc-swiggy': [HDFC_UTIL_50K, ...hdfcFuel(15000), forex(3.5, true, 'Confirmed Jul-2026 (cardinsider forex page): Swiggy HDFC 3.5%.')],

  // --- IndusInd: fuel (tier threshold) + forex (rent/util/edu/wallet/transport bank-wide)
  'indusind-qatar-avios': [indusindFuel(50000), forex(3.5, true, 'Confirmed Jul-2026 (cardexpert/cardinsider): Avios 3.5% forex; 1.5% at the preferred destination.')],
  'indusind-legend': [indusindFuel(30000), forex(1.8, true, 'Confirmed Jul-2026 (cardinsider/wise): Legend 1.8% forex.')],
  'indusind-eazydiner': [indusindFuel(30000), forex(3.5, true, 'Confirmed Jul-2026: IndusInd standard 3.5% forex.')],

  // --- AU: fuel + forex only. Rent/utility surcharge unconfirmed (official PDF binary) — omitted.
  'au-ixigo': [fuelWaiver(250, { txnMin: 400, txnMax: 5000, verified: true, notes: 'Confirmed Jul-2026: AU ixigo 1% fuel waiver ₹400–5,000, cap ₹250/cycle.' }), forex(0, true, 'Official AU: ixigo 0% forex.')],
  'au-zenith': [fuelWaiver(250, { txnMin: 400, txnMax: 5000, notes: 'AU Zenith 1% fuel waiver, cap ~₹250/cycle (community; Zenith+ higher).' }), forex(1.99, true, 'Confirmed Jul-2026 (cardinsider/paisabazaar): Zenith 1.99% forex (Zenith+ 0.99%).')],
  'au-zenith-plus': [fuelWaiver(1000, { txnMin: 400, txnMax: 5000, notes: 'AU Zenith+ 1% fuel waiver, cap ₹1,000/cycle (Gemini audit mid-2026 — higher than base Zenith ₹250).' }), forex(0.99, true, 'Confirmed Jul-2026 (cardinsider/paisabazaar): Zenith+ 0.99% forex.')],
  'au-lit': [{ kind: 'fuel', category: 'fuel', percent: 1, thresholdBasis: 'per-transaction', applies: 'full', plusGst: true, verified: false, notes: 'AU LIT: no fuel-surcharge waiver; standard 1% applies (secondary).' }, forex(3.5, true, 'Confirmed Jul-2026: AU standard ~3.5% forex.')],

  // --- IDFC FIRST: Wealth/Mayura carry rent/util/edu; Vistara is exempt (winding down)
  'idfc-vistara': [fuelWaiver(200, { txnMin: 200, txnMax: 5000, notes: 'IDFC standard fuel waiver ₹200–5,000, cap ₹200/cycle (secondary). Club Vistara winding down 30-Sep-2026; EXEMPT from rent/utility/education fees.' }), forex(3.5, false, 'Vistara 3.5% forex assumed (secondary, low).')],
  'idfc-wealth': [IDFC_RENT, IDFC_UTILITY, IDFC_EDU, fuelWaiver(300, { txnMin: 200, txnMax: 5000, notes: 'IDFC Wealth fuel waiver ₹200–5,000, cap ₹300/cycle (secondary).' }), { kind: 'fuel', category: 'fuel', percent: 1, threshold: 30000, thresholdBasis: 'monthly', applies: 'above-threshold', plusGst: true, verified: false, notes: 'Secondary. Also 1% on cumulative fuel above ₹30,000/cycle.' }, forex(1.5, true, 'Official IDFC Wealth page: 1.5% forex.')],
  'idfc-mayura': [IDFC_RENT, IDFC_UTILITY, IDFC_EDU, fuelWaiver(300, { txnMin: 200, txnMax: 5000, notes: 'IDFC Mayura fuel waiver ₹200–5,000, cap ₹300/cycle (secondary).' }), forex(0, true, 'Official IDFC: Mayura 0% forex.')],

  // --- BoB: utility/wallet/fuel + forex. Rent/education earn nothing; no surcharge confirmed.
  'bob-eterna': [{ kind: 'utilities', category: 'utilities', percent: 1, threshold: 50000, thresholdBasis: 'monthly', applies: 'above-threshold', plusGst: true, verified: true, notes: 'Confirmed Jul-2026 (cardinsider/paisabazaar): 1% on utility above ₹50,000/mo.' }, BOB_WALLET, fuelWaiver(250, { txnMin: 400, txnMax: 5000, notes: 'BoB Eterna fuel waiver ₹400–5,000, cap ₹250/cycle (secondary).' }), forex(2, true, 'Confirmed Jul-2026 (cardinsider): Eterna 2% forex.')],
  'bob-premier': [{ kind: 'utilities', category: 'utilities', percent: 1, threshold: 50000, thresholdBasis: 'monthly', applies: 'above-threshold', plusGst: true, verified: true, notes: 'Confirmed Jul-2026 (cardinsider): 1% on utility above ₹50,000/mo (same as Eterna).' }, BOB_WALLET, fuelWaiver(250, { txnMin: 400, txnMax: 5000, notes: 'BoB Premier fuel waiver ₹400–5,000, cap ₹250/mo (secondary).' }), forex(3.5, true, 'Confirmed Jul-2026 (cardinsider): Premier 3.5% forex.')],
  'bob-etihad': [fuelWaiver(250, { txnMin: 500, txnMax: 5000, notes: 'BoB Etihad Premium fuel waiver ₹500–5,000, cap ₹250/cycle (secondary).' }), forex(0, true, 'Confirmed Jul-2026 (cardinsider): Etihad Guest Premium 0% forex.')],
  'bob-etihad-standard': [fuelWaiver(250, { txnMin: 500, txnMax: 5000, notes: 'BoB Etihad Standard fuel waiver ₹500–5,000, cap ₹250/cycle (secondary).' }), forex(1, false, 'Gemini audit mid-2026: reduced 1% forex (a key Standard-card feature; corrects the earlier 3.5% assumption).')],

  // --- New banks (Jul-2026 onboarding; community unless noted) ---------------
  'kotak-zen-signature': [fuelWaiver(3500, { txnMin: 500, txnMax: 4000, waiverPeriod: 'year', notes: 'Kotak Zen 1% fuel waiver ₹500–4,000, cap ₹3,500/year (kotak.bank.in).' }), forex(3.5, false, 'Kotak Zen 3.5% forex (community).')],
  'kotak-white-reserve': [fuelWaiver(4500, { txnMin: 400, txnMax: 7500, waiverPeriod: 'year', notes: 'White Reserve 1% fuel waiver ₹400–7,500, cap ₹4,500/year (cardinsider).' }), forex(2, false, 'White Reserve 2% forex (cardinsider).')],
  'kotak-league-platinum': [fuelWaiver(3500, { txnMin: 500, txnMax: 4000, waiverPeriod: 'year', notes: 'League Platinum 1% fuel waiver ₹500–4,000, cap ₹3,500/year (kotak.bank.in).' }), forex(3.5, false, 'League Platinum forex unconfirmed (assumed 3.5%).')],
  'kotak-indianoil': [fuelWaiver(100, { txnMin: 100, txnMax: 5000, notes: 'IndianOil Kotak 1% fuel waiver at IndianOil ₹100–5,000, cap ₹100/cycle (kotak.bank.in).' }), forex(3.5, false, 'IndianOil Kotak 3.5% forex (community).')],
  'federal-celesta': [forex(2, false, 'Federal Celesta 2% forex (cardinsider); 1% fuel surcharge waived, no cap published.')],
  'federal-imperio': [forex(3.5, false, 'Federal Imperio 3.5% forex (cardinsider); 1% fuel surcharge waived.')],
  'federal-signet': [fuelWaiver(150, { txnMin: 400, txnMax: 5000, notes: 'Federal Signet 1% fuel waiver ₹400–5,000, cap ₹150/mo (cardinsider).' }), forex(3.5, false, 'Federal Signet 3.5% forex (cardinsider).')],
  'federal-scapia': [forex(0, false, 'Scapia 0% forex (its core USP; but no coins on intl spend).')],
  'rbl-world-safari': [fuelWaiver(250, { txnMin: 500, txnMax: 4000, notes: 'World Safari 1% fuel waiver ₹500–4,000, cap ₹250/mo (rbl.bank.in).' }), forex(0, false, 'World Safari 0% forex (its USP).')],
  'rbl-icon': [fuelWaiver(200, { txnMin: 500, txnMax: 4000, notes: 'RBL Icon 1% fuel waiver ₹500–4,000, cap ₹200/mo (rbl.bank.in).' }), forex(3.5, false, 'RBL Icon 3.5% forex (cardinsider).')],
  'rbl-shoprite': [fuelWaiver(100, { txnMin: 400, txnMax: 5000, notes: 'ShopRite 1% fuel waiver ₹400–5,000, cap ₹100/mo (rbl.bank.in).' }), forex(3.5, false, 'ShopRite 3.5% forex (cardinsider).')],
  'rbl-indianoil-xtra': [fuelWaiver(200, { txnMin: 500, txnMax: 4000, notes: 'IndianOil RBL XTRA 1% fuel waiver, cap ₹200/mo (rbl.bank.in).' }), forex(3.5, false, 'IndianOil RBL XTRA 3.5% forex (community).')],
  'sbi-bpcl-octane': [fuelWaiver(100, { txnMin: 500, txnMax: 4000, notes: 'BPCL Octane 1% fuel-surcharge waiver at BPCL, cap ₹100/mo (community).' }), forex(3.5, false, 'BPCL Octane 3.5% forex (community).')],
  'sbi-aurum': [fuelWaiver(250, { txnMin: 500, txnMax: 4000, notes: 'SBI Aurum 1% fuel waiver ₹500–4,000, cap ₹250/cycle (community).' }), forex(1.99, false, 'SBI Aurum 1.99% forex (official-adjacent; verify).')],
  'sbi-miles-elite': [fuelWaiver(250, { txnMin: 500, txnMax: 4000, notes: 'SBI Miles Elite 1% fuel waiver, cap ₹250/cycle (community).' }), forex(1.99, false, 'Miles Elite 1.99% forex (community).')],
  'sbi-miles-prime': [fuelWaiver(250, { txnMin: 500, txnMax: 4000, notes: 'SBI Miles Prime 1% fuel waiver, cap ₹250/cycle (community).' }), forex(2.5, false, 'Miles Prime 2.5% forex (community).')],
  'equitas-tiga': [fuelWaiver(3000, { txnMin: 500, txnMax: 3000, notes: 'Equitas Tiga 1% fuel waiver ₹500–3,000, cap ₹3,000/cycle (cardinsider).' }), forex(3.4, false, 'Equitas Tiga 3.4% forex (cardinsider).')],
  'equitas-selfe': [fuelWaiver(250, { txnMin: 500, txnMax: 3000, notes: 'Equitas Selfe 1% fuel waiver ₹500–3,000, cap ₹250/mo (cardmaven).' }), forex(3.5, false, 'Selfe forex 3.5% at Blue → 0% at Diamond tier (community).')],
  'equitas-powermiles': [fuelWaiver(450, { txnMin: 500, txnMax: 3000, notes: 'Equitas PowerMiles 1% fuel waiver ₹500–3,000, cap ₹450/cycle (cardmaven).' }), forex(2, false, 'PowerMiles 2% forex, net 0% at Diamond via 90-day refund (community).')],

  // --- Tier-1 (Jul-2026) -----------------------------------------------------
  'yes-marquee': [fuelWaiver(1000, { txnMin: 400, txnMax: 5000, notes: 'YES Marquee 1% fuel waiver ₹400–5,000, cap ₹1,000/cycle (cardinsider).' }), forex(1, false, 'YES Marquee 1% forex (community; some sources 2%).')],
  'yes-reserv': [fuelWaiver(500, { txnMin: 400, txnMax: 5000, notes: 'YES RESERV 1% fuel waiver ₹400–5,000, cap ₹500/cycle (cardmaven).' }), forex(1.75, false, 'YES RESERV 1.75% forex (community).')],
  'yes-pop-club': [forex(3.4, false, 'POP-CLUB 3.4% forex (cardinsider); 1% fuel surcharge on txns > ₹10k, waiver up to ₹5k/mo.')],
  'yes-byoc': [forex(3.5, false, 'YES BYOC 3.5% forex (cardinsider); 1% fuel-surcharge waiver ₹400–5,000.')],
  'onecard': [fuelWaiver(400, { txnMin: 400, txnMax: 5000, notes: 'OneCard 1% fuel-surcharge waiver, cap ₹400/mo (getonecard.app).' }), forex(1, false, 'OneCard 1% forex (OFFICIAL getonecard.app).')],
  'slice': [
    { kind: 'fuel', category: 'fuel', percent: 2, threshold: 25000, thresholdBasis: 'monthly', applies: 'above-threshold', plusGst: true, verified: false, notes: 'Slice: 2% (min ₹10) on fuel > ₹25k/cycle (community).' },
    { kind: 'utilities', category: 'utilities', percent: 1, threshold: 25000, thresholdBasis: 'monthly', applies: 'above-threshold', plusGst: true, verified: false, notes: 'Slice: 1% on utilities > ₹25k/cycle (community).' },
    { kind: 'rent', category: 'rent', mccs: ['6513'], percent: 1, threshold: 10000, thresholdBasis: 'monthly', applies: 'above-threshold', plusGst: true, verified: false, notes: 'Slice: 1% on rent > ₹10k/cycle (community).' },
    forex(0, false, 'Slice 0% forex (community; MITC 403).'),
  ],
  'idbi-royale-signature': [fuelWaiver(500, { txnMin: 400, txnMax: 5000, notes: 'IDBI 1% fuel waiver ₹400–5,000, cap ₹500/mo (idbi.bank.in).' }), forex(3.5, false, 'IDBI 3.5% forex.')],
  'idbi-euphoria-world': [fuelWaiver(500, { txnMin: 400, txnMax: 5000, notes: 'IDBI 1% fuel waiver ₹400–5,000, cap ₹500/mo (idbi.bank.in).' }), forex(3.5, false, 'IDBI 3.5% forex.')],
  'idbi-winnings-select': [fuelWaiver(400, { txnMin: 400, txnMax: 4000, notes: 'IDBI Winnings 1% fuel waiver ₹400–4,000, cap ₹400/mo (idbi.bank.in).' }), forex(3.5, false, 'IDBI 3.5% forex.')],
  'idbi-aspire-platinum': [fuelWaiver(300, { txnMin: 400, txnMax: 4000, notes: 'IDBI Aspire 1% fuel waiver ₹400–4,000, cap ₹300/mo (idbi.bank.in).' }), forex(3.5, false, 'IDBI 3.5% forex.')],
  'idbi-imperium-platinum': [fuelWaiver(300, { txnMin: 400, txnMax: 4000, notes: 'IDBI Imperium 1% fuel waiver ₹400–4,000, cap ₹300/mo (idbi.bank.in).' }), forex(3.5, false, 'IDBI 3.5% forex.')],

  // --- Tier-2 PSU ---
  'pnb-rupay-select': [fuelWaiver(350, { txnMin: 500, txnMax: 4000, notes: 'PNB 1% fuel waiver ₹500–4,000, cap ₹350/cycle (PNB SOFC).' }), forex(3.5, false, 'PNB 3.5% forex (OFFICIAL SOFC).')],
  'pnb-visa-signature': [fuelWaiver(350, { txnMin: 500, txnMax: 4000, notes: 'PNB 1% fuel waiver, cap ₹350/cycle (PNB SOFC).' }), forex(3.5, false, 'PNB 3.5% forex (OFFICIAL SOFC).')],
  'pnb-luxura': [fuelWaiver(350, { txnMin: 500, txnMax: 4000, notes: 'PNB Luxura 1% fuel waiver, cap ₹350/cycle (PNB SOFC).' }), forex(0, false, 'PNB Luxura NIL forex (OFFICIAL SOFC).')],
  'canara-rupay-select': [fuelWaiver(100, { txnMin: 400, txnMax: 5000, notes: 'Canara 1% fuel reimbursed cap ₹100/mo (needs ≥₹2,500/mo retail).' }), forex(3, false, 'Canara ~3% forex (official "up to 3%").')],
  'canara-mastercard-world': [fuelWaiver(100, { txnMin: 400, txnMax: 5000, notes: 'Canara 1% fuel reimbursed cap ₹100/mo.' }), forex(3, false, 'Canara 3% forex.')],
  'canara-visa-signature': [fuelWaiver(100, { txnMin: 400, txnMax: 5000, notes: 'Canara 1% fuel reimbursed cap ₹100/mo.' }), forex(3, false, 'Canara ~3% forex.')],
  'union-uni-carbon': [fuelWaiver(100, { txnMin: 200, txnMax: 5000, notes: 'Union HPCL 1% fuel waiver ≥₹200 at HPCL, cap ₹100/cycle (official).' }), forex(3, false, 'Union 3% forex (OFFICIAL fee schedule).')],
  'union-rupay-select': [fuelWaiver(100, { txnMin: 400, txnMax: 5000, notes: 'Union 1% fuel reimbursed cap ₹100/mo.' }), forex(3, false, 'Union 3% forex (OFFICIAL).')],
  'union-visa-signature': [fuelWaiver(100, { txnMin: 400, txnMax: 5000, notes: 'Union 1% fuel reimbursed cap ₹100/mo.' }), forex(3, false, 'Union 3% forex (OFFICIAL).')],
  'boi-rupay-select': [forex(3, false, 'BOI ~3% forex (community; some sources 3.5%). Fuel waiver not documented.')],
  'indian-bank-rupay-select': [forex(3, false, 'Indian Bank 3% forex (community). Fuel waiver undocumented.')],
  'bom-rupay-platinum': [fuelWaiver(100, { txnMin: 500, txnMax: 4000, notes: 'BoM 1% fuel waiver ₹500–4,000 (community; cap est).' }), forex(3.5, false, 'BoM forex ~3.5% (estimate — undocumented).')],

  // --- Tier-3 ---
  'dbs-vantage': [fuelWaiver(200, { txnMin: 500, txnMax: 5000, notes: 'DBS Vantage 1% fuel waiver, cap ₹200/cycle (community).' }), forex(1.75, false, 'DBS Vantage 1.75% forex (0% on Singapore) — community.')],
  'dbs-spark': [fuelWaiver(150, { txnMin: 500, txnMax: 5000, notes: 'DBS Spark 1% fuel waiver ₹500–5,000, cap ₹150/mo (Spark10; community).' }), forex(3.5, false, 'DBS Spark 3.5% forex (community).')],
  'kvb-honour': [fuelWaiver(200, { txnMin: 500, txnMax: 4000, notes: 'KVB Honour 1% fuel waiver ₹500–4,000, cap ₹200/cycle (KVB).' }), forex(3.5, false, 'KVB 3.5% forex.')],
  'jupiter-edge': [fuelWaiver(100, { txnMin: 400, txnMax: 3000, notes: 'Jupiter Edge 1% fuel waiver ₹400–3,000, cap ₹100/mo (official KFS).' }), forex(3.5, false, 'Jupiter Edge 3.5% forex (OFFICIAL KFS).')],
  'jupiter-edge-plus': [fuelWaiver(100, { txnMin: 400, txnMax: 3000, notes: 'Jupiter Edge+ 1% fuel waiver ₹400–3,000, cap ₹100/mo (official KFS).' }), forex(3.5, false, 'Jupiter Edge+ 3.5% forex (OFFICIAL KFS).')],
}

// Pure composition — bank-wide THEN card-specific surcharges for one card.
// Defined here (not inline in seed-kb.ts) so the seed generator and its unit
// test exercise the EXACT same merge. Appends in a stable order; there is no
// dedup/override policy yet (no duplicate `kind`s exist today, and the two
// deliberate fuel entries — a high-value fee + a small-txn waiver — must both
// survive), so introduce identity+override semantics before adding overrides.
export function surchargesFor(bankSlug: string, cardSlug: string): SurchargeInput[] {
  return withDerivedDcc([...(BANK_SURCHARGES[bankSlug] ?? []), ...(CARD_SURCHARGES[cardSlug] ?? [])])
}

// A card's DCC markup (charged when a foreign merchant/site bills in INR) defaults
// to its forex markup — issuers apply the same cross-currency markup whether the
// txn is billed in foreign currency or INR. So for every card that has a forex
// ('international') surcharge but no EXPLICIT 'dcc', synthesize a DCC mirroring it
// (verified:false, since the DCC-specific figure isn't separately published).
// Cards with an authoritative explicit 'dcc' (Axis Magnus/Burgundy/Privilege,
// HDFC Regalia Gold — where DCC ≠ forex) keep their own value untouched.
function withDerivedDcc(surcharges: SurchargeInput[]): SurchargeInput[] {
  if (surcharges.some((s) => s.kind === 'dcc')) return surcharges
  const fx = surcharges.find((s) => s.kind === 'international')
  if (!fx || fx.percent === undefined) return surcharges
  return [
    ...surcharges,
    {
      kind: 'dcc',
      percent: fx.percent,
      thresholdBasis: 'per-transaction',
      applies: 'full',
      plusGst: true,
      verified: false,
      ...(fx.effectiveFrom ? { effectiveFrom: fx.effectiveFrom } : {}),
      notes: `Assumed DCC markup = forex markup (${fx.percent}%): the issuer applies its cross-currency markup on INR-billed international/DCC txns too. No DCC-specific figure published — verify.`,
    },
  ]
}

// Guards against a typo silently orphaning a whole surcharge set: every map key
// MUST resolve to a real bank/card slug. Returns the offending keys (empty = ok).
export function unknownSurchargeKeys(bankSlugs: Set<string>, cardSlugs: Set<string>): string[] {
  const bad: string[] = []
  for (const k of Object.keys(BANK_SURCHARGES)) if (!bankSlugs.has(k)) bad.push(`BANK_SURCHARGES["${k}"]`)
  for (const k of Object.keys(CARD_SURCHARGES)) if (!cardSlugs.has(k)) bad.push(`CARD_SURCHARGES["${k}"]`)
  return bad
}
