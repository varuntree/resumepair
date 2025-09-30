'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { LayoutDashboard, Settings } from 'lucide-react'
import { SignOutButton } from '@/components/auth/SignOutButton'
import { cn } from '@/libs/utils'

interface MobileMenuProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MobileMenu({ open, onOpenChange }: MobileMenuProps) {
  const pathname = usePathname()

  // Check if link is active
  const isActive = (path: string) => pathname.startsWith(path)

  // Close menu when link is clicked
  const handleLinkClick = () => {
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-80">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>

        {/* Navigation */}
        <nav className="mt-8 space-y-2">
          <Link
            href="/dashboard"
            onClick={handleLinkClick}
            className={cn(
              'flex items-center space-x-3 rounded-lg px-3 py-3 transition-colors',
              isActive('/dashboard')
                ? 'bg-app-primary/10 text-app-primary font-semibold'
                : 'text-app-foreground/70 hover:bg-app-background/50'
            )}
          >
            <LayoutDashboard className="h-5 w-5" />
            <span>Dashboard</span>
          </Link>
          <Link
            href="/settings"
            onClick={handleLinkClick}
            className={cn(
              'flex items-center space-x-3 rounded-lg px-3 py-3 transition-colors',
              isActive('/settings')
                ? 'bg-app-primary/10 text-app-primary font-semibold'
                : 'text-app-foreground/70 hover:bg-app-background/50'
            )}
          >
            <Settings className="h-5 w-5" />
            <span>Settings</span>
          </Link>
        </nav>

        {/* Sign Out (Bottom) */}
        <div className="absolute bottom-6 left-6 right-6">
          <SignOutButton variant="outline" className="w-full" />
        </div>
      </SheetContent>
    </Sheet>
  )
}