'use client'

import * as React from 'react'
import { useFieldArray, useFormContext } from 'react-hook-form'
import { Plus, Pencil, Trash2, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { DndContext } from '@dnd-kit/core'
import { SortableContext, useSortable } from '@dnd-kit/sortable'

export interface ArrayFieldProps {
  name: string
  label: string
  emptyItem: any
  // eslint-disable-next-line no-unused-vars
  children: (index: number, fieldItem: any) => React.ReactNode
  // eslint-disable-next-line no-unused-vars
  renderSummary?: (fieldItem: any, index: number) => React.ReactNode
  maxItems?: number
}

export function ArrayField({
  name,
  label,
  emptyItem,
  children,
  renderSummary,
  maxItems = 20,
}: ArrayFieldProps): React.ReactElement {
  const { control } = useFormContext()
  const { fields, append, remove, move } = useFieldArray({ control, name })

  const [editingIndex, setEditingIndex] = React.useState<number | null>(null)
  const [dialogOpen, setDialogOpen] = React.useState(false)

  const openDialog = React.useCallback((index: number) => {
    setEditingIndex(index)
    setDialogOpen(true)
  }, [])

  const closeDialog = React.useCallback(() => {
    setDialogOpen(false)
    setEditingIndex(null)
  }, [])

  const handleAdd = () => {
    const nextIndex = fields.length
    append(emptyItem)
    requestAnimationFrame(() => openDialog(nextIndex))
  }

  const handleDragEnd = (event: { active: { id: string }; over: { id: string } | null }) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const fromIndex = fields.findIndex((item) => item.id === active.id)
    const toIndex = fields.findIndex((item) => item.id === over.id)
    if (fromIndex === -1 || toIndex === -1) return
    move(fromIndex, toIndex)
  }

  const currentField = editingIndex != null ? fields[editingIndex] : null

  const renderSummaryContent = React.useCallback(
    (field: any, index: number) => {
      if (renderSummary) return renderSummary(field, index)
      const fallback = typeof field === 'string' ? field : field?.name ?? `Item ${index + 1}`
      return <span className="text-sm text-muted-foreground">{fallback}</span>
    },
    [renderSummary]
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{label}</h3>
        {fields.length < maxItems && (
          <Button type="button" variant="outline" size="sm" onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Add {label}
          </Button>
        )}
      </div>

      {fields.length === 0 && (
        <Card className="p-6 text-center border-dashed">
          <p className="text-sm text-muted-foreground">No {label.toLowerCase()} added yet</p>
        </Card>
      )}

      {fields.length > 0 && (
        <DndContext onDragEnd={handleDragEnd}>
          <SortableContext items={fields.map((field) => field.id)}>
            <div className="space-y-3">
              {fields.map((field, index) => (
                <SortableCard
                  key={field.id}
                  id={field.id}
                  index={index}
                  onEdit={() => openDialog(index)}
                  onRemove={() => remove(index)}
                  summary={renderSummaryContent(field, index)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <Dialog open={dialogOpen} onOpenChange={(open) => (open ? setDialogOpen(true) : closeDialog())}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingIndex != null ? `Edit ${label.slice(0, -1)}` : `Edit ${label}`}</DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            {editingIndex != null && currentField ? children(editingIndex, currentField) : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeDialog}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

interface SortableCardProps {
  id: string
  index: number
  summary: React.ReactNode
  onEdit: () => void
  onRemove: () => void
}

function SortableCard({ id, index, summary, onEdit, onRemove }: SortableCardProps): React.ReactElement {
  const sortable = useSortable({ id })

  return (
    <div ref={sortable.setNodeRef}>
      <Card className={`flex items-center justify-between gap-4 p-4 ${sortable.isDragging ? 'opacity-60 ring-2 ring-primary/40' : ''}`}>
        <div className="flex items-start gap-3">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-md border bg-muted/40 text-muted-foreground"
            title="Drag to reorder"
            aria-label={`Drag item ${index + 1}`}
            {...sortable.attributes}
            {...sortable.listeners}
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <div className="space-y-1 text-left">
            <p className="text-xs uppercase text-muted-foreground">Item {index + 1}</p>
            <div className="text-sm text-foreground">{summary}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onEdit}>
            <Pencil className="mr-1 h-4 w-4" /> Edit
          </Button>
          <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={onRemove}>
            <Trash2 className="mr-1 h-4 w-4" /> Remove
          </Button>
        </div>
      </Card>
    </div>
  )
}
