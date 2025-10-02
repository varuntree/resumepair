/**
 * AI Error Boundary
 *
 * React Error Boundary for graceful AI feature failures.
 * Shows fallback UI when AI operations fail.
 *
 * @module components/ai/AIErrorBoundary
 */

'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

/**
 * Component props
 */
interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Component state
 */
interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * AI Error Boundary Component
 *
 * Catches errors in AI components and shows fallback UI.
 * User can try again or continue using non-AI features.
 */
export class AIErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('AI Error Boundary caught error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              AI Feature Unavailable
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              We encountered an error with the AI service. You can continue using other features while we resolve this.
            </p>
            {this.state.error && (
              <details className="text-xs">
                <summary className="cursor-pointer text-muted-foreground">
                  Technical details
                </summary>
                <pre className="mt-2 p-2 bg-muted rounded overflow-auto">
                  {this.state.error.message}
                </pre>
              </details>
            )}
            <Button onClick={this.handleReset} variant="outline" size="sm">
              Try Again
            </Button>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

/**
 * Higher-order component wrapper for easier use
 *
 * @param Component - Component to wrap with error boundary
 * @param fallback - Optional fallback UI
 * @returns Wrapped component with error boundary
 *
 * @example
 * ```typescript
 * export const AIFeature = withAIErrorBoundary(MyAIComponent);
 * ```
 */
export function withAIErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ReactNode
) {
  return function WrappedComponent(props: P) {
    return (
      <AIErrorBoundary fallback={fallback}>
        <Component {...props} />
      </AIErrorBoundary>
    );
  };
}
