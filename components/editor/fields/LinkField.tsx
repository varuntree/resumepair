'use client'

import * as React from 'react'
import { useFormContext } from 'react-hook-form'
import { Link as LinkIcon } from 'lucide-react'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'

export interface LinkFieldProps {
  name: string
  label: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
}

export function LinkField({
  name,
  label,
  placeholder,
  required = false,
  disabled = false,
}: LinkFieldProps): React.ReactElement {
  const { control } = useFormContext()

  const formatUrl = (value: string): string => {
    if (!value) return value
    const trimmed = value.trim()
    if (trimmed && !trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      return `https://${trimmed}`
    }
    return trimmed
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
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                {...field}
                type="url"
                placeholder={placeholder}
                disabled={disabled}
                className="pl-9"
                value={field.value || ''}
                onBlur={(e) => {
                  const formatted = formatUrl(e.target.value)
                  field.onChange(formatted)
                  field.onBlur()
                }}
              />
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}