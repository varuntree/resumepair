# 1) System Architecture Document

**Product**: AI‑assisted Résumé & Cover‑Letter Builder
**Principles**: Jobs‑level simplicity, schema‑driven, serverless‑friendly, decoupled, replaceable, and versionable.
**Authoritative references**: Use the rules in **Coding Patterns & Rules**, **Design System Documentation**, and **Development Decisions (Fixed Template Rules)** you supplied. This document does not contradict them; where a choice was needed, defaults are set below.

---

## 1. High‑Level Architecture

**Client**: Next.js App Router (React)
**Server**: Next.js Route Handlers (Edge or Node per endpoint)
**Auth & Data**: Supabase (Auth = **Google OAuth only**, DB = Postgres, Storage = buckets)
**AI**: “Virtual” AI SDK → **Google AI for Developers** (Gemini 2.0 Flash) using **structured outputs** (Zod)
**Exports**: HTML→PDF (**Node runtime** with `puppeteer-core` + `@sparticuz/chromium`)
**Design System**: Tailwind + shadcn/ui; CSS Variables tokens in `app/globals.css`
**Icons**: **Lucide React** (free, permissive)
**State**: Zustand + zundo (undo/redo)
**Routing & API style**: RESTful, **/api/v1/** prefix, JSON envelopes, bearer auth (Supabase JWT)
**Observability**: Minimal runtime logging (errors + performance timings) — per fixed decisions

> **Default choices finalized (no user blockers):**
>
> * **AI provider**: Google AI for Developers (API key) via AI SDK.
> * **PDF runtime**: `puppeteer-core` + `@sparticuz/chromium` on Node route handlers.
> * **Page size default**: US locale → Letter; others → A4 (auto).
> * **OCR**: Tesseract **enabled** with a hard limit of 10 pages; user must opt‑in when text layer is missing.
> * **Photos in templates**: Supported in select templates; **off by default**.
> * **Scoring weights**: ATS Readiness 30, Keyword Match 25, Content Strength 20, Format Quality 15, Completeness 10.
> * **Persistence**: Résumé/Cover Letter stored as **versioned JSONB documents** + thin relational metadata.
> * **AI rate limits** (Phase 4.5 simplified): Database-only quota (100 operations/day); graceful 429 with retry-after.
> * **Logging**: Error + perf metrics only; **no analytics**.

---

## 2. Module & Directory Layout

```
app/
  (routes, layouts, pages, server components)
  api/
    v1/
      ai/
        draft/            # POST /resume, POST /cover-letter (Edge; SSE or JSON)
      export/
        pdf/              # POST (Node runtime)
      import/
        pdf/              # POST (Node runtime; OCR fallback)
      resumes/            # GET/POST collection; /{id} item routes
      cover-letters/      # same as resumes
      score/              # POST resume/cover-letter
      storage/
        upload/           # POST multipart (Node)
      templates/
        resume/           # GET list
        cover-letter/     # GET list
      me/                 # GET profile (Edge)
libs/
  api-utils/              # withApiHandler, withAuth, apiSuccess/apiError, errors, middleware
  repositories/           # pure functions (server-only) for DB access
    auth.ts
    documents.ts          # resumes & cover letters (CRUD, versioning)
    storage.ts
    profiles.ts
  ai/                     # AI SDK wrappers, prompt modules, Zod schemas
    prompts/
      p-extract-resume.ts
      p-write-bullets.ts
      p-coverletter-draft.ts
      p-score-rubric.ts
    schemas/
      resume.ts           # Zod for ResumeJson
      cover-letter.ts     # Zod for CoverLetterJson
      score.ts
  scoring/                # deterministic checks + composer
  exporters/              # html->pdf (puppeteer)
  templates/              # React renderers for resume/cover-letter by slug
    resume/[slug]/
    cover-letter/[slug]/
  preview/                # HTML paginated preview helpers (paged-media utilities)
  i18n/                   # dates, addresses, phone formatting helpers
  validation/             # shared input validators (zod)
  utils/                  # misc (cn, pagination helpers, SSE helpers)
migrations/               # phase folders + SQL files (file‑only per process)
```

**Rules enforced**

* No raw API routes: **always** use `libs/api-utils` wrappers.
* Repositories are **pure functions** with DI: never import server repositories into client components.
* All styling via **design tokens** (CSS variables), Tailwind classes, shadcn components.

---

## 3. Data Shapes (Runtime Schemas)

> **DB schema will come in its own document later.** Below are **runtime** shapes shared across client, AI, templates, and API.

### 3.1 `ResumeJson` (v1)

* `profile`: `{ fullName, headline?, email, phone?, location?, links[], photo? }`
* `summary?`: string
* `work?`: array of `{ company, role, location?, startDate, endDate|null|"Present", descriptionBullets[], achievements[], techStack[] }`
* `education?`: array of `{ school, degree, field?, startDate?, endDate?, details[] }`
* `projects?`: array of `{ name, link?, summary?, bullets[], techStack[] }`
* `skills?`: array of `{ category, items[] }`
* `certifications?`, `awards?`, `languages?`, `extras?`: arrays
* `settings`: `{ locale, dateFormat, addressFormat?, fontFamily, fontSizeScale, lineSpacing, colorTheme, iconSet: "lucide", showIcons, sectionOrder[], pageSize: "A4"|"Letter" }`

### 3.2 `CoverLetterJson` (v1)

* `from`, `to`, `date`, `salutation`, `body` (paragraph blocks with **marks**: bold/italic/underline), `closing`, `settings` (same knobs as résumé).

### 3.3 Document wrapper (persisted)

* `id: uuid`, `ownerId: uuid`, `type: "resume"|"cover-letter"`, `title`, `slug?`,
  `version: integer`, `schemaVersion: "resume.v1" | "cover-letter.v1"`,
  `data: ResumeJson | CoverLetterJson`,
  `score?`, `createdAt`, `updatedAt`, `deletedAt?`

> **Versioning**: Always bump `schemaVersion` when changing shapes; exporters and templates read by version to avoid breakage.

---

## 4. Key Flows (Sequence Overviews)

### 4.1 Manual Editing (Résumé)

1. Client loads document → pulls latest `data` JSON.
2. User types → Zustand updates → zundo records patch → preview re-renders (paginated HTML).
3. Autosave (debounced) → `PUT /resumes/{id}` with updated JSON.
4. Score recalculates locally (deterministic) and optionally calls `POST /score` for rubric hints.

### 4.2 PDF Import → ResumeJson (Phase 4.5 Refactored)

**Current Implementation** (Phase 4.5):
1. User uploads PDF → `POST /api/v1/ai/import` (Edge, SSE streaming)
2. Gemini multimodal processes PDF directly (handles text extraction + OCR automatically)
3. SSE streams `ResumeJson` progress with events: `progress` → `update` → `complete`
4. Client shows real-time streaming preview → Review/Fix view → user accepts → save as new doc.

**Key Changes from Phase 4**:
- ~~Two endpoints~~ → Single streaming endpoint
- ~~unpdf + separate Gemini call~~ → Gemini multimodal (native PDF processing)
- ~~Node runtime~~ → Edge runtime (faster cold starts)
- ~~No streaming~~ → Real-time SSE streaming (identical to AI generation flow)
- ~~Tesseract.js OCR~~ → Gemini built-in OCR

### 4.3 AI Zero‑to‑Draft

1. Client posts freeform input (+ optional JD) to `POST /ai/draft/resume?stream=true`.
2. Edge route streams SSE deltas; client hydrates draft preview live.
3. On stream end → user can “Save as Document”.

### 4.4 Export (PDF)

1. Client calls `POST /export/pdf` (Node) with `{ documentId, templateSlug, overrides? }`.
2. Server SSR renders template HTML → headless Chromium prints PDF with print CSS.
3. Return `application/pdf` (download).

### 4.5 Scoring

* **Phase A** (deterministic, local): ATS checks, layout rules, completeness.
* **Phase B** (LLM rubric, optional): short GEMINI call → sub‑scores & suggestions.
* API `POST /score` composes both phases when needed (for server-authoritative result).

---

## 5. Runtimes & Performance Budgets

| Concern                      | Runtime | Budget/Notes                                             |
| ---------------------------- | ------: | -------------------------------------------------------- |
| AI draft (stream)            |    Edge | TTFD < 1s; full draft < 6s typical                       |
| PDF import (parse/OCR)       |    Node | Parse < 2s for 2 pages; OCR only on opt‑in; max 10 pages |
| Live preview keystroke→paint |  Client | p95 ≤ 120ms                                              |
| PDF export                   |    Node | ≤ 2.5s for 1–2 pages                                     |
| Scoring (deterministic)      |  Client | ≤ 200ms                                                  |
| Scoring (with LLM)           |    Edge | ≤ 1.2s                                                   |

---

## 6. Security, Auth, and Authorization

* **Auth provider**: **Google OAuth only** via Supabase Auth.
* **Authorization**: RLS on all tables; repository layer always passes `user.id`.
* **Server secrets**: AI keys and storage secrets only on server routes.
* **Storage**: Signed URLs with short TTL for media; validation on upload (type/size).
* **PII**: No content logging; redact emails/phones from error reports.
* **CORS**: Default same‑origin; no public write endpoints.

---

## 7. Resilience & Failure Modes

* **AI invalid JSON** → retry with repair; return 422 with details if still invalid.
* **PDF export timeout** → 504 with suggestion; prompt user to try simpler template or reduce content.
* **OCR low confidence** → mark `confidence < 0.6` and force Review/Fix view.
* **Rate limit exceeded** → 429 with `Retry-After`.
* **Schema mismatch** → 409 with migration hint (client offers “clone into latest schema”).

---

## 8. Internationalization

* **Dates** via `Intl.DateTimeFormat`; user locale drives default.
* **Addresses** via formatter util (rules per country).
* **Phones** via libphonenumber util.
* **RTL**: Template CSS supports `dir="rtl"`.

---

## 9. Versioning & Extensibility

* **HTTP versioning**: `/api/v1/...` (major‑only in path).
* **Schema versioning**: `schemaVersion` per document.
* **Template contract**: new templates live under `libs/templates/...` and accept the same props; feature flags allow staged rollout.
* **Replaceability**: AI provider can be swapped (AI SDK abstraction); PDF engine can be moved to a microservice later without client changes.

---

## 10. Observability (Minimal)

* **Server logs**: route + duration + status + error code.
* **Client**: non‑PII error notices (Sentry‑style optional, but by default log to console in dev).
* **No analytics** per fixed decisions.

---

## 11. Compliance with Your Fixed Patterns

* Repositories: **pure functions**, DI of Supabase client.
* API: **withApiHandler/withAuth** wrappers only; unified `ApiResponse<T>`.
* Migrations: **file‑only** until explicit approval.
* UI: Tailwind + shadcn/ui; **no** DaisyUI/third‑party UI libraries.
* Icons: **Lucide** only.
* Testing/CI/CD: **none** (explicitly omitted).

---