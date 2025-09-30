'use client'

import * as React from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/libs/utils'

export interface TextAreaFieldProps {
  name: string
  label: string
  placeholder?: string
  required?: boolean
  maxLength?: number
  rows?: number
  disabled?: boolean
}

export function TextAreaField({
  name,
  label,
  placeholder,
  required = false,
  maxLength = 500,
  rows = 4,
  disabled = false,
}: TextAreaFieldProps): React.ReactElement {
  const { control } = useFormContext()
  const value = useWatch({ control, name }) as string | undefined
  const charCount = value?.length || 0

  const getCounterColor = (): string => {
    const percentage = charCount / maxLength
    if (percentage >= 1) return 'text-destructive'
    if (percentage >= 0.9) return 'text-foreground'
    return 'text-muted-foreground'
  }

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
            <div className="relative">
              <Textarea
                {...field}
                placeholder={placeholder}
                maxLength={maxLength}
                rows={rows}
                disabled={disabled}
                value={field.value || ''}
                className="resize-none"
              />
              <div className={cn(
                'absolute bottom-2 right-3 text-xs',
                getCounterColor()
              )}>
                {charCount} / {maxLength}
              </div>
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
