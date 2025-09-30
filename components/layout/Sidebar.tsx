'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Settings } from 'lucide-react'
import { SignOutButton } from '@/components/auth/SignOutButton'
import { cn } from '@/libs/utils'

export function Sidebar() {
  const pathname = usePathname()

  // Check if link is active
  const isActive = (path: string) => pathname.startsWith(path)

  return (
    <aside className="hidden lg:flex h-screen w-64 flex-col border-r border-app-border bg-app-background">
      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-6">
        <nav className="space-y-2">
          <Link
            href="/dashboard"
            className={cn(
              'flex items-center space-x-3 rounded-lg px-3 py-2 transition-colors',
              isActive('/dashboard')
                ? 'bg-app-primary/10 text-app-primary font-semibold'
                : 'text-app-foreground/70 hover:bg-app-background/50 hover:text-app-foreground'
            )}
          >
            <LayoutDashboard className="h-5 w-5" />
            <span>Dashboard</span>
          </Link>
          <Link
            href="/settings"
            className={cn(
              'flex items-center space-x-3 rounded-lg px-3 py-2 transition-colors',
              isActive('/settings')
                ? 'bg-app-primary/10 text-app-primary font-semibold'
                : 'text-app-foreground/70 hover:bg-app-background/50 hover:text-app-foreground'
            )}
          >
            <Settings className="h-5 w-5" />
            <span>Settings</span>
          </Link>
        </nav>
      </div>

      {/* Sign Out (Bottom) */}
      <div className="border-t border-app-border p-4">
        <SignOutButton variant="ghost" className="w-full justify-start" />
      </div>
    </aside>
  )
}