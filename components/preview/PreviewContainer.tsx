/**
 * Preview Container
 *
 * Preview wrapper with layout, zoom transform, and overflow handling.
 *
 * @module components/preview/PreviewContainer
 */

'use client'

import * as React from 'react'
import { usePreviewStore } from '@/stores/previewStore'
import { cn } from '@/libs/utils'

interface PreviewContainerProps {
  children: React.ReactNode
  className?: string
}

/**
 * Container wrapper for preview with zoom and scroll handling
 */
export function PreviewContainer({
  children,
  className = '',
}: PreviewContainerProps): React.ReactElement {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const zoomLevel = usePreviewStore((state) => state.zoomLevel)

  return (
    <div ref={containerRef} className={cn('preview-container w-full h-full overflow-auto bg-gray-100', className)}>
      <div className="flex items-start justify-center min-h-full p-8">
        <div
          className="preview-content bg-white shadow-lg"
          style={{
            width: 816, // 8.5in @ 96dpi
            minHeight: '11in',
            transform: `scale(${zoomLevel})`,
            transformOrigin: 'top center',
            transition: 'transform 0.2s ease-out',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
