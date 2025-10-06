/**
 * Internal Preview: Resume Template by Slug
 *
 * Used for programmatic thumbnail generation and manual inspection.
 */

'use client'

import * as React from 'react'
import { useParams } from 'next/navigation'
import { getTemplate } from '@/libs/templates/registry'
import resumeSample from '@/libs/samples/resumeSample'

export default function ResumePreviewPage(): React.ReactElement {
  const params = useParams()
  const slug = (params?.slug as string) || ''

  let component: React.ComponentType<any> | null = null
  let defaults: any | null = null
  try {
    const t = getTemplate(slug as any)
    component = t.component
    defaults = t.defaults
  } catch {
    component = null
  }

  React.useEffect(() => {
    const markReady = () => {
      (window as any).renderReady = true
    }
    if ((document as any).fonts?.ready) {
      const fonts: any = (document as any).fonts
      fonts.ready.then(() => requestAnimationFrame(() => requestAnimationFrame(markReady)))
    } else {
      requestAnimationFrame(() => requestAnimationFrame(markReady))
    }
  }, [])

  if (!component) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">Unknown template: {slug}</p>
      </div>
    )
  }

  const TemplateComp = component
  return (
    <div id="preview-root" className="min-h-screen w-full flex items-start justify-center bg-white">
      <div style={{ width: 816, marginTop: 16 }}>
        <TemplateComp data={resumeSample} customizations={defaults || undefined} mode="preview" />
      </div>
    </div>
  )
}
