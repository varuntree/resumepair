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
 * RAF-batched callback executor
 * Schedules a callback to run in the next animation frame
 * Cancels any pending callback before scheduling a new one
 *
 * @param callback - Function to execute in next frame
 * @returns Cleanup function to cancel pending callback
 */
export function batchRAF(callback: () => void): () => void {
  let rafId: number | null = null

  const execute = () => {
    if (rafId) {
      cancelAnimationFrame(rafId)
    }

    rafId = requestAnimationFrame(() => {
      callback()
      rafId = null
    })
  }

  execute()

  return () => {
    if (rafId) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
  }
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

/**
 * Calculate number of pages in a paginated document
 * Uses CSS page breaks and container height
 *
 * @param content - HTML element containing paginated content
 * @param pageHeight - Height of a single page in pixels (default: 11in @ 96dpi = 1056px)
 * @returns Number of pages
 */
export function calculatePages(
  content: HTMLElement,
  pageHeight: number = 1056
): number {
  const contentHeight = content.scrollHeight
  return Math.max(1, Math.ceil(contentHeight / pageHeight))
}

/**
 * Measure and log update time for performance monitoring
 * Only logs in development mode
 *
 * @param label - Label for the measurement
 * @param fn - Function to measure
 */
export function measureUpdateTime(label: string, fn: () => void): void {
  if (process.env.NODE_ENV !== 'development') {
    fn()
    return
  }

  const start = performance.now()
  fn()
  const end = performance.now()
  const duration = end - start

  if (duration > 120) {
    console.warn(`[Preview] ${label} took ${duration.toFixed(2)}ms (budget: 120ms)`)
  } else {
    console.log(`[Preview] ${label} took ${duration.toFixed(2)}ms`)
  }
}

/**
 * Debounce a function call
 * Returns a debounced version of the function that delays execution
 *
 * @param fn - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function with cancel method
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): T & { cancel: () => void } {
  let timeoutId: NodeJS.Timeout | null = null

  const debounced = ((...args: any[]) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      fn(...args)
      timeoutId = null
    }, delay)
  }) as T & { cancel: () => void }

  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }

  return debounced
}

/**
 * Throttle a function call
 * Ensures function executes at most once per delay period
 *
 * @param fn - Function to throttle
 * @param delay - Minimum delay between executions in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): T {
  let lastCall = 0

  return ((...args: any[]) => {
    const now = performance.now()

    if (now - lastCall >= delay) {
      lastCall = now
      fn(...args)
    }
  }) as T
}
