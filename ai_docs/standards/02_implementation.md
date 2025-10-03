# Implementation Patterns

**Required implementation patterns and technology stack.**

---

## 1. Technology Stack (FIXED - No Flexibility)

- **Framework**: Next.js 14, React 18, TypeScript (strict)
- **Database**: Supabase (Postgres + RLS)
- **Auth**: Supabase Auth - **Google OAuth ONLY**
- **AI**: Vercel AI SDK + Gemini 2.0 Flash
- **Styling**: Tailwind CSS + shadcn/ui
- **Icons**: Lucide React ONLY
- **State**: Zustand + zundo
- **Exports**: Puppeteer + Chromium

**Prohibited**: Email/password auth, other UI libraries, other icon sets, testing frameworks, CI/CD.

---

## 2. TypeScript Strict Mode

```typescript
// ✅ CORRECT
export async function getDocument(
  supabase: SupabaseClient,
  documentId: string,
  userId: string
): Promise<Document> { }

// Handle null/undefined
const email = document.data?.profile?.email
if (!email) throw new Error('Email required')

// Use unknown, not any
function processError(error: unknown): string {
  if (error instanceof Error) return error.message
  return 'Unknown error'
}
```

---

## 3. API Route Pattern

```typescript
// Protected route
import { withAuth, apiSuccess } from '@/libs/api-utils'

export const POST = withAuth(async (req, { user }) => {
  return apiSuccess(data, "Success message")
})

// Response format
type ApiResponse<T> = {
  success: boolean
  data?: T
  error?: string
  message?: string
}
```

---

## 4. Repository Pattern

```typescript
// Pure function with DI
export async function getDocument(
  supabase: SupabaseClient,
  documentId: string,
  userId: string
): Promise<Document | null> {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('id', documentId)
    .eq('user_id', userId) // RLS
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data
}
```

---

## 5. Database Migration Pattern

**Rule**: NEVER auto-apply migrations.

1. Create migration files during development
2. Wait for explicit user approval  
3. Apply via Supabase MCP tools

**RLS Completeness**: Every user table needs 4 policies (SELECT, INSERT, UPDATE, DELETE).

---

## 6. File Storage Pattern

```typescript
// Upload with signed URL
const { data, error } = await supabase.storage
  .from('exports')
  .upload(`${user.id}/${fileName}`, buffer)

// Generate signed URL (7 days)
const { data: urlData } = await supabase.storage
  .from('exports')
  .createSignedUrl(filePath, 604800)
```

---

## 7. Prohibited Patterns

❌ Class-based repositories
❌ Auto-applying migrations
❌ Raw API routes (no wrappers)
❌ Hardcoded design values
❌ Empty catch blocks (CRITICAL - always log)
❌ `any` types

---

## Code Review Checklist

- [ ] Repository pattern used
- [ ] API routes use wrappers
- [ ] No `any` types
- [ ] Design tokens only
- [ ] No empty catch blocks
- [ ] RLS policies complete

---

**See**: `/ai_docs/project/04_tech_stack.md` for complete stack details.
