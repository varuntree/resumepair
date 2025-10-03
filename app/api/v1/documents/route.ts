/**
 * Unified Documents API Route
 *
 * GET /api/v1/documents - List and search across resumes and cover letters
 *
 * Supports filtering, sorting, and full-text search.
 *
 * @module app/api/v1/documents/route
 */

import { NextRequest } from 'next/server'
import { withAuth } from '@/libs/api-utils'
import { apiSuccess, apiError } from '@/libs/api-utils/responses'
import { createClient } from '@/libs/supabase/server'
import { z } from 'zod'

/**
 * Query parameters schema
 */
const DocumentsQuerySchema = z.object({
  type: z.enum(['all', 'resume', 'cover_letter']).optional().default('all'),
  status: z.enum(['draft', 'active', 'archived']).optional(),
  search: z.string().optional(),
  sort: z.enum(['updated_at', 'created_at', 'title']).optional().default('updated_at'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
})

/**
 * Unified document interface
 */
interface UnifiedDocument {
  id: string
  title: string
  type: 'resume' | 'cover_letter'
  status: 'draft' | 'active' | 'archived'
  linked_document_id?: string | null
  created_at: string
  updated_at: string
  last_accessed_at: string | null
}

/**
 * GET /api/v1/documents
 *
 * Returns unified list of resumes and cover letters.
 * Supports cross-document search using UNION query.
 */
export const GET = withAuth(
  async (req: NextRequest, user) => {
    try {
      const { searchParams } = new URL(req.url)
      const params = DocumentsQuerySchema.parse({
        type: searchParams.get('type') || 'all',
        status: searchParams.get('status') || undefined,
        search: searchParams.get('search') || undefined,
        sort: searchParams.get('sort') || 'updated_at',
        order: searchParams.get('order') || 'desc',
        limit: searchParams.get('limit') || '20',
      })

      const supabase = createClient()
      const documents: UnifiedDocument[] = []

      // Fetch resumes if type is 'all' or 'resume'
      if (params.type === 'all' || params.type === 'resume') {
        let resumeQuery = supabase
          .from('resumes')
          .select('id, title, status, created_at, updated_at, last_accessed_at')
          .eq('user_id', user.id)
          .eq('is_deleted', false)

        if (params.status) {
          resumeQuery = resumeQuery.eq('status', params.status)
        }

        if (params.search) {
          resumeQuery = resumeQuery.ilike('title', `%${params.search}%`)
        }

        const { data: resumes, error: resumeError } = await resumeQuery

        if (resumeError) {
          console.error('Failed to fetch resumes:', resumeError)
          return apiError(500, 'Failed to fetch resumes')
        }

        documents.push(
          ...(resumes || []).map((r) => ({
            ...r,
            type: 'resume' as const,
            linked_document_id: null,
          }))
        )
      }

      // Fetch cover letters if type is 'all' or 'cover_letter'
      if (params.type === 'all' || params.type === 'cover_letter') {
        let coverLetterQuery = supabase
          .from('cover_letters')
          .select(
            'id, title, status, linked_resume_id, created_at, updated_at, last_accessed_at'
          )
          .eq('user_id', user.id)
          .eq('is_deleted', false)

        if (params.status) {
          coverLetterQuery = coverLetterQuery.eq('status', params.status)
        }

        if (params.search) {
          coverLetterQuery = coverLetterQuery.ilike('title', `%${params.search}%`)
        }

        const { data: coverLetters, error: coverLetterError } =
          await coverLetterQuery

        if (coverLetterError) {
          console.error('Failed to fetch cover letters:', coverLetterError)
          return apiError(500, 'Failed to fetch cover letters')
        }

        documents.push(
          ...(coverLetters || []).map((cl) => ({
            id: cl.id,
            title: cl.title,
            type: 'cover_letter' as const,
            status: cl.status,
            linked_document_id: cl.linked_resume_id,
            created_at: cl.created_at,
            updated_at: cl.updated_at,
            last_accessed_at: cl.last_accessed_at,
          }))
        )
      }

      // Sort documents
      const sortedDocuments = documents.sort((a, b) => {
        const sortField = params.sort
        const aValue = a[sortField] || ''
        const bValue = b[sortField] || ''

        if (params.order === 'asc') {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
        } else {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
        }
      })

      // Apply limit
      const limitedDocuments = sortedDocuments.slice(0, params.limit)

      return apiSuccess({
        documents: limitedDocuments,
        total: sortedDocuments.length,
        counts: {
          all: documents.length,
          resumes: documents.filter((d) => d.type === 'resume').length,
          coverLetters: documents.filter((d) => d.type === 'cover_letter')
            .length,
        },
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return apiError(400, 'Invalid query parameters', { errors: error.errors })
      }

      console.error('Documents list error:', error)
      return apiError(500, 'Internal server error')
    }
  }
)

// Edge runtime for fast responses
export const runtime = 'edge'
