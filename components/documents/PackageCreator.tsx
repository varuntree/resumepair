/**
 * Package Creator Component
 *
 * Creates document packages (resume + cover letter bundles).
 * Allows selection of documents and package naming.
 *
 * @module components/documents/PackageCreator
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Package, FileText, Plus } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export interface DocumentOption {
  id: string
  title: string
  type: 'resume' | 'cover_letter'
}

export interface PackageCreatorProps {
  resumes: DocumentOption[]
  coverLetters: DocumentOption[]
  onCreate: (data: {
    name: string
    resumeId: string
    coverLetterId: string
  }) => Promise<void>
  triggerButton?: React.ReactNode
}

export function PackageCreator({
  resumes,
  coverLetters,
  onCreate,
  triggerButton,
}: PackageCreatorProps): React.ReactElement {
  const [open, setOpen] = React.useState(false)
  const [packageName, setPackageName] = React.useState('')
  const [selectedResumeId, setSelectedResumeId] = React.useState('')
  const [selectedCoverLetterId, setSelectedCoverLetterId] = React.useState('')
  const [isCreating, setIsCreating] = React.useState(false)
  const { toast } = useToast()

  const handleCreate = async (): Promise<void> => {
    if (!packageName.trim()) {
      toast({
        title: 'Package name required',
        description: 'Please enter a name for the package',
        variant: 'destructive',
      })
      return
    }

    if (!selectedResumeId || !selectedCoverLetterId) {
      toast({
        title: 'Select documents',
        description: 'Please select both a resume and cover letter',
        variant: 'destructive',
      })
      return
    }

    setIsCreating(true)
    try {
      await onCreate({
        name: packageName,
        resumeId: selectedResumeId,
        coverLetterId: selectedCoverLetterId,
      })

      toast({
        title: 'Package created',
        description: `"${packageName}" created successfully`,
      })

      // Reset form and close
      setPackageName('')
      setSelectedResumeId('')
      setSelectedCoverLetterId('')
      setOpen(false)
    } catch (error) {
      console.error('Failed to create package:', error)
      toast({
        title: 'Failed to create package',
        description:
          error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      })
    } finally {
      setIsCreating(false)
    }
  }

  const selectedResume = resumes.find((r) => r.id === selectedResumeId)
  const selectedCoverLetter = coverLetters.find(
    (cl) => cl.id === selectedCoverLetterId
  )

  const canCreate =
    packageName.trim() && selectedResumeId && selectedCoverLetterId

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button variant="outline" className="gap-2">
            <Package className="h-4 w-4" />
            Create Package
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Create Document Package
          </DialogTitle>
          <DialogDescription>
            Bundle a resume and cover letter together for easy export and
            sharing
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Package Name */}
          <div className="space-y-2">
            <Label htmlFor="package-name">Package Name</Label>
            <Input
              id="package-name"
              placeholder="e.g., Acme Corp Application"
              value={packageName}
              onChange={(e) => setPackageName(e.target.value)}
              disabled={isCreating}
            />
          </div>

          {/* Resume Selection */}
          <div className="space-y-2">
            <Label htmlFor="resume-select">Resume</Label>
            <Select
              value={selectedResumeId}
              onValueChange={setSelectedResumeId}
              disabled={isCreating}
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
                      <div className="flex items-center gap-2">
                        <FileText className="h-3 w-3" />
                        {resume.title}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Cover Letter Selection */}
          <div className="space-y-2">
            <Label htmlFor="cover-letter-select">Cover Letter</Label>
            <Select
              value={selectedCoverLetterId}
              onValueChange={setSelectedCoverLetterId}
              disabled={isCreating}
            >
              <SelectTrigger id="cover-letter-select">
                <SelectValue placeholder="Select a cover letter" />
              </SelectTrigger>
              <SelectContent>
                {coverLetters.length === 0 ? (
                  <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                    No cover letters available
                  </div>
                ) : (
                  coverLetters.map((coverLetter) => (
                    <SelectItem key={coverLetter.id} value={coverLetter.id}>
                      <div className="flex items-center gap-2">
                        <FileText className="h-3 w-3" />
                        {coverLetter.title}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Package Preview */}
          {(selectedResume || selectedCoverLetter) && (
            <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
              <p className="text-sm font-medium">Package Contents:</p>
              <div className="flex flex-wrap gap-2">
                {selectedResume && (
                  <Badge variant="secondary" className="gap-1">
                    <FileText className="h-3 w-3" />
                    {selectedResume.title}
                    <span className="text-xs opacity-60">Resume</span>
                  </Badge>
                )}
                {selectedCoverLetter && (
                  <Badge variant="secondary" className="gap-1">
                    <FileText className="h-3 w-3" />
                    {selectedCoverLetter.title}
                    <span className="text-xs opacity-60">Cover Letter</span>
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!canCreate || isCreating}>
            {isCreating ? (
              'Creating...'
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Create Package
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
