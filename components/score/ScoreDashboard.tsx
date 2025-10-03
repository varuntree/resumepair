/**
 * Score Dashboard Component
 * Phase 6: Scoring & Optimization
 *
 * Main score display with breakdown
 */

'use client'

import { useEffect } from 'react'
import { useScoreStore } from '@/stores/scoreStore'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'

interface ScoreDashboardProps {
  resumeId: string
}

export function ScoreDashboard({ resumeId }: ScoreDashboardProps) {
  const { currentScore, loadScore, isCalculating } = useScoreStore()

  useEffect(() => {
    loadScore(resumeId)
  }, [resumeId, loadScore])

  if (isCalculating) {
    return <Skeleton className="h-96 w-full" />
  }

  if (!currentScore) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">
            No score available. Calculate your resume score to get started.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resume Score</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Score Ring */}
        <div className="text-center space-y-4">
          <div className="text-6xl font-bold">{currentScore.overall}</div>
          <div className="text-xl text-muted-foreground">out of 100</div>

          {/* Circular progress */}
          <Progress value={currentScore.overall} className="h-4" />
        </div>

        {/* Score Breakdown (5 bars) */}
        <div className="space-y-3">
          <DimensionBar
            label="ATS Readiness"
            score={currentScore.dimensions.atsScore}
            maxScore={30}
          />
          <DimensionBar
            label="Keyword Match"
            score={currentScore.dimensions.keywordScore}
            maxScore={25}
          />
          <DimensionBar
            label="Content Strength"
            score={currentScore.dimensions.contentScore}
            maxScore={20}
          />
          <DimensionBar
            label="Format Quality"
            score={currentScore.dimensions.formatScore}
            maxScore={15}
          />
          <DimensionBar
            label="Completeness"
            score={currentScore.dimensions.completenessScore}
            maxScore={10}
          />
        </div>
      </CardContent>
    </Card>
  )
}

interface DimensionBarProps {
  label: string
  score: number
  maxScore: number
}

function DimensionBar({ label, score, maxScore }: DimensionBarProps) {
  const percentage = (score / maxScore) * 100

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span className="font-medium">
          {score}/{maxScore}
        </span>
      </div>
      <Progress value={percentage} className="h-2" />
    </div>
  )
}
