'use client'

import * as React from 'react'
import { FileText, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface EmptyDocumentsProps {
  onCreateNew: () => void
}

export function EmptyDocuments({
  onCreateNew,
}: EmptyDocumentsProps): React.ReactElement {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-6">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-6">
        <FileText className="h-8 w-8 text-muted-foreground" />
      </div>

      <h3 className="text-xl font-semibold text-foreground mb-2">
        No documents yet
      </h3>

      <p className="text-muted-foreground text-center max-w-sm mb-8">
        Get started by creating your first resume. It only takes a minute to begin.
      </p>

      <Button onClick={onCreateNew} size="lg" className="gap-2">
        <Plus className="h-5 w-5" />
        Create Resume
      </Button>
    </div>
  )
}