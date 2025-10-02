/**
 * Streaming Indicator Component
 *
 * Displays real-time progress during AI resume generation.
 * Shows current section, progress bar, and estimated cost.
 *
 * @component
 */

'use client';

import { Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface StreamingIndicatorProps {
  isGenerating: boolean;
  currentSection: string | null;
  progress: number; // 0-100
  onCancel: () => void;
}

/**
 * Section display names
 */
const SECTION_NAMES: Record<string, string> = {
  profile: 'Contact Information',
  summary: 'Professional Summary',
  work: 'Work Experience',
  education: 'Education',
  projects: 'Projects',
  skills: 'Skills',
  certifications: 'Certifications',
  complete: 'Complete!',
};

/**
 * Estimated cost per generation (Gemini 2.0 Flash)
 * Based on average 2000 input tokens + 2500 output tokens
 */
const ESTIMATED_COST = 0.0003; // $0.0003 USD

export default function StreamingIndicator({
  isGenerating,
  currentSection,
  progress,
  onCancel,
}: StreamingIndicatorProps) {
  if (!isGenerating) return null;

  const sectionName = currentSection
    ? SECTION_NAMES[currentSection] || currentSection
    : 'Initializing...';

  return (
    <div className="fixed top-4 right-4 z-50 w-80 rounded-lg border bg-card p-4 shadow-lg">
      {/* Header */}
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-lime-600" />
          <span className="text-sm font-medium">Generating Resume</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 -mt-1 -mr-1"
          onClick={onCancel}
          aria-label="Cancel generation"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Current Section */}
      <div className="mb-2">
        <p className="text-xs text-muted-foreground">Current section:</p>
        <p className="text-sm font-medium">{sectionName}</p>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Progress</span>
          <span className="text-xs font-medium">{progress}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Cost Estimate */}
      <div className="rounded-md bg-muted px-3 py-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Estimated cost:</span>
          <span className="text-xs font-mono font-medium">
            ${ESTIMATED_COST.toFixed(4)}
          </span>
        </div>
      </div>

      {/* Tips */}
      <p className="mt-3 text-xs text-muted-foreground">
        Your preview will update in real-time as sections are generated.
      </p>
    </div>
  );
}
