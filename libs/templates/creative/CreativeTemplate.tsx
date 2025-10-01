/**
 * Creative Resume Template
 *
 * Bold, visual-first design with large headings and modern layout.
 * Features two-column layout with sidebar for contact info.
 *
 * @module libs/templates/creative/CreativeTemplate
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
 * Creative Template Component
 *
 * Features:
 * - Bold, large headings
 * - Two-column layout with sidebar
 * - Visual-first design with icons
 * - Modern and eye-catching
 * - Print-optimized
 */
const CreativeTemplate = React.memo(({ data, customizations, mode = 'preview' }: TemplateProps) => {
  const { profile, summary, work, education, projects, skills, certifications, awards, languages } =
    data

  const showIcons = customizations?.icons.enabled ?? true
  const isTwoColumn = customizations?.layout.columns === 2

  return (
    <TemplateBase className="creative-template" customizations={customizations} mode={mode}>
      <div className={isTwoColumn ? 'creative-layout-two-column' : 'creative-layout-single'}>
        {/* Sidebar (if two-column) */}
        {isTwoColumn && (
          <aside className="creative-sidebar">
            {/* Profile Photo */}
            {profile.photo && (
              <div className="creative-photo">
                <img src={profile.photo.url} alt={profile.fullName} />
              </div>
            )}

            {/* Contact Info */}
            <div className="creative-contact-section">
              <h2 className="creative-sidebar-title">Contact</h2>
              <div className="creative-contact-list">
                {profile.email && (
                  <div className="creative-contact-item">
                    {showIcons && <EmailIcon />}
                    <a href={`mailto:${profile.email}`}>{profile.email}</a>
                  </div>
                )}

                {profile.phone && (
                  <div className="creative-contact-item">
                    {showIcons && <PhoneIcon />}
                    <span>{formatPhone(profile.phone)}</span>
                  </div>
                )}

                {profile.location && (
                  <div className="creative-contact-item">
                    {showIcons && <LocationIcon />}
                    <span>{formatAddress(profile.location)}</span>
                  </div>
                )}

                {profile.links &&
                  profile.links.map((link, idx) => {
                    const IconComponent = getIconForLinkType(link.type)
                    return (
                      <div key={idx} className="creative-contact-item">
                        {showIcons && <IconComponent />}
                        <a href={link.url} target="_blank" rel="noopener noreferrer">
                          {link.label || formatUrl(link.url)}
                        </a>
                      </div>
                    )
                  })}
              </div>
            </div>

            {/* Skills in Sidebar */}
            {skills && skills.length > 0 && (
              <div className="creative-skills-sidebar">
                <h2 className="creative-sidebar-title">Skills</h2>
                {skills.map((skillGroup, idx) => (
                  <div key={idx} className="creative-skill-group">
                    <h3 className="creative-skill-category">{skillGroup.category}</h3>
                    <ul className="creative-skill-items">
                      {skillGroup.items.map((skill, i) => (
                        <li key={i}>{skill}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {/* Languages in Sidebar */}
            {languages && languages.length > 0 && (
              <div className="creative-languages-sidebar">
                <h2 className="creative-sidebar-title">Languages</h2>
                <ul className="creative-languages-list">
                  {languages.map((lang, idx) => (
                    <li key={idx}>
                      <span className="creative-language-name">{lang.name}</span>
                      <span className="creative-language-level">{lang.level}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        )}

        {/* Main Content */}
        <main className="creative-main">
          {/* Profile Header */}
          <header className="creative-header">
            <h1 className="creative-name">{profile.fullName}</h1>
            {profile.headline && <p className="creative-headline">{profile.headline}</p>}

            {/* Contact in single-column mode */}
            {!isTwoColumn && (
              <div className="creative-contact">
                {profile.email && (
                  <span className="creative-contact-item">
                    {showIcons && <EmailIcon />}
                    <a href={`mailto:${profile.email}`}>{profile.email}</a>
                  </span>
                )}

                {profile.phone && (
                  <span className="creative-contact-item">
                    {showIcons && <PhoneIcon />}
                    <span>{formatPhone(profile.phone)}</span>
                  </span>
                )}

                {profile.location && (
                  <span className="creative-contact-item">
                    {showIcons && <LocationIcon />}
                    <span>{formatAddress(profile.location)}</span>
                  </span>
                )}

                {profile.links &&
                  profile.links.map((link, idx) => {
                    const IconComponent = getIconForLinkType(link.type)
                    return (
                      <span key={idx} className="creative-contact-item">
                        {showIcons && <IconComponent />}
                        <a href={link.url} target="_blank" rel="noopener noreferrer">
                          {link.label || formatUrl(link.url)}
                        </a>
                      </span>
                    )
                  })}
              </div>
            )}
          </header>

          {/* Summary */}
          {summary && (
            <TemplateSection title="About Me" className="creative-section">
              <p className="creative-summary">{summary}</p>
            </TemplateSection>
          )}

          {/* Work Experience */}
          {work && work.length > 0 && (
            <TemplateSection title="Experience" className="creative-section">
              {work.map((job, idx) => (
                <article key={idx} className="creative-work-item">
                  <div className="creative-work-header">
                    <h3 className="creative-work-role">{job.role}</h3>
                    <span className="creative-work-company">{job.company}</span>
                  </div>

                  <div className="creative-work-meta">
                    <span className="creative-work-dates">
                      {formatDateRange(job.startDate, job.endDate)}
                    </span>
                    {job.location && <span className="creative-work-location">{job.location}</span>}
                  </div>

                  {job.descriptionBullets && job.descriptionBullets.length > 0 && (
                    <ul className="creative-work-bullets">
                      {job.descriptionBullets.map((bullet, i) => (
                        <li key={i}>{bullet}</li>
                      ))}
                    </ul>
                  )}

                  {job.achievements && job.achievements.length > 0 && (
                    <ul className="creative-work-achievements">
                      {job.achievements.map((achievement, i) => (
                        <li key={i}>{achievement}</li>
                      ))}
                    </ul>
                  )}

                  {job.techStack && job.techStack.length > 0 && (
                    <div className="creative-tech-stack">
                      {job.techStack.map((tech, i) => (
                        <span key={i} className="creative-tech-tag">
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </TemplateSection>
          )}

          {/* Projects */}
          {projects && projects.length > 0 && (
            <TemplateSection title="Projects" className="creative-section">
              {projects.map((project, idx) => (
                <article key={idx} className="creative-project-item">
                  <div className="creative-project-header">
                    <h3 className="creative-project-name">{project.name}</h3>
                    {project.link && (
                      <a
                        href={project.link}
                        className="creative-project-link"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {formatUrl(project.link)}
                      </a>
                    )}
                  </div>

                  {project.summary && <p className="creative-project-summary">{project.summary}</p>}

                  {project.bullets && project.bullets.length > 0 && (
                    <ul className="creative-project-bullets">
                      {project.bullets.map((bullet, i) => (
                        <li key={i}>{bullet}</li>
                      ))}
                    </ul>
                  )}

                  {project.techStack && project.techStack.length > 0 && (
                    <div className="creative-tech-stack">
                      {project.techStack.map((tech, i) => (
                        <span key={i} className="creative-tech-tag">
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
            <TemplateSection title="Education" className="creative-section">
              {education.map((edu, idx) => (
                <article key={idx} className="creative-education-item">
                  <div className="creative-education-header">
                    <h3 className="creative-education-degree">{edu.degree}</h3>
                    <span className="creative-education-school">{edu.school}</span>
                  </div>

                  <div className="creative-education-meta">
                    {edu.field && <span className="creative-education-field">{edu.field}</span>}
                    {(edu.startDate || edu.endDate) && (
                      <span className="creative-education-dates">
                        {formatDateRange(edu.startDate, edu.endDate)}
                      </span>
                    )}
                  </div>

                  {edu.details && edu.details.length > 0 && (
                    <ul className="creative-education-details">
                      {edu.details.map((detail, i) => (
                        <li key={i}>{detail}</li>
                      ))}
                    </ul>
                  )}
                </article>
              ))}
            </TemplateSection>
          )}

          {/* Skills in single-column mode */}
          {!isTwoColumn && skills && skills.length > 0 && (
            <TemplateSection title="Skills" className="creative-section">
              {skills.map((skillGroup, idx) => (
                <div key={idx} className="creative-skill-group">
                  <span className="creative-skill-category">{skillGroup.category}:</span>
                  <span className="creative-skill-items">{skillGroup.items.join(', ')}</span>
                </div>
              ))}
            </TemplateSection>
          )}

          {/* Certifications */}
          {certifications && certifications.length > 0 && (
            <TemplateSection title="Certifications" className="creative-section">
              {certifications.map((cert, idx) => (
                <div key={idx} className="creative-certification-item">
                  <span className="creative-certification-name">{cert.name}</span>
                  <span className="creative-certification-issuer"> - {cert.issuer}</span>
                  {cert.date && <span className="creative-certification-date"> ({cert.date})</span>}
                </div>
              ))}
            </TemplateSection>
          )}

          {/* Awards */}
          {awards && awards.length > 0 && (
            <TemplateSection title="Awards" className="creative-section">
              {awards.map((award, idx) => (
                <div key={idx} className="creative-award-item">
                  <div className="creative-award-header">
                    <span className="creative-award-name">{award.name}</span>
                    <span className="creative-award-org"> - {award.org}</span>
                    {award.date && <span className="creative-award-date"> ({award.date})</span>}
                  </div>
                  {award.summary && <p className="creative-award-summary">{award.summary}</p>}
                </div>
              ))}
            </TemplateSection>
          )}
        </main>
      </div>
    </TemplateBase>
  )
})

CreativeTemplate.displayName = 'CreativeTemplate'

export default CreativeTemplate
