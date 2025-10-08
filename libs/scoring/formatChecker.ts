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
  const typography = resume.appearance?.typography

  // Check 1: Uses design tokens? (5 pts)
  // Simplified: Check if fontFamily is explicitly set in appearance
  if (typography?.fontFamily) score += 5

  // Check 2: Line spacing reasonable? (5 pts)
  const lineSpacing = typography?.lineHeight ?? resume.settings?.lineSpacing ?? 1.4
  if (lineSpacing >= 1.0 && lineSpacing <= 2.0) score += 5

  // Check 3: Font size readable? (5 pts)
  const fontSizePx = typography?.fontSize ?? Math.round(16 * (resume.settings?.fontSizeScale || 1))
  const fontSizePt = fontSizePx * (72 / 96)
  if (fontSizePt >= 10 && fontSizePt <= 14) score += 5

  return score
}
