/**
 * Bulk Operations Component
 *
 * Provides bulk actions for multiple selected documents.
 * Supports delete, archive, and export operations.
 *
 * @module components/documents/BulkOperations
 */

'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Trash2, Archive, Download, MoreHorizontal } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export interface BulkOperationsProps {
  selectedDocuments: string[]
  // eslint-disable-next-line no-unused-vars
  onDelete: (documentIds: string[]) => Promise<void>
  // eslint-disable-next-line no-unused-vars
  onArchive?: (documentIds: string[]) => Promise<void>
  // eslint-disable-next-line no-unused-vars
  onExport?: (documentIds: string[]) => Promise<void>
  onClearSelection: () => void
}

export function BulkOperations({
  selectedDocuments,
  onDelete,
  onArchive,
  onExport,
  onClearSelection,
}: BulkOperationsProps): React.ReactElement | null {
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [isArchiving, setIsArchiving] = React.useState(false)
  const [isExporting, setIsExporting] = React.useState(false)
  const { toast } = useToast()

  if (selectedDocuments.length === 0) {
    return null
  }

  const handleDelete = async (): Promise<void> => {
    if (
      !confirm(
        `Are you sure you want to delete ${selectedDocuments.length} document(s)?`
      )
    ) {
      return
    }

    setIsDeleting(true)
    try {
      await onDelete(selectedDocuments)
      toast({
        title: 'Documents deleted',
        description: `${selectedDocuments.length} document(s) deleted successfully`,
      })
      onClearSelection()
    } catch (error) {
      console.error('Failed to delete documents:', error)
      toast({
        title: 'Failed to delete documents',
        description:
          error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleArchive = async (): Promise<void> => {
    if (!onArchive) return

    setIsArchiving(true)
    try {
      await onArchive(selectedDocuments)
      toast({
        title: 'Documents archived',
        description: `${selectedDocuments.length} document(s) archived successfully`,
      })
      onClearSelection()
    } catch (error) {
      console.error('Failed to archive documents:', error)
      toast({
        title: 'Failed to archive documents',
        description:
          error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      })
    } finally {
      setIsArchiving(false)
    }
  }

  const handleExport = async (): Promise<void> => {
    if (!onExport) return

    setIsExporting(true)
    try {
      await onExport(selectedDocuments)
      toast({
        title: 'Export started',
        description: `Exporting ${selectedDocuments.length} document(s)...`,
      })
      onClearSelection()
    } catch (error) {
      console.error('Failed to export documents:', error)
      toast({
        title: 'Failed to export documents',
        description:
          error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      })
    } finally {
      setIsExporting(false)
    }
  }

  const isLoading = isDeleting || isArchiving || isExporting

  return (
    <div className="flex items-center gap-2 p-4 rounded-lg border border-border bg-muted/30">
      <p className="text-sm font-medium">
        {selectedDocuments.length} selected
      </p>

      <div className="flex items-center gap-2 ml-auto">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          disabled={isLoading}
        >
          Clear
        </Button>

        <Button
          variant="destructive"
          size="sm"
          onClick={handleDelete}
          disabled={isLoading}
          className="gap-2"
        >
          <Trash2 className="h-4 w-4" />
          {isDeleting ? 'Deleting...' : 'Delete'}
        </Button>

        {(onArchive || onExport) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={isLoading}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onArchive && (
                <DropdownMenuItem
                  onClick={handleArchive}
                  disabled={isArchiving}
                >
                  <Archive className="h-4 w-4 mr-2" />
                  {isArchiving ? 'Archiving...' : 'Archive'}
                </DropdownMenuItem>
              )}
              {onExport && (
                <DropdownMenuItem onClick={handleExport} disabled={isExporting}>
                  <Download className="h-4 w-4 mr-2" />
                  {isExporting ? 'Exporting...' : 'Export Package'}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  )
}
