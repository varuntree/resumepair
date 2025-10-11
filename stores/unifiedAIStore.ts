'use client'

import { create } from 'zustand'
import type { ResumeJson } from '@/types/resume'
import type { CoverLetterJson } from '@/types/cover-letter'
import type { ResumeGenerationUsage } from '@/libs/ai/resumeGenerator'

export type UnifiedDocType = 'resume' | 'cover-letter'

interface StartArgs {
  docType: UnifiedDocType
  text?: string
  personalInfo?: Record<string, unknown>
  file?: File | null
  editorData?: unknown
}

interface UnifiedCore {
  docType: UnifiedDocType | null
  isStreaming: boolean
  progress: number
  final: ResumeJson | CoverLetterJson | null
  warnings: string[]
  usage: ResumeGenerationUsage | null
  error: string | null
  abortController: AbortController | null
  traceId: string | null
  start: (args: StartArgs) => Promise<void>
  cancel: () => void
  reset: () => void
}

async function fileToBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  const chunkSize = 8192
  let binary = ''
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize)
    // Avoid spread on typed arrays for compatibility with downlevel targets
    let chunkStr = ''
    for (let j = 0; j < chunk.length; j++) {
      chunkStr += String.fromCharCode(chunk[j])
    }
    binary += chunkStr
  }
  return btoa(binary)
}

export const useUnifiedAIStore = create<UnifiedCore>((set, get) => ({
  docType: null,
  isStreaming: false,
  progress: 0,
  final: null,
  warnings: [],
  usage: null,
  error: null,
  abortController: null,
  traceId: null,

  async start({ docType, text, personalInfo, file, editorData }) {
    if (get().isStreaming) {
      get().cancel()
    }

    let fileData: string | undefined
    let mimeType: string | undefined

    if (file) {
      if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
        set({ error: 'Please upload a PDF file' })
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        set({ error: 'PDF must be under 10MB' })
        return
      }
      fileData = await fileToBase64(file)
      mimeType = 'application/pdf'
    }

    const abortController = new AbortController()

    set({
      docType,
      isStreaming: true,
      progress: 0,
      final: null,
      warnings: [],
      usage: null,
      error: null,
      abortController,
      traceId: null,
    })

    try {
      const response = await fetch('/api/v1/ai/unified', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          docType,
          text: text?.trim() ? text.trim() : undefined,
          personalInfo,
          fileData,
          mimeType,
          editorData,
        }),
        signal: abortController.signal,
      })

      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        const message = (payload && (payload.error || payload.message)) || `Request failed (${response.status})`
        throw new Error(message)
      }

      set({
        isStreaming: false,
        progress: 1,
        final: payload.data ?? null,
        warnings: payload.warnings ?? [],
        usage: payload.usage ?? null,
        traceId: payload.traceId ?? null,
        abortController: null,
        error: null,
      })
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        set({
          isStreaming: false,
          progress: 0,
          abortController: null,
          error: 'Generation cancelled',
        })
        return
      }

      set({
        isStreaming: false,
        progress: 0,
        abortController: null,
        error: (error as Error).message,
      })
    }
  },

  cancel() {
    const controller = get().abortController
    if (controller) controller.abort()
    set({ isStreaming: false, abortController: null })
  },

  reset() {
    set({
      docType: null,
      isStreaming: false,
      progress: 0,
      final: null,
      warnings: [],
      usage: null,
      error: null,
      abortController: null,
      traceId: null,
    })
  },
}))
