'use client'

import * as React from 'react'
import { TextField } from '../fields/TextField'
import { LinkField } from '../fields/LinkField'
import { ArrayField } from '../fields/ArrayField'
import { TextAreaField } from '../fields/TextAreaField'

export function ProjectsSection(): React.ReactElement {
  const emptyProject = {
    name: '',
    link: '',
    summary: '',
    bullets: [],
    techStack: [],
  }

  const emptyBullet = ''
  const emptyTech = ''

  return (
    <div className="space-y-6">
      <ArrayField
        name="projects"
        label="Projects"
        emptyItem={emptyProject}
        maxItems={10}
        renderSummary={(item) => (
          <div className="space-y-0.5">
            <p className="text-sm font-medium text-foreground">{item.name || 'Project'}</p>
            {item.summary && (
              <p className="text-xs text-muted-foreground line-clamp-1">{item.summary}</p>
            )}
          </div>
        )}
      >
        {(index) => (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextField
                name={`projects.${index}.name`}
                label="Project Name"
                placeholder="E-commerce Platform"
                required
              />
              <LinkField
                name={`projects.${index}.link`}
                label="Project Link"
                placeholder="https://github.com/username/project"
              />
            </div>

            <TextAreaField
              name={`projects.${index}.summary`}
              label="Summary"
              placeholder="A full-stack e-commerce platform with..."
              maxLength={300}
              rows={3}
            />

            <ArrayField
              name={`projects.${index}.bullets`}
              label="Highlights"
              emptyItem={emptyBullet}
              maxItems={8}
              renderSummary={(value: string) => (
                <span className="text-sm text-muted-foreground line-clamp-1">{value || 'Highlight'}</span>
              )}
            >
              {(bulletIndex) => (
                <TextAreaField
                  name={`projects.${index}.bullets.${bulletIndex}`}
                  label={`Highlight ${bulletIndex + 1}`}
                  placeholder="Implemented real-time inventory management"
                  maxLength={150}
                  rows={2}
                />
              )}
            </ArrayField>

            <ArrayField
              name={`projects.${index}.techStack`}
              label="Technologies"
              emptyItem={emptyTech}
              maxItems={15}
              renderSummary={(value: string) => (
                <span className="text-sm text-muted-foreground">{value || 'Technology'}</span>
              )}
            >
              {(techIndex) => (
                <TextField
                  name={`projects.${index}.techStack.${techIndex}`}
                  label={`Technology ${techIndex + 1}`}
                  placeholder="React, Node.js, PostgreSQL"
                />
              )}
            </ArrayField>
          </div>
        )}
      </ArrayField>
    </div>
  )
}
