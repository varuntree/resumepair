import * as React from 'react'
import type { ArtboardDocument, ArtboardRichTextBlock, ArtboardSection } from '../types'

type TemplateProps = {
  document: ArtboardDocument
}

export function CreativeTemplate({ document }: TemplateProps): React.ReactElement {
  const visibleSections = document.sections.filter((section) => section.visible)
  const primarySections = visibleSections.filter(
    (section) => section.type === 'experience' || section.type === 'custom'
  )
  const secondarySections = visibleSections.filter((section) => section.type !== 'experience' && section.type !== 'custom')

  return (
    <div className="artboard-page artboard-template-creative" data-template="creative">
      <div className="creative-layout">
        <aside className="creative-sidebar">
          <div className="creative-profile">
            <h1 className="creative-name">{document.profile.fullName}</h1>
            {document.profile.headline && <p className="creative-headline">{document.profile.headline}</p>}
          </div>
          <div className="creative-contact">
            {document.profile.email && <span>{document.profile.email}</span>}
            {document.profile.phone && <span>{document.profile.phone}</span>}
            {document.profile.location && <span>{document.profile.location}</span>}
            {(document.profile.links ?? []).map((link) => (
              <span key={link.url}>{link.label}</span>
            ))}
          </div>

          {secondarySections.map((section) => (
            <article key={section.id} className="creative-section">
              <SectionHeading>{section.title}</SectionHeading>
              {renderSection(section)}
            </article>
          ))}
        </aside>

        <main className="creative-main">
          {primarySections.map((section) => (
            <article key={section.id} className="creative-main-section">
              <SectionHeading>{section.title}</SectionHeading>
              {renderSection(section)}
            </article>
          ))}
        </main>
      </div>
    </div>
  )
}

function SectionHeading({ children }: { children: React.ReactNode }): React.ReactElement {
  return <h2 className="creative-section-heading">{children}</h2>
}

function renderSection(section: ArtboardSection): React.ReactElement {
  switch (section.type) {
    case 'summary':
      return (
        <div className="creative-summary">
          {section.blocks.map((block, index) => (
            <p key={index}>{block.content.join(' ')}</p>
          ))}
        </div>
      )
    case 'skills':
      return (
        <ul className="creative-skill-list">
          {section.items.map((item) => (
            <li key={item.label}>
              <span>{item.label}</span>
              {typeof item.level === 'number' && (
                <div className="creative-badge" aria-hidden>
                  {`${item.level}/5`}
                </div>
              )}
            </li>
          ))}
        </ul>
      )
    case 'experience':
      return (
        <div className="creative-timeline">
          {section.items.map((item) => (
            <div key={`${item.company}-${item.role}`} className="creative-timeline-item">
              <header>
                <div>
                  <p className="creative-timeline-role">{item.role}</p>
                  <p className="creative-timeline-company">{item.company}</p>
                </div>
                <span className="creative-timeline-meta">
                  {[item.location, formatDateRange(item.startDate, item.endDate)].filter(Boolean).join(' • ')}
                </span>
              </header>
              {(item.summary ?? []).map(renderBlock)}
            </div>
          ))}
        </div>
      )
    case 'education':
      return (
        <div className="creative-education">
          {section.items.map((item) => (
            <div key={`${item.school}-${item.degree}`}>
              <p className="creative-education-degree">{item.degree}</p>
              <p className="creative-education-school">{item.school}</p>
              <p className="creative-education-meta">{formatDateRange(item.startDate, item.endDate)}</p>
              {(item.summary ?? []).map(renderBlock)}
            </div>
          ))}
        </div>
      )
    case 'custom':
      return (
        <div className="creative-custom">
          {section.blocks.map(renderBlock)}
        </div>
      )
    default:
      return <></>
  }
}

function renderBlock(block: ArtboardRichTextBlock, index: number): React.ReactElement {
  if (block.type === 'list') {
    return (
      <ul key={index} className="creative-list">
        {block.content.map((item, idx) => (
          <li key={idx}>{item}</li>
        ))}
      </ul>
    )
  }

  return (
    <p key={index} className="creative-paragraph">
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
