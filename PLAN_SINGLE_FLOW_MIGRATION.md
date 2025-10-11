# ResumePair Single-Flow AI Generation Migration Plan

Status: Draft (ready for execution)
Owner: Engineering
Last updated: 2025-10-11

## Objectives
- Replace the multi-phase (sanitize → normalize → validate) AI pipeline with a single-flow generator using Vercel AI SDK structured output + Zod repair/validation.
- Eliminate silent data loss in normalization; instead, return warnings and inject safe defaults.
- Keep API contract stable for the UI: continue returning `ResumeJson` from the unified route.

## Success Criteria
- API `POST /api/v1/ai/unified` returns `{ success: true, data: ResumeJson, warnings, usage }` within 60s for text and ≤10 MB PDF inputs.
- `raw` is populated in generator result for logging/debug.
- No references to `libs/sanitization/resume.ts` remain; route no longer chains sanitize/normalize.
- Manual runs with provided sample PDF complete without crashes; structured sections present (≥ profile, summary, ≥1 of work/education/projects/skills).

## Non-Goals
- Changing templates, preview, persistence, or editor UX.
- Reworking cover-letter generation (kept as-is for now).

## Approach Overview
1) Introduce a permissive AI output schema dedicated to LLM results.
2) Replace the generator to perform: prompt build → `generateObject` with schema → repair on error → normalize → inject defaults → strict `ResumeJson`.
3) Remove sanitize/normalize chaining from the AI path (generator handles it internally) while keeping normalizers for non-AI usages (e.g., customization panel, repository writes).
4) Add warnings surface to the API response (and optionally to a “generation details” panel later).

## Detailed Execution Plan

1. Inventory & Safety
- [ ] Search for all imports of `sanitizeResumeData` and `normalizeResumeData` in AI flow; confirm only the generator uses them directly.
- [ ] Confirm `ai` package version supports `generateObject` structured outputs (present in package.json as `ai@^5`).

2. Add LLM Output Schema (Permissive)
- [ ] Add `libs/validation/resume-ai.ts` containing a permissive `ResumeAIOutputSchema` (flexible dates, optional arrays/fields). This is used only to parse the model’s structured output.

3. Replace Generator (Single-Flow)
- [ ] Overwrite `libs/ai/resumeGenerator.ts` with the single-flow version:
  - Calls `generateObject({ model: google('gemini-2.5-flash'), schema: ResumeAIOutputSchema })` with `messages` content including optional `{type: 'file'}` for PDFs.
  - On `NoObjectGeneratedError` / `TypeValidationError`, call `repairText` once, then re-validate.
  - Map permissive output → strict `ResumeJson` with defaults via `createDefaultSettings`, `createDefaultAppearance`, `createDefaultLayout`.
  - Return `{ resume, raw, usage, warnings }`.

4. Remove Triple-Validation Stage
- [ ] Delete `libs/sanitization/resume.ts`.
- [ ] In `libs/repositories/normalizers.ts`, keep exports for non-AI paths, but stop using them inside the generator.

5. Route Wiring (Unified)
- [ ] Ensure `app/api/v1/ai/unified/route.ts` passes `parts` (text + optional PDF) directly to `generateResume`.
- [ ] Remove any attempts to post-process generator output via sanitize/normalize in this route (it already expects `ResumeJson`).
- [ ] Merge `result.warnings` with the route’s heuristic warnings (optional) before returning.

6. Logging & Quota (No change in contract)
- [ ] Keep `persistUsage(...)` calls; the generator returns token usage where supported.
- [ ] Keep rate limiting as implemented (`checkDailyQuota`/`incrementQuota`).

7. Cleanup & Dead Code
- [ ] Remove stale imports from files that referenced deleted sanitizer.
- [ ] Ensure no lingering references in `agents/temp/pack.xml` or scripts.

8. Documentation Updates
- [ ] Update `/ai_docs/project/06_api.md` (if needed) with note: single-call structured output + repair; same route path.
- [ ] Add short developer note in `libs/ai/resumeGenerator.ts` header explaining the single-flow rationale.

## File Change List (surgical)
Add:
- `libs/validation/resume-ai.ts` (new permissive schema for AI output).

Replace:
- `libs/ai/resumeGenerator.ts` (single-flow; returns warnings and raw).

Delete:
- `libs/sanitization/resume.ts` (entire file).

Keep (no change but used by the generator):
- `types/resume.ts` defaults (`createDefaultSettings`, `createDefaultAppearance`, `createDefaultLayout`).
- `libs/ai/prompts.ts` for building user/system content (optional; generator may inline system prompt).

## Testing Plan (end-to-end)

Pre-reqs:
- Ensure `GOOGLE_GENERATIVE_AI_API_KEY` is set in `.env.local`.
- Do NOT start/stop the dev server from scripts here; run `npm run dev` separately when you’re ready.

1) Unit-ish (Schema and mappers) — no test framework
- [ ] Add/adjust `scripts/test-schema.ts` (already present) to parse a few AI-output variants with `ResumeAIOutputSchema` and then map through the generator’s normalize→defaults path.
- [ ] Expect: no throws; `ResumeJson` contains defaults; warnings include any dropped entries.

2) Manual Integration via Node script
- [ ] Use `scripts/manual/test-resume.ts` (present) to run:
  - Text-only generation
  - Editor-data only generation
  - Combined text + editor-data
  - PDF import using your provided file: set `pdfPath` to `agents/temp/temp_resume.pdf`.
- [ ] Expect: JSON returned; `warnings` array present; counts logged.

3) API Integration (dev server)
- [ ] Start dev server: `npm run dev` (handled by developer).
- [ ] Text flow:
  ```bash
  curl -sS -X POST http://localhost:3000/api/v1/ai/unified \
    -H 'Content-Type: application/json' \
    -d '{
      "docType":"resume",
      "text":"Hiring Senior Frontend Engineer ...",
      "personalInfo":{"name":"Alex Doe","email":"alex@example.com"}
    }' | jq .
  ```
- [ ] PDF flow:
  ```bash
  node -e "const fs=require('fs');console.log(JSON.stringify({docType:'resume',fileData:fs.readFileSync('agents/temp/temp_resume.pdf','base64'),mimeType:'application/pdf'}))" \
  | curl -sS -X POST http://localhost:3000/api/v1/ai/unified \
      -H 'Content-Type: application/json' \
      -d @- | jq .
  ```
- [ ] Expect: `success: true`, `data.profile.fullName` present, at least one of work/education/projects/skills arrays present, `warnings` included.

4) Quota/Usage
- [ ] Trigger a few runs and verify `ai_operations` rows created and `user_ai_quotas` increments via Supabase dashboard.

5) Regression: Cover Letter
- [ ] POST `docType: 'cover-letter'` with a simple JD string; expect unchanged behavior.

## Rollback Plan
- Restore previous `libs/ai/resumeGenerator.ts` and `libs/sanitization/resume.ts` from git.
- Re-add references in generator to `sanitizeResumeData`/`normalizeResumeData` if needed.
- Re-run manual tests to confirm parity.

## Risks & Mitigations
- Provider structured output drift → Use `repairText` once; if still invalid, return 422 with clear error and traceId.
- Large PDFs (>10 MB) → route already short-circuits with a 400.
- Hidden dependencies on sanitizer → pre-commit search ensures no import remains.

## Execution Checklist (to track progress)
- [ ] Add `resume-ai.ts`
- [ ] Replace `resumeGenerator.ts`
- [ ] Delete `libs/sanitization/resume.ts`
- [ ] Update unified route if any sanitize/normalize calls remain
- [ ] Build and typecheck
- [ ] Run manual node tests (text/editor/pdf)
- [ ] Run API curl tests (text/pdf)
- [ ] Verify Supabase usage/quota rows
- [ ] Document results

