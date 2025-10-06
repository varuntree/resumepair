/**
 * Document Type Utilities
 *
 * Type guards, discriminators, and utility functions for working with
 * Resume and Cover Letter documents in a type-safe manner.
 *
 * @module libs/utils/documentTypeUtils
 */

import { ResumeJson } from '@/types/resume'
import { CoverLetterJson } from '@/types/cover-letter'

/**
 * Document type discriminator
 */
export type DocumentType = 'resume' | 'cover-letter'

/**
 * Discriminated union of all document JSON types
 */
export type DocumentJson = ResumeJson | CoverLetterJson

/**
 * Type guard for ResumeJson
 *
 * Uses structural typing to differentiate between resume and cover letter.
 * Resume has 'profile' and optional 'work' fields.
 */
export function isResumeJson(data: DocumentJson | unknown): data is ResumeJson {
  if (!data || typeof data !== 'object') return false
  const obj = data as Record<string, unknown>
  return 'profile' in obj && 'settings' in obj && !('from' in obj) && !('to' in obj)
}

/**
 * Type guard for CoverLetterJson
 *
 * Cover letter has 'from', 'to', and 'body' fields.
 */
export function isCoverLetterJson(data: DocumentJson | unknown): data is CoverLetterJson {
  if (!data || typeof data !== 'object') return false
  const obj = data as Record<string, unknown>
  return 'from' in obj && 'to' in obj && 'body' in obj && 'settings' in obj
}

/**
 * Extract document type from data at runtime
 *
 * @throws Error if data doesn't match any known document type
 */
export function getDocumentType(data: DocumentJson | unknown): DocumentType {
  if (isResumeJson(data)) return 'resume'
  if (isCoverLetterJson(data)) return 'cover-letter'
  throw new Error('Unknown document type: data does not match ResumeJson or CoverLetterJson')
}

/**
 * Assert document type matches expected type
 *
 * Useful for runtime validation in components/APIs.
 */
export function assertDocumentType(
  data: DocumentJson,
  expectedType: DocumentType
): asserts data is ResumeJson | CoverLetterJson {
  const actualType = getDocumentType(data)
  if (actualType !== expectedType) {
    throw new Error(
      `Document type mismatch: expected ${expectedType}, got ${actualType}`
    )
  }
}

/**
 * Get schema version for document type
 */
export function getSchemaVersion(documentType: DocumentType): string {
  return documentType === 'resume' ? 'resume.v1' : 'cover-letter.v1'
}

/**
 * Get API endpoint base for document type
 */
export function getApiEndpoint(documentType: DocumentType): string {
  return documentType === 'resume' ? '/api/v1/resumes' : '/api/v1/cover-letters'
}

/**
 * Get user-friendly document type name
 */
export function getDocumentTypeName(documentType: DocumentType): string {
  return documentType === 'resume' ? 'Resume' : 'Cover Letter'
}

/**
 * Get document type from URL path
 *
 * Useful for extracting type from Next.js route params.
 */
export function getDocumentTypeFromPath(path: string): DocumentType | null {
  if (path.includes('/editor/') || path.includes('/resumes/')) return 'resume'
  if (path.includes('/cover-letter-editor/') || path.includes('/cover-letters/'))
    return 'cover-letter'
  return null
}
