'use client'

import * as React from 'react'
import { ArtboardFrame } from '@/components/preview/ArtboardFrame'
import { mapCoverLetterToArtboardDocument } from '@/libs/reactive-artboard'
import coverLetterSample from '@/libs/samples/coverLetterSample'

interface CoverLetterTemplateLivePreviewProps {
  className?: string
  ariaLabel?: string
}

export function CoverLetterTemplateLivePreview({ className = '', ariaLabel }: CoverLetterTemplateLivePreviewProps): React.ReactElement {
  const artboardDocument = React.useMemo(() => mapCoverLetterToArtboardDocument(coverLetterSample), [])

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`} aria-label={ariaLabel}>
      <ArtboardFrame document={artboardDocument} />
    </div>
  )
}

export default CoverLetterTemplateLivePreview
