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
import { useTemplateId, useCustomizations } from '@/stores/templateStore'
import { PreviewContainer } from './PreviewContainer'
import { TemplateRenderer } from './TemplateRenderer'
import { PreviewError } from './PreviewError'
import { PreviewSkeleton } from './PreviewSkeleton'
import { PreviewControls } from './PreviewControls'
import { saveScrollPosition, restoreScrollPosition } from '@/libs/utils/previewUtils'
import type { ResumeJson } from '@/types/resume'

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

  // Shallow selector for document data
  const document = useDocumentStore(
    useShallow((state) => state.document)
  )

  const isLoading = useDocumentStore((state) => state.isLoading)

  // Get template ID and customizations from templateStore
  const templateId = useTemplateId()
  const customizations = useCustomizations()

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
          console.warn(`[Preview] Update took ${duration.toFixed(2)}ms (budget: 120ms)`)
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
      <div ref={containerRef} className="w-full h-full">
        {showControls && <PreviewControls />}
        <PreviewContainer>
          <TemplateRenderer
            templateId={templateId}
            data={previewData}
            customizations={customizations}
            mode="preview"
          />
        </PreviewContainer>
      </div>
    </PreviewError>
  )
}
