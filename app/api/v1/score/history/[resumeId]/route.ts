/**
 * GET /api/v1/score/history/:resumeId
 * Fetch score history for a resume
 * Runtime: Edge (fast read)
 */

import { NextRequest } from 'next/server'
import { withAuth, apiSuccess, apiError } from '@/libs/api-utils'
import { createClient } from '@/libs/supabase/server'
import { getScoreHistory } from '@/libs/repositories/scores'

export const runtime = 'edge'

interface RouteContext {
  params: Promise<{ resumeId: string }>
}

export const GET = withAuth(
  async (req: NextRequest, user, context: RouteContext) => {
    try {
      const params = await context.params
      const { resumeId } = params
      const { searchParams } = new URL(req.url)
      const limit = parseInt(searchParams.get('limit') || '20')

      if (!resumeId || typeof resumeId !== 'string') {
        return apiError(400, 'Resume ID is required')
      }

      // Fetch history (RLS enforced)
      const supabase = createClient()
      const history = await getScoreHistory(supabase, resumeId, user.id, limit)

      return apiSuccess({ history })
    } catch (error) {
      console.error('Failed to fetch score history:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return apiError(500, 'Failed to fetch score history', errorMessage)
    }
  }
)
