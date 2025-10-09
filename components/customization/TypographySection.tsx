'use client'

import * as React from 'react'
import type { ResumeAppearance } from '@/types/resume'
import { fonts } from '@/libs/utils/fonts'
import { loadFontFamily } from '@/libs/utils/fontLoader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/libs/utils'

const POPULAR_FONTS = [
  'Inter',
  'IBM Plex Sans',
  'IBM Plex Serif',
  'Lora',
  'Merriweather',
  'Open Sans',
  'Roboto',
  'Source Sans Pro',
  'Work Sans',
]

const MAX_RESULTS = 12

/* eslint-disable-next-line no-unused-vars */
type TypographyChangeHandler = (change: Partial<ResumeAppearance['typography']>) => void

export interface TypographySectionProps {
  value: ResumeAppearance['typography']
  disabled?: boolean
  onChange: TypographyChangeHandler
}

export function TypographySection({ value, disabled, onChange }: TypographySectionProps) {
  const [query, setQuery] = React.useState('')

  React.useEffect(() => {
    if (value.fontFamily) {
      loadFontFamily(value.fontFamily)
    }
  }, [value.fontFamily])

  const suggestions = React.useMemo(() => {
    if (!query.trim()) {
      return POPULAR_FONTS
    }
    const normalized = query.trim().toLowerCase()
    const matches = fonts
      .filter((font) => font.family.toLowerCase().includes(normalized))
      .slice(0, MAX_RESULTS)
      .map((font) => font.family)

    if (!matches.length) {
      return POPULAR_FONTS
    }
    return matches
  }, [query])

  const handleFontSelect = (family: string) => {
    loadFontFamily(family)
    onChange({ fontFamily: family })
  }

  return (
    <section className="space-y-4">
      <header>
        <h3 className="text-sm font-medium text-gray-900">Typography</h3>
        <p className="text-sm text-gray-500">Font family, size, and line height.</p>
      </header>

      <div className="space-y-3">
        <Label className="text-xs uppercase tracking-wide text-gray-500">Search Fonts</Label>
        <Input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search Google Fonts"
          disabled={disabled}
        />
      </div>

      <div className="space-y-3">
        <Label className="text-xs uppercase tracking-wide text-gray-500">Suggestions</Label>
        <ScrollArea className="h-32 rounded-md border border-gray-200 bg-white p-2">
          <div className="flex flex-wrap gap-2">
            {suggestions.map((font) => (
              <Button
                key={font}
                type="button"
                variant={
                  value.fontFamily.toLowerCase() === font.toLowerCase() ? 'default' : 'outline'
                }
                size="sm"
                disabled={disabled}
                onClick={() => handleFontSelect(font)}
                style={{ fontFamily: font }}
                className={cn(
                  'border border-dashed px-3 py-1.5 text-sm transition-colors',
                  value.fontFamily.toLowerCase() === font.toLowerCase()
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-gray-200 text-gray-700 hover:border-primary/40'
                )}
              >
                {font}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium" htmlFor="font-family-input">
            Font Family
          </Label>
          <Input
            id="font-family-input"
            type="text"
            value={value.fontFamily}
            onChange={(event) => handleFontSelect(event.target.value)}
            disabled={disabled}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Base Size</Label>
            <span className="text-sm text-gray-600">{value.fontSize}px</span>
          </div>
          <Slider
            value={[value.fontSize]}
            onValueChange={([val]) => onChange({ fontSize: val })}
            min={12}
            max={26}
            step={1}
            disabled={disabled}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Line Height</Label>
            <span className="text-sm text-gray-600">{value.lineHeight.toFixed(2)}</span>
          </div>
          <Slider
            value={[value.lineHeight]}
            onValueChange={([val]) =>
              onChange({ lineHeight: Number(Math.min(2, Math.max(1, val)).toFixed(2)) })
            }
            min={1.0}
            max={2.2}
            step={0.05}
            disabled={disabled}
          />
        </div>
      </div>
    </section>
  )
}
