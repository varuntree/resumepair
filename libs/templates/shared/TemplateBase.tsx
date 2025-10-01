/**
 * Template Base Component
 *
 * Base wrapper for all resume templates.
 * Provides common structure, --doc-* token scoping, and print setup.
 *
 * @module libs/templates/shared/TemplateBase
 */

import React from 'react'
import { Customizations, TemplateMode } from '@/types/template'

interface TemplateBaseProps {
  children: React.ReactNode
  className?: string
  customizations?: Customizations
  mode?: TemplateMode
}

/**
 * Base template wrapper component
 *
 * Responsibilities:
 * - Apply .doc-theme class for --doc-* token scoping
 * - Inject customizations as CSS variables
 * - Set data attributes for conditional styling
 * - Provide semantic document structure
 */
export const TemplateBase = React.memo(
  ({ children, className = '', customizations, mode = 'preview' }: TemplateBaseProps) => {
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
          '--doc-item-gap': `${customizations.spacing.itemGap}px`,
          '--doc-page-padding': `${customizations.spacing.pagePadding}px`,

          // Icons
          '--doc-icon-size': `${customizations.icons.size}px`,
          '--doc-icon-color': customizations.icons.color,
        } as React.CSSProperties)
      : undefined

    return (
      <article
        className={`doc-theme doc-container ${className}`}
        style={style}
        data-mode={mode}
        data-icons={customizations?.icons.enabled ? 'true' : 'false'}
        data-columns={customizations?.layout.columns || 1}
      >
        {children}
      </article>
    )
  }
)

TemplateBase.displayName = 'TemplateBase'
