/**
 * Cover Letter Live Preview
 *
 * Main preview component for cover letters with RAF-batched updates and scroll restoration.
 * Subscribes to coverLetterStore and renders template with <120ms updates.
 *
 * @module components/preview/CoverLetterLivePreview
 */

'use client'

import * as React from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useCoverLetterStore } from '@/stores/coverLetterStore'
import {
  useCoverLetterTemplateId,
  useCoverLetterCustomizations,
} from '@/stores/coverLetterTemplateStore'
import { PreviewContainer } from './PreviewContainer'
import { CoverLetterTemplateRenderer } from './CoverLetterTemplateRenderer'
import { PreviewError } from './PreviewError'
import { PreviewSkeleton } from './PreviewSkeleton'
import { PreviewControls } from './PreviewControls'
import { saveScrollPosition, restoreScrollPosition } from '@/libs/utils/previewUtils'
import type { CoverLetterJson } from '@/types/cover-letter'

interface CoverLetterLivePreviewProps {
  documentId?: string
  showControls?: boolean
}

/**
 * Live preview for cover letters with RAF-batched updates
 * Maintains scroll position and renders template in <120ms
 */
export function CoverLetterLivePreview({
  showControls = true,
}: CoverLetterLivePreviewProps): React.ReactElement {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const scrollPositionRef = React.useRef<ReturnType<typeof saveScrollPosition> | null>(null)
  const rafIdRef = React.useRef<number | null>(null)
  const [previewData, setPreviewData] = React.useState<CoverLetterJson | null>(null)

  // Shallow selector for document data
  const document = useCoverLetterStore(useShallow((state) => state.document))

  const isLoading = useCoverLetterStore((state) => state.isLoading)

  // Get template ID and customizations from cover letter template store
  const templateId = useCoverLetterTemplateId()
  const customizations = useCoverLetterCustomizations()

  // RAF-batched update handler
  React.useEffect(() => {
    if (!document) {
      return
    }

    // Save scroll position before update
    if (containerRef.current) {
      scrollPositionRef.current = saveScrollPosition(containerRef.current)
    }

    // Cancel any pending RAF
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current)
    }

    // Schedule update in next frame
    rafIdRef.current = requestAnimationFrame(() => {
      const start = performance.now()

      // Update preview data
      setPreviewData(document)

      // Restore scroll position after render
      if (containerRef.current && scrollPositionRef.current) {
        restoreScrollPosition(containerRef.current, scrollPositionRef.current)
      }

      const end = performance.now()
      const duration = end - start

      if (process.env.NODE_ENV === 'development') {
        if (duration > 120) {
          console.warn(
            `[CoverLetterPreview] Update took ${duration.toFixed(2)}ms (budget: 120ms)`
          )
        }
      }

      rafIdRef.current = null
    })

    // Cleanup on unmount
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current)
      }
    }
  }, [document])

  // Show loading skeleton
  if (isLoading || !previewData) {
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
          <PreviewContainer>
            <CoverLetterTemplateRenderer
              templateId={templateId}
              data={previewData}
              customizations={customizations}
              mode="preview"
            />
          </PreviewContainer>
        </div>
      </div>
    </PreviewError>
  )
}
