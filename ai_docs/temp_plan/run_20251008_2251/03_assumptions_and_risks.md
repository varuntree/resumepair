# Assumptions & Risks

## Assumptions
1. **PLAN_PATH Interpretation**: Treat `agents/workspace/templates/plans/00_OVERVIEW.md` as the authoritative migration plan. *Validation*: Confirm with stakeholders or corroborate via references in repo docs; note confirmation in tracker.
2. **Supabase Access**: Service-role credentials and staging environment are available when migration scripts need to run. *Validation*: Attempt dry-run connectivity early; if unavailable, coordinate with ops and record blocker.
3. **Puppeteer Runtime Capacity**: Existing Vercel/Node environment can accommodate pdf-lib addition and per-page processing without memory/time limit breaches. *Validation*: Benchmark during Phase 2 and compare against production limits.
4. **Font Metadata Size Acceptable**: Importing 400+ KB fonts metadata will not break bundle budgets. *Validation*: Measure bundle size after integration; if necessary, explore dynamic loading or pruning.
5. **Customization State Persistence**: Current document store architecture can persist new appearance fields without schema migrations beyond JSON updates. *Validation*: Inspect store implementation during Phase 1; adjust if server expect schema changes.
6. **Manual QA Capacity**: Engineering team can dedicate time for repeated manual smokes across 12 templates. *Validation*: Schedule QA windows per phase; if unavailable, plan staggered validation.
7. **Offline Dependencies**: Environment lacks external network access (npm registry, Google Fonts). *Validation*: Vendor required assets (tailwind CSS, icon resources) locally; document pending replacements for Phosphor icons and font downloads.

## Risks & Mitigations
1. **Schema Migration Bugs** – Incorrect layout generation could break existing resumes.
   - *Mitigation*: Develop thorough migration script with staging rehearsal, backups, rollback.
2. **Performance Regressions in PDF Export** – Per-page rendering may exceed timeouts.
   - *Mitigation*: Test with large resumes, add telemetry, optimize Puppeteer usage.
3. **Bundle Size Inflation** – Fonts metadata + templates may bloat client bundle.
   - *Mitigation*: Lazy-load heavy assets, analyze bundle diff, trim unused data.
4. **UI Regression During Template Swap** – Preview might break mid-transition.
   - *Mitigation*: Replace templates within short-lived branches, run smoke after each addition, maintain fallback instructions until final cutover.
5. **Coordination Breakdown** – Long-running effort may drift without tracking.
   - *Mitigation*: Maintain PROGRESS.md, log heartbeats, hold interim reviews.
6. **Dependency Conflicts** – Adding packages (pdf-lib, webfontloader, dnd-kit) may conflict with existing versions.
   - *Mitigation*: Audit package versions, lock via package-lock, ensure tree clean.
