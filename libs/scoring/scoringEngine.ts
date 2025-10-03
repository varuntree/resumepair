/**
 * Scoring Engine - Main Orchestrator
 * Phase 6: Scoring & Optimization
 *
 * Calculate overall score for a resume (simplified approach)
 * Target: ≤500ms (deterministic)
 */

import { ResumeJson } from '@/types/resume'
import { ScoreBreakdown, ScoreBreakdownDetails } from '@/types/scoring'
import { calculateATSScore } from './atsChecker'
import { calculateKeywordScore, extractSimpleKeywords } from './keywordMatcher'
import { calculateContentScore } from './contentAnalyzer'
import { calculateFormatScore } from './formatChecker'
import { calculateCompletenessScore } from './completenessChecker'
import { generateSuggestions } from './suggestionGenerator'

/**
 * Calculate overall score for a resume
 */
export function calculateScore(
  resume: ResumeJson,
  jobDescription?: string
): ScoreBreakdown {
  const startTime = Date.now()

  // Calculate 5 dimensions (all simple algorithms)
  const atsScore = calculateATSScore(resume) // max 30 pts
  const keywordScore = calculateKeywordScore(resume, jobDescription) // max 25 pts
  const contentScore = calculateContentScore(resume) // max 20 pts
  const formatScore = calculateFormatScore(resume) // max 15 pts
  const completenessScore = calculateCompletenessScore(resume) // max 10 pts

  // Overall score (simple sum)
  const overall = atsScore + keywordScore + contentScore + formatScore + completenessScore

  // Build breakdown details
  const breakdown = buildBreakdownDetails(resume, jobDescription)

  // Generate 3-5 suggestions based on scores
  const suggestions = generateSuggestions({
    atsScore,
    keywordScore,
    contentScore,
    formatScore,
    completenessScore,
    resume,
    jobDescription,
  })

  const elapsed = Date.now() - startTime
  console.log(`Scoring completed in ${elapsed}ms`) // Should be ~100-200ms

  return {
    overall,
    dimensions: {
      atsScore,
      keywordScore,
      contentScore,
      formatScore,
      completenessScore,
    },
    breakdown,
    suggestions,
    calculatedAt: new Date().toISOString(),
  }
}

/**
 * Build detailed breakdown for UI
 */
function buildBreakdownDetails(
  resume: ResumeJson,
  jobDescription?: string
): ScoreBreakdownDetails {
  // ATS Readiness details
  const hasWork = resume.work ? resume.work.length > 0 : false
  const hasEducation = resume.education ? resume.education.length > 0 : false
  const hasSkills = resume.skills ? resume.skills.length > 0 : false

  // Keyword matching details
  let matchedKeywords: string[] = []
  let missingKeywords: string[] = []
  let coverage = 0

  if (jobDescription) {
    const jdKeywords = extractSimpleKeywords(jobDescription)
    const resumeText = extractResumeTextLower(resume)

    matchedKeywords = jdKeywords.filter((kw) =>
      resumeText.includes(kw.toLowerCase())
    )
    missingKeywords = jdKeywords.filter(
      (kw) => !resumeText.includes(kw.toLowerCase())
    )
    coverage = matchedKeywords.length / (jdKeywords.length || 1)
  }

  // Content strength details
  const allBullets = extractWorkBullets(resume)
  const actionVerbCount = countActionVerbs(allBullets)
  const quantificationCount = countQuantifiableMetrics(allBullets)
  const hasMetrics = quantificationCount > 0

  return {
    atsReadiness: {
      hasStandardSections: hasWork || hasEducation,
      noPhotos: !resume.profile.photo,
      safeFont: true, // Simplified - assume safe
      simpleLayout: true, // Our templates are simple
      pdfFormat: true, // Always true
      readableText: true, // Checked in atsChecker
      properHeadings: hasWork || hasEducation || hasSkills,
    },
    keywordMatch: {
      matched: matchedKeywords,
      missing: missingKeywords,
      coverage,
    },
    contentStrength: {
      actionVerbCount,
      quantificationCount,
      hasMetrics,
    },
    formatQuality: {
      consistent: true, // Simplified - assume consistent
    },
    completeness: {
      hasContact: !!(resume.profile.email && resume.profile.phone),
      hasWork: hasWork,
      hasEducation: hasEducation,
      hasSkills: hasSkills,
      hasSummary: !!(resume.summary || resume.profile.headline),
    },
  }
}

// Helper functions
function extractResumeTextLower(resume: ResumeJson): string {
  const parts: string[] = []
  if (resume.profile.fullName) parts.push(resume.profile.fullName)
  if (resume.profile.headline) parts.push(resume.profile.headline)
  if (resume.summary) parts.push(resume.summary)
  resume.work?.forEach((job) => {
    if (job.company) parts.push(job.company)
    if (job.role) parts.push(job.role)
    job.descriptionBullets?.forEach((b) => parts.push(b))
    job.techStack?.forEach((t) => parts.push(t))
  })
  resume.skills?.forEach((sg) => sg.items.forEach((s) => parts.push(s)))
  return parts.join(' ').toLowerCase()
}

function extractWorkBullets(resume: ResumeJson): string[] {
  const bullets: string[] = []
  resume.work?.forEach((job) => {
    job.descriptionBullets?.forEach((b) => bullets.push(b))
    job.achievements?.forEach((a) => bullets.push(a))
  })
  return bullets
}

function countActionVerbs(bullets: string[]): number {
  return bullets.length // Simplified
}

function countQuantifiableMetrics(bullets: string[]): number {
  const text = bullets.join(' ')
  const patterns = [/\d+%/, /\$[\d,]+/, /\d+\s+(users?|customers?|projects?)/i]
  return patterns.filter((p) => p.test(text)).length
}
