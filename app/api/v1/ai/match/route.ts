/**
 * AI Match Endpoint
 *
 * Matches resume against job description with AI analysis.
 * Provides scoring, gap analysis, and recommendations.
 *
 * POST /api/v1/ai/match
 * Runtime: Edge (fast response)
 * Max Duration: 30 seconds
 */

import { NextRequest } from 'next/server';
import { withAuth } from '@/libs/api-utils/with-auth';
import { apiSuccess, apiError } from '@/libs/api-utils/responses';
import { createClient } from '@/libs/supabase/server';
import { checkDailyQuota, incrementQuota } from '@/libs/ai/rateLimiter';
import { matchResumeToJob } from '@/libs/ai/matchers/jdMatcher';
import { createOperation } from '@/libs/repositories/aiOperations';
import { z } from 'zod';

export const runtime = 'edge';
export const maxDuration = 30;

/**
 * Request schema
 */
const MatchRequestSchema = z.object({
  resumeId: z.string().uuid('Invalid resume ID'),
  jobDescription: z.string().min(100, 'Job description too short (minimum 100 chars)').max(5000, 'Job description too long (maximum 5000 chars)'),
});

/**
 * Match resume to job description
 */
export const POST = withAuth(async (req: NextRequest, user) => {
  const supabase = createClient();
  const startTime = Date.now();

  try {
    const body = await req.json();
    const validated = MatchRequestSchema.parse(body);

    // Quota check
    const quota = await checkDailyQuota(supabase, user.id);
    if (!quota.allowed) {
      return apiError(429, quota.error || 'Daily quota exceeded', {
        resetAt: quota.resetAt.toISOString(),
        remaining: quota.remaining,
      });
    }

    // Fetch resume
    const { data: doc, error: docError } = await supabase
      .from('documents')
      .select('content')
      .eq('id', validated.resumeId)
      .eq('user_id', user.id)
      .single();

    if (docError || !doc) {
      return apiError(404, 'Resume not found');
    }

    // Match resume to job
    const result = await matchResumeToJob(doc.content, validated.jobDescription);
    const duration = Date.now() - startTime;

    // Calculate cost (estimate based on content length)
    const inputTokens = Math.ceil((JSON.stringify(doc.content).length + validated.jobDescription.length) / 4);
    const outputTokens = Math.ceil(JSON.stringify(result).length / 4);
    const cost = (inputTokens * 0.000075 + outputTokens * 0.00003);

    // Record operation and increment quota
    await incrementQuota(supabase, user.id, inputTokens + outputTokens, cost);

    await createOperation(supabase, {
      user_id: user.id,
      operation_type: 'match',
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      cost,
      duration_ms: duration,
      success: true,
    });

    return apiSuccess(result, 'Resume matched successfully');
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError(400, 'Invalid request', { errors: error.errors });
    }

    // Log failed operation
    await createOperation(supabase, {
      user_id: user.id,
      operation_type: 'match',
      success: false,
      error_message: error instanceof Error ? error.message : 'Unknown error',
    });

    return apiError(500, error instanceof Error ? error.message : 'Matching failed');
  }
});
