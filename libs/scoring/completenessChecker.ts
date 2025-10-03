/**
 * Completeness Checker
 * Phase 6: Scoring & Optimization
 *
 * Count required sections
 * Max score: 10 points
 */

import { ResumeJson } from '@/types/resume'

/**
 * Calculate Completeness Score (0-10 points)
 */
export function calculateCompletenessScore(resume: ResumeJson): number {
  let score = 0

  // Check 1: Has contact info? (2 pts)
  if (resume.profile.email && resume.profile.phone) score += 2

  // Check 2: Has work experience? (2 pts)
  if (resume.work && resume.work.length > 0) score += 2

  // Check 3: Has education? (2 pts)
  if (resume.education && resume.education.length > 0) score += 2

  // Check 4: Has skills? (2 pts)
  if (resume.skills && resume.skills.length > 0) score += 2

  // Check 5: Has summary or headline? (2 pts)
  if (resume.summary || resume.profile.headline) score += 2

  return score
}
