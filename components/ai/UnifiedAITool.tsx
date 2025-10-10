/**
 * Unified AI Tool (Resume + Cover Letter)
 */

'use client'

import { useMemo, useState, startTransition, useEffect, useCallback } from 'react'
import { useShallow } from 'zustand/react/shallow'
import isEqual from 'lodash/isEqual'
import JobDescriptionInput from './JobDescriptionInput'
import PersonalInfoForm from './PersonalInfoForm'
import StreamingIndicator from './StreamingIndicator'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { useUnifiedAIStore } from '@/stores/unifiedAIStore'
import type { ResumeJson } from '@/types/resume'
import type { CoverLetterJson } from '@/types/cover-letter'
import { useDocumentStore } from '@/stores/documentStore'
import { useCoverLetterStore } from '@/stores/coverLetterStore'

type DocType = 'resume' | 'cover-letter'

const ENABLE_DEBUG_LOGS = process.env.NODE_ENV !== 'production'

function summarizeSectionsForLog(data: any) {
  if (!data || typeof data !== 'object') return null
  const safeLen = (value: any) => (Array.isArray(value) ? value.length : 0)
  return {
    profile: data.profile ? 1 : 0,
    work: safeLen(data.work),
    education: safeLen(data.education),
    projects: safeLen(data.projects),
    skills: safeLen(data.skills),
    certifications: safeLen(data.certifications),
    awards: safeLen(data.awards),
    languages: safeLen(data.languages),
    extras: safeLen(data.extras),
  }
}

interface UnifiedAIToolProps {
  docType: DocType
  editorData?: any
}

export default function UnifiedAITool({ docType, editorData }: UnifiedAIToolProps) {
  const [text, setText] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [personalInfo, setPersonalInfo] = useState<any>({})

  const { storeDocType, isStreaming, progress, partial, final, error, start, cancel, reset, traceId } = useUnifiedAIStore(
    useShallow((s) => ({
      storeDocType: s.docType,
      isStreaming: s.isStreaming,
      progress: s.progress,
      partial: s.partial,
      final: s.final,
      error: s.error,
      start: s.start,
      cancel: s.cancel,
      reset: s.reset,
      traceId: s.traceId,
    }))
  )

  const canGenerate = useMemo(() => {
    return Boolean((text && text.trim().length > 0) || file || editorData)
  }, [text, file, editorData])

  const resumeDoc = useDocumentStore((s) => s.document)
  const updateResume = useDocumentStore((s) => s.updateDocument)
  const coverDoc = useCoverLetterStore((s) => s.document)
  const updateCover = useCoverLetterStore((s) => s.updateDocument)

  const logEvent = useCallback((event: string, payload: Record<string, unknown>) => {
    if (!ENABLE_DEBUG_LOGS) return
    try {
      console.debug('[UnifiedAITool]', event, { traceId, ...payload })
    } catch (err) {
      console.warn('[UnifiedAITool] logging failed', err)
    }
  }, [traceId])

  const onGenerate = async () => {
    if (!canGenerate || isStreaming) return
    logEvent('onGenerate', {
      docType,
      hasText: Boolean(text && text.trim().length > 0),
      hasFile: Boolean(file),
      hasEditorData: Boolean(editorData),
      fileSize: file?.size || 0,
    })
    await start({ docType, text, personalInfo, file, editorData })
  }

  const onApply = () => {
    if (storeDocType && storeDocType !== docType) return
    const data = final || partial
    if (!data) return
    logEvent('onApply', {
      docType,
      hasFinal: Boolean(final),
      hasPartial: Boolean(partial),
      sectionSummary: summarizeSectionsForLog(data),
    })
    if (docType === 'resume') {
      if (!resumeDoc || !isEqual(resumeDoc, data)) {
        startTransition(() => {
          updateResume(data as Partial<ResumeJson>)
        })
      }
    } else {
      if (!coverDoc || !isEqual(coverDoc, data)) {
        startTransition(() => {
          updateCover(data as Partial<CoverLetterJson>)
        })
      }
    }
  }

  // Reset AI state only after save confirmation to avoid preview flicker
  useEffect(() => {
    const handleSaved = (event: Event) => {
      const e = event as CustomEvent
      const savedDocType = e?.detail?.docType
      if (savedDocType === docType && (final || partial)) {
        logEvent('document:saved', {
          docType,
          detail: e.detail,
          sectionSummary: summarizeSectionsForLog(final || partial),
        })
        // Clear AI store once data is safely saved to server
        reset()
      }
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('document:saved', handleSaved)
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('document:saved', handleSaved)
      }
    }
  }, [docType, final, partial, reset, logEvent])

  return (
    <div className="space-y-4">
      {/* Inputs */}
      <JobDescriptionInput value={text} onChange={setText} disabled={isStreaming} />

      {/* PDF Upload */}
      <div className="space-y-2">
        <Label htmlFor="pdf-upload">Optional PDF (resume or job posting)</Label>
        <Input
          id="pdf-upload"
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          disabled={isStreaming}
        />
        <p className="text-xs text-muted-foreground">Max 10MB. We’ll extract relevant details if provided.</p>
      </div>

      {/* Personal Info (resume only) */}
      {docType === 'resume' && (
        <PersonalInfoForm
          personalInfo={personalInfo}
          onChange={(info) => setPersonalInfo({ ...personalInfo, ...info })}
          disabled={isStreaming}
        />
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button onClick={onGenerate} disabled={!canGenerate || isStreaming}>
          {isStreaming ? 'Generating…' : 'Generate'}
        </Button>
        {isStreaming && (
          <Button variant="ghost" onClick={cancel} type="button">
            Cancel
          </Button>
        )}
        {(final || partial) && !isStreaming && (
          <Button variant="secondary" onClick={onApply} type="button">
            Apply to Editor
          </Button>
        )}
      </div>

      {/* Error */}
      {error && <p className="text-xs text-destructive">{error}</p>}

      {/* Floating indicator */}
      <StreamingIndicator isGenerating={isStreaming} currentSection={null} progress={progress} onCancel={cancel} />
    </div>
  )
}
