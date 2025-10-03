/**
 * Cover Letter API Route (Individual)
 *
 * GET /api/v1/cover-letters/:id - Get single cover letter
 * PUT /api/v1/cover-letters/:id - Update cover letter
 * DELETE /api/v1/cover-letters/:id - Delete cover letter (soft delete)
 *
 * Pattern: withAuth wrapper + repository pattern + optimistic locking
 */

import { NextRequest } from 'next/server'
import { withAuth } from '@/libs/api-utils/with-auth'
import { apiSuccess, apiError } from '@/libs/api-utils/responses'
import { createClient } from '@/libs/supabase/server'
import {
  getCoverLetter,
  updateCoverLetter,
  deleteCoverLetter,
} from '@/libs/repositories/coverLetters'
import { CoverLetterUpdateInputSchema } from '@/libs/validation/cover-letter'

/**
 * GET /api/v1/cover-letters/:id
 * Get single cover letter by ID
 */
export const GET = withAuth(async (req: NextRequest, user, context) => {
  try {
    const id = context?.params?.id
    if (!id || typeof id !== 'string') {
      return apiError(400, 'Cover letter ID is required')
    }

    const supabase = createClient()
    const coverLetter = await getCoverLetter(supabase, id)

    // Verify ownership (RLS should handle this, but double-check)
    if (coverLetter.user_id !== user.id) {
      return apiError(403, 'You do not have permission to access this cover letter')
    }

    return apiSuccess(coverLetter)
  } catch (error) {
    console.error('GET /cover-letters/:id error:', error)
    const message = error instanceof Error ? error.message : 'Failed to fetch cover letter'

    if (message.includes('not found')) {
      return apiError(404, 'Cover letter not found')
    }

    return apiError(500, message)
  }
})

/**
 * PUT /api/v1/cover-letters/:id
 * Update cover letter with optimistic locking
 */
export const PUT = withAuth(async (req: NextRequest, user, context) => {
  try {
    const id = context?.params?.id
    if (!id || typeof id !== 'string') {
      return apiError(400, 'Cover letter ID is required')
    }

    const body = await req.json()

    // Validate update input
    const validation = CoverLetterUpdateInputSchema.safeParse(body)
    if (!validation.success) {
      return apiError(400, 'Invalid input', validation.error.flatten())
    }

    const { title, data, linked_resume_id, version } = validation.data

    // Build updates object (only include changed fields)
    const updates: any = {}
    if (title !== undefined) updates.title = title
    if (data !== undefined) updates.data = data
    if (linked_resume_id !== undefined) updates.linked_resume_id = linked_resume_id

    // Require at least one update besides version
    if (Object.keys(updates).length === 0) {
      return apiError(400, 'No fields to update')
    }

    const supabase = createClient()
    const updatedCoverLetter = await updateCoverLetter(
      supabase,
      id,
      updates,
      version
    )

    return apiSuccess(updatedCoverLetter, 'Cover letter updated successfully')
  } catch (error) {
    console.error('PUT /cover-letters/:id error:', error)
    const message = error instanceof Error ? error.message : 'Failed to update cover letter'

    // Handle optimistic locking conflicts
    if (message.includes('CONFLICT')) {
      return apiError(409, 'Cover letter was updated by another process. Please refresh and try again.')
    }

    if (message.includes('not found')) {
      return apiError(404, 'Cover letter not found')
    }

    return apiError(500, message)
  }
})

/**
 * DELETE /api/v1/cover-letters/:id
 * Soft delete cover letter
 */
export const DELETE = withAuth(async (req: NextRequest, user, context) => {
  try {
    const id = context?.params?.id
    if (!id || typeof id !== 'string') {
      return apiError(400, 'Cover letter ID is required')
    }

    const supabase = createClient()
    await deleteCoverLetter(supabase, id)

    return apiSuccess({ id }, 'Cover letter deleted successfully')
  } catch (error) {
    console.error('DELETE /cover-letters/:id error:', error)
    const message = error instanceof Error ? error.message : 'Failed to delete cover letter'

    if (message.includes('not found')) {
      return apiError(404, 'Cover letter not found')
    }

    return apiError(500, message)
  }
})

export const runtime = 'edge'
