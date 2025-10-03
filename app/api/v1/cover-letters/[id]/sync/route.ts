/**
 * Cover Letter Sync API Route
 *
 * POST /api/v1/cover-letters/:id/sync - Sync profile data from linked resume
 *
 * Pattern: One-way sync (resume → cover letter)
 * Updates cover letter's "from" section with resume profile data
 *
 * @module app/api/v1/cover-letters/[id]/sync/route
 */

import { NextRequest } from 'next/server'
import { withAuth } from '@/libs/api-utils'
import { apiSuccess, apiError } from '@/libs/api-utils/responses'
import { createClient } from '@/libs/supabase/server'

/**
 * Sync cover letter from linked resume
 *
 * POST /api/v1/cover-letters/:id/sync
 *
 * Returns: Updated cover letter with synced data
 */
export const POST = withAuth(
  async (req: NextRequest, user) => {
    const coverLetterId = req.nextUrl.pathname.split('/')[4]

    if (!coverLetterId) {
      return apiError(400, 'Cover letter ID is required')
    }

    try {
      const supabase = createClient()

      // Get cover letter with linked resume ID
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

      if (!coverLetter.linked_resume_id) {
        return apiError(400, 'Cover letter is not linked to a resume')
      }

      // Get linked resume
      const { data: resume, error: resumeError } = await supabase
        .from('resumes')
        .select('id, data')
        .eq('id', coverLetter.linked_resume_id)
        .eq('user_id', user.id)
        .eq('is_deleted', false)
        .single()

      if (resumeError || !resume) {
        return apiError(
          404,
          'Linked resume not found. The resume may have been deleted.'
        )
      }

      // Sync profile data from resume to cover letter
      const { profile } = resume.data

      if (!profile) {
        return apiError(400, 'Resume does not have profile data')
      }

      const updatedData = {
        ...coverLetter.data,
        from: {
          ...coverLetter.data.from,
          fullName: profile.fullName || coverLetter.data.from.fullName,
          email: profile.email || coverLetter.data.from.email,
          phone: profile.phone,
          location: profile.location,
          linkedResumeId: resume.id,
        },
      }

      // Update cover letter with synced data
      const { data: updated, error: updateError } = await supabase
        .from('cover_letters')
        .update({
          data: updatedData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', coverLetterId)
        .eq('user_id', user.id)
        .select()
        .single()

      if (updateError) {
        console.error('Failed to sync cover letter:', updateError)
        return apiError(500, 'Failed to sync cover letter with resume')
      }

      return apiSuccess(
        updated,
        'Cover letter synced with resume profile successfully'
      )
    } catch (error) {
      console.error('Sync cover letter error:', error)
      return apiError(500, 'Internal server error')
    }
  }
)

// Edge runtime for fast responses
export const runtime = 'edge'
