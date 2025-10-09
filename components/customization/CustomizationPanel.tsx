/**
 * Resume Customization Panel (Document-Scoped)
 *
 * Provides minimal appearance controls persisted directly on the resume document.
 * Future phases will expand these controls using Reactive Resume patterns.
 */

'use client'

import * as React from 'react'
import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useDocumentStore } from '@/stores/documentStore'
import { listResumeTemplateMetadata } from '@/libs/reactive-artboard/catalog'
import { createDefaultAppearance, createDefaultSettings } from '@/types/resume'
import type { ResumeAppearance, ResumeTemplateId } from '@/types/resume'
  import { normalizeResumeData } from '@/libs/repositories/normalizers'
import { CustomizationHeader } from './CustomizationHeader'
import { TypographySection } from './TypographySection'
import { LayoutEditor } from './LayoutEditor'

export function CustomizationPanel(): React.ReactElement {
  const document = useDocumentStore((state) => state.document)
  const updateDocument = useDocumentStore((state) => state.updateDocument)

  const appearance = React.useMemo<ResumeAppearance>(() => {
    const pageSize = document?.settings?.pageSize ?? 'Letter'
    if (document) {
      try {
        return (normalizeResumeData(document).appearance ?? createDefaultAppearance(pageSize)) as ResumeAppearance
      } catch {
        return createDefaultAppearance(pageSize)
      }
    }
    return createDefaultAppearance(pageSize)
  }, [document])

  const disabled = !document
  const templates = React.useMemo(() => listResumeTemplateMetadata(), [])

  const commit = React.useCallback(
    (next: ResumeAppearance, options?: { pageFormat?: 'A4' | 'Letter' }) => {
      const baseSettings = document?.settings ?? createDefaultSettings()
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

  const handleThemeChange = (key: keyof ResumeAppearance['theme'], value: string) => {
    commit({
      ...appearance,
      theme: {
        ...appearance.theme,
        [key]: value,
      },
    })
  }

  const handleTypographyUpdate = React.useCallback(
    (updates: Partial<ResumeAppearance['typography']>) => {
      commit({
        ...appearance,
        typography: {
          ...appearance.typography,
          ...updates,
        },
      })
    },
    [appearance, commit]
  )

  const handleMarginChange = (value: number) => {
    commit({
      ...appearance,
      layout_settings: {
        ...appearance.layout_settings,
        margin: value,
      },
    })
  }

  const handlePageFormat = (value: 'A4' | 'Letter') => {
    commit(
      {
        ...appearance,
        layout_settings: {
          ...appearance.layout_settings,
          pageFormat: value,
        },
      },
      { pageFormat: value }
    )
  }

  const handleTemplateChange = (value: ResumeTemplateId) => {
    if (appearance.template === value) return
    commit({
      ...appearance,
      template: value,
    })
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
        title="Customize Resume"
        disabled={disabled}
        onReset={() => commit(createDefaultAppearance(document?.settings?.pageSize ?? 'Letter'))}
      />

      <div className="flex-1 min-h-0 px-4 pb-4 pt-0">
        <Card className="border-gray-200">
          <div className="space-y-6 p-4">
            <section className="space-y-4">
              <header>
                <h3 className="text-sm font-medium text-gray-900">Template</h3>
                <p className="text-sm text-gray-500">Switch between artboard templates inspired by Reactive Resume.</p>
              </header>
              <div className="grid gap-4 md:grid-cols-2">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => handleTemplateChange(template.id)}
                    disabled={disabled}
                    className={`flex items-center gap-3 rounded-xl border p-4 transition ${
                      appearance.template === template.id
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-gray-200 hover:border-primary/40'
                    }`}
                  >
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-white">
                      <Image
                        src={template.thumbnail}
                        alt={`${template.name} thumbnail`}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    </div>
                    <div className="flex flex-col items-start gap-1 text-left">
                      <span className="text-sm font-semibold text-gray-900">{template.name}</span>
                      <span className="text-xs text-gray-500">{template.description}</span>
                      <div className="flex flex-wrap gap-1 pt-1">
                        {template.features.slice(0, 2).map((feature) => (
                          <span
                            key={feature}
                            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                              appearance.template === template.id
                                ? 'bg-primary text-white'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <header>
                <h3 className="text-sm font-medium text-gray-900">Quick Palettes</h3>
                <p className="text-sm text-gray-500">Apply curated color schemes inspired by Reactive Resume.</p>
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
                <p className="text-sm text-gray-500">Adjust primary, text, and background colors.</p>
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
                    <Label className="text-sm font-medium" htmlFor={`color-${key}`}>
                      {label} Color
                    </Label>
                    <div className="flex items-center gap-3">
                      <Input
                        id={`color-${key}`}
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

                        <TypographySection
              value={appearance.typography}
              disabled={disabled}
              onChange={handleTypographyUpdate}
            />

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
                          appearance.layout_settings.pageFormat === format
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
                    <span className="text-sm text-gray-600">{appearance.layout_settings.margin}px</span>
                  </div>
                  <Slider
                    value={[appearance.layout_settings.margin]}
                    onValueChange={([value]) => handleMarginChange(value)}
                    min={24}
                    max={96}
                    step={4}
                    disabled={disabled}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium" htmlFor="show-page-numbers">
                      Show Page Numbers
                    </Label>
                    <p className="text-xs text-gray-500">Display footer pagination on multi-page exports.</p>
                  </div>
                  <Switch
                    id="show-page-numbers"
                    checked={appearance.layout_settings.showPageNumbers}
                    onCheckedChange={(checked) =>
                      commit({
                        ...appearance,
                        layout_settings: {
                          ...appearance.layout_settings,
                          showPageNumbers: checked,
                        },
                      })
                    }
                    disabled={disabled}
                  />
                </div>
                <LayoutEditor disabled={disabled} />
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
                placeholder={'.artboard-section-heading { letter-spacing: 0.12em; }'}
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
    id: 'navy-lime',
    label: 'Navy & Lime',
    theme: { background: '#ffffff', text: '#111827', primary: '#2563eb' },
  },
  {
    id: 'forest-sand',
    label: 'Forest & Sand',
    theme: { background: '#f5f5f0', text: '#1b4332', primary: '#2d6a4f' },
  },
  {
    id: 'charcoal-coral',
    label: 'Charcoal & Coral',
    theme: { background: '#0f172a', text: '#e2e8f0', primary: '#fb7185' },
  },
]

function matchesTheme(a: ResumeAppearance['theme'], b: ResumeAppearance['theme']): boolean {
  return a.background === b.background && a.text === b.text && a.primary === b.primary
}
