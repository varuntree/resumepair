import * as React from 'react'
import type { ArtboardDocument, ArtboardRichTextBlock, ArtboardSection } from '../types'

type TemplateProps = {
  document: ArtboardDocument
}

export function CoverLetterTemplate({ document }: TemplateProps): React.ReactElement {
  const sender = findCustomSection(document.sections, 'sender')
  const meta = findCustomSection(document.sections, 'meta')
  const recipient = findCustomSection(document.sections, 'recipient')
  const body = findSummarySection(document.sections, 'body')
  const closing = findCustomSection(document.sections, 'closing')

  return (
    <div className="artboard-page artboard-template-cover-letter" data-template="cover-letter">
      <header className="cover-letter-header">
        <div className="cover-letter-sender">
          {renderCustomBlocks(sender)}
        </div>
        <div className="cover-letter-meta">
          {renderCustomBlocks(meta)}
        </div>
      </header>

      {recipient && (
        <section className="doc-avoid-break cover-letter-recipient">
          {renderCustomBlocks(recipient)}
        </section>
      )}

      <section className="doc-avoid-break cover-letter-body">
        {document.profile.summary && (
          <p className="cover-letter-salutation">{document.profile.summary}</p>
        )}
        {body?.blocks.map((block, index) => renderBodyBlock(block, index))}
      </section>

      {closing && (
        <section className="doc-avoid-break cover-letter-closing">
          {renderCustomBlocks(closing)}
        </section>
      )}
    </div>
  )
}

function findCustomSection(sections: ArtboardSection[], id: string) {
  return sections.find(
    (section): section is Extract<ArtboardSection, { type: 'custom' }> =>
      section.id === id && section.type === 'custom' && section.visible
  )
}

function findSummarySection(sections: ArtboardSection[], id: string) {
  return sections.find(
    (section): section is Extract<ArtboardSection, { type: 'summary' }> =>
      section.id === id && section.type === 'summary' && section.visible
  )
}

function renderCustomBlocks(section?: Extract<ArtboardSection, { type: 'custom' }>) {
  if (!section) return null

  return section.blocks.map((block, index) => (
    <p key={index} className="cover-letter-text">
      {block.content.join(' ')}
    </p>
  ))
}

function renderBodyBlock(block: ArtboardRichTextBlock, index: number): React.ReactElement {
  if (block.type === 'list') {
    return (
      <ul key={index} className="cover-letter-list">
        {block.content.map((item, idx) => (
          <li key={idx}>{item}</li>
        ))}
      </ul>
    )
  }

  return (
    <p key={index} className="cover-letter-paragraph">
      {block.content.join(' ')}
    </p>
  )
}
