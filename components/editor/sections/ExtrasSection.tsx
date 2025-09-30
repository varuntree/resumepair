'use client'

import * as React from 'react'
import { Separator } from '@/components/ui/separator'
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
      <div>
        <h2 className="text-2xl font-bold">Additional Sections</h2>
        <p className="text-muted-foreground mt-1">
          Add custom sections for anything else you&apos;d like to include
        </p>
      </div>

      <Separator />

      <ArrayField
        name="extras"
        label="Custom Sections"
        emptyItem={emptyExtra}
        maxItems={5}
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