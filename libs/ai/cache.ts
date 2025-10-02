/**
 * AI Response Caching Layer
 *
 * Content-addressed caching using SHA-256 for AI enhancement responses.
 * Reduces costs by 30-40% by avoiding duplicate AI calls.
 *
 * @module libs/ai/cache
 */

import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Cache entry from database
 */
export interface CacheEntry {
  cache_key: string;
  operation_type: string;
  input_hash: string;
  response: any;
  hit_count: number;
  created_at: string;
  expires_at: string;
}

/**
 * Cache TTL in milliseconds (1 hour)
 */
const CACHE_TTL_MS = 60 * 60 * 1000;

/**
 * Generate SHA-256 cache key from operation parameters
 * Uses Web Crypto API for Edge runtime compatibility
 *
 * @param operationType - Type of enhancement operation
 * @param content - Input content to be enhanced
 * @param context - Optional context object (job description, role, industry)
 * @returns SHA-256 hash as cache key
 */
export async function generateCacheKey(
  operationType: string,
  content: string,
  context?: Record<string, any>
): Promise<string> {
  const input = JSON.stringify({
    operationType,
    content,
    context: context || {},
  });

  // Use Web Crypto API (Edge runtime compatible)
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

  return hashHex;
}

/**
 * Get cached response if available and not expired
 *
 * @param supabase - Supabase client (server-side)
 * @param cacheKey - SHA-256 cache key
 * @returns Cached response or null if not found/expired
 */
export async function getCachedResponse(
  supabase: SupabaseClient,
  cacheKey: string
): Promise<any | null> {
  try {
    const { data, error } = await supabase
      .from('ai_cache')
      .select('response, hit_count, expires_at')
      .eq('cache_key', cacheKey)
      .gte('expires_at', new Date().toISOString())
      .single();

    if (error || !data) {
      return null;
    }

    // Increment hit count asynchronously (fire and forget)
    void supabase
      .from('ai_cache')
      .update({ hit_count: data.hit_count + 1 })
      .eq('cache_key', cacheKey)
      .then(() => {
        // Silent success
      });

    return data.response;
  } catch (error) {
    console.error('Cache lookup error:', error);
    return null; // Continue without cache on error
  }
}

/**
 * Set cached response with TTL
 *
 * @param supabase - Supabase client (server-side)
 * @param cacheKey - SHA-256 cache key
 * @param operationType - Type of operation (enhance_bullet, enhance_summary, extract_keywords)
 * @param inputHash - SHA-256 hash of input content
 * @param response - Response data to cache
 */
export async function setCachedResponse(
  supabase: SupabaseClient,
  cacheKey: string,
  operationType: string,
  inputHash: string,
  response: any
): Promise<void> {
  try {
    const expiresAt = new Date(Date.now() + CACHE_TTL_MS).toISOString();

    const { error } = await supabase.from('ai_cache').upsert(
      {
        cache_key: cacheKey,
        operation_type: operationType,
        input_hash: inputHash,
        response,
        expires_at: expiresAt,
      },
      {
        onConflict: 'cache_key',
      }
    );

    if (error) {
      console.error('Failed to set cache:', error);
      // Don't throw - cache failures should not break the request
    }
  } catch (error) {
    console.error('Cache write error:', error);
    // Continue without caching on error
  }
}

/**
 * Generate input hash for verification
 * Uses Web Crypto API for Edge runtime compatibility
 *
 * @param content - Input content
 * @returns SHA-256 hash of content
 */
export async function generateInputHash(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

  return hashHex;
}

/**
 * Clean up expired cache entries
 * Should be called periodically (e.g., via cron job)
 *
 * @param supabase - Supabase client (server-side)
 * @returns Number of deleted entries
 */
export async function cleanupExpiredCache(
  supabase: SupabaseClient
): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('ai_cache')
      .delete()
      .lt('expires_at', new Date().toISOString())
      .select();

    if (error) {
      throw new Error(`Failed to cleanup cache: ${error.message}`);
    }

    return data?.length || 0;
  } catch (error) {
    console.error('Cache cleanup error:', error);
    return 0;
  }
}
