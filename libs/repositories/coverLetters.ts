/**
 * Cover Letter Document Repository
 *
 * Pure functions for cover letter CRUD operations with optimistic concurrency control.
 * Follows same pattern as documents.ts (resume repository).
 * All functions receive SupabaseClient as first parameter (dependency injection).
 *
 * @module repositories/coverLetters
 */

import { SupabaseClient } from '@supabase/supabase-js'
import type {
  CoverLetter,
  CoverLetterJson,
  CoverLetterListParams,
  CoverLetterListResponse,
} from '@/types/cover-letter'
import { normalizeCoverLetterData } from './normalizers'

/**
 * Get all cover letters for a user with pagination and filtering
 * @param supabase - User-scoped Supabase client
 * @param userId - User ID
 * @param options - Pagination and filtering options
 * @returns Cover letter list with pagination info
 */
export async function getCoverLetters(
  supabase: SupabaseClient,
  userId: string,
  options?: CoverLetterListParams
): Promise<CoverLetterListResponse> {
  // Helpers for composite cursor encoding (same pattern as resumes)
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
      return { v: cursor, id: '' }
    }
  }

  const base = () =>
    supabase
      .from('cover_letters')
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

  if (options?.linked_resume_id) {
    query = query.eq('linked_resume_id', options.linked_resume_id)
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
    // Next pages with composite cursor
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

    const { count: c } = await base()
    count = c || null
  }

  if (error) {
    throw new Error(`Failed to fetch cover letters: ${error.message}`)
  }

  // Calculate next cursor
  let nextCursor: string | null = null
  if (data && data.length === limit) {
    const last = data[data.length - 1] as any
    nextCursor = encodeCursor(last?.[sortField] ?? null, last?.id)
  }

  return {
    cover_letters: (data as CoverLetter[]) || [],
    nextCursor,
    total: count || 0,
  }
}

/**
 * Get a single cover letter by ID
 * @param supabase - User-scoped Supabase client
 * @param id - Cover letter ID
 * @returns Cover letter or throws error
 */
export async function getCoverLetter(
  supabase: SupabaseClient,
  id: string
): Promise<CoverLetter> {
  const { data, error } = await supabase
    .from('cover_letters')
    .select('*')
    .eq('id', id)
    .eq('is_deleted', false)
    .single()

  if (error) {
    throw new Error(`Failed to fetch cover letter: ${error.message}`)
  }

  if (!data) {
    throw new Error('Cover letter not found')
  }

  // Update last_accessed_at (fire and forget)
  supabase
    .from('cover_letters')
    .update({ last_accessed_at: new Date().toISOString() })
    .eq('id', id)
    .then()

  return data as CoverLetter
}

/**
 * Create a new cover letter
 * @param supabase - User-scoped Supabase client
 * @param userId - User ID
 * @param title - Cover letter title
 * @param data - Initial CoverLetterJson data
 * @param linkedResumeId - Optional linked resume ID
 * @returns Created cover letter or throws error
 */
export async function createCoverLetter(
  supabase: SupabaseClient,
  userId: string,
  title: string,
  data: CoverLetterJson,
  linkedResumeId?: string
): Promise<CoverLetter> {
  const normalized = normalizeCoverLetterData(data)
  const { data: coverLetter, error } = await supabase
    .from('cover_letters')
    .insert({
      user_id: userId,
      title,
      schema_version: 'cover-letter.v1',
      data: normalized,
      linked_resume_id: linkedResumeId || null,
      version: 1,
      status: 'draft',
      template_id: 'onyx',
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create cover letter: ${error.message}`)
  }

  return coverLetter as CoverLetter
}

/**
 * Update a cover letter with optimistic concurrency control
 * @param supabase - User-scoped Supabase client
 * @param id - Cover letter ID
 * @param updates - Fields to update
 * @param currentVersion - Current version number (for optimistic locking)
 * @returns Updated cover letter or throws conflict error
 */
export async function updateCoverLetter(
  supabase: SupabaseClient,
  id: string,
  updates: Partial<Pick<CoverLetter, 'title' | 'data' | 'status' | 'linked_resume_id'>>,
  currentVersion: number
): Promise<CoverLetter> {
  const payload: Record<string, any> = { ...updates }

  if (updates.data) {
    payload.data = normalizeCoverLetterData(updates.data as CoverLetterJson)
  }

  // Update with optimistic concurrency check
  const { data, error } = await supabase
    .from('cover_letters')
    .update({
      ...payload,
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
    throw new Error(`Failed to update cover letter: ${error.message}`)
  }

  if (!data) {
    throw new Error('CONFLICT: Version mismatch')
  }

  return data as CoverLetter
}

/**
 * Soft delete a cover letter
 * @param supabase - User-scoped Supabase client
 * @param id - Cover letter ID
 */
export async function deleteCoverLetter(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase
    .from('cover_letters')
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    throw new Error(`Failed to delete cover letter: ${error.message}`)
  }
}

/**
 * Restore a soft-deleted cover letter
 * @param supabase - User-scoped Supabase client
 * @param id - Cover letter ID
 */
export async function restoreCoverLetter(
  supabase: SupabaseClient,
  id: string
): Promise<CoverLetter> {
  const { data, error } = await supabase
    .from('cover_letters')
    .update({
      is_deleted: false,
      deleted_at: null,
    })
    .eq('id', id)
    .eq('is_deleted', true)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to restore cover letter: ${error.message}`)
  }

  if (!data) {
    throw new Error('Cover letter not found or not deleted')
  }

  return data as CoverLetter
}

/**
 * Duplicate a cover letter
 * @param supabase - User-scoped Supabase client
 * @param userId - User ID
 * @param id - Cover letter ID to duplicate
 * @returns New cover letter or throws error
 */
export async function duplicateCoverLetter(
  supabase: SupabaseClient,
  userId: string,
  id: string
): Promise<CoverLetter> {
  // Get source cover letter
  const source = await getCoverLetter(supabase, id)

  // Create new cover letter with same data
  const { data: newCoverLetter, error } = await supabase
    .from('cover_letters')
    .insert({
      user_id: userId,
      title: `${source.title} (Copy)`,
      schema_version: source.schema_version,
      data: source.data,
      linked_resume_id: source.linked_resume_id,
      version: 1,
      status: 'draft',
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to duplicate cover letter: ${error.message}`)
  }

  return newCoverLetter as CoverLetter
}

/**
 * Get deleted cover letters (trash)
 * @param supabase - User-scoped Supabase client
 * @param userId - User ID
 * @returns List of deleted cover letters
 */
export async function getDeletedCoverLetters(
  supabase: SupabaseClient,
  userId: string
): Promise<CoverLetter[]> {
  const { data, error } = await supabase
    .from('cover_letters')
    .select('*')
    .eq('user_id', userId)
    .eq('is_deleted', true)
    .order('deleted_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch deleted cover letters: ${error.message}`)
  }

  return (data as CoverLetter[]) || []
}

/**
 * Bulk delete cover letters
 * @param supabase - User-scoped Supabase client
 * @param ids - Array of cover letter IDs
 * @returns Number of deleted cover letters
 */
export async function bulkDeleteCoverLetters(
  supabase: SupabaseClient,
  ids: string[]
): Promise<number> {
  const { count, error } = await supabase
    .from('cover_letters')
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
    })
    .in('id', ids)

  if (error) {
    throw new Error(`Failed to bulk delete cover letters: ${error.message}`)
  }

  return count || 0
}

/**
 * Bulk archive cover letters
 * @param supabase - User-scoped Supabase client
 * @param ids - Array of cover letter IDs
 * @returns Number of archived cover letters
 */
export async function bulkArchiveCoverLetters(
  supabase: SupabaseClient,
  ids: string[]
): Promise<number> {
  const { count, error } = await supabase
    .from('cover_letters')
    .update({ status: 'archived' })
    .in('id', ids)

  if (error) {
    throw new Error(`Failed to bulk archive cover letters: ${error.message}`)
  }

  return count || 0
}
