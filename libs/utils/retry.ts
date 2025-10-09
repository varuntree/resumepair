export interface RetryOptions {
  retries: number
  minTimeout?: number
  maxTimeout?: number
  onRetry?: (error: unknown, attempt: number) => void
}

export async function retry<T>(fn: () => Promise<T>, options: RetryOptions): Promise<T> {
  const { retries, minTimeout = 500, maxTimeout = 2000, onRetry } = options

  if (retries <= 0) {
    throw new Error('Retry options must include at least one attempt')
  }

  let attempt = 0
  let lastError: unknown

  while (attempt < retries) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      attempt += 1
      if (attempt >= retries) break
      onRetry?.(error, attempt)
      const delay = Math.min(maxTimeout, minTimeout * Math.pow(2, attempt - 1))
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Retry operation failed')
}
