import Link from 'next/link'
import { auth } from '@/auth'
import { canEdit } from '@/lib/authz'
import { getLedger } from '@/lib/ledger'
import { money } from '@/lib/format'
import { requireServerIdentityFromContext } from '@/lib/server-identity'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function HomePage() {
  const session = await auth()
  const user = session!.user
  const firstName = (user.name ?? 'there').split(' ')[0]
  const editable = canEdit(user.tier)

  const { ulid } = await requireServerIdentityFromContext()
  const ledger = await getLedger(ulid)
  const [cards, recent] = await Promise.all([ledger.listCards(), ledger.listEntries({ limit: 5 })])

  const outstanding = cards.reduce((sum, c) => {
    const inr = c.balances.find((b) => b.account === c.account && b.currency === 'INR')
    return sum + (inr ? -inr.scaled : 0)
  }, 0)

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-8 py-16">
      <div>
        <h1 className="text-5xl font-bold tracking-tight">Hello, {firstName}</h1>
        <p className="mt-3 text-muted-foreground">
          {cards.length > 0
            ? `${cards.length} card${cards.length > 1 ? 's' : ''} · ${money(outstanding, 4)} outstanding`
            : 'Your cards, rewards and cashback will show up here.'}
        </p>
      </div>

      {!editable && (
        <p className="max-w-xl rounded-md bg-muted p-4 text-sm text-muted-foreground">
          Your access is read-only. Ask an admin for a Standalone or Family role in Discord to start
          tracking cards and transactions.
        </p>
      )}

      {recent.entries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent transactions</CardTitle>
            <CardDescription>
              <Link href="/transactions" className="underline-offset-2 hover:underline">
                See all →
              </Link>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="divide-y text-sm">
              {recent.entries.map((e) => {
                const amt =
                  e.postings.find((p) => p.account.startsWith('Expenses:')) ??
                  e.postings.find((p) => p.account.startsWith('Liabilities:CreditCards:'))
                return (
                  <li key={e.id} className="flex items-center justify-between py-2">
                    <span className="min-w-0 truncate">
                      {e.payee}
                      <span className="ml-2 text-xs text-muted-foreground">{e.date}</span>
                    </span>
                    <span className="font-mono">
                      {amt ? money(Math.abs(amt.amount.scaled), amt.amount.scale) : '—'}
                    </span>
                  </li>
                )
              })}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
