/**
 * Keyword Analysis Component
 * Phase 6: Scoring & Optimization
 *
 * Show matched/missing keywords
 */

'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface KeywordAnalysisProps {
  matched: string[]
  missing: string[]
  coverage: number
}

export function KeywordAnalysis({ matched, missing, coverage }: KeywordAnalysisProps) {
  return (
    <Card className="p-6 space-y-4">
      <div>
        <h3 className="font-semibold text-lg">Keyword Match</h3>
        <p className="text-sm text-muted-foreground">
          Coverage: {Math.round(coverage * 100)}% ({matched.length}/
          {matched.length + missing.length})
        </p>
      </div>

      {/* Matched Keywords */}
      {matched.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2">Matched ({matched.length})</h4>
          <div className="flex flex-wrap gap-2">
            {matched.map((kw) => (
              <Badge key={kw} variant="secondary">
                {kw}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Missing Keywords */}
      {missing.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2">Missing ({missing.length})</h4>
          <div className="flex flex-wrap gap-2">
            {missing.map((kw) => (
              <Badge key={kw} variant="destructive">
                {kw}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}
