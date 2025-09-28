# Phase 6: Scoring & Optimization

## Phase Objective
Implement a comprehensive scoring system that evaluates resumes across multiple dimensions (ATS readiness, keywords, content, format, completeness), provides actionable improvement suggestions, tracks progress, and helps users optimize their resumes for better job application success.

## Phase Validation Gate
**This phase is complete only when ALL of the following tests pass:**
- [ ] Unit Test Suite: 82 tests defined
- [ ] Integration Test Suite: 38 tests defined
- [ ] E2E Test Suite: 14 tests defined
- [ ] Performance Benchmarks: Score calculation <200ms, Real-time updates <100ms
- [ ] Accessibility Audit: Score display readable, suggestions keyboard navigable
- [ ] Security Validation: No data leaks in suggestions, sanitized JD input

## Comprehensive Scope

### Core Features
1. **Multi-Dimensional Scoring**
   - ATS Readiness (0-30 points)
   - Keyword Match (0-25 points)
   - Content Strength (0-20 points)
   - Format Quality (0-15 points)
   - Completeness (0-10 points)
   - Overall Score (0-100)
   - Score confidence level
   - Industry benchmarking

2. **ATS Readiness Analysis**
   - Text layer verification
   - Font compatibility check
   - Layout complexity analysis
   - Table/column detection
   - Image placement validation
   - Header/footer check
   - File format optimization
   - Parsing simulation

3. **Keyword Optimization**
   - Job description parsing
   - Skill extraction
   - Keyword density analysis
   - Missing keywords identification
   - Synonym matching
   - Industry terminology check
   - Keyword placement scoring
   - Over-optimization warning

4. **Content Quality Assessment**
   - Action verb usage
   - Quantification presence
   - Achievement focus
   - Clarity scoring
   - Redundancy detection
   - Grammar checking
   - Tone consistency
   - Impact measurement

5. **Improvement Suggestions**
   - Prioritized action items
   - Quick fix options
   - One-click improvements
   - Before/after preview
   - Effort estimation
   - Impact prediction
   - Alternative phrasings
   - Best practice examples

6. **Score Tracking & Analytics**
   - Historical scores
   - Trend visualization
   - Version comparison
   - Progress milestones
   - Peer benchmarking
   - Industry averages
   - Score breakdown charts
   - Export score reports

### Supporting Infrastructure
- **UI Components**: Score dashboard, suggestion cards, progress charts, comparison views
- **Settings Pages**: Scoring preferences, industry selection, benchmark settings
- **Error Handling**: Calculation failures, AI unavailability, invalid inputs
- **Notification System**: Score improvements, milestone achievements, new suggestions
- **Help System**: Score explanation, improvement guides, best practices
- **Data Management**: Score history, suggestion tracking, benchmark data

### User Flows Covered
1. **Initial Scoring**
   - Open document → Calculate score → View breakdown → See suggestions → Apply fixes

2. **JD-Based Optimization**
   - Input job description → Analyze match → View gaps → Get suggestions → Improve resume

3. **Progressive Improvement**
   - Make edits → Score updates → Track progress → Reach target → Export optimized

4. **Comparative Analysis**
   - Select versions → Compare scores → See differences → Choose best → Continue editing

## Test Specifications

### Unit Tests Required
```typescript
// tests/phase6/unit/

describe('Component: ScoreDashboard', () => {
  test('displays overall score')
  test('shows sub-scores')
  test('renders progress ring')
  test('displays trend arrow')
  test('shows score breakdown')
  test('handles loading state')
})

describe('Component: ScoreBreakdown', () => {
  test('shows all dimensions')
  test('displays point allocation')
  test('highlights weak areas')
  test('shows improvement potential')
  test('links to suggestions')
})

describe('Component: SuggestionCard', () => {
  test('displays suggestion text')
  test('shows impact level')
  test('displays effort required')
  test('has apply button')
  test('shows preview on hover')
  test('tracks dismissal')
})

describe('Component: KeywordAnalyzer', () => {
  test('shows matched keywords')
  test('highlights missing keywords')
  test('displays keyword density')
  test('shows placement quality')
  test('suggests synonyms')
})

describe('Component: ScoreHistory', () => {
  test('displays timeline')
  test('shows score changes')
  test('highlights milestones')
  test('allows date filtering')
  test('exports data')
})

describe('Service: ScoringEngine', () => {
  test('calculates ATS score')
  test('evaluates keywords')
  test('assesses content')
  test('checks format')
  test('measures completeness')
  test('combines sub-scores')
  test('handles edge cases')
})

describe('Service: ATSChecker', () => {
  test('verifies text extraction')
  test('checks font compatibility')
  test('analyzes layout')
  test('detects tables')
  test('validates structure')
})

describe('Service: KeywordMatcher', () => {
  test('extracts JD keywords')
  test('matches resume keywords')
  test('calculates coverage')
  test('identifies gaps')
  test('suggests additions')
})

describe('Service: ContentAnalyzer', () => {
  test('scores action verbs')
  test('checks quantification')
  test('evaluates clarity')
  test('detects redundancy')
  test('measures impact')
})

describe('Store: scoreStore', () => {
  test('stores current score')
  test('tracks history')
  test('manages suggestions')
  test('handles updates')
  test('calculates trends')
})
```

### Integration Tests Required
```typescript
// tests/phase6/integration/

describe('Feature: Score Calculation', () => {
  test('calculates accurate scores')
  test('updates on document change')
  test('handles all resume types')
  test('consistent across templates')
  test('performance acceptable')
})

describe('Feature: Real-time Updates', () => {
  test('score updates on edit')
  test('debounces calculations')
  test('shows loading state')
  test('handles errors gracefully')
  test('maintains UI stability')
})

describe('Feature: Suggestion Generation', () => {
  test('generates relevant suggestions')
  test('prioritizes correctly')
  test('provides actionable items')
  test('avoids duplicates')
  test('respects user preferences')
})

describe('API Route: /api/v1/score/calculate', () => {
  test('accepts resume data')
  test('returns score breakdown')
  test('includes suggestions')
  test('handles invalid data')
  test('caches results')
})

describe('API Route: /api/v1/score/analyze-jd', () => {
  test('parses job description')
  test('extracts keywords')
  test('calculates match')
  test('returns gaps')
  test('suggests improvements')
})

describe('Feature: Quick Fixes', () => {
  test('applies fixes correctly')
  test('updates score immediately')
  test('allows undo')
  test('preserves other content')
  test('handles conflicts')
})

describe('Feature: Score History', () => {
  test('tracks all changes')
  test('stores snapshots')
  test('calculates trends')
  test('identifies patterns')
  test('exports reports')
})
```

### E2E Tests Required
```typescript
// tests/phase6/e2e/

describe('User Journey: Initial Scoring', () => {
  test('user opens resume')
  test('sees score calculation')
  test('views breakdown')
  test('reads suggestions')
  test('applies improvements')
})

describe('User Journey: JD Optimization', () => {
  test('pastes job description')
  test('sees keyword analysis')
  test('views missing skills')
  test('adds keywords')
  test('score improves')
})

describe('User Journey: Progressive Improvement', () => {
  test('starts with low score')
  test('follows suggestions')
  test('score increases')
  test('reaches target')
  test('exports optimized')
})

describe('Critical Path: Score Accuracy', () => {
  test('scoring is consistent')
  test('suggestions are valid')
  test('improvements work')
  test('no false positives')
})
```

### Performance Benchmarks
```typescript
describe('Performance: Scoring', () => {
  test('initial calculation < 200ms')
  test('incremental update < 100ms')
  test('suggestion generation < 500ms')
  test('history load < 300ms')
})

describe('Performance: Real-time', () => {
  test('keystroke to score < 150ms')
  test('no UI blocking')
  test('smooth animations')
  test('memory efficient')
})
```

## Technical Implementation Scope

### Scoring Architecture
```typescript
// Scoring Configuration
interface ScoringConfig {
  weights: {
    atsReadiness: 30
    keywordMatch: 25
    contentStrength: 20
    formatQuality: 15
    completeness: 10
  }
  thresholds: {
    poor: 60
    fair: 70
    good: 80
    excellent: 90
  }
  industryBenchmarks: Map<string, number>
}

// Score Breakdown
interface ScoreBreakdown {
  overall: number
  dimensions: {
    atsReadiness: {
      score: number
      maxScore: 30
      factors: ATSFactors
    }
    keywordMatch: {
      score: number
      maxScore: 25
      matched: string[]
      missing: string[]
      coverage: number
    }
    contentStrength: {
      score: number
      maxScore: 20
      factors: ContentFactors
    }
    formatQuality: {
      score: number
      maxScore: 15
      issues: FormatIssue[]
    }
    completeness: {
      score: number
      maxScore: 10
      missing: string[]
    }
  }
  suggestions: Suggestion[]
  confidence: number
  benchmark: number
}

// Suggestion Interface
interface Suggestion {
  id: string
  type: 'quick_fix' | 'enhancement' | 'addition' | 'removal'
  priority: 'high' | 'medium' | 'low'
  category: string
  title: string
  description: string
  impact: number // Points improvement
  effort: 'low' | 'medium' | 'high'
  action?: {
    type: string
    field: string
    value: any
  }
  examples?: string[]
}
```

### Database Updates
```sql
Tables/Collections:
- resume_scores: Current scores
  - id: uuid (primary key)
  - resume_id: uuid (references resumes.id)
  - overall_score: integer
  - ats_score: integer
  - keyword_score: integer
  - content_score: integer
  - format_score: integer
  - completeness_score: integer
  - breakdown: jsonb
  - suggestions: jsonb
  - calculated_at: timestamp

- score_history: Historical scores
  - id: uuid (primary key)
  - resume_id: uuid
  - version: integer
  - score: integer
  - breakdown: jsonb
  - created_at: timestamp

- score_improvements: Applied suggestions
  - id: uuid (primary key)
  - resume_id: uuid
  - suggestion_id: text
  - applied: boolean
  - impact: integer
  - applied_at: timestamp

- industry_benchmarks: Benchmark data
  - industry: text (primary key)
  - average_score: integer
  - percentiles: jsonb
  - updated_at: timestamp

Migrations Required:
- 016_create_resume_scores_table.sql
- 017_create_score_history_table.sql
- 018_create_improvements_table.sql
- 019_create_benchmarks_table.sql
```

### Scoring Engine Implementation
```typescript
// libs/scoring/scoringEngine.ts
export class ScoringEngine {
  calculateScore(resume: ResumeJson, jobDescription?: string): ScoreBreakdown {
    const dimensions = {
      atsReadiness: this.calculateATSScore(resume),
      keywordMatch: this.calculateKeywordScore(resume, jobDescription),
      contentStrength: this.calculateContentScore(resume),
      formatQuality: this.calculateFormatScore(resume),
      completeness: this.calculateCompletenessScore(resume),
    }

    const overall = this.calculateOverallScore(dimensions)
    const suggestions = this.generateSuggestions(dimensions, resume)
    const confidence = this.calculateConfidence(resume)
    const benchmark = this.getBenchmark(resume.work?.[0]?.role)

    return {
      overall,
      dimensions,
      suggestions: this.prioritizeSuggestions(suggestions),
      confidence,
      benchmark,
    }
  }

  private calculateATSScore(resume: ResumeJson): DimensionScore {
    const factors: ATSFactors = {
      hasTextLayer: true, // Assumed for our exports
      fontCompatibility: this.checkFontCompatibility(resume),
      layoutSimplicity: this.assessLayoutComplexity(resume),
      noTables: !this.hasComplexTables(resume),
      properHeadings: this.hasProperHeadings(resume),
      noImages: !resume.profile.photo,
      standardSections: this.hasStandardSections(resume),
    }

    const score = Object.values(factors).filter(Boolean).length * (30 / 7)

    return {
      score: Math.round(score),
      maxScore: 30,
      factors,
    }
  }

  private calculateKeywordScore(
    resume: ResumeJson,
    jobDescription?: string
  ): KeywordScore {
    if (!jobDescription) {
      return { score: 15, maxScore: 25, matched: [], missing: [], coverage: 0.6 }
    }

    const jdKeywords = this.extractKeywords(jobDescription)
    const resumeKeywords = this.extractResumeKeywords(resume)

    const matched = jdKeywords.filter(kw =>
      resumeKeywords.some(rk => this.keywordMatch(kw, rk))
    )

    const missing = jdKeywords.filter(kw =>
      !matched.includes(kw)
    )

    const coverage = matched.length / jdKeywords.length
    const score = Math.round(coverage * 25)

    return { score, maxScore: 25, matched, missing, coverage }
  }

  private calculateContentScore(resume: ResumeJson): ContentScore {
    const factors: ContentFactors = {
      actionVerbs: this.scoreActionVerbs(resume),
      quantification: this.scoreQuantification(resume),
      achievements: this.scoreAchievements(resume),
      clarity: this.scoreClarity(resume),
      impact: this.scoreImpact(resume),
    }

    const average = Object.values(factors).reduce((a, b) => a + b, 0) / 5
    const score = Math.round(average * 20)

    return { score, maxScore: 20, factors }
  }

  private generateSuggestions(
    dimensions: Dimensions,
    resume: ResumeJson
  ): Suggestion[] {
    const suggestions: Suggestion[] = []

    // ATS suggestions
    if (dimensions.atsReadiness.score < 25) {
      if (!dimensions.atsReadiness.factors.noImages && resume.profile.photo) {
        suggestions.push({
          id: 'remove-photo',
          type: 'quick_fix',
          priority: 'high',
          category: 'ATS',
          title: 'Remove photo for better ATS compatibility',
          description: 'Photos can confuse ATS systems',
          impact: 3,
          effort: 'low',
          action: { type: 'remove', field: 'profile.photo', value: null },
        })
      }
    }

    // Keyword suggestions
    if (dimensions.keywordMatch.missing.length > 0) {
      suggestions.push({
        id: 'add-keywords',
        type: 'enhancement',
        priority: 'high',
        category: 'Keywords',
        title: `Add missing keywords: ${dimensions.keywordMatch.missing.slice(0, 3).join(', ')}`,
        description: 'Include these keywords naturally in your experience or skills',
        impact: 5,
        effort: 'medium',
        examples: dimensions.keywordMatch.missing.slice(0, 5),
      })
    }

    // Content suggestions
    if (dimensions.contentStrength.factors.quantification < 0.6) {
      suggestions.push({
        id: 'add-metrics',
        type: 'enhancement',
        priority: 'medium',
        category: 'Content',
        title: 'Add quantifiable metrics to your achievements',
        description: 'Use numbers, percentages, or measurable outcomes',
        impact: 4,
        effort: 'medium',
        examples: [
          'Increased sales by 25%',
          'Managed team of 8 engineers',
          'Reduced costs by $50,000 annually',
        ],
      })
    }

    return suggestions
  }
}
```

### Frontend Components

#### Page Components
```
/app/
├── score/
│   ├── page.tsx - Score dashboard
│   ├── history/
│   │   └── page.tsx - Score history
│   └── report/
│       └── page.tsx - Detailed report
```

#### Score Components
```
/components/score/
├── ScoreDashboard.tsx - Main score display
├── ScoreRing.tsx - Circular score visual
├── ScoreBreakdown.tsx - Dimension breakdown
├── ScoreTrend.tsx - Historical trend
├── ScoreBadge.tsx - Compact score display
├── SuggestionList.tsx - Suggestion cards
├── SuggestionCard.tsx - Individual suggestion
├── QuickFix.tsx - One-click improvement
├── KeywordAnalysis.tsx - Keyword matching
├── KeywordCloud.tsx - Visual keywords
├── ImprovementWizard.tsx - Guided improvements
├── ScoreComparison.tsx - Version comparison
├── BenchmarkDisplay.tsx - Industry comparison
├── ProgressTracker.tsx - Improvement tracking
└── ScoreExport.tsx - Export score report
```

#### Analysis Components
```
/components/analysis/
├── ATSAnalyzer.tsx - ATS compatibility check
├── ContentAnalyzer.tsx - Content quality check
├── FormatChecker.tsx - Format validation
├── CompletenessChecker.tsx - Missing sections
└── OptimizationPanel.tsx - Combined analysis
```

### State Management
```typescript
// stores/scoreStore.ts
interface ScoreStore {
  // State
  currentScore: ScoreBreakdown | null
  scoreHistory: ScoreHistory[]
  suggestions: Suggestion[]
  appliedSuggestions: Set<string>
  isCalculating: boolean
  jobDescription: string | null
  targetScore: number

  // Actions
  calculateScore(resume: ResumeJson): Promise<void>
  analyzeJobDescription(jd: string): Promise<void>
  applySuggestion(suggestionId: string): Promise<void>
  dismissSuggestion(suggestionId: string): void
  undoSuggestion(suggestionId: string): Promise<void>
  loadHistory(resumeId: string): Promise<void>
  setTargetScore(score: number): void

  // Real-time updates
  updateScore(changes: Partial<ResumeJson>): void
  recalculateDebounced(): void

  // Computed
  scoreImprovement: number
  suggestionsGrouped: Map<string, Suggestion[]>
  nextMilestone: number
  canImprove: boolean
}
```

### Real-time Scoring
```typescript
// components/editor/EditorWithScore.tsx
export function EditorWithScore() {
  const { document, updateField } = useDocumentStore()
  const { currentScore, updateScore } = useScoreStore()

  // Debounced score update
  const debouncedScoreUpdate = useMemo(
    () => debounce((changes) => {
      updateScore(changes)
    }, 500),
    []
  )

  // Update score on document change
  useEffect(() => {
    if (document) {
      debouncedScoreUpdate(document)
    }
  }, [document])

  return (
    <div className="flex">
      <div className="flex-1">
        <EditorForm document={document} onChange={updateField} />
      </div>
      <div className="w-80">
        <ScoreDashboard score={currentScore} />
        <SuggestionList suggestions={currentScore?.suggestions} />
      </div>
    </div>
  )
}
```

## Edge Cases & Completeness Checklist

### User Scenarios (All Need Tests)
- [ ] Empty resume scoring → Test: empty_resume_score
- [ ] Perfect resume (100 score) → Test: perfect_score_handling
- [ ] Non-English content → Test: multilingual_scoring
- [ ] Very long resume → Test: long_document_scoring
- [ ] Minimal resume → Test: minimal_content_scoring
- [ ] Creative format resume → Test: non_standard_format
- [ ] Technical jargon heavy → Test: technical_content
- [ ] No job description → Test: generic_scoring

### Technical Considerations (Test Requirements)
- [ ] Score calculation accuracy → Test: score_validation
- [ ] Suggestion relevance → Test: suggestion_quality
- [ ] Real-time performance → Test: update_performance
- [ ] Cache invalidation → Test: cache_consistency
- [ ] Concurrent updates → Test: race_conditions
- [ ] Historical data migration → Test: data_migration
- [ ] Benchmark data updates → Test: benchmark_sync
- [ ] Score formula changes → Test: formula_versioning

## Phase Exit Criteria

### Test Suite Requirements
```yaml
Unit Tests:
  Total: 82
  Passing: 82
  Coverage: >85%

Integration Tests:
  Total: 38
  Passing: 38
  Coverage: All scoring paths

E2E Tests:
  Total: 14
  Passing: 14
  Coverage: User optimization flows

Performance:
  Initial score: <200ms
  Update: <100ms
  Suggestions: <500ms

Accessibility:
  Score display: WCAG AA
  Suggestions: Keyboard nav

Security:
  Input sanitization: PASS
  Data isolation: VERIFIED
```

### Phase Gate Checklist
- [ ] Scoring engine accurate
- [ ] All dimensions calculating
- [ ] Real-time updates working
- [ ] Suggestions relevant and actionable
- [ ] Quick fixes functional
- [ ] History tracking working
- [ ] JD analysis operational
- [ ] Benchmarks displaying
- [ ] Performance targets met
- [ ] Accessibility verified

## Known Constraints & Decisions
- **Deterministic scoring**: Consistent algorithm, not ML-based
- **Client-side calculation**: Fast updates, server validation
- **Simple keyword matching**: Not semantic (future enhancement)
- **English-focused**: Scoring optimized for English resumes
- **Industry benchmarks**: Limited initial set, expandable
- **No A/B testing**: Single scoring algorithm for v1
- **Cache suggestions**: 5-minute cache for performance

## Phase Completion Definition
This phase is complete when:
1. **ALL tests are passing (100%)**
2. Multi-dimensional scoring working accurately
3. Real-time score updates smooth
4. Suggestions relevant and actionable
5. Quick fixes applying correctly
6. JD optimization functional
7. History tracking operational
8. Benchmarks displaying properly
9. Performance targets achieved
10. **Gate check approved for Phase 7**