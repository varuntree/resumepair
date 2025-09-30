'use client'

import * as React from 'react'
import { Separator } from '@/components/ui/separator'
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
      <div>
        <h2 className="text-2xl font-bold">Education</h2>
        <p className="text-muted-foreground mt-1">
          Your educational background
        </p>
      </div>

      <Separator />

      <ArrayField
        name="education"
        label="Education"
        emptyItem={emptyEducation}
        maxItems={10}
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