# Phase 3 Context Document: Template System & Live Preview

**Phase**: 3 of 8
**Focus**: Template Architecture, Real-Time Preview, Customization System
**Date**: 2025-10-01
**Author**: CONTEXTGATHERER Agent
**Word Count**: ~28,500

---

## SECTION 1: Executive Summary (500 words)

### What Phase 3 Builds

Phase 3 implements a comprehensive template system for ResumePair that transforms the Phase 2 form-based editor into a professional document creation environment with live visual feedback. This phase delivers six distinct resume templates, a real-time preview system updating in under 120ms, extensive customization controls, and a split-pane editor layout.

**Core Deliverables**:
- **6 Professional Templates**: Minimal, Modern, Classic, Creative, Technical, Executive
- **Live Preview System**: Real-time HTML rendering with <120ms keystroke-to-paint
- **Customization Panel**: 10+ customization options (colors, fonts, spacing, icons)
- **Preview Controls**: Zoom, pagination, viewport modes, full-screen
- **Template Gallery**: Browsable template selector with thumbnails
- **Split-Pane Layout**: Resizable editor/preview interface

### Why This Is Critical

Phase 3 transforms ResumePair from a data-entry tool to a WYSIWYG document builder. Users can see exactly what their resume looks like while editing, switch between professional designs instantly, and fine-tune appearance with precision. This phase establishes the foundation for PDF/DOCX export (Phase 4) and AI-powered content generation (Phase 5).

**Business Impact**:
- **User Experience**: Jobs-level simplicity meets professional polish
- **Time-to-First-Draft**: <60 seconds from blank to styled resume
- **Competitive Edge**: Template variety + customization + real-time preview
- **Technical Foundation**: Template registry enables infinite future designs

### Key Challenges

**1. Performance at Scale**
- Challenge: Live preview must update <120ms on every keystroke
- Constraint: Client-side rendering without server round-trips
- Solution: Debounced rendering, memoization, virtual scrolling for long documents

**2. Schema-Driven Templates**
- Challenge: Templates must render ANY valid ResumeJson without breaking
- Constraint: Pure React components, no external template engines
- Solution: Defensive rendering, graceful degradation for missing fields

**3. Design Token Isolation**
- Challenge: App UI tokens (--app-*) must not leak into templates (--doc-*)
- Constraint: Two separate token namespaces in same application
- Solution: .doc-theme wrapper class, strict linting rules

**4. State Synchronization**
- Challenge: Coordinate editor state, template state, preview state, customization state
- Constraint: No prop drilling, performant updates
- Solution: Zustand stores with targeted selectors

**5. Customization Persistence**
- Challenge: Save per-template customizations without bloating database
- Constraint: JSONB storage, backward compatibility
- Solution: resume_customizations table with optimistic merging

---

## SECTION 2: Complete Scope (3,000 words)

### 2.1 Six Professional Templates

Each template is a standalone React component that accepts ResumeJson and Customizations props and returns styled HTML. Templates are pure functions with no side effects.

#### **Template 1: Minimal**
- **Philosophy**: Whitespace is design
- **Target Audience**: Designers, creatives, minimalists
- **Key Features**:
  - Maximum whitespace (32px+ gaps)
  - Sans-serif only (Inter)
  - Single-column layout
  - No icons
  - Ultra-clean lines
  - Text-only design
- **Color Scheme**: Black/white/gray scale only
- **Unique Elements**: Large section headings with generous margins
- **File**: `components/templates/minimal/MinimalTemplate.tsx`

#### **Template 2: Modern**
- **Philosophy**: Contemporary with subtle color accents
- **Target Audience**: Tech professionals, modern industries
- **Key Features**:
  - Accent color headers (customizable primary color)
  - Optional icons (Lucide)
  - Two-column layout option
  - Clean sans-serif (Inter)
  - Horizontal rules as separators
  - Photo support (top-right circular)
- **Color Scheme**: Navy + lime accent (customizable)
- **Unique Elements**: Colored section bars, icon integration
- **File**: `components/templates/modern/ModernTemplate.tsx`

#### **Template 3: Classic**
- **Philosophy**: Timeless traditional design
- **Target Audience**: Finance, law, consulting, executives
- **Key Features**:
  - Serif typography (Source Serif 4)
  - Centered header layout
  - Single-column content
  - Formal date formatting
  - Conservative spacing
  - No photos or icons
- **Color Scheme**: Black text on white only
- **Unique Elements**: Serif headings, centered contact info
- **File**: `components/templates/classic/ClassicTemplate.tsx`

#### **Template 4: Creative**
- **Philosophy**: Designer-friendly with visual elements
- **Target Audience**: Designers, artists, creative professionals
- **Key Features**:
  - Bold typography (large headings)
  - Graphic elements (colored blocks)
  - Sidebar layout (left sidebar for profile)
  - Photo support (sidebar header)
  - Icon sets (large, colorful)
  - Custom color schemes
- **Color Scheme**: Bold accent colors (customizable palette)
- **Unique Elements**: Sidebar profile, graphic accents, skill bars
- **File**: `components/templates/creative/CreativeTemplate.tsx`

#### **Template 5: Technical**
- **Philosophy**: Developer/engineer optimized
- **Target Audience**: Software engineers, data scientists, technical roles
- **Key Features**:
  - Monospace for tech stack (JetBrains Mono)
  - Dense information layout
  - Tech stack tags (pill design)
  - GitHub/portfolio links prominent
  - Project-focused sections
  - Code-like aesthetics
- **Color Scheme**: Terminal-inspired (dark accents)
- **Unique Elements**: Tech stack pills, monospace sections, compact layout
- **File**: `components/templates/technical/TechnicalTemplate.tsx`

#### **Template 6: Executive**
- **Philosophy**: Senior professional polish
- **Target Audience**: C-level, senior managers, executives
- **Key Features**:
  - Large serif headings
  - Generous whitespace
  - Achievement-focused bullets
  - Photo support (top-left, large)
  - Traditional date formats
  - Professional color palette
- **Color Scheme**: Navy + gold accents
- **Unique Elements**: Large executive photo, achievement emphasis
- **File**: `components/templates/executive/ExecutiveTemplate.tsx`

### 2.2 Live Preview System

**Architecture**: Client-side React rendering with iframe isolation

**Components**:
1. **LivePreview.tsx** - Main container
   - Manages preview rendering
   - Handles debounced updates (100ms)
   - Tracks pagination state
   - Error boundary wrapper

2. **PreviewFrame.tsx** - Isolated iframe
   - Renders template HTML
   - Injects template CSS
   - Manages print media queries
   - Sandboxes template execution

3. **PreviewSkeleton.tsx** - Loading state
   - Displays during initial render
   - Shows during template switch
   - Skeleton UI matches template layout

4. **PreviewError.tsx** - Error boundary
   - Catches template render errors
   - Shows fallback UI
   - Logs error details (non-PII)
   - Offers "retry" action

**Performance Budget**:
- Initial render: <200ms
- Keystroke → paint: p95 ≤120ms
- Template switch: <200ms
- Zoom change: <50ms
- Page navigation: <100ms

**Real-Time Update Flow**:
```
User types in editor
  → documentStore.updateDocument()
  → 100ms debounce
  → useMemo recalculates template HTML
  → PreviewFrame re-renders
  → <120ms total time
```

**Pagination Strategy**:
- Use CSS page-break properties
- Calculate pages on client
- Display page N of M
- Allow navigation between pages
- Print-ready output

### 2.3 Customization Panel

**Location**: Right sidebar or modal (responsive)

**Sections**:

#### **Color Scheme** (10+ Presets)
- Preset themes:
  1. Default (Navy + Lime)
  2. Professional (Navy + Gold)
  3. Creative (Purple + Orange)
  4. Minimal (Black + White)
  5. Modern (Blue + Teal)
  6. Warm (Brown + Orange)
  7. Cool (Blue + Green)
  8. Bold (Red + Yellow)
  9. Corporate (Gray + Blue)
  10. Tech (Dark + Green)
- Custom color picker (HSL)
- Primary, secondary, accent selection
- Preview swatches

#### **Typography**
- Font family selection (8 options):
  1. Inter (default sans)
  2. Source Sans 3
  3. Roboto
  4. Open Sans
  5. Source Serif 4 (serif)
  6. Merriweather (serif)
  7. JetBrains Mono (mono)
  8. Courier New (mono)
- Font size scaling: 0.8x - 1.2x (0.1 increments)
- Line spacing: 1.0 - 1.5 (0.1 increments)
- Font weight options (for supported templates)

#### **Spacing Controls**
- Section gap: 16px - 48px (4px increments)
- Item gap: 8px - 24px (4px increments)
- Page padding: 24px - 64px (8px increments)
- Preset spacing modes:
  - Compact (minimum spacing)
  - Normal (default)
  - Relaxed (generous spacing)

#### **Icon Settings**
- Enable/disable icons
- Icon style: outline vs filled
- Icon size: small, medium, large
- Icon color: inherit vs custom

#### **Layout Options** (Template-Specific)
- Column count: 1 or 2 (for supported templates)
- Sidebar position: left or right
- Header alignment: left, center, right
- Photo position (for photo-enabled templates)

#### **Date Format**
- US: MMM YYYY (Jan 2024)
- ISO: YYYY-MM (2024-01)
- EU: DD MMM YYYY (15 Jan 2024)
- Custom format string

#### **Section Order** (Drag-and-Drop)
- Reorder resume sections
- Show/hide optional sections
- Visual drag handles
- Persist order per document

#### **Reset to Defaults**
- One-click reset
- Confirmation dialog
- Resets to template defaults

### 2.4 Preview Controls

**Control Bar Components**:

#### **Zoom Controls**
- Levels: 50%, 75%, 100%, 125%, 150%
- Fit to width button
- Fit to height button
- Keyboard shortcuts:
  - Cmd/Ctrl + Plus: Zoom in
  - Cmd/Ctrl + Minus: Zoom out
  - Cmd/Ctrl + 0: Reset to 100%

#### **Page Navigation** (Multi-Page Resumes)
- Previous/Next page buttons
- Page indicator: "Page 2 of 3"
- Jump to page dropdown
- Keyboard shortcuts:
  - Arrow Up: Previous page
  - Arrow Down: Next page

#### **Viewport Modes**
- Desktop (1200px)
- Tablet (768px)
- Mobile (360px)
- Print (8.5" × 11" or A4)
- Custom width input

#### **Preview Mode Toggle**
- Edit mode (split pane)
- Preview mode (full width)
- Print preview (print CSS)
- Full-screen mode

#### **Export Quick Actions** (Phase 4 integration)
- Download PDF button
- Download DOCX button
- Share link (future)

### 2.5 Template Gallery

**Layout**: Grid of template cards

**Card Contents**:
- Template thumbnail (static image)
- Template name
- Category badge
- Short description
- "Preview" button
- "Select" button (if different from current)

**Features**:
- Filter by category
- Search by name
- Hover preview (larger thumbnail)
- Quick apply (instant switch)
- Preserve data on switch

**Categories**:
- Minimal
- Modern
- Classic
- Creative
- Technical
- Executive

### 2.6 Supporting Infrastructure

#### **Template Registry**
- Central registry of all templates
- Metadata for each template:
  - ID, name, category
  - Thumbnail URL
  - Description
  - Features list
  - Requirements (e.g., photo support)
  - Default customizations
- Discovery mechanism (list all templates)
- Validation (ensure template implements interface)

#### **Settings Pages**
- Default template selection
- Preview preferences (default zoom, viewport)
- Template customization defaults
- Auto-save preferences

#### **Error Handling**
- Template render errors → fallback to Minimal template
- Invalid customizations → reset to defaults
- Missing template → show error + template picker
- Network errors → offline mode (client-side only)

#### **Layout Components**
- **SplitPane.tsx**: Resizable divider
  - Drag to resize
  - Remember size preference
  - Collapse on mobile
  - Min/max size enforcement
- **EditorTabs.tsx**: Edit/Preview/Customize tabs
  - Mobile-friendly tab switching
  - Keyboard navigation
  - Active state indicator
- **MobileLayout.tsx**: Mobile-specific layout
  - Full-screen editor or preview
  - Bottom sheet for customization
  - Swipe gestures

#### **Performance Optimizations**
- Preview debouncing (100ms)
- Memoized template rendering
- Virtual scrolling for long resumes (10+ pages)
- Lazy loading for template gallery
- Code splitting per template

#### **Data Management**
- Template-data mapping (ResumeJson → Template props)
- Customization persistence (JSONB in database)
- Customization merging (template defaults + user overrides)
- Customization validation (Zod schemas)

---

## SECTION 3: Technical Architecture (4,000 words)

### 3.1 Template System Design

#### **Pure Function Pattern**

Templates are pure React components following this contract:

```typescript
interface TemplateProps {
  data: ResumeJson
  customizations: Customizations
  mode: 'edit' | 'preview' | 'print'
}

type TemplateComponent = (props: TemplateProps) => JSX.Element

// Example usage
function MinimalTemplate({ data, customizations, mode }: TemplateProps) {
  return (
    <div className="doc-theme" data-mode={mode}>
      {/* Render resume using data + customizations */}
    </div>
  )
}
```

**Key Principles**:
1. **No side effects**: No API calls, no localStorage, no external dependencies
2. **Deterministic**: Same inputs always produce same output
3. **Isolated**: Wrapped in `.doc-theme` class
4. **Defensive**: Gracefully handle missing/invalid data
5. **Performant**: Memoize expensive computations

#### **Template Registry Implementation**

```typescript
// components/templates/registry.ts

export interface TemplateMetadata {
  id: string
  name: string
  category: 'minimal' | 'modern' | 'classic' | 'creative' | 'technical' | 'executive'
  thumbnail: string // URL to static thumbnail
  description: string
  features: string[] // ["Photo support", "Icons", "Two columns"]
  requirements?: {
    photo?: boolean
    minSections?: number
  }
  defaultCustomizations: Customizations
  component: TemplateComponent
}

export const TEMPLATE_REGISTRY: Record<string, TemplateMetadata> = {
  minimal: {
    id: 'minimal',
    name: 'Minimal',
    category: 'minimal',
    thumbnail: '/templates/thumbnails/minimal.png',
    description: 'Clean, whitespace-focused design',
    features: ['Single column', 'Sans-serif', 'Text only'],
    defaultCustomizations: { /* ... */ },
    component: MinimalTemplate
  },
  // ... other templates
}

// Helper functions
export function getTemplate(id: string): TemplateMetadata | null {
  return TEMPLATE_REGISTRY[id] || null
}

export function getAllTemplates(): TemplateMetadata[] {
  return Object.values(TEMPLATE_REGISTRY)
}

export function getTemplatesByCategory(category: string): TemplateMetadata[] {
  return getAllTemplates().filter(t => t.category === category)
}
```

#### **Customizations Schema**

```typescript
// types/customizations.ts

export interface Customizations {
  colors: {
    primary: string    // HSL: "225 52% 8%"
    secondary: string
    accent: string
    text: string
    background: string
    muted: string
  }
  typography: {
    fontFamily: string      // "Inter", "Source Serif 4", etc.
    fontSize: number        // Scale factor: 0.8 - 1.2
    lineHeight: number      // 1.0 - 1.5
    headingFont?: string    // Optional separate heading font
  }
  spacing: {
    sectionGap: number      // px: 16 - 48
    itemGap: number         // px: 8 - 24
    pagePadding: number     // px: 24 - 64
  }
  icons: {
    enabled: boolean
    style: 'outline' | 'filled'
    size: number           // px: 16, 20, 24
  }
  layout: {
    columns: 1 | 2
    sidebarPosition?: 'left' | 'right'
    headerAlignment: 'left' | 'center' | 'right'
    photoPosition?: 'top-left' | 'top-right' | 'sidebar'
  }
  dateFormat: 'US' | 'ISO' | 'EU'
  sectionOrder: string[]  // ["profile", "summary", "work", ...]
}

// Default factory
export function createDefaultCustomizations(): Customizations {
  return {
    colors: {
      primary: '225 52% 8%',      // Navy dark
      secondary: '210 17% 95%',   // Gray 100
      accent: '73 100% 50%',      // Lime
      text: '210 11% 15%',        // Gray 900
      background: '0 0% 100%',    // White
      muted: '210 11% 46%'        // Gray 500
    },
    typography: {
      fontFamily: 'Inter',
      fontSize: 1.0,
      lineHeight: 1.2
    },
    spacing: {
      sectionGap: 24,
      itemGap: 12,
      pagePadding: 40
    },
    icons: {
      enabled: false,
      style: 'outline',
      size: 16
    },
    layout: {
      columns: 1,
      headerAlignment: 'left'
    },
    dateFormat: 'US',
    sectionOrder: ['profile', 'summary', 'work', 'education', 'projects', 'skills']
  }
}
```

### 3.2 Database Schema Changes

#### **New Table: resume_customizations**

```sql
-- migrations/phase3/001_create_customizations_table.sql

CREATE TABLE IF NOT EXISTS public.resume_customizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id UUID NOT NULL REFERENCES public.resumes(id) ON DELETE CASCADE,
  template_id TEXT NOT NULL,
  customizations JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique constraint: one customization per resume per template
  UNIQUE(resume_id, template_id)
);

-- RLS policies
ALTER TABLE public.resume_customizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "resume_customizations_select_own"
  ON public.resume_customizations FOR SELECT
  USING (resume_id IN (
    SELECT id FROM public.resumes WHERE user_id = auth.uid()
  ));

CREATE POLICY "resume_customizations_insert_own"
  ON public.resume_customizations FOR INSERT
  WITH CHECK (resume_id IN (
    SELECT id FROM public.resumes WHERE user_id = auth.uid()
  ));

CREATE POLICY "resume_customizations_update_own"
  ON public.resume_customizations FOR UPDATE
  USING (resume_id IN (
    SELECT id FROM public.resumes WHERE user_id = auth.uid()
  ));

-- Indexes
CREATE INDEX resume_customizations_resume_id_idx
  ON public.resume_customizations(resume_id);

CREATE INDEX resume_customizations_template_id_idx
  ON public.resume_customizations(template_id);

-- Updated timestamp trigger
CREATE TRIGGER set_updated_at_on_resume_customizations
  BEFORE UPDATE ON public.resume_customizations
  FOR EACH ROW
  EXECUTE FUNCTION public.tg_set_updated_at();
```

#### **Updates to resumes Table**

```sql
-- migrations/phase3/002_alter_resumes_add_template.sql

-- Add template_id column (references template registry)
ALTER TABLE public.resumes
  ADD COLUMN IF NOT EXISTS template_id TEXT DEFAULT 'minimal' NOT NULL;

-- Add inline customizations (optional, for denormalization)
ALTER TABLE public.resumes
  ADD COLUMN IF NOT EXISTS customizations JSONB;

-- Index for template filtering
CREATE INDEX IF NOT EXISTS resumes_template_id_idx
  ON public.resumes(template_id);

-- Comment
COMMENT ON COLUMN public.resumes.template_id IS 'ID of selected template from registry';
COMMENT ON COLUMN public.resumes.customizations IS 'Inline customizations (denormalized for performance)';
```

**Design Decision: Why Two Storage Locations?**

1. **resume_customizations table**: Historical record of customizations per template
   - Allows switching templates and restoring previous customizations
   - Queryable for analytics (which templates/colors are popular)

2. **resumes.customizations column**: Current active customizations
   - Faster reads (no JOIN needed)
   - Single query to load document + customizations
   - Updated whenever user saves customizations

**Migration Strategy**:
- Create files ONLY (per coding patterns)
- DO NOT apply to database
- Wait for explicit user approval
- Document in phase_3_migrations.md

### 3.3 State Management

#### **templateStore.ts**

```typescript
// stores/templateStore.ts

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { TemplateMetadata, Customizations } from '@/types'

interface TemplateStore {
  // State
  templates: TemplateMetadata[]
  currentTemplate: string | null
  customizations: Customizations
  savedCustomizations: Map<string, Customizations> // Per template
  isLoading: boolean
  error: Error | null

  // Actions
  loadTemplates: () => Promise<void>
  selectTemplate: (id: string) => void
  updateCustomization: (path: string, value: any) => void
  resetCustomizations: () => void
  saveCustomizations: (resumeId: string) => Promise<void>
  loadCustomizations: (resumeId: string, templateId: string) => Promise<void>

  // Computed
  activeTemplate: TemplateMetadata | null
  hasCustomizations: boolean
}

export const useTemplateStore = create<TemplateStore>()(
  persist(
    (set, get) => ({
      // Initial state
      templates: [],
      currentTemplate: 'minimal',
      customizations: createDefaultCustomizations(),
      savedCustomizations: new Map(),
      isLoading: false,
      error: null,

      // Computed
      get activeTemplate() {
        const id = get().currentTemplate
        return id ? getTemplate(id) : null
      },
      get hasCustomizations() {
        const defaults = get().activeTemplate?.defaultCustomizations
        const current = get().customizations
        return !isEqual(defaults, current)
      },

      // Load all templates from registry
      loadTemplates: async () => {
        set({ isLoading: true })
        try {
          const templates = getAllTemplates()
          set({ templates, isLoading: false })
        } catch (error) {
          set({
            error: error instanceof Error ? error : new Error('Failed to load templates'),
            isLoading: false
          })
        }
      },

      // Switch template
      selectTemplate: (id: string) => {
        const template = getTemplate(id)
        if (!template) {
          console.error(`Template not found: ${id}`)
          return
        }

        // Restore saved customizations for this template, or use defaults
        const saved = get().savedCustomizations.get(id)
        const customizations = saved || template.defaultCustomizations

        set({
          currentTemplate: id,
          customizations
        })
      },

      // Update single customization value
      updateCustomization: (path: string, value: any) => {
        const keys = path.split('.')
        set((state) => {
          const newCustomizations = { ...state.customizations }
          let current: any = newCustomizations

          for (let i = 0; i < keys.length - 1; i++) {
            current[keys[i]] = { ...current[keys[i]] }
            current = current[keys[i]]
          }

          current[keys[keys.length - 1]] = value
          return { customizations: newCustomizations }
        })
      },

      // Reset to template defaults
      resetCustomizations: () => {
        const template = get().activeTemplate
        if (template) {
          set({ customizations: template.defaultCustomizations })
        }
      },

      // Save customizations to database
      saveCustomizations: async (resumeId: string) => {
        const { currentTemplate, customizations } = get()
        if (!currentTemplate) return

        try {
          const response = await fetch(`/api/v1/resumes/${resumeId}/customizations`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              template_id: currentTemplate,
              customizations
            })
          })

          if (!response.ok) {
            throw new Error('Failed to save customizations')
          }

          // Update saved state
          set((state) => {
            const newSaved = new Map(state.savedCustomizations)
            newSaved.set(currentTemplate, customizations)
            return { savedCustomizations: newSaved }
          })
        } catch (error) {
          console.error('Save customizations failed:', error)
          throw error
        }
      },

      // Load customizations from database
      loadCustomizations: async (resumeId: string, templateId: string) => {
        set({ isLoading: true })
        try {
          const response = await fetch(
            `/api/v1/resumes/${resumeId}/customizations/${templateId}`
          )

          if (response.ok) {
            const result = await response.json()
            const customizations = result.data?.customizations ||
                                   getTemplate(templateId)?.defaultCustomizations

            set({
              customizations,
              isLoading: false
            })
          } else {
            // No saved customizations, use defaults
            const template = getTemplate(templateId)
            set({
              customizations: template?.defaultCustomizations || createDefaultCustomizations(),
              isLoading: false
            })
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error : new Error('Failed to load customizations'),
            isLoading: false
          })
        }
      }
    }),
    {
      name: 'template-storage',
      partialize: (state) => ({
        currentTemplate: state.currentTemplate,
        savedCustomizations: Array.from(state.savedCustomizations.entries())
      })
    }
  )
)
```

#### **previewStore.ts**

```typescript
// stores/previewStore.ts

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface PreviewStore {
  // State
  zoomLevel: number           // 0.5 to 1.5
  currentPage: number         // 1-based
  totalPages: number
  viewport: 'desktop' | 'tablet' | 'mobile' | 'print'
  isFullscreen: boolean
  splitRatio: number          // 0.3 to 0.7 (editor/preview ratio)

  // Actions
  setZoom: (level: number) => void
  zoomIn: () => void
  zoomOut: () => void
  resetZoom: () => void
  nextPage: () => void
  previousPage: () => void
  goToPage: (page: number) => void
  setTotalPages: (total: number) => void
  setViewport: (mode: 'desktop' | 'tablet' | 'mobile' | 'print') => void
  toggleFullscreen: () => void
  setSplitRatio: (ratio: number) => void

  // Computed
  canZoomIn: boolean
  canZoomOut: boolean
  hasMultiplePages: boolean
  canGoNext: boolean
  canGoPrevious: boolean
}

export const usePreviewStore = create<PreviewStore>()(
  persist(
    (set, get) => ({
      // Initial state
      zoomLevel: 1.0,
      currentPage: 1,
      totalPages: 1,
      viewport: 'desktop',
      isFullscreen: false,
      splitRatio: 0.5,

      // Computed
      get canZoomIn() {
        return get().zoomLevel < 1.5
      },
      get canZoomOut() {
        return get().zoomLevel > 0.5
      },
      get hasMultiplePages() {
        return get().totalPages > 1
      },
      get canGoNext() {
        return get().currentPage < get().totalPages
      },
      get canGoPrevious() {
        return get().currentPage > 1
      },

      // Zoom controls
      setZoom: (level: number) => {
        const clamped = Math.max(0.5, Math.min(1.5, level))
        set({ zoomLevel: clamped })
      },
      zoomIn: () => {
        const current = get().zoomLevel
        const newLevel = Math.min(1.5, current + 0.25)
        set({ zoomLevel: newLevel })
      },
      zoomOut: () => {
        const current = get().zoomLevel
        const newLevel = Math.max(0.5, current - 0.25)
        set({ zoomLevel: newLevel })
      },
      resetZoom: () => {
        set({ zoomLevel: 1.0 })
      },

      // Page navigation
      nextPage: () => {
        const { currentPage, totalPages } = get()
        if (currentPage < totalPages) {
          set({ currentPage: currentPage + 1 })
        }
      },
      previousPage: () => {
        const { currentPage } = get()
        if (currentPage > 1) {
          set({ currentPage: currentPage - 1 })
        }
      },
      goToPage: (page: number) => {
        const { totalPages } = get()
        const clamped = Math.max(1, Math.min(totalPages, page))
        set({ currentPage: clamped })
      },
      setTotalPages: (total: number) => {
        set({ totalPages: Math.max(1, total) })
      },

      // Viewport controls
      setViewport: (mode) => {
        set({ viewport: mode })
      },

      // Fullscreen
      toggleFullscreen: () => {
        set((state) => ({ isFullscreen: !state.isFullscreen }))
      },

      // Split pane
      setSplitRatio: (ratio: number) => {
        const clamped = Math.max(0.3, Math.min(0.7, ratio))
        set({ splitRatio: clamped })
      }
    }),
    {
      name: 'preview-storage',
      partialize: (state) => ({
        zoomLevel: state.zoomLevel,
        viewport: state.viewport,
        splitRatio: state.splitRatio
      })
    }
  )
)
```

#### **Integration with documentStore**

```typescript
// Existing documentStore.ts integration

// In editor component:
const document = useDocumentStore(state => state.document)
const currentTemplate = useTemplateStore(state => state.currentTemplate)
const customizations = useTemplateStore(state => state.customizations)

// Debounced preview update
const debouncedDocument = useDebounce(document, 100)

// Memoized template HTML
const templateHtml = useMemo(() => {
  if (!debouncedDocument || !currentTemplate) return null

  const template = getTemplate(currentTemplate)
  if (!template) return null

  return <template.component
    data={debouncedDocument}
    customizations={customizations}
    mode="preview"
  />
}, [debouncedDocument, currentTemplate, customizations])
```

### 3.4 Component Hierarchy

#### **Complete Component List** (70+ components)

```
Phase 3 Components Structure:

app/
  editor/
    [id]/
      page.tsx                          # Main editor page (updated)
      preview/
        page.tsx                        # Full preview page
      customize/
        page.tsx                        # Customization interface
  templates/
    gallery/
      page.tsx                          # Template browser
    [template]/
      page.tsx                          # Template details

components/
  templates/
    registry.ts                         # Template registry (EXPORT)
    minimal/
      MinimalTemplate.tsx               # Template component
      styles.css                        # Template-specific CSS
      print.css                         # Print styles
    modern/
      ModernTemplate.tsx
      styles.css
      print.css
    classic/
      ClassicTemplate.tsx
      styles.css
      print.css
    creative/
      CreativeTemplate.tsx
      styles.css
      print.css
    technical/
      TechnicalTemplate.tsx
      styles.css
      print.css
    executive/
      ExecutiveTemplate.tsx
      styles.css
      print.css
    shared/
      TemplateBase.tsx                  # Base wrapper component
      TemplateSection.tsx               # Section wrapper
      TemplateIcons.tsx                 # Icon components
      TemplateUtils.ts                  # Utility functions
      TemplateProfile.tsx               # Profile section
      TemplateWork.tsx                  # Work section
      TemplateEducation.tsx             # Education section
      TemplateProjects.tsx              # Projects section
      TemplateSkills.tsx                # Skills section

  preview/
    LivePreview.tsx                     # Main preview container
    PreviewFrame.tsx                    # Iframe wrapper
    PreviewControls.tsx                 # Control bar
    PreviewPagination.tsx               # Page navigation
    PreviewZoom.tsx                     # Zoom controls
    PreviewViewport.tsx                 # Viewport switcher
    PreviewError.tsx                    # Error boundary
    PreviewSkeleton.tsx                 # Loading state
    PrintPreview.tsx                    # Print-specific view
    PreviewToolbar.tsx                  # Top toolbar
    PreviewStatusBar.tsx                # Bottom status bar

  customization/
    CustomizationPanel.tsx              # Main panel
    CustomizationTabs.tsx               # Tabbed interface
    ColorScheme.tsx                     # Color selection
    ColorPicker.tsx                     # Custom colors
    ColorPresets.tsx                    # Preset themes
    Typography.tsx                      # Font settings
    FontPicker.tsx                      # Font selection
    FontSizeSlider.tsx                  # Size control
    LineSpacingSlider.tsx               # Line height
    Spacing.tsx                         # Spacing controls
    SpacingPresets.tsx                  # Compact/Normal/Relaxed
    IconSettings.tsx                    # Icon options
    IconStylePicker.tsx                 # Outline/Filled
    LayoutOptions.tsx                   # Layout settings
    ColumnToggle.tsx                    # 1 or 2 columns
    PresetThemes.tsx                    # Theme presets
    ResetButton.tsx                     # Reset to defaults
    SectionOrderEditor.tsx              # Drag-drop section order
    DateFormatPicker.tsx                # Date format selection

  gallery/
    TemplateGallery.tsx                 # Main gallery
    TemplateCard.tsx                    # Template card
    TemplatePreview.tsx                 # Hover preview
    TemplateFilter.tsx                  # Category filter
    TemplateSearch.tsx                  # Search input
    TemplateThumbnail.tsx               # Thumbnail image
    TemplateBadge.tsx                   # Category badge

  editor/
    EditorLayout.tsx                    # Split pane container (UPDATED)
    SplitPane.tsx                       # Resizable divider
    SplitPaneHandle.tsx                 # Drag handle
    EditorTabs.tsx                      # Edit/Preview/Customize tabs
    MobileLayout.tsx                    # Mobile-specific layout
    EditorMobileNav.tsx                 # Mobile navigation
    BottomSheet.tsx                     # Mobile customization sheet

  ui/
    Slider.tsx                          # shadcn slider
    Tabs.tsx                            # shadcn tabs
    Dialog.tsx                          # shadcn dialog
    Popover.tsx                         # shadcn popover
    Select.tsx                          # shadcn select
    RadioGroup.tsx                      # shadcn radio
    Switch.tsx                          # shadcn switch
    Badge.tsx                           # shadcn badge
    Separator.tsx                       # shadcn separator

stores/
  templateStore.ts                      # Template state
  previewStore.ts                       # Preview state
  documentStore.ts                      # Document state (existing)

libs/
  templates/
    utils.ts                            # Template utilities
    formatters.ts                       # Date/address/phone formatters
    pagination.ts                       # Page break calculations
    icons.ts                            # Icon mapping

types/
  customizations.ts                     # Customizations types
  template.ts                           # Template types
  preview.ts                            # Preview types
```

**Component Count**:
- Template components: 6 (main) + 6 (shared) = 12
- Preview components: 11
- Customization components: 18
- Gallery components: 7
- Editor components: 7
- UI components: 9 (shadcn)
- Stores: 2 (new)
- Utilities: 4

**Total New Files**: ~70

### 3.5 CSS Architecture

#### **Design Token Usage**

**CRITICAL RULE**: Templates use ONLY `--doc-*` tokens. App UI uses ONLY `--app-*` tokens.

```css
/* app/globals.css - Already exists, add document tokens */

/* ========================================
   DOCUMENT-SCOPED TOKENS (Templates)
   ======================================== */

.doc-theme {
  /* Document colors */
  --doc-primary: var(--app-navy-dark);
  --doc-secondary: var(--app-gray-100);
  --doc-accent: var(--app-lime);
  --doc-text: var(--app-gray-900);
  --doc-background: var(--app-white);
  --doc-muted: var(--app-gray-500);
  --doc-border: var(--app-gray-200);

  /* Document typography */
  --doc-font-family: var(--font-sans);
  --doc-font-size-base: 10pt;       /* Print-optimized */
  --doc-font-size-sm: 9pt;
  --doc-font-size-lg: 11pt;
  --doc-font-size-xl: 13pt;
  --doc-font-size-2xl: 16pt;
  --doc-line-height: 1.2;

  /* Document spacing */
  --doc-gutter: 40px;               /* Page padding */
  --doc-section-gap: 24px;
  --doc-item-gap: 12px;

  /* Document layout */
  --doc-page-width: 8.5in;          /* Letter */
  --doc-page-height: 11in;
}

/* Print media queries */
@media print {
  .doc-theme {
    --doc-font-size-base: 10pt;
    --doc-gutter: 0.5in;
    --doc-page-width: 100%;
    --doc-page-height: auto;
  }
}

/* A4 variant (via class) */
.doc-theme[data-page-size="A4"] {
  --doc-page-width: 210mm;
  --doc-page-height: 297mm;
}
```

#### **Template-Specific CSS**

Each template has its own CSS file:

```css
/* components/templates/minimal/styles.css */

.template-minimal {
  font-family: var(--doc-font-family);
  font-size: var(--doc-font-size-base);
  line-height: var(--doc-line-height);
  color: hsl(var(--doc-text));
  background: hsl(var(--doc-background));
  padding: var(--doc-gutter);
}

.template-minimal .section {
  margin-bottom: var(--doc-section-gap);
}

.template-minimal .section-title {
  font-size: var(--doc-font-size-2xl);
  font-weight: 600;
  margin-bottom: var(--doc-item-gap);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.template-minimal .work-item {
  margin-bottom: var(--doc-item-gap);
}

/* NO hardcoded values - all use --doc-* tokens */
```

#### **Print Styles**

```css
/* components/templates/shared/print.css */

@media print {
  /* Reset page margins */
  @page {
    margin: 0.5in;
    size: letter; /* or A4 */
  }

  /* Hide non-print elements */
  .no-print {
    display: none !important;
  }

  /* Page break control */
  .page-break {
    page-break-after: always;
  }

  .keep-together {
    page-break-inside: avoid;
  }

  /* Prevent orphans/widows */
  h1, h2, h3, h4, h5, h6 {
    page-break-after: avoid;
  }

  /* Ensure text is black for printing */
  body {
    color: #000;
  }

  /* Remove backgrounds to save ink */
  * {
    background: transparent !important;
    box-shadow: none !important;
  }
}
```

#### **Responsive Template CSS**

Templates must work in preview AND print:

```css
/* Desktop preview (1200px+) */
.doc-theme {
  max-width: var(--doc-page-width);
  margin: 0 auto;
}

/* Tablet preview (768px) */
@media (max-width: 768px) {
  .doc-theme {
    --doc-gutter: 24px;
    --doc-section-gap: 16px;
  }
}

/* Mobile preview (360px) */
@media (max-width: 480px) {
  .doc-theme {
    --doc-gutter: 16px;
    --doc-section-gap: 12px;
    --doc-font-size-base: 9pt;
  }

  /* Force single column on mobile */
  .template-two-column {
    grid-template-columns: 1fr !important;
  }
}
```

---

## SECTION 4: Integration with Phase 2 (2,000 words)

### 4.1 Editor-Preview Connection

**Current Phase 2 State** (from phase_summary.md):
- Form-based editor with 10 sections
- documentStore with auto-save (2s debounce)
- Undo/redo (50-step history via zundo)
- No preview panel (placeholder only)

**Phase 3 Changes**:

#### **EditorLayout.tsx** (Major Update)

```typescript
// BEFORE (Phase 2):
<div className="grid grid-cols-[300px_1fr]">
  <EditorSidebar />
  <div className="p-6">
    <EditorForm />
    {/* TODO: Add preview panel */}
  </div>
</div>

// AFTER (Phase 3):
<SplitPane
  left={
    <div className="h-full overflow-y-auto">
      <EditorSidebar />
      <EditorForm />
    </div>
  }
  right={
    <LivePreview
      document={document}
      template={currentTemplate}
      customizations={customizations}
    />
  }
  initialRatio={0.5}
  minRatio={0.3}
  maxRatio={0.7}
/>
```

#### **Real-Time Preview Updates**

```typescript
// app/editor/[id]/page.tsx

'use client'

import { useEffect, useMemo } from 'react'
import { useDocumentStore } from '@/stores/documentStore'
import { useTemplateStore } from '@/stores/templateStore'
import { usePreviewStore } from '@/stores/previewStore'
import { useDebounce } from '@/hooks/useDebounce'
import { LivePreview } from '@/components/preview/LivePreview'
import { EditorLayout } from '@/components/editor/EditorLayout'

export default function EditorPage({ params }: { params: { id: string } }) {
  const { document, loadDocument } = useDocumentStore()
  const { currentTemplate, customizations, loadCustomizations } = useTemplateStore()

  // Load document on mount
  useEffect(() => {
    loadDocument(params.id)
    loadCustomizations(params.id, currentTemplate || 'minimal')
  }, [params.id])

  // Debounced document for preview (100ms)
  const debouncedDocument = useDebounce(document, 100)

  // Memoized preview rendering
  const previewContent = useMemo(() => {
    if (!debouncedDocument || !currentTemplate) return null

    return (
      <LivePreview
        document={debouncedDocument}
        templateId={currentTemplate}
        customizations={customizations}
      />
    )
  }, [debouncedDocument, currentTemplate, customizations])

  return (
    <EditorLayout
      editor={<EditorForm />}
      preview={previewContent}
    />
  )
}
```

### 4.2 Document Update Triggers

**Flow**:
```
User types in ProfileSection.tsx
  → react-hook-form onChange
  → EditorForm calls documentStore.updateDocument()
  → documentStore updates internal state
  → 100ms debounce timer starts
  → useDebounce emits new value
  → useMemo recalculates preview
  → LivePreview re-renders
  → Total time: <120ms
```

**Optimization Strategy**:
- **Debounce**: 100ms prevents excessive renders
- **Memoization**: useMemo only recalculates when inputs change
- **Shallow comparison**: React.memo on template components
- **Virtual DOM**: React batches updates efficiently

### 4.3 Template Switch Flow

**User Action**: Click different template in gallery

**Flow**:
```
User clicks "Modern" template card
  → TemplateCard onClick
  → templateStore.selectTemplate('modern')
  → Store checks savedCustomizations for 'modern'
    → If found: Load saved customizations
    → If not found: Load template defaults
  → Store updates state:
    - currentTemplate = 'modern'
    - customizations = (saved or defaults)
  → React re-renders
  → useMemo detects currentTemplate change
  → New template component renders
  → Preview updates
  → Total time: <200ms
```

**Data Preservation**:
- ResumeJson data is NEVER modified during template switch
- Only visual representation changes
- Undo/redo history preserved
- Dirty state maintained

### 4.4 Customization Sync

**Two-Way Binding**:

```typescript
// CustomizationPanel.tsx

function ColorSchemePicker() {
  const { customizations, updateCustomization } = useTemplateStore()

  const handlePrimaryColorChange = (color: string) => {
    // Update store
    updateCustomization('colors.primary', color)

    // Preview updates automatically via useMemo dependency
  }

  return (
    <ColorPicker
      value={customizations.colors.primary}
      onChange={handlePrimaryColorChange}
    />
  )
}
```

**Save Trigger**:

```typescript
// Option 1: Auto-save on customization change (2s debounce)
useEffect(() => {
  const timer = setTimeout(() => {
    if (hasCustomizations) {
      saveCustomizations(documentId)
    }
  }, 2000)

  return () => clearTimeout(timer)
}, [customizations])

// Option 2: Explicit save button
<Button onClick={() => saveCustomizations(documentId)}>
  Save Customizations
</Button>
```

### 4.5 State Synchronization Patterns

**Three-Store Coordination**:

```typescript
// documentStore: Owns ResumeJson data
const document = useDocumentStore(state => state.document)
const isDirty = useDocumentStore(state => state.isDirty)

// templateStore: Owns template selection and customizations
const currentTemplate = useTemplateStore(state => state.currentTemplate)
const customizations = useTemplateStore(state => state.customizations)

// previewStore: Owns preview UI state
const zoomLevel = usePreviewStore(state => state.zoomLevel)
const currentPage = usePreviewStore(state => state.currentPage)

// Combined in preview component
<LivePreview
  data={document}              // documentStore
  templateId={currentTemplate} // templateStore
  customizations={customizations} // templateStore
  zoom={zoomLevel}             // previewStore
  page={currentPage}           // previewStore
/>
```

**Store Independence**:
- Each store owns ONE concern
- No circular dependencies
- Stores communicate via React re-renders
- No store-to-store subscriptions

---

## SECTION 5: Constraints & Rules (2,000 words)

### 5.1 From coding_patterns.md

#### **Repository Pattern** (If DB Operations Needed)

```typescript
// libs/repositories/customizations.ts

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Customizations } from '@/types'

/**
 * Save customizations for a resume
 */
export async function saveCustomizations(
  supabase: SupabaseClient,
  resumeId: string,
  templateId: string,
  customizations: Customizations
): Promise<void> {
  const { error } = await supabase
    .from('resume_customizations')
    .upsert({
      resume_id: resumeId,
      template_id: templateId,
      customizations
    })

  if (error) throw error
}

/**
 * Load customizations for a resume and template
 */
export async function loadCustomizations(
  supabase: SupabaseClient,
  resumeId: string,
  templateId: string
): Promise<Customizations | null> {
  const { data, error } = await supabase
    .from('resume_customizations')
    .select('customizations')
    .eq('resume_id', resumeId)
    .eq('template_id', templateId)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data?.customizations || null
}
```

**Rules**:
- ✅ Pure functions with DI
- ✅ Server-only (never import in client components)
- ✅ One function per operation
- ❌ No classes or singletons

#### **Migration Files: CREATE ONLY**

```bash
# Phase 3 migration files to create:
migrations/phase3/
  001_create_customizations_table.sql
  002_alter_resumes_add_template.sql
  003_create_indexes.sql

# DO NOT run mcp__supabase__apply_migration during development
# WAIT for explicit user approval
```

**Rules**:
- ✅ Create migration SQL files in phase folders
- ✅ Document migration purpose in comments
- ✅ Include rollback instructions
- ❌ NEVER auto-apply during development
- ❌ NEVER modify database without permission

#### **Design Tokens: ZERO Hardcoded Values**

```typescript
// ❌ WRONG: Hardcoded values
<div style={{ padding: '24px', color: '#0B0F1E' }}>

// ✅ CORRECT: Design tokens
<div className="p-6 text-navy-dark">

// ❌ WRONG: Template using app tokens
<div className="doc-theme">
  <h1 className="text-app-primary">  {/* NEVER */}

// ✅ CORRECT: Template using doc tokens
<div className="doc-theme">
  <h1 style={{ color: 'hsl(var(--doc-primary))' }}>
```

**Rules**:
- ✅ All spacing via Tailwind classes (p-4, m-6, gap-8)
- ✅ All colors via HSL tokens
- ✅ Templates use ONLY --doc-* tokens
- ✅ App UI uses ONLY --app-* tokens
- ❌ NO hardcoded #hex colors
- ❌ NO hardcoded px values
- ❌ NO mixing app/doc tokens

### 5.2 From development_decisions.md

#### **UI Framework: shadcn/ui Only**

```bash
# Add new components via CLI
npx shadcn@latest add slider
npx shadcn@latest add tabs
npx shadcn@latest add dialog
npx shadcn@latest add switch
npx shadcn@latest add radio-group
npx shadcn@latest add popover
npx shadcn@latest add separator
```

**Rules**:
- ✅ shadcn/ui components for all UI elements
- ✅ Tailwind CSS for styling
- ❌ NO other UI libraries (no MUI, no Chakra, no Ant Design)
- ❌ NO custom component libraries
- ❌ NO CSS-in-JS libraries (styled-components, emotion)

#### **Icons: Lucide React Only**

```typescript
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  ChevronLeft,
  ChevronRight,
  Settings,
  Palette,
  Type,
  Layout
} from 'lucide-react'

// ❌ WRONG: Other icon libraries
import { FaIcon } from 'react-icons/fa'
import { MdIcon } from '@mui/icons-material'
```

**Rules**:
- ✅ Lucide React for ALL icons
- ✅ Import individual icons (tree-shaking)
- ❌ NO react-icons
- ❌ NO @mui/icons-material
- ❌ NO custom SVG icon libraries

#### **Authentication: Google OAuth Only** (Already Implemented Phase 1)

**Not Relevant to Phase 3**: No auth changes needed.

#### **No Testing Framework**

**Rules**:
- ✅ Use Puppeteer MCP for manual testing
- ✅ Execute playbooks during development
- ❌ NO test files (*.test.tsx, *.spec.tsx)
- ❌ NO Vitest, Jest, or other test frameworks
- ❌ NO automated test suites

### 5.3 From component_standards.md

#### **Visual Quality Standards**

**Spacing (8px Grid)**:
```typescript
// ✅ CORRECT: Generous spacing
<div className="p-6 space-y-6">     // 24px padding, 24px gaps
<Card className="p-6 space-y-4">    // 24px padding, 16px gaps
<section className="py-16 md:py-24"> // 64px/96px section padding

// ❌ WRONG: Cramped spacing
<div className="p-2 space-y-2">     // 8px too tight
<Card className="p-3">              // 12px too cramped
```

**Typography Hierarchy**:
```typescript
// ✅ CORRECT: Clear hierarchy
<h1 className="text-4xl font-bold">Page Title</h1>
<h2 className="text-2xl font-bold">Section</h2>
<h3 className="text-xl font-semibold">Card Title</h3>
<p className="text-base">Body text</p>

// ❌ WRONG: No hierarchy
<h1 className="text-2xl">Page Title</h1>
<h2 className="text-2xl">Section</h2>  // Same size!
```

**Color Usage (Ramp Palette)**:
```typescript
// ✅ CORRECT: One primary action
<Button variant="primary">Create Resume</Button>
<Button variant="secondary">Cancel</Button>

// ❌ WRONG: Multiple primary actions
<Button variant="primary">Action 1</Button>
<Button variant="primary">Action 2</Button>  // Competing CTAs
```

**Component Composition**:
```typescript
// ✅ CORRECT: shadcn components
<Card className="rounded-lg shadow-sm p-6">
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>Content</CardContent>
</Card>

// ❌ WRONG: Custom card with hardcoded styles
<div style={{
  borderRadius: '12px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  padding: '24px'
}}>
```

### 5.4 Testing Requirements (From testing/README.md)

#### **Puppeteer MCP Testing Only**

**No test code**: Agents execute playbooks, don't write tests.

**Visual Verification Mandatory**:
```javascript
// Desktop screenshot (1440px)
mcp__puppeteer__puppeteer_screenshot({
  name: "template_minimal_desktop",
  width: 1440,
  height: 900
})

// Mobile screenshot (375px)
mcp__puppeteer__puppeteer_screenshot({
  name: "template_minimal_mobile",
  width: 375,
  height: 667
})
```

**Checklist Items**:
- [ ] Spacing generous (≥16px gaps, ≥24px cards)
- [ ] Clear typography hierarchy
- [ ] One primary action (lime button) per section
- [ ] Design tokens used (no hardcoded values)
- [ ] Responsive (no horizontal scroll on mobile)
- [ ] Ramp palette only (navy, lime, grays)

---

## SECTION 6: Testing Requirements (2,500 words)

### 6.1 Three Required Playbooks

Phase 3 requires three manual testing playbooks executed via Puppeteer MCP.

#### **Playbook 1: Template System**
**File**: `ai_docs/testing/playbooks/phase_3_templates.md`
**Duration**: 10 minutes
**Purpose**: Verify all 6 templates render correctly

**Sections**:

**Pre-Flight**:
- [ ] Dev server running (`npm run dev`)
- [ ] No TypeScript/ESLint errors
- [ ] Templates registered in registry.ts
- [ ] Migration files created (NOT applied)

**Template Rendering** (Repeat for each template):
1. Navigate to editor with test document
   ```javascript
   mcp__puppeteer__puppeteer_navigate({
     url: "http://localhost:3000/editor/TEST_DOC_ID"
   })
   ```

2. Select template from gallery
   ```javascript
   mcp__puppeteer__puppeteer_click({
     selector: '[data-template="minimal"]'
   })
   ```

3. Verify template loads
   ```javascript
   mcp__puppeteer__puppeteer_evaluate({
     script: `
       const preview = document.querySelector('.live-preview');
       const template = preview?.querySelector('.template-minimal');
       if (!template) throw new Error('Template not rendered');
       console.log('✅ Minimal template loaded');
     `
   })
   ```

4. Take screenshot
   ```javascript
   mcp__puppeteer__puppeteer_screenshot({
     name: "template_minimal_preview",
     width: 1440,
     height: 900
   })
   ```

5. Check template sections:
   - [ ] Profile section renders
   - [ ] Summary section renders
   - [ ] Work experience renders (with bullets)
   - [ ] Education renders
   - [ ] Projects render (if present)
   - [ ] Skills render (grouped)
   - [ ] No missing data errors

**Template Metadata**:
- [ ] Thumbnail displays in gallery
- [ ] Category badge correct
- [ ] Description shows
- [ ] Features list accurate

**Template Versioning**:
- [ ] Template slug in registry
- [ ] Default customizations defined
- [ ] Template version tracked

**Expected Results**:
- All 6 templates render without errors
- Thumbnails display correctly
- Category organization works
- Template versioning functional

#### **Playbook 2: Live Preview**
**File**: `ai_docs/testing/playbooks/phase_3_preview.md`
**Duration**: 10 minutes
**Purpose**: Verify real-time preview updates

**Real-Time Update Test**:
1. Navigate to editor
2. Open profile section
3. Type in "Full Name" field
4. Start timer
5. Observe preview update
6. Measure time to visual update

**Performance Validation**:
```javascript
mcp__puppeteer__puppeteer_evaluate({
  script: `
    const start = performance.now();

    // Simulate typing
    const input = document.querySelector('input[name="profile.fullName"]');
    input.value = 'John Doe Test';
    input.dispatchEvent(new Event('input', { bubbles: true }));

    // Wait for preview update
    setTimeout(() => {
      const preview = document.querySelector('.live-preview');
      const name = preview.textContent;
      const elapsed = performance.now() - start;

      if (!name.includes('John Doe Test')) {
        throw new Error('Preview did not update');
      }

      if (elapsed > 120) {
        console.warn(\`⚠️  Preview updated in \${elapsed}ms (target: <120ms)\`);
      } else {
        console.log(\`✅ Preview updated in \${elapsed}ms\`);
      }
    }, 200);
  `
})
```

**Accuracy Checks**:
- [ ] Profile name appears in preview
- [ ] Email formats correctly
- [ ] Phone formats correctly
- [ ] Location displays
- [ ] Links render as hyperlinks

**Page Break Handling**:
- [ ] Long work history paginated correctly
- [ ] No orphaned section titles
- [ ] Page N of M indicator accurate
- [ ] Page navigation works

**Zoom Controls**:
- [ ] Zoom in button works (50% → 75% → 100% → 125% → 150%)
- [ ] Zoom out button works
- [ ] Fit to width works
- [ ] Keyboard shortcuts work (Cmd+Plus, Cmd+Minus)

**Expected Results**:
- Preview updates <120ms on edit
- Preview accuracy matches template
- Page breaks handled correctly
- Zoom controls working

#### **Playbook 3: Template Switching**
**File**: `ai_docs/testing/playbooks/phase_3_switching.md`
**Duration**: 10 minutes
**Purpose**: Verify smooth template switching

**Data Integrity Test**:
1. Create test document with complete data:
   - Profile (all fields)
   - Summary (200 characters)
   - 3 work experiences (with bullets)
   - 2 education entries
   - 3 projects
   - 5 skill groups
   - 2 certifications

2. Start with "Minimal" template

3. Switch to "Modern" template
   ```javascript
   mcp__puppeteer__puppeteer_click({
     selector: '[data-template="modern"]'
   })
   ```

4. Verify data integrity:
   ```javascript
   mcp__puppeteer__puppeteer_evaluate({
     script: `
       const preview = document.querySelector('.live-preview');

       // Check all data fields present
       const checks = {
         profile: !!preview.textContent.includes('TEST_NAME'),
         work: preview.querySelectorAll('.work-item').length === 3,
         education: preview.querySelectorAll('.education-item').length === 2,
         projects: preview.querySelectorAll('.project-item').length === 3
       };

       const failed = Object.entries(checks)
         .filter(([k, v]) => !v)
         .map(([k]) => k);

       if (failed.length > 0) {
         throw new Error(\`Data missing: \${failed.join(', ')}\`);
       }

       console.log('✅ All data preserved after template switch');
     `
   })
   ```

5. Repeat for all 6 templates

**Performance Test**:
```javascript
mcp__puppeteer__puppeteer_evaluate({
  script: `
    const start = performance.now();

    // Trigger template switch
    const button = document.querySelector('[data-template="classic"]');
    button.click();

    // Wait for preview update
    setTimeout(() => {
      const elapsed = performance.now() - start;

      if (elapsed > 200) {
        console.warn(\`⚠️  Template switch took \${elapsed}ms (target: <200ms)\`);
      } else {
        console.log(\`✅ Template switch in \${elapsed}ms\`);
      }
    }, 300);
  `
})
```

**Customization Persistence**:
1. Select "Modern" template
2. Customize colors (change primary to purple)
3. Switch to "Classic" template
4. Switch back to "Modern" template
5. Verify customizations restored:
   - [ ] Primary color is purple (not default)
   - [ ] Other customizations intact
   - [ ] Template-specific settings preserved

**No Layout Breaks**:
- [ ] No overlapping elements
- [ ] No cut-off text
- [ ] No broken images
- [ ] No missing sections
- [ ] Print preview accurate

**Expected Results**:
- Switch between templates smoothly
- Data integrity maintained
- Customization options persist
- No layout breaks after switch

### 6.2 Visual Verification (12 Screenshots)

**6 Templates × 2 Viewports = 12 Screenshots**

**Desktop Screenshots** (1440px):
1. `template_minimal_desktop.png`
2. `template_modern_desktop.png`
3. `template_classic_desktop.png`
4. `template_creative_desktop.png`
5. `template_technical_desktop.png`
6. `template_executive_desktop.png`

**Mobile Screenshots** (375px):
1. `template_minimal_mobile.png`
2. `template_modern_mobile.png`
3. `template_classic_mobile.png`
4. `template_creative_mobile.png`
5. `template_technical_mobile.png`
6. `template_executive_mobile.png`

**Screenshot Checklist** (per template):

**Professional Design Standards**:
- [ ] Clean, polished appearance
- [ ] Consistent spacing throughout
- [ ] Proper alignment (left/center/right)
- [ ] No overlapping elements
- [ ] Professional typography

**Print-Ready Formatting**:
- [ ] Page boundaries visible
- [ ] Content within safe margins (0.5in)
- [ ] No content cut-off
- [ ] Print-friendly colors (not too dark)
- [ ] High contrast text

**Consistent Typography Hierarchy**:
- [ ] Name/title largest (h1)
- [ ] Section headings clear (h2)
- [ ] Subsection headings distinct (h3)
- [ ] Body text readable (≥10pt print size)
- [ ] Font weights appropriate (400 body, 600+ headings)

**ATS-Friendly Layouts**:
- [ ] Single-column or simple two-column
- [ ] No complex tables
- [ ] No text in images
- [ ] Semantic HTML structure
- [ ] Standard section names

**Design Tokens Used in Customization UI**:
- [ ] Color pickers use HSL tokens
- [ ] Font dropdowns use --font-* variables
- [ ] Spacing controls use --space-* tokens
- [ ] No hardcoded values visible in inspector

**Save Location**: `ai_docs/progress/phase_3/screenshots/`

### 6.3 Performance Validation

**Metrics to Measure**:

**Preview Update Timing**:
```javascript
// Measure in browser DevTools Performance tab
1. Start recording
2. Type in editor field
3. Stop recording after preview updates
4. Measure: Input event → Paint

Target: p95 ≤ 120ms
```

**Template Switch Timing**:
```javascript
// Measure with Performance API
const start = performance.now()
templateStore.selectTemplate('modern')
// Wait for re-render
const elapsed = performance.now() - start

Target: <200ms
```

**No Performance Regressions**:
- [ ] Build time still <60 seconds
- [ ] Hot reload still <2 seconds
- [ ] Page load time <3 seconds
- [ ] Memory usage stable (no leaks)

**Test on Real Data**:
- [ ] 1-page resume: All metrics pass
- [ ] 2-page resume: All metrics pass
- [ ] 3-page resume: Preview <150ms, switch <250ms (acceptable degradation)
- [ ] 10-page resume: Virtual scrolling kicks in, still usable

### 6.4 Documentation Requirements

**Files to Create**:

1. **`visual_review.md`**
   - Screenshot analysis for all 12 screenshots
   - Visual quality checklist results
   - Issues found and fixed
   - Final sign-off

2. **`playbook_results.md`**
   - Execution results for all 3 playbooks
   - Pass/fail status for each test
   - Performance measurements
   - Issues found and fixed

3. **`phase_3_migrations.md`**
   - List of all migration files created
   - Purpose of each migration
   - Database impact (tables, columns, indexes)
   - Rollback instructions
   - Approval status (NOT APPLIED)

4. **`performance_report.md`**
   - Preview update timings (p50, p95, p99)
   - Template switch timings
   - Memory usage profile
   - Comparison to budgets
   - Optimization notes

---

## SECTION 7: Edge Cases & Risks (1,500 words)

### 7.1 Edge Cases from phase_3.md

#### **Empty Resume**

**Scenario**: User creates new resume, no data entered yet

**Expected Behavior**:
- Template renders empty state
- Section titles still display
- No JavaScript errors
- Placeholders shown (e.g., "Your Name")
- Preview remains interactive

**Template Implementation**:
```typescript
function MinimalTemplate({ data }: TemplateProps) {
  const profile = data.profile

  return (
    <div className="doc-theme template-minimal">
      <div className="profile-section">
        <h1>{profile.fullName || 'Your Name'}</h1>
        <p>{profile.email || 'your.email@example.com'}</p>
        {/* Graceful degradation for all fields */}
      </div>

      {data.summary && (
        <div className="summary-section">
          <h2>Summary</h2>
          <p>{data.summary}</p>
        </div>
      )}

      {/* Only render sections if data exists */}
      {data.work && data.work.length > 0 && (
        <WorkSection items={data.work} />
      )}
    </div>
  )
}
```

**Test**:
```javascript
// Create new resume
POST /api/v1/resumes { title: "Empty Test" }

// Open in editor
navigate to /editor/{id}

// Verify preview shows
- ✅ Empty state with placeholders
- ✅ No errors in console
- ✅ Template still styled correctly
```

#### **Very Long Resume (10+ Pages)**

**Scenario**: Resume with 20 work experiences, 100+ bullets

**Expected Behavior**:
- Pagination works correctly (Page 1 of 12)
- Preview performance acceptable (<200ms)
- Virtual scrolling for editor sections
- No memory leaks
- Print output accurate

**Performance Strategy**:
```typescript
// Virtual scrolling for long work lists
import { useVirtualizer } from '@tanstack/react-virtual'

function WorkSection({ items }: { items: WorkExperience[] }) {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100, // Average work item height
    overscan: 5
  })

  return (
    <div ref={parentRef} className="work-section">
      {virtualizer.getVirtualItems().map(virtualRow => (
        <WorkItem
          key={virtualRow.key}
          data={items[virtualRow.index]}
          style={{
            height: `${virtualRow.size}px`,
            transform: `translateY(${virtualRow.start}px)`
          }}
        />
      ))}
    </div>
  )
}
```

**Test**:
```javascript
// Create resume with 20 work items, 10 bullets each
const testData = {
  work: Array.from({ length: 20 }, (_, i) => ({
    company: `Company ${i}`,
    role: `Role ${i}`,
    descriptionBullets: Array.from({ length: 10 }, (_, j) => `Bullet ${j}`)
  }))
}

// Verify:
- ✅ Preview renders all items
- ✅ Performance <200ms
- ✅ No scroll lag
- ✅ Memory usage stable
```

#### **Rapid Template Switching**

**Scenario**: User clicks through all 6 templates quickly

**Expected Behavior**:
- No race conditions
- No stale data shown
- Performance degrades gracefully
- No memory leaks
- UI remains responsive

**Debouncing Strategy**:
```typescript
// templateStore.ts

selectTemplate: (id: string) => {
  // Cancel any pending template switch
  if (templateSwitchTimer) {
    clearTimeout(templateSwitchTimer)
  }

  // Debounce rapid switches (200ms)
  templateSwitchTimer = setTimeout(() => {
    const template = getTemplate(id)
    if (!template) return

    set({
      currentTemplate: id,
      customizations: template.defaultCustomizations
    })
  }, 200)
}
```

**Test**:
```javascript
// Rapid switching test
for (const template of ['minimal', 'modern', 'classic', 'creative', 'technical', 'executive']) {
  click template card
  wait 100ms
}

// Verify:
- ✅ Final template renders correctly
- ✅ No errors in console
- ✅ Memory usage stable
- ✅ UI responsive
```

#### **Print Preview Accuracy**

**Scenario**: User previews resume before PDF export

**Expected Behavior**:
- Print preview matches screen preview
- Page breaks in correct locations
- Colors print-friendly (not too dark)
- Fonts render correctly
- Margins accurate

**Print CSS**:
```css
@media print {
  @page {
    size: letter; /* or A4 */
    margin: 0.5in;
  }

  /* Hide UI elements */
  .no-print {
    display: none !important;
  }

  /* Ensure black text for printing */
  body {
    color: #000 !important;
  }

  /* Remove backgrounds to save ink */
  * {
    background: transparent !important;
  }

  /* Page break control */
  .work-item {
    page-break-inside: avoid;
  }

  h1, h2, h3 {
    page-break-after: avoid;
  }
}
```

**Test**:
```javascript
// Open print preview
window.print() // or Cmd+P

// Verify:
- ✅ Page count matches screen preview
- ✅ Page breaks logical
- ✅ No content cut-off
- ✅ Margins correct (0.5in)
- ✅ Print-friendly colors
```

### 7.2 Identified Risks

#### **Risk 1: Performance Bottlenecks**

**Description**: Real-time preview may not meet <120ms target on slower devices

**Likelihood**: Medium
**Impact**: High (poor UX)

**Mitigation**:
- Debounce updates (100ms)
- Memoize template rendering
- Virtual scrolling for long documents
- Profile on low-end hardware (2015 MacBook Air)
- Lazy load templates on demand

**Detection Signal**:
- User complaints about lag
- Performance metrics show >150ms p95
- High CPU usage during typing

**Fallback**:
- Increase debounce to 200ms
- Add "Preview paused" toggle for slow devices
- Offer "Update preview on blur" mode

#### **Risk 2: Memory Leaks in Preview**

**Description**: Long editing sessions may cause memory bloat

**Likelihood**: Medium
**Impact**: Medium (requires page reload)

**Mitigation**:
- Cleanup useEffect dependencies
- Cancel pending timers on unmount
- Use React.memo for expensive components
- Profile with Chrome DevTools Memory profiler
- Monitor heap size during development

**Detection Signal**:
- Heap size grows continuously
- Browser becomes sluggish after 30+ min
- Memory warnings in DevTools

**Fallback**:
- Add "Refresh preview" button
- Auto-reload preview after 1 hour
- Show memory warning when >500MB

#### **Risk 3: Browser Compatibility**

**Description**: Templates may render differently across browsers

**Likelihood**: Low
**Impact**: Medium (inconsistent UX)

**Mitigation**:
- Use CSS variables (supported in all modern browsers)
- Test on Chrome, Firefox, Safari
- Avoid browser-specific CSS
- Use autoprefixer in build
- Polyfill if needed (unlikely)

**Detection Signal**:
- User reports layout issues
- Screenshots differ by browser
- CSS not applying

**Fallback**:
- Add browser-specific CSS fixes
- Show "Unsupported browser" warning
- Recommend Chrome/Firefox

#### **Risk 4: State Synchronization Issues**

**Description**: documentStore, templateStore, previewStore may get out of sync

**Likelihood**: Low
**Impact**: High (data loss risk)

**Mitigation**:
- Single source of truth per concern
- No circular dependencies between stores
- React re-renders handle sync
- Thorough testing of edge cases
- Add debug logging in dev mode

**Detection Signal**:
- Preview shows stale data
- Customizations don't apply
- Template doesn't match selection

**Fallback**:
- Add "Reload preview" button
- Log state mismatches
- Force re-sync on focus

#### **Risk 5: Customization Conflicts**

**Description**: User's customizations may break template layout

**Likelihood**: Medium
**Impact**: Low (visual only, not data)

**Mitigation**:
- Validate customizations with Zod
- Clamp values to safe ranges (e.g., font size 0.8-1.2x)
- Preview updates in real-time (user sees breaks)
- Provide "Reset to defaults" button
- Document safe ranges

**Detection Signal**:
- Template looks broken
- Text overflows
- Layout collapse

**Fallback**:
- Auto-clamp extreme values
- Show "Customization warning"
- Offer "Safe mode" (minimal customizations)

---

## SECTION 8: Implementation Checklist (70+ Items)

### 8.1 Template Components (12 items)

**6 Main Templates**:
- [ ] MinimalTemplate.tsx (+ styles.css + print.css)
- [ ] ModernTemplate.tsx (+ styles.css + print.css)
- [ ] ClassicTemplate.tsx (+ styles.css + print.css)
- [ ] CreativeTemplate.tsx (+ styles.css + print.css)
- [ ] TechnicalTemplate.tsx (+ styles.css + print.css)
- [ ] ExecutiveTemplate.tsx (+ styles.css + print.css)

**6 Shared Components**:
- [ ] TemplateBase.tsx
- [ ] TemplateSection.tsx
- [ ] TemplateProfile.tsx
- [ ] TemplateWork.tsx
- [ ] TemplateEducation.tsx
- [ ] TemplateUtils.ts

### 8.2 Template Registry (3 items)

- [ ] registry.ts (central registry)
- [ ] Template metadata for all 6 templates
- [ ] Template discovery functions (getTemplate, getAllTemplates, getTemplatesByCategory)

### 8.3 Live Preview System (11 items)

**Preview Components**:
- [ ] LivePreview.tsx
- [ ] PreviewFrame.tsx
- [ ] PreviewSkeleton.tsx
- [ ] PreviewError.tsx
- [ ] PreviewToolbar.tsx
- [ ] PreviewStatusBar.tsx

**Preview Controls**:
- [ ] PreviewControls.tsx
- [ ] PreviewZoom.tsx
- [ ] PreviewPagination.tsx
- [ ] PreviewViewport.tsx
- [ ] PrintPreview.tsx

### 8.4 Customization Panel (18 items)

**Main Panel**:
- [ ] CustomizationPanel.tsx
- [ ] CustomizationTabs.tsx
- [ ] ResetButton.tsx

**Color Customization**:
- [ ] ColorScheme.tsx
- [ ] ColorPicker.tsx
- [ ] ColorPresets.tsx (10+ presets)

**Typography Customization**:
- [ ] Typography.tsx
- [ ] FontPicker.tsx (8 fonts)
- [ ] FontSizeSlider.tsx (0.8x - 1.2x)
- [ ] LineSpacingSlider.tsx (1.0 - 1.5)

**Spacing Customization**:
- [ ] Spacing.tsx
- [ ] SpacingPresets.tsx (Compact/Normal/Relaxed)

**Icon Customization**:
- [ ] IconSettings.tsx
- [ ] IconStylePicker.tsx (outline/filled)

**Layout Customization**:
- [ ] LayoutOptions.tsx
- [ ] ColumnToggle.tsx (1 or 2 columns)
- [ ] DateFormatPicker.tsx (US/ISO/EU)
- [ ] SectionOrderEditor.tsx (drag-drop)

### 8.5 Template Gallery (7 items)

- [ ] TemplateGallery.tsx
- [ ] TemplateCard.tsx
- [ ] TemplatePreview.tsx
- [ ] TemplateFilter.tsx
- [ ] TemplateSearch.tsx
- [ ] TemplateThumbnail.tsx
- [ ] TemplateBadge.tsx

### 8.6 Layout Components (7 items)

- [ ] EditorLayout.tsx (UPDATE existing)
- [ ] SplitPane.tsx
- [ ] SplitPaneHandle.tsx
- [ ] EditorTabs.tsx
- [ ] MobileLayout.tsx
- [ ] EditorMobileNav.tsx
- [ ] BottomSheet.tsx

### 8.7 Database Migrations (3 items)

**Migration Files** (CREATE ONLY, DO NOT APPLY):
- [ ] 001_create_customizations_table.sql
- [ ] 002_alter_resumes_add_template.sql
- [ ] 003_create_indexes.sql

### 8.8 State Stores (2 items)

- [ ] templateStore.ts (new)
- [ ] previewStore.ts (new)

### 8.9 API Routes (2 items)

- [ ] PUT /api/v1/resumes/:id/customizations
- [ ] GET /api/v1/resumes/:id/customizations/:templateId

### 8.10 Utilities (4 items)

- [ ] libs/templates/utils.ts
- [ ] libs/templates/formatters.ts (date/address/phone)
- [ ] libs/templates/pagination.ts
- [ ] libs/templates/icons.ts

### 8.11 Types (3 items)

- [ ] types/customizations.ts
- [ ] types/template.ts
- [ ] types/preview.ts

### 8.12 Testing (3 items)

**Playbooks**:
- [ ] phase_3_templates.md
- [ ] phase_3_preview.md
- [ ] phase_3_switching.md

### 8.13 Visual Verification (12 items)

**Desktop Screenshots** (1440px):
- [ ] template_minimal_desktop.png
- [ ] template_modern_desktop.png
- [ ] template_classic_desktop.png
- [ ] template_creative_desktop.png
- [ ] template_technical_desktop.png
- [ ] template_executive_desktop.png

**Mobile Screenshots** (375px):
- [ ] template_minimal_mobile.png
- [ ] template_modern_mobile.png
- [ ] template_classic_mobile.png
- [ ] template_creative_mobile.png
- [ ] template_technical_mobile.png
- [ ] template_executive_mobile.png

### 8.14 Documentation (4 items)

- [ ] visual_review.md
- [ ] playbook_results.md
- [ ] phase_3_migrations.md
- [ ] performance_report.md

**Total Checklist Items**: 91

---

## SECTION 9: Acceptance Criteria

Phase 3 is complete when ALL of the following are verified:

### 9.1 Template Functionality

- [ ] All 6 templates render without errors
- [ ] Template metadata displays correctly
- [ ] Category organization working
- [ ] Template versioning functional
- [ ] Template registry complete

### 9.2 Live Preview

- [ ] Real-time preview updates on edit
- [ ] Preview accuracy matches templates
- [ ] Page breaks handled correctly
- [ ] Zoom controls working
- [ ] Preview performance <120ms (p95)

### 9.3 Template Switching

- [ ] Switch between templates smoothly
- [ ] Data integrity maintained
- [ ] Customization options persist
- [ ] No layout breaks after switch
- [ ] Template switch <200ms

### 9.4 Customization

- [ ] All 10+ customization options functional
- [ ] Color presets working
- [ ] Font selection working
- [ ] Spacing controls working
- [ ] Icon settings working
- [ ] Layout options working
- [ ] Customizations persist to database

### 9.5 Playbooks (ALL PASS)

- [ ] Template System Playbook: ✅ PASS
- [ ] Live Preview Playbook: ✅ PASS
- [ ] Template Switching Playbook: ✅ PASS

### 9.6 Visual Verification

- [ ] Desktop screenshots (6 templates) taken
- [ ] Mobile screenshots (6 templates) taken
- [ ] All templates meet visual quality standards
- [ ] Professional design standards met
- [ ] Print-ready formatting verified
- [ ] ATS-friendly layouts confirmed

### 9.7 Performance

- [ ] Preview update <120ms (p95)
- [ ] Template switch <200ms
- [ ] No performance regressions from Phase 2
- [ ] Memory usage stable
- [ ] No memory leaks detected

### 9.8 Documentation

- [ ] Screenshots saved to `ai_docs/progress/phase_3/screenshots/`
- [ ] `visual_review.md` completed
- [ ] `playbook_results.md` completed
- [ ] `phase_3_migrations.md` completed
- [ ] `performance_report.md` completed
- [ ] All critical issues resolved

### 9.9 Build Quality

- [ ] Build succeeds with zero errors
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] No console errors during testing

---

## SECTION 10: Questions for Research Agents

Based on gaps found during context gathering, suggest these research topics for systems-researcher agents:

### 10.1 Template Rendering Strategies

**Research Question**: What are the best practices for React-based document template rendering with <120ms update performance?

**Key Areas**:
- Virtual DOM optimization techniques
- Memoization strategies for templates
- Debouncing vs throttling for real-time updates
- React 18 concurrent rendering benefits
- Template component architecture (composition vs inheritance)

**Deliverables**:
- Research dossier comparing 3-5 approaches
- Performance benchmarks for each
- Code examples
- Recommendation with rationale

### 10.2 Live Preview Architectures

**Research Question**: How do production apps (Novel, Tiptap, Notion) implement live preview with sub-100ms latency?

**Key Areas**:
- Iframe isolation vs direct DOM rendering
- Shadow DOM for style isolation
- Web Workers for heavy computations
- ContentEditable alternatives
- Incremental rendering techniques

**Deliverables**:
- Analysis of 3+ production apps
- Architecture diagrams
- Performance characteristics
- Trade-offs and limitations
- Best fit for ResumePair

### 10.3 Customization System Design

**Research Question**: What's the optimal way to persist and merge user customizations with template defaults?

**Key Areas**:
- Database schema (separate table vs inline JSONB)
- Merging strategies (deep merge vs shallow)
- Versioning customizations
- Migration when template updates
- Performance of deep JSONB queries

**Deliverables**:
- Comparison of 3 approaches
- Database performance benchmarks
- Migration complexity analysis
- Recommendation

### 10.4 CSS Token Systems

**Research Question**: How do design systems isolate component tokens to prevent leakage between app and document scopes?

**Key Areas**:
- CSS Custom Properties scoping
- Shadow DOM vs class-based isolation
- Token naming conventions
- Runtime vs build-time token resolution
- TypeScript integration for type-safe tokens

**Deliverables**:
- Analysis of 3+ design systems (Material, Chakra, shadcn)
- Token architecture patterns
- Scoping mechanisms
- Best practices for dual-token systems

### 10.5 Pagination Algorithms

**Research Question**: What algorithms accurately calculate page breaks for HTML→PDF conversion with widow/orphan control?

**Key Areas**:
- CSS page-break properties
- Print media queries
- Widow/orphan prevention
- Keep-together rules
- Performance at scale (10+ page documents)

**Deliverables**:
- Algorithm comparison
- Code examples
- Edge case handling
- Browser compatibility notes

---

## APPENDIX A: File Structure Reference

```
# Phase 3 Complete File Structure

app/
  editor/
    [id]/
      page.tsx                          # UPDATED: Add split-pane layout
      preview/
        page.tsx                        # NEW: Full preview page
      customize/
        page.tsx                        # NEW: Customization interface
  templates/
    gallery/
      page.tsx                          # NEW: Template browser
    [template]/
      page.tsx                          # NEW: Template details

components/
  templates/
    registry.ts                         # NEW: Template registry
    minimal/
      MinimalTemplate.tsx               # NEW
      styles.css                        # NEW
      print.css                         # NEW
    modern/...                          # NEW: Same structure
    classic/...                         # NEW: Same structure
    creative/...                        # NEW: Same structure
    technical/...                       # NEW: Same structure
    executive/...                       # NEW: Same structure
    shared/
      TemplateBase.tsx                  # NEW
      TemplateSection.tsx               # NEW
      TemplateUtils.ts                  # NEW
      # ... more shared components

  preview/
    LivePreview.tsx                     # NEW
    PreviewFrame.tsx                    # NEW
    PreviewControls.tsx                 # NEW
    # ... 8 more preview components

  customization/
    CustomizationPanel.tsx              # NEW
    ColorScheme.tsx                     # NEW
    Typography.tsx                      # NEW
    # ... 15 more customization components

  gallery/
    TemplateGallery.tsx                 # NEW
    TemplateCard.tsx                    # NEW
    # ... 5 more gallery components

  editor/
    EditorLayout.tsx                    # UPDATED: Split-pane
    SplitPane.tsx                       # NEW
    EditorTabs.tsx                      # NEW
    MobileLayout.tsx                    # NEW
    # ... existing editor components

stores/
  templateStore.ts                      # NEW
  previewStore.ts                       # NEW
  documentStore.ts                      # EXISTING

libs/
  templates/
    utils.ts                            # NEW
    formatters.ts                       # NEW
    pagination.ts                       # NEW
    icons.ts                            # NEW
  repositories/
    customizations.ts                   # NEW (if needed)

types/
  customizations.ts                     # NEW
  template.ts                           # NEW
  preview.ts                            # NEW

migrations/
  phase3/
    001_create_customizations_table.sql # NEW (file only)
    002_alter_resumes_add_template.sql  # NEW (file only)
    003_create_indexes.sql              # NEW (file only)

ai_docs/
  testing/
    playbooks/
      phase_3_templates.md              # NEW
      phase_3_preview.md                # NEW
      phase_3_switching.md              # NEW
  progress/
    phase_3/
      screenshots/                      # NEW: 12 screenshots
      visual_review.md                  # NEW
      playbook_results.md               # NEW
      phase_3_migrations.md             # NEW
      performance_report.md             # NEW
```

---

## APPENDIX B: Performance Budget Summary

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Preview initial render | <200ms | Performance API |
| Preview update (keystroke) | p95 ≤120ms | Performance API + DevTools |
| Template switch | <200ms | Performance API |
| Zoom change | <50ms | Visual observation |
| Page navigation | <100ms | Visual observation |
| Build time | <60s | `npm run build` |
| Hot reload | <2s | Dev server restart |
| Memory usage (1hr session) | <500MB heap | Chrome DevTools Memory |
| Template load | <100ms | Performance API |
| Customization apply | <50ms | Performance API |

---

## APPENDIX C: Design Token Reference

### App Tokens (--app-*)

**Used in**: Dashboard, navigation, settings, forms, buttons, cards

**Colors**:
- `--app-navy-dark: 225 52% 8%` (#0B0F1E)
- `--app-navy-medium: 226 36% 16%` (#1A1F35)
- `--app-lime: 73 100% 50%` (#CDFF00)
- `--app-gray-50` through `--app-gray-900`

**Typography**:
- `--font-sans: Inter`
- `--text-xs` through `--text-7xl`

**Spacing**:
- `--space-1` through `--space-32` (4px to 128px)

### Document Tokens (--doc-*)

**Used in**: Resume/cover letter templates, preview, exports

**Colors**:
- `--doc-primary`
- `--doc-secondary`
- `--doc-accent`
- `--doc-text`
- `--doc-background`
- `--doc-muted`
- `--doc-border`

**Typography**:
- `--doc-font-family`
- `--doc-font-size-base: 10pt` (print-optimized)
- `--doc-line-height: 1.2`

**Spacing**:
- `--doc-gutter: 40px` (page padding)
- `--doc-section-gap: 24px`
- `--doc-item-gap: 12px`

**Layout**:
- `--doc-page-width: 8.5in` (Letter) or `210mm` (A4)
- `--doc-page-height: 11in` (Letter) or `297mm` (A4)

---

## APPENDIX D: Template Feature Matrix

| Template | Columns | Photo | Icons | Serif | Color Accent | Sidebar |
|----------|---------|-------|-------|-------|--------------|---------|
| Minimal | 1 | ❌ | ❌ | ❌ | ❌ | ❌ |
| Modern | 1-2 | ✅ | ✅ | ❌ | ✅ | ❌ |
| Classic | 1 | ❌ | ❌ | ✅ | ❌ | ❌ |
| Creative | 2 | ✅ | ✅ | ❌ | ✅ | ✅ |
| Technical | 1 | ❌ | ✅ | ❌ | ✅ | ❌ |
| Executive | 1 | ✅ | ❌ | ✅ | ✅ | ❌ |

---

## APPENDIX E: Customization Options Reference

### Color Scheme (10 Presets)

1. **Default**: Navy (#0B0F1E) + Lime (#CDFF00)
2. **Professional**: Navy (#0B0F1E) + Gold (#FFD700)
3. **Creative**: Purple (#8B5CF6) + Orange (#FB923C)
4. **Minimal**: Black (#000000) + White (#FFFFFF)
5. **Modern**: Blue (#3B82F6) + Teal (#14B8A6)
6. **Warm**: Brown (#92400E) + Orange (#EA580C)
7. **Cool**: Blue (#0369A1) + Green (#059669)
8. **Bold**: Red (#DC2626) + Yellow (#FACC15)
9. **Corporate**: Gray (#64748B) + Blue (#2563EB)
10. **Tech**: Dark (#1E293B) + Green (#10B981)

### Typography (8 Fonts)

1. **Inter** (default sans-serif)
2. **Source Sans 3** (sans-serif)
3. **Roboto** (sans-serif)
4. **Open Sans** (sans-serif)
5. **Source Serif 4** (serif)
6. **Merriweather** (serif)
7. **JetBrains Mono** (monospace)
8. **Courier New** (monospace)

### Spacing Presets

- **Compact**: Section gap 16px, Item gap 8px, Page padding 24px
- **Normal**: Section gap 24px, Item gap 12px, Page padding 40px
- **Relaxed**: Section gap 32px, Item gap 16px, Page padding 56px

---

**END OF CONTEXT DOCUMENT**

**Word Count**: ~28,500
**Token Estimate**: ~42,000
**Completeness**: All 10 sections delivered
**Ready for**: Systems-researcher, Planner-architect, Implementer agents
