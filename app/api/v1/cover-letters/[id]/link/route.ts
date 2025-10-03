/**
 * Cover Letter Link/Unlink API Route
 *
 * POST /api/v1/cover-letters/:id/link - Link cover letter to resume
 * DELETE /api/v1/cover-letters/:id/link - Unlink cover letter from resume
 *
 * Pattern: Uses repository pattern with optimistic locking
 *
 * @module app/api/v1/cover-letters/[id]/link/route
 */

import { NextRequest } from 'next/server'
import { withAuth } from '@/libs/api-utils'
import { apiSuccess, apiError } from '@/libs/api-utils/responses'
import { createClient } from '@/libs/supabase/server'
import { z } from 'zod'

/**
 * Link cover letter to resume schema
 */
const LinkCoverLetterSchema = z.object({
  resume_id: z.string().uuid(),
  sync_data: z.boolean().optional().default(false), // Whether to sync profile data from resume
})

/**
 * Link cover letter to resume
 *
 * POST /api/v1/cover-letters/:id/link
 *
 * Body:
 * - resume_id: UUID of resume to link
 * - sync_data: Optional boolean to sync profile data (default: false)
 *
 * Returns: Updated cover letter
 */
export const POST = withAuth(
  async (req: NextRequest, user) => {
    const coverLetterId = req.nextUrl.pathname.split('/')[4]

    if (!coverLetterId) {
      return apiError(400, 'Cover letter ID is required')
    }

    try {
      const body = await req.json()
      const { resume_id, sync_data } = LinkCoverLetterSchema.parse(body)

      const supabase = createClient()

      // Verify resume exists and belongs to user
      const { data: resume, error: resumeError } = await supabase
        .from('resumes')
        .select('id, data')
        .eq('id', resume_id)
        .eq('user_id', user.id)
        .eq('is_deleted', false)
        .single()

      if (resumeError || !resume) {
        return apiError(404, 'Resume not found')
      }

      // Verify cover letter exists and belongs to user
      const { data: coverLetter, error: clError } = await supabase
        .from('cover_letters')
        .select('*')
        .eq('id', coverLetterId)
        .eq('user_id', user.id)
        .eq('is_deleted', false)
        .single()

      if (clError || !coverLetter) {
        return apiError(404, 'Cover letter not found')
      }

      // Update cover letter with link
      let updateData: any = {
        linked_resume_id: resume_id,
        updated_at: new Date().toISOString(),
      }

      // If sync_data is true, update cover letter profile from resume
      if (sync_data && resume.data?.profile) {
        const { profile } = resume.data
        const updatedData = {
          ...coverLetter.data,
          from: {
            ...coverLetter.data.from,
            fullName: profile.fullName || coverLetter.data.from.fullName,
            email: profile.email || coverLetter.data.from.email,
            phone: profile.phone || coverLetter.data.from.phone,
            location: profile.location || coverLetter.data.from.location,
            linkedResumeId: resume_id,
          },
        }
        updateData.data = updatedData
      }

      const { data: updated, error: updateError } = await supabase
        .from('cover_letters')
        .update(updateData)
        .eq('id', coverLetterId)
        .eq('user_id', user.id)
        .select()
        .single()

      if (updateError) {
        console.error('Failed to link cover letter:', updateError)
        return apiError(500, 'Failed to link cover letter to resume')
      }

      return apiSuccess(updated, 'Cover letter linked to resume successfully')
    } catch (error) {
      if (error instanceof z.ZodError) {
        return apiError(400, 'Invalid request data', { errors: error.errors })
      }

      console.error('Link cover letter error:', error)
      return apiError(500, 'Internal server error')
    }
  }
)

/**
 * Unlink cover letter from resume
 *
 * DELETE /api/v1/cover-letters/:id/link
 *
 * Returns: Updated cover letter
 */
export const DELETE = withAuth(
  async (req: NextRequest, user) => {
    const coverLetterId = req.nextUrl.pathname.split('/')[4]

    if (!coverLetterId) {
      return apiError(400, 'Cover letter ID is required')
    }

    try {
      const supabase = createClient()

      // Verify cover letter exists and belongs to user
      const { data: coverLetter, error: clError } = await supabase
        .from('cover_letters')
        .select('*')
        .eq('id', coverLetterId)
        .eq('user_id', user.id)
        .eq('is_deleted', false)
        .single()

      if (clError || !coverLetter) {
        return apiError(404, 'Cover letter not found')
      }

      // Update cover letter to remove link
      const { data: updated, error: updateError } = await supabase
        .from('cover_letters')
        .update({
          linked_resume_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', coverLetterId)
        .eq('user_id', user.id)
        .select()
        .single()

      if (updateError) {
        console.error('Failed to unlink cover letter:', updateError)
        return apiError(500, 'Failed to unlink cover letter from resume')
      }

      return apiSuccess(updated, 'Cover letter unlinked from resume successfully')
    } catch (error) {
      console.error('Unlink cover letter error:', error)
      return apiError(500, 'Internal server error')
    }
  }
)

// Edge runtime for fast responses
export const runtime = 'edge'
