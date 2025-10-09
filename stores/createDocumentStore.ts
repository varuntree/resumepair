/**
 * Generic Document Store Factory
 *
 * Creates Zustand stores for document editing with undo/redo support.
 * Extracted from documentStore.ts to support both resumes and cover letters.
 * Pattern: Factory function with generic type parameter for document JSON schema.
 *
 * @module stores/createDocumentStore
 */

'use client'

import { create, StoreApi, UseBoundStore } from 'zustand'
import { temporal, TemporalState } from 'zundo'
import isEqual from 'lodash/isEqual'
import type { ZodType, ZodTypeDef } from 'zod'

/**
 * Configuration for document store factory
 */
export interface DocumentStoreConfig<T> {
  /** API endpoint base path (e.g., '/api/v1/resumes' or '/api/v1/cover-letters') */
  apiEndpoint: string
  /** Zod schema for document validation before save */
  schemaValidator: ZodType<T, ZodTypeDef, any>
  /** Optional default document factory */
  defaultDocument?: () => T
}

/**
 * Generic document editor state
 */
export interface DocumentState<T> {
  // Current document
  document: T | null
  documentId: string | null
  documentVersion: number | null
  documentTitle: string | null

  // Loading state
  isLoading: boolean

  // Original document for dirty check
  originalDocument: T | null

  // Save state
  isDirty: boolean
  isSaving: boolean
  lastSaved: Date | null
  saveError: Error | null

  // Actions
  loadDocument: (id: string) => Promise<void>
  updateDocument: (updates: Partial<T>) => void
  setTitle: (title: string) => void
  saveDocument: () => Promise<void>
  resetChanges: () => void
  clearDocument: () => void

  // Computed
  hasChanges: boolean
}

// Auto-save debounce timers (one per store instance)
const autoSaveTimers = new Map<string, NodeJS.Timeout>()

/**
 * Creates a document store with temporal (undo/redo) support
 *
 * @example
 * ```typescript
 * // Create resume store
 * export const useResumeStore = createDocumentStore({
 *   apiEndpoint: '/api/v1/resumes',
 *   schemaValidator: ResumeJsonSchema,
 *   defaultDocument: () => createEmptyResume()
 * })
 *
 * // Create cover letter store
 * export const useCoverLetterStore = createDocumentStore({
 *   apiEndpoint: '/api/v1/cover-letters',
 *   schemaValidator: CoverLetterJsonSchema,
 *   defaultDocument: () => createEmptyCoverLetter()
 * })
 * ```
 */
export function createDocumentStore<T extends Record<string, any>>(
  config: DocumentStoreConfig<T>
): UseBoundStore<StoreApi<DocumentState<T> & TemporalState<Partial<DocumentState<T>>>>> {
  const { apiEndpoint, schemaValidator, defaultDocument } = config
  const timerKey = apiEndpoint // Use endpoint as unique key for timer

  return create<DocumentState<T>>()(
    temporal(
      (set, get) => ({
        // Initial state
        document: defaultDocument ? defaultDocument() : null,
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
        loadDocument: async (id: string) => {
          set({ isLoading: true, saveError: null })

          try {
            const response = await fetch(`${apiEndpoint}/${id}`)
            const result = await response.json()

            if (!result.success) {
              throw new Error(result.message || 'Failed to load document')
            }

            const doc = result.data
            set({
              document: doc.data,
              documentId: doc.id,
              documentVersion: doc.version,
              documentTitle: doc.title,
              originalDocument: JSON.parse(JSON.stringify(doc.data)), // Deep copy
              isDirty: false,
              isLoading: false,
              lastSaved: new Date(doc.updated_at),
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
        updateDocument: (updates: Partial<T>) => {
          const state = get()
          const currentDocument = state.document

          const nextDocument = currentDocument
            ? { ...currentDocument, ...updates }
            : (updates ? ({ ...updates } as T) : null)

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

          // Clear existing timer
          const existingTimer = autoSaveTimers.get(timerKey)
          if (existingTimer) {
            clearTimeout(existingTimer)
          }

          if (!isDirty) {
            return
          }

          // Set new auto-save timer
          const newTimer = setTimeout(() => {
            const latestState = get()
            if (latestState.isDirty && !latestState.isSaving) {
              latestState.saveDocument()
            }
          }, 2000) // 2-second debounce

          autoSaveTimers.set(timerKey, newTimer)
        },

        /**
         * Update document title and trigger debounced auto-save
         */
        setTitle: (title: string) => {
          set({
            documentTitle: title,
            isDirty: true,
            hasChanges: true,
            saveError: null,
          })

          // Clear existing timer
          const existingTimer = autoSaveTimers.get(timerKey)
          if (existingTimer) {
            clearTimeout(existingTimer)
          }

          // Set new auto-save timer
          const newTimer = setTimeout(() => {
            const latestState = get()
            if (latestState.isDirty && !latestState.isSaving) {
              latestState.saveDocument()
            }
          }, 2000)

          autoSaveTimers.set(timerKey, newTimer)
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
            let didIncludeData = false

            // Include title only if non-empty (server requires min length)
            if (typeof documentTitle === 'string' && documentTitle.trim().length > 0) {
              updates.title = documentTitle.trim()
            }

            // Include data only when changed AND schema-valid
            if (!isEqual(document, originalDocument)) {
              const parsed = schemaValidator.safeParse(document)
              if (parsed.success) {
                updates.data = document
                didIncludeData = true
              }
            }

            // If nothing to update besides version, no-op to avoid 400
            const updateKeys = Object.keys(updates).filter((k) => k !== 'version')
            if (updateKeys.length === 0) {
              set({ isSaving: false })
              return
            }

            const response = await fetch(`${apiEndpoint}/${documentId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updates),
            })

            if (!response.ok) {
              const result = await response.json()
              throw new Error(result.message || 'Save failed')
            }

            const result = await response.json()
            const updatedDoc = result.data

            // Only overwrite local document with server data when we actually sent data.
            // This prevents wiping unsaved AI-generated content when validation blocks data.
            set({
              document: didIncludeData ? updatedDoc.data : document,
              documentVersion: updatedDoc.version,
              documentTitle: updatedDoc.title,
              originalDocument: didIncludeData
                ? JSON.parse(JSON.stringify(updatedDoc.data))
                : originalDocument,
              isDirty: didIncludeData ? false : get().isDirty,
              isSaving: false,
              lastSaved: updatedDoc.updated_at ? new Date(updatedDoc.updated_at) : new Date(),
              saveError: null,
              hasChanges: didIncludeData ? false : get().hasChanges,
            })
          } catch (error) {
            console.error('Save failed:', error)
            set({
              isSaving: false,
              saveError: error instanceof Error ? error : new Error('Save failed'),
            })
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
          const existingTimer = autoSaveTimers.get(timerKey)
          if (existingTimer) {
            clearTimeout(existingTimer)
            autoSaveTimers.delete(timerKey)
          }

          set({
            document: defaultDocument ? defaultDocument() : null,
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
  ) as unknown as UseBoundStore<StoreApi<DocumentState<T> & TemporalState<Partial<DocumentState<T>>>>>
}

/**
 * Hook factory for accessing temporal (undo/redo) actions
 *
 * @example
 * ```typescript
 * export const useResumeTemporalStore = createTemporalHook(useResumeStore)
 * ```
 */
export function createTemporalHook<T extends Record<string, any>>(
  useStore: UseBoundStore<StoreApi<DocumentState<T> & TemporalState<Partial<DocumentState<T>>>>>
) {
  return () => {
    // Get reactive state using useSyncExternalStore pattern via Zustand
    const pastStatesLength = useStore(
      (state) => (state as any).temporal?.pastStates?.length ?? 0
    )
    const futureStatesLength = useStore(
      (state) => (state as any).temporal?.futureStates?.length ?? 0
    )

    // These functions are stable and never change
    const { undo, redo, clear } = (useStore as any).temporal.getState()
    const pastStates = (useStore as any).temporal.getState().pastStates
    const futureStates = (useStore as any).temporal.getState().futureStates

    const canUndo = pastStatesLength > 0
    const canRedo = futureStatesLength > 0

    return { undo, redo, clear, canUndo, canRedo, pastStates, futureStates }
  }
}

/**
 * Shallow selector factory for preview components
 * Prevents unnecessary re-renders by selecting only document content
 */
export function createPreviewSelector<T>() {
  return (state: DocumentState<T>) => ({
    content: state.document,
    isLoading: state.isLoading,
  })
}

/**
 * Shallow selector factory for document metadata
 */
export function createMetadataSelector<T>() {
  return (state: DocumentState<T>) => ({
    documentId: state.documentId,
    documentVersion: state.documentVersion,
    documentTitle: state.documentTitle,
    lastSaved: state.lastSaved,
  })
}
