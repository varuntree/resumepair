/**
 * Cover Letter Document Store
 *
 * Zustand store for managing cover letter documents.
 * Uses the generic document store factory from createDocumentStore.ts.
 *
 * @module stores/coverLetterStore
 */

'use client'

import {
  createDocumentStore,
  createTemporalHook,
  createPreviewSelector,
  createMetadataSelector,
} from './createDocumentStore'
import { CoverLetterJsonSchema } from '@/libs/validation/cover-letter'
import type { CoverLetterJson } from '@/types/cover-letter'
import { createEmptyCoverLetter } from '@/types/cover-letter'

/**
 * Cover letter document store with temporal (undo/redo) support
 */
export const useCoverLetterStore = createDocumentStore<CoverLetterJson>({
  apiEndpoint: '/api/v1/cover-letters',
  schemaValidator: CoverLetterJsonSchema,
  defaultDocument: () => createEmptyCoverLetter('', ''), // Empty cover letter
})

/**
 * Hook for accessing temporal (undo/redo) actions for cover letters
 *
 * Note: All temporal functions (undo/redo/clear) are stable references from Zustand.
 * They can safely be used in useEffect without being included in dependency arrays.
 */
export const useCoverLetterTemporalStore = createTemporalHook(useCoverLetterStore)

/**
 * Shallow selector for preview components
 * Prevents unnecessary re-renders by selecting only document content
 */
export const selectCoverLetterForPreview = createPreviewSelector<CoverLetterJson>()

/**
 * Shallow selector for document metadata
 */
export const selectCoverLetterMetadata = createMetadataSelector<CoverLetterJson>()
