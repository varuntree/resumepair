'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/libs/supabase/client';
import { useState } from 'react';
import { EmailPasswordForm } from '@/components/auth/EmailPasswordForm';
import { EmailStepForm } from '@/components/auth/EmailStepForm';
import { PasswordStepForm } from '@/components/auth/PasswordStepForm';
import { AuthDivider } from '@/components/auth/AuthDivider';
import { GoogleIcon } from '@/components/auth/GoogleIcon';
import type { EmailPasswordSignIn, EmailPasswordSignUp } from '@/libs/validation/auth';
import { useRouter } from 'next/navigation';

interface EmailCheckResult {
  exists: boolean
  providers: {
    password: boolean
    google: boolean
  } | null
}

export default function SignInPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [step, setStep] = useState<'email' | 'password'>('email');
  const [email, setEmail] = useState('');
  const [, setEmailCheck] = useState<EmailCheckResult | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEmailCheck = async (emailInput: string) => {
    setIsCheckingEmail(true);
    setError(null);
    setEmail(emailInput);

    try {
      const response = await fetch('/api/v1/auth/check-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: emailInput }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error(result.error || 'Too many requests. Please try again later.');
        }
        throw new Error(result.error || 'Failed to verify email');
      }

      if (!result.success) {
        throw new Error(result.error || 'Failed to verify email');
      }

      const checkData = result.data as EmailCheckResult;
      setEmailCheck(checkData);

      // Handle different scenarios
      if (!checkData.exists) {
        // User doesn't exist - suggest signup
        setError(
          'No account found with this email. Please sign up to create an account.'
        );
        setIsCheckingEmail(false);
        return;
      }

      // Check which providers the user has
      if (checkData.providers?.google && !checkData.providers?.password) {
        // User only has Google - they must use Google to sign in
        setError(
          'This email is registered with Google. Please use "Continue with Google" to sign in.'
        );
        setIsCheckingEmail(false);
        return;
      }

      if (checkData.providers?.password) {
        // User has password - show password field
        setStep('password');
        setIsCheckingEmail(false);
        return;
      }

      // Edge case: user exists but has no providers (shouldn't happen)
      setError('Account configuration error. Please contact support.');
      setIsCheckingEmail(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to verify email';
      setError(message);
      setIsCheckingEmail(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        console.error('Error signing in:', error.message);
        setError('Failed to sign in with Google. Please try again.');
        setIsGoogleLoading(false);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      setError('An unexpected error occurred. Please try again.');
      setIsGoogleLoading(false);
    }
  };

  const handlePasswordSubmit = async (password: string) => {
    // This is called when user submits password in sign-in flow (step 2)
    setIsEmailLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Show specific error for invalid credentials
        if (error.message.includes('Invalid login credentials')) {
          throw new Error(
            'Invalid password. Please try again or use "Back" to change your email.'
          );
        }
        throw new Error(error.message);
      }

      router.push('/dashboard');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Authentication failed. Please try again.';
      setError(message);
    } finally {
      setIsEmailLoading(false);
    }
  };

  const handleEmailPasswordSubmit = async (
    data: EmailPasswordSignIn | EmailPasswordSignUp
  ) => {
    // This is called for sign-up flow (single step)
    setIsEmailLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // SIGN UP FLOW - WITH DUPLICATE PREVENTION
      const { data: signupData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });

      if (error) {
        // Specific error for duplicate email
        if (
          error.message.includes('already registered') ||
          error.message.includes('already exists') ||
          error.message.includes('User already registered')
        ) {
          throw new Error(
            'An account with this email already exists. If you signed up with Google, please use "Continue with Google" to sign in.'
          );
        }
        throw new Error(error.message);
      }

      if (!signupData?.session) {
        throw new Error('Account created, but no session was returned. Please try signing in.');
      }

      router.push('/dashboard');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Authentication failed. Please try again.';
      setError(message);
    } finally {
      setIsEmailLoading(false);
    }
  };

  const handleModeToggle = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    setStep('email');
    setEmail('');
    setEmailCheck(null);
    setError(null);
  };

  const handleBackToEmail = () => {
    setStep('email');
    setEmail('');
    setEmailCheck(null);
    setError(null);
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">
            {mode === 'signin'
              ? (step === 'email' ? 'Welcome Back' : 'Enter Password')
              : 'Create Account'}
          </CardTitle>
          <CardDescription>
            {mode === 'signin'
              ? (step === 'email'
                  ? 'Sign in to access your resumes and cover letters'
                  : `Signing in as ${email}`)
              : 'Get started with your professional resume'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* SIGN IN MODE */}
          {mode === 'signin' && (
            <>
              {step === 'email' ? (
                <>
                  {/* Step 1: Email input */}
                  <EmailStepForm
                    onSubmit={handleEmailCheck}
                    isLoading={isCheckingEmail}
                    error={error}
                  />

                  {/* Divider */}
                  <AuthDivider />

                  {/* Google Sign-in Button */}
                  <Button
                    onClick={handleGoogleSignIn}
                    disabled={isGoogleLoading || isCheckingEmail}
                    variant="outline"
                    className="w-full"
                    size="lg"
                  >
                    {isGoogleLoading ? (
                      <span className="flex items-center gap-2">
                        <svg
                          className="animate-spin h-5 w-5"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Signing in...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <GoogleIcon />
                        Continue with Google
                      </span>
                    )}
                  </Button>
                </>
              ) : (
                <>
                  {/* Step 2: Password input */}
                  <PasswordStepForm
                    email={email}
                    onSubmit={handlePasswordSubmit}
                    onBack={handleBackToEmail}
                    isLoading={isEmailLoading}
                    error={error}
                  />
                </>
              )}
            </>
          )}

          {/* SIGN UP MODE */}
          {mode === 'signup' && (
            <>
              {/* Google Sign-in Button */}
              <Button
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading || isEmailLoading}
                variant="outline"
                className="w-full"
                size="lg"
              >
                {isGoogleLoading ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="animate-spin h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <GoogleIcon />
                    Continue with Google
                  </span>
                )}
              </Button>

              {/* Divider */}
              <AuthDivider />

              {/* Email/Password Sign-up Form */}
              <EmailPasswordForm
                mode="signup"
                onSubmit={handleEmailPasswordSubmit}
                isLoading={isEmailLoading}
                error={error}
              />
            </>
          )}

          {/* Toggle Mode */}
          <div className="text-center text-sm">
            {mode === 'signin' ? (
              <>
                Don&apos;t have an account?{' '}
                <button
                  onClick={handleModeToggle}
                  className="text-lime hover:underline font-medium"
                  disabled={isGoogleLoading || isEmailLoading || isCheckingEmail}
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  onClick={handleModeToggle}
                  className="text-lime hover:underline font-medium"
                  disabled={isGoogleLoading || isEmailLoading}
                >
                  Sign in
                </button>
              </>
            )}
          </div>

          {/* Terms */}
          <p className="text-center text-xs text-muted-foreground">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
