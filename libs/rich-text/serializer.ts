/**
 * HTML ↔ RichTextBlock Serialization
 *
 * Converts between HTML strings (ContentEditable) and structured RichTextBlock[] format.
 * Used for:
 * - Editor onChange: HTML → RichTextBlock[]
 * - Editor setValue: RichTextBlock[] → HTML
 * - Template rendering: RichTextBlock[] → React elements
 *
 * @module libs/rich-text/serializer
 */

import type { RichTextBlock, TextRun } from '@/types/cover-letter'
import { sanitizeCoverLetterHtml } from './sanitizer'

/**
 * Parse HTML string to RichTextBlock[] structure
 *
 * @param html - HTML string from ContentEditable
 * @returns Array of rich text blocks
 *
 * @example
 * ```typescript
 * const blocks = parseHtmlToBlocks('<p>Hello <strong>world</strong></p>')
 * // [{ type: 'paragraph', content: [
 * //   { text: 'Hello ', marks: [] },
 * //   { text: 'world', marks: ['bold'] }
 * // ]}]
 * ```
 */
export function parseHtmlToBlocks(html: string): RichTextBlock[] {
  // Sanitize first
  const sanitized = sanitizeCoverLetterHtml(html)

  // Parse HTML
  const parser = new DOMParser()
  const doc = parser.parseFromString(sanitized, 'text/html')
  const blocks: RichTextBlock[] = []

  // Process each block-level element
  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_ELEMENT)

  let node = walker.nextNode()
  while (node) {
    const element = node as Element
    const tagName = element.tagName.toLowerCase()

    if (tagName === 'p') {
      blocks.push({
        type: 'paragraph',
        content: parseInlineContent(element),
      })
    } else if (tagName === 'ul') {
      blocks.push({
        type: 'bullet_list',
        content: parseListContent(element),
      })
    } else if (tagName === 'ol') {
      blocks.push({
        type: 'numbered_list',
        content: parseListContent(element),
      })
    }

    node = walker.nextNode()
  }

  // Fallback: If no blocks parsed, create single paragraph
  if (blocks.length === 0 && sanitized.trim().length > 0) {
    blocks.push({
      type: 'paragraph',
      content: [{ text: sanitized.trim() }],
    })
  }

  return blocks
}

/**
 * Parse inline content (text runs with marks) from an element
 */
function parseInlineContent(element: Element): TextRun[] {
  const runs: TextRun[] = []
  // Use the element's ownerDocument to avoid WrongDocument errors
  const walker = (element.ownerDocument || document).createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT
  )

  let currentRun: TextRun | null = null
  let node = walker.nextNode()

  while (node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || ''
      if (text.trim().length > 0) {
        const marks = getMarksFromAncestors(node as Text)
        if (currentRun && arraysEqual(currentRun.marks || [], marks)) {
          // Continue current run
          currentRun.text += text
        } else {
          // Start new run
          if (currentRun) {
            runs.push(currentRun)
          }
          currentRun = { text, marks: marks.length > 0 ? marks : undefined }
        }
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element
      if (element.tagName.toLowerCase() === 'br') {
        // Handle <br> as newline placeholder
        if (currentRun) {
          runs.push(currentRun)
          currentRun = null
        }
        runs.push({ text: '\n' })
      }
    }

    node = walker.nextNode()
  }

  if (currentRun) {
    runs.push(currentRun)
  }

  return runs.length > 0 ? runs : [{ text: '' }]
}

/**
 * Get formatting marks from ancestor elements
 */
function getMarksFromAncestors(textNode: Text): ('bold' | 'italic' | 'underline')[] {
  const marks: ('bold' | 'italic' | 'underline')[] = []
  let parent = textNode.parentElement

  while (parent) {
    const tagName = parent.tagName.toLowerCase()
    if (tagName === 'strong' || tagName === 'b') marks.push('bold')
    if (tagName === 'em' || tagName === 'i') marks.push('italic')
    if (tagName === 'u') marks.push('underline')

    parent = parent.parentElement
  }

  return marks
}

/**
 * Parse list content (all <li> text combined into single text run)
 */
function parseListContent(listElement: Element): TextRun[] {
  const items = Array.from(listElement.querySelectorAll('li'))
  return items.map((li) => ({
    text: li.textContent || '',
  }))
}

/**
 * Convert RichTextBlock[] to HTML string
 *
 * @param blocks - Array of rich text blocks
 * @returns HTML string for ContentEditable
 *
 * @example
 * ```typescript
 * const html = blocksToHtml([{
 *   type: 'paragraph',
 *   content: [
 *     { text: 'Hello ', marks: [] },
 *     { text: 'world', marks: ['bold'] }
 *   ]
 * }])
 * // '<p>Hello <strong>world</strong></p>'
 * ```
 */
export function blocksToHtml(blocks: RichTextBlock[]): string {
  return blocks.map((block) => blockToHtml(block)).join('\n')
}

/**
 * Convert single RichTextBlock to HTML
 */
function blockToHtml(block: RichTextBlock): string {
  switch (block.type) {
    case 'paragraph':
      return `<p>${runsToHtml(block.content)}</p>`
    case 'bullet_list':
      return `<ul>${block.content.map((run) => `<li>${run.text}</li>`).join('')}</ul>`
    case 'numbered_list':
      return `<ol>${block.content.map((run) => `<li>${run.text}</li>`).join('')}</ol>`
    default:
      return ''
  }
}

/**
 * Convert TextRun[] to HTML
 */
function runsToHtml(runs: TextRun[]): string {
  return runs
    .map((run) => {
      let html = escapeHtml(run.text)

      // Apply marks (innermost first)
      if (run.marks?.includes('bold')) {
        html = `<strong>${html}</strong>`
      }
      if (run.marks?.includes('italic')) {
        html = `<em>${html}</em>`
      }
      if (run.marks?.includes('underline')) {
        html = `<u>${html}</u>`
      }

      return html
    })
    .join('')
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

/**
 * Compare two arrays for equality
 */
function arraysEqual<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) return false
  return a.every((val, idx) => val === b[idx])
}
