/**
 * Templates Gallery Page
 *
 * Public page displaying all available resume templates.
 *
 * @module app/templates/page
 */

import * as React from 'react'
import { TemplateGallery } from '@/components/templates/TemplateGallery'

export const metadata = {
  title: 'Resume Templates | ResumePair',
  description: 'Browse our collection of professionally designed, ATS-friendly resume templates. Choose the perfect layout for your career goals.',
}

/**
 * Templates gallery page
 */
export default function TemplatesPage(): React.ReactElement {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <TemplateGallery />
      </div>
    </div>
  )
}
