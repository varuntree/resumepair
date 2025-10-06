'use client'

import * as React from 'react'
import { TextField } from '../fields/TextField'
import { SelectField } from '../fields/SelectField'
import { ArrayField } from '../fields/ArrayField'

export function LanguagesSection(): React.ReactElement {
  const emptyLanguage = {
    name: '',
    level: '',
  }

  const proficiencyOptions = [
    { value: 'Native', label: 'Native' },
    { value: 'Fluent', label: 'Fluent' },
    { value: 'Professional', label: 'Professional Working Proficiency' },
    { value: 'Conversational', label: 'Conversational' },
    { value: 'Elementary', label: 'Elementary' },
  ]

  return (
    <div className="space-y-6">
      <ArrayField
        name="languages"
        label="Languages"
        emptyItem={emptyLanguage}
        maxItems={10}
      >
        {(index) => (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField
              name={`languages.${index}.name`}
              label="Language"
              placeholder="English"
              required
            />
            <SelectField
              name={`languages.${index}.level`}
              label="Proficiency Level"
              options={proficiencyOptions}
              placeholder="Select level"
              required
            />
          </div>
        )}
      </ArrayField>
    </div>
  )
}