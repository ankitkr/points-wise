'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, Coins, Home, Lightbulb, Moon, Settings, Sun, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/kb/suggest', label: 'Suggest a fix', icon: Lightbulb },
]

export function AppSidebar({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname()
  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r bg-card">
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Coins className="h-5 w-5" />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold">PointsWise</div>
          <div className="text-xs text-muted-foreground">rewards tracker</div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV.map((item) => (
          <NavLink key={item.href} {...item} active={pathname === item.href} />
        ))}
        {isAdmin && (
          <>
            <div className="px-3 pb-1 pt-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Admin
            </div>
            <NavLink
              href="/admin/kb"
              label="Knowledge Base"
              icon={BookOpen}
              active={pathname.startsWith('/admin/kb')}
            />
          </>
        )}
      </nav>

      <div className="space-y-1 border-t p-3">
        <NavLink
          href="/settings"
          label="Settings"
          icon={Settings}
          active={pathname.startsWith('/settings')}
        />
        <ThemeToggle />
      </div>
    </aside>
  )
}

function NavLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string
  label: string
  icon: LucideIcon
  active: boolean
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
        active
          ? 'bg-accent text-accent-foreground'
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  )
}

function ThemeToggle() {
  // Lazy init from the DOM (the no-flash script sets the class before hydration).
  const [dark, setDark] = useState(
    () => typeof document !== 'undefined' && document.documentElement.classList.contains('dark'),
  )

  const toggle = () => {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    try {
      localStorage.setItem('theme', next ? 'dark' : 'light')
    } catch {
      /* ignore */
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      {dark ? 'Light mode' : 'Dark mode'}
    </button>
  )
}
