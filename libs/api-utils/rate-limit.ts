/**
 * Rate Limiting Utilities
 *
 * In-memory rate limiting for authentication endpoints.
 * Prevents brute-force attacks and user enumeration.
 *
 * IMPORTANT: This is a simple in-memory implementation suitable for single-instance deployments.
 * For production multi-instance deployments, consider Redis-based rate limiting.
 */

interface RateLimitEntry {
  attempts: number[]
  blockedUntil?: number
}

// Store rate limit attempts by key (email or IP)
const rateLimitStore = new Map<string, RateLimitEntry>()

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  const fiveMinutesAgo = now - 5 * 60 * 1000

  for (const [key, entry] of Array.from(rateLimitStore.entries())) {
    // Remove entries with no recent attempts
    const recentAttempts = entry.attempts.filter(t => t > fiveMinutesAgo)
    if (recentAttempts.length === 0 && (!entry.blockedUntil || entry.blockedUntil < now)) {
      rateLimitStore.delete(key)
    }
  }
}, 5 * 60 * 1000)

/**
 * Email check rate limiter
 * Limits: 3 requests per minute per email
 * Block duration: 60 seconds after limit exceeded
 */
export function checkEmailRateLimit(email: string): {
  allowed: boolean
  retryAfter?: number
} {
  const key = `email:${email.toLowerCase()}`
  const now = Date.now()
  const entry = rateLimitStore.get(key) || { attempts: [] }

  // Check if blocked
  if (entry.blockedUntil && entry.blockedUntil > now) {
    return {
      allowed: false,
      retryAfter: Math.ceil((entry.blockedUntil - now) / 1000)
    }
  }

  // Remove attempts older than 1 minute
  const oneMinuteAgo = now - 60 * 1000
  entry.attempts = entry.attempts.filter(t => t > oneMinuteAgo)

  // Check limit (3 per minute)
  if (entry.attempts.length >= 3) {
    entry.blockedUntil = now + 60 * 1000 // Block for 60 seconds
    rateLimitStore.set(key, entry)
    return {
      allowed: false,
      retryAfter: 60
    }
  }

  // Add current attempt
  entry.attempts.push(now)
  rateLimitStore.set(key, entry)

  return { allowed: true }
}

/**
 * IP-based rate limiter
 * Limits: 10 requests per minute per IP
 * Block duration: 60 seconds after limit exceeded
 */
export function checkIPRateLimit(ip: string): {
  allowed: boolean
  retryAfter?: number
} {
  const key = `ip:${ip}`
  const now = Date.now()
  const entry = rateLimitStore.get(key) || { attempts: [] }

  // Check if blocked
  if (entry.blockedUntil && entry.blockedUntil > now) {
    return {
      allowed: false,
      retryAfter: Math.ceil((entry.blockedUntil - now) / 1000)
    }
  }

  // Remove attempts older than 1 minute
  const oneMinuteAgo = now - 60 * 1000
  entry.attempts = entry.attempts.filter(t => t > oneMinuteAgo)

  // Check limit (10 per minute)
  if (entry.attempts.length >= 10) {
    entry.blockedUntil = now + 60 * 1000 // Block for 60 seconds
    rateLimitStore.set(key, entry)
    return {
      allowed: false,
      retryAfter: 60
    }
  }

  // Add current attempt
  entry.attempts.push(now)
  rateLimitStore.set(key, entry)

  return { allowed: true }
}

/**
 * Get client IP from request
 * Handles proxy headers (X-Forwarded-For, X-Real-IP)
 */
export function getClientIP(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }

  // Fallback (won't work in production behind proxies)
  return 'unknown'
}

/**
 * Combined rate limit check (email + IP)
 * Returns first limit that fails
 */
export function checkCombinedRateLimit(
  email: string,
  ip: string
): {
  allowed: boolean
  retryAfter?: number
  limitType?: 'email' | 'ip'
} {
  // Check IP limit first (broader protection)
  const ipLimit = checkIPRateLimit(ip)
  if (!ipLimit.allowed) {
    return {
      allowed: false,
      retryAfter: ipLimit.retryAfter,
      limitType: 'ip'
    }
  }

  // Check email-specific limit
  const emailLimit = checkEmailRateLimit(email)
  if (!emailLimit.allowed) {
    return {
      allowed: false,
      retryAfter: emailLimit.retryAfter,
      limitType: 'email'
    }
  }

  return { allowed: true }
}
