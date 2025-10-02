/**
 * GET /api/v1/cron/cleanup-exports
 *
 * Cleanup expired export files from storage and database.
 * Intended to be called by a cron job (e.g., daily).
 *
 * Runtime: Node (for storage operations)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/libs/supabase/server'
import { apiSuccess, apiError } from '@/libs/api-utils'
import {
  findExpiredExports,
  deleteExpiredExports,
} from '@/libs/repositories/exportHistory'

// ============================================
// RUNTIME CONFIG
// ============================================

export const runtime = 'nodejs'

// ============================================
// CONSTANTS
// ============================================

const BATCH_SIZE = 50 // Process 50 expired exports per batch

// ============================================
// GET HANDLER - Cleanup Expired Exports
// ============================================

export async function GET(req: NextRequest) {
  try {
    // Verify cron secret (optional but recommended)
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return apiError(401, 'Invalid cron secret', undefined, 'UNAUTHORIZED')
    }

    const supabase = createClient()

    // Find expired exports
    const expiredExports = await findExpiredExports(supabase, BATCH_SIZE)

    if (expiredExports.length === 0) {
      return apiSuccess({
        deletedCount: 0,
        message: 'No expired exports to clean up',
      })
    }

    // Delete files from Supabase Storage
    const filePaths = expiredExports.map((exp) => exp.file_path)
    const { data: storageData, error: storageError } = await supabase.storage
      .from('exports')
      .remove(filePaths)

    if (storageError) {
      console.error('Failed to delete files from storage:', storageError)
      // Continue with database cleanup even if storage deletion fails
    }

    // Delete expired records from database
    const deletedCount = await deleteExpiredExports(supabase, BATCH_SIZE)

    return apiSuccess({
      deletedCount,
      filesDeleted: storageData?.length || 0,
      processedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Cleanup exports error:', error)
    return apiError(
      500,
      error instanceof Error ? error.message : 'Failed to cleanup exports',
      undefined,
      'INTERNAL_ERROR'
    )
  }
}
