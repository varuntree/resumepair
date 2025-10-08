/**
 * Rich Text Editor Toolbar
 *
 * Formatting toolbar for RichTextEditor with buttons for:
 * - Bold, Italic, Underline
 * - Bullet list, Numbered list
 *
 * Pattern: Active state tracking via document.queryCommandState
 *
 * @module components/rich-text/RichTextToolbar
 */

'use client'

import * as React from 'react'
import { Bold, Italic, Underline, List, ListOrdered } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  toggleBold,
  toggleItalic,
  toggleUnderline,
  insertBulletList,
  insertNumberedList,
  isFormatActive,
  isListActive,
} from '@/libs/rich-text/commands'

export interface RichTextToolbarProps {
  /** Reference to ContentEditable editor */
  editorRef: React.RefObject<HTMLDivElement>
  /** Callback when command executed */
  onCommand: () => void
  /** Disable toolbar */
  disabled?: boolean
}

/**
 * Toolbar with formatting buttons
 */
export function RichTextToolbar({
  editorRef,
  onCommand,
  disabled = false,
}: RichTextToolbarProps): React.ReactElement {
  const [activeFormats, setActiveFormats] = React.useState({
    bold: false,
    italic: false,
    underline: false,
    bulletList: false,
    numberedList: false,
  })

  /**
   * Update active states on selection change
   */
  const updateActiveStates = React.useCallback(() => {
    if (!editorRef.current) return

    setActiveFormats({
      bold: isFormatActive('bold'),
      italic: isFormatActive('italic'),
      underline: isFormatActive('underline'),
      bulletList: isListActive('bullet'),
      numberedList: isListActive('numbered'),
    })
  }, [editorRef])

  /**
   * Track selection changes
   */
  React.useEffect(() => {
    const handleSelectionChange = () => {
      updateActiveStates()
    }

    document.addEventListener('selectionchange', handleSelectionChange)
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange)
    }
  }, [updateActiveStates])

  /**
   * Handle format button click
   */
  const handleFormat = React.useCallback((command: () => void) => {
    if (disabled) return

    // Focus editor if not focused
    if (editorRef.current && document.activeElement !== editorRef.current) {
      editorRef.current.focus()
    }

    command()
    onCommand()
    updateActiveStates()
  }, [disabled, editorRef, onCommand, updateActiveStates])

  return (
    <div
      className="flex items-center gap-1 mb-2 p-2 border border-input rounded-md bg-muted/30"
      // Prevent toolbar clicks from stealing focus so selection remains intact
      onMouseDown={(e) => e.preventDefault()}
    >
      {/* Bold */}
      <Button
        type="button"
        variant={activeFormats.bold ? 'default' : 'ghost'}
        size="sm"
        onClick={() => handleFormat(toggleBold)}
        disabled={disabled}
        className="h-8 w-8 p-0"
        title="Bold (Ctrl+B)"
      >
        <Bold className="h-4 w-4" />
      </Button>

      {/* Italic */}
      <Button
        type="button"
        variant={activeFormats.italic ? 'default' : 'ghost'}
        size="sm"
        onClick={() => handleFormat(toggleItalic)}
        disabled={disabled}
        className="h-8 w-8 p-0"
        title="Italic (Ctrl+I)"
      >
        <Italic className="h-4 w-4" />
      </Button>

      {/* Underline */}
      <Button
        type="button"
        variant={activeFormats.underline ? 'default' : 'ghost'}
        size="sm"
        onClick={() => handleFormat(toggleUnderline)}
        disabled={disabled}
        className="h-8 w-8 p-0"
        title="Underline (Ctrl+U)"
      >
        <Underline className="h-4 w-4" />
      </Button>

      {/* Divider */}
      <div className="w-px h-6 bg-border mx-1" />

      {/* Bullet list */}
      <Button
        type="button"
        variant={activeFormats.bulletList ? 'default' : 'ghost'}
        size="sm"
        onClick={() => handleFormat(insertBulletList)}
        disabled={disabled}
        className="h-8 w-8 p-0"
        title="Bullet List"
      >
        <List className="h-4 w-4" />
      </Button>

      {/* Numbered list */}
      <Button
        type="button"
        variant={activeFormats.numberedList ? 'default' : 'ghost'}
        size="sm"
        onClick={() => handleFormat(insertNumberedList)}
        disabled={disabled}
        className="h-8 w-8 p-0"
        title="Numbered List"
      >
        <ListOrdered className="h-4 w-4" />
      </Button>
    </div>
  )
}
