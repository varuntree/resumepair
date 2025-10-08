/**
 * Cover Letters API Route (Collection)
 *
 * GET /api/v1/cover-letters - List cover letters with pagination
 * POST /api/v1/cover-letters - Create new cover letter
 *
 * Pattern: withAuth wrapper + repository pattern
 */

import { NextRequest } from 'next/server'
import { withAuth } from '@/libs/api-utils/with-auth'
import { apiSuccess, apiError } from '@/libs/api-utils/responses'
import { createClient } from '@/libs/supabase/server'
import {
  getCoverLetters,
  createCoverLetter,
} from '@/libs/repositories/coverLetters'
import {
  CoverLetterCreateInputSchema,
  CoverLetterListParamsSchema,
  CoverLetterJsonSchema,
} from '@/libs/validation/cover-letter'
import { createEmptyCoverLetter } from '@/types/cover-letter'

/**
 * GET /api/v1/cover-letters
 * List user's cover letters with pagination and filtering
 */
export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    const { searchParams } = new URL(req.url)

    // Parse and validate query parameters
    const params = {
      status: searchParams.get('status'),
      search: searchParams.get('search'),
      sort: searchParams.get('sort') || 'updated_at',
      order: searchParams.get('order') || 'desc',
      cursor: searchParams.get('cursor'),
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20,
      linked_resume_id: searchParams.get('linked_resume_id'),
    }

    const validation = CoverLetterListParamsSchema.safeParse(params)
    if (!validation.success) {
      return apiError(400, 'Invalid query parameters', validation.error.flatten())
    }

    const supabase = createClient()
    const result = await getCoverLetters(supabase, user.id, validation.data)

    return apiSuccess(result)
  } catch (error) {
    console.error('GET /cover-letters error:', error)
    const message = error instanceof Error ? error.message : 'Failed to fetch cover letters'
    return apiError(500, message)
  }
})

/**
 * POST /api/v1/cover-letters
 * Create new cover letter
 */
export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    const body = await req.json()

    // Validate input
    const validation = CoverLetterCreateInputSchema.safeParse(body)
    if (!validation.success) {
      return apiError(400, 'Invalid input', validation.error.flatten())
    }

    const { title, linked_resume_id } = validation.data

    // Create default cover letter data
    const userEmail = user.email || user.user_metadata?.email || ''
    const userName = user.user_metadata?.full_name || user.user_metadata?.name || ''
    const defaultData = createEmptyCoverLetter(userEmail, userName)

    // Validate cover letter JSON schema
    const dataValidation = CoverLetterJsonSchema.safeParse(defaultData)
    if (!dataValidation.success) {
      return apiError(500, 'Failed to create cover letter data', dataValidation.error.flatten())
    }

    const supabase = createClient()
    const coverLetter = await createCoverLetter(
      supabase,
      user.id,
      title,
      dataValidation.data,
      linked_resume_id
    )

    return apiSuccess(coverLetter, 'Cover letter created successfully')
  } catch (error) {
    console.error('POST /cover-letters error:', error)
    const message = error instanceof Error ? error.message : 'Failed to create cover letter'
    return apiError(500, message)
  }
})

export const runtime = 'edge'
