/**
 * Export History Repository
 *
 * Pure functions for managing historical export records.
 * Tracks completed exports with 7-day TTL for temporary storage.
 *
 * @module libs/repositories/exportHistory
 */

import { SupabaseClient } from '@supabase/supabase-js'

// ============================================
// TYPES
// ============================================

export interface ExportHistoryRecord {
  id: string
  user_id: string
  document_id: string | null
  document_version: number
  format: 'pdf'
  template_slug: string
  file_name: string
  file_path: string
  file_size: number
  page_count: number | null
  download_count: number
  expires_at: string
  created_at: string
}

export interface CreateExportHistoryParams {
  user_id: string
  document_id: string
  document_version: number
  format: 'pdf'
  template_slug: string
  file_name: string
  file_path: string
  file_size: number
  page_count: number | null
}

// ============================================
// REPOSITORY FUNCTIONS
// ============================================

/**
 * Create a new export history record
 * Automatically sets expires_at to 7 days from now
 */
export async function createExportHistory(
  supabase: SupabaseClient,
  params: CreateExportHistoryParams
): Promise<ExportHistoryRecord> {
  // Calculate expiry (7 days from now)
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  const { data, error } = await supabase
    .from('export_history')
    .insert({
      user_id: params.user_id,
      document_id: params.document_id,
      document_version: params.document_version,
      format: params.format,
      template_slug: params.template_slug,
      file_name: params.file_name,
      file_path: params.file_path,
      file_size: params.file_size,
      page_count: params.page_count,
      download_count: 0,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create export history: ${error.message}`)
  }

  return data
}

/**
 * Get export history record by ID
 */
export async function getExportHistory(
  supabase: SupabaseClient,
  historyId: string
): Promise<ExportHistoryRecord | null> {
  const { data, error } = await supabase
    .from('export_history')
    .select('*')
    .eq('id', historyId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null // Not found
    }
    throw new Error(`Failed to get export history: ${error.message}`)
  }

  return data
}

/**
 * List export history for a user
 */
export async function listExportHistory(
  supabase: SupabaseClient,
  userId: string,
  options?: {
    documentId?: string
    limit?: number
    offset?: number
  }
): Promise<ExportHistoryRecord[]> {
  let query = supabase
    .from('export_history')
    .select('*')
    .eq('user_id', userId)
    .gt('expires_at', new Date().toISOString()) // Only non-expired
    .order('created_at', { ascending: false })

  if (options?.documentId) {
    query = query.eq('document_id', options.documentId)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  if (options?.offset) {
    query = query.range(
      options.offset,
      options.offset + (options.limit || 10) - 1
    )
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to list export history: ${error.message}`)
  }

  return data || []
}

/**
 * Increment download count for an export
 */
export async function incrementDownloadCount(
  supabase: SupabaseClient,
  historyId: string
): Promise<ExportHistoryRecord> {
  const { data, error } = await supabase.rpc('increment_download_count', {
    history_id: historyId,
  })

  // If function doesn't exist, fallback to manual increment
  if (error && error.code === '42883') {
    const record = await getExportHistory(supabase, historyId)
    if (!record) {
      throw new Error('Export history not found')
    }

    const { data: updated, error: updateError } = await supabase
      .from('export_history')
      .update({ download_count: record.download_count + 1 })
      .eq('id', historyId)
      .select()
      .single()

    if (updateError) {
      throw new Error(`Failed to increment download count: ${updateError.message}`)
    }

    return updated
  }

  if (error) {
    throw new Error(`Failed to increment download count: ${error.message}`)
  }

  return data
}

/**
 * Delete export history record
 */
export async function deleteExportHistory(
  supabase: SupabaseClient,
  historyId: string
): Promise<void> {
  const { error } = await supabase
    .from('export_history')
    .delete()
    .eq('id', historyId)

  if (error) {
    throw new Error(`Failed to delete export history: ${error.message}`)
  }
}

/**
 * Find expired export history records
 * Used for cleanup cron job
 */
export async function findExpiredExports(
  supabase: SupabaseClient,
  limit: number = 100
): Promise<ExportHistoryRecord[]> {
  const { data, error } = await supabase
    .from('export_history')
    .select('*')
    .lt('expires_at', new Date().toISOString())
    .order('expires_at', { ascending: true })
    .limit(limit)

  if (error) {
    throw new Error(`Failed to find expired exports: ${error.message}`)
  }

  return data || []
}

/**
 * Delete expired export history records in batch
 */
export async function deleteExpiredExports(
  supabase: SupabaseClient,
  limit: number = 100
): Promise<number> {
  const { data, error } = await supabase
    .from('export_history')
    .delete()
    .lt('expires_at', new Date().toISOString())
    .limit(limit)
    .select('id')

  if (error) {
    throw new Error(`Failed to delete expired exports: ${error.message}`)
  }

  return data?.length || 0
}

/**
 * Get total storage used by user's exports (in bytes)
 */
export async function getUserExportStorageUsage(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const { data, error } = await supabase
    .from('export_history')
    .select('file_size')
    .eq('user_id', userId)
    .gt('expires_at', new Date().toISOString())

  if (error) {
    throw new Error(`Failed to get user storage usage: ${error.message}`)
  }

  if (!data || data.length === 0) {
    return 0
  }

  return data.reduce((total, record) => total + (record.file_size || 0), 0)
}

/**
 * Get export statistics for a user
 */
export async function getUserExportStats(
  supabase: SupabaseClient,
  userId: string
): Promise<{
  total_exports: number
  total_downloads: number
  total_storage_bytes: number
  most_used_template: string | null
}> {
  const { data, error } = await supabase
    .from('export_history')
    .select('template_slug, file_size, download_count')
    .eq('user_id', userId)
    .gt('expires_at', new Date().toISOString())

  if (error) {
    throw new Error(`Failed to get user export stats: ${error.message}`)
  }

  if (!data || data.length === 0) {
    return {
      total_exports: 0,
      total_downloads: 0,
      total_storage_bytes: 0,
      most_used_template: null,
    }
  }

  // Calculate statistics
  const totalExports = data.length
  const totalDownloads = data.reduce(
    (sum, record) => sum + (record.download_count || 0),
    0
  )
  const totalStorageBytes = data.reduce(
    (sum, record) => sum + (record.file_size || 0),
    0
  )

  // Find most used template
  const templateCounts: Record<string, number> = {}
  data.forEach((record) => {
    templateCounts[record.template_slug] =
      (templateCounts[record.template_slug] || 0) + 1
  })

  const mostUsedTemplate =
    Object.entries(templateCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null

  return {
    total_exports: totalExports,
    total_downloads: totalDownloads,
    total_storage_bytes: totalStorageBytes,
    most_used_template: mostUsedTemplate,
  }
}
