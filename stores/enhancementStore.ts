/**
 * Enhancement Store
 *
 * Manages AI enhancement suggestions and user interactions.
 * Uses Zustand for state management.
 *
 * @module stores/enhancementStore
 */

import { create } from 'zustand';

/**
 * Single enhancement suggestion
 */
export interface EnhancementSuggestion {
  id: string;
  type: 'bullet' | 'summary' | 'keywords';
  original: string;
  enhanced: string | string[];
  changes: string[];
  applied: boolean;
}

/**
 * Enhancement store state
 */
interface EnhancementStore {
  suggestions: EnhancementSuggestion[];
  isEnhancing: boolean;
  selectedSuggestion: string | null;
  error: string | null;

  // Actions
  addSuggestion: (suggestion: EnhancementSuggestion) => void;
  applySuggestion: (id: string) => void;
  rejectSuggestion: (id: string) => void;
  clearSuggestions: () => void;
  setSelectedSuggestion: (id: string | null) => void;
  setIsEnhancing: (isEnhancing: boolean) => void;
  setError: (error: string | null) => void;
}

/**
 * Create enhancement store
 */
export const useEnhancementStore = create<EnhancementStore>((set) => ({
  suggestions: [],
  isEnhancing: false,
  selectedSuggestion: null,
  error: null,

  addSuggestion: (suggestion) =>
    set((state) => ({
      suggestions: [...state.suggestions, suggestion],
    })),

  applySuggestion: (id) =>
    set((state) => ({
      suggestions: state.suggestions.map((s) =>
        s.id === id ? { ...s, applied: true } : s
      ),
    })),

  rejectSuggestion: (id) =>
    set((state) => ({
      suggestions: state.suggestions.filter((s) => s.id !== id),
    })),

  clearSuggestions: () => set({ suggestions: [] }),

  setSelectedSuggestion: (id) => set({ selectedSuggestion: id }),

  setIsEnhancing: (isEnhancing) => set({ isEnhancing }),

  setError: (error) => set({ error }),
}));
