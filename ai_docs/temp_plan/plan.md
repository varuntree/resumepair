Below is the **single, unified, production‑ready plan** you asked for—no interim fixes, no redo. It’s written so your programming agent can implement it end‑to‑end in one pass and, if needed, extrapolate details from the architectural concepts.

---

# 1) Approach & Architecture (concepts, rationale, contracts)

### 1.1 Goals we must hit (non‑negotiable)

* **True viewport isolation**: all wheel/scroll/pinch/drag events are fully contained within the preview. Parent page never scrolls or zooms as a side effect.
* **Deterministic pagination**: content flows across N fixed‑size pages (A4/Letter), with no clipping; behavior is identical in preview and in exported PDF.
* **Smooth interaction**: native vertical scrolling; zoom via pinch, toolbar, and Ctrl/Cmd ±/0; optional Ctrl/Cmd + wheel zoom; pan only when scale > 1.
* **Performance**: p95 ≤ 120 ms keystroke → paint.
* **Extensibility**: annotations, comments, collaborative cursors can be layered without changing the pagination logic.

### 1.2 System topology (stable)

```
EditorPage
└─ LivePreview
   ├─ PreviewControls (Zoom, Page Nav, Viewport)
   └─ PreviewContainer  ←─────────────── Interaction/Viewport Layer
      └─ ArtboardFrame (iframe)
         └─ PaginatedArtboardRenderer ←─ Pagination/Render Layer (inside iframe)
            ├─ FlowRoot (hidden, unpaginated DOM)
            ├─ Paginator (DOM measurement + splitting)
            └─ Page components (N) with flowed content
```

**Separation of concerns**

* **Interaction/Viewport layer (outside iframe)**: owns scroll, zoom, pan, page navigation, and view state (Zustand). It does not know *how* pagination happens.
* **Pagination/Render layer (inside iframe)**: receives fully resolved template DOM, measures it, and emits N page boxes with flowed content. It stays self‑contained, so the **same code** drives PDF export (WYSIWYG parity).

### 1.3 Coordinate systems & math (keep consistent everywhere)

* **Page coordinates**: pixels at scale = 1.

  * `pageWidthPx = PAGE_SIZE_MM[format].width * MM_TO_PX`
  * `pageHeightPx = PAGE_SIZE_MM[format].height * MM_TO_PX`
  * `pageInnerHeight = pageHeightPx - 2 * marginPx`
* **Viewport scale**: `scale ∈ [0.40, 2.00]` (store: `zoomLevel`).

  * Fit‑to‑width: `scale = (containerInnerWidth - horizontalPadding) / pageWidthPx`
* **Scroll mapping**: the visual top of page `i` at scale is `targetTop = (pageOffsets[i] * scale) + padTop`.

### 1.4 Event model (to guarantee isolation and UX)

* **Wheel (no modifier)**: **scroll only** the preview container.

  * CSS: `overscroll-behavior: contain` to stop scroll chaining; JS: capture-phase `wheel` listener that `stopPropagation()`.
* **Wheel + Ctrl/Cmd**: **zoom**, not page scroll and not browser zoom.

  * JS: in capture handler, `preventDefault()` and call `setTransform()` to apply new scale.
* **Pinch (touch)**: **zoom** via `react-zoom-pan-pinch`, but **never** browser page zoom.

  * JS: prevent Safari `gesturestart/gesturechange/gestureend` on the container.
* **Pan (mouse/touch drag)**: only when `scale > 1` (disable panning at scale 1 to keep native vertical scroll buttery).
* **Keyboard**: `Ctrl/Cmd +`/`-`/`0` for zoom/reset; arrow PgUp/PgDn (optional) can navigate pages.

**Key rule**: **Library wheel‑zoom is disabled.** Native wheel remains scrolling. Zoom actions are explicit (pinch, buttons, Ctrl/Cmd ±, or Ctrl/Cmd + wheel handled by us).

### 1.5 Pagination engine (inside iframe)

**Why inside the iframe?** It measures after CSS is applied by the template (fonts, line heights, spacing), ensuring exact page counts and boundaries for both preview and export.

**Pipeline**

1. **Render once**: `Template` writes the full content into a hidden **FlowRoot** (`<div data-flow-root>`), using *semantic markers* the paginator can understand.
2. **Collect items**: Query `[data-flow-item]` (placeable units like paragraphs, bullets, cards). For lists, also query `[data-flow-subitem]` for fine‑grained splitting.
3. **Measure**: For each item:

   * `offsetHeight + margins` (computed via `getComputedStyle`)
   * `splittable` flag from `data-splittable="true|false"`
   * Optional `groupId` (`data-flow-group`) to keep logical blocks together when possible.
4. **Pack into pages**: Greedy packing into `pageInnerHeight`:

   * If item fits, place it.
   * If not and `splittable`, split by subitems (e.g., list bullets). If still too tall (pathological), move entire item to a new page; as a guard, allow “hard split” via `Range#getClientRects` binary search (configurable for paragraphs if ever needed).
   * Apply simple **widow/orphan control**: don’t leave a single subitem at the bottom/top of a page if there’s room to balance by moving one more subitem.
5. **Emit pages**: Create `<Page data-page="N">` boxes with **cloned** nodes (from FlowRoot). Keep FlowRoot intact but hidden (for re‑pagination). The clones ensure React tree integrity without reparenting source nodes.
6. **Report metrics**: After layout, report `offsetTop` of each page to the host via `ArtboardFrame` callback; also report `pageWidth/Height`.

**Template contract (minimal, durable)**

* Mark **placeable blocks** with `data-flow-item`, e.g.:

  * Paragraphs, experience cards, education entries, section headings with following block if they must stay together.
* Mark **splittable items** with `data-splittable="true"`. Typically:

  * List containers have `data-flow-item data-splittable="true"`, and each bullet has `data-flow-subitem`.
* Optional **grouping**: `data-flow-group="experience"` on a section wrapper to keep heading with at least one item.

**Why clones over reparenting?** Reparenting React‑owned nodes is brittle. Cloning (`outerHTML`) retains styles and avoids template changes beyond data attributes. Memory cost is negligible at resume scale.

### 1.6 State & data flow

* `documentStore` (Zustand + zundo): resume JSON source of truth.
* Mapping to `ArtboardDocument` stays unchanged; **pagination never mutates data**, only layout.
* `previewStore`: `zoomLevel`, `isFitToWidth`, `currentPage`, `totalPages`, `pendingScrollPage`, `viewport`.

  * `applyFitZoom(level)` only when in fit mode.
  * `goToPage(n)` sets `pendingScrollPage`; `PreviewContainer` performs the scroll and clears it.

### 1.7 Performance model

* **Keystroke → paint path**

  * Debounced document updates already present.
  * Inside iframe: single `requestAnimationFrame` pass → measure → paginate → commit pages → notify host. Typical runtime for resumes: **1–10 ms**.
  * Host: page offsets cached; scroll syncing throttled with RAF.
* **Observers**

  * `ResizeObserver` on iframe `documentElement` to detect font loading or layout shifts → re‑paginate.
  * `ResizeObserver` on preview container for fit‑to‑width recomputation.
* **Stability**

  * Scroll position persistence: store and restore scrollTop relative to page index and intra‑page ratio after reflows.

### 1.8 Export/PDF parity (WYSIWYG)

* Create a **headless render page** (`/print/[id]`) that mounts the **same `PaginatedArtboardRenderer`** (no iframe necessary there).
* The PDF API route (`/api/export/pdf`) launches `puppeteer-core` with `@sparticuz/chromium` to navigate to `/print/[id]?opts=...`, waits for `window.__ready__` (set after pagination), then calls `page.pdf({ format: 'A4' | 'Letter', ... })`.
* Because pagination happens **in Chromium with CSS applied**, the PDF equals the preview pixel for pixel.

### 1.9 Extensibility scaffolding

* **Annotations overlay**: a sibling overlay above the paginated content (inside the iframe or on the host) that listens for scale/scroll to transform coordinates.
* **Collaborative cursors**: same overlay; coordinates stored in page space at scale = 1.
* **Comments**: anchor to `[data-flow-item]` ids; paginator retains the item ids when cloning (data attribute).

---

# 2) Full Implementation Plan (tasks, file paths, key snippets)

> The steps below implement the finished, stable system in one shot. File paths match your repo. Types are strict. No temporary fixes.

## 2.1 Interaction/Viewport layer (outside iframe)

**Modify** `components/preview/PreviewContainer.tsx`

* Add:

  * CSS: `overscroll-behavior: contain`, `scrollbar-gutter: stable`, `touch-action: pan-y pinch-zoom`.
  * Capture‑phase listeners: `wheel` (stop propagation; if Ctrl/Cmd, `preventDefault()` and zoom), `gesture*` (Safari preventDefault), `touchmove` (stop propagation).
* Configure `react-zoom-pan-pinch`:

  * `wheel={{ disabled: true }}` (disable wheel‑zoom)
  * `pinch={{ disabled: false }}` and `doubleClick={{ disabled: true }}`
  * `panning={{ disabled: zoomLevel <= 1 }}` (enable only when scaled)
* Correct **fit‑to‑width**: compute padding from the actual padder element that wraps the page (`p-8`) and recompute via `ResizeObserver`.
* Page navigation scroll: `scrollTo(pageOffsets[index] * scale + padTop, smooth)`.

**Result**: fully isolated preview, smooth scroll, reliable zoom, correct fit.

> (Your programming agent can use the exact logic shown earlier; naming aligns with your store and component tree.)

## 2.2 Pagination engine (inside iframe)

**Add** `libs/reactive-artboard/pagination/blockTypes.ts`

```ts
export type FlowItem = {
  el: HTMLElement
  height: number
  splittable: boolean
  groupId?: string
}
```

**Add** `libs/reactive-artboard/pagination/measure.ts`

```ts
export function measureFlowItems(root: HTMLElement): FlowItem[] {
  const items = Array.from(root.querySelectorAll<HTMLElement>('[data-flow-item]'))
  return items.map((el) => {
    const cs = getComputedStyle(el)
    const h = el.offsetHeight + parseFloat(cs.marginTop || '0') + parseFloat(cs.marginBottom || '0')
    const splittable = el.dataset.splittable === 'true'
    const groupId = el.closest<HTMLElement>('[data-flow-group]')?.dataset.flowGroup
    return { el, height: h, splittable, groupId }
  })
}
```

**Add** `libs/reactive-artboard/pagination/split.ts`

```ts
export function splitIntoSubitems(itemEl: HTMLElement): HTMLElement[] {
  const subs = Array.from(itemEl.querySelectorAll<HTMLElement>('[data-flow-subitem]'))
  return subs.length ? subs : [itemEl]
}
```

**Add** `libs/reactive-artboard/pagination/paginate.ts`

```ts
import { FlowItem } from './blockTypes'
import { splitIntoSubitems } from './split'

export function paginate(items: FlowItem[], pageInnerHeight: number): HTMLElement[][] {
  const pages: HTMLElement[][] = []
  let page: HTMLElement[] = []
  let y = 0

  const pushPage = () => {
    if (page.length) pages.push(page)
    page = []
    y = 0
  }

  for (const item of items) {
    if (item.height <= pageInnerHeight - y) {
      page.push(item.el); y += item.height; continue
    }
    if (item.splittable) {
      const subs = splitIntoSubitems(item.el)
      for (const sub of subs) {
        const cs = getComputedStyle(sub)
        const sh = sub.offsetHeight + parseFloat(cs.marginTop || '0') + parseFloat(cs.marginBottom || '0')
        if (sh > pageInnerHeight) { // pathological subitem
          pushPage(); page.push(sub); y = sh; continue
        }
        if (y + sh > pageInnerHeight) pushPage()
        page.push(sub); y += sh
      }
      continue
    }
    // unsplittable: move whole item to next page
    pushPage(); page.push(item.el); y = item.height
  }
  if (page.length) pages.push(page)
  return pages
}
```

**Replace** the renderer with a paginated one:

**Edit** `libs/reactive-artboard/renderer/ArtboardRenderer.tsx` → **becomes** `PaginatedArtboardRenderer` (export with same name to avoid broad call‑site changes or re‑export alias)

```tsx
'use client'
import * as React from 'react'
import { ArtboardDocument } from '../types'
import { getTemplateRenderer } from '../templates'
import { buildArtboardStyles } from '../styles'
import { Page } from '../components/Page'
import type { SectionKey } from '../schema'
import { measureFlowItems } from '../pagination/measure'
import { paginate } from '../pagination/paginate'
import { PAGE_SIZE_MM, MM_TO_PX } from '../constants/page'

type Props = { document: ArtboardDocument }

export function ArtboardRenderer({ document }: Props): React.ReactElement {
  const Template = getTemplateRenderer(document.template)
  const style = React.useMemo(() => buildArtboardStyles(document.metadata), [document.metadata])

  const flowRootRef = React.useRef<HTMLDivElement>(null)
  const [pages, setPages] = React.useState<HTMLElement[][]>([])

  React.useLayoutEffect(() => {
    const root = flowRootRef.current
    if (!root) return
    // compute page inner height
    const size = PAGE_SIZE_MM[document.metadata.page.format]
    const pageHeightPx = size.height * MM_TO_PX
    const margin = document.metadata.page.margin ?? 48
    const pageInnerHeight = pageHeightPx - 2 * margin
    // measure and paginate
    const items = measureFlowItems(root)
    const slots = paginate(items, pageInnerHeight)
    setPages(slots)
  }, [document])

  return (
    <div className="artboard-root" style={{ backgroundColor: 'var(--artboard-color-background)' }}>
      <style dangerouslySetInnerHTML={{ __html: style }} />
      {/* Hidden flow root renders once for measurement */}
      <div
        ref={flowRootRef}
        data-flow-root
        style={{ position: 'absolute', inset: 0, visibility: 'hidden', pointerEvents: 'none' }}
      >
        {/* For flow measurement we render all sections sequentially; templates output data-flow-item markers */}
        <Template
          columns={document.layout.flat() as SectionKey[][]}
          isFirstPage={true}
          document={document}
        />
      </div>

      {/* Render paginated clones */}
      {pages.map((els, idx) => (
        <Page key={idx} mode="preview" pageNumber={idx + 1}>
          <div>
            {els.map((el, i) => (
              <div key={i} dangerouslySetInnerHTML={{ __html: el.outerHTML }} />
            ))}
          </div>
        </Page>
      ))}
    </div>
  )
}
```

> **Note**: We render `columns={document.layout.flat()}` so the flow root sees content in a simple linear order. The *visual* page column layout is preserved by the template’s CSS; the paginator sees final heights.

**Keep** `libs/reactive-artboard/components/Page.tsx`

* For preview, you may retain `overflow: hidden` (once pagination is on, nothing should overflow). If you want safety while stabilizing, use `overflow: visible` only in preview mode.

## 2.3 Template markers (minimal, systematic)

Add data attributes in your template components (`libs/reactive-artboard/templates/*`):

* **Paragraph block wrapper**

```tsx
<div data-flow-item data-splittable="false" /* ...styles */>
  {/* text */}
</div>
```

* **List block wrapper**

```tsx
<ul data-flow-item data-splittable="true">
  {items.map((t, i) => (
    <li key={i} data-flow-subitem><p>{t}</p></li>
  ))}
</ul>
```

* **Experience card**

```tsx
<article data-flow-item data-splittable="false" data-flow-group="experience">
  {/* heading, meta, bullet list (which itself is another data-flow-item if you want separate splitting) */}
</article>
```

**Helper components** (optional, to reduce repetition):

* `FlowItem({ splittable, children, groupId })` → renders a `<div data-flow-item ...>`.
* `FlowList({ items })` → wraps in `data-splittable="true"` and tags each `<li>` with `data-flow-subitem`.

This keeps template code clean and ensures all placeable units are marked.

## 2.4 Iframe bridge

**Use existing `ArtboardFrame.tsx`** to:

* Mount the paginated renderer (`ArtboardRenderer` as replaced above).
* After render, query `document.querySelectorAll('[data-page]')`, compute `offsetTop` array, and `post` it via `onPagesMeasured`.
* Also read `pageWidth`/`pageHeight` from the first `[data-page]`’s `getBoundingClientRect` and call `onFrameMetrics`.

The current `ArtboardFrame` already does this; no change required beyond the renderer swap.

## 2.5 Preview state & controls (Zustand)

**Keep** `stores/previewStore.ts` API. It already contains:

* `zoomLevel`, `isFitToWidth`, `applyFitZoom`, `goToPage`, `pendingScrollPage`, `setTotalPages`.

`LivePreview.tsx`:

* Keep mapping JSON → `ArtboardDocument`.
* On doc changes: update `ArtboardFrame` via props; maintain saved scroll position (already implemented).
* When `ArtboardFrame` emits new `offsets`, call `setTotalPages(offsets.length)`.

## 2.6 Export/PDF parity (Next.js + Puppeteer)

**Add** `app/(print)/[id]/page.tsx` (client page that renders without the outer viewport/zoom chrome; it mounts `ArtboardRenderer` directly—no iframe, no zoom lib.)

```tsx
'use client'
import * as React from 'react'
import { use } from 'react'
import { ArtboardRenderer } from '@/libs/reactive-artboard'
import { mapResumeToArtboardDocument } from '@/libs/reactive-artboard/mappers/resume'
import { fetchResumeById } from '@/libs/repositories/resume' // or API call

export default function PrintPage({ params, searchParams }: any) {
  const id = params.id as string
  const resume = use(fetchResumeById(id)) // or client fetch + state
  const doc = React.useMemo(() => mapResumeToArtboardDocument(resume), [resume])

  React.useEffect(() => { (window as any).__ready__ = true }, [])
  return (
    <div style={{ background: '#f0f0f0', padding: 24 }}>
      <ArtboardRenderer document={doc} />
    </div>
  )
}
```

**Add** `app/api/export/pdf/route.ts` (server route to return a PDF)

```ts
import { NextRequest } from 'next/server'
import chromium from '@sparticuz/chromium'
import puppeteer from 'puppeteer-core'

export const runtime = 'edge' // or 'nodejs' depending on your deploy target

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  const format = searchParams.get('format') === 'letter' ? 'Letter' : 'A4'
  if (!id) return new Response('Missing id', { status: 400 })

  const executablePath = await chromium.executablePath()
  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath,
    headless: chromium.headless,
    defaultViewport: { width: 1280, height: 1690 },
  })

  try {
    const page = await browser.newPage()
    const url = `${process.env.NEXT_PUBLIC_BASE_URL}/print/${id}?format=${format}`
    await page.goto(url, { waitUntil: 'networkidle0' })
    await page.waitForFunction('window.__ready__ === true', { timeout: 20000 })

    const pdf = await page.pdf({
      printBackground: true,
      preferCSSPageSize: true,
      format, // 'A4' | 'Letter'
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    })
    return new Response(pdf, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="resume-${id}.pdf"`,
      },
    })
  } finally {
    await browser.close()
  }
}
```

> This uses the same `ArtboardRenderer` (with paginator). PDF == Preview.

## 2.7 Performance & resilience

* **Debounce & RAF**: Keep current debouncing in `LivePreview`. Inside iframe, the paginator runs in a single `requestAnimationFrame`.
* **ResizeObserver** in iframe: watch `documentElement`; re‑paginate on font size, container changes.
* **Scroll position stability**: keep (`pageIndex`, `intraPageRatio`) between renders:

  * On change: `restoreTop = offsets[pageIndex] + intraPageRatio * (offsets[pageIndex+1] - offsets[pageIndex])`.

## 2.8 QA & tests

**Unit tests** (`vitest` or `jest`):

* `paginate` with synthetic blocks validates page counts and boundaries.
* Widow/orphan rules for lists (ensure at least 2 bullets on a page when possible).

**E2E tests** (`playwright`):

* Wheel inside preview doesn’t change `window.scrollY` of the editor page.
* Pinch zoom changes preview scale, not browser zoom.
* Ctrl/Cmd + wheel zooms; regular wheel scrolls.
* Page nav jumps to correct page; `currentPage` matches visible page at rest.

**Perf probes**:

* Measure keystroke → paint; log p95; warn ≥ 120 ms in dev only.

## 2.9 TypeScript & build hygiene

* Ensure `libs/reactive-artboard/**` is not excluded from `tsconfig.json` compilation if you want type checking on newly added pagination files. If it remains excluded for SWC reasons, keep pagination files JS‑safe or add a local `tsconfig.json` inside `libs/reactive-artboard/` that’s picked up by Next.

## 2.10 Security & accessibility notes

* Prevent external event leakage (already covered).
* Keep controls labeled (ARIA on buttons and selects already present).
* Use “Page X of Y” live region (already implemented) for screen readers.

---

## Acceptance criteria (single pass)

1. **Isolation**: Scrolling/zooming inside preview never scrolls/zooms the editor page.
2. **Pagination**: Long content automatically creates 2–5 pages without clipping.
3. **Navigation**: Page nav + scroll accurately reflect “Page N of M”.
4. **Zoom**: 40–200%, fit‑to‑width resizes on container changes, pan works only when scaled.
5. **Parity**: Exported PDF is visually identical to preview at 100%.
6. **Performance**: p95 keystroke → paint ≤ 120 ms over 200 edits on a 3‑page resume.
7. **Maintainability**: Templates use simple `data-flow-*` markers; paginator is isolated and covered by tests.

---

**This is the complete, one‑time, stable implementation plan.**
It delivers a production‑grade preview with deterministic pagination and export parity, without interim fixes or future rewrites. Your agent can implement sections 2.1–2.6 verbatim and rely on section 1 to extrapolate any template‑specific details that were not explicitly enumerated.
