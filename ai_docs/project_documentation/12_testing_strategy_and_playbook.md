# 11) Testing Strategy & Playbook (Agent‑Oriented, Low‑Friction)

**Purpose**
Give our long‑running AI agent one clear way to test the app end‑to‑end—fast to set up, cheap to run, and hard to misuse. This playbook intentionally **overrides** the earlier “no testing” stance by introducing a **small**, **agent‑friendly** testing layer that you can run locally. There is **no CI/CD** and **no 3rd‑party services** required.

**Design principles**

* **Single stack, two tools**:

  * **Playwright** for **E2E & a11y** (browser‑level, user‑visible correctness).
  * **Vitest** for **API/repository contracts & utilities** (fast Node tests).
* **Deterministic by default**: a **Fake AI provider** for tests; we never hit real AI during test runs unless explicitly opted‑in.
* **RLS‑safe**: all data operations respect Supabase RLS; test seeding uses admin privileges only **outside** the runtime app (in the test harness).
* **Minimal scope**: cover **critical flows** only; avoid over‑specification.
* **Fast**: whole suite **≤ 10 minutes** on a laptop.

---

## 1. What we test (and what we don’t)

### In scope (v1)

1. **Happy‑path E2E**:

   * Google sign‑in flow (test‑mode shortcut, see §3.3)
   * Create résumé (manual) → edit → live preview → score panel → export (PDF/DOCX)
   * Import résumé from PDF (text layer) → Review & Fix → save
   * Import résumé with **OCR** (small 1–2 pages) → Review & Fix → save
   * AI zero‑to‑draft (via **Fake AI**) for résumé & cover letter → save
   * Template switch & **document theme token** changes (scoped to document) → export
   * Mobile interaction basics (bottom nav; edit/preview/score tabs)
2. **Contract tests** (fast, Node):

   * `/api/v1/resumes` & `/api/v1/cover-letters` CRUD: envelopes, status codes, optimistic concurrency `409`
   * `/api/v1/export/pdf|docx`: returns content type; PDF contains selectable text; DOCX opens
   * `/api/v1/score/*`: deterministic component returns without LLM rubric
   * Storage upload validates path prefix `userId/...`
3. **RLS & AuthZ**:

   * User A cannot read/update/delete User B’s document (API returns 404)
4. **Accessibility (a11y)**:

   * Key pages pass **axe** checks (dashboard, editor, import review, export dialog)
5. **Budget smoke** (soft assertions to avoid flakiness):

   * Keystroke→preview p95 < 120ms on sample doc (Playwright trace; warn on fail)
   * PDF export < 2.5s for a 1–2 page template (Node timer; warn on fail)

### Out of scope (v1)

* Full unit test coverage of every function
* Visual regression at scale (we do small snapshot checks where they’re stable)
* Load tests / distributed perf tests
* CI/CD integration

---

## 2. Tooling & Packages

* **E2E & a11y**:

  * `@playwright/test` (browser automation & assertions)
  * `@axe-core/playwright` (accessibility checks)
* **Contracts & node tests**:

  * `vitest` (fast test runner)
  * `supertest` **or** `undici` (HTTP to local Next route handlers)
* **PDF & DOCX inspection** (lightweight):

  * `pdf-parse` (verify text layer)
  * `yauzl` or `adm-zip` (open DOCX zip and look for `word/document.xml`)

> These add minimal weight and align with our stack. No external cloud services required.

---

## 3. Test Environment & Modes

### 3.1 Environments

* **Local dev**: run app with `.env.local`
* **Local test**: run app with `.env.test` (separate Supabase project or isolated schema/buckets)

### 3.2 Env flags (add to `.env.test`)

```
# Turn on test harness endpoints and fake AI
TEST_MODE=1
AI_MODE=fake        # fake | real
AI_MODEL=gemini-2.0-flash
```

### 3.3 Test‑mode authentication (critical simplification)

Google OAuth is hard to automate in E2E. In **TEST_MODE**, expose a **test‑only route**:

* `POST /api/test-utils/sessions` → sets a **signed Supabase session cookie** for a dummy user (created via Supabase admin SDK in this test‑only handler).
* Guard the route: only if `process.env.TEST_MODE === '1'` **and** `NODE_ENV === 'test'`.
* This handler is **not** bundled in production; it lives under `app/api/test-utils` and exports nothing unless in test mode.

> This keeps RLS intact in the app while the test harness seeds data & sessions safely.

### 3.4 Fake AI Provider

In **tests**, `libs/ai/provider.ts` switches to a fake provider (`AI_MODE=fake`) that implements the same `generateObject/streamObject` API and returns **golden fixtures** (static JSON for résumés & cover letters, short SSE streams for streaming endpoints).

* Fixtures live in `tests/fixtures/ai/*.json`.
* Real AI can be used locally by setting `AI_MODE=real` but **tests default to fake** to avoid cost & flakiness.

---

## 4. Repository & Scripts

**Recommended scripts** (add to `package.json`)

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",

    "test": "npm run test:api && npm run test:e2e",
    "test:api": "vitest run",
    "test:e2e": "playwright test",

    "test:open": "playwright test --ui",
    "test:report": "playwright show-report",

    "test:setup": "node tests/scripts/setup.js",
    "test:teardown": "node tests/scripts/teardown.js",
    "test:seed": "node tests/scripts/seed.js"
  }
}
```

**Directory layout**

```
tests/
  e2e/
    auth.spec.ts
    documents.spec.ts
    editor.spec.ts
    import.spec.ts
    ai-draft.spec.ts
    export.spec.ts
    mobile.spec.ts
    a11y.spec.ts
  api/
    resumes.contract.spec.ts
    coverletters.contract.spec.ts
    export.contract.spec.ts
    score.contract.spec.ts
    rls.spec.ts
  fixtures/
    ai/sample-resume.json
    ai/sample-cover-letter.json
    pdf/text-layer.pdf
    pdf/scanned-2pg.pdf
    json/resume-deep.json
  scripts/
    setup.js        # create buckets, run migrations on test DB
    teardown.js     # drop/cleanup test data
    seed.js         # seed sample users/docs
```

> `setup.js` and `seed.js` may use **Supabase service role** to create test users & data, but this code is **outside** the runtime app and only runs with `NODE_ENV=test`. The runtime app continues to use user‑scoped clients with RLS.

---

## 5. Test Plans (What to assert)

### 5.1 E2E (Playwright)

**auth.spec.ts (test‑mode)**

* `POST /api/test-utils/sessions` with `{email}` returns 204 and sets cookies
* Visiting `/documents` shows empty state → “Create Document” visible

**documents.spec.ts**

* Create résumé (manual) → autosave indicator shows → document appears in list
* Duplicate doc; both show with different IDs; delete soft‑deletes one → no longer in default list

**editor.spec.ts**

* Typing a bullet updates preview in ≤ 120ms p95 (measure 30 edits; use soft expect `<= 160ms` to reduce flake)
* Switch template; render in ≤ 200ms; no content loss
* Change **document theme tokens** (color/font/spacing/icons); template reflects only inside `.doc-theme`; app shell unchanged

**import.spec.ts**

* Upload `text-layer.pdf` → Review & Fix shows populated fields; Accept → new document saved
* Upload `scanned-2pg.pdf` with OCR → progress visible → Accept → new document saved
* If OCR disabled on scanned PDF → user‑safe error shown (`PDF_EXTRACT_FAILED`)

**ai-draft.spec.ts**

* AI draft (resume) with fake streaming → live preview hydrates; Save as Document works
* AI draft (cover letter) → saved and re‑openable

**export.spec.ts**

* Export PDF: returns `application/pdf`; use `pdf-parse` to assert the name & headline text exist and text layer is present
* Export DOCX: content type correct; unzip and assert `document.xml` contains user’s name string

**mobile.spec.ts**

* Emulate iPhone 12: bottom navigation present; Edit/Preview/Score tabs accessible; section drawer usable; export dialog accessible

**a11y.spec.ts**

* Run `axe` on Dashboard, Editor, Import Review, Export dialog; no critical violations (ignore known false positives with documented tags)

---

### 5.2 API Contracts (Vitest)

**resumes.contract.spec.ts**

* `GET /resumes` → `ApiResponse` envelope with array
* `POST /resumes` (idempotency key) → 201 + `ResumeDocument`
* `PUT /resumes/{id}` with wrong `version` → 409 `VERSION_CONFLICT`
* `PATCH /resumes/{id}` partial update ok

**coverletters.contract.spec.ts**

* CRUD equivalent to resumes

**export.contract.spec.ts**

* PDF export returns bytes; size > 10 KB; header `Content-Disposition` present
* DOCX export returns correct MIME

**score.contract.spec.ts**

* Deterministic score returns 5 sub‑scores and suggestions array

**rls.spec.ts**

* Two sessions (A & B) → A creates doc; B `GET /resumes/{id}` → 404
* B cannot `PUT/DELETE` A’s doc → 404 or 403 depending on surface

---

## 6. Example Snippets

**Playwright: test‑mode login helper**

```ts
// tests/e2e/utils.ts
import { request as pwRequest, APIRequestContext } from '@playwright/test';

export async function loginTestUser(page, email = 'alice@test.local') {
  const ctx: APIRequestContext = await pwRequest.newContext();
  const r = await ctx.post('http://localhost:3000/api/test-utils/sessions', {
    data: { email }
  });
  if (r.status() !== 204) throw new Error('Failed to create test session');
  // Copy cookies into browser context
  const cookies = await ctx.storageState();
  await page.context().addCookies(cookies.cookies);
}
```

**Vitest: PDF export contract**

```ts
import { expect, test } from 'vitest';
import { fetch } from 'undici';

test('pdf export returns selectable text', async () => {
  const res = await fetch('http://localhost:3000/api/v1/export/pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.TEST_BEARER}` },
    body: JSON.stringify({ documentId: '...', templateSlug: 'modern-minimal' })
  });
  expect(res.status).toBe(200);
  expect(res.headers.get('content-type')).toMatch(/application\/pdf/);
  const buffer = Buffer.from(await res.arrayBuffer());
  // parse
  const pdf = await require('pdf-parse')(buffer);
  expect(pdf.text).toContain('Alice Test'); // from seeded fixture
});
```

---

## 7. Running Locally (Agent Checklist)

1. **Start test DB**: provision a separate Supabase project (or schema) for tests.
2. `cp .env.local .env.test` and set: `TEST_MODE=1`, `AI_MODE=fake`.
3. `npm run test:setup` (migrations + buckets)
4. `npm run dev` (or `start` in test mode)
5. In another terminal:

   * `npm run test:api` (fast contracts)
   * `npm run test:e2e` (UI flows; can open with `npm run test:open`)

> If you must hit real AI for a manual spot check: `AI_MODE=real npm run test:e2e` (expect flakes & cost; not recommended).

---

## 8. Data & Fixtures

* **Users**: `alice@test.local`, `bob@test.local` created by `tests/scripts/seed.js`.
* **Docs**: baseline résumé/cover letter JSON fixtures (English, 1–2 pages).
* **PDFs**: `text-layer.pdf` (real text layer) and `scanned-2pg.pdf` (image‑only).
* **Templates**: ensure at least `modern-minimal`, `classic-serif`, `photo-card` exist in test build.

---

## 9. Flakiness Controls

* Use **deterministic fixtures** (Fake AI).
* Add **soft assertions** for timing (warn on exceed, don’t fail) to keep runs stable on laptops.
* Limit parallelism for OCR/Export tests to `--workers=2`.
* Disable animations in tests (set `prefers-reduced-motion` and CSS).

---

## 10. Maintenance Rules

* New endpoints or breaking changes → **add/adjust a contract test**.
* New templates → add a quick **export smoke** and **one a11y check**.
* When adding a new document field: update **fixtures**, **export mapping**, and **one contract test**.
* Keep the **Fake AI** fixtures small and readable; include edge cases as separate files.

---

## 11. Time & Cost Budgets

* **API contracts**: ~1–2 min
* **E2E base flows**: ~5–7 min
* **Total**: ≤ **10 min** on a typical laptop

---

## 12. Guardrails & Ethics

* Never log or snapshot real user PII in tests.
* Test‑mode endpoints and admin seeding must be **dead in production**.
* Service role keys are allowed **only** in `tests/scripts/*` and never imported by app code.

---

## 13. Exit Criteria (v1 “Done”)

* [ ] All E2E happy paths pass with **Fake AI**
* [ ] Contract suite green (CRUD, export, score, RLS)
* [ ] a11y critical violations = 0
* [ ] PDF export smoke proves selectable text
* [ ] Docs updated: any surface change reflected in tests & fixtures

---

### Summary

This testing plan gives the agent **one simple path** to reliable checks:

* **Playwright** for the real user experience (+ a11y),
* **Vitest** for API/repo contracts,
* **Fake AI** to keep runs fast and deterministic,
* **Test‑mode auth** to bypass brittle Google flows—while keeping RLS and real app boundaries intact.

It’s minimal, fast, and aligned with our architecture—and it will keep us shipping confidently without burying the project in test complexity.