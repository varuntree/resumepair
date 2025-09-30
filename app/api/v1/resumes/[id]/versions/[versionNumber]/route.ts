/**
 * Resume Version API Routes: Get Specific Version
 *
 * GET /api/v1/resumes/:id/versions/:versionNumber - Get specific version
 */

import { NextRequest } from 'next/server'
import { withAuth } from '@/libs/api-utils/with-auth'
import { apiSuccess, apiError } from '@/libs/api-utils/responses'
import { createClient } from '@/libs/supabase/server'
import { getVersion } from '@/libs/repositories/versions'

/**
 * GET /api/v1/resumes/:id/versions/:versionNumber
 * Get specific version by version number
 */
export const GET = withAuth(
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

      // Fetch version
      const version = await getVersion(supabase, id, versionNum)

      return apiSuccess(version)
    } catch (error) {
      console.error('GET /api/v1/resumes/:id/versions/:versionNumber error:', error)
      const message = error instanceof Error ? error.message : 'Failed to fetch version'

      // Check for not found errors
      if (message.includes('not found')) {
        return apiError(404, 'Version not found', message)
      }

      return apiError(500, 'Failed to fetch version', message)
    }
  }
)