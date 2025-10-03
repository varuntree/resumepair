/**
 * Rich Text Editor Commands
 *
 * Commands for formatting text in ContentEditable editor.
 * Uses document.execCommand for browser compatibility.
 *
 * @module libs/rich-text/commands
 */

/**
 * Apply bold formatting to selection
 */
export function toggleBold(): void {
  document.execCommand('bold', false)
}

/**
 * Apply italic formatting to selection
 */
export function toggleItalic(): void {
  document.execCommand('italic', false)
}

/**
 * Apply underline formatting to selection
 */
export function toggleUnderline(): void {
  document.execCommand('underline', false)
}

/**
 * Insert bullet list
 */
export function insertBulletList(): void {
  document.execCommand('insertUnorderedList', false)
}

/**
 * Insert numbered list
 */
export function insertNumberedList(): void {
  document.execCommand('insertOrderedList', false)
}

/**
 * Insert line break
 */
export function insertLineBreak(): void {
  document.execCommand('insertLineBreak', false)
}

/**
 * Check if formatting is active at current selection
 */
export function isFormatActive(format: 'bold' | 'italic' | 'underline'): boolean {
  try {
    return document.queryCommandState(format)
  } catch {
    return false
  }
}

/**
 * Check if list is active at current selection
 */
export function isListActive(listType: 'bullet' | 'numbered'): boolean {
  try {
    const command = listType === 'bullet' ? 'insertUnorderedList' : 'insertOrderedList'
    return document.queryCommandState(command)
  } catch {
    return false
  }
}

/**
 * Get selection range
 */
export function getSelection(): Selection | null {
  return window.getSelection()
}

/**
 * Restore selection range
 */
export function restoreSelection(range: Range): void {
  const selection = window.getSelection()
  if (selection) {
    selection.removeAllRanges()
    selection.addRange(range)
  }
}

/**
 * Save current selection
 */
export function saveSelection(): Range | null {
  const selection = window.getSelection()
  if (selection && selection.rangeCount > 0) {
    return selection.getRangeAt(0)
  }
  return null
}
