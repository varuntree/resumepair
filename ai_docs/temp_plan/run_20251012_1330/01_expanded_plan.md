# Expanded Implementation Plan

## Part 1 — Pagination Foundations
- 1.1 Introduce pagination data structures (`FlowItem`, pagination result types).
- 1.2 Implement measurement utilities (FlowRoot scanning, margin-aware size capture).
- 1.3 Implement splitting helpers for list/paragraph sub-items.
- 1.4 Implement pagination engine (packing algorithm, widow/orphan handling, metrics output).
- 1.5 Create new `PaginatedArtboardRenderer` that orchestrates FlowRoot render, pagination, cloning, and report callbacks.
- 1.6 Update library exports and CSS helpers to support the new renderer.

## Part 2 — Template Instrumentation
- 2.1 Audit all resume templates and wrap top-level render with FlowRoot container.
- 2.2 Mark render nodes with `data-flow-item`, `data-flow-subitem`, and grouping metadata.
- 2.3 Ensure template components avoid direct DOM mutations incompatible with cloning.
- 2.4 Repeat instrumentation for cover letter template(s).
- 2.5 Remove legacy pagination hints (e.g., `doc-avoid-break`) where superseded.
- _Current status_: Flow helpers added; `onyx` template partially converted. Resume here next session.

## Part 3 — Renderer Integration
- 3.1 Replace `ArtboardRenderer` usage inside iframe mount with the new paginated renderer.
- 3.2 Update iframe bootstrap HTML/CSS injection for FlowRoot + cloned pages.
- 3.3 Wire measurement callbacks (`onPagesMeasured`, `onFrameMetrics`) to paginator outputs.
- 3.4 Ensure cleanup logic disposes FlowRoot state between renders.

## Part 4 — Interaction Layer Overhaul
- 4.1 Update `PreviewContainer` to enforce event isolation (wheel capture, Ctrl/Cmd zoom, gesture suppression).
- 4.2 Reconfigure `react-zoom-pan-pinch` for discrete zoom (disable wheel zoom, enable pinch/keyboard, conditional pan).
- 4.3 Implement fit-to-width using paginator metrics and padding-aware math.
- 4.4 Track intra-page scroll ratio for accurate restore after repagination.
- 4.5 Update `previewStore` state/actions (zoom ratios, pending scrolls, remove unused viewport flags).

## Part 5 — Preview Component Updates
- 5.1 Refactor `LivePreview` to consume paginator metrics (page offsets, dimensions).
- 5.2 Integrate intra-page ratio restore, fallback logic for empty documents.
- 5.3 Apply equivalent updates to `CoverLetterLivePreview`.
- 5.4 Remove redundant local state now supplied by paginator (manual page size overrides, skeleton handling adjustments).

## Part 6 — Export & Auxiliary Consumers
- 6.1 Update `renderArtboardToHtml` to share paginated renderer without iframe.
- 6.2 Refactor PDF generator to rely on paginator outputs; remove page-by-page screenshot fallback if obsolete.
- 6.3 Update internal preview pages and thumbnail script to mount the new renderer.
- 6.4 Verify AI generation preview path uses consistent renderer contracts.

## Part 7 — Cleanup & Tooling
- 7.1 Delete superseded utilities (`calculatePages`, unused debounce/throttle helpers).
- 7.2 Remove obsolete store fields/components (viewport mode UI if unused, legacy CSS).
- 7.3 Regenerate artboard Tailwind bundle if class names changed.
- 7.4 Update documentation/readme snippets referencing preview architecture.

## Part 8 — Validation & Hardening
- 8.1 Run quality gates (lint, type-check, build, artboard CSS).
- 8.2 Execute manual smoke tests (multi-page resume, AI streaming, PDF export).
- 8.3 Capture comparison artifacts (screenshots/notes) to confirm preview vs PDF parity.
- 8.4 Final housekeeping: ensure logs/dev warnings gated behind development checks, confirm no TODOs.
