/* eslint-disable no-unused-vars */
'use client'

import * as React from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'

export interface DocumentFiltersProps {
  status: 'all' | 'draft' | 'active' | 'archived'
  onStatusChange: (value: 'all' | 'draft' | 'active' | 'archived') => void
}

export function DocumentFilters({
  status,
  onStatusChange,
}: DocumentFiltersProps): React.ReactElement {
  return (
    <div className="flex items-center gap-2">
      <Label htmlFor="status-filter" className="text-sm text-muted-foreground whitespace-nowrap">
        Status:
      </Label>
      <Select value={status} onValueChange={onStatusChange}>
        <SelectTrigger id="status-filter" className="w-[140px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="draft">Draft</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="archived">Archived</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
