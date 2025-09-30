'use client'

import * as React from 'react'
import { useFormContext } from 'react-hook-form'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'

export interface DateFieldProps {
  name: string
  label: string
  required?: boolean
  disabled?: boolean
  allowPresent?: boolean
}

export function DateField({
  name,
  label,
  required = false,
  disabled = false,
  allowPresent = false,
}: DateFieldProps): React.ReactElement {
  const { control } = useFormContext()

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </FormLabel>
          <FormControl>
            <Input
              {...field}
              type="month"
              disabled={disabled}
              value={field.value === 'Present' || !field.value ? '' : field.value.substring(0, 7)}
              onChange={(e) => {
                const value = e.target.value
                if (value) {
                  // Convert YYYY-MM to YYYY-MM-DD
                  field.onChange(`${value}-01`)
                } else {
                  field.onChange('')
                }
              }}
            />
          </FormControl>
          {allowPresent && (
            <label className="flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                checked={field.value === 'Present'}
                onChange={(e) => {
                  field.onChange(e.target.checked ? 'Present' : '')
                }}
                className="h-4 w-4"
              />
              <span className="text-sm text-muted-foreground">Present</span>
            </label>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}