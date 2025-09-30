'use client'

import { useState } from 'react'
import { createClient } from '@/libs/supabase/client'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

export function SignInButton() {
  const [isLoading, setIsLoading] = useState(false)

  const handleSignIn = async () => {
    setIsLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        console.error('Sign in error:', error)
        alert('Failed to sign in. Please try again.')
        setIsLoading(false)
      }
      // Don't set loading false on success - page will redirect
    } catch (error) {
      console.error('Sign in error:', error)
      alert('Failed to sign in. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handleSignIn}
      disabled={isLoading}
      variant="default"
      size="lg"
      className="w-full"
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Signing in...
        </>
      ) : (
        'Sign in with Google'
      )}
    </Button>
  )
}