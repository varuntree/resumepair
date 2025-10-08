/**
 * Customization Header
 *
 * Panel header with reset button for restoring template defaults.
 *
 * @module components/customization/CustomizationHeader
 */

'use client'

import * as React from 'react'
import { RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
interface CustomizationHeaderProps {
  title: string
  onReset?: () => void
  disabled?: boolean
}

/**
 * Header component with title and reset button
 */
export function CustomizationHeader({ title, onReset, disabled }: CustomizationHeaderProps): React.ReactElement {

  return (
    <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      <Button
        variant="outline"
        size="sm"
        onClick={onReset}
        className="gap-2"
        disabled={disabled || !onReset}
      >
        <RotateCcw className="h-4 w-4" />
        Reset to Defaults
      </Button>
    </div>
  )
}
