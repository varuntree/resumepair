/* eslint-disable no-unused-vars */
'use client'

import * as React from 'react'
import { useFieldArray, useFormContext } from 'react-hook-form'
import { Plus, Trash2, GripVertical, ArrowUp, ArrowDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export interface ArrayFieldProps {
  name: string
  label: string
  emptyItem: any
  children: (itemIndex: number, fieldItem: any) => React.ReactNode
  maxItems?: number
}

export function ArrayField({
  name,
  label,
  emptyItem,
  children,
  maxItems = 20,
}: ArrayFieldProps): React.ReactElement {
  const { control } = useFormContext()
  const { fields, append, remove, move } = useFieldArray({
    control,
    name,
  })

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (index > 0) move(index, index - 1)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (index < fields.length - 1) move(index, index + 1)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{label}</h3>
        {fields.length < maxItems && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append(emptyItem)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add {label}
          </Button>
        )}
      </div>

      {fields.length === 0 && (
        <Card className="p-6 text-center border-dashed">
          <p className="text-sm text-muted-foreground">
            No {label.toLowerCase()} added yet
          </p>
        </Card>
      )}

      <div className="space-y-4">
        {fields.map((field, index) => (
          <Card key={field.id} className="p-6">
            <div className="flex items-start gap-4">
              {/* Handle column: index + up/down controls + keyboard support */}
              <div
                className="flex flex-col items-center gap-1 pt-1 select-none"
                role="button"
                tabIndex={0}
                aria-label={`Reorder item ${index + 1}`}
                onKeyDown={(e) => handleKeyDown(e, index)}
                title="Use ↑/↓ to reorder"
              >
                <div className="flex items-center gap-2">
                  <GripVertical className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">
                    {index + 1}
                  </span>
                </div>
                <div className="flex flex-col items-center gap-1 mt-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => move(index, Math.max(index - 1, 0))}
                    disabled={index === 0}
                    aria-label="Move up"
                    title="Move up"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => move(index, Math.min(index + 1, fields.length - 1))}
                    disabled={index === fields.length - 1}
                    aria-label="Move down"
                    title="Move down"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex-1 space-y-4">
                {children(index, field)}
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => remove(index)}
                className="text-destructive hover:text-destructive shrink-0 mt-1"
                >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
