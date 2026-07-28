import { notFound } from 'next/navigation'
import { auth } from '@/auth'
import { getDb } from '@/db/client'
import { isAdminFresh } from '@/lib/authz'

// Admin READ gate. The session's isAdmin is display-only, so this re-reads
// users.is_admin from D1 on every request — a revoked admin loses access to
// admin pages immediately, not at session refresh. Every admin WRITE
// additionally goes through requireAdmin in its server action.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) notFound()
  const db = await getDb()
  if (!(await isAdminFresh(db, session.user.discordId))) notFound()
  return <>{children}</>
}
