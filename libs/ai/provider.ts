/**
 * AI Provider Configuration
 *
 * Configures Google Generative AI (Gemini 2.0 Flash) for ResumePair.
 * Uses Vercel AI SDK for provider-agnostic abstraction.
 *
 * @module libs/ai/provider
 */

import { createGoogleGenerativeAI } from '@ai-sdk/google';

/**
 * Google Generative AI provider instance
 * Configured with API key from environment variables
 */
const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

export const gemini = google('gemini-2.0-flash-exp');

/**
 * Default model settings for AI operations
 * These can be overridden per request
 */
export const DEFAULT_MODEL_SETTINGS = {
  temperature: 0.7, // Balanced creativity
  maxTokens: 4096,  // Maximum output tokens
  topP: 0.95,       // Nucleus sampling
};

/**
 * Temperature settings by operation type
 * Lower temperature = more deterministic
 * Higher temperature = more creative
 */
export const TEMPERATURE_BY_OPERATION = {
  parse: 0.3,    // PDF parsing - accuracy critical
  generate: 0.7, // Resume generation - balance needed
  enhance: 0.6,  // Content enhancement - slight creativity
  match: 0.4,    // Job matching - accuracy important
};

/**
 * Export configured model for use in application
 */
export const aiModel = gemini;

/**
 * Get provider with error handling
 * Validates that API key is present
 */
export function getAIProvider() {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  if (!apiKey) {
    throw new Error(
      'GOOGLE_GENERATIVE_AI_API_KEY is required. Set it in .env.local'
    );
  }

  return gemini;
}
