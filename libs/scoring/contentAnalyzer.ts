/**
 * Content Analyzer
 * Phase 6: Scoring & Optimization
 *
 * Count action verbs and quantifiable metrics
 * Max score: 20 points
 */

import { ResumeJson } from '@/types/resume'
import { ACTION_VERBS } from './constants'

/**
 * Calculate Content Strength Score (0-20 points)
 */
export function calculateContentScore(resume: ResumeJson): number {
  let score = 0

  // Extract all work experience bullets
  const allBullets = extractWorkBullets(resume)
  if (allBullets.length === 0) return 0

  // Check 1: Has action verbs? (10 pts)
  const hasActionVerbs = countActionVerbs(allBullets) > 0
  if (hasActionVerbs) score += 10

  // Check 2: Has quantifiable metrics? (10 pts)
  const hasMetrics = hasQuantifiableMetrics(allBullets)
  if (hasMetrics) score += 10

  return score
}

/**
 * Extract work bullets from resume
 */
function extractWorkBullets(resume: ResumeJson): string[] {
  const bullets: string[] = []
  resume.work?.forEach((job) => {
    job.descriptionBullets?.forEach((bullet) => bullets.push(bullet))
    job.achievements?.forEach((achievement) => bullets.push(achievement))
  })
  return bullets
}

/**
 * Count action verbs in bullets (case-insensitive)
 */
function countActionVerbs(bullets: string[]): number {
  let count = 0
  const text = bullets.join(' ').toLowerCase()

  ACTION_VERBS.forEach((verb) => {
    // Check if verb appears at start of sentence (basic heuristic)
    const regex = new RegExp(`\\b${verb}\\b`, 'i')
    if (regex.test(text)) count++
  })

  return count
}

/**
 * Detect quantifiable metrics (numbers, percentages, dollars)
 */
function hasQuantifiableMetrics(bullets: string[]): boolean {
  const text = bullets.join(' ')

  // Regex patterns for metrics
  const patterns = [
    /\d+%/, // Percentages: 25%
    /\$[\d,]+/, // Dollars: $50,000
    /\d+\s+(users?|customers?|projects?|teams?|members?|people|hours?|days?|months?|years?)/i,
  ]

  return patterns.some((pattern) => pattern.test(text))
}
