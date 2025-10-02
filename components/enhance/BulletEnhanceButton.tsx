/**
 * Bullet Enhance Button Component
 *
 * Inline button for enhancing individual bullet points.
 *
 * @module components/enhance/BulletEnhanceButton
 */

'use client';

import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useEnhancementStore } from '@/stores/enhancementStore';
import { useToast } from '@/hooks/use-toast';

/**
 * Bullet enhance button props
 */
interface BulletEnhanceButtonProps {
  bullet: string;
  context?: {
    role?: string;
    industry?: string;
  };
  onEnhance?: () => void;
}

/**
 * Bullet enhance button component
 *
 * Triggers AI enhancement for a single bullet point.
 */
export function BulletEnhanceButton({
  bullet,
  context,
  onEnhance,
}: BulletEnhanceButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { addSuggestion } = useEnhancementStore();
  const { toast } = useToast();

  const handleEnhance = async () => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/v1/ai/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'bullet',
          content: bullet,
          context,
        }),
      });

      if (!response.ok) {
        throw new Error('Enhancement failed');
      }

      const { data } = await response.json();

      addSuggestion({
        id: crypto.randomUUID(),
        type: 'bullet',
        original: bullet,
        enhanced: data.enhanced,
        changes: data.changes,
        applied: false,
      });

      toast({
        title: 'Suggestion generated',
        description: 'Check the AI suggestions panel to review and apply.',
      });

      onEnhance?.();
    } catch (error) {
      toast({
        title: 'Enhancement failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={handleEnhance}
      disabled={isLoading}
    >
      <Sparkles className="h-3 w-3 mr-1" />
      {isLoading ? 'Enhancing...' : 'Enhance'}
    </Button>
  );
}
