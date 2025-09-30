'use client'

import * as React from 'react'
import { formatDistanceToNow } from 'date-fns'
import { FileText, MoreVertical, Pencil, Copy, Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/libs/utils'
import type { Resume } from '@/types/resume'

export interface DocumentCardProps {
  document: Resume
  onEdit: (documentId: string) => void
  onDuplicate: (documentId: string) => void
  onDelete: (documentId: string) => void
}

export function DocumentCard({
  document,
  onEdit,
  onDuplicate,
  onDelete,
}: DocumentCardProps): React.ReactElement {
  const lastEdited = React.useMemo(() => {
    try {
      return formatDistanceToNow(new Date(document.updated_at), { addSuffix: true })
    } catch {
      return 'Unknown'
    }
  }, [document.updated_at])

  const statusVariant = React.useMemo(() => {
    switch (document.status) {
      case 'active':
        return 'default'
      case 'draft':
        return 'secondary'
      case 'archived':
        return 'outline'
      default:
        return 'secondary'
    }
  }, [document.status])

  return (
    <Card
      className={cn(
        'group relative overflow-hidden',
        'bg-card hover:shadow-md',
        'transition-all duration-200',
        'border border-border rounded-lg',
        'cursor-pointer'
      )}
      onClick={() => onEdit(document.id)}
    >
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="p-2 bg-muted rounded-md shrink-0">
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg text-foreground truncate">
                {document.title}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Edited {lastEdited}
              </p>
            </div>
          </div>

          {/* Actions Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation()
                onEdit(document.id)
              }}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation()
                onDuplicate(document.id)
              }}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(document.id)
                }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2">
          <Badge variant={statusVariant} className="capitalize">
            {document.status}
          </Badge>
          <span className="text-xs text-muted-foreground">
            v{document.version}
          </span>
        </div>
      </div>
    </Card>
  )
}