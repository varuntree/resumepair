'use client'

import * as React from 'react'
import { Separator } from '@/components/ui/separator'
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
      <div>
        <h2 className="text-2xl font-bold">Skills</h2>
        <p className="text-muted-foreground mt-1">
          Organize your skills by category
        </p>
      </div>

      <Separator />

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