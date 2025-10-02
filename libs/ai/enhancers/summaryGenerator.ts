/**
 * Summary Generation Module
 *
 * Generates professional resume summaries from profile and work history.
 *
 * @module libs/ai/enhancers/summaryGenerator
 */

import { generateText } from 'ai';
import { aiModel, TEMPERATURE_BY_OPERATION } from '@/libs/ai/provider';
import type { Profile, WorkExperience } from '@/types/resume';

/**
 * Summary generation result
 */
export interface SummaryGeneration {
  enhanced: string;
  original: string;
  changes: string[];
}

/**
 * Generate professional summary from profile and work experiences
 *
 * @param profile - User profile information
 * @param workExperiences - Array of work experiences
 * @returns Generated summary with metadata
 */
export async function generateSummary(
  profile: Profile,
  workExperiences: WorkExperience[]
): Promise<SummaryGeneration> {
  const years = calculateYearsOfExperience(workExperiences);
  const topSkills = extractTopSkills(workExperiences);
  const industries = extractIndustries(workExperiences);
  const currentRole = workExperiences[0]?.role || profile.headline || 'Professional';

  const prompt = `Generate a professional resume summary (2-3 sentences, 40-60 words).

PROFILE:
- Name: ${profile.fullName}
- Current Title: ${currentRole}
- Years of Experience: ${years}
- Top Skills: ${topSkills.join(', ') || 'Not specified'}
- Industries: ${industries.join(', ') || 'Various'}

WRITE A COMPELLING SUMMARY THAT:
- Opens with current role/expertise
- Highlights key achievements or specializations
- Ends with career goals or value proposition
- Uses active voice and confident tone
- Is exactly 2-3 sentences (40-60 words)

Return only the summary text, no formatting or extra explanation.`;

  try {
    const result = await generateText({
      model: aiModel,
      prompt,
      temperature: 0.8, // Higher temperature for creative summaries
    });

    const summary = result.text.trim();

    return {
      enhanced: summary,
      original: '',
      changes: ['Generated new professional summary'],
    };
  } catch (error) {
    throw new Error(
      `Summary generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Calculate years of experience from work history
 */
function calculateYearsOfExperience(work: WorkExperience[]): number {
  if (!work || work.length === 0) return 0;

  const experiences = work.map((exp) => {
    const start = new Date(exp.startDate);
    const end =
      exp.endDate === 'Present' || !exp.endDate
        ? new Date()
        : new Date(exp.endDate);

    const years = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365);
    return Math.max(0, years);
  });

  const totalYears = experiences.reduce((sum, years) => sum + years, 0);
  return Math.round(totalYears);
}

/**
 * Extract top skills from work experience tech stacks
 */
function extractTopSkills(work: WorkExperience[]): string[] {
  const skillCounts = new Map<string, number>();

  work.forEach((exp) => {
    exp.techStack?.forEach((skill) => {
      const normalized = skill.trim();
      skillCounts.set(normalized, (skillCounts.get(normalized) || 0) + 1);
    });
  });

  // Sort by frequency and take top 5
  return Array.from(skillCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([skill]) => skill);
}

/**
 * Extract industries from work experience companies
 */
function extractIndustries(work: WorkExperience[]): string[] {
  const industries = new Set<string>();

  work.forEach((exp) => {
    // Simple industry extraction from company name
    // In a real implementation, this would use a company database
    if (exp.company.toLowerCase().includes('tech')) {
      industries.add('Technology');
    }
    if (exp.company.toLowerCase().includes('bank')) {
      industries.add('Finance');
    }
    if (exp.company.toLowerCase().includes('health')) {
      industries.add('Healthcare');
    }
  });

  return Array.from(industries);
}
