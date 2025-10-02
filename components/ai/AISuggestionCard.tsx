/**
 * AI Suggestion Card Component
 *
 * Displays individual AI enhancement suggestion with accept/reject actions.
 *
 * @module components/ai/AISuggestionCard
 */

'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, ArrowRight } from 'lucide-react';
import { useEnhancementStore, type EnhancementSuggestion } from '@/stores/enhancementStore';

/**
 * AI suggestion card props
 */
interface AISuggestionCardProps {
  suggestion: EnhancementSuggestion;
}

/**
 * Type labels for suggestion types
 */
const TYPE_LABELS = {
  bullet: 'Bullet Point',
  summary: 'Summary',
  keywords: 'Keywords',
};

/**
 * AI suggestion card component
 *
 * Shows original vs enhanced content with apply/reject actions.
 */
export function AISuggestionCard({ suggestion }: AISuggestionCardProps) {
  const { applySuggestion, rejectSuggestion } = useEnhancementStore();

  return (
    <Card className={suggestion.applied ? 'opacity-50' : ''}>
      <CardContent className="pt-6 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Badge variant="outline">{TYPE_LABELS[suggestion.type]}</Badge>
          {suggestion.applied && <Badge className="bg-lime-500">Applied</Badge>}
        </div>

        {/* Original */}
        <div className="text-sm text-muted-foreground">
          <div className="font-medium mb-1">Original:</div>
          <div className="bg-muted p-2 rounded">{suggestion.original}</div>
        </div>

        {/* Arrow */}
        <div className="flex justify-center">
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </div>

        {/* Enhanced */}
        <div className="text-sm">
          <div className="font-medium mb-1">Enhanced:</div>
          <div className="bg-lime-50 p-2 rounded border border-lime-200">
            {Array.isArray(suggestion.enhanced)
              ? suggestion.enhanced.join(', ')
              : suggestion.enhanced}
          </div>
        </div>

        {/* Changes */}
        {suggestion.changes.length > 0 && (
          <div className="text-xs text-muted-foreground">
            <div className="font-medium mb-1">Improvements:</div>
            <ul className="list-disc list-inside space-y-1">
              {suggestion.changes.map((change, i) => (
                <li key={i}>{change}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        {!suggestion.applied && (
          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              className="flex-1 bg-lime-500 hover:bg-lime-600"
              onClick={() => applySuggestion(suggestion.id)}
            >
              <Check className="h-4 w-4 mr-1" />
              Apply
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => rejectSuggestion(suggestion.id)}
            >
              <X className="h-4 w-4 mr-1" />
              Reject
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
