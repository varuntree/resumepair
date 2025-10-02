/**
 * Streaming Import Step Component (Phase 4.5)
 *
 * Handles PDF import with SSE streaming from Gemini multimodal.
 * Shows real-time progress as resume sections are parsed.
 *
 * @component
 */

'use client';

import React, { useEffect } from 'react';
import { Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { useImportStore } from '@/stores/importStore';
import { Progress } from '@/components/ui/progress';

const SECTION_NAMES: Record<string, string> = {
  profile: 'Contact Information',
  summary: 'Professional Summary',
  work: 'Work Experience',
  education: 'Education',
  projects: 'Projects',
  skills: 'Skills',
  certifications: 'Certifications',
};

export function TextExtractionStep() {
  const {
    uploadedFile,
    isStreaming,
    progress,
    partialResume,
    parsedResume,
    error,
    startImport,
  } = useImportStore();

  // Auto-start import when file is ready
  useEffect(() => {
    if (uploadedFile && !isStreaming && !parsedResume && !error) {
      startImport();
    }
    // startImport is a stable Zustand action, safe to omit from deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadedFile, isStreaming, parsedResume, error]);

  // Get current section being parsed
  const currentSection = partialResume
    ? Object.keys(partialResume)[Object.keys(partialResume).length - 1]
    : null;

  const sectionName = currentSection
    ? SECTION_NAMES[currentSection] || currentSection
    : 'Initializing...';

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        {/* Streaming State */}
        {isStreaming && (
          <>
            <Loader2 className="w-12 h-12 animate-spin text-lime-600 mx-auto" />
            <div className="space-y-2">
              <p className="text-lg font-medium">Importing your resume...</p>
              <p className="text-sm text-muted-foreground">
                Parsing section: {sectionName}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="max-w-md mx-auto space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Real-time section updates */}
            {partialResume && (
              <div className="mt-6 max-w-md mx-auto text-left">
                <p className="text-xs text-muted-foreground mb-2">Sections parsed:</p>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(partialResume).map((section) => (
                    <span
                      key={section}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-lime-50 dark:bg-lime-900/20 text-lime-700 dark:text-lime-400 rounded text-xs"
                    >
                      <CheckCircle className="w-3 h-3" />
                      {SECTION_NAMES[section] || section}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Complete State */}
        {parsedResume && !isStreaming && !error && (
          <>
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto" />
            <p className="text-lg font-medium">Resume imported successfully!</p>
            <p className="text-sm text-muted-foreground">
              Proceed to review and edit your information
            </p>
          </>
        )}

        {/* Error State */}
        {error && (
          <>
            <AlertTriangle className="w-12 h-12 text-destructive mx-auto" />
            <div className="space-y-2">
              <p className="text-lg font-medium text-destructive">Import failed</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </>
        )}
      </div>

      {/* Info Banner (when streaming) */}
      {isStreaming && (
        <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex gap-3">
          <div className="text-sm">
            <p className="font-medium text-blue-900 dark:text-blue-100">
              Using Gemini Multimodal AI
            </p>
            <p className="text-blue-800 dark:text-blue-200 mt-1">
              We&apos;re analyzing your PDF with advanced AI that understands document layout,
              formatting, and even scanned text (OCR). This may take 10-30 seconds.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
