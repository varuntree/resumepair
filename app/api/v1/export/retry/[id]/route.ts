/**
 * POST /api/v1/export/retry/:id
 *
 * Retry a failed export job.
 * Resets job status to pending for processing.
 *
 * Runtime: Edge (lightweight operation)
 */

import { NextRequest } from 'next/server'
import { createClient } from '@/libs/supabase/server'
import { withAuth, apiSuccess, apiError } from '@/libs/api-utils'
import { getExportJob, updateExportJob } from '@/libs/repositories/exportJobs'

// ============================================
// RUNTIME CONFIG
// ============================================

export const runtime = 'edge'

// ============================================
// POST HANDLER - Retry Failed Job
// ============================================

export const POST = withAuth(
  async (req: NextRequest, user, context?: { params: { id: string } }) => {
    try {
      const jobId = context?.params.id

      if (!jobId) {
        return apiError(400, 'Job ID is required')
      }

      const supabase = createClient()

      // Get export job
      const job = await getExportJob(supabase, jobId)

      if (!job) {
        return apiError(404, 'Export job not found', undefined, 'NOT_FOUND')
      }

      // Verify ownership
      if (job.user_id !== user.id) {
        return apiError(403, 'Not authorized to retry this job', undefined, 'FORBIDDEN')
      }

      // Can only retry failed jobs
      if (job.status !== 'failed') {
        return apiError(
          400,
          `Cannot retry job with status: ${job.status}. Only failed jobs can be retried.`,
          undefined,
          'INVALID_STATE'
        )
      }

      // Check if max attempts reached
      if (job.attempts >= job.max_attempts) {
        return apiError(
          400,
          `Job has reached maximum retry attempts (${job.max_attempts})`,
          undefined,
          'MAX_ATTEMPTS_REACHED'
        )
      }

      // Reset job to pending status
      const updatedJob = await updateExportJob(supabase, jobId, {
        status: 'pending',
        error_message: undefined,
        run_after: undefined, // Process immediately
      })

      return apiSuccess(
        {
          jobId: updatedJob.id,
          status: updatedJob.status,
          attempts: updatedJob.attempts,
          maxAttempts: updatedJob.max_attempts,
        },
        'Export job queued for retry'
      )
    } catch (error) {
      console.error('Retry export job error:', error)
      return apiError(
        500,
        error instanceof Error ? error.message : 'Failed to retry export job',
        undefined,
        'INTERNAL_ERROR'
      )
    }
  }
)
