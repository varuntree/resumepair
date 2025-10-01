/**
 * Spacing Customizer
 *
 * Spacing and layout customization controls.
 *
 * @module components/customization/SpacingCustomizer
 */

'use client'

import * as React from 'react'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { useTemplateStore, useSpacing } from '@/stores/templateStore'

/**
 * Spacing customization panel
 */
export function SpacingCustomizer(): React.ReactElement {
  const spacing = useSpacing()
  const updateCustomization = useTemplateStore((state) => state.updateCustomization)

  const handleSectionGapChange = (value: number[]) => {
    updateCustomization('spacing', {
      ...spacing,
      sectionGap: value[0],
    })
  }

  const handleItemGapChange = (value: number[]) => {
    updateCustomization('spacing', {
      ...spacing,
      itemGap: value[0],
    })
  }

  const handlePaddingChange = (value: number[]) => {
    updateCustomization('spacing', {
      ...spacing,
      pagePadding: value[0],
    })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-900">Spacing</h3>
        <p className="text-sm text-gray-500">
          Adjust spacing between sections and page margins
        </p>
      </div>

      {/* Section Gap */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="section-gap" className="text-sm font-medium">
            Section Gap
          </Label>
          <span className="text-sm font-medium text-gray-700">
            {spacing.sectionGap}px
          </span>
        </div>
        <Slider
          id="section-gap"
          min={12}
          max={48}
          step={4}
          value={[spacing.sectionGap]}
          onValueChange={handleSectionGapChange}
        />
        <p className="text-xs text-gray-500">
          Space between major sections (12-48px)
        </p>
      </div>

      {/* Item Gap */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="item-gap" className="text-sm font-medium">
            Item Gap
          </Label>
          <span className="text-sm font-medium text-gray-700">
            {spacing.itemGap}px
          </span>
        </div>
        <Slider
          id="item-gap"
          min={8}
          max={24}
          step={2}
          value={[spacing.itemGap]}
          onValueChange={handleItemGapChange}
        />
        <p className="text-xs text-gray-500">
          Space between items within sections (8-24px)
        </p>
      </div>

      {/* Page Padding */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="page-padding" className="text-sm font-medium">
            Page Padding
          </Label>
          <span className="text-sm font-medium text-gray-700">
            {spacing.pagePadding}px
          </span>
        </div>
        <Slider
          id="page-padding"
          min={24}
          max={72}
          step={4}
          value={[spacing.pagePadding]}
          onValueChange={handlePaddingChange}
        />
        <p className="text-xs text-gray-500">
          Page margins (24-72px)
        </p>
      </div>
    </div>
  )
}
