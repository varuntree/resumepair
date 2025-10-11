'use client'

import * as React from 'react'
import { Loader2 } from 'lucide-react'
import { useUnifiedAIStore } from '@/stores/unifiedAIStore'
import { useShallow } from 'zustand/react/shallow'

export function UnifiedStreamOverlay(): React.ReactElement | null {
  const { docType, isStreaming } = useUnifiedAIStore(
    useShallow((s) => ({
      docType: s.docType,
      isStreaming: s.isStreaming,
    }))
  )

  if (!isStreaming || !docType) return null

  const label = docType === 'resume' ? 'Generating resume…' : 'Generating cover letter…'

  return (
    <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center bg-background/70 backdrop-blur-sm">
      <div className="pointer-events-auto flex items-center gap-3 rounded-md border bg-card px-4 py-3 shadow-lg">
        <Loader2 className="h-4 w-4 animate-spin text-lime-600" />
        <span className="text-sm font-medium">{label}</span>
      </div>
    </div>
  )
}
