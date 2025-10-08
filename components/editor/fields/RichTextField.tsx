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
import { RichTextEditor } from '@/components/rich-text/RichTextEditor'
import { parseHtmlToBlocks, blocksToHtml } from '@/libs/rich-text/serializer'
import type { RichTextBlock } from '@/types/cover-letter'
import { cn } from '@/libs/utils'

const EMPTY_VALUE: RichTextBlock[] = [
  { type: 'paragraph', content: [{ text: '' }] },
]

export interface RichTextFieldProps {
  name: string
  label: string
  placeholder?: string
  maxLength?: number
  disabled?: boolean
  helperText?: string
}

export function RichTextField({
  name,
  label,
  placeholder = 'Start typing... ',
  maxLength,
  disabled = false,
  helperText,
}: RichTextFieldProps): React.ReactElement {
  const { control } = useFormContext()

  const toBlocks = React.useCallback((value: string | undefined): RichTextBlock[] => {
    if (typeof window === 'undefined') return EMPTY_VALUE
    if (!value) return EMPTY_VALUE
    try {
      const parsed = parseHtmlToBlocks(value)
      return parsed.length ? parsed : EMPTY_VALUE
    } catch (error) {
      console.warn('[RichTextField] Failed to parse HTML value', error)
      return EMPTY_VALUE
    }
  }, [])

  const countCharacters = React.useCallback((blocks: RichTextBlock[]): number => {
    return blocks
      .map((block) => block.content.map((run) => run.text).join(''))
      .join('\n')
      .replace(/\s+/g, ' ')
      .trim().length
  }, [])

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const blocks = toBlocks(field.value as string | undefined)
        const charCount = countCharacters(blocks)
        const overLimit = maxLength ? charCount > maxLength : false

        const handleChange = (next: RichTextBlock[]) => {
          if (maxLength) {
            const length = countCharacters(next)
            if (length > maxLength) {
              // Prevent updates beyond limit by early return
              return
            }
          }

          const html = blocksToHtml(next)
          field.onChange(html)
        }

        return (
          <FormItem className="space-y-2">
            <FormLabel className="flex items-center justify-between text-sm font-medium text-gray-900">
              <span>{label}</span>
              {maxLength ? (
                <span className={cn('text-xs', overLimit ? 'text-destructive' : 'text-muted-foreground')}>
                  {charCount} / {maxLength}
                </span>
              ) : null}
            </FormLabel>
            <FormControl>
              <RichTextEditor
                value={blocks}
                onChange={handleChange}
                placeholder={placeholder}
                disabled={disabled}
                className="border border-input rounded-lg"
              />
            </FormControl>
            {helperText ? <p className="text-xs text-muted-foreground">{helperText}</p> : null}
            <FormMessage />
          </FormItem>
        )
      }}
    />
  )
}
