/**
 * Resume Document Store
 *
 * Zustand store for managing resume documents.
 * Uses the generic document store factory from createDocumentStore.ts.
 *
 * @module stores/documentStore
 */

'use client'

import { createDocumentStore, createTemporalHook, createPreviewSelector, createMetadataSelector } from './createDocumentStore'
import { ResumeJsonSchema } from '@/libs/validation/resume'
import type { ResumeJson } from '@/types/resume'

/**
 * Resume document store with temporal (undo/redo) support
 */
export const useDocumentStore = createDocumentStore<ResumeJson>({
  apiEndpoint: '/api/v1/resumes',
  schemaValidator: ResumeJsonSchema,
})

/**
 * Hook for accessing temporal (undo/redo) actions
 *
 * Note: All temporal functions (undo/redo/clear) are stable references from Zustand.
 * They can safely be used in useEffect without being included in dependency arrays.
 */
export const useTemporalStore = createTemporalHook(useDocumentStore)

/**
 * Shallow selector for preview components
 * Prevents unnecessary re-renders by selecting only document content
 */
export const selectDocumentForPreview = createPreviewSelector<ResumeJson>()

/**
 * Shallow selector for document metadata
 */
export const selectDocumentMetadata = createMetadataSelector<ResumeJson>()
