'use client'

import * as React from 'react'
import { createRoot, Root } from 'react-dom/client'
import { ArtboardRenderer, ArtboardDocument } from '@/libs/reactive-artboard'

interface ArtboardFrameProps {
  document: ArtboardDocument
}

/**
 * Embeds the artboard renderer inside an iframe to isolate styles.
 * Auto-resizes the frame based on rendered content height.
 */
export function ArtboardFrame({ document }: ArtboardFrameProps): React.ReactElement {
  const iframeRef = React.useRef<HTMLIFrameElement>(null)
  const rootRef = React.useRef<Root | null>(null)
  const [height, setHeight] = React.useState<number>(0)

  // Mount React root inside the iframe
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

    rootRef.current.render(<ArtboardRenderer document={document} />)

    const updateHeight = () => {
      const next = doc.documentElement.scrollHeight
      setHeight((prev) => (prev !== next ? next : prev))
    }

    updateHeight()

    const ResizeObserverCtor = (win as typeof window & { ResizeObserver?: typeof ResizeObserver }).ResizeObserver ?? ResizeObserver
    const observer = new ResizeObserverCtor(() => updateHeight())
    observer.observe(doc.documentElement)

    return () => {
      observer.disconnect()
    }
  }, [document])

  // Cleanup React root once component unmounts
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
