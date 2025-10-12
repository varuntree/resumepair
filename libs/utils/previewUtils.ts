/**
 * Preview Utilities
 *
 * RAF batching, scroll position management, and pagination helpers
 * for live preview system.
 *
 * @module libs/utils/previewUtils
 */

/**
 * Scroll position state
 */
export interface ScrollPosition {
  scrollTop: number
  scrollLeft: number
  timestamp: number
}

/**
 * Save current scroll position from a container element
 *
 * @param container - HTML element to read scroll position from
 * @returns ScrollPosition object with current position
 */
export function saveScrollPosition(container: HTMLElement): ScrollPosition {
  return {
    scrollTop: container.scrollTop,
    scrollLeft: container.scrollLeft,
    timestamp: performance.now(),
  }
}

/**
 * Restore scroll position to a container element
 * Uses RAF to ensure DOM has rendered before restoring
 *
 * @param container - HTML element to restore scroll position to
 * @param position - ScrollPosition object to restore
 */
export function restoreScrollPosition(
  container: HTMLElement,
  position: ScrollPosition
): void {
  // Wait for next frame to ensure DOM has updated
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      container.scrollTop = position.scrollTop
      container.scrollLeft = position.scrollLeft
    })
  })
}

// Legacy utilities for animation timing and pagination have been removed.
