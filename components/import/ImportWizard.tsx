/**
 * Import Wizard Component
 *
 * Multi-step wizard for importing resumes from PDF.
 * Orchestrates upload, extraction, parsing, and review steps.
 *
 * @component
 */

'use client';

import { ArrowLeft } from 'lucide-react';
import { useImportStore } from '@/stores/importStore';
import { Button } from '@/components/ui/button';
import { PDFUploader } from './PDFUploader';
import { TextExtractionStep } from './TextExtractionStep';
import { ImportReview } from './ImportReview';

const STEPS = [
  { id: 'upload', label: 'Upload PDF', component: PDFUploader },
  { id: 'import', label: 'Import Resume', component: TextExtractionStep },
  { id: 'review', label: 'Review & Edit', component: ImportReview },
] as const;

export function ImportWizard() {
  const { currentStep, prevStep, resetImport, isStreaming } = useImportStore();

  const currentStepIndex = STEPS.findIndex((step) => step.id === currentStep);
  const CurrentStepComponent = STEPS[currentStepIndex]?.component || PDFUploader;

  // Show back button for all steps except upload (and not while streaming)
  const showBackButton = currentStep !== 'upload' && !isStreaming;

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          {showBackButton && (
            <Button variant="ghost" size="icon" onClick={prevStep}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          <div>
            <h1 className="text-3xl font-bold">Import Resume</h1>
            <p className="text-muted-foreground mt-1">
              Step {currentStepIndex + 1} of {STEPS.length}: {STEPS[currentStepIndex]?.label}
            </p>
          </div>
        </div>
        <Button variant="ghost" onClick={resetImport} disabled={isStreaming}>
          Cancel
        </Button>
      </div>

      {/* Progress Indicator */}
      <div className="flex gap-2 mb-8">
        {STEPS.map((step, index) => (
          <div
            key={step.id}
            className={`flex-1 h-2 rounded-full transition-colors ${
              index <= currentStepIndex ? 'bg-primary' : 'bg-muted'
            }`}
          />
        ))}
      </div>

      {/* Step Content */}
      <div className="bg-card rounded-lg p-8 border">
        <CurrentStepComponent />
      </div>

      {/* Instructions */}
      <div className="mt-6 text-sm text-muted-foreground space-y-2">
        {currentStep === 'upload' && (
          <div>
            <p className="font-medium">Tips for best results:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Use a high-quality PDF with text (not a scanned image)</li>
              <li>Standard resume formats work best (avoid heavily designed resumes)</li>
              <li>Keep file size under 10MB</li>
            </ul>
          </div>
        )}

        {currentStep === 'import' && (
          <p>
            Please wait while we process your resume with AI. This may take 10-30 seconds depending
            on file size and complexity. The process uses Gemini multimodal to understand your
            PDF&apos;s layout, formatting, and content.
          </p>
        )}

        {currentStep === 'review' && (
          <div>
            <p className="font-medium">Review your information:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Check that your name and contact information are correct</li>
              <li>Verify dates and job titles</li>
              <li>You can edit the full resume after saving</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
