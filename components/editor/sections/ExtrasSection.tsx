'use client'

import * as React from 'react'
import { TextField } from '../fields/TextField'
import { TextAreaField } from '../fields/TextAreaField'
import { ArrayField } from '../fields/ArrayField'

export function ExtrasSection(): React.ReactElement {
  const emptyExtra = {
    title: '',
    content: '',
  }

  return (
    <div className="space-y-6">
      <ArrayField
        name="extras"
        label="Custom Sections"
        emptyItem={emptyExtra}
        maxItems={5}
        renderSummary={(item) => (
          <div className="space-y-0.5">
            <p className="text-sm font-medium text-foreground">{item.title || 'Section'}</p>
            {item.content && (
              <p className="text-xs text-muted-foreground line-clamp-1">{item.content}</p>
            )}
          </div>
        )}
      >
        {(index) => (
          <div className="space-y-4">
            <TextField
              name={`extras.${index}.title`}
              label="Section Title"
              placeholder="Volunteer Work, Publications, etc."
              required
            />

            <TextAreaField
              name={`extras.${index}.content`}
              label="Content"
              placeholder="Details about this section..."
              maxLength={500}
              rows={4}
            />
          </div>
        )}
      </ArrayField>
    </div>
  )
}
