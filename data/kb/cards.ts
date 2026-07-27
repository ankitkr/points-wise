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
      network: 'visa', pool: { ticker: 'HDFC_RP', programme: 'HDFC Reward Points' }, active: true,
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
      network: 'diners', pool: { ticker: 'HDFC_RP', programme: 'HDFC Reward Points' }, active: true,
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
      network: 'visa', pool: { ticker: 'HDFC_RP', programme: 'HDFC Reward Points' }, active: true,
    },
    rules: [{
      effectiveFrom: '2025-07-01',
      base: { points: 5, per: 150 },
      accelerators: [
        { category: 'travel-portal', label: 'SmartBuy (hotels 10x / flights 5x)', multiplier: 2, monthlyCapPoints: 10000, notes: '5x business accel needs >=₹50k/mo spend; capped 10,000 RP/cycle' },
      ],
      exclusions: ['fuel', 'rent', 'wallet', 'government'],
      excludedMccs: HDFC_EXCL,
      verified: false,
      notes: 'Business card; caps mirror Diners Black (secondary-sourced). Insurance 5,000 RP/mo, grocery 2,000 RP/mo.',
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
      notes: 'Official Marriott/HDFC Bonvoy T&C (pre-15-May-2026 version). Free Night Awards (<=15k pts) at ₹6L/₹9L/₹15L annual spend + welcome/renewal FNA + Silver Elite — milestones are M3. Voucher/gift-card purchases excluded from earn.',
    }, {
      // Devaluation effective 15-May-2026 (append-only new version).
      effectiveFrom: '2026-05-15',
      base: { points: 2, per: 200 },
      accelerators: [
        { category: 'travel', label: 'Marriott hotels', multiplier: 4, notes: '8 Bonvoy pts/₹200 at Marriott properties (post-15-May-2026)' },
        { category: 'dining', label: 'Travel / dining / entertainment', multiplier: 2, notes: '4 pts/₹200' },
      ],
      exclusions: ['fuel', 'rent', 'wallet', 'government'],
      excludedMccs: HDFC_EXCL,
      verified: false,
      notes: 'Devaluation 15-May-2026: earn shifted to per-₹200 (from ₹150), ~25% cut; a 1.75% DCC markup was introduced (distinct from the standard forex markup, so not added as a surcharge). Secondary — Grok sweep 2026-07-27 citing CardExpress/Business Standard; confirm vs official MITC before flipping verified.',
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
      verified: false,
      notes: '1 NeuCoin = ₹1 in Tata ecosystem. RuPay UPI 1.5% capped 500 NeuCoins/mo; grocery capped 2,000/mo. Secondary + HDFC page.',
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
      verified: false,
      notes: 'Apr-2026 revision official; exact caps secondary. 10% Swiggy/Zomato/BigBasket replaced by Zomato/Blinkit/District wallet value-back (cap ₹200/partner/mo).',
    }],
  },

  // =========================================================================
  // ICICI (ICICI RP; co-brands run own currencies)
  // =========================================================================
  {
    card: {
      slug: 'icici-emeralde', bankSlug: 'icici', name: 'ICICI Emeralde Private Metal', beancountName: 'Emeralde',
      network: 'mastercard', pool: { ticker: 'ICICI_RP', programme: 'ICICI Reward Points' }, active: true,
    },
    rules: [{
      effectiveFrom: '2024-11-15',
      base: { points: 6, per: 200 },
      accelerators: [],
      exclusions: ['fuel', 'rent', 'wallet', 'government'],
      excludedMccs: ICICI_EXCL,
      verified: true,
      notes: 'Official MITC. 6 RP/₹200; up to ₹1/RP on air-miles/premium redemption. Per-cycle point caps: grocery/education/utility 1,000 RP each, insurance 5,000 RP; transport capped ₹20k spend/mo (eff 15-Jan-2026).',
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
        { category: 'fuel', label: 'Fuel', multiplier: 2, monthlyCapPoints: 5000, notes: '5 MR/₹100, cap ~5,000 MR/mo — only Amex India card still earning on fuel' },
        { category: 'travel', label: 'Foreign-currency spends', multiplier: 3, notes: '3x MR on forex (4.13% markup)' },
      ],
      exclusions: ['utilities', 'telecom', 'insurance', 'government'],
      excludedMccs: [],
      verified: false,
      notes: 'Charge card; MR ~₹0.50-1.0+ via transfers. Welcome/renewal vouchers campaign-dependent (M3). Fee ₹60,000+GST.',
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
      verified: false,
      notes: 'Single card (Avios Visa Infinite) — no separate Signature/Infinite tiers. ~₹0.80-1.0/Avios (community). Reduced 1 Avios/₹200 on utilities/govt/education/insurance. Welcome 20k + milestones 18k at ₹8L/₹16L (M3). Official T&C image-based; MCCs unavailable.',
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
      verified: false,
      notes: '~₹0.50/RP cash (official blog says ₹0.75 — verify). Milestone 4,000 RP at ₹6L/yr. Cash-credit capped 5,000 RP/mo; ₹149+GST redemption fee. No numeric MCC list published.',
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
      verified: false,
      notes: 'Signature variant. 1 RP = ₹0.10 (PayEazy only). ZERO RP on dining since 15-Jul-2025 (value = 25% PayEazy discount + Prime, cap ₹2,000/mo). No numeric MCC list.',
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
      verified: false,
      notes: '1 RP = ₹0.25. Devalued 1-Jan-2026 (base 5->3). Overall cap 25,000 RP/cycle. International/grocery 5 RP/₹100; utilities/telecom/insurance 1 RP/₹100. aubank.in 403 — MCCs category-only.',
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
      verified: false,
      notes: 'Customisable: toggleable 5x/10x feature packs (₹199-299/90d) via AU app — chosen packs are M3. 1 RP ≈ ₹0.20. Earn cap 10,000 RP/cycle (cut from 25k, 30-Sep-2024). MCCs category-only.',
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
      verified: false,
      notes: 'BEING WOUND DOWN: closed to new applications; existing cards earn until 30-Sep-2026 then permanently closed (Vistara->Air India merger). CV Points -> Maharaja 1:1. Renewal/milestone perks killed 31-Mar-2025. Marked inactive.',
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
      verified: false,
      notes: '1 RP = ₹0.25. bobcard.co.in TLS-blocked; rates secondary (CardInsider/CardExpert). MCC list is BoBCard shared table (Etihad-corroborated).',
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
      verified: false,
      notes: '1 RP = ₹0.25. Secondary-sourced (TLS-blocked official). BoBCard expanded MCC exclusions ~1-Apr-2026.',
    }],
  },
  {
    card: {
      slug: 'bob-etihad', bankSlug: 'bob', name: 'BoB Etihad Guest', beancountName: 'EtihadGuest',
      network: 'visa', pool: { ticker: 'ETIHAD_MILES', programme: 'Etihad Guest Miles' }, active: true,
    },
    rules: [{
      effectiveFrom: '2024-01-01',
      base: { points: 1, per: 100 },
      accelerators: [
        { category: 'travel', label: 'Etihad Airways spends', multiplier: 3, notes: '3 Miles/₹100 on Etihad (Premium variant: 6/₹100 Etihad, 2/₹100 other)' },
      ],
      exclusions: ['fuel', 'telecom', 'rent', 'wallet', 'insurance', 'government', 'education', 'groceries'],
      excludedMccs: BOB_EXCL,
      verified: true,
      notes: 'Etihad Guest Miles. Standard: 3/₹100 Etihad, 1/₹100 other. Premium variant doubles both. Full published MCC exclusion table (BoBCard standard) — corroborated across multiple sources.',
    }],
  },
]
