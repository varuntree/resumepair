# Expanded Execution Plan

## Part 1 – Introduce AI Output Schema
1.1 Create `libs/validation/resume-ai.ts` with permissive schema matching plan requirements.
1.2 Ensure exports include `ResumeAIOutputSchema`, `ResumeAIOutput`, and helper date regex.
1.3 Document schema intent via brief comment for maintainers.

## Part 2 – Replace AI Resume Generator
2.1 Rewrite `libs/ai/resumeGenerator.ts` to single-flow implementation (structured output + repair).
2.2 Implement normalization helper inside generator mapping AI output → `ResumeJson`, injecting defaults and warnings.
2.3 Preserve cover-letter generation behavior (reuse existing logic or stub per plan).
2.4 Remove legacy logging that references sanitizer stages; add succinct logs if needed.

## Part 3 – Remove Legacy Sanitization Layer
3.1 Delete `libs/sanitization/resume.ts`.
3.2 Remove imports/usages of deleted helpers across codebase (generator, any stray scripts).
3.3 Verify no residual references exist (search `sanitizeResumeData` / `sanitizeCoverLetterData` and adjust as needed).

## Part 4 – Adjust Unified Route & Callers
4.1 Inspect `app/api/v1/ai/unified/route.ts`; ensure generator invocation matches new signature.
4.2 Merge generator warnings into response payload (combine with route heuristics if appropriate).
4.3 Remove obsolete commentary related to sanitize/normalize pipeline if present.

## Part 5 – Documentation & Dev Notes
5.1 Update relevant AI docs (e.g., `PLAN` if necessary, `ai_docs/project/06_api.md`) to reference single-flow approach.
5.2 Add inline comment in generator header summarizing new flow.

## Part 6 – Cleanup & Consistency
6.1 Ensure `agents/temp/PLAN_SINGLE_FLOW_MIGRATION.md` still accurate after adjustments.
6.2 Update manual test script `scripts/manual/test-resume.ts` to point PDF path to `agents/temp/temp_resume.pdf` and reflect new warnings usage if needed.
6.3 Check for redundant assets or documentation referencing removed files and prune.

## Part 7 – Verification & Quality Gates
7.1 Run `npm run lint`.
7.2 Run `npm run build`.
7.3 Run `npm run lint -- --fix` not required? Instead ensure formatting (use `npm run lint` only; for formatting run `npx prettier --check` if used). If no dedicated format script, ensure modified files maintain linting.
7.4 Manual smoke tests:
   - Node script `scripts/manual/test-resume.ts` (text/editor/pdf flows).
   - `curl` text-only request to `/api/v1/ai/unified`.
   - `curl` PDF request using `agents/temp/temp_resume.pdf`.
7.5 Update TRACKING.md Quality section with PASS/FAIL results.

## Part 8 – Final Review & Documentation
8.1 Complete Review Checklist (alignment, simplicity, cleanup, docs, deps).
8.2 Update `TRACKING.md` Part Logs for each part with rationale, diffs, verification results.
8.3 Update `.agent_state.json` to reflect completion.
8.4 Fill “Done” section with summary, legacy removals, run instructions, commit reference note.
