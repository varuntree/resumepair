import * as React from 'react'
import { ArtboardDocument, ArtboardRichTextBlock, ArtboardSection } from '../types'

type TemplateProps = {
  document: ArtboardDocument
}

export function OnyxTemplate({ document }: TemplateProps): React.ReactElement {
  return (
    <div className="artboard-page" data-template="onyx">
      <header className="artboard-header">
        <h1 className="artboard-name">{document.profile.fullName}</h1>
        {document.profile.headline && <p className="artboard-headline">{document.profile.headline}</p>}
        <div className="artboard-contact">
          {document.profile.email && <span>{document.profile.email}</span>}
          {document.profile.phone && <span>{document.profile.phone}</span>}
          {document.profile.location && <span>{document.profile.location}</span>}
          {(document.profile.links ?? []).map((link) => (
            <span key={link.url}>{link.label}</span>
          ))}
        </div>
      </header>

      <main className="artboard-sections">
        {document.sections.filter((section) => section.visible).map((section) => (
          <Section key={section.id} section={section} />
        ))}
      </main>
    </div>
  )
}

function Section({ section }: { section: ArtboardSection }): React.ReactElement | null {
  switch (section.type) {
    case 'summary':
      return (
        <article className="artboard-section">
          <SectionHeading>{section.title}</SectionHeading>
          {section.blocks.map(renderBlock)}
        </article>
      )
    case 'experience':
      return (
        <article className="artboard-section">
          <SectionHeading>{section.title}</SectionHeading>
          <div className="artboard-list">
            {section.items.map((item) => (
              <div key={`${item.company}-${item.role}`} className="artboard-list-item">
                <div className="artboard-list-item-header">
                  <span className="artboard-list-item-title">{item.role}</span>
                  <span className="artboard-list-item-subtitle">{item.company}</span>
                  <span className="artboard-list-item-meta">
                    {[item.location, formatDateRange(item.startDate, item.endDate)].filter(Boolean).join(' • ')}
                  </span>
                </div>
                {(item.summary ?? []).map(renderBlock)}
              </div>
            ))}
          </div>
        </article>
      )
    case 'education':
      return (
        <article className="artboard-section">
          <SectionHeading>{section.title}</SectionHeading>
          <div className="artboard-list">
            {section.items.map((item) => (
              <div key={`${item.school}-${item.degree}`} className="artboard-list-item">
                <div className="artboard-list-item-header">
                  <span className="artboard-list-item-title">{item.degree}</span>
                  <span className="artboard-list-item-subtitle">{item.school}</span>
                  <span className="artboard-list-item-meta">
                    {formatDateRange(item.startDate, item.endDate)}
                  </span>
                </div>
                {(item.summary ?? []).map(renderBlock)}
              </div>
            ))}
          </div>
        </article>
      )
    case 'skills':
      return (
        <article className="artboard-section">
          <SectionHeading>{section.title}</SectionHeading>
          <ul className="artboard-skill-grid">
            {section.items.map((item) => (
              <li key={item.label} className="artboard-skill">
                <span>{item.label}</span>
                {typeof item.level === 'number' && <span className="artboard-skill-level">{item.level}/5</span>}
              </li>
            ))}
          </ul>
        </article>
      )
    case 'custom':
      return (
        <article className="artboard-section">
          <SectionHeading>{section.title}</SectionHeading>
          {section.blocks.map(renderBlock)}
        </article>
      )
    default:
      return null
  }
}

function SectionHeading({ children }: { children: React.ReactNode }): React.ReactElement {
  return <h2 className="artboard-section-heading">{children}</h2>
}

function renderBlock(block: ArtboardRichTextBlock, index: number): React.ReactElement {
  if (block.type === 'list') {
    return (
      <ul key={index} className="artboard-bullets">
        {block.content.map((item, idx) => (
          <li key={idx}>{item}</li>
        ))}
      </ul>
    )
  }

  return (
    <p key={index} className="artboard-paragraph">
      {block.content.join(' ')}
    </p>
  )
}

function formatDateRange(start?: string, end?: string | null): string {
  if (!start && !end) return ''
  if (start && !end) return `${start} – Present`
  if (!start && end) return end ?? ''
  return `${start} – ${end ?? 'Present'}`
}
