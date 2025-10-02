# 9) Error Handling & Logging Strategy

**Intent**: Provide consistent, privacy‑safe errors to users; produce small, structured server logs for debugging and performance trending—without adding heavy infra or analytics.

**Hard rules (binding)**

* All responses use the standard `ApiResponse<T>` envelope.
* Do **not** log PII (emails, phone numbers, full addresses, freeform résumé text).
* Do **not** use service‑role keys in runtime.
* No third‑party monitoring in v1; use structured **console JSON** logs from server routes only.
* Keep logs small; prefer **codes** over long messages.

---

## 1. Error Model (Shared)

### 1.1 Envelope

```ts
type ApiResponse<T> = {
  success: boolean
  data?: T
  message?: string | null   // short, user-safe
  error?: string | null     // short, user-safe
  // meta fields added by api-utils on error:
  code?: ErrorCode          // machine-readable short code (see catalog)
  traceId?: string          // correlation id propagated to client
}
```

### 1.2 Error Codes (Catalog)

Use **UPPER_SNAKE_CASE**. Keep concise and stable.

| Category    | HTTP | Code                      | Example Message (user‑safe)                            |
| ----------- | ---- | ------------------------- | ------------------------------------------------------ |
| USER INPUT  | 400  | `BAD_REQUEST`             | “Invalid request.”                                     |
| USER INPUT  | 400  | `VALIDATION_FAILED`       | “Please fix the highlighted fields.”                   |
| AUTH        | 401  | `UNAUTHORIZED`            | “Sign in to continue.”                                 |
| AUTHZ       | 403  | `FORBIDDEN`               | “You do not have access to this resource.”             |
| LOOKUP      | 404  | `NOT_FOUND`               | “We couldn’t find that.”                               |
| CONCURRENCY | 409  | `VERSION_CONFLICT`        | “This document changed elsewhere. Reload to continue.” |
| RATE LIMIT  | 429  | `RATE_LIMITED`            | “You’re going too fast. Try again shortly.”            |
| IMPORT      | 422  | `PDF_EXTRACT_FAILED`      | “We couldn’t extract text from that PDF.”              |
| IMPORT      | 422  | `OCR_LOW_CONFIDENCE`      | “OCR was unclear. Please review before saving.”        |
| AI          | 422  | `AI_INVALID_OUTPUT`       | “Draft formatting failed. Try again.”                  |
| AI          | 503  | `AI_PROVIDER_UNAVAILABLE` | “AI is temporarily unavailable. Try again.”            |
| EXPORT      | 504  | `PDF_RENDER_TIMEOUT`      | "PDF took too long. Try simpler template or try again." |
| SERVER      | 500  | `INTERNAL_ERROR`          | “Something went wrong. Please try again.”              |

> Add new codes sparingly; update a single source in `libs/api-utils/errors.ts`.

---

## 2. Where & How Errors Are Handled

### 2.1 API Layer (authoritative)

* **Route handlers** must be wrapped with `withApiHandler` (public) or `withAuth` (protected).
* These wrappers:

  * Create a **traceId** per request (UUID v4).
  * Wrap handler in try/catch; on error, map to `{status, code, error}` and log structured JSON.
  * Ensure `ApiResponse<T>` with `success: false` on failure.
  * Set `Retry-After` on 429.

**Pseudo‑implementation**

```ts
// libs/api-utils/errors.ts
export type ErrorCode =
  | 'BAD_REQUEST' | 'VALIDATION_FAILED' | 'UNAUTHORIZED' | 'FORBIDDEN'
  | 'NOT_FOUND' | 'VERSION_CONFLICT' | 'RATE_LIMITED'
  | 'PDF_EXTRACT_FAILED' | 'OCR_LOW_CONFIDENCE'
  | 'AI_INVALID_OUTPUT' | 'AI_PROVIDER_UNAVAILABLE'
  | 'PDF_RENDER_TIMEOUT' | 'INTERNAL_ERROR';

export class ApiProblem extends Error {
  status: number; code: ErrorCode; safe?: string; cause?: unknown;
  constructor(status: number, code: ErrorCode, safe?: string, cause?: unknown) {
    super(safe ?? code); this.status = status; this.code = code; this.safe = safe; this.cause = cause;
  }
}

// libs/api-utils/responses.ts
export const apiError = (status: number, code: ErrorCode, msg?: string, traceId?: string) =>
  NextResponse.json({ success: false, error: msg ?? code, code, traceId }, { status });
```

### 2.2 Repository Layer

* Repositories **throw** `ApiProblem` for known conditions (e.g., version mismatch).
* They never return partial/ambiguous states.

**Example (optimistic concurrency)**

```ts
if (updated.rowCount === 0) {
  throw new ApiProblem(409, 'VERSION_CONFLICT', 'Version mismatch.')
}
```

### 2.3 AI Layer

* When `generateObject/streamObject` returns invalid JSON:

  1. **Retry once** with a “repair” instruction;
  2. If still invalid → throw `ApiProblem(422, 'AI_INVALID_OUTPUT')`.
* Provider outage (non‑2xx) → `ApiProblem(503, 'AI_PROVIDER_UNAVAILABLE')`.
* Do not include prompt or user résumé text in logs.

### 2.4 Import/OCR

* If PDF has **no text layer** and user declines OCR → `ApiProblem(422, 'PDF_EXTRACT_FAILED')`.
* OCR confidence < 0.6 → `ApiProblem(422, 'OCR_LOW_CONFIDENCE')`.
* Always provide a user path to **Review & Fix**.

### 2.5 Export

* Headless Chromium timeouts → `ApiProblem(504, 'PDF_RENDER_TIMEOUT')`.
* Offer simpler template option on the client.

---

## 3. Client‑Side Handling

* Show **toast** + inline message; preserve user input.
* For `VERSION_CONFLICT`, show a modal with options: **Reload** (pull latest), **Duplicate** (create a copy), **Cancel**.
* For `RATE_LIMITED`, show countdown using `Retry-After`.
* For `AI_INVALID_OUTPUT`, allow **Retry** and **Report** (which logs only code + traceId).
* For `OCR_LOW_CONFIDENCE`, highlight fields with low confidence; require explicit **Accept & Create**.

---

## 4. Retry Policy Matrix

| Operation          | Idempotent | Client Retries        | Server Retries |
| ------------------ | ---------- | --------------------- | -------------- |
| AI Draft           | Yes        | 2 w/ backoff          | 0              |
| Score (LLM)        | Yes        | 1 w/ backoff          | 0              |
| PDF Import (parse) | Yes        | 1                     | 0              |
| OCR                | Yes        | Manual only           | 0              |
| PDF Export         | Yes        | 1 (then suggest simpler template) | 0 |
| CRUD Save          | No         | 0                     | 0              |

**Backoff**: 400ms → 1200ms jittered.

---

## 5. Rate Limiting

* Token bucket per `user.id` in memory (per server instance).
* Soft: **3 req/s**; Hard: **10 req/10s**.
* On exceed: 429 `RATE_LIMITED` + `Retry-After`; log one line at WARN (sample at 1:20).

---

## 6. Logging (Minimal, Structured, Server‑Side Only)

### 6.1 Format (JSON Lines)

```json
{
  "ts": "2025-09-22T10:15:33.123Z",
  "level": "INFO|WARN|ERROR",
  "traceId": "f2e6c9ba-...",
  "route": "POST /api/v1/export/pdf",
  "runtime": "node|edge",
  "status": 504,
  "latency_ms": 3107,
  "user_hash": "u_9b7c...",      // HMAC(user.id) or truncated hash; never raw
  "code": "PDF_RENDER_TIMEOUT",
  "op": "export_pdf",
  "note": "timeout",
  "size_bytes": 82344           // optional, non-PII metric
}
```

**Never include**: emails, phone numbers, freeform résumé text, addresses, prompts, full stack traces (print to stderr only in DEV).

### 6.2 Emission Points

* **At route exit** (success or error).
* Extra logs for **PDF export**, **AI draft**, **OCR** (these are the riskiest).

### 6.3 Levels

* `INFO`: normal completion > 200ms or notable branch (OCR used).
* `WARN`: retries, rate limited, low OCR confidence.
* `ERROR`: 5xx or unhandled exceptions.

### 6.4 Sampling

* Default sample: **100%** for `ERROR`, **20%** for `WARN`, **5%** for `INFO`.
* Override via env: `LOG_SAMPLE_INFO=0.05`, etc.

### 6.5 Correlation

* `traceId` created at request start; included in response body on error; client surfaces it in toasts (“Error code: 1A2B‑C3”).

---

## 7. Redaction & PII Policy

* Log only **IDs**, **status**, **durations**, and **codes**.
* If you must add context, whitelist safe fields: `templateSlug`, image **mime type** (not name), **pageCount**, **fileSizeKB**.
* Redact strings longer than 120 chars automatically in log helper.

---

## 8. Developer Utilities

* `libs/api-utils/log.ts` exposes `logInfo`, `logWarn`, `logError` that perform sampling, redaction, and JSON formatting.
* `libs/utils/trace.ts` manages `traceId` generation & propagation.

---

## 9. Manual QA (Error Paths)

* [ ] Unauth access → 401 `UNAUTHORIZED`.
* [ ] Version conflict → 409 modal with Reload/Duplicate.
* [ ] Rate limit → 429 with countdown.
* [ ] AI invalid JSON → single retry, then helpful prompt.
* [ ] PDF no text → prompt OCR; declining → 422 with review suggestion.
* [ ] PDF timeout → Simpler template option offered.

---