/**
 * Unified AI Store
 *
 * Client-side SSE state for unified AI generation/import across doc types.
 */

'use client'

import { create } from 'zustand'
import type { ResumeJson } from '@/types/resume'
import type { CoverLetterJson } from '@/types/cover-letter'

export type UnifiedDocType = 'resume' | 'cover-letter'

type UnifiedIdle = {
  docType: null
  partial: null
  final: null
}

type UnifiedResume = {
  docType: 'resume'
  partial: ResumeJson | null
  final: ResumeJson | null
}

type UnifiedCover = {
  docType: 'cover-letter'
  partial: CoverLetterJson | null
  final: CoverLetterJson | null
}

type StartArgs = {
  docType: UnifiedDocType
  text?: string
  personalInfo?: any
  file?: File | null
  editorData?: any
}

type UnifiedCore = {
  isStreaming: boolean
  progress: number
  error: string | null
  abortController: AbortController | null
  start: (args: StartArgs) => Promise<void>
  cancel: () => void
  reset: () => void
}

export type UnifiedState = (UnifiedIdle | UnifiedResume | UnifiedCover) & UnifiedCore

export const useUnifiedAIStore = create<UnifiedState>((set, get) => ({
  docType: null,
  isStreaming: false,
  progress: 0,
  partial: null,
  final: null,
  error: null,
  abortController: null,

  async start({ docType, text, personalInfo, file, editorData }) {
    // Encode file if present
    let base64: string | undefined
    if (file) {
      if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
        set({ error: 'Please upload a PDF file' })
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        set({ error: 'PDF must be under 10MB' })
        return
      }
      const buf = await file.arrayBuffer()
      const bytes = Array.from(new Uint8Array(buf))
      base64 = btoa(String.fromCharCode(...bytes))
    }

    const abortController = new AbortController()
    set({ docType, isStreaming: true, progress: 0, partial: null, final: null, error: null, abortController })

    try {
      const res = await fetch('/api/v1/ai/unified', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          docType,
          text: text?.trim() ? text : undefined,
          personalInfo,
          fileData: base64,
          fileName: file?.name,
          mimeType: base64 ? 'application/pdf' : undefined,
          editorData,
        }),
        signal: abortController.signal,
      })

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}))
        throw new Error(payload.message || `HTTP ${res.status}`)
      }

      if (!res.body) throw new Error('Empty response body')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''
        for (const line of lines) {
          if (!line.trim()) continue
          if (line.startsWith('event: ')) continue
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              switch (data.type) {
                case 'progress':
                  set({ progress: Math.round((data.progress || 0) * 100) })
                  break
                case 'update':
                  if (docType === 'resume') {
                    set({ partial: data.data as ResumeJson } as any)
                  } else {
                    set({ partial: data.data as CoverLetterJson } as any)
                  }
                  break
                case 'complete':
                  if (docType === 'resume') {
                    set({ final: data.data as ResumeJson, partial: data.data as ResumeJson, isStreaming: false, progress: 100 } as any)
                  } else {
                    set({ final: data.data as CoverLetterJson, partial: data.data as CoverLetterJson, isStreaming: false, progress: 100 } as any)
                  }
                  break
                case 'error':
                  set({ error: data.message || 'Generation failed', isStreaming: false })
                  break
              }
            } catch (e) {
              console.warn('[UnifiedAI] parse error', e)
            }
          }
        }
      }

      set({ isStreaming: false, abortController: null })
    } catch (err) {
      if ((err as any)?.name === 'AbortError') return
      set({ error: err instanceof Error ? err.message : 'Request failed', isStreaming: false, abortController: null })
    }
  },

  cancel() {
    const ac = get().abortController
    if (ac) ac.abort()
    set({ isStreaming: false, progress: 0, abortController: null })
  },

  reset() {
    set({ docType: null, isStreaming: false, progress: 0, partial: null, final: null, error: null, abortController: null })
  },
}))
