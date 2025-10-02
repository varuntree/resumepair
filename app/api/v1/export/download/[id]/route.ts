/**
 * GET /api/v1/export/download/:id
 *
 * Download a completed export file.
 * Increments download count and returns the file.
 *
 * Runtime: Node (for file streaming)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/libs/supabase/server'
import { apiError } from '@/libs/api-utils'
import {
  getExportHistory,
  incrementDownloadCount,
} from '@/libs/repositories/exportHistory'

// ============================================
// RUNTIME CONFIG
// ============================================

export const runtime = 'nodejs'

// ============================================
// GET HANDLER - Download Export File
// ============================================

export async function GET(
  req: NextRequest,
  context?: { params: { id: string } }
) {
  try {
    const historyId = context?.params.id

    if (!historyId) {
      return apiError(400, 'History ID is required')
    }

    const supabase = createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return apiError(401, 'You must be logged in to download exports', authError?.message)
    }

    // Get export history record
    const history = await getExportHistory(supabase, historyId)

    if (!history) {
      return apiError(404, 'Export not found or expired', undefined, 'NOT_FOUND')
    }

    // Verify ownership
    if (history.user_id !== user.id) {
      return apiError(403, 'Not authorized to download this export', undefined, 'FORBIDDEN')
    }

    // Check if expired
    const now = new Date()
    const expiresAt = new Date(history.expires_at)
    if (now > expiresAt) {
      return apiError(410, 'Export has expired and is no longer available', undefined, 'EXPIRED')
    }

    // Get signed URL from Supabase Storage
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('exports')
      .createSignedUrl(history.file_path, 300) // 5 minute expiry

    if (signedUrlError || !signedUrlData) {
      console.error('Failed to create signed URL:', signedUrlError)
      return apiError(500, 'Failed to generate download link', signedUrlError?.message)
    }

    // Increment download count (fire and forget)
    incrementDownloadCount(supabase, historyId).catch((err) => {
      console.error('Failed to increment download count:', err)
    })

    // Return redirect to signed URL
    return NextResponse.redirect(signedUrlData.signedUrl)
  } catch (error) {
    console.error('Download export error:', error)
    return apiError(
      500,
      error instanceof Error ? error.message : 'Failed to download export',
      undefined,
      'INTERNAL_ERROR'
    )
  }
}
