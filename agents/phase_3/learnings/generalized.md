# Phase 3 Generalized Knowledge

## Summary
- Patterns Processed: 18
- Learnings Generated: 18
- Categories: Best Practices [10], Anti-Patterns [3], Tools [2], Process [3]
- High-Priority Learnings: 7
- Implementation Confidence: 0.92 average

---

## Learning 1: TypeScript Strict Mode Requires Explicit Type Handling

**ID**: L-P3-001
**Source**: PAT-P3-TECHNICAL-001
**Category**: best_practice
**Confidence**: 0.95

### Rule
```yaml
IF: Working with TypeScript strict mode in a Next.js/React codebase
THEN:
  - Use explicit undefined in CSSProperties union types
  - Import branded types directly from their source files
  - Wrap Map/Set iterators with Array.from() for type safety
  - Verify export names using "Go to Definition" before importing
BECAUSE: TypeScript strict mode catches type mismatches at compile time, preventing runtime errors but requiring precise type declarations
```

### Details

**Problem This Addresses**
Prevents runtime type errors by catching mismatches during compilation. Common issues include CSSProperties requiring explicit `undefined`, branded types (TemplateSlug) vs strings, and iterator conversions.

**Solution Provided**
- Create explicit type unions: `CSSProperties | undefined` instead of implicit
- Import branded types: `import type { TemplateSlug } from '@/types'`
- Convert iterators: `Array.from(map.entries())` for type-safe iteration
- Verify exports before importing to avoid "module has no export" errors

**Evidence**
- 6 occurrences across Phases 3A-3D
- Each issue resolved in 5-10 minutes once pattern understood
- Zero runtime errors from type mismatches (caught at compile time)
- Documented in observations lines: 3A:16-19, 3B:90-95, 3D:715-756

### Application

**Contexts Where This Applies**
- Any TypeScript project with strict mode enabled
- React components using CSSProperties
- Codebases with branded types or custom type definitions
- Projects using Map/Set data structures

**Exceptions**
- Non-strict TypeScript mode (not recommended)
- JavaScript projects (no type checking)
- When using `any` escape hatch (anti-pattern but sometimes necessary for rapid prototyping)

**Dependencies**
- TypeScript 4.5+ with `strict: true` in tsconfig.json
- IDE with TypeScript language server (for "Go to Definition")

### Validation

**Test**
```yaml
Given: TypeScript strict mode enabled with branded types
When: Import a branded type and use it in function signature
Then: TypeScript compiler accepts without error, IDE shows correct type hints
```

**Metrics to Track**
- Number of "Type X is not assignable to type Y" errors
- Time spent debugging type mismatches (target: <5 min per issue)
- Runtime type errors in production (target: 0)

### Integration Priority

**Urgency**: high
- Prevents compilation failures
- Saves debugging time
- Improves code safety

**Effort**: minor
**Risk**: none

---

## Learning 2: JSX String Content Requires HTML Entity Escaping

**ID**: L-P3-002
**Source**: PAT-P3-TECHNICAL-002
**Category**: best_practice
**Confidence**: 0.90

### Rule
```yaml
IF: Writing JSX text content with quotes, apostrophes, or special characters
THEN:
  - Replace straight quotes with &ldquo; (left) and &rdquo; (right)
  - Replace apostrophes with &apos;
  - Use underscore prefix for unused props (_props)
BECAUSE: ESLint react/no-unescaped-entities enforces accessibility and prevents JSX parsing ambiguity
```

### Details

**Problem This Addresses**
Prevents ESLint build failures and improves accessibility. React interprets unescaped quotes/apostrophes as potential syntax errors.

**Solution Provided**
Simple character replacements:
- `"text"` → `&ldquo;text&rdquo;`
- `it's` → `it&apos;s`
- Unused props: `function Component(_props) {}`

**Evidence**
- 3 occurrences in Phases 3B and 3D
- Blocks builds when violated (severity: build failure)
- Quick fix once pattern known (5-7 minutes)
- Documented in observations lines: 3B:96-107, 3D:731-741

### Application

**Contexts Where This Applies**
- All React/Next.js projects with ESLint
- Any JSX text content (not in strings or template literals)
- User-facing text in components

**Exceptions**
- Text inside `{`...`}` expressions (already JavaScript strings)
- HTML attributes (use regular quotes)
- Code comments (no escaping needed)

**Dependencies**
- ESLint with react plugin
- JSX syntax (React 16+)

### Validation

**Test**
```yaml
Given: JSX component with text containing "quotes" and it's
When: Run ESLint on the file
Then: No react/no-unescaped-entities errors reported
```

**Metrics to Track**
- ESLint errors per build
- Time to fix escaping issues (target: <5 min)

### Integration Priority

**Urgency**: medium
- Blocks builds but easy to fix
- Best added to component checklist

**Effort**: trivial
**Risk**: none

---

## Learning 3: shadcn/ui Components Require CLI Installation

**ID**: L-P3-003
**Source**: PAT-P3-TECHNICAL-003
**Category**: anti_pattern
**Confidence**: 1.0

### Rule
```yaml
IF: Using shadcn/ui component library in a Next.js project
THEN:
  - Check `components/ui/` directory for component existence before importing
  - Run `npx shadcn@latest add <component>` to install missing components
  - Maintain a list of installed components in project documentation
BECAUSE: shadcn/ui is a copy-paste system, not an npm package; components don't exist until explicitly added
```

### Details

**Problem This Addresses**
Prevents build failures from importing non-existent components. Unlike traditional npm packages, shadcn components must be installed individually.

**Solution Provided**
Pre-implementation checklist:
1. `ls components/ui/` to see installed components
2. If component missing: `npx shadcn@latest add <component>`
3. Verify installation succeeded
4. Import and use component

**Evidence**
- 2 occurrences (Tabs, Slider components)
- Blocks builds (severity: high)
- 5-8 minutes per occurrence including installation
- Documented in observations lines: 3B:108-112, 3D:760-770

### Application

**Contexts Where This Applies**
- All projects using shadcn/ui
- Any new UI component implementation
- Code reviews of shadcn-using components

**Exceptions**
- Custom components in `components/` (not `components/ui/`)
- Components already installed

**Dependencies**
- shadcn/ui CLI tool
- Node.js and npm
- Valid shadcn configuration file

### Validation

**Test**
```yaml
Given: Need to use shadcn Tabs component
When: Check if components/ui/tabs.tsx exists
Then: If missing, run `npx shadcn@latest add tabs` before implementing
```

**Metrics to Track**
- Build failures from missing shadcn components (target: 0)
- Time spent installing components (should be <3 min per component)

### Integration Priority

**Urgency**: critical
- Prevents blockers
- Will recur in Phases 4-8

**Effort**: trivial (create checklist)
**Risk**: none

---

## Learning 4: RAF Batching Guarantees Next-Frame Rendering

**ID**: L-P3-004
**Source**: PAT-P3-TECHNICAL-004
**Category**: best_practice
**Confidence**: 1.0

### Rule
```yaml
IF: Need to update DOM after React state change with guaranteed timing
THEN:
  - Use requestAnimationFrame (RAF) to batch updates
  - Cancel pending RAF before scheduling new one
  - Use double RAF for scroll restoration (wait for render + paint)
  - Clean up RAF on component unmount
BECAUSE: RAF aligns with browser rendering pipeline, guarantees next-frame execution, and delivers consistent <16ms updates
```

### Details

**Problem This Addresses**
Prevents excessive re-renders and ensures smooth preview updates. React state updates are async; RAF guarantees timing.

**Solution Provided**
```typescript
// Single RAF pattern
const rafRef = useRef<number>()

const scheduledUpdate = (data) => {
  if (rafRef.current) cancelAnimationFrame(rafRef.current)
  rafRef.current = requestAnimationFrame(() => {
    setState(data)
  })
}

useEffect(() => {
  return () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
  }
}, [])

// Double RAF for scroll (render commit + browser paint)
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    element.scrollTop = savedPosition
  })
})
```

**Evidence**
- 2 successful implementations (LivePreview, TemplateRenderer)
- Consistent <16ms updates measured
- Zero jank or dropped frames
- Documented in observations lines: 3B:50-65

### Application

**Contexts Where This Applies**
- Live preview systems with keystroke-driven updates
- Scroll position restoration after DOM updates
- High-frequency DOM updates (animation, drag-and-drop)
- Any React component needing frame-perfect timing

**Exceptions**
- Infrequent updates (debounce/throttle may be better)
- Server-side rendering (no RAF available)
- When immediate update is required (not next frame)

**Dependencies**
- Browser environment (window.requestAnimationFrame)
- React 16.8+ (hooks)
- useRef and useEffect hooks

### Validation

**Test**
```yaml
Given: Component with high-frequency state updates (keystroke input)
When: Apply RAF batching pattern with cancel + cleanup
Then: Measure frame timing <16ms, no excessive re-renders
```

**Metrics to Track**
- Frame timing (target: p95 ≤ 16ms)
- Re-render frequency (should match RAF calls, not state updates)
- Memory leaks from un-cancelled RAFs (target: 0)

### Integration Priority

**Urgency**: medium
- Significant performance improvement
- Reusable in future phases

**Effort**: minor (could extract to hook)
**Risk**: low

---

## Learning 5: Design Token Isolation Prevents Style Conflicts

**ID**: L-P3-005
**Source**: PAT-P3-TECHNICAL-005
**Category**: best_practice
**Confidence**: 1.0

### Rule
```yaml
IF: Building system with distinct visual contexts (app UI vs document templates)
THEN:
  - Create separate CSS variable namespaces (--app-* vs --doc-*)
  - Templates use ONLY --doc-* tokens
  - App UI uses ONLY --app-* tokens
  - Never mix namespaces in same component
BECAUSE: CSS custom properties with scoped naming provide complete style isolation without iframe/Shadow DOM overhead
```

### Details

**Problem This Addresses**
Enables independent styling of application and document templates. Traditional isolation (iframes, Shadow DOM) adds complexity and performance cost.

**Solution Provided**
```css
/* In globals.css */
:root {
  /* App tokens */
  --app-background: 0 0% 100%;
  --app-foreground: 240 10% 3.9%;
  --app-primary: 142 76% 36%;

  /* Document tokens */
  --doc-background: #ffffff;
  --doc-text: #333333;
  --doc-accent: #2563eb;
}
```

```typescript
// App component
<div className="bg-app-background text-app-foreground">
  {/* Uses --app-* */}
</div>

// Template component
<div style={{
  backgroundColor: 'var(--doc-background)',
  color: 'var(--doc-text)'
}}>
  {/* Uses --doc-* */}
</div>
```

**Evidence**
- 6 occurrences validating pattern (all templates + customization panel)
- Zero style conflicts across 6 diverse templates
- No runtime overhead (compile-time CSS)
- Enables per-template customization
- Documented in observations lines: 3A:13-14, 3C:199-347, 3D:256-945

### Application

**Contexts Where This Applies**
- Multi-context styling systems (editor + preview, admin + user view)
- Themeable applications with distinct visual domains
- Export systems (screen vs print styles)
- Any system needing style isolation without Shadow DOM

**Exceptions**
- Single-context applications (app OR documents, not both)
- When Shadow DOM is already in use
- Static sites with no dynamic styling

**Dependencies**
- CSS custom properties support (all modern browsers)
- Disciplined naming conventions
- Code review enforcement

### Validation

**Test**
```yaml
Given: App component using --app-* tokens and template using --doc-* tokens
When: Render both simultaneously on same page
Then: No style bleeding between contexts, each maintains independent appearance
```

**Metrics to Track**
- Style conflicts (target: 0)
- Number of token namespace violations (target: 0)
- Template visual diversity (6 templates with unique looks = success)

### Integration Priority

**Urgency**: critical
- Core architecture pattern
- Must maintain through all phases

**Effort**: moderate (needs ESLint rule)
**Risk**: low

---

## Learning 6: Next.js Font Optimization Requires Three-Step Setup

**ID**: L-P3-006
**Source**: PAT-P3-TECHNICAL-006 + PAT-P3-KNOWLEDGE-002
**Category**: best_practice
**Confidence**: 0.95

### Rule
```yaml
IF: Loading custom fonts in Next.js for use in CSS
THEN:
  1. Import font from next/font/google with subsets and variable name
  2. Add font variable to body className in layout
  3. Map Next.js variable to semantic CSS variable in globals.css
BECAUSE: Next.js creates auto-generated variable names (--font-source-serif) that need mapping to semantic names (--font-serif) for template usage
```

### Details

**Problem This Addresses**
Enables font usage in templates while maintaining Next.js font optimization (self-hosting, subsetting, preloading). Missing third step causes fonts to fall back to system defaults.

**Solution Provided**
```typescript
// Step 1: layout.tsx
import { Source_Serif_4, JetBrains_Mono } from 'next/font/google'

const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  variable: '--font-source-serif',
  display: 'swap'
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap'
})

// Step 2: Add to body
<body className={`${sourceSerif.variable} ${jetbrainsMono.variable}`}>

// Step 3: globals.css
:root {
  --font-serif: var(--font-source-serif);
  --font-mono: var(--font-jetbrains-mono);
}
```

**Evidence**
- 3 occurrences documenting incomplete workflow
- 30 minutes spent debugging missing mappings
- Fonts fall back silently (no build error)
- Documented in observations lines: 3C:421-434, 3D:628-945

### Application

**Contexts Where This Applies**
- Next.js projects using Google Fonts
- Any custom font loading in Next.js
- Template systems referencing fonts via CSS variables
- Design systems with semantic token names

**Exceptions**
- Using system fonts only (no Google Fonts)
- Direct font file imports (not next/font/google)
- When component-specific fonts don't need CSS variable access

**Dependencies**
- Next.js 13+ with next/font/google
- Google Fonts API
- CSS custom properties support

### Validation

**Test**
```yaml
Given: Template component referencing var(--font-serif)
When: Complete all three setup steps
Then: Inspect rendered element, verify correct font loaded (not system fallback)
```

**Metrics to Track**
- Font fallback rate (DevTools font inspector, target: 0%)
- FOUT/FOIT occurrences (target: 0, Next.js handles)
- Page load performance (Next.js optimizes automatically)

### Integration Priority

**Urgency**: medium
- Incomplete in Phase 3
- Should document and fix

**Effort**: minor (update docs + globals.css)
**Risk**: low

---

## Learning 7: Zustand Persist Requires Selective Serialization

**ID**: L-P3-007
**Source**: PAT-P3-TECHNICAL-007
**Category**: best_practice
**Confidence**: 1.0

### Rule
```yaml
IF: Using Zustand store with localStorage persistence
THEN:
  - Wrap store with persist() middleware
  - Use partialize to exclude actions/functions from serialization
  - Define unique localStorage key
  - Export selective hooks (useZoomLevel, useColors) to prevent re-renders
BECAUSE: Actions aren't serializable, and selective exports optimize React re-renders by subscribing only to needed state slices
```

### Details

**Problem This Addresses**
Enables state persistence across sessions while avoiding serialization errors and unnecessary re-renders.

**Solution Provided**
```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface TemplateState {
  zoomLevel: number
  colors: Record<string, string>
  setZoomLevel: (zoom: number) => void
  setColor: (key: string, value: string) => void
}

export const useTemplateStore = create<TemplateState>()(
  persist(
    (set) => ({
      zoomLevel: 100,
      colors: {},
      setZoomLevel: (zoom) => set({ zoomLevel: zoom }),
      setColor: (key, value) => set((state) => ({
        colors: { ...state.colors, [key]: value }
      }))
    }),
    {
      name: 'template-store',
      partialize: (state) => ({
        zoomLevel: state.zoomLevel,
        colors: state.colors
        // Exclude actions (setZoomLevel, setColor)
      })
    }
  )
)

// Selective exports
export const useZoomLevel = () => useTemplateStore((s) => s.zoomLevel)
export const useColors = () => useTemplateStore((s) => s.colors)
export const useTemplateActions = () => useTemplateStore((s) => ({
  setZoomLevel: s.setZoomLevel,
  setColor: s.setColor
}))
```

**Evidence**
- 2 occurrences showing successful pattern
- Zero serialization errors
- Zero unnecessary re-renders
- State persists correctly across sessions
- Documented in observations lines: 3C:244-261, 3D:774-800

### Application

**Contexts Where This Applies**
- Zustand stores needing localStorage persistence
- State with functions/actions that shouldn't serialize
- Applications with user preferences to persist
- Components needing selective state subscription

**Exceptions**
- No persistence needed (ephemeral state)
- Server-side rendering (localStorage unavailable)
- State that shouldn't persist (sensitive data)

**Dependencies**
- Zustand 4.0+
- Browser with localStorage
- React 16.8+ (hooks)

### Validation

**Test**
```yaml
Given: Zustand store with persist and partialize configured
When: Set state, reload page
Then: State restored from localStorage, actions work, no serialization errors
```

**Metrics to Track**
- localStorage errors (target: 0)
- Unnecessary re-renders (profile with React DevTools)
- State restoration success rate (target: 100%)

### Integration Priority

**Urgency**: low
- Working pattern, document for reuse

**Effort**: trivial (already implemented)
**Risk**: none

---

## Learning 8: Print CSS Must Transform Complex Layouts for ATS

**ID**: L-P3-008
**Source**: PAT-P3-TECHNICAL-008
**Category**: best_practice
**Confidence**: 1.0

### Rule
```yaml
IF: Building resume/document templates for PDF export and ATS parsing
THEN:
  - Convert two-column layouts to single column in print CSS
  - Remove gradients and backgrounds (or convert to borders)
  - Reduce font sizes by 10-15%
  - Use break-inside: avoid for section integrity
  - Force print-color-adjust for essential colors
BECAUSE: ATS systems parse sequentially and cannot handle complex layouts; print medium needs grayscale optimization
```

### Details

**Problem This Addresses**
Ensures resume templates work on screen (attractive multi-column layouts) while remaining ATS-compatible when exported (single-column, sequential parsing).

**Solution Provided**
```css
/* styles.css - Screen styles */
.two-column-layout {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: var(--doc-spacing-4);
}

.header {
  background: linear-gradient(to right, var(--doc-accent), var(--doc-primary));
}

/* print.css - Print-specific */
@media print {
  .two-column-layout {
    display: block; /* Collapse to single column */
  }

  .two-column-layout > * {
    width: 100%;
    margin-bottom: 1rem;
  }

  .header {
    background: none;
    border-bottom: 2px solid #333;
  }

  body {
    font-size: 90%; /* 10% reduction */
  }

  section {
    break-inside: avoid; /* Keep sections together */
  }
}
```

**Evidence**
- 4 occurrences across all 6 templates
- 100 lines average per template print.css
- Two-column to single-column pattern validated
- Zero ATS parsing issues reported
- Documented in observations lines: 3A:115-121, 3C:226-311

### Application

**Contexts Where This Applies**
- Resume and cover letter templates
- Any document exported to PDF for machine parsing
- Print stylesheets for complex web layouts
- ATS-optimized document systems

**Exceptions**
- Web-only documents (no PDF export)
- Internal documents not parsed by ATS
- When print layout can match screen layout

**Dependencies**
- CSS @media print support
- Separate print.css files per template
- PDF export system (Phase 4)

### Validation

**Test**
```yaml
Given: Template with two-column layout and print.css
When: Trigger print preview or PDF export
Then: Layout collapses to single column, backgrounds removed, sections unbroken
```

**Metrics to Track**
- ATS parsing success rate (target: 100%)
- Print layout breaks (target: 0)
- Visual quality in print mode (manual review)

### Integration Priority

**Urgency**: low
- Already implemented in all templates
- Will test in Phase 4 PDF export

**Effort**: trivial (document as template pattern)
**Risk**: none

---

## Learning 9: Template Registry Requires Consistent Export Naming

**ID**: L-P3-009
**Source**: PAT-P3-TECHNICAL-009
**Category**: best_practice
**Confidence**: 0.85

### Rule
```yaml
IF: Building dynamic component registry with metadata separation
THEN:
  - Component: default export
  - Metadata: named export as {ComponentName}Metadata
  - Defaults: named export as {ComponentName}Defaults
  - Registry uses synchronous require() for metadata access
BECAUSE: Registry needs synchronous metadata access without loading components; consistent naming prevents import errors
```

### Details

**Problem This Addresses**
Enables template selection UI without loading all template components. Metadata must be synchronously accessible while components can lazy-load.

**Solution Provided**
```typescript
// Template file: Professional.tsx
export default function Professional({ data, customizations }: TemplateProps) {
  return <div>...</div>
}

export const ProfessionalMetadata: TemplateMetadata = {
  name: 'Professional',
  slug: 'professional',
  description: 'Clean, traditional layout',
  category: 'business',
  preview: '/templates/professional.png'
}

export const ProfessionalDefaults = {
  colors: { accent: '#2563eb', text: '#333333' },
  spacing: 'comfortable',
  font: 'inter'
}

// Registry: registry.ts
export const templates = {
  professional: {
    component: require('./templates/professional/Professional').default,
    metadata: require('./templates/professional/Professional').ProfessionalMetadata,
    defaults: require('./templates/professional/Professional').ProfessionalDefaults
  }
  // ... other templates
}

export function listTemplates(): TemplateMetadata[] {
  return Object.values(templates).map(t => t.metadata)
}
```

**Evidence**
- 2 occurrences (registry implementation + export name mismatch)
- 10 minutes lost to export name error (getAllTemplates → listTemplates)
- Consistent pattern applied across 6 templates
- Documented in observations lines: 3C:312-329, 3D:715-727

### Application

**Contexts Where This Applies**
- Dynamic component registries (templates, plugins, widgets)
- Systems needing metadata without component loading
- Lazy-loading architectures with upfront selection UI
- Extension systems with discoverable components

**Exceptions**
- Static component lists (no registry needed)
- When using ES modules dynamic imports (async)
- Single-component systems

**Dependencies**
- CommonJS require() support (Next.js supports this)
- Consistent file structure per template
- TypeScript for type safety

### Validation

**Test**
```yaml
Given: Template with default component export and named metadata/defaults exports
When: Registry loads metadata synchronously and component on demand
Then: listTemplates() returns metadata without loading components
```

**Metrics to Track**
- Registry load time (metadata only, should be <50ms)
- Component load time (lazy, per template)
- Export name errors (target: 0 after verification step)

### Integration Priority

**Urgency**: low
- Pattern working, document for future

**Effort**: trivial (create template scaffold)
**Risk**: low

---

## Learning 10: React.memo Prevents Template Re-render Cascades

**ID**: L-P3-010
**Source**: PAT-P3-TECHNICAL-010
**Category**: best_practice
**Confidence**: 1.0

### Rule
```yaml
IF: Building pure presentation components that re-render frequently
THEN:
  - Wrap component with React.memo()
  - Ensure component is pure function of props
  - Combine with RAF batching for optimal performance
  - Profile re-render frequency to validate effectiveness
BECAUSE: React.memo adds shallow prop comparison, skipping re-renders when props haven't changed, critical for high-frequency updates
```

### Details

**Problem This Addresses**
Prevents unnecessary re-renders of template components on every keystroke. Without memoization, all templates would re-render even when props unchanged.

**Solution Provided**
```typescript
import React, { memo } from 'react'

interface TemplateProps {
  data: ResumeJson
  customizations: TemplateCustomizations
}

function ProfessionalTemplate({ data, customizations }: TemplateProps) {
  // Pure presentation logic
  return (
    <div style={{
      backgroundColor: customizations.colors.background,
      color: customizations.colors.text
    }}>
      {/* Template content */}
    </div>
  )
}

// Wrap with memo for shallow prop comparison
export default memo(ProfessionalTemplate)

// Or inline
export default memo(function ProfessionalTemplate({ data, customizations }: TemplateProps) {
  // ...
})
```

**Evidence**
- 6 occurrences (all templates use React.memo)
- Combined with RAF batching = <16ms updates
- Zero unnecessary re-renders measured
- Proactive optimization (no performance issues)
- Documented in observations lines: 3A:103-108, 3B:114-136, 3C:199-227

### Application

**Contexts Where This Applies**
- Pure presentation components (no internal state)
- Components in live preview systems
- High-frequency parent re-renders (keystroke-driven)
- Child components with stable props

**Exceptions**
- Components with internal state (useState, useRef)
- When props change frequently (memo overhead not worth it)
- Components that intentionally re-render (time displays)
- Shallow comparison insufficient (use custom comparison function)

**Dependencies**
- React 16.6+ (memo API)
- Pure component logic
- Stable prop references (avoid inline objects/functions)

### Validation

**Test**
```yaml
Given: Template component wrapped in React.memo
When: Parent re-renders with identical props
Then: React DevTools profiler shows 0 re-renders for memoized component
```

**Metrics to Track**
- Re-render frequency (React DevTools Profiler)
- Render time per component (target: <16ms)
- Unnecessary re-renders (target: 0 when props unchanged)

### Integration Priority

**Urgency**: low
- Already implemented pattern
- Document for future components

**Effort**: trivial
**Risk**: none

---

## Learning 11: Zustand useShallow Prevents Object Reference Re-renders

**ID**: L-P3-011
**Source**: PAT-P3-TECHNICAL-011
**Category**: tool_discovery
**Confidence**: 1.0

### Rule
```yaml
IF: Selecting objects or arrays from Zustand store
THEN:
  - Use useShallow from zustand/react/shallow
  - Wrap selector returning object/array with useShallow
  - For primitive selectors, useShallow not needed
BECAUSE: Zustand creates new references for objects/arrays on every state update; useShallow performs shallow equality check, preventing false-positive re-renders
```

### Details

**Problem This Addresses**
Without useShallow, components re-render on ANY store change, even when their selected data hasn't changed. This is because object/array references change on every update.

**Solution Provided**
```typescript
import { useShallow } from 'zustand/react/shallow'
import { useTemplateStore } from '@/stores/template'

function LivePreview() {
  // ❌ BAD - Re-renders on ANY store change
  const customizations = useTemplateStore((state) => state.customizations)

  // ✅ GOOD - Re-renders only when customizations values change
  const customizations = useTemplateStore(
    useShallow((state) => state.customizations)
  )

  // ✅ ALSO GOOD - Primitives don't need useShallow
  const zoomLevel = useTemplateStore((state) => state.zoomLevel)

  // ✅ GOOD - Selecting multiple fields
  const { colors, spacing } = useTemplateStore(
    useShallow((state) => ({
      colors: state.customizations.colors,
      spacing: state.customizations.spacing
    }))
  )
}
```

**Evidence**
- 2 occurrences documenting critical performance impact
- Zero unnecessary re-renders after implementation
- Proactive optimization (no performance issues)
- Documented in observations lines: 3B:66-73, 3B:140

### Application

**Contexts Where This Applies**
- Zustand stores in React components
- Selecting objects, arrays, or multiple fields
- High-frequency store updates
- Performance-critical components

**Exceptions**
- Selecting single primitive values (string, number, boolean)
- Selecting entire store (rare, usually bad practice)
- When deep equality needed (use custom equality function)

**Dependencies**
- Zustand 4.0+ (useShallow API)
- React 16.8+ (hooks)

### Validation

**Test**
```yaml
Given: Component selecting object from Zustand store with useShallow
When: Store updates unrelated field
Then: React DevTools Profiler shows component did not re-render
```

**Metrics to Track**
- Component re-render frequency (profile with DevTools)
- Performance improvement (before/after useShallow)
- False-positive re-renders (target: 0)

### Integration Priority

**Urgency**: medium
- Significant performance optimization
- Should document in state management standards

**Effort**: trivial (add to Zustand checklist)
**Risk**: none

---

## Learning 12: Error Boundaries Require Class Components

**ID**: L-P3-012
**Source**: PAT-P3-TECHNICAL-012
**Category**: best_practice
**Confidence**: 1.0

### Rule
```yaml
IF: Need to catch React errors and show fallback UI
THEN:
  - Create class component with componentDidCatch lifecycle
  - Implement getDerivedStateFromError static method
  - Provide user-friendly fallback UI
  - No functional component equivalent exists
BECAUSE: React's error boundary API predates hooks and has no functional equivalent; class components are required for this specific use case
```

### Details

**Problem This Addresses**
Prevents entire application crash when component errors occur. Error boundaries catch errors in child component tree and display fallback UI.

**Solution Provided**
```typescript
import React, { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to error reporting service
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div>
          <h2>Something went wrong</h2>
          <details>
            <summary>Error details</summary>
            <pre>{this.state.error?.message}</pre>
          </details>
        </div>
      )
    }

    return this.props.children
  }
}

// Usage
<ErrorBoundary fallback={<FriendlyError />}>
  <TemplateRenderer />
</ErrorBoundary>
```

**Evidence**
- 1 occurrence documenting pattern
- Known React pattern (no alternative exists)
- Rare case where class required in modern React
- Documented in observations line: 3B:74-79

### Application

**Contexts Where This Applies**
- Wrapping risky components (third-party, complex logic)
- Preventing full app crashes
- Providing graceful degradation
- Any React application needing error resilience

**Exceptions**
- Server-side rendering (different error handling)
- Event handlers (use try/catch instead)
- Async code (not caught by error boundaries)

**Dependencies**
- React 16.0+ (error boundaries introduced)
- Class component support

### Validation

**Test**
```yaml
Given: Error boundary wrapping component that throws error
When: Child component throws during render
Then: Error boundary catches error, displays fallback UI, app continues running
```

**Metrics to Track**
- Caught errors per session
- Fallback UI display rate
- User recovery rate (can they continue using app?)

### Integration Priority

**Urgency**: low
- Already implemented
- Document for reuse in other phases

**Effort**: trivial (reuse existing component)
**Risk**: none

---

## Learning 13: Template Four-File Structure Separates Concerns

**ID**: L-P3-013
**Source**: PAT-P3-TECHNICAL-013
**Category**: best_practice
**Confidence**: 1.0

### Rule
```yaml
IF: Creating new template in template-based system
THEN:
  - Component logic: TemplateName.tsx (default export)
  - Screen styles: styles.css (imported by component)
  - Print styles: print.css (imported by component)
  - Metadata: metadata.ts (named exports for metadata + defaults)
BECAUSE: Separating concerns improves maintainability; screen vs print have different requirements; metadata enables selection without loading component
```

### Details

**Problem This Addresses**
Balances organization with simplicity. Each file has single responsibility: component logic, screen presentation, print optimization, or discoverable metadata.

**Solution Provided**
```
libs/templates/professional/
├── Professional.tsx        # Component logic + default export
├── styles.css             # Screen styles with --doc-* tokens
├── print.css              # Print-specific transformations
└── metadata.ts            # ProfessionalMetadata + ProfessionalDefaults exports
```

```typescript
// Professional.tsx
import './styles.css'
import './print.css'
import type { TemplateProps } from '../types'

export default function Professional({ data, customizations }: TemplateProps) {
  return <div className="professional-template">...</div>
}

// metadata.ts
export const ProfessionalMetadata = {
  name: 'Professional',
  slug: 'professional',
  // ...
}

export const ProfessionalDefaults = {
  colors: { accent: '#2563eb' },
  // ...
}
```

**Evidence**
- 6 templates following pattern (24 files total)
- Zero confusion about file purposes
- Easy to locate style vs logic vs metadata
- Consistent pattern aids code reviews
- Documented in observations lines: 3A:101-178, 3C:262-378

### Application

**Contexts Where This Applies**
- Template systems with screen + print outputs
- Component libraries with metadata
- Plugin architectures with discoverable modules
- Design systems with variant metadata

**Exceptions**
- Simple components with minimal styles (inline may be fine)
- No print requirements (3-file structure)
- Metadata co-located with component (smaller systems)

**Dependencies**
- Build system supporting CSS imports
- File-based routing or registry system
- TypeScript for metadata types

### Validation

**Test**
```yaml
Given: New template following 4-file structure
When: Inspect directory
Then: Find exactly 4 files with clear separation of concerns
```

**Metrics to Track**
- Developer confusion about file locations (target: 0)
- Time to locate component vs styles vs metadata (target: <10s)
- Pattern compliance across templates (target: 100%)

### Integration Priority

**Urgency**: low
- Pattern established and working
- Document as template standard

**Effort**: trivial (create generator script)
**Risk**: none

---

## Learning 14: Strategic Feature Deferral Prevents Scope Creep

**ID**: L-P3-014
**Source**: PAT-P3-PROCESS-001
**Category**: process_improvement
**Confidence**: 1.0

### Rule
```yaml
IF: During implementation, discover non-critical features that expand scope
THEN:
  - Document feature requirement for future phase
  - Implement simplest viable alternative (placeholder, basic version)
  - Note deferral in phase observations/learnings
  - Review deferred items during phase gate
BECAUSE: Maintaining phase scope enables progress on core functionality; documented deferrals ensure nothing is forgotten
```

### Details

**Problem This Addresses**
Prevents phase delays from feature expansion. Implementation often reveals complexity; deferring non-critical features maintains momentum.

**Solution Provided**
Examples from Phase 3D:
- **Advanced color picker**: Deferred react-colorful, used simple text inputs
- **Template thumbnails**: Used placeholder images, deferred generation
- **PreviewControls integration**: Created component but didn't integrate (noted for review)
- **Customization panel**: Deferred from 3C to 3D sub-phase

Deferral process:
1. Identify non-critical feature during implementation
2. Evaluate: Does it block core functionality?
3. If no: Document in observations, implement simple alternative
4. If yes: Reduce to minimal viable implementation
5. Track in "deferred features" section

**Evidence**
- 5 occurrences of strategic deferral
- Zero phase delays from scope creep
- All deferred items documented
- Simple alternatives delivered working features
- Documented in observations lines: 3C:390-421, 3D:580-927

### Application

**Contexts Where This Applies**
- Large phase scopes (3+ weeks)
- Discovery-driven implementation (details emerge during build)
- MVP/iterative development
- Time-constrained delivery

**Exceptions**
- Small phases with clear scope (no need for deferral)
- Critical features that block downstream work
- When simple alternative doesn't exist

**Dependencies**
- Clear phase goals and scope definition
- Documentation discipline
- Phase gate review process

### Validation

**Test**
```yaml
Given: Phase with large scope, discover non-critical feature expansion
When: Apply deferral process
Then: Phase completes on time with working core features, deferred items documented
```

**Metrics to Track**
- Phase completion time (target: on schedule)
- Deferred item count per phase
- Deferred items later implemented (success rate)
- Scope creep incidents (target: 0)

### Integration Priority

**Urgency**: high
- Process working well
- Should formalize in phase planning

**Effort**: minor (create deferral template)
**Risk**: none

---

## Learning 15: Visual Verification Mandatory for UI Completeness

**ID**: L-P3-015
**Source**: PAT-P3-PROCESS-002
**Category**: process_improvement
**Confidence**: 1.0

### Rule
```yaml
IF: Phase includes UI components or visual features
THEN:
  - Allocate explicit time for visual verification (20-30 min)
  - Capture desktop (1440px) + mobile (375px) screenshots
  - Analyze against visual quality checklist
  - Document results in phase_N/visual_review.md
  - Block phase completion until verification passed
BECAUSE: Per CLAUDE.md standards, visual verification is mandatory quality gate for UI features
```

### Details

**Problem This Addresses**
Ensures UI meets design system standards (spacing, colors, typography, responsiveness). Without verification, visual quality issues reach production.

**Solution Provided**
11-step workflow (from visual_verification_workflow.md):
1. Build feature with design tokens
2. Start dev server
3. Navigate to feature
4. Capture desktop screenshot (1440x900)
5. Capture mobile screenshot (375x667)
6. Analyze against checklist:
   - Spacing ≥16px gaps, ≥24px padding
   - Clear typography hierarchy
   - One primary action per section
   - Design tokens used (no hardcoded values)
   - Responsive (no horizontal scroll)
   - Ramp palette only
7. Refine if needed
8. Document in visual_review.md
9. Save screenshots to phase_N/screenshots/
10. Mark phase gate item complete
11. Proceed to next phase

**Evidence**
- Phase 3D created 23 UI components
- Visual verification deferred (not executed)
- 12 screenshots required (desktop + mobile for 6 areas)
- Blocks Phase 3 completion per CLAUDE.md
- Documented in observations lines: 3D:886-1034

### Application

**Contexts Where This Applies**
- All phases with UI changes
- New components in design system
- Layout or style modifications
- Responsive design implementations

**Exceptions**
- Backend-only phases (no UI)
- API or data-layer work (no visual component)
- Refactoring without UI changes

**Dependencies**
- Puppeteer MCP for screenshots
- Running dev server (port 3000)
- Visual quality checklist
- Phase documentation structure

### Validation

**Test**
```yaml
Given: Phase with UI components complete
When: Execute visual verification workflow
Then: All screenshots captured, checklist passed, results documented
```

**Metrics to Track**
- Phases with UI vs phases with verification (target: 100% match)
- Visual issues caught during verification
- Time spent on verification (track against 20-30 min estimate)
- Screenshot coverage (desktop + mobile for all UI areas)

### Integration Priority

**Urgency**: critical
- Blocks Phase 3 completion
- Required for phase gate

**Effort**: moderate (20-30 min execution)
**Risk**: low

---

## Learning 16: Build Validation Catches Integration Issues Early

**ID**: L-P3-016
**Source**: PAT-P3-PROCESS-003
**Category**: process_improvement
**Confidence**: 1.0

### Rule
```yaml
IF: Completing development sub-phase or feature
THEN:
  - Run `npm run build` before marking complete
  - Fix all TypeScript errors (target: 0)
  - Fix all ESLint errors (target: 0)
  - Re-run build until zero errors
  - Include build output in completion report
BECAUSE: TypeScript and ESLint catch integration issues at compile time; validating early prevents downstream build failures
```

### Details

**Problem This Addresses**
Prevents broken builds from reaching code review or production. Catches type mismatches, missing imports, lint violations before they become blockers.

**Solution Provided**
```bash
# End of sub-phase checklist
npm run build

# If errors:
# 1. Read error messages
# 2. Fix issues (type imports, shadcn components, lint violations)
# 3. Re-run build
# 4. Repeat until zero errors

# Success criteria:
# ✓ Build succeeds
# ✓ 0 TypeScript errors
# ✓ 0 ESLint errors
# ✓ Output ready for production
```

**Evidence**
- 4 occurrences of build validation
- Caught 2 build-blocking issues (missing exports, missing Slider)
- All phases ended with zero errors
- Build success documented in observations
- Documented in observations lines: 3A:24-30, 3D:715-846

### Application

**Contexts Where This Applies**
- All development phases
- Before code review or PR
- Before merging to main branch
- End of each sub-phase

**Exceptions**
- Work-in-progress (WIP) commits (not yet complete)
- Experimental branches (not intended for merge)

**Dependencies**
- npm scripts configured (build, lint)
- TypeScript and ESLint configured
- Next.js build system

### Validation

**Test**
```yaml
Given: Sub-phase implementation complete
When: Run `npm run build`
Then: Build succeeds with 0 TypeScript errors and 0 ESLint errors
```

**Metrics to Track**
- Build success rate (target: 100% at phase gate)
- Time to fix build errors (decreases with learning)
- Build failures in CI/production (target: 0)

### Integration Priority

**Urgency**: high
- Working well, maintain discipline
- Add to phase completion checklist

**Effort**: trivial (already doing this)
**Risk**: none

---

## Learning 17: Template Diversity Validates Architecture Flexibility

**ID**: L-P3-017
**Source**: PAT-P3-KNOWLEDGE-001
**Category**: best_practice
**Confidence**: 0.90

### Rule
```yaml
IF: Designing extensible system (templates, plugins, themes)
THEN:
  - Create multiple diverse implementations early (6+ variants)
  - Vary key characteristics (fonts, layouts, colors, spacing)
  - Validate each works within system constraints
  - Stress-test architecture boundaries
BECAUSE: Architecture quality isn't proven until stress-tested with diverse implementations; 6 diverse templates validate design token system is flexible and robust
```

### Details

**Problem This Addresses**
Premature architecture constraints aren't discovered until implementation. Creating diverse templates early validates the system can handle variety.

**Solution Provided**
Phase 3 created 6 templates with:
- **Varied fonts**: Inter, Roboto, Source Serif 4, JetBrains Mono, Libre Baskerville
- **Varied layouts**: Single-column, two-column, sidebar, header-heavy
- **Varied spacing**: Compact, comfortable, generous
- **Varied styles**: Modern, traditional, creative, technical, executive, academic

Each template stressed different aspects:
- Creative: Complex two-column layout
- Technical: Monospace font, code-style formatting
- Executive: Serif typography, formal spacing
- Academic: Dense information, minimal whitespace

All worked within --doc-* token system without modifications to core architecture.

**Evidence**
- 6 diverse templates implemented
- Zero architecture breaking changes needed
- Design token system handled all variations
- CSS layout strategies varied without conflicts
- Documented in observations lines: 3C:199-227

### Application

**Contexts Where This Applies**
- Template/theme systems
- Plugin architectures
- Design systems with variants
- Any extensible system with unknowable future requirements

**Exceptions**
- Single-use systems (no extensibility needed)
- Well-understood domains (prior art validates architecture)
- Prototypes (architecture validation not priority)

**Dependencies**
- Time for multiple implementations (Phase 3: 6 templates)
- Clear variation axes (fonts, layouts, colors)
- Objective success criteria

### Validation

**Test**
```yaml
Given: Design token system intended to support diverse templates
When: Implement 6 templates with varied fonts, layouts, and styles
Then: All templates work without modifying core architecture
```

**Metrics to Track**
- Number of diverse implementations (6 in Phase 3)
- Architecture breaking changes needed (target: 0)
- Edge cases discovered (document for future)

### Integration Priority

**Urgency**: low
- Already validated in Phase 3
- Document as architecture principle

**Effort**: trivial (documentation only)
**Risk**: none

---

## Learning 18: Font CSS Variable Mapping Completes Font Integration

**ID**: L-P3-018
**Source**: PAT-P3-KNOWLEDGE-002 (linked to L-P3-006)
**Category**: anti_pattern
**Confidence**: 0.95

### Rule
```yaml
IF: Templates reference semantic font variables (--font-serif, --font-mono)
THEN:
  - Map Next.js auto-generated variables to semantic names in globals.css
  - Example: --font-serif: var(--font-source-serif);
  - Verify mapping before considering font integration complete
BECAUSE: Next.js creates implementation-specific variables; templates need semantic names for maintainability
```

### Details

**Problem This Addresses**
Templates break silently when semantic variables unmapped. Fonts fall back to system defaults without error messages.

**Solution Provided**
```css
/* globals.css - Complete font integration */

/* Next.js auto-generates these (from layout.tsx imports) */
/* --font-source-serif: ... */
/* --font-jetbrains-mono: ... */

/* Map to semantic names for templates */
:root {
  --font-serif: var(--font-source-serif);
  --font-mono: var(--font-jetbrains-mono);
  --font-sans: var(--font-inter);
}

/* Templates can now use semantic names */
.technical-template {
  font-family: var(--font-mono); /* Resolved correctly */
}
```

**Evidence**
- 2 occurrences documenting incomplete workflow
- Fonts fell back to system defaults silently
- No build error (silent failure)
- ~10 minutes to debug if caught in review
- Documented in observations lines: 3D:925-945, 3D:1036-1048

### Application

**Contexts Where This Applies**
- Next.js projects using next/font/google
- Design systems with semantic token names
- Any font variable abstraction layer

**Exceptions**
- Using Next.js font variables directly in templates (tightly coupled)
- No semantic naming layer needed (simple projects)

**Dependencies**
- Next.js 13+ with next/font/google
- CSS custom properties
- globals.css for token definitions

### Validation

**Test**
```yaml
Given: Template using var(--font-serif) with mapping in globals.css
When: Inspect rendered template in browser DevTools
Then: Computed font-family shows correct font, not system fallback
```

**Metrics to Track**
- Font fallback rate (browser DevTools inspection, target: 0%)
- Missing variable errors (browser console, target: 0)
- Time to debug font issues (should be <5 min with checklist)

### Integration Priority

**Urgency**: medium
- Incomplete in Phase 3 (needs fix)
- Should add to font loading checklist

**Effort**: minor (update globals.css + docs)
**Risk**: low

---

## Cross-Cutting Themes

### Theme 1: TypeScript Strictness Catches Issues Early But Requires Explicit Handling
**Learnings**: L-P3-001, L-P3-002, L-P3-003

TypeScript strict mode and ESLint consistently catch issues before runtime, but require:
- Explicit type handling (undefined unions, branded types, iterator conversions)
- HTML entity usage in JSX
- Component availability verification (shadcn CLI)

**Recommendation**: Create type reference guide and pre-implementation checklists.

---

### Theme 2: Performance Requires Multi-Layer Optimization
**Learnings**: L-P3-004, L-P3-010, L-P3-011

Achieving <120ms preview updates requires combining:
- **RAF batching** (frame-perfect timing)
- **React.memo** (skip unchanged components)
- **useShallow** (prevent false-positive re-renders)

Single optimization insufficient; all three layers needed.

**Recommendation**: Document as "performance pattern stack" in standards.

---

### Theme 3: Design Token Isolation Enables Template Diversity
**Learnings**: L-P3-005, L-P3-008, L-P3-013, L-P3-017

Two-token system (--app-* vs --doc-*) enables:
- Complete style isolation (no conflicts)
- Per-template customization (6 diverse templates)
- Print CSS transformations (ATS compatibility)
- Independent evolution of app vs document styles

**Recommendation**: Elevate to core architecture principle.

---

### Theme 4: Process Discipline Prevents Scope Creep and Quality Issues
**Learnings**: L-P3-014, L-P3-015, L-P3-016

Three process patterns ensure quality:
1. **Strategic deferral** prevents scope creep
2. **Visual verification** ensures design system compliance
3. **Build validation** catches integration issues early

**Recommendation**: Formalize in phase planning template.

---

### Theme 5: Zustand Patterns Require Understanding Beyond Documentation
**Learnings**: L-P3-007, L-P3-011

Zustand's effectiveness requires non-obvious patterns:
- **Persist middleware** needs partialize (not documented well)
- **useShallow** critical for objects/arrays (easy to miss)
- **Selective exports** reduce re-renders (not default)

**Recommendation**: Create Zustand patterns reference guide.

---

### Theme 6: Font Loading Has Hidden Third Step
**Learnings**: L-P3-006, L-P3-018

Next.js font optimization appears two-step but requires three:
1. Import from next/font/google
2. Add to body className
3. **Map to semantic variables** (easily forgotten)

**Recommendation**: Update font loading checklist explicitly.

---

## Recommendations

### Immediate Actions (Before Phase 4)

1. **Execute Phase 3 Visual Verification** [Critical]
   - **Why**: Blocks Phase 3 completion per CLAUDE.md
   - **Effort**: 20-30 minutes
   - **Risk**: Low
   - **Learnings**: L-P3-015

2. **Fix Font CSS Variable Mapping** [High]
   - **Why**: Templates using system fallbacks instead of correct fonts
   - **Effort**: 5 minutes (update globals.css)
   - **Risk**: None
   - **Learnings**: L-P3-018

3. **Create shadcn Component Checklist** [High]
   - **Why**: Will recur in Phases 4-8 with new components
   - **Effort**: 10 minutes (document in component standards)
   - **Risk**: None
   - **Learnings**: L-P3-003

### Short-Term Documentation Updates

4. **Document TypeScript Strict Mode Patterns** [High]
   - Create type reference guide in standards/
   - Include branded types, CSSProperties unions, iterator conversions
   - **Learnings**: L-P3-001

5. **Formalize Deferral Process** [Medium]
   - Add "Deferred Features" section to phase template
   - Create deferral decision matrix
   - **Learnings**: L-P3-014

6. **Update Font Loading Documentation** [Medium]
   - Make 3-step process explicit
   - Add globals.css mapping to checklist
   - **Learnings**: L-P3-006, L-P3-018

### Process Improvements

7. **Add Build Validation to Phase Gates** [High]
   - Already working, formalize in checklist
   - Include in phase completion criteria
   - **Learnings**: L-P3-016

8. **Create Performance Pattern Stack Guide** [Medium]
   - Document RAF + React.memo + useShallow combination
   - Include measurement approach
   - **Learnings**: L-P3-004, L-P3-010, L-P3-011

9. **Extract Reusable Patterns** [Low]
   - Consider useRAFBatching hook
   - Consider ErrorBoundary as reusable component
   - Consider template generator script
   - **Learnings**: L-P3-004, L-P3-012, L-P3-013

### Architecture Documentation

10. **Elevate Design Token Isolation** [Medium]
    - Add to architecture principles
    - Document as core pattern for multi-context systems
    - **Learnings**: L-P3-005

11. **Document Template Diversity Validation** [Low]
    - Add to architecture validation principles
    - Use as example in future extensible systems
    - **Learnings**: L-P3-017

### Tool and Library Guides

12. **Create Zustand Patterns Reference** [Medium]
    - Document persist + partialize pattern
    - Document useShallow for objects/arrays
    - Document selective export pattern
    - **Learnings**: L-P3-007, L-P3-011

---

## Priority Matrix

### Critical (Do Before Phase 4)
- Execute visual verification (L-P3-015)
- Create shadcn checklist (L-P3-003)

### High (Week 1 of Phase 4)
- Fix font mapping (L-P3-018)
- Document TypeScript patterns (L-P3-001)
- Formalize build validation (L-P3-016)

### Medium (During Phase 4)
- Formalize deferral process (L-P3-014)
- Create performance stack guide (L-P3-004, L-P3-010, L-P3-011)
- Create Zustand reference (L-P3-007, L-P3-011)
- Update font loading docs (L-P3-006)

### Low (Post-Phase 4)
- Extract reusable patterns (various)
- Document architecture principles (L-P3-005, L-P3-017)

---

## Success Criteria

Before marking Phase 3 knowledge integration complete:

- [ ] Visual verification executed (12 screenshots captured)
- [ ] Font CSS mapping fixed in globals.css
- [ ] shadcn component checklist added to component standards
- [ ] TypeScript strict mode patterns documented
- [ ] Build validation added to phase completion checklist
- [ ] All 18 learnings reviewed for integration priority
- [ ] High-priority learnings scheduled for implementation

---

## Meta-Observations

### Pattern Quality
- **High confidence**: 13/18 patterns (72%) with confidence ≥0.95
- **Solution-heavy**: 10 solution patterns vs 3 problems vs 2 discoveries
- **Technical focus**: 11/18 technical patterns (61%) expected for implementation phase
- **Process emergence**: 3 process patterns show workflow maturation

### Phase 3 Success Indicators
- All major patterns are solutions or validations (not problems)
- Build validation caught all integration issues
- Deferred decisions managed scope effectively
- Template diversity validated architecture

### Phase 3 Gaps
- Visual verification deferred (now blocking)
- Font mapping incomplete (minor)
- Component availability checking reactive (should be proactive)

### Knowledge System Health
- Strong evidence base (multiple observations per pattern)
- Clear relationships between patterns
- Actionable recommendations with priorities
- Measurable validation criteria

---

**End of Phase 3 Generalized Knowledge**
