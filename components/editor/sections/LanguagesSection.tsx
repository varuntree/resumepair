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

const LANGUAGE_LEVELS = [
  { value: 1, label: 'Elementary' },
  { value: 2, label: 'Conversational' },
  { value: 3, label: 'Professional' },
  { value: 4, label: 'Fluent' },
  { value: 5, label: 'Native' },
]

export function LanguagesSection(): React.ReactElement {
  const { control } = useFormContext()
  const emptyLanguage = {
    name: '',
    level: 'Conversational',
  }

  return (
    <div className="space-y-6">
      <ArrayField
        name="languages"
        label="Languages"
        emptyItem={emptyLanguage}
        maxItems={10}
        renderSummary={(item) => (
          <span className="text-sm text-muted-foreground">
            {item.name || 'Language'} — {item.level || 'Conversational'}
          </span>
        )}
      >
        {(index) => (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField
              name={`languages.${index}.name`}
              label="Language"
              placeholder="English"
              required
            />
            <FormField
              control={control}
              name={`languages.${index}.level`}
              render={({ field }) => {
                const value = toSliderValue(field.value as string | undefined)
                return (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Proficiency</FormLabel>
                      <span className="text-xs text-muted-foreground">{fromSliderValue(value)}</span>
                    </div>
                    <FormControl>
                      <Slider
                        value={[value]}
                        min={1}
                        max={5}
                        step={1}
                        onValueChange={([next]) => field.onChange(fromSliderValue(next))}
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
  )
}

function toSliderValue(label: string | undefined): number {
  const found = LANGUAGE_LEVELS.find((entry) => entry.label === label)
  return found ? found.value : 2
}

function fromSliderValue(value: number): string {
  const found = LANGUAGE_LEVELS.find((entry) => entry.value === value)
  return found ? found.label : LANGUAGE_LEVELS[1].label
}
