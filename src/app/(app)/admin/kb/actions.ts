'use server'

import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { getDb } from '@/db/client'
import { kbProposals } from '@/db/schema'
import { requireAdmin } from '@/lib/authz'
import {
  addRuleVersion,
  applyProposal,
  insertCardWithRule,
  setVerification,
  updateCardFields,
} from '@/lib/kb/mutations'
import { cardSchema, earnRuleSchema, proposalPayloadSchema, NETWORKS } from '@/lib/kb/schema'
import { VERIFY_ENTITY_TYPES, type VerifyEntityType } from '@/lib/kb/verify'

// Every action: session → requireAdmin (fresh D1 read of users.is_admin) →
// Zod-validated mutation. Errors redirect back with ?error= so the admin sees
// the validation reason inline.

async function adminCtx() {
  const session = await auth()
  if (!session) throw new Error('unauthenticated')
  const db = await getDb()
  const adminUserId = await requireAdmin(db, session.user.discordId)
  return { db, adminUserId }
}

function backWithError(path: string, e: unknown): never {
  const msg = e instanceof Error ? e.message : String(e)
  redirect(`${path}?error=${encodeURIComponent(msg.slice(0, 300))}`)
}

// Shared: build an EarnRule from the rule fieldset present on both card forms.
function ruleFromForm(f: FormData) {
  const accelerators = String(f.get('accelerators') ?? '').trim()
  const exclusions = String(f.get('exclusions') ?? '').trim()
  const spendTiers = String(f.get('spendTiers') ?? '').trim()
  const surcharges = String(f.get('surcharges') ?? '').trim()
  const milestones = String(f.get('milestones') ?? '').trim()
  return earnRuleSchema.parse({
    effectiveFrom: String(f.get('effectiveFrom') ?? ''),
    base: { points: Number(f.get('basePoints')), per: Number(f.get('basePer')) },
    accelerators: accelerators ? JSON.parse(accelerators) : [],
    exclusions: exclusions ? exclusions.split(',').map((s) => s.trim()).filter(Boolean) : [],
    // Spend tiers, surcharges and milestones are entered as JSON (admin tool);
    // the Zod parse echoes precise errors back. Omitting them no longer silently
    // drops them — an admin editing a seeded card must carry these forward.
    spendTiers: spendTiers ? JSON.parse(spendTiers) : [],
    surcharges: surcharges ? JSON.parse(surcharges) : [],
    milestones: milestones ? JSON.parse(milestones) : [],
    verified: f.get('verified') === 'on',
    notes: String(f.get('notes') ?? '').trim() || undefined,
  })
}

export async function createCard(formData: FormData) {
  try {
    const { db } = await adminCtx()
    const card = cardSchema.parse({
      slug: String(formData.get('slug') ?? ''),
      bankSlug: String(formData.get('bankSlug') ?? ''),
      name: String(formData.get('name') ?? ''),
      beancountName: String(formData.get('beancountName') ?? ''),
      network: (formData.get('network') || undefined) as (typeof NETWORKS)[number] | undefined,
      pool: {
        ticker: String(formData.get('poolTicker') ?? ''),
        programme: String(formData.get('poolProgramme') ?? ''),
      },
      active: true,
    })
    await insertCardWithRule(db, card, ruleFromForm(formData))
  } catch (e) {
    backWithError('/admin/kb/cards/new', e)
  }
  revalidatePath('/admin/kb')
  redirect('/admin/kb')
}

export async function updateCard(formData: FormData) {
  const slug = String(formData.get('slug') ?? '')
  try {
    const { db } = await adminCtx()
    await updateCardFields(db, slug, {
      name: String(formData.get('name') ?? '') || undefined,
      network: (formData.get('network') || undefined) as (typeof NETWORKS)[number] | undefined,
      active: formData.get('active') === 'on',
      poolProgramme: String(formData.get('poolProgramme') ?? '') || undefined,
    })
  } catch (e) {
    backWithError(`/admin/kb/cards/${slug}`, e)
  }
  revalidatePath(`/admin/kb/cards/${slug}`)
  redirect(`/admin/kb/cards/${slug}`)
}

export async function addRule(formData: FormData) {
  const slug = String(formData.get('cardSlug') ?? '')
  try {
    const { db } = await adminCtx()
    await addRuleVersion(db, slug, ruleFromForm(formData))
  } catch (e) {
    backWithError(`/admin/kb/cards/${slug}`, e)
  }
  revalidatePath(`/admin/kb/cards/${slug}`)
  redirect(`/admin/kb/cards/${slug}`)
}

// Toggle an admin verification override for one KB entity (rule / surcharge /
// milestone / redemption / tax / valuation). Writes to kb_verifications only, so
// it survives a reseed. The button posts the DESIRED next state in `verified`.
export async function verifyEntity(formData: FormData) {
  const cardSlug = String(formData.get('cardSlug') ?? '')
  const back = cardSlug ? `/admin/kb/cards/${cardSlug}` : '/admin/kb'
  try {
    const { db, adminUserId } = await adminCtx()
    const entityType = String(formData.get('entityType') ?? '') as VerifyEntityType
    if (!VERIFY_ENTITY_TYPES.includes(entityType)) throw new Error(`unknown entity type: ${entityType}`)
    await setVerification(db, adminUserId, {
      entityType,
      entityKey: String(formData.get('entityKey') ?? ''),
      verified: formData.get('verified') === 'true',
      note: String(formData.get('note') ?? '').trim() || undefined,
    })
  } catch (e) {
    backWithError(back, e)
  }
  revalidatePath(back)
  revalidatePath('/admin/kb')
  redirect(back)
}

export async function approveProposal(formData: FormData) {
  const id = String(formData.get('id') ?? '')
  try {
    const { db, adminUserId } = await adminCtx()
    const proposal = await db.query.kbProposals.findFirst({ where: eq(kbProposals.id, id) })
    if (!proposal) throw new Error('proposal not found')
    // Re-validate the stored payload before applying — never trust old JSON.
    const payload = proposalPayloadSchema.parse(JSON.parse(proposal.payloadJson))

    // CLAIM first (guarded on status=pending) so concurrent reviews / double
    // submits cannot both act on the same proposal.
    const claimed = await db
      .update(kbProposals)
      .set({ status: 'approved', reviewedBy: adminUserId, reviewedAt: Date.now() })
      .where(and(eq(kbProposals.id, id), eq(kbProposals.status, 'pending')))
      .returning({ id: kbProposals.id })
    if (claimed.length === 0) throw new Error('proposal is no longer pending')

    try {
      await applyProposal(db, payload)
    } catch (applyErr) {
      // Applying failed — release the claim so the proposal can be retried.
      await db
        .update(kbProposals)
        .set({ status: 'pending', reviewedBy: null, reviewedAt: null })
        .where(eq(kbProposals.id, id))
      throw applyErr
    }
  } catch (e) {
    backWithError('/admin/kb/proposals', e)
  }
  revalidatePath('/admin/kb/proposals')
  revalidatePath('/admin/kb')
}

export async function rejectProposal(formData: FormData) {
  try {
    const { db, adminUserId } = await adminCtx()
    const id = String(formData.get('id') ?? '')
    const reason = String(formData.get('reason') ?? '').trim()
    const updated = await db
      .update(kbProposals)
      .set({
        status: 'rejected',
        reviewedBy: adminUserId,
        reviewedAt: Date.now(),
        rejectionReason: reason || null,
      })
      // Guarded: an already-approved/rejected proposal cannot be overwritten.
      .where(and(eq(kbProposals.id, id), eq(kbProposals.status, 'pending')))
      .returning({ id: kbProposals.id })
    if (updated.length === 0) throw new Error('proposal is no longer pending')
  } catch (e) {
    backWithError('/admin/kb/proposals', e)
  }
  revalidatePath('/admin/kb/proposals')
}
