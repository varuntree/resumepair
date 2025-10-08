/**
 * Template Gallery
 *
 * Grid display of all available resume templates.
 *
 * @module components/templates/TemplateGallery
 */

'use client'

import * as React from 'react'
import { TemplateCard } from './TemplateCard'
import { listResumeTemplateMetadata } from '@/libs/reactive-artboard/catalog'

/**
 * Template gallery grid component
 */
export function TemplateGallery(): React.ReactElement {
  const templates = React.useMemo(() => listResumeTemplateMetadata(), [])

  return (
    <div className="w-full">
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-3">
          <h1 className="text-4xl font-bold text-gray-900">Resume Templates</h1>
          <p className="text-xl text-gray-600 max-w-3xl">
            Choose from our collection of professionally designed, ATS-friendly resume templates.
            Each template is fully customizable to match your personal brand.
          </p>
        </div>

        {/* Template Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6">
          {templates.map((template) => (
            <TemplateCard key={template.id} template={template} />
          ))}
        </div>

        {/* Info Footer */}
        <div className="mt-12 p-6 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            All Templates Are ATS-Friendly
          </h3>
          <p className="text-sm text-blue-800">
            Every template is designed to pass Applicant Tracking Systems (ATS) with high scores.
            You can customize colors, fonts, and spacing while maintaining ATS compatibility.
          </p>
        </div>
      </div>
    </div>
  )
}
