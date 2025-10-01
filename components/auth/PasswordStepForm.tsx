'use client'

import { useState, type FormEvent } from 'react'
import { Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface PasswordStepFormProps {
  email: string
  onSubmit: (password: string) => Promise<void>
  onBack: () => void
  isLoading: boolean
  error?: string | null
}

/**
 * PasswordStepForm Component
 *
 * Second step of two-step sign-in flow.
 * User enters password for the email they provided in step 1.
 */
export function PasswordStepForm({
  email,
  onSubmit,
  onBack,
  isLoading,
  error,
}: PasswordStepFormProps) {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLocalError(null)

    if (!password) {
      setLocalError('Password is required')
      return
    }

    await onSubmit(password)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Email Display (read-only) */}
      <div className="space-y-2">
        <Label htmlFor="email-display">Email</Label>
        <div className="flex items-center gap-2">
          <Input
            id="email-display"
            type="email"
            value={email}
            disabled
            className="flex-1"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onBack}
            disabled={isLoading}
            className="flex-shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Not you? Click the arrow to change email
        </p>
      </div>

      {/* Password Field */}
      <div className="space-y-2">
        <Label htmlFor="password-step">Password</Label>
        <div className="relative">
          <Input
            id="password-step"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            autoFocus
            aria-invalid={!!(localError || error)}
            aria-describedby={localError || error ? 'password-error' : undefined}
            className={localError || error ? 'border-destructive pr-10' : 'pr-10'}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            disabled={isLoading}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
        {localError && (
          <p id="password-error" role="alert" className="text-sm text-destructive">{localError}</p>
        )}
      </div>

      {/* Server Error Display */}
      {error && (
        <div id="password-error" role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Sign In Button */}
      <Button type="submit" disabled={isLoading} className="w-full" size="lg">
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Signing in...
          </>
        ) : (
          'Sign In'
        )}
      </Button>
    </form>
  )
}
