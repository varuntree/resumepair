/**
 * Resume API Routes: Detail Operations
 *
 * GET    /api/v1/resumes/:id - Get specific resume
 * PUT    /api/v1/resumes/:id - Update resume
 * DELETE /api/v1/resumes/:id - Soft delete resume
 */

import { NextRequest } from 'next/server'
import { withAuth } from '@/libs/api-utils/with-auth'
import { apiSuccess, apiError } from '@/libs/api-utils/responses'
import { createClient } from '@/libs/supabase/server'
import { getResume, updateResume, deleteResume } from '@/libs/repositories/documents'
import { UpdateResumeSchema } from '@/libs/validation/resume'

/**
 * GET /api/v1/resumes/:id
 * Get specific resume by ID
 */
export const GET = withAuth(
  async (req: NextRequest, user, { params }: { params: { id: string } }) => {
    try {
      const supabase = createClient()
      const { id } = params

      // Fetch resume (RLS will enforce ownership)
      const resume = await getResume(supabase, id)

      return apiSuccess(resume)
    } catch (error) {
      console.error('GET /api/v1/resumes/:id error:', error)
      const message = error instanceof Error ? error.message : 'Failed to fetch resume'

      // Check for not found errors
      if (message.includes('not found')) {
        return apiError(404, 'Resume not found', message)
      }

      return apiError(500, 'Failed to fetch resume', message)
    }
  }
)

/**
 * PUT /api/v1/resumes/:id
 * Update resume with optimistic locking
 */
export const PUT = withAuth(
  async (req: NextRequest, user, { params }: { params: { id: string } }) => {
    try {
      const supabase = createClient()
      const { id } = params
      const body = await req.json()

      // Validate input
      const result = UpdateResumeSchema.safeParse(body)
      if (!result.success) {
        return apiError(400, 'Validation failed', result.error.format())
      }

      const { title, data, version } = result.data

      // Update resume with optimistic concurrency control
      const updates: {
        title?: string
        data?: any
      } = {}

      if (title !== undefined) {
        updates.title = title
      }

      if (data !== undefined) {
        updates.data = data
      }

      const updatedResume = await updateResume(supabase, id, updates as any, version)

      return apiSuccess(updatedResume, 'Resume updated successfully')
    } catch (error) {
      console.error('PUT /api/v1/resumes/:id error:', error)
      const message = error instanceof Error ? error.message : 'Failed to update resume'

      // Check for conflict errors
      if (message.includes('CONFLICT')) {
        return apiError(
          409,
          'Resume was modified by another process. Please refresh and try again.',
          message
        )
      }

      // Check for not found errors
      if (message.includes('not found')) {
        return apiError(404, 'Resume not found', message)
      }

      return apiError(500, 'Failed to update resume', message)
    }
  }
)

/**
 * DELETE /api/v1/resumes/:id
 * Soft delete resume
 */
export const DELETE = withAuth(
  async (req: NextRequest, user, { params }: { params: { id: string } }) => {
    try {
      const supabase = createClient()
      const { id } = params

      // Soft delete resume
      await deleteResume(supabase, id)

      return apiSuccess({ id }, 'Resume deleted successfully')
    } catch (error) {
      console.error('DELETE /api/v1/resumes/:id error:', error)
      const message = error instanceof Error ? error.message : 'Failed to delete resume'
      return apiError(500, 'Failed to delete resume', message)
    }
  }
)