/**
 * Preview Store
 *
 * Zustand store for managing preview state (zoom, pagination, viewport).
 * Handles preview controls and view preferences.
 *
 * @module stores/previewStore
 */

'use client'

import { create } from 'zustand'
import {
  DEFAULT_PAGE_FORMAT,
  MM_TO_PX,
  PAGE_SIZE_MM,
  type PageFormat,
} from '@/libs/reactive-artboard/constants/page'

export const MIN_ZOOM = 0.4
export const MAX_ZOOM = 2.0
export const ZOOM_STEP = 0.1
const ZOOM_EPSILON = 0.005

const clampZoom = (value: number): number => Math.min(Math.max(value, MIN_ZOOM), MAX_ZOOM)

/**
 * Viewport modes for preview
 */
export type ViewportMode = 'desktop' | 'tablet' | 'mobile' | 'print'

/**
 * Preview state interface
 */
interface PreviewState {
  // View state
  zoomLevel: number
  lastManualZoom: number
  isFitToWidth: boolean
  currentPage: number // 1-indexed
  totalPages: number
  viewport: ViewportMode
  isFullscreen: boolean
  pendingScrollPage: number | null

  // Actions
  setZoom: (level: number) => void
  stepZoom: (direction: 1 | -1) => void
  resetZoom: () => void
  setFitToWidth: (enabled: boolean) => void
  applyFitZoom: (level: number) => void
  nextPage: () => void
  previousPage: () => void
  goToPage: (page: number) => void
  syncCurrentPage: (page: number) => void
  clearPendingScroll: () => void
  setViewport: (mode: ViewportMode) => void
  toggleFullscreen: () => void
  setTotalPages: (total: number) => void

  // Computed getters
  canZoomIn: () => boolean
  canZoomOut: () => boolean
  canNextPage: () => boolean
  canPreviousPage: () => boolean
}

/**
 * Preview store with zoom, pagination, and viewport controls
 */
export const usePreviewStore = create<PreviewState>()((set, get) => ({
  // Initial state
  zoomLevel: 1.0,
  lastManualZoom: 1.0,
  isFitToWidth: false,
  currentPage: 1,
  totalPages: 1,
  viewport: 'desktop',
  isFullscreen: false,
  pendingScrollPage: null,

  /**
   * Set zoom level manually (disables fit-to-width)
   */
  setZoom: (level: number) => {
    const clamped = clampZoom(level)
    set({ zoomLevel: clamped, lastManualZoom: clamped, isFitToWidth: false })
  },

  /**
   * Increment or decrement zoom by the configured step
   */
  stepZoom: (direction: 1 | -1) => {
    const { zoomLevel } = get()
    const next = clampZoom(zoomLevel + direction * ZOOM_STEP)
    set({ zoomLevel: next, lastManualZoom: next, isFitToWidth: false })
  },

  /**
   * Reset zoom level to 100%
   */
  resetZoom: () => {
    const baseline = clampZoom(1)
    set({ zoomLevel: baseline, lastManualZoom: baseline, isFitToWidth: false })
  },

  /**
   * Toggle fit-to-width mode
   */
  setFitToWidth: (enabled: boolean) => {
    if (enabled) {
      set({ isFitToWidth: true })
      return
    }

    const { lastManualZoom } = get()
    const restored = clampZoom(lastManualZoom)
    set({ isFitToWidth: false, zoomLevel: restored })
  },

  /**
   * Apply zoom level calculated from fit-to-width logic.
   * Keeps mode enabled and avoids jitter when delta is negligible.
   */
  applyFitZoom: (level: number) => {
    const { zoomLevel } = get()
    const clamped = clampZoom(level)
    if (Math.abs(zoomLevel - clamped) < ZOOM_EPSILON) {
      return
    }
    set({ zoomLevel: clamped, isFitToWidth: true })
  },

  /**
   * Navigate to next page
   */
  nextPage: () => {
    const { currentPage, totalPages, goToPage } = get()
    if (currentPage < totalPages) {
      goToPage(currentPage + 1)
    }
  },

  /**
   * Navigate to previous page
   */
  previousPage: () => {
    const { currentPage, goToPage } = get()
    if (currentPage > 1) {
      goToPage(currentPage - 1)
    }
  },

  /**
   * Go to specific page (clamped) and request scroll into view
   */
  goToPage: (page: number) => {
    const { totalPages } = get()
    const clamped = Math.min(Math.max(page, 1), totalPages)
    set({ currentPage: clamped, pendingScrollPage: clamped })
  },

  /**
   * Sync current page based on scroll position (no automatic scroll)
   */
  syncCurrentPage: (page: number) => {
    const { totalPages, currentPage } = get()
    const clamped = Math.min(Math.max(page, 1), totalPages)
    if (clamped !== currentPage) {
      set({ currentPage: clamped })
    }
  },

  /**
   * Clear pending scroll request after viewport adjustment
   */
  clearPendingScroll: () => {
    set({ pendingScrollPage: null })
  },

  /**
   * Set viewport mode
   */
  setViewport: (mode: ViewportMode) => {
    set({ viewport: mode })
  },

  /**
   * Toggle fullscreen mode
   */
  toggleFullscreen: () => {
    set((state) => ({ isFullscreen: !state.isFullscreen }))
  },

  /**
   * Set total number of pages
   */
  setTotalPages: (total: number) => {
    const state = get()
    const normalizedTotal = Math.max(1, total)
    const clampedCurrent = Math.min(state.currentPage, normalizedTotal)
    const pendingScrollPage =
      clampedCurrent !== state.currentPage ? clampedCurrent : state.pendingScrollPage
    set({
      totalPages: normalizedTotal,
      currentPage: clampedCurrent,
      pendingScrollPage,
    })
  },

  /**
   * Check if zoom in is possible
   */
  canZoomIn: () => {
    const { zoomLevel } = get()
    return zoomLevel < MAX_ZOOM
  },

  /**
   * Check if zoom out is possible
   */
  canZoomOut: () => {
    const { zoomLevel } = get()
    return zoomLevel > MIN_ZOOM
  },

  /**
   * Check if next page navigation is possible
   */
  canNextPage: () => {
    const { currentPage, totalPages } = get()
    return currentPage < totalPages
  },

  /**
   * Check if previous page navigation is possible
   */
  canPreviousPage: () => {
    const { currentPage } = get()
    return currentPage > 1
  },
}))

/**
 * Zoom level presets
 */
export const ZOOM_LEVELS = Array.from({ length: Math.round((MAX_ZOOM - MIN_ZOOM) / ZOOM_STEP) + 1 }, (_, index) =>
  parseFloat((MIN_ZOOM + index * ZOOM_STEP).toFixed(2))
) as readonly number[]

/**
 * Viewport width breakpoints (px)
 */
export const VIEWPORT_WIDTHS: Record<ViewportMode, number> = {
  desktop: 1440,
  tablet: 768,
  mobile: 375,
  print:
    PAGE_SIZE_MM[
      (DEFAULT_PAGE_FORMAT in PAGE_SIZE_MM ? DEFAULT_PAGE_FORMAT : 'letter') as PageFormat
    ].width *
    MM_TO_PX,
}
