/**
 * Score History Component
 * Phase 6: Scoring & Optimization
 *
 * Line chart showing score evolution
 */

'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface ScoreHistoryProps {
  resumeId: string
}

interface HistoryEntry {
  version: number
  overall_score: number
  created_at: string
}

export function ScoreHistory({ resumeId }: ScoreHistoryProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/v1/score/history/${resumeId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setHistory(data.data.history)
        }
        setLoading(false)
      })
      .catch((error) => {
        console.error('Failed to load history:', error)
        setLoading(false)
      })
  }, [resumeId])

  if (loading) {
    return <Skeleton className="h-64 w-full" />
  }

  if (history.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground text-center">
          No score history yet. Calculate your score to start tracking progress.
        </p>
      </Card>
    )
  }

  return (
    <Card className="p-6 space-y-4">
      <h3 className="font-semibold text-lg">Score History</h3>

      {/* Simple list view (chart library optional) */}
      <div className="space-y-2">
        {history.map((entry, i) => (
          <div key={i} className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Version {entry.version}</span>
            <span className="font-medium">{entry.overall_score}/100</span>
            <span className="text-xs text-muted-foreground">
              {new Date(entry.created_at).toLocaleDateString()}
            </span>
          </div>
        ))}
      </div>
    </Card>
  )
}
