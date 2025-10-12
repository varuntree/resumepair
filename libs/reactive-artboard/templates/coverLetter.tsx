import * as React from 'react'
import type { ArtboardRichTextBlock, ArtboardSection } from '../types'
import { FlowRoot } from '../components/FlowRoot'
import { FlowItem } from '../components/FlowItem'

export function CoverLetterTemplate({ document }: { document?: any }): React.ReactElement {
  if (!document) return <div />
  const sender = findCustomSection(document.sections, 'sender')
  const meta = findCustomSection(document.sections, 'meta')
  const recipient = findCustomSection(document.sections, 'recipient')
  const body = findSummarySection(document.sections, 'body')
  const closing = findCustomSection(document.sections, 'closing')

  return (
    <FlowRoot className="artboard-page artboard-template-cover-letter" data-template="cover-letter">
      <FlowItem as="header" className="cover-letter-header" splittable={false}>
        <div className="cover-letter-sender">
          {renderCustomBlocks(sender)}
        </div>
        <div className="cover-letter-meta">
          {renderCustomBlocks(meta)}
        </div>
      </FlowItem>

      {recipient && (
        <FlowItem as="section" className="cover-letter-recipient" splittable={false}>
          {renderCustomBlocks(recipient)}
        </FlowItem>
      )}

      <FlowItem as="section" className="cover-letter-body" splittable={true}>
        {document.profile.summary && (
          <p
            className="cover-letter-salutation"
            data-flow-subitem="true"
            data-flow-subitem-index={0}
          >
            {document.profile.summary}
          </p>
        )}
        {body?.blocks.map((block, index) => (
          <div
            key={index}
            data-flow-subitem="true"
            data-flow-subitem-index={document.profile.summary ? index + 1 : index}
          >
            {renderBodyBlock(block)}
          </div>
        ))}
      </FlowItem>

      {closing && (
        <FlowItem as="section" className="cover-letter-closing" splittable={false}>
          {renderCustomBlocks(closing)}
        </FlowItem>
      )}
    </FlowRoot>
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

function renderBodyBlock(block: ArtboardRichTextBlock): React.ReactElement {
  if (block.type === 'list') {
    return (
      <ul className="cover-letter-list">
        {block.content.map((item, idx) => (
          <li key={idx}>{item}</li>
        ))}
      </ul>
    )
  }

  return (
    <p className="cover-letter-paragraph">
      {block.content.join(' ')}
    </p>
  )
}
