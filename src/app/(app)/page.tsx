import { auth } from '@/auth'
import { canEdit } from '@/lib/authz'

export default async function HomePage() {
  const session = await auth()
  const user = session!.user
  const firstName = (user.name ?? 'there').split(' ')[0]
  const editable = canEdit(user.tier)

  return (
    <div className="mx-auto max-w-4xl px-8 py-16">
      <h1 className="text-5xl font-bold tracking-tight">Hello, {firstName}</h1>
      <p className="mt-3 text-muted-foreground">
        Your cards, rewards and cashback will show up here.
      </p>

      {!editable && (
        <p className="mt-6 max-w-xl rounded-md bg-muted p-4 text-sm text-muted-foreground">
          Your access is read-only. Ask an admin for a Standalone or Family role in Discord to start
          tracking cards and transactions.
        </p>
      )}
    </div>
  )
}
