/**
 * Rich Text Editor Component
 *
 * ContentEditable-based rich text editor for cover letter body.
 * Features:
 * - Basic formatting (bold, italic, underline)
 * - Lists (bullets, numbered)
 * - Paste sanitization (Word/Google Docs)
 * - Auto-save integration (via onChange)
 *
 * Pattern: Controlled component with RichTextBlock[] value
 *
 * @module components/rich-text/RichTextEditor
 */

'use client'

import * as React from 'react'
import type { RichTextBlock } from '@/types/cover-letter'
import { blocksToHtml, parseHtmlToBlocks } from '@/libs/rich-text/serializer'
import { sanitizeClipboardData } from '@/libs/rich-text/sanitizer'
import { RichTextToolbar } from './RichTextToolbar'

export interface RichTextEditorProps {
  /** Current value as structured blocks */
  value: RichTextBlock[]
  /** Callback when content changes */
  // eslint-disable-next-line no-unused-vars
  onChange: (blocks: RichTextBlock[]) => void
  /** Optional placeholder text */
  placeholder?: string
  /** Optional className for styling */
  className?: string
  /** Disable editing */
  disabled?: boolean
}

/**
 * Rich text editor with toolbar
 *
 * @example
 * ```typescript
 * const [body, setBody] = useState<RichTextBlock[]>([])
 *
 * <RichTextEditor
 *   value={body}
 *   onChange={setBody}
 *   placeholder="Write your cover letter here..."
 * />
 * ```
 */
export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Start typing...',
  className = '',
  disabled = false,
}: RichTextEditorProps): React.ReactElement {
  const editorRef = React.useRef<HTMLDivElement>(null)
  const [isFocused, setIsFocused] = React.useState(false)

  // Initialize editor content
  React.useEffect(() => {
    if (editorRef.current && !isFocused) {
      const currentHtml = editorRef.current.innerHTML
      const valueHtml = blocksToHtml(value)

      // Only update if different to avoid cursor jumps
      if (currentHtml !== valueHtml) {
        editorRef.current.innerHTML = valueHtml
      }
    }
  }, [value, isFocused])

  /**
   * Handle input changes
   */
  const handleInput = React.useCallback(() => {
    if (!editorRef.current) return

    const html = editorRef.current.innerHTML
    const blocks = parseHtmlToBlocks(html)

    onChange(blocks)
  }, [onChange])

  /**
   * Handle paste events (sanitize clipboard data)
   */
  const handlePaste = React.useCallback((e: React.ClipboardEvent) => {
    e.preventDefault()

    const sanitized = sanitizeClipboardData(e.clipboardData)

    // Insert sanitized HTML at cursor
    document.execCommand('insertHTML', false, sanitized)

    // Trigger onChange
    handleInput()
  }, [handleInput])

  /**
   * Handle keyboard shortcuts
   */
  const handleKeyDown = React.useCallback((e: React.KeyboardEvent) => {
    // Ctrl/Cmd + B = Bold
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
      e.preventDefault()
      document.execCommand('bold', false)
      handleInput()
    }

    // Ctrl/Cmd + I = Italic
    if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
      e.preventDefault()
      document.execCommand('italic', false)
      handleInput()
    }

    // Ctrl/Cmd + U = Underline
    if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
      e.preventDefault()
      document.execCommand('underline', false)
      handleInput()
    }
  }, [handleInput])

  return (
    <div className={`relative ${className}`}>
      {/* Toolbar */}
      <RichTextToolbar
        editorRef={editorRef}
        onCommand={handleInput}
        disabled={disabled}
      />

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable={!disabled}
        onInput={handleInput}
        onPaste={handlePaste}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={`
          min-h-[300px] max-h-[600px] overflow-y-auto
          rounded-md border border-input
          bg-background px-4 py-3
          text-base leading-relaxed
          focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
          ${disabled ? 'cursor-not-allowed opacity-50' : ''}
          ${!value || value.length === 0 || (value.length === 1 && !value[0].content[0]?.text) ? 'empty' : ''}
        `}
        data-placeholder={placeholder}
        style={{
          // Placeholder styling (CSS-only, no JS)
          ['--placeholder-text' as any]: `"${placeholder}"`,
        }}
      />

      <style jsx>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: var(--muted-foreground);
          pointer-events: none;
        }

        [contenteditable] p {
          margin-bottom: var(--space-4);
        }

        [contenteditable] p:last-child {
          margin-bottom: 0;
        }

        [contenteditable] ul,
        [contenteditable] ol {
          margin-left: var(--space-6);
          margin-bottom: var(--space-4);
        }

        [contenteditable] li {
          margin-bottom: var(--space-2);
        }
      `}</style>
    </div>
  )
}
