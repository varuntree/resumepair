/**
 * Cover Letter Template Base Component
 *
 * Base wrapper for all cover letter templates.
 * Provides common structure, --doc-* token scoping, and print setup.
 *
 * @module libs/templates/cover-letter/shared/CoverLetterTemplateBase
 */

import React from 'react'
import {
  CoverLetterCustomizations,
  CoverLetterTemplateMode,
} from '@/types/cover-letter-template'

interface CoverLetterTemplateBaseProps {
  children: React.ReactNode
  className?: string
  customizations?: CoverLetterCustomizations
  mode?: CoverLetterTemplateMode
}

/**
 * Base template wrapper component for cover letters
 *
 * Responsibilities:
 * - Apply .doc-theme class for --doc-* token scoping
 * - Inject customizations as CSS variables
 * - Set data attributes for conditional styling
 * - Provide semantic document structure
 */
export const CoverLetterTemplateBase = React.memo(
  ({
    children,
    className = '',
    customizations,
    mode = 'preview',
  }: CoverLetterTemplateBaseProps) => {
    // Build CSS variables from customizations
    const style: React.CSSProperties | undefined = customizations
      ? ({
          // Colors
          '--doc-primary': `hsl(${customizations.colors.primary})`,
          '--doc-secondary': `hsl(${customizations.colors.secondary})`,
          '--doc-accent': `hsl(${customizations.colors.accent})`,
          '--doc-text': `hsl(${customizations.colors.text})`,
          '--doc-background': `hsl(${customizations.colors.background})`,
          '--doc-muted': `hsl(${customizations.colors.muted})`,
          '--doc-border': `hsl(${customizations.colors.border})`,

          // Typography
          '--doc-font-family': customizations.typography.fontFamily,
          '--doc-font-size-scale': customizations.typography.fontSize,
          '--doc-line-height': customizations.typography.lineHeight,
          '--doc-font-weight': customizations.typography.fontWeight,

          // Spacing (convert px to rem for consistency)
          '--doc-section-gap': `${customizations.spacing.sectionGap}px`,
          '--doc-paragraph-gap': `${customizations.spacing.paragraphGap}px`,
          '--doc-page-padding': `${customizations.spacing.pagePadding}px`,
        } as React.CSSProperties)
      : undefined

    return (
      <article
        className={`doc-theme doc-container ${className}`}
        style={style}
        data-mode={mode}
        data-type="cover-letter"
      >
        {children}
      </article>
    )
  }
)

CoverLetterTemplateBase.displayName = 'CoverLetterTemplateBase'
