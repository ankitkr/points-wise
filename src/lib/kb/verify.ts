import { z } from 'zod'
import { slugSchema, dateSchema, tickerSchema } from './schema'

// Verification overrides — the addressing + effective-state logic, kept pure so
// the admin page (which renders the buttons), the server action (which writes),
// and the tests all agree on the exact keys. A verifiable entity is anything in
// the KB that carries its own `verified` flag.

export const VERIFY_ENTITY_TYPES = ['rule', 'surcharge', 'milestone', 'redemption', 'tax', 'valuation'] as const
export type VerifyEntityType = (typeof VERIFY_ENTITY_TYPES)[number]

// Stable keys — must not depend on array order except where an index is the only
// natural identity (milestones), and must survive a reseed. `card@from` scopes an
// entity to a specific rule version; `#suffix` distinguishes items within it.
export const ruleKey = (cardSlug: string, effectiveFrom: string) => `${cardSlug}@${effectiveFrom}`
export const surchargeKey = (cardSlug: string, effectiveFrom: string, kind: string) =>
  `${cardSlug}@${effectiveFrom}#${kind}`
export const milestoneKey = (cardSlug: string, effectiveFrom: string, idx: number) =>
  `${cardSlug}@${effectiveFrom}#${idx}`
export const redemptionKey = (cardSlug: string, effectiveFrom: string) => `${cardSlug}@${effectiveFrom}`
export const taxKey = (cardSlug: string, effectiveFrom: string) => `${cardSlug}@${effectiveFrom}`
export const valuationKey = (ticker: string) => ticker

// The map the page/list builds from the overrides table. Map key namespaces the
// entity type so a rule and a redemption sharing `card@from` never collide.
export const mapKey = (entityType: VerifyEntityType, entityKey: string) => `${entityType}:${entityKey}`

// Effective verified state: an admin override wins over the seed's flag; absent
// an override, fall back to whatever the seed shipped.
export function effectiveVerified(
  overrides: Map<string, boolean>,
  entityType: VerifyEntityType,
  entityKey: string,
  seedVerified: boolean,
): boolean {
  const o = overrides.get(mapKey(entityType, entityKey))
  return o === undefined ? seedVerified : o
}

// Server-action input: the entity being (un)verified and the desired new state.
// entityKey is loosely validated (it embeds a slug/date/ticker + suffix); the
// authoritative check is that the referenced entity actually exists (done by the
// action against the parsed rule), so we only guard shape/length here.
export const verificationInputSchema = z.object({
  entityType: z.enum(VERIFY_ENTITY_TYPES),
  entityKey: z.string().min(1).max(128),
  verified: z.boolean(),
  note: z.string().max(500).optional(),
})
export type VerificationInput = z.infer<typeof verificationInputSchema>

// Re-exported so callers building keys can validate their inputs if they want.
export { slugSchema, dateSchema, tickerSchema }
