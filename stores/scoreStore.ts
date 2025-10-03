/**
 * Score Store
 * Phase 6: Scoring & Optimization
 *
 * Global state management for score operations using Zustand.
 * NO zundo middleware (scoring doesn't need undo/redo).
 *
 * @module stores/scoreStore
 */

import { create } from 'zustand'
import { ScoreBreakdown } from '@/types/scoring'

// ============================================
// TYPES
// ============================================

export interface ScoreState {
  // Current score
  currentScore: ScoreBreakdown | null

  // UI state
  isCalculating: boolean
  error: string | null

  // Actions
  calculateScore: (resumeId: string, jobDescription?: string) => Promise<void>
  loadScore: (resumeId: string) => Promise<void>
  clearScore: () => void
  setError: (error: string | null) => void
}

// ============================================
// INITIAL STATE
// ============================================

const initialState = {
  currentScore: null,
  isCalculating: false,
  error: null,
}

// ============================================
// STORE
// ============================================

export const useScoreStore = create<ScoreState>((set, get) => ({
  ...initialState,

  /**
   * Calculate score (calls API)
   */
  calculateScore: async (resumeId: string, jobDescription?: string) => {
    set({ isCalculating: true, error: null })

    try {
      const response = await fetch('/api/v1/score/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeId, jobDescription }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.message || 'Failed to calculate score')
      }

      set({ currentScore: result.data.score, isCalculating: false })
    } catch (error) {
      console.error('Score calculation failed:', error)
      set({
        error: error instanceof Error ? error.message : 'Unknown error',
        isCalculating: false,
      })
    }
  },

  /**
   * Load existing score (calls API)
   */
  loadScore: async (resumeId: string) => {
    try {
      const response = await fetch(`/api/v1/score/${resumeId}`)
      const result = await response.json()

      if (result.success) {
        set({ currentScore: result.data.score })
      }
    } catch (error) {
      console.error('Failed to load score:', error)
      set({
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  },

  /**
   * Clear score state
   */
  clearScore: () => {
    set({ currentScore: null, error: null })
  },

  /**
   * Set error message
   */
  setError: (error: string | null) => {
    set({ error })
  },
}))
