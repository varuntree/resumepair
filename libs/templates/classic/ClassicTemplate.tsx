/**
 * Classic Resume Template
 *
 * Traditional serif design for conservative industries.
 * Professional, timeless layout optimized for ATS.
 *
 * @module libs/templates/classic/ClassicTemplate
 */

import React from 'react'
import { TemplateProps } from '@/types/template'
import { TemplateBase } from '../shared/TemplateBase'
import { TemplateSection } from '../shared/TemplateSection'
import { formatDateRange, formatPhone, formatUrl, formatAddress } from '../shared/TemplateUtils'
import './styles.css'

/**
 * Classic Template Component
 *
 * Features:
 * - Traditional serif typography
 * - Conservative layout
 * - No icons (traditional industries)
 * - Center-aligned header option
 * - Print-optimized
 */
const ClassicTemplate = React.memo(({ data, customizations, mode = 'preview' }: TemplateProps) => {
  const { profile, summary, work, education, projects, skills, certifications, awards, languages } =
    data

  return (
    <TemplateBase className="classic-template" customizations={customizations} mode={mode}>
      {/* Profile Header - Center aligned */}
      <header className="doc-header">
        <h1 className="doc-name">{profile.fullName}</h1>
        {profile.headline && <p className="doc-headline">{profile.headline}</p>}

        <div className="doc-contact">
          {profile.email && <span>{profile.email}</span>}
          {profile.phone && <span>{formatPhone(profile.phone)}</span>}
          {profile.location && <span>{formatAddress(profile.location)}</span>}
        </div>

        {profile.links && profile.links.length > 0 && (
          <div className="doc-links">
            {profile.links.map((link, idx) => (
              <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer">
                {link.label || formatUrl(link.url)}
              </a>
            ))}
          </div>
        )}
      </header>

      {/* Summary */}
      {summary && (
        <TemplateSection title="Professional Summary">
          <p className="doc-summary">{summary}</p>
        </TemplateSection>
      )}

      {/* Work Experience */}
      {work && work.length > 0 && (
        <TemplateSection title="Professional Experience">
          {work.map((job, idx) => (
            <article key={idx} className="doc-work-item">
              <div className="doc-work-header">
                <h3 className="doc-work-role">{job.role}</h3>
                <span className="doc-work-dates">
                  {formatDateRange(job.startDate, job.endDate)}
                </span>
              </div>

              <div className="doc-work-subheader">
                <span className="doc-work-company">{job.company}</span>
                {job.location && <span className="doc-work-location"> — {job.location}</span>}
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
                <p className="doc-tech-summary">
                  <em>Technologies: {job.techStack.join(', ')}</em>
                </p>
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
                {(edu.startDate || edu.endDate) && (
                  <span className="doc-education-dates">
                    {formatDateRange(edu.startDate, edu.endDate)}
                  </span>
                )}
              </div>

              <div className="doc-education-subheader">
                <span className="doc-education-school">{edu.school}</span>
                {edu.field && <span className="doc-education-field"> — {edu.field}</span>}
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

      {/* Skills */}
      {skills && skills.length > 0 && (
        <TemplateSection title="Skills & Expertise">
          {skills.map((skillGroup, idx) => (
            <p key={idx} className="doc-skill-group">
              <strong>{skillGroup.category}:</strong> {skillGroup.items.join(', ')}
            </p>
          ))}
        </TemplateSection>
      )}

      {/* Projects */}
      {projects && projects.length > 0 && (
        <TemplateSection title="Notable Projects">
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
                <p className="doc-tech-summary">
                  <em>Technologies: {project.techStack.join(', ')}</em>
                </p>
              )}
            </article>
          ))}
        </TemplateSection>
      )}

      {/* Certifications */}
      {certifications && certifications.length > 0 && (
        <TemplateSection title="Certifications">
          {certifications.map((cert, idx) => (
            <p key={idx} className="doc-certification-item">
              <strong>{cert.name}</strong>, {cert.issuer}
              {cert.date && ` (${cert.date})`}
            </p>
          ))}
        </TemplateSection>
      )}

      {/* Awards */}
      {awards && awards.length > 0 && (
        <TemplateSection title="Honors & Awards">
          {awards.map((award, idx) => (
            <div key={idx} className="doc-award-item">
              <p className="doc-award-header">
                <strong>{award.name}</strong>, {award.org}
                {award.date && ` (${award.date})`}
              </p>
              {award.summary && <p className="doc-award-summary">{award.summary}</p>}
            </div>
          ))}
        </TemplateSection>
      )}

      {/* Languages */}
      {languages && languages.length > 0 && (
        <TemplateSection title="Languages">
          <p className="doc-languages">
            {languages.map((lang, idx) => (
              <span key={idx}>
                {lang.name} ({lang.level})
                {idx < languages.length - 1 && ', '}
              </span>
            ))}
          </p>
        </TemplateSection>
      )}
    </TemplateBase>
  )
})

ClassicTemplate.displayName = 'ClassicTemplate'

export default ClassicTemplate
