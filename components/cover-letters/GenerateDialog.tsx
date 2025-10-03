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
  const [isGenerating, setIsGenerating] = React.useState(false)
  const [progress, setProgress] = React.useState(0)
  const [streamingText, setStreamingText] = React.useState('')
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

    setIsGenerating(true)
    setProgress(0)
    setStreamingText('Starting generation...')

    try {
      const response = await fetch('/api/v1/cover-letters/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobDescription,
          resumeId: selectedResumeId || undefined,
          tone,
          length,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate cover letter')
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response stream')
      }

      const decoder = new TextDecoder()
      let finalCoverLetter: CoverLetterJson | null = null
      let isReading = true

      while (isReading) {
        const { done, value } = await reader.read()
        if (done) {
          isReading = false
          break
        }

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n\n')

        for (const line of lines) {
          if (!line.trim() || !line.startsWith('event:')) continue

          const eventMatch = line.match(/event: (\w+)\ndata: (.+)/)
          if (!eventMatch) continue

          const [, eventType, eventData] = eventMatch
          const data = JSON.parse(eventData)

          switch (eventType) {
            case 'progress':
              setProgress(Math.round(data.progress * 100))
              setStreamingText('Generating cover letter...')
              break
            case 'update':
              if (data.data?.body) {
                const paragraphCount = data.data.body.length
                setStreamingText(
                  `Writing paragraph ${paragraphCount} of ${length === 'short' ? '3' : length === 'medium' ? '4' : '5'}...`
                )
              }
              break
            case 'complete':
              setProgress(100)
              setStreamingText('Complete!')
              finalCoverLetter = data.data
              break
            case 'error':
              throw new Error(data.message || 'Generation failed')
          }
        }
      }

      if (finalCoverLetter) {
        onGenerate(finalCoverLetter)
        toast({
          title: 'Cover letter generated',
          description: 'Your cover letter has been generated successfully',
        })

        // Reset and close
        setJobDescription('')
        setSelectedResumeId('')
        setOpen(false)
      }
    } catch (error) {
      console.error('Failed to generate cover letter:', error)
      toast({
        title: 'Generation failed',
        description:
          error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      })
    } finally {
      setIsGenerating(false)
      setProgress(0)
      setStreamingText('')
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

  const canGenerate = jobDescription.trim().length >= 50 && !isGenerating

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
              disabled={isGenerating}
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
                disabled={isGenerating}
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
            <RadioGroup value={tone} onValueChange={(v) => setTone(v as Tone)} disabled={isGenerating}>
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
            <RadioGroup value={length} onValueChange={(v) => setLength(v as Length)} disabled={isGenerating}>
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
          {isGenerating && (
            <div className="space-y-2 p-4 rounded-lg border border-border bg-muted/30">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <p className="text-sm font-medium">{streamingText}</p>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isGenerating}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={!canGenerate}>
            {isGenerating ? (
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
