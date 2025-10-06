/**
 * Unified Stream Overlay
 */

'use client'

import * as React from 'react'
import { useUnifiedAIStore } from '@/stores/unifiedAIStore'
import { useShallow } from 'zustand/react/shallow'
import GenerationPreview from '@/components/ai/GenerationPreview'

export function UnifiedStreamOverlay(): React.ReactElement | null {
  const { docType, isStreaming, partial, final } = useUnifiedAIStore(
    useShallow((s: any) => ({
      docType: s.docType,
      isStreaming: s.isStreaming,
      partial: s.partial,
      final: s.final,
    }))
  )

  const data = final || partial
  if (!isStreaming && !data) return null

  // Style as overlay to sit above existing preview
  return (
    <div className="absolute inset-0 z-40 bg-background/60 backdrop-blur-sm pointer-events-none will-change-transform">
      <div className="h-full p-4 pointer-events-auto">
        {docType === 'resume' ? (
          <GenerationPreview resume={data} isGenerating={isStreaming} template="default" />
        ) : (
          <div className="h-full overflow-auto rounded-lg border bg-card p-6">
            <h2 className="mb-2 text-lg font-semibold">Cover Letter (Streaming)</h2>
            {data?.from && (
              <p className="text-sm text-muted-foreground">From: {data.from.fullName || ''} • {data.from.email || ''}</p>
            )}
            {data?.to && (
              <p className="text-sm text-muted-foreground">To: {data.to.companyName || ''}</p>
            )}
            {data?.salutation && <p className="mt-4 text-sm">{data.salutation}</p>}
            {Array.isArray(data?.body) && (
              <div className="mt-4 space-y-3">
                {data.body.slice(0, 6).map((blk: any, i: number) => (
                  <p key={i} className="text-sm text-muted-foreground">{blk?.content?.map((r: any) => r.text).join(' ')}</p>
                ))}
              </div>
            )}
            {data?.closing && <p className="mt-6 text-sm">{data.closing}</p>}
            {isStreaming && (
              <div className="mt-6 text-center">
                <div className="inline-block h-1 w-24 animate-pulse rounded-full bg-lime-600" />
                <p className="mt-2 text-xs text-muted-foreground">Generating…</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
