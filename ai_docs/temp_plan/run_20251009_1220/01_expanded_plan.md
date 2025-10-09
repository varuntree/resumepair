# Expanded Plan — Artboard Styling Remediation

## Part 1 — Tailwind Contract Alignment
1.1 Compare existing `public/artboard/tailwind.css` and source `apps/artboard` build to enumerate required utilities (spacing classes such as `p-custom`, typography variations, color tokens).  
1.2 Introduce/adjust a dedicated Tailwind config for the artboard that mirrors the source project (content globs, spacing = `var(--margin)`, color tokens using `var(--color-*)`).  
1.3 Regenerate the artboard CSS bundle (`public/artboard/tailwind.css`) using the updated config; verify inclusion of required utilities.

## Part 2 — CSS Variable Contract
2.1 Extend `buildArtboardStyles` to emit the full variable set consumed by the regenerated bundle (color, spacing, typography, line-height, prose overrides).  
2.2 Implement a robust color converter that accepts hex/RGB inputs and outputs Tailwind-compatible HSL component strings for variables consumed via `hsl(var(--primary))`.  
2.3 Ensure metadata creation (`mapResumeToArtboardDocument`) provides default margin, line-height, and typography values consistent with the contract (update defaults if necessary).  
2.4 Validate preview and PDF exporter share the same build by confirming server-side HTML injection uses the new variable schema.

## Part 3 — Type & Process Cleanup
3.1 Update template registry types to use `TemplateProps` and reconcile any compile-time errors surfaced.  
3.2 Document the CSS regeneration workflow and the variable contract in the workspace docs (`PROGRESS.md` and/or new README entry).  
3.3 Run quality gates (lint, type-check, build) and record manual smoke outcomes for preview + PDF.

