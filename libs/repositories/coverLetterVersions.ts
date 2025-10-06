/**
 * Cover Letter Version Repository
 *
 * Pure functions for cover letter version history operations.
 * All functions receive SupabaseClient as first parameter (dependency injection).
 *
 * @module repositories/coverLetterVersions
 */

import { SupabaseClient } from '@supabase/supabase-js'
import type { CoverLetter, CoverLetterVersion } from '@/types/cover-letter'

/**
 * Get all versions for a cover letter
 * @param supabase - User-scoped Supabase client
 * @param coverLetterId - Cover letter ID
 * @param limit - Maximum number of versions to return (default 30)
 * @returns Array of versions or throws error
 */
export async function getVersions(
  supabase: SupabaseClient,
  coverLetterId: string,
  limit: number = 30
): Promise<CoverLetterVersion[]> {
  const { data, error } = await supabase
    .from('cover_letter_versions')
    .select('*')
    .eq('cover_letter_id', coverLetterId)
    .order('version_number', { ascending: false })
    .limit(limit)

  if (error) {
    throw new Error(`Failed to fetch versions: ${error.message}`)
  }

  return (data as CoverLetterVersion[]) || []
}

/**
 * Get a specific version by version number
 * @param supabase - User-scoped Supabase client
 * @param coverLetterId - Cover letter ID
 * @param versionNumber - Version number
 * @returns Version or throws error
 */
export async function getVersion(
  supabase: SupabaseClient,
  coverLetterId: string,
  versionNumber: number
): Promise<CoverLetterVersion> {
  const { data, error } = await supabase
    .from('cover_letter_versions')
    .select('*')
    .eq('cover_letter_id', coverLetterId)
    .eq('version_number', versionNumber)
    .single()

  if (error) {
    throw new Error(`Failed to fetch version: ${error.message}`)
  }

  if (!data) {
    throw new Error('Version not found')
  }

  return data as CoverLetterVersion
}

/**
 * Restore a cover letter from a specific version
 * @param supabase - User-scoped Supabase client
 * @param coverLetterId - Cover letter ID
 * @param versionNumber - Version number to restore
 * @returns Updated cover letter or throws error
 */
export async function restoreVersion(
  supabase: SupabaseClient,
  coverLetterId: string,
  versionNumber: number
): Promise<CoverLetter> {
  // Get the version to restore
  const version = await getVersion(supabase, coverLetterId, versionNumber)

  // Get current cover letter to snapshot before restore
  const { data: current, error: currentError } = await supabase
    .from('cover_letters')
    .select('data, version, user_id')
    .eq('id', coverLetterId)
    .single()

  if (currentError || !current) {
    throw new Error('Failed to fetch current cover letter for snapshot')
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
    .from('cover_letter_versions')
    .insert({
      cover_letter_id: coverLetterId,
      version_number: current.version,
      data: current.data,
      created_by: user.id,
    })
    .then()

  // Restore the version data
  const { data: restored, error: restoreError } = await supabase
    .from('cover_letters')
    .update({
      data: version.data,
      version: current.version + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('id', coverLetterId)
    .select()
    .single()

  if (restoreError) {
    throw new Error(`Failed to restore version: ${restoreError.message}`)
  }

  if (!restored) {
    throw new Error('Restore operation failed')
  }

  return restored as CoverLetter
}

/**
 * Delete old versions (keep last N versions)
 * @param supabase - User-scoped Supabase client
 * @param coverLetterId - Cover letter ID
 * @param keepCount - Number of versions to keep (default 30)
 * @returns Number of deleted versions
 */
export async function pruneVersions(
  supabase: SupabaseClient,
  coverLetterId: string,
  keepCount: number = 30
): Promise<number> {
  // Get all versions ordered by version_number descending
  const { data: versions, error: fetchError } = await supabase
    .from('cover_letter_versions')
    .select('id, version_number')
    .eq('cover_letter_id', coverLetterId)
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
    .from('cover_letter_versions')
    .delete()
    .in('id', versionsToDelete)

  if (deleteError) {
    throw new Error(`Failed to prune versions: ${deleteError.message}`)
  }

  return count || 0
}
