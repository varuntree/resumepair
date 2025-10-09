Context Gatherer Report — Upload Issue

Scope
- Server: `app/api/v1/ai/unified/route.ts` (Edge, SSE AI import/generate)
- Validation: `libs/validation/resume-generation.ts`, `libs/validation/resume.ts`
- Normalization: `libs/repositories/normalizers.ts`
- Client SSE store: `stores/unifiedAIStore.ts`
- Apply-to-editor UI: `components/ai/UnifiedAITool.tsx`
- Editor: `app/(app)/editor/[id]/page.tsx`
- Autosave Store: `stores/createDocumentStore.ts` (used by `stores/documentStore.ts`)
- Preview mapping: `libs/reactive-artboard/adapters/resumeData.ts`

Key Observations
- Unified AI endpoint streams partials via SSE and emits a final `complete` event after validation, sanitization, normalization.
- Generation schema intended to be permissive still relies on strict elements from storage schema (e.g., required `profile.email`, dates as `YYYY-MM-DD`).
- Client merges partial updates during streaming; Apply-to-Editor copies `final || partial` into the resume store and resets the AI store.
- Autosave saves after 2s debounce; save includes `title` unconditionally if non-empty, and includes `data` only if storage validation passes.
- Repository `updateResume` always increments version, regardless of which fields changed.

Likely Fault Lines
- Schema mismatch: generation vs storage and vs project spec (dates `YYYY-MM` vs `YYYY-MM-DD`; email required in `Profile`).
- Autosave behavior: if schema validation fails for `data`, request still sends `title`+`version`, returns server state and overwrites local unsaved content.

