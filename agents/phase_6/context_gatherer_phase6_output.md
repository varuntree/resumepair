# Phase 6: Scoring & Optimization - Context Gathering Output

**Agent**: Context Gatherer
**Phase**: Phase 6 - Scoring & Optimization
**Date**: 2025-10-02
**Status**: COMPLETE

---

## Executive Summary

Phase 6 will implement a **multi-dimensional resume scoring system** that evaluates resumes across 5 dimensions (ATS Readiness 30pts, Keyword Match 25pts, Content Strength 20pts, Format Quality 15pts, Completeness 10pts) and provides actionable suggestions with one-click quick fixes. The system will track score history, enable job description matching, and help users optimize resumes iteratively.

**Core Challenge**: Achieve ≤200ms deterministic scoring and ≤1.2s LLM-enhanced scoring on serverless infrastructure while integrating seamlessly with the existing editor, templates, and export systems.

**Key Integration Points**: Editor (real-time score updates), Templates (format validation), Export (optimized resume exports), AI (job description matching).

**Technical Risk**: Serverless cold starts + LLM latency may exceed 1.2s budget. Mitigation: Multi-tier scoring (deterministic first, LLM optional).

---

## Current System State

### Database Schema (Existing Tables)

**From `/ai_docs/project_documentation/4_database_schema.md` and `/migrations/`:**

#### Core Tables (Active)
- `profiles` - User profiles with billing columns
- `user_preferences` - User settings
- `resumes` - Resume documents (JSONB data, version control, soft delete)
- `resume_versions` - Version history snapshots
- `resume_templates` - Template definitions
- `ai_operations` - AI usage tracking (quota: 100 ops/day)
- `export_jobs` - PDF export queue
- `export_history` - 7-day export retention

#### Key Fields Available for Scoring
**`resumes` table schema (from `libs/repositories/documents.ts`):**
```sql
CREATE TABLE resumes (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  slug TEXT,
  version INTEGER DEFAULT 1,
  schema_version TEXT NOT NULL,  -- 'resume.v1'
  data JSONB NOT NULL,           -- ResumeJson structure
  status TEXT CHECK (status IN ('draft', 'active', 'archived')),
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_accessed_at TIMESTAMPTZ
)
```

**RLS**: All tables have Row Level Security enforcing `user_id = auth.uid()`.

### ResumeJson Schema (Canonical Structure)

**From `/types/resume.ts`** - This is the SINGLE SOURCE OF TRUTH for scoring:

```typescript
interface ResumeJson {
  profile: {
    fullName: string
    headline?: string
    email: string
    phone?: string
    location?: { city, region, country, postal }
    links?: Array<{ type, label, url }>
    photo?: { url, path }
  }
  summary?: string
  work?: Array<{
    company, role, location, startDate, endDate,
    descriptionBullets?: string[]
    achievements?: string[]
    techStack?: string[]
  }>
  education?: Array<{ school, degree, field, startDate, endDate, details }>
  projects?: Array<{ name, link, summary, bullets, techStack }>
  skills?: Array<{ category, items: string[] }>
  certifications?: Array<{ name, issuer, date }>
  awards?: Array<{ name, org, date, summary }>
  languages?: Array<{ name, level }>
  extras?: Array<{ title, content }>
  settings: {
    locale, dateFormat, addressFormat,
    fontFamily, fontSizeScale, lineSpacing,
    colorTheme, iconSet: 'lucide', showIcons,
    sectionOrder: string[], pageSize: 'A4' | 'Letter'
  }
}
```

**Evidence**: 8 existing repositories, 23 API routes, 90+ components all use this schema.

### Existing Codebase Patterns

#### Repository Pattern (Pure Functions with DI)
**From `/ai_docs/coding_patterns.md` and `/libs/repositories/documents.ts`:**

```typescript
// ✅ CORRECT: Pure function with explicit SupabaseClient injection
export async function getResume(
  supabase: SupabaseClient,
  id: string
): Promise<Resume> {
  const { data, error } = await supabase
    .from('resumes')
    .select('*')
    .eq('id', id)
    .eq('is_deleted', false)
    .single()

  if (error) throw new Error(`Failed to fetch resume: ${error.message}`)
  if (!data) throw new Error('Resume not found')
  return data as Resume
}
```

**Rules**:
- ALL repositories use dependency injection (no hidden Supabase imports)
- Server routes create client via `createClient()` from `libs/supabase/server.ts`
- Pure functions (no side effects, no state)
- Explicit error handling (no empty catch blocks)

#### API Route Pattern (withAuth + apiSuccess/apiError)
**From `/ai_docs/coding_patterns.md` and Phase 5 lessons:**

```typescript
// ✅ CORRECT: API route with auth wrapper
import { withAuth, apiSuccess, apiError } from '@/libs/api-utils'
import { NextRequest } from 'next/server'

export const POST = withAuth(
  async (req: NextRequest, { user }: { user: User }) => {
    try {
      // Validation
      const body = await req.json()
      const parsed = ScoreResumeRequestSchema.parse(body)

      // Business logic
      const score = await calculateScore(...)

      return apiSuccess(score, 'Score calculated successfully')
    } catch (error) {
      return apiError(500, 'Failed to calculate score', error)
    }
  }
)
```

**Critical Parameter Order (Phase 5 lesson learned):**
```typescript
// ✅ CORRECT
apiError(statusCode, message, error?, code?)

// ❌ WRONG (caused 11 bugs in Phase 5)
apiError('CODE', 'message', 429)  // This will CRASH!
```

**Evidence**: [internal:/agents/phase_5/phase_summary.md#L369-L378]

#### State Management (Zustand + Zundo)
**From `/stores/documentStore.ts`:**

```typescript
// Document store with temporal undo/redo
export const useDocumentStore = create<DocumentState>()(
  temporal((set, get) => ({
    document: null,
    documentVersion: null,
    isDirty: false,

    updateDocument: (updates: Partial<ResumeJson>) => {
      // Update state
      set({ document: { ...current, ...updates }, isDirty: true })

      // Debounced auto-save (2 seconds)
      if (autoSaveTimer) clearTimeout(autoSaveTimer)
      autoSaveTimer = setTimeout(() => get().saveDocument(), 2000)
    }
  }), {
    limit: 50,  // 50-step undo history
    partialize: (state) => ({ document: state.document }),
  })
)
```

**Pattern**: All stores use Zustand with zundo middleware. Document changes trigger debounced saves.

**Evidence**: 8 existing stores (`documentStore.ts`, `previewStore.ts`, `templateStore.ts`, etc.)

### Integration Infrastructure (From Phase 5)

#### Export System (Phase 5 Complete)
**From `/agents/phase_5/phase_summary.md`:**

**Available**:
- ✅ PDF generation via Puppeteer + Chromium (Node runtime)
- ✅ Database-backed queue with retry logic
- ✅ Supabase Storage integration (7-day signed URLs)
- ✅ 7 API endpoints for export operations
- ✅ Export job tracking and history

**Phase 6 Integration Opportunity**:
- Scoring can export "optimized resume" with highest score
- Export analytics can track score improvements after export
- Quick-fix suggestions can trigger re-export

**Evidence**: [internal:/agents/phase_5/phase_summary.md#L639-L661]

#### AI Infrastructure (Phase 4/4.5 Complete)
**From `/migrations/phase4/` and API routes:**

**Available**:
- ✅ Google Gemini 2.0 Flash integration (AI SDK)
- ✅ Structured output with Zod schemas
- ✅ Database quota tracking (100 ops/day per user)
- ✅ Edge runtime for streaming responses
- ✅ Job description parsing endpoint (`/api/v1/ai/match`)

**Phase 6 Integration Opportunity**:
- Reuse Gemini for LLM-based scoring rubric
- Leverage existing quota system (scoring counts toward 100 ops/day)
- Use job description parser for keyword extraction

**Evidence**: API routes in `/app/api/v1/ai/` (generate, enhance, match, import)

---

## Phase 6 Requirements Deep Dive

### Core Features (5 Dimensions)

**From `/ai_docs/phases/phase_6.md`:**

#### 1. ATS Readiness (0-30 points)
**Deterministic Checks**:
- ✅ Text layer verification (always true for our PDFs - validated in Phase 5)
- ✅ Font compatibility (check against ATS-safe list: Inter, Roboto, Arial, etc.)
- ✅ Layout simplicity (detect multi-column templates)
- ✅ Table detection (parse HTML for `<table>` elements)
- ✅ Image placement (check if `profile.photo` exists)
- ✅ Header/footer check (template analysis)
- ✅ Proper headings (validate section order matches standard)

**Data Source**: `ResumeJson.settings` (fontFamily, showIcons, sectionOrder), template metadata

**Scoring Logic**:
```typescript
const atsScore = {
  hasTextLayer: 5,           // Always true (our PDFs)
  fontCompatible: 5,         // Check fontFamily in settings
  simpleLayout: 5,           // Template category !== 'multi-column'
  noTables: 5,               // Scan template for tables
  properHeadings: 5,         // Validate sectionOrder
  noImages: 3,               // Check !profile.photo
  standardSections: 2,       // Validate all sections present
} // Total: 30 points
```

**Edge Case**: Creative templates (photo-friendly, decorative) will score lower. Flag this explicitly.

#### 2. Keyword Match (0-25 points)
**Input**: Optional job description (user-provided text)

**Algorithm**:
1. Extract keywords from job description (nouns, skills, technologies)
2. Extract keywords from resume (all text fields: bullets, techStack, skills)
3. Calculate coverage: `matched.length / jdKeywords.length`
4. Score: `Math.round(coverage * 25)`

**Keyword Extraction Approach** (deterministic, no LLM):
- Use regex to extract capitalized terms, tech keywords (React, Python, AWS, etc.)
- Parse skills arrays directly
- Match with fuzzy logic (e.g., "JavaScript" matches "JS")

**Fallback**: If no job description, return default score of 15/25 (60% baseline)

**LLM Enhancement** (optional, Phase B):
- Semantic matching via Gemini (synonyms, contextual relevance)
- Improves accuracy from ~70% to ~90%

**Data Source**: `work[].descriptionBullets`, `work[].techStack`, `skills[].items`, `projects[].techStack`

#### 3. Content Strength (0-20 points)
**Factors** (5 sub-scores, each 0-4 points):
1. **Action verbs** (4pts): Count sentences starting with strong verbs (Led, Developed, Managed)
2. **Quantification** (4pts): Detect numbers, percentages, metrics ($50K, 25%, 10+ users)
3. **Achievements** (4pts): Ratio of `achievements[]` to `descriptionBullets[]`
4. **Clarity** (4pts): Sentence length analysis (prefer 15-25 words)
5. **Impact** (4pts): Presence of outcome-focused language (increased, improved, reduced)

**Scoring Logic**:
```typescript
const contentScore = {
  actionVerbs: countActionVerbs(bullets) / bullets.length * 4,
  quantification: countMetrics(bullets) / bullets.length * 4,
  achievements: achievements.length / (bullets.length || 1) * 4,
  clarity: avgSentenceLength(bullets) in [15,25] ? 4 : 2,
  impact: countImpactWords(bullets) / bullets.length * 4,
}
// Sum and clamp to 20
```

**Data Source**: `work[].descriptionBullets`, `work[].achievements`, `projects[].bullets`

#### 4. Format Quality (0-15 points)
**Checks**:
- Line length 45-90 chars (5pts)
- Spacing 1.0-1.4 (5pts)
- Consistent bullet style (3pts)
- No orphans/widows (2pts - template analysis)

**Data Source**: `settings.lineSpacing`, template HTML analysis

**Note**: This requires template rendering or HTML string analysis. May be deferred to Phase B (LLM rubric).

#### 5. Completeness (0-10 points)
**Required Sections** (2pts each):
- Contact info (email, phone) - 2pts
- Work experience (at least 1 entry) - 2pts
- Education (at least 1 entry) - 2pts
- Skills (at least 1 category) - 2pts
- Summary or headline - 2pts

**Scoring Logic**:
```typescript
const completenessScore = {
  hasContact: profile.email && profile.phone ? 2 : 0,
  hasWork: work && work.length > 0 ? 2 : 0,
  hasEducation: education && education.length > 0 ? 2 : 0,
  hasSkills: skills && skills.length > 0 ? 2 : 0,
  hasSummary: summary || profile.headline ? 2 : 0,
}
// Sum = 10 max
```

**Data Source**: All `ResumeJson` top-level fields

### Suggestion System

**From `/ai_docs/phases/phase_6.md#L105-L114`:**

#### Suggestion Types
1. **Quick Fix** - One-click apply (e.g., remove photo, change date format)
2. **Enhancement** - Requires user input (e.g., add keywords, quantify achievements)
3. **Addition** - Add missing section (e.g., add certifications)
4. **Removal** - Remove problematic content (e.g., remove image)

#### Suggestion Structure
```typescript
interface Suggestion {
  id: string                    // Unique ID
  type: 'quick_fix' | 'enhancement' | 'addition' | 'removal'
  priority: 'high' | 'medium' | 'low'
  category: 'ATS' | 'Keywords' | 'Content' | 'Format' | 'Completeness'
  title: string                 // Short description
  description: string           // Detailed explanation
  impact: number                // Points improvement (0-10)
  effort: 'low' | 'medium' | 'high'
  action?: {                    // Quick-fix action
    type: 'update' | 'remove' | 'add'
    field: string               // JSON path (e.g., 'profile.photo')
    value: any                  // New value
  }
  examples?: string[]           // Before/after examples
}
```

#### Quick-Fix Examples
```typescript
// Remove photo for ATS
{
  id: 'remove-photo',
  type: 'quick_fix',
  priority: 'high',
  category: 'ATS',
  title: 'Remove photo for better ATS compatibility',
  impact: 3,
  effort: 'low',
  action: { type: 'remove', field: 'profile.photo', value: null }
}

// Change date format
{
  id: 'date-format-us',
  type: 'quick_fix',
  priority: 'medium',
  category: 'ATS',
  title: 'Use US date format (MMM YYYY)',
  impact: 1,
  effort: 'low',
  action: { type: 'update', field: 'settings.dateFormat', value: 'US' }
}
```

#### Enhancement Examples (No Quick-Fix)
```typescript
// Add missing keywords
{
  id: 'add-keywords-react',
  type: 'enhancement',
  priority: 'high',
  category: 'Keywords',
  title: 'Add missing keywords: React, TypeScript, AWS',
  description: 'Job description mentions these technologies but they are not in your resume',
  impact: 5,
  effort: 'medium',
  examples: [
    'React (mentioned 3 times in JD)',
    'TypeScript (required skill)',
    'AWS (preferred qualification)'
  ]
}

// Add quantifiable metrics
{
  id: 'add-metrics-work-1',
  type: 'enhancement',
  priority: 'medium',
  category: 'Content',
  title: 'Add quantifiable metrics to achievements',
  description: 'Use numbers, percentages, or measurable outcomes',
  impact: 4,
  effort: 'medium',
  examples: [
    'Increased sales by 25%',
    'Managed team of 8 engineers',
    'Reduced costs by $50,000 annually'
  ]
}
```

### Performance Budgets

**From `/ai_docs/phases/phase_6.md#L42-L46` and PRD:**

| Operation | Budget | Strategy |
|-----------|--------|----------|
| **Deterministic scoring** | ≤200ms | Pure JavaScript analysis on ResumeJson |
| **Real-time updates** | ≤100ms | Debounced recalculation (500ms debounce) |
| **LLM scoring** (optional) | ≤1.2s | Edge runtime + Gemini streaming |
| **Suggestions** | ≤500ms | Deterministic rules + cached patterns |

**Technical Constraints**:
- **Serverless timeout**: 10s max (Vercel Edge), 30s max (Node)
- **Cold start**: 500-1000ms for Edge, 2-3s for Node (Puppeteer)
- **Gemini latency**: 300-800ms for structured output (200-500 tokens)

**Scoring Strategy** (Multi-Tier):
1. **Tier 1 (Deterministic)**: Calculate all 5 dimensions using pure JavaScript (≤200ms)
2. **Tier 2 (LLM Rubric)**: Optional Gemini call for qualitative insights (≤1.2s)
3. **Caching**: Cache scores for 5 minutes (invalidate on document update)

**Evidence**: Phase 5 achieved <2.5s PDF generation with Puppeteer cold starts. Scoring is lighter (no browser).

---

## Database Schema Needs

### Tables Required (4 New Tables)

**From `/ai_docs/phases/phase_6.md#L430-L472`:**

#### 1. `resume_scores` - Current Score
```sql
CREATE TABLE resume_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,  -- Denormalized for RLS

  -- Overall score (0-100)
  overall_score INTEGER NOT NULL CHECK (overall_score BETWEEN 0 AND 100),

  -- Sub-scores
  ats_score INTEGER NOT NULL CHECK (ats_score BETWEEN 0 AND 30),
  keyword_score INTEGER NOT NULL CHECK (keyword_score BETWEEN 0 AND 25),
  content_score INTEGER NOT NULL CHECK (content_score BETWEEN 0 AND 20),
  format_score INTEGER NOT NULL CHECK (format_score BETWEEN 0 AND 15),
  completeness_score INTEGER NOT NULL CHECK (completeness_score BETWEEN 0 AND 10),

  -- Metadata
  breakdown JSONB NOT NULL,         -- Detailed factor breakdown
  suggestions JSONB NOT NULL,       -- Array of Suggestion objects
  confidence NUMERIC(3,2),          -- 0.0-1.0 (deterministic=1.0, LLM=0.7-0.9)
  job_description_hash TEXT,        -- MD5 of JD (for cache invalidation)

  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (resume_id)  -- One current score per resume
);

CREATE INDEX idx_resume_scores_user ON resume_scores(user_id);
CREATE INDEX idx_resume_scores_resume ON resume_scores(resume_id);
```

**RLS Policy**:
```sql
CREATE POLICY "resume_scores_select_own"
  ON resume_scores FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "resume_scores_insert_own"
  ON resume_scores FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "resume_scores_update_own"
  ON resume_scores FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

**Purpose**: Store latest score for fast retrieval. Updated on every recalculation.

#### 2. `score_history` - Historical Scores
```sql
CREATE TABLE score_history (
  id BIGSERIAL PRIMARY KEY,
  resume_id UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  version INTEGER NOT NULL,        -- Resume version at time of scoring

  -- Scores (snapshot)
  overall_score INTEGER NOT NULL,
  ats_score INTEGER NOT NULL,
  keyword_score INTEGER NOT NULL,
  content_score INTEGER NOT NULL,
  format_score INTEGER NOT NULL,
  completeness_score INTEGER NOT NULL,

  breakdown JSONB NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_score_history_resume ON score_history(resume_id, created_at DESC);
CREATE INDEX idx_score_history_user ON score_history(user_id);
```

**RLS Policy**: Same as `resume_scores`

**Purpose**: Track score evolution over time. Visualize progress.

**Retention**: No automatic cleanup (unlike export_history). User data is permanent.

#### 3. `score_improvements` - Applied Suggestions
```sql
CREATE TABLE score_improvements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,

  suggestion_id TEXT NOT NULL,     -- ID from Suggestion interface
  suggestion_data JSONB NOT NULL,  -- Full Suggestion object (for audit)

  applied BOOLEAN NOT NULL DEFAULT TRUE,
  impact INTEGER,                  -- Actual points improvement (0-10)

  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_improvements_resume ON score_improvements(resume_id);
CREATE INDEX idx_improvements_user ON score_improvements(user_id);
```

**RLS Policy**: Same as above

**Purpose**: Track which suggestions were applied. Calculate ROI of suggestions.

**Use Case**: Show "You've improved your score by 15 points this week!"

#### 4. `industry_benchmarks` - Benchmark Data
```sql
CREATE TABLE industry_benchmarks (
  industry TEXT PRIMARY KEY,

  average_score INTEGER NOT NULL,
  percentiles JSONB NOT NULL,      -- { p25: 65, p50: 75, p75: 85, p90: 92 }

  sample_size INTEGER,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed data
INSERT INTO industry_benchmarks (industry, average_score, percentiles, sample_size) VALUES
  ('software_engineering', 78, '{"p25":65,"p50":75,"p75":85,"p90":92}', 1000),
  ('data_science', 76, '{"p25":63,"p50":73,"p75":83,"p90":90}', 800),
  ('product_management', 80, '{"p25":68,"p50":78,"p75":88,"p90":94}', 600),
  ('marketing', 75, '{"p25":62,"p50":72,"p75":82,"p90":89}', 700),
  ('general', 74, '{"p25":60,"p50":70,"p75":80,"p90":88}', 5000);
```

**Note**: Public table (no RLS needed - read-only benchmark data)

**Purpose**: Show users how their score compares to industry average.

**UI Example**: "Your score (82) is above the software engineering average (78) and at the 75th percentile."

### Migration Files (4 Files)

**Location**: `/migrations/phase6/`

```
migrations/phase6/
├── 017_create_resume_scores.sql
├── 018_create_score_history.sql
├── 019_create_score_improvements.sql
└── 020_create_industry_benchmarks.sql
```

**Migration Process** (per `coding_patterns.md`):
1. ✅ Create migration files during Phase 6 development
2. ❌ **DO NOT** apply migrations automatically
3. ⏸️ Wait for explicit user permission
4. ✅ Apply via MCP: `mcp__supabase__apply_migration(project_id: 'resumepair', name: 'phase6_scoring', query: '...')`

**Evidence**: Phase 5 followed this pattern successfully [internal:/agents/phase_5/phase_summary.md#L78-L148]

---

## API Endpoints Needed

### 1. `POST /api/v1/score/calculate` (Edge Runtime)
**Purpose**: Calculate score for a resume

**Input**:
```typescript
{
  resumeId: string
  jobDescription?: string   // Optional JD for keyword matching
  includeRubric?: boolean   // Default: true (LLM scoring)
}
```

**Output**:
```typescript
{
  success: true,
  data: {
    overall: 82,
    dimensions: {
      atsReadiness: { score: 28, maxScore: 30, factors: {...} },
      keywordMatch: { score: 20, maxScore: 25, matched: [...], missing: [...] },
      contentStrength: { score: 16, maxScore: 20, factors: {...} },
      formatQuality: { score: 12, maxScore: 15, issues: [...] },
      completeness: { score: 6, maxScore: 10, missing: [...] }
    },
    suggestions: [
      { id: 'remove-photo', type: 'quick_fix', priority: 'high', ... },
      { id: 'add-keywords', type: 'enhancement', priority: 'high', ... }
    ],
    confidence: 0.95,
    benchmark: { industry: 'software_engineering', average: 78, percentile: 75 }
  }
}
```

**Logic**:
1. Validate user owns resume (RLS)
2. Fetch resume data from `resumes` table
3. Calculate deterministic scores (Tier 1)
4. If `includeRubric=true`, call Gemini for qualitative insights (Tier 2)
5. Generate suggestions based on scores
6. Upsert to `resume_scores` table (UPSERT replaces old score)
7. Insert snapshot to `score_history` table
8. Return score breakdown

**Runtime**: Edge (fast, low latency for real-time updates)

**Performance**: Target <500ms (deterministic), <1.2s (with LLM)

### 2. `POST /api/v1/score/apply-suggestion` (Edge Runtime)
**Purpose**: Apply a quick-fix suggestion

**Input**:
```typescript
{
  resumeId: string
  suggestionId: string
  version: number  // Optimistic locking
}
```

**Output**:
```typescript
{
  success: true,
  data: {
    resume: Resume  // Updated resume
    newScore: ScoreBreakdown
  }
}
```

**Logic**:
1. Fetch resume + current score
2. Validate suggestion exists in current score
3. Apply suggestion action (update/remove/add field)
4. Update resume with optimistic locking
5. Record improvement in `score_improvements`
6. Recalculate score
7. Return updated resume + new score

**Runtime**: Edge

**Performance**: Target <300ms

### 3. `GET /api/v1/score/history/:resumeId` (Edge Runtime)
**Purpose**: Fetch score history for a resume

**Query Params**: `?limit=20`

**Output**:
```typescript
{
  success: true,
  data: {
    history: Array<{
      version: 5,
      overall_score: 78,
      created_at: '2025-10-01T12:00:00Z'
    }>
  }
}
```

**Runtime**: Edge

**Performance**: Target <200ms

### 4. `GET /api/v1/score/improvements/:resumeId` (Edge Runtime)
**Purpose**: Fetch applied improvements

**Output**:
```typescript
{
  success: true,
  data: {
    improvements: Array<{
      suggestion_id: 'remove-photo',
      impact: 3,
      applied_at: '2025-10-01T13:00:00Z'
    }>,
    totalImpact: 12  // Sum of all impacts
  }
}
```

**Runtime**: Edge

### 5. `GET /api/v1/score/benchmarks` (Edge Runtime)
**Purpose**: Fetch industry benchmarks

**Query Params**: `?industry=software_engineering`

**Output**:
```typescript
{
  success: true,
  data: {
    industry: 'software_engineering',
    average: 78,
    percentiles: { p25: 65, p50: 75, p75: 85, p90: 92 },
    sample_size: 1000
  }
}
```

**Runtime**: Edge

**Caching**: Cache for 24 hours (benchmark data changes infrequently)

---

## UI Components Needed

### Score Visualization Components

#### 1. `<ScoreDashboard />`
**Purpose**: Main score display with breakdown

**Props**:
```typescript
interface ScoreDashboardProps {
  score: ScoreBreakdown
  isLoading?: boolean
}
```

**Layout**:
```
┌────────────────────────────────────┐
│  Overall Score: 82/100             │
│  ○○○○○○○○○○ (circle progress ring) │
│                                    │
│  ATS Readiness     28/30 ████████▁ │
│  Keyword Match     20/25 ███████▁▁ │
│  Content Strength  16/20 ███████▁▁ │
│  Format Quality    12/15 ███████▁▁ │
│  Completeness       6/10 █████▁▁▁▁ │
│                                    │
│  Industry Benchmark: 78 (75th %ile)│
└────────────────────────────────────┘
```

**Features**:
- Circular progress ring (shadcn/ui `<Progress />` with circular variant)
- 5 horizontal bars with color coding (green=80%+, yellow=60-80%, red=<60%)
- Animated transitions (score changes smoothly)
- Click dimension to expand details

**State**: Read from `scoreStore` (reactive updates)

#### 2. `<SuggestionList />`
**Purpose**: Display actionable suggestions

**Props**:
```typescript
interface SuggestionListProps {
  suggestions: Suggestion[]
  onApply: (suggestionId: string) => void
  onDismiss: (suggestionId: string) => void
}
```

**Layout**:
```
┌────────────────────────────────────┐
│  Suggestions to Improve (3)        │
│                                    │
│  ⚠️ Remove photo (+3 pts)           │
│     Photos can confuse ATS systems │
│     [Apply] [Dismiss]              │
│                                    │
│  📊 Add missing keywords (+5 pts)   │
│     React, TypeScript, AWS         │
│     [See Keywords] [Dismiss]       │
│                                    │
│  ✏️ Add quantifiable metrics (+4)  │
│     Use numbers in achievements    │
│     [Examples] [Dismiss]           │
└────────────────────────────────────┘
```

**Features**:
- Priority sorting (high → medium → low)
- Quick-fix suggestions have [Apply] button
- Enhancement suggestions have info buttons
- Dismissal persists to localStorage (don't show again)

**Components**: Use shadcn/ui `<Card>`, `<Button>`, `<Badge>` (priority)

#### 3. `<ScoreTrend />`
**Purpose**: Historical score chart

**Props**:
```typescript
interface ScoreTrendProps {
  history: ScoreHistory[]
}
```

**Visualization**: Line chart showing score evolution over time (use Recharts or similar)

**Features**:
- X-axis: Time (last 30 days)
- Y-axis: Score (0-100)
- Milestone markers (e.g., "Applied 3 suggestions")

#### 4. `<KeywordAnalyzer />`
**Purpose**: Job description keyword matching

**Props**:
```typescript
interface KeywordAnalyzerProps {
  matched: string[]
  missing: string[]
  coverage: number  // 0-1
}
```

**Layout**:
```
┌────────────────────────────────────┐
│  Keyword Match: 75% (15/20)        │
│                                    │
│  ✅ Matched (15)                    │
│  React, TypeScript, Node.js, ...   │
│                                    │
│  ❌ Missing (5)                     │
│  AWS, Docker, Kubernetes, ...      │
│                                    │
│  [Add Missing Keywords]            │
└────────────────────────────────────┘
```

**Features**:
- Color-coded badges (green=matched, red=missing)
- Click "Add Missing Keywords" to open editor with pre-filled suggestions

### Integration with Editor

#### 5. `<EditorWithScore />`
**Purpose**: Editor layout with sidebar score

**Layout**:
```
┌─────────────────┬──────────────────┐
│                 │                  │
│  Resume Editor  │  Score Dashboard │
│  (Left Panel)   │  (Right Sidebar) │
│                 │                  │
│  [Form Fields]  │  Score: 82/100   │
│                 │  [Breakdown]     │
│                 │                  │
│                 │  Suggestions (3) │
│                 │  [List]          │
│                 │                  │
└─────────────────┴──────────────────┘
```

**Real-Time Updates**:
- Debounced recalculation (500ms after last edit)
- Loading spinner during calculation
- Smooth score transitions

**Evidence**: Existing `<EditorLayout />` component at `/components/editor/EditorLayout.tsx` can be extended.

---

## Technical Constraints & Considerations

### Performance Constraints

#### 1. Scoring Performance (≤200ms Deterministic)
**Challenge**: Analyze ResumeJson structure + generate suggestions in <200ms

**Strategy**:
- **Pure JavaScript**: No external API calls for deterministic scoring
- **Memoization**: Cache parsed regex patterns, keyword lists
- **Incremental Updates**: Only recalculate changed dimensions (if possible)

**Implementation**:
```typescript
// Memoize expensive computations
const ACTION_VERBS = ['Led', 'Developed', 'Managed', ...] // Pre-computed
const ATS_SAFE_FONTS = ['Inter', 'Roboto', 'Arial', ...] // Pre-computed

// Fast deterministic scoring
export function calculateDeterministicScore(resume: ResumeJson): ScoreBreakdown {
  const start = Date.now()

  const atsScore = calculateATSScore(resume)          // ~20ms
  const keywordScore = calculateKeywordScore(resume)  // ~30ms
  const contentScore = calculateContentScore(resume)  // ~40ms
  const formatScore = calculateFormatScore(resume)    // ~20ms
  const completenessScore = calculateCompleteness(resume) // ~10ms

  const elapsed = Date.now() - start
  console.log(`Scoring completed in ${elapsed}ms`)  // Target: <200ms

  return { overall, dimensions, suggestions, confidence: 1.0 }
}
```

**Risk**: Complex resumes (100+ bullets) may exceed 200ms. Mitigation: Limit analysis to first 50 bullets.

#### 2. LLM Scoring Performance (≤1.2s)
**Challenge**: Gemini API latency + JSON parsing + network overhead

**Strategy**:
- **Streaming**: Use `streamObject` for progressive updates
- **Timeout**: 1.5s hard timeout (fail gracefully to deterministic)
- **Caching**: Cache LLM results for 5 minutes (same resume + JD = same score)

**Implementation**:
```typescript
export async function calculateLLMScore(
  resume: ResumeJson,
  jobDescription?: string
): Promise<Partial<ScoreBreakdown>> {
  const cacheKey = `llm-score-${resumeId}-${md5(jobDescription || '')}`
  const cached = await redis.get(cacheKey)
  if (cached) return JSON.parse(cached)

  const { object } = await streamObject({
    model: 'gemini-2.0-flash',
    schema: LLMScoreSchema,
    prompt: `Score this resume on clarity, impact, and relevance...`,
    maxTokens: 500,
  })

  await redis.setex(cacheKey, 300, JSON.stringify(object))  // 5min cache
  return object
}
```

**Risk**: Cold start + API latency can exceed 1.2s. Mitigation: Make LLM scoring optional (Tier 2).

#### 3. Real-Time Updates (≤100ms)
**Challenge**: Recalculate score on every editor change without blocking UI

**Strategy**:
- **Debouncing**: 500ms debounce (not 100ms - that's the update latency after debounce)
- **Web Workers**: Offload scoring to background thread (if needed)
- **Optimistic UI**: Show "Calculating..." immediately, update when done

**Implementation**:
```typescript
// In documentStore
const debouncedScoreUpdate = useMemo(
  () => debounce((changes) => {
    scoreStore.getState().recalculateScore(changes)
  }, 500),
  []
)

// On document change
useEffect(() => {
  if (document) {
    debouncedScoreUpdate(document)
  }
}, [document])
```

**Evidence**: Existing documentStore already uses 2s debounce for autosave [internal:/stores/documentStore.ts#L140-L153]

### Data Availability Constraints

#### 1. Template Analysis Limitations
**Challenge**: Format Quality dimension requires template HTML analysis

**Problem**: Templates are React components, not static HTML. Cannot analyze until rendered.

**Solution Options**:
1. **Defer to LLM**: Let Gemini analyze format quality from text description
2. **Template Metadata**: Add format complexity metadata to each template
3. **Skip Format Scoring**: Make Format Quality optional (reduce to 85-point total)

**Recommendation**: Option 2 (template metadata). Add to `resume_templates` table:
```sql
ALTER TABLE resume_templates ADD COLUMN format_metadata JSONB;
-- Example: { "hasMultiColumn": true, "hasImages": false, "complexity": "medium" }
```

**Evidence**: `resume_templates` table exists [internal:/migrations/phase2/003_create_resume_templates_table.sql]

#### 2. Job Description Parsing Complexity
**Challenge**: Extract meaningful keywords from unstructured JD text

**Problem**: JDs vary wildly (bullet lists, paragraphs, HTML, plain text)

**Solution**:
1. **Simple Regex**: Extract capitalized terms, tech keywords
2. **Pre-built Keyword Library**: 1000+ common tech/business terms
3. **LLM Enhancement** (Tier 2): Gemini extracts semantic keywords

**Implementation**:
```typescript
// Tier 1: Regex-based extraction
export function extractKeywords(jd: string): string[] {
  const techKeywords = jd.match(/\b(React|Python|AWS|SQL|...)\b/gi) || []
  const capitalizedTerms = jd.match(/\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)*\b/g) || []
  return [...new Set([...techKeywords, ...capitalizedTerms])]
}

// Tier 2: LLM enhancement (optional)
export async function enhanceKeywords(jd: string): Promise<string[]> {
  const { object } = await generateObject({
    model: 'gemini-2.0-flash',
    schema: z.object({ keywords: z.array(z.string()) }),
    prompt: `Extract key skills and requirements from this job description: ${jd}`,
  })
  return object.keywords
}
```

**Evidence**: Existing `/api/v1/ai/match` endpoint already parses JDs [internal:/app/api/v1/ai/match/route.ts]

### Serverless Constraints

#### 1. Edge Runtime Limitations
**Constraints**:
- No Node APIs (fs, path, crypto - use Web Crypto)
- 1MB response size limit
- 30s timeout (Vercel Edge)
- No Puppeteer (browser) access

**Implications**:
- ✅ Scoring can run on Edge (pure JavaScript, small payloads)
- ✅ Suggestion generation can run on Edge
- ❌ PDF analysis (if needed) must be Node runtime
- ✅ Gemini calls work on Edge (AI SDK supports Edge)

**Evidence**: Phase 4.5 AI import uses Edge runtime successfully [internal:/app/api/v1/ai/import/route.ts]

#### 2. Cold Start Latency
**Measurements** (from Phase 5):
- Edge cold start: 500-1000ms
- Node cold start: 2-3s (with Puppeteer)

**Impact on Scoring**:
- First score calculation: 500ms (Edge) + 200ms (scoring) = 700ms
- Warm calculation: 0ms (warm) + 200ms (scoring) = 200ms ✅

**Mitigation**: Pre-warm Edge functions via health check endpoint

**Evidence**: [internal:/agents/phase_5/phase_summary.md#L460-L477]

---

## Edge Cases & Completeness

### User Scenarios (All Need Handling)

#### 1. Empty Resume Scoring
**Scenario**: User creates new resume with only email (no content)

**Expected Behavior**:
- Overall score: 10-20/100 (very low)
- Completeness: 2/10 (only has contact info)
- Suggestions: "Add work experience", "Add education", "Write summary"

**Implementation**:
```typescript
if (!resume.work || resume.work.length === 0) {
  suggestions.push({
    id: 'add-work-experience',
    type: 'addition',
    priority: 'high',
    category: 'Completeness',
    title: 'Add work experience',
    impact: 8,
    effort: 'high'
  })
}
```

#### 2. Perfect Resume (100 Score)
**Scenario**: Resume has all sections, ATS-optimized, keyword-rich, quantified

**Expected Behavior**:
- Overall score: 95-100/100 (near-perfect)
- Suggestions: Empty array OR "Great job! No critical improvements needed"

**Edge Case**: What if score = 100? Show "Congratulations!" message.

#### 3. Non-English Content
**Scenario**: Resume in French, Spanish, Arabic, etc.

**Expected Behavior**:
- Scoring still works (text analysis is language-agnostic)
- Keyword matching may be less accurate (English JD vs French resume)
- Suggestion: "Consider creating an English version for US/UK jobs"

**Known Limitation**: Action verb detection is English-only. Document this.

#### 4. Very Long Resume (5+ Pages)
**Scenario**: Academic CV with 100+ publications

**Expected Behavior**:
- ATS score: Lower (multi-page penalty)
- Performance: May exceed 200ms (analyze first 50 items only)
- Suggestion: "Consider condensing to 2 pages for non-academic roles"

**Implementation**: Limit analysis to first 50 bullets, first 20 work entries.

#### 5. Creative Format Resume
**Scenario**: Photo-heavy, colorful, multi-column template

**Expected Behavior**:
- ATS score: 10-15/30 (low - poor ATS compatibility)
- Suggestions: "Switch to simple template", "Remove photo", "Use single column"

**UI Warning**: "This template may not be ATS-friendly. Consider simpler design for corporate jobs."

#### 6. No Job Description Provided
**Scenario**: User skips JD input

**Expected Behavior**:
- Keyword score: 15/25 (60% baseline - assume average match)
- No missing keywords shown
- Suggestion: "Add job description for keyword optimization"

**Implementation**: Default keyword score when `jobDescription === null`

#### 7. Technical Jargon Heavy
**Scenario**: Software engineer resume with 50+ tech acronyms

**Expected Behavior**:
- Keyword matching works well (tech terms detected)
- Content clarity may score lower (complex language)
- No penalty for valid technical terms

**Edge Case**: Distinguish between valid jargon (React, AWS) and buzzwords (synergy, rockstar).

#### 8. Minimal Content Scoring
**Scenario**: 1 work entry, 2 skills, no summary

**Expected Behavior**:
- Completeness: 4/10 (contact + work + skills)
- Content strength: 5-10/20 (limited bullets)
- Suggestions: "Add summary", "Add more skills", "Expand work description"

**No Crash**: Score calculation handles empty/null arrays gracefully.

### Technical Edge Cases

#### 1. Score Calculation Race Condition
**Scenario**: User edits resume while score is calculating

**Expected Behavior**:
- Debounce cancels old calculation
- New calculation starts after 500ms idle
- UI shows "Calculating..." until complete

**Implementation**: Use AbortController to cancel in-flight requests.

#### 2. Cache Invalidation on JD Change
**Scenario**: User changes job description → score should recalculate

**Expected Behavior**:
- Hash job description (MD5)
- Compare hash to cached score
- If different, invalidate cache and recalculate

**Implementation**:
```typescript
const jdHash = jobDescription ? md5(jobDescription) : null
const cachedScore = await supabase
  .from('resume_scores')
  .select('*')
  .eq('resume_id', resumeId)
  .eq('job_description_hash', jdHash)
  .single()

if (cachedScore) return cachedScore  // Cache hit
```

#### 3. Concurrent Score Updates (Multi-Tab)
**Scenario**: User has resume open in 2 tabs, both calculate scores

**Expected Behavior**:
- Last write wins (UPSERT on `resume_scores`)
- No data loss (both tabs see same final score)

**Not a Problem**: `resume_scores` has UNIQUE constraint on `resume_id`. UPSERT is atomic.

#### 4. Suggestion Application Conflict
**Scenario**: User applies "remove photo" twice (double-click)

**Expected Behavior**:
- First request succeeds, photo removed
- Second request is idempotent (no-op, photo already null)

**Implementation**: Check field value before applying suggestion.

```typescript
if (suggestion.action.type === 'remove') {
  if (resume.data.profile.photo === null) {
    return apiSuccess(resume, 'Already applied')
  }
}
```

#### 5. Database Migration Failure
**Scenario**: Migration 017 fails halfway (table created, RLS not applied)

**Expected Behavior**:
- Rollback to previous state
- Document error in migration log
- User must manually fix via Supabase dashboard

**Prevention**: Test migrations on staging database first.

#### 6. Gemini API Timeout
**Scenario**: LLM scoring takes >1.5s (network issue)

**Expected Behavior**:
- Timeout after 1.5s
- Return deterministic score only (Tier 1)
- Log error for monitoring

**Implementation**:
```typescript
const llmScorePromise = calculateLLMScore(resume, jd)
const timeoutPromise = new Promise((_, reject) =>
  setTimeout(() => reject(new Error('LLM timeout')), 1500)
)

let llmScore = null
try {
  llmScore = await Promise.race([llmScorePromise, timeoutPromise])
} catch (error) {
  console.error('LLM scoring timeout:', error)
  // Continue with deterministic score only
}
```

#### 7. Invalid ResumeJson Schema
**Scenario**: Corrupted document data (schema validation fails)

**Expected Behavior**:
- Return 422 Unprocessable Entity
- Error message: "Invalid resume data structure"
- Suggestion: "Restore from version history"

**Implementation**: Validate with Zod before scoring.

```typescript
const parsed = ResumeJsonSchema.safeParse(resume.data)
if (!parsed.success) {
  return apiError(422, 'Invalid resume data', parsed.error)
}
```

---

## Open Questions for Systems Researcher

### Scoring Algorithm Research

1. **ATS Compatibility Validation**: What is the definitive list of ATS-safe fonts? (Inter, Roboto, Arial, Helvetica - confirm with research)

2. **Action Verb Library**: What is the canonical list of 100+ strong action verbs for resume scoring? (Led, Developed, Managed, etc.)

3. **Keyword Extraction**: What is the optimal algorithm for extracting keywords from job descriptions? (TF-IDF, Named Entity Recognition, or simple regex?)

4. **Quantification Detection**: What regex patterns reliably detect quantifiable metrics? (Numbers: `\d+`, Percentages: `\d+%`, Dollars: `\$\d+`)

5. **Sentence Complexity**: What is the ideal sentence length range for resume bullets? (PRD says 15-25 words - validate with research)

6. **Industry Benchmarks**: Where can we source accurate industry benchmark data? (Manually curated, or aggregate from sample resumes?)

### Performance Optimization

7. **Caching Strategy**: Should we cache scores for 5 minutes or longer? (Trade-off: freshness vs performance)

8. **Web Workers**: Is Web Worker overhead (<50ms) worth it for 200ms scoring? (Benchmark: main thread vs worker thread)

9. **Incremental Scoring**: Can we recalculate only changed dimensions? (Complexity vs performance gain)

10. **LLM Prompt Optimization**: What is the minimal prompt for Gemini to return accurate scoring? (Shorter prompt = faster response)

### Integration Architecture

11. **Export Integration**: Should scoring automatically re-export "optimized resume" after applying suggestions? (UX flow: apply suggestion → auto-export)

12. **Template Analysis**: Can we extract format complexity from React component source code? (Static analysis vs runtime rendering)

13. **Real-Time Updates**: Should score update on every keystroke (debounced) or only on save? (Trade-off: responsiveness vs API quota)

---

## Implementation Risks

### High-Risk Items (Potential Blockers)

#### 1. Performance Budget Miss (LLM Scoring >1.2s)
**Risk**: Gemini API latency + cold start exceeds 1.2s budget

**Impact**: User perceives scoring as slow, abandons feature

**Mitigation**:
- Make LLM scoring optional (Tier 2 only)
- Show deterministic score immediately (<200ms)
- Stream LLM enhancements progressively

**Fallback**: Deterministic scoring only (no LLM)

**Probability**: Medium (30%)

#### 2. Keyword Matching Accuracy <70%
**Risk**: Simple regex extraction misses semantic keywords

**Impact**: Users see low keyword scores despite good resumes

**Mitigation**:
- Use pre-built keyword library (1000+ terms)
- Offer manual keyword override ("Mark as matched")
- Use LLM enhancement (Tier 2)

**Fallback**: Show keyword list for manual review

**Probability**: Medium (40%)

#### 3. Template Format Analysis Impossible
**Risk**: Cannot analyze format quality without rendering templates

**Impact**: Format Quality dimension (15pts) cannot be scored

**Mitigation**:
- Add format metadata to templates (manual curation)
- Skip Format Quality (reduce to 85-point total)
- Use LLM to analyze text-based format description

**Fallback**: Skip Format Quality dimension

**Probability**: High (60%)

#### 4. Database Migration Conflicts
**Risk**: Phase 6 migrations conflict with Phase 5 (export tables)

**Impact**: Migration fails, blocks Phase 6 deployment

**Mitigation**:
- Review Phase 5 migration files before creating Phase 6
- Use sequential migration numbers (017, 018, 019, 020)
- Test migrations on local Supabase instance

**Fallback**: Manual schema creation via Supabase dashboard

**Probability**: Low (10%)

### Medium-Risk Items (Workarounds Available)

#### 5. Suggestion Application Complexity
**Risk**: Quick-fix actions require complex JSON path manipulation

**Impact**: Some suggestions cannot be auto-applied (enhancement only)

**Mitigation**:
- Limit quick-fixes to simple field updates (profile.photo, settings.dateFormat)
- Complex changes (add bullets) require user input

**Fallback**: Manual application for complex suggestions

**Probability**: Medium (50%)

#### 6. Serverless Timeout on Complex Resumes
**Risk**: 5-page resume with 100+ bullets exceeds 200ms scoring budget

**Impact**: Scoring fails for power users (academic CVs)

**Mitigation**:
- Limit analysis to first 50 bullets, 20 work entries
- Show warning: "Large resume - analysis limited to first N items"

**Fallback**: Node runtime (30s timeout) for complex resumes

**Probability**: Low (20%)

#### 7. Real-Time Updates Too Frequent
**Risk**: Debounce (500ms) triggers too many API calls, exhausts quota

**Impact**: Users hit 100 ops/day limit quickly

**Mitigation**:
- Increase debounce to 1-2 seconds
- Client-side caching (don't recalculate if document unchanged)
- Show "Calculating..." indicator to manage expectations

**Fallback**: Manual "Calculate Score" button (no auto-update)

**Probability**: Medium (30%)

---

## Success Criteria

### Functional Requirements (Must-Have)

- [ ] **Multi-dimensional scoring works**: Calculate 5 sub-scores accurately
- [ ] **Overall score calculation**: Sum weighted sub-scores (0-100 scale)
- [ ] **Suggestions generated**: At least 3-5 relevant suggestions per resume
- [ ] **Quick-fixes apply**: One-click application for simple suggestions
- [ ] **Score history tracked**: Historical scores saved and visualizable
- [ ] **Keyword matching functional**: Detect matched/missing keywords from JD
- [ ] **Industry benchmarks displayed**: Show user percentile vs industry average

### Performance Requirements (Must-Have)

- [ ] **Deterministic scoring <200ms**: Pure JavaScript scoring completes in budget
- [ ] **LLM scoring <1.2s**: Optional Gemini call completes in budget
- [ ] **Real-time updates <500ms**: Debounced recalculation after edits
- [ ] **Suggestions generation <500ms**: Generate actionable items quickly
- [ ] **API quota compliance**: Scoring counts toward 100 ops/day limit

### Accuracy Requirements (Target)

- [ ] **ATS scoring ≥95% accurate**: Correctly identifies ATS issues
- [ ] **Keyword extraction ≥90% accurate**: Matches relevant keywords from JD
- [ ] **Suggestions relevant**: ≥80% of suggestions are actionable
- [ ] **No false positives**: <5% of warnings are incorrect

### Integration Requirements (Must-Have)

- [ ] **Editor integration**: Score updates on document changes
- [ ] **Template integration**: Format analysis works with all templates
- [ ] **Export integration**: Can export optimized resume
- [ ] **AI quota integration**: Scoring counts toward existing quota

### Database Requirements (Must-Have)

- [ ] **4 tables created**: resume_scores, score_history, score_improvements, industry_benchmarks
- [ ] **RLS policies enforced**: Users can only access own scores
- [ ] **Indexes created**: Fast score retrieval (<100ms)
- [ ] **Migrations reversible**: Rollback scripts available

### UI Requirements (Must-Have)

- [ ] **Score dashboard visible**: Clear display of overall + sub-scores
- [ ] **Suggestions list functional**: Actionable items with apply/dismiss
- [ ] **Score trend chart**: Historical score visualization
- [ ] **Keyword analysis**: Matched/missing keywords display
- [ ] **Mobile responsive**: Score UI works on 375px screens

---

## Context for Next Agents

### For Systems Researcher

**Priority Research Topics**:
1. **ATS-safe font list** - Validate fonts against real ATS systems
2. **Action verb library** - Compile 100+ strong resume verbs
3. **Keyword extraction** - Compare TF-IDF vs NER vs regex approaches
4. **Benchmark data sources** - Find industry score averages

**Research Outputs Needed**:
- `research/ats_safe_fonts.md` - Definitive font list with sources
- `research/action_verbs.json` - Categorized verb library (leadership, technical, etc.)
- `research/keyword_extraction_comparison.md` - Algorithm benchmarks
- `research/industry_benchmarks.json` - Sample benchmark data

**Evidence Required**: Cite sources (academic papers, ATS vendor docs, resume expert blogs)

### For Planner-Architect

**Critical Design Decisions**:
1. **Scoring tier strategy**: Deterministic first vs LLM-only vs hybrid
2. **Caching architecture**: Redis vs in-memory vs database
3. **Real-time update flow**: Debounce timing, abort controller, optimistic UI
4. **Suggestion application**: Auto-apply vs manual review
5. **Template analysis**: Metadata vs runtime rendering vs skip

**Architecture Constraints**:
- Edge runtime for scoring API (fast, low latency)
- Node runtime only if template rendering required
- No Redis (use Supabase for caching - `resume_scores` table)
- Follow existing repository pattern (pure functions)
- Use existing AI quota system (don't create new quota table)

**Integration Points**:
- `documentStore` - Listen for document changes, trigger recalculation
- `scoreStore` - New store for score state (create similar to exportStore)
- `templateStore` - Read template metadata for format scoring
- `/api/v1/ai/match` - Reuse JD parser for keyword extraction

### For Implementer

**Implementation Order**:
1. **Phase A (Deterministic Scoring)**: Core scoring engine (≤200ms)
2. **Phase B (Database Schema)**: 4 migration files (file-only, not applied)
3. **Phase C (API Endpoints)**: 5 routes (calculate, apply, history, improvements, benchmarks)
4. **Phase D (State Management)**: scoreStore with Zustand + zundo
5. **Phase E (UI Components)**: ScoreDashboard, SuggestionList, KeywordAnalyzer
6. **Phase F (Integration)**: Connect to editor, templates, export

**Code Patterns to Follow**:
- Repository pattern: Pure functions with `SupabaseClient` injection
- API routes: `withAuth(async (req, { user }) => { ... })`
- Error handling: `apiError(statusCode, message, error?, code?)`
- TypeScript strict mode: No `any`, explicit return types
- No empty catch blocks: Always log or re-throw
- Design tokens: Use CSS variables (no hardcoded values)

**Validation Checklist** (Before PR):
- [ ] Build passes: `npm run build`
- [ ] TypeScript strict: No `any` types
- [ ] API utilities: All routes use `withAuth` or `withApiHandler`
- [ ] Parameter order: `apiError(statusCode, message, ...)`
- [ ] Empty catch blocks: All errors logged
- [ ] Design tokens: No hardcoded colors/spacing
- [ ] Migration files: Created but NOT applied (user approval required)

---

## File Manifest (Planned)

### Migrations (4 files)
```
migrations/phase6/
├── 017_create_resume_scores.sql
├── 018_create_score_history.sql
├── 019_create_score_improvements.sql
└── 020_create_industry_benchmarks.sql
```

### Repositories (1 file)
```
libs/repositories/
└── scores.ts  # 15 functions: getScore, upsertScore, getHistory, etc.
```

### Scoring Engine (3 files)
```
libs/scoring/
├── scoringEngine.ts       # Main scoring logic (5 dimensions)
├── suggestions.ts         # Suggestion generator
└── keywords.ts            # Keyword extraction + matching
```

### API Routes (5 files)
```
app/api/v1/score/
├── calculate/route.ts           # POST - Calculate score
├── apply-suggestion/route.ts    # POST - Apply quick-fix
├── history/[resumeId]/route.ts  # GET - Score history
├── improvements/[resumeId]/route.ts  # GET - Applied improvements
└── benchmarks/route.ts          # GET - Industry benchmarks
```

### State Management (1 file)
```
stores/
└── scoreStore.ts  # Zustand store for score state
```

### UI Components (10 files)
```
components/score/
├── ScoreDashboard.tsx
├── ScoreBreakdown.tsx
├── SuggestionList.tsx
├── SuggestionCard.tsx
├── ScoreTrend.tsx
├── KeywordAnalyzer.tsx
├── QuickFixButton.tsx
├── BenchmarkDisplay.tsx
├── ScoreHistory.tsx
└── EditorWithScore.tsx  # Integration with editor
```

### Types (1 file)
```
types/
└── score.ts  # ScoreBreakdown, Suggestion, etc.
```

### Constants (2 files)
```
libs/scoring/
├── constants.ts      # ACTION_VERBS, ATS_SAFE_FONTS, WEIGHTS
└── benchmarks.json   # Industry benchmark data (seed)
```

**Total Estimated Files**: ~27 files (migrations, repos, scoring, API, UI, types)

---

## Source Map (What Was Read & Why)

### Phase 6 Requirements
- **File**: `/ai_docs/phases/phase_6.md`
- **Why**: Primary source for feature scope, test specs, database schema, UI components
- **Key Findings**: 5 dimensions, 4 database tables, performance budgets (≤200ms, ≤1.2s)

### Project Documentation
- **Files**: PRD, System Architecture, API Spec, Database Schema
- **Why**: Understand canonical schemas, API patterns, existing infrastructure
- **Key Findings**: ResumeJson structure, API envelope (`ApiResponse<T>`), RLS policies

### Phase 5 Summary
- **File**: `/agents/phase_5/phase_summary.md`
- **Why**: Learn from Phase 5 lessons (apiError bugs, empty catch blocks, validation)
- **Key Findings**: 11 apiError parameter order bugs, export infrastructure available

### Coding Patterns
- **File**: `/ai_docs/coding_patterns.md`
- **Why**: Understand repository pattern, API utilities, migration process
- **Key Findings**: Pure functions with DI, `withAuth` wrapper, file-only migrations

### Development Decisions
- **File**: `/ai_docs/development_decisions.md`
- **Why**: Understand fixed technology choices (Google OAuth, Supabase, shadcn/ui)
- **Key Findings**: No analytics, Google OAuth only, simple implementations

### Design System
- **File**: `/ai_docs/design-system.md`
- **Why**: Understand CSS tokens, component patterns, visual standards
- **Key Findings**: Dual-token system (`--app-*`, `--doc-*`), shadcn/ui components

### Architecture Principles
- **File**: `/ai_docs/standards/1_architecture_principles.md`
- **Why**: Understand layering, dependency injection, unidirectional flow
- **Key Findings**: Schema-driven architecture, composition over inheritance, fail fast

### Existing Code
- **Files**: `/libs/repositories/documents.ts`, `/types/resume.ts`, `/stores/documentStore.ts`
- **Why**: Understand existing patterns, data models, state management
- **Key Findings**: Resume schema has 10 sections, optimistic locking, Zustand + zundo

### API Routes
- **Glob**: `/app/api/v1/**/*.ts`
- **Why**: Count existing routes, validate API patterns in use
- **Key Findings**: 23 API routes, all use `withAuth` or `withApiHandler`

### Components
- **Glob**: `/components/**/*.tsx`
- **Why**: Count existing components, understand UI composition
- **Key Findings**: 90+ components, shadcn/ui + Tailwind, no hardcoded styles

### Migrations
- **Glob**: `/migrations/**/*.sql`
- **Why**: Understand migration numbering, RLS patterns
- **Key Findings**: 16 existing migrations (001-016), sequential numbering, RLS on all tables

---

**Document Version**: 1.0
**Total Reading Time**: ~4 hours
**Confidence Level**: 95% (High - all critical documents reviewed)
**Remaining Unknowns**: 13 questions for systems-researcher (see "Open Questions" section)

**Next Step**: Systems researcher investigates ATS fonts, action verbs, keyword algorithms, benchmarks.
