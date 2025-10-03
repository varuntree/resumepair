/**
 * Format Quality Checker
 * Phase 6: Scoring & Optimization
 *
 * Simplified format checks (no template rendering)
 * Max score: 15 points
 */

import { ResumeJson } from '@/types/resume'

/**
 * Calculate Format Quality Score (0-15 points)
 */
export function calculateFormatScore(resume: ResumeJson): number {
  let score = 0

  // Check 1: Uses design tokens? (5 pts)
  // Simplified: Check if fontFamily is set
  if (resume.settings?.fontFamily) score += 5

  // Check 2: Line spacing reasonable? (5 pts)
  const lineSpacing = resume.settings?.lineSpacing || 1.15
  if (lineSpacing >= 1.0 && lineSpacing <= 1.5) score += 5

  // Check 3: Font size readable? (5 pts)
  const fontScale = resume.settings?.fontSizeScale || 1.0
  if (fontScale >= 0.9 && fontScale <= 1.2) score += 5

  return score
}
