/**
 * Internal Preview: Resume Template by Slug
 *
 * Used for programmatic thumbnail generation and manual inspection.
 */

'use client'

import * as React from 'react'
import { useParams } from 'next/navigation'
import resumeSample from '@/libs/samples/resumeSample'
import { ArtboardRenderer } from '@/libs/reactive-artboard/renderer/ArtboardRenderer'
import { mapResumeToArtboardDocument } from '@/libs/reactive-artboard/mappers'
import { getResumeTemplateMetadata } from '@/libs/reactive-artboard/catalog'
import { createDefaultAppearance } from '@/types/resume'

export default function ResumePreviewPage(): React.ReactElement {
  const params = useParams()
  const slug = (params?.slug as string) || ''

  let metadata: ReturnType<typeof getResumeTemplateMetadata> | null = null
  try {
    metadata = getResumeTemplateMetadata(slug as any)
  } catch {
    metadata = null
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

  const artboardDocument = React.useMemo(() => {
    if (!metadata) return null
    const baseAppearance =
      resumeSample.appearance ?? createDefaultAppearance(resumeSample.settings?.pageSize ?? 'Letter')
    return mapResumeToArtboardDocument({
      ...resumeSample,
      appearance: {
        ...baseAppearance,
        template: metadata.id,
      },
    })
  }, [metadata])

  if (!metadata || !artboardDocument) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">Unknown template: {slug}</p>
      </div>
    )
  }

  return (
    <div id="preview-root" className="min-h-screen w-full flex items-start justify-center bg-white">
      <div style={{ width: 816, marginTop: 16 }}>
        <ArtboardRenderer document={artboardDocument} />
      </div>
    </div>
  )
}
