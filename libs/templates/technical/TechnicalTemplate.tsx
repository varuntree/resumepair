/**
 * Technical Resume Template
 *
 * Code-focused design with monospace accents and technical aesthetics.
 * Optimized for developers, engineers, and technical professionals.
 *
 * @module libs/templates/technical/TechnicalTemplate
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
 * Technical Template Component
 *
 * Features:
 * - Monospace font for technical feel
 * - Code block styling for tech stacks
 * - Clean, structured layout
 * - Icons with technical styling
 * - ATS-friendly semantic HTML
 */
const TechnicalTemplate = React.memo(({ data, customizations, mode = 'preview' }: TemplateProps) => {
  const { profile, summary, work, education, projects, skills, certifications, awards, languages } =
    data

  const showIcons = customizations?.icons.enabled ?? true

  return (
    <TemplateBase className="technical-template" customizations={customizations} mode={mode}>
      {/* Profile Header */}
      <header className="tech-header">
        <div className="tech-header-top">
          <h1 className="tech-name">
            <span className="tech-name-prefix">$</span> {profile.fullName}
          </h1>
          {profile.headline && <p className="tech-headline">{'// '}{profile.headline}</p>}
        </div>

        <div className="tech-contact">
          {profile.email && (
            <span className="tech-contact-item">
              {showIcons && <EmailIcon />}
              <a href={`mailto:${profile.email}`}>{profile.email}</a>
            </span>
          )}

          {profile.phone && (
            <span className="tech-contact-item">
              {showIcons && <PhoneIcon />}
              <span>{formatPhone(profile.phone)}</span>
            </span>
          )}

          {profile.location && (
            <span className="tech-contact-item">
              {showIcons && <LocationIcon />}
              <span>{formatAddress(profile.location)}</span>
            </span>
          )}

          {profile.links &&
            profile.links.map((link, idx) => {
              const IconComponent = getIconForLinkType(link.type)
              return (
                <span key={idx} className="tech-contact-item">
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
        <TemplateSection title="About" className="tech-section">
          <p className="tech-summary">{summary}</p>
        </TemplateSection>
      )}

      {/* Skills (top section for technical resumes) */}
      {skills && skills.length > 0 && (
        <TemplateSection title="Technical Skills" className="tech-section">
          <div className="tech-skills-grid">
            {skills.map((skillGroup, idx) => (
              <div key={idx} className="tech-skill-group">
                <span className="tech-skill-category">{skillGroup.category}</span>
                <div className="tech-skill-tags">
                  {skillGroup.items.map((skill, i) => (
                    <span key={i} className="tech-skill-tag">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </TemplateSection>
      )}

      {/* Work Experience */}
      {work && work.length > 0 && (
        <TemplateSection title="Experience" className="tech-section">
          {work.map((job, idx) => (
            <article key={idx} className="tech-work-item">
              <div className="tech-work-header">
                <div className="tech-work-title">
                  <h3 className="tech-work-role">{job.role}</h3>
                  <span className="tech-work-company">@ {job.company}</span>
                </div>
                <div className="tech-work-meta">
                  <span className="tech-work-dates">
                    {formatDateRange(job.startDate, job.endDate)}
                  </span>
                  {job.location && (
                    <span className="tech-work-location">
                      <span className="tech-meta-separator">|</span>
                      {job.location}
                    </span>
                  )}
                </div>
              </div>

              {job.descriptionBullets && job.descriptionBullets.length > 0 && (
                <ul className="tech-work-bullets">
                  {job.descriptionBullets.map((bullet, i) => (
                    <li key={i}>{bullet}</li>
                  ))}
                </ul>
              )}

              {job.achievements && job.achievements.length > 0 && (
                <ul className="tech-work-achievements">
                  {job.achievements.map((achievement, i) => (
                    <li key={i}>
                      <span className="tech-achievement-bullet">{'>'}</span> {achievement}
                    </li>
                  ))}
                </ul>
              )}

              {job.techStack && job.techStack.length > 0 && (
                <div className="tech-stack-block">
                  <span className="tech-stack-label">Technologies:</span>
                  <code className="tech-stack-code">{job.techStack.join(' · ')}</code>
                </div>
              )}
            </article>
          ))}
        </TemplateSection>
      )}

      {/* Projects */}
      {projects && projects.length > 0 && (
        <TemplateSection title="Projects" className="tech-section">
          {projects.map((project, idx) => (
            <article key={idx} className="tech-project-item">
              <div className="tech-project-header">
                <h3 className="tech-project-name">
                  <span className="tech-project-bracket">{'{'}</span>
                  {project.name}
                  <span className="tech-project-bracket">{'}'}</span>
                </h3>
                {project.link && (
                  <a
                    href={project.link}
                    className="tech-project-link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {formatUrl(project.link)}
                  </a>
                )}
              </div>

              {project.summary && <p className="tech-project-summary">{project.summary}</p>}

              {project.bullets && project.bullets.length > 0 && (
                <ul className="tech-project-bullets">
                  {project.bullets.map((bullet, i) => (
                    <li key={i}>{bullet}</li>
                  ))}
                </ul>
              )}

              {project.techStack && project.techStack.length > 0 && (
                <div className="tech-stack-block">
                  <span className="tech-stack-label">Stack:</span>
                  <code className="tech-stack-code">{project.techStack.join(' · ')}</code>
                </div>
              )}
            </article>
          ))}
        </TemplateSection>
      )}

      {/* Education */}
      {education && education.length > 0 && (
        <TemplateSection title="Education" className="tech-section">
          {education.map((edu, idx) => (
            <article key={idx} className="tech-education-item">
              <div className="tech-education-header">
                <h3 className="tech-education-degree">{edu.degree}</h3>
                <span className="tech-education-school">@ {edu.school}</span>
              </div>

              <div className="tech-education-meta">
                {edu.field && <span className="tech-education-field">{edu.field}</span>}
                {(edu.startDate || edu.endDate) && (
                  <>
                    {edu.field && <span className="tech-meta-separator">|</span>}
                    <span className="tech-education-dates">
                      {formatDateRange(edu.startDate, edu.endDate)}
                    </span>
                  </>
                )}
              </div>

              {edu.details && edu.details.length > 0 && (
                <ul className="tech-education-details">
                  {edu.details.map((detail, i) => (
                    <li key={i}>{detail}</li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </TemplateSection>
      )}

      {/* Certifications */}
      {certifications && certifications.length > 0 && (
        <TemplateSection title="Certifications" className="tech-section">
          <div className="tech-cert-grid">
            {certifications.map((cert, idx) => (
              <div key={idx} className="tech-certification-item">
                <span className="tech-certification-name">{cert.name}</span>
                <span className="tech-certification-issuer">{cert.issuer}</span>
                {cert.date && <span className="tech-certification-date">{cert.date}</span>}
              </div>
            ))}
          </div>
        </TemplateSection>
      )}

      {/* Awards */}
      {awards && awards.length > 0 && (
        <TemplateSection title="Awards & Recognition" className="tech-section">
          {awards.map((award, idx) => (
            <div key={idx} className="tech-award-item">
              <div className="tech-award-header">
                <span className="tech-award-name">{award.name}</span>
                <span className="tech-award-org"> — {award.org}</span>
                {award.date && <span className="tech-award-date"> ({award.date})</span>}
              </div>
              {award.summary && <p className="tech-award-summary">{award.summary}</p>}
            </div>
          ))}
        </TemplateSection>
      )}

      {/* Languages */}
      {languages && languages.length > 0 && (
        <TemplateSection title="Languages" className="tech-section">
          <div className="tech-languages">
            {languages.map((lang, idx) => (
              <span key={idx} className="tech-language-item">
                {lang.name} <span className="tech-language-level">({lang.level})</span>
                {idx < languages.length - 1 && ' · '}
              </span>
            ))}
          </div>
        </TemplateSection>
      )}
    </TemplateBase>
  )
})

TechnicalTemplate.displayName = 'TechnicalTemplate'

export default TechnicalTemplate
