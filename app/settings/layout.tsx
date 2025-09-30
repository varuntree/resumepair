import { redirect } from 'next/navigation'
import { createClient } from '@/libs/supabase/server'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import { Footer } from '@/components/layout/Footer'
import Link from 'next/link'
import { ReactNode } from 'react'

export default async function SettingsLayout({
  children,
}: {
  children: ReactNode
}) {
  // Protect route
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/signin')
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 md:p-8">
          {/* Settings Navigation Tabs */}
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
        </main>
      </div>
      <Footer />
    </div>
  )
}