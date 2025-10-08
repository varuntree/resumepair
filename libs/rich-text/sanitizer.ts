/**
 * HTML Sanitization for Cover Letter Rich Text
 *
 * Two-layer defense: client-side sanitization (UX) + server-side validation (security).
 * Uses isomorphic-dompurify for both client and server (Edge runtime compatible).
 *
 * Pattern: Shared configuration ensures consistency across client and server.
 *
 * @module libs/rich-text/sanitizer
 */

import DOMPurify from 'isomorphic-dompurify'

/**
 * Cover letter HTML sanitization config
 *
 * Allowed tags: Basic formatting + lists only
 * No attributes needed (formatting via marks in RichTextBlock)
 * No links or embedded content for security
 */
export const COVER_LETTER_SANITIZE_CONFIG = {
  // Allow both semantic and legacy tags produced by execCommand
  ALLOWED_TAGS: ['p', 'strong', 'em', 'u', 'b', 'i', 'ul', 'ol', 'li', 'br'],
  ALLOWED_ATTR: [],
  KEEP_CONTENT: true, // Preserve text when stripping tags
  RETURN_DOM: false, // Return string, not DOM
  RETURN_DOM_FRAGMENT: false,
  RETURN_DOM_IMPORT: false,
  FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'style', 'link'],
  FORBID_ATTR: ['onclick', 'onerror', 'onload', 'onmouseover', 'href', 'src'],
}

/**
 * Sanitize HTML for cover letter content
 *
 * @param html - Potentially unsafe HTML string
 * @returns Sanitized HTML with only allowed tags/attributes
 *
 * @example
 * ```typescript
 * // Client-side (ContentEditable onChange)
 * const sanitized = sanitizeCoverLetterHtml(editorRef.current.innerHTML)
 *
 * // Server-side (API route validation)
 * const sanitized = sanitizeCoverLetterHtml(userInput)
 * ```
 */
export function sanitizeCoverLetterHtml(html: string): string {
  return DOMPurify.sanitize(html, COVER_LETTER_SANITIZE_CONFIG)
}

/**
 * Check if HTML is already safe (no changes after sanitization)
 *
 * @param html - HTML string to check
 * @returns True if HTML is safe, false if sanitization modified it
 *
 * @example
 * ```typescript
 * if (!isSafeHtml(userInput)) {
 *   console.warn('User input contained unsafe content')
 * }
 * ```
 */
export function isSafeHtml(html: string): boolean {
  const sanitized = sanitizeCoverLetterHtml(html)
  return sanitized === html
}

/**
 * Sanitize clipboard data from paste events
 *
 * Handles paste from:
 * - Microsoft Word (removes proprietary CSS)
 * - Google Docs (removes spans and styles)
 * - Web pages (removes scripts, iframes, etc.)
 *
 * @param clipboardData - DataTransfer from paste event
 * @returns Sanitized HTML or plain text
 *
 * @example
 * ```typescript
 * const handlePaste = (e: React.ClipboardEvent) => {
 *   e.preventDefault()
 *   const sanitized = sanitizeClipboardData(e.clipboardData)
 *   document.execCommand('insertHTML', false, sanitized)
 * }
 * ```
 */
export function sanitizeClipboardData(clipboardData: DataTransfer): string {
  // Prefer HTML if available (preserves basic formatting)
  const htmlData = clipboardData.getData('text/html')
  const plainText = clipboardData.getData('text/plain')

  const rawContent = htmlData || plainText

  // Sanitize (strips Word CSS, Google Docs spans, etc.)
  return sanitizeCoverLetterHtml(rawContent)
}
