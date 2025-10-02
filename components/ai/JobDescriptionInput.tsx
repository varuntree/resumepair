/**
 * Job Description Input Component
 *
 * Multi-line text area for job description input.
 * Includes character count and validation feedback.
 *
 * @component
 */

'use client';

import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface JobDescriptionInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const MIN_LENGTH = 50;
const MAX_LENGTH = 5000;

export default function JobDescriptionInput({
  value = '',
  onChange,
  disabled = false,
}: JobDescriptionInputProps) {
  const charCount = value.length;
  const isValid = charCount >= MIN_LENGTH && charCount <= MAX_LENGTH;
  const isTooShort = charCount > 0 && charCount < MIN_LENGTH;
  const isTooLong = charCount > MAX_LENGTH;

  return (
    <div className="space-y-2">
      <Label htmlFor="job-description">
        Job Description <span className="text-destructive">*</span>
      </Label>
      <Textarea
        id="job-description"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="Paste the job description here... (minimum 50 characters)"
        className="min-h-[200px] resize-y"
        aria-describedby="job-description-hint"
      />

      {/* Character Count & Validation */}
      <div className="flex items-center justify-between gap-2 text-xs">
        <div id="job-description-hint" className="text-muted-foreground">
          {isTooShort && (
            <span className="text-amber-600">
              Too short - add {MIN_LENGTH - charCount} more characters
            </span>
          )}
          {isTooLong && (
            <span className="text-destructive">
              Too long - remove {charCount - MAX_LENGTH} characters
            </span>
          )}
          {isValid && (
            <span className="text-lime-600">
              Valid job description
            </span>
          )}
          {charCount === 0 && 'Enter at least 50 characters'}
        </div>
        <div className={isTooLong ? 'text-destructive' : 'text-muted-foreground'}>
          {charCount} / {MAX_LENGTH}
        </div>
      </div>

      {/* Tips */}
      <p className="text-xs text-muted-foreground">
        Include key responsibilities, required skills, and qualifications for
        best results.
      </p>
    </div>
  );
}
