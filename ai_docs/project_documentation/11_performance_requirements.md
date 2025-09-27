# 10) Performance Requirements

**Intent**: Define **budgets**, **measurement**, and **tactics** to keep the app fast without heavy tooling. We measure at key points and log minimal numbers server‑side. No analytics, no perf SDKs.

---

## 1. Performance Budgets (SLO‑style Targets)

| Area / Scenario                                   | Budget (Target)                       |
| ------------------------------------------------- | ------------------------------------- |
| **Editor keystroke → preview paint (p95)**        | ≤ **120 ms**                          |
| Template switch re‑render                         | ≤ **200 ms**                          |
| Open Documents list (warm)                        | ≤ **400 ms** TTFB; ≤ **800 ms** ready |
| **AI Draft** – time to first token                | ≤ **1.0 s**                           |
| **AI Draft** – full draft (typical résumé)        | ≤ **6.0 s**                           |
| Import: PDF parse (2 pages, text layer)           | ≤ **2.0 s**                           |
| Import: OCR (≤10 pages, medium DPI)               | ≤ **12.0 s** (with progress UI)       |
| Score – deterministic only                        | ≤ **200 ms**                          |
| Score – with LLM rubric                           | ≤ **1.2 s**                           |
| **PDF export** (1–2 pages)                        | ≤ **2.5 s**                           |
| DOCX export                                       | ≤ **1.5 s**                           |
| Mobile first contentful interaction (editor load) | ≤ **2.0 s**                           |
| Edge route TTFB (AI/score)                        | ≤ **200 ms** (excl. provider latency) |

**Concurrency expectations (v1)**
Typical indie SaaS loads: dozens of concurrent users. The above budgets assume **serverless cold starts** may occur; keep handlers lean, lazy‑load heavy modules.

---

## 2. Measurement Plan (No 3rd‑party SDKs)

### 2.1 Server Timing

* Each route writes a **single structured JSON** log upon completion including `latency_ms`.
* Add `"phase":"provider_call"` spans for AI routes (duration only, no prompts).

### 2.2 Client Timing (DEV / optional PROD sampling)

* Use `performance.now()` in editor paths to measure **keystroke→paint** and **template switch**.
* Gate emission behind `PERF_LOGGING=true` env; send to a lightweight internal `/api/v1/diag/perf` (owner‑only) **disabled by default**. Otherwise, log to console in DEV only.

### 2.3 Web Vitals (DEV only)

* In DEV, capture `LCP`, `FID`, `INP` and log to console. Do not persist.

---

## 3. Tactical Playbook (by Area)

### 3.1 Editor & Preview

* **Debounce** input → preview at 120–180 ms; batch DOM writes via `requestAnimationFrame`.
* **Component boundaries** so field edits only re‑render affected blocks.
* **Pagination**: simple CSS paged media + lightweight paginator; avoid measuring text every frame.
* **Virtualize** lists when > 50 items (rare).
* **Web Worker** for heavy transforms if they appear (e.g., long OCR post‑processing).

### 3.2 AI Draft & Scoring

* Prefer **Gemini 2.0 Flash** for speed; constrain outputs with Zod.
* **Prompt size discipline**: trim freeform input to ≤ N chars; elide duplicate sections; send JD and key facts, not raw PDFs.
* **Streaming**: default `?stream=true` for better TTFD UX.
* Cache ephemeral prompt fragments in memory (per request) only—no persistence.

### 3.3 Import (PDF/OCR)

* Try **text layer** first (fast).
* OCR only on explicit consent; process pages sequentially with progress.
* Scale big images down before OCR to a reasonable DPI; abort if over limits.

### 3.4 Export

* **Node runtime** only. Lazy‑import `puppeteer-core` & `@sparticuz/chromium` inside handler.
* Reuse Chromium executable across invocations if platform allows (serverless caches).
* Keep **print CSS minimal**; avoid heavy fonts.
* **PreferCSSPageSize** and `printBackground` set; no client‑side rasterization.
* For photo templates, cap image size and compress beforehand.

### 3.5 Frontend Delivery

* **Code‑split** heavy editors and exporters (dynamic `import()` on demand).
* Ship fonts efficiently (system stacks preferred; optional Inter/Source Sans).
* Lazy‑load rarely used panels (Score sidebar, Export dialog).
* Use `prefetch={false}` on heavy links; prefetch only small pages.

---

## 4. Budgets for Assets & Data

| Item                       | Budget / Limit                                   |
| -------------------------- | ------------------------------------------------ |
| Document JSON size         | ≤ **200 KB** typical                             |
| Image upload (avatar/sign) | ≤ **5 MB**; compress to ≤ **500 KB** for preview |
| SSE event chunk            | ≤ **32 KB**                                      |
| Export HTML + CSS          | ≤ **200 KB** after SSR (typical)                 |
| OCR page limit             | ≤ **10 pages**                                   |

---

## 5. Edge vs Node Runtime Guidance

* **Edge**: low‑latency AI streaming and scoring (no binary, no headless browser).
* **Node**: PDF/DOCX export, PDF parse/OCR, file uploads.
* **Rule**: Don’t import heavy Node‑only modules into Edge routes. Use route‑local imports.

---

## 6. Resource & Timeout Settings

* Set serverless function timeout (host default). Keep PDF export worker below **~3 s** typical; fail fast with clear error.
* Memory: prefer slim CSS and a single page render; close pages after use; don’t keep large buffers in memory.

---

## 7. Acceptance & Manual Perf Checks

* [ ] Typing a bullet updates preview within 120 ms (p95) on a mid‑range laptop and a recent mobile.
* [ ] Template switch under 200 ms with a typical 1–2 page résumé.
* [ ] AI draft starts streaming within ~1 s on a warm Edge route.
* [ ] PDF export completes within 2.5 s for a 1–2 page résumé.
* [ ] OCR progress is visible; a 5‑page scan finishes within ~6–8 s.
* [ ] Score (deterministic) updates feel instant; LLM rubric returns within ~1.2 s.

---

## 8. Perf Regression Guardrails (Lightweight)

* Keep a **Perf Budget Map** (`/docs/perf-budgets.md`) mirroring this table.
* When a change risks budgets (e.g., new heavy dependency), annotate PR with: *impact, mitigation, measurement result*.
* Avoid introducing blocking synchronous code in input handlers; prefer async/lazy.

---

## 9. Developer Knobs (env)

```
LOG_LEVEL=info|warn|error
LOG_SAMPLE_INFO=0.05
LOG_SAMPLE_WARN=0.2
PERF_LOGGING=false      # set true only for internal sessions
AI_MODEL=gemini-2.0-flash
```

---

## 10. What Not to Do

* No client‑side PDF generation.
* No global analytics beacons.
* No unconditional prefetch of heavy routes.
* No synchronous JSON stringify of large documents on every keystroke (use patch diffs or debounced snapshots).

---

### Summary

* **Errors**: small, consistent, user‑safe; structured JSON logs with codes & timings—no PII.
* **Performance**: concrete budgets + pragmatic instrumentation; fast by design (Edge for AI, Node for export), with simple, effective tactics to hit targets without over‑engineering.

If you’re happy, I’ll proceed with any final wrap‑ups or additional documents you want next (e.g., small “How‑to for Agents” quickstart or a consolidated **Checklist**).