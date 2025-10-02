/**
 * Keyword Extraction Module
 *
 * Extracts ATS-optimized keywords from job descriptions.
 *
 * @module libs/ai/enhancers/keywordExtractor
 */

import { generateObject } from 'ai';
import { z } from 'zod';
import { aiModel, TEMPERATURE_BY_OPERATION } from '@/libs/ai/provider';

/**
 * Keyword with metadata
 */
export interface Keyword {
  term: string;
  category: 'skill' | 'tool' | 'certification' | 'soft_skill';
  priority: 'required' | 'preferred' | 'optional';
}

/**
 * Zod schema for keyword extraction
 */
const KeywordSchema = z.object({
  keywords: z.array(
    z.object({
      term: z.string(),
      category: z.enum(['skill', 'tool', 'certification', 'soft_skill']),
      priority: z.enum(['required', 'preferred', 'optional']),
    })
  ),
});

/**
 * Extract ATS-optimized keywords from job description
 *
 * @param jobDescription - Job description text
 * @returns Array of keywords sorted by priority
 */
export async function extractKeywords(
  jobDescription: string
): Promise<string[]> {
  const prompt = `Extract ATS-optimized keywords from this job description.

JOB DESCRIPTION:
${jobDescription}

IDENTIFY:
1. Hard skills (programming languages, tools, frameworks, technologies)
2. Soft skills (leadership, communication, problem-solving, teamwork)
3. Certifications (AWS, PMP, Six Sigma, etc.)
4. Required vs preferred qualifications

CATEGORIZE EACH KEYWORD BY:
- Type: skill, tool, certification, soft_skill
- Priority: required, preferred, optional

Focus on keywords that are:
- Explicitly mentioned in the job description
- Important for ATS (Applicant Tracking Systems)
- Actionable (can be added to a resume)

Return as structured JSON matching the KeywordSchema.`;

  try {
    const result = await generateObject({
      model: aiModel,
      schema: KeywordSchema,
      prompt,
      temperature: 0.3, // Low temperature for accurate extraction
    });

    // Sort by priority (required > preferred > optional)
    const priorityOrder = { required: 0, preferred: 1, optional: 2 };

    const sortedKeywords = result.object.keywords.sort((a, b) => {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    return sortedKeywords.map((kw) => kw.term);
  } catch (error) {
    throw new Error(
      `Keyword extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Extract keywords with full metadata
 *
 * @param jobDescription - Job description text
 * @returns Array of keywords with metadata
 */
export async function extractKeywordsWithMetadata(
  jobDescription: string
): Promise<Keyword[]> {
  const prompt = `Extract ATS-optimized keywords from this job description.

JOB DESCRIPTION:
${jobDescription}

IDENTIFY:
1. Hard skills (programming languages, tools, frameworks, technologies)
2. Soft skills (leadership, communication, problem-solving, teamwork)
3. Certifications (AWS, PMP, Six Sigma, etc.)
4. Required vs preferred qualifications

CATEGORIZE EACH KEYWORD BY:
- Type: skill, tool, certification, soft_skill
- Priority: required, preferred, optional

Return as structured JSON matching the KeywordSchema.`;

  try {
    const result = await generateObject({
      model: aiModel,
      schema: KeywordSchema,
      prompt,
      temperature: 0.3,
    });

    // Sort by priority
    const priorityOrder = { required: 0, preferred: 1, optional: 2 };

    return result.object.keywords.sort((a, b) => {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  } catch (error) {
    throw new Error(
      `Keyword extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
