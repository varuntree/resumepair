/**
 * Document Linker Component
 *
 * Allows linking/unlinking cover letters to resumes.
 * Displays resume selector and sync option.
 *
 * @module components/documents/DocumentLinker
 */

'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Link2, Unlink } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export interface DocumentLinkerProps {
  coverLetterId: string
  currentLinkedResumeId?: string | null
  resumes: Array<{ id: string; title: string }>
  onLink: (resumeId: string, syncData: boolean) => Promise<void>
  onUnlink: () => Promise<void>
  disabled?: boolean
}

export function DocumentLinker({
  coverLetterId,
  currentLinkedResumeId,
  resumes,
  onLink,
  onUnlink,
  disabled = false,
}: DocumentLinkerProps): React.ReactElement {
  const [selectedResumeId, setSelectedResumeId] = React.useState<string>(
    currentLinkedResumeId || ''
  )
  const [syncData, setSyncData] = React.useState(true)
  const [isLinking, setIsLinking] = React.useState(false)
  const [isUnlinking, setIsUnlinking] = React.useState(false)
  const { toast } = useToast()

  // Update selected resume when current link changes
  React.useEffect(() => {
    if (currentLinkedResumeId) {
      setSelectedResumeId(currentLinkedResumeId)
    } else {
      setSelectedResumeId('')
    }
  }, [currentLinkedResumeId])

  const handleLink = async (): Promise<void> => {
    if (!selectedResumeId) {
      toast({
        title: 'Select a resume',
        description: 'Please select a resume to link',
        variant: 'destructive',
      })
      return
    }

    setIsLinking(true)
    try {
      await onLink(selectedResumeId, syncData)
      toast({
        title: 'Resume linked',
        description: syncData
          ? 'Resume linked and profile data synced successfully'
          : 'Resume linked successfully',
      })
    } catch (error) {
      console.error('Failed to link resume:', error)
      toast({
        title: 'Failed to link resume',
        description:
          error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      })
    } finally {
      setIsLinking(false)
    }
  }

  const handleUnlink = async (): Promise<void> => {
    setIsUnlinking(true)
    try {
      await onUnlink()
      setSelectedResumeId('')
      toast({
        title: 'Resume unlinked',
        description: 'Cover letter unlinked from resume successfully',
      })
    } catch (error) {
      console.error('Failed to unlink resume:', error)
      toast({
        title: 'Failed to unlink resume',
        description:
          error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      })
    } finally {
      setIsUnlinking(false)
    }
  }

  const hasLinkedResume = Boolean(currentLinkedResumeId)
  const hasChanges = selectedResumeId !== (currentLinkedResumeId || '')

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="resume-select">Link to Resume</Label>
        <Select
          value={selectedResumeId}
          onValueChange={setSelectedResumeId}
          disabled={disabled || isLinking || isUnlinking}
        >
          <SelectTrigger id="resume-select">
            <SelectValue placeholder="Select a resume" />
          </SelectTrigger>
          <SelectContent>
            {resumes.length === 0 ? (
              <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                No resumes available
              </div>
            ) : (
              resumes.map((resume) => (
                <SelectItem key={resume.id} value={resume.id}>
                  {resume.title}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Link this cover letter to a resume for profile syncing
        </p>
      </div>

      {!hasLinkedResume && selectedResumeId && (
        <div className="flex items-center justify-between space-x-2">
          <div className="space-y-0.5">
            <Label htmlFor="sync-data">Sync profile data</Label>
            <p className="text-xs text-muted-foreground">
              Copy contact info from resume to cover letter
            </p>
          </div>
          <Switch
            id="sync-data"
            checked={syncData}
            onCheckedChange={setSyncData}
            disabled={disabled || isLinking}
          />
        </div>
      )}

      <div className="flex items-center gap-2">
        {hasChanges && selectedResumeId && (
          <Button
            onClick={handleLink}
            disabled={disabled || isLinking || isUnlinking}
            className="flex items-center gap-2"
          >
            <Link2 className="h-4 w-4" />
            {isLinking ? 'Linking...' : hasLinkedResume ? 'Update Link' : 'Link Resume'}
          </Button>
        )}

        {hasLinkedResume && (
          <Button
            variant="outline"
            onClick={handleUnlink}
            disabled={disabled || isLinking || isUnlinking}
            className="flex items-center gap-2"
          >
            <Unlink className="h-4 w-4" />
            {isUnlinking ? 'Unlinking...' : 'Unlink'}
          </Button>
        )}
      </div>
    </div>
  )
}
