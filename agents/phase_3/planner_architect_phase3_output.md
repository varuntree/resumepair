# Phase 3 Implementation Plan: Template System & Live Preview

**Phase**: 3 of 8
**Planner**: PLANNER-ARCHITECT Agent
**Date**: 2025-10-01
**Total Effort**: 75-100 hours (across 4 sub-phases)
**Status**: Ready for Implementation

---

## 1. Executive Summary (500 words)

### Mission

Phase 3 transforms ResumePair from a form-based editor into a professional document builder with live visual feedback. Users will see exactly what their resume looks like while editing, switch between 6 professional templates instantly, and customize every visual aspect with precision controls.

### Sub-Phase Structure

This phase is broken into **4 sequential sub-phases** (3A, 3B, 3C, 3D), each independently testable and deployable:

**Phase 3A: Template Foundation (25-35 hours)**
- Build template infrastructure (registry, base components, design tokens)
- Create first 3 templates: Minimal, Modern, Classic
- Establish --doc-* token system
- Migration: Add template_id and customizations to resumes table

**Phase 3B: Live Preview System (15-20 hours)**
- Real-time preview with <120ms updates
- RAF-batched rendering pipeline
- Scroll position management
- Error boundaries

**Phase 3C: Customization System (20-25 hours)**
- 3 more templates: Creative, Technical, Executive
- Full customization panel (colors, fonts, spacing, icons)
- Template gallery with thumbnails
- Customization persistence

**Phase 3D: Controls & Polish (15-20 hours)**
- Preview controls (zoom, page nav, viewport selector)
- Split-pane layout (resizable divider)
- 3 playbook tests + visual verification
- Build validation

### Why Sequential Sub-Phases?

1. **Token limit management**: Each sub-phase is ~15-35 hours of code (~4,000-8,000 tokens)
2. **Independent testing**: Each sub-phase has its own success criteria
3. **Risk mitigation**: Problems in 3A don't block 3B from starting
4. **Progress visibility**: User sees incremental value every 2-3 days

### Technical Foundation

This phase establishes critical patterns for future phases:

- **Template registry**: Enables infinite template expansion (Phase 7+)
- **Design token system**: --doc-* tokens isolated from --app-* tokens
- **RAF rendering**: <120ms preview updates, proven in Monaco/CodeMirror
- **CSS pagination**: Print-ready output for Phase 4 (PDF/DOCX export)

### Implementer Workflow

The implementer agent will execute these sub-phases **sequentially**:

```
1. Deploy implementer for Phase 3A → Complete → Test
2. Deploy implementer for Phase 3B → Complete → Test
3. Deploy implementer for Phase 3C → Complete → Test
4. Deploy implementer for Phase 3D → Complete → Test
5. Deploy code-reviewer for full Phase 3 review
```

Each sub-phase is a **single agent deployment** with complete scope.

---

## 2. Phase 3A: Template Foundation (25-35 hours)

### Goal

Build the template infrastructure and first 3 professional templates (Minimal, Modern, Classic).

### Effort

**25-35 hours** (single implementer agent deployment)

### Files to Create

**Migration**:
- `/migrations/phase3/008_add_template_fields.sql` - Add template_id (TEXT DEFAULT 'minimal'), customizations (JSONB) to resumes table

**Type Definitions**:
- `/types/template.ts` - ResumeTemplate, TemplateMetadata, TemplateProps interfaces
- `/types/customizations.ts` - Customizations, ColorScheme, Typography, Spacing interfaces

**Template Registry**:
- `/libs/templates/registry.ts` - TEMPLATE_REGISTRY map, getTemplate(), getAllTemplates()
- `/libs/templates/index.ts` - Public exports for registry

**Shared Components**:
- `/components/templates/shared/TemplateBase.tsx` - Wrapper with .doc-theme class
- `/components/templates/shared/TemplateSection.tsx` - Section wrapper with break-inside: avoid
- `/components/templates/shared/TemplateUtils.ts` - formatDateRange(), formatPhone(), formatAddress()

**Minimal Template** (4 files):
- `/components/templates/minimal/MinimalTemplate.tsx` - Main template component
- `/components/templates/minimal/styles.css` - Minimal-specific --doc-* tokens
- `/components/templates/minimal/print.css` - Print-specific overrides
- `/components/templates/minimal/metadata.ts` - Template metadata (name, category, defaults)

**Modern Template** (4 files):
- `/components/templates/modern/ModernTemplate.tsx`
- `/components/templates/modern/styles.css`
- `/components/templates/modern/print.css`
- `/components/templates/modern/metadata.ts`

**Classic Template** (4 files):
- `/components/templates/classic/ClassicTemplate.tsx`
- `/components/templates/classic/styles.css`
- `/components/templates/classic/print.css`
- `/components/templates/classic/metadata.ts`

**Total: 20 files**

### Files to Modify

None (this is new infrastructure)

### Testing

**Manual render test**:
```bash
# Start dev server (already running on port 3000)
# Navigate to /test/templates
# Verify each template renders with sample ResumeJson
```

**Success Criteria**:
- [ ] All 3 templates render without errors
- [ ] Sample data displays correctly (profile, work, education, skills)
- [ ] --doc-* tokens isolated (no --app-* leakage)
- [ ] No console errors or warnings

### Success Criteria

**Definition of Done**:
- Migration 008 created (NOT applied - user applies manually)
- Template registry loads all 3 templates
- Each template renders with sample ResumeJson
- CSS tokens scoped to .doc-theme
- No TypeScript errors, all types exported
- Build succeeds (`npm run build`)

### Dependencies

None (Phase 2 already complete)

### Key Technical Decisions

**Template Component Pattern**:
```typescript
interface TemplateProps {
  data: ResumeJson
  customizations: Customizations
  mode: 'edit' | 'preview' | 'print'
}

// Pure function, no side effects
function MinimalTemplate({ data, customizations, mode }: TemplateProps) {
  return <div className="doc-theme">{/* Render */}</div>
}

export default React.memo(MinimalTemplate)
```

**Design Token Isolation**:
```css
/* globals.css - NEVER mix --app-* and --doc-* in same component */
.doc-theme {
  --doc-primary: 225 52% 8%;        /* Navy (HSL) */
  --doc-surface: 0 0% 100%;         /* White */
  --doc-foreground: 210 11% 15%;    /* Gray 900 */
  --doc-font-family: var(--font-sans);
  --doc-font-size-scale: 1;
  --doc-section-gap: var(--space-6);
}
```

**Print CSS Strategy**:
```css
@page {
  size: letter portrait;
  margin: 0.5in;
}

.doc-section {
  break-inside: avoid;  /* Don't break sections across pages */
  page-break-inside: avoid;  /* Legacy fallback */
}
```

**Reference**: See `systems_researcher_phase3_rendering_output.md` for full template patterns.

---

## 3. Phase 3B: Live Preview System (15-20 hours)

### Goal

Real-time preview with <120ms keystroke-to-paint performance.

### Effort

**15-20 hours** (single implementer agent deployment)

### Files to Create

**Preview Components**:
- `/components/preview/LivePreview.tsx` - Main preview container with error boundary
- `/components/preview/PreviewContainer.tsx` - Wrapper with RAF update scheduler
- `/components/preview/PreviewError.tsx` - Error fallback UI
- `/components/preview/TemplateRenderer.tsx` - Renders selected template from registry

**Preview State**:
- `/stores/previewStore.ts` - Zustand store for zoom, currentPage, viewport

**Preview Utilities**:
- `/libs/preview/update-scheduler.ts` - RAF batching scheduler (from research doc)
- `/libs/preview/scroll-manager.ts` - Scroll position tracking & restoration
- `/libs/utils/previewUtils.ts` - Pagination helpers, page break calculation

**Total: 8 files**

### Files to Modify

**Editor Integration**:
- `/app/editor/[id]/page.tsx` - Add split-pane layout with preview panel

**Document Store**:
- `/stores/documentStore.ts` - Integrate preview update scheduler

### Testing

**Performance Test**:
```typescript
// Type in editor, measure update time
// Target: p95 < 120ms keystroke-to-paint
```

**Manual Test Checklist**:
- [ ] Type in editor → preview updates <120ms
- [ ] No flicker or flash during updates
- [ ] Scroll position preserved after update
- [ ] Template switch <200ms
- [ ] Error boundary catches template render errors

### Success Criteria

**Definition of Done**:
- Preview updates in <120ms (p95) measured via React Profiler
- No visible flicker during typing
- Scroll position preserved
- Error boundary shows fallback on template errors
- Build succeeds

### Dependencies

**Requires Phase 3A**:
- Template registry (to render selected template)
- At least 1 template to preview

### Key Technical Decisions

**RAF-Batched Updates** (see `systems_researcher_phase3_preview_output.md` §1):
```typescript
class PreviewUpdateScheduler {
  private rafId: number | null = null
  private pendingUpdate: ResumeJson | null = null

  scheduleUpdate(data: ResumeJson) {
    this.pendingUpdate = data

    if (this.rafId) cancelAnimationFrame(this.rafId)

    this.rafId = requestAnimationFrame(() => {
      this.applyUpdate(this.pendingUpdate!)
      this.rafId = null
    })
  }
}
```

**Debounced Autosave** (120ms):
```typescript
const debouncedSave = useDebouncedCallback(
  async (document: ResumeJson) => {
    await api.updateDocument(documentId, document)
  },
  120,
  { trailing: true, maxWait: 2000 }
)
```

**Scroll Restoration** (see preview research §4):
```typescript
class ScrollPositionManager {
  private lastScrollTop = 0

  scheduleRestore() {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        container.scrollTop = this.lastScrollTop
      })
    })
  }
}
```

---

## 4. Phase 3C: Customization System (20-25 hours)

### Goal

Add 3 more templates (Creative, Technical, Executive) and full customization panel.

### Effort

**20-25 hours** (single implementer agent deployment)

### Files to Create

**Creative Template** (4 files):
- `/components/templates/creative/CreativeTemplate.tsx`
- `/components/templates/creative/styles.css`
- `/components/templates/creative/print.css`
- `/components/templates/creative/metadata.ts`

**Technical Template** (4 files):
- `/components/templates/technical/TechnicalTemplate.tsx`
- `/components/templates/technical/styles.css`
- `/components/templates/technical/print.css`
- `/components/templates/technical/metadata.ts`

**Executive Template** (4 files):
- `/components/templates/executive/ExecutiveTemplate.tsx`
- `/components/templates/executive/styles.css`
- `/components/templates/executive/print.css`
- `/components/templates/executive/metadata.ts`

**Customization Components**:
- `/components/customization/CustomizationPanel.tsx` - Main customization sidebar
- `/components/customization/ColorSchemeSelector.tsx` - Preset theme grid (10+ presets)
- `/components/customization/ColorPicker.tsx` - Custom color picker (react-colorful)
- `/components/customization/FontSelector.tsx` - Font family dropdown with previews
- `/components/customization/SpacingControls.tsx` - Sliders for spacing values
- `/components/customization/IconSettings.tsx` - Icon enable/disable, size, style

**Customization State**:
- `/stores/templateStore.ts` - Zustand store for templateId + customizations
- `/libs/hooks/useDynamicTheme.ts` - Injects CSS variables from customizations

**Color Utilities**:
- `/libs/utils/colorContrast.ts` - WCAG AA contrast validation (from research)

**Validation**:
- `/libs/validation/customization.ts` - Zod schemas for Customizations type

**Presets**:
- `/libs/templates/presets.ts` - COLOR_PRESETS array (10+ themes)

**Total: 23 files**

### Files to Modify

**Editor Page**:
- `/app/editor/[id]/page.tsx` - Add customization panel tab/sidebar

**Document Store**:
- `/stores/documentStore.ts` - Add auto-save for customizations

**Template Registry**:
- `/libs/templates/registry.ts` - Add 3 new templates to TEMPLATE_REGISTRY

### Testing

**Customization Test**:
```bash
# Open customization panel
# Change primary color → verify preview updates
# Change font → verify preview updates
# Select preset theme → verify all colors change
# Reset to defaults → verify template defaults restore
```

**Success Criteria**:
- [ ] All 6 templates render correctly
- [ ] Color picker updates preview in real-time
- [ ] Font selector shows live preview
- [ ] Spacing sliders update preview immediately
- [ ] Preset themes apply instantly
- [ ] Customizations persist to database

### Success Criteria

**Definition of Done**:
- All 6 templates available in registry
- Customization panel functional (colors, fonts, spacing, icons)
- Real-time preview updates (<120ms) for all customizations
- Customizations saved to database (JSONB column)
- WCAG AA contrast warnings shown for poor color combinations
- Build succeeds

### Dependencies

**Requires Phase 3B**:
- Live preview system (to show customization changes)
- Preview update scheduler (for real-time updates)

### Key Technical Decisions

**Color Format: HSL** (see `systems_researcher_phase3_customization_output.md` §1):
```typescript
// Store as: "225 52% 8%" (space-separated, no commas)
// Use as: hsl(var(--doc-primary))

interface ColorScheme {
  primary: string    // "225 52% 8%"
  secondary: string
  accent: string
  // ...
}
```

**Color Picker: react-colorful**:
```bash
npm install react-colorful
```

```typescript
import { HslColorPicker } from 'react-colorful'

<HslColorPicker
  color={{ h: 225, s: 52, l: 8 }}
  onChange={(color) => updateColor(color)}
/>
```

**Dynamic CSS Variables** (see customization research §3):
```typescript
// hooks/useDynamicTheme.ts
export function useDynamicTheme(customizations: Customizations) {
  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--doc-primary', customizations.colors.primary)
    root.style.setProperty('--doc-font-family', customizations.typography.fontFamily)
    // ... all customizations
  }, [customizations])
}
```

**Zustand Persist**:
```typescript
export const useTemplateStore = create<TemplateStore>()(
  persist(
    (set) => ({
      templateId: 'minimal',
      customizations: DEFAULT_CUSTOMIZATIONS,
      updateCustomization: (key, value) => set((state) => ({
        customizations: { ...state.customizations, [key]: value }
      }))
    }),
    {
      name: 'template-customizations',
      partialize: (state) => ({
        templateId: state.templateId,
        customizations: state.customizations
      })
    }
  )
)
```

---

## 5. Phase 3D: Controls & Polish (15-20 hours)

### Goal

Template gallery, preview controls, split-pane layout, and full validation.

### Effort

**15-20 hours** (single implementer agent deployment)

### Files to Create

**Template Gallery**:
- `/app/templates/gallery/page.tsx` - Template gallery page
- `/components/templates/TemplateGallery.tsx` - Grid of template cards
- `/components/templates/TemplateCard.tsx` - Individual template card with thumbnail

**Preview Controls**:
- `/components/preview/PreviewControls.tsx` - Top control bar
- `/components/preview/ZoomControl.tsx` - Zoom buttons (50%, 75%, 100%, 125%, 150%)
- `/components/preview/PageNavigation.tsx` - Page N of M, prev/next buttons
- `/components/preview/ViewportSelector.tsx` - Desktop/tablet/mobile/print dropdown

**Layout Components**:
- `/components/layout/SplitPane.tsx` - Resizable divider (or use react-resizable-panels)

**Playbooks** (3 total):
- `/ai_docs/testing/playbooks/phase3_playbook1_templates.md` - Template system validation
- `/ai_docs/testing/playbooks/phase3_playbook2_preview.md` - Live preview performance
- `/ai_docs/testing/playbooks/phase3_playbook3_customization.md` - Customization workflow

**Visual Review**:
- `/ai_docs/progress/phase_3/visual_review.md` - Screenshot analysis + checklist
- `/ai_docs/progress/phase_3/screenshots/` - Directory for 12 screenshots

**Total: 13 files (+ 12 screenshots)**

### Files to Modify

**Editor Page**:
- `/app/editor/[id]/page.tsx` - Wrap in SplitPane, add preview controls

**Navigation**:
- `/components/layout/Navbar.tsx` - Add "Templates" link to template gallery

**Home Page** (optional):
- `/app/page.tsx` - Add template showcase section

### Testing

**Playbook 1: Template System**:
- [ ] All 6 templates load without errors
- [ ] Template switch <200ms
- [ ] Data preserved on switch
- [ ] Print preview shows page breaks

**Playbook 2: Live Preview Performance**:
- [ ] Keystroke → paint <120ms (p95)
- [ ] No flicker during typing
- [ ] Scroll position preserved
- [ ] Multi-page documents paginate correctly

**Playbook 3: Customization**:
- [ ] Color change updates preview <120ms
- [ ] Font change updates preview immediately
- [ ] Spacing sliders work correctly
- [ ] Preset themes apply instantly
- [ ] Reset to defaults works

**Visual Verification** (12 screenshots required):
- Desktop (1440px): Editor with preview, customization panel, template gallery
- Mobile (375px): Editor, preview (tabbed), customization (bottom sheet), gallery
- Template previews: All 6 templates with sample data (desktop)

**Success Criteria**:
- [ ] All 3 playbooks pass (100% checkboxes)
- [ ] 12 screenshots captured and documented
- [ ] Build succeeds (`npm run build`)
- [ ] No TypeScript errors
- [ ] No console errors or warnings

### Success Criteria

**Definition of Done**:
- Template gallery functional (6 templates, thumbnails, descriptions)
- Preview controls working (zoom, page nav, viewport)
- Split-pane layout resizable and persistent
- All 3 playbooks pass
- Visual verification complete (12 screenshots)
- Build succeeds
- Phase 3 ready for code review

### Dependencies

**Requires Phase 3C**:
- All 6 templates (for gallery)
- Customization system (for preview controls)

### Key Technical Decisions

**Split-Pane: react-resizable-panels** (see preview research §7):
```bash
npm install react-resizable-panels
```

```typescript
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'

<PanelGroup direction="horizontal" autoSaveId="editor-layout">
  <Panel defaultSize={50} minSize={30}>
    <EditorPanel />
  </Panel>
  <PanelResizeHandle />
  <Panel defaultSize={50} minSize={30}>
    <PreviewPanel />
  </Panel>
</PanelGroup>
```

**Mobile Layout** (responsive):
```typescript
// <768px: Tabbed layout (Edit | Preview | Customize)
// ≥768px: Split-pane layout
const isDesktop = useMediaQuery('(min-width: 768px)')

if (isDesktop) {
  return <SplitEditorLayout />
} else {
  return <TabbedEditorLayout />
}
```

**Template Thumbnails**:
```bash
# Create static thumbnails for each template
/public/templates/thumbnails/minimal.png     # 400x520px
/public/templates/thumbnails/modern.png
/public/templates/thumbnails/classic.png
/public/templates/thumbnails/creative.png
/public/templates/thumbnails/technical.png
/public/templates/thumbnails/executive.png
```

---

## 6. Database Schema

### Migration 008 (Phase 3A)

**File**: `/migrations/phase3/008_add_template_fields.sql`

```sql
-- Add template fields to resumes table
ALTER TABLE resumes
  ADD COLUMN template_id TEXT DEFAULT 'minimal',
  ADD COLUMN customizations JSONB;

-- Index for querying by template
CREATE INDEX idx_resumes_template_id ON resumes(template_id);

-- RLS: Users can only access their own resumes (already exists from Phase 2)
-- No new RLS policies needed
```

**IMPORTANT**: Migration file created in Phase 3A, but **NOT applied** automatically. User must run migration manually via Supabase MCP tools.

### Customizations Schema (JSONB)

```json
{
  "colors": {
    "primary": "225 52% 8%",
    "secondary": "226 36% 16%",
    "accent": "73 100% 50%",
    "text": "210 11% 15%",
    "background": "0 0% 100%",
    "muted": "210 11% 46%",
    "border": "210 16% 93%"
  },
  "typography": {
    "fontFamily": "inter",
    "fontSize": 1,
    "lineHeight": 1.4,
    "fontWeight": 400
  },
  "spacing": {
    "sectionGap": 24,
    "itemGap": 12,
    "pagePadding": 48
  },
  "icons": {
    "enabled": true,
    "style": "outline",
    "size": 16,
    "color": "currentColor"
  },
  "layout": {
    "columns": 1,
    "sidebarPosition": "left",
    "headerAlignment": "left",
    "photoPosition": null
  }
}
```

---

## 7. State Architecture

### documentStore (Existing - Phase 2)

**File**: `/stores/documentStore.ts`

**New Additions**:
```typescript
interface DocumentStore {
  // ... existing fields (document, lastSaved, etc.)

  // NEW: Preview integration
  _previewScheduler: PreviewUpdateScheduler

  // Modified: Trigger preview update on document change
  updateDocument: (changes: Partial<ResumeJson>) => void
}
```

### templateStore (New - Phase 3C)

**File**: `/stores/templateStore.ts`

```typescript
interface TemplateStore {
  // Current template
  templateId: string

  // Customizations for current template
  customizations: Customizations

  // Actions
  selectTemplate: (templateId: string) => void
  updateCustomization: (key: keyof Customizations, value: any) => void
  resetCustomizations: () => void
  loadTemplateDefaults: (templateId: string) => void
}
```

### previewStore (New - Phase 3B)

**File**: `/stores/previewStore.ts`

```typescript
interface PreviewStore {
  // View state
  zoomLevel: number          // 0.5, 0.75, 1.0, 1.25, 1.5
  currentPage: number        // 1-indexed
  viewport: string           // 'desktop' | 'tablet' | 'mobile' | 'print'

  // Actions
  setZoom: (level: number) => void
  goToPage: (page: number) => void
  nextPage: () => void
  prevPage: () => void
  setViewport: (viewport: string) => void
}
```

---

## 8. Testing Strategy Per Sub-Phase

### Phase 3A Testing

**Manual Render Test**:
1. Navigate to `/test/templates`
2. Select each template (Minimal, Modern, Classic)
3. Verify rendering with sample ResumeJson
4. Check browser console for errors
5. Inspect CSS (verify --doc-* tokens scoped)

**Pass Criteria**:
- No errors in console
- All 3 templates render
- Data displays correctly

### Phase 3B Testing

**Performance Test**:
1. Open editor with preview
2. Type in any field
3. Measure keystroke → paint time
4. Run 100 samples, calculate p95
5. Target: p95 < 120ms

**Tools**:
- React DevTools Profiler
- Chrome DevTools Performance tab
- Custom performance logger (see preview research §11)

**Pass Criteria**:
- p95 latency < 120ms
- No flicker during typing
- Scroll position preserved

### Phase 3C Testing

**Customization Test**:
1. Open customization panel
2. Change primary color → verify preview updates
3. Change font → verify preview updates
4. Select preset theme → verify all colors change
5. Adjust spacing → verify preview updates
6. Reset to defaults → verify template defaults

**Pass Criteria**:
- All customizations update preview <120ms
- Preset themes apply instantly
- Reset works correctly

### Phase 3D Testing

**Full Integration Test** (3 Playbooks):
1. **Playbook 1**: Template system (switch templates, verify data preserved)
2. **Playbook 2**: Live preview (performance, scroll, pagination)
3. **Playbook 3**: Customization (all controls, presets, reset)

**Visual Verification**:
- 12 screenshots (desktop + mobile, all features)
- Check against visual quality checklist
- Verify spacing, typography, color usage

**Pass Criteria**:
- All 3 playbooks: 100% checkboxes
- All 12 screenshots captured
- Build succeeds

---

## 9. Performance Budgets

### Keystroke → Preview Paint

| Metric | Target | Measurement |
|--------|--------|-------------|
| **p50** | <50ms | React Profiler (median) |
| **p95** | <120ms | React Profiler (95th percentile) |
| **p99** | <200ms | React Profiler (99th percentile) |

**How to Measure**:
```typescript
// Use perfLogger from preview research §11
perfLogger.markKeystroke()
// ... update happens
perfLogger.markRenderComplete()
// After 100 samples, reports p95
```

### Template Switch

| Metric | Target |
|--------|--------|
| **Template switch** | <200ms |
| **Lazy load** | <150ms |

### Other Operations

| Operation | Target |
|-----------|--------|
| **Autosave debounce** | 120ms delay |
| **Zoom change** | <50ms |
| **Page navigation** | <100ms |
| **Scroll restoration** | <5ms |

---

## 10. Implementation Order

### Sequence

```
┌─────────────────────────────────────────────────────────────────┐
│ Phase 3A: Template Foundation (25-35 hours)                      │
│ - Migration 008 (template_id, customizations)                   │
│ - Template registry                                              │
│ - 3 templates: Minimal, Modern, Classic                         │
│ - Design tokens (--doc-*)                                       │
│                                                                  │
│ OUTPUT: 3 working templates, registry functional                │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ Phase 3B: Live Preview System (15-20 hours)                     │
│ - RAF-batched updates                                            │
│ - Preview components                                             │
│ - Scroll manager                                                 │
│ - Error boundaries                                               │
│                                                                  │
│ OUTPUT: Real-time preview (<120ms)                              │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ Phase 3C: Customization System (20-25 hours)                    │
│ - 3 more templates: Creative, Technical, Executive              │
│ - Customization panel (colors, fonts, spacing, icons)           │
│ - react-colorful integration                                    │
│ - Preset themes (10+)                                           │
│                                                                  │
│ OUTPUT: 6 templates + full customization                        │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ Phase 3D: Controls & Polish (15-20 hours)                       │
│ - Template gallery                                               │
│ - Preview controls (zoom, page nav, viewport)                   │
│ - Split-pane layout (react-resizable-panels)                   │
│ - 3 playbooks + visual verification                             │
│                                                                  │
│ OUTPUT: Full Phase 3 ready for code review                      │
└─────────────────────────────────────────────────────────────────┘
```

### Agent Deployments

**Implementer will execute 4 sequential agents**:

1. **Agent 1 (Phase 3A)**:
   - Input: This plan, research docs (rendering)
   - Output: Template infrastructure + 3 templates
   - Test: Manual render test

2. **Agent 2 (Phase 3B)**:
   - Input: Phase 3A output, research docs (preview)
   - Output: Live preview system
   - Test: Performance test (<120ms)

3. **Agent 3 (Phase 3C)**:
   - Input: Phase 3B output, research docs (customization)
   - Output: 3 more templates + customization panel
   - Test: Customization functionality

4. **Agent 4 (Phase 3D)**:
   - Input: Phase 3C output
   - Output: Gallery, controls, polish, validation
   - Test: 3 playbooks + visual verification

5. **Code Reviewer**:
   - Input: All Phase 3 code
   - Output: Code review report + fixes
   - Test: Build validation

---

## 11. Key Technical Decisions (Reference Research)

### Template Rendering

**Approach**: Pure React components with React.memo
**Reference**: `systems_researcher_phase3_rendering_output.md` §1

**Pattern**:
- Pure functions (no side effects)
- Props: `{ data: ResumeJson, customizations: Customizations, mode: string }`
- Wrapped in .doc-theme class
- CSS variables for all styling (--doc-*)

### Live Preview

**Approach**: RAF-batched updates with 120ms debounced autosave
**Reference**: `systems_researcher_phase3_preview_output.md` §1-2

**Pattern**:
- RAF batching for preview updates (<16ms)
- Debounced persistence (120ms)
- Scroll position restoration
- Error boundaries

### Customization

**Approach**: HSL colors + react-colorful + CSS variables
**Reference**: `systems_researcher_phase3_customization_output.md` §1-3

**Pattern**:
- HSL format: "225 52% 8%" (space-separated)
- react-colorful for color picker
- useDynamicTheme hook for CSS variable injection
- Zustand persist for state

### Pagination

**Approach**: CSS Paged Media + Paged.js polyfill
**Reference**: `systems_researcher_phase3_rendering_output.md` §3

**Pattern**:
- CSS: `break-inside: avoid` for sections
- Page counters via CSS
- Paged.js for complex layouts (Phase 4)

**Don't repeat implementation details** - implementer will read research docs.

---

## 12. Success Criteria

### Phase 3 Complete When:

**Technical**:
- [ ] All 6 templates render without errors
- [ ] Live preview updates in <120ms (p95)
- [ ] Template switch <200ms
- [ ] Customizations persist to database
- [ ] Build succeeds (`npm run build`)
- [ ] No TypeScript errors
- [ ] No console errors/warnings

**Testing**:
- [ ] 3 playbooks pass (100% checkboxes each)
- [ ] 12 screenshots captured and analyzed
- [ ] Visual quality checklist passes

**Documentation**:
- [ ] Migration 008 created (NOT applied)
- [ ] All new types documented
- [ ] Component props documented

**Code Quality**:
- [ ] Code review complete
- [ ] All reviewer feedback addressed
- [ ] No lint errors

---

## 13. Risk Mitigation

### Identified Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Preview performance <120ms not achieved** | Medium | High | RAF fallback to throttle; optimize React.memo |
| **CSS token leakage (--app-* into templates)** | Medium | Medium | ESLint rule; manual review |
| **Font loading FOUT/FOIT** | Low | Medium | font-display: optional; next/font |
| **Customization state bloat** | Low | Low | Partialize Zustand persist; limit presets |
| **Memory leaks in long sessions** | Medium | High | Cleanup checklist; Chrome Memory Profiler |
| **Browser CSS pagination incompatibility** | High | Low | Paged.js polyfill; accept limitations |

### Fallback Strategies

**If RAF causes issues**:
```typescript
// Fallback to throttle-based updates
const updatePreview = useThrottledCallback(update, 16)
```

**If react-colorful too heavy**:
```typescript
// Use native <input type="color"> with HSL conversion
```

**If 6 templates too ambitious**:
- Ship Phase 3A with 3 templates
- Add 3 more in Phase 3C hotfix

---

## 14. Dependencies on Research Docs

### Implementer Must Read:

**Phase 3A**:
- `systems_researcher_phase3_rendering_output.md` - Template patterns, print CSS

**Phase 3B**:
- `systems_researcher_phase3_preview_output.md` - RAF batching, scroll management

**Phase 3C**:
- `systems_researcher_phase3_customization_output.md` - Color systems, fonts

**All Phases**:
- `context_gatherer_phase3_output.md` - Full scope, requirements

### What This Plan Does NOT Include

**Implementation code** - Research docs provide:
- Full code examples
- Algorithm details
- Library integration steps
- Performance optimization techniques

**This plan specifies**:
- WHAT to build
- File structure
- Interfaces
- Success criteria
- Testing approach

---

## 15. Validation Gates

### After Each Sub-Phase

**Gate 1 (After 3A)**:
- [ ] Migration file exists
- [ ] 3 templates render
- [ ] Registry functional
- [ ] Build succeeds

**Gate 2 (After 3B)**:
- [ ] Preview <120ms (p95)
- [ ] No flicker
- [ ] Scroll preserved
- [ ] Error boundaries work

**Gate 3 (After 3C)**:
- [ ] 6 templates total
- [ ] Customization panel functional
- [ ] Real-time updates
- [ ] Persist to DB

**Gate 4 (After 3D)**:
- [ ] 3 playbooks pass
- [ ] 12 screenshots done
- [ ] Build succeeds
- [ ] Ready for code review

---

## 16. Estimated Timeline

### Total: 75-100 hours

**Phase 3A**: 25-35 hours (3-5 days @ 8hr/day)
**Phase 3B**: 15-20 hours (2-3 days)
**Phase 3C**: 20-25 hours (3-4 days)
**Phase 3D**: 15-20 hours (2-3 days)

**Calendar Time**: 10-15 days (assuming 1 implementer agent per sub-phase)

**Critical Path**:
```
3A → 3B → 3C → 3D → Code Review
```

**Parallel Work Opportunities**: None (sequential by design)

---

## 17. File Count Summary

### Total Files Created: ~64 files

**Phase 3A**: 20 files (migration, registry, 3 templates)
**Phase 3B**: 8 files (preview components, utilities)
**Phase 3C**: 23 files (3 templates, customization panel)
**Phase 3D**: 13 files (gallery, controls, playbooks)

### Total Files Modified: ~5 files

- `/app/editor/[id]/page.tsx` (3 times - 3B, 3C, 3D)
- `/stores/documentStore.ts` (2 times - 3B, 3C)
- `/libs/templates/registry.ts` (1 time - 3C)
- `/components/layout/Navbar.tsx` (1 time - 3D)

---

## 18. Output Location

**This Plan**: `/agents/phase_3/planner_architect_phase3_output.md`

**Next Steps**:
1. Review plan with user
2. Deploy implementer for Phase 3A
3. Execute 3A → 3B → 3C → 3D sequentially
4. Deploy code-reviewer for final review

---

**End of Phase 3 Implementation Plan**

**Plan Status**: Ready for Implementation
**Estimated Effort**: 75-100 hours (4 sub-phases)
**Critical Path**: Sequential execution (3A → 3B → 3C → 3D)
**Risk Level**: Medium (performance budgets, CSS isolation)
**Dependencies**: Phase 2 complete ✓

**Prepared by**: PLANNER-ARCHITECT Agent
**Date**: 2025-10-01
**Version**: 1.0
