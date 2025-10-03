/**
 * Score Panel Component
 * Phase 6.5: Scoring & Optimization
 *
 * Composite panel combining all scoring UI components
 */

'use client'

import { useState } from 'react'
import { useScoreStore } from '@/stores/scoreStore'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { ScoreDashboard } from './ScoreDashboard'
import { SuggestionList } from './SuggestionList'
import { KeywordAnalysis } from './KeywordAnalysis'
import { ScoreHistory } from './ScoreHistory'
import { Loader2 } from 'lucide-react'

interface ScorePanelProps {
  resumeId: string
}

export function ScorePanel({ resumeId }: ScorePanelProps) {
  const [jobDescription, setJobDescription] = useState('')
  const { calculateScore, isCalculating, currentScore } = useScoreStore()

  const handleCalculate = async () => {
    await calculateScore(resumeId, jobDescription || undefined)
  }

  return (
    <div className="space-y-6 p-6" data-testid="score-panel">
      {/* Job Description Input */}
      <Card>
        <CardHeader>
          <CardTitle>Job Description (Optional)</CardTitle>
          <CardDescription>
            Paste a job description to get keyword match analysis and tailored suggestions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the job description here to analyze keyword matches..."
            rows={6}
            className="resize-none"
          />
          <Button
            onClick={handleCalculate}
            disabled={isCalculating}
            className="w-full sm:w-auto"
          >
            {isCalculating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Calculating Score...
              </>
            ) : (
              'Calculate Score'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Score Dashboard */}
      <ScoreDashboard resumeId={resumeId} />

      {/* Split Layout: Suggestions + Keywords (if job description provided) */}
      {currentScore && currentScore.suggestions && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SuggestionList suggestions={currentScore.suggestions} />
          {jobDescription && currentScore.breakdown?.keywordMatch && (
            <KeywordAnalysis
              matched={currentScore.breakdown.keywordMatch.matched || []}
              missing={currentScore.breakdown.keywordMatch.missing || []}
              coverage={currentScore.breakdown.keywordMatch.coverage || 0}
            />
          )}
        </div>
      )}

      {/* Score History */}
      {currentScore && <ScoreHistory resumeId={resumeId} />}
    </div>
  )
}
