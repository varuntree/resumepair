/**
 * Cover Letter Generation Dialog Component
 *
 * Modal dialog for AI-powered cover letter generation.
 * Supports job description input, resume selection, tone, and length options.
 *
 * @module components/cover-letters/GenerateDialog
 */

'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Sparkles, FileText, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import type { CoverLetterJson } from '@/types/cover-letter'
import { useUnifiedAIStore } from '@/stores/unifiedAIStore'
import { useShallow } from 'zustand/react/shallow'

export interface Resume {
  id: string
  title: string
}

export interface GenerateDialogProps {
  resumes: Resume[]
  onGenerate: (coverLetter: CoverLetterJson) => void
  triggerButton?: React.ReactNode
}

type Tone = 'formal' | 'friendly' | 'enthusiastic'
type Length = 'short' | 'medium' | 'long'

export function GenerateDialog({
  resumes,
  onGenerate,
  triggerButton,
}: GenerateDialogProps): React.ReactElement {
  const [open, setOpen] = React.useState(false)
  const [jobDescription, setJobDescription] = React.useState('')
  const [selectedResumeId, setSelectedResumeId] = React.useState('')
  const [tone, setTone] = React.useState<Tone>('formal')
  const [length, setLength] = React.useState<Length>('medium')
  const [isPreparing, setIsPreparing] = React.useState(false)
  const { isStreaming, progress, partial, final, start, cancel, reset } = useUnifiedAIStore(
    useShallow((s: any) => ({
      isStreaming: s.isStreaming,
      progress: s.progress,
      partial: s.partial,
      final: s.final,
      start: s.start,
      cancel: s.cancel,
      reset: s.reset,
    }))
  )
  const { toast } = useToast()

  const handleGenerate = async (): Promise<void> => {
    if (!jobDescription.trim()) {
      toast({
        title: 'Job description required',
        description: 'Please enter a job description to generate a cover letter',
        variant: 'destructive',
      })
      return
    }

    setIsPreparing(true)
    try {
      // Optionally fetch selected resume for context
      let resumeContext = ''
      if (selectedResumeId) {
        try {
          const res = await fetch(`/api/v1/resumes/${selectedResumeId}`)
          if (res.ok) {
            const payload = await res.json()
            const r = payload?.data || payload
            // Minimal, structured context to keep prompt compact
            const summary = [
              r?.profile?.fullName && `Name: ${r.profile.fullName}`,
              r?.profile?.email && `Email: ${r.profile.email}`,
              r?.summary && `Summary: ${typeof r.summary === 'string' ? r.summary : ''}`,
            ].filter(Boolean).join('\n')
            const topWork = Array.isArray(r?.work) ? r.work.slice(0, 2).map((w: any) => `- ${w.position || ''} @ ${w.company || ''} (${w.startDate || ''} - ${w.endDate || 'Present'})`).join('\n') : ''
            const skills = Array.isArray(r?.skills?.items) ? r.skills.items.slice(0, 12).map((s: any) => s.name).join(', ') : ''
            resumeContext = `\n\nCandidate context (from selected resume):\n${summary}${topWork ? `\nWork:\n${topWork}` : ''}${skills ? `\nSkills: ${skills}` : ''}`
          }
        } catch {}
      }

      const desiredParagraphs = length === 'short' ? 3 : length === 'medium' ? 4 : 5
      const composed = `Write a professional cover letter.\nTone: ${tone}. Target paragraphs: ${desiredParagraphs}.\nFocus on relevance to the job description and the candidate's background.\n\nJob description:\n${jobDescription.trim()}${resumeContext}`

      await start({ docType: 'cover-letter', text: composed })
    } catch (error) {
      console.error('Failed to generate cover letter:', error)
      toast({
        title: 'Generation failed',
        description:
          error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      })
    } finally {
      setIsPreparing(false)
    }
  }

  const toneOptions = [
    { value: 'formal', label: 'Formal', description: 'Professional and respectful' },
    { value: 'friendly', label: 'Friendly', description: 'Warm and personable' },
    { value: 'enthusiastic', label: 'Enthusiastic', description: 'Energetic and passionate' },
  ]

  const lengthOptions = [
    { value: 'short', label: 'Short', description: '200-250 words' },
    { value: 'medium', label: 'Medium', description: '250-350 words' },
    { value: 'long', label: 'Long', description: '350-450 words' },
  ]

  const canGenerate = jobDescription.trim().length >= 50 && !isPreparing && !isStreaming

  // When unified store completes, hand off to parent and reset
  React.useEffect(() => {
    if (final) {
      onGenerate(final as CoverLetterJson)
      toast({ title: 'Cover letter generated', description: 'Your cover letter has been generated successfully' })
      setJobDescription('')
      setSelectedResumeId('')
      reset()
      setOpen(false)
    }
  }, [final, onGenerate, reset, toast])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button className="gap-2">
            <Sparkles className="h-4 w-4" />
            Generate with AI
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Generate Cover Letter with AI
          </DialogTitle>
          <DialogDescription>
            Paste a job description and we&apos;ll create a tailored cover letter for you
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Job Description */}
          <div className="space-y-2">
            <Label htmlFor="job-description">
              Job Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="job-description"
              placeholder="Paste the job description here..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              disabled={isPreparing || isStreaming}
              rows={8}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {jobDescription.length} / 5000 characters (min 50)
            </p>
          </div>

          {/* Resume Selection */}
          {resumes.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="resume-select">Link to Resume (Optional)</Label>
              <Select
                value={selectedResumeId}
                onValueChange={setSelectedResumeId}
                disabled={isPreparing || isStreaming}
              >
                <SelectTrigger id="resume-select">
                  <SelectValue placeholder="Select a resume for context" />
                </SelectTrigger>
                <SelectContent>
                  {resumes.map((resume) => (
                    <SelectItem key={resume.id} value={resume.id}>
                      <div className="flex items-center gap-2">
                        <FileText className="h-3 w-3" />
                        {resume.title}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Selecting a resume will personalize the cover letter with your details
              </p>
            </div>
          )}

          {/* Tone Selection */}
          <div className="space-y-2">
            <Label>Tone</Label>
            <RadioGroup value={tone} onValueChange={(v) => setTone(v as Tone)} disabled={isPreparing || isStreaming}>
              <div className="grid grid-cols-3 gap-3">
                {toneOptions.map((option) => (
                  <div
                    key={option.value}
                    className={`relative flex items-start space-x-3 rounded-lg border p-3 ${
                      tone === option.value ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                  >
                    <RadioGroupItem value={option.value} id={`tone-${option.value}`} className="mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <label htmlFor={`tone-${option.value}`} className="text-sm font-medium cursor-pointer block">
                        {option.label}
                      </label>
                      <p className="text-xs text-muted-foreground">{option.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>

          {/* Length Selection */}
          <div className="space-y-2">
            <Label>Length</Label>
            <RadioGroup value={length} onValueChange={(v) => setLength(v as Length)} disabled={isPreparing || isStreaming}>
              <div className="grid grid-cols-3 gap-3">
                {lengthOptions.map((option) => (
                  <div
                    key={option.value}
                    className={`relative flex items-start space-x-3 rounded-lg border p-3 ${
                      length === option.value ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                  >
                    <RadioGroupItem value={option.value} id={`length-${option.value}`} className="mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <label htmlFor={`length-${option.value}`} className="text-sm font-medium cursor-pointer block">
                        {option.label}
                      </label>
                      <p className="text-xs text-muted-foreground">{option.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>

          {/* Generation Progress */}
          {(isPreparing || isStreaming) && (
            <div className="space-y-2 p-4 rounded-lg border border-border bg-muted/30">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <p className="text-sm font-medium">{isPreparing ? 'Preparing…' : 'Generating cover letter…'}</p>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPreparing || isStreaming}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={!canGenerate}>
            {isPreparing || isStreaming ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
