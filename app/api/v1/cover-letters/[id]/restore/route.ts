/**
 * Cover Letter API Route: Restore
 *
 * POST /api/v1/cover-letters/:id/restore - Restore a soft-deleted cover letter
 */

import { NextRequest } from 'next/server'
import { withAuth } from '@/libs/api-utils/with-auth'
import { apiSuccess, apiError } from '@/libs/api-utils/responses'
import { createClient } from '@/libs/supabase/server'
import { restoreCoverLetter } from '@/libs/repositories/coverLetters'

/**
 * POST /api/v1/cover-letters/:id/restore
 * Restore a cover letter from trash
 */
export const POST = withAuth(
  async (req: NextRequest, user, { params }: { params: { id: string } }) => {
    try {
      const supabase = createClient()
      const { id } = params

      // Restore cover letter
      const coverLetter = await restoreCoverLetter(supabase, id)

      return apiSuccess(coverLetter, 'Cover letter restored successfully')
    } catch (error) {
      console.error('POST /api/v1/cover-letters/:id/restore error:', error)
      const message = error instanceof Error ? error.message : 'Failed to restore cover letter'

      // Check for not found errors
      if (message.includes('not found')) {
        return apiError(404, 'Cover letter not found or not deleted', message)
      }

      return apiError(500, 'Failed to restore cover letter', message)
    }
  }
)
