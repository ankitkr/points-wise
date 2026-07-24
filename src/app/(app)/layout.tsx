import { redirect } from 'next/navigation'
import { auth } from '@/auth'

// Gated shell: everything under (app) requires a session. `/` lives here.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')
  return <>{children}</>
}
