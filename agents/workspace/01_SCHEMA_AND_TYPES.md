# Schema and Types Analysis

**Date**: 2025-10-07
**Phase**: 1 - Schema Exploration

## Overview

The resume system uses a canonical JSON schema approach with TypeScript types as the single source of truth. Data is stored in Supabase (PostgreSQL) using JSONB columns, validated with Zod schemas at API boundaries.

---

## Core Type System

### 1. Resume Schema (`/types/resume.ts`)

#### ResumeJson (Canonical Schema)
The complete data structure for a resume document:

```typescript
interface ResumeJson {
  profile: Profile
  summary?: string
  work?: WorkExperience[]
  education?: Education[]
  projects?: Project[]
  skills?: SkillGroup[]
  certifications?: Certification[]
  awards?: Award[]
  languages?: Language[]
  extras?: Extra[]
  settings: ResumeSettings
}
```

**Key Sections**:

1. **Profile** (`lines 13-33`)
   - Personal info: fullName, headline, email, phone
   - Nested location object (city, region, country, postal)
   - Links array with type/label/url
   - Optional photo with url and storage path

2. **WorkExperience** (`lines 38-47`)
   - company, role, location
   - Date range: startDate (ISO string), endDate (ISO | 'Present' | null)
   - descriptionBullets, achievements, techStack arrays

3. **Education** (`lines 52-59`)
   - school, degree, field
   - Date range (optional)
   - details array

4. **Project** (`lines 64-70`)
   - name, link, summary
   - bullets and techStack arrays

5. **SkillGroup** (`lines 75-78`)
   - category (e.g., "Programming")
   - items array (skill names)

6. **Settings** (`lines 118-130`)
   - Localization: locale, dateFormat ('US' | 'ISO' | 'EU')
   - Typography: fontFamily, fontSizeScale (0.8-1.2), lineSpacing (1.0-1.5)
   - Visual: colorTheme, iconSet ('lucide'), showIcons
   - Layout: sectionOrder array, pageSize ('A4' | 'Letter')

#### Resume Database Entity (`lines 152-166`)
```typescript
interface Resume {
  id: string
  user_id: string
  title: string
  slug: string | null
  version: number              // Optimistic locking
  schema_version: string       // "resume.v1"
  data: ResumeJson            // Full document in JSONB
  status: 'draft' | 'active' | 'archived'
  is_deleted: boolean         // Soft delete
  deleted_at: string | null
  created_at: string
  updated_at: string
  last_accessed_at: string | null
}
```

**Key Design Decisions**:
- **Optimistic concurrency control**: `version` field incremented on each update
- **Soft delete**: `is_deleted` + `deleted_at` for 30-day retention
- **JSONB storage**: Entire `ResumeJson` stored in `data` column
- **Schema versioning**: `schema_version` for future migrations

#### Helper Functions (`lines 235-272`)
- `createDefaultSettings()`: Factory for default settings based on locale
- `createEmptyResume()`: Bootstrap new resume with email/name

---

### 2. Cover Letter Schema (`/types/cover-letter.ts`)

Parallel structure to Resume, adapted for cover letters.

#### CoverLetterJson (`lines 90-99`)
```typescript
interface CoverLetterJson {
  from: CoverLetterSender        // User contact info
  to: CoverLetterRecipient       // Company/hiring manager
  jobInfo?: JobInfo              // Job context
  date: string                   // ISO date
  salutation: string             // "Dear Hiring Manager,"
  body: RichTextBlock[]          // Rich text content
  closing: string                // "Sincerely,"
  settings: CoverLetterSettings
}
```

**Key Innovations**:

1. **Rich Text System** (`lines 16-28`)
   ```typescript
   interface TextRun {
     text: string
     marks?: ('bold' | 'italic' | 'underline')[]
   }

   interface RichTextBlock {
     type: 'paragraph' | 'bullet_list' | 'numbered_list'
     content: TextRun[]  // Array of formatted text runs
   }
   ```
   - Supports inline formatting (bold, italic, underline)
   - Block-level structures (paragraphs, lists)

2. **Sender/Recipient Split** (`lines 33-61`)
   - `CoverLetterSender`: User's contact details + optional `linkedResumeId`
   - `CoverLetterRecipient`: Company name, hiring manager, address

3. **Job Context** (`lines 66-70`)
   - jobTitle, jobId, source (where found)
   - Optional but recommended for targeting

#### Database Entity (`lines 104-119`)
Similar to Resume, with addition of:
- `linked_resume_id`: FK to resumes table (one-way sync)
- Same version control, soft delete, status management

---

### 3. Template System (`/types/template.ts`)

#### Customizations (`lines 89-95`)
Complete customization object stored in JSONB:

```typescript
interface Customizations {
  colors: ColorScheme      // HSL colors
  typography: Typography   // Font settings
  spacing: Spacing         // Layout spacing
  icons: IconSettings      // Icon display
  layout: LayoutSettings   // Column/sidebar config
}
```

**ColorScheme** (`lines 35-43`):
- All colors in HSL format: "h s% l%" (space-separated)
- Example: "225 52% 8%" for navy
- Properties: primary, secondary, accent, text, background, muted, border

**Typography** (`lines 48-53`):
- fontFamily: string
- fontSize: multiplier (0.8-1.2)
- lineHeight: multiplier (1.0-1.5)
- fontWeight: base weight (400, 500, 600)

**Layout** (`lines 77-83`):
- columns: 1 or 2
- sidebarPosition: 'left' | 'right' | null
- headerAlignment: 'left' | 'center'
- photoPosition: 'header' | 'sidebar' | null

#### Template Component Props (`lines 116-120`)
```typescript
interface TemplateProps {
  data: ResumeJson
  customizations?: Customizations
  mode?: 'edit' | 'preview' | 'print'
}
```

#### Template Registry Entry (`lines 126-130`)
```typescript
interface ResumeTemplate {
  component: React.ComponentType<TemplateProps>
  metadata: TemplateMetadata
  defaults: Customizations  // Per-template defaults
}
```

**Template-specific defaults** (`lines 177-228`):
- `createTemplateDefaults()` function returns customized defaults per template
- Templates: minimal, modern, classic, creative, technical, executive
- Each overrides base settings (e.g., classic uses 'Source Serif 4')

---

## Database Schema (Supabase/PostgreSQL)

### 1. Resumes Table (`migrations/phase2/001_create_resumes_table.sql`)

```sql
CREATE TABLE public.resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  schema_version TEXT NOT NULL DEFAULT 'resume.v1',
  data JSONB NOT NULL CHECK (jsonb_typeof(data) = 'object'),
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'active', 'archived')),
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_accessed_at TIMESTAMPTZ
);
```

**Indexes** (`lines 49-58`):
- `resumes_user_id_idx`: Basic user lookup
- `resumes_user_status_idx`: Filtered by status (WHERE is_deleted = FALSE)
- `resumes_user_deleted_idx`: Soft-deleted items
- `resumes_updated_at_idx`: Recent items (DESC)
- `resumes_user_slug_idx`: UNIQUE slug per user (partial index)
- `resumes_title_search_idx`: Full-text search (GIN index)

**Triggers** (`lines 61-64`):
- Auto-update `updated_at` on each modification

### 2. Resume Versions Table (`migrations/phase2/002_create_resume_versions_table.sql`)

```sql
CREATE TABLE public.resume_versions (
  id BIGSERIAL PRIMARY KEY,
  resume_id UUID NOT NULL REFERENCES public.resumes(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  data JSONB NOT NULL CHECK (jsonb_typeof(data) = 'object'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  UNIQUE (resume_id, version_number)
);
```

**Key Features**:
- **BIGSERIAL** primary key (unlimited versions)
- **Full snapshots**: Complete ResumeJson stored (not deltas)
- **Audit trail**: `created_by` for user tracking
- **Unique constraint**: One snapshot per version number

**Indexes** (`lines 37-39`):
- Compound index on `(resume_id, version_number DESC)`
- Temporal index on `(resume_id, created_at DESC)`
- User audit index on `created_by`

### 3. Cover Letters Table (`migrations/phase7/020_create_cover_letters_table.sql`)

```sql
CREATE TABLE public.cover_letters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (length(title) >= 1),
  slug TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  schema_version TEXT NOT NULL DEFAULT 'cover-letter.v1',
  data JSONB NOT NULL CHECK (jsonb_typeof(data) = 'object'),
  linked_resume_id UUID REFERENCES public.resumes(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'active', 'archived')),
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_accessed_at TIMESTAMPTZ
);
```

**Notable Difference**:
- `linked_resume_id`: Optional FK to resumes (ON DELETE SET NULL)
- Denormalized `user_id` for RLS performance (hybrid FK pattern)

**Indexes** (`lines 25-32`):
- Similar to resumes, plus:
- `idx_cover_letters_linked_resume`: For linked resume queries
- `idx_cover_letters_dashboard`: Composite for multi-document views

---

## Validation Layer (Zod)

### Schema File: `/libs/validation/resume.ts`

All TypeScript types have corresponding Zod schemas for runtime validation.

#### Key Schemas:

1. **ProfileSchema** (`lines 14-42`)
   - Email validation: `.email('Invalid email address')`
   - Length constraints: fullName (1-100 chars), headline (max 200)
   - Nested object validation for location, links, photo

2. **WorkExperienceSchema** (`lines 47-64`)
   - Date format regex: `/^\d{4}-\d{2}-\d{2}$/`
   - endDate union: `z.union([z.string().regex(...), z.literal('Present'), z.null()])`

3. **ResumeJsonSchema** (`lines 152-164`)
   - Composes all section schemas
   - All fields optional except `profile` and `settings`

4. **UpdateResumeSchema** (`lines 180-188`)
   - Partial data updates: `ResumeJsonSchema.partial()`
   - **Version required**: `version: z.number().int().positive()` for optimistic locking

5. **ResumeListQuerySchema** (`lines 193-204`)
   - Transform string limit to number: `.transform((val) => parseInt(val, 10))`
   - Constraints: limit 1-100

#### Type Inference (`lines 223-238`)
All input types inferred from Zod schemas:
```typescript
export type ProfileInput = z.infer<typeof ProfileSchema>
export type UpdateResumeInput = z.infer<typeof UpdateResumeSchema>
// etc.
```

---

## API Types (`/types/api.ts`)

### Export Request/Response (`lines 12-48`)

```typescript
interface CoverLetterExportRequest {
  coverLetterId: string
  format: 'pdf'
  templateId?: string
  customizations?: { colors, typography, spacing }
}

interface ExportResponse {
  jobId: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  downloadUrl?: string
  error?: string
}
```

### Document Type Discriminator (`line 53`)
```typescript
type DocumentType = 'resume' | 'cover-letter'
```
Used throughout system for unified operations.

---

## Repository Layer (`/libs/repositories/index.ts`)

Central export for all data access functions using dependency injection pattern.

### Resume Operations:
- `getResumes`, `getResume`, `createResume`, `updateResume`
- `deleteResume`, `restoreResume`, `duplicateResume`
- `bulkDeleteResumes`, `bulkArchiveResumes`

### Cover Letter Operations:
- Parallel functions: `getCoverLetters`, `createCoverLetter`, etc.

### Version Operations:
- `getVersions`, `getVersion`, `restoreVersion`, `pruneVersions`

### Export Operations:
- **Jobs**: `createExportJob`, `fetchNextJob`, `updateExportJob`, `completeExportJob`
- **History**: `createExportHistory`, `listExportHistory`, `deleteExpiredExports`

**Pattern**: Pure functions accepting `supabase` client as first parameter (dependency injection).

---

## Key Design Patterns

### 1. Canonical JSON Schema
- TypeScript types define the data structure
- JSONB storage in database (schema-on-read)
- No joins required for document retrieval
- Version field in root enables schema evolution

### 2. Optimistic Concurrency Control
- `version` field in both resumes and cover_letters
- API requires version number for updates
- Server increments version and checks for conflicts
- Prevents lost updates in concurrent edits

### 3. Soft Delete Pattern
- `is_deleted` boolean + `deleted_at` timestamp
- Items kept for 30 days (inferred from indexes)
- All queries filter by `WHERE is_deleted = FALSE`
- Separate `getDeletedResumes()` function for trash view

### 4. Schema Versioning
- `schema_version` field: "resume.v1", "cover-letter.v1"
- Enables future schema migrations without downtime
- Application can handle multiple schema versions simultaneously

### 5. Template Customization
- Base Customizations interface
- Template-specific defaults via factory functions
- Stored per-resume in JSONB (if overridden)
- Defaults loaded from template registry if not customized

### 6. Rich Text System (Cover Letters)
- Block-based structure (paragraphs, lists)
- Inline formatting via `marks` array
- Serializable to JSONB
- Separate serializer/sanitizer libs exist (`/libs/rich-text/`)

---

## Data Flow Summary

```
User Input (Forms)
  ↓
Zod Validation (API boundary)
  ↓
Repository Functions (pure, testable)
  ↓
Supabase Client (RLS enforced)
  ↓
PostgreSQL (JSONB storage)
  ↓
Version History (immutable snapshots)
```

**Update Flow**:
1. Client sends `PATCH /api/resumes/[id]` with `version: N`
2. Zod validates payload
3. Repository fetches current document
4. Check: `db.version === input.version` (conflict detection)
5. Create snapshot in `resume_versions` with version N
6. Update `resumes.data`, increment `version` to N+1
7. Trigger updates `updated_at`
8. Return updated document to client

---

## File Reference Index

### Type Definitions
- `/types/resume.ts` - Resume schema (272 lines)
- `/types/cover-letter.ts` - Cover letter schema (270 lines)
- `/types/template.ts` - Template system (229 lines)
- `/types/api.ts` - API types (53 lines)
- `/types/database.ts` - DB entity types (21 lines)
- `/types/index.ts` - Type exports (17 lines)

### Validation
- `/libs/validation/resume.ts` - Zod schemas (238 lines)
- `/libs/validation/cover-letter.ts` - (not yet read)
- `/libs/validation/template.ts` - (exists)

### Database Migrations
- `/migrations/phase2/001_create_resumes_table.sql` - Main resumes table (64 lines)
- `/migrations/phase2/002_create_resume_versions_table.sql` - Version history (39 lines)
- `/migrations/phase7/020_create_cover_letters_table.sql` - Cover letters table (65 lines)

### Repositories
- `/libs/repositories/index.ts` - Central exports (92 lines)
- `/libs/repositories/documents.ts` - Resume CRUD (not yet read)
- `/libs/repositories/coverLetters.ts` - Cover letter CRUD (not yet read)
- `/libs/repositories/versions.ts` - Version history (not yet read)

### Database Client
- `/libs/supabase/client.ts` - Browser client (9 lines)
- `/libs/supabase/server.ts` - Server client (not yet read)
- `/libs/supabase/admin.ts` - Admin client (not yet read)

---

## Observations & Gaps

### Strengths
1. **Clean type system**: Single source of truth in TypeScript
2. **Robust validation**: Zod schemas at all boundaries
3. **Version control**: Built-in optimistic locking and history
4. **Flexible schema**: JSONB allows easy evolution
5. **Performance**: Well-indexed, partial indexes for common queries
6. **Security**: RLS policies, soft delete, audit trail

### Questions/Gaps
1. **Migration strategy**: How are schema version migrations handled?
   - `schema_version` field exists but no migration code seen yet
2. **Template storage**: Are default templates stored in DB?
   - Migration file exists: `006_seed_resume_templates.sql` (not read)
3. **Customization persistence**: Where are per-resume customizations stored?
   - Not seen in schema yet - likely in `data` JSONB or separate column
4. **Export job processing**: How are PDF generation jobs processed?
   - Tables exist (export_jobs, export_history) but worker not seen
5. **AI operations tracking**: Migration exists (`010_create_ai_operations.sql`)
   - Not yet explored in types or repositories

### Next Steps
Phase 2 will explore:
- Editor components and their state management
- How form data flows to API
- Real-time preview implementation
- Template customization UI
