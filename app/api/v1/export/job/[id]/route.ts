/**
 * GET /api/v1/export/job/:id
 * DELETE /api/v1/export/job/:id
 *
 * Get status or cancel an export job.
 *
 * Runtime: Edge (lightweight operations)
 */

import { NextRequest } from 'next/server'
import { createClient } from '@/libs/supabase/server'
import { withAuth, apiSuccess, apiError } from '@/libs/api-utils'
import { getExportJob, cancelExportJob, deleteExportJob } from '@/libs/repositories/exportJobs'

// ============================================
// RUNTIME CONFIG
// ============================================

export const runtime = 'edge'

// ============================================
// GET HANDLER - Get Job Status
// ============================================

export const GET = withAuth(
  async (req: NextRequest, user, context?: { params: { id: string } }) => {
    try {
      const jobId = context?.params.id

      if (!jobId) {
        return apiError(400, 'Job ID is required')
      }

      const supabase = createClient()
      const job = await getExportJob(supabase, jobId)

      if (!job) {
        return apiError(404, 'Export job not found', undefined, 'NOT_FOUND')
      }

      // Verify ownership
      if (job.user_id !== user.id) {
        return apiError(403, 'Not authorized to access this job', undefined, 'FORBIDDEN')
      }

      return apiSuccess({
        jobId: job.id,
        documentId: job.document_id,
        format: job.format,
        status: job.status,
        progress: job.progress,
        options: job.options,
        resultUrl: job.result_url,
        fileSize: job.file_size,
        pageCount: job.page_count,
        errorMessage: job.error_message,
        attempts: job.attempts,
        maxAttempts: job.max_attempts,
        startedAt: job.started_at,
        completedAt: job.completed_at,
        createdAt: job.created_at,
      })
    } catch (error) {
      console.error('Get export job error:', error)
      return apiError(
        500,
        error instanceof Error ? error.message : 'Failed to get export job',
        undefined,
        'INTERNAL_ERROR'
      )
    }
  }
)

// ============================================
// DELETE HANDLER - Cancel/Delete Job
// ============================================

export const DELETE = withAuth(
  async (req: NextRequest, user, context?: { params: { id: string } }) => {
    try {
      const jobId = context?.params.id

      if (!jobId) {
        return apiError(400, 'Job ID is required')
      }

      const supabase = createClient()
      const job = await getExportJob(supabase, jobId)

      if (!job) {
        return apiError(404, 'Export job not found', undefined, 'NOT_FOUND')
      }

      // Verify ownership
      if (job.user_id !== user.id) {
        return apiError(403, 'Not authorized to delete this job', undefined, 'FORBIDDEN')
      }

      // If job is pending or processing, cancel it first
      if (job.status === 'pending' || job.status === 'processing') {
        await cancelExportJob(supabase, jobId)
      }

      // Delete the job
      await deleteExportJob(supabase, jobId)

      return apiSuccess(
        {
          jobId,
          deletedAt: new Date().toISOString(),
        },
        'Export job deleted successfully'
      )
    } catch (error) {
      console.error('Delete export job error:', error)
      return apiError(
        500,
        error instanceof Error ? error.message : 'Failed to delete export job',
        undefined,
        'INTERNAL_ERROR'
      )
    }
  }
)
