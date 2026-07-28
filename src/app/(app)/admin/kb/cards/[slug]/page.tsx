import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getDb } from '@/db/client'
import { getCardDetail } from '@/lib/kb/queries'
import { cardAccount, poolAccount, NETWORKS } from '@/lib/kb/schema'
import {
  effectiveVerified,
  milestoneKey,
  redemptionKey,
  ruleKey,
  surchargeKey,
  taxKey,
  valuationKey,
  type VerifyEntityType,
} from '@/lib/kb/verify'
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
  const { card, bank, rules, overrides } = detail

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

          {/* Reward-currency valuation verification (per pool ticker; not seeded to
              D1, so seed-verified defaults false — admin override is the source). */}
          <div className="flex items-center justify-between rounded-md border p-3 text-sm">
            <span>
              Valuation · <span className="font-mono text-xs">{card.poolTicker}</span>
            </span>
            <VerifyButton
              cardSlug={card.slug}
              entityType="valuation"
              entityKey={valuationKey(card.poolTicker)}
              current={effectiveVerified(overrides, 'valuation', valuationKey(card.poolTicker), false)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Earn rules ({rules.length})</CardTitle>
          <CardDescription>
            Versioned, append-only. Verify each item against an official bank source — the badge is an admin
            override that survives a reseed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-3">
            {rules.map((r) => {
              const from = r.effectiveFrom
              return (
                <li key={r.id} className="rounded-md border p-3 text-sm">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="font-medium">from {from}</span>
                    <VerifyButton
                      cardSlug={card.slug}
                      entityType="rule"
                      entityKey={ruleKey(card.slug, from)}
                      current={effectiveVerified(overrides, 'rule', ruleKey(card.slug, from), r.rule?.verified ?? false)}
                    />
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
                      {r.rule.exclusions.length > 0 && <div>Excluded: {r.rule.exclusions.join(', ')}</div>}
                      {r.rule.notes && <div className="text-xs">{r.rule.notes}</div>}

                      {/* Per-sub-item verification rows */}
                      {r.rule.surcharges.map((s) => (
                        <VerifyRow
                          key={`s-${s.kind}`}
                          cardSlug={card.slug}
                          entityType="surcharge"
                          entityKey={surchargeKey(card.slug, from, s.kind)}
                          label={`Surcharge · ${s.kind}${s.percent != null ? ` ${s.percent}%` : ''}${s.flat != null ? ` ₹${s.flat}` : ''}`}
                          current={effectiveVerified(overrides, 'surcharge', surchargeKey(card.slug, from, s.kind), s.verified)}
                        />
                      ))}
                      {r.rule.milestones.map((m, i) => (
                        <VerifyRow
                          key={`m-${i}`}
                          cardSlug={card.slug}
                          entityType="milestone"
                          entityKey={milestoneKey(card.slug, from, i)}
                          label={`Milestone · ${m.kind}${m.spendThreshold ? ` @ ₹${m.spendThreshold}` : ''}${m.label ? ` (${m.label})` : ''}`}
                          current={effectiveVerified(overrides, 'milestone', milestoneKey(card.slug, from, i), m.verified)}
                        />
                      ))}
                      {r.rule.redemption && (
                        <VerifyRow
                          cardSlug={card.slug}
                          entityType="redemption"
                          entityKey={redemptionKey(card.slug, from)}
                          label={`Redemption · ${r.rule.redemption.methods.length} method(s), ${r.rule.redemption.transferPartners.length} partner(s)`}
                          current={effectiveVerified(overrides, 'redemption', redemptionKey(card.slug, from), r.rule.redemption.verified)}
                        />
                      )}
                      {r.rule.taxPayments && (
                        <VerifyRow
                          cardSlug={card.slug}
                          entityType="tax"
                          entityKey={taxKey(card.slug, from)}
                          label={`Tax/GST · earns ${r.rule.taxPayments.earns ? 'yes' : 'no'}, milestone ${r.rule.taxPayments.countsToMilestone ? 'yes' : 'no'}`}
                          current={effectiveVerified(overrides, 'tax', taxKey(card.slug, from), r.rule.taxPayments.verified)}
                        />
                      )}
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

// A verified/unverified badge + a one-click toggle that posts the DESIRED next
// state to the admin-gated verifyEntity action.
function VerifyButton({
  cardSlug,
  entityType,
  entityKey,
  current,
}: {
  cardSlug: string
  entityType: VerifyEntityType
  entityKey: string
  current: boolean
}) {
  return (
    <form action={verifyEntity} className="flex items-center gap-2">
      <input type="hidden" name="cardSlug" value={cardSlug} />
      <input type="hidden" name="entityType" value={entityType} />
      <input type="hidden" name="entityKey" value={entityKey} />
      <input type="hidden" name="verified" value={current ? 'false' : 'true'} />
      {current ? <Badge variant="secondary">verified</Badge> : <Badge variant="outline">unverified</Badge>}
      <Button type="submit" size="sm" variant="ghost" className="h-6 px-2 text-xs">
        {current ? 'Un-verify' : 'Verify'}
      </Button>
    </form>
  )
}

// A labelled sub-item row with its own VerifyButton.
function VerifyRow(props: {
  cardSlug: string
  entityType: VerifyEntityType
  entityKey: string
  label: string
  current: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-2 border-t pt-2">
      <span className="text-xs">{props.label}</span>
      <VerifyButton cardSlug={props.cardSlug} entityType={props.entityType} entityKey={props.entityKey} current={props.current} />
    </div>
  )
}
