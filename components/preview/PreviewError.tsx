/**
 * Preview Error Boundary
 *
 * Catches and displays template rendering errors with retry functionality.
 *
 * @module components/preview/PreviewError
 */

'use client'

import * as React from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PreviewErrorProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface PreviewErrorState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

/**
 * Error boundary component for preview rendering
 * Catches React render errors and displays user-friendly fallback
 */
export class PreviewError extends React.Component<
  PreviewErrorProps,
  PreviewErrorState
> {
  constructor(props: PreviewErrorProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): PreviewErrorState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('Preview render error:', error, errorInfo)
    this.setState({ errorInfo })
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex flex-col items-center justify-center p-8 space-y-4 bg-gray-50 rounded-lg min-h-[400px]">
          <AlertTriangle className="w-16 h-16 text-amber-500" />
          <div className="text-center space-y-2">
            <h3 className="text-xl font-semibold text-gray-900">
              Preview Error
            </h3>
            <p className="text-sm text-gray-600 max-w-md">
              We couldn&apos;t render the preview. Your data is safe.
            </p>
          </div>

          {/* Show error details in development */}
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="w-full max-w-2xl">
              <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                Error details
              </summary>
              <pre className="mt-2 p-4 bg-red-50 text-red-900 text-xs rounded overflow-auto max-h-48">
                {this.state.error.message}
                {'\n\n'}
                {this.state.error.stack}
                {this.state.errorInfo?.componentStack && (
                  <>
                    {'\n\n'}
                    {this.state.errorInfo.componentStack}
                  </>
                )}
              </pre>
            </details>
          )}

          <Button onClick={this.handleReset} variant="default">
            Try Again
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}
