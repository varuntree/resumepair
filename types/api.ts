/**
 * API Type Definitions
 * Centralized exports for API-related types
 */

// Re-export ApiResponse from api-utils for convenience
export type { ApiResponse } from '@/libs/api-utils/responses'

/**
 * Export request payload for cover letters
 */
export interface CoverLetterExportRequest {
  coverLetterId: string
  format: 'pdf'
  templateId?: string
  customizations?: {
    colors?: {
      primary: string
      secondary: string
      accent: string
      text: string
      background: string
      muted: string
      border: string
    }
    typography?: {
      fontFamily: string
      fontSize: number
      lineHeight: number
      fontWeight: number
    }
    spacing?: {
      sectionGap: number
      paragraphGap: number
      pagePadding: number
    }
  }
}

/**
 * Export response payload
 */
export interface ExportResponse {
  jobId: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  downloadUrl?: string
  error?: string
}

/**
 * Document type discriminator for unified operations
 */
export type DocumentType = 'resume' | 'cover-letter'