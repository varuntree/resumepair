/**
 * Internal Preview: Cover Letter Template by Slug
 */

'use client'

import * as React from 'react'
import { useParams } from 'next/navigation'
import coverLetterSample from '@/libs/samples/coverLetterSample'
import { mapCoverLetterToArtboardDocument } from '@/libs/reactive-artboard/mappers'
import { ArtboardRenderer } from '@/libs/reactive-artboard/renderer/ArtboardRenderer'

const SUPPORTED_COVER_LETTER_TEMPLATES = new Set(['onyx'])

export default function CoverLetterPreviewPage(): React.ReactElement {
  const params = useParams()
  const slug = (params?.slug as string) || ''

  const templateId = SUPPORTED_COVER_LETTER_TEMPLATES.has(slug) ? slug : null

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

  const artboardDocument = React.useMemo(() => mapCoverLetterToArtboardDocument(coverLetterSample), [])

  if (!templateId) {
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
