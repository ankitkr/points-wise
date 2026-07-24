import { signIn } from '@/auth'
import { Button } from '@/components/ui/button'

// Server-action form — no client JS needed.
export function SignInButton() {
  return (
    <form
      action={async () => {
        'use server'
        await signIn('discord', { redirectTo: '/' })
      }}
    >
      <Button type="submit" size="lg" className="w-full">
        Sign in with Discord
      </Button>
    </form>
  )
}
