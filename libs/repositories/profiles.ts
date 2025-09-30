import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Profile type (will be replaced with generated type after migrations)
 */
export interface Profile {
  id: string
  full_name: string | null
  locale: string
  date_format: 'US' | 'ISO' | 'EU'
  page_size: 'Letter' | 'A4'
  created_at: string
  updated_at: string
}

/**
 * Profile update data (partial)
 */
export interface ProfileUpdate {
  full_name?: string
  locale?: string
  date_format?: 'US' | 'ISO' | 'EU'
  page_size?: 'Letter' | 'A4'
}

/**
 * Get user profile by ID
 * @param supabase - User-scoped Supabase client (with RLS)
 * @param userId - User ID (must match authenticated user)
 * @returns Profile or throws error
 */
export async function getProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    throw new Error(`Failed to fetch profile: ${error.message}`)
  }

  if (!data) {
    throw new Error('Profile not found')
  }

  return data as Profile
}

/**
 * Update user profile
 * @param supabase - User-scoped Supabase client (with RLS)
 * @param userId - User ID (must match authenticated user)
 * @param updates - Partial profile data to update
 * @returns Updated profile or throws error
 */
export async function updateProfile(
  supabase: SupabaseClient,
  userId: string,
  updates: ProfileUpdate
): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update profile: ${error.message}`)
  }

  if (!data) {
    throw new Error('Profile not found after update')
  }

  return data as Profile
}
