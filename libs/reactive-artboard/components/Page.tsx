'use client'

import { cn } from '../utils'
import { useArtboardStore } from '../store/artboard'
import {
  DEFAULT_PAGE_FORMAT,
  MM_TO_PX,
  PAGE_SIZE_MM,
  normalizePageFormat,
  type PageFormat,
} from '../constants/page'

type PageProps = {
  mode?: 'preview' | 'builder'
  pageNumber: number
  children: React.ReactNode
}

export function Page({ mode = 'preview', pageNumber, children }: PageProps) {
  const page = useArtboardStore((state) => state.resume.metadata.page)
  const format = normalizePageFormat(page.format)
  const size = PAGE_SIZE_MM[format]

  return (
    <div
      data-page={pageNumber}
      className={cn('relative bg-background text-foreground', mode === 'builder' && 'shadow-2xl')}
      style={{
        width: `${size.width * MM_TO_PX}px`,
        minHeight: `${size.height * MM_TO_PX}px`,
        height: `${size.height * MM_TO_PX}px`,
        maxHeight: `${size.height * MM_TO_PX}px`,
        overflow: 'hidden',
        backgroundColor: 'var(--artboard-color-background)',
        color: 'var(--artboard-color-text)',
      }}
    >
      {mode === 'builder' && page.options.pageNumbers && (
        <div className="absolute -top-7 left-0 font-bold">Page {pageNumber}</div>
      )}
      {children}
      {mode === 'builder' && page.options.breakLine && (
        <div
          className="absolute inset-x-0 border-b border-dashed"
          style={{ top: `${size.height * MM_TO_PX}px` }}
        />
      )}
    </div>
  )
}

export { MM_TO_PX, PAGE_SIZE_MM }
