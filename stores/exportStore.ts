/**
 * Export Store
 *
 * Global state management for export operations using Zustand.
 * Tracks active export jobs and history.
 *
 * @module stores/exportStore
 */

import { create } from 'zustand'

// ============================================
// TYPES
// ============================================

export interface ExportJob {
  jobId: string
  documentId: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  progress: number
  resultUrl?: string
  errorMessage?: string
  createdAt: string
  completedAt?: string
}

export interface ExportHistoryItem {
  id: string
  documentId: string
  fileName: string
  fileSize: number
  pageCount?: number
  downloadCount: number
  expiresAt: string
  createdAt: string
}

export interface ExportState {
  // Active jobs
  jobs: ExportJob[]

  // Export history
  history: ExportHistoryItem[]

  // UI state
  isExporting: boolean
  selectedDocumentId: string | null

  // Actions
  addJob: (job: ExportJob) => void
  updateJob: (jobId: string, updates: Partial<ExportJob>) => void
  removeJob: (jobId: string) => void
  setJobs: (jobs: ExportJob[]) => void

  setHistory: (history: ExportHistoryItem[]) => void
  addHistoryItem: (item: ExportHistoryItem) => void

  setIsExporting: (isExporting: boolean) => void
  setSelectedDocumentId: (documentId: string | null) => void

  reset: () => void
}

// ============================================
// INITIAL STATE
// ============================================

const initialState = {
  jobs: [],
  history: [],
  isExporting: false,
  selectedDocumentId: null,
}

// ============================================
// STORE
// ============================================

export const useExportStore = create<ExportState>((set) => ({
  ...initialState,

  // Job management
  addJob: (job) =>
    set((state) => ({
      jobs: [job, ...state.jobs],
    })),

  updateJob: (jobId, updates) =>
    set((state) => ({
      jobs: state.jobs.map((job) =>
        job.jobId === jobId ? { ...job, ...updates } : job
      ),
    })),

  removeJob: (jobId) =>
    set((state) => ({
      jobs: state.jobs.filter((job) => job.jobId !== jobId),
    })),

  setJobs: (jobs) => set({ jobs }),

  // History management
  setHistory: (history) => set({ history }),

  addHistoryItem: (item) =>
    set((state) => ({
      history: [item, ...state.history],
    })),

  // UI state
  setIsExporting: (isExporting) => set({ isExporting }),
  setSelectedDocumentId: (documentId) => set({ selectedDocumentId: documentId }),

  // Reset
  reset: () => set(initialState),
}))
