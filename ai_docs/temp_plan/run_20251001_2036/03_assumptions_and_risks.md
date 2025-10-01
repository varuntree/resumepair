# Assumptions and Risks

## Assumptions
- PLAN_PATH: Using `agents/phase_3/principal_engineer_review.md` as the authoritative plan for Phase 3 fixes and verification.
- Case sensitivity: Instructions referenced `AI_docs/`; repository uses `ai_docs/`. Proceeding with `ai_docs/` and noting the discrepancy.
- Thumbnails: Placeholder SVGs are acceptable; metadata updated to `.svg` paths.
- Performance: Minimal CSS tokenization is sufficient for this pass.

## Risks & Mitigations
- Risk: Changing metadata thumbnail extensions could break any hardcoded `.png` consumers.
  - Mitigation: Updated only template metadata and gallery uses metadata; no direct asset import.
- Risk: Schema coercion may adjust user’s local persisted state.
  - Mitigation: Gentle coercions with logging; aligns to domain types; avoids crashes.
- Risk: LivePreview UI layout shift after adding controls.
  - Mitigation: Controls placed outside paging content; tested visually during smoke.
