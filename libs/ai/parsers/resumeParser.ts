/**
 * Resume Parser with AI SDK
 *
 * Parses resume text into structured ResumeJson using Google Generative AI.
 * Uses generateObject for structured output with Zod schema validation.
 *
 * @module libs/ai/parsers/resumeParser
 */

import { generateObject } from 'ai';
import { aiModel } from '../provider';
import { buildExtractionPrompt } from '../prompts';
import { ResumeJsonSchema } from '@/libs/validation/resume';
import type { ResumeJson } from '@/types/resume';

/**
 * Parsed resume with confidence and corrections
 */
export interface ParsedResume {
  data: ResumeJson;
  confidence: number; // 0-1 confidence score
  corrections: Array<{
    field: string;
    suggestion: string;
    confidence: number;
  }>;
  tokensUsed: {
    input: number;
    output: number;
    total: number;
  };
}

/**
 * Parse resume text to structured ResumeJson
 *
 * Uses AI SDK's generateObject with Gemini 2.0 Flash for accurate extraction.
 * Enforces ResumeJson schema via Zod validation.
 *
 * @param text - Raw text extracted from resume PDF
 * @returns Parsed resume with confidence and token usage
 * @throws Error if parsing fails after retries
 */
export async function parseResumeText(text: string): Promise<ParsedResume> {
  try {
    // Validate input text
    if (!text || text.trim().length < 50) {
      throw new Error('Text too short to parse (minimum 50 characters)');
    }

    // Truncate very long text (limit to ~10k tokens = ~40k characters)
    const maxLength = 40000;
    const truncatedText = text.length > maxLength ? text.slice(0, maxLength) : text;

    if (text.length > maxLength) {
      console.warn(`Text truncated from ${text.length} to ${maxLength} characters`);
    }

    // Build prompt for extraction
    const prompt = buildExtractionPrompt(truncatedText);

    // Generate structured object with Zod schema enforcement
    const result = await generateObject({
      model: aiModel,
      schema: ResumeJsonSchema,
      prompt,
      temperature: 0.3, // Low temperature for accuracy
      maxRetries: 2, // Retry on transient errors
    });

    // Calculate confidence based on completeness
    const confidence = calculateConfidence(result.object as ResumeJson);

    return {
      data: result.object as ResumeJson,
      confidence,
      corrections: [], // TODO: Implement correction suggestions
      tokensUsed: {
        input: (result.usage as any)?.promptTokens || 0,
        output: (result.usage as any)?.completionTokens || 0,
        total: ((result.usage as any)?.promptTokens || 0) + ((result.usage as any)?.completionTokens || 0),
      },
    };
  } catch (error) {
    // Enhanced error handling
    if (error instanceof Error) {
      // Check for specific error types
      if (error.message.includes('401') || error.message.includes('unauthorized')) {
        throw new Error('Invalid API key. Please check GOOGLE_GENERATIVE_AI_API_KEY');
      }

      if (error.message.includes('429') || error.message.includes('rate limit')) {
        throw new Error('Rate limit exceeded. Please try again in a moment');
      }

      if (error.message.includes('safety') || error.message.includes('blocked')) {
        throw new Error('Content blocked by safety filters. Please try different content');
      }
    }

    throw new Error(
      `Resume parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Calculate confidence score based on data completeness
 *
 * @param resume - Parsed resume data
 * @returns Confidence score (0-1)
 */
function calculateConfidence(resume: ResumeJson): number {
  let score = 0.5; // Base score

  // Profile completeness (up to +0.3)
  if (resume.profile.fullName) score += 0.1;
  if (resume.profile.email) score += 0.1;
  if (resume.profile.phone) score += 0.05;
  if (resume.profile.location) score += 0.05;

  // Work experience (up to +0.2)
  if (resume.work && resume.work.length > 0) {
    score += 0.1;
    // Bonus if work has detailed bullets
    if (resume.work.some((w) => w.descriptionBullets && w.descriptionBullets.length > 0)) {
      score += 0.1;
    }
  }

  // Education (up to +0.1)
  if (resume.education && resume.education.length > 0) {
    score += 0.1;
  }

  // Skills (up to +0.1)
  if (resume.skills && resume.skills.length > 0) {
    score += 0.1;
  }

  // Cap at 1.0
  return Math.min(1.0, score);
}

/**
 * Validate parsed resume meets minimum requirements
 *
 * @param resume - Parsed resume to validate
 * @returns True if resume is valid
 */
export function isValidParsedResume(resume: ResumeJson): boolean {
  // Must have profile with name and email
  if (!resume.profile.fullName || !resume.profile.email) {
    return false;
  }

  // Must have at least one section filled
  const hasSections =
    (resume.work && resume.work.length > 0) ||
    (resume.education && resume.education.length > 0) ||
    (resume.skills && resume.skills.length > 0) ||
    (resume.projects && resume.projects.length > 0);

  return Boolean(hasSections);
}
