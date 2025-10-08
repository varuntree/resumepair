'use client'

import * as React from 'react'
import { TextField } from '../fields/TextField'
import { DateField } from '../fields/DateField'
import { ArrayField } from '../fields/ArrayField'
import { TextAreaField } from '../fields/TextAreaField'

export function WorkSection(): React.ReactElement {
  const emptyWork = {
    company: '',
    role: '',
    location: '',
    startDate: '',
    endDate: null,
    descriptionBullets: [],
    achievements: [],
    techStack: [],
  }

  const emptyBullet = ''
  const emptyTech = ''

  return (
    <div className="space-y-6">
      <ArrayField
        name="work"
        label="Experience"
        emptyItem={emptyWork}
        maxItems={15}
        renderSummary={(item) => (
          <div className="space-y-0.5">
            <p className="text-sm font-medium text-foreground">
              {item.role || 'Role'}
              {item.company ? ` @ ${item.company}` : ''}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatWorkDates(item.startDate, item.endDate)}
            </p>
          </div>
        )}
      >
        {(index) => (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextField
                name={`work.${index}.company`}
                label="Company"
                placeholder="Acme Corp"
                required
              />
              <TextField
                name={`work.${index}.role`}
                label="Role"
                placeholder="Senior Software Engineer"
                required
              />
            </div>

            <TextField
              name={`work.${index}.location`}
              label="Location"
              placeholder="San Francisco, CA"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DateField
                name={`work.${index}.startDate`}
                label="Start Date"
                required
              />
              <DateField
                name={`work.${index}.endDate`}
                label="End Date"
                allowPresent
              />
            </div>

            <ArrayField
              name={`work.${index}.descriptionBullets`}
              label="Description Points"
              emptyItem={emptyBullet}
              maxItems={10}
              renderSummary={(value: string) => (
                <span className="text-sm text-muted-foreground line-clamp-1">
                  {value || 'Empty bullet'}
                </span>
              )}
            >
              {(bulletIndex) => (
                <TextAreaField
                  name={`work.${index}.descriptionBullets.${bulletIndex}`}
                  label={`Point ${bulletIndex + 1}`}
                  placeholder="Led development of..."
                  maxLength={200}
                  rows={2}
                />
              )}
            </ArrayField>

            <ArrayField
              name={`work.${index}.techStack`}
              label="Technologies"
              emptyItem={emptyTech}
              maxItems={20}
              renderSummary={(value: string) => (
                <span className="text-sm text-muted-foreground">{value || 'Technology'}</span>
              )}
            >
              {(techIndex) => (
                <TextField
                  name={`work.${index}.techStack.${techIndex}`}
                  label={`Technology ${techIndex + 1}`}
                  placeholder="React, TypeScript, Node.js"
                />
              )}
            </ArrayField>
          </div>
        )}
      </ArrayField>
    </div>
  )
}

function formatWorkDates(start?: string, end?: string | null): string {
  if (!start && !end) return 'Dates not set'
  const endLabel = !end ? 'Present' : end === 'Present' ? 'Present' : end
  return [start || 'N/A', endLabel].filter(Boolean).join(' → ')
}
