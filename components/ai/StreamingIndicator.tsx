'use client'

import { Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface StreamingIndicatorProps {
  isGenerating: boolean
  onCancel: () => void
  label?: string
}

export default function StreamingIndicator({ isGenerating, onCancel, label }: StreamingIndicatorProps) {
  if (!isGenerating) return null

  return (
    <div className="fixed top-4 right-4 z-50 w-72 rounded-lg border bg-card p-4 shadow-lg">
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-lime-600" />
          <span className="text-sm font-medium">{label ?? 'Generating...'}</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="-mt-1 -mr-1 h-6 w-6"
          onClick={onCancel}
          aria-label="Cancel generation"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Sit tight while we finish this request. You can continue working elsewhere in the editor.
      </p>
    </div>
  )
}
