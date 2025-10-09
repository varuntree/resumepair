# Expanded Implementation Plan

## Part 0 – Tracking & Governance Setup
0.1 Create long-lived progress tracker in `agents/workspace/templates/PROGRESS.md` capturing phases, milestones, owners, status, dates, blockers, and assumptions.
0.2 Establish run workspace under `AI_docs/temp_plan/run_20251008_2251` with supporting planning files; maintain `.agent_state.json` for resumability.
0.3 Record repository orientation (top-level modules, key entry points) plus current assumptions in the tracking log.

## Part 1 – Phase 1: Foundation & Infrastructure
1.1 Extend resumes schema/types to support Reactive-Resume requirements (3D layout array, renamed layout_settings, expanded template ids, default appearance).
1.2 Introduce/adjust artboard store adapters mapping `ResumeJson`/`CoverLetterJson` to new normalized documents; ensure compatibility with forthcoming templates.
1.3 Port shared presentation components (Page, Section, Link, LinkedEntity, Picture, BrandIcon, Rating, etc.) and utilities from source; integrate Tailwind styles for artboard rendering; wire Phosphor icons and sanitize-html.
1.4 Update live preview pipeline to consume new store adapters and styles (iframe bootstrapping, Tailwind CSS import, state wiring).
1.5 Validate foundation: lint/type-check/build; manual smoke for preview render with sample resume; document results in tracker.

## Part 2 – Phase 2: PDF Per-Page Processing
2.1 Analyze current exporter, replace single-pass logic with per-page DOM cloning and PDF buffer collection; integrate pdf-lib for final merge.
2.2 Implement utility helpers for page extraction, CSS injection, image loading synchronization, and Puppeteer lifecycle management with retries/logging.
2.3 Instrument PDF generation (timings, page count, template id) and expose structured logs; ensure custom CSS injection is respected.
2.4 Update API route(s) invoking exporter to leverage new options and handle error propagation; ensure unit conversions or page sizing consistent.
2.5 Validate exports via manual smoke (1,2,4-page resumes) and capture metrics in tracker; rerun lint/type-check/build.

## Part 3 – Phase 3: Template Migration (12 Templates)
3.1 Replace legacy template files with Reactive-Resume counterparts (onyx, kakuna, leafish, azurill, bronzor, chikorita, nosepass, rhyhorn, gengar, glalie, ditto, pikachu); adjust imports/utilities as needed.
3.2 Update template registry and metadata catalog including thumbnails, descriptions, ordering, default selections.
3.3 Ensure shared components/utilities cover template needs (rich text sanitization, icon usage, conditional rendering, layout mapping).
3.4 Refresh customization UI (template gallery, live preview) to enumerate all templates; add lazy-loading or bundle-splitting strategy if required.
3.5 Smoke-test each template (preview + export) using representative data; document findings and any follow-up tasks in tracker.

## Part 4 – Phase 4: Fonts & Layout Customization
4.1 Import Google Fonts metadata (`fonts.ts`) and integrate webfontloader; ensure dynamic font loading for preview/export.
4.2 Implement typography customization UI (font selector, size, line-height controls) with persistence to document appearance.
4.3 Build drag-and-drop layout editor leveraging @dnd-kit: support per-page per-column section ordering, add/remove page controls, reset defaults.
4.4 Wire customization state to artboard layout (store and preview) so template rendering reflects live changes.
4.5 Validate fonts/layout adjustments via manual smoke; check rendering stability and autosave; record outcomes.

## Part 5 – Phase 5: Migration & Validation
5.1 Develop data backup script capturing existing resumes (JSON export) prior to migration; store location documented.
5.2 Implement migration script updating resume appearance/template fields, generating default layouts, mapping old templates to new ones, and handling edge cases.
5.3 Provide rollback script to restore pre-migration snapshot if required.
5.4 Create operational runbook detailing staging rehearsal, production deployment steps, verification checklist, and communication plan.
5.5 Execute staging migration test, capture metrics/logs; refine scripts; update tracker with results.

## Part 6 – Finalization & Cleanup
6.1 Remove legacy template assets, CSS, unused utilities, and outdated docs; ensure no references remain.
6.2 Update relevant documentation (README, ai_docs project files) to reflect new template system, customization features, and migration outcomes.
6.3 Run final quality gates (lint/type-check/build/dependency audit) and conduct comprehensive smoke (preview + export + customization + migration dry-run where feasible).
6.4 Close out progress tracker with summary, decisions, assumptions, follow-up work; ensure `.agent_state.json` indicates completion.
