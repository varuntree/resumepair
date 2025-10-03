# Product Requirements

**Purpose**: Product vision, user personas, core features, and success criteria for ResumePair.

---

## Table of Contents

1. [Product Vision](#1-product-vision)
2. [Problem & Goals](#2-problem--goals)
3. [User Personas](#3-user-personas)
4. [Core Features](#4-core-features)
5. [Success Metrics](#5-success-metrics)

---

## 1. Product Vision

**ResumePair** is an AI-assisted resume & cover letter builder that delivers:

- **Jobs-level simplicity**: <60s to first draft, minimal steps before result
- **AI-first experience**: Intelligent drafting, parsing, and optimization
- **ATS-safe outputs**: Machine-readable PDFs that pass applicant tracking systems
- **Fast live preview**: Near-instant updates as user types (subjective: "no jitter")
- **Reusable scoring**: Modular scoring component works anywhere in the app

**Principles**:
- Schema-driven (one JSON schema powers everything)
- Serverless-friendly (maintainable, low cost)
- Consistent (templates never modify schema, only read it)

---

## 2. Problem & Goals

### Problem
Most resume builders feel heavy:
- Many inputs before seeing results
- Janky, slow previews
- Outputs that break ATS parsing
- Complex UIs with too many options

### Goals (v1)
- ✅ **<60s to first draft** from any mode (manual, PDF import, AI)
- ✅ **Smooth preview** - p95 ≤ 120ms keystroke → paint
- ✅ **Consistent schema** - One JSON for editor, templates, AI, exports
- ✅ **ATS-safe outputs** - Machine-readable PDFs, standard fonts
- ✅ **Reusable scoring** - Works for any resume/cover letter instance
- ✅ **Serverless-friendly** - Maintainable code, low costs

### Non-Goals (v1)
- ❌ Team collaboration or real-time multi-editor
- ❌ Marketplace for third-party templates
- ❌ Advanced CRM/job tracking
- ❌ Marketing site scoring (product pages only)

---

## 3. User Personas

### Student/Graduate
- **Need**: No prior resume, needs fast starter
- **Pain**: Don't know what to include, format
- **Solution**: AI zero-to-draft mode

### Working Professional
- **Need**: Has existing PDF resume, wants quick polish
- **Pain**: Reformatting, modernizing design
- **Solution**: PDF import → review/fix → customize

### Career Switcher/Immigrant
- **Need**: Localization (dates, addresses, phone formats)
- **Pain**: Different country conventions
- **Solution**: Locale-aware formatting

### Power Users
- **Need**: Precise control over typography, colors, sections
- **Pain**: Limited customization in other tools
- **Solution**: Template customization panel

---

## 4. Core Features

### 4.1 Resume Creation (3 Modes)

**Mode A: Manual**
- Left panel: Form sections (progressive disclosure)
- Right panel: Live paginated preview (HTML)
- Autosave every 2s idle or on blur
- Undo/redo support

**Mode B: PDF Import** (Phase 4.5 Refactored)
- Upload PDF → Gemini multimodal processing (handles text + OCR natively)
- SSE streaming with real-time progress
- Review & Fix UI (diff view)
- Save as new document

**Mode C: AI Zero-to-Draft**
- Freeform input (personal info + job description)
- Gemini generates structured output (ResumeJson)
- Stream first draft via SSE
- Enter editor to refine

### 4.2 Template System

**Gallery**: 6 professional templates
- Modern Minimal (sans, clean)
- Classic Serif (traditional)
- Left-rail (photo-friendly)
- Two-column (dense info)
- Modern Letterhead (cover letter)
- Classic Block (cover letter)

**Customization**:
- Color palette (brand + neutrals)
- Font family (ATS-safe: Inter, Source Sans, Georgia)
- Font size scale (+/-)
- Line spacing
- Icons on/off + set selection (Lucide)
- Date format (US, ISO, EU)
- Section order toggles

**Live Preview**:
- <120ms keystroke → paint budget
- Paginated HTML (Paged.js patterns)
- Template switch preserves content

### 4.3 Cover Letters

Same 3 modes (manual, PDF import, AI)
- Rich text editor for body (bold/italic/underline + bullets)
- Templates: classic block, modern letterhead
- Preview & exports same as resume

### 4.4 AI Integration

**Provider**: Google Gemini 2.0 Flash via Vercel AI SDK
- Structured outputs (Zod schemas)
- Streaming responses (SSE)
- "No fabrication" policy

**Prompts** (modular):
- P-Extract-Resume: PDF/text → ResumeJson
- P-Write-Bullets: Experience + JD → concise bullets
- P-Summarize-Profile: Draft 2-3 sentence summary
- P-CoverLetter-Draft: Generate cover letter blocks
- P-Score-Rubric: Resume + JD → scores + suggestions

### 4.5 Export System

**PDF Generation**:
- Same HTML as preview
- Puppeteer + Chromium (Node runtime)
- <2.5s for 1-2 pages
- Selectable text (never flattened images)
- Font embedding

### 4.6 Scoring (ATO/Resume Score)

**Always visible** collapsible panel

**Overall Score**: 0-100
**5 Sub-scores**:
1. **ATS Readiness** (0-30): Machine-readable, no images-only content
2. **Keyword Match** (0-25): JD coverage, relevant skills
3. **Content Strength** (0-20): Action verbs, quantified impact
4. **Format Quality** (0-15): Line length, spacing, consistency
5. **Completeness** (0-10): Sections present, contact info complete

**Computation**:
- **Phase A** (deterministic): Local checks on JSON (<200ms)
- **Phase B** (LLM rubric): Optional Gemini call for qualitative scoring (<1.2s)

**Output**: Overall + sub-scores + actionable suggestions with quick-fix actions

---

## 5. Success Metrics

### Primary Metrics

| Metric | Target | Definition |
|--------|--------|------------|
| **TTFD** | < 45s median | Time to First Draft (from mode selection to preview) |
| **Export Success Rate** | > 99.5% | PDF downloads succeed (Windows/macOS, Letter/A4) |
| **Preview Latency** | p95 < 120ms | Keystroke → preview paint |
| **ATS Parsing Score** | ≥ 95% | Internal validator: machine-readability |

### Secondary Metrics

| Metric | Target | Definition |
|--------|--------|------------|
| Template Switch | < 200ms | Render time, no content loss |
| PDF Export Time | < 2.5s | 1-2 pages |
| Scoring (deterministic) | < 200ms | Local checks |
| Scoring (with LLM) | < 1.2s | Including Gemini call |

---

## Acceptance Criteria (Representative)

### AC-Preview
- Typing in any field updates preview **within p95 ≤ 120ms**
- No jitter or layout shift during updates

### AC-Templates
- Switching templates **never loses content**
- All sections render correctly in new template
- Switch completes in **< 200ms**

### AC-Export
- PDF downloads succeed **≥ 99.5%** in test matrix
- PDFs have **selectable text** (not images)
- Fonts embedded correctly

### AC-Import
- Given text-layer PDF, **≥ 95% of sections/fields** correctly populated
- OCR fallback flagged when needed
- Review & Fix UI shows all extracted data

### AC-Score
- Score appears in **≤ 1s** after major edit
- Clicking suggestion focuses relevant control
- Suggestions are actionable (not generic advice)

### AC-Security
- RLS policies **block cross-user access**
- Media via **signed URLs only**
- No PII in logs

---

## Feature Priorities (Rollout)

**M0 - Foundations** (1-1.5 weeks)
- Next.js app skeleton
- Supabase auth/storage
- Zustand store
- Design token system

**M1 - Manual Mode & Preview** (2 weeks)
- 3 resume templates + customization
- Smooth preview
- Autosave
- Undo/redo

**M2 - Export** (1 week)
- PDF serverless export (Chromium)
- Tests with long/short content

**M3 - AI Modes** (2 weeks)
- PDF import → extract → schema
- AI zero-to-draft
- Prompts & schema validation

**M4 - Cover Letters** (1 week)
- 2 templates
- Basic formatting
- Exports

**M5 - Scoring** (1 week)
- Deterministic checks + LLM rubric
- Suggestions UI
- Reuse across flows

**M6 - Hardening** (ongoing)
- Accessibility
- i18n edge cases (RTL, fonts)
- Export reliability

---

## Key Product Decisions

### Schema-Driven
- **One JSON** powers everything: editor, preview, templates, AI, exports
- **Templates read-only**: Never modify schema
- **All modes produce same schema**: Manual, PDF import, AI all output ResumeJson/CoverLetterJson

### ATS-Safe by Default
- Standard fonts (Inter, Source Sans, Georgia)
- Simple layouts (avoid complex tables, text in images)
- Machine-readable PDFs (selectable text)
- Icons optional (off by default)

### Performance Budgets
- **Preview**: p95 < 120ms (debounce edits, requestAnimationFrame)
- **Export**: < 2.5s (lightweight HTML, optimized CSS)
- **Scoring**: Deterministic first (< 200ms), optional LLM (< 1.2s)

### AI Integration
- **Structured outputs**: Always use Zod schemas
- **No fabrication**: Strict prompt policy
- **Streaming**: SSE for better UX
- **Retry logic**: Once with repair prompt on invalid JSON

---

## Edge Cases & Rules

- **Very long names/headlines**: Scale down with clamp (min 12pt)
- **Empty photo slot**: Fallback to monogram, maintain layout
- **No experience**: Emphasize skills/projects/education
- **RTL content**: Set `dir="rtl"` for Arabic/Hebrew
- **Scanned PDFs**: Warn about OCR quality, prompt manual review
- **Multi-page overflow**: Show page counter + "Trim suggestions"
- **Phone formats**: Always normalize with libphonenumber

---

## Key Takeaways

1. **<60s to first draft** from any mode
2. **Schema-driven** - One JSON, multiple consumers
3. **ATS-safe by default** - Standard fonts, simple layouts, selectable text
4. **Performance budgets** - 120ms preview, 2.5s PDF, 1.2s scoring
5. **3 creation modes** - Manual, PDF import, AI zero-to-draft
6. **6 templates** - Professional, customizable, ATS-safe
7. **Modular scoring** - Reusable across features

---

**Next**: Data Schemas (`02_schemas.md`)
