/**
 * Score Breakdown Component
 * Phase 6: Scoring & Optimization
 *
 * Detailed 5-dimension breakdown (expanded view)
 */

'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScoreBreakdownDetails } from '@/types/scoring'

interface ScoreBreakdownProps {
  breakdown: ScoreBreakdownDetails
}

export function ScoreBreakdown({ breakdown }: ScoreBreakdownProps) {
  return (
    <div className="space-y-4">
      {/* ATS Readiness Details */}
      <Card className="p-4">
        <h3 className="font-semibold mb-2">ATS Readiness</h3>
        <div className="space-y-1 text-sm">
          <CheckItem
            label="Standard sections"
            checked={breakdown.atsReadiness.hasStandardSections}
          />
          <CheckItem label="No photos" checked={breakdown.atsReadiness.noPhotos} />
          <CheckItem label="ATS-safe font" checked={breakdown.atsReadiness.safeFont} />
          <CheckItem label="Simple layout" checked={breakdown.atsReadiness.simpleLayout} />
          <CheckItem label="PDF format" checked={breakdown.atsReadiness.pdfFormat} />
        </div>
      </Card>

      {/* Keyword Match Details */}
      <Card className="p-4">
        <h3 className="font-semibold mb-2">Keyword Match</h3>
        <div className="space-y-2">
          <div>
            <span className="text-sm text-muted-foreground">Coverage: </span>
            <span className="font-medium">
              {Math.round(breakdown.keywordMatch.coverage * 100)}%
            </span>
          </div>
          {breakdown.keywordMatch.matched.length > 0 && (
            <div>
              <span className="text-sm text-muted-foreground">Matched: </span>
              <div className="flex flex-wrap gap-1 mt-1">
                {breakdown.keywordMatch.matched.map((kw: string) => (
                  <Badge key={kw} variant="secondary">
                    {kw}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {breakdown.keywordMatch.missing.length > 0 && (
            <div>
              <span className="text-sm text-muted-foreground">Missing: </span>
              <div className="flex flex-wrap gap-1 mt-1">
                {breakdown.keywordMatch.missing.map((kw: string) => (
                  <Badge key={kw} variant="destructive">
                    {kw}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Content Strength Details */}
      <Card className="p-4">
        <h3 className="font-semibold mb-2">Content Strength</h3>
        <div className="space-y-1 text-sm">
          <div>Action verbs: {breakdown.contentStrength.actionVerbCount}</div>
          <div>Metrics: {breakdown.contentStrength.quantificationCount}</div>
          <CheckItem
            label="Has quantifiable achievements"
            checked={breakdown.contentStrength.hasMetrics}
          />
        </div>
      </Card>
    </div>
  )
}

interface CheckItemProps {
  label: string
  checked: boolean
}

function CheckItem({ label, checked }: CheckItemProps) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-2 h-2 rounded-full ${checked ? 'bg-primary' : 'bg-muted'}`}
      />
      <span>{label}</span>
    </div>
  )
}
