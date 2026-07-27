import { getDb } from '@/db/client'
import { listBanks } from '@/lib/kb/queries'
import { NETWORKS } from '@/lib/kb/schema'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { createCard } from '../../actions'
import { RuleFields } from '../../rule-fields'

export default async function NewCardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const db = await getDb()
  const banks = await listBanks(db)
  const { error } = await searchParams

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-8 py-10">
      <h1 className="text-2xl font-semibold">New card</h1>
      {error && (
        <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Card details</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createCard} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="bankSlug">Bank</Label>
                <Select id="bankSlug" name="bankSlug" required defaultValue="">
                  <option value="" disabled>
                    Select bank…
                  </option>
                  {banks.map((b) => (
                    <option key={b.slug} value={b.slug}>
                      {b.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="network">Network</Label>
                <Select id="network" name="network" defaultValue="">
                  <option value="">—</option>
                  {NETWORKS.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="name">Display name</Label>
                <Input id="name" name="name" required placeholder="HDFC Infinia" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="slug">Slug</Label>
                <Input id="slug" name="slug" required placeholder="hdfc-infinia" pattern="[a-z0-9]+(-[a-z0-9]+)*" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="beancountName">Beancount name</Label>
                <Input id="beancountName" name="beancountName" required placeholder="Infinia" pattern="[A-Z][A-Za-z0-9]*" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="poolTicker">Pool ticker</Label>
                <Input id="poolTicker" name="poolTicker" required placeholder="HDFC_RP" pattern="[A-Z][A-Z0-9_]{1,15}" />
              </div>
              <div className="col-span-2 space-y-1">
                <Label htmlFor="poolProgramme">Reward programme</Label>
                <Input id="poolProgramme" name="poolProgramme" required placeholder="HDFC Reward Points" />
              </div>
            </div>

            <RuleFields />

            <Button type="submit">Create card</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
