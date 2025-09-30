/**
 * Document Editor Store
 *
 * Zustand store for managing current document state with undo/redo support.
 * Uses zundo temporal middleware for 50-step undo history.
 * Implements 2-second debounced auto-save with optimistic locking.
 *
 * @module stores/documentStore
 */

'use client'

import { create } from 'zustand'
import { temporal } from 'zundo'
import isEqual from 'lodash/isEqual'
import { ResumeJsonSchema } from '@/libs/validation/resume'
import type { Resume, ResumeJson } from '@/types/resume'

/**
 * Document editor state
 */
interface DocumentState {
  // Current document
  document: ResumeJson | null
  documentId: string | null
  documentVersion: number | null
  documentTitle: string | null
  // Loading state
  isLoading: boolean

  // Original document for dirty check
  originalDocument: ResumeJson | null

  // Save state
  isDirty: boolean
  isSaving: boolean
  lastSaved: Date | null
  saveError: Error | null

  // Actions
  loadDocument: (resumeId: string) => Promise<void>
  updateDocument: (updates: Partial<ResumeJson>) => void
  setTitle: (title: string) => void
  saveDocument: () => Promise<void>
  resetChanges: () => void
  clearDocument: () => void

  // Computed
  hasChanges: boolean
}

// Auto-save debounce timer
let autoSaveTimer: NodeJS.Timeout | null = null

/**
 * Document store with temporal (undo/redo) support
 */
export const useDocumentStore = create<DocumentState>()(
  temporal(
    (set, get) => ({
      // Initial state
      document: null,
      documentId: null,
      documentVersion: null,
      documentTitle: null,
      isLoading: false,
      originalDocument: null,
      isDirty: false,
      isSaving: false,
      lastSaved: null,
      saveError: null,
      hasChanges: false,

      /**
       * Load a document into the editor by ID
       */
      loadDocument: async (resumeId: string) => {
        set({ isLoading: true, saveError: null })

        try {
          const response = await fetch(`/api/v1/resumes/${resumeId}`)
          const result = await response.json()

          if (!result.success) {
            throw new Error(result.message || 'Failed to load document')
          }

          const resume = result.data
          set({
            document: resume.data,
            documentId: resume.id,
            documentVersion: resume.version,
            documentTitle: resume.title,
            originalDocument: JSON.parse(JSON.stringify(resume.data)), // Deep copy
            isDirty: false,
            isLoading: false,
            lastSaved: new Date(resume.updated_at),
            saveError: null,
            hasChanges: false,
          })
        } catch (error) {
          set({
            isLoading: false,
            saveError: error instanceof Error ? error : new Error('Failed to load document'),
          })
          throw error
        }
      },

      /**
       * Update document with partial changes
       * Triggers auto-save after 2 seconds
       */
      updateDocument: (updates: Partial<ResumeJson>) => {
        const state = get()
        const currentDocument = state.document

        const nextDocument = currentDocument
          ? { ...currentDocument, ...updates }
          : (updates ? ({ ...updates } as ResumeJson) : null)

        if (!nextDocument) {
          return
        }

        if (currentDocument && isEqual(nextDocument, currentDocument)) {
          return
        }

        const isDirty = state.originalDocument
          ? !isEqual(nextDocument, state.originalDocument)
          : true

        set({
          document: nextDocument,
          isDirty,
          hasChanges: isDirty,
        })

        if (autoSaveTimer) {
          clearTimeout(autoSaveTimer)
        }

        if (!isDirty) {
          return
        }

        autoSaveTimer = setTimeout(() => {
          const latestState = get()
          if (latestState.isDirty && !latestState.isSaving) {
            latestState.saveDocument()
          }
        }, 2000) // 2-second debounce
      },

      /**
       * Update document title and trigger debounced auto-save
       */
      setTitle: (title: string) => {
        set((state) => ({
          documentTitle: title,
          isDirty: true,
          hasChanges: true,
          saveError: null,
        }))

        if (autoSaveTimer) {
          clearTimeout(autoSaveTimer)
        }

        autoSaveTimer = setTimeout(() => {
          const latestState = get()
          if (latestState.isDirty && !latestState.isSaving) {
            latestState.saveDocument()
          }
        }, 2000)
      },

      /**
       * Save document to server with optimistic locking
       */
      saveDocument: async () => {
        const { document, documentId, documentVersion, documentTitle, originalDocument } = get()

        if (!document || !documentId || documentVersion === null) {
          return
        }

        set({ isSaving: true, saveError: null })

        try {
          // Build minimal update payload: always include title/version,
          // include data only if it changed
          const updates: any = { version: documentVersion }

          // Include title only if non-empty (server requires min length)
          if (typeof documentTitle === 'string' && documentTitle.trim().length > 0) {
            updates.title = documentTitle.trim()
          }

          // Include data only when changed AND schema-valid
          if (!isEqual(document, originalDocument)) {
            const parsed = ResumeJsonSchema.safeParse(document)
            if (parsed.success) {
              updates.data = document
            }
          }

          // If nothing to update besides version, no-op to avoid 400
          const updateKeys = Object.keys(updates).filter((k) => k !== 'version')
          if (updateKeys.length === 0) {
            set({ isSaving: false })
            return
          }

          const response = await fetch(`/api/v1/resumes/${documentId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
          })

          if (!response.ok) {
            const result = await response.json()
            throw new Error(result.message || 'Save failed')
          }

          const result = await response.json()
          const updatedResume = result.data

          set({
            document: updatedResume.data,
            documentVersion: updatedResume.version,
            documentTitle: updatedResume.title,
            originalDocument: JSON.parse(JSON.stringify(updatedResume.data)),
            isDirty: false,
            isSaving: false,
            lastSaved: updatedResume.updated_at ? new Date(updatedResume.updated_at) : new Date(),
            saveError: null,
            hasChanges: false,
          })
        } catch (error) {
          console.error('Save failed:', error)
          set({
            isSaving: false,
            saveError: error instanceof Error ? error : new Error('Save failed'),
          })

          // Queue for offline retry (Phase 2.5 feature)
          // queueFailedSave(documentId, document)
        }
      },

      /**
       * Reset changes to last saved state
       */
      resetChanges: () => {
        const { originalDocument } = get()
        if (originalDocument) {
          set({
            document: JSON.parse(JSON.stringify(originalDocument)),
            isDirty: false,
            hasChanges: false,
          })
        }
      },

      /**
       * Clear current document
       */
      clearDocument: () => {
        if (autoSaveTimer) {
          clearTimeout(autoSaveTimer)
          autoSaveTimer = null
        }

        set({
          document: null,
          documentId: null,
          documentVersion: null,
          documentTitle: null,
          isLoading: false,
          originalDocument: null,
          isDirty: false,
          isSaving: false,
          lastSaved: null,
          saveError: null,
          hasChanges: false,
        })
      },
    }),
    {
      // Zundo configuration
      limit: 50, // Keep last 50 states for undo/redo
      partialize: (state) => ({
        // Only track document changes in history
        document: state.document,
      }),
      equality: (a, b) => {
        // Custom equality check to avoid unnecessary history entries
        return JSON.stringify(a.document) === JSON.stringify(b.document)
      },
    }
  )
)

/**
 * Hook for accessing temporal (undo/redo) actions
 *
 * Note: All temporal functions (undo/redo/clear) are stable references from Zustand.
 * They can safely be used in useEffect without being included in dependency arrays.
 */
export const useTemporalStore = () => {
  // Get reactive state using useSyncExternalStore pattern via Zustand
  const pastStatesLength = useDocumentStore(
    (state) => (state as any).temporal?.pastStates?.length ?? 0
  )
  const futureStatesLength = useDocumentStore(
    (state) => (state as any).temporal?.futureStates?.length ?? 0
  )

  // These functions are stable and never change
  const { undo, redo, clear } = useDocumentStore.temporal.getState()
  const pastStates = useDocumentStore.temporal.getState().pastStates
  const futureStates = useDocumentStore.temporal.getState().futureStates

  const canUndo = pastStatesLength > 0
  const canRedo = futureStatesLength > 0

  return { undo, redo, clear, canUndo, canRedo, pastStates, futureStates }
}
