'use client'
/* eslint-disable no-unused-vars */

import { useState, type FormEvent } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface EmailStepFormProps {
  onSubmit: (value: string) => Promise<void>
  isLoading: boolean
  error?: string | null
}

/**
 * EmailStepForm Component
 *
 * First step of two-step sign-in flow.
 * User enters email, we check if they exist and which providers they have.
 */
export function EmailStepForm({
  onSubmit,
  isLoading,
  error,
}: EmailStepFormProps) {
  const [email, setEmail] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLocalError(null)

    // Basic email validation
    if (!email) {
      setLocalError('Email is required')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setLocalError('Please enter a valid email address')
      return
    }

    await onSubmit(email)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Email Field */}
      <div className="space-y-2">
        <Label htmlFor="email-step">Email</Label>
        <Input
          id="email-step"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
          autoFocus
          aria-invalid={!!(localError || error)}
          aria-describedby={localError || error ? 'email-error' : undefined}
          className={localError || error ? 'border-destructive' : ''}
        />
        {localError && (
          <p id="email-error" role="alert" className="text-sm text-destructive">{localError}</p>
        )}
      </div>

      {/* Server Error Display */}
      {error && (
        <div id="email-error" role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Continue Button */}
      <Button type="submit" disabled={isLoading} className="w-full" size="lg">
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Checking...
          </>
        ) : (
          'Continue'
        )}
      </Button>
    </form>
  )
}
