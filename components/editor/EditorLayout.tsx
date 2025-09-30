'use client'

import * as React from 'react'
import { cn } from '@/libs/utils'

export interface EditorLayoutProps {
  children: React.ReactNode
  sidebar?: React.ReactNode
  header?: React.ReactNode
}

export function EditorLayout({
  children,
  sidebar,
  header,
}: EditorLayoutProps): React.ReactElement {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      {header && (
        <div className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          {header}
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - hidden on mobile, shown on desktop */}
        {sidebar && (
          <aside className={cn(
            'hidden lg:flex lg:flex-col',
            'w-60 border-r border-border',
            'bg-muted/30'
          )}>
            <div className="flex-1 overflow-y-auto p-4">
              {sidebar}
            </div>
          </aside>
        )}

        {/* Editor Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}