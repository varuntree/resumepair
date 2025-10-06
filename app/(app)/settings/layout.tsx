import Link from 'next/link'
import type { ReactNode } from 'react'

/**
 * Settings Layout (route-specific, inside (app) group)
 * Renders settings navigation tabs and wraps content. Global Header/Sidebar come from (app)/layout.tsx.
 */
export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="w-full p-6 md:p-8">
      <div className="mb-8 border-b border-app-border">
        <nav className="flex space-x-8">
          <Link
            href="/settings/profile"
            className="pb-4 px-1 border-b-2 border-transparent hover:border-app-foreground/20 text-sm font-medium"
          >
            Profile
          </Link>
          <Link
            href="/settings/preferences"
            className="pb-4 px-1 border-b-2 border-transparent hover:border-app-foreground/20 text-sm font-medium"
          >
            Preferences
          </Link>
          <Link
            href="/settings/account"
            className="pb-4 px-1 border-b-2 border-transparent hover:border-app-foreground/20 text-sm font-medium"
          >
            Account
          </Link>
        </nav>
      </div>
      {children}
    </div>
  )
}
