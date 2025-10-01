/**
 * Minimal Resume Template
 *
 * Clean, whitespace-focused design for maximum readability.
 * Optimized for ATS parsing with semantic HTML.
 *
 * @module libs/templates/minimal/MinimalTemplate
 */

import React from 'react'
import { TemplateProps } from '@/types/template'
import { TemplateBase } from '../shared/TemplateBase'
import { TemplateSection } from '../shared/TemplateSection'
import { formatDateRange, formatPhone, formatUrl, formatAddress } from '../shared/TemplateUtils'
import {
  EmailIcon,
  PhoneIcon,
  LocationIcon,
  getIconForLinkType,
} from '../shared/TemplateIcons'
import './styles.css'

/**
 * Minimal Template Component
 *
 * Features:
 * - Clean, whitespace-focused layout
 * - No icons by default (can be enabled)
 * - Single column layout
 * - ATS-friendly semantic HTML
 * - Print-optimized
 */
const MinimalTemplate = React.memo(({ data, customizations, mode = 'preview' }: TemplateProps) => {
  const { profile, summary, work, education, projects, skills, certifications, awards, languages } =
    data

  const showIcons = customizations?.icons.enabled ?? false

  return (
    <TemplateBase className="minimal-template" customizations={customizations} mode={mode}>
      {/* Profile Header */}
      <header className="doc-header">
        <h1 className="doc-name">{profile.fullName}</h1>
        {profile.headline && <p className="doc-headline">{profile.headline}</p>}

        <div className="doc-contact">
          {profile.email && (
            <span className="doc-contact-item">
              {showIcons && <EmailIcon />}
              <a href={`mailto:${profile.email}`}>{profile.email}</a>
            </span>
          )}

          {profile.phone && (
            <span className="doc-contact-item">
              {showIcons && <PhoneIcon />}
              <span>{formatPhone(profile.phone)}</span>
            </span>
          )}

          {profile.location && (
            <span className="doc-contact-item">
              {showIcons && <LocationIcon />}
              <span>{formatAddress(profile.location)}</span>
            </span>
          )}

          {profile.links &&
            profile.links.map((link, idx) => {
              const IconComponent = getIconForLinkType(link.type)
              return (
                <span key={idx} className="doc-contact-item">
                  {showIcons && <IconComponent />}
                  <a href={link.url} target="_blank" rel="noopener noreferrer">
                    {link.label || formatUrl(link.url)}
                  </a>
                </span>
              )
            })}
        </div>
      </header>

      {/* Summary */}
      {summary && (
        <TemplateSection title="Summary">
          <p className="doc-summary">{summary}</p>
        </TemplateSection>
      )}

      {/* Work Experience */}
      {work && work.length > 0 && (
        <TemplateSection title="Experience">
          {work.map((job, idx) => (
            <article key={idx} className="doc-work-item">
              <div className="doc-work-header">
                <h3 className="doc-work-role">{job.role}</h3>
                <span className="doc-work-company">{job.company}</span>
              </div>

              <div className="doc-work-meta">
                <span className="doc-work-dates">
                  {formatDateRange(job.startDate, job.endDate)}
                </span>
                {job.location && <span className="doc-work-location">{job.location}</span>}
              </div>

              {job.descriptionBullets && job.descriptionBullets.length > 0 && (
                <ul className="doc-work-bullets">
                  {job.descriptionBullets.map((bullet, i) => (
                    <li key={i}>{bullet}</li>
                  ))}
                </ul>
              )}

              {job.achievements && job.achievements.length > 0 && (
                <ul className="doc-work-achievements">
                  {job.achievements.map((achievement, i) => (
                    <li key={i}>{achievement}</li>
                  ))}
                </ul>
              )}

              {job.techStack && job.techStack.length > 0 && (
                <div className="doc-tech-stack">
                  <span className="doc-tech-label">Tech:</span>
                  <span className="doc-tech-items">{job.techStack.join(', ')}</span>
                </div>
              )}
            </article>
          ))}
        </TemplateSection>
      )}

      {/* Education */}
      {education && education.length > 0 && (
        <TemplateSection title="Education">
          {education.map((edu, idx) => (
            <article key={idx} className="doc-education-item">
              <div className="doc-education-header">
                <h3 className="doc-education-degree">{edu.degree}</h3>
                <span className="doc-education-school">{edu.school}</span>
              </div>

              <div className="doc-education-meta">
                {edu.field && <span className="doc-education-field">{edu.field}</span>}
                {(edu.startDate || edu.endDate) && (
                  <span className="doc-education-dates">
                    {formatDateRange(edu.startDate, edu.endDate)}
                  </span>
                )}
              </div>

              {edu.details && edu.details.length > 0 && (
                <ul className="doc-education-details">
                  {edu.details.map((detail, i) => (
                    <li key={i}>{detail}</li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </TemplateSection>
      )}

      {/* Projects */}
      {projects && projects.length > 0 && (
        <TemplateSection title="Projects">
          {projects.map((project, idx) => (
            <article key={idx} className="doc-project-item">
              <div className="doc-project-header">
                <h3 className="doc-project-name">{project.name}</h3>
                {project.link && (
                  <a
                    href={project.link}
                    className="doc-project-link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {formatUrl(project.link)}
                  </a>
                )}
              </div>

              {project.summary && <p className="doc-project-summary">{project.summary}</p>}

              {project.bullets && project.bullets.length > 0 && (
                <ul className="doc-project-bullets">
                  {project.bullets.map((bullet, i) => (
                    <li key={i}>{bullet}</li>
                  ))}
                </ul>
              )}

              {project.techStack && project.techStack.length > 0 && (
                <div className="doc-tech-stack">
                  <span className="doc-tech-label">Tech:</span>
                  <span className="doc-tech-items">{project.techStack.join(', ')}</span>
                </div>
              )}
            </article>
          ))}
        </TemplateSection>
      )}

      {/* Skills */}
      {skills && skills.length > 0 && (
        <TemplateSection title="Skills">
          {skills.map((skillGroup, idx) => (
            <div key={idx} className="doc-skill-group">
              <span className="doc-skill-category">{skillGroup.category}:</span>
              <span className="doc-skill-items">{skillGroup.items.join(', ')}</span>
            </div>
          ))}
        </TemplateSection>
      )}

      {/* Certifications */}
      {certifications && certifications.length > 0 && (
        <TemplateSection title="Certifications">
          {certifications.map((cert, idx) => (
            <div key={idx} className="doc-certification-item">
              <span className="doc-certification-name">{cert.name}</span>
              <span className="doc-certification-issuer"> - {cert.issuer}</span>
              {cert.date && <span className="doc-certification-date"> ({cert.date})</span>}
            </div>
          ))}
        </TemplateSection>
      )}

      {/* Awards */}
      {awards && awards.length > 0 && (
        <TemplateSection title="Awards">
          {awards.map((award, idx) => (
            <div key={idx} className="doc-award-item">
              <div className="doc-award-header">
                <span className="doc-award-name">{award.name}</span>
                <span className="doc-award-org"> - {award.org}</span>
                {award.date && <span className="doc-award-date"> ({award.date})</span>}
              </div>
              {award.summary && <p className="doc-award-summary">{award.summary}</p>}
            </div>
          ))}
        </TemplateSection>
      )}

      {/* Languages */}
      {languages && languages.length > 0 && (
        <TemplateSection title="Languages">
          <div className="doc-languages">
            {languages.map((lang, idx) => (
              <span key={idx} className="doc-language-item">
                {lang.name} ({lang.level})
                {idx < languages.length - 1 && ', '}
              </span>
            ))}
          </div>
        </TemplateSection>
      )}
    </TemplateBase>
  )
})

MinimalTemplate.displayName = 'MinimalTemplate'

export default MinimalTemplate
