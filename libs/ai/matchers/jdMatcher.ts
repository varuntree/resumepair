/**
 * Job Description Matcher
 *
 * Analyzes how well a resume matches a job description.
 * Provides scoring, gap analysis, and recommendations.
 *
 * @module libs/ai/matchers/jdMatcher
 */

import { generateObject } from 'ai';
import { aiModel } from '@/libs/ai/provider';
import { z } from 'zod';

/**
 * Match result schema (enforced by AI)
 */
const MatchResultSchema = z.object({
  overallScore: z.number().min(0).max(100).describe('Overall match score (0-100), weighted average of alignment and skills coverage'),
  alignment: z.object({
    score: z.number().min(0).max(100).describe('How well resume matches JD requirements (0-100)'),
    matchedKeywords: z.array(z.string()).describe('Keywords appearing in both resume and JD'),
    missingKeywords: z.array(z.string()).describe('Important keywords from JD not in resume'),
  }).describe('Keyword alignment analysis'),
  skillsGap: z.object({
    score: z.number().min(0).max(100).describe('Percentage of required skills present in resume (0-100)'),
    hasSkills: z.array(z.string()).describe('Skills from JD that resume demonstrates'),
    missingSkills: z.array(z.string()).describe('Skills JD requires but resume lacks'),
    prioritySkills: z.array(z.string()).max(5).describe('Top 5 most important missing skills (ranked by importance)'),
  }).describe('Skills coverage and gap analysis'),
  recommendations: z.array(z.string()).min(3).max(5).describe('3-5 specific, actionable improvements'),
});

/**
 * Match result type
 */
export type MatchResult = z.infer<typeof MatchResultSchema>;

/**
 * Resume JSON interface (simplified for matching)
 */
interface ResumeJson {
  profile?: {
    fullName?: string;
    email?: string;
    phone?: string;
    location?: string;
  };
  summary?: string;
  work?: Array<{
    company: string;
    role: string;
    startDate: string;
    endDate?: string;
    bullets?: string[];
  }>;
  education?: Array<{
    institution: string;
    degree: string;
    field?: string;
    graduationDate?: string;
  }>;
  skills?: Array<{
    category: string;
    keywords: string[];
  }>;
  projects?: Array<{
    name: string;
    description: string;
    technologies?: string[];
  }>;
  certifications?: Array<{
    name: string;
    issuer?: string;
    date?: string;
  }>;
}

/**
 * Match resume to job description
 *
 * Uses AI to analyze alignment, identify gaps, and provide recommendations.
 *
 * @param resume - Resume JSON object
 * @param jobDescription - Job description text
 * @returns Match result with scoring and recommendations
 */
export async function matchResumeToJob(
  resume: ResumeJson,
  jobDescription: string
): Promise<MatchResult> {
  try {
    // Build prompt
    const prompt = buildMatchPrompt(resume, jobDescription);

    // Generate structured match result
    const result = await generateObject({
      model: aiModel,
      schema: MatchResultSchema,
      prompt,
      temperature: 0.3, // Low for analytical accuracy
    });

    return result.object;
  } catch (error) {
    throw new Error(
      `Job matching failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Build matching prompt
 *
 * @param resume - Resume JSON
 * @param jobDescription - Job description text
 * @returns Formatted prompt for AI
 */
function buildMatchPrompt(resume: ResumeJson, jobDescription: string): string {
  const resumeText = JSON.stringify(resume, null, 2);

  return `You are analyzing how well a resume matches a job description. Provide a detailed scoring and gap analysis.

Resume:
${resumeText}

Job Description:
${jobDescription}

Analyze and provide:

1. **Overall Score (0-100)**: Weighted average of alignment and skills coverage
   - 90-100: Excellent match, minor gaps
   - 70-89: Good match, some improvements needed
   - 50-69: Moderate match, significant gaps
   - 0-49: Poor match, major gaps

2. **Alignment Analysis**:
   - Score (0-100): How well resume matches JD requirements
   - Matched Keywords: Keywords appearing in both resume and JD
   - Missing Keywords: Important keywords from JD not in resume

3. **Skills Gap Analysis**:
   - Score (0-100): Percentage of required skills present
   - Has Skills: Skills from JD that resume demonstrates
   - Missing Skills: Skills JD requires but resume lacks
   - Priority Skills: Top 5 most important missing skills (ranked by importance)

4. **Recommendations**: 3-5 specific, actionable improvements

Scoring Rubric:
- Overall Score = (Alignment Score × 0.4) + (Skills Gap Score × 0.6)
- Focus on technical skills, relevant experience, and role requirements
- Consider both hard skills (technical) and soft skills (communication, leadership)
- Prioritize requirements explicitly stated in JD over inferred requirements

Return as structured JSON matching the MatchResultSchema.`;
}
