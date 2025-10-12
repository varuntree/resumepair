# System Architecture

**Purpose**: High-level architecture, module structure, and key system flows.

---

## Table of Contents

1. [High-Level Architecture](#1-high-level-architecture)
2. [Module Structure](#2-module-structure)
3. [Runtime Choices](#3-runtime-choices)
4. [Key Flows](#4-key-flows)

---

## 1. High-Level Architecture

```
┌──────────────────────────────────────────────────────────┐
│  Client (Browser)                                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ Next.js App Router (React 18)                       │ │
│  │ - Pages & layouts                                   │ │
│  │ - Client components (forms, previews)              │ │
│  │ - Zustand stores (state + undo/redo)               │ │
│  │ - shadcn/ui + Tailwind CSS                         │ │
│  └─────────────────────────────────────────────────────┘ │
└──────────────────┬───────────────────────────────────────┘
                   │ HTTP/SSE
                   ▼
┌──────────────────────────────────────────────────────────┐
│  Server (Next.js Route Handlers)                         │
│  ┌──────────────────────┐  ┌──────────────────────────┐ │
│  │ Edge Runtime         │  │ Node Runtime             │ │
│  │ - AI streaming       │  │ - PDF export             │ │
│  │ - Light reads        │  │ - PDF import/OCR         │ │
│  │ - Score calculation  │  │ - File uploads           │ │
│  └──────────────────────┘  └──────────────────────────┘ │
└──────┬───────────────────────────────────┬──────────────┘
       │                                    │
       ▼                                    ▼
┌──────────────────┐              ┌──────────────────────┐
│  Supabase        │              │  Google Gemini 2.0   │
│  ┌─────────────┐ │              │  - Text generation   │
│  │ Auth (RLS)  │ │              │  - PDF processing    │
│  │ - Google    │ │              │  - Structured output │
│  │   OAuth     │ │              │  - Streaming         │
│  ├─────────────┤ │              └──────────────────────┘
│  │ Postgres    │ │
│  │ - Documents │ │
│  │ - Profiles  │ │
│  │ - Versions  │ │
│  ├─────────────┤ │
│  │ Storage     │ │
│  │ - Exports   │ │
│  └─────────────┘ │
└──────────────────┘
```

---

## 2. Module Structure

```
app/
  api/v1/                   # API routes (versioned)
    ai/
      draft/                # POST /resume, /cover-letter (Edge, SSE)
      import/               # POST (Edge, SSE streaming)
      generate/             # AI generation (Edge, SSE)
      enhance/              # Content enhancement (Edge)
    export/
      pdf/                  # POST (Node runtime)
    resumes/                # GET/POST collection; /{id} item routes
    cover-letters/          # Same as resumes
    score/                  # POST resume/cover-letter
    storage/
      upload/               # POST multipart (Node)
    templates/
      resume/               # GET list
      cover-letter/         # GET list
    me/                     # GET profile (Edge)

  (pages)/                  # Page routes
    dashboard/
    editor/[id]/
    templates/
    signin/
    ...

libs/
  api-utils/                # withApiHandler, withAuth, apiSuccess/apiError
  repositories/             # Pure functions for DB access (server-only)
    auth.ts
    documents.ts            # Resumes & cover letters CRUD
    storage.ts
    profiles.ts
  ai/                       # AI SDK wrappers, prompt modules
    prompts/
      p-extract-resume.ts
      p-write-bullets.ts
      p-coverletter-draft.ts
      p-score-rubric.ts
    schemas/
      resume.ts             # Zod for ResumeJson
      cover-letter.ts       # Zod for CoverLetterJson
  scoring/                  # Deterministic checks + LLM composer
  exporters/                # PDF renderer (Puppeteer)
  templates/                # React renderers by slug
    resume/[slug]/
    cover-letter/[slug]/
  preview/                  # HTML paginated preview helpers
  i18n/                     # Date/address/phone formatting
  validation/               # Shared Zod validators
  utils/                    # Misc (cn, SSE helpers, etc.)

migrations/                 # SQL files (file-only per process)
  phase1/
  phase2/
  ...

### Preview System Breakdown

The live preview stack is split across two layers:

- **Interaction shell (client frame)**  
  `components/preview/PreviewContainer.tsx` owns scroll/zoom, isolates wheel + pinch events, and maps paginator offsets to viewport scroll positions. Zoom state lives in `stores/previewStore.ts` (fit-to-width, discrete zoom levels, intra-page ratio restore).
  `components/preview/ArtboardFrame.tsx` mounts an iframe, injects artboard CSS, and renders the paginated renderer while relaying height/offset metrics back to the store.

- **Pagination renderer (iframe + server reuse)**  
  `libs/reactive-artboard/components/FlowRoot.tsx` + template `data-flow-*` markers declare flow items.  
  `libs/reactive-artboard/pagination/*` measures blocks and splits lists into sub-items with widow/orphan control.  
  `libs/reactive-artboard/renderer/ArtboardRenderer.tsx` paginates inside the iframe; the same logic powers `libs/reactive-artboard/server/renderToHtml.ts` so PDF export (`libs/exporters/pdfGenerator.ts`) renders identical HTML and waits for `data-pagination-ready`.

This separation keeps preview, exports, thumbnails, and internal QA routes in lockstep while guaranteeing scroll isolation in the editor.

public/                     # Static assets
components/                 # UI components
types/                      # Shared TypeScript types
```

---

## 3. Runtime Choices

### Edge Runtime
**Use for:**
- ✅ AI streaming (import, generate, enhance, match)
- ✅ Light reads (user profile, template list)
- ✅ Score calculation (deterministic + LLM)

**Constraints:**
- No Node APIs (fs, child_process, etc.)
- No Puppeteer
- Limited npm packages

### Node Runtime
**Use for:**
- ✅ PDF export (Puppeteer + Chromium)
- ✅ PDF import processing (file handling)
- ✅ File uploads (multipart)

**Benefits:**
- Full Node API access
- Larger bundle size allowed
- No Edge constraints

---

## 4. Key Flows

### 4.1 Manual Document Editing

```
User types in editor
  │
  ▼
Zustand state updates (with zundo history)
  │
  ▼
Preview re-renders (<120ms budget)
  │
  ▼
Autosave debounced (2s idle)
  │
  ▼
PUT /api/v1/resumes/{id}
  │
  ▼
Repository updates Postgres (with RLS)
  │
  ▼
Response confirms save
```

### 4.2 PDF Import (Phase 4.5 Refactored)

```
User uploads PDF
  │
  ▼
POST /api/v1/ai/import (Edge, SSE streaming)
  │
  ▼
Gemini multimodal processes PDF
(handles text extraction + OCR natively)
  │
  ▼
SSE streams ResumeJson progress
(progress → update → complete events)
  │
  ▼
Client shows real-time streaming preview
  │
  ▼
Review & Fix UI (diff view)
  │
  ▼
User accepts → Save as new document
```

**Key Changes**:
- Single streaming endpoint (was 2 separate)
- Gemini handles OCR natively (no unpdf, no Tesseract)
- Real-time SSE streaming (like AI generation)
- Edge runtime (faster cold starts)

### 4.3 AI Zero-to-Draft

```
User inputs info + JD
  │
  ▼
POST /api/v1/ai/draft/resume?stream=true (Edge)
  │
  ▼
Gemini generates structured output (Zod schema)
  │
  ▼
SSE streams deltas (text/event-stream)
  │
  ▼
Client hydrates preview incrementally
  │
  ▼
Stream completes
  │
  ▼
User clicks "Save as Document"
  │
  ▼
POST /api/v1/resumes
```

### 4.4 PDF Export

```
User clicks "Export PDF"
  │
  ▼
POST /api/v1/export/pdf (Node)
  │
  ▼
Server SSR renders template HTML (same as preview)
  │
  ▼
Puppeteer launches headless Chromium
  │
  ▼
page.pdf() with print CSS (@page rules)
  │
  ▼
Upload to Supabase Storage
  │
  ▼
Generate signed URL (7 days)
  │
  ▼
Return { downloadUrl, expiresAt }
  │
  ▼
Client triggers browser download
```

### 4.5 Scoring

```
Document changes
  │
  ▼
POST /api/v1/score (Edge)
  │
  ├─► Phase A: Deterministic checks (<200ms)
  │   - ATS readiness (structure, fonts, selectable text)
  │   - Completeness (required fields present)
  │   - Format quality (line length, spacing)
  │
  └─► Phase B (optional): LLM rubric (<1.2s)
      - Gemini analyzes content vs JD
      - Returns keyword match, content strength scores
  │
  ▼
Composite score (0-100)
  │
  ▼
Return { total, dimensions, suggestions }
  │
  ▼
Client updates ScoreDashboard
```

---

## Data Flow Patterns

### State Management
```
Server (Source of Truth)
  │
  ▼
Zustand Store (Client State)
  │
  ▼
React Components (UI)
  │
  ▼
User Actions
  │
  ▼
Optimistic Update (immediate UI feedback)
  │
  ▼
Autosave (debounced)
  │
  ▼
Server Sync (with retry)
  │
  ▼
Confirmation (or rollback on error)
```

### Caching Strategy
- **Server state**: Fresh on every navigation
- **AI responses**: Memory cache (5 min TTL)
- **Templates**: SessionStorage (1 hour)
- **User prefs**: LocalStorage (persistent)
- **Scores**: Memory cache (invalidate on doc change)

---

## Security Boundaries

### Authentication Layer
```
User → Google OAuth → Supabase Auth → JWT
  │
  ▼
Every API request carries Authorization: Bearer <JWT>
  │
  ▼
withAuth middleware validates JWT
  │
  ▼
Extracts user.id for RLS queries
```

### Authorization Layer (RLS)
```
API route → Repository function
  │
  ▼
Pass user-scoped Supabase client
  │
  ▼
RLS policies enforce user_id = auth.uid()
  │
  ▼
Returns only user's data
```

---

## Deployment Architecture

```
Vercel (Serverless)
  ├─ Edge Functions (AI streaming, light reads)
  ├─ Node Functions (PDF export, file processing)
  └─ Static Assets (public/, images)

Supabase Cloud
  ├─ Auth (Google OAuth)
  ├─ Postgres (with RLS)
  └─ Storage (user files, exports)

Google Cloud
  └─ Gemini 2.0 Flash API
```

---

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| Next.js App Router | Server components, Edge support, streaming |
| Edge for AI | Low latency, global distribution, streaming |
| Node for PDF | Puppeteer requires Node runtime |
| Supabase RLS | Built-in security, no service role needed |
| Zustand + zundo | Simple state + undo/redo |
| Gemini 2.0 Flash | Fast, structured outputs, multimodal |
| Puppeteer PDF | WYSIWYG, same HTML as preview |

---

**Next**: Technology Stack (`04_tech_stack.md`)
