/**
 * AI Quota Endpoint
 *
 * Returns user's current AI quota status.
 * Includes usage, limits, cost, and reset time.
 *
 * GET /api/v1/ai/quota
 * Runtime: Edge (fast read-only)
 * Max Duration: 10 seconds
 */

import { NextRequest } from 'next/server';
import { withAuth } from '@/libs/api-utils/with-auth';
import { apiSuccess, apiError } from '@/libs/api-utils/responses';
import { createClient } from '@/libs/supabase/server';
import { getUserQuota } from '@/libs/repositories/aiOperations';

export const runtime = 'edge';
export const maxDuration = 10;

/**
 * Get user's AI quota status
 */
export const GET = withAuth(async (req: NextRequest, user) => {
  const supabase = createClient();

  try {
    const quota = await getUserQuota(supabase, user.id);

    return apiSuccess({
      userId: user.id,
      operationCount: quota.operation_count,
      operationLimit: 100,
      tokenCount: quota.token_count,
      totalCost: parseFloat(quota.total_cost.toString()),
      remainingOperations: quota.remaining,
      periodStart: quota.period_start,
      periodEnd: quota.period_end,
      resetIn: quota.resetIn,
    }, 'Quota retrieved successfully');
  } catch (error) {
    return apiError(500, error instanceof Error ? error.message : 'Failed to fetch quota');
  }
});
