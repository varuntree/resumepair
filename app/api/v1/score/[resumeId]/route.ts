/**
 * GET /api/v1/score/:resumeId
 * Fetch current score for a resume
 * Runtime: Edge (fast read)
 */

import { NextRequest } from 'next/server'
import { withAuth, apiSuccess, apiError } from '@/libs/api-utils'
import { createClient } from '@/libs/supabase/server'
import { getScore } from '@/libs/repositories/scores'

export const runtime = 'edge'

interface RouteContext {
  params: Promise<{ resumeId: string }>
}

export const GET = withAuth(
  async (req: NextRequest, user, context: RouteContext) => {
    try {
      const params = await context.params
      const { resumeId } = params

      if (!resumeId || typeof resumeId !== 'string') {
        return apiError(400, 'Resume ID is required')
      }

      // Fetch score (RLS enforced)
      const supabase = createClient()
      const score = await getScore(supabase, resumeId, user.id)

      return apiSuccess({ score })
    } catch (error) {
      console.error('Failed to fetch score:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return apiError(500, 'Failed to fetch score', errorMessage)
    }
  }
)
