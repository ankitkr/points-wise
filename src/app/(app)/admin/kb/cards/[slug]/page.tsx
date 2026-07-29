import type { ReactNode } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getDb } from '@/db/client'
import { getCardDetail } from '@/lib/kb/queries'
import {
  cardAccount,
  poolAccount,
  NETWORKS,
  type EarnRule,
  type Surcharge,
  type Milestone,
  type Redemption,
  type TaxPayments,
} from '@/lib/kb/schema'
import { effectiveVerified, ruleEntities, valuationEntity, type VerifiableEntity } from '@/lib/kb/verify'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { addRule, updateCard, verifyEntity } from '../../actions'
import { RuleFields } from '../../rule-fields'

export default async function EditCardPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { slug } = await params
  const { error } = await searchParams
  const db = await getDb()
  const detail = await getCardDetail(db, slug)
  if (!detail) notFound()
  const { card, bank, rules, overrides, valuation } = detail

  // Effective verified for an entity: admin override wins over the seed flag.
  const cur = (e: VerifiableEntity) => effectiveVerified(overrides, e.entityType, e.entityKey, e.seedVerified)
  const valEntity = valuationEntity(card.poolTicker, valuation)

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-8 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{card.name}</h1>
        <Link href="/admin/kb" className="text-sm text-muted-foreground underline-offset-2 hover:underline">
          ← Knowledge Base
        </Link>
      </div>
      {error && <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}

      <Card>
        <CardHeader>
          <CardTitle>Card</CardTitle>
          <CardDescription>
            <span className="font-mono text-xs">
              {cardAccount(bank, card)} · {poolAccount(bank, card.beancountName, card.poolTicker)} ({card.poolTicker})
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form action={updateCard} className="space-y-4">
            <input type="hidden" name="slug" value={card.slug} />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="name">Display name</Label>
                <Input id="name" name="name" defaultValue={card.name} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="network">Network</Label>
                <Select id="network" name="network" defaultValue={card.network ?? ''}>
                  <option value="">—</option>
                  {NETWORKS.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="poolProgramme">Reward programme</Label>
                <Input id="poolProgramme" name="poolProgramme" defaultValue={card.poolProgramme} />
              </div>
              <label className="mt-6 flex items-center gap-2 text-sm">
                <input type="checkbox" name="active" defaultChecked={card.active === 1} className="h-4 w-4" />
                Active
              </label>
            </div>
            <Button type="submit">Save card</Button>
          </form>

          <div className="flex items-center justify-between rounded-md border p-3 text-sm">
            <span>{valEntity.label}</span>
            <VerifyButton cardSlug={card.slug} entity={valEntity} current={cur(valEntity)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Earn rules ({rules.length})</CardTitle>
          <CardDescription>
            Versioned, append-only. Verify each item against an official bank source — the badge is an admin
            override that survives a reseed (and clears itself if the underlying value later changes).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-3">
            {rules.map((r) => {
              const entities = r.rule ? ruleEntities(card.slug, r.effectiveFrom, r.rule) : []
              const ruleEntity = entities[0]
              // Pair each sub-entity with the source object it was built from. The
              // order MUST mirror ruleEntities(): surcharges, milestones, redemption,
              // tax — walked from index 1 (index 0 is the rule itself).
              const subRows = r.rule ? subEntityRows(r.rule, entities) : []
              return (
                <li key={r.id} className="rounded-md border p-3 text-sm">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="font-medium">from {r.effectiveFrom}</span>
                    {ruleEntity && <VerifyButton cardSlug={card.slug} entity={ruleEntity} current={cur(ruleEntity)} />}
                  </div>
                  {r.rule ? (
                    <div className="space-y-2 text-muted-foreground">
                      <div>
                        Base: {r.rule.base.points} pts / ₹{r.rule.base.per}
                      </div>
                      {r.rule.accelerators.length > 0 && (
                        <div>
                          Accelerators:{' '}
                          {r.rule.accelerators
                            .map((a) => `${a.label} ${a.multiplier}x${a.monthlyCapPoints ? ` (cap ${a.monthlyCapPoints})` : ''}`)
                            .join(' · ')}
                        </div>
                      )}
                      {r.rule.acceleratedMonthlyCapPoints != null && (
                        <div>Accelerated cap: {r.rule.acceleratedMonthlyCapPoints.toLocaleString('en-IN')} pts/mo (umbrella)</div>
                      )}
                      {r.rule.spendTiers.length > 0 && (
                        <div>
                          Spend tiers:{' '}
                          {r.rule.spendTiers
                            .map(
                              (t) =>
                                `${t.points}/₹${t.per} from ${inr(t.fromMonthlySpend)}${t.toMonthlySpend ? `–${inr(t.toMonthlySpend)}` : '+'}/mo`,
                            )
                            .join(' · ')}
                        </div>
                      )}
                      {r.rule.exclusions.length > 0 && <div>Excluded: {r.rule.exclusions.join(', ')}</div>}
                      {r.rule.notes && <div className="text-xs">{r.rule.notes}</div>}
                      {subRows.map(({ entity, detail }) => (
                        <ExpandableRow
                          key={entity.entityKey}
                          cardSlug={card.slug}
                          entity={entity}
                          current={cur(entity)}
                          detail={detail}
                        />
                      ))}
                    </div>
                  ) : (
                    <span className="text-destructive">unparseable rule payload</span>
                  )}
                </li>
              )
            })}
          </ul>

          <form action={addRule} className="space-y-4">
            <input type="hidden" name="cardSlug" value={card.slug} />
            <RuleFields />
            <Button type="submit" variant="outline">
              Add rule version
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

// A verified/unverified badge + a one-click toggle posting the DESIRED next state
// to the admin-gated verifyEntity action.
function VerifyButton({ cardSlug, entity, current }: { cardSlug: string; entity: VerifiableEntity; current: boolean }) {
  return (
    <form action={verifyEntity} className="flex items-center gap-2">
      <input type="hidden" name="cardSlug" value={cardSlug} />
      <input type="hidden" name="entityType" value={entity.entityType} />
      <input type="hidden" name="entityKey" value={entity.entityKey} />
      <input type="hidden" name="verified" value={current ? 'false' : 'true'} />
      {current ? (
        <Badge variant="secondary">verified</Badge>
      ) : entity.source === 'community' ? (
        // Community estimate (e.g. ₹/point) — no official source exists, so this is
        // a legitimate state, not a forgotten check. Distinct from "unverified".
        <Badge variant="outline" className="text-muted-foreground">community estimate</Badge>
      ) : (
        <Badge variant="outline">unverified</Badge>
      )}
      <Button type="submit" size="sm" variant="ghost" className="h-6 px-2 text-xs">
        {current ? 'Un-verify' : 'Verify'}
      </Button>
    </form>
  )
}

// A sub-entity row: the one-line label stays visible; a native <details> lets an
// admin expand the full field-by-field detail. The verify button sits outside the
// <summary> (a click anywhere inside a summary toggles it — a submit button there
// would both toggle AND submit), aligned to the top so it stays put when expanded.
function ExpandableRow({
  cardSlug,
  entity,
  current,
  detail,
}: {
  cardSlug: string
  entity: VerifiableEntity
  current: boolean
  detail: ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-2 border-t pt-2 text-xs">
      <details className="group min-w-0 flex-1 [&_summary::-webkit-details-marker]:hidden">
        <summary className="flex cursor-pointer items-center gap-1 [&::marker]:content-none">
          <span aria-hidden className="text-muted-foreground transition-transform group-open:rotate-90">
            ▸
          </span>
          <span>{entity.label}</span>
        </summary>
        <dl className="mt-2 space-y-1 rounded-md bg-muted/40 p-2">{detail}</dl>
      </details>
      <VerifyButton cardSlug={cardSlug} entity={entity} current={current} />
    </div>
  )
}

// One "Label: value" line inside an expanded detail panel; renders nothing when
// the value is absent so the panel only shows fields that are actually set.
function Field({ k, children }: { k: string; children: ReactNode }) {
  if (children == null || children === '' || children === false) return null
  return (
    <div className="flex gap-2">
      <dt className="shrink-0 font-medium text-foreground">{k}</dt>
      <dd className="text-muted-foreground">{children}</dd>
    </div>
  )
}

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`

// Pair every verifiable sub-entity with the detail node for its source object,
// walking the SAME order ruleEntities() emits (surcharges, milestones, redemption,
// tax) from index 1 so entity[i] always matches the object rendered.
function subEntityRows(rule: EarnRule, entities: VerifiableEntity[]): { entity: VerifiableEntity; detail: ReactNode }[] {
  const rows: { entity: VerifiableEntity; detail: ReactNode }[] = []
  let i = 1
  for (const s of rule.surcharges) rows.push({ entity: entities[i++], detail: <SurchargeDetail s={s} /> })
  for (const m of rule.milestones) rows.push({ entity: entities[i++], detail: <MilestoneDetail m={m} /> })
  if (rule.redemption) rows.push({ entity: entities[i++], detail: <RedemptionDetail r={rule.redemption} /> })
  if (rule.taxPayments) rows.push({ entity: entities[i++], detail: <TaxDetail t={rule.taxPayments} /> })
  return rows
}

function SurchargeDetail({ s }: { s: Surcharge }) {
  const rate = [s.percent != null ? `${s.percent}%` : null, s.flat != null ? inr(s.flat) : null]
    .filter(Boolean)
    .join(s.combine === 'max' ? ' or ' : ' + ')
  return (
    <>
      <Field k="Kind">{s.kind}</Field>
      <Field k="Rate">{rate || null}</Field>
      <Field k="Category">{s.category}</Field>
      <Field k="MCCs">{s.mccs?.join(', ')}</Field>
      <Field k="Threshold">{s.threshold != null ? `${inr(s.threshold)} (${s.thresholdBasis})` : null}</Field>
      <Field k="Applies to">{s.applies === 'above-threshold' ? 'amount above threshold' : 'full transaction'}</Field>
      <Field k="Per-txn cap">{s.perTxnCap != null ? inr(s.perTxnCap) : null}</Field>
      <Field k="Waiver">{s.waiverCapPerCycle != null ? `up to ${inr(s.waiverCapPerCycle)}/${s.waiverPeriod}` : null}</Field>
      <Field k="Txn band">
        {s.txnMin != null || s.txnMax != null ? `${inr(s.txnMin ?? 0)}–${s.txnMax != null ? inr(s.txnMax) : '∞'}` : null}
      </Field>
      <Field k="GST">{s.plusGst ? '+18% GST' : 'no GST'}</Field>
      <Field k="Effective from">{s.effectiveFrom}</Field>
      <Field k="Notes">{s.notes}</Field>
    </>
  )
}

function MilestoneDetail({ m }: { m: Milestone }) {
  const reward = [
    m.points != null ? `${m.points.toLocaleString('en-IN')} pts${m.ticker ? ` ${m.ticker}` : ''}` : null,
    m.valueInr != null ? `${inr(m.valueInr)} value` : null,
  ]
    .filter(Boolean)
    .join(' · ')
  return (
    <>
      <Field k="Kind">{m.kind}</Field>
      <Field k="Threshold">{m.spendThreshold != null ? `${inr(m.spendThreshold)} per ${m.period}` : `none (${m.period})`}</Field>
      <Field k="Reward">{reward || null}</Field>
      <Field k="Repeatable">{m.repeatable ? 'yes — each threshold' : 'one-off'}</Field>
      <Field k="Label">{m.label}</Field>
      <Field k="Notes">{m.notes}</Field>
    </>
  )
}

function RedemptionDetail({ r }: { r: Redemption }) {
  return (
    <>
      <Field k="Methods">
        {r.methods.length > 0
          ? r.methods.map((m) => `${m.method} @ ₹${m.valuePerPoint}/pt${m.notes ? ` — ${m.notes}` : ''}`).join(' · ')
          : null}
      </Field>
      <Field k="Transfer partners">
        {r.transferPartners.length > 0
          ? r.transferPartners
              .map(
                (p) =>
                  `${p.partner} (${p.kind})${p.ratio ? ` ${p.ratio}` : ''}${p.valuePerPoint != null ? ` ₹${p.valuePerPoint}/pt` : ''}${p.notes ? ` — ${p.notes}` : ''}`,
              )
              .join(' · ')
          : null}
      </Field>
      <Field k="Portal utilization">{r.portalUtilizationPct != null ? `${r.portalUtilizationPct}%` : null}</Field>
      <Field k="Monthly transfer cap">
        {r.monthlyTransferCapPoints != null || r.monthlyTransferMaxTxns != null
          ? [
              r.monthlyTransferCapPoints != null ? `${r.monthlyTransferCapPoints.toLocaleString('en-IN')} pts` : null,
              r.monthlyTransferMaxTxns != null ? `${r.monthlyTransferMaxTxns} txns` : null,
            ]
              .filter(Boolean)
              .join(' / ')
          : null}
      </Field>
      <Field k="Annual transfer cap">{r.annualTransferCapPoints != null ? `${r.annualTransferCapPoints.toLocaleString('en-IN')} pts` : null}</Field>
      <Field k="Point expiry">{r.pointExpiryMonths != null ? `${r.pointExpiryMonths} months` : null}</Field>
      <Field k="Source">{r.source}</Field>
      <Field k="Notes">{r.notes}</Field>
    </>
  )
}

function TaxDetail({ t }: { t: TaxPayments }) {
  return (
    <>
      <Field k="Earns points">{t.earns ? 'yes' : 'no'}</Field>
      <Field k="Counts to milestone">{t.countsToMilestone ? 'yes' : 'no'}</Field>
      <Field k="Notes">{t.notes}</Field>
    </>
  )
}
