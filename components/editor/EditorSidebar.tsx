/**
 * Editor Sidebar Navigation
 *
 * Collapsible navigation sidebar showing all resume sections.
 * Clicking a section scrolls to that section in the form.
 *
 * @module components/editor/EditorSidebar
 */

'use client'

import * as React from 'react'
import { cn } from '@/libs/utils'
import { Button } from '@/components/ui/button'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

export interface SectionItem {
  id: string
  label: string
  icon?: React.ReactNode
}

export interface EditorSidebarProps {
  sections: SectionItem[]
  activeSection?: string
  // eslint-disable-next-line no-unused-vars
  onSectionClick: (value: string) => void
}

/**
 * Editor sidebar with collapsible section navigation
 */
export function EditorSidebar({
  sections,
  activeSection,
  onSectionClick,
}: EditorSidebarProps): React.ReactElement {
  const handleSectionClick = (sectionId: string) => {
    // Scroll to section
    const element = document.getElementById(`section-${sectionId}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    // Update active state
    onSectionClick(sectionId)
  }

  return (
    <Accordion type="single" collapsible>
      <AccordionItem value="sections" className="border-none">
        <AccordionTrigger className="py-2 px-3 hover:no-underline">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Sections
          </h3>
        </AccordionTrigger>
        <AccordionContent className="pb-0">
          <nav className="space-y-1">
            {sections.map((section) => {
              const isActive = activeSection === section.id

              return (
                <Button
                  key={section.id}
                  variant="ghost"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    isActive && 'bg-primary text-primary-foreground font-semibold hover:bg-primary/90 hover:text-primary-foreground'
                  )}
                  onClick={() => handleSectionClick(section.id)}
                >
                  {section.icon && (
                    <span className="mr-2 shrink-0">{section.icon}</span>
                  )}
                  <span className="truncate">{section.label}</span>
                </Button>
              )
            })}
          </nav>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
