/**
 * AI Cover Letter Enhancement API Route
 *
 * POST /api/v1/ai/enhance-cover-letter
 * Enhances cover letter paragraphs with AI assistance.
 *
 * @module app/api/v1/ai/enhance-cover-letter
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/libs/api-utils/with-auth'
import { apiSuccess, apiError } from '@/libs/api-utils/responses'
import { createClient } from '@/libs/supabase/server'
import { enhanceParagraph } from '@/libs/ai/enhancers/paragraphEnhancer'
import {
  generateCacheKey,
  getCachedResponse,
  setCachedResponse,
  generateInputHash,
} from '@/libs/ai/cache'
import { trackEnhancement } from '@/libs/repositories/aiOperations'

export const runtime = 'edge'
export const maxDuration = 30

/**
 * Cover letter enhancement request validation schema
 */
const EnhanceCoverLetterRequestSchema = z.object({
  paragraph: z.string().min(20).max(2000),
  context: z
    .object({
      role: z.string().optional(),
      companyName: z.string().optional(),
      industry: z.string().optional(),
      jobDescription: z.string().optional(),
      paragraphIndex: z.number().optional(),
      totalParagraphs: z.number().optional(),
    })
    .optional(),
})

/**
 * POST /api/v1/ai/enhance-cover-letter
 *
 * Enhance cover letter paragraph with AI assistance
 */
export const POST = withAuth(async (req: NextRequest, user) => {
  const supabase = createClient()

  try {
    const body = await req.json()
    const validated = EnhanceCoverLetterRequestSchema.parse(body)

    const { paragraph, context } = validated

    // Generate cache key (async for Web Crypto API)
    const cacheKey = await generateCacheKey('cover_letter_paragraph', paragraph, context)

    // Check cache first
    const cached = await getCachedResponse(supabase, cacheKey)

    if (cached) {
      // Track cache hit (zero cost)
      await trackEnhancement(supabase, user.id, 'cover_letter_paragraph', 0, 0, true)

      return apiSuccess({
        ...cached,
        fromCache: true,
      })
    }

    // Cache miss - call AI
    const result = await enhanceParagraph(paragraph, context)

    // Estimate tokens (rough: 4 chars per token)
    const inputTokens = Math.ceil(paragraph.length / 4)
    const outputTokens = Math.ceil(JSON.stringify(result).length / 4)

    // Cache the response (async hash)
    const inputHash = await generateInputHash(paragraph)
    await setCachedResponse(
      supabase,
      cacheKey,
      'enhance_cover_letter_paragraph',
      inputHash,
      result
    )

    // Track operation (not from cache)
    await trackEnhancement(
      supabase,
      user.id,
      'cover_letter_paragraph',
      inputTokens,
      outputTokens,
      false
    )

    return apiSuccess({
      ...result,
      fromCache: false,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError(400, 'Invalid request', { errors: error.errors })
    }

    return apiError(500, error instanceof Error ? error.message : 'Enhancement failed')
  }
})
