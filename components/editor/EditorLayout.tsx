'use client'

import * as React from 'react'
import { cn } from '@/libs/utils'

export interface EditorLayoutProps {
  children: React.ReactNode
  sidebar?: React.ReactNode
  header?: React.ReactNode
  sidebarClassName?: string
  sidebarMobileVisible?: boolean
}

export function EditorLayout({
  children,
  sidebar,
  header,
  sidebarClassName,
  sidebarMobileVisible,
}: EditorLayoutProps): React.ReactElement {
  return (
    <div className="h-full bg-background flex flex-col">
      {/* Header */}
      {header && (
        <div className="flex-shrink-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          {header}
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Sidebar - hidden on mobile, shown on desktop */}
        {sidebar && (
          <aside className={cn(
            sidebarMobileVisible ? 'flex flex-col' : 'hidden lg:flex lg:flex-col',
            'border-r border-border',
            'bg-muted/30',
            'flex-shrink-0 h-full overflow-hidden',
            'basis-full max-w-full',
            'lg:basis-1/2 lg:max-w-[50%]',
            sidebarClassName
          )}>
            {/* Let the sidebar content manage its own scroll regions */}
            <div className="flex-1 p-4 overflow-hidden flex flex-col min-h-0">{sidebar}</div>
          </aside>
        )}

        {/* Editor Content */}
        <main className="flex-1 overflow-hidden flex flex-col min-h-0 basis-full max-w-full lg:basis-1/2 lg:max-w-[50%]">
          {children}
        </main>
      </div>
    </div>
  )
}
