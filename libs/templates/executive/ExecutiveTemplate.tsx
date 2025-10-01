/**
 * Executive Resume Template
 *
 * Premium serif design with subtle elegance and sophisticated layout.
 * Perfect for senior professionals, executives, and leadership roles.
 *
 * @module libs/templates/executive/ExecutiveTemplate
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
 * Executive Template Component
 *
 * Features:
 * - Premium serif typography
 * - Center-aligned header
 * - Elegant spacing and layout
 * - Subtle design accents
 * - ATS-friendly semantic HTML
 */
const ExecutiveTemplate = React.memo(({ data, customizations, mode = 'preview' }: TemplateProps) => {
  const { profile, summary, work, education, projects, skills, certifications, awards, languages } =
    data

  const showIcons = customizations?.icons.enabled ?? false
  const headerAlignment = customizations?.layout.headerAlignment ?? 'center'

  return (
    <TemplateBase className="executive-template" customizations={customizations} mode={mode}>
      {/* Profile Header */}
      <header className={`exec-header exec-header--${headerAlignment}`}>
        <h1 className="exec-name">{profile.fullName}</h1>
        {profile.headline && <p className="exec-headline">{profile.headline}</p>}

        <div className="exec-contact">
          {profile.email && (
            <span className="exec-contact-item">
              {showIcons && <EmailIcon />}
              <a href={`mailto:${profile.email}`}>{profile.email}</a>
            </span>
          )}

          {profile.phone && (
            <span className="exec-contact-item">
              {showIcons && <PhoneIcon />}
              <span>{formatPhone(profile.phone)}</span>
            </span>
          )}

          {profile.location && (
            <span className="exec-contact-item">
              {showIcons && <LocationIcon />}
              <span>{formatAddress(profile.location)}</span>
            </span>
          )}

          {profile.links &&
            profile.links.map((link, idx) => {
              const IconComponent = getIconForLinkType(link.type)
              return (
                <span key={idx} className="exec-contact-item">
                  {showIcons && <IconComponent />}
                  <a href={link.url} target="_blank" rel="noopener noreferrer">
                    {link.label || formatUrl(link.url)}
                  </a>
                </span>
              )
            })}
        </div>
      </header>

      {/* Professional Summary */}
      {summary && (
        <TemplateSection title="Professional Summary" className="exec-section">
          <p className="exec-summary">{summary}</p>
        </TemplateSection>
      )}

      {/* Work Experience */}
      {work && work.length > 0 && (
        <TemplateSection title="Professional Experience" className="exec-section">
          {work.map((job, idx) => (
            <article key={idx} className="exec-work-item">
              <div className="exec-work-header">
                <div className="exec-work-left">
                  <h3 className="exec-work-role">{job.role}</h3>
                  <span className="exec-work-company">{job.company}</span>
                </div>
                <div className="exec-work-right">
                  <span className="exec-work-dates">
                    {formatDateRange(job.startDate, job.endDate)}
                  </span>
                  {job.location && <span className="exec-work-location">{job.location}</span>}
                </div>
              </div>

              {job.descriptionBullets && job.descriptionBullets.length > 0 && (
                <ul className="exec-work-bullets">
                  {job.descriptionBullets.map((bullet, i) => (
                    <li key={i}>{bullet}</li>
                  ))}
                </ul>
              )}

              {job.achievements && job.achievements.length > 0 && (
                <div className="exec-achievements">
                  <h4 className="exec-achievements-title">Key Achievements</h4>
                  <ul className="exec-work-achievements">
                    {job.achievements.map((achievement, i) => (
                      <li key={i}>{achievement}</li>
                    ))}
                  </ul>
                </div>
              )}

              {job.techStack && job.techStack.length > 0 && (
                <div className="exec-tech-stack">
                  <span className="exec-tech-label">Technologies & Tools:</span>
                  <span className="exec-tech-items">{job.techStack.join(' • ')}</span>
                </div>
              )}
            </article>
          ))}
        </TemplateSection>
      )}

      {/* Education */}
      {education && education.length > 0 && (
        <TemplateSection title="Education" className="exec-section">
          {education.map((edu, idx) => (
            <article key={idx} className="exec-education-item">
              <div className="exec-education-header">
                <div className="exec-education-left">
                  <h3 className="exec-education-degree">{edu.degree}</h3>
                  {edu.field && <span className="exec-education-field">{edu.field}</span>}
                </div>
                <div className="exec-education-right">
                  <span className="exec-education-school">{edu.school}</span>
                  {(edu.startDate || edu.endDate) && (
                    <span className="exec-education-dates">
                      {formatDateRange(edu.startDate, edu.endDate)}
                    </span>
                  )}
                </div>
              </div>

              {edu.details && edu.details.length > 0 && (
                <ul className="exec-education-details">
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
        <TemplateSection title="Notable Projects" className="exec-section">
          {projects.map((project, idx) => (
            <article key={idx} className="exec-project-item">
              <div className="exec-project-header">
                <h3 className="exec-project-name">{project.name}</h3>
                {project.link && (
                  <a
                    href={project.link}
                    className="exec-project-link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View Project
                  </a>
                )}
              </div>

              {project.summary && <p className="exec-project-summary">{project.summary}</p>}

              {project.bullets && project.bullets.length > 0 && (
                <ul className="exec-project-bullets">
                  {project.bullets.map((bullet, i) => (
                    <li key={i}>{bullet}</li>
                  ))}
                </ul>
              )}

              {project.techStack && project.techStack.length > 0 && (
                <div className="exec-tech-stack">
                  <span className="exec-tech-label">Technologies:</span>
                  <span className="exec-tech-items">{project.techStack.join(' • ')}</span>
                </div>
              )}
            </article>
          ))}
        </TemplateSection>
      )}

      {/* Skills */}
      {skills && skills.length > 0 && (
        <TemplateSection title="Core Competencies" className="exec-section">
          <div className="exec-skills-grid">
            {skills.map((skillGroup, idx) => (
              <div key={idx} className="exec-skill-group">
                <h4 className="exec-skill-category">{skillGroup.category}</h4>
                <p className="exec-skill-items">{skillGroup.items.join(' • ')}</p>
              </div>
            ))}
          </div>
        </TemplateSection>
      )}

      {/* Certifications & Awards in two columns */}
      {((certifications && certifications.length > 0) || (awards && awards.length > 0)) && (
        <div className="exec-two-column">
          {/* Certifications */}
          {certifications && certifications.length > 0 && (
            <TemplateSection title="Certifications" className="exec-section">
              {certifications.map((cert, idx) => (
                <div key={idx} className="exec-certification-item">
                  <span className="exec-certification-name">{cert.name}</span>
                  <span className="exec-certification-issuer">{cert.issuer}</span>
                  {cert.date && <span className="exec-certification-date">{cert.date}</span>}
                </div>
              ))}
            </TemplateSection>
          )}

          {/* Awards */}
          {awards && awards.length > 0 && (
            <TemplateSection title="Honors & Awards" className="exec-section">
              {awards.map((award, idx) => (
                <div key={idx} className="exec-award-item">
                  <span className="exec-award-name">{award.name}</span>
                  <span className="exec-award-org">{award.org}</span>
                  {award.date && <span className="exec-award-date">{award.date}</span>}
                  {award.summary && <p className="exec-award-summary">{award.summary}</p>}
                </div>
              ))}
            </TemplateSection>
          )}
        </div>
      )}

      {/* Languages */}
      {languages && languages.length > 0 && (
        <TemplateSection title="Languages" className="exec-section">
          <div className="exec-languages">
            {languages.map((lang, idx) => (
              <span key={idx} className="exec-language-item">
                <span className="exec-language-name">{lang.name}</span>{' '}
                <span className="exec-language-level">({lang.level})</span>
                {idx < languages.length - 1 && ' • '}
              </span>
            ))}
          </div>
        </TemplateSection>
      )}
    </TemplateBase>
  )
})

ExecutiveTemplate.displayName = 'ExecutiveTemplate'

export default ExecutiveTemplate
