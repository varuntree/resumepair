/**
 * Retry Utility with Exponential Backoff and Jitter
 *
 * Provides reusable retry logic for transient failures.
 * Pattern extracted from Phase 5 export queue implementation.
 *
 * @module libs/utils/retry
 */

/**
 * Configuration for retry behavior
 */
export interface RetryConfig {
  /**
   * Maximum number of retry attempts
   * @default 3
   */
  maxRetries?: number

  /**
   * Base delay in milliseconds for first retry
   * @default 60000 (1 minute)
   */
  baseDelay?: number

  /**
   * Maximum delay in milliseconds (prevents runaway backoff)
   * @default 3600000 (60 minutes)
   */
  maxDelay?: number

  /**
   * Maximum jitter in milliseconds (randomization to prevent thundering herd)
   * @default 5000 (5 seconds)
   */
  maxJitter?: number

  /**
   * Function to determine if an error should trigger a retry
   * @default () => true (retry all errors)
   */
  shouldRetry?: (error: Error) => boolean

  /**
   * Callback invoked before each retry attempt
   * @param attemptNumber - The attempt number (1-based)
   * @param delay - The calculated delay in milliseconds
   */
  onRetry?: (attemptNumber: number, delay: number, error: Error) => void
}

/**
 * Calculate retry delay with exponential backoff and jitter
 *
 * Formula: min(2^(attempt-1) * baseDelay + jitter, maxDelay)
 *
 * Example progression (baseDelay=60000, maxDelay=3600000):
 * - Attempt 1: 1 minute
 * - Attempt 2: 2 minutes
 * - Attempt 3: 4 minutes
 * - Attempt 4: 8 minutes
 * - Attempt 5: 16 minutes
 * - Attempt 6: 32 minutes
 * - Attempt 7+: 60 minutes (capped)
 *
 * @param attemptNumber - The retry attempt number (1-based)
 * @param config - Retry configuration
 * @returns Delay in milliseconds
 */
export function calculateRetryDelay(
  attemptNumber: number,
  config: RetryConfig = {}
): number {
  const {
    baseDelay = 60000, // 1 minute
    maxDelay = 3600000, // 60 minutes
    maxJitter = 5000, // 5 seconds
  } = config

  // Add random jitter to prevent thundering herd
  const jitter = Math.random() * maxJitter

  // Exponential backoff: 2^(n-1) * baseDelay
  const exponentialDelay = Math.pow(2, attemptNumber - 1) * baseDelay

  // Apply jitter and cap at maxDelay
  return Math.min(exponentialDelay + jitter, maxDelay)
}

/**
 * Sleep for a specified duration
 *
 * @param ms - Duration in milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Default retry predicate - retries all errors
 */
const defaultShouldRetry = (_error: Error): boolean => true

/**
 * Execute a function with automatic retry on failure
 *
 * @param fn - Async function to execute
 * @param config - Retry configuration
 * @returns Promise resolving to function result
 * @throws Error if all retry attempts are exhausted
 *
 * @example
 * ```typescript
 * // Simple usage
 * const result = await withRetry(
 *   async () => fetchDataFromAPI(),
 *   { maxRetries: 3 }
 * )
 *
 * // Advanced usage with custom config
 * const result = await withRetry(
 *   async () => processExport(jobId),
 *   {
 *     maxRetries: 5,
 *     baseDelay: 30000, // 30 seconds
 *     maxDelay: 600000, // 10 minutes
 *     shouldRetry: (error) => {
 *       // Don't retry client errors (4xx)
 *       if (error.message.includes('400')) return false
 *       return true
 *     },
 *     onRetry: (attempt, delay, error) => {
 *       console.log(`Retry attempt ${attempt} after ${delay}ms. Error: ${error.message}`)
 *     }
 *   }
 * )
 * ```
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = {}
): Promise<T> {
  const {
    maxRetries = 3,
    shouldRetry = defaultShouldRetry,
    onRetry,
  } = config

  let lastError: Error

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Attempt the operation
      return await fn()
    } catch (error) {
      lastError = error as Error

      // Check if we should retry
      const isLastAttempt = attempt === maxRetries
      const shouldRetryError = shouldRetry(lastError)

      if (isLastAttempt || !shouldRetryError) {
        // No more retries or error not retryable
        throw lastError
      }

      // Calculate delay for next retry
      const delay = calculateRetryDelay(attempt + 1, config)

      // Invoke onRetry callback if provided
      if (onRetry) {
        onRetry(attempt + 1, delay, lastError)
      }

      // Wait before next attempt
      await sleep(delay)
    }
  }

  // Should never reach here, but TypeScript needs it
  throw lastError!
}

/**
 * Retry configuration presets for common scenarios
 */
export const RetryPresets = {
  /**
   * Fast retry for quick operations (API calls, database queries)
   * - Max 3 retries
   * - 1s → 2s → 4s
   */
  FAST: {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    maxJitter: 500,
  } as RetryConfig,

  /**
   * Standard retry for normal operations (export jobs, file uploads)
   * - Max 3 retries
   * - 1min → 2min → 4min
   */
  STANDARD: {
    maxRetries: 3,
    baseDelay: 60000,
    maxDelay: 600000,
    maxJitter: 5000,
  } as RetryConfig,

  /**
   * Patient retry for heavy operations (AI processing, batch jobs)
   * - Max 5 retries
   * - 1min → 2min → 4min → 8min → 16min
   */
  PATIENT: {
    maxRetries: 5,
    baseDelay: 60000,
    maxDelay: 3600000,
    maxJitter: 10000,
  } as RetryConfig,

  /**
   * Aggressive retry with long backoff (scheduled jobs, cleanup tasks)
   * - Max 7 retries
   * - 1min → 2min → 4min → 8min → 16min → 32min → 60min
   */
  AGGRESSIVE: {
    maxRetries: 7,
    baseDelay: 60000,
    maxDelay: 3600000,
    maxJitter: 5000,
  } as RetryConfig,
} as const

/**
 * Common retry predicates
 */
export const RetryPredicates = {
  /**
   * Retry all errors
   */
  ALL: (_error: Error): boolean => true,

  /**
   * Never retry
   */
  NEVER: (_error: Error): boolean => false,

  /**
   * Retry network errors only
   */
  NETWORK_ONLY: (error: Error): boolean => {
    const message = error.message.toLowerCase()
    return (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('econnrefused') ||
      message.includes('enotfound')
    )
  },

  /**
   * Don't retry client errors (4xx), retry server errors (5xx)
   */
  NO_CLIENT_ERRORS: (error: Error): boolean => {
    const message = error.message.toLowerCase()
    // Don't retry 4xx errors
    if (
      message.includes('400') ||
      message.includes('401') ||
      message.includes('403') ||
      message.includes('404') ||
      message.includes('validation')
    ) {
      return false
    }
    return true
  },
} as const
