import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { AppSidebar } from '@/components/app-sidebar'

// Gated shell: everything under (app) requires a session and shares the sidebar.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')
  return (
    // Cap the shell to the viewport so the sidebar (h-screen) stays pinned and
    // only <main> scrolls. `min-h-screen` let the container grow past the viewport,
    // so the whole page scrolled and the un-pinned sidebar rode up out of view.
    <div className="flex h-screen overflow-hidden">
      <AppSidebar isAdmin={session.user.isAdmin} />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
