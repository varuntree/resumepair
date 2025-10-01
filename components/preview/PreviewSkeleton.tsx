/**
 * Preview Skeleton
 *
 * Loading skeleton displayed while template loads or during heavy operations.
 *
 * @module components/preview/PreviewSkeleton
 */

import * as React from 'react'

export function PreviewSkeleton(): React.ReactElement {
  return (
    <div className="w-full max-w-4xl mx-auto p-8 space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="space-y-3">
        <div className="h-8 bg-gray-200 rounded-md w-1/2" />
        <div className="h-4 bg-gray-200 rounded-md w-1/3" />
        <div className="flex gap-3">
          <div className="h-3 bg-gray-200 rounded-md w-24" />
          <div className="h-3 bg-gray-200 rounded-md w-32" />
        </div>
      </div>

      {/* Section skeleton */}
      <div className="space-y-3">
        <div className="h-6 bg-gray-200 rounded-md w-1/4" />
        <div className="h-4 bg-gray-200 rounded-md w-full" />
        <div className="h-4 bg-gray-200 rounded-md w-5/6" />
      </div>

      {/* Section skeleton */}
      <div className="space-y-3">
        <div className="h-6 bg-gray-200 rounded-md w-1/3" />
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="h-5 bg-gray-200 rounded-md w-2/3" />
            <div className="h-3 bg-gray-200 rounded-md w-1/2" />
            <div className="h-3 bg-gray-200 rounded-md w-full" />
            <div className="h-3 bg-gray-200 rounded-md w-4/5" />
          </div>
          <div className="space-y-2">
            <div className="h-5 bg-gray-200 rounded-md w-2/3" />
            <div className="h-3 bg-gray-200 rounded-md w-1/2" />
            <div className="h-3 bg-gray-200 rounded-md w-full" />
            <div className="h-3 bg-gray-200 rounded-md w-4/5" />
          </div>
        </div>
      </div>

      {/* Skills skeleton */}
      <div className="space-y-3">
        <div className="h-6 bg-gray-200 rounded-md w-1/4" />
        <div className="flex flex-wrap gap-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-8 bg-gray-200 rounded-md w-20" />
          ))}
        </div>
      </div>
    </div>
  )
}
