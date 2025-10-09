Research Agent 1 — PDF Upload Flow (SSE AI)

Symptoms
- User uploads PDF, clicks Generate. Stream processes but stops after ~3 sections; never emits a final complete.

Relevant Code
- Endpoint: app/api/v1/ai/unified/route.ts
- Generation schema: libs/validation/resume-generation.ts
- Storage schema: libs/validation/resume.ts
- Client SSE merge: stores/unifiedAIStore.ts

Findings
1) The unified endpoint uses `streamObject({ schema })` then emits `update` per partial and `complete` after `result.object` resolves (validated against schema).
   - Path: app/api/v1/ai/unified/route.ts: for-await over `partialObjectStream`; then `result.object` inside try/catch, sanitize, normalize, emit `complete`.

2) The “permissive” generation schema imports strict pieces:
   - `ProfileSchema` requires `email` (libs/validation/resume.ts: profile.email is required).
   - `WorkExperienceSchema` requires `startDate` format `YYYY-MM-DD`; spec expects `YYYY-MM` (month precision).
   - `ResumeGenerationSchema` originally enforced `.min(1)` for work/education/projects/skills.

3) Typical PDF extraction output often lacks email or uses month-only dates like `2020-01`.
   - This fails schema validation for `result.object`, causing early termination before `complete` is sent.
   - Recovery path tries parsing `validationError.text` (not guaranteed), so completion can be skipped entirely.

Conclusion (PDF Upload)
- Root cause is schema strictness during generation: required email + strict day-level dates + min(1) arrays. This stops finalization even when partials streamed successfully.

Surgical Fix
- Use a true generation schema variant:
  - `GenerationProfileSchema`: `email` optional.
  - Relax dates to accept `YYYY-MM` or `YYYY-MM-DD` for work/education.
  - Make arrays optional with `.default([])` to avoid hard stops.
- Keep storage strictness unchanged; normalize after generation.

