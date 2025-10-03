/**
 * Suggestion List Component
 * Phase 6: Scoring & Optimization
 *
 * Display 3-5 actionable suggestions
 */

'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Suggestion } from '@/types/scoring'

interface SuggestionListProps {
  suggestions: Suggestion[]
  onApply?: (suggestionId: string) => void
}

export function SuggestionList({ suggestions, onApply }: SuggestionListProps) {
  if (suggestions.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground text-center">
          Great job! No critical improvements needed.
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {suggestions.map((suggestion) => (
        <Card key={suggestion.id} className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              {/* Title + Priority Badge */}
              <div className="flex items-center gap-2">
                <h4 className="font-medium">{suggestion.title}</h4>
                <Badge variant={getPriorityVariant(suggestion.priority)}>
                  {suggestion.priority}
                </Badge>
              </div>

              {/* Description */}
              <p className="text-sm text-muted-foreground">{suggestion.description}</p>

              {/* Impact + Effort */}
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span>Impact: +{suggestion.impact} pts</span>
                {suggestion.effort && <span>Effort: {suggestion.effort}</span>}
              </div>

              {/* Examples (if available) */}
              {suggestion.examples && suggestion.examples.length > 0 && (
                <div className="mt-2 space-y-1">
                  <p className="text-xs font-medium">Examples:</p>
                  <ul className="text-xs text-muted-foreground list-disc list-inside">
                    {suggestion.examples.map((ex, i) => (
                      <li key={i}>{ex}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Action Button (Quick-Fix Only) */}
            {suggestion.type === 'quick_fix' && onApply && (
              <Button size="sm" onClick={() => onApply(suggestion.id)} className="shrink-0">
                Apply
              </Button>
            )}
          </div>
        </Card>
      ))}
    </div>
  )
}

function getPriorityVariant(priority: string): 'default' | 'destructive' | 'secondary' {
  switch (priority) {
    case 'high':
      return 'destructive'
    case 'medium':
      return 'default'
    case 'low':
      return 'secondary'
    default:
      return 'default'
  }
}
