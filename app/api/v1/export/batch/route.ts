/**
 * POST /api/v1/export/batch
 *
 * Create multiple PDF export jobs at once.
 * Useful for exporting multiple resumes with the same settings.
 *
 * Runtime: Node (requires Puppeteer)
 */

import { NextRequest } from 'next/server'
import { createClient } from '@/libs/supabase/server'
import { withAuth, apiSuccess, apiError } from '@/libs/api-utils'
import {
  createExportJob,
  countPendingJobs,
  type CreateExportJobParams,
} from '@/libs/repositories/exportJobs'
import { z } from 'zod'

// ============================================
// RUNTIME CONFIG
// ============================================

export const runtime = 'nodejs' // Required for Puppeteer

// ============================================
// VALIDATION
// ============================================

const BatchExportSchema = z.object({
  documentIds: z.array(z.string().uuid()).min(1).max(10), // Max 10 documents per batch
  quality: z.enum(['standard', 'high']).optional().default('standard'),
})

// ============================================
// CONSTANTS
// ============================================

const MAX_CONCURRENT_JOBS = 3

// ============================================
// HANDLER
// ============================================

export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    // Parse and validate request body
    const body = await req.json()
    const validation = BatchExportSchema.safeParse(body)

    if (!validation.success) {
      return apiError(400, validation.error.message, undefined, 'VALIDATION_ERROR')
    }

    const { documentIds, quality } = validation.data

    // Create Supabase client
    const supabase = createClient()

    // Check rate limit
    const pendingCount = await countPendingJobs(supabase, user.id)
    const totalAfterBatch = pendingCount + documentIds.length

    if (totalAfterBatch > MAX_CONCURRENT_JOBS) {
      return apiError(
        429,
        `Cannot create batch: would exceed maximum of ${MAX_CONCURRENT_JOBS} concurrent jobs`,
        undefined,
        'RATE_LIMITED'
      )
    }

    // Verify all documents exist and belong to user
    const { data: documents, error: docError } = await supabase
      .from('resumes')
      .select('id, user_id')
      .in('id', documentIds)
      .eq('user_id', user.id)

    if (docError) {
      return apiError(500, 'Failed to verify documents', docError.message)
    }

    if (!documents || documents.length !== documentIds.length) {
      return apiError(
        404,
        'One or more documents not found or not accessible',
        undefined,
        'NOT_FOUND'
      )
    }

    // Create export jobs for all documents
    const jobs = await Promise.all(
      documentIds.map(async (documentId) => {
        const jobParams: CreateExportJobParams = {
          user_id: user.id,
          document_id: documentId,
          format: 'pdf',
          options: {
            quality,
          },
        }

        return createExportJob(supabase, jobParams)
      })
    )

    return apiSuccess(
      {
        jobs: jobs.map((job) => ({
          jobId: job.id,
          documentId: job.document_id,
          status: job.status,
          progress: job.progress,
          createdAt: job.created_at,
        })),
        total: jobs.length,
      },
      `Created ${jobs.length} export jobs successfully`
    )
  } catch (error) {
    console.error('Batch export error:', error)
    return apiError(
      500,
      error instanceof Error ? error.message : 'Failed to create batch export jobs',
      undefined,
      'INTERNAL_ERROR'
    )
  }
})
