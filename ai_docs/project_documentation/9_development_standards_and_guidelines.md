# 8) Development Standards & Guidelines (Engineered)

**Purpose**: A practical, opinionated guide for agents to build fast, readable, and maintainable code that matches our product principles. It balances clarity and freedom: strict on **boundaries & interfaces**, flexible in **implementation details**.

> **Golden Rules**
>
> 1. **Keep it simple** (small functions, few dependencies).
> 2. **Schema‑driven** (one JSON schema powers editor, templates, AI, exports).
> 3. **RLS all the way** (never bypass with service role in runtime).
> 4. **Design tokens everywhere** (no hard‑coded styles).
> 5. **One way to do things** (wrappers, repos, structure).

---

## 1. Project Structure (Authoritative)

```
app/
  api/v1/...           # Route handlers (Edge/Node as specified)
  (pages, layouts)
libs/
  api-utils/           # withApiHandler, withAuth, apiSuccess/apiError, typed errors
  repositories/        # pure functions (server-only) DI with Supabase client
  ai/                  # provider, prompt modules, Zod schemas
  scoring/             # deterministic checks + composer
  exporters/           # pdf renderer
  templates/           # resume/cover-letter renderers by slug
  preview/             # paged HTML preview + token applicators
  i18n/                # date/address/phone helpers
  validation/          # Zod validators for inputs
  utils/               # misc helpers (SSE, cn, etc.)
migrations/            # SQL files; never auto-applied
public/                # static assets
```

**Do not** introduce new top‑level folders without approval.

---

## 2. Coding Conventions

### 2.1 TypeScript

* **Strict mode** on. No `any` unless truly unavoidable; prefer `unknown` + narrowing.
* Use **Zod** schemas for all external inputs (API request bodies, AI outputs).
* **Return types** explicit on all exported functions.
* **Immutable data** whenever possible (treat objects as value data; use `immer` in Zustand).

### 2.2 Naming

* Files/folders: **kebab‑case**.
* Components: **PascalCase**; props interface = `ComponentNameProps`.
* Hooks: `useXxx`.
* Repositories: `{entity}.ts` (`documents.ts`, `profiles.ts`).
* Templates: under `libs/templates/{type}/{slug}`.

### 2.3 Imports

* Use path aliases from `tsconfig` (e.g., `@/libs/...`).
* No deep relative import chains (`../../../`).

---

## 3. Boundaries (Enforced)

### 3.1 API Routes

* Must use `withApiHandler` (public) or `withAuth` (protected).
* **Never** hand‑roll try/catch/JSON responses.
* **All responses** use `ApiResponse<T>` envelope (`success`, `data?`, `error?`, `message?`).
* **Validation**: parse `req.json()` → validate with Zod → on fail, `apiError(400, zodMessage)`.
* **Edge vs Node**:

  * Edge: AI streaming & light reads.
  * Node: PDF export, PDF parse/OCR, uploads.

### 3.2 Repositories (DB Access)

* Pure functions with **dependency injection** of `SupabaseClient`.
* No imports of repositories in **client components**.
* A repository does **one job** (CRUD for a single entity group).
* Encode optimistic concurrency in update functions.

### 3.3 AI Integration

* Use **AI SDK** `generateObject` / `streamObject`.
* **Always** pass a Zod schema; on invalid JSON, **retry once** with a repair prompt; if still invalid, return 422.
* Prompts live in `libs/ai/prompts/*`, kept **modular** (extract, write bullets, cover letter).
* **No fabrication** guard: include instruction; run post‑validation to ensure no made‑up entities/dates.
* **Streaming**: When `?stream=true`, use SSE helpers in `libs/utils/sse.ts`.

---

## 4. Design System & Styling

* **Only** Tailwind + shadcn/ui; **no** other UI libs.
* **Tokens**:

  * App‑wide tokens: `--app-*` in `app/globals.css`.
  * Document‑scoped tokens: `--doc-*` applied in `.doc-theme` wrapper.
* **Rule**: Components inside templates and preview read **`--doc-*`** only. App shell reads `--app-*`.
* **No hard‑coded values** (hex, px constants). Use HSL variables and spacing tokens.
* Add shadcn components via CLI; do not copy‑paste from the web.

**Token write API (suggested)**

```ts
// libs/preview/tokens.ts
export function applyDocTokens(node: HTMLElement, tokens: DocTokens) {
  node.style.setProperty('--doc-primary', tokens.primary);
  node.style.setProperty('--doc-font-family', tokens.fontFamily);
  node.style.setProperty('--doc-font-size-scale', String(tokens.fontSizeScale));
  // ...
}
```

---

## 5. State Management

* **Zustand** store per editor with **zundo** for undo/redo; group rapid changes (120–180ms).
* **No global mutable singletons**; create slice stores scoped to features.
* Store only **UI state + document JSON**; do not cache server responses long‑term (stale risk).
* **Autosave** is debounced and cancels on unmount.

---

## 6. Performance Standards

* Keystroke → preview paint p95 ≤ **120ms**.
* Template switch render ≤ **200ms**.
* PDF export ≤ **2.5s** (1–2 pages).
* Avoid layout thrash: batch DOM writes, use `requestAnimationFrame`.
* **Web Workers** for heavy transforms if encountered (rare).
* **Virtualize** lists if a section has > 50 items.

---

## 7. Error Handling & Logging

* Use `apiError(status, message)` in routes; never `new Response()` manually.
* **No PII in logs** (emails, phone numbers, full addresses); log **IDs and status** only.
* **Categories**: `USER_INPUT` (400–422), `AUTH` (401–403), `NOT_FOUND` (404), `CONFLICT` (409), `RATE_LIMIT` (429), `SERVER` (5xx).
* **UI**: toast + inline error hints; preserve inputs.
* **Retry**: only for idempotent operations (AI generate, score read) with exponential backoff.

---

## 8. Rate Limiting

* In‑memory token bucket per `user.id` in API layer (simple Map).
* Defaults: soft **3 req/s**, hard **10 req / 10s**.
* On exceed: **429** with `Retry-After` header; UI shows countdown.

---

## 9. Internationalization & Accessibility

* **Dates**: `Intl.DateTimeFormat` with Profile defaults.
* **Addresses**: formatter helper; **Phones**: libphonenumber helper.
* **RTL**: per‑block `dir="rtl"` support in templates.
* **WCAG AA**: guard rails in color pickers; warn if contrast < threshold.

---

## 10. Export & Import Standards

* **PDF**: Same HTML as preview; Chromium prints with `preferCSSPageSize: true`, `printBackground: true`.
* **Import PDF**: prefer text layer; if missing, offer OCR (≤ 10 pages). Always show Review & Fix.

---

## 11. Storage Rules

* Private bucket `media`. (avatars removed from scope)
* Object keys must start with `userId/` (enforced by RLS).
* Upload validation on type/size **before** upload.
* Use signed URLs with short TTL for display; do not persist public URLs.

---

## 12. Migrations & Data Changes

* **File‑only** migrations under `/migrations/phaseX`.
* Await explicit approval to apply.
* Migrations must be **atomic** and **reversible** when feasible.
* **Never** modify DB schema outside migrations.

---

## 13. Dependency Policy

* Prefer **standard library** and existing deps first.
* Adding a new dependency requires:

  1. Clear need not covered by existing libs,
  2. MIT/Apache license,
  3. Small API surface, actively maintained.
* Remove unused deps promptly.

---

## 14. Versioning & Flags

* HTTP path versioning: `/api/v1`.
* Document schema: `schemaVersion` field (e.g., `resume.v1`).
* Feature flags: simple env or in‑code toggles; no flag service in v1.

---

## 15. Agent Playbooks (LLM‑Friendly)

### 15.1 Add a New API Endpoint

1. Define **Zod** request/response shapes in `libs/validation`.
2. Add route under `app/api/v1/...` with `withAuth` or `withApiHandler`.
3. Use repository functions; **do not** inline SQL.
4. Return `apiSuccess(data)`; map known errors to `apiError`.
5. Update OpenAPI doc snippet (local doc) to keep surface area aligned.

### 15.2 Add a New Template

1. Create `libs/templates/{type}/{slug}` with a **pure React** component.
2. Consume **`--doc-*`** tokens only.
3. Handle pagination (avoid widows/orphans; `break-inside: avoid`).
4. Register template in a small descriptor list under `libs/templates/index.ts`.

### 15.3 Add a New Document Field

1. Evolve **runtime schema** (Zod) and bump `schemaVersion`.
2. Render in editor form and preview; provide safe defaults.
3. Update exporter mappings.
4. Add migration if we store a derived field (rare).
5. Provide upgrade path (clone into new schema) if needed.

---

## 16. Prohibited Patterns (Hard Rules)

* Raw API handlers (no wrappers).
* Repositories used in **client** components.
* Service role key in runtime code.
* Hard‑coded CSS values (colors, px).
* Class‑based repos or singletons holding DB clients.
* Mixing `--app-*` and `--doc-*` tokens in the same component.
* Building custom state libraries; use Zustand.

---

## 17. Manual QA Checklist (v1)

* [ ] Sign in/out with Google works; `/me` returns user.
* [ ] Create, edit (live preview), autosave, undo/redo.
* [ ] Switch templates (no content loss; <200ms).
* [ ] PDF export (text selectable).
* [ ] Import from PDF (with/without OCR) → Review & Fix → Save.
* [ ] Score updates quickly; suggestions navigate to correct fields.
* [ ] Mobile flows: bottom nav, section editing, export.
* [ ] RLS: user A cannot access user B’s doc (attempt via API returns 404).
* [ ] No console errors; no network 4xx/5xx besides intended.

---

## 18. Code Review Checklist (Enforced)

**Architecture**

* [ ] Files placed under correct module (`libs/...`, not inside routes/components).
* [ ] No new top‑level folders added.

**AuthZ**

* [ ] Route uses `withAuth` if it reads/writes user data.
* [ ] Repository receives the **user‑scoped** Supabase client.

**Validation & Errors**

* [ ] Zod validates all request bodies and AI outputs.
* [ ] Responses use `apiSuccess`/`apiError` consistently.

**Styling**

* [ ] Only tokens used; no hex/px literals.
* [ ] Templates read from `--doc-*`, app shell from `--app-*`.

**Performance**

* [ ] No synchronous heavy code on keystroke paths.
* [ ] Export CSS is minimal and print‑safe.

**Security**

* [ ] No service role usage.
* [ ] No PII in logs.

**Docs**

* [ ] OpenAPI snippet updated if endpoint surface changed.
* [ ] Comments explain non‑obvious decisions.

---

### What these documents do

* **AuthN/AuthZ**: clear, minimal, secure defaults (Google‑only, owner‑only, RLS enforced).
* **Standards & Guidelines**: precise guardrails that keep code simple, consistent, and fast—while giving agents room to implement features creatively within the boundaries.

If you’re happy with these, I’ll proceed to the next pair: **Error Handling & Logging Strategy** and **Performance Requirements**.
