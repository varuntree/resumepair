# Assumptions
1. **PLAN_PATH** — `ai_docs/temp_plan/run_20251008_1415/progress.md` is the authoritative plan since no other plan file exists.  
   - *Validation*: Monitor for newly provided plan artifacts; if found, reconcile and update expanded plan.
2. **Reactive Resume assets availability** — The Reactive Resume source in `agents/repos/Reactive-Resume/` is complete and compatible with our tooling.  
   - *Validation*: During Part 1.1, attempt to vendor/import required modules; adjust scope if missing pieces.
3. **Supabase migrations** — We have authority to create SQL migrations but must queue execution for approval.  
   - *Validation*: Prepare migration files without applying; flag in tracking file for approval.
4. **Performance budgets** — Existing infrastructure (Next.js on Vercel, Puppeteer runtime) can handle the new renderer without additional infrastructure changes.  
   - *Validation*: Measure preview responsiveness and export timings during QA.
5. **Undo/redo compatibility** — Zustand temporal middleware will remain stable after store changes as long as we respect immutable updates.  
   - *Validation*: Explicitly smoke-test undo/redo after each major store refactor.
6. **Legacy template deletion sequencing** — Existing `TemplateStore` still depends on legacy template metadata; we will remove legacy assets after customization overhaul (Part 2) to avoid breaking current UI mid-run.  
   - *Validation*: Mark dependency in tracking file and proceed once document-scoped metadata is in place.
7. **TipTap dependency availability** — Environment prevents installing new npm packages, so TipTap libraries cannot be fetched. Rich text upgrades will reuse existing editor infrastructure while maintaining TipTap-compatible APIs for later swaps.  
   - *Validation*: Document substitution in tracking logs and keep interfaces adaptable for eventual TipTap integration.

# Risks & Mitigations
1. **Scope explosion** — Full Reactive Resume parity is large; risk of time overrun.  
   - *Mitigation*: Execute sequentially per expanded plan; refuse to branch off without finishing current part; document scoped-down defaults if needed.
2. **Integration regressions** — Replacing renderer touches many surfaces.  
   - *Mitigation*: After each part, run quality gates and targeted manual smokes (preview, export, customization).
3. **Schema migration data loss** — Embedding metadata into JSON may break existing documents.  
   - *Mitigation*: Write idempotent migration scripts with backups; test on sample data locally.
4. **Dependency conflicts** — Importing TipTap or artboard dependencies may inflate bundle or break build.  
   - *Mitigation*: Introduce dependencies incrementally; run `npm ls`/audit; prune unused packages promptly.
5. **PDF rendering differences** — New renderer might produce layout differences causing regressions.  
   - *Mitigation*: Compare sample exports before deleting legacy renderer; capture acceptance notes in Part Logs.
