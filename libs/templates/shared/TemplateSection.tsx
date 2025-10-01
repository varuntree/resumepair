/**
 * Template Section Component
 *
 * Reusable section wrapper for resume templates.
 * Provides consistent structure and print-friendly page break handling.
 *
 * @module libs/templates/shared/TemplateSection
 */

import React from 'react'

interface TemplateSectionProps {
  title?: string
  children: React.ReactNode
  className?: string
  id?: string
  avoidPageBreak?: boolean
}

/**
 * Section component for resume templates
 *
 * Features:
 * - Semantic HTML (<section>)
 * - Optional section heading
 * - Print-friendly page break control
 * - Consistent spacing via --doc-* tokens
 */
export const TemplateSection = React.memo(
  ({ title, children, className = '', id, avoidPageBreak = true }: TemplateSectionProps) => {
    const sectionClass = `doc-section ${className} ${avoidPageBreak ? 'doc-avoid-break' : ''}`

    return (
      <section className={sectionClass} id={id}>
        {title && <h2 className="doc-section-title">{title}</h2>}
        <div className="doc-section-content">{children}</div>
      </section>
    )
  }
)

TemplateSection.displayName = 'TemplateSection'
