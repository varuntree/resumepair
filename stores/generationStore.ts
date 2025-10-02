/**
 * Generation Store
 *
 * Manages state for AI-powered resume generation flow.
 * Handles job description input, personal info, streaming, and progress tracking.
 *
 * @module stores/generationStore
 */

import { create } from 'zustand';
import type { PersonalInfo } from '@/libs/ai/prompts';

/**
 * Resume generation state
 */
interface GenerationState {
  // Input fields
  jobDescription: string;
  personalInfo: PersonalInfo;
  selectedTemplate: string;

  // Generation state
  isGenerating: boolean;
  currentSection: string | null;
  progress: number; // 0-100

  // Results
  generatedResume: any | null;
  error: string | null;

  // SSE connection
  eventSource: EventSource | null;

  // Actions
  setJobDescription: (text: string) => void;
  setPersonalInfo: (info: Partial<PersonalInfo>) => void;
  setTemplate: (template: string) => void;
  startGeneration: () => Promise<void>;
  cancelGeneration: () => void;
  reset: () => void;
}

/**
 * Create generation store
 */
export const useGenerationStore = create<GenerationState>((set, get) => ({
  // Initial state
  jobDescription: '',
  personalInfo: {},
  selectedTemplate: 'minimal',
  isGenerating: false,
  currentSection: null,
  progress: 0,
  generatedResume: null,
  error: null,
  eventSource: null,

  /**
   * Update job description
   */
  setJobDescription: (text: string) => {
    set({ jobDescription: text, error: null });
  },

  /**
   * Update personal information
   */
  setPersonalInfo: (info: Partial<PersonalInfo>) => {
    set((state) => ({
      personalInfo: { ...state.personalInfo, ...info },
      error: null,
    }));
  },

  /**
   * Set template selection
   */
  setTemplate: (template: string) => {
    set({ selectedTemplate: template });
  },

  /**
   * Start AI generation with streaming
   */
  startGeneration: async () => {
    const state = get();

    // Validation
    if (!state.jobDescription.trim()) {
      set({ error: 'Please enter a job description' });
      return;
    }

    if (state.jobDescription.length < 50) {
      set({
        error: 'Job description is too short (minimum 50 characters)',
      });
      return;
    }

    if (state.jobDescription.length > 5000) {
      set({
        error: 'Job description is too long (maximum 5000 characters)',
      });
      return;
    }

    // Close existing connection if any
    if (state.eventSource) {
      state.eventSource.close();
    }

    // Reset state
    set({
      isGenerating: true,
      progress: 0,
      currentSection: null,
      error: null,
      generatedResume: null,
    });

    try {
      // Send POST request to initiate streaming
      const response = await fetch('/api/v1/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobDescription: state.jobDescription,
          personalInfo: state.personalInfo,
          template: state.selectedTemplate,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP ${response.status}: Generation failed`
        );
      }

      if (!response.body) {
        throw new Error('Response body is empty');
      }

      // Read SSE stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          set({ isGenerating: false });
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (!line.trim()) continue;

          // Parse SSE format: "event: TYPE\ndata: JSON"
          if (line.startsWith('event: ')) {
            continue; // Skip event type line
          }

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
                  // Update generated resume (triggers preview update via RAF batching)
                  set({
                    generatedResume: data.data,
                  });

                  // Track current section
                  const sections = Object.keys(data.data);
                  const lastSection = sections[sections.length - 1];
                  set({ currentSection: lastSection });
                  break;

                case 'complete':
                  set({
                    generatedResume: data.data,
                    isGenerating: false,
                    progress: 100,
                    currentSection: 'complete',
                  });
                  break;

                case 'error':
                  set({
                    error: data.message,
                    isGenerating: false,
                  });
                  break;
              }
            } catch (parseError) {
              console.warn('[Generation] Failed to parse SSE data:', parseError);
            }
          }
        }
      }
    } catch (error: unknown) {
      console.error('[Generation] Stream error:', error);

      const errorMessage =
        error instanceof Error ? error.message : 'Failed to generate resume';

      set({
        error: errorMessage,
        isGenerating: false,
        progress: 0,
      });
    }
  },

  /**
   * Cancel ongoing generation
   */
  cancelGeneration: () => {
    const state = get();

    if (state.eventSource) {
      state.eventSource.close();
    }

    set({
      isGenerating: false,
      progress: 0,
      currentSection: null,
      eventSource: null,
    });
  },

  /**
   * Reset all state
   */
  reset: () => {
    const state = get();

    if (state.eventSource) {
      state.eventSource.close();
    }

    set({
      jobDescription: '',
      personalInfo: {},
      selectedTemplate: 'minimal',
      isGenerating: false,
      currentSection: null,
      progress: 0,
      generatedResume: null,
      error: null,
      eventSource: null,
    });
  },
}));
