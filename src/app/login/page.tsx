import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { SignInButton } from '@/components/sign-in-button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const session = await auth()
  if (session) redirect('/')

  const { error } = await searchParams
  const denied = error === 'AccessDenied'

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">PointsWise</CardTitle>
          <CardDescription>Sign in to track your card rewards and cashback.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {denied && (
            <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              Access denied — you must be a member of the PointsWise Discord server to sign in.
            </p>
          )}
          <SignInButton />
        </CardContent>
      </Card>
    </main>
  )
}
