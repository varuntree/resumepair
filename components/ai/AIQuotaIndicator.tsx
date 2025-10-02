/**
 * AI Quota Indicator
 *
 * Displays current AI quota usage with progress bar and reset time.
 * Shows warning when approaching limit.
 *
 * @module components/ai/AIQuotaIndicator
 */

'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Clock, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';

/**
 * Quota data from API
 */
interface QuotaData {
  operationCount: number;
  operationLimit: number;
  remainingOperations: number;
  totalCost: number;
  resetIn: number;
}

/**
 * AI Quota Indicator Component
 *
 * Fetches and displays user's current AI quota status.
 * Updates on mount and can be refreshed manually.
 */
export function AIQuotaIndicator() {
  const [quota, setQuota] = useState<QuotaData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchQuota();
  }, []);

  const fetchQuota = async () => {
    try {
      const response = await fetch('/api/v1/ai/quota');
      const result = await response.json();

      if (result.success) {
        setQuota(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch quota:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !quota) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-2 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const usagePercent = (quota.operationCount / quota.operationLimit) * 100;
  const isNearLimit = usagePercent > 80;

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <Card className={isNearLimit ? 'border-amber-500' : ''}>
      <CardContent className="pt-6 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className={`h-5 w-5 ${isNearLimit ? 'text-amber-500' : 'text-lime-500'}`} />
            <span className="font-semibold">AI Quota</span>
          </div>
          <Badge variant={isNearLimit ? 'destructive' : 'secondary'}>
            {quota.remainingOperations} left
          </Badge>
        </div>

        {/* Progress */}
        <div className="space-y-1">
          <Progress
            value={usagePercent}
            className={isNearLimit ? '[&>div]:bg-amber-500' : '[&>div]:bg-lime-500'}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{quota.operationCount} / {quota.operationLimit} operations</span>
            <span>${quota.totalCost.toFixed(4)}</span>
          </div>
        </div>

        {/* Reset time */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>Resets in {formatTime(quota.resetIn)}</span>
        </div>

        {/* Warning */}
        {isNearLimit && (
          <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
            ⚠️ You&apos;re approaching your daily limit. Operations will be blocked when limit is reached.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
