import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getDb } from '@/db/client'
import { getCardDetail } from '@/lib/kb/queries'
import { cardAccount, poolAccount, NETWORKS } from '@/lib/kb/schema'
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
              const subEntities = entities.slice(1)
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
                      {r.rule.exclusions.length > 0 && <div>Excluded: {r.rule.exclusions.join(', ')}</div>}
                      {r.rule.notes && <div className="text-xs">{r.rule.notes}</div>}
                      {subEntities.map((e) => (
                        <VerifyRow key={e.entityKey} cardSlug={card.slug} entity={e} current={cur(e)} />
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
      {current ? <Badge variant="secondary">verified</Badge> : <Badge variant="outline">unverified</Badge>}
      <Button type="submit" size="sm" variant="ghost" className="h-6 px-2 text-xs">
        {current ? 'Un-verify' : 'Verify'}
      </Button>
    </form>
  )
}

function VerifyRow({ cardSlug, entity, current }: { cardSlug: string; entity: VerifiableEntity; current: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2 border-t pt-2">
      <span className="text-xs">{entity.label}</span>
      <VerifyButton cardSlug={cardSlug} entity={entity} current={current} />
    </div>
  )
}
