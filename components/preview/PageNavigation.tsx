/**
 * Page Navigation
 *
 * Controls for navigating multi-page documents.
 *
 * @module components/preview/PageNavigation
 */

'use client'

import * as React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePreviewStore } from '@/stores/previewStore'

/**
 * Page navigation controls
 */
export function PageNavigation(): React.ReactElement {
  const currentPage = usePreviewStore((state) => state.currentPage)
  const totalPages = usePreviewStore((state) => state.totalPages)
  const goToPage = usePreviewStore((state) => state.goToPage)

  // Don't show navigation for single-page documents
  if (totalPages <= 1) {
    return <></>
  }

  const handlePrevious = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1)
    }
  }

  const handleNext = () => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handlePrevious}
        disabled={currentPage === 1}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
      </Button>

      <span className="text-sm text-gray-700 min-w-[80px] text-center" aria-live="polite">
        Page {currentPage} of {totalPages}
      </span>

      <Button
        variant="outline"
        size="sm"
        onClick={handleNext}
        disabled={currentPage === totalPages}
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </Button>
    </div>
  )
}
