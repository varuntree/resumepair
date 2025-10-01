'use client'

import { useState, type FormEvent } from 'react'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  emailPasswordSignInSchema,
  emailPasswordSignUpSchema,
  type EmailPasswordSignIn,
  type EmailPasswordSignUp,
} from '@/libs/validation/auth'

interface EmailPasswordFormProps {
  mode: 'signin' | 'signup'
  onSubmit: (data: EmailPasswordSignIn | EmailPasswordSignUp) => Promise<void>
  isLoading: boolean
  error?: string | null
}

/**
 * EmailPasswordForm Component
 *
 * Handles email/password authentication for both sign-in and sign-up modes.
 * Includes client-side validation, password visibility toggle, and error display.
 */
export function EmailPasswordForm({
  mode,
  onSubmit,
  isLoading,
  error,
}: EmailPasswordFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setValidationErrors({})

    try {
      // Validate based on mode
      const schema = mode === 'signin' ? emailPasswordSignInSchema : emailPasswordSignUpSchema

      const data = mode === 'signin'
        ? { email, password }
        : { email, password, confirmPassword }

      const validated = schema.parse(data)
      await onSubmit(validated)
    } catch (err: unknown) {
      // Handle Zod validation errors
      if (err && typeof err === 'object' && 'errors' in err) {
        const zodError = err as { errors: Array<{ path?: string[]; message: string }> }
        const errors: Record<string, string> = {}
        zodError.errors.forEach((error) => {
          if (error.path) {
            errors[error.path[0]] = error.message
          }
        })
        setValidationErrors(errors)
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Email Field */}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
          className={validationErrors.email ? 'border-destructive' : ''}
        />
        {validationErrors.email && (
          <p className="text-sm text-destructive">{validationErrors.email}</p>
        )}
      </div>

      {/* Password Field */}
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder={mode === 'signup' ? 'At least 8 characters' : 'Enter your password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            className={validationErrors.password ? 'border-destructive pr-10' : 'pr-10'}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            disabled={isLoading}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
        {validationErrors.password && (
          <p className="text-sm text-destructive">{validationErrors.password}</p>
        )}
      </div>

      {/* Confirm Password Field (Signup only) */}
      {mode === 'signup' && (
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
              className={validationErrors.confirmPassword ? 'border-destructive pr-10' : 'pr-10'}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={showConfirmPassword ? 'Hide password confirmation' : 'Show password confirmation'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              disabled={isLoading}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Eye className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>
          {validationErrors.confirmPassword && (
            <p className="text-sm text-destructive">{validationErrors.confirmPassword}</p>
          )}
        </div>
      )}

      {/* Server Error Display */}
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Submit Button */}
      <Button type="submit" disabled={isLoading} className="w-full" size="lg">
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            {mode === 'signin' ? 'Signing in...' : 'Creating account...'}
          </>
        ) : (
          mode === 'signin' ? 'Sign In' : 'Create Account'
        )}
      </Button>
    </form>
  )
}
