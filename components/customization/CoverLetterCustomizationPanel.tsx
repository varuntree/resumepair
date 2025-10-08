/**
 * Cover Letter Customization Panel
 *
 * Main container for cover letter template and appearance customization.
 * Similar to resume customization but excludes icons (cover letters don't use icons).
 *
 * @module components/customization/CoverLetterCustomizationPanel
 */

'use client'

import * as React from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { CustomizationHeader } from './CustomizationHeader'
import { CustomizationTabs } from './CustomizationTabs'
import { CoverLetterTemplateSelector } from './CoverLetterTemplateSelector'
import {
  useCoverLetterTemplateStore,
  useCoverLetterColors,
  useCoverLetterTypography,
  useCoverLetterSpacing,
} from '@/stores/coverLetterTemplateStore'

/**
 * Main cover letter customization panel component
 */
export function CoverLetterCustomizationPanel(): React.ReactElement {
  const [activeTab, setActiveTab] = React.useState('template')
  const updateCustomization = useCoverLetterTemplateStore((state) => state.updateCustomization)

  // Get current customizations
  const colors = useCoverLetterColors()
  const typography = useCoverLetterTypography()
  const spacing = useCoverLetterSpacing()

  // Color handlers
  const handleColorChange = (key: keyof typeof colors, value: string) => {
    updateCustomization('colors', {
      ...colors,
      [key]: value,
    })
  }

  // Typography handlers
  const handleTypographyChange = (key: keyof typeof typography, value: string | number) => {
    updateCustomization('typography', {
      ...typography,
      [key]: value,
    })
  }

  // Spacing handlers
  const handleSpacingChange = (key: keyof typeof spacing, value: number) => {
    updateCustomization('spacing', {
      ...spacing,
      [key]: value,
    })
  }

  return (
    <div className="h-full flex flex-col min-h-0">
      <CustomizationHeader title="Customize Cover Letter" />

      <div className="flex-1 min-h-0 px-6 pb-6 pt-0">
        <Card className="border-gray-200">
          <div className="p-6 space-y-6">
            <CustomizationTabs activeTab={activeTab} onTabChange={setActiveTab} />

            {/* Template Tab */}
            {activeTab === 'template' && (
              <div className="space-y-6 pt-4">
                <CoverLetterTemplateSelector />
              </div>
            )}

            {/* Colors Tab */}
            {activeTab === 'colors' && (
              <div className="space-y-6 pt-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-900">Colors</h3>
                  <p className="text-sm text-gray-500">
                    Customize your cover letter colors using HSL format
                  </p>
                </div>

                <div className="space-y-4">
                  {[
                    {
                      key: 'primary' as const,
                      label: 'Primary Color',
                      description: 'Main heading color',
                    },
                    {
                      key: 'accent' as const,
                      label: 'Accent Color',
                      description: 'Links and highlights',
                    },
                    { key: 'text' as const, label: 'Text Color', description: 'Body text color' },
                    {
                      key: 'background' as const,
                      label: 'Background Color',
                      description: 'Page background',
                    },
                  ].map((field) => (
                    <div key={field.key} className="space-y-2">
                      <Label htmlFor={field.key} className="text-sm font-medium">
                        {field.label}
                      </Label>
                      <div className="flex gap-3">
                        <div
                          className="h-10 w-10 rounded border border-gray-300 shadow-sm"
                          style={{ backgroundColor: `hsl(${colors[field.key]})` }}
                          title={`hsl(${colors[field.key]})`}
                        />
                        <Input
                          id={field.key}
                          type="text"
                          value={colors[field.key]}
                          onChange={(e) => handleColorChange(field.key, e.target.value)}
                          placeholder="225 52% 8%"
                          className="flex-1"
                        />
                      </div>
                      <p className="text-xs text-gray-500">{field.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Typography Tab (no icons for cover letters) */}
            {activeTab === 'typography' && (
              <div className="space-y-6 pt-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-900">Typography</h3>
                  <p className="text-sm text-gray-500">
                    Adjust font family, size, and spacing
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Font Size */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Font Size Scale</Label>
                      <span className="text-sm font-medium text-gray-700">
                        {typography.fontSize.toFixed(2)}x
                      </span>
                    </div>
                    <Slider
                      value={[typography.fontSize]}
                      onValueChange={([value]) => handleTypographyChange('fontSize', value)}
                      min={0.8}
                      max={1.2}
                      step={0.05}
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500">Scale all font sizes</p>
                  </div>

                  {/* Line Height */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Line Height</Label>
                      <span className="text-sm font-medium text-gray-700">
                        {typography.lineHeight.toFixed(2)}
                      </span>
                    </div>
                    <Slider
                      value={[typography.lineHeight]}
                      onValueChange={([value]) => handleTypographyChange('lineHeight', value)}
                      min={1.0}
                      max={1.8}
                      step={0.1}
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500">Space between lines of text</p>
                  </div>
                </div>
              </div>
            )}

            {/* Spacing Tab */}
            {activeTab === 'spacing' && (
              <div className="space-y-6 pt-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-900">Spacing</h3>
                  <p className="text-sm text-gray-500">Adjust spacing and margins</p>
                </div>

                <div className="space-y-6">
                  {/* Section Gap */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Section Gap</Label>
                      <span className="text-sm font-medium text-gray-700">
                        {spacing.sectionGap}px
                      </span>
                    </div>
                    <Slider
                      value={[spacing.sectionGap]}
                      onValueChange={([value]) => handleSpacingChange('sectionGap', value)}
                      min={12}
                      max={48}
                      step={4}
                      className="w-full"
                    />
                  </div>

                  {/* Paragraph Gap */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Paragraph Gap</Label>
                      <span className="text-sm font-medium text-gray-700">
                        {spacing.paragraphGap}px
                      </span>
                    </div>
                    <Slider
                      value={[spacing.paragraphGap]}
                      onValueChange={([value]) => handleSpacingChange('paragraphGap', value)}
                      min={8}
                      max={20}
                      step={2}
                      className="w-full"
                    />
                  </div>

                  {/* Page Padding */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Page Margins</Label>
                      <span className="text-sm font-medium text-gray-700">
                        {spacing.pagePadding}px
                      </span>
                    </div>
                    <Slider
                      value={[spacing.pagePadding]}
                      onValueChange={([value]) => handleSpacingChange('pagePadding', value)}
                      min={24}
                      max={96}
                      step={8}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
