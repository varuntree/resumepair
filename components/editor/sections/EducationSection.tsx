'use client'

import * as React from 'react'
import { TextField } from '../fields/TextField'
import { DateField } from '../fields/DateField'
import { ArrayField } from '../fields/ArrayField'
import { TextAreaField } from '../fields/TextAreaField'

export function EducationSection(): React.ReactElement {
  const emptyEducation = {
    school: '',
    degree: '',
    field: '',
    startDate: '',
    endDate: '',
    details: [],
  }

  const emptyDetail = ''

  return (
    <div className="space-y-6">
      <ArrayField
        name="education"
        label="Education"
        emptyItem={emptyEducation}
        maxItems={10}
        renderSummary={(item) => (
          <div className="space-y-0.5">
            <p className="text-sm font-medium text-foreground">{item.degree || 'Degree'}</p>
            <p className="text-xs text-muted-foreground">
              {[item.school || 'School', item.field].filter(Boolean).join(' • ')}
            </p>
            <p className="text-xs text-muted-foreground">{formatEducationDates(item.startDate, item.endDate)}</p>
          </div>
        )}
      >
        {(index) => (
          <div className="space-y-4">
            <TextField
              name={`education.${index}.school`}
              label="School/University"
              placeholder="University of California, Berkeley"
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextField
                name={`education.${index}.degree`}
                label="Degree"
                placeholder="Bachelor of Science"
                required
              />
              <TextField
                name={`education.${index}.field`}
                label="Field of Study"
                placeholder="Computer Science"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DateField
                name={`education.${index}.startDate`}
                label="Start Date"
              />
              <DateField
                name={`education.${index}.endDate`}
                label="End Date"
              />
            </div>

            <ArrayField
              name={`education.${index}.details`}
              label="Details"
              emptyItem={emptyDetail}
              maxItems={5}
              renderSummary={(value: string) => (
                <span className="text-sm text-muted-foreground line-clamp-1">
                  {value || 'Detail'}
                </span>
              )}
            >
              {(detailIndex) => (
                <TextAreaField
                  name={`education.${index}.details.${detailIndex}`}
                  label={`Detail ${detailIndex + 1}`}
                  placeholder="GPA: 3.8/4.0, Dean's List"
                  maxLength={150}
                  rows={2}
                />
              )}
            </ArrayField>
          </div>
        )}
      </ArrayField>
    </div>
  )
}

function formatEducationDates(start?: string, end?: string): string {
  if (!start && !end) return 'Dates not set'
  return [start || 'N/A', end || 'N/A'].join(' → ')
}
