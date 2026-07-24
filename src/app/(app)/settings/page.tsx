import { auth } from '@/auth'
import { getDb } from '@/db/client'
import { listHouseholdMembers, type MemberView } from '@/db/queries'
import { SignOutButton } from '@/components/sign-out-button'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { inviteMember, removeMember } from './actions'

const TIER_BADGE = {
  readonly: { label: 'Read-only', variant: 'outline' as const },
  standalone: { label: 'Standalone', variant: 'secondary' as const },
  family: { label: 'Family', variant: 'default' as const },
}

export default async function SettingsPage() {
  const session = await auth()
  const user = session!.user
  const badge = TIER_BADGE[user.tier]

  let members: MemberView[] = []
  if (user.tier === 'family') {
    const db = await getDb()
    members = await listHouseholdMembers(db, user.householdId)
  }
  const active = members.filter((m) => m.status === 'active')
  const invited = members.filter((m) => m.status === 'invited')

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-8 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <SignOutButton />
      </div>

      {/* Account */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Account
            <Badge variant={badge.variant}>{badge.label}</Badge>
          </CardTitle>
          <CardDescription>Your PointsWise profile.</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-[10rem_1fr] gap-y-2 text-sm">
            <dt className="text-muted-foreground">Name</dt>
            <dd>{user.name ?? '—'}</dd>
            <dt className="text-muted-foreground">Discord ID</dt>
            <dd className="font-mono">{user.discordId || '—'}</dd>
            <dt className="text-muted-foreground">Email</dt>
            <dd>{user.email ?? 'No email on file'}</dd>
            <dt className="text-muted-foreground">Membership</dt>
            <dd className="capitalize">{user.tier}</dd>
          </dl>
        </CardContent>
      </Card>

      {/* Family configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Family</CardTitle>
          <CardDescription>
            {user.tier === 'family'
              ? 'Invite family members and manage who belongs to your household.'
              : 'Family sharing lets you invite members and view their spend and earn.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {user.tier !== 'family' ? (
            <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
              A <span className="font-medium">Family</span> membership is required to invite members.
              Ask an admin for the <span className="font-mono">@family</span> role in Discord.
            </p>
          ) : (
            <>
              {/* Members */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Members</h3>
                <ul className="divide-y rounded-md border">
                  {active.map((m) => (
                    <li key={m.membershipId} className="flex items-center justify-between px-3 py-2">
                      <div className="text-sm">
                        <div className="font-medium">{m.name ?? m.discordId}</div>
                        <div className="text-muted-foreground">{m.email ?? m.discordId}</div>
                      </div>
                      {m.role === 'owner' ? (
                        <Badge variant="secondary">Owner</Badge>
                      ) : (
                        <RemoveButton membershipId={m.membershipId} label="Remove" />
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Pending invites */}
              {invited.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Pending invites</h3>
                  <ul className="divide-y rounded-md border">
                    {invited.map((m) => (
                      <li
                        key={m.membershipId}
                        className="flex items-center justify-between px-3 py-2"
                      >
                        <div className="text-sm">
                          <div className="font-medium">{m.name ?? m.discordId}</div>
                          <div className="text-muted-foreground">Invited · awaiting acceptance</div>
                        </div>
                        <RemoveButton membershipId={m.membershipId} label="Cancel" />
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Invite */}
              <form action={inviteMember} className="space-y-2">
                <label className="text-sm font-medium" htmlFor="identifier">
                  Invite a member
                </label>
                <div className="flex gap-2">
                  <Input
                    id="identifier"
                    name="identifier"
                    placeholder="Discord ID or email"
                    required
                  />
                  <Button type="submit">Invite</Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  They must sign in to PointsWise at least once first. Acceptance &amp; shared views
                  arrive in a later milestone.
                </p>
              </form>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function RemoveButton({ membershipId, label }: { membershipId: string; label: string }) {
  return (
    <form action={removeMember}>
      <input type="hidden" name="membershipId" value={membershipId} />
      <Button type="submit" variant="outline" size="sm">
        {label}
      </Button>
    </form>
  )
}
