# Expanded Plan — Reactive Resume Adoption

## Part 1 — Artboard Renderer Integration
### 1.1 Introduce artboard rendering runtime
- Vendor the minimal Reactive Resume artboard renderer (templates, renderer utilities) under `libs/reactive-artboard/`.
- Wire shared helpers (theme CSS variables, section renderers) and ensure TypeScript build compatibility.

### 1.2 Build ResumeJson → artboard data mapper
- Create deterministic mapper transforming existing `ResumeJson` into the artboard schema (`apps/artboard` data shape).
- Cover resume and cover-letter variants plus default fallbacks for missing fields.

### 1.3 Replace LivePreview with artboard iframe
- Swap `/components/preview/LivePreview.tsx` to mount the new renderer via iframe/React portal.
- Implement postMessage bridge for live updates, undo, and autosave compatibility.

### 1.4 Remove legacy template renderer
- Delete `/libs/templates/**` and related preview utilities once the artboard path passes smoke tests.
- Update imports throughout the app to rely on the new renderer.

## Part 2 — Customization System Overhaul
### 2.1 Extend schema for per-document metadata
- Update `ResumeJson` / `CoverLetterJson` and Zod schemas to include `metadata` (theme, typography, layout, page, customCss).
- Add Supabase migration for storing settings within document JSON.

### 2.2 Replace TemplateStore with document-scoped store
- Remove localStorage-based `TemplateStore`.
- Update Zustand document stores to persist customization metadata alongside document data and autosave via existing API routes.

### 2.3 Implement Reactive-style customization UI
- Rebuild `CustomizationPanel` to expose color pickers, typography selectors, layout controls, and custom CSS editor.
- Apply CSS variables to preview/export via metadata bridging layer.

### 2.4 Ensure export route honors metadata
- Update `/app/api/v1/export/pdf/route.ts` to call artboard renderer with metadata (theme, layout, custom CSS).
- Validate PDF output budgets (<2.5s) and update any streaming responses.

## Part 3 — Editor Forms Modernization
### 3.1 Introduce TipTap-based rich text fields
- Add shared `RichTextField` component using TipTap for summary, work bullets, and cover letter body.
- Migrate relevant section components to use the new field and adjust autosave payloads.

### 3.2 Add skill and language level controls
- Implement slider-based level inputs (0–5) with Zod validation.
- Update UI, stores, and preview mapping to render levels.

### 3.3 Adopt dialog-driven section editors with drag-and-drop
- Replace inline editors with dialog-based forms mirroring Reactive Resume patterns.
- Integrate `@dnd-kit` for section and item ordering; maintain undo/redo compatibility.

## Part 4 — API & Data Flow Alignment
### 4.1 Update API routes for new schema
- Adjust `/app/api/v1/resumes` and `/app/api/v1/cover-letters` handlers to accept metadata and extended fields.
- Ensure versioning/validation occurs before Supabase writes.

### 4.2 Data migration and backfill
- Write Supabase SQL migration to embed default metadata, migrate existing documents, and drop obsolete template columns.
- Provide repair script or job for historical records if needed.

### 4.3 Align scoring and AI endpoints
- Update scoring logic to read from new schema paths.
- Adjust AI drafting/import to emit metadata defaults and new fields.

## Part 5 — Cleanup, Documentation, and QA
### 5.1 Remove deprecated assets and dependencies
- Delete unused components, CSS, and stores replaced during migration.
- Prune `package.json` dependencies tied to legacy renderer.

### 5.2 Documentation updates and final QA
- Update `ai_docs` standards or progress docs describing new systems.
- Run lint/build/type-check/dependency audit and perform manual smoke tests (preview render, customization persistence, export).
