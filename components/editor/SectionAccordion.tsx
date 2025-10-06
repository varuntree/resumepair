/**
 * Section Accordion Component
 *
 * Wraps editor form sections in a collapsible accordion with scroll anchor.
 * Used to organize resume sections (Profile, Work, Education, etc.)
 *
 * @module components/editor/SectionAccordion
 */

'use client'

import * as React from 'react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

export interface SectionAccordionProps {
  id: string // Section identifier (e.g., 'profile', 'work')
  title: string // Display title for accordion trigger
  icon?: React.ReactNode // Optional icon to display next to title
  defaultOpen?: boolean // Whether section starts expanded
  children: React.ReactNode // Section content (form fields)
}

/**
 * Section accordion wrapper with scroll anchor
 */
export function SectionAccordion({
  id,
  title,
  icon,
  defaultOpen = true,
  children,
}: SectionAccordionProps): React.ReactElement {
  return (
    <div id={`section-${id}`} className="scroll-mt-4">
      <Accordion
        type="single"
        collapsible
        defaultValue={defaultOpen ? id : undefined}
      >
        <AccordionItem value={id} className="border rounded-lg">
          <AccordionTrigger className="px-6 py-4 hover:no-underline">
            <div className="flex items-center gap-3">
              {icon && <span className="text-primary">{icon}</span>}
              <span className="text-xl font-semibold text-foreground">
                {title}
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6 pt-2">
            {children}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
