'use client'

import * as React from 'react'
import { createRoot, Root } from 'react-dom/client'
import { ArtboardRenderer, ArtboardDocument } from '@/libs/reactive-artboard'

type FrameMetrics = {
  offsets: number[]
  pageWidth: number
  pageHeight: number
  margin: number
  gap: number
}

// eslint-disable-next-line no-unused-vars
type PreviewZoomBridge = (delta: number) => void

interface ArtboardFrameProps {
  document: ArtboardDocument
  // eslint-disable-next-line no-unused-vars
  onPagesMeasured?: (offsets: number[]) => void
  // eslint-disable-next-line no-unused-vars
  onFrameMetrics?: (metrics: FrameMetrics) => void
}

export function ArtboardFrame({
  document,
  onPagesMeasured,
  onFrameMetrics,
}: ArtboardFrameProps): React.ReactElement {
  const iframeRef = React.useRef<HTMLIFrameElement>(null)
  const rootRef = React.useRef<Root | null>(null)
  const [height, setHeight] = React.useState<number>(0)

  // eslint-disable-next-line no-unused-vars
  const pagesMeasuredRef = React.useRef<((offsets: number[]) => void) | undefined>(onPagesMeasured)
  // eslint-disable-next-line no-unused-vars
  const frameMetricsRef = React.useRef<((metrics: FrameMetrics) => void) | undefined>(onFrameMetrics)

  React.useEffect(() => {
    pagesMeasuredRef.current = onPagesMeasured
  }, [onPagesMeasured])

  React.useEffect(() => {
    frameMetricsRef.current = onFrameMetrics
  }, [onFrameMetrics])

  const handlePagesMeasured = React.useCallback((offsets: number[]) => {
    pagesMeasuredRef.current?.(offsets)
  }, [])

  const handleFrameMetrics = React.useCallback((metrics: FrameMetrics) => {
    frameMetricsRef.current?.(metrics)
  }, [])

  React.useLayoutEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    const doc = iframe.contentDocument
    const win = iframe.contentWindow
    if (!doc || !win) return

    if (!rootRef.current) {
      const origin = window.location.origin
      doc.open()
      doc.write(
        `<!DOCTYPE html><html><head>` +
          `<link rel="stylesheet" href="${origin}/artboard/tailwind.css" />` +
          `<style>html,body{margin:0;padding:0;background:transparent;}</style>` +
          `</head><body><div id="artboard-root"></div></body></html>`
      )
      doc.close()
      const mountNode = doc.getElementById('artboard-root')
      if (!mountNode) {
        console.error('[ArtboardFrame] failed to locate mount node')
        return
      }
      rootRef.current = createRoot(mountNode)
    }

    rootRef.current.render(
      <ArtboardRenderer
        document={document}
        onPagesMeasured={handlePagesMeasured}
        onFrameMetrics={handleFrameMetrics}
      />
    )

    const updateHeight = () => {
      const nextHeight = doc.documentElement.scrollHeight
      setHeight((prev) => (prev !== nextHeight ? nextHeight : prev))
    }

    updateHeight()

    const wheelHandler = (event: WheelEvent) => {
      if (!(event.ctrlKey || event.metaKey)) return
      event.preventDefault()
      try {
        const parentWindow = (win.parent ?? window.parent) as typeof window & {
          __resumePreviewZoom?: PreviewZoomBridge
        }
        parentWindow?.__resumePreviewZoom?.(event.deltaY)
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[ArtboardFrame] modifier wheel handling failed', error)
        }
      }
    }

    const preventGesture = (event: Event) => event.preventDefault()

    doc.addEventListener('wheel', wheelHandler, { passive: false })
    doc.addEventListener('gesturestart', preventGesture)
    doc.addEventListener('gesturechange', preventGesture)
    doc.addEventListener('gestureend', preventGesture)

    const ResizeObserverCtor =
      (win as typeof window & { ResizeObserver?: typeof ResizeObserver }).ResizeObserver ??
      ResizeObserver
    const observer = new ResizeObserverCtor(() => updateHeight())
    observer.observe(doc.documentElement)

    return () => {
      observer.disconnect()
      doc.removeEventListener('wheel', wheelHandler)
      doc.removeEventListener('gesturestart', preventGesture)
      doc.removeEventListener('gesturechange', preventGesture)
      doc.removeEventListener('gestureend', preventGesture)
    }
  }, [document, handleFrameMetrics, handlePagesMeasured])

  React.useEffect(() => {
    return () => {
      if (rootRef.current) {
        rootRef.current.unmount()
        rootRef.current = null
      }
    }
  }, [])

  return (
    <iframe
      ref={iframeRef}
      title="resume-preview"
      style={{
        width: '100%',
        height: height ? `${height}px` : 'auto',
        border: 'none',
        backgroundColor: 'transparent',
      }}
      scrolling="no"
    />
  )
}
