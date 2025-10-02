/**
 * Job Match Score Display
 *
 * Displays AI-powered job matching results with visual scoring,
 * keyword alignment, skills gap analysis, and recommendations.
 *
 * @module components/ai/JobMatchScore
 */

'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, XCircle, Lightbulb } from 'lucide-react';

/**
 * Match result interface (from jdMatcher)
 */
interface MatchResult {
  overallScore: number;
  alignment: {
    score: number;
    matchedKeywords: string[];
    missingKeywords: string[];
  };
  skillsGap: {
    score: number;
    hasSkills: string[];
    missingSkills: string[];
    prioritySkills: string[];
  };
  recommendations: string[];
}

/**
 * Component props
 */
interface Props {
  result: MatchResult;
}

/**
 * Job Match Score Component
 *
 * Renders comprehensive job matching analysis with:
 * - Overall match score (0-100)
 * - Keyword alignment (matched vs missing)
 * - Skills gap analysis (priority missing skills)
 * - Actionable recommendations
 */
export function JobMatchScore({ result }: Props) {
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-lime-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 50) return 'text-amber-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent Match';
    if (score >= 70) return 'Good Match';
    if (score >= 50) return 'Moderate Match';
    return 'Poor Match';
  };

  return (
    <div className="space-y-4">
      {/* Overall Score */}
      <Card>
        <CardContent className="pt-6 text-center">
          <div className={`text-5xl font-bold ${getScoreColor(result.overallScore)}`}>
            {result.overallScore}
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            {getScoreLabel(result.overallScore)}
          </div>
        </CardContent>
      </Card>

      {/* Keyword Alignment */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Keyword Alignment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Progress value={result.alignment.score} className="[&>div]:bg-lime-500" />

          <div>
            <div className="flex items-center gap-2 text-sm font-medium mb-2">
              <CheckCircle2 className="h-4 w-4 text-lime-500" />
              Matched ({result.alignment.matchedKeywords.length})
            </div>
            <div className="flex flex-wrap gap-1">
              {result.alignment.matchedKeywords.map(kw => (
                <Badge key={kw} variant="secondary" className="text-xs">
                  {kw}
                </Badge>
              ))}
            </div>
          </div>

          {result.alignment.missingKeywords.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-sm font-medium mb-2">
                <XCircle className="h-4 w-4 text-amber-500" />
                Missing ({result.alignment.missingKeywords.length})
              </div>
              <div className="flex flex-wrap gap-1">
                {result.alignment.missingKeywords.map(kw => (
                  <Badge key={kw} variant="outline" className="text-xs">
                    {kw}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Skills Gap */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Skills Coverage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Progress value={result.skillsGap.score} className="[&>div]:bg-blue-500" />

          {result.skillsGap.prioritySkills.length > 0 && (
            <div>
              <div className="text-sm font-medium mb-2">Priority Skills to Add</div>
              <div className="space-y-1">
                {result.skillsGap.prioritySkills.map((skill, i) => (
                  <div key={skill} className="flex items-center gap-2 text-sm">
                    <Badge className="bg-lime-500">{i + 1}</Badge>
                    <span>{skill}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {result.recommendations.map((rec, i) => (
              <li key={i} className="text-sm flex gap-2">
                <span className="text-muted-foreground">{i + 1}.</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
