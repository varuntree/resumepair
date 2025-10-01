/**
 * Color Customizer
 *
 * Color customization controls using simple text inputs (HSL format).
 * Advanced color picker deferred to later.
 *
 * @module components/customization/ColorCustomizer
 */

'use client'

import * as React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useTemplateStore, useColors } from '@/stores/templateStore'

/**
 * Color customization panel
 */
export function ColorCustomizer(): React.ReactElement {
  const colors = useColors()
  const updateCustomization = useTemplateStore((state) => state.updateCustomization)

  const handleColorChange = (key: keyof typeof colors, value: string) => {
    updateCustomization('colors', {
      ...colors,
      [key]: value,
    })
  }

  const colorFields = [
    { key: 'primary' as const, label: 'Primary Color', description: 'Main heading color' },
    { key: 'accent' as const, label: 'Accent Color', description: 'Links and highlights' },
    { key: 'text' as const, label: 'Text Color', description: 'Body text color' },
    { key: 'background' as const, label: 'Background Color', description: 'Page background' },
  ]

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-900">Colors</h3>
        <p className="text-sm text-gray-500">
          Customize your resume colors using HSL format (e.g., &ldquo;225 52% 8%&rdquo;)
        </p>
      </div>

      <div className="space-y-4">
        {colorFields.map((field) => (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key} className="text-sm font-medium">
              {field.label}
            </Label>
            <div className="flex gap-3">
              {/* Color preview swatch */}
              <div
                className="h-10 w-10 rounded border border-gray-300 shadow-sm"
                style={{ backgroundColor: `hsl(${colors[field.key]})` }}
                title={`hsl(${colors[field.key]})`}
              />
              {/* HSL input */}
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

      <div className="rounded-md bg-blue-50 p-4">
        <p className="text-xs text-blue-900">
          <strong>Tip:</strong> HSL format is &ldquo;hue saturation% lightness%&rdquo;.
          For example, &ldquo;225 52% 8%&rdquo; creates a dark navy blue.
        </p>
      </div>
    </div>
  )
}
