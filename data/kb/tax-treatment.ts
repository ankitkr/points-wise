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
      'Personal HDFC: tax (MCC 9311/9399) earns 0. Community/@RushilM_ say it counts toward the ₹18L annual milestone; other reports say fee-waiver/milestone spend excludes the same categories as earning. DISPUTED — verify on MITC.',
  },
  'hdfc-diners-black': {
    earns: false,
    countsToMilestone: true,
    verified: false,
    notes: 'Tax earns 0; @RushilM_ says it counts toward the ₹4L quarterly milestone (10K RP). DISPUTED — verify on MITC.',
  },
  'hdfc-regalia-gold': {
    earns: false,
    countsToMilestone: true,
    verified: false,
    notes: 'Tax earns 0; @RushilM_ says it counts toward the ₹1.5L quarterly milestone (₹1.5K GV). DISPUTED — verify on MITC.',
  },
  // ---- HDFC business: tax/GST NOT excluded → earns AND counts to milestone ----
  'hdfc-bizblack': {
    earns: true,
    countsToMilestone: true,
    verified: false,
    notes:
      'Business card — govt/tax is NOT in the RP-exclusion list (only petrol/wallet/rent/education/EMI are). Earns 5 RP/₹150 base, 5X (25 RP/₹150) on >₹50k/cycle, cap ~7,500 RP/cycle; and counts toward the ₹5L→₹5K voucher milestone (max ₹20K/yr). community.',
  },

  // ---- Amex: tax earns 0 MR but counts toward the spend milestones ----
  'amex-platinum-travel': {
    earns: false,
    countsToMilestone: true,
    verified: false,
    notes:
      'Tax earns 0 MR (@RushilM_ / @bigulchugh) but counts toward the ₹1.9L (7.5K MR) / ₹4L (10K MR) / ₹7L (22.5K MR + ₹10K Taj GV) milestones. Pay via the Canara or Axis payment gateway (accept Amex). community.',
  },
  'amex-mrcc': {
    earns: false,
    countsToMilestone: true,
    verified: false,
    notes:
      'Tax earns ~0 base MR but counts toward the ₹20K/mo (1K MR) + 4×₹1.5K txn (1K MR) milestones. (Some sources claim 1 MR/₹50 on tax — conflicting; treat earn as 0.) community.',
  },

  // ---- ICICI: Emeralde PM excludes tax from earning; milestone counts ----
  'icici-emeralde': {
    earns: false,
    countsToMilestone: true,
    verified: false,
    notes:
      '2026 notice excludes Govt/Fuel/Rent/Tax from reward points; but @RushilM_ says tax counts toward the ₹4L & ₹8L milestones (₹3K EaseMyTrip GV). DISPUTED on the milestone side — verify on MITC.',
  },

  // ---- HSBC / SC: earn on tax (community), milestone-counting unconfirmed ----
  'hsbc-premier': {
    earns: true,
    countsToMilestone: false,
    verified: false,
    notes: 'Community: earns 3 RP/₹100 on tax, capped ~₹1L (@bigulchugh netted ~2.1% via ICICI gateway, ~5% via Accor). Milestone-counting not established. community.',
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
