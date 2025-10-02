# Phase 4: AI Integration & Smart Features - Implementation Plan

**Project**: ResumePair
**Phase**: 4 of 8
**Plan Date**: 2025-10-01
**Status**: Ready for Implementation
**Estimated Effort**: 24-30 hours
**Document Version**: 1.0

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Database Migrations](#2-database-migrations)
3. [AI Service Layer](#3-ai-service-layer)
4. [Repository Layer](#4-repository-layer)
5. [API Routes](#5-api-routes)
6. [State Management](#6-state-management)
7. [Component Architecture](#7-component-architecture)
8. [Implementation Sub-Phases](#8-implementation-sub-phases)
9. [Testing Strategy](#9-testing-strategy)
10. [Integration Points](#10-integration-points)
11. [Success Criteria](#11-success-criteria)
12. [Handoff Checklist](#12-handoff-checklist)

---

## 1. Executive Summary

### 1.1 Phase Objectives

Transform ResumePair from manual editor to AI-assisted platform by integrating:

1. **PDF Import & Extraction** - Upload PDF resumes with OCR fallback
2. **AI Resume Parsing** - Convert PDF text to structured ResumeJson
3. **AI Resume Generation** - Zero-to-draft from job description (streaming)
4. **Content Enhancement** - Improve bullets, generate summaries
5. **Job Description Matching** - Keyword extraction, gap analysis
6. **AI Infrastructure** - Rate limiting, cost tracking, quota management

**User Impact**: Time-to-first-draft reduced from ~30 minutes to **<60 seconds**.

### 1.2 Technical Decisions from Research

**PRIMARY RECOMMENDATIONS** (from research dossiers):

| Component | Decision | Rationale |
|-----------|----------|-----------|
| **AI Provider** | Google Gemini 2.0 Flash via AI SDK | Fast, cost-effective, structured outputs |
| **PDF Text Extraction** | unpdf (unjs/unpdf) | Active maintenance, serverless-optimized, zero deps |
| **OCR Fallback** | Tesseract.js v6.0 (client-side) | Distributes compute, progress tracking, no server load |
| **Rate Limiting** | Sliding window (DB-backed) | Precise control, audit trail, multi-tier support |
| **Streaming** | SSE (Server-Sent Events) | Unidirectional, simple, built into AI SDK |
| **Response Caching** | DB table (1-hour TTL) | 30-40% cost reduction, SHA-256 keyed |

**FALLBACK OPTIONS**:
- PDF extraction: pdf-parse (if unpdf fails in production)
- AI provider: Claude 3.5 Haiku (if Gemini rate limits exceeded)

### 1.3 Implementation Strategy (4 Sub-Phases)

**Total: 24 hours across 4 sub-phases**

```
Phase 4A: PDF Import & AI Parsing (6 hours)
  ├─ PDF text extraction (unpdf)
  ├─ OCR setup (Tesseract.js)
  ├─ AI parsing endpoint (POST /api/v1/ai/import)
  └─ Import wizard UI (4-step flow)

Phase 4B: AI Generation & Streaming (7 hours)
  ├─ AI SDK provider setup
  ├─ Generation endpoint (POST /api/v1/ai/generate, SSE)
  ├─ Streaming integration with Phase 3 preview
  └─ Generation UI with progress

Phase 4C: Content Enhancement (5 hours)
  ├─ Enhancement endpoint (POST /api/v1/ai/enhance)
  ├─ Bullet improver, summary generator
  ├─ Enhancement panel UI
  └─ Suggestion cards

Phase 4D: JD Matching & Polish (6 hours)
  ├─ Matching endpoint (POST /api/v1/ai/match)
  ├─ Rate limiting (3/min, 10/10s, 100/day)
  ├─ Quota tracking UI
  └─ Error boundaries & recovery
```

### 1.4 Top 5 Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Gemini API rate limits** | Feature blocked | Medium | Multi-tier rate limiting, Claude fallback |
| **PDF parsing accuracy <90%** | Poor UX | Low | Manual correction UI, confidence scores |
| **Streaming connection drops** | Lost progress | Medium | Save last state, resume capability |
| **Cost overruns** | Budget exceeded | Medium | Strict quotas (100 req/day), response caching |
| **OCR on large PDFs crashes browser** | Failed import | Low | Enforce 10-page limit, Web Workers |

### 1.5 Phase 3 Integration Points

**What Phase 4 Builds On** (from Phase 3 handoff):

1. **Live Preview System** - Existing RAF batching handles streaming AI updates
2. **documentStore** - AI generation writes to existing store, triggers auto-save
3. **Template System** - AI suggestions reference template defaults
4. **Design Tokens** - AI-generated components use `--app-*` tokens
5. **Print CSS** - Already optimized for PDF export (Phase 5 prep)

**No Breaking Changes**: Phase 4 extends, doesn't replace, existing systems.

---

## 2. Database Migrations

### 2.1 Overview

**3 Migrations Required** (files created in `/migrations/phase4/`):

1. `010_create_ai_operations.sql` - AI usage tracking (cost, tokens, duration)
2. `011_create_ai_cache.sql` - Response caching (1-hour TTL)
3. `012_create_user_quotas.sql` - User quota tracking (daily/monthly)

**IMPORTANT**: Migrations are **file-only** until user approval. Apply via Supabase MCP after review.

**Total Storage Impact**: ~20MB/month (50k operations, 500 cache entries)

---

### 2.2 Migration 010: AI Operations Tracking

**File**: `/migrations/phase4/010_create_ai_operations.sql`

**Purpose**: Track all AI operations for cost analysis, performance monitoring, quota enforcement.

```sql
-- ===================================================================
-- AI Operations Table (Cost Tracking + Performance Monitoring)
-- ===================================================================

CREATE TABLE IF NOT EXISTS public.ai_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User & Operation Metadata
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  operation_type TEXT NOT NULL CHECK (operation_type IN ('import', 'generate', 'enhance', 'match')),
  endpoint TEXT NOT NULL,  -- e.g., '/api/v1/ai/generate'
  model TEXT NOT NULL DEFAULT 'gemini-2.0-flash',

  -- Token Usage (from AI SDK)
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER GENERATED ALWAYS AS (input_tokens + output_tokens) STORED,

  -- Cost Tracking (USD)
  cost DECIMAL(10, 6) NOT NULL DEFAULT 0.0,

  -- Performance Metrics
  duration_ms INTEGER NOT NULL,  -- Time from request to completion
  cache_hit BOOLEAN NOT NULL DEFAULT FALSE,

  -- Success/Failure
  success BOOLEAN NOT NULL DEFAULT TRUE,
  error_code TEXT,
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===================================================================
-- Indexes for Fast Queries
-- ===================================================================

-- User lookup (for quota checks)
CREATE INDEX idx_ai_operations_user_created
  ON public.ai_operations(user_id, created_at DESC);

-- Operation type analysis
CREATE INDEX idx_ai_operations_type
  ON public.ai_operations(operation_type, created_at DESC);

-- Cost analysis
CREATE INDEX idx_ai_operations_cost
  ON public.ai_operations(cost DESC);

-- Daily quota queries (partial index for recent data only)
CREATE INDEX idx_ai_operations_recent
  ON public.ai_operations(user_id, created_at DESC)
  WHERE created_at > NOW() - INTERVAL '24 hours';

-- ===================================================================
-- Row Level Security (RLS)
-- ===================================================================

ALTER TABLE public.ai_operations ENABLE ROW LEVEL SECURITY;

-- Users can view their own operations
CREATE POLICY "Users can view own AI operations"
  ON public.ai_operations
  FOR SELECT
  USING (auth.uid() = user_id);

-- Only server can insert (via service role)
CREATE POLICY "Service role can insert AI operations"
  ON public.ai_operations
  FOR INSERT
  WITH CHECK (true);  -- Server context bypasses RLS

-- ===================================================================
-- Cost Calculation Function
-- ===================================================================

CREATE OR REPLACE FUNCTION public.calculate_ai_cost(
  p_input_tokens INTEGER,
  p_output_tokens INTEGER,
  p_model TEXT DEFAULT 'gemini-2.0-flash'
)
RETURNS DECIMAL(10, 6) AS $$
DECLARE
  v_input_cost DECIMAL(10, 6);
  v_output_cost DECIMAL(10, 6);
BEGIN
  -- Gemini 2.0 Flash pricing (as of 2025-10-01)
  -- Input: $0.10 per 1M tokens
  -- Output: $0.40 per 1M tokens

  IF p_model = 'gemini-2.0-flash' OR p_model = 'gemini-2.0-flash-lite' THEN
    v_input_cost := (p_input_tokens::DECIMAL * 0.10) / 1000000;
    v_output_cost := (p_output_tokens::DECIMAL * 0.40) / 1000000;
  ELSE
    -- Unknown model: use default pricing
    v_input_cost := (p_input_tokens::DECIMAL * 0.10) / 1000000;
    v_output_cost := (p_output_tokens::DECIMAL * 0.40) / 1000000;
  END IF;

  RETURN v_input_cost + v_output_cost;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ===================================================================
-- Aggregation View (for analytics)
-- ===================================================================

CREATE OR REPLACE VIEW public.ai_operations_summary AS
SELECT
  user_id,
  DATE_TRUNC('day', created_at) AS date,
  operation_type,
  COUNT(*) AS total_operations,
  SUM(input_tokens) AS total_input_tokens,
  SUM(output_tokens) AS total_output_tokens,
  SUM(cost) AS total_cost,
  AVG(duration_ms) AS avg_duration_ms,
  SUM(CASE WHEN cache_hit THEN 1 ELSE 0 END) AS cache_hits,
  ROUND(
    100.0 * SUM(CASE WHEN cache_hit THEN 1 ELSE 0 END) / COUNT(*),
    2
  ) AS cache_hit_rate_pct
FROM public.ai_operations
GROUP BY user_id, DATE_TRUNC('day', created_at), operation_type;

-- ===================================================================
-- Comments
-- ===================================================================

COMMENT ON TABLE public.ai_operations IS
  'Tracks all AI operations for cost analysis, performance monitoring, and auditing.';

COMMENT ON COLUMN public.ai_operations.cost IS
  'Cost in USD, calculated as: (input_tokens × $0.10 / 1M) + (output_tokens × $0.40 / 1M)';

COMMENT ON FUNCTION public.calculate_ai_cost IS
  'Calculates AI operation cost based on token usage and model pricing (Gemini 2.0 Flash).';

COMMENT ON VIEW public.ai_operations_summary IS
  'Daily aggregation of AI operations per user and operation type.';
```

**Key Design Notes**:
- **Append-only table**: No UPDATEs = no race conditions
- **Composite index**: `(user_id, created_at DESC)` for fast quota checks
- **Partial index**: Only index recent data (<24h) to reduce index size
- **RLS enforced**: Users only see own operations
- **Cost function**: Centralized pricing calculation

---

### 2.3 Migration 011: Response Caching

**File**: `/migrations/phase4/011_create_ai_cache.sql`

**Purpose**: Cache AI responses for duplicate requests (30-40% cost reduction).

```sql
-- ===================================================================
-- AI Response Cache (1-hour TTL, content-addressed)
-- ===================================================================

CREATE TABLE IF NOT EXISTS public.ai_responses_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Cache Key (SHA-256 hash of operation + input)
  request_hash TEXT NOT NULL UNIQUE,

  -- Cached Response (JSONB for flexibility)
  response JSONB NOT NULL,

  -- Metadata
  operation_type TEXT NOT NULL,
  model TEXT NOT NULL DEFAULT 'gemini-2.0-flash',

  -- Cache Statistics
  hit_count INTEGER NOT NULL DEFAULT 0,
  first_hit_at TIMESTAMPTZ,
  last_hit_at TIMESTAMPTZ,

  -- Expiration (1-hour TTL by default)
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===================================================================
-- Indexes for Fast Lookups
-- ===================================================================

-- Primary lookup by hash
CREATE INDEX idx_ai_cache_hash
  ON public.ai_responses_cache(request_hash);

-- Cleanup expired entries
CREATE INDEX idx_ai_cache_expiration
  ON public.ai_responses_cache(expires_at)
  WHERE expires_at > NOW();

-- Most popular cache entries
CREATE INDEX idx_ai_cache_popular
  ON public.ai_responses_cache(hit_count DESC)
  WHERE expires_at > NOW();

-- ===================================================================
-- Auto-Cleanup Function (Delete expired cache entries)
-- ===================================================================

CREATE OR REPLACE FUNCTION public.cleanup_expired_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM public.ai_responses_cache
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===================================================================
-- Scheduled Cleanup (via pg_cron or external cron job)
-- ===================================================================

-- NOTE: pg_cron requires Supabase Pro plan
-- Alternative: Run cleanup via external cron job or API endpoint

-- Uncomment if pg_cron is available:
-- SELECT cron.schedule(
--   'cleanup-ai-cache',
--   '0 * * * *',  -- Every hour
--   $$ SELECT public.cleanup_expired_cache(); $$
-- );

-- ===================================================================
-- RLS Policies (NO RLS - Global cache shared across users)
-- ===================================================================

-- Cache is global (shared across all users) for maximum efficiency
-- No RLS policies needed

-- ===================================================================
-- Comments
-- ===================================================================

COMMENT ON TABLE public.ai_responses_cache IS
  'Global cache for AI responses. Expires after 1 hour. No RLS (shared across users).';

COMMENT ON COLUMN public.ai_responses_cache.request_hash IS
  'SHA-256 hash of (operation_type + input). Used for content-addressed lookup.';

COMMENT ON COLUMN public.ai_responses_cache.hit_count IS
  'Number of times this cached response was served. Useful for analytics.';
```

**Key Design Notes**:
- **No RLS**: Global cache shared across users (safe since inputs are hashed)
- **1-hour TTL**: Balance between cost savings and data freshness
- **Content-addressed**: SHA-256 hash of `(operation_type + input_text)`
- **Hit tracking**: Monitor which cache entries are most valuable
- **Auto-cleanup**: Cron job or external trigger to delete expired entries

---

### 2.4 Migration 012: User Quotas

**File**: `/migrations/phase4/012_create_user_quotas.sql`

**Purpose**: Track user AI quotas (daily/monthly limits, reset times).

```sql
-- ===================================================================
-- User AI Quotas (Daily/Monthly Tracking)
-- ===================================================================

CREATE TABLE IF NOT EXISTS public.user_ai_quotas (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Daily Quota (resets at midnight Pacific Time)
  daily_used INTEGER NOT NULL DEFAULT 0,
  daily_limit INTEGER NOT NULL DEFAULT 100,
  daily_reset_at TIMESTAMPTZ NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '1 day'),

  -- Monthly Quota (resets on 1st of each month)
  monthly_used INTEGER NOT NULL DEFAULT 0,
  monthly_limit INTEGER NOT NULL DEFAULT 500,
  monthly_reset_at TIMESTAMPTZ NOT NULL DEFAULT DATE_TRUNC('month', NOW() + INTERVAL '1 month'),

  -- Cost Tracking
  total_spent DECIMAL(10, 4) NOT NULL DEFAULT 0.0,

  -- Tier (future: free, pro, enterprise)
  quota_tier TEXT NOT NULL DEFAULT 'free',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===================================================================
-- Indexes
-- ===================================================================

-- Lookup by tier (future: for tier-based limits)
CREATE INDEX idx_user_quotas_tier
  ON public.user_ai_quotas(quota_tier);

-- Reset queries
CREATE INDEX idx_user_quotas_daily_reset
  ON public.user_ai_quotas(daily_reset_at)
  WHERE daily_used > 0;

-- ===================================================================
-- Row Level Security (RLS)
-- ===================================================================

ALTER TABLE public.user_ai_quotas ENABLE ROW LEVEL SECURITY;

-- Users can view and update their own quota
CREATE POLICY "Users can view own quota"
  ON public.user_ai_quotas
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own quota"
  ON public.user_ai_quotas
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Server can insert/update quotas
CREATE POLICY "Service role can manage quotas"
  ON public.user_ai_quotas
  FOR ALL
  USING (true);

-- ===================================================================
-- Quota Check Function
-- ===================================================================

CREATE OR REPLACE FUNCTION public.check_user_quota(
  p_user_id UUID
)
RETURNS TABLE (
  can_proceed BOOLEAN,
  daily_remaining INTEGER,
  monthly_remaining INTEGER,
  reset_at TIMESTAMPTZ
) AS $$
DECLARE
  v_quota RECORD;
  v_now TIMESTAMPTZ := NOW();
BEGIN
  -- Get or create quota record
  SELECT * INTO v_quota
  FROM public.user_ai_quotas
  WHERE user_id = p_user_id;

  -- If no quota record, create one
  IF NOT FOUND THEN
    INSERT INTO public.user_ai_quotas (user_id)
    VALUES (p_user_id)
    RETURNING * INTO v_quota;
  END IF;

  -- Check if daily quota needs reset
  IF v_now >= v_quota.daily_reset_at THEN
    UPDATE public.user_ai_quotas
    SET
      daily_used = 0,
      daily_reset_at = (CURRENT_DATE + INTERVAL '1 day'),
      updated_at = v_now
    WHERE user_id = p_user_id
    RETURNING * INTO v_quota;
  END IF;

  -- Check if monthly quota needs reset
  IF v_now >= v_quota.monthly_reset_at THEN
    UPDATE public.user_ai_quotas
    SET
      monthly_used = 0,
      monthly_reset_at = DATE_TRUNC('month', NOW() + INTERVAL '1 month'),
      updated_at = v_now
    WHERE user_id = p_user_id
    RETURNING * INTO v_quota;
  END IF;

  -- Return quota status
  RETURN QUERY SELECT
    (v_quota.daily_used < v_quota.daily_limit AND
     v_quota.monthly_used < v_quota.monthly_limit) AS can_proceed,
    (v_quota.daily_limit - v_quota.daily_used) AS daily_remaining,
    (v_quota.monthly_limit - v_quota.monthly_used) AS monthly_remaining,
    v_quota.daily_reset_at AS reset_at;
END;
$$ LANGUAGE plpgsql;

-- ===================================================================
-- Increment Quota Function
-- ===================================================================

CREATE OR REPLACE FUNCTION public.increment_user_quota(
  p_user_id UUID,
  p_cost DECIMAL DEFAULT 0.0
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.user_ai_quotas (user_id, daily_used, monthly_used, total_spent)
  VALUES (p_user_id, 1, 1, p_cost)
  ON CONFLICT (user_id) DO UPDATE SET
    daily_used = user_ai_quotas.daily_used + 1,
    monthly_used = user_ai_quotas.monthly_used + 1,
    total_spent = user_ai_quotas.total_spent + p_cost,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- ===================================================================
-- Comments
-- ===================================================================

COMMENT ON TABLE public.user_ai_quotas IS
  'Tracks user AI quotas (daily/monthly limits) and total spending.';

COMMENT ON FUNCTION public.check_user_quota IS
  'Check if user can make an AI request. Auto-resets quotas if expired.';

COMMENT ON FUNCTION public.increment_user_quota IS
  'Increment user quota after successful AI operation. Updates daily/monthly/total.';
```

**Key Design Notes**:
- **Auto-reset**: Quotas reset at midnight (daily) or 1st of month (monthly)
- **Upsert pattern**: `ON CONFLICT DO UPDATE` for atomic increment
- **Tier-based**: `quota_tier` column for future free/pro/enterprise plans
- **Cost tracking**: `total_spent` accumulates lifetime cost

---

## 3. AI Service Layer

### 3.1 Overview

**AI Service Architecture**:

```
/libs/ai/
├── provider.ts          # Google Generative AI setup
├── prompts.ts           # Prompt templates (extraction, generation, enhancement)
├── rateLimiter.ts       # Sliding window rate limiter
├── costTracker.ts       # Token counting, cost calculation
├── cacheManager.ts      # Response caching (SHA-256 hashing)
└── types.ts             # Shared types (AIOperation, Usage, etc.)
```

**Design Principles**:
- **Provider agnostic**: Easy to swap Gemini for Claude/GPT
- **Pure functions**: No hidden state, dependency injection
- **Type-safe**: Zod schemas for all inputs/outputs
- **Testable**: Each module independently testable

---

### 3.2 Provider Setup

**File**: `/libs/ai/provider.ts`

**Purpose**: Initialize Google Generative AI provider with AI SDK.

```typescript
// /libs/ai/provider.ts
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { generateObject, streamObject } from 'ai'

// ===================================================================
// Provider Initialization
// ===================================================================

/**
 * Initialize Google Generative AI provider.
 * Fails fast if API key is missing.
 */
function initializeProvider() {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY

  if (!apiKey) {
    throw new Error(
      'GOOGLE_GENERATIVE_AI_API_KEY is required. Set it in .env.local'
    )
  }

  return createGoogleGenerativeAI({ apiKey })
}

// Singleton instance
export const google = initializeProvider()

// ===================================================================
// Model Configuration
// ===================================================================

/**
 * Default model with safety settings for resume content.
 *
 * Safety thresholds set to BLOCK_ONLY_HIGH to prevent
 * over-filtering of professional resume content.
 */
export const model = google('gemini-2.0-flash', {
  safetySettings: [
    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
  ],
})

// ===================================================================
// Re-export AI SDK Functions
// ===================================================================

export { generateObject, streamObject }

// ===================================================================
// Temperature Presets
// ===================================================================

/**
 * Temperature settings by operation type.
 *
 * - Low (0.3): Extraction, parsing (accuracy over creativity)
 * - Medium (0.6): Enhancement, rewriting (balanced)
 * - High (0.7): Generation, creative content
 */
export const TEMPERATURE_PRESETS = {
  extraction: 0.3,  // PDF parsing, data extraction
  enhancement: 0.6, // Bullet improvements, summary rewriting
  generation: 0.7,  // Resume generation from JD
  matching: 0.5,    // Job description analysis
} as const
```

**Key Design Decisions**:
- **Fail fast**: Throw error if API key missing (catches issues early)
- **Safety settings**: Relaxed for professional content (not user-generated)
- **Temperature presets**: Centralized configuration by operation type
- **Singleton pattern**: One provider instance per server process

---

### 3.3 Prompt Templates

**File**: `/libs/ai/prompts.ts`

**Purpose**: Centralized prompt engineering for all AI operations.

```typescript
// /libs/ai/prompts.ts

// ===================================================================
// Prompt Templates
// ===================================================================

/**
 * Build extraction prompt for PDF → ResumeJson parsing.
 *
 * Uses explicit rules to minimize hallucination and maximize accuracy.
 */
export function buildExtractionPrompt(text: string): string {
  return `
You are an expert resume parser. Extract structured resume data from the following text.

STRICT RULES:
1. Only extract information EXPLICITLY stated in the text
2. Do NOT fabricate dates, companies, or achievements
3. Use ISO date format (YYYY-MM-DD) for all dates
4. Preserve exact wording when possible (don't rephrase)
5. Group skills by category (e.g., "Programming Languages", "Tools")
6. Mark confidence level (0-1) for uncertain extractions

TEXT TO PARSE:
${text}

Return a structured ResumeJson object following the schema provided.
  `.trim()
}

/**
 * Build generation prompt for JD → Resume generation.
 *
 * Emphasizes truthfulness, ATS optimization, and professional tone.
 */
export function buildGenerationPrompt(
  jobDescription: string,
  personalInfo: string
): string {
  return `
Create a professional resume tailored to this job description.
Use the personal information provided and generate relevant experience.

JOB DESCRIPTION:
${jobDescription}

PERSONAL INFORMATION:
${personalInfo}

STRICT RULES:
1. TRUTHFULNESS: Never fabricate achievements, companies, or dates
2. QUANTIFICATION: Include metrics only if derivable from provided info
3. KEYWORD MATCHING: Naturally incorporate JD keywords (no stuffing)
4. ACTION VERBS: Start bullets with strong verbs (Led, Architected, Implemented)
5. CONCISENESS: Bullets must be 1-2 lines max (~100 characters)
6. CONSISTENCY: Same tense for all current roles (Present), past roles (Past)
7. ATS OPTIMIZATION: Use standard section headers, avoid graphics/tables

Generate a complete resume following the ResumeJson schema.
  `.trim()
}

/**
 * Build enhancement prompt for bullet point improvement.
 *
 * Focuses on impact, quantification, and clarity.
 */
export function buildEnhancementPrompt(
  bullets: string[],
  context: string
): string {
  return `
Improve these resume bullet points to be more impactful.

CURRENT BULLETS:
${bullets.map((b, i) => `${i + 1}. ${b}`).join('\n')}

CONTEXT:
${context}

For each bullet, suggest improvements that:
1. Start with strong action verbs (avoid "Responsible for", "Helped with")
2. Include quantifiable metrics when possible (%, $, time saved)
3. Show IMPACT and RESULTS (not just tasks)
4. Are concise and clear (1-2 lines max)
5. Remain TRUTHFUL to the original (no fabrication)

Return multiple suggestions per bullet with improvement types.
  `.trim()
}

/**
 * Build matching prompt for JD analysis.
 *
 * Extracts keywords, identifies gaps, calculates match percentage.
 */
export function buildMatchingPrompt(
  resumeJson: string,
  jobDescription: string
): string {
  return `
Analyze how well this resume matches the job description.

RESUME (JSON):
${resumeJson}

JOB DESCRIPTION:
${jobDescription}

Provide:
1. MATCH PERCENTAGE (0-100): Overall fit for the role
2. KEYWORD MATCHES: Skills/technologies from JD present in resume
3. MISSING KEYWORDS: Important skills/technologies NOT in resume
4. GAPS: Experience areas where resume doesn't meet JD requirements
5. SUGGESTIONS: Specific improvements to increase match score

Return structured JSON with these fields.
  `.trim()
}
```

**Key Design Principles**:
- **Explicit constraints**: "STRICT RULES" prevent hallucination
- **Context provision**: Include all relevant info in prompt
- **Structured output**: Always request specific format/schema
- **No fabrication**: Emphasized in every prompt
- **Concise prompts**: Remove verbose fluff to save tokens

---

### 3.4 Cost Tracker

**File**: `/libs/ai/costTracker.ts`

**Purpose**: Calculate costs from token usage, track per-operation costs.

```typescript
// /libs/ai/costTracker.ts
import type { SupabaseClient } from '@supabase/supabase-js'

// ===================================================================
// Types
// ===================================================================

export interface TokenUsage {
  promptTokens: number
  completionTokens: number
  totalTokens: number
}

export interface CostResult {
  inputCost: number   // USD
  outputCost: number  // USD
  totalCost: number   // USD
}

// ===================================================================
// Pricing (Gemini 2.0 Flash - as of 2025-10-01)
// ===================================================================

const PRICING = {
  'gemini-2.0-flash': {
    input: 0.10 / 1_000_000,  // $0.10 per 1M input tokens
    output: 0.40 / 1_000_000, // $0.40 per 1M output tokens
  },
  'gemini-2.0-flash-lite': {
    input: 0.075 / 1_000_000,
    output: 0.030 / 1_000_000,
  },
} as const

// ===================================================================
// Cost Calculation
// ===================================================================

/**
 * Calculate cost from token usage.
 *
 * @param usage - Token usage from AI SDK result
 * @param model - Model name (default: gemini-2.0-flash)
 * @returns Cost breakdown in USD
 */
export function calculateCost(
  usage: TokenUsage,
  model: string = 'gemini-2.0-flash'
): CostResult {
  const pricing = PRICING[model as keyof typeof PRICING] || PRICING['gemini-2.0-flash']

  const inputCost = usage.promptTokens * pricing.input
  const outputCost = usage.completionTokens * pricing.output
  const totalCost = inputCost + outputCost

  return { inputCost, outputCost, totalCost }
}

// ===================================================================
// Usage Logging
// ===================================================================

export interface LogUsageParams {
  supabase: SupabaseClient
  userId: string
  operationType: 'import' | 'generate' | 'enhance' | 'match'
  endpoint: string
  model: string
  usage: TokenUsage
  durationMs: number
  success: boolean
  errorMessage?: string
  cacheHit?: boolean
}

/**
 * Log AI operation to database for tracking and quota management.
 *
 * Calls database function to calculate cost automatically.
 */
export async function logAIUsage(params: LogUsageParams): Promise<void> {
  const {
    supabase,
    userId,
    operationType,
    endpoint,
    model,
    usage,
    durationMs,
    success,
    errorMessage,
    cacheHit = false,
  } = params

  // Calculate cost
  const { totalCost } = calculateCost(usage, model)

  // Insert operation record
  const { error } = await supabase.from('ai_operations').insert({
    user_id: userId,
    operation_type: operationType,
    endpoint,
    model,
    input_tokens: usage.promptTokens,
    output_tokens: usage.completionTokens,
    cost: totalCost,
    duration_ms: durationMs,
    success,
    error_code: success ? null : 'AI_OPERATION_FAILED',
    error_message: errorMessage,
    cache_hit: cacheHit,
  })

  if (error) {
    console.error('[Cost Tracker] Failed to log operation:', error)
    // Don't throw: logging failure shouldn't break AI operations
  }

  // Increment user quota (only if successful)
  if (success) {
    await supabase.rpc('increment_user_quota', {
      p_user_id: userId,
      p_cost: totalCost,
    })
  }
}
```

**Key Design Notes**:
- **Centralized pricing**: Single source of truth for model costs
- **Automatic logging**: Called by all AI endpoints
- **Non-blocking**: Logging failures don't break AI operations
- **Quota integration**: Calls `increment_user_quota` on success

---

### 3.5 Cache Manager

**File**: `/libs/ai/cacheManager.ts`

**Purpose**: SHA-256-based response caching for duplicate requests.

```typescript
// /libs/ai/cacheManager.ts
import { createHash } from 'crypto'
import type { SupabaseClient } from '@supabase/supabase-js'

// ===================================================================
// Types
// ===================================================================

export interface CacheOptions {
  ttlSeconds?: number  // Default: 3600 (1 hour)
}

// ===================================================================
// Hash Generation (Content-Addressed)
// ===================================================================

/**
 * Generate SHA-256 hash for request (operation + input).
 *
 * Hash includes:
 * - Operation type (import, generate, enhance, match)
 * - Canonicalized input (sorted keys, trimmed values)
 *
 * @returns 64-character hex string
 */
export function hashRequest(
  operationType: string,
  input: Record<string, any>
): string {
  // Canonicalize input (deterministic key order, trim strings)
  const canonical = JSON.stringify(
    { operation: operationType, input },
    Object.keys(input).sort()  // Deterministic key order
  )

  return createHash('sha256').update(canonical).digest('hex')
}

// ===================================================================
// Cache Lookup
// ===================================================================

/**
 * Check if cached response exists and is still valid.
 *
 * @returns Cached response or null if miss/expired
 */
export async function getCachedResponse<T = any>(
  supabase: SupabaseClient,
  requestHash: string
): Promise<T | null> {
  const { data, error } = await supabase
    .from('ai_responses_cache')
    .select('*')
    .eq('request_hash', requestHash)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (error || !data) {
    return null  // Cache miss
  }

  // Increment hit count (fire-and-forget)
  supabase
    .from('ai_responses_cache')
    .update({
      hit_count: data.hit_count + 1,
      last_hit_at: new Date().toISOString(),
    })
    .eq('id', data.id)
    .then()  // Don't await

  return data.response as T
}

// ===================================================================
// Cache Storage
// ===================================================================

/**
 * Store AI response in cache with TTL.
 *
 * Uses upsert to handle duplicate hashes (e.g., concurrent requests).
 */
export async function cacheResponse(
  supabase: SupabaseClient,
  requestHash: string,
  response: any,
  operationType: string,
  options: CacheOptions = {}
): Promise<void> {
  const ttlSeconds = options.ttlSeconds || 3600  // 1 hour default
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000)

  const { error } = await supabase
    .from('ai_responses_cache')
    .upsert({
      request_hash: requestHash,
      response,
      operation_type: operationType,
      expires_at: expiresAt.toISOString(),
      hit_count: 0,
      first_hit_at: null,
      last_hit_at: null,
    }, {
      onConflict: 'request_hash',  // Update if exists
    })

  if (error) {
    console.error('[Cache Manager] Failed to store response:', error)
    // Don't throw: caching is optional, failures shouldn't break requests
  }
}

// ===================================================================
// Cache Invalidation
// ===================================================================

/**
 * Invalidate cache entries for a specific operation type.
 *
 * Use when AI prompt changes (e.g., prompt version bump).
 */
export async function invalidateCache(
  supabase: SupabaseClient,
  operationType: string
): Promise<void> {
  const { error } = await supabase
    .from('ai_responses_cache')
    .delete()
    .eq('operation_type', operationType)

  if (error) {
    throw new Error(`Failed to invalidate cache: ${error.message}`)
  }
}
```

**Key Design Notes**:
- **Content-addressed**: SHA-256 hash ensures identical inputs get cached
- **1-hour TTL**: Balance between cost savings and freshness
- **Upsert pattern**: Handle concurrent requests safely
- **Fire-and-forget hit tracking**: Don't block on counter increment
- **Non-blocking errors**: Cache failures don't break requests

---

### 3.6 Rate Limiter

**File**: `/libs/ai/rateLimiter.ts`

**Purpose**: Sliding window rate limiter (3/min soft, 10/10s hard, 100/day).

```typescript
// /libs/ai/rateLimiter.ts
import type { SupabaseClient } from '@supabase/supabase-js'

// ===================================================================
// Types
// ===================================================================

export interface RateLimitConfig {
  perMinute: number      // Soft limit (warning only)
  perTenSeconds: number  // Hard limit (blocking)
  perDay: number         // Daily quota
}

export interface RateLimitResult {
  allowed: boolean
  tier: 'soft' | 'hard' | 'quota'
  limit: number
  remaining: number
  resetAt: Date
  retryAfter?: number  // Seconds until retry allowed
  warning?: string     // For soft limits
}

// ===================================================================
// Default Configuration
// ===================================================================

export const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  perMinute: 3,
  perTenSeconds: 10,
  perDay: 100,
}

// ===================================================================
// Rate Limit Check (Sliding Window Algorithm)
// ===================================================================

/**
 * Check if user can make an AI request.
 *
 * Uses sliding window algorithm with three enforcement tiers:
 * 1. Hard limit (10 req/10s) - Blocking
 * 2. Soft limit (3 req/min) - Warning only
 * 3. Daily quota (100 req/day) - Blocking
 *
 * Logs request to database for future checks.
 *
 * @param supabase - Supabase client (uses service role for inserts)
 * @param userId - User ID
 * @param endpoint - API endpoint (for per-endpoint limits)
 * @param config - Rate limit configuration
 * @returns Rate limit result with allow/deny + metadata
 */
export async function checkRateLimit(
  supabase: SupabaseClient,
  userId: string,
  endpoint: string,
  config: RateLimitConfig = DEFAULT_RATE_LIMIT
): Promise<RateLimitResult> {
  const now = new Date()

  // ---------------------------------------------------------------
  // Tier 1: Hard Limit (10 req/10s) - Most restrictive, check first
  // ---------------------------------------------------------------
  const tenSecondsAgo = new Date(now.getTime() - 10_000)

  const { count: countTenSec, error: errorTenSec } = await supabase
    .from('ai_request_log')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('endpoint', endpoint)
    .gte('timestamp', tenSecondsAgo.toISOString())

  if (errorTenSec) {
    throw new Error(`Rate limit check failed: ${errorTenSec.message}`)
  }

  if (countTenSec >= config.perTenSeconds) {
    return {
      allowed: false,
      tier: 'hard',
      limit: config.perTenSeconds,
      remaining: 0,
      resetAt: new Date(now.getTime() + 10_000),
      retryAfter: 10,
    }
  }

  // ---------------------------------------------------------------
  // Tier 2: Soft Limit (3 req/min) - Warning, not blocking
  // ---------------------------------------------------------------
  const oneMinuteAgo = new Date(now.getTime() - 60_000)

  const { count: countOneMin, error: errorOneMin } = await supabase
    .from('ai_request_log')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('endpoint', endpoint)
    .gte('timestamp', oneMinuteAgo.toISOString())

  if (errorOneMin) {
    throw new Error(`Rate limit check failed: ${errorOneMin.message}`)
  }

  const softLimitWarning =
    countOneMin >= config.perMinute
      ? `You've made ${countOneMin} requests in the last minute. Consider slowing down.`
      : undefined

  // ---------------------------------------------------------------
  // Tier 3: Daily Quota (100 req/day) - Blocking
  // ---------------------------------------------------------------
  const oneDayAgo = new Date(now.getTime() - 86_400_000)

  const { count: countOneDay, error: errorOneDay } = await supabase
    .from('ai_request_log')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('timestamp', oneDayAgo.toISOString())

  if (errorOneDay) {
    throw new Error(`Rate limit check failed: ${errorOneDay.message}`)
  }

  if (countOneDay >= config.perDay) {
    return {
      allowed: false,
      tier: 'quota',
      limit: config.perDay,
      remaining: 0,
      resetAt: new Date(now.getTime() + 86_400_000),
      retryAfter: 86400,  // 24 hours
    }
  }

  // ---------------------------------------------------------------
  // All checks passed: Log request and return success
  // ---------------------------------------------------------------
  const { error: insertError } = await supabase
    .from('ai_request_log')
    .insert({
      user_id: userId,
      endpoint,
      timestamp: now.toISOString(),
    })

  if (insertError) {
    throw new Error(`Failed to log request: ${insertError.message}`)
  }

  return {
    allowed: true,
    tier: 'hard',  // Report against most restrictive tier
    limit: config.perTenSeconds,
    remaining: config.perTenSeconds - countTenSec - 1,
    resetAt: new Date(now.getTime() + 10_000),
    warning: softLimitWarning,
  }
}
```

**Key Design Notes**:
- **Sliding window**: No boundary edge cases (precise rate control)
- **Multi-tier**: Soft limit (warning) + hard limit (blocking) + quota
- **Database-backed**: No external dependencies (Redis optional at scale)
- **Append-only**: No UPDATEs = no race conditions

---

## 4. Repository Layer

### 4.1 Overview

**3 Repository Modules** (pure functions with DI):

1. `/libs/repositories/aiOperations.ts` - AI operation CRUD
2. `/libs/repositories/aiCache.ts` - Cache lookup/storage
3. `/libs/repositories/rateLimit.ts` - Rate limit checks

**Design Pattern**: Pure functions with `SupabaseClient` dependency injection (same as Phase 2 documents repository).

---

### 4.2 AI Operations Repository

**File**: `/libs/repositories/aiOperations.ts`

**Purpose**: Create, read, aggregate AI operations.

```typescript
// /libs/repositories/aiOperations.ts
import type { SupabaseClient } from '@supabase/supabase-js'

// ===================================================================
// Types
// ===================================================================

export interface AIOperation {
  id: string
  user_id: string
  operation_type: 'import' | 'generate' | 'enhance' | 'match'
  endpoint: string
  model: string
  input_tokens: number
  output_tokens: number
  total_tokens: number
  cost: number  // USD
  duration_ms: number
  cache_hit: boolean
  success: boolean
  error_code: string | null
  error_message: string | null
  created_at: string
}

export interface UserCostSummary {
  user_id: string
  total_operations: number
  total_cost: number
  total_input_tokens: number
  total_output_tokens: number
  cache_hit_rate: number
  avg_duration_ms: number
}

// ===================================================================
// CRUD Operations
// ===================================================================

/**
 * Get user's AI operations (recent first).
 *
 * @param supabase - Supabase client (user-scoped)
 * @param userId - User ID
 * @param options - Pagination and filters
 * @returns Array of operations
 */
export async function getUserOperations(
  supabase: SupabaseClient,
  userId: string,
  options?: {
    limit?: number
    offset?: number
    operationType?: AIOperation['operation_type']
    startDate?: Date
    endDate?: Date
  }
): Promise<AIOperation[]> {
  let query = supabase
    .from('ai_operations')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (options?.limit) query = query.limit(options.limit)
  if (options?.offset) query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
  if (options?.operationType) query = query.eq('operation_type', options.operationType)
  if (options?.startDate) query = query.gte('created_at', options.startDate.toISOString())
  if (options?.endDate) query = query.lte('created_at', options.endDate.toISOString())

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to fetch operations: ${error.message}`)
  }

  return data
}

// ===================================================================
// Cost Analysis
// ===================================================================

/**
 * Get user's total AI costs for a given period.
 *
 * Aggregates: operations, cost, tokens, cache hit rate, avg duration.
 *
 * @param supabase - Supabase client (user-scoped)
 * @param userId - User ID
 * @param options - Date range and operation type filter
 * @returns Cost summary
 */
export async function getUserCosts(
  supabase: SupabaseClient,
  userId: string,
  options?: {
    startDate?: Date
    endDate?: Date
    operationType?: AIOperation['operation_type']
  }
): Promise<UserCostSummary> {
  let query = supabase
    .from('ai_operations')
    .select('*')
    .eq('user_id', userId)

  if (options?.startDate) {
    query = query.gte('created_at', options.startDate.toISOString())
  }

  if (options?.endDate) {
    query = query.lte('created_at', options.endDate.toISOString())
  }

  if (options?.operationType) {
    query = query.eq('operation_type', options.operationType)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to fetch user costs: ${error.message}`)
  }

  // Aggregate locally (could use database view for better performance)
  const totalOperations = data.length
  const totalCost = data.reduce((sum, op) => sum + parseFloat(String(op.cost)), 0)
  const totalInputTokens = data.reduce((sum, op) => sum + op.input_tokens, 0)
  const totalOutputTokens = data.reduce((sum, op) => sum + op.output_tokens, 0)
  const cacheHits = data.filter(op => op.cache_hit).length
  const avgDuration = totalOperations > 0
    ? data.reduce((sum, op) => sum + op.duration_ms, 0) / totalOperations
    : 0

  return {
    user_id: userId,
    total_operations: totalOperations,
    total_cost: totalCost,
    total_input_tokens: totalInputTokens,
    total_output_tokens: totalOutputTokens,
    cache_hit_rate: totalOperations > 0 ? cacheHits / totalOperations : 0,
    avg_duration_ms: avgDuration,
  }
}

// ===================================================================
// Budget Check
// ===================================================================

/**
 * Check if user is within budget (optional cost cap).
 *
 * @param supabase - Supabase client
 * @param userId - User ID
 * @param monthlyCap - Monthly cost cap in USD (default: $1.00)
 * @returns Budget status
 */
export async function checkBudget(
  supabase: SupabaseClient,
  userId: string,
  monthlyCap: number = 1.0
): Promise<{
  withinBudget: boolean
  spent: number
  remaining: number
}> {
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const summary = await getUserCosts(supabase, userId, {
    startDate: startOfMonth,
  })

  const remaining = monthlyCap - summary.total_cost

  return {
    withinBudget: remaining > 0,
    spent: summary.total_cost,
    remaining: Math.max(0, remaining),
  }
}
```

**Key Functions**:
- `getUserOperations()` - Paginated list with filters
- `getUserCosts()` - Aggregated cost summary
- `checkBudget()` - Monthly budget check

---

## 5. API Routes

### 5.1 Overview

**5 Core AI Endpoints**:

1. `POST /api/v1/ai/import` - Import PDF and parse to ResumeJson
2. `POST /api/v1/ai/generate` - Generate resume from JD (streaming)
3. `POST /api/v1/ai/enhance` - Enhance content (bullets, summary)
4. `POST /api/v1/ai/match` - Match resume against JD
5. `GET /api/v1/ai/quota` - Get user's quota status

**Runtime Split**:
- **Node**: PDF import (requires pdf-parse/unpdf)
- **Edge**: AI generation, enhancement, matching (for streaming)

**Authentication**: All endpoints use `withAuth` wrapper.

**Rate Limiting**: Endpoints use `checkRateLimit()` before AI calls.

---

### 5.2 PDF Import Endpoint

**File**: `/app/api/v1/ai/import/route.ts`

**Purpose**: Upload PDF → extract text → parse with AI → return ResumeJson.

**Runtime**: Node (for PDF parsing)

**Request**:
```typescript
// FormData with 'file' field (PDF binary)
// Content-Type: multipart/form-data
```

**Response**:
```typescript
interface ImportResponse {
  resume: ResumeJson
  confidence: number  // Overall 0-1
  fieldConfidence: Record<string, number>
  ocrUsed: boolean
  extractedText: string  // Raw text for review
}
```

**Code Skeleton** (~150 lines):

```typescript
// /app/api/v1/ai/import/route.ts
import { NextRequest } from 'next/server'
import { withAuth } from '@/libs/api-utils/withAuth'
import { apiSuccess, apiError } from '@/libs/api-utils/responses'
import { createClient } from '@/libs/supabase/server'
import { extractText } from 'unpdf'
import { generateObject } from 'ai'
import { model } from '@/libs/ai/provider'
import { ResumeJsonSchema } from '@/libs/validation/resume'
import { buildExtractionPrompt } from '@/libs/ai/prompts'
import { checkRateLimit } from '@/libs/ai/rateLimiter'
import { logAIUsage } from '@/libs/ai/costTracker'
import { hashRequest, getCachedResponse, cacheResponse } from '@/libs/ai/cacheManager'
import { z } from 'zod'

export const runtime = 'nodejs'  // Required for PDF parsing

// Extended schema with confidence scores
const ParsedResumeSchema = ResumeJsonSchema.extend({
  confidence: z.number().min(0).max(1),
  fieldConfidence: z.record(z.number()),
})

export const POST = withAuth(async (req: NextRequest, { user }) => {
  const startTime = Date.now()
  const supabase = createClient()

  try {
    // ---------------------------------------------------------------
    // 1. Rate Limiting
    // ---------------------------------------------------------------
    const rateLimit = await checkRateLimit(
      supabase,
      user.id,
      '/api/v1/ai/import'
    )

    if (!rateLimit.allowed) {
      return apiError(
        429,
        rateLimit.tier === 'quota'
          ? 'Daily AI quota exceeded (100 requests/day)'
          : 'Rate limit exceeded (10 requests per 10 seconds)',
        { retryAfter: rateLimit.retryAfter }
      )
    }

    // ---------------------------------------------------------------
    // 2. Extract PDF File
    // ---------------------------------------------------------------
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return apiError(400, 'Missing PDF file')
    }

    if (!file.type.includes('pdf')) {
      return apiError(400, 'File must be PDF')
    }

    if (file.size > 10 * 1024 * 1024) {  // 10MB limit
      return apiError(400, 'File too large (max 10MB)')
    }

    // ---------------------------------------------------------------
    // 3. Extract Text from PDF
    // ---------------------------------------------------------------
    const buffer = Buffer.from(await file.arrayBuffer())
    const { totalPages, text } = await extractText(buffer, {
      mergePages: true,
    })

    if (totalPages > 10) {
      return apiError(400, 'PDF has too many pages (max 10)')
    }

    const hasTextLayer = text.trim().length > 50

    if (!hasTextLayer) {
      return apiError(400, 'PDF has no text layer. Use OCR in browser first.')
    }

    // ---------------------------------------------------------------
    // 4. Check Cache (SHA-256 hash of text)
    // ---------------------------------------------------------------
    const requestHash = hashRequest('import', { text })
    const cached = await getCachedResponse(supabase, requestHash)

    if (cached) {
      // Cache hit: Return cached response
      const duration = Date.now() - startTime

      await logAIUsage({
        supabase,
        userId: user.id,
        operationType: 'import',
        endpoint: '/api/v1/ai/import',
        model: 'gemini-2.0-flash',
        usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        durationMs: duration,
        success: true,
        cacheHit: true,
      })

      return apiSuccess(cached, 'Resume imported (cached)')
    }

    // ---------------------------------------------------------------
    // 5. AI Parsing (Gemini 2.0 Flash)
    // ---------------------------------------------------------------
    const result = await generateObject({
      model,
      schema: ParsedResumeSchema,
      prompt: buildExtractionPrompt(text),
      temperature: 0.3,  // Low for accuracy
      maxRetries: 2,
    })

    const duration = Date.now() - startTime

    // ---------------------------------------------------------------
    // 6. Log Usage & Cache Response
    // ---------------------------------------------------------------
    await Promise.all([
      logAIUsage({
        supabase,
        userId: user.id,
        operationType: 'import',
        endpoint: '/api/v1/ai/import',
        model: 'gemini-2.0-flash',
        usage: result.usage,
        durationMs: duration,
        success: true,
        cacheHit: false,
      }),
      cacheResponse(
        supabase,
        requestHash,
        result.object,
        'import',
        { ttlSeconds: 3600 }  // 1 hour
      ),
    ])

    // ---------------------------------------------------------------
    // 7. Return Parsed Resume
    // ---------------------------------------------------------------
    return apiSuccess({
      resume: result.object,
      confidence: result.object.confidence,
      fieldConfidence: result.object.fieldConfidence,
      ocrUsed: false,
      extractedText: text.substring(0, 500),  // First 500 chars for review
    }, 'Resume imported successfully')

  } catch (error: any) {
    console.error('[AI Import] Error:', error)

    // Log failure
    await logAIUsage({
      supabase,
      userId: user.id,
      operationType: 'import',
      endpoint: '/api/v1/ai/import',
      model: 'gemini-2.0-flash',
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      durationMs: Date.now() - startTime,
      success: false,
      errorMessage: error.message,
    })

    return apiError(500, 'Failed to import resume', error.message)
  }
})
```

**Key Integration Points**:
- Rate limiting before AI call
- Response caching (30-40% cost reduction)
- Usage tracking (tokens, cost, duration)
- Zod validation (schema + confidence scores)

---

### 5.3 AI Generation Endpoint (Streaming)

**File**: `/app/api/v1/ai/generate/route.ts`

**Purpose**: Generate resume from job description (streaming via SSE).

**Runtime**: Edge (for streaming)

**Request**:
```typescript
{
  jobDescription: string
  personalInfo: string  // Name, email, summary
}
```

**Response**: SSE stream of ResumeJson chunks

```
data: {"profile":{"fullName":"John Doe"}}

data: {"profile":{"fullName":"John Doe","email":"john@example.com"}}

data: [DONE]
```

**Code Skeleton** (~200 lines):

```typescript
// /app/api/v1/ai/generate/route.ts
import { NextRequest } from 'next/server'
import { withAuth } from '@/libs/api-utils/withAuth'
import { apiError } from '@/libs/api-utils/responses'
import { createClient } from '@/libs/supabase/server'
import { streamObject } from 'ai'
import { model } from '@/libs/ai/provider'
import { ResumeJsonSchema } from '@/libs/validation/resume'
import { buildGenerationPrompt } from '@/libs/ai/prompts'
import { checkRateLimit } from '@/libs/ai/rateLimiter'
import { logAIUsage } from '@/libs/ai/costTracker'

export const runtime = 'edge'  // Required for streaming

export const POST = withAuth(async (req: NextRequest, { user }) => {
  const startTime = Date.now()
  const supabase = createClient()

  try {
    // ---------------------------------------------------------------
    // 1. Rate Limiting
    // ---------------------------------------------------------------
    const rateLimit = await checkRateLimit(
      supabase,
      user.id,
      '/api/v1/ai/generate'
    )

    if (!rateLimit.allowed) {
      return apiError(
        429,
        rateLimit.tier === 'quota'
          ? 'Daily AI quota exceeded (100 requests/day)'
          : 'Rate limit exceeded (10 requests per 10 seconds)',
        { retryAfter: rateLimit.retryAfter }
      )
    }

    // ---------------------------------------------------------------
    // 2. Parse Request Body
    // ---------------------------------------------------------------
    const body = await req.json()
    const { jobDescription, personalInfo } = body

    if (!jobDescription || !personalInfo) {
      return apiError(400, 'Missing required fields')
    }

    // ---------------------------------------------------------------
    // 3. Start Streaming (AI SDK streamObject)
    // ---------------------------------------------------------------
    const result = streamObject({
      model,
      schema: ResumeJsonSchema,
      prompt: buildGenerationPrompt(jobDescription, personalInfo),
      temperature: 0.7,  // Higher for creative content
      onFinish: async ({ usage }) => {
        // Log usage asynchronously (non-blocking)
        const duration = Date.now() - startTime

        await logAIUsage({
          supabase,
          userId: user.id,
          operationType: 'generate',
          endpoint: '/api/v1/ai/generate',
          model: 'gemini-2.0-flash',
          usage,
          durationMs: duration,
          success: true,
          cacheHit: false,
        })
      },
    })

    // ---------------------------------------------------------------
    // 4. Create SSE Stream
    // ---------------------------------------------------------------
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const partialObject of result.partialObjectStream) {
            // Send partial resume as SSE event
            const data = JSON.stringify(partialObject)
            controller.enqueue(encoder.encode(`data: ${data}\n\n`))
          }

          // Signal completion
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        } catch (error: any) {
          console.error('[AI Generate] Stream error:', error)

          // Send error as SSE event
          const errorData = JSON.stringify({ error: error.message })
          controller.enqueue(encoder.encode(`event: error\ndata: ${errorData}\n\n`))
          controller.close()

          // Log failure
          await logAIUsage({
            supabase,
            userId: user.id,
            operationType: 'generate',
            endpoint: '/api/v1/ai/generate',
            model: 'gemini-2.0-flash',
            usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
            durationMs: Date.now() - startTime,
            success: false,
            errorMessage: error.message,
          })
        }
      },
    })

    // ---------------------------------------------------------------
    // 5. Return SSE Response
    // ---------------------------------------------------------------
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',  // Disable nginx buffering
      },
    })

  } catch (error: any) {
    console.error('[AI Generate] Error:', error)
    return apiError(500, 'Failed to generate resume', error.message)
  }
})
```

**Key Integration Points**:
- AI SDK `streamObject` with SSE
- Existing Phase 3 RAF batching handles incremental updates
- `onFinish` callback logs usage asynchronously
- Error events sent via SSE (client can recover)

---

### 5.4 Enhancement Endpoint

**File**: `/app/api/v1/ai/enhance/route.ts`

**Purpose**: Enhance content (bullets, summary, keywords).

**Runtime**: Edge

**Request**:
```typescript
{
  content: string       // Text to enhance
  type: 'bullets' | 'summary' | 'keywords'
  context?: string      // Job description or role context
}
```

**Response**:
```typescript
{
  suggestions: Array<{
    text: string
    improvement: 'action_verb' | 'quantification' | 'clarity' | 'impact'
    confidence: number
  }>
}
```

**Code Skeleton** (~100 lines):

```typescript
// /app/api/v1/ai/enhance/route.ts
import { NextRequest } from 'next/server'
import { withAuth } from '@/libs/api-utils/withAuth'
import { apiSuccess, apiError } from '@/libs/api-utils/responses'
import { createClient } from '@/libs/supabase/server'
import { generateObject } from 'ai'
import { model } from '@/libs/ai/provider'
import { buildEnhancementPrompt } from '@/libs/ai/prompts'
import { checkRateLimit } from '@/libs/ai/rateLimiter'
import { logAIUsage } from '@/libs/ai/costTracker'
import { hashRequest, getCachedResponse, cacheResponse } from '@/libs/ai/cacheManager'
import { z } from 'zod'

export const runtime = 'edge'

const EnhancementSchema = z.object({
  suggestions: z.array(z.object({
    text: z.string(),
    improvement: z.enum(['action_verb', 'quantification', 'clarity', 'impact']),
    confidence: z.number().min(0).max(1),
  })),
})

export const POST = withAuth(async (req: NextRequest, { user }) => {
  const startTime = Date.now()
  const supabase = createClient()

  try {
    // Rate limiting
    const rateLimit = await checkRateLimit(
      supabase,
      user.id,
      '/api/v1/ai/enhance'
    )

    if (!rateLimit.allowed) {
      return apiError(429, 'Rate limit exceeded')
    }

    // Parse request
    const body = await req.json()
    const { content, type, context = '' } = body

    if (!content || !type) {
      return apiError(400, 'Missing required fields')
    }

    // Check cache
    const requestHash = hashRequest('enhance', { content, type, context })
    const cached = await getCachedResponse(supabase, requestHash)

    if (cached) {
      await logAIUsage({
        supabase,
        userId: user.id,
        operationType: 'enhance',
        endpoint: '/api/v1/ai/enhance',
        model: 'gemini-2.0-flash',
        usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        durationMs: Date.now() - startTime,
        success: true,
        cacheHit: true,
      })

      return apiSuccess(cached, 'Content enhanced (cached)')
    }

    // AI enhancement
    const bullets = content.split('\n').filter(b => b.trim())
    const result = await generateObject({
      model,
      schema: EnhancementSchema,
      prompt: buildEnhancementPrompt(bullets, context),
      temperature: 0.6,
      maxRetries: 2,
    })

    const duration = Date.now() - startTime

    // Log and cache
    await Promise.all([
      logAIUsage({
        supabase,
        userId: user.id,
        operationType: 'enhance',
        endpoint: '/api/v1/ai/enhance',
        model: 'gemini-2.0-flash',
        usage: result.usage,
        durationMs: duration,
        success: true,
        cacheHit: false,
      }),
      cacheResponse(supabase, requestHash, result.object, 'enhance'),
    ])

    return apiSuccess(result.object, 'Content enhanced successfully')

  } catch (error: any) {
    console.error('[AI Enhance] Error:', error)

    await logAIUsage({
      supabase,
      userId: user.id,
      operationType: 'enhance',
      endpoint: '/api/v1/ai/enhance',
      model: 'gemini-2.0-flash',
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      durationMs: Date.now() - startTime,
      success: false,
      errorMessage: error.message,
    })

    return apiError(500, 'Failed to enhance content', error.message)
  }
})
```

---

### 5.5 Job Description Matching Endpoint

**File**: `/app/api/v1/ai/match/route.ts`

**Purpose**: Match resume against job description.

**Request**:
```typescript
{
  resumeId: string         // Resume ID from database
  jobDescription: string
}
```

**Response**:
```typescript
{
  matchPercentage: number  // 0-100
  matchedKeywords: string[]
  missingKeywords: string[]
  gaps: string[]
  suggestions: string[]
}
```

**Code Skeleton** (~120 lines, similar to enhance endpoint).

---

### 5.6 Quota Status Endpoint

**File**: `/app/api/v1/ai/quota/route.ts`

**Purpose**: Get user's current quota status.

**Request**: None (GET)

**Response**:
```typescript
{
  daily: {
    used: number
    limit: number
    remaining: number
    resetAt: string  // ISO timestamp
  },
  monthly: {
    used: number
    limit: number
    remaining: number
    resetAt: string
  },
  totalSpent: number  // USD
}
```

**Code Skeleton** (~50 lines):

```typescript
// /app/api/v1/ai/quota/route.ts
import { NextRequest } from 'next/server'
import { withAuth } from '@/libs/api-utils/withAuth'
import { apiSuccess, apiError } from '@/libs/api-utils/responses'
import { createClient } from '@/libs/supabase/server'

export const runtime = 'edge'

export const GET = withAuth(async (req: NextRequest, { user }) => {
  const supabase = createClient()

  try {
    // Call database function to get quota status
    const { data, error } = await supabase.rpc('check_user_quota', {
      p_user_id: user.id,
    })

    if (error) {
      throw new Error(`Quota check failed: ${error.message}`)
    }

    // Get total spent
    const { data: quotaData } = await supabase
      .from('user_ai_quotas')
      .select('total_spent, daily_limit, monthly_limit, daily_used, monthly_used, daily_reset_at, monthly_reset_at')
      .eq('user_id', user.id)
      .single()

    return apiSuccess({
      daily: {
        used: quotaData?.daily_used || 0,
        limit: quotaData?.daily_limit || 100,
        remaining: data.daily_remaining,
        resetAt: quotaData?.daily_reset_at,
      },
      monthly: {
        used: quotaData?.monthly_used || 0,
        limit: quotaData?.monthly_limit || 500,
        remaining: data.monthly_remaining,
        resetAt: quotaData?.monthly_reset_at,
      },
      totalSpent: parseFloat(quotaData?.total_spent || '0'),
    })

  } catch (error: any) {
    console.error('[Quota] Error:', error)
    return apiError(500, 'Failed to fetch quota', error.message)
  }
})
```

---

## 6. State Management

### 6.1 Overview

**2 New Zustand Stores**:

1. `/stores/aiStore.ts` - AI operations, suggestions, quota tracking
2. `/stores/importStore.ts` - PDF import wizard state

**Integration**: Both stores work with existing `documentStore` from Phase 2.

---

### 6.2 AI Store

**File**: `/stores/aiStore.ts`

**Purpose**: Track AI operations, suggestions, streaming state.

```typescript
// /stores/aiStore.ts
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

// ===================================================================
// Types
// ===================================================================

export interface Suggestion {
  id: string
  type: 'bullet' | 'summary' | 'keyword'
  original: string
  suggestion: string
  improvement: string
  confidence: number
  applied: boolean
}

export interface AIOperation {
  id: string
  operationType: 'import' | 'generate' | 'enhance' | 'match'
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress?: number  // 0-100 for streaming
  error?: string
}

export interface QuotaStatus {
  daily: {
    used: number
    limit: number
    remaining: number
    resetAt: Date
  }
  monthly: {
    used: number
    limit: number
    remaining: number
    resetAt: Date
  }
  totalSpent: number
}

// ===================================================================
// Store Interface
// ===================================================================

interface AIStore {
  // State
  operations: AIOperation[]
  currentOperation: AIOperation | null
  quota: QuotaStatus | null
  suggestions: Suggestion[]
  isProcessing: boolean
  error: Error | null
  streamBuffer: string

  // Actions
  startOperation(type: AIOperation['operationType']): void
  updateOperationProgress(progress: number): void
  completeOperation(): void
  failOperation(error: string): void

  addSuggestion(suggestion: Omit<Suggestion, 'id' | 'applied'>): void
  applySuggestion(id: string): void
  rejectSuggestion(id: string): void
  clearSuggestions(): void

  setQuota(quota: QuotaStatus): void
  fetchQuota(): Promise<void>

  // Streaming
  appendStreamChunk(chunk: string): void
  clearStreamBuffer(): void

  // Computed
  canMakeRequest: boolean
  dailyRemaining: number
  monthlyRemaining: number
}

// ===================================================================
// Store Implementation
// ===================================================================

export const useAIStore = create<AIStore>()(
  immer((set, get) => ({
    // Initial state
    operations: [],
    currentOperation: null,
    quota: null,
    suggestions: [],
    isProcessing: false,
    error: null,
    streamBuffer: '',

    // ---------------------------------------------------------------
    // Operations
    // ---------------------------------------------------------------

    startOperation: (type) => {
      set((state) => {
        state.currentOperation = {
          id: crypto.randomUUID(),
          operationType: type,
          status: 'processing',
          progress: 0,
        }
        state.isProcessing = true
        state.error = null
      })
    },

    updateOperationProgress: (progress) => {
      set((state) => {
        if (state.currentOperation) {
          state.currentOperation.progress = progress
        }
      })
    },

    completeOperation: () => {
      set((state) => {
        if (state.currentOperation) {
          state.currentOperation.status = 'completed'
          state.currentOperation.progress = 100
          state.operations.unshift(state.currentOperation)
          state.currentOperation = null
        }
        state.isProcessing = false
      })
    },

    failOperation: (error) => {
      set((state) => {
        if (state.currentOperation) {
          state.currentOperation.status = 'failed'
          state.currentOperation.error = error
          state.operations.unshift(state.currentOperation)
          state.currentOperation = null
        }
        state.isProcessing = false
        state.error = new Error(error)
      })
    },

    // ---------------------------------------------------------------
    // Suggestions
    // ---------------------------------------------------------------

    addSuggestion: (suggestion) => {
      set((state) => {
        state.suggestions.push({
          id: crypto.randomUUID(),
          ...suggestion,
          applied: false,
        })
      })
    },

    applySuggestion: (id) => {
      set((state) => {
        const suggestion = state.suggestions.find(s => s.id === id)
        if (suggestion) {
          suggestion.applied = true
        }
      })
    },

    rejectSuggestion: (id) => {
      set((state) => {
        state.suggestions = state.suggestions.filter(s => s.id !== id)
      })
    },

    clearSuggestions: () => {
      set((state) => {
        state.suggestions = []
      })
    },

    // ---------------------------------------------------------------
    // Quota
    // ---------------------------------------------------------------

    setQuota: (quota) => {
      set({ quota })
    },

    fetchQuota: async () => {
      try {
        const response = await fetch('/api/v1/ai/quota')
        const { data } = await response.json()

        set({
          quota: {
            daily: {
              ...data.daily,
              resetAt: new Date(data.daily.resetAt),
            },
            monthly: {
              ...data.monthly,
              resetAt: new Date(data.monthly.resetAt),
            },
            totalSpent: data.totalSpent,
          },
        })
      } catch (error) {
        console.error('[AI Store] Failed to fetch quota:', error)
      }
    },

    // ---------------------------------------------------------------
    // Streaming
    // ---------------------------------------------------------------

    appendStreamChunk: (chunk) => {
      set((state) => {
        state.streamBuffer += chunk
      })
    },

    clearStreamBuffer: () => {
      set({ streamBuffer: '' })
    },

    // ---------------------------------------------------------------
    // Computed
    // ---------------------------------------------------------------

    get canMakeRequest() {
      const { quota } = get()
      if (!quota) return true  // Unknown quota, allow
      return quota.daily.remaining > 0 && quota.monthly.remaining > 0
    },

    get dailyRemaining() {
      const { quota } = get()
      return quota?.daily.remaining ?? 100
    },

    get monthlyRemaining() {
      const { quota } = get()
      return quota?.monthly.remaining ?? 500
    },
  }))
)
```

**Key Features**:
- **Operation tracking**: Track AI operations (import, generate, etc.)
- **Suggestions**: Store and manage AI suggestions
- **Quota tracking**: Real-time quota status
- **Streaming**: Buffer for SSE chunks

---

### 6.3 Import Store

**File**: `/stores/importStore.ts`

**Purpose**: Manage PDF import wizard state (4 steps: Upload → Extract → Review → Save).

```typescript
// /stores/importStore.ts
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { ResumeJson } from '@/types/resume'

// ===================================================================
// Types
// ===================================================================

export interface Correction {
  field: string
  oldValue: string
  newValue: string
  applied: boolean
}

export interface ParsedResume {
  resume: ResumeJson
  confidence: number
  fieldConfidence: Record<string, number>
  ocrUsed: boolean
  extractedText: string
}

// ===================================================================
// Store Interface
// ===================================================================

interface ImportStore {
  // State
  importType: 'pdf' | 'text' | 'linkedin'
  uploadedFile: File | null
  extractedText: string
  parsedResume: ParsedResume | null
  corrections: Correction[]
  importStep: number  // 0-3
  isProcessing: boolean
  error: Error | null

  // Actions
  setFile(file: File): void
  setExtractedText(text: string): void
  setParsedResume(parsed: ParsedResume): void
  applyCorrection(field: string, oldValue: string, newValue: string): void
  undoCorrection(field: string): void
  nextStep(): void
  prevStep(): void
  resetImport(): void
  saveAsResume(): Promise<void>

  // Computed
  canProceed: boolean
  importProgress: number
}

// ===================================================================
// Store Implementation
// ===================================================================

export const useImportStore = create<ImportStore>()(
  immer((set, get) => ({
    // Initial state
    importType: 'pdf',
    uploadedFile: null,
    extractedText: '',
    parsedResume: null,
    corrections: [],
    importStep: 0,
    isProcessing: false,
    error: null,

    // ---------------------------------------------------------------
    // Actions
    // ---------------------------------------------------------------

    setFile: (file) => {
      set({ uploadedFile: file, importStep: 1 })
    },

    setExtractedText: (text) => {
      set({ extractedText: text })
    },

    setParsedResume: (parsed) => {
      set({ parsedResume: parsed, importStep: 2 })
    },

    applyCorrection: (field, oldValue, newValue) => {
      set((state) => {
        const existing = state.corrections.find(c => c.field === field)
        if (existing) {
          existing.newValue = newValue
          existing.applied = true
        } else {
          state.corrections.push({
            field,
            oldValue,
            newValue,
            applied: true,
          })
        }
      })
    },

    undoCorrection: (field) => {
      set((state) => {
        state.corrections = state.corrections.filter(c => c.field !== field)
      })
    },

    nextStep: () => {
      set((state) => {
        if (state.importStep < 3) {
          state.importStep += 1
        }
      })
    },

    prevStep: () => {
      set((state) => {
        if (state.importStep > 0) {
          state.importStep -= 1
        }
      })
    },

    resetImport: () => {
      set({
        uploadedFile: null,
        extractedText: '',
        parsedResume: null,
        corrections: [],
        importStep: 0,
        isProcessing: false,
        error: null,
      })
    },

    saveAsResume: async () => {
      const { parsedResume, corrections } = get()
      if (!parsedResume) return

      set({ isProcessing: true })

      try {
        // Apply corrections to resume
        let resume = { ...parsedResume.resume }
        corrections.forEach((correction) => {
          // Deep set field value (e.g., "profile.email" → resume.profile.email = newValue)
          const path = correction.field.split('.')
          let obj: any = resume
          for (let i = 0; i < path.length - 1; i++) {
            obj = obj[path[i]]
          }
          obj[path[path.length - 1]] = correction.newValue
        })

        // Save to documentStore (existing Phase 2 store)
        const { documentStore } = await import('@/stores/documentStore')
        await documentStore.getState().createDocument('Imported Resume', resume)

        set({ isProcessing: false, importStep: 3 })
      } catch (error: any) {
        set({ error, isProcessing: false })
      }
    },

    // ---------------------------------------------------------------
    // Computed
    // ---------------------------------------------------------------

    get canProceed() {
      const { importStep, uploadedFile, extractedText, parsedResume } = get()

      if (importStep === 0) return uploadedFile !== null
      if (importStep === 1) return extractedText.length > 0
      if (importStep === 2) return parsedResume !== null
      return true
    },

    get importProgress() {
      const { importStep } = get()
      return (importStep / 3) * 100
    },
  }))
)
```

**Key Features**:
- **Wizard state**: 4-step import flow
- **Corrections tracking**: Manual field edits
- **Integration**: Saves to `documentStore` on final step

---

## 7. Component Architecture

### 7.1 Overview

**Organize by feature area** (15 components total):

```
/components/
├── ai/                     # AI-specific components (7)
│   ├── AIAssistant.tsx     # Main AI panel
│   ├── AISuggestionCard.tsx # Suggestion display
│   ├── AIQuotaIndicator.tsx # Usage display
│   ├── AIRateLimitWarning.tsx # Rate limit UI
│   ├── StreamingIndicator.tsx # Streaming status
│   ├── AIErrorBoundary.tsx # AI-specific errors
│   └── AIFeedback.tsx      # Thumbs up/down
│
├── import/                 # PDF import flow (5)
│   ├── PDFUploader.tsx     # File upload
│   ├── ImportWizard.tsx    # 4-step wizard
│   ├── ImportReview.tsx    # Review parsed data
│   ├── ImportCorrections.tsx # Manual fixes
│   └── OCRStatus.tsx       # OCR progress
│
└── enhance/                # Content enhancement (3)
    ├── EnhancementPanel.tsx # Main enhancement UI
    ├── BulletEnhancer.tsx   # Bullet improvements
    └── SummaryGenerator.tsx # Summary creation
```

---

### 7.2 PDF Import Components

#### PDFUploader

**Purpose**: Drag-and-drop PDF upload with validation.

**Props**:
```typescript
interface PDFUploaderProps {
  onFileSelect: (file: File) => void
  maxSizeMB?: number  // Default: 10
  acceptedTypes?: string[]  // Default: ['application/pdf']
  className?: string
}
```

**Key Features**:
- Drag-and-drop zone
- File size validation (<10MB)
- File type validation (PDF only)
- Preview thumbnail (optional)
- Upload progress bar

**Integration**:
```typescript
<PDFUploader
  onFileSelect={(file) => {
    importStore.setFile(file)
    // Trigger extraction
  }}
/>
```

---

#### ImportWizard

**Purpose**: 4-step wizard (Upload → Extract → Review → Save).

**Props**:
```typescript
interface ImportWizardProps {
  onComplete: (resume: ResumeJson) => void
  onCancel: () => void
}
```

**Steps**:
1. **Upload** - PDFUploader component
2. **Extract** - Text extraction + OCR opt-in
3. **Review** - Side-by-side: PDF | Parsed fields
4. **Save** - Confirmation + save to documentStore

**Integration**:
```typescript
<ImportWizard
  onComplete={(resume) => {
    // Resume saved to documentStore
    router.push(`/resumes/${resume.id}`)
  }}
  onCancel={() => importStore.resetImport()}
/>
```

---

#### ImportReview

**Purpose**: Display parsed data with confidence indicators.

**Props**:
```typescript
interface ImportReviewProps {
  parsedResume: ParsedResume
  onCorrection: (field: string, value: string) => void
  onApprove: () => void
}
```

**Key Features**:
- Split view: PDF preview | Parsed fields
- Confidence indicators (green/yellow/red)
- Inline editing for low-confidence fields
- Field-by-field review

**Design**:
```
┌─────────────────────────────────────────────────┐
│ PDF Preview    │    Parsed Data                 │
├────────────────┼────────────────────────────────┤
│                │  Name: John Doe ✅ (0.95)      │
│  [PDF viewer]  │  Email: john@ex.com ⚠️ (0.72)  │
│                │  Phone: 555-1234 ❌ (0.45)     │
│                │  [Edit inline]                 │
└────────────────┴────────────────────────────────┘
```

---

### 7.3 AI Components

#### AIAssistant

**Purpose**: Main AI panel (floating or sidebar).

**Props**:
```typescript
interface AIAssistantProps {
  position?: 'floating' | 'sidebar'  // Default: floating
  onSuggestionApply: (suggestion: Suggestion) => void
}
```

**Key Features**:
- Collapsible panel
- Quota display (X/100 requests today)
- Suggestion list
- Quick actions (Generate, Enhance, Match)

**Design** (Floating):
```
┌─────────────────────────────────┐
│  AI Assistant         [-] [x]   │
├─────────────────────────────────┤
│  Quota: 87/100 requests today   │
│  ───────────────────────────────│
│  Suggestions (3)                │
│  ┌─────────────────────────────┐│
│  │ "Led team..." → "Architected"│
│  │ Apply | Reject               │
│  └─────────────────────────────┘│
│  [Generate from JD]             │
│  [Enhance Content]              │
└─────────────────────────────────┘
```

---

#### StreamingIndicator

**Purpose**: Show streaming progress (animated).

**Props**:
```typescript
interface StreamingIndicatorProps {
  isStreaming: boolean
  progress?: number  // 0-100
  text?: string      // e.g., "Generating resume..."
}
```

**Key Features**:
- Animated typing indicator
- Progress bar (if progress provided)
- Cancel button (optional)

**Design**:
```
Generating resume...  ███████░░░ 70%
```

---

#### AIQuotaIndicator

**Purpose**: Display user's quota status.

**Props**:
```typescript
interface AIQuotaIndicatorProps {
  quota: QuotaStatus
  variant?: 'compact' | 'detailed'
}
```

**Variants**:
- **Compact**: `87/100` (green if >20%, yellow if 10-20%, red if <10%)
- **Detailed**: Breakdown (daily/monthly, reset time, total spent)

---

### 7.4 Enhancement Components

#### EnhancementPanel

**Purpose**: Tabbed panel for enhancement options.

**Props**:
```typescript
interface EnhancementPanelProps {
  content: string  // Current content
  onEnhance: (enhanced: string) => void
}
```

**Tabs**:
1. **Bullets** - Improve bullet points
2. **Summary** - Generate/rewrite summary
3. **Keywords** - Optimize for JD

**Design**:
```
┌─────────────────────────────────────────┐
│ Bullets | Summary | Keywords            │
├─────────────────────────────────────────┤
│  Select bullets to improve:             │
│  ☑️ Led team of 5 developers            │
│  ☐ Managed project timelines            │
│  ☑️ Increased revenue by 20%            │
│  [Enhance Selected (2)]                 │
└─────────────────────────────────────────┘
```

---

#### BulletEnhancer

**Purpose**: Show bullet suggestions with apply/reject.

**Props**:
```typescript
interface BulletEnhancerProps {
  original: string
  suggestions: Array<{
    text: string
    improvement: string
    confidence: number
  }>
  onApply: (suggestion: string) => void
  onReject: () => void
}
```

**Design**:
```
Original:
"Led team of 5 developers"

Suggestions:
✅ "Architected solutions with team of 5 engineers"
   Improvement: Action verb + specificity (0.92)
   [Apply] [Reject]

⚠️ "Managed and led 5-person development team"
   Improvement: Clarity (0.68)
   [Apply] [Reject]
```

---

## 8. Implementation Sub-Phases

### 8.1 Overview

**4 Sub-Phases** (24 hours total):

| Sub-Phase | Duration | Key Deliverables |
|-----------|----------|------------------|
| 4A: PDF Import & AI Parsing | 6 hours | PDF extraction, OCR, AI parsing endpoint, import wizard |
| 4B: AI Generation & Streaming | 7 hours | AI SDK setup, generation endpoint (SSE), streaming integration |
| 4C: Content Enhancement | 5 hours | Enhancement endpoint, bullet improver, summary generator |
| 4D: JD Matching & Polish | 6 hours | Matching endpoint, rate limiting, quota UI, error boundaries |

---

### 8.2 Phase 4A: PDF Import & AI Parsing (6 hours)

**Goal**: Users can upload PDF resumes and parse them to ResumeJson.

**Tasks**:

1. **Setup PDF Extraction** (1.5 hours)
   - Install dependencies: `npm install unpdf tesseract.js`
   - Create `/libs/pdf/extractor.ts` with `unpdf` integration
   - Implement text layer detection
   - Add fallback to `pdf-parse` (optional)

2. **Implement OCR Fallback** (2 hours)
   - Create client-side OCR utility with Tesseract.js
   - Web Worker setup for background processing
   - Progress tracking (per-page)
   - 10-page limit enforcement

3. **Build AI Parsing Endpoint** (1.5 hours)
   - Create `POST /api/v1/ai/import` (Node runtime)
   - Integrate `unpdf` text extraction
   - Call Gemini 2.0 Flash with `generateObject`
   - Return ResumeJson with confidence scores

4. **Create Import Wizard UI** (1 hour)
   - Create `PDFUploader` component
   - Create `ImportWizard` 4-step flow
   - Create `ImportReview` component
   - Wire to `importStore`

**Testing**:
- [ ] Upload PDF with text layer → Parses successfully
- [ ] Upload scanned PDF → Triggers OCR opt-in
- [ ] Review parsed data → Shows confidence scores
- [ ] Apply corrections → Updates fields
- [ ] Save → Creates new resume in documentStore

**Success Criteria**:
- Can import PDF resumes (text layer + OCR)
- Parsing accuracy >90% (on test set)
- Import time <12s (2-page PDF with OCR)

---

### 8.3 Phase 4B: AI Generation & Streaming (7 hours)

**Goal**: Users can generate resumes from job descriptions with streaming.

**Tasks**:

1. **AI SDK Provider Setup** (1 hour)
   - Install dependencies: `npm install ai @ai-sdk/google`
   - Create `/libs/ai/provider.ts` with Google provider
   - Create `/libs/ai/prompts.ts` with prompt templates
   - Test `generateObject` and `streamObject`

2. **Build Generation Endpoint** (2 hours)
   - Create `POST /api/v1/ai/generate` (Edge runtime)
   - Implement SSE streaming with `streamObject`
   - Add rate limiting (`checkRateLimit`)
   - Add usage tracking (`logAIUsage`)
   - Add response caching (`cacheResponse`)

3. **Integrate with Phase 3 Preview** (2 hours)
   - Update `documentStore` to accept streaming updates
   - Use existing RAF batching for smooth updates
   - Handle SSE connection lifecycle (start, chunk, end, error)
   - Add recovery for dropped connections

4. **Create Generation UI** (2 hours)
   - Create form: Job description + personal info inputs
   - Create `StreamingIndicator` component
   - Wire to aiStore
   - Add cancel button

**Testing**:
- [ ] Generate from JD → Streams to preview
- [ ] Preview updates smoothly (<16ms per chunk)
- [ ] Connection drop → Offers resume from last state
- [ ] Rate limit → Shows clear error
- [ ] Quota exceeded → Blocks with reset time

**Success Criteria**:
- First token within 1 second
- Full generation within 10 seconds
- Streaming smooth (no jank)
- Preview updates use existing RAF batching

---

### 8.4 Phase 4C: Content Enhancement (5 hours)

**Goal**: Users can enhance bullets, generate summaries, optimize keywords.

**Tasks**:

1. **Build Enhancement Endpoint** (1.5 hours)
   - Create `POST /api/v1/ai/enhance` (Edge runtime)
   - Support types: bullets, summary, keywords
   - Add rate limiting + caching + usage tracking
   - Return suggestions with confidence scores

2. **Create Enhancement UI** (2 hours)
   - Create `EnhancementPanel` (tabbed)
   - Create `BulletEnhancer` with suggestions
   - Create `SummaryGenerator`
   - Wire to aiStore

3. **Integrate with Document Editor** (1.5 hours)
   - Add "Enhance" button to bullet items
   - Add "Generate Summary" button to summary section
   - Apply suggestions → Update documentStore
   - Undo support (via zundo)

**Testing**:
- [ ] Select bullets → Get suggestions
- [ ] Apply suggestion → Updates editor
- [ ] Reject suggestion → Removes from list
- [ ] Generate summary → Creates professional summary
- [ ] Undo → Reverts to original

**Success Criteria**:
- Enhancement time <3 seconds
- Suggestions improve clarity/impact
- Apply/reject works correctly
- Undo/redo functional

---

### 8.5 Phase 4D: JD Matching & Polish (6 hours)

**Goal**: Complete AI infrastructure (rate limiting, quota, error handling).

**Tasks**:

1. **Build Matching Endpoint** (1.5 hours)
   - Create `POST /api/v1/ai/match` (Edge runtime)
   - Extract keywords from JD
   - Compare with resume
   - Calculate match percentage
   - Return gaps + suggestions

2. **Implement Rate Limiting** (2 hours)
   - Create `/libs/ai/rateLimiter.ts` (sliding window)
   - Add middleware `withRateLimit`
   - Add rate limit headers to responses
   - Test multi-tier limits (3/min, 10/10s, 100/day)

3. **Build Quota UI** (1.5 hours)
   - Create `AIQuotaIndicator` component
   - Create quota status endpoint (`GET /api/v1/ai/quota`)
   - Display in dashboard + AI assistant
   - Show reset time

4. **Error Handling & Recovery** (1 hour)
   - Create `AIErrorBoundary` component
   - Add fallback UI for AI failures
   - Handle rate limit errors (show Retry-After)
   - Handle quota exceeded (show upgrade options)

**Testing**:
- [ ] Match resume with JD → Shows gaps
- [ ] Rate limit (10 req in 10s) → Blocks with 429
- [ ] Daily quota (100 req) → Blocks until reset
- [ ] Quota UI → Shows accurate counts
- [ ] Error boundary → Catches AI failures

**Success Criteria**:
- Rate limiting enforced (3/min, 10/10s, 100/day)
- Quota tracking accurate
- Error handling comprehensive
- All AI features functional

---

## 9. Testing Strategy

### 9.1 Playbook-Based Testing

**4 Manual Playbooks** (Puppeteer MCP):

1. `phase_4_pdf_import.md` - PDF upload → parse → review → save
2. `phase_4_ai_parsing.md` - Verify ResumeJson accuracy, confidence scores
3. `phase_4_drafting.md` - Generate from JD → stream → save
4. `phase_4_enhancement.md` - Select content → suggestions → apply

**Total Time**: ~25-35 minutes

---

### 9.2 Playbook 1: PDF Import

**File**: `/ai_docs/testing/playbooks/phase_4_pdf_import.md`

**Objectives**:
- Upload PDF successfully
- Text extraction works (with/without OCR)
- Multi-page support (up to 10 pages)
- Progress indicators visible
- Error recovery functional

**Test Steps**:

```markdown
# Phase 4 Playbook: PDF Import

## Setup
1. Start dev server: `npm run dev`
2. Navigate to import page: `/import/pdf`

## Test 1: PDF Upload (Text Layer)
[ ] Navigate to `/import/pdf`
[ ] Click "Upload PDF" or drag-and-drop
[ ] Select test PDF: `tests/fixtures/resume-text-layer.pdf`
[ ] Verify file size validation (<10MB)
[ ] Verify file preview appears
[ ] Click "Extract Text"
[ ] Verify extraction completes (<2s)
[ ] Verify text preview shows content
[ ] Take screenshot: `pdf_upload_success.png`

## Test 2: OCR Fallback
[ ] Upload scanned PDF: `tests/fixtures/resume-scanned.pdf`
[ ] Verify "No text layer detected" message
[ ] Click "Use OCR" button
[ ] Verify OCR progress indicator (per-page)
[ ] Wait for OCR completion (<5s per page)
[ ] Verify OCR text preview
[ ] Take screenshot: `ocr_progress.png`

## Test 3: Multi-Page Support
[ ] Upload 3-page PDF: `tests/fixtures/resume-3-pages.pdf`
[ ] Verify all 3 pages extracted
[ ] Verify combined text length >1000 chars
[ ] Take screenshot: `multi_page_extraction.png`

## Test 4: Error Handling
[ ] Upload encrypted PDF: `tests/fixtures/resume-encrypted.pdf`
[ ] Verify error message: "Password-protected PDFs not supported"
[ ] Upload corrupted PDF: `tests/fixtures/resume-corrupted.pdf`
[ ] Verify error message: "File corrupted"
[ ] Upload 15-page PDF: `tests/fixtures/resume-15-pages.pdf`
[ ] Verify error message: "PDF has too many pages (max 10)"
[ ] Take screenshot: `pdf_errors.png`

## Pass Criteria
- [x] All test steps completed
- [x] Screenshots saved
- [x] No critical errors
- [x] PDF import functional
```

---

### 9.3 Performance Validation

**Benchmarks** (measure during playbook execution):

| Metric | Target | Pass/Fail |
|--------|--------|-----------|
| AI first token | <1s | |
| PDF parsing (2 pages) | <2s | |
| OCR per page | <5s | |
| Full import (2-page OCR) | <12s | |
| Generation (full resume) | <10s | |
| Enhancement (5 bullets) | <3s | |
| Streaming chunk update | <16ms | |

**Measurement Tools**:
- Browser DevTools Performance tab
- `console.time()` / `console.timeEnd()` in code
- Network tab (for API latency)

---

## 10. Integration Points

### 10.1 With Phase 2 (Document Management)

**Integration**: AI generation writes to existing `documentStore`.

**Code**:
```typescript
// In AI generation handler (client-side)
import { useDocumentStore } from '@/stores/documentStore'

const documentStore = useDocumentStore()

// After streaming completes
documentStore.updateDocument(generatedResume)
// Auto-save triggers (2s debounce)
```

**Key Points**:
- No changes to documentStore needed
- Auto-save handles AI-generated content
- Undo/redo works (zundo middleware)

---

### 10.2 With Phase 3 (Templates & Preview)

**Integration**: Streaming updates use existing RAF batching.

**Code**:
```typescript
// In LivePreview.tsx (existing Phase 3 component)
// RAF batching already handles incremental updates

// AI streaming calls documentStore.updateDocument()
// → Triggers preview re-render
// → RAF batching ensures <16ms updates
```

**Key Points**:
- Zero changes to LivePreview.tsx
- RAF batching works for streaming
- Performance budgets maintained

---

### 10.3 With Existing Auth

**Integration**: Extend `withAuth` to include rate limiting.

**Code**:
```typescript
// Create new wrapper: withAIAuth
export function withAIAuth(handler: AuthenticatedHandler) {
  return withAuth(async (req, context) => {
    // Check rate limit
    const rateLimit = await checkRateLimit(...)
    if (!rateLimit.allowed) {
      return apiError(429, 'Rate limit exceeded')
    }

    // Call handler
    return handler(req, context)
  })
}

// Usage
export const POST = withAIAuth(async (req, { user }) => {
  // Rate limit already checked
})
```

---

## 11. Success Criteria

### 11.1 Functional Criteria

**All features must work**:
- [ ] PDF import (text layer + OCR)
- [ ] AI parsing (>90% accuracy)
- [ ] AI generation (streaming)
- [ ] Content enhancement
- [ ] JD matching
- [ ] Rate limiting (3/min, 10/10s, 100/day)
- [ ] Quota tracking (daily/monthly)

---

### 11.2 Performance Criteria

**All benchmarks must pass**:
- [ ] AI first token <1s
- [ ] PDF parsing <2s
- [ ] OCR <5s per page
- [ ] Full generation <10s
- [ ] Enhancement <3s
- [ ] Streaming smooth (<16ms per chunk)

---

### 11.3 Security Criteria

**All security checks must pass**:
- [ ] API keys not exposed in client
- [ ] Input sanitization working
- [ ] Rate limiting enforced
- [ ] No PII logged
- [ ] RLS policies enforced

---

### 11.4 Visual Criteria

**All UI features must meet visual quality standards**:
- [ ] Desktop screenshots (1440px) taken
- [ ] Mobile screenshots (375px) taken
- [ ] Design tokens used throughout
- [ ] Spacing generous (≥16px gaps)
- [ ] Clear hierarchy (typography)
- [ ] ONE primary action per section
- [ ] No hardcoded values

---

### 11.5 Documentation Criteria

**All documentation must be complete**:
- [ ] Screenshots saved to `ai_docs/progress/phase_4/screenshots/`
- [ ] `visual_review.md` completed
- [ ] `playbook_results.md` completed
- [ ] All critical issues resolved

---

## 12. Handoff Checklist

### 12.1 Before Starting Implementation

**Prerequisites**:

**Environment Setup**:
- [ ] `GOOGLE_GENERATIVE_AI_API_KEY` set in `.env.local`
- [ ] Dev server running on port 3000
- [ ] Supabase MCP configured

**Dependencies Installed**:
```bash
npm install ai @ai-sdk/google unpdf tesseract.js
```

**Migrations Reviewed**:
- [ ] `010_create_ai_operations.sql` reviewed
- [ ] `011_create_ai_cache.sql` reviewed
- [ ] `012_create_user_quotas.sql` reviewed

**Context Read**:
- [ ] All research dossiers read
- [ ] This implementation plan understood
- [ ] Phase 4 spec reviewed

---

### 12.2 Implementation Readiness

**Files Created**:

**AI Service Layer** (6 files):
- [ ] `/libs/ai/provider.ts`
- [ ] `/libs/ai/prompts.ts`
- [ ] `/libs/ai/rateLimiter.ts`
- [ ] `/libs/ai/costTracker.ts`
- [ ] `/libs/ai/cacheManager.ts`
- [ ] `/libs/ai/types.ts`

**Repository Layer** (3 files):
- [ ] `/libs/repositories/aiOperations.ts`
- [ ] `/libs/repositories/aiCache.ts`
- [ ] `/libs/repositories/rateLimit.ts`

**API Routes** (5 files):
- [ ] `/app/api/v1/ai/import/route.ts`
- [ ] `/app/api/v1/ai/generate/route.ts`
- [ ] `/app/api/v1/ai/enhance/route.ts`
- [ ] `/app/api/v1/ai/match/route.ts`
- [ ] `/app/api/v1/ai/quota/route.ts`

**State Management** (2 files):
- [ ] `/stores/aiStore.ts`
- [ ] `/stores/importStore.ts`

**Components** (15 files):
- [ ] AI components (7): AIAssistant, AISuggestionCard, AIQuotaIndicator, etc.
- [ ] Import components (5): PDFUploader, ImportWizard, ImportReview, etc.
- [ ] Enhancement components (3): EnhancementPanel, BulletEnhancer, SummaryGenerator

---

### 12.3 Testing Readiness

**Playbooks Created**:
- [ ] `phase_4_pdf_import.md`
- [ ] `phase_4_ai_parsing.md`
- [ ] `phase_4_drafting.md`
- [ ] `phase_4_enhancement.md`

**Fixtures Prepared**:
- [ ] `tests/fixtures/resume-text-layer.pdf`
- [ ] `tests/fixtures/resume-scanned.pdf`
- [ ] `tests/fixtures/resume-3-pages.pdf`
- [ ] `tests/fixtures/resume-encrypted.pdf`
- [ ] `tests/fixtures/resume-corrupted.pdf`

---

### 12.4 Final Validation

**Build Validation**:
```bash
npm run build
# Should complete with zero errors
```

**Type Check**:
```bash
npx tsc --noEmit
# Should complete with zero errors
```

**Lint Check**:
```bash
npm run lint
# Should complete with zero errors
```

---

## Appendix: Quick Reference

### Environment Variables

```bash
# .env.local
GOOGLE_GENERATIVE_AI_API_KEY=AIza...  # Required
```

### Key Commands

```bash
# Install dependencies
npm install ai @ai-sdk/google unpdf tesseract.js

# Run dev server
npm run dev

# Apply migrations (via Supabase MCP)
# (User must approve first)
```

### Important File Paths

```
Migrations:
  /migrations/phase4/010_create_ai_operations.sql
  /migrations/phase4/011_create_ai_cache.sql
  /migrations/phase4/012_create_user_quotas.sql

AI Service:
  /libs/ai/provider.ts
  /libs/ai/prompts.ts
  /libs/ai/rateLimiter.ts
  /libs/ai/costTracker.ts
  /libs/ai/cacheManager.ts

API Routes:
  /app/api/v1/ai/import/route.ts
  /app/api/v1/ai/generate/route.ts
  /app/api/v1/ai/enhance/route.ts
  /app/api/v1/ai/match/route.ts
  /app/api/v1/ai/quota/route.ts

State:
  /stores/aiStore.ts
  /stores/importStore.ts

Components:
  /components/ai/
  /components/import/
  /components/enhance/
```

### Contact Points

**Phase 3 Integration**:
- RAF batching: `/libs/preview/rafScheduler.ts`
- documentStore: `/stores/documentStore.ts`
- Template registry: `/libs/templates/registry.ts`

**Phase 2 Integration**:
- Repository pattern: `/libs/repositories/documents.ts`
- API wrappers: `/libs/api-utils/withAuth.ts`
- Database: Supabase MCP tools only

---

**END OF IMPLEMENTATION PLAN**

**Status**: Ready for Implementation
**Estimated Effort**: 24-30 hours
**Next Step**: Begin Phase 4A (PDF Import & AI Parsing)
