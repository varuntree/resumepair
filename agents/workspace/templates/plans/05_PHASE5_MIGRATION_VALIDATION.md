# Phase 5: Migration & Validation

**⚠️ CONTEXT FOR IMPLEMENTER**

You are implementing the FINAL phase of the template system migration.

**Prerequisites**: Phases 1-4 complete, all features working.

**Source Repository**: `/Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume`

**Critical**: This phase migrates REAL USER DATA. Test thoroughly on staging before production.

---

## Phase Overview

**Goal**: Safely migrate existing user resumes to new template system and validate everything works.

**Duration**: 3-4 days

**Deliverables**:
1. Database migration script
2. Old template → new template mapping
3. Default layout generation
4. Rollback mechanism
5. Complete manual testing
6. Performance validation
7. Production deployment plan

---

## Step 1: Analyze Existing Data

**Duration**: 2-3 hours

### 1.1 Count Existing Resumes

```sql
-- In Supabase SQL Editor or via psql
SELECT
  COUNT(*) as total_resumes,
  appearance->>'template' as template_id,
  COUNT(*) as count_per_template
FROM resumes
WHERE appearance IS NOT NULL
GROUP BY appearance->>'template'
ORDER BY count_per_template DESC;
```

**Expected output**:
```
total_resumes | template_id | count_per_template
--------------+-------------+-------------------
     150      | onyx        |        60
     150      | modern      |        45
     150      | creative    |        30
     150      | technical   |        15
```

### 1.2 Check Appearance Structure

```sql
SELECT
  id,
  appearance->>'template' as template,
  appearance->'layout' as old_layout,
  appearance->'theme' as theme,
  appearance->'typography' as typography
FROM resumes
LIMIT 5;
```

**Verify**:
- [ ] `appearance.template` exists
- [ ] `appearance.theme` exists (background, text, primary)
- [ ] `appearance.typography` exists (fontFamily, fontSize, lineHeight)
- [ ] `appearance.layout` is old structure (NOT 3D array yet)

---

## Step 2: Create Migration Script

**Duration**: 4-6 hours

### 2.1 Template Mapping Logic

**Create**: `migrations/phase8/028_migrate_templates.ts` (or .sql based on your setup)

**Old → New Template Mapping**:

```typescript
const TEMPLATE_MIGRATION_MAP: Record<string, string> = {
  // Old ResumePair templates → New Reactive-Resume templates
  'onyx': 'kakuna',        // Both simple single-column
  'modern': 'azurill',     // Both two-column with sidebar
  'creative': 'pikachu',   // Both bold/creative
  'technical': 'bronzor',  // Both clean/professional

  // If user somehow has unmapped template, default to kakuna
  '__default__': 'kakuna',
}
```

### 2.2 Default Layout Generation

```typescript
function generateDefaultLayout(resume: ResumeJson): string[][][] {
  const hasSummary = !!resume.summary
  const hasExperience = (resume.work?.length ?? 0) > 0
  const hasEducation = (resume.education?.length ?? 0) > 0
  const hasProjects = (resume.projects?.length ?? 0) > 0
  const hasSkills = (resume.skills?.length ?? 0) > 0
  const hasCertifications = (resume.certifications?.length ?? 0) > 0
  const hasLanguages = (resume.languages?.length ?? 0) > 0
  const hasAwards = (resume.awards?.length ?? 0) > 0

  const mainColumn: string[] = []
  const sidebarColumn: string[] = []

  // Main column (left/primary content)
  if (hasSummary) mainColumn.push('summary')
  if (hasExperience) mainColumn.push('experience')
  if (hasEducation) mainColumn.push('education')
  if (hasProjects) mainColumn.push('projects')

  // Sidebar column (right/secondary content)
  if (hasSkills) sidebarColumn.push('skills')
  if (hasCertifications) sidebarColumn.push('certifications')
  if (hasLanguages) sidebarColumn.push('languages')
  if (hasAwards) sidebarColumn.push('awards')

  // If both columns empty, add defaults
  if (mainColumn.length === 0 && sidebarColumn.length === 0) {
    return [[['summary'], []]]
  }

  return [[mainColumn, sidebarColumn]]
}
```

### 2.3 Migration Script

**Create**: `scripts/migrate-templates.ts`

```typescript
import { createClient } from '@supabase/supabase-js'
import type { ResumeJson } from '@/types/resume'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!  // SERVICE ROLE

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const TEMPLATE_MAP: Record<string, string> = {
  'onyx': 'kakuna',
  'modern': 'azurill',
  'creative': 'pikachu',
  'technical': 'bronzor',
}

interface MigrationResult {
  total: number
  success: number
  failed: number
  errors: Array<{ id: string; error: string }>
}

async function migrateResumeTemplates(): Promise<MigrationResult> {
  const result: MigrationResult = {
    total: 0,
    success: 0,
    failed: 0,
    errors: [],
  }

  try {
    // Fetch all resumes
    const { data: resumes, error } = await supabase
      .from('resumes')
      .select('id, data')
      .order('created_at', { ascending: true })

    if (error) throw error

    result.total = resumes?.length ?? 0
    console.log(`Found ${result.total} resumes to migrate`)

    // Process each resume
    for (const resume of resumes || []) {
      try {
        const data = resume.data as ResumeJson

        // Skip if already migrated (has layout array)
        if (
          data.appearance?.layout &&
          Array.isArray(data.appearance.layout) &&
          Array.isArray(data.appearance.layout[0])
        ) {
          console.log(`Resume ${resume.id} already migrated, skipping`)
          result.success++
          continue
        }

        // Get old template
        const oldTemplate = data.appearance?.template || 'onyx'

        // Map to new template
        const newTemplate = TEMPLATE_MAP[oldTemplate] || 'kakuna'

        // Generate default layout
        const layout = generateDefaultLayout(data)

        // Build new appearance object
        const newAppearance = {
          ...data.appearance,
          template: newTemplate,
          layout: layout,
          // Rename 'layout' to 'layout_settings'
          layout_settings: data.appearance?.layout || {
            pageFormat: 'Letter',
            margin: 48,
            showPageNumbers: false,
          },
        }

        // Remove old 'layout' field
        delete (newAppearance as any).layout_settings

        // Update resume
        const { error: updateError } = await supabase
          .from('resumes')
          .update({
            data: {
              ...data,
              appearance: newAppearance,
            },
            updated_at: new Date().toISOString(),
          })
          .eq('id', resume.id)

        if (updateError) throw updateError

        console.log(`✓ Migrated resume ${resume.id}: ${oldTemplate} → ${newTemplate}`)
        result.success++
      } catch (error) {
        console.error(`✗ Failed to migrate resume ${resume.id}:`, error)
        result.failed++
        result.errors.push({
          id: resume.id,
          error: error.message,
        })
      }
    }

    return result
  } catch (error) {
    console.error('Migration failed:', error)
    throw error
  }
}

function generateDefaultLayout(resume: ResumeJson): string[][][] {
  // Copy implementation from 2.2 above
  // ...
}

// Run migration
console.log('Starting template migration...')
migrateResumeTemplates()
  .then((result) => {
    console.log('\n=== Migration Complete ===')
    console.log(`Total: ${result.total}`)
    console.log(`Success: ${result.success}`)
    console.log(`Failed: ${result.failed}`)

    if (result.errors.length > 0) {
      console.log('\nErrors:')
      result.errors.forEach((err) => {
        console.log(`  ${err.id}: ${err.error}`)
      })
    }

    process.exit(result.failed > 0 ? 1 : 0)
  })
  .catch((error) => {
    console.error('Migration crashed:', error)
    process.exit(1)
  })
```

---

## Step 3: Test Migration on Staging

**Duration**: 2-3 hours

### 3.1 Create Staging Database Snapshot

```bash
# Backup production data
pg_dump $DATABASE_URL > backup-before-migration.sql

# Or use Supabase backup feature
```

### 3.2 Run Migration on Staging

```bash
# Set staging environment variables
export NEXT_PUBLIC_SUPABASE_URL="https://staging-xxx.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="staging-service-key"

# Run migration
npx tsx scripts/migrate-templates.ts
```

### 3.3 Validation Checklist (Staging)

For each migrated resume:

- [ ] **Data Integrity**:
  - [ ] `appearance.template` updated to new value
  - [ ] `appearance.layout` is 3D array
  - [ ] `appearance.theme` preserved
  - [ ] `appearance.typography` preserved
  - [ ] No data loss in other fields

- [ ] **Preview**:
  - [ ] Resume preview loads
  - [ ] Template renders correctly
  - [ ] No missing sections
  - [ ] Colors match old template
  - [ ] Fonts match

- [ ] **PDF Export**:
  - [ ] PDF generates successfully
  - [ ] Content matches preview
  - [ ] No overflow
  - [ ] Quality acceptable

---

## Step 4: Create Rollback Mechanism

**Duration**: 2 hours

### 4.1 Backup Script

**Create**: `scripts/backup-before-migration.ts`

```typescript
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function backupResumes() {
  const { data: resumes } = await supabase
    .from('resumes')
    .select('id, data, created_at, updated_at')
    .order('created_at')

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const filename = `backup-resumes-${timestamp}.json`

  fs.writeFileSync(filename, JSON.stringify(resumes, null, 2))

  console.log(`Backup saved: ${filename}`)
  console.log(`Total resumes: ${resumes?.length}`)
}

backupResumes()
```

### 4.2 Rollback Script

**Create**: `scripts/rollback-migration.ts`

```typescript
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function rollbackResumes(backupFile: string) {
  const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf-8'))

  console.log(`Rolling back ${backupData.length} resumes from ${backupFile}...`)

  let success = 0
  let failed = 0

  for (const resume of backupData) {
    try {
      const { error } = await supabase
        .from('resumes')
        .update({
          data: resume.data,
          updated_at: resume.updated_at,
        })
        .eq('id', resume.id)

      if (error) throw error
      success++
    } catch (error) {
      console.error(`Failed to rollback ${resume.id}:`, error)
      failed++
    }
  }

  console.log(`Rollback complete: ${success} success, ${failed} failed`)
}

const backupFile = process.argv[2]
if (!backupFile) {
  console.error('Usage: npx tsx scripts/rollback-migration.ts <backup-file.json>')
  process.exit(1)
}

rollbackResumes(backupFile)
```

---

## Step 5: Manual Testing (All 12 Templates)

**Duration**: 1 day

### 5.1 Create Test Matrix

For **each of the 12 templates**, test:

| Template | Preview Works | PDF Works | Overflow Issues | Colors Correct | Notes |
|----------|---------------|-----------|-----------------|----------------|-------|
| Azurill  | ☐ | ☐ | ☐ | ☐ | |
| Bronzor  | ☐ | ☐ | ☐ | ☐ | |
| Chikorita | ☐ | ☐ | ☐ | ☐ | |
| Ditto    | ☐ | ☐ | ☐ | ☐ | |
| Gengar   | ☐ | ☐ | ☐ | ☐ | |
| Glalie   | ☐ | ☐ | ☐ | ☐ | |
| Kakuna   | ☐ | ☐ | ☐ | ☐ | |
| Leafish  | ☐ | ☐ | ☐ | ☐ | |
| Nosepass | ☐ | ☐ | ☐ | ☐ | |
| Onyx     | ☐ | ☐ | ☐ | ☐ | |
| Pikachu  | ☐ | ☐ | ☐ | ☐ | |
| Rhyhorn  | ☐ | ☐ | ☐ | ☐ | |

### 5.2 Test Scenarios per Template

1. **Empty Resume**: No content, just profile
2. **Minimal Resume**: 1-2 sections
3. **Medium Resume**: 5-7 sections, 1-2 pages
4. **Large Resume**: 10+ sections, 3-4 pages
5. **Max Resume**: Every section filled, 5+ pages

### 5.3 Edge Cases to Test

- [ ] Resume with no summary
- [ ] Resume with no work experience
- [ ] Resume with 20+ work items (overflow test)
- [ ] Resume with very long job descriptions
- [ ] Resume with special characters in text
- [ ] Resume with URLs in all fields
- [ ] Resume with custom CSS
- [ ] Resume with unusual font sizes (10px, 20px)
- [ ] Resume with A4 format (not Letter)
- [ ] Resume with multiple pages

---

## Step 6: Performance Validation

**Duration**: 2-3 hours

### 6.1 Bundle Size Analysis

```bash
npm run build

# Check bundle sizes
du -sh .next/static/chunks/*.js | sort -h

# Total bundle size
du -sh .next/static/
```

**Targets**:
- Total increase ≤ 150KB (gzipped)
- Templates lazy-loaded
- Fonts not in main bundle

### 6.2 Preview Performance

**Test**: Type in editor, measure preview update latency

```typescript
// In DevTools Console
let updateCount = 0
let totalTime = 0

const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.name.includes('LivePreview')) {
      updateCount++
      totalTime += entry.duration
      console.log(`Update #${updateCount}: ${entry.duration.toFixed(2)}ms`)
    }
  }
})

observer.observe({ entryTypes: ['measure'] })
```

**Target**: p95 ≤ 120ms

### 6.3 PDF Generation Performance

```bash
# Test PDF generation for various sizes
time curl http://localhost:3000/api/v1/export/resume?id=xxx
```

**Targets**:
- 1-page resume: < 2 seconds
- 2-page resume: < 3 seconds
- 4-page resume: < 5 seconds

---

## Step 7: Production Deployment

**Duration**: 1 day

### 7.1 Pre-Deployment Checklist

- [ ] All Phase 1-4 validation passed
- [ ] Staging migration successful
- [ ] Manual testing complete (all 12 templates)
- [ ] Performance validated
- [ ] Rollback mechanism tested
- [ ] Backup created
- [ ] Team notified

### 7.2 Deployment Steps

```bash
# 1. Create production backup
npx tsx scripts/backup-before-migration.ts

# 2. Deploy code to production
git push origin main
# (Vercel auto-deploys)

# 3. Run migration on production
export NEXT_PUBLIC_SUPABASE_URL="production-url"
export SUPABASE_SERVICE_ROLE_KEY="production-key"
npx tsx scripts/migrate-templates.ts

# 4. Monitor for errors
tail -f /var/log/app.log  # or use logging service
```

### 7.3 Post-Deployment Monitoring

**Monitor for 24 hours**:
- [ ] Error rate in logs
- [ ] PDF generation success rate
- [ ] Preview load times
- [ ] User complaints
- [ ] Database query performance

### 7.4 Rollback Plan (If Needed)

```bash
# 1. Rollback code
git revert HEAD
git push origin main

# 2. Rollback database
npx tsx scripts/rollback-migration.ts backup-resumes-TIMESTAMP.json

# 3. Verify rollback worked
# Check random resumes in production
```

---

## Phase 5 Validation Checklist

- [ ] **Migration**:
  - [ ] Backup created before migration
  - [ ] Migration script runs without errors
  - [ ] All resumes migrated successfully
  - [ ] Old templates mapped to new templates
  - [ ] Default layouts generated correctly
  - [ ] No data loss

- [ ] **Testing**:
  - [ ] All 12 templates tested individually
  - [ ] Edge cases handled
  - [ ] PDF export works for all templates
  - [ ] No overflow issues
  - [ ] Performance acceptable

- [ ] **Deployment**:
  - [ ] Staging deployment successful
  - [ ] Production backup created
  - [ ] Production deployment successful
  - [ ] Post-deployment monitoring shows no issues

- [ ] **Rollback**:
  - [ ] Rollback mechanism tested
  - [ ] Rollback script works
  - [ ] Team knows rollback procedure

---

## Success Metrics

**Must Achieve**:
- ✅ 100% of resumes migrated successfully
- ✅ Zero data loss
- ✅ All 12 templates render correctly
- ✅ PDF export works for all templates
- ✅ Preview performance ≤ 120ms
- ✅ PDF generation ≤ 5 seconds (4-page resume)
- ✅ No increase in error rate
- ✅ User complaints ≤ 1% of users

---

## Troubleshooting

### Issue: Migration fails for some resumes
**Solution**: Log failed IDs, manually inspect, fix script, re-run

### Issue: Old template data structure unexpected
**Solution**: Add defensive checks, handle edge cases, provide fallbacks

### Issue: Performance degrades after migration
**Solution**: Check bundle size, lazy-load templates, optimize queries

### Issue: Users report broken resumes
**Solution**: Identify pattern, create hotfix, deploy, run targeted migration

---

## Final Deliverables

- [ ] Migration script (`scripts/migrate-templates.ts`)
- [ ] Backup script (`scripts/backup-before-migration.ts`)
- [ ] Rollback script (`scripts/rollback-migration.ts`)
- [ ] Test matrix (filled out)
- [ ] Performance report
- [ ] Production deployment log
- [ ] Post-mortem document (if issues occurred)

---

**Phase 5 Complete** ✓

**ENTIRE MIGRATION COMPLETE** 🎉

You have successfully migrated the entire template system from Reactive-Resume to ResumePair with:
- 12 production-ready templates
- Per-page PDF processing
- 900+ Google Fonts
- Drag-drop layout editor
- Zero data loss
- Perfect quality

**Congratulations!**
