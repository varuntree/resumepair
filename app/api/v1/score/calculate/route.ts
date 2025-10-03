/**
 * POST /api/v1/score/calculate
 * Calculate score for a resume
 * Runtime: Node (for potential future LLM integration)
 */

import { NextRequest } from 'next/server'
import { withAuth, apiSuccess, apiError } from '@/libs/api-utils'
import { createClient } from '@/libs/supabase/server'
import { calculateScore } from '@/libs/scoring'
import { saveScore, saveScoreHistory } from '@/libs/repositories/scores'
import { z } from 'zod'

export const runtime = 'nodejs'

const RequestSchema = z.object({
  resumeId: z.string().uuid(),
  jobDescription: z.string().optional(),
})

export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    // 1. Validate input
    const body = await req.json()
    const validation = RequestSchema.safeParse(body)

    if (!validation.success) {
      return apiError(400, 'Invalid request', { zodError: validation.error.errors })
    }

    const { resumeId, jobDescription } = validation.data

    // 2. Fetch resume (RLS enforced)
    const supabase = createClient()
    const { data: resume, error: resumeError } = await supabase
      .from('resumes')
      .select('*')
      .eq('id', resumeId)
      .eq('user_id', user.id)
      .eq('is_deleted', false)
      .single()

    if (resumeError || !resume) {
      console.error('Resume fetch failed:', resumeError)
      return apiError(404, 'Resume not found')
    }

    // 3. Validate resume data
    if (!resume.data || typeof resume.data !== 'object') {
      return apiError(400, 'Invalid resume data')
    }

    // 4. Calculate score (simple algorithms)
    const score = calculateScore(resume.data, jobDescription)

    // 5. Save to database
    await saveScore(supabase, score, resumeId, user.id)
    await saveScoreHistory(supabase, score, resumeId, user.id, resume.version)

    // 6. Return score
    return apiSuccess({ score }, 'Score calculated successfully')
  } catch (error) {
    console.error('Score calculation failed:', error)

    if (error instanceof z.ZodError) {
      return apiError(400, 'Invalid request', { zodError: error.errors })
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return apiError(500, 'Failed to calculate score', errorMessage)
  }
})
