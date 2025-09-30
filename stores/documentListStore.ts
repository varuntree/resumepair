/**
 * Document List Store
 *
 * Zustand store for managing document list state (dashboard).
 * Handles filtering, sorting, pagination, and selection.
 *
 * @module stores/documentListStore
 */

'use client'

import { create } from 'zustand'
import type { Resume, ResumeListParams } from '@/types/resume'

/**
 * Document list state
 */
interface DocumentListState {
  // Data
  documents: Resume[]
  totalCount: number
  nextCursor: string | null

  // UI state
  isLoading: boolean
  error: Error | null

  // Filters
  filters: {
    status: 'all' | 'draft' | 'active' | 'archived'
    search: string
    dateRange: 'all' | 'week' | 'month' | 'quarter'
  }

  // Sort
  sorting: {
    field: 'updated_at' | 'created_at' | 'title'
    order: 'asc' | 'desc'
  }

  // Selection
  selectedIds: Set<string>

  // Actions
  fetchDocuments: (cursor?: string) => Promise<void>
  searchDocuments: (query: string) => Promise<void>
  setFilter: (key: keyof DocumentListState['filters'], value: string) => void
  setSorting: (field: string, order: 'asc' | 'desc') => void
  selectDocument: (id: string) => void
  selectAll: () => void
  deselectAll: () => void
  toggleSelection: (id: string) => void
  bulkDelete: (ids: string[]) => Promise<void>
  refreshList: () => Promise<void>
}

/**
 * Document list store
 */
export const useDocumentListStore = create<DocumentListState>((set, get) => ({
  // Initial state
  documents: [],
  totalCount: 0,
  nextCursor: null,
  isLoading: false,
  error: null,
  filters: {
    status: 'all',
    search: '',
    dateRange: 'all',
  },
  sorting: {
    field: 'updated_at',
    order: 'desc',
  },
  selectedIds: new Set(),

  /**
   * Fetch documents with current filters/sort
   */
  fetchDocuments: async (cursor?: string) => {
    set({ isLoading: true, error: null })

    const { filters, sorting } = get()

    // Build query parameters
    const params: ResumeListParams = {
      sort: sorting.field,
      order: sorting.order,
      cursor: cursor,
      limit: 20,
    }

    // Add filters
    if (filters.status !== 'all') {
      params.status = filters.status as 'draft' | 'active' | 'archived'
    }

    if (filters.search) {
      params.search = filters.search
    }

    // Build query string
    const queryString = new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null) {
          acc[key] = String(value)
        }
        return acc
      }, {} as Record<string, string>)
    ).toString()

    try {
      const response = await fetch(`/api/v1/resumes?${queryString}`)

      if (!response.ok) {
        throw new Error('Failed to fetch documents')
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch documents')
      }

      set((state) => ({
        documents: cursor
          ? [...state.documents, ...result.data.resumes]
          : result.data.resumes,
        totalCount: result.data.total,
        nextCursor: result.data.nextCursor,
        isLoading: false,
      }))
    } catch (error) {
      console.error('Fetch documents error:', error)
      set({
        error: error instanceof Error ? error : new Error('Failed to fetch documents'),
        isLoading: false,
      })
    }
  },

  /**
   * Search documents by title
   */
  searchDocuments: async (query: string) => {
    set((state) => ({
      filters: { ...state.filters, search: query },
    }))

    // Trigger fetch with new search
    await get().fetchDocuments()
  },

  /**
   * Set filter value
   */
  setFilter: (key, value) => {
    set((state) => ({
      filters: { ...state.filters, [key]: value },
    }))

    // Trigger fetch with new filter
    get().fetchDocuments()
  },

  /**
   * Set sorting
   */
  setSorting: (field, order) => {
    set({
      sorting: { field: field as 'updated_at' | 'created_at' | 'title', order },
    })

    // Trigger fetch with new sort
    get().fetchDocuments()
  },

  /**
   * Select a document
   */
  selectDocument: (id: string) => {
    set((state) => {
      const newSelectedIds = new Set(state.selectedIds)
      newSelectedIds.add(id)
      return { selectedIds: newSelectedIds }
    })
  },

  /**
   * Select all visible documents
   */
  selectAll: () => {
    set((state) => ({
      selectedIds: new Set(state.documents.map((doc) => doc.id)),
    }))
  },

  /**
   * Deselect all documents
   */
  deselectAll: () => {
    set({ selectedIds: new Set() })
  },

  /**
   * Toggle selection of a document
   */
  toggleSelection: (id: string) => {
    set((state) => {
      const newSelectedIds = new Set(state.selectedIds)
      if (newSelectedIds.has(id)) {
        newSelectedIds.delete(id)
      } else {
        newSelectedIds.add(id)
      }
      return { selectedIds: newSelectedIds }
    })
  },

  /**
   * Bulk delete selected documents
   */
  bulkDelete: async (ids: string[]) => {
    try {
      // Delete each document and verify responses
      const results = await Promise.all(
        ids.map(async (id) => {
          const res = await fetch(`/api/v1/resumes/${id}`, { method: 'DELETE' })
          return { id, ok: res.ok }
        })
      )

      const failed = results.filter(r => !r.ok)
      if (failed.length > 0) {
        set({
          error: new Error(`Failed to delete ${failed.length} document(s)`),
        })
      }

      // Refresh list
      await get().refreshList()

      // Clear selection only if all succeeded
      if (failed.length === 0) {
        set({ selectedIds: new Set() })
      }
    } catch (error) {
      console.error('Bulk delete error:', error)
      set({
        error: error instanceof Error ? error : new Error('Failed to delete documents'),
      })
    }
  },

  /**
   * Refresh document list
   */
  refreshList: async () => {
    set({ documents: [], nextCursor: null })
    await get().fetchDocuments()
  },
}))
