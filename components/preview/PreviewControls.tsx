/**
 * Preview Controls
 *
 * Top control bar combining zoom, page navigation, and viewport selector.
 *
 * @module components/preview/PreviewControls
 */

'use client'

import * as React from 'react'
import { ZoomControl } from './ZoomControl'
import { PageNavigation } from './PageNavigation'
import { ViewportSelector } from './ViewportSelector'

/**
 * Preview control bar component
 */
export function PreviewControls(): React.ReactElement {
  return (
    <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-6 py-3">
      {/* Left: Zoom */}
      <div className="flex items-center gap-4">
        <ZoomControl />
      </div>

      {/* Center: Page Navigation */}
      <div className="flex items-center">
        <PageNavigation />
      </div>

      {/* Right: Viewport */}
      <div className="flex items-center gap-4">
        <ViewportSelector />
      </div>
    </div>
  )
}
