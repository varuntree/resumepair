'use client'

import * as React from 'react'
import { useDndContext } from './core'

export interface SortableContextProps {
  items: Array<string>
  children: React.ReactNode
}

const SortableContextInner = React.createContext<{ items: Array<string> }>({ items: [] })

export function SortableContext({ items, children }: SortableContextProps): React.ReactElement {
  const memo = React.useMemo(() => ({ items }), [items])
  return <SortableContextInner.Provider value={memo}>{children}</SortableContextInner.Provider>
}

export interface UseSortableArgs {
  id: string
}

export function useSortable({ id }: UseSortableArgs) {
  const { active, setActive, onDragEnd } = useDndContext()
  const { items } = React.useContext(SortableContextInner)
  const nodeRef = React.useRef<HTMLElement | null>(null)

  const attributes = React.useMemo(
    () => ({
      draggable: true,
      role: 'button',
      tabIndex: 0,
      'data-sortable-id': id,
    }),
    [id]
  )

  const handleDragStart = React.useCallback(
    (event: React.DragEvent) => {
      event.dataTransfer?.setData('text/plain', id)
      setActive(id)
    },
    [id, setActive]
  )

  const handleDragOver = React.useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer!.dropEffect = 'move'
  }, [])

  const handleDrop = React.useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      const activeId = active.id
      if (!activeId) {
        setActive(null)
        return
      }
      if (activeId !== id) {
        onDragEnd?.({ active: { id: activeId }, over: { id } })
      }
      setActive(null)
    },
    [active.id, id, onDragEnd, setActive]
  )

  const handleDragEnd = React.useCallback(() => {
    setActive(null)
  }, [setActive])

  const listeners = {
    onDragStart: handleDragStart,
    onDragOver: handleDragOver,
    onDrop: handleDrop,
    onDragEnd: handleDragEnd,
  }

  const setNodeRef = (node: HTMLElement | null) => {
    nodeRef.current = node
  }

  return {
    attributes,
    listeners,
    setNodeRef,
    transform: null,
    transition: undefined,
    isDragging: active.id === id,
    activeIndex: active.id ? items.indexOf(active.id) : -1,
  }
}

export function arrayMove<T>(array: T[], from: number, to: number): T[] {
  if (from === to) return array.slice()
  const result = array.slice()
  const [item] = result.splice(from, 1)
  result.splice(to, 0, item)
  return result
}
