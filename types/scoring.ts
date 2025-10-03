/**
 * Scoring Types for Resume Scoring System
 * Phase 6: Scoring & Optimization
 */

export interface ScoreBreakdown {
  overall: number
  dimensions: {
    atsScore: number
    keywordScore: number
    contentScore: number
    formatScore: number
    completenessScore: number
  }
  breakdown: ScoreBreakdownDetails
  suggestions: Suggestion[]
  calculatedAt: string
}

export interface ScoreBreakdownDetails {
  atsReadiness: {
    hasStandardSections: boolean
    noPhotos: boolean
    safeFont: boolean
    simpleLayout: boolean
    pdfFormat: boolean
    readableText: boolean
    properHeadings: boolean
  }
  keywordMatch: {
    matched: string[]
    missing: string[]
    coverage: number
  }
  contentStrength: {
    actionVerbCount: number
    quantificationCount: number
    hasMetrics: boolean
  }
  formatQuality: {
    consistent: boolean
  }
  completeness: {
    hasContact: boolean
    hasWork: boolean
    hasEducation: boolean
    hasSkills: boolean
    hasSummary: boolean
  }
}

export interface Suggestion {
  id: string
  type: 'quick_fix' | 'enhancement' | 'addition' | 'removal'
  priority: 'high' | 'medium' | 'low'
  category: 'ATS' | 'Keywords' | 'Content' | 'Format' | 'Completeness'
  title: string
  description: string
  impact: number // Points improvement (0-10)
  effort?: 'low' | 'medium' | 'high'
  action?: SuggestionAction
  examples?: string[]
}

export interface SuggestionAction {
  type: 'update' | 'remove' | 'add'
  field: string // JSON path (e.g., 'profile.photo')
  value: unknown
}

export interface ScoreHistoryEntry {
  version: number
  overall_score: number
  ats_score: number
  keyword_score: number
  content_score: number
  format_score: number
  completeness_score: number
  breakdown: ScoreBreakdownDetails
  created_at: string
}

export interface ScoreImprovement {
  id: string
  resume_id: string
  user_id: string
  suggestion_id: string
  suggestion_data: Suggestion
  applied: boolean
  impact: number | null
  applied_at: string
}

export interface IndustryBenchmark {
  industry: string
  average_score: number
  percentiles: {
    p25: number
    p50: number
    p75: number
    p90: number
  }
  sample_size: number | null
  updated_at: string
}
