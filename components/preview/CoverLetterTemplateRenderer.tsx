/**
 * Cover Letter Template Renderer
 *
 * Renders a cover letter template with given data and customizations.
 * Wrapped in React.memo for performance optimization.
 *
 * @module components/preview/CoverLetterTemplateRenderer
 */

'use client'

import * as React from 'react'
import { getCoverLetterTemplate } from '@/libs/templates/cover-letter/registry'
import type { CoverLetterJson } from '@/types/cover-letter'
import type {
  CoverLetterTemplateSlug,
  CoverLetterCustomizations,
  CoverLetterTemplateMode,
} from '@/types/cover-letter-template'

interface CoverLetterTemplateRendererProps {
  templateId: CoverLetterTemplateSlug
  data: CoverLetterJson
  customizations?: CoverLetterCustomizations
  mode?: CoverLetterTemplateMode
}

/**
 * Render a cover letter template with memoization
 *
 * Only re-renders when template, data, or customizations change.
 * Uses shallow comparison for performance.
 */
export const CoverLetterTemplateRenderer = React.memo(
  ({
    templateId,
    data,
    customizations,
    mode = 'preview',
  }: CoverLetterTemplateRendererProps): React.ReactElement => {
    // Get template from registry
    const template = React.useMemo(() => {
      try {
        return getCoverLetterTemplate(templateId)
      } catch (error) {
        console.error(`[CoverLetterTemplateRenderer] Template "${templateId}" not found`, error)
        // Fallback to default template
        return getCoverLetterTemplate('classic-block')
      }
    }, [templateId])

    const TemplateComponent = template.component

    // Use template defaults if customizations not provided
    const finalCustomizations = customizations || template.defaults

    return (
      <TemplateComponent data={data} customizations={finalCustomizations} mode={mode} />
    )
  },
  // Custom comparison function for performance
  (prevProps, nextProps) => {
    // Re-render if template ID changes
    if (prevProps.templateId !== nextProps.templateId) {
      return false
    }

    // Re-render if mode changes
    if (prevProps.mode !== nextProps.mode) {
      return false
    }

    // Re-render if data object reference changes (Zustand temporal state provides new refs)
    if (prevProps.data !== nextProps.data) {
      return false
    }

    // Re-render if customizations object reference changes
    if (prevProps.customizations !== nextProps.customizations) {
      return false
    }

    // No changes - skip re-render
    return true
  }
)

CoverLetterTemplateRenderer.displayName = 'CoverLetterTemplateRenderer'
