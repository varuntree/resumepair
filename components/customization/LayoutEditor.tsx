'use client'

import * as React from 'react'
import { DndContext, type DragEndEvent, useDndContext } from '@/libs/dnd-kit/core'
import { SortableContext, useSortable } from '@/libs/dnd-kit/sortable'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useDocumentStore } from '@/stores/documentStore'
import { createDefaultLayout, createDefaultAppearance } from '@/types/resume'
import { normalizeResumeData } from '@/libs/repositories/normalizers'
import { cn } from '@/libs/utils'

const SECTION_LABELS: Record<string, string> = {
  summary: 'Summary',
  experience: 'Experience',
  education: 'Education',
  projects: 'Projects',
  volunteer: 'Volunteer',
  references: 'References',
  publications: 'Publications',
  awards: 'Awards',
  certifications: 'Certifications',
  skills: 'Skills',
  languages: 'Languages',
  profiles: 'Profiles',
  interests: 'Interests',
}

const createItemId = (page: number, column: number, index: number, section: string) =>
  `item-${page}-${column}-${index}-${section}`

const createPlaceholderId = (page: number, column: number) => `placeholder-${page}-${column}`

type ParsedId = {
  page: number
  column: number
  index: number
  sectionId: string
  isPlaceholder: boolean
}

function parseItemId(id: string): ParsedId {
  if (id.startsWith('placeholder-')) {
    const [, page, column] = id.split('-')
    return {
      page: Number(page),
      column: Number(column),
      index: -1,
      sectionId: '',
      isPlaceholder: true,
    }
  }

  const [, page, column, index, ...rest] = id.split('-')
  return {
    page: Number(page),
    column: Number(column),
    index: Number(index),
    sectionId: rest.join('-'),
    isPlaceholder: false,
  }
}

const cloneLayout = (layout: string[][][]): string[][][] =>
  layout.map((columns) => columns.map((sections) => sections.slice()))

const getSectionLabel = (sectionId: string): string => {
  if (sectionId.startsWith('custom.')) {
    return 'Custom Section'
  }
  return SECTION_LABELS[sectionId] ?? sectionId
}

interface LayoutEditorProps {
  disabled?: boolean
}

export function LayoutEditor({ disabled }: LayoutEditorProps) {
  const document = useDocumentStore((state) => state.document)
  const updateDocument = useDocumentStore((state) => state.updateDocument)

  const currentLayout = React.useMemo(() => {
    if (!document) return createDefaultLayout()
    try {
      const normalized = normalizeResumeData(document)
      const layout = normalized.appearance?.layout
      return Array.isArray(layout) && layout.length ? (layout as string[][][]) : createDefaultLayout()
    } catch {
      return createDefaultLayout()
    }
  }, [document])

  const [localLayout, setLocalLayout] = React.useState<string[][][]>(cloneLayout(currentLayout))

  React.useEffect(() => {
    setLocalLayout(cloneLayout(currentLayout))
  }, [currentLayout])

  const commitLayout = React.useCallback(
    (next: string[][][]) => {
      if (!document) return
      const baseAppearance =
        document.appearance ?? createDefaultAppearance(document.settings?.pageSize ?? 'Letter')
      const nextAppearance = {
        ...baseAppearance,
        layout: next,
      }
      updateDocument({ appearance: nextAppearance as typeof document.appearance })
    },
    [document, updateDocument]
  )

  const handleDragEnd = React.useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return

      const source = parseItemId(active.id as string)
      const destination = parseItemId(over.id as string)
      if (destination.isPlaceholder && source.page === destination.page && source.column === destination.column) {
        destination.index = localLayout[source.page][source.column].length
      }

      const next = cloneLayout(localLayout)
      const sourceColumn = next[source.page]?.[source.column]
      if (!sourceColumn) return

      const [movingSection] = sourceColumn.splice(source.index, 1)
      if (!movingSection) return

      let targetColumn = next[destination.page]?.[destination.column]
      if (!targetColumn) {
        targetColumn = []
        if (!next[destination.page]) {
          next[destination.page] = []
        }
        next[destination.page][destination.column] = targetColumn
      }

      let insertIndex = destination.index
      if (destination.isPlaceholder || insertIndex === -1) {
        targetColumn.push(movingSection)
      } else {
        if (source.page === destination.page && source.column === destination.column && source.index < destination.index) {
          insertIndex = Math.max(0, insertIndex - 1)
        }
        targetColumn.splice(insertIndex, 0, movingSection)
      }

      setLocalLayout(next)
      commitLayout(next)
    },
    [commitLayout, localLayout]
  )

  const handleAddPage = () => {
    const next = cloneLayout(localLayout)
    next.push([[], []])
    setLocalLayout(next)
    commitLayout(next)
  }

  const handleRemovePage = (pageIndex: number) => {
    if (localLayout.length <= 1) return
    const next = cloneLayout(localLayout)
    const removed = next.splice(pageIndex, 1)[0]
    if (removed) {
      const targetIndex = pageIndex > 0 ? pageIndex - 1 : 0
      const targetColumn = next[targetIndex]?.[0]
      if (targetColumn) {
        targetColumn.push(...removed[0], ...removed[1])
      }
    }
    setLocalLayout(next)
    commitLayout(next)
  }

  const handleReset = () => {
    const defaults = createDefaultLayout()
    setLocalLayout(cloneLayout(defaults))
    commitLayout(defaults)
  }

  const isReadOnly = disabled || !document

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-gray-900">Page Layout</div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={handleReset} disabled={isReadOnly}>
            Reset
          </Button>
          <Button type="button" variant="default" size="sm" onClick={handleAddPage} disabled={isReadOnly}>
            Add Page
          </Button>
        </div>
      </div>

      <DndContext onDragEnd={handleDragEnd}>
        <div className="space-y-4">
          {localLayout.map((columns, pageIndex) => (
             <div key={pageIndex} className="rounded-lg border border-gray-200 bg-white">
               <div className="flex items-center justify-between border-b px-4 py-2">
                 <div className="text-sm font-semibold text-gray-900">Page {pageIndex + 1}</div>
                 {localLayout.length > 1 && (
                   <Button
                     type="button"
                     variant="ghost"
                     size="sm"
                     className="text-red-500 hover:text-red-600"
                     onClick={() => handleRemovePage(pageIndex)}
                     disabled={isReadOnly}
                   >
                     Remove
                   </Button>
                 )}
               </div>
               <div className="grid gap-4 px-4 py-4 md:grid-cols-2">
                 {columns.map((sections, columnIndex) => (
                   <SortableColumn
                     key={`${pageIndex}-${columnIndex}`}
                     pageIndex={pageIndex}
                     columnIndex={columnIndex}
                     sections={sections}
                     disabled={isReadOnly}
                   />
                 ))}
               </div>
             </div>
          ))}
        </div>
      </DndContext>
    </div>
  )
}

interface SortableColumnProps {
  pageIndex: number
  columnIndex: number
  sections: string[]
  disabled: boolean
}

function SortableColumn({ pageIndex, columnIndex, sections, disabled }: SortableColumnProps) {
  const items = sections.length
    ? sections.map((sectionId, index) => createItemId(pageIndex, columnIndex, index, sectionId))
    : [createPlaceholderId(pageIndex, columnIndex)]

  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        Column {columnIndex + 1}
      </div>
      <div
        className={cn(
          'space-y-2 rounded-lg border border-dashed border-gray-200 bg-gray-50 p-3 transition',
          disabled && 'pointer-events-none opacity-60'
        )}
      >
        <SortableContext items={items}>
          {items.map((itemId) =>
            itemId.startsWith('placeholder-') ? (
              <DropZone key={itemId} id={itemId} disabled={disabled} />
            ) : (
              <SortableItem key={itemId} id={itemId} sectionId={parseItemId(itemId).sectionId} />
            )
          )}
        </SortableContext>
      </div>
    </div>
  )
}

interface SortableItemProps {
  id: string
  sectionId: string
}

function SortableItem({ id, sectionId }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useSortable({ id })
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn(
        'flex items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm transition',
        isDragging && 'border-primary bg-primary/10 text-primary'
      )}
    >
      <span>{getSectionLabel(sectionId)}</span>
      <Badge variant="outline" className="text-xs uppercase tracking-wide">
        {sectionId.startsWith('custom.') ? 'Custom' : sectionId}
      </Badge>
    </div>
  )
}

interface DropZoneProps {
  id: string
  disabled: boolean
}

function DropZone({ id, disabled }: DropZoneProps) {
  const { active, setActive, onDragEnd } = useDndContext()

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    if (!active.id || disabled) return
    onDragEnd?.({ active: { id: active.id }, over: { id } })
    setActive(null)
  }

  return (
    <div
      data-placeholder-id={id}
      onDragOver={(event) => event.preventDefault()}
      onDrop={handleDrop}
      className={cn(
        'flex h-12 items-center justify-center rounded-md border border-dashed border-gray-300 bg-white text-xs text-gray-500 transition',
        disabled && 'pointer-events-none opacity-60'
      )}
    >
      Drop section here
    </div>
  )
}
