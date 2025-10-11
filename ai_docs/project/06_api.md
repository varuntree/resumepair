# API Specification

**Purpose**: API design, endpoints, authentication, and response formats.

---

## Table of Contents

1. [API Design Principles](#1-api-design-principles)
2. [Authentication](#2-authentication)
3. [Response Format](#3-response-format)
4. [Core Endpoints](#4-core-endpoints)
5. [Streaming Endpoints](#5-streaming-endpoints)

---

## 1. API Design Principles

### URL Structure
```
/api/v1/{resource}[/{id}][/{action}]
```

**Examples**:
- `GET /api/v1/resumes` - List resumes
- `GET /api/v1/resumes/{id}` - Get resume
- `POST /api/v1/resumes` - Create resume
- `PUT /api/v1/resumes/{id}` - Update resume
- `DELETE /api/v1/resumes/{id}` - Delete resume
- `POST /api/v1/export/pdf` - Export to PDF
- `POST /api/v1/ai/draft/resume` - AI draft

### Versioning
- **Path-based**: `/api/v1/` (major version only)
- **No breaking changes** within a version
- **New version** when breaking changes needed

### HTTP Methods
- **GET**: Read operations (idempotent)
- **POST**: Create operations, non-idempotent actions
- **PUT**: Update operations (idempotent)
- **DELETE**: Delete operations (idempotent)

---

## 2. Authentication

### Google OAuth Flow
```
1. User clicks "Sign in with Google"
   ↓
2. Redirect to Supabase Auth → Google OAuth
   ↓
3. Google authenticates & returns token
   ↓
4. Supabase creates session → Returns JWT
   ↓
5. Client stores JWT in cookie/localStorage
   ↓
6. All API requests include JWT in header
```

### Authorization Header
```http
Authorization: Bearer <supabase-jwt>
```

### Protected Routes
```typescript
// All routes under /api/v1/* require auth
export const GET = withAuth(async (req, { user }) => {
  // user.id guaranteed to exist
  // user.email available
})
```

---

## 3. Response Format

### Standard Envelope
```typescript
type ApiResponse<T> = {
  success: boolean
  data?: T
  error?: string
  message?: string
}
```

### Success Response
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Software Engineer Resume"
  },
  "message": "Resume created successfully"
}
```

### Error Response
```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "success": false,
  "error": "Validation failed",
  "message": "Title is required"
}
```

### Status Codes

| Code | Meaning | Use Case |
|------|---------|----------|
| 200 | OK | Successful GET/PUT |
| 201 | Created | Successful POST |
| 400 | Bad Request | Invalid input |
| 401 | Unauthorized | Missing/invalid JWT |
| 403 | Forbidden | Valid JWT but no permission |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Version mismatch, duplicate |
| 422 | Unprocessable Entity | Validation failed |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected failure |

---

## 4. Core Endpoints

### Me (User Profile)

**GET /api/v1/me**
```http
GET /api/v1/me
Authorization: Bearer <jwt>

Response (200):
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "fullName": "John Doe",
    "locale": "en-US",
    "dateFormat": "US",
    "pageSize": "Letter"
  }
}
```

### Resumes

**GET /api/v1/resumes**
```http
GET /api/v1/resumes?page=1&pageSize=20&sort=updatedAt&order=desc
Authorization: Bearer <jwt>

Response (200):
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "type": "resume",
      "title": "Software Engineer Resume",
      "schemaVersion": "resume.v1",
      "version": 3,
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-01-02T00:00:00Z"
    }
  ]
}

Headers:
X-Total-Count: 42
```

**GET /api/v1/resumes/{id}**
```http
GET /api/v1/resumes/{id}
Authorization: Bearer <jwt>

Response (200):
{
  "success": true,
  "data": {
    "id": "uuid",
    "type": "resume",
    "title": "Software Engineer Resume",
    "schemaVersion": "resume.v1",
    "data": {
      "profile": { ... },
      "summary": "...",
      "work": [ ... ],
      "settings": { ... }
    },
    "version": 3,
    "score": {
      "total": 85,
      "dimensions": { ... }
    },
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

**POST /api/v1/resumes**
```http
POST /api/v1/resumes
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "title": "My Resume",
  "type": "resume",
  "schemaVersion": "resume.v1",
  "data": {
    "profile": { ... },
    "settings": { ... }
  }
}

Response (201):
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "My Resume",
    ...
  },
  "message": "Resume created"
}
```

**PUT /api/v1/resumes/{id}**
```http
PUT /api/v1/resumes/{id}
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "title": "Updated Title",
  "data": { ... },
  "version": 3
}

Response (200):
{
  "success": true,
  "data": { ... },
  "message": "Resume updated"
}

Error (409 - Version Conflict):
{
  "success": false,
  "error": "Document was modified by another session",
  "message": "Please refresh and try again"
}
```

**DELETE /api/v1/resumes/{id}**
```http
DELETE /api/v1/resumes/{id}
Authorization: Bearer <jwt>

Response (200):
{
  "success": true,
  "message": "Resume deleted"
}
```

### Cover Letters

Same endpoints as resumes, replace `/resumes` with `/cover-letters`.

### Export

**POST /api/v1/export/pdf**
```http
POST /api/v1/export/pdf
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "documentId": "uuid",
  "templateSlug": "modern-minimal"
}

Response (200):
{
  "success": true,
  "data": {
    "filePath": "{userId}/resume_1234567890.pdf",
    "downloadUrl": "https://...signed-url...",
    "expiresAt": "2025-01-08T00:00:00Z"
  },
  "message": "Export ready"
}
```

### Scoring

**POST /api/v1/score**
```http
POST /api/v1/score
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "type": "resume",
  "data": { ... },
  "jobDescription": "..."  // Optional
}

Response (200):
{
  "success": true,
  "data": {
    "total": 85,
    "dimensions": {
      "atsScore": 28,
      "keywordScore": 22,
      "contentScore": 18,
      "formatScore": 14,
      "completenessScore": 9
    },
    "suggestions": [
      {
        "dimension": "ats",
        "severity": "warning",
        "message": "Consider adding more keywords",
        "quickFix": null
      }
    ]
  }
}
```

---

## 5. Streaming Endpoints

**Server-Sent Events (SSE)** for real-time updates.

### AI Draft

**POST /api/v1/ai/draft/resume?stream=true**
```http
POST /api/v1/ai/draft/resume?stream=true
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "input": "Personal info + job description",
  "jobDescription": "..."
}

Response (200):
Content-Type: text/event-stream

event: progress
data: {"status":"analyzing","percent":10}

event: update
data: {"profile":{"fullName":"John Doe",...}}

event: update
data: {"work":[{"company":"Acme Inc",...}]}

event: complete
data: {"profile":{...},"work":[...],"settings":{...}}

event: done
data: {}
```

> **Implementation note (2025-10)**: Resume generation now uses a single structured-output call to Gemini 2.5 Flash via the Vercel AI SDK. The server validates the response with `ResumeAIOutputSchema`, applies defaults, and returns warnings alongside the resulting `ResumeJson`. The former sanitize/normalize phases have been removed, reducing silent data loss.

### PDF Import (Phase 4.5 Refactored)

**POST /api/v1/ai/import?stream=true**
```http
POST /api/v1/ai/import?stream=true
Authorization: Bearer <jwt>
Content-Type: multipart/form-data

file: resume.pdf

Response (200):
Content-Type: text/event-stream

event: progress
data: {"status":"processing","percent":20}

event: update
data: {"profile":{"fullName":"...",...}}

event: update
data: {"work":[...]}

event: complete
data: {full ResumeJson}

event: done
data: {}
```

**Key Changes**:
- Single streaming endpoint (was 2 separate)
- Gemini multimodal handles PDF processing
- Real-time SSE streaming
- Edge runtime

---

## Rate Limiting

**Database-only quota** (Phase 4.5 simplified for Edge):

```typescript
// 100 operations/day per user
const quota = await checkQuota(user.id)
if (quota.remaining <= 0) {
  return apiError(429, 'Daily quota exceeded', null, 'RATE_LIMIT')
}
```

**Headers**:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 42
X-RateLimit-Reset: 1704067200
```

---

## Error Codes

| Code | Category | HTTP Status | User Message |
|------|----------|-------------|--------------|
| VALIDATION_ERROR | USER_INPUT | 400 | "Please check your input" |
| UNAUTHORIZED | AUTH | 401 | "Please sign in" |
| FORBIDDEN | AUTH | 403 | "Access denied" |
| NOT_FOUND | NOT_FOUND | 404 | "Not found" |
| CONFLICT | CONFLICT | 409 | "Conflict detected" |
| RATE_LIMIT | RATE_LIMIT | 429 | "Too many requests" |
| SERVER_ERROR | SERVER | 500 | "Something went wrong" |

---

## Key Takeaways

1. **Path versioning**: `/api/v1/`
2. **Bearer auth**: JWT in Authorization header
3. **Standard envelope**: `ApiResponse<T>`
4. **SSE streaming**: AI draft, PDF import
5. **Optimistic concurrency**: Version field for updates
6. **Rate limiting**: Database-only quota (100/day)

---

**Next**: Business Workflows (`07_workflows.md`)
