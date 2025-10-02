/**
 * Rate Limiter - Database Quota Only
 *
 * Simplified rate limiting using database for daily quota enforcement.
 * In-memory rate limiting removed (incompatible with Edge runtime).
 *
 * Single tier:
 * - 100 requests per day (quota limit, blocking)
 *
 * @module libs/ai/rateLimiter
 */

import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Quota check result
 */
export interface QuotaCheck {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  error?: string;
}

/**
 * Check user's daily quota
 *
 * Enforces 100 operations per 24-hour period via database.
 * Automatically resets quota if period has expired.
 *
 * @param supabase - Supabase client
 * @param userId - User ID to check
 * @returns Quota check result
 */
export async function checkDailyQuota(
  supabase: SupabaseClient,
  userId: string
): Promise<QuotaCheck> {
  const now = Date.now();

  // Reset if expired (DB function handles atomically)
  await supabase.rpc('check_quota_reset', { p_user_id: userId });

  // Get current quota
  const { data: quota, error } = await supabase
    .from('user_ai_quotas')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    // Error other than "not found"
    throw new Error(`Quota check failed: ${error.message}`);
  }

  // If no quota record, create one (first time user)
  if (!quota) {
    const periodEnd = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await supabase.from('user_ai_quotas').insert({
      user_id: userId,
      operation_count: 0,
      token_count: 0,
      total_cost: 0,
      period_start: new Date().toISOString(),
      period_end: periodEnd.toISOString(),
    });

    return {
      allowed: true,
      remaining: 100,
      resetAt: periodEnd,
    };
  }

  const periodEnd = new Date(quota.period_end);
  const operationCount = quota.operation_count || 0;

  // Check daily limit (100 operations)
  if (operationCount >= 100) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: periodEnd,
      error: `Daily quota exceeded (100 operations per day). Resets at ${periodEnd.toLocaleTimeString()}.`,
    };
  }

  // Quota available
  return {
    allowed: true,
    remaining: 100 - operationCount,
    resetAt: periodEnd,
  };
}

/**
 * Increment user's quota after successful operation
 *
 * Uses atomic database function for thread-safe increment.
 *
 * @param supabase - Supabase client
 * @param userId - User ID
 * @param tokenCount - Tokens consumed
 * @param cost - Cost in USD
 */
export async function incrementQuota(
  supabase: SupabaseClient,
  userId: string,
  tokenCount: number,
  cost: number
): Promise<void> {
  // Record in database (atomic increment)
  const { error } = await supabase.rpc('increment_user_quota', {
    p_user_id: userId,
    p_tokens: tokenCount,
    p_cost: cost,
  });

  if (error) {
    console.error('Failed to increment quota:', error);
    // Don't throw - operation already succeeded, logging failure is non-critical
  }
}
