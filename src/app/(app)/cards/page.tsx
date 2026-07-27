import Link from 'next/link'
import { auth } from '@/auth'
import { canEdit } from '@/lib/authz'
import { getLedger } from '@/lib/ledger'
import { money, points } from '@/lib/format'
import { requireServerIdentityFromContext } from '@/lib/server-identity'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function CardsPage() {
  const session = await auth()
  const editable = canEdit(session?.user.tier)
  const { ulid } = await requireServerIdentityFromContext()
  const ledger = await getLedger(ulid)
  const cards = await ledger.listCards()

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-8 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Cards</h1>
          <p className="text-sm text-muted-foreground">Your held cards, outstanding and points.</p>
        </div>
        {editable && (
          <Link href="/cards/new">
            <Button>Add card</Button>
          </Link>
        )}
      </div>

      {cards.length === 0 ? (
        <p className="rounded-md bg-muted p-4 text-sm text-muted-foreground">
          No cards yet{editable ? ' — add your first card to start tracking.' : '.'}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {cards.map((c) => {
            const inr = c.balances.find((b) => b.account === c.account && b.currency === 'INR')
            const pool = c.balances.find((b) => b.account === c.meta.poolAccount)
            const outstanding = inr ? -inr.scaled : 0
            return (
              <Card key={c.account}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-base">
                    <span>{c.meta.nickname || c.meta.kbSlug}</span>
                    {c.meta.last4 && <Badge variant="outline">···{c.meta.last4}</Badge>}
                  </CardTitle>
                  <CardDescription className="font-mono text-xs">{c.account}</CardDescription>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-2 gap-y-1 text-sm">
                    <dt className="text-muted-foreground">Outstanding</dt>
                    <dd className="text-right font-medium">{money(outstanding, inr?.scale ?? 4)}</dd>
                    <dt className="text-muted-foreground">Points</dt>
                    <dd className="text-right">
                      {pool ? points(pool.scaled, pool.scale, pool.currency) : `0 ${c.meta.poolTicker}`}
                    </dd>
                    {c.meta.statementDay && (
                      <>
                        <dt className="text-muted-foreground">Statement day</dt>
                        <dd className="text-right">{c.meta.statementDay}</dd>
                      </>
                    )}
                  </dl>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
