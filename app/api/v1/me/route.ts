import { NextRequest } from 'next/server'
import { withAuth, apiSuccess, apiError } from '@/libs/api-utils'
import { getProfile, getPreferences, updateProfile, type ProfileUpdate } from '@/libs/repositories'
import { createClient } from '@/libs/supabase/server'
import { createAdminClient } from '@/libs/supabase/admin'
import { z } from 'zod'

/**
 * Zod schema for profile updates
 */
const UpdateProfileSchema = z.object({
  full_name: z.string().max(100).optional(),
  avatar_url: z.string().url().optional().nullable(),
  locale: z.string().optional(),
  date_format: z.enum(['US', 'ISO', 'EU']).optional(),
  page_size: z.enum(['Letter', 'A4']).optional()
})

/**
 * GET /api/v1/me
 * Fetch current user's profile and preferences
 */
export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    const supabase = createClient()

    // Fetch profile and preferences in parallel
    const [profile, preferences] = await Promise.all([
      getProfile(supabase, user.id),
      getPreferences(supabase, user.id)
    ])

    return apiSuccess({
      user: {
        id: user.id,
        email: user.email
      },
      profile,
      preferences
    })
  } catch (error) {
    console.error('GET /api/v1/me error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return apiError(500, 'Failed to fetch user data', message)
  }
})

/**
 * PUT /api/v1/me
 * Update current user's profile
 */
export const PUT = withAuth(async (req: NextRequest, user) => {
  try {
    const body = await req.json()

    // Validate input with Zod
    const result = UpdateProfileSchema.safeParse(body)
    if (!result.success) {
      return apiError(
        400,
        'Invalid input',
        result.error.errors.map(e => `${e.path}: ${e.message}`).join(', ')
      )
    }

    const supabase = createClient()

    // Update profile
    const updatedProfile = await updateProfile(
      supabase,
      user.id,
      result.data as ProfileUpdate
    )

    return apiSuccess(updatedProfile, 'Profile updated successfully')
  } catch (error) {
    console.error('PUT /api/v1/me error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return apiError(500, 'Failed to update profile', message)
  }
})

/**
 * DELETE /api/v1/me
 * Delete current user's account (soft delete - marks for deletion)
 * Note: Actual deletion will be handled by a background job
 */
export const DELETE = withAuth(async (req: NextRequest, user) => {
  try {
    // Use service-role client for admin operations
    const admin = createAdminClient()

    // Delete user account via Supabase Admin API
    // Note: In production, this should be a soft delete with a background job
    // For Phase 1, we'll use Supabase's auth admin delete
    const { error } = await admin.auth.admin.deleteUser(user.id)

    if (error) {
      throw new Error(`Failed to delete user: ${error.message}`)
    }

    return apiSuccess(null, 'Account deleted successfully')
  } catch (error) {
    console.error('DELETE /api/v1/me error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return apiError(500, 'Failed to delete account', message)
  }
})

// Use Node runtime for admin operations (DELETE requires admin API)
export const runtime = 'nodejs'
