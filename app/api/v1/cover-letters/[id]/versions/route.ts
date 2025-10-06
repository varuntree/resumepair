/**
 * Cover Letter Version API Routes: List Versions
 *
 * GET /api/v1/cover-letters/:id/versions - List all versions for a cover letter
 */

import { NextRequest } from 'next/server'
import { withAuth } from '@/libs/api-utils/with-auth'
import { apiSuccess, apiError } from '@/libs/api-utils/responses'
import { createClient } from '@/libs/supabase/server'
import { getVersions } from '@/libs/repositories/coverLetterVersions'

/**
 * GET /api/v1/cover-letters/:id/versions
 * List all versions for a cover letter
 */
export const GET = withAuth(
  async (req: NextRequest, user, { params }: { params: { id: string } }) => {
    try {
      const supabase = createClient()
      const { id } = params
      const { searchParams } = new URL(req.url)

      // Get limit parameter (default 30, max 50)
      const limitParam = searchParams.get('limit')
      const limit = limitParam ? Math.min(parseInt(limitParam, 10), 50) : 30

      // Fetch versions
      const versions = await getVersions(supabase, id, limit)

      return apiSuccess({ versions })
    } catch (error) {
      console.error('GET /api/v1/cover-letters/:id/versions error:', error)
      const message = error instanceof Error ? error.message : 'Failed to fetch versions'
      return apiError(500, 'Failed to fetch versions', message)
    }
  }
)
