import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/libs/supabase/admin'
import { z } from 'zod'
import { checkCombinedRateLimit, getClientIP } from '@/libs/api-utils/rate-limit'

/**
 * Check Email Endpoint
 *
 * Checks if an email exists and which authentication providers are configured.
 * Used in two-step sign-in flow to provide specific error messages.
 *
 * Security Measures:
 * - Rate limiting: 3 requests/minute per email, 10/minute per IP
 * - Deliberate 200ms delay to prevent timing attacks
 * - Server-side only (uses Supabase service client)
 * - No PII logged
 *
 * WARNING: This endpoint enables user enumeration attacks. Rate limiting
 * and monitoring are critical. Consider adding CAPTCHA for production.
 */

const CheckEmailSchema = z.object({
  email: z.string().email('Invalid email address')
})

export const runtime = 'nodejs'

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Get client IP for rate limiting
    const clientIP = getClientIP(req)

    // Parse and validate request body
    const body = await req.json()
    const parseResult = CheckEmailSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid email address'
        },
        { status: 400 }
      )
    }

    const { email } = parseResult.data

    // Check rate limits (email + IP)
    const rateLimit = checkCombinedRateLimit(email, clientIP)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Too many requests. Please try again later.',
          retryAfter: rateLimit.retryAfter
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.retryAfter || 60)
          }
        }
      )
    }

    // Deliberate delay to prevent timing attacks
    // This ensures all requests take similar time regardless of result
    await new Promise(resolve => setTimeout(resolve, 200))

    // Create Supabase admin client with service role access
    const supabase = createAdminClient()

    // List all users (server-side only, not exposed to client)
    // Note: In production, you might want to use a more efficient query
    // like auth.admin.getUserByEmail() if available in your Supabase version
    const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers()

    if (usersError) {
      // Log error without PII (no email, just status and type)
      console.error('Check email endpoint - user lookup failed:', {
        status: usersError.status,
        code: 'code' in usersError ? usersError.code : 'unknown'
      })
      // Don't reveal internal errors to prevent information leakage
      return NextResponse.json(
        {
          success: false,
          error: 'Service temporarily unavailable'
        },
        { status: 503 }
      )
    }

    // Find user by email (case-insensitive)
    const normalizedEmail = email.toLowerCase()
    const user = usersData.users.find(
      u => u.email?.toLowerCase() === normalizedEmail
    )

    // User doesn't exist
    if (!user) {
      return NextResponse.json({
        success: true,
        data: {
          exists: false,
          providers: null
        }
      })
    }

    // User exists - check which providers they have
    const identities = user.identities || []
    const hasPassword = identities.some(i => i.provider === 'email')
    const hasGoogle = identities.some(i => i.provider === 'google')

    return NextResponse.json({
      success: true,
      data: {
        exists: true,
        providers: {
          password: hasPassword,
          google: hasGoogle
        }
      }
    })

  } catch (error) {
    // Log error without PII (no email or error message that might contain email)
    console.error('Check email endpoint - unexpected error:', {
      hasError: !!error,
      errorType: error instanceof Error ? error.constructor.name : typeof error
    })
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    )
  }
}
