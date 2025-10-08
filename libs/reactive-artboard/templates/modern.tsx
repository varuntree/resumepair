import * as React from 'react'
import type { ArtboardDocument, ArtboardRichTextBlock, ArtboardSection } from '../types'

type TemplateProps = {
  document: ArtboardDocument
}

export function ModernTemplate({ document }: TemplateProps): React.ReactElement {
  const visibleSections = document.sections.filter((section) => section.visible)
  const summarySections = visibleSections.filter(isSummarySection)
  const otherSections = visibleSections.filter((section) => section.type !== 'summary')

  return (
    <div className="artboard-page artboard-template-modern" data-template="modern">
      <header className="modern-header">
        <div>
          <h1 className="modern-name">{document.profile.fullName}</h1>
          {document.profile.headline && <p className="modern-headline">{document.profile.headline}</p>}
        </div>
        <div className="modern-contact">
          {document.profile.email && <span>{document.profile.email}</span>}
          {document.profile.phone && <span>{document.profile.phone}</span>}
          {document.profile.location && <span>{document.profile.location}</span>}
          {(document.profile.links ?? []).map((link) => (
            <span key={link.url}>{link.label}</span>
          ))}
        </div>
      </header>

      <main className="modern-body">
        <aside className="modern-aside">
          {summarySections.map((section) => (
            <article key={section.id} className="modern-card">
              <SectionHeading>{section.title}</SectionHeading>
              {section.blocks.map(renderBlock)}
            </article>
          ))}
          {visibleSections
            .filter(isSkillsSection)
            .map((section) => (
              <article key={section.id} className="modern-card">
                <SectionHeading>{section.title}</SectionHeading>
                <ul className="modern-skill-list">
                  {section.items.map((item) => (
                    <li key={item.label} className="modern-skill">
                      <span>{item.label}</span>
                      {typeof item.level === 'number' && (
                        <div className="modern-skill-meter" aria-hidden>
                          <div style={{ width: `${(item.level / 5) * 100}%` }} />
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
        </aside>

        <section className="modern-main">
          {otherSections
            .filter((section) => section.type !== 'skills')
            .map((section) => (
              <Section key={section.id} section={section} />
            ))}
        </section>
      </main>
    </div>
  )
}

function Section({ section }: { section: ArtboardSection }): React.ReactElement | null {
  switch (section.type) {
    case 'experience':
      return (
        <article className="modern-section">
          <SectionHeading>{section.title}</SectionHeading>
          <div className="modern-timeline">
            {section.items.map((item) => (
              <div key={`${item.company}-${item.role}`} className="modern-timeline-item">
                <div className="modern-timeline-header">
                  <div>
                    <p className="modern-timeline-role">{item.role}</p>
                    <p className="modern-timeline-company">{item.company}</p>
                  </div>
                  <span className="modern-timeline-meta">
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
        <article className="modern-section">
          <SectionHeading>{section.title}</SectionHeading>
          <div className="modern-grid">
            {section.items.map((item) => (
              <div key={`${item.school}-${item.degree}`} className="modern-grid-item">
                <p className="modern-grid-title">{item.degree}</p>
                <p className="modern-grid-subtitle">{item.school}</p>
                <p className="modern-grid-meta">{formatDateRange(item.startDate, item.endDate)}</p>
                {(item.summary ?? []).map(renderBlock)}
              </div>
            ))}
          </div>
        </article>
      )
    case 'custom':
      return (
        <article className="modern-section">
          <SectionHeading>{section.title}</SectionHeading>
          {section.blocks.map(renderBlock)}
        </article>
      )
    case 'summary':
    case 'skills':
      return null
    default:
      return null
  }
}

function SectionHeading({ children }: { children: React.ReactNode }): React.ReactElement {
  return <h2 className="modern-section-heading">{children}</h2>
}

function renderBlock(block: ArtboardRichTextBlock, index: number): React.ReactElement {
  if (block.type === 'list') {
    return (
      <ul key={index} className="modern-list">
        {block.content.map((item, idx) => (
          <li key={idx}>{item}</li>
        ))}
      </ul>
    )
  }

  return (
    <p key={index} className="modern-paragraph">
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

function isSummarySection(section: ArtboardSection): section is Extract<ArtboardSection, { type: 'summary' }> {
  return section.type === 'summary'
}

function isSkillsSection(section: ArtboardSection): section is Extract<ArtboardSection, { type: 'skills' }> {
  return section.type === 'skills'
}
