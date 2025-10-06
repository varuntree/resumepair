/**
 * AI Resume Generation Page
 *
 * User interface for AI-powered resume generation from job descriptions.
 * Features real-time streaming preview and integrated with Phase 3 RAF batching.
 *
 * @page /ai/generate
 */

'use client';

import { Sparkles, Download, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGenerationStore } from '@/stores/generationStore';
import JobDescriptionInput from '@/components/ai/JobDescriptionInput';
import PersonalInfoForm from '@/components/ai/PersonalInfoForm';
import GenerationPreview from '@/components/ai/GenerationPreview';
import StreamingIndicator from '@/components/ai/StreamingIndicator';

export default function GeneratePage() {
  const {
    jobDescription,
    personalInfo,
    selectedTemplate,
    isGenerating,
    currentSection,
    progress,
    generatedResume,
    error,
    setJobDescription,
    setPersonalInfo,
    startGeneration,
    cancelGeneration,
    reset,
  } = useGenerationStore();

  const canGenerate =
    jobDescription.length >= 50 &&
    jobDescription.length <= 5000 &&
    !isGenerating;

  return (
    <div className="min-h-screen bg-background">
      {/* Streaming Indicator (Fixed Position) */}
      <StreamingIndicator
        isGenerating={isGenerating}
        currentSection={currentSection}
        progress={progress}
        onCancel={cancelGeneration}
      />

      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="flex items-center gap-2 text-3xl font-bold">
                <Sparkles className="h-8 w-8 text-lime-600" />
                AI Resume Generator
              </h1>
              <p className="mt-2 text-muted-foreground">
                Generate a tailored resume from any job description in seconds
              </p>
            </div>
            {generatedResume && (
              <Button variant="outline" onClick={reset}>
                Start New
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left Column: Input */}
          <div className="space-y-6">
            {/* Job Description */}
            <div className="rounded-lg border bg-card p-6">
              <JobDescriptionInput
                value={jobDescription}
                onChange={setJobDescription}
                disabled={isGenerating}
              />
            </div>

            {/* Personal Info */}
            <div className="rounded-lg bg-card">
              <PersonalInfoForm
                personalInfo={personalInfo}
                onChange={setPersonalInfo}
                disabled={isGenerating}
              />
            </div>

            {/* Template Selection (Future Phase) */}
            {/* For now, uses default 'minimal' template */}

            {/* Error Display */}
            {error && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                <p className="text-sm font-medium text-destructive">{error}</p>
              </div>
            )}

            {/* Generate Button */}
            <Button
              size="lg"
              className="w-full bg-lime-600 hover:bg-lime-700"
              onClick={startGeneration}
              disabled={!canGenerate}
            >
              <Sparkles className="mr-2 h-5 w-5" />
              {isGenerating ? 'Generating...' : 'Generate Resume'}
            </Button>

            {/* Info Box */}
            <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
              <p className="font-medium">How it works:</p>
              <ol className="mt-2 list-decimal space-y-1 pl-5">
                <li>Paste a job description above</li>
                <li>Optionally add your personal information</li>
                <li>Click Generate to create a tailored resume</li>
                <li>Watch as sections appear in real-time</li>
                <li>Save or download when complete</li>
              </ol>
            </div>
          </div>

          {/* Right Column: Preview */}
          <div className="lg:sticky lg:top-6 lg:h-[calc(100vh-6rem)]">
            <GenerationPreview
              resume={generatedResume}
              isGenerating={isGenerating}
              template={selectedTemplate}
            />

            {/* Action Buttons (when resume generated) */}
            {generatedResume && !isGenerating && (
              <div className="mt-4 flex gap-3">
                <Button variant="outline" className="flex-1">
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
                <Button className="flex-1 bg-lime-600 hover:bg-lime-700">
                  <Save className="mr-2 h-4 w-4" />
                  Save Resume
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="border-t bg-muted/30 py-6">
        <div className="container mx-auto px-4 text-center text-xs text-muted-foreground">
          <p>
            Powered by Google Gemini 2.0 Flash • Estimated cost: $0.0003 per
            generation
          </p>
          <p className="mt-1">
            Daily limit: 100 generations • Monthly limit: 500 generations
          </p>
        </div>
      </div>
    </div>
  );
}
