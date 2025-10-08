/**
 * Resume API Routes: List and Create
 *
 * GET  /api/v1/resumes - List user's resumes with pagination/filtering
 * POST /api/v1/resumes - Create new resume
 */

import { NextRequest } from 'next/server'
import { withAuth } from '@/libs/api-utils/with-auth'
import { apiSuccess, apiError } from '@/libs/api-utils/responses'
import { createClient } from '@/libs/supabase/server'
import { getResumes, createResume } from '@/libs/repositories/documents'
import { getProfile } from '@/libs/repositories/profiles'
import { CreateResumeSchema, ResumeListQuerySchema } from '@/libs/validation/resume'
import { createEmptyResume } from '@/types/resume'

/**
 * GET /api/v1/resumes
 * List user's resumes with pagination and filtering
 */
export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(req.url)

    // Parse and validate query parameters
    const queryResult = ResumeListQuerySchema.safeParse({
      status: searchParams.get('status') || undefined,
      search: searchParams.get('search') || undefined,
      sort: searchParams.get('sort') || undefined,
      order: searchParams.get('order') || undefined,
      cursor: searchParams.get('cursor') || undefined,
      limit: searchParams.get('limit') || undefined,
    })

    if (!queryResult.success) {
      return apiError(400, 'Invalid query parameters', queryResult.error.format())
    }

    const options = queryResult.data

    // Fetch resumes from repository
    const result = await getResumes(supabase, user.id, options)

    return apiSuccess(result)
  } catch (error) {
    console.error('GET /api/v1/resumes error:', error)
    const message = error instanceof Error ? error.message : 'Failed to fetch resumes'
    return apiError(500, 'Failed to fetch resumes', message)
  }
})

/**
 * POST /api/v1/resumes
 * Create new resume
 */
export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    const supabase = createClient()
    const body = await req.json()

    // Validate input
    const result = CreateResumeSchema.safeParse(body)
    if (!result.success) {
      return apiError(400, 'Validation failed', result.error.format())
    }

    const { title, template } = result.data

    // Get user profile for defaults
    const profile = await getProfile(supabase, user.id)

    // Get template data or use empty schema
    let initialData
    initialData = createEmptyResume(
      user.email || '',
      profile.full_name || '',
      {
        locale: profile.locale,
        dateFormat: profile.date_format,
        pageSize: profile.page_size,
      },
      template
    )

    // Create resume
    const resume = await createResume(supabase, user.id, title, initialData)

    return apiSuccess(resume, 'Resume created successfully')
  } catch (error) {
    console.error('POST /api/v1/resumes error:', error)
    const message = error instanceof Error ? error.message : 'Failed to create resume'
    return apiError(500, 'Failed to create resume', message)
  }
})
