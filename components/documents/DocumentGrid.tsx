/* eslint-disable no-unused-vars */
'use client'

import * as React from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { DocumentCard } from './DocumentCard'
import type { Resume } from '@/types/resume'

export interface DocumentGridProps {
  documents: Resume[]
  loading?: boolean
  onEdit: (value: string) => void
  onDuplicate: (value: string) => void
  onDelete: (value: string) => void
}

export function DocumentGrid({
  documents,
  loading = false,
  onEdit,
  onDuplicate,
  onDelete,
}: DocumentGridProps): React.ReactElement {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <DocumentGridSkeleton key={i} />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {documents.map((doc) => (
        <DocumentCard
          key={doc.id}
          document={doc}
          onEdit={onEdit}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}

function DocumentGridSkeleton(): React.ReactElement {
  return (
    <div className="border border-border rounded-lg p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <Skeleton className="h-9 w-9 rounded-md" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      </div>
      <Skeleton className="h-6 w-16" />
    </div>
  )
}
