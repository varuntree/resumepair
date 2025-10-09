'use client'

import * as React from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useCoverLetterStore } from '@/stores/coverLetterStore'
import { PreviewContainer } from './PreviewContainer'
import { PreviewError } from './PreviewError'
import { PreviewSkeleton } from './PreviewSkeleton'
import { PreviewControls } from './PreviewControls'
import { saveScrollPosition, restoreScrollPosition } from '@/libs/utils/previewUtils'
import type { CoverLetterJson } from '@/types/cover-letter'
import { ArtboardFrame } from './ArtboardFrame'
import { mapCoverLetterToArtboardDocument } from '@/libs/reactive-artboard'
import { usePreviewStore } from '@/stores/previewStore'
import type { PageFormat } from '@/libs/reactive-artboard/constants/page'

interface CoverLetterLivePreviewProps {
  documentId?: string
  showControls?: boolean
}

export function CoverLetterLivePreview({ showControls = true }: CoverLetterLivePreviewProps): React.ReactElement {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const scrollPositionRef = React.useRef<ReturnType<typeof saveScrollPosition> | null>(null)
  const rafIdRef = React.useRef<number | null>(null)
  const [previewData, setPreviewData] = React.useState<CoverLetterJson | null>(null)
  const lastDocRef = React.useRef<CoverLetterJson | null>(null)
  const [pageOffsets, setPageOffsets] = React.useState<number[]>([])
  const [pageSizePx, setPageSizePx] = React.useState<{ width: number; height: number } | null>(null)

  const document = useCoverLetterStore(useShallow((state) => state.document))
  const isLoading = useCoverLetterStore((state) => state.isLoading)
  const setTotalPages = usePreviewStore((state) => state.setTotalPages)

  React.useEffect(() => {
    if (!document) return
    if (lastDocRef.current === document) return

    if (containerRef.current) {
      scrollPositionRef.current = saveScrollPosition(containerRef.current)
    }

    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current)
    }

    rafIdRef.current = requestAnimationFrame(() => {
      const start = performance.now()

      setPreviewData(document)
      lastDocRef.current = document

      if (containerRef.current && scrollPositionRef.current) {
        restoreScrollPosition(containerRef.current, scrollPositionRef.current)
      }

      const end = performance.now()
      const duration = end - start
      if (process.env.NODE_ENV === 'development' && duration > 120) {
        console.warn(`[CoverLetterPreview] Update took ${duration.toFixed(2)}ms (budget: 120ms) `)
      }

      rafIdRef.current = null
    })

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current)
      }
    }
  }, [document])

  const artboardDocument = React.useMemo(() => {
    if (!previewData) return null
    return mapCoverLetterToArtboardDocument(previewData)
  }, [previewData])

  React.useEffect(() => {
    if (!artboardDocument) {
      setTotalPages(1)
      setPageOffsets([])
      return
    }
    setTotalPages(artboardDocument.layout.length)
    setPageOffsets([])
  }, [artboardDocument, setTotalPages])

  if (isLoading || !artboardDocument) {
    return (
      <PreviewContainer>
        <PreviewSkeleton />
      </PreviewContainer>
    )
  }

  return (
    <PreviewError>
      <div ref={containerRef} className="w-full h-full flex flex-col min-h-0">
        {showControls && (
          <div className="flex-shrink-0">
            <PreviewControls />
          </div>
        )}
        <div className="flex-1 min-h-0">
          <PreviewContainer
            pageFormat={artboardDocument.metadata.page.format as PageFormat}
            pageOffsets={pageOffsets}
            pageWidthPxOverride={pageSizePx?.width}
            pageHeightPxOverride={pageSizePx?.height}
          >
            <ArtboardFrame
              document={artboardDocument}
              onPagesMeasured={setPageOffsets}
              onFrameMetrics={({ offsets, pageWidth, pageHeight }) => {
                setPageOffsets(offsets)
                setPageSizePx({ width: pageWidth, height: pageHeight })
              }}
            />
          </PreviewContainer>
        </div>
      </div>
    </PreviewError>
  )
}
