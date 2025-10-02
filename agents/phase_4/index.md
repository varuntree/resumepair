# Phase 4 Index: AI Integration & Smart Features

**Phase Number**: 4
**Phase Name**: AI Integration & Smart Features
**Start Date**: 2025-10-01
**Status**: IN PROGRESS

---

## Section 1: Context Recovery Instructions

**If context is lost, follow these steps to resume:**

### What This Phase Is Building
Phase 4 integrates AI capabilities into ResumePair using Gemini 2.0 Flash via AI SDK:
- **PDF Import**: Upload PDF resumes, extract text, use AI to parse into ResumeJson structure
- **AI Resume Generation**: Generate resume from scratch using job description + personal info
- **Content Enhancement**: Improve bullet points, generate summaries, optimize keywords
- **Job Description Matching**: Analyze resume against JD, identify gaps, suggest improvements
- **Rate Limiting & Quota**: Track usage, enforce limits, prevent abuse

### Key Documents to Re-Read
1. `/ai_docs/orchestrator_instructions.md` - Complete orchestration workflow
2. `/ai_docs/phases/phase_4.md` - Full phase requirements and specifications
3. `/ai_docs/coding_patterns.md` - Implementation patterns (repositories, API design, etc.)
4. `/ai_docs/development_decisions.md` - Non-negotiable constraints
5. `/agents/phase_3/handoff_to_phase4.md` - What Phase 3 delivered for us to use
6. `/agents/phase_2/phase_summary.md` - Document management foundations
7. `/ai_docs/standards/1_architecture_principles.md` - Architecture rules
8. `/ai_docs/standards/9_visual_verification_workflow.md` - Testing workflow

### How to Resume
1. Read this index.md file (you're here now)
2. Check "Progress Tracking" section below to see current state
3. Identify which agent is pending or in progress
4. Continue from the next pending step
5. If an agent is in progress, check its output file for current status

### Recovery Command
```bash
# Quick context reload
cat agents/phase_4/index.md
cat agents/phase_4/context_gatherer_phase4_output.md  # If exists
cat agents/phase_4/planner_architect_phase4_output.md  # If exists
```

---

## Section 2: Complete Phase Sequence

### Overview
Phase 4 follows a 5-step agent workflow with 4 implementation sub-phases:

```
Context Gathering → Systems Research (3 parallel) → Planning →
Implementation (4 sub-phases) → Code Review → Visual Verification →
Playbook Testing → Phase Summary → Learning System → Handoff
```

### Detailed Sequence

#### Step 1: Context Gathering (context-gatherer agent)
**Duration**: ~2 hours
**Output**: `context_gatherer_phase4_output.md`
**Purpose**: Gather comprehensive context from Phase 1-3, understand Phase 4 requirements, identify integration points

**Key Deliverables**:
- Current system state analysis
- Phase 4 requirements breakdown
- Integration constraints documentation
- Technical challenges identification
- Success criteria definition

---

#### Step 2: Systems Research (3 parallel systems-researcher agents)
**Duration**: ~4 hours total (parallel execution)
**Outputs**:
- `systems_researcher_phase4_ai_sdk_output.md`
- `systems_researcher_phase4_pdf_import_output.md`
- `systems_researcher_phase4_rate_limiting_output.md`

**Agent 2A: AI SDK & Streaming**
- AI SDK with Google Generative AI setup
- Structured outputs with Zod
- Streaming with SSE
- Error handling patterns
- Token counting and cost tracking
- Prompt engineering best practices

**Agent 2B: PDF Import & OCR**
- PDF text extraction libraries
- OCR fallback strategies
- Multi-page handling
- Format detection
- Performance optimization

**Agent 2C: Rate Limiting & Quota**
- Token bucket algorithms
- Per-user quota tracking
- Sliding window patterns
- Graceful degradation
- Cost estimation

---

#### Step 3: Planning Architecture (planner-architect agent)
**Duration**: ~3 hours
**Output**: `planner_architect_phase4_output.md`
**Purpose**: Create comprehensive implementation plan integrating all research

**Key Deliverables**:
- Database schema (3 migrations)
- AI service architecture
- API routes (12 endpoints)
- State management design
- Component architecture (25+ components)
- Implementation order (4 sub-phases)
- Integration strategy

---

#### Step 4: Implementation (implementer agent - 4 sequential sub-phases)
**Duration**: ~22 hours total
**Output**: `implementer_phase4_output.md`
**Purpose**: Build all Phase 4 features following the plan

**Phase 4A: PDF Import & AI Parsing** (~6 hours)
- PDF text extraction service (`libs/importers/pdfExtractor.ts`)
- OCR fallback integration (`libs/importers/ocrService.ts`)
- AI parsing to ResumeJson (`libs/ai/parsers/resumeParser.ts`)
- Import wizard UI (`/app/import/pdf/page.tsx`)
- Review/correction interface (`components/import/ImportReview.tsx`)
- Database: None (uses existing resumes table)
- API: POST `/api/v1/import/pdf`, POST `/api/v1/import/ocr`

**Phase 4B: AI Generation & Streaming** (~7 hours)
- AI SDK provider setup (`libs/ai/provider.ts`)
- Prompt templates (`libs/ai/prompts.ts`)
- Streaming endpoint with SSE (`/api/v1/ai/generate`)
- Real-time preview integration (use Phase 3 RAF batching)
- Generation UI with job description input (`/app/ai/generate/page.tsx`)
- Progress indicators (`components/ai/StreamingIndicator.tsx`)
- Database: Migration 010 (ai_operations table)
- API: POST `/api/v1/ai/generate`

**Phase 4C: Content Enhancement** (~5 hours)
- Bullet point enhancement (`libs/ai/enhancers/bulletEnhancer.ts`)
- Summary generation (`libs/ai/enhancers/summaryGenerator.ts`)
- Keyword extraction (`libs/ai/enhancers/keywordExtractor.ts`)
- Enhancement panel UI (`components/enhance/EnhancementPanel.tsx`)
- Suggestion cards (`components/ai/AISuggestionCard.tsx`)
- Database: Migration 011 (ai_cache table)
- API: POST `/api/v1/ai/enhance`

**Phase 4D: JD Matching & Polish** (~6 hours)
- Job description matching (`libs/ai/matchers/jdMatcher.ts`)
- Skills gap analysis (`libs/ai/analyzers/skillsAnalyzer.ts`)
- Rate limiting enforcement (`libs/ai/rateLimiter.ts`)
- Quota management UI (`components/ai/AIQuotaIndicator.tsx`)
- Error boundaries (`components/ai/AIErrorBoundary.tsx`)
- Database: Migration 012 (user_ai_quotas table)
- API: POST `/api/v1/ai/match`, GET `/api/v1/ai/quota`

**Learning Capture**: Document observations in `learnings/observations.md` throughout

---

#### Step 5: Code Review (code-reviewer agent)
**Duration**: ~2 hours
**Output**: `code_reviewer_phase4_output.md`
**Purpose**: Principal-level audit across correctness, security, performance, reliability

**Review Criteria**:
- Correctness: AI responses validated, schema compliance
- Security: API keys secure, input sanitized, no PII logged
- Performance: First token <1s, streaming smooth
- Reliability: Retry logic, fallback options, error handling
- Maintainability: Standards compliance, documentation

**Categorization**:
- 🔴 MUST FIX (blocking issues)
- 🟡 SHOULD FIX (important improvements)
- 🟢 CONSIDER (nice to have)

**Iteration**: If 🔴 issues found, send back to implementer → re-review

---

#### Step 6: Visual Verification (general-purpose agent with Puppeteer MCP)
**Duration**: ~45 minutes
**Output**: `/ai_docs/progress/phase_4/visual_review.md`
**Purpose**: Verify all UI features meet visual quality standards

**CRITICAL AUTHENTICATION**:
- Email/Password ONLY: test@gmail.com / Test@123
- DO NOT use Google OAuth

**Features to Verify**:
1. PDF import wizard (upload, progress, preview)
2. AI generation interface (streaming, progress indicators)
3. Enhancement panel (suggestions, apply/reject)
4. Quota indicator (usage display, limits)

**Screenshots** (16 total):
- Desktop (1440px): 8 screenshots
- Mobile (375px): 8 screenshots

**Checklist**:
- Loading states clear
- Streaming indicators visible
- Error states helpful
- Design tokens used
- Responsive layout works

---

#### Step 7: Playbook Testing (manual execution by user OR automated via Puppeteer)
**Duration**: ~35 minutes
**Outputs**: 4 playbook completion reports

**Playbooks to Execute**:
1. `ai_docs/testing/playbooks/phase_4_pdf_import.md` (~10 min)
2. `ai_docs/testing/playbooks/phase_4_ai_parsing.md` (~8 min)
3. `ai_docs/testing/playbooks/phase_4_drafting.md` (~10 min)
4. `ai_docs/testing/playbooks/phase_4_enhancement.md` (~7 min)

**Success Criteria**: All checkboxes pass in all 4 playbooks

---

#### Step 8: Phase Summary Creation
**Duration**: ~1 hour
**Output**: `phase_summary.md`
**Purpose**: Document what was built, decisions made, lessons learned

**Sections**:
- Executive Summary
- What Was Built (deliverables)
- Key Decisions & Rationale
- Deviations from Plan
- Technical Debt
- Limitations & Constraints
- Readiness Assessment
- Lessons Learned
- Recommendations for Phase 5

---

#### Step 9: Learning System Pipeline
**Duration**: ~2 hours
**Purpose**: Capture insights and update documentation

**Steps**:
1. Review `learnings/observations.md`
2. Extract patterns (Pattern Extractor agent)
3. Generalize knowledge (Knowledge Generalizer agent)
4. Map integrations (Integration Mapper agent)
5. Validate proposals (Validation Orchestrator agent)
6. Apply approved learnings to main docs

---

#### Step 10: Handoff Preparation
**Duration**: ~30 minutes
**Output**: `handoff_to_phase5.md`
**Purpose**: Prepare context for Phase 5 (Export System)

**Contents**:
- What Phase 5 can assume exists
- Integration points for PDF/DOCX export
- AI infrastructure available
- Known issues to address
- Prerequisites for Phase 5

---

## Section 3: Progress Tracking

### Current Status
**Active Step**: Step 1 - Context Gathering (preparing to deploy)
**Last Updated**: 2025-10-01 [Current Time]
**Overall Progress**: 0% (just started)

### Agent Completion Status

| Step | Agent | Status | Output File | Notes |
|------|-------|--------|-------------|-------|
| 1 | context-gatherer | ⏳ Pending | `context_gatherer_phase4_output.md` | Ready to deploy |
| 2A | systems-researcher (AI SDK) | ⏳ Pending | `systems_researcher_phase4_ai_sdk_output.md` | Waits for Step 1 |
| 2B | systems-researcher (PDF Import) | ⏳ Pending | `systems_researcher_phase4_pdf_import_output.md` | Waits for Step 1 |
| 2C | systems-researcher (Rate Limiting) | ⏳ Pending | `systems_researcher_phase4_rate_limiting_output.md` | Waits for Step 1 |
| 3 | planner-architect | ⏳ Pending | `planner_architect_phase4_output.md` | Waits for Step 2 |
| 4A | implementer (PDF Import) | ⏳ Pending | `implementer_phase4A_output.md` | Waits for Step 3 |
| 4B | implementer (AI Generation) | ⏳ Pending | `implementer_phase4B_output.md` | Waits for 4A |
| 4C | implementer (Enhancement) | ⏳ Pending | `implementer_phase4C_output.md` | Waits for 4B |
| 4D | implementer (JD Matching) | ⏳ Pending | `implementer_phase4D_output.md` | Waits for 4C |
| 5 | code-reviewer | ⏳ Pending | `code_reviewer_phase4_output.md` | Waits for Step 4 |
| 6 | general-purpose (visual) | ⏳ Pending | `/ai_docs/progress/phase_4/visual_review.md` | Waits for Step 5 |

### Implementation Progress (Phase 4A-D)

**Phase 4A: PDF Import & AI Parsing**
- [ ] PDF extraction service
- [ ] OCR fallback integration
- [ ] AI resume parser
- [ ] Import wizard UI
- [ ] Review/correction interface

**Phase 4B: AI Generation & Streaming**
- [ ] AI SDK provider setup
- [ ] Prompt templates
- [ ] Streaming endpoint
- [ ] Generation UI
- [ ] Progress indicators

**Phase 4C: Content Enhancement**
- [ ] Bullet enhancer
- [ ] Summary generator
- [ ] Keyword extractor
- [ ] Enhancement panel
- [ ] Suggestion cards

**Phase 4D: JD Matching & Polish**
- [ ] JD matcher
- [ ] Skills analyzer
- [ ] Rate limiter
- [ ] Quota UI
- [ ] Error boundaries

### Database Migrations Status
- [ ] Migration 010: ai_operations table (file created, not applied)
- [ ] Migration 011: ai_cache table (file created, not applied)
- [ ] Migration 012: user_ai_quotas table (file created, not applied)

### Playbook Testing Status
- [ ] PDF Import Playbook (~10 min)
- [ ] AI Parsing Playbook (~8 min)
- [ ] AI Drafting Playbook (~10 min)
- [ ] Enhancement Playbook (~7 min)

### Active Blockers
**None currently** - Ready to start

### Active Risks
1. **AI API reliability** - Mitigation: Retry logic, fallback prompts
2. **OCR accuracy** - Mitigation: Manual correction UI, clear expectations
3. **Rate limit effectiveness** - Mitigation: Strict enforcement, monitoring

### Key Decisions Made
1. **AI Provider**: Gemini 2.0 Flash via AI SDK (fast, cost-effective)
2. **Streaming**: SSE via AI SDK `streamObject` (standard, reliable)
3. **Rate Limiting**: In-memory token bucket (simple, serverless-friendly)
4. **PDF Parsing**: pdf-parse + Tesseract.js (lightweight, client-side OCR)
5. **Caching**: 1-hour DB cache for identical requests (cost reduction)

### Next Immediate Actions
1. ✅ Create Phase 4 workspace - DONE
2. ✅ Write index.md with 3 sections - DONE
3. ⏭️ Deploy context-gatherer agent - NEXT
4. ⏳ Deploy 3 systems-researcher agents (after context)
5. ⏳ Deploy planner-architect agent (after research)

---

## Quick Reference

### Phase 4 Scope (6 Core Features)
1. PDF Import & Extraction
2. AI-Powered Resume Parsing
3. AI Resume Generation
4. Content Enhancement
5. Job Description Matching
6. AI Infrastructure (rate limiting, quota, caching)

### Database Changes
- 3 new tables: ai_operations, ai_cache, user_ai_quotas
- 0 modified tables (reuses existing resumes table)

### API Endpoints (12 total)
- AI: /import, /generate, /enhance, /match, /quota
- Import: /pdf, /ocr
- Plus repository endpoints from Phase 2

### Components (25+ total)
- AI: 8 components (assistant, chat, suggestions, feedback, quota, rate limit, streaming, error boundary)
- Import: 7 components (uploader, preview, extractor, wizard, review, corrections, OCR status)
- Enhancement: 6 components (panel, bullet enhancer, summary gen, keyword matcher, skills extractor, suggestion preview)

### Performance Budgets
- AI first token: <1s
- PDF parsing: <2s
- Enhancement: <3s
- OCR: <5s/page
- Streaming connection: <500ms
- UI update: <16ms (use existing RAF batching)

### Success Criteria
- All 4 playbooks passing
- All performance budgets met
- Rate limiting functional
- Zero critical code issues
- Build succeeds with zero errors
- Visual verification complete

---

**Last Updated**: 2025-10-01
**Maintained By**: Orchestrator Agent
**Phase Status**: IN PROGRESS - Step 1 (Context Gathering) preparing
