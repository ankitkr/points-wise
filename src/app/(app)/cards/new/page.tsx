import Link from 'next/link'
import { getDb } from '@/db/client'
import { listCards } from '@/lib/kb/queries'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { openCardAction } from '../actions'

export default async function NewHeldCardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  const db = await getDb()
  const kbCards = (await listCards(db)).filter((c) => c.active)

  return (
    <div className="mx-auto max-w-xl space-y-6 px-8 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Add a card</h1>
        <Link href="/cards" className="text-sm text-muted-foreground underline-offset-2 hover:underline">
          ← Cards
        </Link>
      </div>
      {error && <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}

      <Card>
        <CardHeader>
          <CardTitle>Pick from the Knowledge Base</CardTitle>
          <CardDescription>
            Missing a card? <Link href="/kb/suggest" className="underline">Suggest it</Link> and an
            admin will add it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={openCardAction} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="kbSlug">Card</Label>
              <Select id="kbSlug" name="kbSlug" required defaultValue="">
                <option value="" disabled>
                  Select a card…
                </option>
                {kbCards.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.bankName} · {c.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="nickname">Nickname (optional)</Label>
                <Input id="nickname" name="nickname" placeholder="The black one" maxLength={60} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="last4">Last 4 digits (optional)</Label>
                <Input id="last4" name="last4" placeholder="1234" pattern="\d{4}" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="statementDay">Statement day (optional)</Label>
                <Input id="statementDay" name="statementDay" type="number" min={1} max={31} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="openedDate">Held since (optional)</Label>
                <Input id="openedDate" name="openedDate" type="date" />
              </div>
            </div>
            <Button type="submit">Add card</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
