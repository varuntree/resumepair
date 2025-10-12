/* eslint-disable react/no-danger */
'use client'

import * as React from 'react'
import { ArtboardDocument } from '../types'
import type { SectionKey } from '../schema'
import { buildArtboardStyles } from '../styles'
import { Page, MM_TO_PX, PAGE_SIZE_MM } from '../components/Page'
import { PREVIEW_PAGE_GAP_PX } from '../constants/page'
import { getTemplateRenderer } from '../templates'
import { paginate } from '../pagination/paginate'
import { measureFlowItems } from '../pagination/measure'
import { FlowSlice, PaginatedPage, PaginationResult } from '../pagination/blockTypes'

type PaginatedArtboardRendererProps = {
  document: ArtboardDocument
  onPagination?: (result: PaginationResult) => void
}

const FLOW_ROOT_STYLE: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  visibility: 'hidden',
  pointerEvents: 'none',
  overflow: 'visible',
  zIndex: -1,
}

const DATA_SUBITEM_SELECTOR = '[data-flow-subitem]'

const cloneWholeElement = (slice: FlowSlice & { type: 'whole' }): HTMLElement => {
  const clone = slice.item.element.cloneNode(true) as HTMLElement
  return clone
}

const cloneRange = (slice: FlowSlice & { type: 'subslice' }): HTMLElement => {
  const original = slice.item.element
  const totalSubItems = original.querySelectorAll(DATA_SUBITEM_SELECTOR).length
  const clone = original.cloneNode(true) as HTMLElement
  const subItems = Array.from(clone.querySelectorAll<HTMLElement>(DATA_SUBITEM_SELECTOR))
  subItems.forEach((subItem, index) => {
    if (index < slice.from || index >= slice.to) {
      subItem.remove()
    }
  })
  if (slice.from > 0) {
    clone.style.marginTop = '0px'
  }
  if (slice.to < totalSubItems) {
    clone.style.marginBottom = '0px'
  }
  return clone
}

const pageToHtml = (page: PaginatedPage, documentNode: Document): string => {
  const tmp = documentNode.createElement('div')
  page.slices.forEach((slice) => {
    const node =
      slice.type === 'whole'
        ? cloneWholeElement(slice)
        : cloneRange(slice)
    tmp.appendChild(node)
  })
  return tmp.innerHTML
}

export function PaginatedArtboardRenderer({
  document,
  onPagination,
}: PaginatedArtboardRendererProps): React.ReactElement {
  const Template = React.useMemo(() => getTemplateRenderer(document.template), [document.template])
  const style = React.useMemo(() => buildArtboardStyles(document.metadata), [document.metadata])
  const flowRootRef = React.useRef<HTMLDivElement | null>(null)
  const [pageHtml, setPageHtml] = React.useState<string[]>([])

  const pageMetrics = React.useMemo(() => {
    const format = document.metadata.page.format
    const size = PAGE_SIZE_MM[format] ?? PAGE_SIZE_MM.letter
    const pageWidthPx = size.width * MM_TO_PX
    const pageHeightPx = size.height * MM_TO_PX
    const margin = document.metadata.page.margin ?? 0
    const innerHeight = Math.max(pageHeightPx - margin * 2, 0)
    return {
      format,
      pageWidthPx,
      pageHeightPx,
      margin,
      innerHeight,
    }
  }, [document.metadata.page])

  React.useLayoutEffect(() => {
    const flowRoot = flowRootRef.current
    if (!flowRoot) return undefined

    const items = measureFlowItems(flowRoot)
    if (items.length === 0) {
      setPageHtml([])
      onPagination?.({ pages: [], totalHeight: 0 })
      return undefined
    }

    const result = paginate(items, {
      pageInnerHeight: pageMetrics.innerHeight,
    })

    const html = result.pages.map((page) => pageToHtml(page, flowRoot.ownerDocument))
    setPageHtml(html)
    onPagination?.(result)

    return () => {
      setPageHtml([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [document, pageMetrics.innerHeight])

  return (
    <div
      className="artboard-root"
      style={{
        backgroundColor: 'transparent',
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: style }} />
      <div ref={flowRootRef} style={FLOW_ROOT_STYLE}>
        <Template
          columns={(document.layout?.[0] ?? []) as SectionKey[][]}
          document={document}
          isFirstPage
        />
      </div>
      <div
        className="artboard-page-stack flex w-full flex-col items-center"
        style={{
          gap: `${PREVIEW_PAGE_GAP_PX}px`,
          paddingBottom: `${PREVIEW_PAGE_GAP_PX}px`,
        }}
      >
        {pageHtml.length === 0 ? (
          <Page mode="preview" pageNumber={1}>
            <div
              className="artboard-page"
              style={{ padding: `${pageMetrics.margin}px` }}
            />
          </Page>
        ) : (
          pageHtml.map((html, index) => (
            <Page key={`page-${index + 1}`} mode="preview" pageNumber={index + 1}>
              <div
                className="artboard-page"
                style={{ padding: `${pageMetrics.margin}px` }}
                dangerouslySetInnerHTML={{ __html: html }}
              />
            </Page>
          ))
        )}
      </div>
    </div>
  )
}
