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

export interface TextFieldProps {
  name: string
  label: string
  placeholder?: string
  required?: boolean
  maxLength?: number
  disabled?: boolean
}

export function TextField({
  name,
  label,
  placeholder,
  required = false,
  maxLength,
  disabled = false,
}: TextFieldProps): React.ReactElement {
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
              placeholder={placeholder}
              maxLength={maxLength}
              disabled={disabled}
              value={field.value || ''}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}