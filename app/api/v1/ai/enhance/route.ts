/**
 * AI Enhancement API Route
 *
 * POST /api/v1/ai/enhance
 * Enhances resume content (bullets, summaries, keywords) with AI assistance.
 *
 * @module app/api/v1/ai/enhance
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/libs/api-utils/with-auth';
import { apiSuccess, apiError } from '@/libs/api-utils/responses';
import { createClient } from '@/libs/supabase/server';
import { enhanceBullet } from '@/libs/ai/enhancers/bulletEnhancer';
import { generateSummary } from '@/libs/ai/enhancers/summaryGenerator';
import { extractKeywords } from '@/libs/ai/enhancers/keywordExtractor';
import {
  generateCacheKey,
  getCachedResponse,
  setCachedResponse,
  generateInputHash,
} from '@/libs/ai/cache';
import { trackEnhancement } from '@/libs/repositories/aiOperations';
import type { Profile, WorkExperience } from '@/types/resume';

export const runtime = 'edge';
export const maxDuration = 30;

/**
 * Enhancement request validation schema
 */
const EnhanceRequestSchema = z.object({
  type: z.enum(['bullet', 'summary', 'keywords']),
  content: z.string().min(10).max(2000),
  context: z
    .object({
      jobDescription: z.string().optional(),
      role: z.string().optional(),
      industry: z.string().optional(),
    })
    .optional(),
});

/**
 * POST /api/v1/ai/enhance
 *
 * Enhance resume content with AI assistance
 */
export const POST = withAuth(async (req: NextRequest, user) => {
  const supabase = createClient();

  try {
    const body = await req.json();
    const validated = EnhanceRequestSchema.parse(body);

    const { type, content, context } = validated;

    // Generate cache key (async for Web Crypto API)
    const cacheKey = await generateCacheKey(type, content, context);

    // Check cache first
    const cached = await getCachedResponse(supabase, cacheKey);

    if (cached) {
      // Track cache hit (zero cost)
      await trackEnhancement(supabase, user.id, type, 0, 0, true);

      return apiSuccess({
        ...cached,
        fromCache: true,
      });
    }

    // Cache miss - call AI
    let result: any;
    let inputTokens = 0;
    let outputTokens = 0;

    switch (type) {
      case 'bullet': {
        const bulletResult = await enhanceBullet(content, context);
        result = bulletResult;
        // Estimate tokens (rough: 4 chars per token)
        inputTokens = Math.ceil(content.length / 4);
        outputTokens = Math.ceil(JSON.stringify(bulletResult).length / 4);
        break;
      }

      case 'summary': {
        // Parse content as JSON (profile + work experiences)
        const data = JSON.parse(content) as {
          profile: Profile;
          work: WorkExperience[];
        };
        const summaryResult = await generateSummary(data.profile, data.work);
        result = summaryResult;
        inputTokens = Math.ceil(content.length / 4);
        outputTokens = Math.ceil(JSON.stringify(summaryResult).length / 4);
        break;
      }

      case 'keywords': {
        const keywords = await extractKeywords(content);
        result = {
          enhanced: keywords,
          original: content,
          changes: [`Extracted ${keywords.length} ATS-optimized keywords`],
        };
        inputTokens = Math.ceil(content.length / 4);
        outputTokens = Math.ceil(JSON.stringify(keywords).length / 4);
        break;
      }
    }

    // Cache the response (async hash)
    const inputHash = await generateInputHash(content);
    const operationType =
      type === 'bullet'
        ? 'enhance_bullet'
        : type === 'summary'
          ? 'enhance_summary'
          : 'extract_keywords';

    await setCachedResponse(supabase, cacheKey, operationType, inputHash, result);

    // Track operation (not from cache)
    await trackEnhancement(supabase, user.id, type, inputTokens, outputTokens, false);

    return apiSuccess({
      ...result,
      fromCache: false,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError(400, 'Invalid request', { errors: error.errors });
    }

    return apiError(
      500,
      error instanceof Error ? error.message : 'Enhancement failed'
    );
  }
});
