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

// TEMP DEBUG LOGGING (remove after investigation)
const DEBUG_AI_CLIENT = true
const CLIENT_LOG_PREFIX = '[UnifiedAIStore]'

function debugLog(event: string, payload: Record<string, unknown> = {}): void {
  if (!DEBUG_AI_CLIENT) return
  try {
    console.debug(`${CLIENT_LOG_PREFIX} ${event}`, payload)
  } catch {
    // ignore logging errors
  }
}

function warnLog(event: string, payload: Record<string, unknown> = {}): void {
  if (!DEBUG_AI_CLIENT) return
  try {
    console.warn(`${CLIENT_LOG_PREFIX} ${event}`, payload)
  } catch {
    // ignore logging errors
  }
}

function errorLog(event: string, payload: Record<string, unknown> = {}): void {
  try {
    console.error(`${CLIENT_LOG_PREFIX} ${event}`, payload)
  } catch {
    // ignore logging errors
  }
}

function summarizeSectionCounts(obj: any): string {
  if (!obj || typeof obj !== 'object') return 'null'
  const safeLen = (x: any) => (Array.isArray(x) ? x.length : (x ? 1 : 0))
  const parts: string[] = []
  try {
    parts.push(`keys:${Object.keys(obj).join(',')}`)
    parts.push(`work:${safeLen(obj.work)}`)
    parts.push(`education:${safeLen(obj.education)}`)
    parts.push(`projects:${safeLen(obj.projects)}`)
    parts.push(`skills:${safeLen(obj.skills)}`)
    parts.push(`certs:${safeLen(obj.certifications)}`)
    parts.push(`awards:${safeLen(obj.awards)}`)
    parts.push(`languages:${safeLen(obj.languages)}`)
  } catch {
    // ignore
  }
  return parts.join(' | ')
}

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
  traceId: string | null
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
  traceId: null,

  /**
   * Deep-merge helper for accumulating streaming partials
   * - Arrays: replaced by incoming array
   * - Objects: merged recursively
   * - Primitives: replaced by incoming value
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _deepMerge: undefined as any,

  async start({ docType, text, personalInfo, file, editorData }) {
    debugLog('start:init', {
      docType,
      hasText: Boolean(text && text.trim().length > 0),
      textLen: text?.length || 0,
      hasFile: Boolean(file),
      fileSize: file?.size || 0,
      hasEditorData: Boolean(editorData),
    })

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
      // Encode PDF to base64 for transmission
      // Use chunked approach to avoid "Maximum call stack size exceeded" error
      // that occurs when spreading large byte arrays into String.fromCharCode()
      const buf = await file.arrayBuffer()
      const bytes = new Uint8Array(buf)
      const CHUNK_SIZE = 8192  // Process 8KB at a time to stay well under argument limit

      let binary = ''
      let chunkCounter = 0
      for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
        const chunk = bytes.subarray(i, i + CHUNK_SIZE)
        binary += String.fromCharCode(...chunk)
        chunkCounter += 1
      }
      base64 = btoa(binary)
      debugLog('start:file-encoded', {
        fileSize: file.size,
        base64Length: base64.length,
        chunkCounter,
      })
    }

    const abortController = new AbortController()
    set({
      docType,
      isStreaming: true,
      progress: 0,
      partial: null,
      final: null,
      error: null,
      abortController,
      traceId: null,
    } as Partial<UnifiedState>)

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
        errorLog('http-error', { status: res.status, payload })
        throw new Error(payload.message || `HTTP ${res.status}`)
      }

      if (!res.body) throw new Error('Empty response body')

      const traceId = res.headers.get('X-Trace-Id') || null
      debugLog('stream:start', { traceId })
      set({ traceId } as Partial<UnifiedState>)

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let chunkIndex = 0

      let updateCount = 0
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        chunkIndex += 1
        debugLog('stream:chunk', {
          traceId,
          chunkIndex,
          byteLength: value?.length || 0,
        })
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
                  {
                    const pct = Math.round((data.progress || 0) * 100)
                    if (pct % 5 === 0 || pct >= 95) {
                      debugLog('progress', { pct, traceId: data.traceId || traceId })
                    }
                    set({ progress: pct })
                  }
                  break
                case 'update':
                  set((state) => {
                    // Local deep-merge to accumulate partials
                    const deepMerge = (target: any, source: any): any => {
                      if (target == null) return source
                      if (source == null) return target
                      // Replace arrays entirely
                      if (Array.isArray(target) && Array.isArray(source)) return source
                      // Merge plain objects
                      if (
                        typeof target === 'object' && !Array.isArray(target) &&
                        typeof source === 'object' && !Array.isArray(source)
                      ) {
                        const result: any = { ...target }
                        for (const key of Object.keys(source)) {
                          result[key] = deepMerge((target as any)[key], (source as any)[key])
                        }
                        return result
                      }
                      // Primitives or mismatched types: replace
                      return source
                    }

                    const nextPartial = deepMerge(state.partial ?? {}, data.data)
                    updateCount += 1
                    const incomingKeys = Object.keys(data.data || {})
                    debugLog('update', {
                      updateCount,
                      incomingKeys,
                      summary: summarizeSectionCounts(nextPartial),
                      traceId: (data as any).traceId || traceId,
                    })
                    return { partial: nextPartial } as any
                  })
                  break
                case 'complete':
                  debugLog('complete', {
                    updateCount,
                    summary: summarizeSectionCounts(data.data),
                    traceId: data.traceId || traceId,
                    duration: data.duration,
                  })
                  if (docType === 'resume') {
                    set({ final: data.data as ResumeJson, partial: data.data as ResumeJson, isStreaming: false, progress: 100 } as any)
                  } else {
                    set({ final: data.data as CoverLetterJson, partial: data.data as CoverLetterJson, isStreaming: false, progress: 100 } as any)
                  }
                  break
                case 'error':
                  warnLog('stream-error-event', {
                    traceId: data.traceId || traceId,
                    message: data.message,
                  })
                  set({ error: data.message || 'Generation failed', isStreaming: false })
                  break
              }
            } catch (e) {
              warnLog('parse-error', {
                traceId,
                error: e instanceof Error ? e.message : 'unknown',
              })
            }
          }
        }
      }

      debugLog('stream:end', { traceId, updateCount, chunkIndex })
      set({ isStreaming: false, abortController: null })
    } catch (err) {
      if ((err as any)?.name === 'AbortError') return
      errorLog('exception', {
        traceId: get().traceId,
        message: err instanceof Error ? err.message : String(err),
      })
      set({ error: err instanceof Error ? err.message : 'Request failed', isStreaming: false, abortController: null })
    }
  },

  cancel() {
    const ac = get().abortController
    if (ac) ac.abort()
    debugLog('cancel', { traceId: get().traceId })
    set({ isStreaming: false, progress: 0, abortController: null })
  },

  reset() {
    debugLog('reset', { traceId: get().traceId })
    set({
      docType: null,
      isStreaming: false,
      progress: 0,
      partial: null,
      final: null,
      error: null,
      abortController: null,
      traceId: null,
    } as Partial<UnifiedState>)
  },
}))
