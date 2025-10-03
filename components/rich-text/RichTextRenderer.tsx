/**
 * Rich Text Renderer Component
 *
 * Renders RichTextBlock[] as React elements for preview and export.
 * Used in:
 * - Cover letter templates (preview + PDF export)
 * - Cover letter preview panels
 *
 * Pattern: Pure rendering component (no state)
 *
 * @module components/rich-text/RichTextRenderer
 */

import * as React from 'react'
import type { RichTextBlock, TextRun } from '@/types/cover-letter'

export interface RichTextRendererProps {
  /** Structured blocks to render */
  blocks: RichTextBlock[]
  /** Optional className for container */
  className?: string
}

/**
 * Render RichTextBlock[] as React elements
 *
 * @example
 * ```typescript
 * <RichTextRenderer blocks={coverLetter.body} />
 * ```
 */
export function RichTextRenderer({
  blocks,
  className = '',
}: RichTextRendererProps): React.ReactElement {
  return (
    <div className={className}>
      {blocks.map((block, idx) => (
        <BlockRenderer key={idx} block={block} />
      ))}
    </div>
  )
}

/**
 * Render a single RichTextBlock
 */
function BlockRenderer({ block }: { block: RichTextBlock }): React.ReactElement {
  switch (block.type) {
    case 'paragraph':
      return (
        <p className="mb-4 last:mb-0">
          {block.content.map((run, idx) => (
            <TextRunRenderer key={idx} run={run} />
          ))}
        </p>
      )

    case 'bullet_list':
      return (
        <ul className="list-disc ml-6 mb-4 last:mb-0">
          {block.content.map((run, idx) => (
            <li key={idx} className="mb-2 last:mb-0">
              {run.text}
            </li>
          ))}
        </ul>
      )

    case 'numbered_list':
      return (
        <ol className="list-decimal ml-6 mb-4 last:mb-0">
          {block.content.map((run, idx) => (
            <li key={idx} className="mb-2 last:mb-0">
              {run.text}
            </li>
          ))}
        </ol>
      )

    default:
      return <></>
  }
}

/**
 * Render a single TextRun with formatting marks
 */
function TextRunRenderer({ run }: { run: TextRun }): React.ReactElement {
  let element: React.ReactElement = <span>{run.text}</span>

  // Apply marks (outer to inner: bold → italic → underline)
  if (run.marks?.includes('underline')) {
    element = <u>{element}</u>
  }
  if (run.marks?.includes('italic')) {
    element = <em>{element}</em>
  }
  if (run.marks?.includes('bold')) {
    element = <strong>{element}</strong>
  }

  return element
}
