import { auth } from '@/auth'
import { canEdit, canInvite } from '@/lib/authz'
import { SignOutButton } from '@/components/sign-out-button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const TIER_BADGE = {
  readonly: { label: 'Read-only', variant: 'outline' as const },
  standalone: { label: 'Standalone', variant: 'secondary' as const },
  family: { label: 'Family', variant: 'default' as const },
}

export default async function HomePage() {
  const session = await auth()
  const user = session!.user
  const tier = user.tier
  const editable = canEdit(tier)
  const invitable = canInvite(tier)

  const label = user.name ?? user.email ?? 'Member'
  const initials = label.slice(0, 2).toUpperCase()
  const badge = TIER_BADGE[tier]

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">PointsWise</h1>
        <SignOutButton />
      </header>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar>
              {user.image ? <AvatarImage src={user.image} alt={label} /> : null}
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                {label}
                <Badge variant={badge.variant}>{badge.label}</Badge>
              </CardTitle>
              <CardDescription>{user.email ?? 'No email on file'}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <dl className="grid grid-cols-[8rem_1fr] gap-y-1 text-muted-foreground">
            <dt>Membership tier</dt>
            <dd className="text-foreground">{tier}</dd>
            <dt>Household</dt>
            <dd className="font-mono text-foreground">{user.householdId || '—'}</dd>
          </dl>

          {editable ? (
            <div className="flex flex-wrap gap-2">
              {/* Placeholders wired up in later milestones. */}
              <Button disabled>Add transaction</Button>
              {invitable && (
                <Button variant="outline" disabled>
                  Invite family member
                </Button>
              )}
            </div>
          ) : (
            <p className="rounded-md bg-muted p-3 text-muted-foreground">
              Your access is read-only. Ask an admin for a Standalone or Family role in Discord to
              start tracking cards and transactions.
            </p>
          )}
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground">
        Signed in. Milestone 1 — auth &amp; account foundation.
      </p>
    </main>
  )
}
