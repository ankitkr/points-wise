import Link from 'next/link'
import { getDb } from '@/db/client'
import { listCards, pendingProposalCount } from '@/lib/kb/queries'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export default async function AdminKbPage() {
  const db = await getDb()
  const [cards, pending] = await Promise.all([listCards(db), pendingProposalCount(db)])

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-8 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Knowledge Base</h1>
          <p className="text-sm text-muted-foreground">
            Banks, cards and earn rules. Edits are admin-only and schema-validated.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/kb/proposals">
            <Button variant="outline">
              Proposals{pending > 0 ? ` (${pending})` : ''}
            </Button>
          </Link>
          <Link href="/admin/kb/cards/new">
            <Button>New card</Button>
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">Card</th>
              <th className="px-3 py-2 font-medium">Bank</th>
              <th className="px-3 py-2 font-medium">Pool</th>
              <th className="px-3 py-2 font-medium">Latest rule</th>
              <th className="px-3 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {cards.map((c) => (
              <tr key={c.slug} className="hover:bg-muted/30">
                <td className="px-3 py-2">
                  <Link className="font-medium underline-offset-2 hover:underline" href={`/admin/kb/cards/${c.slug}`}>
                    {c.name}
                  </Link>
                  {c.network ? <span className="ml-2 text-xs text-muted-foreground">{c.network}</span> : null}
                </td>
                <td className="px-3 py-2">{c.bankName}</td>
                <td className="px-3 py-2 font-mono text-xs">{c.poolTicker}</td>
                <td className="px-3 py-2">
                  {c.latestRule ? (
                    <span>
                      {c.latestRule.effectiveFrom}{' '}
                      {c.latestRule.verified ? (
                        <Badge variant="secondary">verified</Badge>
                      ) : (
                        <Badge variant="outline">unverified</Badge>
                      )}
                    </span>
                  ) : (
                    <Badge variant="destructive">no rule</Badge>
                  )}
                </td>
                <td className="px-3 py-2">{c.active ? 'active' : <Badge variant="outline">inactive</Badge>}</td>
              </tr>
            ))}
            {cards.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                  No cards yet — run <code>pnpm kb:seed:local</code> or add one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
