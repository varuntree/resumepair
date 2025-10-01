# Expanded Plan (Phase 3 Fixes + Workspace Ops)

1. Workspace bootstrap
   1.1 Create ai_docs/temp_plan/run_YYYYMMDD_HHMM and LATEST pointer
   1.2 Record PLAN_PATH and repo summary
2. Implement fixes
   2.1 TemplateRenderer fallback via try/catch
   2.2 Integrate PreviewControls into LivePreview
   2.3 Align Zod schema in templateStore (icons.color string; layout enums/nulls)
   2.4 Tokenize obvious px in 1–2 template CSS files (modern, technical)
   2.5 Add a11y labels to icon-only controls (zoom, viewport, page nav)
   2.6 Provide template thumbnails (SVG) and update metadata
   2.7 Add missing visual review placeholder doc
3. Quality gates
   3.1 Type-check (tsc --noEmit)
   3.2 Build (next build)
   3.3 Lint (next lint)
   3.4 Dependency audit (npm audit)
4. Smoke actions
   4.1 Verify LivePreview renders with controls
   4.2 Switch template updates preview (store wiring intact)
   4.3 Check gallery loads metadata and thumbnails
5. Review & cleanup
   5.1 Update tracking with outcomes
   5.2 Confirm no dead code introduced
   5.3 Finalize Done section
