# Checklists

## Implementation Checklist
- [ ] 1A — Capture current preview behavior (A4/Letter)
- [ ] 1B — Reproduce PDF export failure and log error
- [ ] 1C — Document baseline zoom/navigation behavior
- [ ] 2A — Enforce fixed height/maxHeight in `Page.tsx`
- [ ] 2B — Preserve padding/background post-update
- [ ] 2C — Verify PDF `@page` rule unaffected
- [ ] 3A — Derive dynamic page width/height in `PreviewContainer`
- [ ] 3B — Align iframe/container spacing with new dimensions
- [ ] 3C — Validate zoom transform origin after sizing change
- [ ] 4A — Extend preview store for 40–200% range + fit mode
- [ ] 4B — Update zoom control UI for new presets/shortcuts
- [ ] 4C — Implement pan-on-zoom interaction (if required)
- [ ] 5A — Sync `totalPages` with layout length in `LivePreview`
- [ ] 5B — Implement scroll-to-page in navigation
- [ ] 5C — Ensure `Page` anchors available for navigation targeting
- [ ] 6A — Apply page-break utilities to shared section components
- [ ] 6B — Adjust individual templates needing explicit break hints
- [ ] 6C — Confirm Tailwind utilities cover break behavior
- [ ] 7A — Pass `{ columns, isFirstPage }` in server renderer
- [ ] 7B — Mirror client helpers for server parity
- [ ] 7C — Re-run PDF export without runtime errors
- [ ] 8A — Regenerate artboard Tailwind bundle if needed
- [ ] 8B — Validate bundle contains required utilities/variables
- [ ] 8C — Confirm iframe loads regenerated CSS
- [ ] 9A — Run type-check, lint, build, dependency audit
- [ ] 9B — Perform manual smokes (preview + PDF)
- [ ] 9C — Record anomalies and re-loop fixes as necessary
- [ ] 10A — Update PROGRESS.md and runbooks
- [ ] 10B — Finalize TRACKING.md heartbeats and part logs
- [ ] 10C — Update `.agent_state.json` to completion state

## Review Checklist
- [ ] Plan alignment — Implementation matches expanded plan scope
- [ ] Correctness — Preview/PDF render identical page dimensions & styling
- [ ] Simplicity — No unnecessary abstractions or leftover toggles
- [ ] Cleanup — Legacy sizing/zoom code removed or updated
- [ ] Quality gates — Type, lint, build, audit results recorded
- [ ] Observability — Errors surfaced appropriately; no muted failures
- [ ] Documentation — Progress and operational notes refreshed
- [ ] Regression scan — Check dependent features (layout editor, exporter)
