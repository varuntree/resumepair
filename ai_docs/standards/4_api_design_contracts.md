# API Design Contracts

**Purpose**: Define how frontend and backend communicate in ResumePair. These contracts ensure predictable, secure, and maintainable API interactions.

---

## Core Principles

1. **Predictable** - Consistent patterns across all endpoints
2. **Type-Safe** - Shared types between frontend and backend
3. **Secure** - Authentication and validation at every boundary
4. **Versioned** - Forward compatibility without breaking changes

---

## 1. API Structure

### URL Patterns

```
/api/v1/{resource}/{id?}/{action?}

Examples:
GET    /api/v1/resumes              # List
POST   /api/v1/resumes              # Create
GET    /api/v1/resumes/:id          # Read
PUT    /api/v1/resumes/:id          # Update
DELETE /api/v1/resumes/:id          # Delete
POST   /api/v1/resumes/:id/export   # Action
```

### RESTful Conventions

| Method | Purpose | Request Body | Response |
|--------|---------|--------------|----------|
| GET | Read data | None | Resource(s) |
| POST | Create resource | New resource | Created resource |
| PUT | Full update | Complete resource | Updated resource |
| PATCH | Partial update | Changed fields | Updated resource |
| DELETE | Remove resource | None | Success confirmation |

### Non-RESTful Operations

```typescript
// For complex operations that don't fit REST
POST /api/v1/ai/extract-resume     // Process PDF to resume
POST /api/v1/ai/generate-bullets   // Generate content
POST /api/v1/score/calculate       // Calculate score
```

---

## 2. Request/Response Envelope

```typescript
interface ApiResponse<T = any> {
  success: true
  data: T
  meta?: { page?: number; total?: number }
}

interface ApiError {
  success: false
  error: { code: string; message: string; details?: any }
}
```

### Implementation Pattern

```typescript
// ✅ CORRECT: Using API utilities
import { withAuth, apiSuccess, apiError } from '@/libs/api-utils'

export const GET = withAuth(async (req, { user }) => {
  try {
    const documents = await documentsRepository.findByUser(
      supabaseClient,
      user.id
    )
    return apiSuccess(documents)
  } catch (error) {
    return apiError('FETCH_FAILED', error.message)
  }
})

// ❌ WRONG: Raw response
export async function GET(req: Request) {
  const documents = await getDocuments()
  return NextResponse.json(documents) // No envelope!
}
```

---

## 3. Authentication & Authorization

### Authentication Flow

```typescript
// All protected routes use withAuth wrapper
export const POST = withAuth(async (req, context) => {
  // context.user is guaranteed to exist
  const { user } = context

  // User ID is automatically included in operations
  const document = await createDocument(user.id, data)

  return apiSuccess(document)
})
```

### Authorization Patterns

```typescript
// Resource-level authorization
export const PUT = withAuth(async (req, { user }) => {
  const { id } = req.params

  // Check ownership
  const document = await getDocument(id)
  if (document.userId !== user.id) {
    return apiError('FORBIDDEN', 'Not authorized', 403)
  }

  // Proceed with update
  const updated = await updateDocument(id, data)
  return apiSuccess(updated)
})
```

---

## 4. Validation & Type Safety

```typescript
// Zod validation + auto-generated Supabase types
const CreateResumeSchema = z.object({
  title: z.string().min(1).max(100),
  template: z.enum(['minimal', 'modern', 'classic']),
  data: ResumeJsonSchema
})

// Type-safe with generated types
type Resume = Database['public']['Tables']['resumes']['Row']

// Validate in route
const result = CreateResumeSchema.safeParse(body)
if (!result.success) return apiError('VALIDATION_ERROR', result.error)
```

---

## 5. Error Handling

### Error Codes

```typescript
// Standardized error codes
enum ApiErrorCode {
  // Client errors (4xx)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  RATE_LIMITED = 'RATE_LIMITED',

  // Server errors (5xx)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  AI_SERVICE_ERROR = 'AI_SERVICE_ERROR',
  EXPORT_FAILED = 'EXPORT_FAILED',
}
```

### Error Responses

```typescript
// Validation error
{
  success: false,
  error: {
    code: 'VALIDATION_ERROR',
    message: 'Invalid input',
    details: {
      title: ['Required'],
      email: ['Invalid email format']
    }
  }
}

// Rate limit error
{
  success: false,
  error: {
    code: 'RATE_LIMITED',
    message: 'Too many requests',
    details: {
      retryAfter: 60,
      limit: 10,
      window: '10s'
    }
  }
}
```

---

## 6. (Reserved)

File uploads are out of scope for Phase 1. Add contracts when a concrete upload feature is introduced.

---

## 7. Streaming & Server Actions

**Server Actions** (from Vercel): User-initiated forms
```typescript
async function updateName(formData: FormData) {
  'use server'
  await db.update({ name: formData.get('name') })
}
```

**SSE Streaming**: AI responses
```typescript
return new Response(stream.readable, {
  headers: { 'Content-Type': 'text/event-stream' }
})
```

**Webhooks**: External integrations with signature verification
```typescript
const sig = headers.get('stripe-signature')
const event = stripe.webhooks.constructEvent(body, sig, secret)
```

---

## 8. Data Fetching Patterns

**Parallel Fetching** (from Vercel):
```typescript
const [user, docs, templates] = await Promise.all([
  getUser(supabase),
  getDocuments(supabase),
  getTemplates(supabase)
])
```

**Pagination**:
```typescript
// Cursor-based (preferred)
GET /api/v1/resumes?cursor=xyz&limit=20

// Offset-based (fallback)
GET /api/v1/resumes?page=2&limit=20
```

---

## 9. Rate Limiting

### Headers

```typescript
// Response headers
{
  'X-RateLimit-Limit': '100',
  'X-RateLimit-Remaining': '95',
  'X-RateLimit-Reset': '1640995200'
}

// When limited
{
  status: 429,
  headers: {
    'Retry-After': '60'
  }
}
```

### Implementation

```typescript
const rateLimiter = {
  ai: { window: '10s', limit: 3 },
  export: { window: '1m', limit: 10 },
  api: { window: '1m', limit: 100 }
}

export const withRateLimit = (
  type: keyof typeof rateLimiter
) => async (req: Request) => {
  const limited = await checkRateLimit(user.id, type)
  if (limited) {
    return apiError('RATE_LIMITED', 'Too many requests', 429)
  }
  // Continue with request
}
```

---

## 10. API Client Pattern

### Type-Safe Client

```typescript
// libs/api-client.ts
class ApiClient {
  private baseUrl = '/api/v1'

  private async request<T>(
    path: string,
    options?: RequestInit
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers
      }
    })

    const data = await response.json()

    if (!data.success) {
      throw new ApiError(data.error)
    }

    return data.data
  }

  // Typed methods
  async getResumes(): Promise<Resume[]> {
    return this.request('/resumes')
  }

  async createResume(data: CreateResumeDto): Promise<Resume> {
    return this.request('/resumes', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }
}

export const api = new ApiClient()
```

---

## 11. Caching Strategy

### Cache Headers

```typescript
// Cacheable responses
{
  'Cache-Control': 'public, max-age=3600',  // Templates
  'ETag': '"123456"',                       // Version tracking
}

// Non-cacheable
{
  'Cache-Control': 'no-cache, no-store, must-revalidate'
}
```

---

## API Checklist

Before implementing an API endpoint:

- [ ] Uses consistent URL pattern
- [ ] Returns standard envelope format
- [ ] Validates all inputs with Zod
- [ ] Handles all error cases explicitly
- [ ] Uses withAuth wrapper for protected routes
- [ ] Includes appropriate cache headers
- [ ] Respects rate limits
- [ ] Returns proper HTTP status codes
- [ ] Includes pagination for list endpoints
- [ ] Documents expected request/response

---

## Production Patterns

**Cal.com**: tRPC for type-safe APIs, separated handler pattern
**Vercel**: Server actions for forms, parallel data fetching
**Novel**: SSE streaming for AI responses

**Key**: APIs are contracts. Version carefully, deprecate gracefully.

---

**Next Document**: Error Handling Strategy (how to fail gracefully at every level)
