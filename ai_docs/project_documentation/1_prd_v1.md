# PRD — “ResumePair” v1

**Product**: AI‑assisted résumé & cover‑letter builder
**Principles**: *Jobs‑level simplicity* (minimal steps, delightful defaults), *AI‑first*, *ATS‑safe output*, *fast live preview*, *serverless and maintainable*.
**Core Scope (v1)**:

1. **Résumé/CV creation** with 3 start modes (Manual, PDF‑import, AI‑assistant).
2. **Templates**: multiple designs with color/font/spacing/icon customization.
3. **Cover letter** with the same 3 start modes and template system.
4. **Scoring sidebar** (modular ATO/“résumé score”) usable anywhere in the app.
5. **Exports**: PDF.

> **Backbone**: The app uses the (Vercel) **AI SDK** (“Virtual AI SDK” in the brief) for model orchestration & structured outputs, with **Gemini 2.0 Flash** as the default writer/extractor model. The AI SDK provides provider‑agnostic structured output generation and streams; Gemini supports structured/JSON outputs and large‑context, multimodal understanding (important for PDF import and job‑description alignment). ([AI SDK][1])

---

## 1) Problem Statement & Goals

### Problem

Most résumé builders feel heavy—many inputs before a result, janky previews, and outputs that occasionally break ATS parsing.

### Goals (v1)

* **<60s to first draft** starting from any of the 3 modes.
* **Smooth, near‑instant preview** as the user types (subjective: “no jitter”).
* **Consistent schema** across all templates to keep logic simple and stable.
* **ATS‑safe outputs** (machine‑readable PDFs, standard fonts, simple layout).
* **Reusable scoring** component for any résumé/cover letter instance.
* **Serverless‑friendly implementation** with maintainable code paths and low costs.

### Non‑Goals (v1)

* Team collaboration, comments, or real‑time multi‑editor.
* Marketplace for third‑party templates.
* Advanced CRM/job tracking.
* Marketing site/tooling (score can be reused later, but implementation now focuses on product pages only).

---

## 2) Users & Primary Jobs‑to‑Be‑Done

* **Student/Graduate**: No prior résumé, needs fast starter.
* **Working Professional**: Has existing résumé PDF; wants import + quick polish.
* **Career Switcher/Immigrant**: Needs localization (dates/address/phone formats).
* **Power Users**: Want precise control over typography/colors and reusable profiles.

Success metrics (internal):

* TTFD (Time to First Draft) median < 45s.
* Export success rate > 99.5%.
* Preview update latency p95 < 120ms after keystroke (typed edit → preview change).
* Parsing score (internal validator) ≥ 95% machine‑readability.

---

## 3) Top‑Level Architecture

**Front end**: Next.js (App Router), client preview (HTML) + template components.
**AI Orchestration**: AI SDK with Google Gemini 2.0 Flash via provider module; structured output via `generateObject/streamObject` (Zod/JSON Schema). ([AI SDK][2])
**Storage/Auth**: Supabase (Auth, Postgres, Storage).
**Server**: Next.js Route Handlers. Node runtime for PDF rendering; Edge runtime for AI streams where supported. (AI SDK has Google provider & Vertex provider variants; Vertex provider supports Edge runtime if chosen.) ([AI SDK][3])
**Exports**:

* **PDF**: HTML → PDF via headless Chromium (Puppeteer/Playwright) in a serverless function; export uses print CSS and paged media semantics. ([Vercel][4])

**Templates**: React components with a shared data schema + design tokens.
**Scoring**: Deterministic rules + lightweight model rubric (Gemini) → composite score.

---

## 4) Canonical Content Schema (Model‑Independent)

> **Purpose**: Single JSON object that **all** components share (AI outputs, editor state, template renderers, exports). We’ll finalize DB tables later; here we specify the **runtime schema**.

**ResumeJson v1**

* `profile`: `fullName`, `headline`, `email`, `phone`, `location` (city, region, country, postal), `links` (type, label, url), `photo` (optional, stored in Supabase).
* `summary`: short paragraph.
* `work`: array of items `{company, role, location, startDate, endDate|null|“Present”, descriptionBullets[], achievements[], techStack[]}`
* `education`: array `{school, degree, field, startDate, endDate, details[]}`
* `projects`: array `{name, link, summary, bullets[], techStack[]}`
* `skills`: grouped `{category, items[]}` (e.g., Programming, Tools, Soft Skills)
* `certifications`: array `{name, issuer, date}`
* `awards`: array `{name, org, date, summary}`
* `languages`: array `{name, level}`
* `extras`: array of labeled blocks (for misc sections)
* `settings`: `{locale, dateFormat, addressFormat, fontFamily, fontSizeScale, lineSpacing, colorTheme, iconSet, showIcons, sectionOrder[], pageSize}`

**CoverLetterJson v1**

* `from`: contact block (reuse `profile` fields).
* `to`: `{name, role, company, address}`
* `date`: ISO string; formatting via locale.
* `salutation`: string (e.g., “Dear Hiring Manager,”)
* `body`: **blocks** (paragraphs, bullets) allowing **bold/italic/underline** marks.
* `closing`: `{phrase, name, signatureImage?}`
* `settings`: same knobs as résumé.

> **Design rule**: **Templates never modify schema**; they **only read** it. All modes (Manual, Import, AI) must produce these schemas.

---

## 5) Core Flows

### 5.1 Onboarding & Mode Selection

* Start screen with 3 cards: **Type Manually**, **Upload PDF**, **Start with AI**.
* Ask locale on first visit (for dates/addresses). Persist in profile.

### 5.2 Mode A — Manual

* Left panel = form sections (progressively disclose).
* Right panel = **live paginated preview** (HTML).
* Auto‑save to Supabase every 2s idle or on blur; optimistic UI.

### 5.3 Mode B — PDF Import

**Input**: user uploads a PDF.
**Steps**:

1. **Text extraction**: try PDF text layer (server). Use `pdf.js`/`pdf‑parse` or `unpdf` for reliable serverless extraction. If no text layer (scanned), offer **OCR fallback** (Tesseract.js server/Edge function with page count limits in v1). ([npm][6])
2. **Schema mapping**: send raw text (and, if needed, light heuristics like line grouping) to **Gemini 2.0 Flash** with a **strict schema request** using AI SDK’s structured output (`generateObject` with Zod/JSON Schema matching `ResumeJson`). ([AI SDK][2])
3. **User reconciliation**: show a **“Review & Fix”** diff view (extracted vs. fields).
4. Land in editor with the populated schema.

> Note: Gemini supports structured/JSON outputs; the AI SDK normalizes structured outputs across providers, so we cache our schema once and reuse. ([Google AI for Developers][7])

### 5.4 Mode C — AI‑Assistant (Zero‑to‑Draft)

**Input**: freeform text box (paste **personal info** + **job description**).
**Steps**:

1. Detect presence of JD (regex on “Responsibilities/Requirements/Qualifications”).
2. Send prompt with *two tools*: (a) **extract profile** → `ResumeJson`, (b) **write/rewrite** bullets to align with JD while staying truthful (strict “no fabrication” policy).
3. Stream a first draft; enter editor.

### 5.5 Template System

* **Template Gallery** (3–6 v1): minimal, modern, classic serif, left‑rail, two‑column, photo‑friendly.
* **Customization**: color palette (brand + neutrals), font (ATS‑safe defaults), font size scale (+/‑), line spacing, **icons on/off + set selection**, date format, section order toggles.
* **Template switch** preserves schema; preview updates instantly.

### 5.6 Cover Letter

* Mirror the 3 modes.
* Editor supports rich text for body (bold/italic/underline + bullets).
* Templates: classic block, modern letterhead, left rule with accent.
* Preview & exports same as résumé.

### 5.7 Scoring Sidebar (ATO/Resume Score)

* Always visible right/left collapsible panel.
* Shows **overall score (0–100)** + 5 sub‑scores with actionable suggestions:

  1. **ATS Readiness** (layout, machine‑readable text, headings, no text in images).
  2. **Keyword Match** (against optional JD).
  3. **Content Strength** (action verbs, quantified impact).
  4. **Format Quality** (contrast, line length, spacing, font size bounds).
  5. **Completeness** (sections present, contact info).
* Clicking a suggestion jumps to the relevant field or toggles a fix (e.g., date format).

---

## 6) Rendering & Export Strategy

### 6.1 Live Preview (HTML first)

* **Rationale**: keep latency minimal; rendering is just React + CSS.
* Use **CSS Paged Media** patterns (page boxes, page breaks) + a lightweight paginator for visual pages. Tools: **Paged.js** in the browser for consistent pagination and print‑CSS features (headers/footers, page numbers). ([MDN Web Docs][8])
* Smoothness tactics:

  * Coalesce edits with **`requestAnimationFrame`** + 120–180ms debounce.
  * **Virtualize** heavy lists (e.g., 100+ achievements) though rare.
  * Use **Zustand** store for editor state; compute‑heavy transforms off the main thread (Web Worker) when needed.

### 6.2 PDF Export (HTML → PDF)

* **Preferred**: HTML/CSS → **Puppeteer/Playwright** headless Chromium in a Node serverless function that calls `page.pdf()` with `@page` rules. Proven on Vercel with `puppeteer-core` + `@sparticuz/chromium` (Chromium trimmed for serverless). Use Playwright if we standardize on its API. ([Vercel][4])
* **Why not client‑side**: client PDF libs struggle with page layout fidelity & fonts; server renders ensure **WYSIWYG** with the same HTML/CSS used for preview.
* **Fallback/Scale**: If serverless size/timeouts become an issue, run **Gotenberg** (Chromium in a container) as a **separate microservice**—kept out of the main Next.js deploy; internal endpoint only. ([Gotenberg][9])

---

## 7) Templates & Design System

### 7.1 Template Implementation

* Each template is a **pure React component** that receives `ResumeJson`/`CoverLetterJson` + `settings`.
* They consume a global **design‑token layer**:

  * **Typography** (font family choices, size scale, leading).
  * **Colors** (primary, text, muted, border, background).
  * **Spacing scale**.
  * **Icon set** + size.
* Pagination cues: avoid widows/orphans via CSS (`break-inside: avoid`, keep lines together).
* Test each template for **1–3 pages** across **narrow/wide content**.

### 7.2 Fonts (ATS‑compatible, open & common)

Ship a curated list with open or commonly available choices:

* **Sans**: Inter, Source Sans 3, Roboto, Noto Sans; plus system fallbacks (Arial/Helvetica) for portability.
* **Serif**: Source Serif 4, Georgia (system).
* Guidance: avoid decorative/novelty faces; keep 10–12 pt equivalent in exports. External references agree that **clear, standard fonts** are safer for ATS parsing. ([Jobscan][10])

### 7.3 Icons (free, broad coverage)

* **Choice**: **Iconify** (aggregator) with whitelisted open sets **Tabler** (MIT), **Lucide** (MIT), and **Material Symbols** (Apache‑2.0). This gives tens of thousands of consistent, customizable SVGs, offline‑bundleable per template. ([Iconify][11])
* Mapping dictionary: section → default icon (e.g., Work `briefcase`, Education `graduation-cap`, Skills `sparkles`, Certifications `award`, Languages `globe-2`).
* **Toggle**: allow users to turn icons off for maximal ATS safety.

---

## 8) Internationalization & Formatting

* **Dates**: Use `Intl.DateTimeFormat` with per‑user `locale` & `dateFormat` (US/ISO/EU presets). Node’s ICU note: ensure full‑icu build in production for consistency. ([MDN Web Docs][12])
* **Addresses**: Format by region using **address‑formatter** or **i18n‑postal‑address** (OpenCageData formats). ([GitHub][13])
* **Phones**: Parse/format with **libphonenumber‑js**. ([libphonenumbers.js.org][14])
* **Right‑to‑left**: Support RTL for languages like Arabic/Hebrew (template CSS `dir="rtl"` where appropriate).

---

## 9) AI Prompts & Structured Outputs

> **All AI interactions must be modular & testable.** We define small, composable prompt units with Zod schemas. The AI SDK’s `generateObject/streamObject` constrains output to our JSON schemas. ([AI SDK][2])

### 9.1 Prompt Modules

* **P‑Extract‑Resume**: Input raw text (from PDF/clipboard); Output `ResumeJson` with strict typing and safe defaults.
* **P‑Write‑Bullets**: Given experience + JD, rewrite bullets to be **concise, quantified, truthful**; no fictional claims.
* **P‑Summarize‑Profile**: Draft a 2–3 sentence summary aligned to JD keywords.
* **P‑CoverLetter‑Draft**: Produce `CoverLetterJson` blocks with style knobs (formal/neutral).
* **P‑Score‑Rubric**: Given `ResumeJson` (+ optional JD), return sub‑scores + suggestions per rubric below.

### 9.2 Safety/Robustness

* Force **JSON only** outputs with schema; retry on invalid JSON.
* Add `max_tokens`, deterministic `temperature` for extraction; slightly higher temp for writing variants.
* **Streaming** for AI mode UX; allow early edits while finishing.
* **Rate limit**: 2–3 req/sec/user (soft), with backoff.

> **Notes**:
> • Gemini structured outputs are supported in API docs; the AI SDK standardizes structured generation across providers, letting us keep one schema & code path even if we ever swap models. ([Google AI for Developers][7])

---

## 10) Scoring (ATO/Resume Score)

### 10.1 Purpose

Provide immediate, actionable feedback and a single score (0–100). Must be cheap, fast, and **reusable** (works for any résumé/cover letter instance).

### 10.2 Sub‑scores & Signals

1. **ATS Readiness (0–30)**

   * Machine‑readable? (no scanned images only; text layer present)
   * No content solely inside images or complex tables; heading hierarchy present.
   * Allowed fonts used; size ≥ 10pt; sufficient contrast.
   * Export contains selectable text (PDF).
2. **Keyword Match (0–25)**

   * Extract JD keywords (nouns/skills) vs. résumé coverage; penalize missing core terms; bonus for quantified, relevant bullets.
3. **Content Strength (0–20)**

   * Action verbs, quantification, impact structure (what → how → result).
4. **Format Quality (0–15)**

   * Line length 45–90 chars, spacing 1.0–1.4, consistent bullet style, no orphans/widows.
5. **Completeness (0–10)**

   * Contact info, top sections present; no empty headings.

**Computation**:

* **Phase A (deterministic)**: static checks directly on our JSON + rendered HTML (no network).
* **Phase B (LLM rubric)**: optional 1 small call to Gemini for qualitative scoring on clarity & impact with an explicit rubric → returns numeric breakdown + suggestions (kept ≤ 512 tokens).
* **Output**: overall, sub‑scores, **suggestions[]** with `severity`, `sectionRef`, and `one‑click Quick Fix` where safe (e.g., change date style, toggle icons).

> References on ATS‑safety (fonts/format) recommend **simple, text‑based PDF** with standard fonts and minimal columns/tables. We follow that standard for PDF exports. ([Jobscan][10])

---

## 11) Media & Images

* **Photo support** (template‑dependent): circular or rounded square avatar 240–320px logical.
* Client‑side **crop** via `react‑easy‑crop`; compress large photos (`browser-image-compression`) before upload (web worker to keep UI smooth). ([valentinh.github.io][15])
* **Storage**: Supabase Storage with **signed URLs**; on‑the‑fly **image transformations** for thumbnails & responsive preview. ([Supabase][16])
* Accept PNG/JPEG/WebP; max 5 MB v1.

---

## 12) Performance, Undo/Redo & State

* **State**: `zustand` store with **immer** middleware; implement undo/redo using **patches** or `zundo` temporal middleware. Keep history size bounded; group changes during fast typing. ([immerjs.github.io][17])
* **Preview budget**: Apply edits → recompute affected blocks only; throttle heavy reflows.
* **Autosave**: Debounced; store patch diffs or snapshots (v1 OK with snapshots).
* **PDF export latency target**: < 2.5s for 1–2 pages.

---

## 13) Security & Privacy

* **Auth**: Supabase Auth.
* **RLS**: Strict per‑user row‑level security on all content tables. ([Supabase][18])
* **PII**: Encrypt at rest (Supabase default + storage policies). Do not log document content.
* **Uploads**: Validate MIME/size; strip EXIF.
* **Signed URLs** for media; short expiry; server mediates exports.
* **AI Keys**: All AI calls from server (Edge/Node); no client‑side keys.

---

## 14) Accessibility

* WCAG AA color contrast defaults; toggle high contrast theme.
* Keyboard navigation for all inputs; ARIA labels for template selections.
* Screen‑reader friendly form labels; avoid icon‑only semantics (text alternatives).

---

## 15) Error Handling & Observability

* **Soft failures**: If PDF export fails, show actionable message ("Try simpler template / reduce content length").
* **Import**: If extraction quality < threshold, prompt “Import Low Confidence” and jump to review screen.
* **Logging**: Non‑PII error telemetry (endpoint latency, export success/failure counts), feature usage (template switches) for product quality only (no marketing targeting).

---

## 16) Detailed Implementation Decisions

### 16.1 AI SDK + Gemini

* Use AI SDK **Google provider**; production on Vertex or Developer API depending on billing; both supported by AI SDK, and Vertex provider supports Edge. Use `generateObject`/`streamObject` for strict JSON. ([AI SDK][3])
* **Models**: Default **Gemini 2.0 Flash** for speed/cost; configurable. Reference docs indicate 2.0 Flash is optimized for speed with long context. ([Google Cloud][19])
* **Structured Outputs**: Define Zod schemas mirroring `ResumeJson`/`CoverLetterJson`. Also keep a “no‑schema” fallback pathway for extreme content. ([AI SDK][2])

### 16.2 PDF Generation (Serverless)

* Implement a **Node runtime route handler** (`/api/export/pdf`) that:

  1. Receives schema + template slug,
  2. SSR renders the **same HTML** with template CSS,
  3. Starts headless Chromium (Playwright or `puppeteer-core` + `@sparticuz/chromium`) and `page.pdf()` with `printBackground: true`, `format: A4/Letter`, `preferCSSPageSize: true`.
* Verified approaches & caveats for Vercel serverless exist; use the **trimmed Chromium** package to fit the bundle and follow Vercel sizing advice. ([Vercel][4])
* If we hit cold‑start limits or timeouts at scale, deploy **Gotenberg** separately (Fly/Render/Koyeb) and call via internal API for dedicated PDF rendering. ([Gotenberg][9])

### 16.3 PDF Import

* Primary parser: **pdf‑parse/unpdf** on server; if page has **no text layer**, show “Use OCR” toggle; run **Tesseract.js** server‑side (Edge Function or background Node) with a **page limit (≤10 pages)**. ([npm][6])
* Feed the resulting text to **P‑Extract‑Resume** with structured output target. ([Google AI for Developers][7])

### 16.4 Images

* Upload avatar to Supabase Storage; generate transformed sizes via **Storage Image Transformations**; use signed URLs in the editor; revoke on sign‑out. ([Supabase][20])

---

## 17) UX Details

* **Two‑pane layout**: Left editor forms; right live preview (pages).
* **Top bar**: Template switcher, color/theme dropdown, font selector, spacing control, export button (PDF), undo/redo, score badge.
* **Section add/remove/reorder** via drag handle; real‑time preview updates.
* **Icon control**: toggle icons globally or per section.
* **Date format menu**: US (MMM YYYY), ISO (YYYY‑MM), EU (DD MMM YYYY).
* **Address helper**: country select → field order adapts; formatting applied on render. ([GitHub][13])
* **Validation**: show unobtrusive hints (“Add 1–3 quantified bullets”).
* **Keyboard**: `Cmd/Ctrl+Z/Y` for undo/redo; `Cmd/Ctrl+P` triggers export modal.
* **Mobile** (v1 limited): single‑column editor with preview switcher.

---

## 18) Edge Cases & Rules

* **Very long names/headlines**: scale down with clamp (min 12pt).
* **Empty photo slot in photo templates**: fallback to monogram; maintain layout.
* **No experience**: emphasize skills/projects/education automatically.
* **RTL content**: set `dir="rtl"` for paragraphs in Arabic/Hebrew; ensure bullet markers align.
* **Non‑Latin scripts**: use **Noto** fallbacks; ensure PDF font embedding.
* **Scanned PDFs**: Warn user about OCR quality; prompt manual review.
* **Multi‑page overflow**: show page counter + “Trim suggestions” (reduce spacing, hide icons).
* **ATS‑risk elements**: text boxes layered over images are disallowed in exports.
* **Phone formats**: always normalize with libphonenumber; show national + intl format. ([libphonenumbers.js.org][14])

---

## 19) Exports — Compliance & Quality

* **PDF**: must be **selectable text** (never flattened images). Use print CSS + Paged rules and embed fonts. Machine‑readable PDFs are widely supported by ATS when following simple, text‑based layout standards. ([resumeworded.com][21])

---

## 20) Configuration & Settings

* **Defaults**:

  * Template: “Modern Minimal” (sans, black text, subtle accent).
  * Fonts: Inter/Source Sans 3; size 10.5–11 pt; spacing 1.2.
  * Icons: off by default (ATS‑safe default); user can enable.
  * Page size auto (Letter for US locale; A4 otherwise).

* **Feature flags** (internal): OCR fallback; Photo in template; Score rubric enhancements.

---

## 21) Rollout Plan & Milestones

**M0 – Foundations (1–1.5 weeks)**

* Next.js app skeleton; Supabase auth/storage; Zustand store; Template token system.

**M1 – Manual Mode & Live Preview (2 weeks)**

* 3 résumé templates + basic customization; smooth preview; autosave; undo/redo.

**M2 – Export (1 week)**

* PDF serverless export (Chromium). Tests with long/short content.

**M3 – AI Modes (2 weeks)**

* PDF import → extract → schema; AI start → zero‑to‑draft; prompts & schema validation.

**M4 – Cover Letters (1 week)**

* 2 templates; basic formatting; exports.

**M5 – Scoring (1 week)**

* Deterministic checks + small LLM rubric; suggestions UI; reuse across flows.

**M6 – Hardening (ongoing)**

* Accessibility, i18n edge cases, RTL, font embedding, export reliability.

---

## 22) Acceptance Criteria (Representative)

* **AC‑Preview**: Typing in any field updates the preview **within p95 ≤120ms**.
* **AC‑Templates**: Switching templates never loses content; all sections render.
* **AC‑Export**: PDF downloads succeed ≥99.5% in test matrix (Windows/macOS browsers, Letter/A4). PDFs have selectable text.
* **AC‑Import**: Given a text‑layer PDF, ≥95% of sections/fields are correctly populated; OCR fallback flagged when needed.
* **AC‑Score**: Score appears in ≤1s after major edit; clicking a suggestion focuses the relevant control.
* **AC‑Security**: RLS policies block cross‑user access; media via signed URLs only. ([Supabase][18])

---

## 23) Tech Choices — Rationale & References

* **AI Orchestration**: **AI SDK** for TypeScript with **structured outputs** (`generateObject/streamObject`) → one schema across providers; **Gemini 2.0 Flash** for fast generation/extraction and multimodal understanding. ([AI SDK][1])
* **PDF Export**: **Headless Chromium** (Playwright/Puppeteer) in serverless; proven patterns and Vercel guide; **Paged/CSS print** semantics. Gotenberg as scalable fallback service if needed. ([Vercel][4])
* **Icons**: **Iconify** with **Tabler** and **Lucide** (all permissive licenses; huge coverage). ([Iconify][11])
* **Image Handling**: `react‑easy‑crop`, `browser‑image‑compression`, and **Supabase Storage with image transformations**. ([valentinh.github.io][15])
* **Internationalization**: `Intl.DateTimeFormat`; **address‑formatter/i18n‑postal‑address**; **libphonenumber‑js**. ([MDN Web Docs][12])

---

## 24) Risks & Mitigations

* **Serverless PDF fragility (bundle size/timeouts)** → Use trimmed Chromium; keep CSS lean; pre‑render HTML; if flaky at scale, **offload to Gotenberg** microservice. ([Vercel][4])
* **OCR accuracy** on scanned PDFs → restrict to ≤10 pages v1; warn user; force manual review. ([tesseract.projectnaptha.com][22])
* **AI hallucination** → strict schema, content validation; “no fabrication” rule; user review gates.
* **Font glyph coverage** for non‑Latin scripts → ship **Noto** fallbacks and embed fonts in PDF.
* **ATS variability** → provide PDF with simple, text‑based layout and standard fonts for maximum compatibility. ([resumeworded.com][21])

---

## 25) Open Questions (to be resolved in Iteration 2)

* Finalize the **exact** ATS‑safe font shortlist (open source + system).
* Decide “Photo by default?” per template (on for modern, off for classic?).
* Pricing/quotas for AI calls (free tier limits).
* Whether to add a **“Europass”**‑style template for EU users in v1.
* Decide if **address validation** is required (out of scope in v1; only formatting now).

---

## 26) Appendix — Example Structured Schemas (abbreviated)

**ResumeJson (Zod sketch)**

```ts
profile: {
  fullName: string.min(1),
  headline?: string,
  email: string.email(),
  phone?: string,
  location?: { city?: string; region?: string; country?: string; postal?: string },
  links?: { type?: string; label?: string; url: string.url() }[],
  photo?: { bucket: string; path: string }
},
summary?: string,
work?: {
  company: string; role: string; location?: string;
  startDate: string; endDate?: string | null;
  descriptionBullets?: string[]; achievements?: string[]; techStack?: string[];
}[],
education?: {...}[], projects?: {...}[], skills?: {category: string; items: string[]}[],
certifications?: {...}[], awards?: {...}[], languages?: {...}[], extras?: {...}[],
settings: { locale: string; dateFormat: "US"|"ISO"|"EU"; addressFormat?: string;
  fontFamily: string; fontSizeScale: number; lineSpacing: number; colorTheme: string;
  iconSet: "tabler"|"lucide"|"material"; showIcons: boolean; sectionOrder: string[]; pageSize: "A4"|"Letter" }
```

**CoverLetterJson** similar; `body` is array of text blocks with inline marks.

---

### What this PRD empowers the team to implement now

* A single, consistent **schema‑driven** system that feeds **editor → preview → export → score**.
* **Modular AI** prompts and schemas, easy to tweak without code churn.
* **Live preview** that feels native and instant, with robust **PDF export**.
* **Internationalization** that "just works" (dates, addresses, phones).
* A **reusable scoring** engine to deploy across résumé & cover letters.

---