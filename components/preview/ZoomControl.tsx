/**
 * Zoom Control
 *
 * Dropdown control for adjusting preview zoom level.
 *
 * @module components/preview/ZoomControl
 */

'use client'

import * as React from 'react'
import { Minus, Plus, ZoomIn } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { usePreviewStore, ZOOM_LEVELS } from '@/stores/previewStore'

/**
 * Zoom control dropdown
 */
export function ZoomControl(): React.ReactElement {
  const zoomLevel = usePreviewStore((state) => state.zoomLevel)
  const setZoom = usePreviewStore((state) => state.setZoom)
  const stepZoom = usePreviewStore((state) => state.stepZoom)
  const resetZoom = usePreviewStore((state) => state.resetZoom)
  const isFitToWidth = usePreviewStore((state) => state.isFitToWidth)
  const setFitToWidth = usePreviewStore((state) => state.setFitToWidth)
  const canZoomIn = usePreviewStore((state) => state.canZoomIn())
  const canZoomOut = usePreviewStore((state) => state.canZoomOut())

  const handleSelect = (value: string) => {
    if (value === 'fit') {
      setFitToWidth(true)
      return
    }
    const parsed = Number.parseFloat(value)
    if (!Number.isNaN(parsed)) {
      setZoom(parsed)
    }
  }

  const currentPercent = Math.round(zoomLevel * 100)

  return (
    <div className="flex items-center gap-2">
      <ZoomIn className="h-4 w-4 text-gray-500" aria-hidden="true" />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => stepZoom(-1)}
        disabled={!canZoomOut}
        aria-label="Zoom out"
      >
        <Minus className="h-4 w-4" />
      </Button>
      <Select value={isFitToWidth ? 'fit' : zoomLevel.toFixed(2)} onValueChange={handleSelect}>
        <SelectTrigger className="w-[120px]" aria-label="Zoom level">
          <SelectValue placeholder={`${currentPercent}%`} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="fit">Fit to width</SelectItem>
          {ZOOM_LEVELS.map((value) => (
            <SelectItem key={value} value={value.toFixed(2)}>
              {`${Math.round(value * 100)}%`}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => stepZoom(1)}
        disabled={!canZoomIn}
        aria-label="Zoom in"
      >
        <Plus className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant={isFitToWidth ? 'secondary' : 'outline'}
        size="sm"
        onClick={() => setFitToWidth(!isFitToWidth)}
      >
        {isFitToWidth ? 'Fit width ✓' : 'Fit width'}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => resetZoom()}
        disabled={!isFitToWidth && Math.abs(zoomLevel - 1) < 0.001}
      >
        Reset
      </Button>
    </div>
  )
}
