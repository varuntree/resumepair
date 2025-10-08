/**
 * Keyword Matcher
 * Phase 6: Scoring & Optimization
 *
 * Simple case-insensitive exact matching
 * Max score: 25 points
 */

import { ResumeJson } from '@/types/resume'
import { TECH_KEYWORDS } from './constants'
import { normalizeSkillNames } from '@/libs/utils'

/**
 * Calculate Keyword Match Score (0-25 points)
 */
export function calculateKeywordScore(
  resume: ResumeJson,
  jobDescription?: string
): number {
  if (!jobDescription) {
    // Default score if no JD (60% baseline)
    return 15
  }

  // Extract keywords from job description (simple approach)
  const jdKeywords = extractSimpleKeywords(jobDescription)

  // Extract all text from resume
  const resumeText = extractResumeText(resume).toLowerCase()

  // Count matches (case-insensitive)
  const matchedKeywords = jdKeywords.filter((kw) =>
    resumeText.includes(kw.toLowerCase())
  )

  // Coverage ratio
  const coverage = matchedKeywords.length / (jdKeywords.length || 1)

  // Score: coverage * 25
  return Math.round(coverage * 25)
}

/**
 * Extract keywords from job description
 * Approach: Capitalized words + tech terms from our list
 */
export function extractSimpleKeywords(text: string): string[] {
  const keywords: string[] = []

  // 1. Extract capitalized words (likely proper nouns/skills)
  const capitalizedWords = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b/g) || []
  keywords.push(...capitalizedWords)

  // 2. Extract tech keywords from our list
  TECH_KEYWORDS.forEach((kw) => {
    const regex = new RegExp(`\\b${kw}\\b`, 'i')
    if (regex.test(text)) {
      keywords.push(kw)
    }
  })

  // 3. Deduplicate and return
  return Array.from(new Set(keywords))
}

/**
 * Extract all text from resume (all sections)
 */
function extractResumeText(resume: ResumeJson): string {
  const parts: string[] = []

  // Profile
  if (resume.profile.fullName) parts.push(resume.profile.fullName)
  if (resume.profile.headline) parts.push(resume.profile.headline)

  // Summary
  if (resume.summary) parts.push(stripHtml(resume.summary))

  // Work experience
  resume.work?.forEach((job) => {
    if (job.company) parts.push(job.company)
    if (job.role) parts.push(job.role)
    job.descriptionBullets?.forEach((bullet) => parts.push(bullet))
    job.achievements?.forEach((achievement) => parts.push(achievement))
    job.techStack?.forEach((tech) => parts.push(tech))
  })

  // Skills
  resume.skills?.forEach((skillGroup) => {
    parts.push(...normalizeSkillNames(skillGroup.items || []))
  })

  // Projects
  resume.projects?.forEach((project) => {
    if (project.name) parts.push(project.name)
    if (project.summary) parts.push(project.summary)
    project.bullets?.forEach((bullet) => parts.push(bullet))
    project.techStack?.forEach((tech) => parts.push(tech))
  })

  // Education
  resume.education?.forEach((edu) => {
    if (edu.school) parts.push(edu.school)
    if (edu.degree) parts.push(edu.degree)
    if (edu.field) parts.push(edu.field)
  })

  return parts.join(' ')
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]+>/g, ' ')
}
