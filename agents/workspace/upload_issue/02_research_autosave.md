Research Agent 2 — Autosave Reverts Preview

Symptoms
- After Apply-to-Editor, preview shows generated info for ~5s, then empties again.

Relevant Code
- Apply: components/ai/UnifiedAITool.tsx → `onApply()` calls `updateResume(final || partial)` and `reset()` AI store.
- Autosave: stores/createDocumentStore.ts → `updateDocument()` sets `isDirty` and starts a 2s timer → `saveDocument()`.
- Save behavior: `saveDocument()` builds `updates`:
  - Always includes `version`.
  - Includes `title` whenever non-empty (even if unchanged).
  - Includes `data` only if `schemaValidator.safeParse(document)` succeeds.
- Storage schema: libs/validation/resume.ts enforces email and `YYYY-MM-DD` dates.

Findings
1) Generated/partial data from AI likely contains `startDate` as `YYYY-MM` and may miss `profile.email` → storage validation fails.
   - Result: `updates.data` omitted.

2) Current code still sends request with only `title` (unchanged) + `version`.
   - Repository `updateResume` increments version regardless of which fields change; returns the server’s prior `data`.
   - Store blindly overwrites local `document` with `updatedDoc.data` → local unsaved AI content is wiped, preview “empties”.

Conclusion (Autosave)
- The autosave path overwrites local unsaved changes when `data` fails validation because the store still sends `title` and then replaces `document` with server state.

Surgical Fix
- In `saveDocument()`, only overwrite local `document` with server data if we actually sent `updates.data` (i.e., validation passed). Otherwise:
  - Keep local `document` intact.
  - Still update `documentVersion`/timestamps from server if applicable.
- Optional: Only include `title` if it truly changed to avoid unnecessary version bumps. (Not required once we gate the overwrite.)

