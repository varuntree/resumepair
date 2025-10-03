/**
 * Suggestion Generator
 * Phase 6: Scoring & Optimization
 *
 * Generate 3-5 actionable suggestions based on scores
 */

import { Suggestion } from '@/types/scoring'
import { ResumeJson } from '@/types/resume'

interface SuggestionContext {
  atsScore: number
  keywordScore: number
  contentScore: number
  formatScore: number
  completenessScore: number
  resume: ResumeJson
  jobDescription?: string
}

/**
 * Generate suggestions based on scores
 */
export function generateSuggestions(context: SuggestionContext): Suggestion[] {
  const suggestions: Suggestion[] = []

  // ATS Suggestions
  if (context.resume.profile.photo) {
    suggestions.push({
      id: 'remove-photo',
      type: 'quick_fix',
      priority: 'high',
      category: 'ATS',
      title: 'Remove photo for better ATS compatibility',
      description:
        'Photos can confuse ATS systems and may lead to discrimination concerns',
      impact: 3,
      effort: 'low',
      action: {
        type: 'remove',
        field: 'profile.photo',
        value: null,
      },
    })
  }

  // Keyword Suggestions
  if (context.keywordScore < 20 && context.jobDescription) {
    suggestions.push({
      id: 'add-keywords',
      type: 'enhancement',
      priority: 'high',
      category: 'Keywords',
      title: 'Add missing keywords from job description',
      description: 'Your resume is missing key terms from the job posting',
      impact: 5,
      effort: 'medium',
    })
  }

  // Content Suggestions
  if (context.contentScore < 10) {
    suggestions.push({
      id: 'add-action-verbs',
      type: 'enhancement',
      priority: 'medium',
      category: 'Content',
      title: 'Use stronger action verbs',
      description:
        'Start bullets with action verbs like "Led", "Developed", "Managed"',
      impact: 4,
      effort: 'medium',
      examples: ['Led team of 5 engineers', 'Developed React application', 'Managed $100K budget'],
    })
  }

  if (context.contentScore < 15) {
    suggestions.push({
      id: 'add-metrics',
      type: 'enhancement',
      priority: 'medium',
      category: 'Content',
      title: 'Add quantifiable metrics',
      description:
        'Use numbers to show impact (percentages, dollar amounts, team sizes)',
      impact: 4,
      effort: 'medium',
      examples: [
        'Increased sales by 25%',
        'Reduced costs by $50,000',
        'Managed team of 8 people',
      ],
    })
  }

  // Completeness Suggestions
  if (!context.resume.summary && !context.resume.profile.headline) {
    suggestions.push({
      id: 'add-summary',
      type: 'addition',
      priority: 'low',
      category: 'Completeness',
      title: 'Add professional summary',
      description:
        'A brief summary helps recruiters quickly understand your background',
      impact: 2,
      effort: 'low',
    })
  }

  if (!context.resume.skills || context.resume.skills.length === 0) {
    suggestions.push({
      id: 'add-skills',
      type: 'addition',
      priority: 'high',
      category: 'Completeness',
      title: 'Add skills section',
      description: 'List your technical and professional skills',
      impact: 3,
      effort: 'low',
    })
  }

  // Return top 5 suggestions (sorted by priority + impact)
  return suggestions
    .sort((a, b) => {
      const priorityWeight: Record<string, number> = { high: 3, medium: 2, low: 1 }
      return priorityWeight[b.priority] * b.impact - priorityWeight[a.priority] * a.impact
    })
    .slice(0, 5)
}
