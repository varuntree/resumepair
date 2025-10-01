/* eslint-disable no-unused-vars */
'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { UndoRedoButtons } from './UndoRedoButtons'
import { cn } from '@/libs/utils'

export type SaveStatus = 'saved' | 'saving' | 'error'

export interface EditorHeaderProps {
  title: string
  onTitleChange: (value: string) => void
  saveStatus: SaveStatus
  lastSaved?: Date | null
  onSave?: () => void
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
}

export function EditorHeader({
  title,
  onTitleChange,
  saveStatus,
  lastSaved,
  onSave,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}: EditorHeaderProps): React.ReactElement {
  const router = useRouter()

  const statusText = React.useMemo(() => {
    if (saveStatus === 'saving') return 'Saving...'
    if (saveStatus === 'error') return 'Error saving'
    if (lastSaved) {
      const now = new Date()
      const diff = now.getTime() - lastSaved.getTime()
      if (diff < 60000) return 'Saved just now'
      if (diff < 3600000) return `Saved ${Math.floor(diff / 60000)}m ago`
      return 'Saved'
    }
    return 'Saved'
  }, [saveStatus, lastSaved])

  const statusColor = React.useMemo(() => {
    if (saveStatus === 'saving') return 'text-muted-foreground'
    if (saveStatus === 'error') return 'text-destructive'
    return 'text-muted-foreground'
  }, [saveStatus])

  return (
    <div className="flex items-center justify-between gap-4 px-6 py-3">
      {/* Left: Back button + Title */}
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/dashboard')}
          className="shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <Input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          className="max-w-sm"
          placeholder="Untitled Resume"
        />
      </div>

      {/* Center: Save status */}
      <div className={cn('flex items-center gap-2 text-sm', statusColor)}>
        {saveStatus === 'saving' && (
          <Loader2 className="h-3 w-3 animate-spin" />
        )}
        <span>{statusText}</span>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <UndoRedoButtons
          onUndo={onUndo}
          onRedo={onRedo}
          canUndo={canUndo}
          canRedo={canRedo}
        />

        {onSave && (
          <Button
            variant="default"
            size="sm"
            onClick={onSave}
            disabled={saveStatus === 'saving'}
          >
            {saveStatus === 'saving' ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save
          </Button>
        )}
      </div>
    </div>
  )
}
