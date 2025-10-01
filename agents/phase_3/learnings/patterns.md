# Phase 3 Pattern Analysis

## Summary
- Total Observations Analyzed: 1105 lines (4 sub-phases: 3A, 3B, 3C, 3D)
- Patterns Identified: 18
- High-Priority Patterns: 7
- Categories: Technical [11], Process [4], Knowledge [3]

---

## Pattern 1: TypeScript Strict Mode Type Mismatches

**ID**: PAT-P3-TECHNICAL-001
**Category**: technical
**Type**: problem
**Frequency**: 6 occurrences
**Confidence**: 0.95

### Description
TypeScript strict mode consistently catches type mismatches that require explicit handling. Common issues include: CSSProperties requiring explicit `undefined` in union types, string vs branded type mismatches (e.g., `string` vs `TemplateSlug`), and iterator type conversions (`Map.entries()` requiring `Array.from()`).

### Evidence
Referenced observations:
- **Observation Phase 3A Lines 16-18**: CSSProperties type required explicit undefined handling
- **Observation Phase 3A Line 18**: Zod enum with numbers needs z.union + z.literal
- **Observation Phase 3A Line 19**: Map.entries() iteration required Array.from() wrapper
- **Observation Phase 3B Lines 90-95**: `string` vs `TemplateSlug` type error requiring explicit import
- **Observation Phase 3D Lines 747-756**: Property 'zoom' does not exist, should be 'zoomLevel'
- **Observation Phase 3D Lines 715-727**: Missing export `getAllTemplates`, should be `listTemplates`

### Impact Analysis
- **Time Lost**: ~45 minutes total (5-10 min per issue)
- **Components Affected**: rate-limit.ts, TemplateSelector.tsx, ZoomControl.tsx, template registry
- **Severity**: low
- **Blocking**: No

### Root Cause
TypeScript strict mode enforces precise type safety. The codebase uses branded types (TemplateSlug) and specific property names that differ from intuitive naming. Strict mode catches mismatches at compile time, preventing runtime errors but requiring explicit type handling.

### Recommended Action
1. Create type reference guide in `ai_docs/standards/` listing all branded types and their usage
2. Document common type patterns (CSSProperties unions, iterator conversions)
3. Add pre-implementation checklist: "Verify export names from source files before importing"
4. Use TypeScript's "Go to Definition" equivalent in context gathering phase

---

## Pattern 2: ESLint JSX String Escaping Requirements

**ID**: PAT-P3-TECHNICAL-002
**Category**: technical
**Type**: problem
**Frequency**: 3 occurrences
**Confidence**: 0.90

### Description
ESLint `react/no-unescaped-entities` rule requires HTML entities for apostrophes, quotes, and special characters in JSX text content. Straight quotes must be replaced with `&ldquo;/&rdquo;`, apostrophes with `&apos;`.

### Evidence
Referenced observations:
- **Observation Phase 3B Lines 96-100**: Unescaped apostrophe in JSX string, use `&apos;`
- **Observation Phase 3D Lines 731-741**: Unescaped quotes in JSX text, use `&ldquo;/&rdquo;`
- **Observation Phase 3B Lines 102-107**: Empty object pattern `{}` requires `_props` naming convention

### Impact Analysis
- **Time Lost**: ~20 minutes total (5-7 min per fix)
- **Components Affected**: TemplateSelector.tsx, ColorCustomizer.tsx, error boundary components
- **Severity**: low
- **Blocking**: Yes (build fails)

### Root Cause
ESLint accessibility rules enforce proper HTML entity usage. React interprets unescaped quotes/apostrophes as potential syntax errors. This is a best practice for accessibility and cross-browser compatibility.

### Recommended Action
1. Add ESLint rule documentation to component standards
2. Create pre-write checklist: "Use &ldquo;/&rdquo; for quotes, &apos; for apostrophes in JSX text"
3. Consider adding ESLint auto-fix configuration for common entities
4. Document unused prop naming convention: prefix with underscore `_props`

---

## Pattern 3: shadcn/ui Component Availability Checks

**ID**: PAT-P3-TECHNICAL-003
**Category**: technical
**Type**: problem
**Frequency**: 2 occurrences
**Confidence**: 1.0

### Description
Components from shadcn/ui must be explicitly installed via CLI before use. Build errors occur when importing non-existent components (Tabs, Slider). Each component requires `npx shadcn@latest add <component>`.

### Evidence
Referenced observations:
- **Observation Phase 3B Lines 108-112**: Tabs component not installed, run `npx shadcn@latest add tabs`
- **Observation Phase 3D Lines 760-770**: Slider component not installed, run `npx shadcn@latest add slider`

### Impact Analysis
- **Time Lost**: ~15 minutes total (5-8 min per issue including installation)
- **Components Affected**: CustomizationPanel.tsx, SpacingCustomizer.tsx
- **Severity**: medium
- **Blocking**: Yes (build fails)

### Root Cause
shadcn/ui is not a traditional npm package - it's a copy-paste component system. Components don't exist until explicitly added via CLI. No central registry to check availability programmatically.

### Recommended Action
1. Create shadcn/ui component checklist in `ai_docs/standards/component_standards.md`
2. Pre-implementation step: "Check if shadcn components exist; if unsure, run `ls components/ui/`"
3. Maintain list of installed components in project documentation
4. Add to code review checklist: "Verify all shadcn components are installed"

---

## Pattern 4: RAF (requestAnimationFrame) Batching for Performance

**ID**: PAT-P3-TECHNICAL-004
**Category**: technical
**Type**: solution
**Frequency**: 2 occurrences
**Confidence**: 1.0

### Description
RAF batching guarantees next-frame rendering and prevents excessive re-renders. Pattern requires: useRef for RAF ID, cancel pending RAF before scheduling new one, cleanup on unmount. Delivers <16ms updates consistently.

### Evidence
Referenced observations:
- **Observation Phase 3B Lines 50-58**: RAF batching is simple and effective, guarantees next-frame rendering
- **Observation Phase 3B Lines 59-65**: Double RAF required for scroll restoration (wait for render commit + browser paint)

### Impact Analysis
- **Time Lost**: 0 (successful pattern application)
- **Components Affected**: LivePreview.tsx, TemplateRenderer.tsx
- **Severity**: N/A (positive impact)
- **Blocking**: No

### Root Cause
React state updates and DOM updates happen asynchronously. Single RAF waits for render commit, but scroll position requires waiting for browser paint cycle (second RAF). This pattern aligns with browser rendering pipeline.

### Recommended Action
1. Document RAF patterns in `ai_docs/standards/performance_patterns.md`
2. Include "double RAF for scroll restoration" as reusable pattern
3. Add to performance review checklist for any live-preview features
4. Consider extracting `useRAFBatching` hook for reuse in future phases

---

## Pattern 5: Design Token Isolation (--doc-* vs --app-*)

**ID**: PAT-P3-TECHNICAL-005
**Category**: technical
**Type**: solution
**Frequency**: 6 occurrences
**Confidence**: 1.0

### Description
Two-token system provides complete style isolation: `--app-*` tokens for application UI, `--doc-*` tokens for document templates. Templates must NEVER use `--app-*` tokens. This prevents style conflicts and enables independent customization of templates vs app UI.

### Evidence
Referenced observations:
- **Observation Phase 3A Lines 13-14**: Design token isolation works perfectly without iframe/Shadow DOM overhead
- **Observation Phase 3C Lines 199-209**: Template diversity requires unique design systems per template
- **Observation Phase 3C Lines 324-347**: Design token overrides per template via `createTemplateDefaults()`
- **Observation Phase 3D Lines 824-830**: All customization components use `--app-*` tokens only
- **Observation Phase 3D Lines 256-275**: `--doc-*` tokens defined in globals.css, templates consume them
- **Observation Phase 3D Lines 925-945**: Font CSS variable mapping needs completion in globals.css

### Impact Analysis
- **Time Lost**: 0 (successful pattern from design phase)
- **Components Affected**: All 6 templates, CustomizationPanel, globals.css
- **Severity**: N/A (positive impact)
- **Blocking**: No

### Root Cause
Templates need to be visually isolated from app UI. Traditional approaches (iframes, Shadow DOM) add complexity and performance overhead. CSS custom properties with scoped naming conventions provide isolation with zero runtime cost.

### Recommended Action
1. Document token naming convention in `ai_docs/design-system.md`
2. Add to code review checklist: "Templates use ONLY --doc-* tokens"
3. Create ESLint rule (future) to enforce token usage by directory
4. Complete font variable mapping in globals.css (see Pattern 12)

---

## Pattern 6: Font Loading via Next.js Font Optimization

**ID**: PAT-P3-TECHNICAL-006
**Category**: technical
**Type**: solution
**Frequency**: 3 occurrences
**Confidence**: 0.95

### Description
Next.js `next/font/google` provides automatic font optimization (self-hosting, subsetting, preloading). Pattern requires: import from `next/font/google`, configure with `subsets`, `variable`, `display: 'swap'`, add CSS variables to body className.

### Evidence
Referenced observations:
- **Observation Phase 3C Lines 421-434**: Fonts not validated, need JetBrains Mono and Source Serif 4
- **Observation Phase 3D Lines 628-657**: Font loading implementation with next/font/google
- **Observation Phase 3D Lines 925-945**: Font CSS variable mapping incomplete in globals.css

### Impact Analysis
- **Time Lost**: ~30 minutes (font loading + debugging missing mappings)
- **Components Affected**: layout.tsx, globals.css, Technical/Executive templates
- **Severity**: medium
- **Blocking**: No (fonts fall back to system defaults)

### Root Cause
Next.js font optimization requires explicit import and CSS variable setup. Templates reference fonts via CSS variables (`var(--font-serif)`), but variables must be defined in globals.css and linked to Next.js font variables.

### Recommended Action
1. Document font loading pattern in `ai_docs/standards/component_standards.md`
2. Create font loading checklist:
   - [ ] Import from next/font/google
   - [ ] Add to body className
   - [ ] Map to CSS variables in globals.css
   - [ ] Verify templates can access fonts
3. Add font fallback validation to visual verification workflow
4. Complete CSS variable mapping (see Known Limitation in Phase 3D observations)

---

## Pattern 7: Zustand Store with Persist Middleware

**ID**: PAT-P3-TECHNICAL-007
**Category**: technical
**Type**: solution
**Frequency**: 2 occurrences
**Confidence**: 1.0

### Description
Zustand persist middleware enables localStorage persistence with selective serialization. Pattern requires: wrap store creator with `persist()`, use `partialize` to exclude actions, define localStorage key, export selective hooks for optimal re-renders.

### Evidence
Referenced observations:
- **Observation Phase 3C Lines 244-261**: Zustand persist middleware implementation with partialize
- **Observation Phase 3D Lines 774-800**: Store hook patterns with selective exports

### Impact Analysis
- **Time Lost**: 0 (successful pattern application)
- **Components Affected**: templateStore.ts, all customization components
- **Severity**: N/A (positive impact)
- **Blocking**: No

### Root Cause
State persistence is essential for user preferences across sessions. Zustand's persist middleware provides simple localStorage integration. Selective hooks prevent unnecessary re-renders (only components using specific state slices re-render on change).

### Recommended Action
1. Document Zustand patterns in `ai_docs/standards/state_management.md`
2. Create reusable store template for future state needs
3. Add to architecture checklist: "Use selective exports for store hooks"
4. Consider extracting common persist configuration

---

## Pattern 8: Print CSS Layout Transformations

**ID**: PAT-P3-TECHNICAL-008
**Category**: technical
**Type**: solution
**Frequency**: 4 occurrences
**Confidence**: 1.0

### Description
Print CSS must transform layouts for ATS compatibility and print medium. Critical transformations: two-column to single-column, remove gradients/backgrounds (convert to grayscale), reduce font sizes 10-15%, force background printing for colored elements.

### Evidence
Referenced observations:
- **Observation Phase 3C Lines 226-244**: Print CSS handles layout transformations (Creative two-column → single column)
- **Observation Phase 3C Lines 292-311**: Two-column layout print conversion pattern
- **Observation Phase 3A Lines 115-121**: Print CSS per template (100 lines avg)
- **Observation Phase 3C**: All 3 additional templates include print.css files

### Impact Analysis
- **Time Lost**: 0 (successful pattern from design phase)
- **Components Affected**: All 6 templates (print.css files)
- **Severity**: N/A (positive impact)
- **Blocking**: No

### Root Cause
ATS systems parse resumes sequentially and cannot handle complex layouts. Print medium requires grayscale and optimized spacing. Print CSS separates print-specific styles from screen styles for maintainability.

### Recommended Action
1. Document print CSS patterns in `ai_docs/standards/template_standards.md`
2. Create print CSS template with common transformations
3. Add to template review checklist:
   - [ ] Two-column layouts collapse to single column
   - [ ] Backgrounds removed or converted to borders
   - [ ] Font sizes reduced 10-15%
   - [ ] Page break control applied
4. Test print output in Phase 4 (PDF export)

---

## Pattern 9: Template Registry CommonJS Pattern

**ID**: PAT-P3-TECHNICAL-009
**Category**: technical
**Type**: discovery
**Frequency**: 2 occurrences
**Confidence**: 0.85

### Description
Template registry uses CommonJS `require()` for synchronous loading. Pattern requires consistent naming: component exports as default, metadata exports as named exports (`{name}Metadata`, `{name}Defaults`). Registry structure uses object with `component`, `metadata`, `defaults` keys.

### Evidence
Referenced observations:
- **Observation Phase 3C Lines 312-329**: Template registry requires consistency in component/metadata exports
- **Observation Phase 3D Lines 715-727**: Export name verification before importing (getAllTemplates → listTemplates)

### Impact Analysis
- **Time Lost**: ~10 minutes (troubleshooting export name mismatch)
- **Components Affected**: registry.ts, all 6 templates
- **Severity**: low
- **Blocking**: Yes (build fails on incorrect exports)

### Root Cause
Registry needs synchronous access to metadata without loading components (for template listings). CommonJS `require()` enables this, but requires strict naming conventions. ES module dynamic imports would be async, complicating registry API.

### Recommended Action
1. Document registry pattern in `ai_docs/standards/template_standards.md`
2. Create template scaffold generator for new templates
3. Add to template review checklist:
   - [ ] Component: default export
   - [ ] Metadata: named export as `{name}Metadata`
   - [ ] Defaults: named export as `{name}Defaults`
4. Consider migrating to dynamic imports with async registry in future optimization

---

## Pattern 10: React.memo for Template Optimization

**ID**: PAT-P3-TECHNICAL-010
**Category**: technical
**Type**: solution
**Frequency**: 6 occurrences
**Confidence**: 1.0

### Description
All template components wrapped with React.memo to prevent unnecessary re-renders. Templates are pure functions of data + customizations, making them ideal memo candidates. Enables shallow prop comparison optimization.

### Evidence
Referenced observations:
- **Observation Phase 3A Lines 103-108**: All templates use React.memo optimization
- **Observation Phase 3C Lines 199-227**: Template diversity validates memo approach (each template is self-contained)
- **Observation Phase 3B Lines 114-123**: RAF batching + React.memo = <16ms updates
- **Observation Phase 3B Line 136**: React.memo optimization applied

### Impact Analysis
- **Time Lost**: 0 (proactive optimization)
- **Components Affected**: All 6 template components
- **Severity**: N/A (positive impact)
- **Blocking**: No

### Root Cause
Templates re-render frequently (every keystroke triggers preview update). Without memoization, React would re-render all template components even when props haven't changed. React.memo adds shallow comparison to skip unnecessary renders.

### Recommended Action
1. Document React.memo pattern in `ai_docs/standards/performance_patterns.md`
2. Add to component checklist: "Pure presentation components should use React.memo"
3. Consider profiling re-render frequency in Phase 4 performance testing
4. Extend pattern to other preview-related components

---

## Pattern 11: useShallow for Zustand Selector Optimization

**ID**: PAT-P3-TECHNICAL-011
**Category**: technical
**Type**: solution
**Frequency**: 2 occurrences
**Confidence**: 1.0

### Description
`useShallow` from Zustand prevents unnecessary re-renders when selecting objects/arrays from store. Without it, component re-renders on ANY store change. With it, re-renders only when selected data changes (shallow equality).

### Evidence
Referenced observations:
- **Observation Phase 3B Lines 66-73**: useShallow is critical for performance
- **Observation Phase 3B Line 140**: Shallow selectors implemented

### Impact Analysis
- **Time Lost**: 0 (proactive optimization)
- **Components Affected**: LivePreview.tsx, components consuming store objects
- **Severity**: N/A (positive impact)
- **Blocking**: No

### Root Cause
Zustand creates new references for objects/arrays on every state update. React's default equality check (===) always sees new reference as changed. useShallow performs shallow comparison of object properties, preventing false-positive re-renders.

### Recommended Action
1. Document useShallow pattern in `ai_docs/standards/state_management.md`
2. Add to Zustand usage checklist: "Use useShallow when selecting objects/arrays"
3. Consider creating wrapper hook for common patterns
4. Profile re-render frequency in Phase 4 performance testing

---

## Pattern 12: Error Boundaries Require Class Components

**ID**: PAT-P3-TECHNICAL-012
**Category**: technical
**Type**: knowledge
**Frequency**: 1 occurrence
**Confidence**: 1.0

### Description
React error boundaries must be class components - no functional component equivalent exists. Pattern requires: class-based component, componentDidCatch lifecycle, getDerivedStateFromError static method, user-friendly fallback UI.

### Evidence
Referenced observations:
- **Observation Phase 3B Lines 74-79**: Error boundaries must be class components, no hooks equivalent

### Impact Analysis
- **Time Lost**: 0 (known pattern applied correctly)
- **Components Affected**: PreviewError.tsx (error boundary)
- **Severity**: N/A (knowledge pattern)
- **Blocking**: No

### Root Cause
React's error boundary API predates hooks and has no functional equivalent. Facebook maintains class-based API for backward compatibility. This is a rare case where classes are required in modern React.

### Recommended Action
1. Document error boundary pattern in `ai_docs/standards/component_standards.md`
2. Create reusable error boundary component for future phases
3. Add to component checklist: "Error handling at component boundaries requires class component"
4. Consider creating wrapper hook for ergonomic error boundary usage

---

## Pattern 13: Template Metadata Four-File Structure

**ID**: PAT-P3-TECHNICAL-013
**Category**: technical
**Type**: solution
**Frequency**: 6 occurrences
**Confidence**: 1.0

### Description
Each template requires exactly 4 files: Component (.tsx), Styles (.css), Print (.css), Metadata (.ts). This structure separates concerns: component logic, screen styles, print styles, template information. Pattern applied consistently across all 6 templates.

### Evidence
Referenced observations:
- **Observation Phase 3C Lines 262-277**: Template metadata structure with 4 files
- **Observation Phase 3A Lines 101-178**: All 3 initial templates follow 4-file pattern
- **Observation Phase 3C Lines 360-378**: All 6 templates use consistent 4-file structure

### Impact Analysis
- **Time Lost**: 0 (successful pattern from design)
- **Components Affected**: All 6 templates (24 files total)
- **Severity**: N/A (positive impact)
- **Blocking**: No

### Root Cause
Separation of concerns improves maintainability. Screen vs print styles have different requirements. Metadata enables template selection without loading component code. Four-file structure balances organization with simplicity.

### Recommended Action
1. Document template file structure in `ai_docs/standards/template_standards.md`
2. Create template generator script for new templates
3. Add to template review checklist: "Verify 4-file structure: .tsx, styles.css, print.css, metadata.ts"
4. Consider code-splitting optimization in Phase 4

---

## Pattern 14: Deferred Implementation Decisions

**ID**: PAT-P3-PROCESS-001
**Category**: process
**Type**: discovery
**Frequency**: 5 occurrences
**Confidence**: 1.0

### Description
Strategic deferral of non-critical features to maintain phase scope. Examples: advanced color picker deferred to simple text inputs, PreviewControls created but not integrated, template thumbnails as placeholders. Pattern enables progress on core functionality while documenting future enhancements.

### Evidence
Referenced observations:
- **Observation Phase 3C Lines 390-407**: Customization panel deferred from 3C to 3D
- **Observation Phase 3D Lines 580-599**: Simple color input strategy (deferred react-colorful)
- **Observation Phase 3D Lines 866-883**: PreviewControls not integrated (noted for review)
- **Observation Phase 3C Lines 408-421**: Template thumbnails placeholder (deferred creation)
- **Observation Phase 3D Lines 913-927**: Advanced color picker deferred

### Impact Analysis
- **Time Lost**: 0 (prevented scope creep)
- **Components Affected**: ColorCustomizer.tsx, PreviewControls.tsx, template metadata
- **Severity**: N/A (positive impact)
- **Blocking**: No

### Root Cause
Phase scopes are large and implementation reveals complexity. Deferring non-critical features prevents phase delays while maintaining deliverable quality. Documentation ensures deferred items aren't forgotten.

### Recommended Action
1. Formalize deferral process in phase planning documents
2. Create "deferred features" section in each phase output
3. Add to phase gate checklist: "Review deferred items before marking complete"
4. Track deferred items across phases (some may never be needed)

---

## Pattern 15: Visual Verification Mandatory for UI

**ID**: PAT-P3-PROCESS-002
**Category**: process
**Type**: problem
**Frequency**: 3 occurrences
**Confidence**: 1.0

### Description
Visual verification (screenshots + analysis) required for all UI features per CLAUDE.md standards. Phase 3D created 23 UI components but visual verification deferred to separate step. Playbooks created but not executed. Requirement: desktop (1440px) + mobile (375px) screenshots for all UI.

### Evidence
Referenced observations:
- **Observation Phase 3D Lines 886-912**: Visual verification pending, 12 screenshots required
- **Observation Phase 3D Lines 982-1034**: Recommendations for visual verification
- **Observation Phase 3D Lines 1001-1034**: Visual quality checklist items

### Impact Analysis
- **Time Lost**: 0 (proactive deferral to separate step)
- **Components Affected**: All 23 Phase 3D components + 6 templates
- **Severity**: medium (required for phase completion)
- **Blocking**: Yes (per CLAUDE.md standards)

### Root Cause
Visual verification is time-consuming (20-30 min per phase) and separate concern from implementation. Creating components and verifying visual quality are distinct skills. Phase 3D scope was already large (23 files).

### Recommended Action
1. Add visual verification as explicit sub-phase in future phases
2. Allocate dedicated time for screenshot capture + analysis
3. Create visual verification template with checklist
4. Consider automated screenshot generation via Puppeteer
5. Execute Phase 3 visual verification before marking phase complete

---

## Pattern 16: Build Validation Workflow

**ID**: PAT-P3-PROCESS-003
**Category**: process
**Type**: solution
**Frequency**: 4 occurrences
**Confidence**: 1.0

### Description
Consistent build validation workflow applied at end of each sub-phase: `npm run build` → fix errors → re-run build → verify zero errors. Pattern catches integration issues early and ensures deliverable quality.

### Evidence
Referenced observations:
- **Observation Phase 3A Lines 24-30**: Build succeeds with no errors, TypeScript strict mode passes
- **Observation Phase 3D Lines 833-846**: Build validation with zero TypeScript/ESLint errors
- **Observation Phase 3D Lines 715-727**: Build error caught (missing export)
- **Observation Phase 3D Lines 760-770**: Build error caught (missing Slider component)

### Impact Analysis
- **Time Lost**: 0 (prevents downstream issues)
- **Components Affected**: All phase deliverables
- **Severity**: N/A (positive impact)
- **Blocking**: No

### Root Cause
TypeScript and ESLint catch integration issues at compile time. Running build before marking phase complete ensures code compiles and follows standards. Catches issues before they reach review phase.

### Recommended Action
1. Document build workflow in `ai_docs/standards/code_review_standards.md`
2. Add to phase completion checklist: "Run `npm run build` and verify zero errors"
3. Consider adding pre-commit hook (future) to enforce build success
4. Include build output in phase completion reports

---

## Pattern 17: Template Diversity Validation

**ID**: PAT-P3-KNOWLEDGE-001
**Category**: knowledge
**Type**: discovery
**Frequency**: 1 occurrence
**Confidence**: 0.90

### Description
Creating 6 diverse templates validated the design token system and template architecture. Each template has unique characteristics (fonts, layouts, spacing) that would break if architecture was brittle. Successful diversity proves system flexibility.

### Evidence
Referenced observations:
- **Observation Phase 3C Lines 199-227**: Template diversity requires unique design systems, validates --doc-* system
- **Observation Phase 3C Lines 210-227**: CSS layout strategies vary by template

### Impact Analysis
- **Time Lost**: 0 (validation benefit)
- **Components Affected**: All 6 templates, design token system
- **Severity**: N/A (positive impact)
- **Blocking**: No

### Root Cause
Architecture quality isn't proven until stress-tested with diverse implementations. Six templates with different fonts, layouts, and styles validate that design token system is flexible and robust.

### Recommended Action
1. Document template diversity as architecture validation in project documentation
2. Add "diversity test" concept to architecture principles
3. Consider applying pattern to other extensible systems (exporters, scorers)
4. Use template diversity as example in architecture presentations

---

## Pattern 18: Font CSS Variable Incomplete Mapping

**ID**: PAT-P3-KNOWLEDGE-002
**Category**: knowledge
**Type**: problem
**Frequency**: 2 occurrences
**Confidence**: 0.95

### Description
Font loading requires three steps: Next.js import, body className, CSS variable mapping in globals.css. Phase 3D completed first two but left third incomplete. Templates reference `var(--font-serif)` but mapping to Next.js variables (`--font-source-serif`) missing.

### Evidence
Referenced observations:
- **Observation Phase 3D Lines 925-945**: Font CSS variable mapping incomplete in globals.css
- **Observation Phase 3D Lines 1036-1048**: Recommendation to verify font CSS variable mapping

### Impact Analysis
- **Time Lost**: ~10 minutes (if caught in review)
- **Components Affected**: globals.css, Technical/Executive templates
- **Severity**: low
- **Blocking**: No (fonts fall back to system defaults)

### Root Cause
Font integration has implicit third step not documented. Next.js `next/font/google` creates variables like `--font-source-serif`, but templates need simpler names like `--font-serif`. Mapping step easy to forget.

### Recommended Action
1. Update font loading documentation with explicit 3-step process:
   - [ ] Import from next/font/google
   - [ ] Add to body className
   - [ ] Map to CSS variables in globals.css (`:root { --font-serif: var(--font-source-serif); }`)
2. Add CSS variable mapping to font loading checklist
3. Fix globals.css mapping in Phase 3 review
4. Add to visual verification: "Check font rendering, not falling back to system fonts"

---

## Pattern Relationships

### Parent-Child Relationships
- **Pattern 4 (RAF Batching)** is implemented alongside **Pattern 10 (React.memo)** and **Pattern 11 (useShallow)** to achieve <120ms preview updates
- **Pattern 5 (Design Token Isolation)** enables **Pattern 8 (Print CSS Transformations)** and **Pattern 17 (Template Diversity)**
- **Pattern 6 (Font Loading)** requires **Pattern 18 (CSS Variable Mapping)** to be complete

### Common Root Causes
- **Patterns 1, 2, 3** share root cause: Development tool strictness (TypeScript, ESLint, CLI requirements)
- **Patterns 5, 8, 13** share root cause: Separation of concerns architecture principle
- **Patterns 14, 15** share root cause: Phase scope management and time constraints

### Solution Patterns Addressing Problems
- **Pattern 4 (RAF Batching)** solves performance problem
- **Pattern 5 (Design Token Isolation)** solves style conflict problem
- **Pattern 7 (Zustand Persist)** solves state persistence problem
- **Pattern 16 (Build Validation)** catches problems from Patterns 1, 2, 3 early

### Sequential Dependencies
1. **Pattern 5** (Design Tokens) → **Pattern 13** (Template Structure) → **Pattern 17** (Diversity Validation)
2. **Pattern 6** (Font Loading) → **Pattern 18** (Variable Mapping) [incomplete chain]
3. **Pattern 7** (Zustand Store) → **Pattern 11** (useShallow optimization)

---

## High-Priority Patterns

Patterns requiring immediate action or high likelihood of recurrence:

### 1. Pattern 3: shadcn/ui Component Checks
- **Priority**: HIGH
- **Reason**: Blocks build on every occurrence
- **Recurrence**: Likely in Phase 4, 5, 6 (new UI components)
- **Action**: Create shadcn component checklist before implementation

### 2. Pattern 5: Design Token Isolation
- **Priority**: HIGH
- **Reason**: Core to template system, must be maintained
- **Recurrence**: Every new template or UI component
- **Action**: Add to code review checklist, consider ESLint rule

### 3. Pattern 15: Visual Verification
- **Priority**: HIGH
- **Reason**: Required for phase completion per CLAUDE.md
- **Recurrence**: Every phase with UI changes
- **Action**: Execute Phase 3 visual verification before Phase 4

### 4. Pattern 1: TypeScript Strict Mode
- **Priority**: MEDIUM
- **Reason**: Frequent but low impact (caught at compile time)
- **Recurrence**: Every phase with new types
- **Action**: Create type reference guide

### 5. Pattern 14: Deferred Implementation
- **Priority**: MEDIUM
- **Reason**: Prevents scope creep, but need tracking
- **Recurrence**: Every phase with large scope
- **Action**: Formalize deferral process

### 6. Pattern 16: Build Validation
- **Priority**: MEDIUM
- **Reason**: Essential quality gate
- **Recurrence**: Every phase
- **Action**: Already working, maintain discipline

### 7. Pattern 18: Font CSS Variable Mapping
- **Priority**: MEDIUM
- **Reason**: Incomplete in Phase 3, easy to miss
- **Recurrence**: Any font additions in future
- **Action**: Complete mapping, update documentation

---

## Recommendations for Next Agent

Guidance for Knowledge Generalizer:

### Generalizable Patterns (Project-Wide)
- **Pattern 3** (shadcn checks): Applies to any future UI components
- **Pattern 5** (Design tokens): Applies to all style-related code
- **Pattern 16** (Build validation): Applies to all phases
- **Pattern 14** (Deferred decisions): Applies to all phase planning

### Phase-Specific Patterns (Template System Only)
- **Pattern 8** (Print CSS): Only templates need print styles
- **Pattern 9** (Template registry): Only template system uses this pattern
- **Pattern 13** (4-file structure): Specific to templates

### Documentation Update Priorities
1. **High**: Create `type_reference_guide.md` (Pattern 1)
2. **High**: Update `component_standards.md` with shadcn checklist (Pattern 3)
3. **High**: Execute visual verification workflow (Pattern 15)
4. **Medium**: Document font loading 3-step process (Patterns 6, 18)
5. **Medium**: Formalize deferral process (Pattern 14)

### Patterns Needing Immediate Action
- **Pattern 18**: Complete CSS variable mapping in globals.css
- **Pattern 15**: Execute Phase 3 visual verification (blocking phase completion)
- **Pattern 3**: Create shadcn component list before Phase 4

### Knowledge Gaps Identified
- Font loading complete workflow (3 steps, not 2)
- Error boundary class component requirement (rare React pattern)
- Double RAF for scroll restoration (browser rendering pipeline knowledge)
- Zustand persist partialize pattern (not obvious from docs)

---

## Meta-Analysis

### Pattern Quality Observations
- **High confidence patterns** (1.0): 13 out of 18 (72%) - strong evidence
- **Solution patterns**: 10 out of 18 (56%) - more solutions than problems
- **Technical patterns dominate**: 11 out of 18 (61%) - expected for implementation phase
- **Process patterns emerging**: 4 patterns show workflow improvements needed

### Phase 3 Success Indicators
- Multiple solution patterns validated (RAF, design tokens, Zustand)
- Build validation workflow caught all integration issues
- Deferred decisions managed scope effectively
- Template diversity validated architecture

### Phase 3 Improvement Areas
- Visual verification deferred but required
- Font mapping incomplete (minor)
- Need better component availability checking (shadcn)
- Type documentation could prevent small delays

### Recommendations for Future Phases
1. **Phase 4**: Expect similar TypeScript strict mode issues (Pattern 1)
2. **Phase 5**: May need additional shadcn components (Pattern 3)
3. **All phases**: Apply build validation workflow (Pattern 16)
4. **All phases**: Consider visual verification timing (Pattern 15)
