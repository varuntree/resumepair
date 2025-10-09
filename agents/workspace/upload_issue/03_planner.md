Planner Agent — Final Plan

Goals
- Ensure PDF upload/generation streams to completion and emits `complete`.
- Prevent autosave from wiping unsaved AI-applied content when `data` fails validation.

Plan (Surgical)
1) Relax generation-time validation to match real-world PDFs
   - File: `libs/validation/resume-generation.ts`
   - Actions:
     - Make `profile.email` optional (GenerationProfileSchema).
     - Accept `YYYY-MM` or `YYYY-MM-DD` for work/education dates.
     - Make key arrays optional with `.default([])` (work/education/projects/skills).
   - Rationale: Avoid hard stops; still sanitize + normalize before preview/storage.

2) Stop autosave from overwriting unsaved content when validation fails
   - File: `stores/createDocumentStore.ts`
   - Actions:
     - Track whether `updates.data` was included; only overwrite local `document` from server when `data` was sent.
   - Rationale: Preserve user-applied generated content locally until it becomes storage-valid.

3) Manual QA
   - PDF upload with partial sections (no email, month-only dates) → stream should complete.
   - Apply-to-Editor → preview persists after autosave; server version increments only if data valid.
   - Confirm subsequent manual edits that fix validation allow data to persist on save.

Non-Goals
- Do not change storage schema at this time.
- No UX changes beyond preserving content and completing streams.

Risks & Mitigations
- Risk: Some generated outputs still fail strict storage validation.
  - Mitigation: Normalization remains; save only when valid; user can edit fields to meet strict schema.
- Risk: Version increments without data.
  - Mitigation: We avoid overwriting local document; optional future refinement to only send title when changed.

