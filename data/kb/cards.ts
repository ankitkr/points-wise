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
]
