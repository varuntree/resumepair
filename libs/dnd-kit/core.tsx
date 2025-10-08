'use client'

import * as React from 'react'

type ActiveDrag = {
  id: string | null
}

type DragEndEvent = {
  active: { id: string }
  over: { id: string } | null
}

type DndContextValue = {
  active: ActiveDrag
  setActive: (id: string | null) => void
  onDragEnd?: (event: DragEndEvent) => void
}

const Context = React.createContext<DndContextValue | null>(null)

export interface DndContextProps {
  children: React.ReactNode
  onDragEnd?: (event: DragEndEvent) => void
}

export function DndContext({ children, onDragEnd }: DndContextProps): React.ReactElement {
  const [activeId, setActiveId] = React.useState<string | null>(null)

  const value = React.useMemo<DndContextValue>(
    () => ({
      active: { id: activeId },
      setActive: setActiveId,
      onDragEnd,
    }),
    [activeId, onDragEnd]
  )

  return <Context.Provider value={value}>{children}</Context.Provider>
}

export function useDndContext(): DndContextValue {
  const ctx = React.useContext(Context)
  if (!ctx) {
    throw new Error('useDndContext must be used within a DndContext')
  }
  return ctx
}

export type DragOverlayProps = {
  children: React.ReactNode
}

// Placeholder to mimic @dnd-kit/core API where DragOverlay is optional.
export function DragOverlay({ children }: DragOverlayProps): React.ReactElement {
  return <>{children}</>
}

export type { DragEndEvent }
