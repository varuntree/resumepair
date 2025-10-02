/**
 * Import Store - PDF Multimodal Streaming (Phase 4.5)
 *
 * Zustand store for managing PDF import workflow state with SSE streaming.
 * Simplified to upload → import → review (3 steps).
 *
 * @module stores/importStore
 */

import { create } from 'zustand';
import type { ResumeJson } from '@/types/resume';

/**
 * Import workflow steps (simplified from 4 to 3 steps)
 */
export type ImportStep = 'upload' | 'import' | 'review';

/**
 * Parsed resume result
 */
export interface ParsedResume {
  data: ResumeJson;
  confidence?: number;
  duration?: number;
  fileName?: string;
}

/**
 * Import store state
 */
interface ImportState {
  // Current state
  currentStep: ImportStep;
  uploadedFile: File | null;
  parsedResume: ParsedResume | null;
  corrections: Partial<ResumeJson>;
  error: string | null;

  // Streaming state (like generationStore)
  isStreaming: boolean;
  progress: number; // 0-100
  partialResume: Partial<ResumeJson> | null;
  abortController: AbortController | null; // For stream cancellation

  // Actions
  setFile: (file: File) => void;
  startImport: () => Promise<void>;
  cancelImport: () => void;
  applyCorrection: (path: string, value: any) => void;
  nextStep: () => void;
  prevStep: () => void;
  resetImport: () => void;
  setError: (error: string | null) => void;
}

/**
 * Import store with Zustand (Phase 4.5 SSE Streaming)
 */
export const useImportStore = create<ImportState>((set, get) => ({
  // Initial state
  currentStep: 'upload',
  uploadedFile: null,
  parsedResume: null,
  corrections: {},
  error: null,
  isStreaming: false,
  progress: 0,
  partialResume: null,
  abortController: null,

  /**
   * Set uploaded file and move to import step
   */
  setFile: (file: File) =>
    set({
      uploadedFile: file,
      currentStep: 'upload',
      error: null,
      partialResume: null,
      progress: 0,
    }),

  /**
   * Start PDF import with SSE streaming (Phase 4.5)
   */
  startImport: async () => {
    const state = get();
    const file = state.uploadedFile;

    if (!file) {
      set({ error: 'No file selected' });
      return;
    }

    // Validate file type
    if (!file.type.includes('pdf')) {
      set({ error: 'File must be a PDF' });
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      set({ error: 'PDF must be under 10MB' });
      return;
    }

    // Create abort controller for stream cancellation
    const abortController = new AbortController();

    // Reset state
    set({
      isStreaming: true,
      progress: 0,
      error: null,
      parsedResume: null,
      partialResume: null,
      currentStep: 'import',
      abortController,
    });

    try {
      // Encode file to base64
      const arrayBuffer = await file.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

      // Send request to streaming endpoint
      const response = await fetch('/api/v1/ai/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileData: base64,
          fileName: file.name,
          mimeType: 'application/pdf',
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP ${response.status}: Import failed`
        );
      }

      if (!response.body) {
        throw new Error('Response body is empty');
      }

      // Read SSE stream (identical pattern to generationStore)
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          set({ isStreaming: false, abortController: null });
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (!line.trim()) continue;

          // Skip event type line
          if (line.startsWith('event: ')) {
            continue;
          }

          // Parse data line
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              switch (data.type) {
                case 'progress':
                  set({
                    progress: Math.round(data.progress * 100),
                  });
                  break;

                case 'update':
                  // Update partial resume (triggers preview update)
                  set({
                    partialResume: data.data,
                  });
                  break;

                case 'complete':
                  set({
                    parsedResume: {
                      data: data.data,
                      duration: data.duration,
                      fileName: data.fileName,
                    },
                    partialResume: data.data,
                    isStreaming: false,
                    progress: 100,
                    currentStep: 'review',
                  });
                  break;

                case 'error':
                  set({
                    error: data.message,
                    isStreaming: false,
                    progress: 0,
                  });
                  break;
              }
            } catch (parseError) {
              console.warn('[Import] Failed to parse SSE data:', parseError);
            }
          }
        }
      }
    } catch (error: unknown) {
      // Handle abort errors (user cancelled) silently
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('[Import] Stream cancelled by user');
        return;
      }

      console.error('[Import] Stream error:', error);

      const errorMessage =
        error instanceof Error ? error.message : 'Failed to import PDF';

      set({
        error: errorMessage,
        isStreaming: false,
        progress: 0,
        abortController: null,
      });
    }
  },

  /**
   * Cancel ongoing import
   */
  cancelImport: () => {
    const { abortController } = get();

    // Abort the fetch request if in progress
    if (abortController) {
      abortController.abort();
    }

    set({
      isStreaming: false,
      progress: 0,
      currentStep: 'upload',
      abortController: null,
    });
  },

  /**
   * Apply correction to parsed resume
   */
  applyCorrection: (path: string, value: any) =>
    set((state) => {
      const newCorrections = { ...state.corrections } as any;

      // Parse path (e.g., "profile.fullName" -> ["profile", "fullName"])
      const parts = path.split('.');
      if (parts.length === 1) {
        newCorrections[parts[0]] = value;
      } else if (parts.length === 2) {
        newCorrections[parts[0]] = {
          ...(newCorrections[parts[0]] || {}),
          [parts[1]]: value,
        };
      }

      return { corrections: newCorrections };
    }),

  /**
   * Move to next step
   */
  nextStep: () =>
    set((state) => {
      const steps: ImportStep[] = ['upload', 'import', 'review'];
      const currentIndex = steps.indexOf(state.currentStep);
      const nextIndex = Math.min(currentIndex + 1, steps.length - 1);
      return { currentStep: steps[nextIndex] };
    }),

  /**
   * Move to previous step
   */
  prevStep: () =>
    set((state) => {
      const steps: ImportStep[] = ['upload', 'import', 'review'];
      const currentIndex = steps.indexOf(state.currentStep);
      const prevIndex = Math.max(currentIndex - 1, 0);
      return { currentStep: steps[prevIndex], error: null };
    }),

  /**
   * Reset import state
   */
  resetImport: () =>
    set({
      currentStep: 'upload',
      uploadedFile: null,
      parsedResume: null,
      corrections: {},
      isStreaming: false,
      error: null,
      progress: 0,
      partialResume: null,
    }),

  /**
   * Set error message
   */
  setError: (error: string | null) => set({ error, isStreaming: false }),
}));
