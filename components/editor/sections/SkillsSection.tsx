'use client'

import * as React from 'react'
import { TextField } from '../fields/TextField'
import { ArrayField } from '../fields/ArrayField'

export function SkillsSection(): React.ReactElement {
  const emptySkillGroup = {
    category: '',
    items: [],
  }

  const emptyItem = ''

  return (
    <div className="space-y-6">
      <ArrayField
        name="skills"
        label="Skill Groups"
        emptyItem={emptySkillGroup}
        maxItems={10}
      >
        {(index) => (
          <div className="space-y-4">
            <TextField
              name={`skills.${index}.category`}
              label="Category"
              placeholder="Programming Languages"
              required
            />

            <ArrayField
              name={`skills.${index}.items`}
              label="Skills"
              emptyItem={emptyItem}
              maxItems={20}
            >
              {(itemIndex) => (
                <TextField
                  name={`skills.${index}.items.${itemIndex}`}
                  label={`Skill ${itemIndex + 1}`}
                  placeholder="JavaScript, TypeScript, Python"
                />
              )}
            </ArrayField>
          </div>
        )}
      </ArrayField>
    </div>
  )
}