/**
 * Score Repository
 * Phase 6: Scoring & Optimization
 *
 * Pure functions for database access (DI pattern)
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { ScoreBreakdown, ScoreHistoryEntry } from '@/types/scoring'

/**
 * Upsert score to database (replaces old score)
 */
export async function saveScore(
  supabase: SupabaseClient,
  score: ScoreBreakdown,
  resumeId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase.from('resume_scores').upsert(
    {
      resume_id: resumeId,
      user_id: userId,
      overall_score: score.overall,
      ats_score: score.dimensions.atsScore,
      keyword_score: score.dimensions.keywordScore,
      content_score: score.dimensions.contentScore,
      format_score: score.dimensions.formatScore,
      completeness_score: score.dimensions.completenessScore,
      breakdown: score.breakdown,
      suggestions: score.suggestions,
      calculated_at: score.calculatedAt,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: 'resume_id',
    }
  )

  if (error) {
    console.error('Failed to save score:', error)
    throw new Error(`Failed to save score: ${error.message}`)
  }
}

/**
 * Get current score for resume
 */
export async function getScore(
  supabase: SupabaseClient,
  resumeId: string,
  userId: string
): Promise<ScoreBreakdown | null> {
  const { data, error } = await supabase
    .from('resume_scores')
    .select('*')
    .eq('resume_id', resumeId)
    .eq('user_id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    console.error('Failed to fetch score:', error)
    throw new Error(`Failed to fetch score: ${error.message}`)
  }

  if (!data) return null

  return mapToScoreBreakdown(data)
}

/**
 * Save score snapshot to history
 */
export async function saveScoreHistory(
  supabase: SupabaseClient,
  score: ScoreBreakdown,
  resumeId: string,
  userId: string,
  version: number
): Promise<void> {
  const { error } = await supabase.from('score_history').insert({
    resume_id: resumeId,
    user_id: userId,
    version,
    overall_score: score.overall,
    ats_score: score.dimensions.atsScore,
    keyword_score: score.dimensions.keywordScore,
    content_score: score.dimensions.contentScore,
    format_score: score.dimensions.formatScore,
    completeness_score: score.dimensions.completenessScore,
    breakdown: score.breakdown,
  })

  if (error) {
    console.error('Failed to save score history:', error)
    throw new Error(`Failed to save score history: ${error.message}`)
  }
}

/**
 * Get score history for resume (last N entries)
 */
export async function getScoreHistory(
  supabase: SupabaseClient,
  resumeId: string,
  userId: string,
  limit: number = 20
): Promise<ScoreHistoryEntry[]> {
  const { data, error } = await supabase
    .from('score_history')
    .select('*')
    .eq('resume_id', resumeId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Failed to fetch score history:', error)
    throw new Error(`Failed to fetch score history: ${error.message}`)
  }

  return (data || []) as ScoreHistoryEntry[]
}

/**
 * Map database row to ScoreBreakdown
 */
function mapToScoreBreakdown(data: Record<string, unknown>): ScoreBreakdown {
  return {
    overall: data.overall_score as number,
    dimensions: {
      atsScore: data.ats_score as number,
      keywordScore: data.keyword_score as number,
      contentScore: data.content_score as number,
      formatScore: data.format_score as number,
      completenessScore: data.completeness_score as number,
    },
    breakdown: data.breakdown as ScoreBreakdown['breakdown'],
    suggestions: data.suggestions as ScoreBreakdown['suggestions'],
    calculatedAt: data.calculated_at as string,
  }
}
