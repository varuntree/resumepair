/**
 * Cover Letter Version History Component
 *
 * Displays version history for a cover letter with restore functionality.
 * Includes version list with timestamps, preview on hover, and restore confirmation.
 *
 * @module components/editor/CoverLetterVersionHistory
 */

'use client'

import * as React from 'react'
import { History, RotateCcw, Clock, CheckCircle2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import type { CoverLetterVersion } from '@/types/cover-letter'

interface CoverLetterVersionHistoryProps {
  coverLetterId: string
  onRestore?: () => void
}

export function CoverLetterVersionHistory({
  coverLetterId,
  onRestore,
}: CoverLetterVersionHistoryProps): React.ReactElement {
  const { toast } = useToast()
  const [isOpen, setIsOpen] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [versions, setVersions] = React.useState<CoverLetterVersion[]>([])
  const [restoreVersion, setRestoreVersion] = React.useState<number | null>(null)
  const [isRestoring, setIsRestoring] = React.useState(false)

  const fetchVersions = React.useCallback(async (): Promise<void> => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/v1/cover-letters/${coverLetterId}/versions`)
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch versions')
      }
      const data = await response.json()
      setVersions(data.data.versions || [])
    } catch (error) {
      console.error('Failed to fetch versions:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load version history',
      })
    } finally {
      setIsLoading(false)
    }
  }, [coverLetterId, toast])

  // Fetch versions when dialog opens
  React.useEffect(() => {
    if (isOpen && versions.length === 0) {
      fetchVersions()
    }
  }, [fetchVersions, isOpen, versions.length])

  const handleRestoreClick = (versionNumber: number): void => {
    setRestoreVersion(versionNumber)
  }

  const handleRestoreConfirm = async (): Promise<void> => {
    if (!restoreVersion) return

    setIsRestoring(true)
    try {
      const response = await fetch(
        `/api/v1/cover-letters/${coverLetterId}/versions/${restoreVersion}/restore`,
        {
          method: 'POST',
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to restore version')
      }

      toast({
        title: 'Version Restored',
        description: `Successfully restored to version ${restoreVersion}`,
      })

      setIsOpen(false)
      setRestoreVersion(null)

      // Trigger parent refresh
      if (onRestore) {
        onRestore()
      }
    } catch (error) {
      console.error('Failed to restore version:', error)
      toast({
        variant: 'destructive',
        title: 'Restore Failed',
        description: error instanceof Error ? error.message : 'Failed to restore version',
      })
    } finally {
      setIsRestoring(false)
    }
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    })
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <History className="h-4 w-4 mr-2" />
            Version History
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Version History</DialogTitle>
            <DialogDescription>
              View and restore previous versions of your cover letter
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="space-y-3 py-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-9 w-20" />
                </div>
              ))}
            </div>
          ) : versions.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">No version history yet</p>
              <p className="text-xs mt-1">Versions are created when you make changes</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[50vh] pr-4">
              <div className="space-y-2">
                {versions.map((version) => (
                  <div
                    key={version.id}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-semibold">
                        v{version.version_number}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Version {version.version_number}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatDate(version.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRestoreClick(version.version_number)}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Restore
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Restore Confirmation Dialog */}
      <AlertDialog open={restoreVersion !== null} onOpenChange={() => setRestoreVersion(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore Version {restoreVersion}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will replace your current cover letter content with version {restoreVersion}.
              Your current content will be saved as a new version before restoring.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRestoring}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestoreConfirm} disabled={isRestoring}>
              {isRestoring ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Restoring...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Restore
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
