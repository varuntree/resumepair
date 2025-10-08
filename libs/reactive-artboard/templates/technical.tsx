import * as React from 'react'
import type { ArtboardDocument, ArtboardRichTextBlock, ArtboardSection } from '../types'

type TemplateProps = {
  document: ArtboardDocument
}

export function TechnicalTemplate({ document }: TemplateProps): React.ReactElement {
  const visibleSections = document.sections.filter((section) => section.visible)

  return (
    <div className="artboard-page artboard-template-technical" data-template="technical">
      <header className="technical-header">
        <div>
          <h1 className="technical-name">{document.profile.fullName}</h1>
          {document.profile.headline && <p className="technical-headline">{document.profile.headline}</p>}
        </div>
        <div className="technical-contact">
          {document.profile.email && <span>{document.profile.email}</span>}
          {document.profile.phone && <span>{document.profile.phone}</span>}
          {document.profile.location && <span>{document.profile.location}</span>}
          {(document.profile.links ?? []).map((link) => (
            <span key={link.url}>{link.label}</span>
          ))}
        </div>
      </header>

      <main className="technical-body">
        {visibleSections.map((section) => (
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
        <article className="technical-section">
          <SectionHeading>{section.title}</SectionHeading>
          {section.blocks.map(renderBlock)}
        </article>
      )
    case 'skills':
      return (
        <article className="technical-section">
          <SectionHeading>{section.title}</SectionHeading>
          <div className="technical-skills">
            {section.items.map((item) => (
              <div key={item.label} className="technical-skill">
                <span>{item.label}</span>
                {typeof item.level === 'number' && (
                  <div className="technical-skill-bar">
                    <div style={{ transform: `scaleX(${Math.max(0, Math.min(1, item.level / 5))})` }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </article>
      )
    case 'experience':
      return (
        <article className="technical-section">
          <SectionHeading>{section.title}</SectionHeading>
          <div className="technical-grid">
            {section.items.map((item) => (
              <div key={`${item.company}-${item.role}`} className="technical-card">
                <header>
                  <p className="technical-card-title">{item.role}</p>
                  <p className="technical-card-subtitle">{item.company}</p>
                  <p className="technical-card-meta">
                    {[item.location, formatDateRange(item.startDate, item.endDate)].filter(Boolean).join(' • ')}
                  </p>
                </header>
                {(item.summary ?? []).map(renderBlock)}
              </div>
            ))}
          </div>
        </article>
      )
    case 'education':
      return (
        <article className="technical-section">
          <SectionHeading>{section.title}</SectionHeading>
          <div className="technical-grid">
            {section.items.map((item) => (
              <div key={`${item.school}-${item.degree}`} className="technical-card">
                <p className="technical-card-title">{item.degree}</p>
                <p className="technical-card-subtitle">{item.school}</p>
                <p className="technical-card-meta">{formatDateRange(item.startDate, item.endDate)}</p>
                {(item.summary ?? []).map(renderBlock)}
              </div>
            ))}
          </div>
        </article>
      )
    case 'custom':
      return (
        <article className="technical-section">
          <SectionHeading>{section.title}</SectionHeading>
          {section.blocks.map(renderBlock)}
        </article>
      )
    default:
      return null
  }
}

function SectionHeading({ children }: { children: React.ReactNode }): React.ReactElement {
  return <h2 className="technical-section-heading">{children}</h2>
}

function renderBlock(block: ArtboardRichTextBlock, index: number): React.ReactElement {
  if (block.type === 'list') {
    return (
      <ul key={index} className="technical-list">
        {block.content.map((item, idx) => (
          <li key={idx}>{item}</li>
        ))}
      </ul>
    )
  }

  return (
    <p key={index} className="technical-paragraph">
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
