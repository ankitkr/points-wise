import { auth } from '@/auth'
import { getDb } from '@/db/client'
import { canEdit } from '@/lib/authz'
import { listCards } from '@/lib/kb/queries'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { submitSuggestion } from './actions'

export default async function SuggestPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string }>
}) {
  const { error, sent } = await searchParams
  const session = await auth()
  const editable = canEdit(session?.user.tier)
  const db = await getDb()
  const cards = await listCards(db)

  return (
    <div className="mx-auto max-w-xl space-y-6 px-8 py-10">
      <h1 className="text-2xl font-semibold">Suggest a card fix</h1>
      {error && <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      {sent && (
        <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
          Thanks — your suggestion is queued for admin review.
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>What&apos;s wrong or missing?</CardTitle>
          <CardDescription>
            Wrong earn rate, a devaluation we missed, a card we don&apos;t list — tell us and an
            admin will apply it to the Knowledge Base.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {editable ? (
            <form action={submitSuggestion} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="cardSlug">Card (optional)</Label>
                <Select id="cardSlug" name="cardSlug" defaultValue="">
                  <option value="">— general / new card —</option>
                  {cards.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.bankName} · {c.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="note">Details</Label>
                <Textarea
                  id="note"
                  name="note"
                  required
                  minLength={3}
                  rows={5}
                  placeholder="e.g. Magnus Travel Edge cap dropped to ₹2L/month from Sep 2023 — source: bank T&C update"
                />
              </div>
              <Button type="submit">Submit suggestion</Button>
            </form>
          ) : (
            <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
              A Standalone or Family membership is required to suggest changes.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
