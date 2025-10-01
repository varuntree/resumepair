/**
 * Viewport Selector
 *
 * Dropdown for selecting preview viewport size.
 *
 * @module components/preview/ViewportSelector
 */

'use client'

import * as React from 'react'
import { Monitor, Tablet, Smartphone, Printer } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { usePreviewStore } from '@/stores/previewStore'

/**
 * Viewport selector dropdown
 */
export function ViewportSelector(): React.ReactElement {
  const viewport = usePreviewStore((state) => state.viewport)
  const setViewport = usePreviewStore((state) => state.setViewport)

  const viewports = [
    { value: 'desktop', label: 'Desktop', icon: Monitor },
    { value: 'tablet', label: 'Tablet', icon: Tablet },
    { value: 'mobile', label: 'Mobile', icon: Smartphone },
    { value: 'print', label: 'Print', icon: Printer },
  ]

  const currentViewport = viewports.find((v) => v.value === viewport)
  const CurrentIcon = currentViewport?.icon || Monitor

  return (
    <div className="flex items-center gap-2">
      <CurrentIcon className="h-4 w-4 text-gray-500" aria-hidden="true" />
      <Select value={viewport} onValueChange={setViewport}>
        <SelectTrigger className="w-[120px]" aria-label="Viewport mode">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {viewports.map((vp) => {
            const Icon = vp.icon
            return (
              <SelectItem key={vp.value} value={vp.value}>
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  <span>{vp.label}</span>
                </div>
              </SelectItem>
            )
          })}
        </SelectContent>
      </Select>
    </div>
  )
}
