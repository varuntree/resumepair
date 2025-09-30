/**
 * Resume API Route: Restore
 *
 * POST /api/v1/resumes/:id/restore - Restore a soft-deleted resume
 */

import { NextRequest } from 'next/server'
import { withAuth } from '@/libs/api-utils/with-auth'
import { apiSuccess, apiError } from '@/libs/api-utils/responses'
import { createClient } from '@/libs/supabase/server'
import { restoreResume } from '@/libs/repositories/documents'

/**
 * POST /api/v1/resumes/:id/restore
 * Restore a resume from trash
 */
export const POST = withAuth(
  async (req: NextRequest, user, { params }: { params: { id: string } }) => {
    try {
      const supabase = createClient()
      const { id } = params

      // Restore resume
      const resume = await restoreResume(supabase, id)

      return apiSuccess(resume, 'Resume restored successfully')
    } catch (error) {
      console.error('POST /api/v1/resumes/:id/restore error:', error)
      const message = error instanceof Error ? error.message : 'Failed to restore resume'

      // Check for not found errors
      if (message.includes('not found')) {
        return apiError(404, 'Resume not found or not deleted', message)
      }

      return apiError(500, 'Failed to restore resume', message)
    }
  }
)