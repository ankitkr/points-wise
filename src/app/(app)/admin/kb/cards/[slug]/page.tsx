import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getDb } from '@/db/client'
import { getCardDetail } from '@/lib/kb/queries'
import { cardAccount, poolAccount, NETWORKS } from '@/lib/kb/schema'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { addRule, updateCard } from '../../actions'
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
  const { card, bank, rules } = detail

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-8 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{card.name}</h1>
        <Link href="/admin/kb" className="text-sm text-muted-foreground underline-offset-2 hover:underline">
          ← Knowledge Base
        </Link>
      </div>
      {error && (
        <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Card</CardTitle>
          <CardDescription>
            <span className="font-mono text-xs">
              {cardAccount(bank, card)} · {poolAccount(bank, card.beancountName, card.poolTicker)} ({card.poolTicker})
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Earn rules ({rules.length})</CardTitle>
          <CardDescription>Versioned, append-only — a rate change is a new version.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-3">
            {rules.map((r) => (
              <li key={r.id} className="rounded-md border p-3 text-sm">
                <div className="mb-1 flex items-center gap-2">
                  <span className="font-medium">from {r.effectiveFrom}</span>
                  {r.rule?.verified ? (
                    <Badge variant="secondary">verified</Badge>
                  ) : (
                    <Badge variant="outline">unverified</Badge>
                  )}
                </div>
                {r.rule ? (
                  <div className="space-y-1 text-muted-foreground">
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
                  </div>
                ) : (
                  <span className="text-destructive">unparseable rule payload</span>
                )}
              </li>
            ))}
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
