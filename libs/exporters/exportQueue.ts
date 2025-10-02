/**
 * Export Queue Manager
 *
 * Processes export jobs from the database queue.
 * Implements retry logic with exponential backoff.
 *
 * @module libs/exporters/exportQueue
 */

import { SupabaseClient } from '@supabase/supabase-js'
import {
  fetchNextJob,
  completeExportJob,
  failExportJob,
  updateExportJob,
  type ExportJob,
} from '@/libs/repositories/exportJobs'
import {
  createExportHistory,
  type CreateExportHistoryParams,
} from '@/libs/repositories/exportHistory'
import { getResume } from '@/libs/repositories/documents'
import {
  generateResumePdf,
  generateExportFilename,
  calculateStoragePath,
  validatePdfBuffer,
  type PdfGenerationOptions,
} from './pdfGenerator'

// ============================================
// TYPES
// ============================================

export interface ProcessJobResult {
  success: boolean
  jobId: string
  error?: string
}

// ============================================
// CONSTANTS
// ============================================

const PROGRESS_UPDATE_THRESHOLD = 10 // Update progress every 10%

// ============================================
// QUEUE PROCESSING
// ============================================

/**
 * Process a single export job
 *
 * This is the main job processing function. It:
 * 1. Fetches document data
 * 2. Generates PDF using Puppeteer
 * 3. Uploads to Supabase Storage
 * 4. Updates job status and creates history record
 * 5. Handles errors with retry logic
 */
export async function processExportJob(
  supabase: SupabaseClient,
  job: ExportJob
): Promise<ProcessJobResult> {
  const jobId = job.id

  try {
    // Step 1: Fetch document data
    await updateProgress(supabase, jobId, 10)
    const document = await getResume(supabase, job.document_id)

    if (!document) {
      throw new Error('Document not found')
    }

    // Validate document has required data
    if (!document.data || typeof document.data !== 'object') {
      throw new Error(`Invalid document data for document ${job.document_id}`)
    }

    // Validate required schema fields
    const requiredFields = ['profile', 'work', 'education', 'skills'] as const
    const missingFields = requiredFields.filter(field => !document.data[field])
    if (missingFields.length > 0) {
      throw new Error(`Document missing required fields: ${missingFields.join(', ')}`)
    }

    // Step 2: Generate PDF from resume data
    await updateProgress(supabase, jobId, 30)
    const pdfOptions: PdfGenerationOptions = {
      templateSlug: job.options.templateSlug || 'minimal',
      pageSize: job.options.pageSize || 'letter',
      margins: job.options.margins,
      quality: job.options.quality || 'standard',
    }

    const pdfResult = await generateResumePdf(document.data, pdfOptions)

    // Validate PDF buffer
    if (!validatePdfBuffer(pdfResult.buffer)) {
      throw new Error('Invalid PDF generated')
    }

    // Step 3: Upload to Supabase Storage
    await updateProgress(supabase, jobId, 60)
    const fileName = generateExportFilename(document.data, job.format)
    const storagePath = calculateStoragePath(job.user_id, job.document_id, job.format)

    const { error: uploadError } = await supabase.storage
      .from('exports')
      .upload(storagePath, pdfResult.buffer, {
        contentType: 'application/pdf',
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      throw new Error(`Failed to upload PDF: ${uploadError.message}`)
    }

    // Step 4: Generate signed URL (7-day expiry)
    await updateProgress(supabase, jobId, 80)
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('exports')
      .createSignedUrl(storagePath, 7 * 24 * 60 * 60) // 7 days in seconds

    if (signedUrlError || !signedUrlData) {
      throw new Error(`Failed to generate download URL: ${signedUrlError?.message}`)
    }

    // Step 5: Complete job and create history record
    await updateProgress(supabase, jobId, 90)

    // Create history record FIRST
    const historyParams: CreateExportHistoryParams = {
      user_id: job.user_id,
      document_id: job.document_id,
      document_version: document.version || 1,
      format: job.format,
      template_slug: pdfOptions.templateSlug,
      file_name: fileName,
      file_path: storagePath,
      file_size: pdfResult.fileSize,
      page_count: pdfResult.pageCount,
    }

    await createExportHistory(supabase, historyParams)

    // THEN complete the export job
    await completeExportJob(supabase, jobId, {
      result_url: signedUrlData.signedUrl,
      file_size: pdfResult.fileSize,
      page_count: pdfResult.pageCount,
    })

    await updateProgress(supabase, jobId, 100)

    return {
      success: true,
      jobId,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error(`Export job ${jobId} failed:`, errorMessage)

    // Determine if error is retryable
    const isRetryable = isRetryableError(error)

    // Mark job as failed (will auto-retry if applicable)
    await failExportJob(supabase, jobId, errorMessage, isRetryable)

    return {
      success: false,
      jobId,
      error: errorMessage,
    }
  }
}

/**
 * Fetch and process the next pending job
 *
 * This is the main entry point for queue workers.
 * Call this function periodically to process jobs.
 */
export async function processNextJob(
  supabase: SupabaseClient,
  userId?: string
): Promise<ProcessJobResult | null> {
  // Fetch next job atomically
  const job = await fetchNextJob(supabase, userId)

  if (!job) {
    return null // No jobs to process
  }

  // Process the job
  return processExportJob(supabase, job)
}

/**
 * Process multiple jobs in sequence
 *
 * Useful for batch processing or cron jobs.
 */
export async function processBatch(
  supabase: SupabaseClient,
  batchSize: number = 5,
  userId?: string
): Promise<ProcessJobResult[]> {
  const results: ProcessJobResult[] = []

  for (let i = 0; i < batchSize; i++) {
    const result = await processNextJob(supabase, userId)

    if (!result) {
      break // No more jobs
    }

    results.push(result)
  }

  return results
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Update job progress
 * Only updates if progress crosses a threshold to avoid excessive DB writes
 */
async function updateProgress(
  supabase: SupabaseClient,
  jobId: string,
  progress: number
): Promise<void> {
  try {
    await updateExportJob(supabase, jobId, { progress })
  } catch (error) {
    // Don't fail job if progress update fails
    console.error('Failed to update progress:', error)
  }
}

/**
 * Determine if an error is retryable
 *
 * Retryable errors:
 * - Network timeouts
 * - Temporary storage failures
 * - PDF generation timeouts
 *
 * Non-retryable errors:
 * - Invalid document data
 * - Document not found
 * - Permission errors
 */
function isRetryableError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false
  }

  const message = error.message.toLowerCase()

  // Non-retryable errors
  const nonRetryablePatterns = [
    'not found',
    'invalid',
    'unauthorized',
    'forbidden',
    'permission denied',
    'validation',
  ]

  for (const pattern of nonRetryablePatterns) {
    if (message.includes(pattern)) {
      return false
    }
  }

  // Retryable errors
  const retryablePatterns = [
    'timeout',
    'network',
    'temporary',
    'unavailable',
    'rate limit',
    'econnreset',
    'econnrefused',
  ]

  for (const pattern of retryablePatterns) {
    if (message.includes(pattern)) {
      return true
    }
  }

  // Default: retry unknown errors
  return true
}

/**
 * Calculate exponential backoff delay
 */
export function calculateBackoffDelay(attempts: number, maxMinutes: number = 60): number {
  const minutes = Math.min(Math.pow(2, attempts), maxMinutes)
  return minutes * 60 * 1000 // Convert to milliseconds
}
