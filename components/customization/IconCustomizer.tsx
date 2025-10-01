/**
 * Icon Customizer
 *
 * Icon display and style customization controls.
 *
 * @module components/customization/IconCustomizer
 */

'use client'

import * as React from 'react'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useTemplateStore, useIcons } from '@/stores/templateStore'

/**
 * Icon customization panel
 */
export function IconCustomizer(): React.ReactElement {
  const icons = useIcons()
  const updateCustomization = useTemplateStore((state) => state.updateCustomization)

  const handleEnabledChange = (enabled: boolean) => {
    updateCustomization('icons', {
      ...icons,
      enabled,
    })
  }

  const handleStyleChange = (style: 'outline' | 'solid') => {
    updateCustomization('icons', {
      ...icons,
      style,
    })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-900">Icons</h3>
        <p className="text-sm text-gray-500">
          Configure icon display in your resume
        </p>
      </div>

      {/* Enable Icons Toggle */}
      <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
        <div className="space-y-1">
          <Label htmlFor="icons-enabled" className="text-sm font-medium">
            Show Icons
          </Label>
          <p className="text-xs text-gray-500">
            Display icons next to section headings
          </p>
        </div>
        <Switch
          id="icons-enabled"
          checked={icons.enabled}
          onCheckedChange={handleEnabledChange}
        />
      </div>

      {/* Icon Style */}
      {icons.enabled && (
        <div className="space-y-2">
          <Label htmlFor="icon-style" className="text-sm font-medium">
            Icon Style
          </Label>
          <Select value={icons.style} onValueChange={handleStyleChange}>
            <SelectTrigger id="icon-style">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="outline">Outline</SelectItem>
              <SelectItem value="solid">Solid</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500">
            Choose between outline or filled icon style
          </p>
        </div>
      )}
    </div>
  )
}
