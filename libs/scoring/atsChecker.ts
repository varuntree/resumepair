/**
 * ATS Readiness Checker
 * Phase 6: Scoring & Optimization
 *
 * 7 simple boolean checks for ATS compatibility
 * Max score: 30 points
 */

import { ResumeJson } from '@/types/resume'
import { SAFE_FONTS } from './constants'

/**
 * Calculate ATS Readiness Score (0-30 points)
 */
export function calculateATSScore(resume: ResumeJson): number {
  const checks = {
    hasStandardSections: hasWorkAndEducation(resume), // 5 pts
    noPhotos: !resume.profile.photo, // 5 pts
    safeFont: isSafeFont(resume.settings?.fontFamily || 'Inter'), // 5 pts
    simpleLayout: true, // 5 pts (assume our templates are simple)
    pdfFormat: true, // 5 pts (always true for our exports)
    readableText: isReadableText(resume.settings?.fontSizeScale || 1.0), // 3 pts
    properHeadings: hasSectionTitles(resume), // 2 pts
  }

  // Count passed checks
  const passedChecks = Object.values(checks).filter(Boolean).length

  // Simple scoring: (passedChecks / 7) * 30
  return Math.round((passedChecks / 7) * 30)
}

/**
 * Check if resume has work experience or education
 */
function hasWorkAndEducation(resume: ResumeJson): boolean {
  const hasWork = resume.work ? resume.work.length > 0 : false
  const hasEducation = resume.education ? resume.education.length > 0 : false
  return hasWork || hasEducation
}

/**
 * Check if font is ATS-safe
 */
function isSafeFont(font: string): boolean {
  return SAFE_FONTS.includes(font)
}

/**
 * Check if text is readable (font size >= 10pt)
 */
function isReadableText(fontScale: number): boolean {
  const baseFontSize = 11 // Base font size in points
  const actualSize = baseFontSize * fontScale
  return actualSize >= 10
}

/**
 * Check if resume has section titles
 */
function hasSectionTitles(resume: ResumeJson): boolean {
  // Check if standard sections exist
  const hasWork = resume.work ? resume.work.length > 0 : false
  const hasEducation = resume.education ? resume.education.length > 0 : false
  const hasSkills = resume.skills ? resume.skills.length > 0 : false
  return hasWork || hasEducation || hasSkills
}
