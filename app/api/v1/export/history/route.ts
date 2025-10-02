/**
 * GET /api/v1/export/history
 *
 * List export history for the authenticated user.
 * Supports pagination and filtering by document.
 *
 * Runtime: Edge (lightweight read operation)
 */

import { NextRequest } from 'next/server'
import { createClient } from '@/libs/supabase/server'
import { withAuth, apiSuccess, apiError } from '@/libs/api-utils'
import {
  listExportHistory,
  getUserExportStats,
} from '@/libs/repositories/exportHistory'
import { z } from 'zod'

// ============================================
// RUNTIME CONFIG
// ============================================

export const runtime = 'edge'

// ============================================
// VALIDATION
// ============================================

const QuerySchema = z.object({
  documentId: z.string().uuid().optional(),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  offset: z.coerce.number().min(0).optional().default(0),
  includeStats: z.coerce.boolean().optional().default(false),
})

// ============================================
// GET HANDLER - List Export History
// ============================================

export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    // Parse and validate query parameters
    const searchParams = Object.fromEntries(req.nextUrl.searchParams)
    const validation = QuerySchema.safeParse(searchParams)

    if (!validation.success) {
      return apiError(400, validation.error.message, undefined, 'validation.error.messageCODE')
    }

    const { documentId, limit, offset, includeStats } = validation.data

    const supabase = createClient()

    // Get export history
    const history = await listExportHistory(supabase, user.id, {
      documentId,
      limit,
      offset,
    })

    // Optionally include user stats
    let stats = null
    if (includeStats) {
      stats = await getUserExportStats(supabase, user.id)
    }

    return apiSuccess({
      exports: history.map((h) => ({
        id: h.id,
        documentId: h.document_id,
        documentVersion: h.document_version,
        format: h.format,
        templateSlug: h.template_slug,
        fileName: h.file_name,
        fileSize: h.file_size,
        pageCount: h.page_count,
        downloadCount: h.download_count,
        expiresAt: h.expires_at,
        createdAt: h.created_at,
      })),
      pagination: {
        limit,
        offset,
        total: history.length,
      },
      ...(stats && { stats }),
    })
  } catch (error) {
    console.error('Get export history error:', error)
    return apiError(
      500,
      error instanceof Error ? error.message : 'Failed to get export history',
      undefined,
      'INTERNAL_ERROR'
    )
  }
})
