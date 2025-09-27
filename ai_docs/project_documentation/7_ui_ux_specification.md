# 6) User Interface / UX Specification

**Principles**: *Jobs‑level simplicity*, **mobile‑first**, **design tokens everywhere**, minimal cognitive load, strong defaults, and zero dead‑ends. This spec dictates the **information architecture, layouts, components, interactions, and tokens usage**. All UI must use **centralized design tokens**. **No hard‑coded values.**

---

## 1. Information Architecture (IA)

### 1.1 Global Navigation (desktop)

* **Top App Bar** (always visible):

  * Left: App logo (home), **Breadcrumbs**
  * Right: Theme toggle (app‑wide light/dark), account menu (avatar), help link.
* **Left Sidebar** (collapsible): grouped sections with sub‑navigation

  * **Create Document**

    * Résumé
    * Cover Letter
    * Import from PDF
    * AI Draft
  * **Documents**

    * All Documents
    * Résumés
    * Cover Letters
    * (Trash) *(optional v1)*
  * **Templates**

    * Résumé Templates
    * Cover Letter Templates
  * **Account**

    * Profile & Defaults
* **Right Panel (contextual)**: **Score** sidebar (collapsible). On small screens, this becomes a bottom sheet.

### 1.2 Mobile Navigation

* **Top App Bar** with: hamburger (opens sidebar as drawer), page title (crumbs collapse to single title with back chevron), search icon (optional).
* **Bottom Navigation** (persistent):

  * **Home**, **Create**, **Documents**, **Templates**, **Account**
  * Labels + Lucide icons; active state uses document tokens only inside editors; otherwise app tokens.
* **Sub‑navigation** opens as a **drawer or bottom sheet**, max two levels deep.

### 1.3 Breadcrumbs

* Desktop: `Home / {Section} / {Page}`; clicking each crumb navigates.
* Mobile: show last crumb only + back chevron; tap reveals full path in a small sheet.

---

## 2. Design Tokens (Centralized)

> **Rule**: Every visual property derives from tokens. No inline styles with numeric literals.
> **Location**: `app/globals.css` for **app tokens** (prefix `--app-*`) and shared scales.
> **Document‑scoped tokens**: applied inside a wrapper (preview and export) with prefix `--doc-*`. Templates must read from **doc tokens**, never app tokens, for color/typography/spacing/iconography.

### 2.1 App Tokens (examples)

* Colors: `--app-background`, `--app-foreground`, `--app-primary`, `--app-muted`, `--app-border`
* Typography: `--app-font-sans`, `--app-font-serif`, `--app-font-size-sm/base/lg`, `--app-line-height-base`
* Spacing: `--space-1/2/3/4/...` (4px scale)
* Radius: `--radius-sm/md/lg`
* Shadows: `--shadow-1/...`

### 2.2 Document Tokens (scoped)

Wrap preview/export root with `.doc-theme`:

* Colors: `--doc-primary`, `--doc-surface`, `--doc-foreground`, `--doc-muted`, `--doc-accent`, `--doc-border`
* Typography: `--doc-font-family`, `--doc-font-size-scale`, `--doc-line-spacing`
* Iconography: `--doc-icon-size`, `--doc-icon-color`
* Layout: `--doc-gutter`, `--doc-section-gap`

**Scoping**

```html
<div class="doc-theme"> <!-- editor preview root + export root -->
  <!-- all template components inside read --doc-* tokens -->
</div>
```

**Tailwind usage** (conceptual)

* Use classes that reference HSL vars: `bg-[hsl(var(--doc-surface))]`, `text-[hsl(var(--doc-foreground))]`, `border-[hsl(var(--doc-border))]`.
* Font: bind via a class (e.g., `font-[var(--doc-font-family)]`) or utility CSS class that maps token to a font stack.

> **Never** reference `--app-*` tokens inside templates. All template styles must depend on `--doc-*`.

---

## 3. Layout & Breakpoints (Mobile‑First)

* Breakpoints:

  * **xs**: ≤ 375px
  * **sm**: 376–640px
  * **md**: 641–1024px
  * **lg**: 1025–1440px
  * **xl**: > 1440px
* Grid: single column on xs/sm; two‑pane at **md+** (editor left 38–45%, preview right 55–62%).
* Spacing: all margins/padding use spacing tokens `--space-*`.
* Scroll behavior: editor panel scrolls independently; preview panel paginates (virtual pages).

---

## 4. Screens & Components

### 4.1 Dashboard / Documents List

* **Header**: Breadcrumbs (`Home / Documents`), search input, “Create” button (menu opens: Résumé / Cover Letter / Import / AI Draft).
* **Cards/Table**: Each document shows title, type, updated time, quick actions (Open, Duplicate, Delete).
* **Empty state**: “Create your first document” with a primary CTA.

**Mobile**

* Cards in a single column; “Create” in bottom nav (center).

**Tokens**

* Background: `--app-background`; Cards: `--app-card`; Text: `--app-foreground`.

---

### 4.2 Create Document (Manual / Import / AI Draft)

* **Create (Manual)**: choose Résumé or Cover Letter → Editor opens with starter schema.
* **Import**: upload field with file validation, OCR toggle (if no text layer). Progress bar during parse.
* **AI Draft**: large textarea (or markdown‑like input), optional JD field, **Stream** toggle. Live result shows on the right (md+) / below (sm).

**Acceptance**

* On mobile, after upload starts, show sticky progress and allow cancel.

---

### 4.3 Editor (Core Screen)

**Desktop (md+)**

* **Left**: Section navigator (accordion) + form fields.
* **Right**: **Live paginated preview** inside `.doc-theme`.
* **Top Bar** (sticky):

  * Breadcrumbs (`Home / Documents / {Title}`),
  * Template switcher,
  * **Document theme** button (opens panel for color/typography/spacing/icons),
  * Export menu (PDF/DOCX),
  * Undo/Redo,
  * Score badge (click → open score panel).
* **Right Sidebar** (toggle): Score panel with sub‑scores and suggestions.

**Mobile (xs/sm)**

* **Top App Bar**: Back chevron + document title + actions menu (template, export, score).
* **Bottom Navigation**: tabs for **Edit**, **Preview**, **Score**, **Template**.
* Section list opens as a **drawer**; fields are forms with large touch targets.

**Section Forms**

* Each section has add/remove item controls, reorder drag handles (desktop) or reorder mode (mobile).
* Rich text for cover letter body with bold/italic/underline, bullets.

**Document Theme Panel**

* **Colors**: choose from curated swatches + custom HSL; applies to `--doc-primary`, `--doc-accent`, etc.
* **Typography**: font family (from ATS‑safe list), size scale slider, line spacing slider.
* **Icons**: toggle on/off; size slider; **Lucide** icon set fixed.
* **Layout**: section spacing presets (compact/normal/cozy).

**Tokens**

* All controls update `--doc-*` variables on `.doc-theme` root immediately (optimistic).

---

### 4.4 Template Gallery

* Grid of cards with preview thumbnails, labels for features (photo, two‑column).
* Selecting a template applies immediately; card shows **Active** badge.
* Filter chips: Minimal, Modern, Classic, Photo‑friendly.

**Mobile**

* 2‑column grid; filter chips scroll horizontally.

---

### 4.5 Score Panel

* Header: Overall score pill (0–100).
* Five sections with sub‑scores and suggestions; each suggestion has:

  * Message, severity (info/warn/error), **Fix** button (if safe), **Go to section** link.
* Quick fixes: change date format, increase font size, remove widows/orphans (where mechanical).

**Mobile**

* Appears as a bottom sheet with tabs for each category.

---

### 4.6 Export Dialog

* Options: Template (current/default), page size (Letter/A4 auto by locale), margins (Normal/Compact), icons (on/off).
* Buttons: **Export PDF**, **Export DOCX**; show spinners and disable while processing.
* “Preflight” warnings (e.g., font too small) inline before export buttons.

--- 

### 4.7 Import Review & Fix

* **Left**: Extracted structured fields with confidence badges per section.
* **Right**: Preview; changes in left update right instantly.
* **CTA**: Accept & Create.

**Mobile**

* Stacked panels with a sticky toggle to switch “Fields / Preview”.

---

### 4.8 Profile & Defaults

* Fields: locale selector, default page size, default date format; avatar upload with cropper.
* Save gives a toast and updates new document defaults.

---

## 5. Components (shadcn/ui + Tailwind)

* **Buttons**: primary/secondary/ghost; map to tokens (`bg-[hsl(var(--app-primary))]` etc.).
* **Inputs/Textareas**: `--app-input`, `--app-foreground`.
* **Accordion**: used for section editor groups.
* **Tabs**: used in mobile bottom sheets and export dialog.
* **Dialog/Drawer/Sheet**: used for template switching (mobile), section reordering, document theme panel.
* **Breadcrumbs**: `<nav aria-label="Breadcrumb">` with list items and separators.
* **Toast**: ephemeral success/error notices.
* **Color Picker**: HSL sliders or palette chips; writes to `--doc-*` tokens.
* **Icon**: **Lucide React** only; always with accessible label or visible text.

> **Do not** import any other UI framework or custom styles that bypass tokens. No hard‑coded hex/rgb values.

---

## 6. States & Feedback

* **Loading**: skeletons for lists and preview (neutral blocks).
* **Empty**: helpful call‑to‑actions and brief copy.
* **Error**: short messages with action (Retry / Contact support).
* **Success**: toasts with subtle checkmark icon.
* **Unsaved Changes**: before route change, show confirm dialog if dirty.

---

## 7. Accessibility (A11y)

* Color contrast **AA** minimum; document theme pallets must auto‑validate contrast and warn if too low.
* Keyboard: Tab order follows visual order; Esc closes sheets/dialogs; Enter on primary actions.
* Screen readers: labels for all controls; templates have descriptive labels (“Modern Minimal—two column; photo supported”).
* Breadcrumbs and navigation landmarks with ARIA roles.

---

## 8. Microcopy & Tone

* Short, instructive, friendly. Examples:

  * Import low confidence: “Some parts look unclear. Please review the highlighted fields.”
  * Export timeout: “That took too long. Try DOCX or try again.”
  * AI guardrails: “We won’t invent experience. Edit any phrasing you’d like.”

---

## 9. Mobile‑First Rules (Enforce)

* Tap targets ≥ 44×44 points.
* Bottom navigation is always visible; editor actions accessible via top app bar menu.
* Sub‑navigation never exceeds two levels; deeper options presented inline within the current view.

---

## 10. Iconography (Lucide)

* Mapping (defaults):

  * Documents: `FileText`, Resume: `IdCard` (or `FileUser`), Cover Letter: `FileSignature`, Import: `FileInput`, AI Draft: `Sparkles`, Templates: `LayoutTemplate`, Score: `Gauge`, Export: `Download`, Settings: `Settings`, Edit: `Edit3`.
* Icons are decorative unless they convey status; always pair with visible text for navigation.

---

## 11. Quality Gates & Acceptance (UI/UX)

* **Tokens**: Inspect any visual diff; if a hex/px value is found in code, it fails review.
* **Mobile parity**: All flows executable on a 375px device without horizontal scroll.
* **Template switch**: < 200ms render on typical doc; no content loss.
* **Theme overrides**: Only affect `.doc-theme` scope; app shell remains unchanged.
* **Breadcrumbs**: Always present on working screens; mobile shows condensed variant.

---

## 12. Edge Cases (UI)

* Very long document titles → truncate with tooltip; crumbs gracefully collapse.
* Overflow content in two‑column templates → intelligent page breaks; widows/orphans avoided.
* RTL languages → mirror layout in preview/export; controls remain LTR.

---

### Developer Notes (Enforcement)

* Centralize token read/write helpers (`libs/preview/tokens.ts`).
* Document theme state is part of the document’s `settings` and applied by a component wrapper that sets `--doc-*` CSS variables.
* All template components consume only `--doc-*` and spacing/typography scales; no component may reference raw values or `--app-*` directly.

---