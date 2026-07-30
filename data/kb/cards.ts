import type { Card, EarnRuleInput } from '@/lib/kb/schema'

// Seed cards. Earn rules were verified (July 2026) against bank MITC/T&C where
// possible; `verified: true` marks rules whose numbers came from an official
// bank source, `false` marks secondary-sourced or partial figures an admin
// should still confirm in /admin/kb. Rules are versioned append-only
// (effectiveFrom); a devaluation is a NEW rule, never an edit of history —
// seed carries the CURRENT rule, with prior structure noted where relevant.
//
// The rule shape: base {points, per} + accelerators (multiplier over base +
// optional monthly POINT cap) + spendTiers (marginal earn past a ₹-spend slab)
// + category/MCC exclusions. Fees live in data/kb/surcharges.ts (merged in at
// seed time). Mechanics still not machine-encoded — milestones, day-of-week,
// international multipliers, tiered/status earn, and spend-tier eligibility
// exclusions / credit-limit-relative ceilings — are recorded in `notes` for
// the M3 earn engine.

export type SeedCard = { card: Card; rules: EarnRuleInput[] }

// Published excluded-MCC sets (bank MITC lists; 4-digit; representative where
// the bank publishes ranges). Shared across a bank's cards.
const HDFC_EXCL = [
  '5172', '5541', '5542', '5983', // fuel
  '6513', // rent / property
  '6540', // wallet load
  '5094', '5944', // jewellery
  '5947', // gift/prepaid cards
  '5816', '7995', // gaming/gambling
  '8211', '8220', '8241', '8244', '8249', '8299', // education
  '9211', '9222', '9223', '9311', '9399', '9402', '9405', '9950', // government
]
// HDFC BUSINESS cards (BizBlack/BizPower/BizGrow) — same exclusions as personal
// EXCEPT government/tax: on business cards income-tax & GST (MCC 9311/9399) ARE an
// eligible (accelerated) earn category, so the government block is removed here.
const HDFC_BIZ_EXCL = [
  '5172', '5541', '5542', '5983', // fuel
  '6513', // rent / property
  '6540', // wallet load
  '5094', '5944', // jewellery
  '5947', // gift/prepaid cards
  '5816', '7995', // gaming/gambling
  '8211', '8220', '8241', '8244', '8249', '8299', // education
]
const AXIS_EXCL = [
  '5541', '5542', '5983', // fuel
  '6513', // rent
  '6540', // wallet
  '4814', '4816', '4899', '4900', // utilities/telecom
  '8211', '8241', '8244', '8249', '8299', // education
  '9211', '9222', '9311', '9399', '9402', '9405', '8220', // government
  '5960', '6300', '6381', // insurance
  '5094', '5944', // jewellery
  '6010', '6011', '6012', '6051', // financial / cash
]
const ICICI_EXCL = [
  '5541', '5542', '1361', '3851', '5983', '9752', '5555', '5172', // fuel
  '6513', '7014', '7407', '5271', // rent
  '9405', '9222', '9399', '9402', '9211', '6760', // government
  '1520', '1750', '1740', '1711', '1761', '1771', '1731', // property mgmt
  '9311', '9313', '7276', // tax
  '6540', // wallet
]
const SBI_EXCL = [
  '5172', '5541', '5542', '5983', // fuel
  '6540', '6541', // wallet
  '6513', '7349', // rent
  '9399', '9311', '9222', '9402', // government
  '5816', '7993', '7994', // gaming
  '4784', // tolls
]
const BOB_EXCL = [
  '5814', // fast food
  '0763', '0780', // agriculture (published range 0763-0825)
  '1520', '1711', '1731', '1740', '1750', '1761', '1771', '1799', // contractors
  '4111', '4112', '4131', '4784', '4789', // transport / toll
  '6513', // rent
  '7211', '7230', '7276', '7349', '8111', '8641', // personal/professional services
  '9211', '9222', '9311', '9399', '9402', '9405', // government
  '8211', '8220', '8241', '8244', '8249', '8299', // education
  '8011', '8062', // hospitals
  '6539', '6540', '6541', '6542', '6543', // wallet loads
  '5261', '5331', '5411', '5499', // supermarkets
  '5960', '6300', // insurance
  '8398', '8661', // charity
]
const AU_IXIGO_EXCL = [
  '6513', // rent
  '8211', '8220', '8241', '8244', '8249', '8299', // education
  '9211', '9222', '9223', '9311', '9399', '9402', '9405', '9950', // government
  '4812', '4814', '4899', '4900', // utilities/telecom (reduced, see notes)
  '5960', '6300', // insurance (reduced)
  '6540', // wallet
]
const SC_EXCL = ['5172', '5541', '5542', '5983', '6513', '7349'] // fuel + rent
const HSBC_LIVEPLUS_EXCL = ['8062', '4111'] // hospitals + local transit (eff 26-Jul-2026); rest category-only
// New banks (Jul-2026 onboarding; earn/exclusions community-sourced → verified:false).
const KOTAK_EXCL = ['5541', '5542', '5983', '6513', '6540', '5816', '7995', '9311', '9399', '9222', '9402'] // fuel/rent/wallet/gaming/govt
const FEDERAL_EXCL = ['5541', '5542', '5983', '6513', '6540', '6050', '6051', '6012', '9311', '9399', '9222', '9402', '9405', '9211'] // fuel/rent/wallet/quasi-cash/govt (federal MITC)
const RBL_EXCL = ['5541', '5542', '5983', '6513', '6540', '4900', '5960', '6300', '8211', '8220', '8241', '8244', '8249', '8299', '9311', '9399', '9222', '9402'] // fuel/rent/wallet/utility/insurance/education/govt
const EQUITAS_EXCL = ['5541', '5542', '5983', '6513', '6540', '8211', '8220', '8241', '8244', '8249', '8299', '9311', '9399', '9222', '9402'] // fuel/rent/wallet/education/govt
// Tier-1 fintech / new banks (Jul-2026 onboarding).
const YES_EXCL = ['5541', '5542', '5983', '6513', '6540', '9311', '9399', '9222', '9402', '5960', '6300', '8211', '8220', '8241', '8244', '8249', '8299', '5094', '5944'] // fuel/rent/wallet/govt/insurance/education/jewellery
const IDBI_EXCL = ['5541', '5542', '5983', '6513', '6540', '9311', '9399', '9222', '9402', '5960', '6300', '8211', '8220', '8241', '8244', '8249', '8299', '6211'] // fuel/rent/wallet/govt/insurance/education/MF
const ONECARD_EXCL = ['5541', '5542', '5983', '6513', '6540', '6050', '6051'] // fuel/rent/wallet/quasi-cash
const SLICE_EXCL = ['5541', '5542', '5983', '6540', '6513', '5960', '6300', '9311', '9399', '9222', '9402', '8211', '8220', '8241', '8244', '8249', '8299'] // fuel/wallet/rent/insurance/govt/education
// PSU issuers — standard exclusions (fuel/rent/wallet/govt); most don't publish detailed lists.
const PSU_EXCL = ['5541', '5542', '5983', '6513', '6540', '9311', '9399', '9222', '9402']
// Tier-3
const DBS_EXCL = ['5541', '5542', '5983', '6540', '6513', '9311', '9399', '9222', '9402'] // fuel/wallet/rent/govt
const KVB_EXCL = ['6513', '6540', '9311', '9399', '9222', '9402'] // rent/wallet/govt (KVB Honour earns on fuel)
const JUPITER_EXCL = ['6540', '6513', '5960', '6300', '8211', '8220', '8241', '8244', '8249', '8299'] // wallet/rent/insurance/education

export const CARDS: SeedCard[] = [
  // =========================================================================
  // HDFC (RP = HDFC Reward Points; SmartBuy is the accelerated portal)
  // =========================================================================
  {
    card: {
      slug: 'hdfc-infinia', bankSlug: 'hdfc', name: 'HDFC Infinia', beancountName: 'Infinia',
      network: 'visa', pool: { ticker: 'HDFC_RP_PREMIUM', programme: 'HDFC Reward Points' }, active: true,
    },
    rules: [{
      effectiveFrom: '2026-07-01',
      base: { points: 5, per: 150 },
      accelerators: [
        { category: 'travel-portal', label: 'SmartBuy (hotels 10x / flights 5x / vouchers 5x)', multiplier: 2, monthlyCapPoints: 15000, notes: 'Umbrella cap 15,000 accel RP/mo; brand-voucher sub-cap 3,000 RP/mo eff 1-Jul-2026' },
        { category: 'insurance', label: 'Insurance', multiplier: 1, monthlyCapPoints: 10000, notes: 'base rate, capped 10,000 RP/mo (eff 1-Jul-2025)' },
      ],
      exclusions: ['fuel', 'rent', 'wallet', 'government'],
      excludedMccs: HDFC_EXCL,
      verified: true,
      notes: 'Official HDFC Infinia Rewards T&C. RP value ₹1 on SmartBuy flights/hotels, ₹0.30 cashback. Utilities/telecom/grocery capped 2,000 RP/mo each (eff 1-Sep-2024). Third-party education/rent apps (CRED etc.) excluded.',
    }],
  },
  {
    card: {
      slug: 'hdfc-diners-black', bankSlug: 'hdfc', name: 'HDFC Diners Club Black', beancountName: 'DinersBlack',
      network: 'diners', pool: { ticker: 'HDFC_RP_PREMIUM', programme: 'HDFC Reward Points' }, active: true,
    },
    rules: [{
      effectiveFrom: '2026-07-01',
      base: { points: 5, per: 150 },
      accelerators: [
        { category: 'travel-portal', label: 'SmartBuy (hotels 10x / flights 5x / vouchers 3x)', multiplier: 2, monthlyCapPoints: 10000, notes: 'Umbrella cap 10,000 accel RP/mo; voucher sub-cap 3,000 RP/mo' },
        { category: 'dining', label: 'Weekend dining (Sat/Sun)', multiplier: 2, notes: '10 RP/₹150 at restaurants on weekends' },
      ],
      exclusions: ['fuel', 'rent', 'wallet', 'government'],
      excludedMccs: HDFC_EXCL,
      verified: true,
      notes: 'Official HDFC Diners T&C. Insurance capped 5,000 RP/mo; grocery/utilities/telecom 2,000 RP/mo. redBus 5x.',
    }],
  },
  {
    card: {
      slug: 'hdfc-bizblack', bankSlug: 'hdfc', name: 'HDFC BizBlack Metal', beancountName: 'BizBlack',
      network: 'visa', pool: { ticker: 'HDFC_RP_PREMIUM', programme: 'HDFC Reward Points' }, active: true,
    },
    rules: [{
      effectiveFrom: '2025-07-01',
      base: { points: 5, per: 150 },
      accelerators: [
        { category: 'travel-portal', label: 'SmartBuy (hotels 10x / flights 5x)', multiplier: 2, monthlyCapPoints: 10000, notes: 'SmartBuy travel: hotels 10x / flights 5x. Brand-voucher purchases capped 3,000 accel RP/mo (eff 1-Jul-2026) — cardinsider.' },
        { mccs: ['9311', '4814', '4899', '4900'], label: 'Business 5X (Tax/GST, Utility/Telecom, MMT MyBiz, Business Tools)', multiplier: 5, monthlyCapPoints: 7500, notes: 'User verification 2025-07-01: 5X (25 RP/₹150) on Tax/GST (MCC 9311), Utility/Telecom, MMT MyBiz and Business Tools, capped 7,500 accel RP/statement cycle; triggers only once ≥₹50,000/cycle is spent in these categories. MMT MyBiz + Business Tools are merchant programmes (not MCC-mappable) — captured here in notes.' },
      ],
      exclusions: ['fuel', 'rent', 'wallet'],
      excludedMccs: HDFC_BIZ_EXCL,
      verified: true,
      notes: 'Base 5 RP/₹150. Two distinct accelerators: SmartBuy travel (hotels 10x / flights 5x), and a separate Business 5X (25 RP/₹150) on Tax/GST + Utility/Telecom + MMT MyBiz + Business Tools — cap 7,500 accel RP/cycle with a ₹50k/cycle trigger (user verification 2025-07-01; corrects the earlier 2x modelling). Insurance capped 5,000 RP/mo, grocery 2,000 RP/mo (not machine-encoded). SmartBuy brand-voucher cap 3,000 RP/mo (cardinsider). Tax/GST (MCC 9311) IS an eligible earn category (HDFC_BIZ_EXCL omits the government block) — see tax-treatment.ts.',
    }],
  },
  {
    card: {
      slug: 'hdfc-regalia-gold', bankSlug: 'hdfc', name: 'HDFC Regalia Gold', beancountName: 'RegaliaGold',
      network: 'visa', pool: { ticker: 'HDFC_RP', programme: 'HDFC Reward Points' }, active: true,
    },
    rules: [{
      // Base revised 4 RP/₹150 → 5 RP/₹200 effective 15-May-2026 (official HDFC
      // product-change mailer PDF; DCC markup 1.75% same date). Confirmed by
      // reading the July-2026 MITC v4.4 + product-change doc.
      effectiveFrom: '2026-05-15',
      base: { points: 5, per: 200 },
      accelerators: [
        { category: 'shopping-online', label: 'Nykaa / Myntra / M&S / Reliance Digital', multiplier: 4, monthlyCapPoints: 5000, notes: '5X brand partners, capped 5,000 RP/mo (official Regalia Gold Rewards T&C)' },
        { category: 'travel-portal', label: 'SmartBuy (hotels 10x / flights 5x)', multiplier: 2, monthlyCapPoints: 4000, notes: 'SmartBuy ~4,000 bonus RP/mo; brand-voucher sub-cap 3,000/mo eff 1-Jul-2026' },
      ],
      exclusions: ['fuel', 'wallet'],
      excludedMccs: HDFC_EXCL,
      verified: true,
      notes: 'Official HDFC MITC v4.4 (Jul-2026) + product-change PDF: base 5 RP/₹200 (from 4 RP/₹150) + DCC 1.75% eff 15-May-2026. Fee ₹2,500, waiver ₹4L. FCY 2%. Overall 50,000 RP/cycle cap. Pays base on insurance/utilities/education.',
    }],
  },
  {
    card: {
      slug: 'hdfc-millennia', bankSlug: 'hdfc', name: 'HDFC Millennia', beancountName: 'Millennia',
      network: 'visa', pool: { ticker: 'HDFC_CB', programme: 'Millennia CashPoints' }, active: true,
    },
    rules: [{
      effectiveFrom: '2026-02-06',
      base: { points: 1, per: 100 },
      accelerators: [
        { category: 'shopping-online', label: 'Amazon/Flipkart/Myntra/Swiggy/Zomato/Uber/+ (10 brands)', multiplier: 5, monthlyCapPoints: 1000, notes: '5% CashPoints at partners, capped 1,000 CP/cycle' },
      ],
      exclusions: ['fuel', 'rent', 'wallet', 'government'],
      excludedMccs: HDFC_EXCL,
      verified: true,
      notes: 'Official HDFC Millennia FAQ. 1 CashPoint = ₹1 vs statement. Base 1% also capped 1,000 CP/cycle. All EMI (incl. on the 10 brands) excluded.',
    }],
  },
  {
    card: {
      slug: 'hdfc-marriott', bankSlug: 'hdfc', name: 'HDFC Marriott Bonvoy', beancountName: 'MarriottBonvoy',
      network: 'diners', pool: { ticker: 'BONVOY', programme: 'Marriott Bonvoy' }, active: true,
    },
    rules: [{
      effectiveFrom: '2025-01-01',
      base: { points: 2, per: 150 },
      accelerators: [
        { category: 'travel', label: 'Marriott hotels', multiplier: 4, notes: '8 Bonvoy pts/₹150 at Marriott properties' },
        { category: 'dining', label: 'Travel / dining / entertainment', multiplier: 2, notes: '4 pts/₹150' },
      ],
      exclusions: ['fuel', 'rent', 'wallet', 'government'],
      excludedMccs: HDFC_EXCL,
      verified: true,
      notes: 'OFFICIAL — marriott.com India co-brand page (browser-verified Jul-2026): 8 / 4 / 2 Bonvoy pts per ₹150 (Marriott properties / travel-dining-entertainment / all other). FNA (<=15k pts) at ₹6L/₹9L/₹15L annual + welcome/renewal FNA + Silver Elite + 10 Elite Night Credits; 12+12 lounges/yr + golf 2x/qtr — milestones/benefits are M3. Voucher/gift-card purchases excluded from earn. NOTE: the reported 15-May-2026 per-₹200 devaluation is NOT on the current official page — the rate is still per ₹150, so that (Grok-sourced, unverified) version was removed as spurious.',
    }],
  },
  {
    card: {
      slug: 'hdfc-neu-infinity', bankSlug: 'hdfc', name: 'HDFC Tata Neu Infinity', beancountName: 'NeuInfinity',
      network: 'rupay', pool: { ticker: 'NEUCOINS', programme: 'Tata NeuCoins' }, active: true,
    },
    rules: [{
      effectiveFrom: '2026-05-01',
      base: { points: 1.5, per: 100 },
      accelerators: [
        { category: 'shopping-online', label: 'Tata Neu app / Tata brands', multiplier: 3.33, notes: '5% NeuCoins (+ up to 5% NeuPass); needs paying with THIS card since 1-May-2026' },
      ],
      exclusions: ['fuel', 'rent', 'wallet', 'government'],
      excludedMccs: HDFC_EXCL,
      verified: true,
      notes: 'Official HDFC Tata Neu Infinity figures (confirmed via Google against hdfc.bank.in; live page is JS-rendered so not directly screenshot-readable): 5% NeuCoins on Tata Neu / Tata brands (pay-with-card required since 1-May-2026), 1.5% on other eligible spends. RuPay UPI capped 500 NeuCoins/mo; grocery 2,000/mo. NeuCoins 12-mo validity (from 1-Aug-2025). 1 NeuCoin = ₹1 in Tata ecosystem.',
    }],
  },
  {
    card: {
      slug: 'hdfc-neu-plus', bankSlug: 'hdfc', name: 'HDFC Tata Neu Plus', beancountName: 'NeuPlus',
      network: 'rupay', pool: { ticker: 'NEUCOINS', programme: 'Tata NeuCoins' }, active: true,
    },
    rules: [{
      effectiveFrom: '2025-01-01',
      base: { points: 1, per: 100 },
      accelerators: [
        { category: 'shopping-online', label: 'Tata Neu app / Tata brands', multiplier: 2, notes: '2% NeuCoins (+ up to 5% via NeuPass)' },
      ],
      exclusions: ['fuel', 'rent', 'wallet', 'government'],
      excludedMccs: HDFC_EXCL,
      verified: true,
      notes: 'Official HDFC value chart. 1 NeuCoin = ₹1. RuPay UPI total capped 500 NeuCoins/mo.',
    }],
  },
  {
    card: {
      slug: 'hdfc-swiggy', bankSlug: 'hdfc', name: 'Swiggy HDFC', beancountName: 'Swiggy',
      network: 'mastercard', pool: { ticker: 'SWIGGY_CB', programme: 'Swiggy card cashback' }, active: true,
    },
    rules: [{
      effectiveFrom: '2026-04-17',
      base: { points: 1, per: 100 },
      accelerators: [
        { category: 'dining', label: 'Swiggy app (Food/Instamart/Dineout)', multiplier: 10, monthlyCapPoints: 1500, notes: '10% cashback, min ₹249/txn (eff 17-Apr-2026), cap ₹1,500/cycle' },
        { category: 'shopping-online', label: 'Select online MCCs (Amazon/Flipkart/Nykaa/…)', multiplier: 5, monthlyCapPoints: 1500, notes: '5% online, cap ₹1,500/cycle' },
        { category: 'travel', label: 'Cleartrip flights/hotels', multiplier: 5, monthlyCapPoints: 1500, notes: '5% via Cleartrip, cap ₹1,500/cycle (added 2026)' },
      ],
      exclusions: ['fuel', 'rent', 'wallet', 'jewellery', 'government'],
      excludedMccs: HDFC_EXCL,
      verified: true,
      notes: 'Official HDFC Swiggy T&C. New applicants get Swiggy BLCK/ORNGE variants (announced 2026); rules here are the original card. Swiggy Money/Minis/Liquor excluded.',
    }],
  },

  // =========================================================================
  // Axis (EDGE Reward Points vs EDGE Miles — distinct; Travel Edge portal)
  // =========================================================================
  {
    card: {
      slug: 'axis-magnus', bankSlug: 'axis', name: 'Axis Magnus', beancountName: 'Magnus',
      network: 'mastercard', pool: { ticker: 'EDGE_RP', programme: 'Axis EDGE Reward Points' }, active: true,
    },
    rules: [{
      effectiveFrom: '2024-04-20',
      base: { points: 12, per: 200 },
      accelerators: [
        { category: 'travel-portal', label: 'Travel Edge / Grab Deals / GYFTR', multiplier: 5, notes: 'up to 5x on base 12; cap ₹2L spend/mo (excluded from the 35x tier pool)' },
      ],
      spendTiers: [
        { fromMonthlySpend: 150000, points: 35, per: 200, label: 'Incremental spend over ₹1.5L/mo', notes: '~3.5% vs 1.2% base; excluded categories and Travel-Edge/GrabDeals spend do NOT count toward the ₹1.5L trigger.' },
      ],
      exclusions: ['fuel', 'rent', 'wallet', 'utilities', 'telecom', 'insurance', 'government', 'jewellery'],
      excludedMccs: AXIS_EXCL,
      verified: true,
      notes: 'Official. Earns EDGE REWARD POINTS (~₹0.20), not Miles. 35 RP/₹200 on incremental spend >₹1.5L/mo (see spendTiers). Transfer 5:2 (Burgundy 5:4). Devaluations: govt/utilities 1-Sep-2023, insurance/fuel/gold 20-Apr-2024.',
    }],
  },
  {
    card: {
      slug: 'axis-magnus-burgundy', bankSlug: 'axis', name: 'Axis Magnus Burgundy', beancountName: 'MagnusBurgundy',
      network: 'mastercard', pool: { ticker: 'EDGE_RP', programme: 'Axis EDGE Reward Points' }, active: true,
    },
    rules: [{
      effectiveFrom: '2025-06-20',
      base: { points: 12, per: 200 },
      accelerators: [
        { category: 'travel-portal', label: 'Travel Edge / Grab Deals', multiplier: 5, notes: 'up to 5x on base; cap ₹2L spend/mo' },
      ],
      spendTiers: [
        { fromMonthlySpend: 150000, points: 35, per: 200, label: 'Incremental spend over ₹1.5L/mo', notes: 'Burgundy T&C 20-Jun-2025: tier ceilings at (credit limit + ₹1.5L)/mo — per-customer, so the upper bound is left unbounded here; reverts to 12/₹200 above it.' },
      ],
      exclusions: ['fuel', 'rent', 'wallet', 'utilities', 'telecom', 'insurance', 'government', 'jewellery'],
      excludedMccs: AXIS_EXCL,
      verified: true,
      notes: 'Official (T&C 20-Jun-2025). 35 RP/₹200 tier now ceilings at (credit limit + ₹1.5L)/mo then reverts to 12/₹200 (see spendTiers). Transfer 5:4, cap 10L RP/yr. Value ~₹0.20/RP.',
    }],
  },
  {
    card: {
      slug: 'axis-atlas', bankSlug: 'axis', name: 'Axis Atlas', beancountName: 'Atlas',
      network: 'visa', pool: { ticker: 'EDGE_MILES', programme: 'Axis EDGE Miles' }, active: true,
    },
    rules: [{
      effectiveFrom: '2024-04-20',
      base: { points: 2, per: 100 },
      accelerators: [
        { category: 'travel', label: 'Travel Edge / direct airline / direct hotel', multiplier: 2.5, monthlyCapPoints: 10000, notes: '5 EDGE Miles/₹100, cap ₹2L spend/mo (=10,000 accel miles); OTAs earn base only' },
      ],
      exclusions: ['fuel', 'rent', 'wallet', 'utilities', 'telecom', 'insurance', 'government', 'jewellery'],
      excludedMccs: AXIS_EXCL,
      verified: true,
      notes: 'Official. EDGE Miles ≈ ₹1. Milestones 2,500/2,500/5,000 at ₹3L/₹7.5L/₹15L + tier (Silver/Gold/Platinum) — M3. Transfer 1:2 (Group A <=30k, B <=1.2L, total 1.5L/yr). Education NOT excluded.',
    }],
  },
  {
    card: {
      slug: 'axis-privilege', bankSlug: 'axis', name: 'Axis Privilege', beancountName: 'Privilege',
      network: 'visa', pool: { ticker: 'EDGE_RP', programme: 'Axis EDGE Reward Points' }, active: true,
    },
    rules: [{
      effectiveFrom: '2024-04-20',
      base: { points: 10, per: 200 },
      accelerators: [],
      exclusions: ['fuel', 'rent', 'wallet', 'utilities', 'telecom', 'insurance', 'government', 'jewellery', 'education'],
      excludedMccs: AXIS_EXCL,
      verified: true,
      notes: 'Official Privilege revision T&C. ~₹0.20/RP. Milestone +10,000 RP at ₹2.5L annual spend. Utility&Telecom added to earn-exclusions ~1-Oct-2025.',
    }],
  },
  {
    card: {
      slug: 'axis-ace', bankSlug: 'axis', name: 'Axis Ace', beancountName: 'Ace',
      network: 'visa', pool: { ticker: 'AXIS_CB', programme: 'Axis cashback' }, active: true,
    },
    rules: [{
      effectiveFrom: '2024-04-20',
      base: { points: 1.5, per: 100 },
      accelerators: [
        { category: 'utilities', label: 'Bill payments & recharges via Google Pay', multiplier: 3.33, monthlyCapPoints: 500, notes: '5% via GPay; combined 5%+4% cap ₹500/statement' },
        { category: 'dining', label: 'Swiggy / Zomato / Ola', multiplier: 2.67, monthlyCapPoints: 500, notes: '4%; shares the ₹500/statement cap' },
      ],
      exclusions: ['fuel', 'rent', 'wallet', 'insurance', 'government', 'jewellery', 'education'],
      excludedMccs: AXIS_EXCL,
      verified: true,
      notes: 'Official Ace T&C. 1.5% base (cut from 2% on 20-Apr-2024), uncapped, direct cashback. Non-GPay utilities excluded 20-Apr-2024.',
    }],
  },
  {
    card: {
      slug: 'axis-flipkart', bankSlug: 'axis', name: 'Flipkart Axis', beancountName: 'Flipkart',
      network: 'visa', pool: { ticker: 'AXIS_CB', programme: 'Axis cashback' }, active: true,
    },
    rules: [{
      effectiveFrom: '2025-06-20',
      base: { points: 1, per: 100 },
      accelerators: [
        { category: 'shopping-online', label: 'Flipkart', multiplier: 5, monthlyCapPoints: 1333, notes: '5% cashback, cap ₹4,000/quarter' },
        { category: 'shopping-online', label: 'Myntra', multiplier: 7.5, monthlyCapPoints: 1333, notes: '7.5% (raised 2025), ₹4,000/qtr cap' },
        { category: 'dining', label: 'Preferred merchants (Cleartrip/cult.fit/PVR/Swiggy/Uber)', multiplier: 4, notes: '4%, no stated cap' },
      ],
      exclusions: ['fuel', 'rent', 'wallet', 'utilities', 'telecom', 'insurance', 'government', 'jewellery', 'education'],
      excludedMccs: AXIS_EXCL,
      verified: true,
      notes: 'Official (restructure 20-Jun-2025 added quarterly caps). Flipkart stays 5% (not reduced). 1% base cashback.',
    }],
  },
  {
    card: {
      slug: 'axis-airtel', bankSlug: 'axis', name: 'Airtel Axis', beancountName: 'Airtel',
      network: 'visa', pool: { ticker: 'AXIS_CB', programme: 'Axis cashback' }, active: true,
    },
    rules: [{
      effectiveFrom: '2026-04-12',
      base: { points: 1, per: 100 },
      accelerators: [
        { category: 'telecom', label: 'Airtel Thanks (mobile/broadband/DTH/Black)', multiplier: 25, monthlyCapPoints: 250, notes: '25% value-back; cap revised to 2x base cashback/mo eff 12-Apr-2026' },
        { category: 'utilities', label: 'Other utility bills via Airtel Thanks', multiplier: 10, monthlyCapPoints: 250, notes: '10%, cap 1x base/mo' },
      ],
      exclusions: ['fuel', 'rent', 'wallet', 'government', 'insurance', 'jewellery', 'education'],
      excludedMccs: AXIS_EXCL,
      verified: true,
      notes: 'OFFICIAL — axis.bank.in Airtel card page (confirmed via Google, Apr-2026 revision): 25% on Airtel bills + 10% on other utilities via Airtel Thanks + 1% base. Caps (eff 12-Apr-2026) are RELATIVE to base-category spend/mo — 25% category ≤ 2X base, 10% category ≤ 1X base (zero regular spend → zero accelerated); monthlyCapPoints here is a rough placeholder — the real relative cap is M3.',
    }],
  },

  // =========================================================================
  // ICICI (ICICI RP; co-brands run own currencies)
  // =========================================================================
  {
    card: {
      slug: 'icici-emeralde-private-metal', bankSlug: 'icici', name: 'ICICI Emeralde Private Metal', beancountName: 'Emeralde',
      network: 'mastercard', pool: { ticker: 'ICICI_RP', programme: 'ICICI Reward Points' }, active: true,
    },
    rules: [{
      effectiveFrom: '2024-11-15',
      base: { points: 6, per: 200 },
      accelerators: [],
      exclusions: ['fuel', 'rent', 'wallet', 'government'],
      excludedMccs: ICICI_EXCL,
      verified: true,
      notes: 'Official MITC. 6 RP/₹200; up to ₹1/RP on air-miles/premium redemption. Per-cycle point caps: grocery/education/utility 1,000 RP each, insurance 5,000 RP; transport capped ₹20k spend/mo (eff 15-Jan-2026). Invite-only Mastercard World Elite metal card; replaced the (non-metal) ICICI Emeralde — that legacy card is icici-emeralde.',
    }],
  },
  {
    card: {
      slug: 'icici-emeralde', bankSlug: 'icici', name: 'ICICI Emeralde', beancountName: 'EmeraldeNormal',
      network: 'visa', pool: { ticker: 'ICICI_RP', programme: 'ICICI Reward Points' }, active: true,
    },
    rules: [{
      effectiveFrom: '2021-01-01',
      base: { points: 4, per: 100 },
      accelerators: [],
      exclusions: ['fuel', 'rent', 'wallet', 'government'],
      excludedMccs: ICICI_EXCL,
      verified: false,
      notes: 'ICICI Emeralde (non-metal, Visa Signature) — the "normal" variant, STILL ISSUED alongside Emeralde Private Metal (icici-emeralde-private-metal is the metal variant); active. Base 4 RP/₹100 on all except fuel/utilities/insurance; utilities & insurance earn a reduced 1 RP/₹100 (not machine-encoded). ₹12,000 fee, waiver ₹10L/yr (or ₹1,000/mo, waived ₹1L/mo). 2% forex, unlimited lounge, 1 golf round/lesson per month on ₹50k prior-month spend. Sources: cardinsider + paisabazaar + Gemini audit (secondary) → verified:false. Network Visa assumed (Amex variant existed historically).',
    }],
  },
  {
    card: {
      slug: 'icici-sapphiro', bankSlug: 'icici', name: 'ICICI Sapphiro', beancountName: 'Sapphiro',
      network: 'amex', pool: { ticker: 'ICICI_RP', programme: 'ICICI Reward Points' }, active: true,
    },
    rules: [{
      effectiveFrom: '2024-11-15',
      base: { points: 2, per: 100 },
      accelerators: [
        { category: 'utilities', label: 'Utility & insurance', multiplier: 0.5, notes: '1 RP/₹100 (reduced)' },
      ],
      exclusions: ['fuel', 'rent', 'wallet', 'government'],
      excludedMccs: ICICI_EXCL,
      verified: true,
      notes: 'Official MITC. 2 RP/₹100 domestic, 4 RP/₹100 international (intl = M3). ~₹0.25/RP. Spend-value caps/cycle: utility/insurance ₹80k, grocery ₹40k. Milestone 4,000 RP at ₹4L. Transport ₹20k/mo.',
    }],
  },
  {
    card: {
      slug: 'icici-amazon-pay', bankSlug: 'icici', name: 'Amazon Pay ICICI', beancountName: 'AmazonPay',
      network: 'visa', pool: { ticker: 'AMZN_CB', programme: 'Amazon Pay cashback' }, active: true,
    },
    rules: [{
      effectiveFrom: '2025-10-11',
      base: { points: 1, per: 100 },
      accelerators: [
        { category: 'shopping-online', label: 'Amazon.in (Prime)', multiplier: 5, notes: '5% Prime / 3% non-Prime as Amazon Pay balance' },
        { category: 'shopping', label: 'Amazon Pay partner merchants', multiplier: 2, notes: '2% at select partners' },
      ],
      exclusions: ['fuel', 'rent', 'jewellery', 'government', 'education'],
      excludedMccs: ICICI_EXCL,
      verified: true,
      notes: 'Co-brand; own rules (exempt from general ICICI rent/wallet change). 1 pt = ₹1. Intl & education excluded eff 11-Oct-2025; forex cut to 1.99%; utility >₹50k/mo 1% fee. LTF.',
    }],
  },
  {
    card: {
      slug: 'icici-coral', bankSlug: 'icici', name: 'ICICI Coral', beancountName: 'Coral',
      network: 'visa', pool: { ticker: 'ICICI_RP', programme: 'ICICI Reward Points' }, active: true,
    },
    rules: [{
      effectiveFrom: '2024-11-15',
      base: { points: 2, per: 100 },
      accelerators: [
        { category: 'utilities', label: 'Utility & insurance', multiplier: 0.5, notes: '1 RP/₹100 (reduced)' },
      ],
      exclusions: ['fuel', 'rent', 'wallet', 'government'],
      excludedMccs: ICICI_EXCL,
      verified: true,
      notes: 'Official MITC. 1 RP = ₹0.25. Spend-value caps/cycle: utility/insurance ₹40k, grocery ₹20k. Bonus ~10,000 RP/yr.',
    }],
  },
  {
    card: {
      slug: 'icici-makemytrip', bankSlug: 'icici', name: 'MakeMyTrip ICICI', beancountName: 'MakeMyTrip',
      network: 'mastercard', pool: { ticker: 'MYCASH', programme: 'MMT myCash' }, active: true,
    },
    rules: [{
      effectiveFrom: '2024-11-15',
      base: { points: 1, per: 100 },
      accelerators: [
        { category: 'travel', label: 'MMT hotels', multiplier: 6, notes: '6% myCash on MMT hotels' },
        { category: 'travel-portal', label: 'MMT flights / holidays / cabs / bus', multiplier: 3, notes: '3% myCash' },
      ],
      exclusions: ['fuel', 'rent', 'jewellery', 'government'],
      excludedMccs: ICICI_EXCL,
      verified: true,
      notes: 'Co-brand. 1 myCash = ₹1, never expires. Insurance 1% capped 1,000 myCash/yr. EMI/cash/fees excluded.',
    }],
  },

  // =========================================================================
  // SBI Card
  // =========================================================================
  {
    card: {
      slug: 'sbi-cashback', bankSlug: 'sbi', name: 'SBI Cashback', beancountName: 'Cashback',
      network: 'visa', pool: { ticker: 'SBI_CB', programme: 'SBI Cashback' }, active: true,
    },
    rules: [{
      effectiveFrom: '2026-04-01',
      base: { points: 1, per: 100 },
      accelerators: [
        { category: 'shopping-online', label: 'All online spends', multiplier: 5, monthlyCapPoints: 2000, notes: '5% online, cap ₹2,000/cycle' },
      ],
      exclusions: ['fuel', 'rent', 'wallet', 'utilities', 'telecom', 'insurance', 'education', 'jewellery', 'government'],
      excludedMccs: SBI_EXCL,
      verified: true,
      notes: 'Official T&C. Direct cashback. Offline 1% cap ₹2,000/cycle separately; max ₹4,000/cycle. Gaming/toll/govt added 1-Apr-2026. Railways/gift-card shops also excluded.',
    }],
  },
  {
    card: {
      slug: 'sbi-elite', bankSlug: 'sbi', name: 'SBI Card ELITE', beancountName: 'Elite',
      network: 'visa', pool: { ticker: 'SBI_RP', programme: 'SBI Reward Points' }, active: true,
    },
    rules: [{
      effectiveFrom: '2024-01-01',
      base: { points: 2, per: 100 },
      accelerators: [
        { category: 'dining', label: 'Dining / departmental / grocery', multiplier: 5, monthlyCapPoints: 10000, notes: '10 RP/₹100, capped 10,000 RP/mo' },
      ],
      exclusions: ['fuel', 'rent', 'wallet', 'government'],
      excludedMccs: SBI_EXCL,
      verified: true,
      notes: '1 RP = ₹0.25. Welcome ₹5,000 voucher; milestones to ~50,000 RP/yr + ₹6,000 movie (M3). Full ELITE MCC schedule not retrievable (portfolio set applied).',
    }],
  },
  {
    card: {
      slug: 'sbi-simplyclick', bankSlug: 'sbi', name: 'SBI SimplyCLICK', beancountName: 'SimplyClick',
      network: 'visa', pool: { ticker: 'SBI_RP', programme: 'SBI Reward Points' }, active: true,
    },
    rules: [{
      effectiveFrom: '2026-03-20',
      base: { points: 1, per: 100 },
      accelerators: [
        { category: 'shopping-online', label: 'Exclusive partners (Amazon/Myntra/Swiggy/BookMyShow/+)', multiplier: 10, monthlyCapPoints: 10000, notes: '10x, capped 10,000 RP/mo' },
        { category: 'shopping-online', label: 'All other online', multiplier: 5, monthlyCapPoints: 10000, notes: '5x, separate 10,000 RP/mo bucket' },
      ],
      exclusions: ['fuel', 'rent', 'wallet', 'government'],
      excludedMccs: SBI_EXCL,
      verified: true,
      notes: 'Official RP T&C. 1 RP = ₹0.25. rent excl 1-Apr-2024, govt 1-Jun-2024, gaming 1-Dec-2024. Statement-credit redemption capped 60,000 RP/mo (Apr-2026).',
    }],
  },
  {
    card: {
      slug: 'sbi-prime', bankSlug: 'sbi', name: 'SBI Card PRIME', beancountName: 'Prime',
      network: 'visa', pool: { ticker: 'SBI_RP', programme: 'SBI Reward Points' }, active: true,
    },
    rules: [{
      effectiveFrom: '2024-01-01',
      base: { points: 2, per: 100 },
      accelerators: [
        { category: 'dining', label: 'Dining / departmental / groceries / movies', multiplier: 5, monthlyCapPoints: 7500, notes: '10 RP/₹100, capped 7,500 RP/mo' },
        { category: 'utilities', label: 'Utility via standing instruction', multiplier: 10, monthlyCapPoints: 3000, notes: '20 RP/₹100, capped 3,000 RP/mo' },
      ],
      exclusions: ['fuel', 'rent', 'wallet', 'government'],
      excludedMccs: SBI_EXCL,
      verified: true,
      notes: '1 RP = ₹0.25. Milestone vouchers (Pizza Hut/Yatra) — M3. 60,000 RP/mo redemption cap from Apr-2026.',
    }],
  },

  // =========================================================================
  // American Express (MR = Membership Rewards)
  // =========================================================================
  {
    card: {
      slug: 'amex-platinum-travel', bankSlug: 'amex', name: 'Amex Platinum Travel', beancountName: 'PlatinumTravel',
      network: 'amex', pool: { ticker: 'AMEX_MR', programme: 'Membership Rewards' }, active: true,
    },
    rules: [{
      effectiveFrom: '2025-06-12',
      base: { points: 1, per: 50 },
      accelerators: [],
      exclusions: ['fuel', 'utilities', 'telecom', 'insurance', 'government'],
      excludedMccs: [],
      verified: true,
      notes: 'Official. MR ~₹0.30-0.50. Milestones (per card year): ₹1.9L->7,500 MR; ₹4L->+10,000; ₹7L->+22,500 MR + ₹10k Taj voucher — auto-post since 9-Mar-2026 (M3). Fuel 0 pts since 12-Jun-2025. No India MCC numbers published (category-only).',
    }],
  },
  {
    card: {
      slug: 'amex-mrcc', bankSlug: 'amex', name: 'Amex MRCC', beancountName: 'MRCC',
      network: 'amex', pool: { ticker: 'AMEX_MR', programme: 'Membership Rewards' }, active: true,
    },
    rules: [{
      effectiveFrom: '2025-06-12',
      base: { points: 1, per: 50 },
      accelerators: [
        { category: 'shopping-online', label: 'Amex Rewards Multiplier portal', multiplier: 2, notes: '2x MR via portal' },
      ],
      exclusions: ['fuel', 'utilities', 'telecom', 'insurance', 'government'],
      excludedMccs: [],
      verified: true,
      notes: 'Official. Monthly milestones: 1,000 MR for 4x>=₹1,500 txns + 1,000 MR at >=₹20k/mo (max 2,000/mo) — M3. Category-only exclusions.',
    }],
  },
  {
    card: {
      slug: 'amex-platinum', bankSlug: 'amex', name: 'Amex Platinum (Charge)', beancountName: 'Platinum',
      network: 'amex', pool: { ticker: 'AMEX_MR', programme: 'Membership Rewards' }, active: true,
    },
    rules: [{
      effectiveFrom: '2025-06-12',
      base: { points: 1, per: 40 },
      accelerators: [
        { category: 'travel', label: 'Foreign-currency spends (3X MR)', multiplier: 3, notes: '3X MR on all spends abroad — confirmed on the official Amex India Platinum Charge page.' },
      ],
      exclusions: ['utilities', 'telecom', 'insurance', 'government'],
      excludedMccs: [],
      verified: true,
      notes: 'OFFICIAL — americanexpress.com/in/charge-cards/platinum-card (browser-verified Jul-2026): base 1 MR/₹40; 3X MR abroad; MR never expire; annual fee ₹66,000+GST. Removed a spurious "5 MR/₹100 on fuel" accelerator — the official Rewards section lists only base/3X-forex + the brand bonuses (Rewards Xcelerator up to 20X, Shopwise up to 5X on select brands — M3/offers, not a category rate). MR ~₹0.50-1.0+ via transfers.',
    }],
  },
  {
    card: {
      slug: 'amex-smartearn', bankSlug: 'amex', name: 'Amex SmartEarn', beancountName: 'SmartEarn',
      network: 'amex', pool: { ticker: 'AMEX_MR', programme: 'Membership Rewards' }, active: true,
    },
    rules: [{
      effectiveFrom: '2024-01-01',
      base: { points: 1, per: 50 },
      accelerators: [
        { category: 'shopping-online', label: 'Zomato/Flipkart/Uber/Myntra/Nykaa/Blinkit/+ (10x)', multiplier: 10, monthlyCapPoints: 500, notes: '10x; ~500 MR/mo per partner-group cap' },
        { category: 'shopping-online', label: 'Amazon', multiplier: 5, monthlyCapPoints: 250, notes: '5x Amazon, cap 250 MR/mo' },
      ],
      exclusions: ['fuel', 'utilities', 'telecom', 'insurance', 'government'],
      excludedMccs: [],
      verified: true,
      notes: 'Official. MR ~₹0.25-0.50. Fee ₹495+GST. Category-only exclusions.',
    }],
  },

  // =========================================================================
  // Standard Chartered (360° Rewards)
  // =========================================================================
  {
    card: {
      slug: 'sc-ultimate', bankSlug: 'standard-chartered', name: 'Standard Chartered Ultimate', beancountName: 'Ultimate',
      network: 'visa', pool: { ticker: 'SC_RP', programme: 'SC 360° Rewards' }, active: true,
    },
    rules: [{
      effectiveFrom: '2023-04-02',
      base: { points: 5, per: 150 },
      accelerators: [
        { category: 'utilities', label: 'Utilities/supermarket/insurance/rent/education/govt', multiplier: 0.6, notes: '3 pts/₹150 (reduced) on these categories' },
      ],
      exclusions: ['fuel'],
      excludedMccs: SC_EXCL,
      verified: true,
      notes: 'Official. 5 pts/₹150 (~3.3%), 1 pt = ₹1. No monthly cap. Rent adds 1% fee. ₹99+GST redemption fee. India has no full numeric MCC exclusion list (only rent 6513/7349, fuel).',
    }],
  },
  {
    card: {
      slug: 'sc-smart', bankSlug: 'standard-chartered', name: 'Standard Chartered Smart', beancountName: 'Smart',
      network: 'visa', pool: { ticker: 'SC_CB', programme: 'SC cashback' }, active: true,
    },
    rules: [{
      effectiveFrom: '2024-08-25',
      base: { points: 1, per: 100 },
      accelerators: [
        { category: 'shopping-online', label: 'Online spends', multiplier: 2, monthlyCapPoints: 1000, notes: '2% online, cap ₹1,000/cycle' },
      ],
      exclusions: ['fuel', 'rent', 'wallet'],
      excludedMccs: SC_EXCL,
      verified: true,
      notes: 'Official FAQ. 1% offline cap ₹500/cycle; combined ₹1,500/cycle. Direct cashback. rent 6513/7349 no cashback + 1% fee.',
    }],
  },
  {
    card: {
      slug: 'sc-easemytrip', bankSlug: 'standard-chartered', name: 'Standard Chartered EaseMyTrip', beancountName: 'EaseMyTrip',
      network: 'visa', pool: { ticker: 'SC_RP', programme: 'SC 360° Rewards' }, active: true,
    },
    rules: [{
      effectiveFrom: '2024-10-15',
      base: { points: 2, per: 100 },
      accelerators: [
        { category: 'travel', label: 'Airline/hotel direct sites', multiplier: 5, notes: '10 pts/₹100 on standalone airline/hotel sites (aggregators get base)' },
      ],
      exclusions: ['fuel', 'rent', 'utilities', 'insurance', 'government'],
      excludedMccs: SC_EXCL,
      verified: true,
      notes: 'Official. 1 pt = ₹0.25. EMT instant discounts (10-20% off, ₹1k-10k caps) via code EMTSCB — M3. SC bank-wide reduced categories apply.',
    }],
  },

  // =========================================================================
  // HSBC
  // =========================================================================
  {
    card: {
      slug: 'hsbc-travelone', bankSlug: 'hsbc', name: 'HSBC TravelOne', beancountName: 'TravelOne',
      network: 'visa', pool: { ticker: 'HSBC_PTS', programme: 'HSBC Rewards' }, active: true,
    },
    rules: [{
      effectiveFrom: '2026-02-01',
      base: { points: 2, per: 100 },
      accelerators: [
        { category: 'travel', label: 'Flights / travel aggregators / forex', multiplier: 2, monthlyCapPoints: 50000, notes: '4 pts/₹100; accel capped 50,000 pts/mo' },
      ],
      exclusions: ['fuel', 'rent', 'wallet', 'utilities', 'insurance', 'education', 'government', 'jewellery'],
      excludedMccs: [],
      verified: true,
      notes: 'Official. 1 pt = 1 mile/hotel pt (~20 partners, mostly 1:1). Milestone 10,000 pts at ₹12L/yr. Portal up to 6x. India exclusions category-only (no MCC numbers).',
    }],
  },
  {
    card: {
      slug: 'hsbc-premier', bankSlug: 'hsbc', name: 'HSBC Premier', beancountName: 'Premier',
      network: 'mastercard', pool: { ticker: 'HSBC_PTS', programme: 'HSBC Rewards' }, active: true,
    },
    rules: [{
      effectiveFrom: '2025-08-20',
      base: { points: 3, per: 100 },
      accelerators: [
        { category: 'travel', label: 'Travel with Points (hotels 12x / flights 4x)', multiplier: 1, monthlyCapPoints: 18000, notes: 'Hopper-powered portal; accel capped 18,000 pts/mo' },
      ],
      exclusions: [],
      excludedMccs: [],
      verified: true,
      notes: 'Official. 3 pts/₹100, points never expire (~₹1 best case). Same transfer partners as TravelOne. Rent earns pts but 1% fee. Instant EMI no pts. No published category exclusions ("for now").',
    }],
  },
  {
    card: {
      slug: 'hsbc-live-plus', bankSlug: 'hsbc', name: 'HSBC Live+', beancountName: 'LivePlus',
      network: 'visa', pool: { ticker: 'HSBC_CB', programme: 'HSBC cashback' }, active: true,
    },
    rules: [{
      effectiveFrom: '2026-07-26',
      base: { points: 1.5, per: 100 },
      accelerators: [
        { category: 'dining', label: 'Dining / food delivery / groceries / utilities / shopping', multiplier: 6.67, monthlyCapPoints: 1200, notes: '10% cashback, shared cap ₹1,200/mo (shopping excl. Amazon/Flipkart/Myntra)' },
      ],
      exclusions: ['rent', 'insurance', 'education', 'government', 'fuel', 'wallet', 'jewellery'],
      excludedMccs: HSBC_LIVEPLUS_EXCL,
      verified: true,
      notes: 'MAJOR revaluation eff 26-Jul-2026: intl no longer earns; hospitals 8062 & local transit 4111 newly excluded; forex cut to 1.99%. 1.5% unlimited base. Full numeric MCC list not retrieved.',
    }],
  },

  // =========================================================================
  // IndusInd
  // =========================================================================
  {
    card: {
      slug: 'indusind-qatar-avios', bankSlug: 'indusind', name: 'IndusInd Qatar Airways Avios', beancountName: 'QatarAvios',
      network: 'visa', pool: { ticker: 'AVIOS', programme: 'Qatar Airways Privilege Club (Avios)' }, active: true,
    },
    rules: [{
      effectiveFrom: '2025-04-01',
      base: { points: 3, per: 200 },
      accelerators: [
        { category: 'travel', label: 'qatarairways.com / britishairways.com', multiplier: 1.67, notes: '5 Avios/₹200 on QR & BA direct' },
        { category: 'travel', label: 'Preferred international destination (POS)', multiplier: 2, notes: '6 Avios/₹200 at preferred destinations' },
      ],
      exclusions: ['fuel', 'rent', 'wallet'],
      excludedMccs: [],
      verified: true,
      notes: 'OFFICIAL — indusind.bank.in Avios Visa Infinite page + earn table (browser-verified Jul-2026): base 3 Avios/₹200 (domestic, other international, ONLINE at preferred international destination, and all other spends); 6 Avios/₹200 on POS at the selected preferred INTERNATIONAL destination; 5 Avios/₹200 on Qatar Airways / British Airways website & app; 1 Avios/₹200 on Utilities/Govt/Education/Insurance. Fuel earns 0. Avios earned ONLY up to the assigned credit limit each cycle; credited 10 days after statement. Welcome 20,000 Avios; up to 36,000 bonus Avios/yr milestones (exact tiers per MITC). The 6x (geography) and 5x (QR/BA merchant) rates are condition-specific — M3 matching. ~₹0.80–1.0/Avios (community).',
    }],
  },
  {
    card: {
      slug: 'indusind-legend', bankSlug: 'indusind', name: 'IndusInd Legend', beancountName: 'Legend',
      network: 'visa', pool: { ticker: 'INDUS_RP', programme: 'IndusInd Rewards' }, active: true,
    },
    rules: [{
      effectiveFrom: '2024-12-15',
      base: { points: 1, per: 100 },
      accelerators: [
        { category: 'shopping', label: 'Weekend spends (Sat/Sun)', multiplier: 2, notes: '2 RP/₹100 on weekends (day-of-week = M3); medical/auto/telecom stay 1x' },
      ],
      exclusions: ['fuel', 'rent', 'wallet', 'utilities', 'insurance', 'government', 'education'],
      excludedMccs: [],
      verified: true,
      notes: 'OFFICIAL — indusind.bank.in Legend page (confirmed via Google): 1 RP/₹100 weekdays, 2 RP/₹100 weekends; 1 RP = ₹0.50 cash (resolves the earlier ₹0.75 ambiguity). Milestone 3,000 RP at ₹5L/yr (corrected from 4,000 at ₹6L). Cash-credit capped 5,000 RP/mo; ₹149+GST redemption fee. No numeric MCC list published.',
    }],
  },
  {
    card: {
      slug: 'indusind-eazydiner', bankSlug: 'indusind', name: 'IndusInd EazyDiner', beancountName: 'EazyDiner',
      network: 'visa', pool: { ticker: 'INDUS_RP', programme: 'IndusInd Rewards' }, active: true,
    },
    rules: [{
      effectiveFrom: '2025-07-15',
      base: { points: 4, per: 100 },
      accelerators: [
        { category: 'travel', label: 'Hotels / travel / entertainment / shopping', multiplier: 2.5, notes: '10 RP/₹100' },
      ],
      exclusions: ['fuel'],
      excludedMccs: [],
      verified: true,
      notes: 'OFFICIAL — indusind.bank.in EazyDiner page (confirmed via Google): base 4 RP/₹100; 10 RP/₹100 on hotels/travel/shopping/entertainment; up to 12 RP/₹100 via EazyDiner-app PayEazy. 1 RP = ₹0.10 (PayEazy). Dining value is a 25% PayEazy discount + Prime (cap ₹2,000/mo), not RP. No numeric MCC list.',
    }],
  },

  // =========================================================================
  // AU Small Finance Bank
  // =========================================================================
  {
    card: {
      slug: 'au-ixigo', bankSlug: 'au', name: 'AU ixigo', beancountName: 'Ixigo',
      network: 'rupay', pool: { ticker: 'AU_RP', programme: 'AU Reward Points' }, active: true,
    },
    rules: [{
      effectiveFrom: '2026-04-13',
      base: { points: 5, per: 200 },
      accelerators: [
        { category: 'travel', label: 'ixigo train bookings', multiplier: 4, notes: '~20 RP/₹200 on ixigo trains (secondary)' },
      ],
      exclusions: ['fuel', 'rent', 'wallet', 'education', 'government'],
      excludedMccs: AU_IXIGO_EXCL,
      verified: true,
      notes: 'Official AU T&C (published MCC list). 5 RP/₹200 flat (cut from 10x online 13-Apr-2026). 1 RP = ₹0.50 ixigo Money. Earn cap 10,000 RP/cycle. Utilities/insurance reduced to 1 RP/₹100. Flights/hotels get discounts not points.',
    }],
  },
  {
    card: {
      slug: 'au-zenith', bankSlug: 'au', name: 'AU Zenith', beancountName: 'Zenith',
      network: 'visa', pool: { ticker: 'AU_RP', programme: 'AU Reward Points' }, active: true,
    },
    rules: [{
      effectiveFrom: '2026-01-01',
      base: { points: 3, per: 100 },
      accelerators: [
        { category: 'dining', label: 'Dining', multiplier: 1.67, monthlyCapPoints: 5000, notes: '5 RP/₹100 (cut from 20!), capped 5,000 RP/cycle' },
      ],
      exclusions: ['fuel', 'rent', 'education', 'government', 'commute'],
      excludedMccs: [],
      verified: true,
      notes: 'Official AU Zenith 1-Jan-2026 devaluation, confirmed via Google against au.bank.in figures (page 403s to direct fetch): base 5→3 RP/₹100, dining 20→5, international 10→5, grocery/dept 10→5 (all per ₹100). Utilities/telecom/insurance 1 RP/₹100. Overall cap 25,000 RP/cycle; 1 RP = ₹0.25. New milestone from 1-Jan-2026: ₹50k/cycle → 1,000 bonus RP (old milestones discontinued) — M3. MCCs category-only. Zenith+ (higher milestones, ₹4,999 metal) is the separate card au-zenith-plus.',
    }],
  },
  {
    card: {
      slug: 'au-zenith-plus', bankSlug: 'au', name: 'AU Zenith+', beancountName: 'ZenithPlus',
      network: 'visa', pool: { ticker: 'AU_RP_PREMIUM', programme: 'AU Reward Points' }, active: true,
    },
    rules: [{
      effectiveFrom: '2026-01-01',
      base: { points: 1, per: 100 },
      accelerators: [
        { category: 'travel', label: 'Travel', multiplier: 2, notes: '2 RP/₹100 on travel (Gemini audit mid-2026).' },
        { category: 'dining', label: 'Dining', multiplier: 2, notes: '2 RP/₹100 on dining (Gemini audit mid-2026).' },
      ],
      exclusions: ['fuel'],
      excludedMccs: [],
      verified: false,
      notes: 'AU Zenith+ (₹4,999 metal) — a DISTINCT reward model from base Zenith (Gemini audit mid-2026), NOT a clone: 1 RP/₹100 retail, 2 RP/₹100 on travel/dining/international, and 1 RP = ₹1 (a flat ~1–2% return card, not a multiplier card) → priced on its own AU_RP_PREMIUM commodity. Cash advances/EMIs/fuel earn nothing. Milestones: ₹75k/cycle → 1,000 RP, fee waiver ₹8L, Taj Epicure ₹12L. Forex 0.99%. Community-sourced → verified:false.',
    }],
  },
  {
    card: {
      slug: 'au-lit', bankSlug: 'au', name: 'AU LIT', beancountName: 'LIT',
      network: 'visa', pool: { ticker: 'AU_RP', programme: 'AU Reward Points' }, active: true,
    },
    rules: [{
      effectiveFrom: '2024-09-30',
      base: { points: 1, per: 100 },
      accelerators: [],
      exclusions: ['fuel', 'rent', 'wallet', 'education', 'government', 'insurance'],
      excludedMccs: [],
      verified: true,
      notes: 'OFFICIAL — au.bank.in LIT page (confirmed via Google): base 1 RP/₹100; customisable 5x/10x feature packs (₹199-299 per 90 days) via AU app — chosen packs are M3. 1 RP ≈ ₹0.20. Earn cap 10,000 RP/cycle (cut from 25k, 30-Sep-2024). MCCs category-only.',
    }],
  },

  // =========================================================================
  // IDFC FIRST
  // =========================================================================
  {
    card: {
      slug: 'idfc-vistara', bankSlug: 'idfc-first', name: 'IDFC FIRST Vistara', beancountName: 'Vistara',
      network: 'visa', pool: { ticker: 'MAHARAJA_PTS', programme: 'Air India Maharaja Points (ex-Club Vistara)' }, active: false,
    },
    rules: [{
      effectiveFrom: '2025-04-01',
      base: { points: 6, per: 200 },
      accelerators: [],
      exclusions: ['fuel', 'rent', 'wallet', 'utilities', 'insurance'],
      excludedMccs: [],
      verified: true,
      notes: 'WIND-DOWN CONFIRMED (official IDFC/Air India comms via Google): closed to new applications; existing cards earn spend-based Maharaja Points until 30-Sep-2026, then permanently closed (Vistara->Air India merger). CV Points -> Maharaja 1:1. Renewal/milestone vouchers killed. Legacy base ~6 RP/₹200 (secondary). Marked inactive.',
    }],
  },
  {
    card: {
      slug: 'idfc-wealth', bankSlug: 'idfc-first', name: 'IDFC FIRST Wealth', beancountName: 'Wealth',
      network: 'visa', pool: { ticker: 'IDFC_RP', programme: 'IDFC FIRST Rewards' }, active: true,
    },
    rules: [{
      effectiveFrom: '2026-06-18',
      base: { points: 3, per: 200 },
      accelerators: [
        { category: 'dining', label: 'Dining / travel / international', multiplier: 3.33, notes: '10 RP/₹200 (dining MCC 5812-5814; travel 3000-3350/4511/4722/7011)' },
      ],
      exclusions: ['fuel'],
      excludedMccs: [],
      verified: true,
      notes: 'Official T&C. 1 RP = ₹0.25. rent/govt/wallet/education 3 RP/₹200; insurance/utilities/railway 1 RP/₹200. Travel&Shop app bonus +10-20% (cap 8,000 bonus RP/mo). EMI/fees/BT/cash excluded; txns <₹200 earn 0.',
    }],
  },
  {
    card: {
      slug: 'idfc-mayura', bankSlug: 'idfc-first', name: 'IDFC FIRST Mayura', beancountName: 'Mayura',
      network: 'visa', pool: { ticker: 'IDFC_RP', programme: 'IDFC FIRST Rewards' }, active: true,
    },
    rules: [{
      effectiveFrom: '2026-01-18',
      base: { points: 5, per: 150 },
      accelerators: [],
      spendTiers: [
        { fromMonthlySpend: 20000, points: 10, per: 150, label: 'Incremental spend over ₹20,000/mo', notes: '10 RP/₹150 on all eligible spend above the ₹20k monthly slab (base 5 RP/₹150 below).' },
      ],
      exclusions: ['fuel'],
      excludedMccs: [],
      verified: true,
      notes: 'Official T&C. Metal flagship. 1 RP = ₹0.25 (₹0.50 on app travel). ₹20k monthly spend slab → 10 RP/₹150 (see spendTiers). rent/govt/wallet/education 3 RP/₹150; FASTag/railway/insurance/utilities 1 RP/₹150. App bonus cap 25,000 RP/mo. No numeric MCC list.',
    }],
  },

  // =========================================================================
  // Bank of Baroda (BoBCard)
  // =========================================================================
  {
    card: {
      slug: 'bob-eterna', bankSlug: 'bob', name: 'BoB Eterna', beancountName: 'Eterna',
      network: 'visa', pool: { ticker: 'BOB_RP', programme: 'BoB Rewards' }, active: true,
    },
    rules: [{
      effectiveFrom: '2024-01-01',
      base: { points: 3, per: 100 },
      accelerators: [
        { category: 'shopping-online', label: 'Online / travel / dining / movies / international', multiplier: 5, monthlyCapPoints: 5000, notes: '15 RP/₹100, capped 5,000 RP/cycle' },
      ],
      exclusions: ['fuel', 'rent', 'wallet', 'utilities', 'insurance', 'government', 'education', 'groceries'],
      excludedMccs: BOB_EXCL,
      verified: true,
      notes: 'OFFICIAL rates confirmed via Google (bobcard.co.in Eterna + cardinsider/paisabazaar): 15 RP/₹100 on online/travel/dining/movies/international, 3 RP/₹100 base, accelerated capped 5,000 RP/cycle. 1 RP = ₹0.25. MCC list is BoBCard shared table (Etihad-corroborated).',
    }],
  },
  {
    card: {
      slug: 'bob-premier', bankSlug: 'bob', name: 'BoB Premier', beancountName: 'Premier',
      network: 'visa', pool: { ticker: 'BOB_RP', programme: 'BoB Rewards' }, active: true,
    },
    rules: [{
      effectiveFrom: '2024-01-01',
      base: { points: 2, per: 100 },
      accelerators: [
        { category: 'travel', label: 'Travel / dining / international', multiplier: 5, monthlyCapPoints: 2000, notes: '10 RP/₹100, capped 2,000 RP/cycle (combined)' },
      ],
      exclusions: ['fuel', 'utilities', 'telecom', 'rent', 'wallet', 'insurance', 'government', 'education'],
      excludedMccs: BOB_EXCL,
      verified: true,
      notes: 'OFFICIAL rates confirmed via Google (bobcard.co.in Premier page + cardinsider): 10 RP/₹100 on travel/dining/international, 2 RP/₹100 base, accelerated capped 2,000 RP/mo. 1 RP = ₹0.25. BoBCard expanded MCC exclusions ~1-Apr-2026.',
    }],
  },
  {
    card: {
      slug: 'bob-etihad', bankSlug: 'bob', name: 'BoB Etihad Guest Premium', beancountName: 'EtihadGuest',
      network: 'visa', pool: { ticker: 'ETIHAD_MILES', programme: 'Etihad Guest Miles' }, active: true,
    },
    rules: [{
      effectiveFrom: '2024-01-01',
      base: { points: 2, per: 100 },
      accelerators: [
        { category: 'travel', label: 'Etihad Airways spends', multiplier: 3, notes: 'Premium: 6 Miles/₹100 on Etihad, 2/₹100 other (double the standard card).' },
      ],
      exclusions: ['fuel', 'telecom', 'rent', 'wallet', 'insurance', 'government', 'education', 'groceries'],
      excludedMccs: BOB_EXCL,
      verified: false,
      notes: 'BoB Etihad Guest PREMIUM (fee ₹5,000, fee-waiver ₹5L): 6/₹100 Etihad, 2/₹100 other. The standard variant (bob-etihad-standard) earns half and has different milestones/fee. Full published MCC exclusion table. Earn reconciled to the Premium variant per the mid-2026 audit — community-sourced → verified:false.',
    }],
  },
  {
    card: {
      slug: 'bob-etihad-standard', bankSlug: 'bob', name: 'BoB Etihad Guest', beancountName: 'EtihadStd',
      network: 'visa', pool: { ticker: 'ETIHAD_MILES', programme: 'Etihad Guest Miles' }, active: true,
    },
    rules: [{
      effectiveFrom: '2024-01-01',
      base: { points: 1, per: 100 },
      accelerators: [
        { category: 'travel', label: 'Etihad Airways spends', multiplier: 3, notes: 'Standard: 3 Miles/₹100 on Etihad, 1/₹100 other.' },
      ],
      exclusions: ['fuel', 'telecom', 'rent', 'wallet', 'insurance', 'government', 'education', 'groceries'],
      excludedMccs: BOB_EXCL,
      verified: false,
      notes: 'BoB Etihad Guest STANDARD: 3/₹100 Etihad, 1/₹100 other. The Premium variant (bob-etihad) doubles both. Milestones per Gemini audit mid-2026 (fee-waiver ₹3L). Annual fee ₹2,500 + GST; reduced 1% forex (a key Standard feature). Community-sourced → verified:false.',
    }],
  },

  // ---- Business / professional cards (tax & GST are an eligible earn category,
  // unlike personal cards). Onboarded Jul 2026; earn rates community-sourced
  // (issuer product pages are JS-rendered / MITC PDFs unreadable) → verified:false.
  {
    card: {
      slug: 'hdfc-bizpower', bankSlug: 'hdfc', name: 'HDFC BizPower', beancountName: 'BizPower',
      network: 'visa', pool: { ticker: 'HDFC_RP', programme: 'HDFC Reward Points' }, active: true,
    },
    rules: [{
      effectiveFrom: '2026-05-15',
      base: { points: 5, per: 200 },
      accelerators: [
        { mccs: ['9311'], label: 'Income Tax & GST + bill-pay/ads/Reliance/travel (5X)', multiplier: 5, monthlyCapPoints: 7500, notes: '25 RP/₹200 on IT/GST (MCC 9311) + bill payments, Google/Meta Ads, Reliance Digital, hotel/flight. Unlocks only with ≥₹25k non-IT/GST retail/cycle; 5X cap 7,500 RP/cycle; tax limited to first 2 IT + 2 GST txns/cycle (post-15-May-2026 fair use).' },
      ],
      exclusions: ['fuel', 'rent', 'wallet', 'education'],
      excludedMccs: HDFC_BIZ_EXCL,
      verified: true,
      notes: 'OFFICIAL HDFC BizPower Product-Feature-change PDF (post-15-May-2026): base 5 RP/₹200; 5X (25 RP/₹200) on IT/GST + business categories (unlock ≥₹25k non-tax/cycle); 5X cap 7,500 RP/cycle. Only the first 2 IT + 2 GST txns/cycle earn. Milestone ₹5k voucher on ₹2.5L/qtr — IT/GST/fuel/EMI EXCLUDED. Fee ₹2,500, waiver ₹4L; RP 2-yr expiry.',
    }],
  },
  {
    card: {
      slug: 'hdfc-bizgrow', bankSlug: 'hdfc', name: 'HDFC BizGrow', beancountName: 'BizGrow',
      network: 'rupay', pool: { ticker: 'HDFC_RP', programme: 'HDFC Reward Points' }, active: true,
    },
    rules: [{
      effectiveFrom: '2026-05-15',
      base: { points: 2, per: 150 },
      accelerators: [
        { mccs: ['9311'], label: 'IT/advance-tax, GST, bill-pay, DMart, ClearTax, travel, software (10X)', multiplier: 10, monthlyCapPoints: 1500, notes: '20 CP/₹150 on IT/GST (MCC 9311) + SmartPay/PayZapp bill-pay, DMart, ClearTax, MMT MyBiz hotel/flight, SmartBuy BizDeals software. Unlocks with ≥₹10k/cycle; 10X cap 1,500 CP/cycle (tax shares this bucket). Overall 15,000 CP/cycle.' },
      ],
      exclusions: ['fuel', 'rent'],
      excludedMccs: HDFC_BIZ_EXCL,
      verified: true,
      notes: 'OFFICIAL HDFC BizGrow T&C PDF: base 2 CP/₹150; 10X (20 CP/₹150) on IT/GST + business categories (unlock ≥₹10k/cycle), 10X cap 1,500 CP/cycle, overall 15,000 CP/cycle. Earns CashPoints (modelled as HDFC_RP; realizes ~₹0.20–0.30). Milestone 2,000 CP on ₹1L/qtr — only fuel/rent excluded, so TAX COUNTS. Fee ₹500, waiver ₹1L.',
    }],
  },
  {
    card: {
      slug: 'au-ca-metal', bankSlug: 'au', name: 'AU CA Metal', beancountName: 'CaMetal',
      network: 'visa', pool: { ticker: 'AU_RP', programme: 'AU Reward Points' }, active: true,
    },
    rules: [{
      effectiveFrom: '2026-06-01',
      base: { points: 2, per: 100 },
      accelerators: [
        { category: 'dining', label: 'Dining (8 RP/₹100)', multiplier: 4, monthlyCapPoints: 5000, notes: 'Shared 5,000 RP/cycle cap across the 8X bucket (dining + travel + tax + software).' },
        { category: 'travel', label: 'Travel (8 RP/₹100)', multiplier: 4, monthlyCapPoints: 5000, notes: 'Part of the shared 5,000 RP/cycle 8X bucket.' },
        { mccs: ['9311', '7276'], label: 'Income Tax / GST (8 RP/₹100, MCC-gated)', multiplier: 4, monthlyCapPoints: 5000, notes: 'OFFICIAL AU CA T&C PDF: 8X only under Tax MCC 9311/7276; Government MCC 9399 is EXCLUDED (earns nothing). Shares the 8X bucket cap.' },
      ],
      exclusions: ['fuel', 'rent', 'education'],
      excludedMccs: ['5541', '5542', '5983', '6513'],
      verified: true,
      notes: 'OFFICIAL AU CA Credit Card Reward-Points T&C PDF: base 2 RP/₹100; 8 RP/₹100 on dining/travel/tax/software; utility/telecom/insurance 1 RP/₹100. Tax earns 8X ONLY under MCC 9311/7276; Govt 9399 EXCLUDED. Lifetime-free. The 5,000 RP/cycle 8X cap is community (not stated in the T&C). Welcome 2,000 RP on ₹5k/30d; 1 RP ≈ ₹0.25.',
    }],
  },
  {
    card: {
      slug: 'idfc-business-multiplier', bankSlug: 'idfc-first', name: 'IDFC FIRST Business Multiplier', beancountName: 'BusinessMultiplier',
      pool: { ticker: 'IDFC_RP', programme: 'IDFC FIRST Rewards' }, active: true,
    },
    rules: [{
      effectiveFrom: '2026-01-01',
      base: { points: 1, per: 200 },
      accelerators: [
        { mccs: ['9311'], label: 'GST / Income-Tax (10 RP/₹200)', multiplier: 10, monthlyCapPoints: 5000, notes: '10 RP/₹200 on GST/tax up to ₹1L spend/month, then 5 RP/₹200 beyond (≈5,000 RP at the 10X rate = ₹1L/mo).' },
        { category: 'shopping-online', label: 'UPI > ₹2,000 (3 RP/₹200)', multiplier: 3, notes: 'UPI > ₹2,000 earns 3 RP/₹200 via the companion FIRST Digital RuPay; UPI < ₹2,000 at base.' },
      ],
      exclusions: ['fuel', 'insurance', 'rent'],
      excludedMccs: ['5541', '5542', '5983', '6513'],
      verified: true,
      notes: 'OFFICIAL IDFC Business-Multiplier Product-Guide PDF: GST/tax 10 RP/₹200 up to ₹1L/mo then 5 RP/₹200; base 1 RP/₹200. FD-backed (min FD ₹50k); companion FIRST Digital RuPay for UPI earn. No spend milestone. Fee ₹1,000, waiver ₹5L. 1 RP = ₹0.25, ₹99+GST redemption, points never expire.',
    }],
  },
  {
    card: {
      slug: 'idfc-business-max', bankSlug: 'idfc-first', name: 'IDFC FIRST Business Max', beancountName: 'BusinessMax',
      pool: { ticker: 'IDFC_RP', programme: 'IDFC FIRST Rewards' }, active: true,
    },
    rules: [{
      effectiveFrom: '2026-01-01',
      base: { points: 4, per: 200 },
      accelerators: [
        { category: 'shopping-online', label: 'Domestic online (6 RP/₹200)', multiplier: 1.5, notes: 'Online 6 RP/₹200 vs 4 RP/₹200 offline base. UPI > ₹2,000: 3 RP/₹200; utility/insurance 1 RP/₹200.' },
        { mccs: ['9311'], label: 'GST / Income-Tax (6 RP/₹200)', multiplier: 1.5, notes: 'OFFICIAL: up to 6 RP/₹200 on mandatory business payments incl. GST & taxes (accelerated, NOT the 1 RP/₹200 utility bucket).' },
      ],
      exclusions: ['fuel', 'insurance', 'rent', 'utilities'],
      excludedMccs: ['5541', '5542', '5983', '6513'],
      verified: true,
      notes: 'OFFICIAL idfcfirst.bank.in Business Max page: base 4 RP/₹200 offline, 6 RP/₹200 online, GST/tax up to 6 RP/₹200 (accelerated — corrects the earlier "no tax rate" assumption). FD-backed (min FD ₹10k), requires active GST. Lifetime-free. No milestone. 1 RP = ₹0.25, ₹99+GST redemption, 24-mo expiry, forex 1.5%.',
    }],
  },

  // =========================================================================
  // KOTAK (Jul-2026 onboarding; kotak.bank.in + cardinsider — mostly community)
  // =========================================================================
  {
    card: {
      slug: 'kotak-zen-signature', bankSlug: 'kotak', name: 'Kotak Zen Signature', beancountName: 'ZenSignature',
      network: 'mastercard', pool: { ticker: 'KOTAK_RP', programme: 'Kotak Zen Points' }, active: true,
    },
    rules: [{
      effectiveFrom: '2025-06-01',
      base: { points: 5, per: 150 },
      accelerators: [{ category: 'shopping', label: 'Shopping (apparel/lifestyle/dept/jewellery)', multiplier: 2, notes: '10 Zen Points/₹150.' }],
      exclusions: ['fuel', 'rent', 'wallet', 'government'],
      excludedMccs: KOTAK_EXCL,
      verified: false,
      notes: 'kotak.bank.in (base/fees OFFICIAL) + cardinsider. 5 Zen Points/₹150; 10/₹150 shopping. Overall 6,500 pts/cycle cap (CARD_ACCEL_CAP). Education/insurance capped ₹70k/cycle, utility/telecom ₹50k, govt ₹40k. 1 pt = ₹0.25. Forex 3.5% (community). Network unconfirmed.',
    }],
  },
  {
    card: {
      slug: 'kotak-white-reserve', bankSlug: 'kotak', name: 'Kotak White Reserve', beancountName: 'WhiteReserve',
      network: 'visa', pool: { ticker: 'KOTAK_WP', programme: 'Kotak White Pass' }, active: true,
    },
    rules: [{
      effectiveFrom: '2025-01-01',
      base: { points: 0, per: 100 },
      accelerators: [],
      exclusions: ['fuel', 'rent', 'utilities', 'insurance', 'education', 'commute'],
      excludedMccs: KOTAK_EXCL,
      verified: false,
      notes: 'SLAB model (not per-txn): White Pass earned on cumulative annual spend — modelled as milestones (₹3L→₹5k WP, ₹10L→+₹15k, ₹20L→+₹22k, up to ~₹2.5L at ₹1Cr). base points:0. 1 WP = ₹1 vouchers/travel, ₹0.70 cashback. Fee ₹12,500, waiver ₹10L. Forex 2%. Club Marriott + unlimited lounge. Community (cardinsider/cardmaven).',
    }],
  },
  {
    card: {
      slug: 'kotak-league-platinum', bankSlug: 'kotak', name: 'Kotak League Platinum', beancountName: 'LeaguePlatinum',
      network: 'visa', pool: { ticker: 'KOTAK_RP', programme: 'Kotak Reward Points' }, active: true,
    },
    rules: [{
      effectiveFrom: '2025-06-01',
      base: { points: 4, per: 150 },
      accelerators: [{ category: 'travel', label: 'Travel / dept stores / consumer durables', multiplier: 2, notes: '8 RP/₹150.' }],
      exclusions: ['fuel', 'rent', 'wallet', 'education', 'government', 'insurance'],
      excludedMccs: KOTAK_EXCL,
      verified: false,
      notes: 'kotak.bank.in (OFFICIAL base/fees) + community. 4 RP/₹150 (8 RP/₹150 once annual spend > ₹2L — not machine-encoded). Fee ₹499, waiver ₹50k. Milestone: 4 PVR tickets OR 10,000 RP per ₹1.25L/6-mo. 1 RP = ₹0.07 cash / ₹0.10 catalog (LOW; revised down 1-Jun-2025). Forex unconfirmed.',
    }],
  },
  {
    card: {
      slug: 'kotak-indianoil', bankSlug: 'kotak', name: 'IndianOil Kotak', beancountName: 'IndianOilKotak',
      network: 'rupay', pool: { ticker: 'KOTAK_RP', programme: 'Kotak Reward Points' }, active: true,
    },
    rules: [{
      effectiveFrom: '2025-01-01',
      base: { points: 3, per: 150 },
      accelerators: [
        { category: 'fuel', label: 'IndianOil fuel', multiplier: 8, monthlyCapPoints: 1200, notes: '24 RP/₹150 at IndianOil; cap 1,200 pts/cycle.' },
        { category: 'groceries', label: 'Grocery', multiplier: 4, monthlyCapPoints: 800, notes: '12 RP/₹150; grocery+dining share 800 pts/cycle.' },
        { category: 'dining', label: 'Dining', multiplier: 4, notes: '12 RP/₹150 (within grocery cap).' },
      ],
      exclusions: ['rent', 'wallet'],
      excludedMccs: ['6513', '6540'],
      verified: false,
      notes: 'kotak.bank.in (OFFICIAL): 24 RP/₹150 IndianOil fuel (cap 1,200/cycle), 12 RP/₹150 grocery+dining (cap 800), 3 RP/₹150 else incl UPI. Fee ₹449, waiver ₹50k. 1 RP = ₹0.25 (₹0.20 cashback). Fuel earns (co-brand). Forex 3.5% (community).',
    }],
  },

  // =========================================================================
  // FEDERAL (federal.bank.in + cardinsider; MCC exclusions OFFICIAL, rates community)
  // =========================================================================
  {
    card: {
      slug: 'federal-celesta', bankSlug: 'federal', name: 'Federal Celesta', beancountName: 'Celesta',
      network: 'visa', pool: { ticker: 'FED_RP', programme: 'Federal Rewards' }, active: true,
    },
    rules: [{
      effectiveFrom: '2024-01-01',
      base: { points: 1, per: 100 },
      accelerators: [
        { category: 'dining', label: 'Dining', multiplier: 2, notes: '2 pts/₹100.' },
        { category: 'travel', label: 'Travel & international', multiplier: 3, notes: '3 pts/₹100.' },
      ],
      exclusions: ['fuel', 'wallet', 'rent', 'government'],
      excludedMccs: FEDERAL_EXCL,
      verified: false,
      notes: 'Lifetime-free (OFFICIAL). 1 pt/₹100 base, 2 dining, 3 travel/intl. 1 pt = ₹0.25 portal, ₹99+GST/redemption, 3-yr expiry. Forex 2%. Tax/govt (MCC 9311) excluded from earning (OFFICIAL MITC). Community rates (cardinsider).',
    }],
  },
  {
    card: {
      slug: 'federal-imperio', bankSlug: 'federal', name: 'Federal Imperio', beancountName: 'Imperio',
      network: 'visa', pool: { ticker: 'FED_RP', programme: 'Federal Rewards' }, active: true,
    },
    rules: [{
      effectiveFrom: '2024-01-01',
      base: { points: 1, per: 150 },
      accelerators: [
        { category: 'utilities', label: 'Utility / bill pay', multiplier: 2, notes: '2 pts/₹150.' },
        { category: 'groceries', label: 'Grocery & healthcare', multiplier: 3, notes: '3 pts/₹150.' },
      ],
      exclusions: ['fuel', 'wallet', 'rent', 'government'],
      excludedMccs: FEDERAL_EXCL,
      verified: false,
      notes: 'Lifetime-free (OFFICIAL). 1 pt/₹150 base, 2 utility, 3 grocery/healthcare. 1 pt = ₹0.25 portal, ₹99+GST/redemption, 3-yr expiry. Forex 3.5%. Tax/govt excluded (OFFICIAL). Community rates.',
    }],
  },
  {
    card: {
      slug: 'federal-signet', bankSlug: 'federal', name: 'Federal Signet', beancountName: 'Signet',
      network: 'visa', pool: { ticker: 'FED_RP', programme: 'Federal Rewards' }, active: true,
    },
    rules: [{
      effectiveFrom: '2024-01-01',
      base: { points: 1, per: 200 },
      accelerators: [
        { category: 'entertainment', label: 'Entertainment', multiplier: 2, notes: '2 pts/₹200.' },
        { category: 'shopping', label: 'Electronics & apparel', multiplier: 3, notes: '3 pts/₹200.' },
      ],
      exclusions: ['fuel', 'rent', 'wallet', 'government'],
      excludedMccs: FEDERAL_EXCL,
      verified: false,
      notes: 'Lifetime-free (OFFICIAL). 1 pt/₹200 base, 2 entertainment, 3 electronics/apparel. 1 pt = ₹0.25 portal / ₹0.10 statement, ₹99+GST/redemption. Forex 3.5%. Tax/govt excluded (OFFICIAL). Community rates.',
    }],
  },
  {
    card: {
      slug: 'federal-scapia', bankSlug: 'federal', name: 'Scapia (Federal)', beancountName: 'Scapia',
      network: 'visa', pool: { ticker: 'SCAPIA_COINS', programme: 'Scapia Coins' }, active: true,
    },
    rules: [{
      effectiveFrom: '2024-01-01',
      base: { points: 10, per: 100 },
      accelerators: [{ category: 'travel-portal', label: 'Scapia app travel', multiplier: 2, notes: '20% coins on in-app travel.' }],
      exclusions: ['fuel', 'rent', 'utilities', 'wallet', 'education', 'government'],
      excludedMccs: FEDERAL_EXCL,
      verified: false,
      notes: 'Federal-issued co-brand. 10% Scapia Coins on eligible spend ≥₹20 (=10 coins/₹100), 20% on Scapia-app travel. 5 coins = ₹1, redeemable ONLY in-app for travel (no cash-out). Lifetime-free, 0% forex (but no coins on intl). Lounge on ₹10k/mo spend. 36-mo coin validity. Community (cardinsider/1finance).',
    }],
  },

  // =========================================================================
  // RBL (rbl.bank.in + cardinsider/cardexpert; some T&C OFFICIAL, rates community)
  // =========================================================================
  {
    card: {
      slug: 'rbl-world-safari', bankSlug: 'rbl', name: 'RBL World Safari', beancountName: 'WorldSafari',
      network: 'mastercard', pool: { ticker: 'RBL_RP', programme: 'RBL Travel Points' }, active: true,
    },
    rules: [{
      effectiveFrom: '2024-01-01',
      base: { points: 2, per: 100 },
      accelerators: [{ category: 'travel', label: 'Travel', multiplier: 2.5, notes: '5 Travel Points/₹100.' }],
      exclusions: ['fuel', 'utilities', 'insurance', 'rent', 'wallet', 'government'],
      excludedMccs: RBL_EXCL,
      verified: false,
      notes: 'RBL travel flagship. 5 TP/₹100 travel, 2/₹100 else; NO points on international spend (despite 0% forex). Fee ₹3,000 (offset by ₹3k MMT voucher). Milestones ₹2.5L→10k, ₹5L→+15k, ₹7.5L→₹10k voucher. 1 TP ≈ ₹0.25, ₹99+GST/redemption, 24-mo expiry. 0% forex (OFFICIAL). Community rates.',
    }],
  },
  {
    card: {
      slug: 'rbl-icon', bankSlug: 'rbl', name: 'RBL Icon', beancountName: 'Icon',
      network: 'mastercard', pool: { ticker: 'RBL_RP', programme: 'RBL Reward Points' }, active: true,
    },
    rules: [{
      effectiveFrom: '2024-01-01',
      base: { points: 2, per: 100 },
      accelerators: [
        { category: 'travel', label: 'International spends', multiplier: 10, monthlyCapPoints: 2000, notes: '20 RP/₹100 on intl; cap 2,000/mo.' },
        { category: 'dining', label: 'Weekend dining', multiplier: 10, monthlyCapPoints: 2000, notes: '20 RP/₹100 weekend dining; cap 2,000/mo.' },
      ],
      exclusions: ['fuel', 'rent', 'utilities', 'wallet', 'government', 'insurance', 'education'],
      excludedMccs: RBL_EXCL,
      verified: false,
      notes: 'RBL Icon T&C PDF (OFFICIAL exclusions): 2 RP/₹100 base, 20 RP/₹100 intl + weekend dining (each cap 2,000/mo). Fee ₹5,000, welcome 20,000 RP. Milestones ₹3L→10k, ₹5L→+15k, ₹8L→+20k. 1 RP = ₹0.25, 24-mo expiry. Forex 3.5%.',
    }],
  },
  {
    card: {
      slug: 'rbl-shoprite', bankSlug: 'rbl', name: 'RBL ShopRite', beancountName: 'ShopRite',
      network: 'mastercard', pool: { ticker: 'RBL_RP', programme: 'RBL Reward Points' }, active: true,
    },
    rules: [{
      effectiveFrom: '2024-01-01',
      base: { points: 1, per: 100 },
      accelerators: [{ category: 'groceries', label: 'Grocery', multiplier: 20, monthlyCapPoints: 1000, notes: '20 RP/₹100 grocery; cap 1,000/mo.' }],
      exclusions: ['fuel', 'utilities', 'insurance', 'rent', 'wallet', 'government'],
      excludedMccs: RBL_EXCL,
      verified: false,
      notes: 'Lifetime-free entry card. 20 RP/₹100 grocery (cap 1,000/mo), 1/₹100 else. Welcome 2,000 RP. BookMyShow 10% (max ₹100) up to 15×/yr. 1 RP = ₹0.25, ₹99+GST/redemption, 24-mo expiry. Forex 3.5%. Community rates.',
    }],
  },
  {
    card: {
      slug: 'rbl-indianoil-xtra', bankSlug: 'rbl', name: 'IndianOil RBL XTRA', beancountName: 'IndianOilXtra',
      network: 'rupay', pool: { ticker: 'RBL_FP', programme: 'RBL Fuel Points' }, active: true,
    },
    rules: [{
      effectiveFrom: '2024-01-01',
      base: { points: 2, per: 100 },
      accelerators: [{ category: 'fuel', label: 'IndianOil fuel', multiplier: 7.5, monthlyCapPoints: 2000, notes: '15 Fuel Points/₹100 at IndianOil; cap 2,000/mo.' }],
      exclusions: ['utilities', 'insurance', 'rent', 'education', 'wallet', 'government'],
      excludedMccs: ['4900', '5960', '6300', '6513', '6540', '9311', '9399'],
      verified: false,
      notes: 'rbl.bank.in (OFFICIAL): 15 FP/₹100 IndianOil fuel (cap 2,000/mo), 2/₹100 else. Fee ₹1,500, waiver ₹2.75L. Welcome 3,000 FP. Milestone ₹75k/qtr → 1,000 FP. 1 FP = ₹0.50 redeemable ONLY at IndianOil XTRA. Forex 3.5% (community).',
    }],
  },

  // =========================================================================
  // SBI — additional cards (sbicard.com pages JS-rendered → community-sourced)
  // =========================================================================
  {
    card: {
      slug: 'sbi-bpcl-octane', bankSlug: 'sbi', name: 'BPCL SBI Card Octane', beancountName: 'BpclOctane',
      network: 'visa', pool: { ticker: 'SBI_RP', programme: 'SBI Reward Points' }, active: true,
    },
    rules: [{
      effectiveFrom: '2024-01-01',
      base: { points: 1, per: 100 },
      accelerators: [
        { category: 'fuel', label: 'BPCL fuel', multiplier: 25, monthlyCapPoints: 2500, notes: '25 RP/₹100 at BPCL; cap 2,500/cycle (7.25% value incl. surcharge waiver).' },
        { category: 'groceries', label: 'Grocery / dept / dining / movies', multiplier: 10, monthlyCapPoints: 7500, notes: '10 RP/₹100; cap 7,500/mo.' },
        { category: 'dining', label: 'Dining', multiplier: 10, notes: '10 RP/₹100 (within 10X cap).' },
      ],
      exclusions: ['rent', 'wallet', 'government'],
      excludedMccs: ['6513', '7349', '6540', '6541', '9311', '9399', '9222', '9402'],
      verified: false,
      notes: 'BPCL fuel card. 25 RP/₹100 BPCL fuel (cap 2,500/cycle), 10 RP/₹100 grocery/dept/dining/movies (cap 7,500/mo), 1/₹100 else. Fee ₹1,499, waiver ₹2L; ₹3L→₹2k voucher. Welcome 6,000 RP. 1 RP = ₹0.25, ₹99/redemption. Forex 3.5% (community).',
    }],
  },
  {
    card: {
      slug: 'sbi-aurum', bankSlug: 'sbi', name: 'SBI Aurum', beancountName: 'Aurum',
      network: 'mastercard', pool: { ticker: 'SBI_RP', programme: 'SBI Aurum Reward Points' }, active: true,
    },
    rules: [{
      effectiveFrom: '2024-01-01',
      base: { points: 4, per: 100 },
      accelerators: [],
      exclusions: ['fuel', 'rent', 'wallet', 'government'],
      excludedMccs: SBI_EXCL,
      verified: false,
      notes: 'Ultra-premium. 4 RP/₹100 non-fuel (≈1%). Fee ₹9,999, waiver ₹12L. Milestones: ₹1L/mo→₹1.5k TataCliQ, ₹5L→₹5k, ₹10L→₹10k Taj, ₹20L→₹20k Apple. Welcome 40,000 RP. Points NEVER expire. Transfers: Air India/Qatar Avios/Club ITC 5:1, AirAsia/Adani 4:1. 1 RP = ₹0.25 base. Forex 1.99% (official-adjacent). Unlimited intl lounge.',
    }],
  },
  {
    card: {
      slug: 'sbi-miles-elite', bankSlug: 'sbi', name: 'SBI Card Miles Elite', beancountName: 'MilesElite',
      network: 'visa', pool: { ticker: 'SBI_TC', programme: 'SBI Travel Credits' }, active: true,
    },
    rules: [{
      effectiveFrom: '2024-01-01',
      base: { points: 1, per: 100 },
      accelerators: [{ category: 'travel', label: 'Travel (OTA/taxi/transport)', multiplier: 3, notes: '6 Travel Credits/₹200 = 3/₹100.' }],
      exclusions: ['fuel', 'wallet', 'rent', 'utilities', 'insurance'],
      excludedMccs: ['5541', '5542', '5983', '6540', '6541', '6513', '4900', '5960', '6300', '6381'],
      verified: false,
      notes: 'Travel card. 2 TC/₹200 (1/₹100) base, 6 TC/₹200 (3/₹100) travel. Fee ₹4,999, waiver ₹15L. Welcome 5,000 TC (₹1L/60d); ₹12L→20,000 TC. 25 transfer partners (Air India/Avios/Flying Blue/Asia Miles 1:1; Emirates/United 2:1). TC: ₹0.25 catalog / ₹0.50 portal / ₹1 transfer. Forex 1.99%. Priority Pass 6 intl/yr. Community (magnify/cardexpert).',
    }],
  },
  {
    card: {
      slug: 'sbi-miles-prime', bankSlug: 'sbi', name: 'SBI Card Miles Prime', beancountName: 'MilesPrime',
      network: 'visa', pool: { ticker: 'SBI_TC', programme: 'SBI Travel Credits' }, active: true,
    },
    rules: [{
      effectiveFrom: '2024-01-01',
      base: { points: 1, per: 100 },
      accelerators: [{ category: 'travel', label: 'Travel (OTA/taxi/transport)', multiplier: 2, notes: '4 Travel Credits/₹200 = 2/₹100.' }],
      exclusions: ['fuel', 'wallet', 'rent', 'utilities', 'insurance'],
      excludedMccs: ['5541', '5542', '5983', '6540', '6541', '6513', '4900', '5960', '6300', '6381'],
      verified: false,
      notes: 'Travel card (mid tier). 2 TC/₹200 (1/₹100) base, 4 TC/₹200 (2/₹100) travel. Fee ₹2,999, waiver ₹10L. Welcome 3,000 TC + 3,000 on ₹60k/60d; ₹8L→10,000 TC. Same 25 transfer partners as Elite. TC: ₹0.25 catalog / ₹0.50 portal / ₹1 transfer; 2-yr expiry. Forex 2.5%. Community (magnify).',
    }],
  },

  // =========================================================================
  // EQUITAS (small finance bank; all COMMUNITY — official pages 503'd)
  // =========================================================================
  {
    card: {
      slug: 'equitas-tiga', bankSlug: 'equitas', name: 'Equitas Tiga', beancountName: 'Tiga',
      pool: { ticker: 'EQUITAS_RP', programme: 'Equitas Reward Points' }, active: true,
    },
    rules: [{
      effectiveFrom: '2025-01-01',
      base: { points: 1, per: 100 },
      accelerators: [],
      exclusions: ['fuel', 'rent', 'wallet', 'education', 'government'],
      excludedMccs: EQUITAS_EXCL,
      verified: false,
      notes: 'Entry digital card. 1 RP/₹100 base; 3 RP/₹100 on UPI/contactless/Pay-by-3 (not MCC-modelled). Lifetime-free join, ₹500 annual (waiver ₹50k). 1 RP = ₹0.35 vouchers / ₹0.10–0.15 cashback, 2-yr expiry. Forex 3.4%. Network unconfirmed. Community (cardinsider/piceapp).',
    }],
  },
  {
    card: {
      slug: 'equitas-selfe', bankSlug: 'equitas', name: 'Equitas Selfe', beancountName: 'Selfe',
      network: 'visa', pool: { ticker: 'EQUITAS_RP', programme: 'Equitas Reward Points' }, active: true,
    },
    rules: [{
      effectiveFrom: '2025-01-01',
      base: { points: 2, per: 100 },
      accelerators: [
        { category: 'groceries', label: 'Chosen 5X category', multiplier: 5, monthlyCapPoints: 2000, notes: '10 RP/₹100 on any 2 chosen of apparel/dining/grocery/taxi/utility; grocery/utility cap 2,000/mo.' },
        { category: 'dining', label: 'Chosen 5X category', multiplier: 5, notes: '10 RP/₹100 (cardholder-chosen).' },
      ],
      exclusions: ['fuel', 'wallet', 'rent'],
      excludedMccs: EQUITAS_EXCL,
      verified: false,
      notes: 'Customisable. 2 RP/₹100 base, 5X (10/₹100) on any 2 chosen categories. Tier-linked point VALUE ₹0.35 (Blue) → ₹1.00 (Diamond, ₹1L/mo×3) and forex 3.5% → 0%. Fee ₹1,000 (waiver ₹2.4L). Visa/RuPay choice. OTT welcome. Community (cardinsider/cardmaven).',
    }],
  },
  {
    card: {
      slug: 'equitas-powermiles', bankSlug: 'equitas', name: 'Equitas PowerMiles', beancountName: 'PowerMiles',
      pool: { ticker: 'EQUITAS_RP', programme: 'Equitas Reward Points' }, active: true,
    },
    rules: [{
      effectiveFrom: '2025-01-01',
      base: { points: 3, per: 100 },
      accelerators: [],
      exclusions: ['fuel', 'rent', 'wallet', 'education', 'government'],
      excludedMccs: EQUITAS_EXCL,
      verified: false,
      notes: 'Premium travel. 3 RP/₹100 domestic, 9 RP/₹100 international (intl not MCC-modelled). Tier-linked value ₹0.50 → ₹1.00 (Diamond). Fee ₹5,000 (join waiver ₹1.2L/90d, annual waiver ₹4.8L). Forex 2% (0% net at Diamond via refund). 1:1 airline transfers (BA/United/Finnair/Aeroplan/Etihad/Air India/JAL/IHG/Wyndham) ANNOUNCED for Sep-2026, NOT yet live. Club Marriott + EazyDiner welcome. Network unconfirmed. Community.',
    }],
  },

  // =========================================================================
  // YES BANK (yesbank.in JS-rendered → community: cardinsider/cardmaven/pointsmath)
  // =========================================================================
  {
    card: {
      slug: 'yes-marquee', bankSlug: 'yes', name: 'YES Bank Marquee', beancountName: 'Marquee',
      network: 'visa', pool: { ticker: 'YES_RP', programme: 'YES Rewardz Points' }, active: true,
    },
    rules: [{
      effectiveFrom: '2025-01-01',
      base: { points: 18, per: 200 },
      accelerators: [],
      exclusions: ['fuel', 'rent', 'wallet', 'government', 'insurance', 'education'],
      excludedMccs: YES_EXCL,
      verified: false,
      notes: 'YES flagship. Base modelled at OFFLINE 18 RP/₹200 (2.25%); ONLINE earns 36/₹200 (4.5%, not online/offline-modelled), select categories 10/₹200 — online-rate cap 1,00,000 RP/cycle (CARD_ACCEL_CAP). Fee ₹9,999 join / ₹4,999 renewal, waiver ₹10L. Welcome 40,000 RP. 1 RP = ₹0.25 travel. Forex 1% (community; some sources 2%). 36-mo expiry.',
    }],
  },
  {
    card: {
      slug: 'yes-reserv', bankSlug: 'yes', name: 'YES Bank RESERV', beancountName: 'Reserv',
      network: 'visa', pool: { ticker: 'YES_RP', programme: 'YES Rewardz Points' }, active: true,
    },
    rules: [{
      effectiveFrom: '2025-01-01',
      base: { points: 12, per: 200 },
      accelerators: [],
      exclusions: ['fuel', 'rent', 'wallet', 'government', 'insurance', 'education'],
      excludedMccs: YES_EXCL,
      verified: false,
      notes: 'Ex-"YES First Exclusive". Base OFFLINE 12 RP/₹200 (1.5%); ONLINE 24/₹200, select 6/₹200 (not modelled). Optional paid 3x/5x accelerator plans (₹3,500/₹5,000) not modelled. Base cap 36,000 RP/cycle. Fee ~₹2,499, waiver ₹3L (yr2+). 1 RP = ₹0.25 travel. Forex 1.75%. Community.',
    }],
  },
  {
    card: {
      slug: 'yes-pop-club', bankSlug: 'yes', name: 'YES Bank POP-CLUB', beancountName: 'PopClub',
      network: 'rupay', pool: { ticker: 'POPCOINS', programme: 'POPcoins' }, active: true,
    },
    rules: [{
      effectiveFrom: '2025-01-01',
      base: { points: 2, per: 100 },
      accelerators: [{ category: 'shopping-online', label: 'Online shopping', multiplier: 5, notes: '10 POPcoins/₹100 online (2 offline); +5 on UPI via POP app (UPI not MCC-modelled).' }],
      exclusions: ['rent', 'wallet', 'government'],
      excludedMccs: ['6513', '6540', '9311', '9399'],
      verified: false,
      notes: 'RuPay fintech card (POP ecosystem). 10 POPcoins/₹100 online, 2/₹100 offline, +5 UPI. Lifetime-free through 31-Mar-2027 (then ₹399, waiver ₹1.5L). Welcome 500 POPcoins + vouchers. Milestone 1,500 POPcoins at ₹1.5L. POPcoin up to ₹1 in POP app. Forex 3.4%. Community.',
    }],
  },
  {
    card: {
      slug: 'yes-byoc', bankSlug: 'yes', name: 'YES Bank BYOC', beancountName: 'Byoc',
      network: 'visa', pool: { ticker: 'YES_RP', programme: 'YES Rewardz Points' }, active: true,
    },
    rules: [{
      effectiveFrom: '2025-01-01',
      base: { points: 8, per: 200 },
      accelerators: [],
      exclusions: ['fuel', 'wallet'],
      excludedMccs: YES_EXCL,
      verified: false,
      notes: 'Build-Your-Own-Card: subscription model (₹49/mo rewards plan; ₹249 plastic / ₹3,499 metal one-time). Rewards mode 8 RP/₹200 (1%) OR cashback mode 1%; paid partner plans give up to 10% at Swiggy/Uber/BigBasket/PharmEasy/BMS (not modelled). 1 RP = ₹0.25. Forex 3.5%. No spend fee-waiver. Community.',
    }],
  },

  // =========================================================================
  // OneCard (FPL Technologies; issued via BoB/CSB/Federal/SBM/South Indian/Indian Bank)
  // =========================================================================
  {
    card: {
      slug: 'onecard', bankSlug: 'onecard', name: 'OneCard', beancountName: 'OneCard',
      network: 'visa', pool: { ticker: 'ONECARD_RP', programme: 'OneCard Reward Points' }, active: true,
    },
    rules: [{
      effectiveFrom: '2025-01-06',
      base: { points: 1, per: 50 },
      accelerators: [],
      exclusions: ['fuel', 'rent', 'wallet'],
      excludedMccs: ONECARD_EXCL,
      verified: false,
      notes: 'Metal fintech card (Visa Signature; issued via BoB/CSB/Federal/SBM/South Indian/Indian Bank — identical features). Base 1 RP/₹50 (0.2%). 5X (5 RP/₹50) on your top-2 spend categories/mo, UNLOCK: ≥₹750 in each of ≥3 categories that month; 5X capped 25,000 pts/mo for education/utility/insurance. Lifetime-free. 1 RP = ₹0.10 statement credit; no transfer; points never expire (forfeit if unused 365d). Forex 1%. Base/exclusions OFFICIAL (Federal MITC).',
    }],
  },

  // =========================================================================
  // Slice (North East / Slice Small Finance Bank; UPI credit card)
  // =========================================================================
  {
    card: {
      slug: 'slice', bankSlug: 'slice', name: 'Slice UPI Credit Card', beancountName: 'Slice',
      network: 'rupay', pool: { ticker: 'SLICE_MONIES', programme: 'Slice Monies' }, active: true,
    },
    rules: [{
      effectiveFrom: '2025-07-01',
      base: { points: 1, per: 100 },
      accelerators: [],
      exclusions: ['fuel', 'wallet', 'insurance', 'rent', 'government', 'education'],
      excludedMccs: SLICE_EXCL,
      verified: false,
      notes: 'RuPay UPI-linked credit card (Slice SFB, post-merger Jul-2025). Cashback "monies" (₹1 each): 1% card / 2% UPI base, up to 3% at high Monies+₹5L savings balance (tiers not modelled). Slice Spark = rotating weekly boosts. Lifetime-free, 0% forex. Monies = statement credit only, no transfer. Community (credyfi/barristery; MITC 403).',
    }],
  },

  // =========================================================================
  // IDBI (idbi.bank.in — base/fees OFFICIAL; exclusions community)
  // =========================================================================
  {
    card: {
      slug: 'idbi-royale-signature', bankSlug: 'idbi', name: 'IDBI Royale Signature', beancountName: 'RoyaleSignature',
      network: 'visa', pool: { ticker: 'IDBI_RP', programme: 'IDBI Delight Points' }, active: true,
    },
    rules: [{
      effectiveFrom: '2024-01-01',
      base: { points: 3, per: 100 },
      accelerators: [],
      exclusions: ['fuel', 'insurance', 'government', 'education'],
      excludedMccs: IDBI_EXCL,
      verified: false,
      notes: 'Lifetime-free Visa Signature. 3 Delight Points/₹100. Welcome 750 pts. Milestones ₹2L→1,500, ₹4L→2,000. 1 pt = ₹0.25 (portal only), 3-yr expiry, ₹99+GST/redemption. Forex 3.5%; fuel waiver ₹400–5k cap ₹500/mo. 4 Visa lounge/yr. Base/fees OFFICIAL (idbi.bank.in); exclusions community.',
    }],
  },
  {
    card: {
      slug: 'idbi-euphoria-world', bankSlug: 'idbi', name: 'IDBI Euphoria World', beancountName: 'EuphoriaWorld',
      network: 'mastercard', pool: { ticker: 'IDBI_RP', programme: 'IDBI Delight Points' }, active: true,
    },
    rules: [{
      effectiveFrom: '2024-01-01',
      base: { points: 3, per: 100 },
      accelerators: [{ category: 'travel', label: 'Travel (hotels/airlines/IRCTC/bus)', multiplier: 2, notes: '6 Delight Points/₹100.' }],
      exclusions: ['fuel', 'insurance', 'government', 'education'],
      excludedMccs: IDBI_EXCL,
      verified: false,
      notes: 'Mastercard World. 3 Delight Points/₹100, 6/₹100 travel. Fee ₹1,499 (yr2), waiver ₹1.5L. Welcome 4,000 pts. Milestones ₹2L→1,500, ₹4L→2,000. 1 pt = ₹0.25, 3-yr expiry. 12 domestic lounge/yr. Forex 3.5%. Excludes MF/insurance/govt/education/fuel (community).',
    }],
  },
  {
    card: {
      slug: 'idbi-winnings-select', bankSlug: 'idbi', name: 'IDBI Winnings RuPay Select', beancountName: 'WinningsSelect',
      network: 'rupay', pool: { ticker: 'IDBI_RP', programme: 'IDBI Delight Points' }, active: true,
    },
    rules: [{
      effectiveFrom: '2024-01-01',
      base: { points: 2, per: 100 },
      accelerators: [],
      exclusions: ['fuel', 'insurance', 'government', 'education'],
      excludedMccs: IDBI_EXCL,
      verified: false,
      notes: 'RuPay Select (UPI-linkable). 2 Delight Points/₹100 (2x in birthday month; UPI rate unconfirmed). Fee ₹899, waiver ₹90k. Welcome 10% cashback (max ₹500)/90d + 500 pts. Monthly 500 pts on 5×₹1,000 txns. 1 pt = ₹0.25. 8 domestic + 4 intl lounge/yr. Forex 3.5%. Community.',
    }],
  },
  {
    card: {
      slug: 'idbi-aspire-platinum', bankSlug: 'idbi', name: 'IDBI Aspire Platinum', beancountName: 'AspirePlatinum',
      network: 'visa', pool: { ticker: 'IDBI_RP', programme: 'IDBI Delight Points' }, active: true,
    },
    rules: [{
      effectiveFrom: '2024-01-01',
      base: { points: 2, per: 150 },
      accelerators: [],
      exclusions: ['fuel', 'insurance', 'government', 'education'],
      excludedMccs: IDBI_EXCL,
      verified: false,
      notes: 'Lifetime-free Visa Platinum. 2 Delight Points/₹150 (≈1.33/₹100). Welcome 500 activation + 500 on ₹1.5k/30d. Milestones ₹1L→1,000, ₹2L→1,500. 1 pt = ₹0.25, 3-yr expiry. Forex 3.5%. Community/official mix (idbi.bank.in).',
    }],
  },
  {
    card: {
      slug: 'idbi-imperium-platinum', bankSlug: 'idbi', name: 'IDBI Imperium Platinum', beancountName: 'ImperiumPlatinum',
      network: 'visa', pool: { ticker: 'IDBI_RP', programme: 'IDBI Delight Points' }, active: true,
    },
    rules: [{
      effectiveFrom: '2024-01-01',
      base: { points: 2, per: 150 },
      accelerators: [],
      exclusions: ['fuel', 'insurance', 'government', 'education'],
      excludedMccs: IDBI_EXCL,
      verified: false,
      notes: 'Visa Platinum, fee ₹499 (waiver ₹75k). 2 Delight Points/₹150. Welcome 500 activation + 500 on ₹1.5k/30d. Milestones ₹1L→1,000, ₹2L→1,500. 1 pt = ₹0.25, 3-yr expiry. Forex 3.5%. Official/community (idbi.bank.in).',
    }],
  },

  // =========================================================================
  // TIER-2 PSU issuers (fees often OFFICIAL; earn/exclusions thin → community)
  // =========================================================================
  // ---- PNB (pnbcard.in SOFC/KFS OFFICIAL for fees/forex; earn community) ----
  {
    card: {
      slug: 'pnb-rupay-select', bankSlug: 'pnb', name: 'PNB RuPay Select', beancountName: 'RupaySelect',
      network: 'rupay', pool: { ticker: 'PNB_RP', programme: 'PNB Reward Points' }, active: true,
    },
    rules: [{
      effectiveFrom: '2024-09-01',
      base: { points: 2, per: 150 },
      accelerators: [],
      exclusions: ['fuel', 'rent', 'wallet', 'government'],
      excludedMccs: PSU_EXCL,
      verified: false,
      notes: 'PNB RuPay Select. 2 RP/₹150; up to 5X at partner merchants (unlisted). Fee ₹500/₹750 (OFFICIAL SOFC), waiver on quarterly use. 1 RP = ₹0.25 (from 1-Sep-2024, was ₹0.50). Forex 3.5% (OFFICIAL). Fuel waiver ₹500–4k cap ₹350/cycle. 3-yr expiry.',
    }],
  },
  {
    card: {
      slug: 'pnb-visa-signature', bankSlug: 'pnb', name: 'PNB Visa Signature', beancountName: 'VisaSignature',
      network: 'visa', pool: { ticker: 'PNB_RP', programme: 'PNB Reward Points' }, active: true,
    },
    rules: [{
      effectiveFrom: '2024-09-01',
      base: { points: 2, per: 150 },
      accelerators: [],
      exclusions: ['fuel', 'rent', 'wallet', 'government'],
      excludedMccs: PSU_EXCL,
      verified: false,
      notes: 'PNB Visa Signature. 2 RP/₹150. Fee ₹1,500/₹2,000 (OFFICIAL SOFC), waiver ₹3L. 1 RP = ₹0.25. Forex 3.5%. Fuel waiver cap ₹350/cycle. Community earn.',
    }],
  },
  {
    card: {
      slug: 'pnb-luxura', bankSlug: 'pnb', name: 'PNB LUXURA Metal', beancountName: 'Luxura',
      network: 'visa', pool: { ticker: 'PNB_RP', programme: 'PNB Reward Points' }, active: true,
    },
    rules: [{
      effectiveFrom: '2024-09-01',
      base: { points: 4, per: 100 },
      accelerators: [
        { category: 'dining', label: 'Dining', multiplier: 3, notes: '12 RP/₹100 (community).' },
        { category: 'travel', label: 'Travel', multiplier: 3, notes: '12 RP/₹100 (community).' },
      ],
      exclusions: ['fuel', 'rent', 'wallet', 'government'],
      excludedMccs: PSU_EXCL,
      verified: false,
      notes: 'PNB flagship metal (Visa Infinite). 4 RP/₹100, 12 RP/₹100 dining/travel (community). Fee ₹4,999 join (reimbursed on ₹1.5L/3-cycle) + ₹1,999 annual (waiver ₹6L). NIL forex (OFFICIAL SOFC). Milestones ₹5L→10k, ₹10L→14k, ₹15L→26k RP (community). 1 RP = ₹0.25. Lounge/concierge.',
    }],
  },
  // ---- Canara (canarabank.bank.in; LTF, flat ₹0.25) ----
  {
    card: {
      slug: 'canara-rupay-select', bankSlug: 'canara', name: 'Canara RuPay Select', beancountName: 'RupaySelect',
      network: 'rupay', pool: { ticker: 'CANARA_RP', programme: 'Canara Rewardz' }, active: true,
    },
    rules: [{
      effectiveFrom: '2025-04-01',
      base: { points: 2, per: 100 },
      accelerators: [],
      exclusions: ['fuel', 'rent', 'wallet', 'government'],
      excludedMccs: PSU_EXCL,
      verified: false,
      notes: 'Canara RuPay Select. 2 Rewardz/₹100 (₹0.25 → 0.5%). PLUS 5% cashback on utilities + dining, each capped ₹50/mo (separate from points, not modelled). Lifetime-free (₹300 inactivity if <₹1L/yr). Lounge on ₹10k/qtr. Forex ~3%. 3-yr expiry. Official + community.',
    }],
  },
  {
    card: {
      slug: 'canara-mastercard-world', bankSlug: 'canara', name: 'Canara Mastercard World', beancountName: 'MastercardWorld',
      network: 'mastercard', pool: { ticker: 'CANARA_RP', programme: 'Canara Rewardz' }, active: true,
    },
    rules: [{
      effectiveFrom: '2025-01-01',
      base: { points: 2, per: 100 },
      accelerators: [],
      exclusions: ['fuel', 'rent', 'wallet', 'government'],
      excludedMccs: PSU_EXCL,
      verified: false,
      notes: 'Canara Mastercard World. 2 Rewardz/₹100 (0.5%). Lifetime-free (₹300 inactivity if <₹1L). 3 domestic (+2 guest)/qtr + 2 intl/yr lounge. Forex 3%. 1 pt = ₹0.25. Community.',
    }],
  },
  {
    card: {
      slug: 'canara-visa-signature', bankSlug: 'canara', name: 'Canara Visa Signature', beancountName: 'VisaSignature',
      network: 'visa', pool: { ticker: 'CANARA_RP', programme: 'Canara Rewardz' }, active: true,
    },
    rules: [{
      effectiveFrom: '2025-01-01',
      base: { points: 2, per: 100 },
      accelerators: [],
      exclusions: ['fuel', 'rent', 'wallet', 'government'],
      excludedMccs: PSU_EXCL,
      verified: false,
      notes: 'Canara Visa Signature. 2 Rewardz/₹100 (0.5%). Lifetime-free (₹1,000 inactivity if <₹2L). 12 domestic + 4 intl lounge/yr. Forex ~3%. 1 pt = ₹0.25, 3-yr expiry. Community + official.',
    }],
  },
  // ---- Union (unionbankofindia.bank.in) ----
  {
    card: {
      slug: 'union-uni-carbon', bankSlug: 'union', name: 'Union Uni-Carbon (HPCL)', beancountName: 'UniCarbon',
      network: 'rupay', pool: { ticker: 'UNION_RP', programme: 'Union Rewardz' }, active: true,
    },
    rules: [{
      effectiveFrom: '2024-01-01',
      base: { points: 2, per: 100 },
      accelerators: [{ category: 'fuel', label: 'HPCL fuel', multiplier: 8, monthlyCapPoints: 150, notes: '16 Rewardz/₹100 at HPCL (≥₹500); cap 150/cycle.' }],
      exclusions: ['rent', 'wallet', 'government'],
      excludedMccs: ['6513', '6540', '9311', '9399'],
      verified: false,
      notes: 'Union HPCL co-brand. 16 Rewardz/₹100 HPCL fuel (cap 150/cycle) + 1.5% HP Pay cashback, 2/₹100 else. Fee ₹499/₹499, waiver ₹1L. Milestone 500 pts at ₹1.25L. 1 pt = ₹0.25, 36-mo expiry. Forex 3% (OFFICIAL). Fuel earns (co-brand).',
    }],
  },
  {
    card: {
      slug: 'union-rupay-select', bankSlug: 'union', name: 'Union RuPay Select', beancountName: 'RupaySelect',
      network: 'rupay', pool: { ticker: 'UNION_RP', programme: 'Union Rewardz' }, active: true,
    },
    rules: [{
      effectiveFrom: '2024-01-01',
      base: { points: 4, per: 100 },
      accelerators: [],
      exclusions: ['fuel', 'rent', 'wallet', 'government'],
      excludedMccs: PSU_EXCL,
      verified: false,
      notes: 'Union RuPay Select. 4 Rewardz/₹100 (1%). Fee nil join / ₹499 (waiver ₹50k). 8 domestic + 2 intl lounge/yr. 1 pt = ₹0.25, 36-mo expiry. Forex 3%. Community + official.',
    }],
  },
  {
    card: {
      slug: 'union-visa-signature', bankSlug: 'union', name: 'Union Visa Signature', beancountName: 'VisaSignature',
      network: 'visa', pool: { ticker: 'UNION_RP', programme: 'Union Rewardz' }, active: true,
    },
    rules: [{
      effectiveFrom: '2024-01-01',
      base: { points: 4, per: 100 },
      accelerators: [],
      exclusions: ['fuel', 'rent', 'wallet', 'government'],
      excludedMccs: PSU_EXCL,
      verified: false,
      notes: 'Union Visa Signature. 4 Rewardz/₹100 (1%). Fee nil join / ₹1,999 (waiver ₹2.7L). 4 domestic lounge/yr. 1 pt = ₹0.25, 36-mo expiry. Forex 3%. Community + official.',
    }],
  },
  // ---- BOI / Indian Bank / BOM (very thin; estimates) ----
  {
    card: {
      slug: 'boi-rupay-select', bankSlug: 'boi', name: 'BOI RuPay Select', beancountName: 'RupaySelect',
      network: 'rupay', pool: { ticker: 'BOI_RP', programme: 'BOI Star Rewardz' }, active: true,
    },
    rules: [{
      effectiveFrom: '2024-01-01',
      base: { points: 2, per: 100 },
      accelerators: [],
      exclusions: ['fuel', 'rent', 'wallet', 'government'],
      excludedMccs: PSU_EXCL,
      verified: false,
      notes: 'BOI RuPay Select (Star Rewardz). ~2 pts/₹100 (2X POS/ecom; denominator inferred). Fee nil join / ₹800. 8 domestic + 2 intl lounge/yr, Amazon Prime, Swiggy One. 1-yr point expiry (short). ₹/pt undisclosed (~₹0.25 est). Forex 3%. Community (BOI site 403).',
    }],
  },
  {
    card: {
      slug: 'indian-bank-rupay-select', bankSlug: 'indian-bank', name: 'Indian Bank RuPay Select', beancountName: 'RupaySelect',
      network: 'rupay', pool: { ticker: 'INDIANBANK_RP', programme: 'Indian Bank Rewards' }, active: true,
    },
    rules: [{
      effectiveFrom: '2024-01-01',
      base: { points: 1, per: 100 },
      accelerators: [],
      exclusions: ['fuel', 'rent', 'wallet', 'government'],
      excludedMccs: PSU_EXCL,
      verified: false,
      notes: 'Indian Bank RuPay Select. ~1 pt/₹100 (community). Fee nil join / ₹250–500 (conflicting), waiver ₹50k. 2 domestic + 4 intl lounge/yr. ₹/pt undisclosed (~₹0.25 est; a lone source claims ₹1 — outlier). Very thin data.',
    }],
  },
  {
    card: {
      slug: 'bom-rupay-platinum', bankSlug: 'bom', name: 'BoM Platinum RuPay', beancountName: 'PlatinumRupay',
      network: 'rupay', pool: { ticker: 'BOM_RP', programme: 'BoM Reward Points' }, active: true,
    },
    rules: [{
      effectiveFrom: '2024-01-01',
      base: { points: 1, per: 100 },
      accelerators: [],
      exclusions: ['fuel', 'rent', 'wallet', 'government'],
      excludedMccs: PSU_EXCL,
      verified: false,
      notes: 'Bank of Maharashtra own-brand Platinum RuPay. 1 pt/₹100. Welcome 100 pts on ₹1k. Free yr1, waiver ₹30k. ₹/pt undisclosed (~₹0.25 est). Fuel waiver ₹500–4k. Community. (BOM also sells SBI co-brands on SBI_RP — not modelled.)',
    }],
  },

  // =========================================================================
  // TIER-3 (DBS + genuine small-bank cards + Jupiter Edge; community — dbs 403)
  // =========================================================================
  {
    card: {
      slug: 'dbs-vantage', bankSlug: 'dbs', name: 'DBS Vantage', beancountName: 'Vantage',
      network: 'visa', pool: { ticker: 'DBS_VP', programme: 'DBS Vantage Points' }, active: true,
    },
    rules: [{
      effectiveFrom: '2024-01-01',
      base: { points: 4, per: 200 },
      accelerators: [],
      exclusions: ['fuel', 'wallet', 'rent', 'government'],
      excludedMccs: DBS_EXCL,
      verified: false,
      notes: 'Invite-only Visa Infinite metal. 4 VP/₹200 (2%) domestic; 8 VP/₹200 (4%) international (not modelled). 1 VP = ₹1 (DBS Delights/statement). Fee ₹10k–50k tiered, waiver ₹10L. Welcome 10,000 VP + hotel membership. Milestones ₹3L/qtr→5k, ₹5L/qtr→10k, ₹20L/yr→40k VP. Forex 0% SG / 1.75% else. 2-yr expiry. Unlimited lounge + golf. Community (dbs.bank.in 403). T&C revised 10-Jul-2026.',
    }],
  },
  {
    card: {
      slug: 'dbs-spark', bankSlug: 'dbs', name: 'DBS Spark', beancountName: 'Spark',
      network: 'visa', pool: { ticker: 'DBS_CP', programme: 'DBS Cash Points' }, active: true,
    },
    rules: [{
      effectiveFrom: '2024-01-01',
      base: { points: 2, per: 200 },
      accelerators: [],
      exclusions: ['fuel', 'wallet', 'rent', 'government'],
      excludedMccs: DBS_EXCL,
      verified: false,
      notes: 'DBS Spark family (Spark5/10/20; modelled on Spark10). Base 2 CP/₹200 (1 CP=₹0.20 → 0.2%); accelerated 5x/10x/20x by variant on spend-threshold-triggered online/offline/dining-util-grocery (not modelled). Fee ₹499/₹999/₹1,499 by tier (Spark10 ₹999, waiver ₹2L). Quarterly milestone bonus. 1 CP = ₹0.20; ₹99+GST/redemption. Forex 3.5%. Community.',
    }],
  },
  {
    card: {
      slug: 'kvb-honour', bankSlug: 'kvb', name: 'KVB Honour', beancountName: 'Honour',
      network: 'visa', pool: { ticker: 'KVB_RP', programme: 'KVB Reward Points' }, active: true,
    },
    rules: [{
      effectiveFrom: '2024-01-01',
      base: { points: 3, per: 150 },
      accelerators: [
        { category: 'dining', label: 'Dining/medical/movies/rail', multiplier: 2, notes: '2x (community).' },
        { category: 'travel', label: 'Travel/hotels/air', multiplier: 4, notes: '4x (community).' },
      ],
      exclusions: ['rent', 'wallet', 'government'],
      excludedMccs: KVB_EXCL,
      verified: false,
      notes: 'Karur Vysya Bank flagship (Visa). 3 RP/₹150 base, 2x dining/medical/movies/rail, 4x travel/hotels/air. Welcome 700 pts. Fee nil join / ₹999 (waiver ₹3L). ₹/pt NOT disclosed (~₹0.25 est). ₹99/redemption, 3-yr expiry. Fuel earns (1% surcharge waived ₹500–4k cap ₹200/cycle). Forex 3.5%. Community.',
    }],
  },
  {
    card: {
      slug: 'jupiter-edge', bankSlug: 'jupiter', name: 'Jupiter Edge (CSB)', beancountName: 'Edge',
      network: 'rupay', pool: { ticker: 'JUPITER_JEWELS', programme: 'Jupiter Jewels' }, active: true,
    },
    rules: [{
      effectiveFrom: '2026-06-01',
      base: { points: 5, per: 100 },
      accelerators: [],
      exclusions: ['wallet', 'rent', 'insurance', 'education'],
      excludedMccs: JUPITER_EXCL,
      verified: false,
      notes: 'Jupiter Edge (standard), CSB Bank RuPay, lifetime-free. 5 Jewels/₹100 base incl. UPI. Jewel = ₹0.14 statement / ₹0.20 vouchers-gold-flights (devalued 1-Jun-2026); Air India 6:1. Forex 3.5%. Non-expiring. Official KFS + community.',
    }],
  },
  {
    card: {
      slug: 'jupiter-edge-plus', bankSlug: 'jupiter', name: 'Jupiter Edge+ (CSB)', beancountName: 'EdgePlus',
      network: 'rupay', pool: { ticker: 'JUPITER_JEWELS', programme: 'Jupiter Jewels' }, active: true,
    },
    rules: [{
      effectiveFrom: '2026-06-01',
      base: { points: 5, per: 100 },
      accelerators: [
        { category: 'shopping-online', label: 'Partner brands (Amazon/Flipkart/Myntra/…)', multiplier: 10, monthlyCapPoints: 10000, notes: '50 Jewels/₹100; cap 10,000/mo (3,000/merchant, 1,000/txn).' },
        { category: 'travel-portal', label: 'Jupiter Flights', multiplier: 5, monthlyCapPoints: 5000, notes: '25 Jewels/₹100; cap 5,000/mo.' },
      ],
      exclusions: ['wallet', 'rent', 'insurance', 'education'],
      excludedMccs: JUPITER_EXCL,
      verified: false,
      notes: 'Jupiter Edge+ (premium), CSB Bank RuPay. Fee ₹999 join / ₹0 annual (LTF). 5 Jewels/₹100 base; 50/₹100 partner shopping (cap 10k/mo), 25/₹100 Jupiter Flights (cap 5k/mo) — external OTA accel removed 1-Jun-2026. Jewel ₹0.14 statement / ₹0.20 voucher; Air India 6:1. Forex 3.5%. Community + official KFS.',
    }],
  },
]
