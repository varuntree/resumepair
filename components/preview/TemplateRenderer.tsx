/**
 * Template Renderer
 *
 * Renders selected template component with data and customizations.
 *
 * @module components/preview/TemplateRenderer
 */

'use client'

import * as React from 'react'
import { getTemplate } from '@/libs/templates'
import { createDefaultCustomizations } from '@/types/template'
import type { ResumeJson } from '@/types/resume'
import type { Customizations, TemplateSlug } from '@/types/template'

interface TemplateRendererProps {
  templateId: TemplateSlug
  data: ResumeJson
  customizations?: Customizations
  mode?: 'edit' | 'preview' | 'print'
}

/**
 * Renders a template component by ID with data and customizations
 * Falls back to minimal template if template not found
 */
export const TemplateRenderer = React.memo(function TemplateRenderer({
  templateId,
  data,
  customizations,
  mode = 'preview',
}: TemplateRendererProps): React.ReactElement {
  // Get template from registry with graceful fallback
  let template: ReturnType<typeof getTemplate> | null = null
  try {
    template = getTemplate(templateId)
  } catch (err) {
    console.error(`Template not found: ${templateId}`, err)
  }

  if (!template || !template.component) {
    // Fallback to minimal template
    let minimalTemplate: ReturnType<typeof getTemplate> | null = null
    try {
      minimalTemplate = getTemplate('minimal')
    } catch (e) {
      // If even minimal is missing, render a simple message
      return (
        <div className="p-8 text-center">
          <p className="text-red-600">Template not found: {templateId}</p>
        </div>
      )
    }

    const MinimalComponent = minimalTemplate.component
    return (
      <MinimalComponent
        data={data}
        customizations={customizations || createDefaultCustomizations()}
        mode={mode}
      />
    )
  }

  // Render template with data and customizations
  const TemplateComponent = template.component
  return (
    <TemplateComponent
      data={data}
      customizations={customizations || createDefaultCustomizations()}
      mode={mode}
    />
  )
})
