'use client'

import * as React from 'react'
import { Separator } from '@/components/ui/separator'
import { TextField } from '../fields/TextField'
import { DateField } from '../fields/DateField'
import { TextAreaField } from '../fields/TextAreaField'
import { ArrayField } from '../fields/ArrayField'

export function AwardsSection(): React.ReactElement {
  const emptyAward = {
    name: '',
    org: '',
    date: '',
    summary: '',
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Awards</h2>
        <p className="text-muted-foreground mt-1">
          Recognition and achievements
        </p>
      </div>

      <Separator />

      <ArrayField
        name="awards"
        label="Awards"
        emptyItem={emptyAward}
        maxItems={10}
      >
        {(index) => (
          <div className="space-y-4">
            <TextField
              name={`awards.${index}.name`}
              label="Award Name"
              placeholder="Employee of the Year"
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextField
                name={`awards.${index}.org`}
                label="Organization"
                placeholder="Acme Corp"
                required
              />
              <DateField
                name={`awards.${index}.date`}
                label="Date Received"
              />
            </div>

            <TextAreaField
              name={`awards.${index}.summary`}
              label="Description"
              placeholder="Recognized for outstanding performance..."
              maxLength={200}
              rows={3}
            />
          </div>
        )}
      </ArrayField>
    </div>
  )
}