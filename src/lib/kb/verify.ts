import { z } from 'zod'
import type { EarnRule } from './schema'

// Verification overrides — addressing + effective-state logic, kept pure so the
// admin page (renders buttons), the server action (writes + validates), and the
// tests all agree. A verifiable entity is anything in the KB carrying its own
// `verified` flag: an earn rule, each surcharge / milestone merged into it, its
// redemption + tax blocks, and a per-ticker valuation.
//
// KEY DESIGN (Codex review): an entity key is `<scope>:<contentHash>` where scope
// ties it to a card+version (or a ticker) and the hash is over the entity's
// canonical contents. Consequences:
//   • No positional/`kind` collisions — two same-`kind` surcharges with different
//     contents (e.g. IDFC Wealth's two fuel entries) get different hashes.
//   • Reorder-safe — a milestone's key follows its contents, not its array index.
//   • Content-aware durability — if a reseed materially changes a rate, the hash
//     changes, the old override no longer matches, and the entity falls back to
//     the seed flag (i.e. a changed fact is NOT silently left "verified").

export const VERIFY_ENTITY_TYPES = ['rule', 'surcharge', 'milestone', 'redemption', 'tax', 'valuation'] as const
export type VerifyEntityType = (typeof VERIFY_ENTITY_TYPES)[number]

// Canonical form for IDENTITY hashing. Deliberately excludes fields that are
// metadata, not identity (Codex review):
//   • `verified` — the bootstrap flag. If it were hashed, a seed that merely flips
//     it would change the key and silently DETACH an admin override.
//   • `notes` — cosmetic; a wording edit must not invalidate a verification.
// Object keys are sorted (source order can't matter) and arrays are treated as
// SETS (elements sorted by canonical form), so reordering an unordered list —
// MCCs, exclusions, accelerators, methods — doesn't change identity either.
function canonical(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null'
  if (Array.isArray(value)) return `[${value.map(canonical).sort().join(',')}]`
  const obj = value as Record<string, unknown>
  return `{${Object.keys(obj)
    .filter((k) => k !== 'verified' && k !== 'notes')
    .sort()
    .map((k) => `${JSON.stringify(k)}:${canonical(obj[k])}`)
    .join(',')}}`
}

// cyrb53 — a small, fast, well-distributed 53-bit string hash (sync, no crypto).
// 53 bits is ample for a few hundred KB entities; base-36 keeps the key short.
function cyrb53(str: string, seed = 0): number {
  let h1 = 0xdeadbeef ^ seed
  let h2 = 0x41c6ce57 ^ seed
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return 4294967296 * (2097151 & h2) + (h1 >>> 0)
}

const contentHash = (value: unknown): string => cyrb53(canonical(value)).toString(36)
const entityKey = (scope: string, content: unknown): string => `${scope}:${contentHash(content)}`
const cardScope = (cardSlug: string, effectiveFrom: string) => `${cardSlug}@${effectiveFrom}`

// The map the page/list builds from the overrides table. Map key namespaces the
// entity type so two types are never confused even if a hash coincided.
export const mapKey = (entityType: VerifyEntityType, entityKey: string) => `${entityType}:${entityKey}`

export function effectiveVerified(
  overrides: Map<string, boolean>,
  entityType: VerifyEntityType,
  key: string,
  seedVerified: boolean,
): boolean {
  const o = overrides.get(mapKey(entityType, key))
  return o === undefined ? seedVerified : o
}

export type VerifiableEntity = {
  entityType: VerifyEntityType
  entityKey: string
  seedVerified: boolean
  label: string
  // Provenance (redemption + valuation only): 'community' means the ₹/point value
  // is a consensus estimate with no official source — the UI shows "community
  // estimate" rather than an alarming "unverified".
  source?: 'official' | 'community'
}

// The earn-RATE identity: base, accelerators (+ the umbrella accelerated cap —
// materially rewards-affecting), spend tiers, and exclusions. NOT fees or the
// merged sub-entities (those verify independently), and `canonical()` further
// drops nested notes/verified so cosmetic edits don't invalidate the rule.
function ruleCore(rule: EarnRule) {
  return {
    base: rule.base,
    accelerators: rule.accelerators,
    acceleratedMonthlyCapPoints: rule.acceleratedMonthlyCapPoints,
    spendTiers: rule.spendTiers,
    exclusions: rule.exclusions,
    excludedMccs: rule.excludedMccs,
  }
}

// Every verifiable entity belonging to ONE earn-rule version (rule first).
export function ruleEntities(cardSlug: string, effectiveFrom: string, rule: EarnRule): VerifiableEntity[] {
  const scope = cardScope(cardSlug, effectiveFrom)
  const out: VerifiableEntity[] = [
    { entityType: 'rule', entityKey: entityKey(scope, ruleCore(rule)), seedVerified: rule.verified, label: `Rule from ${effectiveFrom}` },
  ]
  for (const s of rule.surcharges) {
    const bits = [s.percent != null ? `${s.percent}%` : null, s.flat != null ? `₹${s.flat}` : null].filter(Boolean).join(' + ')
    out.push({
      entityType: 'surcharge',
      entityKey: entityKey(scope, s),
      seedVerified: s.verified,
      label: `Surcharge · ${s.kind}${bits ? ` ${bits}` : ''}`,
    })
  }
  for (const m of rule.milestones) {
    out.push({
      entityType: 'milestone',
      entityKey: entityKey(scope, m),
      seedVerified: m.verified,
      label: `Milestone · ${m.kind}${m.spendThreshold ? ` @ ₹${m.spendThreshold}` : ''}${m.label ? ` (${m.label})` : ''}`,
    })
  }
  if (rule.redemption) {
    out.push({
      entityType: 'redemption',
      entityKey: entityKey(scope, rule.redemption),
      seedVerified: rule.redemption.verified,
      source: rule.redemption.source,
      label: `Redemption · ${rule.redemption.methods.length} method(s), ${rule.redemption.transferPartners.length} partner(s)`,
    })
  }
  if (rule.taxPayments) {
    out.push({
      entityType: 'tax',
      entityKey: entityKey(scope, rule.taxPayments),
      seedVerified: rule.taxPayments.verified,
      label: `Tax/GST · earns ${rule.taxPayments.earns ? 'yes' : 'no'}, milestone ${rule.taxPayments.countsToMilestone ? 'yes' : 'no'}`,
    })
  }
  return out
}

// The per-ticker valuation entity. `seed` is the D1 row (null if not seeded yet).
export function valuationEntity(
  ticker: string,
  seed: { floorInr: number; realisticInr: number; bestInr: number; source: string; verified: number } | null,
): VerifiableEntity {
  const content = seed
    ? { floorInr: seed.floorInr, realisticInr: seed.realisticInr, bestInr: seed.bestInr, source: seed.source }
    : { ticker }
  return {
    entityType: 'valuation',
    entityKey: entityKey(ticker, content),
    seedVerified: seed ? seed.verified === 1 : false,
    source: (seed ? seed.source : 'community') as 'official' | 'community',
    label: `Valuation · ${ticker}`,
  }
}

// Server-action input: the entity being (un)verified and its desired new state.
export const verificationInputSchema = z.object({
  entityType: z.enum(VERIFY_ENTITY_TYPES),
  entityKey: z.string().min(1).max(128),
  verified: z.boolean(),
  note: z.string().max(500).optional(),
})
export type VerificationInput = z.infer<typeof verificationInputSchema>
