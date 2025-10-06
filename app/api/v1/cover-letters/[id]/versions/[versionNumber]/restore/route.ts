/**
 * Cover Letter Version API Routes: Restore Version
 *
 * POST /api/v1/cover-letters/:id/versions/:versionNumber/restore - Restore from version
 */

import { NextRequest } from 'next/server'
import { withAuth } from '@/libs/api-utils/with-auth'
import { apiSuccess, apiError } from '@/libs/api-utils/responses'
import { createClient } from '@/libs/supabase/server'
import { restoreVersion } from '@/libs/repositories/coverLetterVersions'

/**
 * POST /api/v1/cover-letters/:id/versions/:versionNumber/restore
 * Restore cover letter from specific version
 */
export const POST = withAuth(
  async (
    req: NextRequest,
    user,
    { params }: { params: { id: string; versionNumber: string } }
  ) => {
    try {
      const supabase = createClient()
      const { id, versionNumber } = params

      // Parse version number
      const versionNum = parseInt(versionNumber, 10)
      if (isNaN(versionNum) || versionNum < 1) {
        return apiError(400, 'Invalid version number')
      }

      // Restore from version
      const coverLetter = await restoreVersion(supabase, id, versionNum)

      return apiSuccess(coverLetter, 'Version restored successfully')
    } catch (error) {
      console.error('POST /api/v1/cover-letters/:id/versions/:versionNumber/restore error:', error)
      const message = error instanceof Error ? error.message : 'Failed to restore version'

      // Check for not found errors
      if (message.includes('not found')) {
        return apiError(404, 'Version not found', message)
      }

      return apiError(500, 'Failed to restore version', message)
    }
  }
)
