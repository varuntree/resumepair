/**
 * Comprehensive Navigation Sidebar
 *
 * Unified sidebar navigation that brings together all features:
 * - Document management (resumes, cover letters)
 * - AI tools (generation, import)
 * - Templates
 * - Settings
 * - User profile with AI quota
 *
 * @module components/layout/Sidebar
 */

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  Mail,
  Sparkles,
  Wand2,
  Upload,
  Palette,
  LayoutGrid,
  Settings,
  User,
  Sliders,
  Shield,
} from 'lucide-react'
import { SignOutButton } from '@/components/auth/SignOutButton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { createClient } from '@/libs/supabase/client'
import { cn } from '@/libs/utils'

/**
 * Navigation section definition
 */
interface NavSection {
  title: string
  icon: React.ComponentType<{ className?: string }>
  items: NavItem[]
}

/**
 * Navigation item definition
 */
interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  action?: () => void
}

/**
 * AI Quota data
 */
interface QuotaData {
  operationCount: number
  operationLimit: number
  remainingOperations: number
  resetIn: number
}

/**
 * User profile data
 */
interface UserProfile {
  email: string
  fullName?: string | null
  avatarUrl?: string | null
}

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [quota, setQuota] = useState<QuotaData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch user profile and quota on mount
  useEffect(() => {
    fetchUserData()
    fetchQuota()
  }, [])

  const fetchUserData = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // Fetch profile data
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', user.id)
          .single()

        setUserProfile({
          email: user.email || '',
          fullName: profile?.full_name,
          avatarUrl: profile?.avatar_url,
        })
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchQuota = async () => {
    try {
      const response = await fetch('/api/v1/ai/quota')
      const result = await response.json()

      if (result.success) {
        setQuota(result.data)
      }
    } catch (error) {
      console.error('Failed to fetch quota:', error)
    }
  }

  // Check if link is active
  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return pathname === '/dashboard' || pathname.startsWith('/editor')
    }
    return pathname.startsWith(path)
  }

  // Handle creating new document
  // Creation flows handled by /editor/new and /cover-letter-editor/new routes

  // Navigation structure
  const navSections: NavSection[] = [
    {
      title: 'Documents',
      icon: FileText,
      items: [
        { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { label: 'New Resume', href: '/editor/new', icon: PlusCircle },
        { label: 'New Cover Letter', href: '/cover-letter-editor/new', icon: Mail },
      ],
    },
    {
      title: 'AI Tools',
      icon: Sparkles,
      items: [
        { label: 'Generate Resume', href: '/ai/generate', icon: Wand2 },
        { label: 'Import PDF', href: '/import/pdf', icon: Upload },
      ],
    },
    {
      title: 'Templates',
      icon: Palette,
      items: [
        { label: 'Template Gallery', href: '/templates', icon: LayoutGrid },
      ],
    },
    {
      title: 'Settings',
      icon: Settings,
      items: [
        { label: 'Profile', href: '/settings/profile', icon: User },
        { label: 'Preferences', href: '/settings/preferences', icon: Sliders },
        { label: 'Account', href: '/settings/account', icon: Shield },
      ],
    },
  ]

  // Generate user initials
  const initials = (userProfile?.fullName || userProfile?.email || 'U')
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  // Calculate quota usage percentage
  const usagePercent = quota
    ? (quota.operationCount / quota.operationLimit) * 100
    : 0

  return (
    <aside className="hidden lg:flex h-screen w-64 flex-col border-r border-app-border bg-app-background">
      {/* Logo / Brand */}
      <div className="p-6 border-b border-app-border">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <span className="text-xl font-bold text-app-foreground">
            ResumePair
          </span>
        </Link>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto p-6">
        <nav className="space-y-8">
          {navSections.map((section) => (
            <div key={section.title} className="space-y-2">
              {/* Section Header */}
              <h3 className="px-3 text-xs font-semibold text-app-gray-500 uppercase tracking-wider">
                {section.title}
              </h3>

              {/* Section Items */}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon
                  const active = isActive(item.href)

                  if (item.action) {
                    // Action button (e.g., New Resume)
                    return (
                      <button
                        key={item.label}
                        onClick={item.action}
                        className={cn(
                          'w-full flex items-center space-x-3 rounded-lg px-3 py-2 transition-colors text-sm',
                          'text-app-foreground/70 hover:bg-app-accent hover:text-app-foreground'
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </button>
                    )
                  }

                  // Regular navigation link
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      className={cn(
                        'flex items-center space-x-3 rounded-lg px-3 py-2 transition-colors text-sm',
                        active
                          ? 'bg-app-primary text-app-primary-foreground font-semibold'
                          : 'text-app-foreground/70 hover:bg-app-accent hover:text-app-foreground'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* User Profile Section (Bottom) */}
      <div className="border-t border-app-border p-4 space-y-4">
        {/* AI Quota Indicator */}
        {quota && (
          <div className="space-y-2 px-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-app-muted-foreground font-medium">AI Quota</span>
              <span className="text-app-foreground font-semibold">
                {quota.remainingOperations} left
              </span>
            </div>
            <Progress
              value={usagePercent}
              className="h-1.5 bg-app-gray-200 dark:bg-app-navy-medium [&>div]:bg-app-lime"
            />
            <p className="text-xs text-app-muted-foreground">
              {quota.operationCount} / {quota.operationLimit} operations used
            </p>
          </div>
        )}

        {/* User Profile */}
        {!isLoading && userProfile && (
          <div className="space-y-3">
            <div className="flex items-center space-x-3 px-2">
              <Avatar className="h-10 w-10">
                <AvatarImage src={userProfile.avatarUrl || undefined} alt={userProfile.fullName || 'User'} />
                <AvatarFallback className="bg-app-primary text-app-primary-foreground font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-app-foreground truncate">
                  {userProfile.fullName || 'User'}
                </p>
                <p className="text-xs text-app-muted-foreground truncate">
                  {userProfile.email}
                </p>
              </div>
            </div>

            {/* Sign Out */}
            <SignOutButton variant="ghost" className="w-full justify-start text-sm" />
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="space-y-2 px-2 animate-pulse">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-app-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-app-muted rounded w-2/3" />
                <div className="h-2 bg-app-muted rounded w-1/2" />
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}