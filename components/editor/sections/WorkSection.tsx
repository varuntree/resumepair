'use client'

import * as React from 'react'
import { Separator } from '@/components/ui/separator'
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
      <div>
        <h2 className="text-2xl font-bold">Work Experience</h2>
        <p className="text-muted-foreground mt-1">
          Your professional work history
        </p>
      </div>

      <Separator />

      <ArrayField
        name="work"
        label="Experience"
        emptyItem={emptyWork}
        maxItems={15}
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