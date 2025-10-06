/**
 * Cover Letter Template Live Preview (Gallery/Selector)
 *
 * Lazily renders a scaled preview of a cover letter template using centralized sample data.
 */

'use client'

import * as React from 'react'
import { CoverLetterTemplateRenderer } from '@/components/preview/CoverLetterTemplateRenderer'
import type { CoverLetterTemplateSlug } from '@/types/cover-letter-template'
import { getCoverLetterTemplate } from '@/libs/templates/cover-letter/registry'
import coverLetterSample from '@/libs/samples/coverLetterSample'

interface CoverLetterTemplateLivePreviewProps {
  templateId: CoverLetterTemplateSlug
  className?: string
  // Optional accessible label when preview not yet rendered
  ariaLabel?: string
}

// Reference page width used by templates (8.5in at 96dpi ≈ 816px)
const TEMPLATE_BASE_WIDTH = 816

export function CoverLetterTemplateLivePreview({
  templateId,
  className = '',
  ariaLabel,
}: CoverLetterTemplateLivePreviewProps): React.ReactElement {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [inView, setInView] = React.useState(false)
  const [scale, setScale] = React.useState(0.5)
  const [ready, setReady] = React.useState(false)

  // Observe visibility to defer heavy rendering
  React.useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true)
          }
        }
      },
      { rootMargin: '200px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Compute scale to fit container width
  React.useEffect(() => {
    if (!containerRef.current) return
    const compute = () => {
      const w = containerRef.current!.clientWidth
      // leave small padding margin
      const target = Math.max(0.25, Math.min(1.0, w / TEMPLATE_BASE_WIDTH))
      setScale(target)
    }
    compute()
    const ro = new ResizeObserver(compute)
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  // Schedule mount when idle
  React.useEffect(() => {
    if (!inView || ready) return
    const schedule = (cb: () => void) => {
      const ric: any = (window as any).requestIdleCallback
      if (typeof ric === 'function') ric(cb, { timeout: 500 })
      else setTimeout(cb, 50)
    }
    schedule(() => setReady(true))
  }, [inView, ready])

  // Fallback skeleton until ready
  if (!ready) {
    return (
      <div
        ref={containerRef}
        className={`relative w-full h-full bg-gray-100 flex items-center justify-center ${className}`}
        aria-label={ariaLabel || 'Cover letter template preview placeholder'}
      >
        <div className="animate-pulse h-4 w-24 rounded bg-gray-200" />
      </div>
    )
  }

  // Render live preview scaled to fit
  const { defaults } = getCoverLetterTemplate(templateId)
  return (
    <div ref={containerRef} className={`relative w-full h-full overflow-hidden ${className}`}>
      <div
        className="absolute top-0 left-1/2"
        style={{
          width: TEMPLATE_BASE_WIDTH,
          transform: `translateX(-50%) scale(${scale})`,
          transformOrigin: 'top center',
          willChange: 'transform',
        }}
      >
        <CoverLetterTemplateRenderer
          templateId={templateId}
          data={coverLetterSample}
          customizations={defaults}
          mode="preview"
        />
      </div>
    </div>
  )
}

export default CoverLetterTemplateLivePreview
