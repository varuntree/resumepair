/* eslint-disable no-unused-vars */
'use client'

import * as React from 'react'
import { formatDistanceToNow } from 'date-fns'
import { History, X, RotateCcw } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import type { ResumeVersion } from '@/types/resume'

export interface VersionHistoryProps {
  resumeId: string
  open: boolean
  onClose: () => void
  onRestore: (value: number) => Promise<void>
}

export function VersionHistory({
  resumeId,
  open,
  onClose,
  onRestore,
}: VersionHistoryProps): React.ReactElement {
  const { toast } = useToast()
  const [versions, setVersions] = React.useState<ResumeVersion[]>([])
  const [loading, setLoading] = React.useState(false)
  const [restoring, setRestoring] = React.useState<number | null>(null)

  // Fetch versions when opened
  React.useEffect(() => {
    if (open && resumeId) {
      fetchVersions()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, resumeId])

  const fetchVersions = async (): Promise<void> => {
    setLoading(true)
    try {
      const response = await fetch(`/api/v1/resumes/${resumeId}/versions`)

      if (!response.ok) {
        throw new Error('Failed to fetch versions')
      }

      const result = await response.json()
      setVersions(result.data?.versions || [])
    } catch (error) {
      console.error('Error fetching versions:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load version history',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRestore = async (versionNumber: number): Promise<void> => {
    if (!confirm(`Are you sure you want to restore version ${versionNumber}? Your current version will be saved.`)) {
      return
    }

    setRestoring(versionNumber)
    try {
      await onRestore(versionNumber)
      toast({
        title: 'Success',
        description: `Restored to version ${versionNumber}`,
      })
      onClose()
    } catch (error) {
      console.error('Error restoring version:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to restore version',
      })
    } finally {
      setRestoring(null)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5" />
              <SheetTitle>Version History</SheetTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <SheetDescription>
            View and restore previous versions of your resume
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-120px)] mt-6">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <VersionSkeleton key={i} />
              ))}
            </div>
          ) : versions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <History className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No version history yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {versions.map((version) => (
                <VersionItem
                  key={version.id}
                  version={version}
                  onRestore={handleRestore}
                  restoring={restoring === version.version_number}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}

interface VersionItemProps {
  version: ResumeVersion
  onRestore: (value: number) => Promise<void>
  restoring: boolean
}

function VersionItem({ version, onRestore, restoring }: VersionItemProps): React.ReactElement {
  const timestamp = React.useMemo(() => {
    try {
      return formatDistanceToNow(new Date(version.created_at), { addSuffix: true })
    } catch {
      return 'Unknown'
    }
  }, [version.created_at])

  return (
    <div className="border border-border rounded-lg p-4 space-y-2 hover:bg-muted/50 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">Version {version.version_number}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {timestamp}
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onRestore(version.version_number)}
          disabled={restoring}
          className="shrink-0"
        >
          {restoring ? (
            'Restoring...'
          ) : (
            <>
              <RotateCcw className="h-3 w-3 mr-1" />
              Restore
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

function VersionSkeleton(): React.ReactElement {
  return (
    <div className="border border-border rounded-lg p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  )
}
