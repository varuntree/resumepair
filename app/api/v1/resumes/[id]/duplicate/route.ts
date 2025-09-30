/**
 * Resume API Route: Duplicate
 *
 * POST /api/v1/resumes/:id/duplicate - Duplicate an existing resume
 */

import { NextRequest } from 'next/server'
import { withAuth } from '@/libs/api-utils/with-auth'
import { apiSuccess, apiError } from '@/libs/api-utils/responses'
import { createClient } from '@/libs/supabase/server'
import { duplicateResume } from '@/libs/repositories/documents'

/**
 * POST /api/v1/resumes/:id/duplicate
 * Create a copy of an existing resume
 */
export const POST = withAuth(
  async (req: NextRequest, user, { params }: { params: { id: string } }) => {
    try {
      const supabase = createClient()
      const { id } = params

      // Duplicate resume
      const newResume = await duplicateResume(supabase, user.id, id)

      return apiSuccess(newResume, 'Resume duplicated successfully')
    } catch (error) {
      console.error('POST /api/v1/resumes/:id/duplicate error:', error)
      const message = error instanceof Error ? error.message : 'Failed to duplicate resume'

      // Check for not found errors
      if (message.includes('not found')) {
        return apiError(404, 'Resume not found', message)
      }

      return apiError(500, 'Failed to duplicate resume', message)
    }
  }
)