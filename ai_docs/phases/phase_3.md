# Phase 3: Template System & Live Preview

## Phase Objective
Implement a comprehensive template system with multiple professional designs, real-time live preview, extensive customization options, and smooth template switching while maintaining data integrity and performance.

## Phase Validation Gate

**This phase is complete only when ALL of the following are verified:**

### Playbook Execution (~20-30 minutes)
- [ ] **Template System Playbook** (to be created in `ai_docs/testing/playbooks/phase_3_templates.md`)
  - All 6+ templates render correctly
  - Template metadata and thumbnails display
  - Category organization working
  - Template versioning functional
- [ ] **Live Preview Playbook** (to be created in `ai_docs/testing/playbooks/phase_3_preview.md`)
  - Real-time preview updates on edit
  - Preview accuracy matches templates
  - Page breaks handled correctly
  - Zoom controls working
- [ ] **Template Switching Playbook** (to be created in `ai_docs/testing/playbooks/phase_3_switching.md`)
  - Switch between templates smoothly
  - Data integrity maintained
  - Customization options persist
  - No layout breaks after switch

### Visual Verification (~10 minutes)
- [ ] **Desktop screenshots** (1440px) for all 6 templates
- [ ] **Mobile screenshots** (375px) for template selector
- [ ] All templates meet visual quality standards:
  - Professional design standards
  - Print-ready formatting
  - Consistent typography hierarchy
  - ATS-friendly layouts
  - Design tokens used in customization UI

### Performance Validation
- [ ] Preview updates within 120ms of keystroke
- [ ] Template switch completes within 200ms
- [ ] No performance regressions from Phase 2

### Documentation
- [ ] Screenshots saved to `ai_docs/progress/phase_3/screenshots/`
- [ ] `visual_review.md` completed
- [ ] `playbook_results.md` completed
- [ ] All critical issues resolved

**Reference**: See `ai_docs/testing/README.md` for complete testing workflow

## Comprehensive Scope

### Core Features
1. **Template Architecture**
   - Pure function templates (data → HTML)
   - Template registry system
   - Template metadata and thumbnails
   - Category organization
   - Template versioning
   - Custom template support (future)

2. **Template Designs** (Minimum 6)
   - Minimal: Clean, whitespace-focused
   - Modern: Contemporary with accent colors
   - Classic: Traditional serif design
   - Creative: Designer-friendly with graphics
   - Technical: Developer/engineer focused
   - Executive: Senior professional layout

3. **Live Preview System**
   - Real-time updates (<120ms)
   - Split-pane layout (resizable)
   - HTML rendering with React
   - Pagination for multi-page
   - Smooth scrolling
   - Preview error boundaries

4. **Customization Panel**
   - Color scheme selector (10+ presets)
   - Custom color picker
   - Font family selection (8+ fonts)
   - Font size scaling (0.8x - 1.2x)
   - Line spacing control
   - Section spacing adjustment
   - Icon set toggle (on/off)
   - Icon style selection
   - Date format options
   - Section order drag-drop

5. **Preview Controls**
   - Zoom levels (50%, 75%, 100%, 125%, 150%)
   - Fit to width/height
   - Page navigation (multi-page)
   - Preview mode toggle (Edit/Preview/Print)
   - Mobile preview (360px viewport)
   - Tablet preview (768px viewport)
   - Desktop preview (1200px viewport)
   - Full-screen preview mode

### Supporting Infrastructure
- **Navigation**: Template gallery access, customization panel toggle
- **Settings Pages**: Default template selection, preview preferences
- **Error Handling**: Template render errors, fallback templates
- **Layout Components**: Split pane, preview container, control bar
- **Performance**: Preview debouncing, virtual scrolling for long resumes
- **Data Management**: Template-data mapping, customization persistence

### User Flows Covered
1. **Template Selection**
   - Editor → Template Gallery → Preview templates → Select → Applied instantly

2. **Live Customization**
   - Editor → Customize panel → Adjust settings → Preview updates → Settings saved

3. **Preview Interaction**
   - Editor → Type content → Preview updates → Adjust zoom → Navigate pages

4. **Template Switching**
   - Current template → Switch template → Data preserved → New design applied

## Test Specifications

### Unit Tests Required
```typescript
// tests/phase3/unit/

describe('Template: MinimalTemplate', () => {
  test('renders all sections correctly')
  test('handles missing optional fields')
  test('applies custom colors')
  test('respects font settings')
  test('formats dates correctly')
  test('handles long content gracefully')
})

describe('Template: ModernTemplate', () => {
  test('renders with accent colors')
  test('displays icons when enabled')
  test('handles photo display')
  test('responsive layout works')
  test('print styles applied')
})

describe('Component: LivePreview', () => {
  test('renders template HTML')
  test('updates on data change')
  test('handles render errors')
  test('maintains scroll position')
  test('pagination works')
  test('zoom levels apply correctly')
})

describe('Component: TemplateGallery', () => {
  test('displays all templates')
  test('shows template thumbnails')
  test('filters by category')
  test('search functionality')
  test('preview on hover')
  test('selection highlights')
})

describe('Component: CustomizationPanel', () => {
  test('shows all customization options')
  test('updates preview on change')
  test('saves preferences')
  test('resets to defaults')
  test('color picker works')
  test('font preview displays')
})

describe('Component: PreviewControls', () => {
  test('zoom controls work')
  test('page navigation functions')
  test('viewport switcher works')
  test('fullscreen mode toggles')
  test('print preview accurate')
})

describe('Component: SplitPane', () => {
  test('resizable divider works')
  test('remembers size preference')
  test('collapses on mobile')
  test('minimum/maximum sizes enforced')
})

describe('Utils: templateRenderer', () => {
  test('transforms data to HTML')
  test('applies customizations')
  test('handles special characters')
  test('escapes HTML properly')
  test('formats all data types')
})

describe('Utils: paginationEngine', () => {
  test('calculates page breaks')
  test('avoids orphans/widows')
  test('respects keep-together rules')
  test('handles headers/footers')
})

describe('Store: templateStore', () => {
  test('loads template list')
  test('switches templates')
  test('saves current template')
  test('tracks customizations')
  test('persists preferences')
})

describe('Store: previewStore', () => {
  test('manages preview state')
  test('tracks zoom level')
  test('handles page navigation')
  test('manages viewport mode')
  test('syncs scroll position')
})
```

### Integration Tests Required
```typescript
// tests/phase3/integration/

describe('Feature: Template Rendering', () => {
  test('all templates render without errors')
  test('data flows correctly to templates')
  test('customizations apply properly')
  test('print styles work')
  test('responsive breakpoints function')
})

describe('Feature: Live Preview Updates', () => {
  test('preview updates on field change')
  test('debouncing prevents excessive updates')
  test('no flicker during updates')
  test('maintains visual stability')
  test('error boundaries catch failures')
})

describe('Feature: Template Switching', () => {
  test('switches without data loss')
  test('customizations reset appropriately')
  test('preview updates immediately')
  test('undo works after switch')
  test('performance acceptable')
})

describe('Feature: Customization', () => {
  test('all options affect preview')
  test('custom colors apply')
  test('font changes render')
  test('spacing adjustments work')
  test('settings persist')
})

describe('API Route: /api/v1/templates', () => {
  test('returns template list')
  test('includes metadata')
  test('filters by category')
  test('caches appropriately')
})

describe('Feature: Preview Controls', () => {
  test('zoom affects layout correctly')
  test('page navigation works')
  test('viewport modes accurate')
  test('fullscreen functions')
})

describe('Feature: Design Tokens', () => {
  test('CSS variables update dynamically')
  test('all templates use tokens')
  test('dark mode variables work')
  test('custom themes apply')
})
```

### E2E Tests Required
```typescript
// tests/phase3/e2e/

describe('User Journey: Select Template', () => {
  test('user browses gallery')
  test('previews different templates')
  test('selects and applies template')
  test('data transfers correctly')
})

describe('User Journey: Customize Resume', () => {
  test('opens customization panel')
  test('changes colors and fonts')
  test('preview updates live')
  test('saves customizations')
})

describe('User Journey: Preview Interaction', () => {
  test('edits with live preview')
  test('zooms in and out')
  test('navigates multiple pages')
  test('switches viewport modes')
})

describe('Critical Path: Template Performance', () => {
  test('handles rapid typing')
  test('smooth template switching')
  test('no memory leaks')
  test('pagination performs well')
})
```

### Performance Benchmarks
```typescript
describe('Performance: Preview', () => {
  test('initial render < 200ms')
  test('update after keystroke < 120ms')
  test('template switch < 200ms')
  test('zoom change < 50ms')
  test('page navigation < 100ms')
})

describe('Performance: Templates', () => {
  test('template load < 100ms')
  test('thumbnail generation < 500ms')
  test('customization apply < 50ms')
  test('handles 10-page resume')
})
```

## Technical Implementation Scope

### Template System Architecture
```typescript
// Template Interface
interface ResumeTemplate {
  id: string
  name: string
  category: 'minimal' | 'modern' | 'classic' | 'creative' | 'technical' | 'executive'
  thumbnail: string
  description: string
  features: string[]
  render: (data: ResumeJson, customizations: Customizations) => string
  styles: string // Template-specific CSS
  printStyles: string // Print-specific CSS
  requirements?: {
    photo?: boolean
    minSections?: number
  }
}

// Customization Interface
interface Customizations {
  colors: {
    primary: string // HSL
    secondary: string
    accent: string
    text: string
    background: string
    muted: string
  }
  typography: {
    fontFamily: string
    fontSize: number // Scale factor
    lineHeight: number
    headingFont?: string
  }
  spacing: {
    sectionGap: number
    itemGap: number
    pagePadding: number
  }
  icons: {
    enabled: boolean
    style: 'outline' | 'filled'
    size: number
  }
  layout: {
    columns: 1 | 2
    sidebarPosition?: 'left' | 'right'
    headerAlignment: 'left' | 'center' | 'right'
  }
}
```

### Database Updates
```sql
Tables/Collections:
- resume_customizations: Store user customizations
  - id: uuid (primary key)
  - resume_id: uuid (references resumes.id)
  - template_id: text
  - customizations: jsonb
  - created_at: timestamp
  - updated_at: timestamp

Updates to resumes table:
  - template_id: text (selected template)
  - customizations: jsonb (inline storage option)

Migrations Required:
- 008_add_template_fields.sql
- 009_create_customizations_table.sql
```

### Frontend Components

#### Page Components
```
/app/
├── editor/
│   └── [id]/
│       ├── preview/
│       │   └── page.tsx - Full preview page
│       └── customize/
│           └── page.tsx - Customization interface
└── templates/
    ├── gallery/
    │   └── page.tsx - Template browser
    └── [template]/
        └── page.tsx - Template details
```

#### Template Components
```
/components/templates/
├── registry.ts - Template registration
├── minimal/
│   ├── MinimalTemplate.tsx
│   ├── styles.css
│   └── print.css
├── modern/
│   ├── ModernTemplate.tsx
│   ├── styles.css
│   └── print.css
├── classic/
│   ├── ClassicTemplate.tsx
│   ├── styles.css
│   └── print.css
├── creative/
│   ├── CreativeTemplate.tsx
│   ├── styles.css
│   └── print.css
├── technical/
│   ├── TechnicalTemplate.tsx
│   ├── styles.css
│   └── print.css
├── executive/
│   ├── ExecutiveTemplate.tsx
│   ├── styles.css
│   └── print.css
└── shared/
    ├── TemplateBase.tsx
    ├── TemplateSection.tsx
    ├── TemplateIcons.tsx
    └── TemplateUtils.ts
```

#### Preview Components
```
/components/preview/
├── LivePreview.tsx - Main preview container
├── PreviewFrame.tsx - Iframe wrapper
├── PreviewControls.tsx - Control bar
├── PreviewPagination.tsx - Page navigation
├── PreviewZoom.tsx - Zoom controls
├── PreviewViewport.tsx - Viewport switcher
├── PreviewError.tsx - Error boundary
├── PreviewSkeleton.tsx - Loading state
└── PrintPreview.tsx - Print-specific view
```

#### Customization Components
```
/components/customization/
├── CustomizationPanel.tsx - Main panel
├── ColorScheme.tsx - Color selection
├── ColorPicker.tsx - Custom colors
├── Typography.tsx - Font settings
├── Spacing.tsx - Spacing controls
├── IconSettings.tsx - Icon options
├── LayoutOptions.tsx - Layout settings
├── PresetThemes.tsx - Theme presets
└── ResetButton.tsx - Reset to defaults
```

#### Layout Components
```
/components/editor/
├── EditorLayout.tsx - Split pane container
├── SplitPane.tsx - Resizable divider
├── EditorTabs.tsx - Edit/Preview/Customize tabs
└── MobileLayout.tsx - Mobile-specific layout
```

### State Management
```typescript
// stores/templateStore.ts
interface TemplateStore {
  // State
  templates: ResumeTemplate[]
  currentTemplate: string
  customizations: Customizations
  savedCustomizations: Map<string, Customizations>
  isLoading: boolean

  // Actions
  loadTemplates(): Promise<void>
  selectTemplate(id: string): void
  updateCustomization(path: string, value: any): void
  resetCustomizations(): void
  saveCustomizations(): Promise<void>
  loadCustomizations(resumeId: string): Promise<void>

  // Computed
  activeTemplate: ResumeTemplate
  hasCustomizations: boolean
}

// stores/previewStore.ts
interface PreviewStore {
  // State
  zoomLevel: number // 0.5 to 1.5
  currentPage: number
  totalPages: number
  viewport: 'desktop' | 'tablet' | 'mobile' | 'print'
  isFullscreen: boolean
  splitRatio: number // Editor/preview split

  // Actions
  setZoom(level: number): void
  nextPage(): void
  previousPage(): void
  goToPage(page: number): void
  setViewport(mode: string): void
  toggleFullscreen(): void
  setSplitRatio(ratio: number): void

  // Computed
  canZoomIn: boolean
  canZoomOut: boolean
  hasMultiplePages: boolean
}
```

### CSS Architecture
```css
/* Global Design Tokens - /app/globals.css */
:root {
  /* Base spacing scale */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;

  /* Typography scale */
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
  --font-size-3xl: 1.875rem;

  /* Template-specific tokens */
  --template-primary: hsl(var(--primary));
  --template-secondary: hsl(var(--secondary));
  --template-accent: hsl(var(--accent));
  --template-text: hsl(var(--foreground));
  --template-bg: hsl(var(--background));
}

/* Print-specific tokens */
@media print {
  :root {
    --space-1: 2pt;
    --font-size-base: 10pt;
  }
}
```

### Preview Rendering Strategy
```typescript
// Real-time preview with React
const LivePreview = () => {
  const { document } = useDocumentStore()
  const { currentTemplate, customizations } = useTemplateStore()

  // Debounced render
  const debouncedDocument = useDebounce(document, 100)

  // Render template
  const html = useMemo(() => {
    const template = templates[currentTemplate]
    return template.render(debouncedDocument, customizations)
  }, [debouncedDocument, currentTemplate, customizations])

  // Inject styles
  const styles = useMemo(() => {
    return combineStyles(
      template.styles,
      customizationStyles(customizations),
      template.printStyles
    )
  }, [template, customizations])

  return (
    <PreviewFrame
      html={html}
      styles={styles}
      zoom={zoomLevel}
      onError={handleError}
    />
  )
}
```

## Edge Cases & Completeness Checklist

### User Scenarios (All Need Tests)
- [ ] Resume with no sections → Test: empty_template_render
- [ ] Very long resume (10+ pages) → Test: pagination_performance
- [ ] Rapid template switching → Test: template_switch_stress
- [ ] Custom color edge cases → Test: color_validation
- [ ] Missing fonts fallback → Test: font_fallback
- [ ] Preview error recovery → Test: render_error_recovery
- [ ] Concurrent customization → Test: customization_race
- [ ] Print preview accuracy → Test: print_fidelity

### Technical Considerations (Test Requirements)
- [ ] Template HTML injection → Test: xss_prevention
- [ ] CSS injection in customization → Test: style_sanitization
- [ ] Performance with complex templates → Test: render_performance
- [ ] Memory leaks in preview → Test: memory_management
- [ ] Cross-browser template rendering → Test: browser_compatibility
- [ ] Print CSS accuracy → Test: print_output
- [ ] Responsive preview at all sizes → Test: responsive_preview
- [ ] Icon loading and display → Test: icon_rendering

## Phase Exit Criteria

### Test Suite Requirements
```yaml
Unit Tests:
  Total: 78
  Passing: 78
  Coverage: >85%

Integration Tests:
  Total: 35
  Passing: 35
  Coverage: All template features

E2E Tests:
  Total: 15
  Passing: 15
  Coverage: Template user flows

Performance:
  Preview update: <120ms
  Template switch: <200ms
  Initial render: <200ms

Accessibility:
  Keyboard navigation: PASS
  Screen reader: PASS
  Color contrast: PASS

Security:
  XSS prevention: PASS
  Style injection: BLOCKED
```

### Phase Gate Checklist
- [ ] All 6 templates rendering perfectly
- [ ] Live preview updating smoothly
- [ ] Customization panel fully functional
- [ ] Template switching seamless
- [ ] Preview controls working
- [ ] Print styles accurate
- [ ] Performance targets met
- [ ] Responsive preview modes
- [ ] Design tokens implemented
- [ ] No rendering errors

## Known Constraints & Decisions
- **React-based templates**: Not using template engines, pure React
- **Client-side rendering**: Preview rendered in browser, not server
- **CSS-in-JS avoided**: Traditional CSS with design tokens
- **Fixed template set**: Custom templates in future phase
- **Preview in iframe**: Isolation for styles and security
- **Debounced updates**: Balance between responsiveness and performance

## Phase Completion Definition
This phase is complete when:
1. **ALL tests are passing (100%)**
2. Six professional templates available
3. Live preview updates in <120ms
4. Full customization panel operational
5. Template switching preserves data
6. Preview controls fully functional
7. Print preview accurate
8. Design tokens system working
9. Performance benchmarks met
10. **Gate check approved for Phase 4**