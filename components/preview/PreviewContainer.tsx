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
import {
  DEFAULT_PAGE_FORMAT,
  MM_TO_PX,
  PAGE_SIZE_MM,
  normalizePageFormat,
  type PageFormat,
} from '@/libs/reactive-artboard/constants/page'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'
import type { ReactZoomPanPinchRef } from 'react-zoom-pan-pinch'

interface PreviewContainerProps {
  children: React.ReactNode
  className?: string
  pageFormat?: PageFormat
  pageOffsets?: number[]
  pageWidthPxOverride?: number
  pageHeightPxOverride?: number
}

/**
 * Container wrapper for preview with zoom and scroll handling
 */
export function PreviewContainer({
  children,
  className = '',
  pageFormat,
  pageOffsets,
  pageWidthPxOverride,
  pageHeightPxOverride,
}: PreviewContainerProps): React.ReactElement {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const wrapperRef = React.useRef<HTMLDivElement>(null)
  const transformRef = React.useRef<ReactZoomPanPinchRef>(null)
  const zoomLevel = usePreviewStore((state) => state.zoomLevel)
  // Drag state removed; panning handled by react-zoom-pan-pinch
  const isFitToWidth = usePreviewStore((state) => state.isFitToWidth)
  const applyFitZoom = usePreviewStore((state) => state.applyFitZoom)
  const resetZoom = usePreviewStore((state) => state.resetZoom)
  const pendingScrollPage = usePreviewStore((state) => state.pendingScrollPage)
  const syncCurrentPage = usePreviewStore((state) => state.syncCurrentPage)
  const clearPendingScroll = usePreviewStore((state) => state.clearPendingScroll)
  const resolvedFormat = normalizePageFormat(pageFormat ?? DEFAULT_PAGE_FORMAT)
  const pageSize = PAGE_SIZE_MM[resolvedFormat]
  const computedWidthPx = pageSize.width * MM_TO_PX
  const computedHeightPx = pageSize.height * MM_TO_PX
  const pageWidthPx = pageWidthPxOverride ?? computedWidthPx
  const pageHeightPx = pageHeightPxOverride ?? computedHeightPx
  const isPanEnabled = zoomLevel > 1.01

  const getWrapperPadding = React.useCallback(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) {
      return { top: 0, left: 0, right: 0 }
    }
    const styles = window.getComputedStyle(wrapper)
    return {
      top: Number.parseFloat(styles.paddingTop ?? '0'),
      left: Number.parseFloat(styles.paddingLeft ?? '0'),
      right: Number.parseFloat(styles.paddingRight ?? '0'),
    }
  }, [])

  const recomputeFitZoom = React.useCallback(() => {
    if (!isFitToWidth) return
    const container = containerRef.current
    if (!container) return
    // clientWidth excludes vertical scrollbar width
    let availableWidth = container.clientWidth
    const padding = getWrapperPadding()
    availableWidth = availableWidth - padding.left - padding.right
    if (!Number.isFinite(availableWidth) || availableWidth <= 0 || pageWidthPx <= 0) return
    const targetZoom = availableWidth / pageWidthPx
    transformRef.current?.setTransform(0, 0, targetZoom, 0)
    applyFitZoom(targetZoom)
  }, [applyFitZoom, getWrapperPadding, isFitToWidth, pageWidthPx])

  React.useLayoutEffect(() => {
    if (!isFitToWidth) {
      return
    }

    recomputeFitZoom()

    const target = containerRef.current
    if (!target || typeof ResizeObserver === 'undefined') {
      return
    }

    const observer = new ResizeObserver(() => {
      recomputeFitZoom()
    })
    observer.observe(target)

    return () => {
      observer.disconnect()
    }
  }, [isFitToWidth, recomputeFitZoom])

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey)) return
      if (event.key === '=' || event.key === '+') {
        event.preventDefault()
        transformRef.current?.zoomIn(0.1)
      } else if (event.key === '-' || event.key === '_') {
        event.preventDefault()
        transformRef.current?.zoomOut(0.1)
      } else if (event.key === '0') {
        event.preventDefault()
        transformRef.current?.resetTransform()
        transformRef.current?.centerView(1.0, 0)
        resetZoom()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [resetZoom])

  React.useEffect(() => {
    if (pendingScrollPage === null) {
      return
    }

    const container = containerRef.current
    if (!container) {
      return
    }

    if (!pageOffsets || pageOffsets.length === 0) {
      clearPendingScroll()
      return
    }

    const index = Math.min(pageOffsets.length - 1, Math.max(0, pendingScrollPage - 1))
    const padding = getWrapperPadding()
    const target = pageOffsets[index] * zoomLevel + padding.top
    container.scrollTo({ top: target, behavior: 'smooth' })

    const rafId = requestAnimationFrame(() => {
      clearPendingScroll()
    })

    return () => {
      cancelAnimationFrame(rafId)
    }
  }, [clearPendingScroll, getWrapperPadding, pageOffsets, pendingScrollPage, zoomLevel])

  const lastAppliedZoomRef = React.useRef<number | null>(null)

  React.useEffect(() => {
    // If external controls change the zoom (e.g., ZoomControl), reflect it in the transform wrapper
    if (isFitToWidth) return
    const api = transformRef.current
    if (!api) return
    const epsilon = 0.005
    const last = lastAppliedZoomRef.current
    if (last === null || Math.abs(last - zoomLevel) > epsilon) {
      api.setTransform(0, 0, zoomLevel, 0)
      lastAppliedZoomRef.current = zoomLevel
    }
  }, [isFitToWidth, zoomLevel])

  React.useEffect(() => {
    const container = containerRef.current
    if (!container || !pageOffsets || pageOffsets.length === 0) return

    let frame = 0

    const handleScroll = () => {
      if (frame !== 0) return
      frame = requestAnimationFrame(() => {
        frame = 0
        const padding = getWrapperPadding()
        const scrollTop = container.scrollTop - padding.top
        if (scrollTop < 0) {
          syncCurrentPage(1)
          return
        }

        let resolvedPage = 1
        for (let index = pageOffsets.length - 1; index >= 0; index -= 1) {
          const threshold = pageOffsets[index] * zoomLevel
          if (scrollTop + 4 >= threshold) {
            resolvedPage = index + 1
            break
          }
        }
        syncCurrentPage(resolvedPage)
      })
    }

    container.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      container.removeEventListener('scroll', handleScroll)
      if (frame) {
        cancelAnimationFrame(frame)
      }
    }
  }, [getWrapperPadding, pageOffsets, syncCurrentPage, zoomLevel])

  // Remove manual pointer-drag panning; handled by react-zoom-pan-pinch

  return (
    <div ref={containerRef} className={cn('preview-container w-full h-full bg-gray-100', className)}>
      <TransformWrapper
        ref={transformRef}
        initialScale={zoomLevel}
        minScale={0.4}
        maxScale={2.0}
        limitToBounds={false}
        centerOnInit={true}
        panning={{ disabled: !isPanEnabled }}
        onTransformed={(ref) => {
          const scale = ref.state.scale
          // Reflect the current library scale into the store (fit-to-width effect also calls applyFitZoom)
          usePreviewStore.getState().setZoom(scale)
        }}
      >
        <TransformComponent wrapperClass="!w-full !h-full" contentClass="flex items-start justify-center min-h-full p-8">
          <div ref={wrapperRef} className="preview-content bg-white shadow-lg">
            <div
              style={{
                width: `${pageWidthPx}px`,
                minHeight: `${pageHeightPx}px`,
              }}
            >
              {children}
            </div>
          </div>
        </TransformComponent>
      </TransformWrapper>
    </div>
  )
}
