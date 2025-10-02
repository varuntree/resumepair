/**
 * Export Jobs Repository
 *
 * Pure functions for managing PDF export job queue operations.
 * All functions use dependency injection pattern with SupabaseClient.
 *
 * @module libs/repositories/exportJobs
 */

import { SupabaseClient } from '@supabase/supabase-js'

// ============================================
// TYPES
// ============================================

export type ExportJobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
export type ExportFormat = 'pdf'

export interface ExportJob {
  id: string
  user_id: string
  document_id: string
  format: ExportFormat
  options: ExportOptions
  status: ExportJobStatus
  progress: number
  attempts: number
  max_attempts: number
  run_after: string | null
  result_url: string | null
  file_size: number | null
  page_count: number | null
  error_message: string | null
  started_at: string | null
  completed_at: string | null
  created_at: string
}

export interface ExportOptions {
  templateSlug?: string
  pageSize?: 'letter' | 'a4'
  margins?: {
    top: number
    right: number
    bottom: number
    left: number
  }
  quality?: 'standard' | 'high'
}

export interface CreateExportJobParams {
  user_id: string
  document_id: string
  format: ExportFormat
  options: ExportOptions
}

export interface UpdateExportJobParams {
  status?: ExportJobStatus
  progress?: number
  result_url?: string
  file_size?: number
  page_count?: number
  error_message?: string
  started_at?: string
  completed_at?: string
  run_after?: string
}

// ============================================
// REPOSITORY FUNCTIONS
// ============================================

/**
 * Create a new export job in the queue
 */
export async function createExportJob(
  supabase: SupabaseClient,
  params: CreateExportJobParams
): Promise<ExportJob> {
  const { data, error } = await supabase
    .from('export_jobs')
    .insert({
      user_id: params.user_id,
      document_id: params.document_id,
      format: params.format,
      options: params.options,
      status: 'pending' as ExportJobStatus,
      progress: 0,
      attempts: 0,
      max_attempts: 5,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create export job: ${error.message}`)
  }

  return data
}

/**
 * Fetch the next pending job and atomically mark it as processing
 * Uses the database function with FOR UPDATE SKIP LOCKED pattern
 */
export async function fetchNextJob(
  supabase: SupabaseClient,
  userId?: string
): Promise<ExportJob | null> {
  const { data, error } = await supabase.rpc('fetch_next_export_job', {
    p_user_id: userId || null,
  })

  if (error) {
    throw new Error(`Failed to fetch next job: ${error.message}`)
  }

  // RPC returns array, get first item
  return data && data.length > 0 ? data[0] : null
}

/**
 * Get export job by ID
 */
export async function getExportJob(
  supabase: SupabaseClient,
  jobId: string
): Promise<ExportJob | null> {
  const { data, error } = await supabase
    .from('export_jobs')
    .select('*')
    .eq('id', jobId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null // Not found
    }
    throw new Error(`Failed to get export job: ${error.message}`)
  }

  return data
}

/**
 * Update export job fields
 */
export async function updateExportJob(
  supabase: SupabaseClient,
  jobId: string,
  updates: UpdateExportJobParams
): Promise<ExportJob> {
  const { data, error } = await supabase
    .from('export_jobs')
    .update(updates)
    .eq('id', jobId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update export job: ${error.message}`)
  }

  return data
}

/**
 * Mark job as completed with result
 */
export async function completeExportJob(
  supabase: SupabaseClient,
  jobId: string,
  result: {
    result_url: string
    file_size: number
    page_count: number
  }
): Promise<ExportJob> {
  return updateExportJob(supabase, jobId, {
    status: 'completed',
    progress: 100,
    result_url: result.result_url,
    file_size: result.file_size,
    page_count: result.page_count,
    completed_at: new Date().toISOString(),
  })
}

/**
 * Mark job as failed with error message
 */
export async function failExportJob(
  supabase: SupabaseClient,
  jobId: string,
  errorMessage: string,
  shouldRetry: boolean = false
): Promise<ExportJob> {
  const job = await getExportJob(supabase, jobId)
  if (!job) {
    throw new Error('Export job not found')
  }

  // Calculate exponential backoff: 1min, 2min, 4min, 8min, 16min, 32min, 60min (capped)
  const backoffMinutes = shouldRetry
    ? Math.min(Math.pow(2, job.attempts), 60)
    : 0

  const runAfter = shouldRetry
    ? new Date(Date.now() + backoffMinutes * 60 * 1000).toISOString()
    : undefined

  return updateExportJob(supabase, jobId, {
    status: shouldRetry && job.attempts < job.max_attempts ? 'pending' : 'failed',
    error_message: errorMessage,
    run_after: runAfter,
  })
}

/**
 * Cancel export job
 */
export async function cancelExportJob(
  supabase: SupabaseClient,
  jobId: string
): Promise<ExportJob> {
  return updateExportJob(supabase, jobId, {
    status: 'cancelled',
  })
}

/**
 * Delete export job
 */
export async function deleteExportJob(
  supabase: SupabaseClient,
  jobId: string
): Promise<void> {
  const { error } = await supabase
    .from('export_jobs')
    .delete()
    .eq('id', jobId)

  if (error) {
    throw new Error(`Failed to delete export job: ${error.message}`)
  }
}

/**
 * List export jobs for a user
 */
export async function listExportJobs(
  supabase: SupabaseClient,
  userId: string,
  options?: {
    status?: ExportJobStatus
    limit?: number
    offset?: number
  }
): Promise<ExportJob[]> {
  let query = supabase
    .from('export_jobs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (options?.status) {
    query = query.eq('status', options.status)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to list export jobs: ${error.message}`)
  }

  return data || []
}

/**
 * Count pending jobs for a user (for rate limiting)
 */
export async function countPendingJobs(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const { count, error } = await supabase
    .from('export_jobs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .in('status', ['pending', 'processing'])

  if (error) {
    throw new Error(`Failed to count pending jobs: ${error.message}`)
  }

  return count || 0
}

/**
 * Find stuck jobs (processing for more than 10 minutes)
 * Used for cleanup/recovery
 */
export async function findStuckJobs(
  supabase: SupabaseClient,
  minutes: number = 10
): Promise<ExportJob[]> {
  const cutoff = new Date(Date.now() - minutes * 60 * 1000).toISOString()

  const { data, error } = await supabase
    .from('export_jobs')
    .select('*')
    .eq('status', 'processing')
    .lt('started_at', cutoff)

  if (error) {
    throw new Error(`Failed to find stuck jobs: ${error.message}`)
  }

  return data || []
}
