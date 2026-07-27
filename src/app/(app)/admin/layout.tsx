import { notFound } from 'next/navigation'
import { auth } from '@/auth'

// UI gate only (hides the section from non-admins). Every admin ACTION
// re-checks users.is_admin in D1 via requireAdmin — this layout is not the
// security boundary.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user.isAdmin) notFound()
  return <>{children}</>
}
