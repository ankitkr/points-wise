import Link from 'next/link'
import { auth } from '@/auth'
import { getDb } from '@/db/client'
import { canEdit } from '@/lib/authz'
import { listCategories } from '@/lib/kb/queries'
import { getLedger } from '@/lib/ledger'
import { money } from '@/lib/format'
import { requireServerIdentityFromContext } from '@/lib/server-identity'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { addEntryAction, deleteEntryAction } from './actions'

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; account?: string; cursor?: string }>
}) {
  const { error, account, cursor } = await searchParams
  const session = await auth()
  const editable = canEdit(session?.user.tier)

  const { ulid } = await requireServerIdentityFromContext()
  const ledger = await getLedger(ulid)
  const db = await getDb()
  const [cards, categories, page] = await Promise.all([
    ledger.listCards(),
    listCategories(db),
    ledger.listEntries({ account: account || undefined, cursor: cursor || undefined, limit: 30 }),
  ])

  const today = new Date().toISOString().slice(0, 10)

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-8 py-10">
      <h1 className="text-2xl font-semibold">Transactions</h1>
      {error && <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}

      {editable && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Add transaction</CardTitle>
          </CardHeader>
          <CardContent>
            {cards.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                <Link href="/cards/new" className="underline">Add a card</Link> first.
              </p>
            ) : (
              <form action={addEntryAction} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="space-y-1">
                  <Label htmlFor="type">Type</Label>
                  <Select id="type" name="type" defaultValue="purchase">
                    <option value="purchase">Purchase</option>
                    <option value="refund">Refund</option>
                    <option value="payment">Payment</option>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="date">Date</Label>
                  <Input id="date" name="date" type="date" required defaultValue={today} />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label htmlFor="cardAccount">Card</Label>
                  <Select id="cardAccount" name="cardAccount" required defaultValue={cards[0].account}>
                    {cards.map((c) => (
                      <option key={c.account} value={c.account}>
                        {c.meta.nickname || c.meta.kbSlug}
                        {c.meta.last4 ? ` ···${c.meta.last4}` : ''}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="col-span-2 space-y-1">
                  <Label htmlFor="payee">Merchant / payee</Label>
                  <Input id="payee" name="payee" required maxLength={120} placeholder="Grocery Store" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="amount">Amount (₹)</Label>
                  <Input id="amount" name="amount" required inputMode="decimal" placeholder="1234.56" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="categorySlug">Category</Label>
                  <Select id="categorySlug" name="categorySlug" defaultValue="misc">
                    {categories.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="mcc">MCC (optional)</Label>
                  <Input id="mcc" name="mcc" pattern="\d{4}" placeholder="5411" />
                </div>
                <div className="col-span-2 space-y-1 sm:col-span-3">
                  <Label htmlFor="narration">Note (optional)</Label>
                  <Input id="narration" name="narration" maxLength={300} />
                </div>
                <div className="flex items-end">
                  <Button type="submit" className="w-full">
                    Add
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      )}

      {/* Filter */}
      <form method="get" className="flex items-end gap-2">
        <div className="space-y-1">
          <Label htmlFor="account">Filter by card</Label>
          <Select id="account" name="account" defaultValue={account ?? ''} className="w-64">
            <option value="">All cards</option>
            {cards.map((c) => (
              <option key={c.account} value={c.account}>
                {c.meta.nickname || c.meta.kbSlug}
              </option>
            ))}
          </Select>
        </div>
        <Button type="submit" variant="outline">
          Filter
        </Button>
      </form>

      {/* Journal */}
      <div className="divide-y rounded-md border">
        {page.entries.length === 0 && (
          <p className="p-6 text-center text-sm text-muted-foreground">No transactions yet.</p>
        )}
        {page.entries.map((e) => {
          const expense = e.postings.find((p) => p.account.startsWith('Expenses:'))
          const card = e.postings.find((p) => p.account.startsWith('Liabilities:CreditCards:'))
          const isPayment = !expense
          const amt = expense ?? card
          return (
            <div key={e.id} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{e.payee}</span>
                  {isPayment && <Badge variant="secondary">payment</Badge>}
                  {expense && expense.amount.scaled < 0 && <Badge variant="outline">refund</Badge>}
                  {e.meta?.mcc && <span className="text-xs text-muted-foreground">MCC {e.meta.mcc}</span>}
                </div>
                <div className="truncate text-xs text-muted-foreground">
                  {e.date}
                  {e.meta?.category ? ` · ${e.meta.category}` : ''}
                  {e.narration ? ` · ${e.narration}` : ''}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="font-mono">
                  {amt ? money(Math.abs(amt.amount.scaled), amt.amount.scale) : '—'}
                </span>
                {editable && (
                  <form action={deleteEntryAction}>
                    <input type="hidden" name="id" value={e.id} />
                    <Button type="submit" variant="ghost" size="sm">
                      Delete
                    </Button>
                  </form>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {page.cursor && (
        <div className="text-center">
          <Link
            href={`/transactions?${new URLSearchParams({ ...(account ? { account } : {}), cursor: page.cursor }).toString()}`}
            className="text-sm text-muted-foreground underline-offset-2 hover:underline"
          >
            Older →
          </Link>
        </div>
      )}
    </div>
  )
}
