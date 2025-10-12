'use client'

import { sanitize, cn, isEmptyString } from '../utils'
import { useMemo } from 'react'
import type { ResumeData, SectionWithItem, CustomSectionGroup } from '../schema'

export type SectionProps<T> = {
  section: SectionWithItem<T> | CustomSectionGroup | ResumeData['sections']['summary']
  children?: (item: T) => React.ReactNode
  className?: string
  headingClassName?: string
  contentClassName?: string
}

export function Section<T>({
  section,
  children,
  className,
  headingClassName,
  contentClassName,
}: SectionProps<T>) {
  if (!section.visible) return null

  const hasItems = 'items' in section
  const items = hasItems
    ? (section.items as unknown as Array<T & { visible?: boolean }>).filter(
        (item) => (item as any)?.visible !== false
      )
    : []

  const hasContent = 'content' in section
  const content = hasContent ? (section as ResumeData['sections']['summary']).content : ''
  const sanitized = useMemo(() => (hasContent && !isEmptyString(content) ? sanitize(content) : ''), [content, hasContent])

  if (!hasContent && hasItems && items.length === 0) {
    return null
  }
  if (hasContent && isEmptyString(content) && items.length === 0) {
    return null
  }

  const splittable = hasItems && items.length > 0

  return (
    <section
      id={(section as any).id}
      className={className}
      data-flow-item="true"
      data-flow-splittable={splittable ? 'true' : 'false'}
    >
      <h4 className={cn('font-bold text-primary', headingClassName)}>{(section as any).name}</h4>
      {hasContent && !isEmptyString(content) && (
        <div
          className={cn('wysiwyg', contentClassName)}
          dangerouslySetInnerHTML={{ __html: sanitized }}
        />
      )}
      {hasItems && children && (
        <div>
          {items.map((item, index) => (
            <div key={index} data-flow-subitem="true" data-flow-subitem-index={index}>
              {children(item)}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
