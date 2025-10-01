import { z } from 'zod'

/**
 * Email/password sign-in validation schema
 * Used when user signs in with existing credentials
 */
export const emailPasswordSignInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

/**
 * Email/password sign-up validation schema
 * Enforces password strength requirements and confirmation matching
 */
export const emailPasswordSignUpSchema = z
  .object({
    email: z.string().email('Invalid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

/**
 * Inferred TypeScript types from Zod schemas
 */
export type EmailPasswordSignIn = z.infer<typeof emailPasswordSignInSchema>
export type EmailPasswordSignUp = z.infer<typeof emailPasswordSignUpSchema>
