/**
 * Storage Manager
 *
 * Manages export file storage in Supabase Storage.
 * Handles uploads, downloads, cleanup, and quota management.
 *
 * @module libs/exporters/storageManager
 */

import { SupabaseClient } from '@supabase/supabase-js'

// ============================================
// TYPES
// ============================================

export interface StorageQuota {
  used: number
  limit: number
  percentage: number
  isOverQuota: boolean
}

export interface StorageFileInfo {
  path: string
  size: number
  createdAt: string
  signedUrl?: string
}

// ============================================
// CONSTANTS
// ============================================

const STORAGE_BUCKET = 'exports'
const DEFAULT_QUOTA_BYTES = 100 * 1024 * 1024 // 100 MB per user
const SIGNED_URL_EXPIRY = 7 * 24 * 60 * 60 // 7 days in seconds

// ============================================
// STORAGE OPERATIONS
// ============================================

/**
 * Upload file to Supabase Storage
 */
export async function uploadFile(
  supabase: SupabaseClient,
  path: string,
  buffer: Buffer,
  options?: {
    contentType?: string
    cacheControl?: string
    upsert?: boolean
  }
): Promise<{ path: string; publicUrl?: string }> {
  const { data, error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, buffer, {
    contentType: options?.contentType || 'application/pdf',
    cacheControl: options?.cacheControl || '3600',
    upsert: options?.upsert ?? false,
  })

  if (error) {
    throw new Error(`Failed to upload file: ${error.message}`)
  }

  return {
    path: data.path,
  }
}

/**
 * Generate signed URL for file download
 */
export async function getSignedUrl(
  supabase: SupabaseClient,
  path: string,
  expirySeconds: number = SIGNED_URL_EXPIRY
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(path, expirySeconds)

  if (error || !data) {
    throw new Error(`Failed to generate signed URL: ${error?.message}`)
  }

  return data.signedUrl
}

/**
 * Delete file from storage
 */
export async function deleteFile(supabase: SupabaseClient, path: string): Promise<void> {
  const { error } = await supabase.storage.from(STORAGE_BUCKET).remove([path])

  if (error) {
    throw new Error(`Failed to delete file: ${error.message}`)
  }
}

/**
 * Delete multiple files from storage
 */
export async function deleteFiles(supabase: SupabaseClient, paths: string[]): Promise<number> {
  if (paths.length === 0) {
    return 0
  }

  const { data, error } = await supabase.storage.from(STORAGE_BUCKET).remove(paths)

  if (error) {
    throw new Error(`Failed to delete files: ${error.message}`)
  }

  return data?.length || 0
}

/**
 * List files for a user
 */
export async function listUserFiles(
  supabase: SupabaseClient,
  userId: string,
  options?: {
    limit?: number
    offset?: number
  }
): Promise<StorageFileInfo[]> {
  const prefix = `exports/${userId}/`

  const { data, error } = await supabase.storage.from(STORAGE_BUCKET).list(prefix, {
    limit: options?.limit || 100,
    offset: options?.offset || 0,
    sortBy: { column: 'created_at', order: 'desc' },
  })

  if (error) {
    throw new Error(`Failed to list files: ${error.message}`)
  }

  return (
    data?.map((file) => ({
      path: `${prefix}${file.name}`,
      size: file.metadata?.size || 0,
      createdAt: file.created_at || new Date().toISOString(),
    })) || []
  )
}

/**
 * Get file metadata
 */
export async function getFileInfo(
  supabase: SupabaseClient,
  path: string
): Promise<StorageFileInfo | null> {
  const { data, error } = await supabase.storage.from(STORAGE_BUCKET).list(path.split('/').slice(0, -1).join('/'), {
    search: path.split('/').pop(),
  })

  if (error || !data || data.length === 0) {
    return null
  }

  const file = data[0]
  return {
    path,
    size: file.metadata?.size || 0,
    createdAt: file.created_at || new Date().toISOString(),
  }
}

// ============================================
// QUOTA MANAGEMENT
// ============================================

/**
 * Calculate storage usage for a user
 */
export async function calculateUserStorageUsage(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const files = await listUserFiles(supabase, userId, { limit: 1000 })
  return files.reduce((total, file) => total + file.size, 0)
}

/**
 * Get storage quota for a user
 */
export async function getUserStorageQuota(
  supabase: SupabaseClient,
  userId: string,
  quotaLimit: number = DEFAULT_QUOTA_BYTES
): Promise<StorageQuota> {
  const used = await calculateUserStorageUsage(supabase, userId)
  const percentage = (used / quotaLimit) * 100

  return {
    used,
    limit: quotaLimit,
    percentage,
    isOverQuota: used > quotaLimit,
  }
}

/**
 * Check if user has available storage quota
 */
export async function hasAvailableQuota(
  supabase: SupabaseClient,
  userId: string,
  requiredBytes: number,
  quotaLimit: number = DEFAULT_QUOTA_BYTES
): Promise<boolean> {
  const quota = await getUserStorageQuota(supabase, userId, quotaLimit)
  return quota.used + requiredBytes <= quotaLimit
}

// ============================================
// CLEANUP OPERATIONS
// ============================================

/**
 * Clean up old export files for a user
 * Removes files older than specified days
 */
export async function cleanupOldFiles(
  supabase: SupabaseClient,
  userId: string,
  olderThanDays: number = 7
): Promise<number> {
  const files = await listUserFiles(supabase, userId, { limit: 1000 })
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)

  const filesToDelete = files
    .filter((file) => new Date(file.createdAt) < cutoffDate)
    .map((file) => file.path)

  if (filesToDelete.length === 0) {
    return 0
  }

  return deleteFiles(supabase, filesToDelete)
}

/**
 * Clean up orphaned files
 * Removes files that don't have a corresponding database record
 */
export async function cleanupOrphanedFiles(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  // Get all files from storage
  const storageFiles = await listUserFiles(supabase, userId, { limit: 1000 })

  // Get all file paths from export_history
  const { data: historyRecords, error } = await supabase
    .from('export_history')
    .select('file_path')
    .eq('user_id', userId)

  if (error) {
    throw new Error(`Failed to fetch history records: ${error.message}`)
  }

  const historyPaths = new Set(historyRecords?.map((r) => r.file_path) || [])

  // Find orphaned files (in storage but not in history)
  const orphanedPaths = storageFiles
    .filter((file) => !historyPaths.has(file.path))
    .map((file) => file.path)

  if (orphanedPaths.length === 0) {
    return 0
  }

  return deleteFiles(supabase, orphanedPaths)
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}
