'use client'

import * as React from 'react'
import { cn } from '@/libs/utils'
import { Button } from '@/components/ui/button'

export interface SectionItem {
  id: string
  label: string
  icon?: React.ReactNode
}

export interface EditorSidebarProps {
  sections: SectionItem[]
  activeSection?: string
  onSectionClick: (selectedSectionId: string) => void
}

export function EditorSidebar({
  sections,
  activeSection,
  onSectionClick,
}: EditorSidebarProps): React.ReactElement {
  return (
    <nav className="space-y-1">
      <div className="mb-4">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-3">
          Sections
        </h3>
      </div>

      {sections.map((section) => {
        const isActive = activeSection === section.id

        return (
          <Button
            key={section.id}
            variant="ghost"
            className={cn(
              'w-full justify-start text-left font-normal',
              isActive && 'bg-accent text-accent-foreground'
            )}
            onClick={() => onSectionClick(section.id)}
          >
            {section.icon && (
              <span className="mr-2 shrink-0">{section.icon}</span>
            )}
            <span className="truncate">{section.label}</span>
          </Button>
        )
      })}
    </nav>
  )
}