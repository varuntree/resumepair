/**
 * Typography Customizer
 *
 * Font and typography customization controls.
 *
 * @module components/customization/TypographyCustomizer
 */

'use client'

import * as React from 'react'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { useTemplateStore, useTypography } from '@/stores/templateStore'

/**
 * Typography customization panel
 */
export function TypographyCustomizer(): React.ReactElement {
  const typography = useTypography()
  const updateCustomization = useTemplateStore((state) => state.updateCustomization)

  const handleFontChange = (fontFamily: string) => {
    updateCustomization('typography', {
      ...typography,
      fontFamily,
    })
  }

  const handleSizeChange = (value: number[]) => {
    updateCustomization('typography', {
      ...typography,
      fontSize: value[0],
    })
  }

  const handleLineHeightChange = (value: number[]) => {
    updateCustomization('typography', {
      ...typography,
      lineHeight: value[0],
    })
  }

  const fontOptions = [
    { value: 'Inter', label: 'Inter (Sans-serif)' },
    { value: 'JetBrains Mono', label: 'JetBrains Mono (Monospace)' },
    { value: 'Source Serif 4', label: 'Source Serif 4 (Serif)' },
    { value: 'Arial', label: 'Arial (Sans-serif)' },
    { value: 'Georgia', label: 'Georgia (Serif)' },
  ]

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-900">Typography</h3>
        <p className="text-sm text-gray-500">
          Customize font family and text sizing
        </p>
      </div>

      {/* Font Family */}
      <div className="space-y-2">
        <Label htmlFor="font-family" className="text-sm font-medium">
          Font Family
        </Label>
        <Select value={typography.fontFamily} onValueChange={handleFontChange}>
          <SelectTrigger id="font-family">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {fontOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Font Size Scale */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="font-size" className="text-sm font-medium">
            Font Size Scale
          </Label>
          <span className="text-sm font-medium text-gray-700">
            {(typography.fontSize * 100).toFixed(0)}%
          </span>
        </div>
        <Slider
          id="font-size"
          min={0.8}
          max={1.2}
          step={0.05}
          value={[typography.fontSize]}
          onValueChange={handleSizeChange}
        />
        <p className="text-xs text-gray-500">
          Adjust overall text size (80% to 120%)
        </p>
      </div>

      {/* Line Height */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="line-height" className="text-sm font-medium">
            Line Height
          </Label>
          <span className="text-sm font-medium text-gray-700">
            {typography.lineHeight.toFixed(1)}
          </span>
        </div>
        <Slider
          id="line-height"
          min={1.0}
          max={1.8}
          step={0.1}
          value={[typography.lineHeight]}
          onValueChange={handleLineHeightChange}
        />
        <p className="text-xs text-gray-500">
          Adjust spacing between lines (1.0 to 1.8)
        </p>
      </div>
    </div>
  )
}
