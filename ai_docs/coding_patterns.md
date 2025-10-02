{
    "mcpServers": {
      "supabase": {
        "command": "npx",
        "args": [
          "-y",
          "@supabase/mcp-server-supabase@latest",
          "--access-token",
          "sbp_9db243e8c95cfa9e62e8146aea61ebb0775d47e0"
        ]
      }
    }
  }

# Coding Patterns & Rules

This document defines the implementation patterns for this SaaS template. These patterns work with the fixed technology decisions defined in [`development-decisions.md`](./development-decisions.md).

## 📋 Table of Contents

1. [🏗️ Database Access Pattern (Repository)](#️-database-access-pattern-repository)
2. [🗄️ Database Migration Pattern](#️-database-migration-pattern)
3. [🔒 Authentication Pattern](#-authentication-pattern)
4. [🚀 API Route Pattern](#-api-route-pattern)
5. [📁 File Storage Pattern](#-file-storage-pattern)
6. [🎨 Design System Pattern](#-design-system-pattern)
7. [🎨 Component Pattern](#-component-pattern)
8. [🚫 Prohibited Patterns](#-prohibited-patterns)
9. [✅ Code Review Checklist](#-code-review-checklist)

---

## 🏗️ Database Access Pattern (Pure Function Repositories)

### ✅ REQUIRED: Use Pure Function Pattern Only

**Clear separation between server and client usage.** Use pure functions with dependency injection.

#### Structure:
```
libs/repositories/
├── index.ts                   # Export all functions
├── auth.ts                    # Authentication functions  
├── profile.ts                 # User profile functions
└── [entity].ts                # Additional entity functions
```

#### Server-Side Implementation:
```typescript
// ✅ CORRECT - Server usage (API routes, Server Components)
import { createClient } from '@/libs/supabase/server'
import { getUser, signOut } from '@/libs/repositories/auth'

const supabase = createClient()
const user = await getUser(supabase)
await signOut(supabase)
```

#### Client-Side Implementation:
```typescript
// ✅ CORRECT - Client usage (Client Components)
import { createClient } from '@/libs/supabase/client'

const supabase = createClient()
const { data: { user } } = await supabase.auth.getUser()
await supabase.auth.signOut()
```

#### Pure Function Example:
```typescript
export async function getUser(supabase: SupabaseClient): Promise<User | null> {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}
```

---

## 🗄️ Database Migration Pattern

### ✅ REQUIRED: Two-Step Migration Process

**CRITICAL**: During phase development, migrations are created as files ONLY. They are NOT applied to the database until explicit user permission.

#### Migration Workflow:
1. **Phase Development**: Create migration SQL files only
2. **User Review**: User reviews all migration files
3. **Explicit Permission**: User gives permission to apply migrations
4. **Database Application**: Use MCP tools to apply migrations

#### File Structure:
```
migrations/
├── phase1/
│   ├── 001_create_users_table.sql
│   ├── 002_create_profiles_table.sql
│   └── 003_add_indexes.sql
├── phase2/
│   ├── 004_create_content_tables.sql
│   └── 005_add_relationships.sql
└── phase3/
    └── 006_create_analytics_tables.sql
```

#### During Phase Development:
```typescript
// ✅ CORRECT - Create migration file only
// File: migrations/phase1/001_create_users_table.sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

// ❌ NEVER DO THIS - Apply migration directly during development
await mcp__supabase__apply_migration({
  project_id: 'swingo',
  name: 'create_users_table',
  query: '...'
})
```

#### After User Permission:
```typescript
// ✅ CORRECT - Apply migrations only after explicit permission
// User: "Apply the phase 1 migrations"
// Assistant: Now applying the approved migrations...
await mcp__supabase__apply_migration({
  project_id: 'swingo',
  name: 'phase1_migrations',
  query: migrationContent
})
```

#### Important Rules:
- **NEVER** apply migrations automatically during phase development
- **ALWAYS** create migration files in organized phase folders
- **ALWAYS** wait for explicit user permission before applying
- **NEVER** modify the database schema without user approval
- Each migration file should be atomic and reversible when possible

#### Benefits:
- Enables autonomous code development without database dependencies
- Allows user to review all database changes before application
- Prevents accidental database modifications
- Maintains clear separation between development and deployment

---

## 🔒 Authentication Pattern

**Fixed Decision**: Google OAuth only (per `development-decisions.md`)

### Usage Patterns:
```typescript
// Server Component
const user = await authRepository.getUser()
if (!user) redirect('/signin')

// Client Component  
useEffect(() => {
  authRepository.getUser().then(setUser)
}, [])

// API Route
export const POST = withAuth(async (req, { user }) => {
  // user is guaranteed authenticated
})
```

---

## 🚀 API Route Pattern

### ✅ REQUIRED: Use API Utilities Only

**Never write raw API routes.** Always use standardized wrappers.

#### Structure:
```
libs/api-utils/
├── index.ts          # Export all utilities
├── responses.ts      # Standardized responses
├── errors.ts         # Error handling
├── helpers.ts        # Common helpers
└── middleware.ts     # Auth wrappers
```

#### Usage Patterns:
```typescript
// Public Route
import { withApiHandler, apiSuccess } from '@/libs/api-utils'
export const POST = withApiHandler(async (req) => {
  return apiSuccess(data, "Success message")
})

// Protected Route
import { withAuth } from '@/libs/api-utils'
export const POST = withAuth(async (req, { user }) => {
  return apiSuccess(data)
})
```

#### Standardized Response:
```typescript
type ApiResponse<T> = {
  success: boolean
  data?: T
  error?: string
  message?: string
}
```

Guidance:
- `message` is the canonical user-facing text. Clients should display this when present.
- `error` is optional technical detail intended for logging/debugging. Do not rely on it for user toasts when `message` exists.

---

## 📁 File Storage Pattern

### ✅ REQUIRED: Supabase Storage with Signed URLs

**Supabase Storage** provides secure file storage with RLS policies and signed URLs.

#### Storage Configuration:
```typescript
// Bucket setup (do once via Supabase dashboard or migration)
// 1. Create bucket: 'exports'
// 2. Set to private
// 3. Add RLS policy: users can only access their own files
```

#### Upload Pattern:
```typescript
// API Route - Upload PDF export
import { withAuth, apiSuccess, apiError } from '@/libs/api-utils'
import { createClient } from '@/libs/supabase/server'

export const POST = withAuth(async (req, { user }) => {
  const supabase = createClient()

  // Generate file path
  const fileName = `resume_${Date.now()}.pdf`
  const filePath = `${user.id}/${fileName}`

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('exports')
    .upload(filePath, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: false, // Prevent overwrites
      cacheControl: '3600', // 1 hour cache
    })

  if (error) {
    return apiError(500, 'Failed to upload file', error)
  }

  // Generate signed URL (7-day expiry)
  const { data: urlData, error: urlError } = await supabase.storage
    .from('exports')
    .createSignedUrl(filePath, 604800) // 7 days in seconds

  if (urlError) {
    return apiError(500, 'Failed to generate download URL', urlError)
  }

  return apiSuccess({
    filePath: data.path,
    downloadUrl: urlData.signedUrl,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  })
})
```

#### Download Pattern:
```typescript
// Client-side download
async function downloadExport(signedUrl: string, fileName: string) {
  const response = await fetch(signedUrl)
  const blob = await response.blob()

  // Trigger browser download
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.click()
  window.URL.revokeObjectURL(url)
}
```

#### Cleanup Pattern:
```typescript
// Cron job - Delete expired files
export async function cleanupExpiredExports(
  supabase: SupabaseClient
): Promise<void> {
  // Get expired export records
  const { data: expired } = await supabase
    .from('export_history')
    .select('file_path')
    .lt('expires_at', new Date().toISOString())

  if (!expired || expired.length === 0) return

  // Delete files from storage
  for (const record of expired) {
    const { error } = await supabase.storage
      .from('exports')
      .remove([record.file_path])

    if (error) {
      console.error(`Failed to delete ${record.file_path}:`, error)
    }
  }

  // Delete database records
  await supabase
    .from('export_history')
    .delete()
    .lt('expires_at', new Date().toISOString())
}
```

#### RLS Policy for Storage:
```sql
-- Allow users to upload to their own folder
CREATE POLICY "Users can upload to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'exports' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to read their own files
CREATE POLICY "Users can read own files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'exports' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own files
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'exports' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

#### File Storage Best Practices:
- **Always use signed URLs** with expiration (7-30 days typical)
- **Never expose permanent public URLs** for user files
- **Implement cleanup cron jobs** for expired files
- **Validate file type and size** before upload
- **Use user-scoped paths** (`${userId}/filename`) for RLS
- **Set appropriate cache headers** for static content

---

## 🎨 Design System Pattern

### ✅ REQUIRED: Use CSS Variables for All Design Tokens

**All design values must use CSS variables.** Never hard-code spacing, colors, or sizes.

#### Design Token Structure:
```css
/* ✅ CORRECT - In globals.css */
:root {
  /* Spacing Scale */
  --space-1: 0.25rem;  /* 4px */
  --space-2: 0.5rem;   /* 8px */
  --space-4: 1rem;     /* 16px */
  
  /* Typography */
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  
  /* Colors (HSL format) */
  --primary: 0 0% 9%;
  --primary-foreground: 0 0% 98%;
}
```

#### Usage in Components:
```typescript
// ✅ CORRECT - Using design tokens
<div className="p-4 text-sm rounded-lg">
  {/* p-4 uses var(--space-4) */}
  {/* text-sm uses var(--font-size-sm) */}
  {/* rounded-lg uses var(--radius-lg) */}
</div>

// ❌ WRONG - Hard-coded values
<div style={{ padding: '16px', fontSize: '14px' }}>
```

#### Adding shadcn/ui Components:
```bash
# ✅ CORRECT - Use shadcn CLI
npx shadcn@latest add button

# Components automatically use CSS variables
```

#### Updating Design System:
When design specifications arrive:
1. Update values in `/app/globals.css`
2. Components automatically use new values
3. No component code changes needed

---

## 🎨 Component Pattern

### ✅ Component Structure Rules

**Fixed Decision**: Tailwind CSS + shadcn/ui only (per `development-decisions.md`)

#### File Organization:
```typescript
// ✅ CORRECT - Component structure
export default function ComponentName({ prop1, prop2 }: ComponentNameProps) {
  return (
    <div className="tailwind-classes">
      {/* UI using shadcn/ui components */}
    </div>
  )
}

interface ComponentNameProps {
  prop1: string
  prop2?: number
}
```

#### Repository Usage in Components:
```typescript
// ✅ CORRECT - Repository in component
import { authRepository } from '@/libs/repositories/authRepository'

export default function Dashboard() {
  const [user, setUser] = useState(null)
  
  useEffect(() => {
    authRepository.getUser().then(setUser)
  }, [])
  
  return <div>Dashboard content</div>
}
```

#### Naming Conventions:
- **Components**: PascalCase (`ButtonCheckout.tsx`)
- **Props Interface**: `ComponentNameProps`
- **Hooks**: camelCase starting with `use` (`useFileUpload.ts`)

---

## 🚫 Prohibited Patterns

### ❌ Class-Based Repositories:
```typescript
// NEVER DO THIS
class AuthRepository extends BaseRepository {
  async getUser() { /* ... */ }
}
```

### ❌ Auto-Detection Patterns:
```typescript
// NEVER DO THIS
if (typeof window === 'undefined') {
  return serverClient()
} else {
  return browserClient()
}
```

### ❌ Raw API Routes:
```typescript
// NEVER DO THIS
export async function POST(req: NextRequest) {
  try {
    // Raw implementation
  } catch (error) {
    // Manual error handling
  }
}
```

### ❌ Client Components Using Repositories:
```typescript
// NEVER DO THIS - Client component importing server repositories
import { getUser } from '@/libs/repositories/auth'
// Use direct client instead in client components
```

### ❌ Non-Standard UI:
```typescript
// NEVER DO THIS - Wrong UI framework
import { Button } from 'react-bootstrap'
import { Spinner } from 'antd'

// NEVER DO THIS - DaisyUI classes (removed)
<button className="btn btn-primary">

// NEVER DO THIS - Hard-coded design values
<div style={{ padding: '16px', margin: '8px' }}>
```

### ❌ Empty Catch Blocks (CRITICAL):

**NEVER use empty catch blocks.** Silent failures hide bugs and make debugging impossible.

```typescript
// ❌ WRONG - Silent failure (no visibility)
try {
  await browser.close()
} catch {
  // Ignore cleanup errors <-- CRITICAL BUG!
}

// ✅ CORRECT - Log the error
try {
  await browser.close()
} catch (cleanupError) {
  console.error('Failed to close browser:', cleanupError)
  // Continue - browser will be GC'd eventually
}
```

**Why this matters:**
- No visibility into failures → impossible to debug
- Potential resource leaks (memory, connections)
- Hides systemic issues (network problems, permission errors)

**Rule**: Every catch block MUST either:
1. Log the error with `console.error()`
2. Re-throw the error
3. Handle the error explicitly with a fallback

```typescript
// ✅ Option 1: Log and continue
try {
  await cleanupResource()
} catch (error) {
  console.error('Cleanup failed:', error)
}

// ✅ Option 2: Re-throw
try {
  await criticalOperation()
} catch (error) {
  console.error('Critical operation failed:', error)
  throw error
}

// ✅ Option 3: Explicit fallback
try {
  await fetchFromCache()
} catch (error) {
  console.warn('Cache miss:', error)
  return fetchFromDatabase()
}
```

---

## 🔧 TypeScript Strict Mode Patterns

### ✅ REQUIRED: TypeScript Strict Mode

**TypeScript strict mode** catches errors at compile time, preventing runtime crashes.

#### Type Safety Rules:
```typescript
// ✅ CORRECT - Explicit types, no any
export async function getDocument(
  supabase: SupabaseClient,
  documentId: string,
  userId: string
): Promise<Document> {
  const { data, error } = await supabase
    .from('resumes')
    .select('*')
    .eq('id', documentId)
    .eq('user_id', userId)
    .single()

  if (error) throw error
  return data
}

// ❌ WRONG - Implicit any, no return type
export async function getDocument(supabase, documentId, userId) {
  const { data, error } = await supabase
    .from('resumes')
    .select('*')
  // ...
}
```

#### Null/Undefined Handling:
```typescript
// ✅ CORRECT - Handle null/undefined explicitly
const email = document.data?.profile?.email
if (!email) {
  throw new Error('Email is required')
}
// TypeScript knows email is string here

// ✅ CORRECT - Nullish coalescing
const workExperience = document.data?.work ?? []
const name = document.data?.profile?.name || 'Untitled'

// ❌ WRONG - Assuming value exists
const email = document.data.profile.email // Can crash!
```

#### Type Guards:
```typescript
// ✅ CORRECT - Runtime type validation
function isValidResumeData(data: unknown): data is ResumeData {
  if (!data || typeof data !== 'object') return false

  const d = data as any
  return (
    d.profile &&
    typeof d.profile === 'object' &&
    Array.isArray(d.work) &&
    Array.isArray(d.education)
  )
}

// Usage
if (!isValidResumeData(document.data)) {
  throw new Error('Invalid resume data')
}
// TypeScript knows document.data is ResumeData now
```

#### Unknown vs Any:
```typescript
// ✅ CORRECT - Use unknown and narrow
function processError(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  return 'Unknown error occurred'
}

// ❌ WRONG - Using any (disables type checking)
function processError(error: any): string {
  return error.message // No type safety!
}
```

#### Common Strict Mode Fixes:

**1. withAuth Handler Signature**
```typescript
// ✅ CORRECT
import { NextRequest } from 'next/server'

export const POST = withAuth(
  async (req: NextRequest, { user }: { user: User }) => {
    // Implementation
  }
)
```

**2. Buffer Type Conversion**
```typescript
// ✅ CORRECT
const pdfBuffer = await generatePDF(data)
const uint8Array = new Uint8Array(pdfBuffer)

// For storage upload
await supabase.storage.from('exports').upload(path, pdfBuffer, {
  contentType: 'application/pdf'
})
```

**3. Date Handling**
```typescript
// ✅ CORRECT - Handle nullable dates
const formattedDate = job.completed_at
  ? new Date(job.completed_at).toLocaleDateString()
  : 'In progress'

// ❌ WRONG - Assumes date exists
const formattedDate = new Date(job.completed_at).toLocaleDateString()
```

**4. Array Operations**
```typescript
// ✅ CORRECT - Filter with type predicate
const validJobs = jobs.filter((job): job is ExportJob => {
  return job.status !== undefined && job.user_id !== undefined
})

// ✅ CORRECT - Defensive array access
const firstJob = jobs[0]
if (firstJob) {
  processJob(firstJob)
}
```

#### TypeScript Benefits (Phase 5 Evidence):
- Caught 8 type errors during implementation
- Prevented runtime crashes from null values
- Forced explicit error handling
- Improved code documentation via types
- Code review score: 89/100 (type safety contributed)

---

## ✅ Code Review Checklist

**Before committing, verify:**

### Database & Repositories:
- [ ] No direct Supabase imports in components/pages
- [ ] All database operations use repositories
- [ ] Repository extends `BaseRepository`
- [ ] Components contain only UI logic
- [ ] Migration files created but NOT applied during development
- [ ] Migrations only applied after explicit user permission

### API Routes:
- [ ] All routes use `withApiHandler` or `withAuth`
- [ ] Correct `apiError` parameter order: `apiError(statusCode, message, error?, code?)`
- [ ] Standardized response format (`apiSuccess`/`apiError`)
- [ ] Input validation using helper functions
- [ ] No empty catch blocks (always log or re-throw)

### File Storage:
- [ ] File uploads use Supabase Storage
- [ ] Signed URLs with expiration
- [ ] RLS policies enforced
- [ ] Proper error handling for uploads
- [ ] Cleanup cron job for expired files

### Components:
- [ ] Uses only Tailwind + shadcn/ui
- [ ] All spacing/colors use CSS variables (design tokens)
- [ ] Repository pattern for data access
- [ ] Proper TypeScript interfaces
- [ ] Consistent naming conventions
- [ ] Explicit return types on all exported functions

### TypeScript Strict Mode:
- [ ] No `any` types (use `unknown` + type guards)
- [ ] Explicit return types on all exported functions
- [ ] Null/undefined handled explicitly
- [ ] Type guards for runtime validation
- [ ] Proper error types (not `any` in catch blocks)

### Technology Compliance:
- [ ] Follows all decisions in `development-decisions.md`
- [ ] No forbidden technologies or patterns
- [ ] Authentication uses Google OAuth only
- [ ] No testing or CI/CD code added

---

**Remember**: These patterns ensure consistent, maintainable code across all SaaS projects built with this template. Follow `development-decisions.md` for WHAT to use, and this file for HOW to implement it.
