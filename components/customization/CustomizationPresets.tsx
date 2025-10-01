/**
 * Customization Presets
 *
 * Quick-apply preset themes for common customization patterns.
 *
 * @module components/customization/CustomizationPresets
 */

'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { useTemplateStore } from '@/stores/templateStore'
import { Customizations } from '@/types/template'

/**
 * Preset customizations
 */
const presets: Record<string, Partial<Customizations>> = {
  default: {
    colors: {
      primary: '225 52% 8%',      // Navy dark
      secondary: '226 36% 16%',   // Navy medium
      accent: '73 100% 50%',      // Lime
      text: '210 11% 15%',        // Gray 900
      background: '0 0% 100%',    // White
      muted: '210 11% 46%',       // Gray 500
      border: '210 16% 93%',      // Gray 200
    },
  },
  bold: {
    colors: {
      primary: '0 0% 0%',         // Black
      secondary: '220 13% 18%',   // Dark gray
      accent: '73 100% 50%',      // Lime
      text: '0 0% 15%',           // Dark text
      background: '0 0% 100%',    // White
      muted: '0 0% 40%',          // Gray
      border: '0 0% 85%',         // Light gray
    },
    typography: {
      fontFamily: 'Inter',
      fontSize: 1.0,
      lineHeight: 1.3,
      fontWeight: 500,
    },
  },
  minimal: {
    colors: {
      primary: '0 0% 20%',        // Dark gray
      secondary: '0 0% 30%',      // Medium gray
      accent: '0 0% 40%',         // Gray accent
      text: '0 0% 15%',           // Text
      background: '0 0% 100%',    // White
      muted: '0 0% 60%',          // Muted
      border: '0 0% 90%',         // Border
    },
    spacing: {
      sectionGap: 32,
      itemGap: 14,
      pagePadding: 56,
    },
  },
}

/**
 * Preset theme buttons
 */
export function CustomizationPresets(): React.ReactElement {
  const updateCustomizations = useTemplateStore((state) => state.updateCustomizations)

  const applyPreset = (presetKey: string) => {
    const preset = presets[presetKey]
    if (preset) {
      updateCustomizations(preset)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-900">Quick Presets</h3>
        <p className="text-sm text-gray-500">
          Apply pre-configured themes
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Button
          variant="outline"
          onClick={() => applyPreset('default')}
          className="h-auto flex-col items-start p-3"
        >
          <span className="font-semibold text-sm">Default</span>
          <span className="text-xs text-gray-500">Navy & Lime</span>
        </Button>

        <Button
          variant="outline"
          onClick={() => applyPreset('bold')}
          className="h-auto flex-col items-start p-3"
        >
          <span className="font-semibold text-sm">Bold</span>
          <span className="text-xs text-gray-500">High Contrast</span>
        </Button>

        <Button
          variant="outline"
          onClick={() => applyPreset('minimal')}
          className="h-auto flex-col items-start p-3"
        >
          <span className="font-semibold text-sm">Minimal</span>
          <span className="text-xs text-gray-500">Grayscale</span>
        </Button>
      </div>
    </div>
  )
}
