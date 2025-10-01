/**
 * Modern Resume Template
 *
 * Contemporary design with accent colors and icons.
 * Slightly more visual than Minimal while maintaining ATS compatibility.
 *
 * @module libs/templates/modern/ModernTemplate
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
  WorkIcon,
  EducationIcon,
  ProjectIcon,
  getIconForLinkType,
} from '../shared/TemplateIcons'
import './styles.css'

/**
 * Modern Template Component
 *
 * Features:
 * - Contemporary design with accent colors
 * - Icons enabled by default
 * - Visual hierarchy with color accents
 * - ATS-friendly semantic HTML
 * - Print-optimized
 */
const ModernTemplate = React.memo(({ data, customizations, mode = 'preview' }: TemplateProps) => {
  const { profile, summary, work, education, projects, skills, certifications, awards, languages } =
    data

  const showIcons = customizations?.icons.enabled ?? true

  return (
    <TemplateBase className="modern-template" customizations={customizations} mode={mode}>
      {/* Profile Header */}
      <header className="doc-header">
        <div className="doc-header-content">
          <h1 className="doc-name">{profile.fullName}</h1>
          {profile.headline && <p className="doc-headline">{profile.headline}</p>}
        </div>

        <div className="doc-contact-grid">
          {profile.email && (
            <div className="doc-contact-item">
              {showIcons && <EmailIcon />}
              <a href={`mailto:${profile.email}`}>{profile.email}</a>
            </div>
          )}

          {profile.phone && (
            <div className="doc-contact-item">
              {showIcons && <PhoneIcon />}
              <span>{formatPhone(profile.phone)}</span>
            </div>
          )}

          {profile.location && (
            <div className="doc-contact-item">
              {showIcons && <LocationIcon />}
              <span>{formatAddress(profile.location)}</span>
            </div>
          )}

          {profile.links &&
            profile.links.map((link, idx) => {
              const IconComponent = getIconForLinkType(link.type)
              return (
                <div key={idx} className="doc-contact-item">
                  {showIcons && <IconComponent />}
                  <a href={link.url} target="_blank" rel="noopener noreferrer">
                    {link.label || formatUrl(link.url)}
                  </a>
                </div>
              )
            })}
        </div>
      </header>

      {/* Summary */}
      {summary && (
        <TemplateSection title="About">
          <p className="doc-summary">{summary}</p>
        </TemplateSection>
      )}

      {/* Work Experience */}
      {work && work.length > 0 && (
        <TemplateSection title="Experience">
          {work.map((job, idx) => (
            <article key={idx} className="doc-work-item">
              <div className="doc-item-header">
                {showIcons && <WorkIcon className="doc-section-icon" />}
                <div className="doc-item-content">
                  <div className="doc-work-title-row">
                    <h3 className="doc-work-role">{job.role}</h3>
                    <span className="doc-work-dates">
                      {formatDateRange(job.startDate, job.endDate)}
                    </span>
                  </div>
                  <div className="doc-work-meta-row">
                    <span className="doc-work-company">{job.company}</span>
                    {job.location && <span className="doc-work-location">{job.location}</span>}
                  </div>
                </div>
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
                <div className="doc-tech-tags">
                  {job.techStack.map((tech, i) => (
                    <span key={i} className="doc-tech-tag">
                      {tech}
                    </span>
                  ))}
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
              <div className="doc-item-header">
                {showIcons && <EducationIcon className="doc-section-icon" />}
                <div className="doc-item-content">
                  <div className="doc-education-title-row">
                    <h3 className="doc-education-degree">{edu.degree}</h3>
                    {(edu.startDate || edu.endDate) && (
                      <span className="doc-education-dates">
                        {formatDateRange(edu.startDate, edu.endDate)}
                      </span>
                    )}
                  </div>
                  <div className="doc-education-meta-row">
                    <span className="doc-education-school">{edu.school}</span>
                    {edu.field && <span className="doc-education-field">{edu.field}</span>}
                  </div>
                </div>
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
              <div className="doc-item-header">
                {showIcons && <ProjectIcon className="doc-section-icon" />}
                <div className="doc-item-content">
                  <div className="doc-project-title-row">
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
                </div>
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
                <div className="doc-tech-tags">
                  {project.techStack.map((tech, i) => (
                    <span key={i} className="doc-tech-tag">
                      {tech}
                    </span>
                  ))}
                </div>
              )}
            </article>
          ))}
        </TemplateSection>
      )}

      {/* Skills */}
      {skills && skills.length > 0 && (
        <TemplateSection title="Skills">
          <div className="doc-skills-grid">
            {skills.map((skillGroup, idx) => (
              <div key={idx} className="doc-skill-group">
                <span className="doc-skill-category">{skillGroup.category}</span>
                <div className="doc-skill-tags">
                  {skillGroup.items.map((skill, i) => (
                    <span key={i} className="doc-skill-tag">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </TemplateSection>
      )}

      {/* Certifications */}
      {certifications && certifications.length > 0 && (
        <TemplateSection title="Certifications">
          <div className="doc-certifications-list">
            {certifications.map((cert, idx) => (
              <div key={idx} className="doc-certification-item">
                <span className="doc-certification-name">{cert.name}</span>
                <span className="doc-certification-meta">
                  {cert.issuer}
                  {cert.date && ` • ${cert.date}`}
                </span>
              </div>
            ))}
          </div>
        </TemplateSection>
      )}

      {/* Awards */}
      {awards && awards.length > 0 && (
        <TemplateSection title="Awards">
          {awards.map((award, idx) => (
            <div key={idx} className="doc-award-item">
              <div className="doc-award-header">
                <span className="doc-award-name">{award.name}</span>
                <span className="doc-award-meta">
                  {award.org}
                  {award.date && ` • ${award.date}`}
                </span>
              </div>
              {award.summary && <p className="doc-award-summary">{award.summary}</p>}
            </div>
          ))}
        </TemplateSection>
      )}

      {/* Languages */}
      {languages && languages.length > 0 && (
        <TemplateSection title="Languages">
          <div className="doc-languages-grid">
            {languages.map((lang, idx) => (
              <div key={idx} className="doc-language-item">
                <span className="doc-language-name">{lang.name}</span>
                <span className="doc-language-level">{lang.level}</span>
              </div>
            ))}
          </div>
        </TemplateSection>
      )}
    </TemplateBase>
  )
})

ModernTemplate.displayName = 'ModernTemplate'

export default ModernTemplate
