/* eslint-disable no-unused-vars */
'use client'

import * as React from 'react'
import { ArrowUpDown } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

export interface DocumentSortProps {
  sort: 'updated_at' | 'created_at' | 'title'
  order: 'asc' | 'desc'
  onSortChange: (value: 'updated_at' | 'created_at' | 'title') => void
  onOrderChange: () => void
}

export function DocumentSort({
  sort,
  order,
  onSortChange,
  onOrderChange,
}: DocumentSortProps): React.ReactElement {
  return (
    <div className="flex items-center gap-2">
      <Label htmlFor="sort-by" className="text-sm text-muted-foreground whitespace-nowrap">
        Sort by:
      </Label>
      <Select value={sort} onValueChange={onSortChange}>
        <SelectTrigger id="sort-by" className="w-[140px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="updated_at">Last Updated</SelectItem>
          <SelectItem value="created_at">Created Date</SelectItem>
          <SelectItem value="title">Title</SelectItem>
        </SelectContent>
      </Select>
      <Button
        variant="outline"
        size="sm"
        onClick={onOrderChange}
        className="h-9 px-3"
      >
        <ArrowUpDown className="h-4 w-4" />
        <span className="sr-only">Toggle sort order</span>
      </Button>
    </div>
  )
}
