'use client'

import * as React from 'react'
import { ArtboardDocument } from '../types'
import { getTemplateRenderer } from '../templates'
import { buildArtboardStyles } from '../styles'
import { Page } from '../components/Page'
import type { SectionKey } from '../schema'
import { FlowRoot } from '../components/FlowRoot'
import { measureFlowItems } from '../pagination/measure'
import { paginate } from '../pagination/paginate'
import { PAGE_SIZE_MM, MM_TO_PX } from '../constants/page'
import { FlowSlice, PaginatedPage } from '../pagination/blockTypes'

type ArtboardRendererProps = {
  document: ArtboardDocument
  onPagesMeasured?: (offsets: number[]) => void
  onFrameMetrics?: (metrics: {
    offsets: number[]
    pageWidth: number
    pageHeight: number
    margin: number
  }) => void
}

const WAIT_FOR_STYLES_MS = 100
const DATA_SUBITEM_SELECTOR = '[data-flow-subitem]'

const cloneSlice = (slice: FlowSlice): HTMLElement => {
  if (slice.type === 'whole') {
    return slice.item.element.cloneNode(true) as HTMLElement
  }

  const original = slice.item.element
  const clone = original.cloneNode(true) as HTMLElement
  const subItems = Array.from(clone.querySelectorAll<HTMLElement>(DATA_SUBITEM_SELECTOR))
  subItems.forEach((subItem, index) => {
    if (index < slice.from || index >= slice.to) {
      subItem.remove()
    }
  })

  const totalSubItems = original.querySelectorAll(DATA_SUBITEM_SELECTOR).length
  if (slice.from > 0) {
    clone.style.marginTop = '0px'
  }
  if (slice.to < totalSubItems) {
    clone.style.marginBottom = '0px'
  }

  return clone
}

const clonePages = (pages: PaginatedPage[]): HTMLElement[][] => {
  return pages.map((page) => page.slices.map((slice) => cloneSlice(slice)))
}

export function ArtboardRenderer({
  document,
  onPagesMeasured,
  onFrameMetrics,
}: ArtboardRendererProps): React.ReactElement {
  const Template = getTemplateRenderer(document.template)
  const style = React.useMemo(() => buildArtboardStyles(document.metadata), [document.metadata])

  const flowRootRef = React.useRef<HTMLDivElement>(null)
  const [pages, setPages] = React.useState<HTMLElement[][]>([])

  const measurementColumns = React.useMemo<SectionKey[][]>(() => {
    if (!document.layout.length) return [[]]
    const columnCount = document.layout[0]?.length ?? 0
    const combined: SectionKey[][] = Array.from({ length: columnCount }, () => [])

    document.layout.forEach((pageColumns) => {
      pageColumns.forEach((columnSections, columnIndex) => {
        if (!combined[columnIndex]) {
          combined[columnIndex] = []
        }
        combined[columnIndex].push(...(columnSections as SectionKey[]))
      })
    })

    return combined.length ? combined : [[]]
  }, [document.layout])

  const pageFormat = document.metadata.page.format || 'a4'
  const pageSize = PAGE_SIZE_MM[pageFormat]
  const pageHeightPx = pageSize.height * MM_TO_PX
  const pageWidthPx = pageSize.width * MM_TO_PX
  const margin = document.metadata.page.margin ?? 48
  const pageInnerHeight = pageHeightPx - 2 * margin

  React.useLayoutEffect(() => {
    const root = flowRootRef.current
    if (!root) return

    let cancelled = false
    setPages([])

    const isDev = process.env.NODE_ENV === 'development'
    const perfStart = isDev ? performance.now() : 0

    const timer = window.setTimeout(() => {
      try {
        const items = measureFlowItems(root)
        const result = paginate(items, { pageInnerHeight })
        if (cancelled) return

        setPages(clonePages(result.pages))

        const offsets = result.pages.map((_, index) => index * pageHeightPx)
        onPagesMeasured?.(offsets)
        onFrameMetrics?.({
          offsets,
          pageWidth: pageWidthPx,
          pageHeight: pageHeightPx,
          margin,
        })

        if (isDev) {
          const duration = performance.now() - perfStart
          const message = `[Preview] Pagination ${duration > 120 ? 'exceeded' : 'completed in'} ${duration.toFixed(
            1
          )}ms`
          if (duration > 120) {
            console.warn(message)
          } else {
            console.log(message)
          }
        }
      } catch (error) {
        if (isDev) {
          console.error('[Preview] Pagination failed', error)
        }
      }
    }, WAIT_FOR_STYLES_MS)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [
    document,
    margin,
    onFrameMetrics,
    onPagesMeasured,
    pageHeightPx,
    pageInnerHeight,
    pageWidthPx,
  ])

  const firstPageColumns = (document.layout[0] ?? []) as SectionKey[][]

  return (
    <div className="artboard-root" style={{ backgroundColor: 'var(--artboard-color-background)' }}>
      <style dangerouslySetInnerHTML={{ __html: style }} />

      {/* Hidden FlowRoot for measurement */}
      <FlowRoot
        ref={flowRootRef}
        style={{
          position: 'absolute',
          inset: 0,
          visibility: 'hidden',
          pointerEvents: 'none',
          zIndex: -1,
        }}
      >
        <Template columns={measurementColumns} isFirstPage document={document} />
      </FlowRoot>

      {/* Render paginated clones */}
      {pages.length > 0 ? (
        pages.map((elements, pageIndex) => (
          <Page key={pageIndex} mode="preview" pageNumber={pageIndex + 1}>
            <div style={{ padding: `${margin}px` }}>
              {elements.map((el, elementIndex) => (
                <div key={elementIndex} dangerouslySetInnerHTML={{ __html: el.outerHTML }} />
              ))}
            </div>
          </Page>
        ))
      ) : (
        <Page mode="preview" pageNumber={1}>
          <div style={{ padding: `${margin}px` }}>
            <Template
              columns={firstPageColumns.length ? firstPageColumns : measurementColumns}
              isFirstPage
              document={document}
            />
          </div>
        </Page>
      )}
    </div>
  )
}
