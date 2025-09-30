/**
 * Resume Version Repository
 *
 * Pure functions for resume version history operations.
 * All functions receive SupabaseClient as first parameter (dependency injection).
 *
 * @module repositories/versions
 */

import { SupabaseClient } from '@supabase/supabase-js'
import type { Resume, ResumeVersion } from '@/types/resume'

/**
 * Get all versions for a resume
 * @param supabase - User-scoped Supabase client
 * @param resumeId - Resume ID
 * @param limit - Maximum number of versions to return (default 30)
 * @returns Array of versions or throws error
 */
export async function getVersions(
  supabase: SupabaseClient,
  resumeId: string,
  limit: number = 30
): Promise<ResumeVersion[]> {
  const { data, error } = await supabase
    .from('resume_versions')
    .select('*')
    .eq('resume_id', resumeId)
    .order('version_number', { ascending: false })
    .limit(limit)

  if (error) {
    throw new Error(`Failed to fetch versions: ${error.message}`)
  }

  return (data as ResumeVersion[]) || []
}

/**
 * Get a specific version by version number
 * @param supabase - User-scoped Supabase client
 * @param resumeId - Resume ID
 * @param versionNumber - Version number
 * @returns Version or throws error
 */
export async function getVersion(
  supabase: SupabaseClient,
  resumeId: string,
  versionNumber: number
): Promise<ResumeVersion> {
  const { data, error } = await supabase
    .from('resume_versions')
    .select('*')
    .eq('resume_id', resumeId)
    .eq('version_number', versionNumber)
    .single()

  if (error) {
    throw new Error(`Failed to fetch version: ${error.message}`)
  }

  if (!data) {
    throw new Error('Version not found')
  }

  return data as ResumeVersion
}

/**
 * Restore a resume from a specific version
 * @param supabase - User-scoped Supabase client
 * @param resumeId - Resume ID
 * @param versionNumber - Version number to restore
 * @returns Updated resume or throws error
 */
export async function restoreVersion(
  supabase: SupabaseClient,
  resumeId: string,
  versionNumber: number
): Promise<Resume> {
  // Get the version to restore
  const version = await getVersion(supabase, resumeId, versionNumber)

  // Get current resume to snapshot before restore
  const { data: current, error: currentError } = await supabase
    .from('resumes')
    .select('data, version, user_id')
    .eq('id', resumeId)
    .single()

  if (currentError || !current) {
    throw new Error('Failed to fetch current resume for snapshot')
  }

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  // Snapshot current state before restore
  await supabase
    .from('resume_versions')
    .insert({
      resume_id: resumeId,
      version_number: current.version,
      data: current.data,
      created_by: user.id,
    })
    .then()

  // Restore the version data
  const { data: restored, error: restoreError } = await supabase
    .from('resumes')
    .update({
      data: version.data,
      version: current.version + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('id', resumeId)
    .select()
    .single()

  if (restoreError) {
    throw new Error(`Failed to restore version: ${restoreError.message}`)
  }

  if (!restored) {
    throw new Error('Restore operation failed')
  }

  return restored as Resume
}

/**
 * Delete old versions (keep last N versions)
 * @param supabase - User-scoped Supabase client
 * @param resumeId - Resume ID
 * @param keepCount - Number of versions to keep (default 30)
 * @returns Number of deleted versions
 */
export async function pruneVersions(
  supabase: SupabaseClient,
  resumeId: string,
  keepCount: number = 30
): Promise<number> {
  // Get all versions ordered by version_number descending
  const { data: versions, error: fetchError } = await supabase
    .from('resume_versions')
    .select('id, version_number')
    .eq('resume_id', resumeId)
    .order('version_number', { ascending: false })

  if (fetchError) {
    throw new Error(`Failed to fetch versions for pruning: ${fetchError.message}`)
  }

  if (!versions || versions.length <= keepCount) {
    return 0 // Nothing to prune
  }

  // Get IDs of versions to delete (keep only first keepCount)
  const versionsToDelete = versions.slice(keepCount).map((v) => v.id)

  const { count, error: deleteError } = await supabase
    .from('resume_versions')
    .delete()
    .in('id', versionsToDelete)

  if (deleteError) {
    throw new Error(`Failed to prune versions: ${deleteError.message}`)
  }

  return count || 0
}