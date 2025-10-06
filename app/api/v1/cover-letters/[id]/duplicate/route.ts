/**
 * Cover Letter API Route: Duplicate
 *
 * POST /api/v1/cover-letters/:id/duplicate - Duplicate an existing cover letter
 */

import { NextRequest } from 'next/server'
import { withAuth } from '@/libs/api-utils/with-auth'
import { apiSuccess, apiError } from '@/libs/api-utils/responses'
import { createClient } from '@/libs/supabase/server'
import { duplicateCoverLetter } from '@/libs/repositories/coverLetters'

/**
 * POST /api/v1/cover-letters/:id/duplicate
 * Create a copy of an existing cover letter
 */
export const POST = withAuth(
  async (req: NextRequest, user, { params }: { params: { id: string } }) => {
    try {
      const supabase = createClient()
      const { id } = params

      // Duplicate cover letter
      const newCoverLetter = await duplicateCoverLetter(supabase, user.id, id)

      return apiSuccess(newCoverLetter, 'Cover letter duplicated successfully')
    } catch (error) {
      console.error('POST /api/v1/cover-letters/:id/duplicate error:', error)
      const message =
        error instanceof Error ? error.message : 'Failed to duplicate cover letter'

      // Check for not found errors
      if (message.includes('not found')) {
        return apiError(404, 'Cover letter not found', message)
      }

      return apiError(500, 'Failed to duplicate cover letter', message)
    }
  }
)
