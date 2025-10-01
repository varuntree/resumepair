/**
 * Zoom Control
 *
 * Dropdown control for adjusting preview zoom level.
 *
 * @module components/preview/ZoomControl
 */

'use client'

import * as React from 'react'
import { ZoomIn } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { usePreviewStore } from '@/stores/previewStore'

/**
 * Zoom control dropdown
 */
export function ZoomControl(): React.ReactElement {
  const zoomLevel = usePreviewStore((state) => state.zoomLevel)
  const setZoom = usePreviewStore((state) => state.setZoom)

  const zoomLevels = [
    { value: 0.5, label: '50%' },
    { value: 0.75, label: '75%' },
    { value: 1.0, label: '100%' },
    { value: 1.25, label: '125%' },
    { value: 1.5, label: '150%' },
  ]

  return (
    <div className="flex items-center gap-2">
      <ZoomIn className="h-4 w-4 text-gray-500" aria-hidden="true" />
      <Select
        value={zoomLevel.toString()}
        onValueChange={(value) => setZoom(parseFloat(value))}
      >
        <SelectTrigger className="w-[100px]" aria-label="Zoom level">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {zoomLevels.map((level) => (
            <SelectItem key={level.value} value={level.value.toString()}>
              {level.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
