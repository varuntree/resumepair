'use client'

import { cn } from '../utils'
import { useArtboardStore } from '../store/artboard'

const MM_TO_PX = 3.78

const pageSizeMap = {
  a4: { width: 210, height: 297 },
  letter: { width: 215.9, height: 279.4 },
}

type PageProps = {
  mode?: 'preview' | 'builder'
  pageNumber: number
  children: React.ReactNode
}

export function Page({ mode = 'preview', pageNumber, children }: PageProps) {
  const page = useArtboardStore((state) => state.resume.metadata.page)
  const format = page.format in pageSizeMap ? page.format : 'a4'
  const size = pageSizeMap[format as keyof typeof pageSizeMap]

  return (
    <div
      data-page={pageNumber}
      className={cn('relative bg-background text-foreground', mode === 'builder' && 'shadow-2xl')}
      style={{
        width: `${size.width * MM_TO_PX}px`,
        minHeight: `${size.height * MM_TO_PX}px`,
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

export { MM_TO_PX }
