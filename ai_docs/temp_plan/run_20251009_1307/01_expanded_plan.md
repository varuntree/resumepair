# Expanded Plan — Template Rendering Stabilization

## Part 1 — Baseline Verification
- Capture current preview behavior for A4 and Letter resumes (screenshots/notes).
- Reproduce PDF export to confirm server renderer crash and log exact error.
- Document baseline zoom limits, navigation behavior, and overflow symptoms.

## Part 2 — Page Dimension Enforcement
- Update `libs/reactive-artboard/components/Page.tsx` to use fixed `height`/`maxHeight` with `overflow:hidden`.
- Ensure page background and padding remain intact after height enforcement.
- Validate `@page` rule usage remains unchanged for PDF exports.

## Part 3 — Preview Container Sizing
- Derive page width/height dynamically from `artboardDocument.metadata.page.format` in `components/preview/PreviewContainer.tsx`.
- Align iframe/container padding and centering with new dimensions.
- Reconfirm zoom transform origin still produces expected anchoring.

## Part 4 — Zoom System Upgrade
- Extend `stores/previewStore.ts` to support 40–200% zoom range, fit-to-width mode, and keyboard shortcuts.
- Update `components/preview/ZoomControl.tsx` UI to expose new presets and fit toggle.
- Introduce optional pan-on-zoom interactions if required (CSS drag or lightweight helper).

## Part 5 — Page Navigation & Layout Sync
- Sync `totalPages` with `artboardDocument.layout.length` within `LivePreview.tsx`.
- Modify `PageNavigation.tsx` to scroll the corresponding page into view and reflect current selection.
- Ensure `Page` components expose stable anchors (`data-page`) for navigation targeting.

## Part 6 — Template Page-Break Semantics
- Audit shared section components to apply `.doc-avoid-break` / `.doc-break-before` utilities where appropriate.
- Adjust individual templates that require explicit break hints for multi-page content.
- Confirm updated Tailwind utilities cover necessary break behavior inside iframe.

## Part 7 — Server Renderer Alignment
- Update `libs/reactive-artboard/server/renderToHtml.ts` to pass `{ columns, isFirstPage }` when instantiating templates.
- Mirror any helper utilities from client renderer to guarantee parity.
- Re-run PDF generation to confirm absence of runtime errors.

## Part 8 — Tailwind/CSS Regeneration
- Regenerate `/public/artboard/tailwind.css` via `npm run artboard:css` if new utilities or variables are introduced.
- Double-check CSS bundle includes page-break classes and variable defaults.
- Reconfirm iframe injection still loads the regenerated bundle correctly.

## Part 9 — Quality Gates & Manual Smoke
- Execute type-check, lint, build, and dependency audit commands.
- Perform manual smokes: multi-page preview, zoom interactions, PDF export for A4/Letter.
- Capture notes for any anomalies and loop back to affected parts if needed.

## Part 10 — Documentation & Tracking Updates
- Update `agents/workspace/templates/PROGRESS.md` and related docs/runbooks with new behavior and status.
- Finalize `TRACKING.md` entries, heartbeats, and part logs.
- Produce resumable `.agent_state.json` update pointing to completion state.
