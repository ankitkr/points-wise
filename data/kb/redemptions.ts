import type { RedemptionInput } from '@/lib/kb/schema'

// How each card's points redeem/transfer + rough ₹/point + the caps that gate
// it. Keyed by card slug, merged into the rule at seed time (like surcharges /
// milestones). transferPartners now carry the FULL per-partner ratio roster (a
// point's real value is which partner it reaches and at what ratio — Infinia→
// KrisFlyer is 1:1 but →Accor is 2:1; Magnus is mostly 5:2 with 5:1 exceptions).
// Researched July 2026 — partner rosters are well-corroborated across community
// sources (pointsmath/cardexpert/cardinsider/savesage/LiveFromALounge) but not
// all read off issuer PDFs, so most stay verified:false; official reads flip true.
// Post-April-2026 Axis cull captured (Accor/Marriott removed; Qatar re-added Jul
// 2026 at a worse ratio). Cross-checked vs Grok/X pass (SmartBuy 70%, BizBlack
// 75k, SBI 60k/mo, IDFC ₹1L/₹2L, Amex MR 2:1, Etihad dropped from Amex 1-Jul-2026).
//
// pointExpiryMonths is OMITTED where points never expire (schema requires a
// positive int) — "no expiry" is stated in notes instead.

const cashbackAuto = (notes: string): RedemptionInput => ({
  methods: [{ method: 'cashback', valuePerPoint: 1.0, notes }],
  transferPartners: [],
  source: 'official', // cashback 1 unit = ₹1 is an issuer-designed rate, not an estimate
  verified: false,
  notes: 'Direct cashback / auto statement-credit — 1 point ≈ ₹1; no transfer partners.',
})

type Partners = NonNullable<RedemptionInput['transferPartners']>

// HDFC Infinia + Diners Club Black share ONE SmartBuy roster (identical ratios).
// Split 1:1 vs 2:1 — the 1:1 partners are the ones worth transferring to.
// Turkish & Avianca were devalued 1:1→2:1; Accor also 2:1. (community: pointsmath/
// cardinsider/milesahead, corroborated across 3; not read off HDFC MITC.)
const HDFC_PREMIUM_PARTNERS: Partners = [
  { partner: 'Singapore Airlines KrisFlyer', kind: 'airline', ratio: '1:1', valuePerPoint: 1.0 },
  { partner: 'Air France-KLM Flying Blue', kind: 'airline', ratio: '1:1', valuePerPoint: 1.0 },
  { partner: 'Finnair Plus', kind: 'airline', ratio: '1:1', valuePerPoint: 1.0 },
  { partner: 'Vietnam Airlines LotusMiles', kind: 'airline', ratio: '1:1', valuePerPoint: 1.0 },
  { partner: 'AirAsia Rewards', kind: 'airline', ratio: '1:1', valuePerPoint: 1.0 },
  { partner: 'SpiceJet SpiceClub', kind: 'airline', ratio: '1:1', valuePerPoint: 1.0 },
  { partner: 'Air Canada Aeroplan', kind: 'airline', ratio: '2:1', valuePerPoint: 0.5 },
  { partner: 'Air India Maharaja Club', kind: 'airline', ratio: '2:1', valuePerPoint: 0.5 },
  { partner: 'Avianca LifeMiles', kind: 'airline', ratio: '2:1', valuePerPoint: 0.5 },
  { partner: 'British Airways Executive Club (Avios)', kind: 'airline', ratio: '2:1', valuePerPoint: 0.5 },
  { partner: 'Cathay Asia Miles', kind: 'airline', ratio: '2:1', valuePerPoint: 0.5 },
  { partner: 'Etihad Guest', kind: 'airline', ratio: '2:1', valuePerPoint: 0.5 },
  { partner: 'Qatar Airways Privilege Club', kind: 'airline', ratio: '2:1', valuePerPoint: 0.5 },
  { partner: 'Thai Airways Royal Orchid Plus', kind: 'airline', ratio: '2:1', valuePerPoint: 0.5 },
  { partner: 'Turkish Airlines Miles&Smiles', kind: 'airline', ratio: '2:1', valuePerPoint: 0.5 },
  { partner: 'United MileagePlus', kind: 'airline', ratio: '2:1', valuePerPoint: 0.5 },
  { partner: 'IHG One Rewards', kind: 'hotel', ratio: '1:1', valuePerPoint: 0.5 },
  { partner: 'Radisson Rewards', kind: 'hotel', ratio: '1:1', valuePerPoint: 0.5 },
  { partner: 'Wyndham Rewards', kind: 'hotel', ratio: '1:1', valuePerPoint: 0.5 },
  { partner: 'Accor Live Limitless (ALL)', kind: 'hotel', ratio: '2:1', valuePerPoint: 0.4 },
  { partner: 'Club ITC', kind: 'hotel', ratio: '2:1', valuePerPoint: 0.4 },
  { partner: 'Marriott Bonvoy', kind: 'hotel', ratio: '2:1', valuePerPoint: 0.4 },
]

// Amex Membership Rewards India — ONE roster shared across all MR cards. Airlines
// are a flat 2:1 (no exceptions); hotels are the exceptions (Marriott 1:1, Hilton
// 10:9). Etihad Guest removed 1-Jul-2026. Core 6 airlines + hotels official (Amex
// IN page via CardInsider); Flying Blue/Air India community/disputed.
const AMEX_MR_PARTNERS: Partners = [
  { partner: 'Singapore Airlines KrisFlyer', kind: 'airline', ratio: '2:1', valuePerPoint: 1.5, notes: 'min 800 MR.' },
  { partner: 'British Airways Executive Club (Avios)', kind: 'airline', ratio: '2:1', valuePerPoint: 0.9 },
  { partner: 'Emirates Skywards', kind: 'airline', ratio: '2:1', valuePerPoint: 0.9 },
  { partner: 'Qatar Airways Privilege Club (Avios)', kind: 'airline', ratio: '2:1', valuePerPoint: 0.9 },
  { partner: 'Cathay Asia Miles', kind: 'airline', ratio: '2:1', valuePerPoint: 0.9 },
  { partner: 'Virgin Atlantic Flying Club', kind: 'airline', ratio: '2:1', valuePerPoint: 0.9 },
  { partner: 'Marriott Bonvoy', kind: 'hotel', ratio: '1:1', valuePerPoint: 0.5, notes: 'min 100 MR.' },
  { partner: 'Hilton Honors', kind: 'hotel', ratio: '10:9', valuePerPoint: 0.3, notes: '1 MR = 0.9 Hilton pts; min 1,000 MR.' },
]

// HSBC TravelOne + Premier share ONE roster (15 airlines + 5 hotels). Default 1:1;
// exceptions: AirAsia 1:3 (bonus), Hainan/Turkish/United 2:1, Shangri-La 5:1.
// Official ratios, community-published (LiveFromALounge launch coverage).
const HSBC_PARTNERS: Partners = [
  { partner: 'Air India Maharaja Club', kind: 'airline', ratio: '1:1', valuePerPoint: 0.7 },
  { partner: 'AirAsia Rewards', kind: 'airline', ratio: '1:3', valuePerPoint: 1.5, notes: 'Bonus ratio — 1 pt → 3 AirAsia pts.' },
  { partner: 'Air France-KLM Flying Blue', kind: 'airline', ratio: '1:1', valuePerPoint: 1.0 },
  { partner: 'British Airways Executive Club', kind: 'airline', ratio: '1:1', valuePerPoint: 1.0 },
  { partner: 'Etihad Guest', kind: 'airline', ratio: '1:1', valuePerPoint: 0.85 },
  { partner: 'EVA Air Infinity MileageLands', kind: 'airline', ratio: '1:1', valuePerPoint: 1.0 },
  { partner: 'Hainan Airlines Fortune Wings Club', kind: 'airline', ratio: '2:1', valuePerPoint: 0.5 },
  { partner: 'JAL Mileage Bank', kind: 'airline', ratio: '1:1', valuePerPoint: 1.0 },
  { partner: 'Singapore Airlines KrisFlyer', kind: 'airline', ratio: '1:1', valuePerPoint: 1.5 },
  { partner: 'Qantas Frequent Flyer', kind: 'airline', ratio: '1:1', valuePerPoint: 1.0 },
  { partner: 'Qatar Airways Privilege Club', kind: 'airline', ratio: '1:1', valuePerPoint: 1.0 },
  { partner: 'Thai Airways Royal Orchid Plus', kind: 'airline', ratio: '1:1', valuePerPoint: 0.9 },
  { partner: 'Turkish Airlines Miles&Smiles', kind: 'airline', ratio: '2:1', valuePerPoint: 0.5 },
  { partner: 'United MileagePlus', kind: 'airline', ratio: '2:1', valuePerPoint: 0.5 },
  { partner: 'Vietnam Airlines Lotusmiles', kind: 'airline', ratio: '1:1', valuePerPoint: 0.9 },
  { partner: 'Accor Live Limitless (ALL)', kind: 'hotel', ratio: '1:1', valuePerPoint: 0.6 },
  { partner: 'IHG One Rewards', kind: 'hotel', ratio: '1:1', valuePerPoint: 0.6 },
  { partner: 'Marriott Bonvoy', kind: 'hotel', ratio: '1:1', valuePerPoint: 0.6 },
  { partner: 'Shangri-La Circle', kind: 'hotel', ratio: '5:1', valuePerPoint: 0.2 },
  { partner: 'Wyndham Rewards', kind: 'hotel', ratio: '1:1', valuePerPoint: 0.6 },
]

// Axis EDGE partner NAMES are common across EDGE-RP/Miles cards; only the ratio
// differs per card (Magnus 5:2, Burgundy 5:4, Atlas 1:2, Privilege 10:1), with a
// worse-ratio exception group (BA/Finnair/Vietnam/Qatar). Built per card from one
// name list to keep the four rosters in lockstep. Post-Apr-2026; Qatar re-added
// Jul-2026 at the exception ratio (inferred). community: savesage/magnify/pointsmath.
const AXIS_EDGE_NAMES: Array<{ partner: string; kind: 'airline' | 'hotel'; group: 'default' | 'exception' }> = [
  { partner: 'Singapore Airlines KrisFlyer', kind: 'airline', group: 'default' },
  { partner: 'Air Canada Aeroplan', kind: 'airline', group: 'default' },
  { partner: 'Japan Airlines Mileage Bank', kind: 'airline', group: 'default' },
  { partner: 'Etihad Guest', kind: 'airline', group: 'default' },
  { partner: 'Turkish Airlines Miles&Smiles', kind: 'airline', group: 'default' },
  { partner: 'United MileagePlus', kind: 'airline', group: 'default' },
  { partner: 'Ethiopian Airlines ShebaMiles', kind: 'airline', group: 'default' },
  { partner: 'Thai Airways Royal Orchid Plus', kind: 'airline', group: 'default' },
  { partner: 'Air France-KLM Flying Blue', kind: 'airline', group: 'default' },
  { partner: 'Air India Maharaja Club', kind: 'airline', group: 'default' },
  { partner: 'Qantas Frequent Flyer', kind: 'airline', group: 'default' },
  { partner: 'AirAsia Rewards', kind: 'airline', group: 'default' },
  { partner: 'SpiceJet SpiceClub', kind: 'airline', group: 'default' },
  { partner: 'IndiGo BluChip', kind: 'airline', group: 'default' },
  { partner: 'British Airways Executive Club', kind: 'airline', group: 'exception' },
  { partner: 'Finnair Plus', kind: 'airline', group: 'exception' },
  { partner: 'Vietnam Airlines Lotusmiles', kind: 'airline', group: 'exception' },
  { partner: 'Qatar Airways Privilege Club', kind: 'airline', group: 'exception' },
  { partner: 'ITC Hotels Club ITC', kind: 'hotel', group: 'default' },
  { partner: 'IHG One Rewards', kind: 'hotel', group: 'default' },
  { partner: 'Wyndham Rewards', kind: 'hotel', group: 'default' },
  { partner: 'Radisson Rewards', kind: 'hotel', group: 'default' },
  { partner: 'The Postcard Sunshine Club', kind: 'hotel', group: 'default' },
]

// Build an Axis EDGE roster: `def` ratio/value for the default group, `exc` for
// the worse-ratio exceptions (BA/Finnair/Vietnam/Qatar).
function axisEdge(
  def: { ratio: string; valuePerPoint: number },
  exc: { ratio: string; valuePerPoint: number },
): Partners {
  return AXIS_EDGE_NAMES.map(({ partner, kind, group }) => ({
    partner,
    kind,
    ...(group === 'exception' ? exc : def),
  }))
}

export const CARD_REDEMPTION: Record<string, RedemptionInput> = {
  // ---- HDFC (SmartBuy 70% utilization; RP 3-yr expiry; NeuCoins 12-mo) ----
  'hdfc-infinia': {
    methods: [
      { method: 'smartbuy', valuePerPoint: 1.0, notes: 'SmartBuy flights/hotels 1 RP=₹1; points cover ≤70% of booking.' },
      { method: 'airmiles-transfer', valuePerPoint: 1.0, notes: '1:1 (KrisFlyer/FlyingBlue/Finnair/IHG/Wyndham); most others 2:1 (₹0.50).' },
      { method: 'cashback', valuePerPoint: 0.3, notes: 'Statement credit; capped 50,000 RP/mo, max 5 req/mo (Feb-2026).' },
    ],
    transferPartners: HDFC_PREMIUM_PARTNERS,
    portalUtilizationPct: 70,
    monthlyTransferCapPoints: 150000,
    monthlyTransferMaxTxns: 5,
    pointExpiryMonths: 36,
    verified: false,
    notes: 'Official Infinia Rewards T&C PDF: 70% SmartBuy utilization, 1.5L RP/mo combined SmartBuy+transfer, 5 req/mo (Feb-2026). 22-partner roster: 1:1 to KrisFlyer/FlyingBlue/Finnair/Vietnam/AirAsia/SpiceClub + IHG/Radisson/Wyndham; 2:1 to the rest (Turkish/Avianca/Accor devalued 1:1→2:1). Ratios community-sourced.',
  },
  'hdfc-diners-black': {
    methods: [
      { method: 'smartbuy', valuePerPoint: 1.0, notes: 'SmartBuy 1 RP=₹1; ≤70% utilization; 75,000 RP/mo cap.' },
      { method: 'airmiles-transfer', valuePerPoint: 0.75, notes: 'Same 22-partner roster + ratios as Infinia (1:1 to 2:1).' },
      { method: 'cashback', valuePerPoint: 0.3 },
    ],
    transferPartners: HDFC_PREMIUM_PARTNERS,
    portalUtilizationPct: 70,
    monthlyTransferCapPoints: 75000,
    pointExpiryMonths: 36,
    verified: false,
    notes: 'cardmaven/pointsmath: 75k RP/mo SmartBuy cap, 70% utilization, ₹1/RP SmartBuy, ₹0.30 cashback. Identical transfer roster + ratios to Infinia.',
  },
  'hdfc-bizblack': {
    methods: [
      { method: 'smartbuy', valuePerPoint: 1.0, notes: 'SmartBuy 1 RP=₹1; ≤70% utilization; 75,000 RP/mo cap; min 2,500 RP/redemption.' },
      { method: 'airmiles-transfer', valuePerPoint: 1.0, notes: 'ONLY partner: Singapore Airlines KrisFlyer 1:1 (as of late-Jul-2026). BizPower has a wider roster (Flying Blue/Accor/… at 2:1–3:1); BizBlack may follow but has not yet.' },
      { method: 'catalog', valuePerPoint: 0.5, notes: 'Products / business catalogue — lower-value option ~₹0.5/RP.' },
    ],
    transferPartners: [{ partner: 'Singapore Airlines KrisFlyer', kind: 'airline', ratio: '1:1', valuePerPoint: 1.0, notes: 'Only transfer partner for BizBlack as of late-Jul-2026 (BizPower has more).' }],
    portalUtilizationPct: 70,
    monthlyTransferCapPoints: 75000,
    monthlyTransferMaxTxns: 5,
    pointExpiryMonths: 36,
    verified: false,
    notes: 'User-confirmed mid-2026 (cardinsider/pointsmath community tracking): SmartBuy ₹1/RP at ≤70% utilization, 75,000 RP/mo redemption cap (official HDFC T&C references this ceiling), min 2,500 RP/redemption, ~5 requests/mo; KrisFlyer-only 1:1 transfer; catalog ~₹0.5/RP; points expire 36 months. Point values are community estimates → source stays community.',
  },
  'hdfc-regalia-gold': {
    methods: [
      { method: 'smartbuy', valuePerPoint: 0.5, notes: 'SmartBuy 1 RP=₹0.50 (half of Infinia); ≤70% utilization; 50,000 RP/mo.' },
      { method: 'catalog', valuePerPoint: 0.65, notes: 'Gold Catalogue — best non-transfer.' },
      { method: 'airmiles-transfer', valuePerPoint: 0.5, notes: 'Most partners 2:1; some (Air India/BA/Etihad/Marriott) 3:1 (₹0.33).' },
      { method: 'statement-credit', valuePerPoint: 0.2 },
    ],
    transferPartners: [
      // Weaker across the board vs Infinia: default 2:1, a large 3:1 exception group.
      { partner: 'Singapore Airlines KrisFlyer', kind: 'airline', ratio: '2:1', valuePerPoint: 0.5 },
      { partner: 'Air France-KLM Flying Blue', kind: 'airline', ratio: '2:1', valuePerPoint: 0.5 },
      { partner: 'Finnair Plus', kind: 'airline', ratio: '2:1', valuePerPoint: 0.5 },
      { partner: 'Vietnam Airlines LotusMiles', kind: 'airline', ratio: '2:1', valuePerPoint: 0.5 },
      { partner: 'AirAsia Rewards', kind: 'airline', ratio: '2:1', valuePerPoint: 0.5 },
      { partner: 'SpiceJet SpiceClub', kind: 'airline', ratio: '2:1', valuePerPoint: 0.5 },
      { partner: 'Avianca LifeMiles', kind: 'airline', ratio: '2:1', valuePerPoint: 0.5 },
      { partner: 'Turkish Airlines Miles&Smiles', kind: 'airline', ratio: '2:1', valuePerPoint: 0.5 },
      { partner: 'Air Canada Aeroplan', kind: 'airline', ratio: '3:1', valuePerPoint: 0.33 },
      { partner: 'Air India Maharaja Club', kind: 'airline', ratio: '3:1', valuePerPoint: 0.33 },
      { partner: 'British Airways Executive Club (Avios)', kind: 'airline', ratio: '3:1', valuePerPoint: 0.33 },
      { partner: 'Cathay Asia Miles', kind: 'airline', ratio: '3:1', valuePerPoint: 0.33 },
      { partner: 'Etihad Guest', kind: 'airline', ratio: '3:1', valuePerPoint: 0.33 },
      { partner: 'Qatar Airways Privilege Club', kind: 'airline', ratio: '3:1', valuePerPoint: 0.33 },
      { partner: 'Thai Airways Royal Orchid Plus', kind: 'airline', ratio: '3:1', valuePerPoint: 0.33 },
      { partner: 'United MileagePlus', kind: 'airline', ratio: '3:1', valuePerPoint: 0.33 },
      { partner: 'Accor Live Limitless (ALL)', kind: 'hotel', ratio: '2:1', valuePerPoint: 0.4 },
      { partner: 'Club ITC', kind: 'hotel', ratio: '2:1', valuePerPoint: 0.4 },
      { partner: 'IHG One Rewards', kind: 'hotel', ratio: '2:1', valuePerPoint: 0.4 },
      { partner: 'Radisson Rewards', kind: 'hotel', ratio: '2:1', valuePerPoint: 0.4 },
      { partner: 'Wyndham Rewards', kind: 'hotel', ratio: '2:1', valuePerPoint: 0.4 },
      { partner: 'Marriott Bonvoy', kind: 'hotel', ratio: '3:1', valuePerPoint: 0.27 },
    ],
    portalUtilizationPct: 70,
    monthlyTransferCapPoints: 50000,
    pointExpiryMonths: 36,
    verified: false,
    notes: 'pointsmath: ₹0.50 SmartBuy, ₹0.65 Gold catalogue, ₹0.20 statement credit; transfer default 2:1, 3:1 exception group (Aeroplan/AirIndia/BA/Cathay/Etihad/Qatar/Thai/United + Marriott). Regalia Gold 3:1 split single-source community.',
  },
  'hdfc-millennia': {
    methods: [
      { method: 'cashback', valuePerPoint: 1.0, notes: '1 CashPoint=₹1 statement credit; min 500; ₹50 fee.' },
      { method: 'smartbuy', valuePerPoint: 0.3, notes: 'SmartBuy 1 CP=₹0.30; portal utilization only 50% (vs 70% premium).' },
    ],
    transferPartners: [],
    portalUtilizationPct: 50,
    pointExpiryMonths: 24,
    verified: false,
    notes: 'CashPoints 2-yr expiry; best = statement credit ₹1 (₹50 fee). No transfer partners.',
  },
  'hdfc-marriott': {
    methods: [
      { method: 'hotel-transfer', valuePerPoint: 0.7, notes: 'Earns Marriott Bonvoy points DIRECTLY (not HDFC RP); redeem for hotel nights (~₹0.50–0.90/pt).' },
      { method: 'airmiles-transfer', valuePerPoint: 0.35, notes: 'Bonvoy → 40+ airlines 3:1 (+5k bonus per 60k).' },
    ],
    transferPartners: [{ partner: 'Marriott Bonvoy (direct)', kind: 'hotel', ratio: '1:1', valuePerPoint: 0.7 }],
    pointExpiryMonths: 24,
    verified: false,
    notes: 'Co-brand earns Bonvoy points directly — no HDFC SmartBuy/RP transfer. Bonvoy expiry ~24-mo inactivity.',
  },
  'hdfc-neu-infinity': {
    methods: [{ method: 'other', valuePerPoint: 1.0, notes: 'NeuCoins 1=₹1 in Tata Neu ecosystem (Air India/BigBasket/Croma/Tanishq/Taj/CLiQ). No airline/hotel transfer.' }],
    transferPartners: [],
    pointExpiryMonths: 12,
    verified: false,
    notes: 'NeuCoins locked to Tata ecosystem; 12-mo expiry (from Aug-2025).',
  },
  'hdfc-neu-plus': {
    methods: [{ method: 'other', valuePerPoint: 1.0, notes: 'NeuCoins 1=₹1 in Tata Neu ecosystem. No transfer.' }],
    transferPartners: [],
    pointExpiryMonths: 12,
    verified: false,
    notes: 'Same as Neu Infinity; 12-mo expiry.',
  },
  'hdfc-swiggy': cashbackAuto('10% Swiggy / 5% online / 1% others as statement credit; ₹99 on-demand redemption fee.'),

  // ---- Axis (EDGE RP portal ₹0.20; EDGE Miles ₹1; ₹199+GST transfer fee) ----
  'axis-magnus': {
    methods: [
      { method: 'catalog', valuePerPoint: 0.2, notes: 'EDGE portal 1 RP=₹0.20.' },
      { method: 'airmiles-transfer', valuePerPoint: 0.4, notes: '5:2 to ~20 partners (₹0.40); BA/Finnair/Lotusmiles 5:1 (₹0.20) since Apr-2026.' },
    ],
    transferPartners: axisEdge({ ratio: '5:2', valuePerPoint: 0.4 }, { ratio: '5:1', valuePerPoint: 0.2 }),
    annualTransferCapPoints: 500000,
    pointExpiryMonths: 36,
    verified: false,
    notes: 'EDGE RP: portal ₹0.20, transfer default 5:2 (BA/Finnair/Vietnam/Qatar 5:1). Annual cap 5L (1L GroupA + 4L GroupB). ₹199+GST/transfer. Accor/Marriott removed Apr-2026; Qatar re-added Jul-2026 at the worse ratio.',
  },
  'axis-magnus-burgundy': {
    methods: [
      { method: 'catalog', valuePerPoint: 0.2 },
      { method: 'airmiles-transfer', valuePerPoint: 0.8, notes: '5:4 to ~20 partners (₹0.80); BA/Finnair/Lotusmiles 5:2 since Apr-2026.' },
    ],
    transferPartners: axisEdge({ ratio: '5:4', valuePerPoint: 0.8 }, { ratio: '5:2', valuePerPoint: 0.4 }),
    annualTransferCapPoints: 1000000,
    pointExpiryMonths: 36,
    verified: false,
    notes: 'Burgundy gets 5:4 default (vs Magnus 5:2); BA/Finnair/Vietnam/Qatar 5:2. Annual cap 10L (2L A + 8L B). ₹199+GST/transfer.',
  },
  'axis-atlas': {
    methods: [
      { method: 'statement-credit', valuePerPoint: 1.0, notes: 'EDGE Miles pay card bill 1 mile=₹1.' },
      { method: 'travel-portal', valuePerPoint: 1.0, notes: 'Travel EDGE 1 mile=₹1.' },
      { method: 'airmiles-transfer', valuePerPoint: 2.0, notes: '1:2 to partners (₹2 nominal; premium cabins higher); BA/Finnair/Lotusmiles 2:1 (₹0.50).' },
    ],
    transferPartners: axisEdge({ ratio: '1:2', valuePerPoint: 2.0 }, { ratio: '2:1', valuePerPoint: 0.5 }),
    annualTransferCapPoints: 150000,
    verified: false,
    notes: 'Atlas earns EDGE MILES only. Transfer default 1:2 (BA/Finnair/Vietnam/Qatar 2:1); annual cap 1.5L (30k GroupA + 1.2L GroupB) — a key limiter. ₹1/mile floor via statement/portal. Miles no documented expiry.',
  },
  'axis-privilege': {
    methods: [
      { method: 'catalog', valuePerPoint: 0.2 },
      { method: 'airmiles-transfer', valuePerPoint: 0.1, notes: '10:1 most partners (₹0.10); AirAsia/ITC/SpiceJet 5:1 (₹0.20).' },
    ],
    // Privilege's exception group is different: AirAsia/SpiceJet/ITC at 5:1, all
    // else (incl. BA/Finnair/Vietnam/Qatar) at the poor 10:1 default.
    transferPartners: AXIS_EDGE_NAMES.map(({ partner, kind }) =>
      ['AirAsia Rewards', 'SpiceJet SpiceClub', 'ITC Hotels Club ITC'].includes(partner)
        ? { partner, kind, ratio: '5:1', valuePerPoint: 0.2 }
        : { partner, kind, ratio: '10:1', valuePerPoint: 0.1 },
    ),
    annualTransferCapPoints: 500000,
    pointExpiryMonths: 36,
    verified: false,
    notes: 'EDGE RP portal ₹0.20; transfer 10:1 default (poor), AirAsia/SpiceJet/ITC 5:1. ₹199+GST/transfer.',
  },
  'axis-ace': cashbackAuto('Auto cashback statement credit (5% GPay bills / 4% food / 2% base).'),
  'axis-flipkart': cashbackAuto('Auto cashback statement credit (7.5% Myntra / 5% Flipkart-Cleartrip / 4% preferred / 1%).'),
  'axis-airtel': cashbackAuto('Auto cashback statement credit (25% Airtel / 10% utilities+brands).'),

  // ---- Amex (MR: transfer 2:1, never expire if fee paid; statement ₹0.25) ----
  'amex-platinum-travel': {
    methods: [
      { method: 'airmiles-transfer', valuePerPoint: 0.75, notes: '2 MR=1 mile; KrisFlyer best (~₹1.5 premium).' },
      { method: 'gift-voucher', valuePerPoint: 0.4, notes: 'Taj/Postcard vouchers ₹0.40–0.50/pt (Taj devalued Apr-2025).' },
      { method: 'statement-credit', valuePerPoint: 0.25 },
    ],
    transferPartners: AMEX_MR_PARTNERS,
    verified: false,
    notes: 'Amex MR: 2 MR=1 mile across 6 India airlines (KrisFlyer/BA/Emirates/Qatar/Cathay/Virgin); Marriott 1:1, Hilton 10:9. Etihad removed 1-Jul-2026. MR never expires (fee paid).',
  },
  'amex-mrcc': {
    methods: [
      { method: 'gift-voucher', valuePerPoint: 0.5, notes: '18K/24K Gold Collection Taj vouchers ₹0.50–0.58/pt; Amazon/Flipkart ₹0.33.' },
      { method: 'airmiles-transfer', valuePerPoint: 0.75, notes: '2 MR=1 mile; same partners as Platinum Travel.' },
      { method: 'statement-credit', valuePerPoint: 0.25 },
    ],
    transferPartners: AMEX_MR_PARTNERS,
    verified: false,
    notes: 'Amex MR (same roster as Platinum Travel); never expires. Gold Collection vouchers are the sweet spot for casual users.',
  },
  'amex-platinum': {
    methods: [
      { method: 'airmiles-transfer', valuePerPoint: 0.75, notes: '2 MR=1 mile (earns 1 MR/₹40).' },
      { method: 'gift-voucher', valuePerPoint: 0.4 },
      { method: 'pay-with-points', valuePerPoint: 0.25, notes: 'Occasional 30% points-back promo → ~₹0.35.' },
    ],
    transferPartners: AMEX_MR_PARTNERS,
    verified: false,
    notes: 'Charge card; MR never expires. Same MR partner roster as Platinum Travel/MRCC.',
  },
  'amex-smartearn': {
    methods: [
      { method: 'airmiles-transfer', valuePerPoint: 0.75, notes: '2 MR=1 mile.' },
      { method: 'gift-voucher', valuePerPoint: 0.33 },
      { method: 'statement-credit', valuePerPoint: 0.25 },
    ],
    transferPartners: AMEX_MR_PARTNERS,
    verified: false,
    notes: 'Amex MR ecosystem (same roster as other MR cards); never expires.',
  },

  // ---- Standard Chartered (360 Rewards; NO airmiles transfer in India) ----
  'sc-ultimate': {
    methods: [{ method: 'gift-voucher', valuePerPoint: 1.0, notes: '1 RP=₹1 in 360° Rewards (Titan/ITC/Starbucks…); ₹99+GST/redemption. No airmiles transfer.' }],
    transferPartners: [],
    pointExpiryMonths: 36,
    verified: false,
    notes: 'SC India has no airline transfer partners; vouchers only at ₹1/RP. 3-yr expiry.',
  },
  'sc-smart': cashbackAuto('2% online (₹1,000/cyc) + 1% offline (₹500/cyc) statement credit; min ₹2,500 redemption.'),
  'sc-easemytrip': {
    methods: [{ method: 'catalog', valuePerPoint: 0.25, notes: '1 RP=₹0.25 via R360 portal; ₹99 fee; cannot offset outstanding.' }],
    transferPartners: [],
    pointExpiryMonths: 24,
    source: 'official',
    verified: true,
    notes: 'Official SC FAQ: ₹0.25/RP, 2-yr expiry, no airmiles transfer.',
  },

  // ---- HSBC (TravelOne/Premier transfer 1:1; Live+ cashback) ----
  'hsbc-travelone': {
    methods: [
      { method: 'travel-portal', valuePerPoint: 1.0, notes: 'Travel With Points portal 1 pt=₹1.' },
      { method: 'airmiles-transfer', valuePerPoint: 0.75, notes: '1:1 most (~15 airlines); airasia 1:3, Hainan/Turkish/United 2:1.' },
      { method: 'hotel-transfer', valuePerPoint: 0.6, notes: 'Accor/IHG/Marriott/Wyndham 1:1; Shangri-La 5:1.' },
    ],
    transferPartners: HSBC_PARTNERS,
    pointExpiryMonths: 36,
    source: 'official',
    verified: true,
    notes: 'Official hsbc.co.in: 20 transfer partners (15 airlines + 5 hotels) default 1:1 (exceptions AirAsia 1:3 bonus, Hainan/Turkish/United 2:1, Shangri-La 5:1). 3-yr expiry.',
  },
  'hsbc-premier': {
    methods: [
      { method: 'airmiles-transfer', valuePerPoint: 0.75, notes: 'Same ~20 partners as TravelOne, 1:1.' },
      { method: 'hotel-transfer', valuePerPoint: 0.6 },
      { method: 'catalog', valuePerPoint: 1.0, notes: 'Apple products 1 pt=₹1.' },
    ],
    transferPartners: HSBC_PARTNERS,
    source: 'official',
    verified: true,
    notes: 'Official hsbc.co.in. Same 20-partner roster/ratios as TravelOne; Premier points NEVER expire.',
  },
  'hsbc-live-plus': cashbackAuto('10% dining/grocery/food (₹1,200/mo) + 1.5% base, auto statement credit; no points.'),

  // ---- ICICI (iShop; RP 3-yr expiry; ₹99+GST fee, waived Emeralde PM) ----
  'icici-emeralde-private-metal': {
    methods: [
      { method: 'travel-portal', valuePerPoint: 1.0, notes: 'iShop flights ≤95% / hotels ≤90% of cart at 1 RP=₹1; redemption fee waived for Emeralde PM.' },
      { method: 'gift-voucher', valuePerPoint: 0.6, notes: 'iShop vouchers 1 RP=₹0.60, ≤50% of cart; ₹12k/mo Amazon/Flipkart.' },
      { method: 'catalog', valuePerPoint: 0.25 },
      { method: 'airmiles-transfer', valuePerPoint: 0.5, notes: 'Air India Maharaja Club 1:1 (Emeralde PM only), no minimum.' },
    ],
    transferPartners: [{ partner: 'Air India Maharaja Club', kind: 'airline', ratio: '1:1', notes: 'Emeralde PM/Times Black only; 1:1, no min.' }],
    pointExpiryMonths: 36,
    verified: false,
    notes: 'iShop 1 RP=₹1 flights (best); Air India 1:1. iShop earn cap ~18k RP/mo. Fee waived for Emeralde PM.',
  },
  // Legacy non-metal ICICI Emeralde: programme-wide iShop, but NO airline transfer
  // (Air India 1:1 is Emeralde PM / Times Black only).
  'icici-emeralde': {
    methods: [
      { method: 'travel-portal', valuePerPoint: 1.0, notes: 'iShop flights at 1 RP=₹1 (programme-wide).' },
      { method: 'gift-voucher', valuePerPoint: 0.6, notes: 'iShop vouchers ~1 RP=₹0.60.' },
      { method: 'catalog', valuePerPoint: 0.25, notes: 'Flat 1 RP=₹0.25 cash/gifts (cardinsider).' },
    ],
    transferPartners: [],
    pointExpiryMonths: 36,
    verified: false,
    notes: 'Legacy Emeralde: ICICI RP flat ₹0.25 (cardinsider); iShop 1 RP=₹1 on flights. No confirmed airline transfer (that is Metal/Times Black).',
  },
  'icici-sapphiro': {
    methods: [
      { method: 'travel-portal', valuePerPoint: 1.0, notes: 'iShop flights/hotels 1 RP=₹1; ₹99+GST fee.' },
      { method: 'gift-voucher', valuePerPoint: 0.6 },
      { method: 'catalog', valuePerPoint: 0.25 },
      { method: 'airmiles-transfer', valuePerPoint: 0.17, notes: 'Air India 6:1 (min 2,004 RP) — poor.' },
    ],
    transferPartners: [{ partner: 'Air India Maharaja Club', kind: 'airline', ratio: '6:1', notes: '6 RP = 1 mile; min 2,004 RP.' }],
    pointExpiryMonths: 36,
    verified: false,
    notes: 'iShop 1 RP=₹1; Air India 6:1. ₹99+GST redemption fee (not waived).',
  },
  'icici-amazon-pay': {
    methods: [{ method: 'cashback', valuePerPoint: 1.0, notes: 'Auto-credited as Amazon Pay balance (1=₹1); never expires; not encashable.' }],
    transferPartners: [],
    source: 'official',
    verified: true,
    notes: 'Cashback-to-Amazon-Pay model (official); no points, no transfer, no expiry.',
  },
  'icici-coral': {
    methods: [
      { method: 'travel-portal', valuePerPoint: 1.0, notes: 'iShop flights 1 RP=₹1; ₹99+GST fee.' },
      { method: 'gift-voucher', valuePerPoint: 0.6 },
      { method: 'catalog', valuePerPoint: 0.25 },
    ],
    transferPartners: [],
    pointExpiryMonths: 36,
    verified: false,
    notes: 'No transfer partners (Air India transfer is Emeralde PM/Times Black only). iShop 1 RP=₹1.',
  },
  'icici-makemytrip': {
    methods: [{ method: 'travel-portal', valuePerPoint: 1.0, notes: 'myCash (MMT wallet) 1=₹1 on MMT flights/hotels/holidays; not encashable; never expires.' }],
    transferPartners: [],
    verified: false,
    notes: 'Co-brand myCash → MMT wallet; no ICICI RP / transfer.',
  },

  // ---- SBI (statement credit ₹0.25; 60k RP/mo cap in ₹4k multiples; 24-mo) ----
  'sbi-cashback': cashbackAuto('Auto statement credit; 5% online + 1% offline, ₹4,000/cycle cap; no points/transfer.'),
  'sbi-elite': {
    methods: [
      { method: 'statement-credit', valuePerPoint: 0.25, notes: '1 RP=₹0.25; 60,000 RP/mo cap, multiples of 4,000, ₹99+GST fee (Apr-2026).' },
      { method: 'gift-voucher', valuePerPoint: 0.25, notes: 'Promo Amazon/Flipkart can reach ₹0.50.' },
      { method: 'airmiles-transfer', valuePerPoint: 0.25, notes: 'InterMiles (min 10,000 RP, phone) — ratio unconfirmed; some sources say no transfer partners.' },
    ],
    transferPartners: [{ partner: 'InterMiles', kind: 'airline', notes: 'Min 10,000 RP; ratio unconfirmed; low confidence.' }],
    monthlyTransferCapPoints: 60000,
    pointExpiryMonths: 24,
    verified: false,
    notes: 'SBI RP 1=₹0.25; statement-credit 60k/mo cap (Apr-2026). Transfer partner low-confidence.',
  },
  'sbi-simplyclick': {
    methods: [
      { method: 'statement-credit', valuePerPoint: 0.25, notes: '60,000 RP/mo cap, multiples of 4,000, ₹99+GST fee.' },
      { method: 'gift-voucher', valuePerPoint: 0.25 },
      { method: 'catalog', valuePerPoint: 0.2 },
    ],
    transferPartners: [],
    monthlyTransferCapPoints: 60000,
    pointExpiryMonths: 24,
    verified: false,
    notes: 'No transfer partners. 1 RP=₹0.25.',
  },
  'sbi-prime': {
    methods: [
      { method: 'statement-credit', valuePerPoint: 0.25, notes: '60,000 RP/mo cap, multiples of 4,000, ₹99+GST fee.' },
      { method: 'gift-voucher', valuePerPoint: 0.25, notes: 'Yatra/Pantaloons/Bata/ShoppersStop.' },
      { method: 'catalog', valuePerPoint: 0.2 },
    ],
    transferPartners: [],
    monthlyTransferCapPoints: 60000,
    pointExpiryMonths: 24,
    verified: false,
    notes: 'No transfer partners. 1 RP=₹0.25.',
  },

  // ---- IndusInd / AU / IDFC / BoB ----
  'indusind-qatar-avios': {
    methods: [{ method: 'airmiles-transfer', valuePerPoint: 0.75, notes: 'Earns Avios directly; redeem via Qatar Privilege Club / BA Executive Club award flights (~₹0.5–1.5/Avios).' }],
    transferPartners: [
      { partner: 'Qatar Airways Privilege Club', kind: 'airline', ratio: '1:1', valuePerPoint: 0.75, notes: 'Avios moves 1:1 with BA.' },
      { partner: 'British Airways Executive Club', kind: 'airline', ratio: '1:1', valuePerPoint: 0.75 },
    ],
    verified: false,
    notes: 'Avios earned directly; no cash redemption. Expiry per Qatar/BA activity rules.',
  },
  'indusind-legend': {
    methods: [
      { method: 'cashback', valuePerPoint: 0.5, notes: 'Cash credit ₹0.50/RP (cut from ₹0.75); 5,000 RP/mo cap, ≤50% of balance/txn, ₹149+GST fee (Mar-2025).' },
      { method: 'airmiles-transfer', valuePerPoint: 0.5, notes: 'KrisFlyer 4:1 (400 RP=100 miles); Air India 4:1; min 500 RP.' },
    ],
    transferPartners: [
      { partner: 'Singapore Airlines KrisFlyer', kind: 'airline', ratio: '4:1', notes: '400 RP=100 miles.' },
      { partner: 'Air India Maharaja Club', kind: 'airline', ratio: '4:1' },
    ],
    monthlyTransferCapPoints: 5000,
    verified: false,
    notes: 'Cash ₹0.50/RP, 5k/mo cap; KrisFlyer/Air India 4:1 (added Mar-2025).',
  },
  'indusind-eazydiner': {
    methods: [{ method: 'other', valuePerPoint: 0.1, notes: 'RP redeem ONLY via PayEazy on EazyDiner app vs restaurant bills (1 RP=₹0.10); no cash. EazyPoints are a separate currency.' }],
    transferPartners: [],
    pointExpiryMonths: 12,
    verified: false,
    notes: 'EazyDiner-app-only redemption; dining earns 0 RP. 12-mo expiry.',
  },
  'au-ixigo': {
    methods: [
      { method: 'other', valuePerPoint: 0.5, notes: 'ixigo Money (best) ₹0.50/point on ixigo flights/trains/buses/hotels.' },
      { method: 'catalog', valuePerPoint: 0.25 },
      { method: 'gift-voucher', valuePerPoint: 0.2 },
    ],
    transferPartners: [],
    pointExpiryMonths: 24,
    verified: false,
    notes: 'Best = ixigo Money ₹0.50. ₹99+GST fee; min 200 RP; earn cap 10k RP/mo.',
  },
  'au-zenith': {
    methods: [
      { method: 'catalog', valuePerPoint: 0.25 },
      { method: 'gift-voucher', valuePerPoint: 0.2 },
      { method: 'airmiles-transfer', valuePerPoint: 0.17, notes: 'Air India Maharaja 6:1 (was 4:1 to Vistara CV pre-merger).' },
    ],
    transferPartners: [{ partner: 'Air India Maharaja Club', kind: 'airline', ratio: '6:1' }],
    pointExpiryMonths: 24,
    verified: false,
    notes: 'Catalog ₹0.25; Air India 6:1. ₹99+GST fee. Jan-2026 earn devaluation.',
  },
  'au-zenith-plus': {
    methods: [
      { method: 'catalog', valuePerPoint: 1.0, notes: 'Direct redemption / catalogue at a flat 1 RP = ₹1 (Gemini audit mid-2026).' },
      { method: 'gift-voucher', valuePerPoint: 1.0, notes: 'Brand vouchers ~1 RP = ₹1.' },
    ],
    transferPartners: [],
    pointExpiryMonths: 24,
    verified: false,
    notes: 'AU Zenith+ RP = ₹1 flat for direct/catalogue (distinct from base Zenith ₹0.25 → AU_RP_PREMIUM). Airline transfer (CV historically; Air India 6:1) is worse than direct and needs re-verification post-Vistara wind-down.',
  },
  'au-lit': {
    methods: [
      { method: 'catalog', valuePerPoint: 0.25 },
      { method: 'gift-voucher', valuePerPoint: 0.2 },
      { method: 'airmiles-transfer', valuePerPoint: 0.17, notes: 'Air India Maharaja 6:1.' },
    ],
    transferPartners: [{ partner: 'Air India Maharaja Club', kind: 'airline', ratio: '6:1' }],
    pointExpiryMonths: 36,
    verified: false,
    notes: 'Catalog ₹0.25; Air India 6:1. ₹99+GST fee.',
  },
  'idfc-wealth': {
    methods: [
      { method: 'catalog', valuePerPoint: 0.25, notes: 'FIRST Rewards Gallery vouchers/pay-with-points; ₹99+GST fee.' },
      { method: 'travel-portal', valuePerPoint: 0.25, notes: 'Travel & Shop; points cover ≤70% of booking (no ₹0.50 uplift, unlike Mayura).' },
    ],
    transferPartners: [],
    pointExpiryMonths: 24,
    verified: false,
    notes: 'RP ₹0.25; ≤70% booking via points. Expiry 24-mo from Jul-2026 (was lifetime).',
  },
  'idfc-mayura': {
    methods: [
      { method: 'travel-portal', valuePerPoint: 0.5, notes: 'FIRST Rewards Gallery travel ₹0.50/point (30X hotel / 15X flight bonus).' },
      { method: 'catalog', valuePerPoint: 0.25 },
    ],
    transferPartners: [],
    verified: false,
    notes: 'Travel-portal ₹0.50 (key vs Wealth ₹0.25). Earn capped at credit limit/cycle (Jun-2026).',
  },
  'idfc-vistara': {
    methods: [{ method: 'airmiles-transfer', valuePerPoint: 0.5, notes: 'Earns Air India Maharaja Points directly (CV→Maharaja 1:1 since Nov-2024); redeem Air India + 25 Star Alliance partners.' }],
    transferPartners: [{ partner: 'Air India Maharaja Club', kind: 'airline', ratio: '1:1', notes: 'Points earned directly; card active until 30-Sep-2026.' }],
    verified: false,
    notes: 'Winding down (to 30-Sep-2026); earns Maharaja Points directly.',
  },
  'bob-eterna': {
    methods: [
      { method: 'statement-credit', valuePerPoint: 0.25, notes: 'Cashback ₹0.25/RP; min 1,000 RP; no fee.' },
      { method: 'catalog', valuePerPoint: 0.25 },
    ],
    transferPartners: [],
    verified: false,
    notes: 'RP ₹0.25; accel 15 RP/₹100 capped 5,000/cycle. Points LIFETIME-valid (unique for BoB). No transfer.',
  },
  'bob-premier': {
    methods: [
      { method: 'statement-credit', valuePerPoint: 0.25, notes: 'Cashback ₹0.25/RP; min 1,000 RP.' },
      { method: 'catalog', valuePerPoint: 0.25 },
    ],
    transferPartners: [],
    pointExpiryMonths: 24,
    verified: false,
    notes: 'RP ₹0.25; 24-mo expiry; no transfer.',
  },
  'bob-etihad': {
    methods: [{ method: 'airmiles-transfer', valuePerPoint: 0.8, notes: 'Earns Etihad Guest Miles directly (Premium 2/₹100, 6/₹100 on Etihad); ~₹0.80/mile standard, ₹1.50+ premium-cabin Etihad metal (Gemini audit mid-2026).' }],
    transferPartners: [{ partner: 'Etihad Guest', kind: 'airline', ratio: '1:1', valuePerPoint: 0.8, notes: 'Miles credited directly; NOT transferable onward, no statement cashback.' }],
    verified: false,
    notes: 'Earns Etihad miles directly; no onward transfer. Expiry per Etihad Guest activity rules.',
  },
  'bob-etihad-standard': {
    methods: [{ method: 'airmiles-transfer', valuePerPoint: 0.8, notes: 'Earns Etihad Guest Miles directly (Standard 1/₹100, 3/₹100 on Etihad); ~₹0.80/mile standard, ₹1.50+ premium-cabin (Gemini audit mid-2026).' }],
    transferPartners: [{ partner: 'Etihad Guest', kind: 'airline', ratio: '1:1', valuePerPoint: 0.8, notes: 'Miles credited directly; NOT transferable onward, no statement cashback.' }],
    verified: false,
    notes: 'Same ETIHAD_MILES currency as the Premium card (earn rate is half). Expiry per Etihad Guest activity rules.',
  },

  // ---- New banks (Jul-2026 onboarding; community-sourced → verified:false) ----
  'kotak-zen-signature': { methods: [{ method: 'catalog', valuePerPoint: 0.25 }, { method: 'cashback', valuePerPoint: 0.25 }], transferPartners: [], verified: false, notes: '1 Zen Point = ₹0.25 catalog/cash. No transfer partners (kotak.bank.in/cardinsider).' },
  'kotak-white-reserve': { methods: [{ method: 'gift-voucher', valuePerPoint: 1.0, notes: '1 White Pass = ₹1 vouchers/travel.' }, { method: 'cashback', valuePerPoint: 0.7 }], transferPartners: [], verified: false, notes: 'White Pass ₹1 voucher / ₹0.70 cashback (cardinsider).' },
  'kotak-league-platinum': { methods: [{ method: 'catalog', valuePerPoint: 0.1 }, { method: 'statement-credit', valuePerPoint: 0.07, notes: 'min 2,000 pts; revised down 1-Jun-2025.' }], transferPartners: [], verified: false, notes: 'LOW value: ₹0.10 catalog / ₹0.07 cash (kotak.bank.in).' },
  'kotak-indianoil': { methods: [{ method: 'catalog', valuePerPoint: 0.25, notes: 'redeem as IndianOil fuel via Kotak portal.' }, { method: 'cashback', valuePerPoint: 0.2 }], transferPartners: [], verified: false, notes: '1 RP = ₹0.25 (₹0.20 cashback) (kotak.bank.in).' },
  'federal-celesta': { methods: [{ method: 'catalog', valuePerPoint: 0.25, notes: '₹99+GST/redemption; min 250 pts.' }], transferPartners: [], pointExpiryMonths: 36, verified: false, notes: 'FedRewards ₹0.25 portal, 3-yr expiry, no transfer (cardinsider).' },
  'federal-imperio': { methods: [{ method: 'catalog', valuePerPoint: 0.25, notes: '₹99+GST/redemption.' }], transferPartners: [], pointExpiryMonths: 36, verified: false, notes: 'FedRewards ₹0.25 portal, 3-yr expiry (cardinsider).' },
  'federal-signet': { methods: [{ method: 'catalog', valuePerPoint: 0.25 }, { method: 'statement-credit', valuePerPoint: 0.1 }], transferPartners: [], verified: false, notes: 'FedRewards ₹0.25 portal / ₹0.10 statement; ₹99+GST/redemption (cardinsider).' },
  'federal-scapia': { methods: [{ method: 'other', valuePerPoint: 0.2, notes: '5 coins = ₹1, in-app travel only; no cash-out.' }], transferPartners: [], pointExpiryMonths: 36, verified: false, notes: 'Scapia Coins locked to in-app travel (cardinsider/1finance).' },
  'rbl-world-safari': { methods: [{ method: 'travel-portal', valuePerPoint: 0.25, notes: 'flights/hotels via RBL Rewards portal.' }, { method: 'catalog', valuePerPoint: 0.1 }], transferPartners: [], pointExpiryMonths: 24, verified: false, notes: 'Travel Points ~₹0.25 portal; ₹99+GST/redemption; 24-mo expiry; no airline transfer (community).' },
  'rbl-icon': { methods: [{ method: 'catalog', valuePerPoint: 0.25 }, { method: 'travel-portal', valuePerPoint: 0.25 }], transferPartners: [], pointExpiryMonths: 24, verified: false, notes: 'RBL RP ₹0.25; ₹99+GST/redemption; 24-mo expiry; no transfer (cardinsider).' },
  'rbl-shoprite': { methods: [{ method: 'catalog', valuePerPoint: 0.25 }], transferPartners: [], pointExpiryMonths: 24, verified: false, notes: 'RBL RP ₹0.25; 24-mo expiry; no transfer (community).' },
  'rbl-indianoil-xtra': { methods: [{ method: 'other', valuePerPoint: 0.5, notes: 'redeem ONLY at IndianOil XTRA outlets.' }], transferPartners: [], verified: false, notes: '1 Fuel Point = ₹0.50, IndianOil-only (rbl.bank.in).' },
  'sbi-bpcl-octane': { methods: [{ method: 'statement-credit', valuePerPoint: 0.25 }, { method: 'gift-voucher', valuePerPoint: 0.25 }], transferPartners: [], pointExpiryMonths: 24, verified: false, notes: '1 RP = ₹0.25; ₹99/redemption; no transfer (community).' },
  'sbi-aurum': {
    methods: [{ method: 'statement-credit', valuePerPoint: 0.25 }, { method: 'airmiles-transfer', valuePerPoint: 0.3, notes: 'via 5:1/4:1 transfer.' }],
    transferPartners: [
      { partner: 'Air India Maharaja Club', kind: 'airline', ratio: '5:1' },
      { partner: 'Qatar Airways Privilege Club (Avios)', kind: 'airline', ratio: '5:1' },
      { partner: 'Club ITC', kind: 'hotel', ratio: '5:1' },
      { partner: 'AirAsia Rewards', kind: 'airline', ratio: '4:1' },
    ],
    verified: false,
    notes: 'AURUM RP ₹0.25 base; transfers 5:1 (Air India/Qatar/ITC), 4:1 (AirAsia/Adani). Points NEVER expire (community; Air India partner page confirms 5:1).',
  },
  'sbi-miles-elite': {
    methods: [{ method: 'airmiles-transfer', valuePerPoint: 1.0, notes: 'up to ₹1/TC at 1:1 partners.' }, { method: 'travel-portal', valuePerPoint: 0.5 }, { method: 'catalog', valuePerPoint: 0.25 }],
    transferPartners: [
      { partner: 'Air India Maharaja Club', kind: 'airline', ratio: '1:1', valuePerPoint: 1.0 },
      { partner: 'British Airways Executive Club (Avios)', kind: 'airline', ratio: '1:1', valuePerPoint: 1.0 },
      { partner: 'Air France-KLM Flying Blue', kind: 'airline', ratio: '1:1', valuePerPoint: 1.0 },
      { partner: 'Cathay Asia Miles', kind: 'airline', ratio: '1:1', valuePerPoint: 1.0 },
      { partner: 'Emirates Skywards', kind: 'airline', ratio: '2:1', valuePerPoint: 0.5 },
    ],
    verified: false,
    notes: 'Travel Credits: ₹0.25 catalog / ₹0.50 portal / ₹1 at 1:1 transfer. 25 partners (Air India partner page confirms Miles 1:1). Community (magnify/cardexpert).',
  },
  'sbi-miles-prime': {
    methods: [{ method: 'airmiles-transfer', valuePerPoint: 1.0 }, { method: 'travel-portal', valuePerPoint: 0.5 }, { method: 'catalog', valuePerPoint: 0.25 }],
    transferPartners: [
      { partner: 'Air India Maharaja Club', kind: 'airline', ratio: '1:1', valuePerPoint: 1.0 },
      { partner: 'British Airways Executive Club (Avios)', kind: 'airline', ratio: '1:1', valuePerPoint: 1.0 },
      { partner: 'Air France-KLM Flying Blue', kind: 'airline', ratio: '1:1', valuePerPoint: 1.0 },
    ],
    pointExpiryMonths: 24,
    verified: false,
    notes: 'Same 25 transfer partners as Miles Elite; TC ₹0.25/₹0.50/₹1; 2-yr expiry. Community (magnify).',
  },
  'equitas-tiga': { methods: [{ method: 'gift-voucher', valuePerPoint: 0.35 }, { method: 'cashback', valuePerPoint: 0.15 }], transferPartners: [], pointExpiryMonths: 24, verified: false, notes: 'Xchange portal ₹0.35 voucher / ₹0.10–0.15 cashback; 2-yr expiry (cardinsider).' },
  'equitas-selfe': { methods: [{ method: 'gift-voucher', valuePerPoint: 0.35, notes: 'tier-linked ₹0.35 (Blue) → ₹1.00 (Diamond).' }, { method: 'cashback', valuePerPoint: 0.15 }], transferPartners: [], verified: false, notes: 'Tier-linked value ₹0.35→₹1.00 via Xchange portal (cardmaven).' },
  'equitas-powermiles': { methods: [{ method: 'travel-portal', valuePerPoint: 0.5, notes: 'tier-linked ₹0.50 → ₹1.00 (Diamond).' }, { method: 'cashback', valuePerPoint: 0.25 }], transferPartners: [], verified: false, notes: '₹0.50 base → ₹1.00 Diamond. 1:1 airline transfers (BA/United/Finnair/Aeroplan/Etihad/Air India/JAL/IHG/Wyndham) ANNOUNCED Sep-2026, NOT live (creditcardz/cardmaven).' },

  // ---- Tier-1 (Jul-2026) ----
  'yes-marquee': {
    methods: [{ method: 'travel-portal', valuePerPoint: 0.25, notes: 'flights/hotels via YES Rewardz, ≤70% cart.' }, { method: 'gift-voucher', valuePerPoint: 0.1 }],
    transferPartners: [
      { partner: 'Club Vistara', kind: 'airline', ratio: '10:1', notes: 'Vistara merged into Air India Nov-2024 — verify.' },
      { partner: 'InterMiles', kind: 'airline', ratio: '4:1' },
    ],
    pointExpiryMonths: 36,
    verified: false,
    notes: 'YES Rewardz ₹0.25 travel / ₹0.10 voucher; ₹100+GST/redemption; 36-mo expiry. Community.',
  },
  'yes-reserv': { methods: [{ method: 'travel-portal', valuePerPoint: 0.25 }, { method: 'catalog', valuePerPoint: 0.1 }], transferPartners: [{ partner: 'InterMiles', kind: 'airline', ratio: '10:1' }], pointExpiryMonths: 36, verified: false, notes: 'YES Rewardz ₹0.25 travel / ₹0.10 voucher; ≤70% cart. Community.' },
  'yes-pop-club': { methods: [{ method: 'other', valuePerPoint: 0.75, notes: 'redeem at 500+ brands in POP app; up to ₹1 at full-value brands.' }], transferPartners: [], verified: false, notes: 'POPcoins ecosystem-locked; no transfer/cash-out. Community.' },
  'yes-byoc': { methods: [{ method: 'catalog', valuePerPoint: 0.25 }, { method: 'cashback', valuePerPoint: 0.25 }], transferPartners: [], verified: false, notes: 'YES Rewardz ₹0.25 (rewards mode) or flat 1% (cashback mode). Community.' },
  'onecard': { methods: [{ method: 'statement-credit', valuePerPoint: 0.1, notes: 'in-app "swipe right" against a transaction; no minimum.' }], transferPartners: [], verified: false, notes: '1 RP = ₹0.10 statement credit only; no vouchers/transfer; points never expire (forfeit if unused 365d). OFFICIAL (getonecard.app/Federal MITC).' },
  'slice': { methods: [{ method: 'cashback', valuePerPoint: 1.0, notes: 'monies = ₹1 statement credit at repayment.' }], transferPartners: [], verified: false, notes: 'Slice monies pure cashback ₹1; no transfer/vouchers. Community.' },
  'idbi-royale-signature': { methods: [{ method: 'catalog', valuePerPoint: 0.25, notes: 'IDBI Delight portal; min 1,000 pts, ₹99+GST/redemption.' }], transferPartners: [], pointExpiryMonths: 36, verified: false, notes: '1 Delight Point = ₹0.25, portal only, 3-yr expiry (idbi.bank.in).' },
  'idbi-euphoria-world': { methods: [{ method: 'catalog', valuePerPoint: 0.25, notes: 'min 4,000 pts for cashback; ₹99+GST/redemption.' }], transferPartners: [], pointExpiryMonths: 36, verified: false, notes: '1 Delight Point = ₹0.25, portal only, 3-yr expiry (idbi.bank.in).' },
  'idbi-winnings-select': { methods: [{ method: 'catalog', valuePerPoint: 0.25 }], transferPartners: [], pointExpiryMonths: 36, verified: false, notes: '1 Delight Point = ₹0.25, portal only, 3-yr expiry (idbi.bank.in).' },
  'idbi-aspire-platinum': { methods: [{ method: 'catalog', valuePerPoint: 0.25 }], transferPartners: [], pointExpiryMonths: 36, verified: false, notes: '1 Delight Point = ₹0.25, portal only, 3-yr expiry (idbi.bank.in).' },
  'idbi-imperium-platinum': { methods: [{ method: 'catalog', valuePerPoint: 0.25 }], transferPartners: [], pointExpiryMonths: 36, verified: false, notes: '1 Delight Point = ₹0.25, portal only, 3-yr expiry (idbi.bank.in).' },

  // ---- Tier-2 PSU (flat ₹0.25 portal, no transfer partners) ----
  'pnb-rupay-select': { methods: [{ method: 'catalog', valuePerPoint: 0.25, notes: 'pnbrewardz.com; min 500 pts.' }], transferPartners: [], pointExpiryMonths: 36, verified: false, notes: '1 RP = ₹0.25 (from 1-Sep-2024), portal only, 3-yr expiry.' },
  'pnb-visa-signature': { methods: [{ method: 'catalog', valuePerPoint: 0.25 }], transferPartners: [], pointExpiryMonths: 36, verified: false, notes: '1 RP = ₹0.25, pnbrewardz.com, 3-yr expiry.' },
  'pnb-luxura': { methods: [{ method: 'catalog', valuePerPoint: 0.25 }], transferPartners: [], pointExpiryMonths: 36, verified: false, notes: '1 RP = ₹0.25, pnbrewardz.com; no transfer despite premium tier.' },
  'canara-rupay-select': { methods: [{ method: 'catalog', valuePerPoint: 0.25 }, { method: 'cashback', valuePerPoint: 0.25 }], transferPartners: [], pointExpiryMonths: 36, verified: false, notes: '1 Rewardz = ₹0.25 (canararewardz.com); no transfer. 3-yr expiry.' },
  'canara-mastercard-world': { methods: [{ method: 'catalog', valuePerPoint: 0.25 }], transferPartners: [], pointExpiryMonths: 36, verified: false, notes: '1 Rewardz = ₹0.25; no transfer.' },
  'canara-visa-signature': { methods: [{ method: 'catalog', valuePerPoint: 0.25 }], transferPartners: [], pointExpiryMonths: 36, verified: false, notes: '1 Rewardz = ₹0.25; no transfer. 3-yr expiry.' },
  'union-uni-carbon': { methods: [{ method: 'catalog', valuePerPoint: 0.25 }], transferPartners: [], pointExpiryMonths: 36, verified: false, notes: '1 Rewardz = ₹0.25 (Union Rewardz portal); no transfer. 36-mo expiry.' },
  'union-rupay-select': { methods: [{ method: 'catalog', valuePerPoint: 0.25 }], transferPartners: [], pointExpiryMonths: 36, verified: false, notes: '1 Rewardz = ₹0.25; no transfer. 36-mo expiry.' },
  'union-visa-signature': { methods: [{ method: 'catalog', valuePerPoint: 0.25 }], transferPartners: [], pointExpiryMonths: 36, verified: false, notes: '1 Rewardz = ₹0.25; no transfer. 36-mo expiry.' },
  'boi-rupay-select': { methods: [{ method: 'catalog', valuePerPoint: 0.25, notes: '₹/pt not officially disclosed; ~₹0.25 estimate.' }], transferPartners: [], pointExpiryMonths: 12, verified: false, notes: 'BOI Star Rewardz portal; SHORT 1-yr point expiry; ₹/pt undisclosed. Community.' },
  'indian-bank-rupay-select': { methods: [{ method: 'catalog', valuePerPoint: 0.25, notes: '₹/pt undisclosed (~₹0.25 est; lone ₹1 claim treated as outlier).' }], transferPartners: [], verified: false, notes: 'Indian Bank rewards portal; ₹/pt undisclosed. Very thin data.' },
  'bom-rupay-platinum': { methods: [{ method: 'catalog', valuePerPoint: 0.25, notes: '₹/pt undisclosed (~₹0.25 est).' }], transferPartners: [], verified: false, notes: 'BoM own-brand rewards; ₹/pt undisclosed. Community.' },
}

// Pure lookups (mirrors surcharges.ts / milestones.ts).
export function redemptionFor(cardSlug: string): RedemptionInput | undefined {
  return CARD_REDEMPTION[cardSlug]
}
export function unknownRedemptionKeys(cardSlugs: Set<string>): string[] {
  return Object.keys(CARD_REDEMPTION).filter((k) => !cardSlugs.has(k)).map((k) => `CARD_REDEMPTION["${k}"]`)
}
