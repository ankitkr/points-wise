import type { TaxPaymentsInput } from '@/lib/kb/schema'

// Direct income-tax / GST payment treatment per card (MCC 9311 tax / 9399 govt),
// keyed by card slug, merged into the earn rule at seed time (like surcharges /
// milestones / redemptions). Two independent axes:
//   • earns            — do tax/GST payments earn base/accelerated points?
//   • countsToMilestone — does the spend count toward the card's spend milestones
//                         even when it earns nothing?
// The big real-world nuance (surfaced comparing our KB to community tax threads,
// Jul 2026): on most personal cards tax EARNS 0 but still COUNTS toward milestones
// (HDFC/ICICI/SBI); on Axis it counts toward NEITHER; on business/professional
// cards (HDFC Biz, AU CA Metal, IDFC Business) it does BOTH.
//
// Sourcing is mostly community (TechnoFino/CardExpert/CardInsider + practitioner
// threads: @RushilM_, @bigulchugh) and some points are DISPUTED — notably whether
// personal HDFC tax spend counts toward the ₹18L / quarterly milestones. Those stay
// verified:false with the dispute noted; flip true only on an issuer MITC read.

export const CARD_TAX_TREATMENT: Record<string, TaxPaymentsInput> = {
  // ---- HDFC: personal cards earn 0 on tax; milestone-counting is DISPUTED ----
  'hdfc-infinia': {
    earns: false,
    countsToMilestone: true,
    verified: false,
    notes:
      'Personal HDFC: TAX (MCC 9311, IT/GST) earns 0 but IS counted as spend toward the ₹18L annual retention milestone — CONFIRMED (CardExpert: "no exclusions for the 18L spend criteria"); the "milestone excludes the same categories as earning" theory is refuted. NOTE the govt-vs-tax split: Infinia still EARNS on non-tax GOVERNMENT (MCC 9399) and utility spend — only tax earns 0. Community-sourced (no issuer T&C), so verified:false.',
  },
  'hdfc-diners-black': {
    earns: false,
    countsToMilestone: true,
    verified: false,
    notes:
      'Tax earns 0; counts toward the ₹4L quarterly milestone (10K RP) — consistent with HDFC\'s "counts as spend, earns 0" framework (Infinia), but NOT explicitly confirmed on issuer T&C. community/unconfirmed.',
  },
  'hdfc-regalia-gold': {
    earns: false,
    countsToMilestone: true,
    verified: false,
    notes:
      'Tax earns 0; counts toward the ₹1.5L quarterly milestone (₹1.5K GV) — consistent with HDFC\'s "counts as spend" framework, but NOT explicitly confirmed on issuer T&C. community/unconfirmed.',
  },
  // ---- HDFC business: tax/GST NOT excluded → earns AND counts to milestone ----
  'hdfc-bizblack': {
    earns: true,
    countsToMilestone: true,
    verified: true,
    notes:
      'OFFICIAL (HDFC BizBlack tax blog): govt/tax is NOT excluded — earns 5 RP/₹150 base, 5X (25 RP/₹150) above ₹50k/cycle, cap ~7,500 RP/cycle, AND counts toward the ₹5L→₹5K voucher milestone (max ₹20K/yr). The one issuer-confirmed tax-earning card here.',
  },

  // ---- Amex: tax earns 0 MR but counts toward the spend milestones ----
  'amex-platinum-travel': {
    earns: false,
    countsToMilestone: true,
    verified: false,
    notes:
      'CONFIRMED (community, well-established): tax earns 0 MR but counts toward the ₹1.9L (7.5K MR) / ₹4L (10K MR) / ₹7L (22.5K MR + ₹10K Taj GV) milestones — values current post the 9-Mar-2026 devaluation. Pay via the Canara or Axis gateway (accept Amex). The main "use tax to hit a milestone" card.',
  },
  'amex-mrcc': {
    earns: false,
    countsToMilestone: true,
    verified: false,
    notes:
      'CONFIRMED (community): tax earns ~0 base MR but counts toward the ₹20K/mo (1K MR) + 4×₹1.5K txn (1K MR) milestones. (Some sources claim 1 MR/₹50 on tax — conflicting; treat earn as 0.)',
  },

  // ---- ICICI: Emeralde PM excludes tax from earning; milestone counting UNCONFIRMED ----
  'icici-emeralde': {
    earns: false,
    countsToMilestone: true,
    verified: false,
    notes:
      '2026 notice (eff ~15-Jan-2026) excludes Govt/Fuel/Rent/Tax from EARNING — confirmed. @RushilM_ lists tax counting toward the ₹4L & ₹8L milestones (₹3K EaseMyTrip GV), but verification found NO evidence either way — unlike HDFC/Amex, ICICI has no known "counts-but-earns-zero" statement. Treat countsToMilestone as UNCONFIRMED; do not rely on it.',
  },

  // ---- HSBC / SC: earn on tax (community), milestone-counting unconfirmed ----
  'hsbc-premier': {
    earns: true,
    countsToMilestone: false,
    verified: false,
    notes:
      'Community: an outlier that still EARNS on tax AND government (3 RP/₹100), subject to a shared ~₹1L/month cumulative cap across govt/tax/utility/insurance/education/wallet/real-estate. @bigulchugh netted ~2.1% via the ICICI gateway (~5% in Accor terms). Milestone-counting not established.',
  },
  'sc-ultimate': {
    earns: true,
    countsToMilestone: false,
    verified: false,
    notes: 'Community: earns 3 RP/₹150 (~2%) on tax. Milestone-counting not established. community.',
  },

  // ---- IndusInd Avios: earns Avios directly on tax ----
  'indusind-qatar-avios': {
    earns: true,
    countsToMilestone: false,
    verified: false,
    notes: 'Earns Avios directly on tax (community, @HeySisyphus). No milestone.',
  },

  // ---- SBI: tax earns 0 but generally counts toward milestone/fee-waiver ----
  'sbi-elite': {
    earns: false,
    countsToMilestone: true,
    verified: false,
    notes: 'Govt/tax earns 0 RP; SBI generally counts govt spend toward milestone/fee-waiver (community). Verify per card.',
  },
  'sbi-prime': {
    earns: false,
    countsToMilestone: true,
    verified: false,
    notes: 'Govt/tax earns 0 RP; SBI generally counts govt spend toward milestone/fee-waiver (community). Verify per card.',
  },

  // ---- More business/professional cards: tax/GST is an earn category ----
  'hdfc-bizpower': {
    earns: true,
    countsToMilestone: false,
    verified: false,
    notes:
      'Business card: earns 5X (25 RP/₹200) on IT/GST, cap 7,500 RP/cycle; post-15-May-2026 only the first 2 IT + 2 GST txns/cycle earn. Tax is EXCLUDED from the ₹2.5L/qtr milestone (IT/GST/fuel/EMI). community.',
  },
  'hdfc-bizgrow': {
    earns: true,
    countsToMilestone: true,
    verified: false,
    notes:
      'Business card: earns 10X (20 CP/₹200) on IT/GST, shares the 1,500 CP/cycle 10X cap. Milestone (2,000 CP on ₹1L/qtr) excludes only rent/fuel, so tax MAY count — UNCONFIRMED (differs from BizPower). community.',
  },
  'au-ca-metal': {
    earns: true,
    countsToMilestone: false,
    verified: false,
    notes:
      'CA card: 8 RP/₹100 on tax (cap 5,000 RP/cycle) — but MCC-GATED: earns only if the txn codes under Tax MCC 9311, NOT Govt 9399; community reports AU rails may not process GST/IT as the 8X category (UNCONFIRMED). No spend milestone (welcome benefits only). community.',
  },
  'idfc-business-multiplier': {
    earns: true,
    countsToMilestone: false,
    verified: false,
    notes: 'FD-backed business card: 10 RP/₹200 on GST/tax up to ₹1L/mo, then 5 RP/₹200. No spend milestone. community.',
  },
  'idfc-business-max': {
    earns: true,
    countsToMilestone: false,
    verified: false,
    notes:
      'FD-backed, requires active GST. GST/tax earn rate UNCONFIRMED — likely base/utility 1 RP/₹200, no accelerated tax multiplier (unlike Business Multiplier). No milestone. community.',
  },

  // ---- Axis: tax counts toward NEITHER earning nor milestones ----
  'axis-magnus': { earns: false, countsToMilestone: false, verified: false, notes: 'Axis: tax/govt earns nothing AND does not count toward cumulative spend / milestones (@RushilM_, community).' },
  'axis-magnus-burgundy': { earns: false, countsToMilestone: false, verified: false, notes: 'Axis: tax/govt earns nothing and does not count toward cumulative spend / milestones. community.' },
  'axis-atlas': { earns: false, countsToMilestone: false, verified: false, notes: 'Atlas explicitly excludes govt/tax (MCC 9311/9399/9222/9402) from milestone tiers; earning on govt is excluded too. community.' },
  'axis-privilege': { earns: false, countsToMilestone: false, verified: false, notes: 'Axis: tax/govt earns nothing and does not count toward cumulative spend / milestones. community.' },
}

// Pure lookups (mirror surcharges.ts / milestones.ts / redemptions.ts).
export function taxTreatmentFor(cardSlug: string): TaxPaymentsInput | undefined {
  return CARD_TAX_TREATMENT[cardSlug]
}
export function unknownTaxTreatmentKeys(cardSlugs: Set<string>): string[] {
  return Object.keys(CARD_TAX_TREATMENT)
    .filter((k) => !cardSlugs.has(k))
    .map((k) => `CARD_TAX_TREATMENT["${k}"]`)
}
