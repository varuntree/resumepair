'use client'

import * as React from 'react'
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
      <ArrayField
        name="awards"
        label="Awards"
        emptyItem={emptyAward}
        maxItems={10}
        renderSummary={(item) => (
          <div className="space-y-0.5">
            <p className="text-sm font-medium text-foreground">{item.name || 'Award'}</p>
            <p className="text-xs text-muted-foreground">
              {item.org || 'Organization'}{item.date ? ` • ${item.date}` : ''}
            </p>
            {item.summary && (
              <p className="text-xs text-muted-foreground line-clamp-1">{item.summary}</p>
            )}
          </div>
        )}
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
