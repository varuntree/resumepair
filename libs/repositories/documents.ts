/**
 * Resume Document Repository
 *
 * Pure functions for resume CRUD operations with optimistic concurrency control.
 * All functions receive SupabaseClient as first parameter (dependency injection).
 *
 * @module repositories/documents
 */

import { SupabaseClient } from '@supabase/supabase-js'
import type {
  Resume,
  ResumeJson,
  ResumeListParams,
  ResumeListResponse,
} from '@/types/resume'

/**
 * Get all resumes for a user with pagination and filtering
 * @param supabase - User-scoped Supabase client
 * @param userId - User ID
 * @param options - Pagination and filtering options
 * @returns Resume list with pagination info
 */
export async function getResumes(
  supabase: SupabaseClient,
  userId: string,
  options?: ResumeListParams
): Promise<ResumeListResponse> {
  // Helpers for composite cursor encoding
  const encodeCursor = (value: unknown, id: string): string => {
    try {
      return Buffer.from(JSON.stringify({ v: value, id }), 'utf8').toString('base64')
    } catch {
      return String(value)
    }
  }

  const decodeCursor = (
    cursor?: string | null
  ): { v: string; id: string } | null => {
    if (!cursor) return null
    try {
      const json = Buffer.from(cursor, 'base64').toString('utf8')
      const obj = JSON.parse(json)
      if (obj && typeof obj === 'object' && 'v' in obj && 'id' in obj) {
        return { v: String((obj as any).v), id: String((obj as any).id) }
      }
      return null
    } catch {
      // Backward-compat: legacy cursor (single value)
      return { v: cursor, id: '' }
    }
  }

  const base = () =>
    supabase
      .from('resumes')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .eq('is_deleted', false)

  // Apply filters
  let query = base()
  if (options?.status) {
    query = query.eq('status', options.status)
  }

  if (options?.search) {
    query = query.ilike('title', `%${options.search}%`)
  }

  // Apply sorting
  const sortField = options?.sort || 'updated_at'
  const ascending = options?.order === 'asc'

  // Apply pagination
  const limit = options?.limit || 20
  let data: any[] = []
  let count: number | null = null
  let error: any = null

  const cursor = decodeCursor(options?.cursor || null)
  if (!cursor) {
    // First page
    const { data: d, error: e, count: c } = await base()
      .order(sortField, { ascending })
      .order('id', { ascending: true })
      .limit(limit)
    data = (d as any[]) || []
    error = e
    count = c || 0
  } else {
    // Next pages with composite cursor (value, id)
    // 1) Fetch equal sort bucket with id > cursor.id (lexicographic tie-breaker)
    const eqFilter = base()
      .eq(sortField, cursor.v)
      .gt('id', cursor.id)
      .order(sortField, { ascending })
      .order('id', { ascending: true })
      .limit(limit)
    const { data: eqData, error: eqErr } = await eqFilter

    if (eqErr) {
      error = eqErr
    }

    data = (eqData as any[]) || []

    if (data.length < limit) {
      const remaining = limit - data.length
      // 2) Fetch strictly greater/less sort values depending on direction
      const cmpFilter = ascending
        ? base().gt(sortField, cursor.v)
        : base().lt(sortField, cursor.v)

      const { data: cmpData, error: cmpErr } = await cmpFilter
        .order(sortField, { ascending })
        .order('id', { ascending: true })
        .limit(remaining)

      if (cmpErr) {
        error = cmpErr
      }

      if (cmpData && cmpData.length) {
        data = data.concat(cmpData as any[])
      }
    }

    // Compute count only when not paginating (optional). Keep previous approach to return exact count.
    // For simplicity and performance, do a lightweight count here by issuing base() with count 'exact' but no range (may be heavier);
    // Alternatively, leave previous count behavior.
    const { count: c } = await base()
    count = c || null
  }

  if (error) {
    throw new Error(`Failed to fetch resumes: ${error.message}`)
  }

  // Calculate next cursor
  let nextCursor: string | null = null
  if (data && data.length === limit) {
    const last = data[data.length - 1] as any
    nextCursor = encodeCursor(last?.[sortField] ?? null, last?.id)
  }

  return {
    resumes: (data as Resume[]) || [],
    nextCursor,
    total: count || 0,
  }
}

/**
 * Get a single resume by ID
 * @param supabase - User-scoped Supabase client
 * @param id - Resume ID
 * @returns Resume or throws error
 */
export async function getResume(
  supabase: SupabaseClient,
  id: string
): Promise<Resume> {
  const { data, error } = await supabase
    .from('resumes')
    .select('*')
    .eq('id', id)
    .eq('is_deleted', false)
    .single()

  if (error) {
    throw new Error(`Failed to fetch resume: ${error.message}`)
  }

  if (!data) {
    throw new Error('Resume not found')
  }

  // Update last_accessed_at (fire and forget)
  supabase
    .from('resumes')
    .update({ last_accessed_at: new Date().toISOString() })
    .eq('id', id)
    .then()

  return data as Resume
}

/**
 * Create a new resume
 * @param supabase - User-scoped Supabase client
 * @param userId - User ID
 * @param title - Resume title
 * @param data - Initial ResumeJson data
 * @returns Created resume or throws error
 */
export async function createResume(
  supabase: SupabaseClient,
  userId: string,
  title: string,
  data: ResumeJson
): Promise<Resume> {
  const { data: resume, error } = await supabase
    .from('resumes')
    .insert({
      user_id: userId,
      title,
      schema_version: 'resume.v1',
      data,
      version: 1,
      status: 'draft',
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create resume: ${error.message}`)
  }

  return resume as Resume
}

/**
 * Update a resume with optimistic concurrency control
 * @param supabase - User-scoped Supabase client
 * @param id - Resume ID
 * @param updates - Fields to update
 * @param currentVersion - Current version number (for optimistic locking)
 * @returns Updated resume or throws conflict error
 */
export async function updateResume(
  supabase: SupabaseClient,
  id: string,
  updates: Partial<Pick<Resume, 'title' | 'data' | 'status'>>,
  currentVersion: number
): Promise<Resume> {
  // First, snapshot current version to history
  const { data: current } = await supabase
    .from('resumes')
    .select('data, version, user_id')
    .eq('id', id)
    .single()

  if (current) {
    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('AUTH: User not authenticated for version snapshot')
    }

    // Create version snapshot (best-effort - log error but continue)
    try {
      await supabase.from('resume_versions').insert({
        resume_id: id,
        version_number: current.version,
        data: current.data,
        created_by: user.id,
      })
    } catch (err) {
      console.warn('Version snapshot failed (non-blocking):', err)
      // Continue with update - version history is best-effort
    }
  }

  // Update with optimistic concurrency check
  const { data, error } = await supabase
    .from('resumes')
    .update({
      ...updates,
      version: currentVersion + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('version', currentVersion)
    .select()
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('CONFLICT: Document was updated by another process')
    }
    throw new Error(`Failed to update resume: ${error.message}`)
  }

  if (!data) {
    throw new Error('CONFLICT: Version mismatch')
  }

  return data as Resume
}

/**
 * Soft delete a resume
 * @param supabase - User-scoped Supabase client
 * @param id - Resume ID
 */
export async function deleteResume(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase
    .from('resumes')
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    throw new Error(`Failed to delete resume: ${error.message}`)
  }
}

/**
 * Restore a soft-deleted resume
 * @param supabase - User-scoped Supabase client
 * @param id - Resume ID
 */
export async function restoreResume(
  supabase: SupabaseClient,
  id: string
): Promise<Resume> {
  const { data, error } = await supabase
    .from('resumes')
    .update({
      is_deleted: false,
      deleted_at: null,
    })
    .eq('id', id)
    .eq('is_deleted', true)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to restore resume: ${error.message}`)
  }

  if (!data) {
    throw new Error('Resume not found or not deleted')
  }

  return data as Resume
}

/**
 * Duplicate a resume
 * @param supabase - User-scoped Supabase client
 * @param userId - User ID
 * @param id - Resume ID to duplicate
 * @returns New resume or throws error
 */
export async function duplicateResume(
  supabase: SupabaseClient,
  userId: string,
  id: string
): Promise<Resume> {
  // Get source resume
  const source = await getResume(supabase, id)

  // Create new resume with same data
  const { data: newResume, error } = await supabase
    .from('resumes')
    .insert({
      user_id: userId,
      title: `${source.title} (Copy)`,
      schema_version: source.schema_version,
      data: source.data,
      version: 1,
      status: 'draft',
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to duplicate resume: ${error.message}`)
  }

  return newResume as Resume
}

/**
 * Get deleted resumes (trash)
 * @param supabase - User-scoped Supabase client
 * @param userId - User ID
 * @returns List of deleted resumes
 */
export async function getDeletedResumes(
  supabase: SupabaseClient,
  userId: string
): Promise<Resume[]> {
  const { data, error } = await supabase
    .from('resumes')
    .select('*')
    .eq('user_id', userId)
    .eq('is_deleted', true)
    .order('deleted_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch deleted resumes: ${error.message}`)
  }

  return (data as Resume[]) || []
}

/**
 * Bulk delete resumes
 * @param supabase - User-scoped Supabase client
 * @param ids - Array of resume IDs
 * @returns Number of deleted resumes
 */
export async function bulkDeleteResumes(
  supabase: SupabaseClient,
  ids: string[]
): Promise<number> {
  const { count, error } = await supabase
    .from('resumes')
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
    })
    .in('id', ids)

  if (error) {
    throw new Error(`Failed to bulk delete resumes: ${error.message}`)
  }

  return count || 0
}

/**
 * Bulk archive resumes
 * @param supabase - User-scoped Supabase client
 * @param ids - Array of resume IDs
 * @returns Number of archived resumes
 */
export async function bulkArchiveResumes(
  supabase: SupabaseClient,
  ids: string[]
): Promise<number> {
  const { count, error } = await supabase
    .from('resumes')
    .update({ status: 'archived' })
    .in('id', ids)

  if (error) {
    throw new Error(`Failed to bulk archive resumes: ${error.message}`)
  }

  return count || 0
}
