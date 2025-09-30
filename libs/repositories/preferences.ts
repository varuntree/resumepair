import { SupabaseClient } from '@supabase/supabase-js'

/**
 * User preferences type
 */
export interface UserPreferences {
  user_id: string
  theme: 'light' | 'dark' | 'system'
  email_notifications: boolean
  auto_save: boolean
  default_template: string | null
  created_at: string
  updated_at: string
}

/**
 * Preferences update data (partial)
 */
export interface PreferencesUpdate {
  theme?: 'light' | 'dark' | 'system'
  email_notifications?: boolean
  auto_save?: boolean
  default_template?: string | null
}

/**
 * Get user preferences by user ID
 * @param supabase - User-scoped Supabase client (with RLS)
 * @param userId - User ID (must match authenticated user)
 * @returns Preferences or throws error
 */
export async function getPreferences(
  supabase: SupabaseClient,
  userId: string
): Promise<UserPreferences> {
  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    throw new Error(`Failed to fetch preferences: ${error.message}`)
  }

  if (!data) {
    throw new Error('Preferences not found')
  }

  return data as UserPreferences
}

/**
 * Update user preferences
 * @param supabase - User-scoped Supabase client (with RLS)
 * @param userId - User ID (must match authenticated user)
 * @param updates - Partial preferences data to update
 * @returns Updated preferences or throws error
 */
export async function updatePreferences(
  supabase: SupabaseClient,
  userId: string,
  updates: PreferencesUpdate
): Promise<UserPreferences> {
  const { data, error } = await supabase
    .from('user_preferences')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update preferences: ${error.message}`)
  }

  if (!data) {
    throw new Error('Preferences not found after update')
  }

  return data as UserPreferences
}