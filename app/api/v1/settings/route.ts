import { NextRequest } from 'next/server'
import { withAuth, apiSuccess, apiError } from '@/libs/api-utils'
import { getPreferences, updatePreferences, type PreferencesUpdate } from '@/libs/repositories'
import { createClient } from '@/libs/supabase/server'
import { z } from 'zod'

/**
 * Zod schema for preferences updates
 */
const UpdatePreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  email_notifications: z.boolean().optional(),
  auto_save: z.boolean().optional(),
  default_template: z.string().nullable().optional()
})

/**
 * GET /api/v1/settings
 * Fetch current user's preferences
 */
export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    const supabase = createClient()
    const preferences = await getPreferences(supabase, user.id)

    return apiSuccess(preferences)
  } catch (error) {
    console.error('GET /api/v1/settings error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return apiError(500, 'Failed to fetch preferences', message)
  }
})

/**
 * PUT /api/v1/settings
 * Update current user's preferences
 */
export const PUT = withAuth(async (req: NextRequest, user) => {
  try {
    const body = await req.json()

    // Validate input
    const result = UpdatePreferencesSchema.safeParse(body)
    if (!result.success) {
      return apiError(
        400,
        'Invalid input',
        result.error.errors.map(e => `${e.path}: ${e.message}`).join(', ')
      )
    }

    const supabase = createClient()

    // Update preferences
    const updatedPreferences = await updatePreferences(
      supabase,
      user.id,
      result.data as PreferencesUpdate
    )

    return apiSuccess(updatedPreferences, 'Preferences updated successfully')
  } catch (error) {
    console.error('PUT /api/v1/settings error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return apiError(500, 'Failed to update preferences', message)
  }
})

// Use Edge runtime for fast operations
export const runtime = 'edge'