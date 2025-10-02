/**
 * Enhancement Panel Component
 *
 * Displays AI enhancement suggestions in a side panel.
 * Shows suggestions with accept/reject actions.
 *
 * @module components/enhance/EnhancementPanel
 */

'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useEnhancementStore } from '@/stores/enhancementStore';
import { AISuggestionCard } from '@/components/ai/AISuggestionCard';
import { Sparkles, X } from 'lucide-react';

/**
 * Enhancement panel props
 */
interface EnhancementPanelProps {
  className?: string;
}

/**
 * Enhancement panel component
 *
 * Displays AI suggestions in a side panel with accept/reject actions.
 */
export function EnhancementPanel({ className }: EnhancementPanelProps) {
  const { suggestions, clearSuggestions } = useEnhancementStore();

  if (suggestions.length === 0) {
    return (
      <Card className={`border-2 border-dashed ${className || ''}`}>
        <CardContent className="pt-6 text-center text-muted-foreground">
          <Sparkles className="mx-auto mb-2 h-8 w-8" />
          <p>No suggestions yet</p>
          <p className="text-sm">Select text to enhance</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-lime-500" />
          AI Suggestions
          <Badge variant="secondary">{suggestions.length}</Badge>
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={clearSuggestions}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {suggestions.map((suggestion) => (
          <AISuggestionCard key={suggestion.id} suggestion={suggestion} />
        ))}
      </CardContent>
    </Card>
  );
}
