/**
 * POST /api/v1/export/pdf
 *
 * Create a new PDF export job for a resume document.
 * Job is processed asynchronously in the queue.
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

const ExportPdfSchema = z.object({
  documentId: z.string().uuid('Invalid document ID'),
  templateSlug: z.string().min(1, 'Template slug is required').optional().default('minimal'),
  pageSize: z.enum(['letter', 'a4']).optional().default('letter'),
  margins: z
    .object({
      top: z.number().min(0).max(2),
      right: z.number().min(0).max(2),
      bottom: z.number().min(0).max(2),
      left: z.number().min(0).max(2),
    })
    .optional(),
  quality: z.enum(['standard', 'high']).optional().default('standard'),
})

// ============================================
// CONSTANTS
// ============================================

const MAX_CONCURRENT_JOBS = 3 // Maximum concurrent export jobs per user

// ============================================
// HANDLER
// ============================================

export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    // Parse and validate request body
    const body = await req.json()
    const validation = ExportPdfSchema.safeParse(body)

    if (!validation.success) {
      return apiError(400, validation.error.message, undefined, 'VALIDATION_ERROR')
    }

    const { documentId, templateSlug, pageSize, margins, quality } = validation.data

    // Create Supabase client
    const supabase = createClient()

    // Check rate limit: max concurrent jobs per user
    const pendingCount = await countPendingJobs(supabase, user.id)
    if (pendingCount >= MAX_CONCURRENT_JOBS) {
      return apiError(
        429,
        `Maximum ${MAX_CONCURRENT_JOBS} concurrent export jobs allowed`,
        undefined,
        'RATE_LIMITED'
      )
    }

    // Verify document exists and belongs to user
    const { data: document, error: docError } = await supabase
      .from('resumes')
      .select('id, user_id')
      .eq('id', documentId)
      .eq('user_id', user.id)
      .single()

    if (docError || !document) {
      return apiError(404, 'Document not found', undefined, 'NOT_FOUND')
    }

    // Create export job
    const jobParams: CreateExportJobParams = {
      user_id: user.id,
      document_id: documentId,
      format: 'pdf',
      options: {
        templateSlug,
        pageSize,
        margins,
        quality,
      },
    }

    const job = await createExportJob(supabase, jobParams)

    return apiSuccess(
      {
        jobId: job.id,
        status: job.status,
        progress: job.progress,
        createdAt: job.created_at,
      },
      'Export job created successfully'
    )
  } catch (error) {
    console.error('Export PDF error:', error)
    return apiError(
      500,
      error instanceof Error ? error.message : 'Failed to create export job',
      undefined,
      'INTERNAL_ERROR'
    )
  }
})
