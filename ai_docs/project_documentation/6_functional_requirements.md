# 5) Functional Requirements Specification (FRS)

**Product**: AI‑assisted Résumé & Cover‑Letter Builder
**Scope**: All end‑user functionality and system behaviors for v1. Non‑functional performance budgets are referenced but defined in the Performance Requirements doc later. This FRS treats **runtime schemas** (`ResumeJson`, `CoverLetterJson`) as the single source of truth for content, and assumes the DB and API contracts already delivered.

---

## 1. Goals & Constraints (Binding)

* **Simplicity first**: 60s to first draft, minimal steps to export.
* **Schema‑driven**: All editors, AI, templates, exports, and scoring use the same JSON schemas.
* **Mobile‑first**: All flows must be fully usable on small screens (≤ 375px width).
* **Design tokens only**: No hard‑coded colors/sizes; UI must read from centralized tokens.
* **Decoupled**: Replaceable AI provider, export engine, and templates without changing editor logic.
* **Auth**: Google OAuth (Supabase) only. No other providers.
* **No marketing features** in v1; no emails; no payments.
* **Security**: RLS on all entities; private storage with signed URLs.

---

## 2. Actors & Personas

* **Visitor (unauthenticated)**: Can view landing/marketing (out of scope), must sign in to use the app.
* **Authenticated User**: Creates and manages documents; uses AI and import; exports.
* **System**: AI orchestrator, PDF exporter, scoring engine.

---

## 3. High‑Level Use Cases

1. **Create résumé**

   * a) Manual start
   * b) Import from PDF (with optional OCR)
   * c) AI zero‑to‑draft (freeform input + optional job description)

2. **Create cover letter**

   * Mirror the three start modes above.

3. **Edit document**

   * Add/reorder sections, change template, tweak **document theme tokens** (colors/typography/spacing/icons), see live preview, undo/redo.

4. **Score document**

   * See overall & sub‑scores; view suggestions; apply quick fixes.

5. **Export**

   * PDF with selected template; preflight checks; download.

6. **Manage documents**

   * List, search by title, duplicate, soft‑delete, restore from version history.

7. **Profile & Defaults**

   * Locale, page size default, date format; avatar.

---

## 4. Functional Requirements (by Module)

### 4.1 Authentication & Profile

* **FR‑AUTH‑1**: Sign in/out using Google via Supabase.
* **FR‑AUTH‑2**: On first sign‑in, create a `profiles` row with defaults (locale, page size, date format).
* **FR‑AUTH‑3**: A signed‑in user can fetch `GET /me` to get `{id, email, name?}` and profile defaults.
* **FR‑AUTH‑4**: Unauthorized access returns `401` with standardized error envelope.

**Acceptance**

* Accessing any `/api/v1/*` protected route without a Bearer token → `401`.
* After sign‑in, dashboard loads user’s document list (excluding soft‑deleted).

---

### 4.2 Document Management (résumé & cover letter)

* **FR‑DOCS‑1**: List documents with pagination, search by `title`, sortable by `updatedAt` (default).
* **FR‑DOCS‑2**: Create document with `title`, `data` (`ResumeJson` or `CoverLetterJson`), `schemaVersion`.
* **FR‑DOCS‑3**: Read, update (full/patch), and soft‑delete documents the user owns.
* **FR‑DOCS‑4**: **Optimistic concurrency**: updates require current `version`. On mismatch return `409`.
* **FR‑DOCS‑5**: **Version snapshots**: after each successful update, store previous version in `document_versions`.
* **FR‑DOCS‑6**: Duplicate document (server‑side copy) increments title suffix (“(Copy)”).

**Acceptance**

* Update with stale `version` fails deterministically with `409` and an explanatory message.
* Deleting sets `deleted_at`; list API excludes soft‑deleted by default.

---

### 4.3 Editor (common to both)

* **FR‑EDIT‑1**: Two‑pane layout (left editor, right live preview) on desktop; mobile uses stacked layout with a toggle and **bottom navigation** to jump sections.
* **FR‑EDIT‑2**: **Live preview** updates within p95 ≤ 120ms of edit; paginated pages with page counters.
* **FR‑EDIT‑3**: Section operations: add, remove, reorder (drag handle on desktop; reorder sheet on mobile).
* **FR‑EDIT‑4**: **Document theme controls** (scoped to the current document only):

  * Color accents (primary/accent/muted),
  * Font family (ATS‑safe list), font size scale, line spacing,
  * Icons on/off; icon size,
  * Date format (US/ISO/EU) & locale preview,
  * Section order presets.
* **FR‑EDIT‑5**: Undo/redo with keyboard shortcuts and buttons; history bounded but practical.
* **FR‑EDIT‑6**: Autosave (debounced); show “Saved • 12:35” indicator.
* **FR‑EDIT‑7**: Validation hints (non‑blocking) for email, phone, missing sections.

**Acceptance**

* Switching templates never changes `data` content; only the view (and export) changes.
* Toggling icons updates preview and does not affect ATS‑safety in exports (icons render as decorative or are omitted).

---

### 4.4 Import from PDF

* **FR‑IMPORT‑1**: Upload PDF (≤ 5MB, ≤ 10 pages for OCR).
* **FR‑IMPORT‑2**: If text layer detected, parse to plaintext; else prompt **OCR** consent with warning on accuracy/time.
* **FR‑IMPORT‑3**: Send parsed text to AI extraction with **strict schema** → `ResumeJson`.
* **FR‑IMPORT‑4**: Show **Review & Fix**: left side = extracted fields; right = preview; allow quick edits.
* **FR‑IMPORT‑5**: “Accept & Create” creates a new document with populated JSON.

**Acceptance**

* If extraction confidence < 0.6, show a red banner requiring review before save.
* Uploading non‑PDF or oversized file yields `400/413` with helpful UI message.

---

### 4.5 AI Zero‑to‑Draft

* **FR‑AI‑1**: A single freeform input accepts personal details and optional job description (JD).
* **FR‑AI‑2**: If `?stream=true`, stream JSON patches; otherwise return full JSON.
* **FR‑AI‑3**: Enforce **“no fabrication”**: never invent employers, dates, or achievements; model may **rephrase** user‑provided content and propose quantified bullets only if numbers are in the input.
* **FR‑AI‑4**: Provide “Keep Original / Use AI Suggestion” for each bullet in a compare view (optional v1 delta mode).
* **FR‑AI‑5**: “Save as Document” persists the draft as a new document.

**Acceptance**

* Network or rate‑limit errors show a retry CTA; content is never lost in the editor buffer.

---

### 4.6 Scoring

* **FR‑SCORE‑1**: Compute score with five sub‑scores (ATS Readiness, Keyword Match, Content Strength, Format Quality, Completeness).
* **FR‑SCORE‑2**: Deterministic checks run locally; optional LLM rubric adds nuance.
* **FR‑SCORE‑3**: Show actionable suggestions with **sectionRef** deep links.
* **FR‑SCORE‑4**: “Quick Fix” applies safe changes (e.g., date style toggle, remove orphan section).

**Acceptance**

* Score refresh after meaningful edits ≤ 1s (with rubric) or ≤ 200ms (deterministic only).
* Clicking a suggestion navigates and focuses the appropriate control.

---

### 4.7 Templates & Document Theme

* **FR‑TEMPL‑1**: Template gallery with 3–6 options per document type; each card lists features (photo support, two‑column).
* **FR‑TEMPL‑2**: Selecting a template updates the preview instantly.
* **FR‑TEMPL‑3**: **Document theme tokens** (colors/typography/spacing/icons) are scoped to the document and override app defaults inside the preview/export only; never change the global app theme.
* **FR‑TEMPL‑4**: Photo slot (template‑dependent); if absent, fall back to monogram.

**Acceptance**

* Switching template preserves all content; re‑render time ≤ 200ms on typical docs.

---

### 4.8 Export

* **FR‑EXP‑1**: Export dialog: choose template, page size, margins (simple presets), and whether to include icons.
* **FR‑EXP‑2**: **PDF**: HTML→PDF on server with print CSS; selectable text guaranteed.
* **FR‑EXP‑4**: Preflight ATS check warns if risky layout choices are enabled (e.g., tiny font).

**Acceptance**

* PDF export ≤ 2.5s for 1–2 pages.
* In case of 504 timeout, UI offers simpler template option and a retry button.

---

### 4.9 Storage (Media)

* **FR‑STOR‑1**: (avatars removed from scope). Future image uploads, if any, write to `media` under `userId/...`.
* **FR‑STOR‑2**: Client cropper; compression for large images.
* **FR‑STOR‑3**: Signed URL with short TTL; never store public links by default.

**Acceptance**

* Uploading an unsupported type shows a validation error prior to network request.

---

### 4.10 Settings

* **FR‑SET‑1**: App defaults (locale, page size, date format) in Profile.
* **FR‑SET‑2**: Document‑level theme overrides only within the document.

---

### 4.11 Navigation, Breadcrumbs & Mobile

* **FR‑NAV‑1**: **Sidebar** with top‑level groups and **sub‑navigation** (e.g., *Create Document* → { Résumé, Cover Letter, Import, AI Draft }).
* **FR‑NAV‑2**: **Breadcrumbs** on every working screen: `Home / Documents / {Document Title}`.
* **FR‑NAV‑3**: **Mobile**: persistent **top app bar** with a sidebar toggle + **bottom navigation** (Home, Create, Documents, Templates, Account). Sub‑groups open in a bottom sheet or drawer; never more than two levels deep.

**Acceptance**

* Breadcrumb item taps are navigable; on mobile, crumbs collapse with a chevron overflow.

---

### 4.12 Error Handling & Rate Limits (User‑visible)

* **FR‑ERR‑1**: All API errors use the standard envelope; UI shows concise messages and preserves user input.
* **FR‑ERR‑2**: Rate limit exceeded → toast + inline hint with “wait and retry” countdown.
* **FR‑ERR‑3**: Import/Export failures provide actionable next steps (try OCR / try simpler template).

---

### 4.13 Accessibility & i18n

* **FR‑A11Y‑1**: WCAG AA contrast; icons have text labels; focus order matches visual order.
* **FR‑A11Y‑2**: Screen reader labels on all controls; breadcrumbs use `nav[aria-label="Breadcrumb"]`.
* **FR‑I18N‑1**: Dates/addresses/phones respect locale; RTL supported via per‑block `dir="rtl"` if needed.

---

## 5. Edge Cases (Selected)

* Extremely long names/headlines → auto shrink (min 12pt) and wrap gracefully.
* Empty sections hidden by default; toggling on shows an empty state with guidance.
* Scanned PDFs with mixed rotation → OCR page‑by‑page; warn if rotated pages detected.
* Non‑Latin scripts → use Noto fallbacks and embed fonts in PDF.
* Offline/spotty network → edits queue until connectivity, autosave retries.

---

## 6. Acceptance Summary (global)

* **Preview p95 ≤ 120ms** after keystroke.
* **Export success ≥ 99.5%**, with selectable text in PDF.
* **AI invalid JSON** automatically retried; if still invalid, user gets a clear remediation prompt.
* **No data loss** due to navigation: unsaved changes prompt on route leave.

---
