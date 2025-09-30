# Phase 2 Migrations

## Status: ✅ APPLIED

All migration files have been applied to the resumepair database (project ID: gxptapugegufqlnhuhlf) on 2025-09-30.

## Migrations

1. `001_create_resumes_table.sql` - Main resumes table with optimistic locking
2. `002_create_resume_versions_table.sql` - Version history with full snapshots
3. `003_create_resume_templates_table.sql` - Optional starter templates
4. `004_setup_rls_policies_resumes.sql` - RLS policies for user isolation
5. `005_create_resume_indexes.sql` - Performance indexes
6. `006_seed_resume_templates.sql` - Optional template seed data

## Application Instructions

**CRITICAL**: These migrations are NOT applied automatically.

### User Review Required

User must review all SQL files before application.

### Application via MCP

After user approval, apply migrations in order:

```bash
# Apply migrations via Supabase MCP
mcp__supabase__apply_migration({
  project_id: 'resumepair',
  name: 'phase2_001_create_resumes_table',
  query: '<contents of 001_create_resumes_table.sql>'
})

# Repeat for migrations 002-006
```

## Verification

After application, verify:
- All tables created: `resumes`, `resume_versions`, `resume_templates`
- RLS enabled on all tables
- Indexes created successfully
- Policies active

## Rollback

If issues occur, provide rollback SQL (DROP statements) to user.

## Design Rationale

### Optimistic Locking
- Uses `version` column incremented on each update
- Prevents lost updates without pessimistic locks
- UPDATE WHERE version = :expectedVersion pattern

### Full Snapshots
- Store complete ResumeJson on each save (not deltas)
- Simpler than delta storage, O(1) retrieval
- No replay needed, direct access to any version

### Soft Delete
- `is_deleted` flag + `deleted_at` timestamp
- Preserves data for 30-day recovery window
- Cleanup job can purge old deleted documents

### RLS Policies
- Database-level user isolation
- Defense in depth (even if app has bugs)
- No manual user_id filtering needed in queries