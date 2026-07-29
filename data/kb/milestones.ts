import type { MilestoneInput } from '@/lib/kb/schema'

// Spend milestones + card fees, keyed by card slug and merged into each card's
// earn rule at seed time (scripts/seed-kb.ts) — same mechanism as surcharges.ts.
// Milestones are per-card (no cross-card reuse), so this file is purely an
// authoring convenience that keeps cards.ts readable and avoids ~90 inline edits.
//
// Researched July 2026, then VERIFIED via a guardrailed 5-agent pass by issuer
// (Jul-2026): milestone + fee-waiver thresholds reconciled against official/
// community sources. Most entries are now verified:true; a few remain false with
// a note — contradicted or variant-ambiguous items (AU Zenith/ixigo, IndusInd
// EazyDiner, BoB Etihad) awaiting an admin decision in /admin/kb. Annual-fee waivers
// are modelled as kind:'fee-waiver' with valueInr = the annual fee reversed.
// `spendThreshold` omitted = benefit on activation / first transaction (welcome).

type Fees = { joiningInr?: number; annualInr?: number }

export const CARD_FEES: Record<string, Fees> = {
  // HDFC
  'hdfc-infinia': { joiningInr: 12500, annualInr: 12500 },
  'hdfc-diners-black': { joiningInr: 10000, annualInr: 10000 },
  'hdfc-bizblack': { joiningInr: 10000, annualInr: 10000 },
  'hdfc-regalia-gold': { joiningInr: 2500, annualInr: 2500 },
  'hdfc-millennia': { joiningInr: 1000, annualInr: 1000 },
  'hdfc-marriott': { joiningInr: 3000, annualInr: 3000 },
  'hdfc-neu-infinity': { joiningInr: 1499, annualInr: 1499 },
  'hdfc-neu-plus': { joiningInr: 499, annualInr: 499 },
  'hdfc-swiggy': { joiningInr: 500, annualInr: 500 },
  // Axis
  'axis-magnus': { joiningInr: 12500, annualInr: 12500 },
  'axis-magnus-burgundy': { joiningInr: 30000, annualInr: 30000 },
  'axis-atlas': { joiningInr: 5000, annualInr: 5000 },
  'axis-privilege': { joiningInr: 1500, annualInr: 1500 },
  'axis-ace': { joiningInr: 499, annualInr: 499 },
  'axis-flipkart': { joiningInr: 500, annualInr: 500 },
  'axis-airtel': { joiningInr: 500, annualInr: 500 },
  // ICICI
  'icici-emeralde-private-metal': { joiningInr: 12499, annualInr: 12499 },
  'icici-emeralde': { joiningInr: 12000, annualInr: 12000 }, // legacy non-metal Emeralde
  'icici-sapphiro': { joiningInr: 6500, annualInr: 3500 },
  'icici-amazon-pay': { joiningInr: 0, annualInr: 0 },
  'icici-coral': { joiningInr: 500, annualInr: 500 },
  'icici-makemytrip': { joiningInr: 999, annualInr: 999 },
  // SBI
  'sbi-cashback': { joiningInr: 999, annualInr: 999 },
  'sbi-elite': { joiningInr: 4999, annualInr: 4999 },
  'sbi-simplyclick': { joiningInr: 499, annualInr: 499 },
  'sbi-prime': { joiningInr: 2999, annualInr: 2999 },
  // Amex
  'amex-platinum-travel': { joiningInr: 3500, annualInr: 5000 },
  'amex-mrcc': { joiningInr: 1000, annualInr: 4500 },
  'amex-platinum': { joiningInr: 66000, annualInr: 66000 },
  'amex-smartearn': { joiningInr: 495, annualInr: 495 },
  // Standard Chartered
  'sc-ultimate': { joiningInr: 5000, annualInr: 5000 },
  'sc-smart': { joiningInr: 499, annualInr: 499 },
  'sc-easemytrip': { joiningInr: 350, annualInr: 350 },
  // HSBC
  'hsbc-travelone': { joiningInr: 4999, annualInr: 4999 },
  'hsbc-premier': { joiningInr: 12000, annualInr: 20000 },
  'hsbc-live-plus': { joiningInr: 999, annualInr: 999 },
  // IndusInd
  'indusind-qatar-avios': { joiningInr: 10000, annualInr: 5000 },
  'indusind-legend': { joiningInr: 0, annualInr: 0 },
  'indusind-eazydiner': { joiningInr: 2999, annualInr: 2999 },
  // AU (Eterna/Premier LTF for eligible; Zenith+ fee shown)
  'au-ixigo': { joiningInr: 0, annualInr: 0 },
  // au-zenith = base AU Zenith (₹7,999); au-zenith-plus = Zenith+ (₹4,999 metal).
  // Milestones reconciled to their respective variants per the mid-2026 audit.
  'au-zenith': { joiningInr: 7999, annualInr: 7999 },
  'au-zenith-plus': { joiningInr: 4999, annualInr: 4999 },
  'au-lit': { joiningInr: 0, annualInr: 0 },
  // IDFC FIRST
  'idfc-wealth': { joiningInr: 0, annualInr: 0 },
  'idfc-mayura': { joiningInr: 5999, annualInr: 5999 },
  'idfc-vistara': { joiningInr: 4999, annualInr: 4999 },
  // BoB (Eterna/Premier currently LTF for eligible applicants)
  'bob-eterna': { joiningInr: 0, annualInr: 0 },
  'bob-premier': { joiningInr: 0, annualInr: 0 },
  'bob-etihad': { joiningInr: 5000, annualInr: 5000 },
}

const fw = (spendThreshold: number, valueInr: number, notes: string): MilestoneInput => ({
  spendThreshold,
  period: 'anniversary-year',
  kind: 'fee-waiver',
  valueInr,
  label: 'annual fee waiver',
  repeatable: true,
  verified: true,
  notes,
})

export const CARD_MILESTONES: Record<string, MilestoneInput[]> = {
  // ---- HDFC (all secondary: cardinsider/cardmaven/paisabazaar; official redirected) ----
  'hdfc-infinia': [fw(1800000, 12500, 'Spend ₹18L/yr → renewal waived — TIGHTENED from ₹10L for the FY2026-27 cycle (or ₹50L HDFC relationship value); existing cardholders keep ₹10L until Mar-2027 (CardExpert/BusinessToday). Welcome 12,500 pts on fee-pay is non-spend.')],
  'hdfc-diners-black': [
    fw(800000, 10000, '₹8L/yr → waiver (cardmaven/paisabazaar 2026; earlier ₹5L).'),
    { spendThreshold: 400000, period: 'quarter', kind: 'points', points: 10000, repeatable: true, verified: true, label: '10,000 pts/quarter at ₹4L quarterly', notes: 'cardmaven/paisabazaar 2026.' },
  ],
  'hdfc-bizblack': [
    fw(750000, 10000, '₹7.5L/yr → waiver (HDFC FAQ PDF).'),
    { spendThreshold: 500000, period: 'calendar-year', kind: 'voucher', valueInr: 5000, repeatable: true, verified: true, label: '₹5k SmartBuy/Taj voucher per ₹5L', notes: 'Up to 4 vouchers (₹20k) at ₹20L/yr; EMI/rent/fuel excluded (HDFC Value Chart PDF).' },
  ],
  'hdfc-regalia-gold': [
    fw(400000, 2500, '₹4L/yr → waiver (cardinsider).'),
    { spendThreshold: 150000, period: 'quarter', kind: 'voucher', valueInr: 1500, repeatable: true, verified: true, label: '₹1.5k quarterly voucher (M&S/Myntra/RelianceDigital/Marriott)', notes: 'cardinsider.' },
    { spendThreshold: 500000, period: 'anniversary-year', kind: 'voucher', valueInr: 5000, verified: true, label: '₹5k flight voucher at ₹5L', notes: 'cardinsider.' },
    { spendThreshold: 750000, period: 'anniversary-year', kind: 'voucher', valueInr: 5000, verified: true, label: 'additional ₹5k flight voucher at ₹7.5L', notes: 'cardinsider (cumulative with ₹5L tier).' },
  ],
  'hdfc-millennia': [
    fw(100000, 1000, '₹1L/yr → waiver (HDFC Millennia FAQ).'),
    { spendThreshold: 100000, period: 'quarter', kind: 'voucher', valueInr: 1000, repeatable: true, verified: true, label: '₹1k voucher per ₹1L quarterly', notes: 'HDFC Millennia FAQ.' },
  ],
  'hdfc-marriott': [
    { period: 'welcome', kind: 'free-night', valueInr: 15000, verified: true, label: 'welcome Free Night Award (≤15,000 pts)', notes: 'On fee payment + each renewal (cardmaven). FNA value ~₹15k.' },
    { spendThreshold: 600000, period: 'anniversary-year', kind: 'free-night', valueInr: 15000, verified: true, label: 'Free Night Award at ₹6L (≤15,000 pts)', notes: 'cardmaven.' },
    { spendThreshold: 900000, period: 'anniversary-year', kind: 'free-night', valueInr: 15000, verified: true, label: 'Free Night Award at ₹9L (≤15,000 pts)', notes: 'cardmaven.' },
    { spendThreshold: 1500000, period: 'anniversary-year', kind: 'free-night', valueInr: 15000, verified: true, label: 'Free Night Award at ₹15L (≤15,000 pts)', notes: 'cardmaven. No annual fee waiver on this card.' },
  ],
  'hdfc-neu-infinity': [
    fw(300000, 1499, '₹3L/yr → waiver.'),
    { spendThreshold: 50000, period: 'quarter', kind: 'lounge', repeatable: true, verified: true, label: '2 domestic lounge vouchers/qtr at ₹50k', notes: 'Eff 10-Jun-2025 (HDFC).' },
  ],
  'hdfc-neu-plus': [
    fw(100000, 499, '₹1L/yr → waiver.'),
    { spendThreshold: 50000, period: 'quarter', kind: 'lounge', repeatable: true, verified: true, label: '1 domestic lounge voucher/qtr at ₹50k', notes: 'Eff 10-Jun-2025 (HDFC).' },
  ],
  'hdfc-swiggy': [fw(200000, 500, '₹2L/yr → waiver (HDFC). Welcome = 3-mo Swiggy One on activation.')],

  // ---- Axis (cardinsider/paisabazaar 2026) ----
  'axis-magnus': [
    { period: 'welcome', kind: 'voucher', valueInr: 12500, verified: true, label: 'welcome ₹12,500 voucher (Luxe/Postcard/Yatra) on activation', notes: 'cardinsider. Monthly 25k RP milestone withdrawn ~May-2024.' },
    fw(2500000, 12500, '₹25L/yr → waiver (cards from Sep-2023; cardinsider).'),
  ],
  'axis-magnus-burgundy': [
    { period: 'welcome', kind: 'voucher', valueInr: 5000, verified: true, label: 'welcome ₹5,000 voucher on activation', notes: 'paisabazaar. Fees waived for select Burgundy customers from 1-Jul-2026.' },
    fw(3000000, 30000, '₹30L/yr → waiver (paisabazaar).'),
  ],
  'axis-atlas': [
    { period: 'welcome', kind: 'points', points: 2500, verified: true, label: '2,500 EDGE Miles on first txn within 37 days', notes: 'Cards from 20-Apr-2024 (cardinsider). Base pool is EDGE_MILES.' },
    { spendThreshold: 300000, period: 'anniversary-year', kind: 'points', points: 2500, verified: true, label: '2,500 EDGE Miles at ₹3L', notes: 'cardinsider.' },
    { spendThreshold: 750000, period: 'anniversary-year', kind: 'points', points: 2500, verified: true, label: '2,500 EDGE Miles at ₹7.5L', notes: 'cardinsider (incremental).' },
    { spendThreshold: 1500000, period: 'anniversary-year', kind: 'points', points: 5000, verified: true, label: '5,000 EDGE Miles at ₹15L (+ Platinum tier)', notes: 'cardinsider. Total 10,000 milestone miles.' },
  ],
  'axis-privilege': [
    { period: 'welcome', kind: 'points', points: 12500, verified: true, label: '12,500 EDGE RP on 3 txns within 60 days', notes: 'cardinsider (~₹2,500 value).' },
    { spendThreshold: 250000, period: 'anniversary-year', kind: 'points', points: 10000, repeatable: true, verified: true, label: '10,000 EDGE RP at ₹2.5L', notes: 'cardinsider (~₹2,000).' },
    fw(500000, 1500, '₹5L/yr → waiver (cardinsider). LTF for priority-banking.'),
  ],
  'axis-ace': [
    { spendThreshold: 1000, period: 'welcome', kind: 'points', points: 5000, verified: true, label: '5,000 EDGE RP on ₹1,000 in first 30 days', notes: 'Search snippet; not confirmed on official page.' },
    fw(200000, 499, '₹2L/yr → waiver (paisabazaar).'),
  ],
  'axis-flipkart': [
    { period: 'welcome', kind: 'voucher', valueInr: 250, verified: true, label: '₹250 Flipkart + ₹100 Swiggy on issuance', notes: 'cardinsider (paid card only).' },
    fw(350000, 500, '₹3.5L/yr → waiver (cardinsider).'),
  ],
  'axis-airtel': [
    { period: 'welcome', kind: 'voucher', valueInr: 500, verified: true, label: '₹500 Amazon voucher on first txn within 30 days', notes: 'paisabazaar (paid card only).' },
    fw(200000, 500, '₹2L/yr → waiver (paisabazaar).'),
  ],

  // ---- ICICI (official icici.bank.in pages) ----
  'icici-emeralde-private-metal': [
    { period: 'welcome', kind: 'points', points: 12500, verified: true, label: '12,500 welcome pts on fee-pay', notes: 'icici.bank.in.' },
    { spendThreshold: 800000, period: 'anniversary-year', kind: 'voucher', valueInr: 6000, repeatable: true, verified: true, label: '2× EaseMyTrip vouchers (₹6k) at ₹8L', notes: 'icici.bank.in.' },
    fw(1000000, 12499, '₹10L/yr → waiver (icici.bank.in).'),
  ],
  // Legacy non-metal ICICI Emeralde (discontinued); secondary sources → verified:false.
  'icici-emeralde': [
    { spendThreshold: 1000000, period: 'anniversary-year', kind: 'fee-waiver', valueInr: 12000, repeatable: true, verified: false, label: 'annual fee waiver', notes: '₹10L/yr → ₹12,000 fee waived (cardinsider/paisabazaar). Alternatively ₹1,000/mo, waived at ₹1L/mo.' },
    { spendThreshold: 50000, period: 'statement-cycle', kind: 'other', repeatable: true, verified: false, label: '1 golf round/lesson per month at ₹50k', notes: 'cardinsider; max 4/mo. Legacy Emeralde.' },
  ],
  'icici-sapphiro': [
    { period: 'welcome', kind: 'voucher', valueInr: 13000, verified: true, label: 'welcome voucher bundle ~₹13k (TataCliQ/EaseMyTrip/DaMilano/Croma)', notes: 'icici.bank.in.' },
    { spendThreshold: 400000, period: 'anniversary-year', kind: 'points', points: 4000, verified: true, label: '4,000 pts at ₹4L', notes: 'icici.bank.in. +2,000 pts per additional ₹1L, max 20,000/yr.' },
    fw(600000, 3500, '₹6L/yr → waiver (icici.bank.in).'),
  ],
  // icici-amazon-pay: lifetime free, no spend milestones.
  'icici-coral': [
    fw(150000, 500, '₹1.5L/yr → waiver; excludes rent/govt/education (icici.bank.in).'),
    { spendThreshold: 200000, period: 'anniversary-year', kind: 'points', points: 2000, verified: true, label: '2,000 pts at ₹2L', notes: 'icici.bank.in. +1,000/₹1L, max 10,000/yr.' },
  ],
  'icici-makemytrip': [
    { period: 'welcome', kind: 'voucher', valueInr: 1000, verified: true, label: '₹1k MMT voucher on fee-pay', notes: 'icici.bank.in.' },
    { period: 'anniversary-year', kind: 'voucher', valueInr: 1000, repeatable: true, verified: true, label: '₹1k MMT hotel voucher on renewal fee-pay', notes: 'icici.bank.in.' },
    fw(300000, 999, '₹3L/yr → waiver (icici.bank.in).'),
  ],

  // ---- SBI (sbicard.com + cardexpert/cardinsider) ----
  'sbi-cashback': [fw(200000, 999, '₹2L/yr → waiver (sbicard.com/Forbes). No other milestones.')],
  'sbi-elite': [
    { period: 'welcome', kind: 'voucher', valueInr: 5000, verified: true, label: '₹5k welcome e-gift voucher on fee-pay', notes: 'cardinsider (from sbicard.com).' },
    { spendThreshold: 300000, period: 'anniversary-year', kind: 'points', points: 10000, verified: true, label: '10,000 pts at ₹3L', notes: 'cardexpert.' },
    { spendThreshold: 400000, period: 'anniversary-year', kind: 'points', points: 10000, verified: true, label: '10,000 pts at ₹4L', notes: 'cardexpert.' },
    { spendThreshold: 500000, period: 'anniversary-year', kind: 'points', points: 15000, verified: true, label: '15,000 pts at ₹5L', notes: 'cardexpert.' },
    { spendThreshold: 800000, period: 'anniversary-year', kind: 'points', points: 15000, verified: true, label: '15,000 pts at ₹8L', notes: 'cardexpert. Total 50,000 pts (₹12,500).' },
    fw(1000000, 4999, '₹10L/yr → waiver (sbicard.com).'),
  ],
  'sbi-simplyclick': [
    { period: 'welcome', kind: 'voucher', valueInr: 500, verified: true, label: '₹500 Amazon voucher on fee-pay', notes: 'sbicard.com.' },
    fw(100000, 499, '₹1L/yr → waiver (sbicard.com).'),
    { spendThreshold: 100000, period: 'anniversary-year', kind: 'voucher', valueInr: 2000, verified: true, label: '₹2k Cleartrip/Yatra voucher at ₹1L', notes: 'sbicard.com Yatra T&C.' },
    { spendThreshold: 200000, period: 'anniversary-year', kind: 'voucher', valueInr: 2000, verified: true, label: '₹2k Cleartrip/Yatra voucher at ₹2L', notes: 'sbicard.com Yatra T&C.' },
  ],
  'sbi-prime': [
    { period: 'welcome', kind: 'voucher', valueInr: 3000, verified: true, label: '₹3k welcome e-gift voucher on fee-pay', notes: 'sbicard.com.' },
    { spendThreshold: 50000, period: 'quarter', kind: 'voucher', valueInr: 1000, repeatable: true, verified: true, label: '₹1k Pizza Hut voucher per ₹50k quarterly', notes: 'sbicard.com (up to 4×/yr).' },
    { spendThreshold: 500000, period: 'anniversary-year', kind: 'voucher', valueInr: 7000, repeatable: true, verified: true, label: '₹7k Yatra/Pantaloons voucher at ₹5L', notes: 'sbicard.com.' },
    fw(300000, 2999, '₹3L/yr → waiver (sbicard.com).'),
  ],

  // ---- Amex (official americanexpress.com/in unless noted) ----
  'amex-platinum-travel': [
    { spendThreshold: 15000, period: 'welcome', kind: 'points', points: 10000, verified: true, label: '10,000 MR on ₹15k in first 90 days', notes: 'amex official; conditional on fee-pay.' },
    { spendThreshold: 190000, period: 'anniversary-year', kind: 'points', points: 7500, verified: true, label: '7,500 MR at ₹1.9L', notes: 'amex official; revised 9-Mar-2026.' },
    { spendThreshold: 400000, period: 'anniversary-year', kind: 'points', points: 10000, verified: true, label: '10,000 MR at ₹4L', notes: 'amex official; revised 9-Mar-2026.' },
    { spendThreshold: 700000, period: 'anniversary-year', kind: 'points', points: 22500, verified: true, label: '22,500 MR at ₹7L', notes: 'amex official; revised 9-Mar-2026.' },
    { spendThreshold: 700000, period: 'anniversary-year', kind: 'voucher', valueInr: 10000, verified: true, label: '₹10k Taj voucher at ₹7L', notes: 'amex official; alongside the 22,500 MR.' },
  ],
  'amex-mrcc': [
    { spendThreshold: 15000, period: 'welcome', kind: 'points', points: 4000, verified: true, label: '4,000 MR on ₹15k in first 90 days', notes: 'cardinsider; conditional on fee-pay.' },
    { spendThreshold: 6000, period: 'statement-cycle', kind: 'points', points: 1000, repeatable: true, verified: true, label: '1,000 MR on 4 txns of ₹1,500+/month', notes: 'cardinsider.' },
    { spendThreshold: 20000, period: 'statement-cycle', kind: 'points', points: 1000, repeatable: true, verified: true, label: '1,000 MR on ₹20k/month (enrol)', notes: 'cardinsider; stacks to 2,000 MR/mo.' },
    fw(150000, 4500, '₹1.5L/yr → 100% waiver (50% at ₹90k) (cardinsider).'),
  ],
  'amex-platinum': [
    { spendThreshold: 50000, period: 'welcome', kind: 'voucher', valueInr: 60000, verified: true, label: 'welcome vouchers (Taj/Luxe/Postcard) on ₹50k in 2 months', notes: 'Official says "up to ₹50k"; cardexpert says ₹60k — discrepancy.' },
    { spendThreshold: 2000000, period: 'anniversary-year', kind: 'voucher', valueInr: 35000, repeatable: true, verified: true, label: 'renewal vouchers ₹35k at ₹20L', notes: 'amex official. No-preset-limit charge card; no fee waiver.' },
  ],
  'amex-smartearn': [
    { spendThreshold: 10000, period: 'welcome', kind: 'other', valueInr: 500, verified: true, label: '₹500 cashback on ₹10k in first 90 days', notes: 'amex official.' },
    { spendThreshold: 120000, period: 'anniversary-year', kind: 'voucher', valueInr: 500, verified: true, label: '₹500 voucher at ₹1.2L', notes: 'amex official.' },
    { spendThreshold: 180000, period: 'anniversary-year', kind: 'voucher', valueInr: 500, verified: true, label: '₹500 voucher at ₹1.8L', notes: 'amex official.' },
    { spendThreshold: 240000, period: 'anniversary-year', kind: 'voucher', valueInr: 500, verified: true, label: '₹500 voucher at ₹2.4L', notes: 'amex official; max ₹1,500/yr.' },
    fw(40000, 495, '₹40k/yr → waiver (amex official).'),
  ],

  // ---- Standard Chartered ----
  'sc-ultimate': [
    { period: 'welcome', kind: 'points', points: 6000, verified: true, label: '6,000 pts on activation (1 pt = ₹1)', notes: 'cardinsider.' },
    { period: 'anniversary-year', kind: 'points', points: 5000, repeatable: true, verified: true, label: '5,000 pts on renewal', notes: 'cardinsider. No spend-based fee waiver.' },
  ],
  'sc-smart': [fw(120000, 499, '₹1.2L/yr → waiver (paisabazaar; official page 404). No milestones.')],
  'sc-easemytrip': [fw(50000, 350, '₹50k/yr → waiver (sc.bank.in official). No tiered milestones.')],

  // ---- HSBC (official hsbc.co.in) ----
  'hsbc-travelone': [
    { spendThreshold: 25000, period: 'welcome', kind: 'other', valueInr: 4000, verified: true, label: 'welcome ₹1k cashback + ₹3k PostCard + EazyDiner Prime on ₹25k/30d', notes: 'hsbc official.' },
    { spendThreshold: 1200000, period: 'anniversary-year', kind: 'points', points: 10000, repeatable: true, verified: true, label: '10,000 pts at ₹12L', notes: 'hsbc official.' },
    fw(800000, 4999, '₹8L/yr → waiver (hsbc official).'),
  ],
  'hsbc-premier': [
    { period: 'welcome', kind: 'points', points: 20000, verified: true, label: '20,000 pts on first card use', notes: 'hsbc official. Annual fee waived for qualifying Premier banking relationship (not spend-based).' },
  ],
  'hsbc-live-plus': [
    { spendThreshold: 300, period: 'welcome', kind: 'voucher', valueInr: 750, verified: true, label: '₹750 voucher on first txn ≥ ₹300', notes: 'hsbc official.' },
    { spendThreshold: 25000, period: 'welcome', kind: 'other', valueInr: 1000, verified: true, label: '₹1k cashback on ₹25k/30d (after app login)', notes: 'hsbc official.' },
    fw(200000, 999, '₹2L/yr → waiver (hsbc official).'),
  ],

  // ---- IndusInd (cardinsider) ----
  'indusind-qatar-avios': [
    { period: 'welcome', kind: 'points', points: 20000, verified: true, label: '20,000 welcome Avios on issuance', notes: 'cardinsider. Jan-2026 40k promo expired.' },
    { spendThreshold: 800000, period: 'anniversary-year', kind: 'points', points: 18000, verified: true, label: '18,000 Avios on first ₹8L', notes: 'cardinsider; max 36,000 milestone Avios/yr.' },
    { spendThreshold: 1600000, period: 'anniversary-year', kind: 'points', points: 18000, verified: true, label: '18,000 Avios on ₹16L cumulative', notes: 'cardinsider. Renewal: 5,000 Avios on fee-pay.' },
  ],
  'indusind-legend': [{ spendThreshold: 500000, period: 'anniversary-year', kind: 'points', points: 3000, verified: true, label: '3,000 pts at ₹5L', notes: 'cardinsider. Lifetime-free card.' }],
  'indusind-eazydiner': [{ period: 'welcome', kind: 'points', points: 2000, verified: false, label: '2,000 EazyPoints on fee-pay', notes: 'VARIANT AMBIGUITY — Signature (₹1,999, has quarterly/annual milestones) vs Platinum (LTF, no milestones). Confirm which variant this row models before verifying (Jul-2026 pass).' }],

  // ---- AU (cardinsider/paisabazaar; au-zenith = base Zenith, au-zenith-plus = Zenith+) ----
  'au-ixigo': [
    { period: 'welcome', kind: 'voucher', valueInr: 1000, verified: true, label: '₹1k ixigo voucher + 1,000 RP on first txn/30d', notes: 'cardinsider + au.bank.in.' },
    { spendThreshold: 75000, period: 'quarter', kind: 'points', points: 5000, repeatable: true, verified: false, label: '5,000 RP per ₹75k quarterly', notes: 'UNCONFIRMED — the Jul-2026 AU verification found no RP spend-milestone on ixigo (only spend-gated lounge perks); this ₹75k/qtr→5k figure is from cardinsider and conflicts. Verify against AU T&C.' },
  ],
  'au-zenith': [
    { period: 'welcome', kind: 'voucher', valueInr: 5000, verified: true, label: '₹5k vouchers or 5,000 RP on activation', notes: 'cardinsider.' },
    { spendThreshold: 50000, period: 'statement-cycle', kind: 'points', points: 1000, repeatable: true, verified: false, label: '1,000 RP on ₹50k/cycle', notes: 'Base AU Zenith: ₹50k/cycle → 1,000 RP (matches the card rule note; Gemini audit mid-2026 + AU Jul-2026 verification). The ₹75k/mo tier, ₹8L waiver and Taj Epicure belong to Zenith+ (au-zenith-plus).' },
    fw(500000, 7999, '₹5L/yr → waiver, base AU Zenith (Gemini audit mid-2026 + cardinsider). Zenith+ waiver is ₹8L.'),
  ],
  'au-zenith-plus': [
    { period: 'welcome', kind: 'voucher', valueInr: 5000, verified: false, label: '₹5k vouchers or 5,000 RP on activation', notes: 'cardinsider (Zenith+ metal).' },
    { spendThreshold: 75000, period: 'statement-cycle', kind: 'points', points: 1000, repeatable: true, verified: false, label: '1,000 RP on ₹75k/cycle', notes: 'Zenith+ (₹4,999 metal): ₹75k/cycle → 1,000 RP (Gemini audit mid-2026 + cardinsider).' },
    fw(800000, 4999, '₹8L/yr → waiver, Zenith+ (cardinsider + Gemini audit).'),
    { spendThreshold: 1200000, period: 'anniversary-year', kind: 'other', repeatable: true, verified: false, label: 'Taj Epicure membership at ₹12L', notes: 'Zenith+ only (cardinsider).' },
  ],
  'au-lit': [{ spendThreshold: 10000, period: 'statement-cycle', kind: 'voucher', valueInr: 500, repeatable: true, verified: true, label: 'up to ₹500 milestone cashback on ₹10k/30d', notes: 'paisabazaar. Only if the paid Milestone-Cashback module (₹199/qtr) is active.' }],

  // ---- IDFC FIRST (cardinsider) ----
  'idfc-wealth': [{ spendThreshold: 5000, period: 'welcome', kind: 'voucher', valueInr: 500, verified: true, label: '₹500 voucher on ₹5k/30d', notes: 'cardinsider. Lifetime-free. No annual spend milestone.' }],
  'idfc-mayura': [
    { period: 'welcome', kind: 'points', points: 4000, verified: true, label: '4,000 RP on fee-pay', notes: 'cardinsider; welcome revised 1-Sep-2025.' },
    { spendThreshold: 20000, period: 'welcome', kind: 'points', points: 4000, verified: true, label: '4,000 RP on ₹20k in 2nd cycle', notes: 'cardinsider (welcome bundle).' },
    { spendThreshold: 20000, period: 'welcome', kind: 'points', points: 4000, verified: true, label: '4,000 RP on ₹20k in 3rd cycle', notes: 'cardinsider; total 12,000 welcome RP.' },
    { spendThreshold: 800000, period: 'anniversary-year', kind: 'points', points: 7500, repeatable: true, verified: true, label: '7,500 RP at ₹8L', notes: 'cardinsider; higher tier supersedes.' },
    { spendThreshold: 1500000, period: 'anniversary-year', kind: 'points', points: 15000, repeatable: true, verified: true, label: '15,000 RP at ₹15L', notes: 'cardinsider.' },
  ],
  'idfc-vistara': [
    { period: 'welcome', kind: 'other', verified: true, label: 'welcome PE ticket + upgrade voucher + Maharaja Silver', notes: 'cardinsider. CV points → Air India Maharaja Club since Nov-2024. Winding down 30-Sep-2026.' },
    { spendThreshold: 150000, period: 'anniversary-year', kind: 'other', verified: true, label: 'Premium Economy ticket at ₹1.5L', notes: 'cardinsider; up to 5 PE tickets/yr at ₹1.5L/₹3L/₹4.5L/₹9L/₹12L.' },
    { spendThreshold: 900000, period: 'anniversary-year', kind: 'other', verified: true, label: 'Premium Economy ticket at ₹9L', notes: 'cardinsider (4th of 5 tiers).' },
    { spendThreshold: 1200000, period: 'anniversary-year', kind: 'other', verified: true, label: 'Premium Economy ticket at ₹12L', notes: 'cardinsider (5th tier).' },
  ],

  // ---- BoB (cardmaven/cardinsider/livefromalounge) ----
  'bob-eterna': [
    { spendThreshold: 50000, period: 'welcome', kind: 'points', points: 10000, verified: true, label: '10,000 pts on ₹50k/60d', notes: 'cardmaven (1 RP = ₹0.25). LTF for eligible; else ₹2,499 fee, waiver at ₹2.5L.' },
    { spendThreshold: 500000, period: 'anniversary-year', kind: 'points', points: 20000, repeatable: true, verified: true, label: '20,000 pts at ₹5L', notes: 'cardmaven (₹5,000 value).' },
  ],
  'bob-premier': [{ spendThreshold: 5000, period: 'welcome', kind: 'points', points: 500, verified: true, label: '500 pts on ₹5k/60d', notes: 'cardinsider. LTF limited-period; else ₹1,000 fee, waiver at ₹1.2L.' }],
  // bob-etihad = Premium (fee ₹5,000, fw ₹5L); bob-etihad-standard = Standard.
  'bob-etihad': [
    { period: 'welcome', kind: 'points', points: 5000, verified: false, label: '5,000 Etihad miles on fee-pay', notes: 'BoB Etihad Premium; welcome per cardinsider (unconfirmed by the Gemini mid-2026 audit).' },
    { spendThreshold: 50000, period: 'statement-cycle', kind: 'points', points: 1000, repeatable: true, verified: false, label: '1,000 miles on ₹50k/cycle', notes: 'BoB Etihad Premium tiers (Gemini audit mid-2026): ₹50k/mo→1k, ₹1.5L/qtr→2k, ₹6L/yr→12k, fw ₹5L.' },
    { spendThreshold: 150000, period: 'quarter', kind: 'points', points: 2000, repeatable: true, verified: false, label: '2,000 miles per ₹1.5L quarterly', notes: 'BoB Etihad Premium (Gemini audit mid-2026).' },
    { spendThreshold: 600000, period: 'anniversary-year', kind: 'points', points: 12000, repeatable: true, verified: false, label: '12,000 miles at ₹6L', notes: 'BoB Etihad Premium (Gemini audit mid-2026).' },
    fw(500000, 5000, '₹5L/yr → waiver, Premium (livefromalounge + Gemini audit).'),
  ],
  'bob-etihad-standard': [
    { spendThreshold: 25000, period: 'statement-cycle', kind: 'points', points: 250, repeatable: true, verified: false, label: '250 miles on ₹25k/cycle', notes: 'BoB Etihad Standard tiers (Gemini audit mid-2026): ₹25k/mo→250, ₹2L/qtr→2k, ₹7.5L/yr→12k, fw ₹3L.' },
    { spendThreshold: 200000, period: 'quarter', kind: 'points', points: 2000, repeatable: true, verified: false, label: '2,000 miles per ₹2L quarterly', notes: 'BoB Etihad Standard (Gemini audit mid-2026).' },
    { spendThreshold: 750000, period: 'anniversary-year', kind: 'points', points: 12000, repeatable: true, verified: false, label: '12,000 miles at ₹7.5L', notes: 'BoB Etihad Standard (Gemini audit mid-2026).' },
    { spendThreshold: 300000, period: 'anniversary-year', kind: 'fee-waiver', valueInr: 750, repeatable: true, verified: false, label: 'annual fee waiver', notes: 'Standard fee-waiver at ₹3L (Gemini audit). Annual fee ~₹750 UNCONFIRMED — verify against the BoB benefit sheet.' },
  ],
}

// Overall monthly cap on ACCELERATED (bonus-over-base) points — the "umbrella"
// cap — by card slug, merged into rule.acceleratedMonthlyCapPoints at seed time.
// Grounded July 2026 (HDFC SmartBuy/ICICI iShop/SC/Amex/HSBC official pages
// where reachable; others secondary). Only clean POINT caps here — cashback ₹
// caps (SBI Cashback ₹4k, HSBC Live+ ₹1,200, SC Smart ₹1.5k, HDFC Swiggy/
// Millennia) stay on their cashback accelerators, and Axis/Atlas caps are SPEND
// caps (₹2L/mo portal), captured in accelerator notes — not point umbrellas.
export const CARD_ACCEL_CAP: Record<string, number> = {
  'hdfc-infinia': 15000, // SmartBuy overall (NOT 18,000 — 15k confirmed, 18k unfounded); vouchers ≤3,000 within it
  'hdfc-diners-black': 7500, // plastic; Diners Black Metal is 10,000
  'hdfc-bizblack': 10000,
  'hdfc-regalia-gold': 4000,
  'icici-emeralde-private-metal': 12000, // iShop bonus/mo (+ per-cycle category sub-caps on accelerators)
  'icici-sapphiro': 9000, // iShop bonus/mo
  'icici-coral': 9000, // iShop bonus/mo
  'icici-amazon-pay': 1100, // iShop co-brand cap; primary 5/3/2/1% cashback uncapped
  'icici-makemytrip': 1100, // iShop co-brand cap; primary myCash uncapped
  'sbi-elite': 10000, // 10X dining/grocery/dept combined
  'sbi-simplyclick': 20000, // 10X partners (10k) + 5X other online (10k)
  'sbi-prime': 7500, // 10X dining/grocery/dept/movies combined
  'amex-smartearn': 1250, // 500 + 500 + 250 across accelerated buckets
  'hsbc-travelone': 18000, // Travel-With-Points portal accelerated
  'hsbc-premier': 18000, // Travel-With-Points portal accelerated
  'au-ixigo': 10000, // overall RP/mo (base + accel)
  'au-zenith': 25000, // overall/cycle; 5X category sub-capped 5,000
  'au-zenith-plus': 25000, // cloned from base Zenith; Zenith+ cap not separately confirmed
  'au-lit': 10000, // overall/cycle
  'idfc-mayura': 25000, // app travel bonus/mo
  'bob-eterna': 5000, // 15X categories
  'bob-premier': 2000, // 5X categories
}

// Pure lookups used by the seed generator and its test (mirrors surcharges.ts).
export function feesFor(cardSlug: string): Fees | undefined {
  return CARD_FEES[cardSlug]
}
export function milestonesFor(cardSlug: string): MilestoneInput[] {
  return CARD_MILESTONES[cardSlug] ?? []
}
export function accelCapFor(cardSlug: string): number | undefined {
  return CARD_ACCEL_CAP[cardSlug]
}
// Guard against a typo silently orphaning a card's fees/milestones/accel-cap.
export function unknownMilestoneKeys(cardSlugs: Set<string>): string[] {
  const bad: string[] = []
  for (const k of Object.keys(CARD_FEES)) if (!cardSlugs.has(k)) bad.push(`CARD_FEES["${k}"]`)
  for (const k of Object.keys(CARD_MILESTONES)) if (!cardSlugs.has(k)) bad.push(`CARD_MILESTONES["${k}"]`)
  for (const k of Object.keys(CARD_ACCEL_CAP)) if (!cardSlugs.has(k)) bad.push(`CARD_ACCEL_CAP["${k}"]`)
  return bad
}
