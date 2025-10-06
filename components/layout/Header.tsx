'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UserMenu } from './UserMenu'
import { ThemeToggle } from '@/components/ThemeToggle'
import { cn } from '@/libs/utils'

interface HeaderProps {
  onMobileMenuToggle?: () => void
}

export function Header({ onMobileMenuToggle }: HeaderProps) {
  const pathname = usePathname()

  // Check if link is active
  const isActive = (path: string) => pathname.startsWith(path)

  return (
    <header className="sticky top-0 z-50 border-b border-app-border bg-app-background">
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-xl font-bold text-app-foreground">
            ResumePair
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link
            href="/templates"
            className={cn(
              'text-sm font-medium transition-colors hover:text-app-foreground',
              isActive('/templates')
                ? 'text-app-foreground'
                : 'text-app-foreground/60'
            )}
          >
            Templates
          </Link>
          <Link
            href="/dashboard"
            className={cn(
              'text-sm font-medium transition-colors hover:text-app-foreground',
              isActive('/dashboard')
                ? 'text-app-foreground'
                : 'text-app-foreground/60'
            )}
          >
            Dashboard
          </Link>
          <Link
            href="/settings"
            className={cn(
              'text-sm font-medium transition-colors hover:text-app-foreground',
              isActive('/settings')
                ? 'text-app-foreground'
                : 'text-app-foreground/60'
            )}
          >
            Settings
          </Link>
        </nav>

        {/* Theme Toggle & User Menu (Desktop) */}
        <div className="hidden md:flex items-center space-x-4">
          <ThemeToggle />
          <UserMenu />
        </div>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMobileMenuToggle}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>
    </header>
  )
}