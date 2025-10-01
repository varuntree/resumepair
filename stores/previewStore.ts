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

/**
 * Viewport modes for preview
 */
export type ViewportMode = 'desktop' | 'tablet' | 'mobile' | 'print'

/**
 * Preview state interface
 */
interface PreviewState {
  // View state
  zoomLevel: number // 0.5 to 1.5
  currentPage: number // 1-indexed
  totalPages: number
  viewport: ViewportMode
  isFullscreen: boolean

  // Actions
  setZoom: (level: number) => void
  nextPage: () => void
  previousPage: () => void
  goToPage: (page: number) => void
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
  currentPage: 1,
  totalPages: 1,
  viewport: 'desktop',
  isFullscreen: false,

  /**
   * Set zoom level (clamped to 0.5-1.5)
   */
  setZoom: (level: number) => {
    const clamped = Math.min(Math.max(level, 0.5), 1.5)
    set({ zoomLevel: clamped })
  },

  /**
   * Navigate to next page
   */
  nextPage: () => {
    const { currentPage, totalPages } = get()
    if (currentPage < totalPages) {
      set({ currentPage: currentPage + 1 })
    }
  },

  /**
   * Navigate to previous page
   */
  previousPage: () => {
    const { currentPage } = get()
    if (currentPage > 1) {
      set({ currentPage: currentPage - 1 })
    }
  },

  /**
   * Go to specific page (clamped to valid range)
   */
  goToPage: (page: number) => {
    const { totalPages } = get()
    const clamped = Math.min(Math.max(page, 1), totalPages)
    set({ currentPage: clamped })
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
    const { currentPage } = get()
    set({
      totalPages: Math.max(1, total),
      currentPage: Math.min(currentPage, total),
    })
  },

  /**
   * Check if zoom in is possible
   */
  canZoomIn: () => {
    const { zoomLevel } = get()
    return zoomLevel < 1.5
  },

  /**
   * Check if zoom out is possible
   */
  canZoomOut: () => {
    const { zoomLevel } = get()
    return zoomLevel > 0.5
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
export const ZOOM_LEVELS = [0.5, 0.75, 1.0, 1.25, 1.5] as const

/**
 * Viewport width breakpoints (px)
 */
export const VIEWPORT_WIDTHS: Record<ViewportMode, number> = {
  desktop: 1440,
  tablet: 768,
  mobile: 375,
  print: 816, // 8.5in @ 96dpi
}
