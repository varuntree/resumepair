/**
 * AI Operations Repository
 *
 * Pure functions for tracking AI API usage with dependency injection.
 * Follows repository pattern for server-side database access.
 *
 * @module libs/repositories/aiOperations
 */

import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * AI operation record in database
 */
export interface AIOperation {
  id: string;
  user_id: string;
  operation_type: 'import' | 'generate' | 'enhance' | 'match';
  input_tokens: number | null;
  output_tokens: number | null;
  cost: number | null;
  duration_ms: number | null;
  success: boolean;
  error_message: string | null;
  created_at: string;
}

/**
 * Input for creating AI operation record
 */
export interface CreateAIOperationInput {
  user_id: string;
  operation_type: 'import' | 'generate' | 'enhance' | 'match';
  input_tokens?: number;
  output_tokens?: number;
  cost?: number;
  duration_ms?: number;
  success: boolean;
  error_message?: string;
}

/**
 * Create new AI operation record
 *
 * @param supabase - Supabase client (server-side)
 * @param operation - Operation data to insert
 * @returns Created operation record
 */
export async function createOperation(
  supabase: SupabaseClient,
  operation: CreateAIOperationInput
): Promise<AIOperation> {
  const { data, error } = await supabase
    .from('ai_operations')
    .insert({
      user_id: operation.user_id,
      operation_type: operation.operation_type,
      input_tokens: operation.input_tokens || null,
      output_tokens: operation.output_tokens || null,
      cost: operation.cost || null,
      duration_ms: operation.duration_ms || null,
      success: operation.success,
      error_message: operation.error_message || null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create AI operation: ${error.message}`);
  }

  return data;
}

/**
 * Get AI operations for a user
 *
 * @param supabase - Supabase client (server-side)
 * @param userId - User ID
 * @param limit - Maximum number of records to return (default: 50)
 * @returns Array of AI operations
 */
export async function getUserOperations(
  supabase: SupabaseClient,
  userId: string,
  limit: number = 50
): Promise<AIOperation[]> {
  const { data, error } = await supabase
    .from('ai_operations')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch AI operations: ${error.message}`);
  }

  return data || [];
}

/**
 * Get user's AI usage statistics
 *
 * @param supabase - Supabase client (server-side)
 * @param userId - User ID
 * @param sinceDate - Start date for statistics (default: 24 hours ago)
 * @returns Usage statistics
 */
export async function getUserUsageStats(
  supabase: SupabaseClient,
  userId: string,
  sinceDate?: Date
): Promise<{
  totalOperations: number;
  totalTokens: number;
  totalCost: number;
  successRate: number;
}> {
  const since = sinceDate || new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

  const { data, error } = await supabase
    .from('ai_operations')
    .select('input_tokens, output_tokens, cost, success')
    .eq('user_id', userId)
    .gte('created_at', since.toISOString());

  if (error) {
    throw new Error(`Failed to fetch usage stats: ${error.message}`);
  }

  if (!data || data.length === 0) {
    return {
      totalOperations: 0,
      totalTokens: 0,
      totalCost: 0,
      successRate: 0,
    };
  }

  const totalOperations = data.length;
  const totalTokens = data.reduce(
    (sum, op) => sum + (op.input_tokens || 0) + (op.output_tokens || 0),
    0
  );
  const totalCost = data.reduce((sum, op) => sum + (op.cost || 0), 0);
  const successCount = data.filter((op) => op.success).length;
  const successRate = successCount / totalOperations;

  return {
    totalOperations,
    totalTokens,
    totalCost,
    successRate,
  };
}

/**
 * Check if user has exceeded daily quota
 *
 * @param supabase - Supabase client (server-side)
 * @param userId - User ID
 * @param dailyLimit - Daily operation limit (default: 100)
 * @returns True if user has exceeded quota
 */
export async function hasExceededQuota(
  supabase: SupabaseClient,
  userId: string,
  dailyLimit: number = 100
): Promise<boolean> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { count, error } = await supabase
    .from('ai_operations')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', todayStart.toISOString());

  if (error) {
    throw new Error(`Failed to check quota: ${error.message}`);
  }

  return (count || 0) >= dailyLimit;
}

/**
 * Calculate cost based on token usage
 *
 * Uses Gemini 2.0 Flash pricing:
 * - Input: $0.075 per 1M tokens
 * - Output: $0.030 per 1M tokens
 *
 * @param inputTokens - Number of input tokens
 * @param outputTokens - Number of output tokens
 * @returns Cost in USD
 */
export function calculateCost(inputTokens: number, outputTokens: number): number {
  const INPUT_COST_PER_MILLION = 0.075;
  const OUTPUT_COST_PER_MILLION = 0.03;

  const inputCost = (inputTokens / 1_000_000) * INPUT_COST_PER_MILLION;
  const outputCost = (outputTokens / 1_000_000) * OUTPUT_COST_PER_MILLION;

  return inputCost + outputCost;
}

/**
 * Track enhancement operation (Phase 4C)
 *
 * Logs bullet enhancement, summary generation, or keyword extraction.
 * If fromCache is true, cost is zero.
 *
 * @param supabase - Supabase client (server-side)
 * @param userId - User ID
 * @param enhancementType - Type of enhancement
 * @param inputTokens - Number of input tokens
 * @param outputTokens - Number of output tokens
 * @param fromCache - Whether response came from cache
 * @returns Created operation record
 */
export async function trackEnhancement(
  supabase: SupabaseClient,
  userId: string,
  enhancementType: 'bullet' | 'summary' | 'keywords',
  inputTokens: number,
  outputTokens: number,
  fromCache: boolean
): Promise<AIOperation> {
  const cost = fromCache ? 0 : calculateCost(inputTokens, outputTokens);

  return createOperation(supabase, {
    user_id: userId,
    operation_type: 'enhance',
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    cost,
    duration_ms: 0, // Not tracking duration for enhancements
    success: true,
  });
}

/**
 * User quota information (Phase 4D)
 */
export interface UserQuota {
  user_id: string;
  operation_count: number;
  token_count: number;
  total_cost: number;
  period_start: string;
  period_end: string;
  remaining: number;
  resetIn: number; // Seconds
}

/**
 * Get user's current quota status (Phase 4D)
 *
 * Checks quota and resets if period expired.
 *
 * @param supabase - Supabase client (server-side)
 * @param userId - User ID
 * @returns Quota information
 */
export async function getUserQuota(
  supabase: SupabaseClient,
  userId: string
): Promise<UserQuota> {
  // Reset if expired
  await supabase.rpc('check_quota_reset', { p_user_id: userId });

  const { data, error } = await supabase
    .from('user_ai_quotas')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code === 'PGRST116') {
    // Not found - create initial quota
    const newQuota = {
      user_id: userId,
      operation_count: 0,
      token_count: 0,
      total_cost: 0,
      period_start: new Date().toISOString(),
      period_end: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };

    await supabase.from('user_ai_quotas').insert(newQuota);

    return {
      ...newQuota,
      remaining: 100,
      resetIn: 24 * 60 * 60,
    };
  }

  if (error) throw error;

  const periodEnd = new Date(data.period_end).getTime();
  const now = Date.now();

  return {
    user_id: data.user_id,
    operation_count: data.operation_count,
    token_count: data.token_count,
    total_cost: data.total_cost,
    period_start: data.period_start,
    period_end: data.period_end,
    remaining: 100 - data.operation_count,
    resetIn: Math.ceil((periodEnd - now) / 1000),
  };
}

/**
 * Increment user's quota after successful AI operation (Phase 4.5)
 *
 * Uses atomic database function for thread-safe increment.
 *
 * @param supabase - Supabase client (server-side)
 * @param userId - User ID
 * @param tokenCount - Tokens consumed
 * @param cost - Cost in USD
 */
export async function incrementUserQuota(
  supabase: SupabaseClient,
  userId: string,
  tokenCount: number,
  cost: number
): Promise<void> {
  const { error } = await supabase.rpc('increment_user_quota', {
    p_user_id: userId,
    p_tokens: tokenCount,
    p_cost: cost,
  });

  if (error) {
    console.error('Failed to increment user quota:', error);
    // Don't throw - operation already succeeded, logging failure is non-critical
  }
}
