'use client'

import * as React from 'react'
import { useFormContext } from 'react-hook-form'
import { TextField } from '../fields/TextField'
import { ArrayField } from '../fields/ArrayField'
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form'
import { Slider } from '@/components/ui/slider'
import { getSkillLevelLabel } from '@/libs/utils'


export function SkillsSection(): React.ReactElement {
  const { control, getValues, setValue } = useFormContext()
  React.useEffect(() => {
    const current = getValues('skills') as any[] | undefined
    if (!current) return

    let mutated = false
    const normalized = current.map((group) => {
      if (!group || typeof group !== 'object') return group
      const items = Array.isArray(group.items)
        ? group.items.map((item: any) => {
            if (typeof item === 'string') {
              mutated = true
              return { name: item, level: 3 }
            }
            if (item && typeof item === 'object' && typeof item.name === 'string') {
              return {
                name: item.name,
                level:
                  typeof item.level === 'number' && item.level >= 0 && item.level <= 5
                    ? item.level
                    : 3,
              }
            }
            mutated = true
            return { name: '', level: 3 }
          })
        : []

      return {
        ...group,
        items,
      }
    })

    if (mutated) {
      setValue('skills', normalized, { shouldDirty: false })
    }
  }, [getValues, setValue])
  const emptySkillGroup = {
    category: '',
    items: [],
  }
  const emptyItem = {
    name: '',
    level: 3,
  }

  return (
    <div className="space-y-6">
      <ArrayField
        name="skills"
        label="Skill Groups"
        emptyItem={emptySkillGroup}
        maxItems={10}
        renderSummary={(group) => (
          <div className="space-y-0.5">
            <p className="text-sm font-medium text-foreground">{group.category || 'Category'}</p>
            {Array.isArray(group.items) && group.items.length > 0 && (
              <p className="text-xs text-muted-foreground line-clamp-1">
                {group.items
                  .map((item: any) => item?.name)
                  .filter(Boolean)
                  .join(', ')}
              </p>
            )}
          </div>
        )}
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
              renderSummary={(item) => (
                <span className="text-sm text-muted-foreground">
                  {item.name || 'Skill'} ({getSkillLevelLabel(item.level)})
                </span>
              )}
            >
              {(itemIndex) => (
                <div className="space-y-4">
                  <TextField
                    name={`skills.${index}.items.${itemIndex}.name`}
                    label={`Skill ${itemIndex + 1}`}
                    placeholder="JavaScript"
                    required
                  />
                  <FormField
                    control={control}
                    name={`skills.${index}.items.${itemIndex}.level`}
                    render={({ field }) => {
                      const value = typeof field.value === 'number' ? field.value : 3
                      return (
                        <FormItem>
                          <div className="flex items-center justify-between">
                            <FormLabel className="text-sm font-medium">Proficiency</FormLabel>
                            <span className="text-xs text-muted-foreground">
                              {getSkillLevelLabel(value)}
                            </span>
                          </div>
                          <FormControl>
                            <Slider
                              value={[value]}
                              min={0}
                              max={5}
                              step={1}
                              onValueChange={([next]) => field.onChange(next)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )
                    }}
                  />
                </div>
              )}
            </ArrayField>
          </div>
        )}
      </ArrayField>
    </div>
  )
}
