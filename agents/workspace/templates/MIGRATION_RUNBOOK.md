# Template System Migration Runbook

_Last updated: 2025-10-08_

This runbook outlines the steps to safely migrate existing resumes to the new Reactive-Resume template system.

## Prerequisites
- Service-role access to Supabase project (environment variables `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`).
- Node.js 18+ available locally.
- Ability to run scripts with `npx ts-node` or `npx tsx` respecting the repository `tsconfig`.
- Staging environment with representative data for rehearsal.

## 1. Backup
```
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
  npx ts-node scripts/backup-before-migration.ts
```
- Output file written to `backups/resumes-<timestamp>.json`.
- Store backup securely before proceeding.

## 2. Staging Rehearsal
1. Load latest staging data.
2. Run migration script:
   ```
   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
     npx ts-node scripts/migrate-templates.ts
   ```
3. Validate:
   - Manually open a variety of resumes (1–4 pages) in the editor; switch templates; confirm preview + layout editor work.
   - Export PDFs (resume + cover letter) and confirm page counts, margins, and fonts.
   - Inspect Supabase rows to ensure `schema_version` updated to `resume.v2` and appearance contains `layout` + `layout_settings`.
4. If issues arise, restore staging with:
   ```
   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
     npx ts-node scripts/rollback-migration.ts backups/<file>.json
   ```

## 3. Production Deployment
1. Announce maintenance window (migration is write-intensive).
2. Ensure latest code (templates + exporter) deployed.
3. Re-run backup script against production project.
4. Execute migration:
   ```
   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
     npx ts-node scripts/migrate-templates.ts
   ```
5. Monitor logs for errors; script will continue on per-record failures with console output.
6. Spot-check migrated resumes directly in the app (preview + PDF).

## 4. Post-Migration Checks
- Verify new templates appear in Customization panel and template gallery.
- Confirm `appearance.layout_settings` and `appearance.layout` exist for random documents.
- Review export queue to ensure jobs succeed with new layout data.
- Update analytics/dashboard monitoring for any spikes in PDF failures.

## 5. Rollback (Emergency)
1. Stop user traffic (if possible) to prevent edits while rolling back.
2. Restore from backup:
   ```
   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
     npx ts-node scripts/rollback-migration.ts backups/<file>.json
   ```
3. Redeploy previous build if necessary.
4. Communicate status to stakeholders.

## Notes
- Scripts rely on the repository TypeScript configuration; use `npx ts-node --project tsconfig.json` if encountering module-resolution issues.
- For large datasets, consider batching updates or adding pagination to the migration script.
- Migration currently defaults unmapped templates to `kakuna`; adjust `TEMPLATE_MAP` if additional legacy slugs exist.
