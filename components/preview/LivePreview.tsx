/**
 * Live Preview
 *
 * Main preview component with RAF-batched updates and scroll restoration.
 * Subscribes to documentStore and renders template with <120ms updates.
 *
 * @module components/preview/LivePreview
 */

'use client'

import * as React from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useDocumentStore } from '@/stores/documentStore'
import { PreviewContainer } from './PreviewContainer'
import { PreviewError } from './PreviewError'
import { PreviewSkeleton } from './PreviewSkeleton'
import { PreviewControls } from './PreviewControls'
import { saveScrollPosition, restoreScrollPosition } from '@/libs/utils/previewUtils'
import type { ResumeJson } from '@/types/resume'
import { ArtboardFrame } from './ArtboardFrame'
import { mapResumeToArtboardDocument, mapResumeJsonToResumeData, useArtboardStore } from '@/libs/reactive-artboard'
import { usePreviewStore } from '@/stores/previewStore'
import type { PageFormat } from '@/libs/reactive-artboard/constants/page'

interface LivePreviewProps {
  documentId?: string
  showControls?: boolean
}

/**
 * Live preview with RAF-batched updates
 * Maintains scroll position and renders template in <120ms
 */
export function LivePreview({ showControls = true }: LivePreviewProps): React.ReactElement {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const scrollPositionRef = React.useRef<ReturnType<typeof saveScrollPosition> | null>(null)
  const rafIdRef = React.useRef<number | null>(null)
  const [previewData, setPreviewData] = React.useState<ResumeJson | null>(null)
  const lastDocRef = React.useRef<ResumeJson | null>(null)
  // Shallow selector for document data
  const document = useDocumentStore(useShallow((state) => state.document))
  const isLoading = useDocumentStore((state) => state.isLoading)
  const setResumeData = useArtboardStore((state) => state.setResume)
  const setTotalPages = usePreviewStore((state) => state.setTotalPages)
  const setPageOffsetsStore = usePreviewStore((state) => state.setPageOffsets)
  const updatePaginationMetrics = usePreviewStore((state) => state.updatePaginationMetrics)
  const resetPagination = usePreviewStore((state) => state.resetPagination)

  const artboardDocument = React.useMemo(() => {
    if (!previewData) return null
    return mapResumeToArtboardDocument(previewData)
  }, [previewData])

  React.useEffect(() => {
    if (!artboardDocument) {
      resetPagination()
      return
    }
    setTotalPages(artboardDocument.layout.length)
  }, [artboardDocument, resetPagination, setTotalPages])

  // RAF-batched update handler
  React.useEffect(() => {
    if (!document) return

    const hasDocumentChanged = lastDocRef.current !== document
    const isInitialRender = previewData === null

    if (!hasDocumentChanged && !isInitialRender) return

    lastDocRef.current = document

    // Save scroll position before update
    if (containerRef.current) {
      scrollPositionRef.current = saveScrollPosition(containerRef.current)
    }

    // Cancel any pending RAF
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current)
      rafIdRef.current = null
    }

    // Schedule update in next frame
    rafIdRef.current = requestAnimationFrame(() => {
      const start = performance.now()

      // Update preview data only when reference changes
      setPreviewData(document)
      setResumeData(mapResumeJsonToResumeData(document))

      if (process.env.NODE_ENV !== 'production') {
        try {
          const keys = Object.keys(document as any)
          console.debug('[Preview] apply document', {
            keys,
            hasWork: Array.isArray((document as any).work) && ((document as any).work?.length || 0) > 0,
            hasEducation: Array.isArray((document as any).education) && ((document as any).education?.length || 0) > 0,
            hasProjects: Array.isArray((document as any).projects) && ((document as any).projects?.length || 0) > 0,
            hasSkills: Array.isArray((document as any).skills) && ((document as any).skills?.length || 0) > 0,
          })
        } catch (err) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('[Preview] logging failed', err)
          }
        }
      }

      // Restore scroll position after render
      if (containerRef.current && scrollPositionRef.current) {
        restoreScrollPosition(containerRef.current, scrollPositionRef.current)
      }

      const end = performance.now()
      const duration = end - start

      if (process.env.NODE_ENV === 'development') {
        if (duration > 120) {
          console.warn(`[Preview] Update took ${duration.toFixed(2)}ms (budget: 120ms)`)
        }
      }

      rafIdRef.current = null
    })

    // Cleanup on unmount
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current)
        rafIdRef.current = null
      }
    }
  }, [document, previewData, setResumeData])

  // Show loading skeleton
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
        {showControls && <div className="flex-shrink-0"><PreviewControls /></div>}
        <div className="flex-1 min-h-0">
          <PreviewContainer pageFormat={artboardDocument.metadata.page.format as PageFormat}>
            <ArtboardFrame
              document={artboardDocument}
              onPagesMeasured={setPageOffsetsStore}
              onFrameMetrics={({ offsets, pageWidth, pageHeight, margin, gap }) => {
                updatePaginationMetrics({
                  offsets,
                  pageWidth,
                  pageHeight,
                  margin,
                  gap,
                })
              }}
            />
          </PreviewContainer>
        </div>
      </div>
    </PreviewError>
  )
}
