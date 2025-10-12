/**
 * Preview Container
 *
 * Provides scroll + zoom surface for the resume preview with strict event isolation.
 * Integrates with the preview store for fit-to-width behaviour, pagination metrics,
 * and scroll ratio persistence.
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
}

export function PreviewContainer({
  children,
  className = '',
  pageFormat,
}: PreviewContainerProps): React.ReactElement {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const wrapperRef = React.useRef<HTMLDivElement>(null)
  const transformRef = React.useRef<ReactZoomPanPinchRef>(null)

  const zoomLevel = usePreviewStore((state) => state.zoomLevel)
  const isFitToWidth = usePreviewStore((state) => state.isFitToWidth)
  const applyFitZoom = usePreviewStore((state) => state.applyFitZoom)
  const resetZoom = usePreviewStore((state) => state.resetZoom)
  const clearPendingScroll = usePreviewStore((state) => state.clearPendingScroll)
  const syncCurrentPage = usePreviewStore((state) => state.syncCurrentPage)
  const pendingScrollPage = usePreviewStore((state) => state.pendingScrollPage)
  const pendingScrollRatio = usePreviewStore((state) => state.pendingScrollRatio)
  const pageOffsets = usePreviewStore((state) => state.pageOffsets)
  const pageMetrics = usePreviewStore((state) => state.pageMetrics)
  const syncZoomFromTransform = usePreviewStore((state) => state.syncZoomFromTransform)

  const resolvedFormat = normalizePageFormat(pageFormat ?? DEFAULT_PAGE_FORMAT)
  const fallback = PAGE_SIZE_MM[resolvedFormat]
  const fallbackWidthPx = fallback.width * MM_TO_PX
  const fallbackHeightPx = fallback.height * MM_TO_PX
  const pageWidthPx = pageMetrics?.widthPx ?? fallbackWidthPx
  const pageHeightPx = pageMetrics?.heightPx ?? fallbackHeightPx
  const basePageHeight = pageMetrics?.heightPx ?? fallbackHeightPx
  const isPanEnabled = zoomLevel > 1.01

  const getWrapperPadding = React.useCallback(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) {
      return { top: 0, left: 0, right: 0 }
    }
    const styles = window.getComputedStyle(wrapper)
    return {
      top: Number.parseFloat(styles.paddingTop || '0'),
      left: Number.parseFloat(styles.paddingLeft || '0'),
      right: Number.parseFloat(styles.paddingRight || '0'),
    }
  }, [])

  const recomputeFitZoom = React.useCallback(() => {
    if (!isFitToWidth) return
    const container = containerRef.current
    if (!container) return

    let availableWidth = container.clientWidth
    const padding = getWrapperPadding()
    availableWidth -= padding.left + padding.right

    if (!Number.isFinite(availableWidth) || availableWidth <= 0 || pageWidthPx <= 0) return

    const targetZoom = availableWidth / pageWidthPx
    transformRef.current?.setTransform(0, 0, targetZoom, 0)
    applyFitZoom(targetZoom)
  }, [applyFitZoom, getWrapperPadding, isFitToWidth, pageWidthPx])

  React.useLayoutEffect(() => {
    if (!isFitToWidth) return
    recomputeFitZoom()

    const target = containerRef.current
    if (!target || typeof ResizeObserver === 'undefined') return

    const observer = new ResizeObserver(() => recomputeFitZoom())
    observer.observe(target)

    return () => observer.disconnect()
  }, [isFitToWidth, recomputeFitZoom])

  React.useEffect(() => {
    if (!isFitToWidth) return
    recomputeFitZoom()
  }, [isFitToWidth, recomputeFitZoom, pageWidthPx])

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
    const container = containerRef.current
    if (!container) return

    const handleWheel = (event: WheelEvent) => {
      event.stopPropagation()

      if (event.ctrlKey || event.metaKey) {
        event.preventDefault()
        const delta = -event.deltaY / 100
        if (delta > 0) {
          transformRef.current?.zoomIn(0.1)
        } else {
          transformRef.current?.zoomOut(0.1)
        }
      }
    }

    container.addEventListener('wheel', handleWheel, { passive: false, capture: true })
    return () => {
      container.removeEventListener('wheel', handleWheel, { capture: true } as any)
    }
  }, [])

  React.useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const preventGesture = (event: Event) => event.preventDefault()
    container.addEventListener('gesturestart', preventGesture)
    container.addEventListener('gesturechange', preventGesture)
    container.addEventListener('gestureend', preventGesture)

    return () => {
      container.removeEventListener('gesturestart', preventGesture)
      container.removeEventListener('gesturechange', preventGesture)
      container.removeEventListener('gestureend', preventGesture)
    }
  }, [])

  React.useEffect(() => {
    if (pendingScrollPage === null) return

    const container = containerRef.current
    if (!container) return
    if (!pageOffsets.length) {
      clearPendingScroll()
      return
    }

    const index = Math.min(pageOffsets.length - 1, Math.max(0, pendingScrollPage - 1))
    const padding = getWrapperPadding()
    const start = pageOffsets[index] ?? 0
    const end =
      pageOffsets[index + 1] ??
      (start + (pageMetrics?.heightPx ?? basePageHeight))
    const span = Math.max(end - start, pageMetrics?.heightPx ?? basePageHeight)
    const ratio = pendingScrollRatio ?? 0
    const unscaledTarget = start + Math.min(Math.max(ratio, 0), 1) * span
    const target = unscaledTarget * zoomLevel + padding.top

    container.scrollTo({ top: target, behavior: 'smooth' })
    const rafId = requestAnimationFrame(() => clearPendingScroll())

    return () => cancelAnimationFrame(rafId)
  }, [
    basePageHeight,
    clearPendingScroll,
    getWrapperPadding,
    pageMetrics?.heightPx,
    pageOffsets,
    pendingScrollPage,
    pendingScrollRatio,
    zoomLevel,
  ])

  const lastAppliedZoomRef = React.useRef<number | null>(null)
  React.useEffect(() => {
    if (isFitToWidth) return
    const api = transformRef.current
    if (!api) return

    const epsilon = 0.005
    if (lastAppliedZoomRef.current === null || Math.abs(lastAppliedZoomRef.current - zoomLevel) > epsilon) {
      api.setTransform(0, 0, zoomLevel, 0)
      lastAppliedZoomRef.current = zoomLevel
    }
  }, [isFitToWidth, zoomLevel])

  React.useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let raf = 0
    const handleScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0

        if (!pageOffsets.length) return
        const padding = getWrapperPadding()
        const contentTop = Math.max((container.scrollTop - padding.top) / zoomLevel, 0)

        let resolvedPage = 1
        for (let index = pageOffsets.length - 1; index >= 0; index -= 1) {
          if (contentTop + 0.5 >= pageOffsets[index]) {
            resolvedPage = index + 1
            break
          }
        }

        const start = pageOffsets[resolvedPage - 1] ?? 0
        const end =
          pageOffsets[resolvedPage] ??
          (start + (pageMetrics?.heightPx ?? basePageHeight))
        const span = Math.max(end - start, pageMetrics?.heightPx ?? basePageHeight)
        const ratio = span > 0 ? (contentTop - start) / span : 0
        syncCurrentPage(resolvedPage, Math.min(Math.max(ratio, 0), 1))
      })
    }

    container.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      container.removeEventListener('scroll', handleScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [
    basePageHeight,
    getWrapperPadding,
    pageMetrics?.heightPx,
    pageOffsets,
    syncCurrentPage,
    zoomLevel,
  ])

  return (
    <div
      ref={containerRef}
      className={cn('preview-container w-full h-full overflow-auto bg-gray-100', className)}
      style={{
        overscrollBehavior: 'contain',
        touchAction: 'pan-y pinch-zoom',
        scrollbarGutter: 'stable',
      }}
    >
      <TransformWrapper
        ref={transformRef}
        initialScale={zoomLevel}
        minScale={0.4}
        maxScale={2.0}
        limitToBounds={false}
        centerOnInit
        panning={{ disabled: !isPanEnabled }}
        doubleClick={{ disabled: true }}
        pinch={{ disabled: false }}
        wheel={{ disabled: true }}
        onTransformed={(refState) => {
          const scale = refState.state.scale
          syncZoomFromTransform(scale)
          lastAppliedZoomRef.current = scale
        }}
      >
        <TransformComponent
          wrapperClass="!w-full !min-h-full"
          wrapperStyle={{ minHeight: '100%' }}
          contentClass="flex min-h-full w-full items-start justify-center p-8"
        >
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
