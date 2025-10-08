/**
 * Cover Letter Customization Panel (Document-Scoped)
 */

'use client'

import * as React from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useCoverLetterStore } from '@/stores/coverLetterStore'
import { createDefaultCoverLetterAppearance, createDefaultCoverLetterSettings } from '@/types/cover-letter'
import type { CoverLetterAppearance } from '@/types/cover-letter'
import { CustomizationHeader } from './CustomizationHeader'

export function CoverLetterCustomizationPanel(): React.ReactElement {
  const document = useCoverLetterStore((state) => state.document)
  const updateDocument = useCoverLetterStore((state) => state.updateDocument)

  const appearance = React.useMemo<CoverLetterAppearance>(() => {
    const base = document?.appearance
    if (base) return base
    const pageSize = document?.settings?.pageSize ?? 'Letter'
    return createDefaultCoverLetterAppearance(pageSize)
  }, [document])

  const disabled = !document

  const commit = React.useCallback(
    (next: CoverLetterAppearance, options?: { pageFormat?: 'A4' | 'Letter' }) => {
      const baseSettings = document?.settings ?? createDefaultCoverLetterSettings()
      updateDocument({
        appearance: next,
        ...(options?.pageFormat
          ? {
              settings: {
                ...baseSettings,
                pageSize: options.pageFormat,
              },
            }
          : {}),
      })
    },
    [updateDocument, document]
  )

  const handleThemeChange = (key: keyof CoverLetterAppearance['theme'], value: string) => {
    commit({
      ...appearance,
      theme: {
        ...appearance.theme,
        [key]: value,
      },
    })
  }

  const handleTypographyChange = (key: keyof CoverLetterAppearance['typography'], value: string | number) => {
    commit({
      ...appearance,
      typography: {
        ...appearance.typography,
        [key]: value,
      },
    })
  }

  const handleMarginChange = (value: number) => {
    commit({
      ...appearance,
      layout: {
        ...appearance.layout,
        margin: value,
      },
    })
  }

  const handlePageFormat = (value: 'A4' | 'Letter') => {
    commit(
      {
        ...appearance,
        layout: {
          ...appearance.layout,
          pageFormat: value,
        },
      },
      { pageFormat: value }
    )
  }

  const handleCustomCss = (value: string) => {
    commit({
      ...appearance,
      customCss: value.trim().length ? value : undefined,
    })
  }

  return (
    <div className="h-full flex flex-col min-h-0">
      <CustomizationHeader
        title="Customize Cover Letter"
        disabled={disabled}
        onReset={() => commit(createDefaultCoverLetterAppearance(document?.settings?.pageSize ?? 'Letter'))}
      />

      <div className="flex-1 min-h-0 px-6 pb-6 pt-0">
        <Card className="border-gray-200">
          <div className="space-y-8 p-6">
            <section className="space-y-4">
              <header>
                <h3 className="text-sm font-medium text-gray-900">Quick Palettes</h3>
                <p className="text-sm text-gray-500">Apply curated cover letter color schemes.</p>
              </header>
              <div className="grid gap-3 sm:grid-cols-3">
                {COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() =>
                      commit({
                        ...appearance,
                        theme: { ...preset.theme },
                      })
                    }
                    disabled={disabled}
                    className={`rounded-lg border p-3 text-left shadow-sm transition ${
                      matchesTheme(appearance.theme, preset.theme)
                        ? 'border-primary ring-2 ring-primary/40'
                        : 'border-gray-200 hover:border-primary/40'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {Object.values(preset.theme).map((color, idx) => (
                        <span
                          key={idx}
                          className="h-6 w-6 rounded-full border"
                          style={{ backgroundColor: color, borderColor: 'rgba(0,0,0,0.08)' }}
                        />
                      ))}
                    </div>
                    <p className="mt-2 text-xs font-medium text-gray-700">{preset.label}</p>
                  </button>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <header>
                <h3 className="text-sm font-medium text-gray-900">Theme</h3>
                <p className="text-sm text-gray-500">Update brand colors.</p>
              </header>
              <div className="grid gap-4 sm:grid-cols-3">
                {(
                  [
                    { key: 'primary', label: 'Primary' },
                    { key: 'text', label: 'Text' },
                    { key: 'background', label: 'Background' },
                  ] as const
                ).map(({ key, label }) => (
                  <div key={key} className="space-y-2">
                    <Label className="text-sm font-medium" htmlFor={`cover-color-${key}`}>
                      {label} Color
                    </Label>
                    <div className="flex items-center gap-3">
                      <Input
                        id={`cover-color-${key}`}
                        type="color"
                        value={normalizeColor(appearance.theme[key])}
                        onChange={(e) => handleThemeChange(key, e.target.value)}
                        disabled={disabled}
                        className="h-11 w-14 p-1"
                      />
                      <Input
                        type="text"
                        value={appearance.theme[key]}
                        onChange={(e) => handleThemeChange(key, e.target.value)}
                        disabled={disabled}
                        className="flex-1"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <header>
                <h3 className="text-sm font-medium text-gray-900">Typography</h3>
                <p className="text-sm text-gray-500">Font family, size, and line height.</p>
              </header>
              <div className="space-y-3">
                <Label className="text-xs uppercase tracking-wide text-gray-500">Suggestions</Label>
                <div className="flex flex-wrap gap-2">
                  {FONT_SUGGESTIONS.map((font) => (
                    <button
                      key={font}
                      type="button"
                      disabled={disabled}
                      onClick={() => handleTypographyChange('fontFamily', font)}
                      style={{ fontFamily: font }}
                      className={`rounded-md border px-3 py-1.5 text-sm transition ${
                        appearance.typography.fontFamily.toLowerCase() === font.toLowerCase()
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-gray-200 hover:border-primary/40'
                      }`}
                    >
                      {font}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium" htmlFor="cover-font-family">
                    Font Family
                  </Label>
                  <Input
                    id="cover-font-family"
                    type="text"
                    value={appearance.typography.fontFamily}
                    onChange={(e) => handleTypographyChange('fontFamily', e.target.value)}
                    disabled={disabled}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Base Size</Label>
                    <span className="text-sm text-gray-600">{appearance.typography.fontSize}px</span>
                  </div>
                  <Slider
                    value={[appearance.typography.fontSize]}
                    onValueChange={([value]) => handleTypographyChange('fontSize', value)}
                    min={12}
                    max={24}
                    step={1}
                    disabled={disabled}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Line Height</Label>
                    <span className="text-sm text-gray-600">{appearance.typography.lineHeight.toFixed(2)}</span>
                  </div>
                  <Slider
                    value={[appearance.typography.lineHeight]}
                    onValueChange={([value]) => handleTypographyChange('lineHeight', Number(value.toFixed(2)))}
                    min={1.0}
                    max={2.0}
                    step={0.05}
                    disabled={disabled}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium" htmlFor="cover-show-page-numbers">
                      Show Page Numbers
                    </Label>
                    <p className="text-xs text-gray-500">Include pagination footer when exporting.</p>
                  </div>
                  <Switch
                    id="cover-show-page-numbers"
                    checked={appearance.layout.showPageNumbers}
                    onCheckedChange={(checked) =>
                      commit({
                        ...appearance,
                        layout: {
                          ...appearance.layout,
                          showPageNumbers: checked,
                        },
                      })
                    }
                    disabled={disabled}
                  />
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <header>
                <h3 className="text-sm font-medium text-gray-900">Layout</h3>
                <p className="text-sm text-gray-500">Page format and margins.</p>
              </header>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Page Format</Label>
                  <div className="flex gap-3">
                    {(['Letter', 'A4'] as const).map((format) => (
                      <button
                        key={format}
                        type="button"
                        onClick={() => handlePageFormat(format)}
                        disabled={disabled}
                        className={`rounded-md border px-3 py-2 text-sm ${
                          appearance.layout.pageFormat === format
                            ? 'border-primary text-primary'
                            : 'border-gray-300 text-gray-600'
                        }`}
                      >
                        {format}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Margin</Label>
                    <span className="text-sm text-gray-600">{appearance.layout.margin}px</span>
                  </div>
                  <Slider
                    value={[appearance.layout.margin]}
                    onValueChange={([value]) => handleMarginChange(value)}
                    min={32}
                    max={120}
                    step={4}
                    disabled={disabled}
                  />
                </div>
              </div>
            </section>

            <section className="space-y-2">
              <header>
                <h3 className="text-sm font-medium text-gray-900">Custom CSS</h3>
                <p className="text-sm text-gray-500">Applied to the preview/export for fine-grained control.</p>
              </header>
              <Textarea
                value={appearance.customCss ?? ''}
                onChange={(e) => handleCustomCss(e.target.value)}
                disabled={disabled}
                rows={6}
                placeholder={'p { font-size: 15px; }'}
              />
            </section>
          </div>
        </Card>
      </div>
    </div>
  )
}

function normalizeColor(value: string): string {
  if (!value) return '#000000'
  if (value.startsWith('#')) return value
  if (value.startsWith('hsl')) return value
  if (/^\d+\s+\d+%\s+\d+%$/.test(value)) {
    return `hsl(${value})`
  }
  return value
}

const COLOR_PRESETS = [
  {
    id: 'deep-blue',
    label: 'Deep Blue',
    theme: { background: '#ffffff', text: '#1f2937', primary: '#1d4ed8' },
  },
  {
    id: 'warm-neutral',
    label: 'Warm Neutral',
    theme: { background: '#fdf6ec', text: '#3f2517', primary: '#b45309' },
  },
  {
    id: 'midnight',
    label: 'Midnight',
    theme: { background: '#0f172a', text: '#e2e8f0', primary: '#38bdf8' },
  },
]

const FONT_SUGGESTIONS = ['Inter', 'Merriweather', 'Lora', 'Open Sans', 'Georgia']

function matchesTheme(a: CoverLetterAppearance['theme'], b: CoverLetterAppearance['theme']): boolean {
  return a.background === b.background && a.text === b.text && a.primary === b.primary
}
