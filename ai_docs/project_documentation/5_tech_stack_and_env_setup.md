# 4) Tech Stack & Environment Setup

A concise, repeatable, **npm‑only** setup your agent can follow for local dev and production.

---

## 4.1 Runtime & Tooling

* **Node.js**: 20 LTS (required)
* **Package manager**: **npm** (per fixed decisions)
* **Framework**: Next.js (App Router)
* **Language**: TypeScript
* **UI**: Tailwind CSS + shadcn/ui (New York) with CSS variables in `app/globals.css`
* **State**: Zustand + zundo (+ immer)
* **Auth/DB/Storage**: Supabase
* **AI SDK**: `ai` (Virtual AI SDK) with **Google Generative AI provider** (Gemini 2.0 Flash). The provider uses `GOOGLE_GENERATIVE_AI_API_KEY` by default. ([AI SDK][3])
* **Structured output**: AI SDK `generateObject` / `streamObject` with Zod schemas. ([AI SDK][4])
* **PDF export**: `puppeteer-core` + ` @sparticuz/chromium` in **Node** runtime route handlers. Use Chromium’s serverless args from the package. ([GitHub][5])
* **DOCX export**: `docx` library. ([docx.js.org][6])
* **PDF import**: `pdf-parse` or `unpdf` (server); **OCR fallback** with `tesseract.js` (capped ≤ 10 pages).

---

## 4.2 Repository Layout (authoritative)

```
app/
  (routes, layouts, server components)
  api/
    v1/
      ai/...
      export/...
      import/...
      resumes/...
      cover-letters/...
      score/...
      templates/...
      templates/...
libs/
  api-utils/            # handlers, responses, errors, middleware (auth)
  repositories/         # pure functions (server-only)
  ai/                   # ai-sdk provider + prompt modules + Zod schemas
  scoring/              # deterministic checks + composer
  exporters/            # pdf/docx
  templates/            # resume/cover-letter React renderers
  preview/              # paged preview helpers
  i18n/                 # date/address/phone formatting
  validation/           # zod input validators
  utils/                # helpers (cn, SSE, etc.)
migrations/
  phase1/...            # SQL files (not applied until you say so)
  phase2/...
public/
  -- static assets --
```

> Follow your **Coding Patterns & Rules** strictly: repositories as pure functions, standardized API wrappers, and **no** raw API handlers.

---

## 4.3 Dependencies (minimal list)

**Dependencies**

* `next`, `react`, `react-dom`
* ` @supabase/supabase-js`
* `ai`                      # Virtual AI SDK (core)
* `zod`
* `zustand`, `zundo`, `immer`
* `lucide-react`
* `tailwindcss`, `postcss`, `autoprefixer`
* `clsx` (or `classnames`)
* `next-themes`
* `docx`
* `puppeteer-core`, ` @sparticuz/chromium`      # serverless PDF
* `tesseract.js`                                # OCR fallback
* `pdf-parse` (or `unpdf`)
* `pagedjs`                                     # client paged preview (optional)

**DevDependencies**

* `typescript`, ` @types/node`, ` @types/react`, ` @types/react-dom`
* `eslint` (optional, if you want linting)
* `tailwindcss` init tools & shadcn CLI (installed ad‑hoc when adding components)

> Keep versions current at install time. The **AI SDK** Google provider defaults to reading the `GOOGLE_GENERATIVE_AI_API_KEY` environment variable for authentication. ([AI SDK][3])

---

## 4.4 Environment Variables (.env.local)

> Keep secrets server‑side only. Never expose service role keys to the client.

```dotenv
# Supabase (client-side public)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# Supabase (server)
SUPABASE_SERVICE_ROLE_KEY=...      # server-only; used in restricted operations if ever needed

# AI provider (AI SDK → Google Generative AI)
GOOGLE_GENERATIVE_AI_API_KEY=...   # used by AI SDK Google provider (x-goog-api-key)
AI_SDK_PROVIDER=google              # our internal switch, read by libs/ai/provider

# Export (Chromium/Puppeteer)
# Typically no explicit path is needed with @sparticuz/chromium in serverless.
# For local dev, you may set a local Chrome path if needed:
# PUPPETEER_EXECUTABLE_PATH=/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome
```

> The AI SDK’s Google provider uses `GOOGLE_GENERATIVE_AI_API_KEY` by default and hits `https://generativelanguage.googleapis.com/v1beta`. ([AI SDK][3])

---

## 4.5 Supabase Project Setup

1. **Create project** in Supabase dashboard.
2. **Auth → Providers → Google**: enable Google OAuth (use **Site URL** pointing to your app: local = `http://localhost:3000`, prod = your domain).
3. **Copy** project URL & anon key → put in `.env.local`.
4. **Storage**: create a **private** bucket: `media` (avatars out of scope).
5. **Run migrations** (file‑only step now; apply only after approval).
6. **RLS**: Verify policies exist (from migration SQL above).
7. **Test sign‑in** (Google) from local dev.

> Storage access is governed via policies on `storage.objects`; with private buckets + path‑prefix rules, only the owner can read/write their folder. ([Supabase][2])

---

## 4.6 Next.js Configuration

**`next.config.mjs`**

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: [' @sparticuz/chromium']
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' }
    ]
  }
}
export default nextConfig
```

**Route runtime declarations**

* AI streaming routes (`/api/v1/ai/*`) → `export const runtime = 'edge'`.
* PDF/DOCX export and PDF import → `export const runtime = 'nodejs'`.

> Use serverless Chromium defaults from ` @sparticuz/chromium` in Node routes; they bundle arguments tuned for serverless platforms. ([GitHub][5])

---

## 4.7 Tailwind & shadcn/ui

* Initialize Tailwind (`tailwind.config.js`, `postcss.config.js`, `app/globals.css`).
* Install shadcn CLI and set `components.json` with New York style and our alias mapping.
* **Design tokens** live in `app/globals.css` as CSS variables (colors in HSL, spacing, radius, typography).
* Only use Tailwind + shadcn/ui; **no** other UI frameworks (per fixed rules).

---

## 4.8 AI SDK Provider Setup

**`libs/ai/provider.ts`**

```ts
import { createGoogleGenerativeAI } from ' @ai-sdk/google'; // provider
import { generateObject, streamObject } from 'ai';
import { z } from 'zod';

export const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY!, // defaults to this env key
});

export const model = google('gemini-2.0-flash'); // default model for v1
```

**Structured output usage**

```ts
const ResumeJson = z.object({ /* ...schema fields per ResumeJson... */ });

export async function extractResume(text: string) {
  return generateObject({
    model,
    schema: ResumeJson,
    prompt: `Extract a structured ResumeJson from the following text...`,
  });
}
```

> AI SDK provides `generateObject` / `streamObject` to standardize structured generation across providers; Google’s Gemini supports structured JSON outputs, which is ideal for imports and drafting. ([AI SDK][4])

---

## 4.9 PDF/DOCX Export Setup

**Serverless PDF** (`libs/exporters/pdf.ts`)

* Use `puppeteer-core` + ` @sparticuz/chromium`.
* Render the same HTML used by the preview; pass `preferCSSPageSize: true`, `printBackground: true`.
* In local dev, if Chromium path isn’t provided by ` @sparticuz/chromium`, you can fall back to a local Chrome executable path (optional).
* Keep CSS lean (print styles) to avoid timeouts.

> Reference guidance for Puppeteer on Vercel and using Sparticuz Chromium for serverless. ([Vercel][7])

**DOCX** (`libs/exporters/docx.ts`)

* Map the shared schema to Word paragraphs, headings, bullet lists.
* Avoid text boxes/tables for main content to keep ATS‑friendly.
* `docx` is mature and battle‑tested. ([docx.js.org][6])

---

## 4.10 API Runtimes & NPM Scripts

**NPM scripts**

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "type-check": "tsc --noEmit",
    "lint": "eslint . --ext .ts,.tsx"
  }
}
```

**Runtime rules**

* **Edge**: AI streaming, lightweight compute (no headless browser).
* **Node**: PDF/DOCX export, PDF parsing/OCR, uploads.

---

## 4.11 Local Development Workflow

1. `cp .env.example .env.local` → fill Supabase + AI keys.
2. `npm install`
3. Start dev: `npm run dev` → `http://localhost:3000`
4. Sign in with Google (Supabase Auth).
5. Create a résumé (Manual), type, see instant preview.
6. Try **Import PDF**; if scanned, opt‑in to **OCR** (≤ 10 pages).
7. Try **AI Draft** with a job description.
8. Export **PDF** and **DOCX**.
9. Verify **Storage**: avatar/media upload paths begin with your `user_id/`.

---

## 4.12 Production Checklist (minimal)

* Set environment variables in hosting (Supabase URL/keys, Google AI key).
* Ensure bucket `media` exists and is **private**.
* Confirm RLS policies exist and are enabled.
* Confirm AI endpoints run on **Edge** and exports on **Node**.
* Verify PDF export within SLA (< ~2.5s for 1–2 pages).
* No analytics; error/perf logs only.

---

## 4.13 Guardrails & Simplicity

* No CI/CD, no tests, no payments yet (per fixed decisions).
* Keep the **DB small** and **schema stable**; evolve JSON shapes via `schemaVersion`.
* Avoid over‑indexing. Measure first if queries become slow.
* Repository pattern + `withApiHandler/withAuth` wrappers only.
* Apply migrations **only after approval**.

---

### What these two docs enable

* The agent can **create tables & policies** (file‑only), wire repositories, and start building routes safely with RLS.
* The environment is **repeatable** with clear env vars, provider setup, and runtime splits.
* The system remains **decoupled and versionable** (JSONB + schemaVersion), and simple to scale.

---
