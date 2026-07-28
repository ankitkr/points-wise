import Link from 'next/link'
import { inArray } from 'drizzle-orm'
import { getDb } from '@/db/client'
import { users } from '@/db/schema'
import { listProposals } from '@/lib/kb/queries'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { approveProposal, rejectProposal } from '../actions'

export default async function ProposalsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  const db = await getDb()
  const pending = await listProposals(db, 'pending')

  // Resolve submitter display names (never expose users.id in the UI).
  const submitterIds = [...new Set(pending.map((p) => p.submittedBy))]
  const submitters = submitterIds.length
    ? await db
        .select({ id: users.id, name: users.displayName, discordId: users.discordId })
        .from(users)
        .where(inArray(users.id, submitterIds))
    : []
  const nameById = new Map(submitters.map((s) => [s.id, s.name ?? s.discordId]))

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-8 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">KB proposals</h1>
        <Link href="/admin/kb" className="text-sm text-muted-foreground underline-offset-2 hover:underline">
          ← Knowledge Base
        </Link>
      </div>
      {error && (
        <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>
      )}

      {pending.length === 0 ? (
        <p className="rounded-md bg-muted p-4 text-sm text-muted-foreground">
          No pending proposals. Member suggestions and (later) the auto-updater land here.
        </p>
      ) : (
        pending.map((p) => (
          <Card key={p.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Badge>{p.kind}</Badge>
                {p.targetSlug && <span className="font-mono text-sm">{p.targetSlug}</span>}
              </CardTitle>
              <CardDescription>
                by {nameById.get(p.submittedBy) ?? 'unknown'} ·{' '}
                {new Date(p.createdAt).toISOString().slice(0, 10)}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {p.note && <p className="text-sm">{p.note}</p>}
              <pre className="max-h-64 overflow-auto rounded-md bg-muted p-3 text-xs">
                {prettyPayload(p.payloadJson)}
              </pre>
              <div className="flex items-end gap-2">
                <form action={approveProposal}>
                  <input type="hidden" name="id" value={p.id} />
                  <Button type="submit">Approve{p.kind === 'correction' ? ' (acknowledge)' : ' & apply'}</Button>
                </form>
                <form action={rejectProposal} className="flex items-end gap-2">
                  <input type="hidden" name="id" value={p.id} />
                  <Input name="reason" placeholder="Rejection reason (optional)" className="w-64" />
                  <Button type="submit" variant="outline">
                    Reject
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}

function prettyPayload(json: string): string {
  try {
    return JSON.stringify(JSON.parse(json), null, 2)
  } catch {
    return json
  }
}
