# Implementation Plan: Template System Improvements

## Executive Summary

ResumePair's template system has three critical issues that undermine maintainability and user experience: (1) spacing values are hardcoded across 12+ template files, creating visual inconsistencies and making global changes impossible; (2) default typography values conflict between schema (14px, 1.5 line height, IBM Plex Serif) and mapper (16px, 1.4 line height, Inter), with the mapper overriding schema and creating below-WCAG line heights; (3) font family support is limited to 3 fonts with proper fallback stacks, restricting customization options. This plan establishes centralized spacing tokens using CSS custom properties in the `--doc-*` namespace, aligns typography defaults to a single source of truth (16px, 1.5 line height, Inter), and expands font support to 8+ professional fonts with complete fallback stacks—all without modifying the ResumeJson schema.

---

## Root Cause Analysis

### Issue 1: Spacing System Lacks Centralization

**Root Cause** [TEMPLATE_ISSUES_OUR_IMPLEMENTATION.md:114-201]:
- Only `--margin` CSS custom property exists for page-level spacing
- Section gaps (`space-y-3`, `space-y-4`), item gaps (`gap-x-6`, `gap-y-3`), and column gaps (`gap-x-4`) hardcoded across 12 template files
- No semantic design tokens (`--doc-section-gap`, `--doc-item-gap`, `--doc-column-gap`)
- Inconsistent values: Azurill uses `space-y-3` (12px) between sections, Kakuna uses `space-y-4` (16px)
- Mixing `space-*` (margin-based) and `gap-*` (gap-based) utilities without system

**Why It's Broken**:
Templates directly embed Tailwind spacing classes (`className="space-y-4"`), making global spacing changes impossible without editing 12+ files individually. Each template chose spacing values ad-hoc during development, resulting in visual inconsistency. Users cannot adjust spacing via appearance settings because no metadata property controls it.

**Fix Strategy**:
Adopt Reactive Resume's multi-tier spacing system [TEMPLATE_FEATURES_SOURCE_REFERENCE.md:146-263]. Create CSS custom properties for each spacing tier (`--doc-section-gap`, `--doc-item-gap`, `--doc-column-gap`), inject them via `buildArtboardStyles()` function, and update all templates to reference these variables through Tailwind utilities. This centralizes spacing control while maintaining ResumePair's design token architecture (01_architecture.md, 04_design_system.md).

---

### Issue 2: Default Typography Values Are Inconsistent

**Root Cause** [TEMPLATE_ISSUES_OUR_IMPLEMENTATION.md:442-569]:
- **Schema defaults** [schema/metadata/index.ts:32-38, 70-76]: 14px font size, 1.5 line height, IBM Plex Serif
- **Mapper defaults** [mappers/resume.ts:137-141, 168-169]: 16px font size (scaled), 1.4 line height, Inter
- Schema defaults are **dead code**—mapper never reads them, computes values from `resume.settings.fontSizeScale` and `resume.settings.lineSpacing`
- Line height 1.4 violates WCAG 2.1 AA guidelines (minimum 1.5 for body text)

**Why It's Broken**:
Two sources of truth exist but only one is used. The schema documents defaults that never apply in practice. New resumes receive mapper defaults (16px/1.4/Inter) regardless of schema values. Developers reading schema documentation see 14px/1.5/IBM Plex Serif, creating confusion. The 1.4 line height reduces readability and accessibility.

**Fix Strategy**:
Align mapper and schema to single source of truth. Update mapper line height from 1.4 to 1.5 for WCAG compliance. Either (A) update schema defaults to match mapper reality (16px, 1.5, Inter) OR (B) make mapper read schema defaults. Option A is recommended: documents actual behavior, avoids schema-to-mapper plumbing, and 16px is web standard for body text.

---

### Issue 3: Limited Font Family Support

**Root Cause** [TEMPLATE_ISSUES_OUR_IMPLEMENTATION.md:486-539]:
- `FONT_FAMILY_MAP` [mappers/resume.ts:18-22] contains only 3 fonts with fallback stacks: Inter, Source Sans 3, Georgia
- Any other font family falls through to user's raw input without fallback stack
- No system fonts (Roboto, Open Sans, Lato, etc.) despite being widely available and professional

**Why It's Broken**:
Users selecting fonts outside the 3-font whitelist receive no fallback stack. If the primary font fails to load, browser defaults to system serif/sans-serif, causing layout shifts and unprofessional appearance. Limited font options restrict customization and brand alignment.

**Fix Strategy**:
Expand `FONT_FAMILY_MAP` to include 8+ professional fonts covering common use cases: Inter (modern sans), Roboto (Google standard), Open Sans (web-safe), Lato (geometric), Merriweather (serif), Source Serif 4 (professional serif), Georgia (classic serif), Playfair Display (elegant). Each entry includes complete fallback stack terminating in generic font family (sans-serif/serif/monospace).

---

## Implementation Plan

### Phase 1: Centralize Spacing System (Issue 1)

**Goal**: Replace hardcoded spacing with centralized CSS custom properties in `--doc-*` namespace

#### Step 1.1: Define Spacing Tokens in Metadata Type

**File**: `/Users/varunprasad/code/prjs/resumepair/libs/reactive-artboard/types.ts`

**Change**: Add spacing configuration to `ArtboardMetadata` type
```typescript
// Add to existing ArtboardMetadata interface
export interface ArtboardMetadata {
  colors: { background: string; text: string; primary: string }
  typography: {
    fontFamily: string
    fontSize: number
    lineHeight: number
  }
  page: {
    format: 'letter' | 'a4'
    margin: number
    showPageNumbers: boolean
  }
  customCss?: string
  // NEW: Spacing configuration
  spacing?: {
    sectionGap: number    // Gap between major sections (default: 16px)
    itemGap: number       // Gap between items within section (default: 8px)
    columnGap: number     // Gap between columns in grid (default: 24px)
  }
}
```

**Rationale**: Follows ResumePair's architecture principle of schema-driven design (01_architecture.md). Spacing is metadata property, not schema change, preserving backwards compatibility. Default values match Reactive Resume's proven spacing scale [SOURCE_REFERENCE.md:227-236].

---

#### Step 1.2: Inject Spacing CSS Variables in Styles Builder

**File**: `/Users/varunprasad/code/prjs/resumepair/libs/reactive-artboard/styles.ts`

**Change**: Extend `buildArtboardStyles()` function to inject spacing variables
```typescript
// In buildArtboardStyles function, add to root CSS variable block (line ~730)

const sectionGap = metadata.spacing?.sectionGap ?? 16
const itemGap = metadata.spacing?.itemGap ?? 8
const columnGap = metadata.spacing?.columnGap ?? 24

const root = `
  :root {
    /* Existing color variables */
    --artboard-color-background: ${metadata.colors.background};
    --artboard-color-text: ${metadata.colors.text};
    --artboard-color-primary: ${metadata.colors.primary};

    /* Existing typography variables */
    --artboard-font-family: ${metadata.typography.fontFamily};
    --artboard-font-size: ${metadata.typography.fontSize}px;
    --artboard-line-height: ${metadata.typography.lineHeight};

    /* Existing margin variable */
    --margin: ${pageMarginPx}px;
    --line-height: ${metadata.typography.lineHeight};

    /* NEW: Spacing tier variables (--doc-* namespace) */
    --doc-section-gap: ${sectionGap}px;
    --doc-item-gap: ${itemGap}px;
    --doc-column-gap: ${columnGap}px;

    /* Color variables (HSL format) */
    --color-background: ${metadata.colors.background};
    --color-foreground: ${metadata.colors.text};
    --color-primary: ${metadata.colors.primary};
    /* ... rest of existing color variables */
  }
`
```

**Rationale**: Uses ResumePair's established design token namespace `--doc-*` for template-specific tokens (04_design_system.md). Defaults match Reactive Resume's multi-tier spacing system [SOURCE_REFERENCE.md:755]. CSS custom properties enable runtime customization without recompiling templates.

---

#### Step 1.3: Update Tailwind Config to Reference Spacing Tokens

**File**: `/Users/varunprasad/code/prjs/resumepair/tailwind.artboard.config.js`

**Change**: Add spacing token utilities alongside existing `custom` spacing
```javascript
// In theme.extend.spacing (line ~23)
spacing: {
  custom: 'var(--margin)',  // Existing page margin token
  // NEW: Spacing tier tokens
  'doc-section': 'var(--doc-section-gap)',
  'doc-item': 'var(--doc-item-gap)',
  'doc-column': 'var(--doc-column-gap)',
},
```

**Rationale**: Exposes CSS variables as Tailwind utilities (`gap-doc-section`, `space-y-doc-item`), enabling type-safe usage in templates with IDE autocomplete. Follows Tailwind's utility-first methodology while maintaining centralized control.

---

#### Step 1.4: Update All Templates to Use Spacing Tokens

**Files**: All 12 template files in `/Users/varunprasad/code/prjs/resumepair/libs/reactive-artboard/templates/`
- azurill.tsx
- bronzor.tsx
- chikorita.tsx
- ditto.tsx
- gengar.tsx
- glalie.tsx
- kakuna.tsx
- leafish.tsx
- nosepass.tsx
- onyx.tsx
- pikachu.tsx
- rhyhorn.tsx

**Change**: Replace hardcoded spacing classes with token-based utilities

**Pattern 1: Section-level vertical spacing**
```tsx
// BEFORE
<FlowRoot className="p-custom space-y-3">  // Azurill: 12px
<FlowRoot className="p-custom space-y-4">  // Kakuna: 16px

// AFTER (consistent across all templates)
<FlowRoot className="p-custom space-y-doc-section">
```

**Pattern 2: Column-level vertical spacing**
```tsx
// BEFORE
<div className="sidebar group space-y-4">
<div className="main group space-y-4">

// AFTER
<div className="sidebar group space-y-doc-section">
<div className="main group space-y-doc-section">
```

**Pattern 3: Column horizontal gap**
```tsx
// BEFORE
<div className="grid grid-cols-3 gap-x-4">   // Azurill: 16px
<FlowRoot className="... space-x-6">        // Pikachu: 24px

// AFTER (standardized to column gap token)
<div className="grid grid-cols-3 gap-x-doc-column">
<FlowRoot className="... gap-x-doc-column">
```

**Pattern 4: Item grid gaps**
```tsx
// BEFORE
<div className="grid gap-x-6 gap-y-3">     // 24px horizontal, 12px vertical

// AFTER
<div className="grid gap-x-doc-column gap-y-doc-item">
```

**Pattern 5: Small item spacing**
```tsx
// BEFORE
<div className="relative space-y-2">        // 8px between small elements

// AFTER
<div className="relative space-y-doc-item">
```

**Rationale**: Eliminates hardcoded spacing values, ensuring visual consistency across templates. Users can now customize spacing globally via metadata. Maintains template structure while centralizing control. Follows Reactive Resume's proven spacing hierarchy [SOURCE_REFERENCE.md:227-263].

---

### Phase 2: Fix Default Typography Values (Issue 2)

**Goal**: Establish single source of truth for typography defaults with WCAG-compliant line height

#### Step 2.1: Update Mapper Line Height Default

**File**: `/Users/varunprasad/code/prjs/resumepair/libs/reactive-artboard/mappers/resume.ts`

**Change**: Update line height default from 1.4 to 1.5 for accessibility
```typescript
// Line 137-141, 168-169
// BEFORE
const typography = appearance.typography ?? {
  fontFamily: 'Inter, system-ui',
  fontSize: Math.round(16 * (resume.settings.fontSizeScale || 1)),
  lineHeight: resume.settings.lineSpacing || 1.4,  // ← BELOW WCAG GUIDELINE
}

// Line 169
lineHeight: typography.lineHeight ?? (resume.settings.lineSpacing || 1.4),

// AFTER
const typography = appearance.typography ?? {
  fontFamily: 'Inter, system-ui',
  fontSize: Math.round(16 * (resume.settings.fontSizeScale || 1)),
  lineHeight: resume.settings.lineSpacing || 1.5,  // ← WCAG 2.1 AA COMPLIANT
}

// Line 169
lineHeight: typography.lineHeight ?? (resume.settings.lineSpacing || 1.5),
```

**Rationale**: WCAG 2.1 Success Criterion 1.4.12 (Level AA) recommends minimum 1.5 line height for body text. Reactive Resume uses 1.5 as default [SOURCE_REFERENCE.md:608]. Improves readability and accessibility without breaking existing resumes (appearance.typography.lineHeight overrides default).

---

#### Step 2.2: Update Cover Letter Mapper Line Height

**File**: `/Users/varunprasad/code/prjs/resumepair/libs/reactive-artboard/mappers/coverLetter.ts`

**Change**: Match resume mapper line height (1.5)
```typescript
// Line 99-102 (similar pattern to resume mapper)
// BEFORE
lineHeight: resume.settings.lineSpacing || 1.4,

// AFTER
lineHeight: resume.settings.lineSpacing || 1.5,
```

**Rationale**: Maintains consistency between resume and cover letter defaults. Cover letters require same readability standards as resumes.

---

#### Step 2.3: Update Schema Defaults to Match Reality

**File**: `/Users/varunprasad/code/prjs/resumepair/libs/reactive-artboard/schema/metadata/index.ts`

**Change**: Update schema defaults to document actual mapper behavior
```typescript
// Line 32-38
// BEFORE
typography: z.object({
  font: z.object({
    family: z.string().default("IBM Plex Serif"),  // ← Dead code
    subset: z.string().default("latin"),
    variants: z.array(z.string()).default(["regular"]),
    size: z.number().default(14),  // ← Dead code
  }),
  lineHeight: z.number().default(1.5),  // ← Correct but unused
  hideIcons: z.boolean().default(false),
  underlineLinks: z.boolean().default(true),
}),

// AFTER
typography: z.object({
  font: z.object({
    family: z.string().default("Inter"),  // ← Matches mapper
    subset: z.string().default("latin"),
    variants: z.array(z.string()).default(["regular"]),
    size: z.number().default(16),  // ← Matches mapper base size
  }),
  lineHeight: z.number().default(1.5),  // ← Already correct
  hideIcons: z.boolean().default(false),
  underlineLinks: z.boolean().default(true),
}),
```

```typescript
// Line 69-79
// BEFORE
typography: {
  font: {
    family: "IBM Plex Serif",
    subset: "latin",
    variants: ["regular", "italic", "600"],
    size: 14,
  },
  lineHeight: 1.5,
  hideIcons: false,
  underlineLinks: true,
},

// AFTER
typography: {
  font: {
    family: "Inter",  // ← Matches mapper
    subset: "latin",
    variants: ["regular", "italic", "600"],
    size: 16,  // ← Matches mapper
  },
  lineHeight: 1.5,  // ← Already correct
  hideIcons: false,
  underlineLinks: true,
},
```

**Rationale**: Schema should document actual behavior. Mapper uses Inter 16px as defaults, schema should reflect this. Eliminates developer confusion. 16px is web standard for body text. Inter is modern, professional, ATS-friendly sans-serif. Line height 1.5 already correct in schema.

---

### Phase 3: Expand Font Family Support (Issue 3)

**Goal**: Add professional fonts with complete fallback stacks

#### Step 3.1: Expand FONT_FAMILY_MAP

**File**: `/Users/varunprasad/code/prjs/resumepair/libs/reactive-artboard/mappers/resume.ts`

**Change**: Add 5 more professional fonts to existing 3-font map
```typescript
// Line 18-22
// BEFORE
const FONT_FAMILY_MAP: Record<string, string> = {
  inter: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  'source sans 3': '"Source Sans 3", system-ui, sans-serif',
  georgia: 'Georgia, serif',
}

// AFTER
const FONT_FAMILY_MAP: Record<string, string> = {
  // Modern Sans-Serif (existing + new)
  'inter': 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  'roboto': 'Roboto, "Helvetica Neue", Arial, sans-serif',
  'open sans': '"Open Sans", "Segoe UI", Tahoma, sans-serif',
  'lato': 'Lato, "Helvetica Neue", Helvetica, Arial, sans-serif',
  'source sans 3': '"Source Sans 3", system-ui, sans-serif',

  // Professional Serif (existing + new)
  'georgia': 'Georgia, "Times New Roman", serif',
  'merriweather': 'Merriweather, Georgia, "Times New Roman", serif',
  'source serif 4': '"Source Serif 4", Georgia, "Times New Roman", serif',

  // Elegant/Display (new)
  'playfair display': '"Playfair Display", Georgia, serif',

  // Technical/Monospace (new)
  'ibm plex mono': '"IBM Plex Mono", "Courier New", Consolas, monospace',
  'jetbrains mono': '"JetBrains Mono", "Courier New", Consolas, monospace',
}
```

**Rationale**: Covers common professional use cases:
- **Roboto**: Google's standard font, widely used, excellent readability
- **Open Sans**: Web-safe, ATS-friendly, neutral appearance
- **Lato**: Geometric sans-serif, modern and warm
- **Merriweather**: Professional serif, designed for screen readability
- **Source Serif 4**: Adobe's serif, excellent for body text
- **Playfair Display**: Elegant serif for creative/executive resumes
- **IBM Plex Mono / JetBrains Mono**: Technical resumes, developer portfolios

Each font includes fallback stack terminating in generic family (sans-serif/serif/monospace), preventing layout shifts. Follows Reactive Resume's font loading pattern [SOURCE_REFERENCE.md:686-691].

---

## Files to Modify

### Critical Changes (Must Do):

#### Typography Defaults (2 files):
- [ ] `/Users/varunprasad/code/prjs/resumepair/libs/reactive-artboard/mappers/resume.ts` - Update line height default from 1.4 to 1.5 (lines 140, 169); expand FONT_FAMILY_MAP from 3 to 11 fonts (lines 18-22)
- [ ] `/Users/varunprasad/code/prjs/resumepair/libs/reactive-artboard/mappers/coverLetter.ts` - Update line height default from 1.4 to 1.5 (line ~101)

#### Schema Alignment (1 file):
- [ ] `/Users/varunprasad/code/prjs/resumepair/libs/reactive-artboard/schema/metadata/index.ts` - Update font family default from "IBM Plex Serif" to "Inter", font size from 14 to 16 (lines 33, 36, 70, 74)

#### Spacing Infrastructure (3 files):
- [ ] `/Users/varunprasad/code/prjs/resumepair/libs/reactive-artboard/types.ts` - Add `spacing` property to `ArtboardMetadata` interface
- [ ] `/Users/varunprasad/code/prjs/resumepair/libs/reactive-artboard/styles.ts` - Inject `--doc-section-gap`, `--doc-item-gap`, `--doc-column-gap` CSS variables in `buildArtboardStyles()` function (line ~730)
- [ ] `/Users/varunprasad/code/prjs/resumepair/tailwind.artboard.config.js` - Add `doc-section`, `doc-item`, `doc-column` spacing utilities (line ~23)

#### Template Updates (12 files):
- [ ] `/Users/varunprasad/code/prjs/resumepair/libs/reactive-artboard/templates/azurill.tsx` - Replace `space-y-3`, `space-y-4`, `gap-x-4`, `gap-x-6`, `gap-y-3`, `space-y-2` with token-based utilities
- [ ] `/Users/varunprasad/code/prjs/resumepair/libs/reactive-artboard/templates/bronzor.tsx` - Replace hardcoded spacing with tokens
- [ ] `/Users/varunprasad/code/prjs/resumepair/libs/reactive-artboard/templates/chikorita.tsx` - Replace hardcoded spacing with tokens
- [ ] `/Users/varunprasad/code/prjs/resumepair/libs/reactive-artboard/templates/ditto.tsx` - Replace hardcoded spacing with tokens
- [ ] `/Users/varunprasad/code/prjs/resumepair/libs/reactive-artboard/templates/gengar.tsx` - Replace hardcoded spacing with tokens
- [ ] `/Users/varunprasad/code/prjs/resumepair/libs/reactive-artboard/templates/glalie.tsx` - Replace hardcoded spacing with tokens
- [ ] `/Users/varunprasad/code/prjs/resumepair/libs/reactive-artboard/templates/kakuna.tsx` - Replace hardcoded spacing with tokens
- [ ] `/Users/varunprasad/code/prjs/resumepair/libs/reactive-artboard/templates/leafish.tsx` - Replace hardcoded spacing with tokens
- [ ] `/Users/varunprasad/code/prjs/resumepair/libs/reactive-artboard/templates/nosepass.tsx` - Replace hardcoded spacing with tokens
- [ ] `/Users/varunprasad/code/prjs/resumepair/libs/reactive-artboard/templates/onyx.tsx` - Replace hardcoded spacing with tokens
- [ ] `/Users/varunprasad/code/prjs/resumepair/libs/reactive-artboard/templates/pikachu.tsx` - Replace hardcoded spacing with tokens
- [ ] `/Users/varunprasad/code/prjs/resumepair/libs/reactive-artboard/templates/rhyhorn.tsx` - Replace hardcoded spacing with tokens

### New Files to Create:
None. All changes are modifications to existing files.

### Optional Enhancements:
- [ ] Create migration script to update existing resumes with `lineSpacing: 1.4` to `lineSpacing: 1.5` (preserves user preference for those who explicitly set 1.4, auto-upgrades defaults)
- [ ] Add spacing controls to appearance settings UI (allows users to customize spacing tiers via interface)
- [ ] Add font preview gallery showing all 11 font options with live sample text

---

## Alignment with ResumePair Standards

### Architectural Principles ✓

**Schema-Driven** [01_architecture.md:7-13]:
- Spacing added as metadata property, not ResumeJson schema modification
- Typography defaults aligned between schema and mapper, maintaining schema as documentation
- Templates remain schema-readers, no logic changes beyond CSS class swaps

**Layered Boundaries** [01_architecture.md:15-27]:
- Presentation layer (templates) consume metadata via CSS custom properties
- Application layer (mappers) compute metadata from resume settings
- Infrastructure layer (styles.ts) generates CSS from metadata
- Dependencies point downward only

**Type Safety** [01_architecture.md:64-75]:
- Spacing properties typed in `ArtboardMetadata` interface
- Font family map keys are lowercase strings (user input normalized)
- Line height remains `number` type with accessible default
- No `any` types introduced

### Performance Budgets ✓

**Preview Updates <120ms** [07_quality_and_security.md:92]:
- CSS custom properties update without re-rendering templates
- Spacing changes apply instantly via `:root` variable updates
- No JavaScript computation during preview, only CSS variable references

**Template Switch <200ms** [07_quality_and_security.md:93]:
- Templates share spacing tokens, no per-template calculations
- Font fallback stacks prevent layout shifts during font loading
- Grid-based spacing (gap-*) performs better than margin-based (space-*)

### Implementation Patterns ✓

**Design Tokens** [04_design_system.md:7-14]:
- Uses `--doc-*` namespace for template-specific spacing tokens
- Follows existing pattern: `--margin` (page), `--doc-section-gap` (spacing tier)
- Aligns with app tokens (`--app-*`) / document tokens (`--doc-*`) dual architecture

**TypeScript Strict** [02_implementation.md:22-41]:
- Spacing properties optional in metadata (`spacing?: { ... }`)
- Default values prevent undefined/null runtime errors
- Font family map lookup handles missing keys with fallback to raw input

**Pure Functions** [02_implementation.md:66-88]:
- Mappers remain pure functions with dependency injection
- No classes introduced, maintains repository pattern
- `buildArtboardStyles()` function computes CSS from metadata input

---

## Adopted Patterns from Reactive Resume

### Pattern 1: Multi-Tier Spacing System

**Source**: [TEMPLATE_FEATURES_SOURCE_REFERENCE.md:146-263]
- Section-level spacing: 16px (`space-y-4`) between major sections
- Item-level spacing: 8px (`space-y-2`) within section items
- Column-level spacing: 24px (`gap-x-6`) horizontal, 12px (`gap-y-3`) vertical

**Adaptation**:
- Create CSS custom properties: `--doc-section-gap: 16px`, `--doc-item-gap: 8px`, `--doc-column-gap: 24px`
- Map to Tailwind utilities: `space-y-doc-section`, `space-y-doc-item`, `gap-x-doc-column`
- Apply consistently across all 12 templates

**Benefit**: Clear visual hierarchy, maintainable spacing, user-customizable via metadata

---

### Pattern 2: CSS Custom Properties with HSL Format

**Source**: [TEMPLATE_FEATURES_SOURCE_REFERENCE.md:269-406]
- Theme colors stored as hex in metadata, converted to HSL for CSS variables
- Tailwind references: `background: "hsl(var(--background))"`
- Enables dynamic theming without CSS recompilation

**Adaptation**:
- Already implemented in ResumePair [styles.ts:724-759]
- Spacing follows same pattern: metadata → CSS variables → Tailwind utilities
- Maintains consistency with existing color system architecture

**Benefit**: Runtime customization, consistent token architecture, type-safe utilities

---

### Pattern 3: Default Font Stack Architecture

**Source**: [TEMPLATE_FEATURES_SOURCE_REFERENCE.md:586-736]
- Default font: IBM Plex Serif 14px, line height 1.5
- Font variants: `["regular", "italic", "600"]` for proper weight rendering
- Fallback stacks for web-safe fonts

**Adaptation**:
- Update default to Inter 16px, line height 1.5 (web standard, ATS-friendly)
- Expand font map from 3 to 11 professional fonts with fallback stacks
- Maintain variant system for bold/italic rendering

**Benefit**: Professional appearance, reliable font loading, broad customization options

---

### Pattern 4: Typography Scale via Tailwind Utilities

**Source**: [TEMPLATE_FEATURES_SOURCE_REFERENCE.md:699-704]
- Name: `text-2xl` (24px, 1.5rem)
- Section headings: `text-base` (14px)
- Body text: Base size (14px)

**Adaptation**:
- ResumePair already uses Tailwind typography scale in templates
- No changes needed, system already follows Reactive Resume pattern
- Base size updated from 14px to 16px via metadata default change

**Benefit**: Consistent typography hierarchy, scalable with user font size preference

---

## Risk Assessment

### High Risk:

**Spacing changes across 12 templates**:
- **Risk**: Search-replace errors could break template layouts, introduce visual regressions
- **Mitigation**:
  - Phase implementation: Infrastructure first (types, styles, tailwind) → templates second
  - Manual verification of each template after changes (visual regression testing)
  - Test with empty sections, missing data, extreme content lengths
  - Keep git history clean for easy rollback
- **Validation**: Load each template in preview, verify spacing consistency across all sections

### Medium Risk:

**Default value changes**:
- **Risk**: Existing resumes with no explicit `lineSpacing` or `fontFamily` settings will see changes (1.4→1.5 line height, IBM Plex Serif→Inter font)
- **Mitigation**:
  - Line height change improves accessibility (WCAG compliance), not breaking
  - Font change only affects resumes without explicit font setting (rare for active users)
  - Mapper checks `appearance.typography` before applying defaults, preserving user preferences
  - Schema change is documentation-only, mapper controls actual behavior
- **Acceptance Criteria**:
  - Resumes with explicit `appearance.typography.lineHeight` unchanged
  - New resumes receive 1.5 line height (WCAG compliant)
  - Users can override via appearance settings

### Low Risk:

**Adding new fonts**:
- **Risk**: Minimal—fonts are additive, existing font selections unchanged
- **Mitigation**:
  - Fallback stacks prevent layout shifts if primary font fails to load
  - Font map lookup returns raw input if key not found (backwards compatible)
  - All fonts use generic family terminator (sans-serif/serif/monospace)
- **Acceptance Criteria**:
  - Existing resumes render identically
  - New font options appear in settings
  - Font loading failure gracefully falls back to system fonts

---

## Testing Strategy

### Manual Verification:

**Spacing System**:
1. [ ] Load each of 12 templates in preview mode
2. [ ] Verify consistent spacing between sections (should match across templates)
3. [ ] Check two-column layouts maintain proper column gaps
4. [ ] Test with sections containing 1 item, many items, and empty sections
5. [ ] Verify no overlapping elements or excessive whitespace
6. [ ] Test template switching preserves spacing consistency

**Typography Defaults**:
1. [ ] Create new resume with no appearance settings
2. [ ] Verify default font is Inter (not IBM Plex Serif)
3. [ ] Verify default font size is 16px (not 14px)
4. [ ] Verify default line height is 1.5 (measure with browser devtools)
5. [ ] Test font size scaling: set `fontSizeScale: 1.2`, verify 19px result (16 * 1.2)
6. [ ] Load existing resume with explicit `lineSpacing: 1.4`, verify setting preserved

**Font Family Support**:
1. [ ] Open appearance settings, verify font dropdown shows all 11 options
2. [ ] Select each font, verify preview updates with proper font family
3. [ ] Check browser network tab to confirm font loading (if web fonts used)
4. [ ] Disable web fonts in browser, verify fallback stack applies correctly
5. [ ] Test font rendering: regular, bold, italic variants

### Edge Cases:

**Spacing Edge Cases**:
- [ ] Very long section titles (50+ characters) with new spacing
- [ ] Section with single item vs. section with 20+ items
- [ ] Templates with empty sidebar (should span full width correctly)
- [ ] Mixing sections with different column counts (1-column, 2-column, 3-column)
- [ ] Extreme zoom levels: 50% zoom (entire page visible), 200% zoom (zoomed in)

**Typography Edge Cases**:
- [ ] Font family name with special characters: "Source Sans 3"
- [ ] Custom font not in FONT_FAMILY_MAP (should use raw input)
- [ ] Line height edge values: 1.0 (very tight), 2.5 (very loose)
- [ ] Font size scale edge values: 0.8 (12px), 1.5 (24px)
- [ ] Resume with no `appearance` object (should use all mapper defaults)

**Font Loading Edge Cases**:
- [ ] Primary font fails to load (network timeout or 404)
- [ ] Font family string with uppercase/mixed case (should normalize)
- [ ] Empty font family string (should fall back to browser default)
- [ ] Font stack with unavailable fonts (should cascade through fallbacks)

---

## Implementation Order

### Critical Path (Blocking Issues):

**1. Define Spacing Infrastructure** (1 hour)
- Add `spacing` property to `ArtboardMetadata` type [types.ts]
- Inject `--doc-*` CSS variables in `buildArtboardStyles()` [styles.ts]
- Add Tailwind utilities for spacing tokens [tailwind.artboard.config.js]
- **Blocks**: Template updates require these utilities to exist

**2. Update All 12 Templates with Spacing Tokens** (3-4 hours)
- Replace `space-y-3` / `space-y-4` → `space-y-doc-section`
- Replace `gap-x-4` / `gap-x-6` → `gap-x-doc-column`
- Replace `gap-y-3` / `space-y-2` → `gap-y-doc-item` / `space-y-doc-item`
- Verify each template after changes
- **Blocks**: Core fix for spacing inconsistency issue

**3. Align Default Typography Values** (30 minutes)
- Update mapper line height 1.4 → 1.5 [mappers/resume.ts, mappers/coverLetter.ts]
- Update schema defaults: IBM Plex Serif → Inter, 14px → 16px [schema/metadata/index.ts]
- **Blocks**: Fixes accessibility issue and developer confusion

**4. Expand Font Families** (1 hour)
- Add 8 new fonts to `FONT_FAMILY_MAP` with fallback stacks [mappers/resume.ts]
- Test font selection and fallback behavior
- **Blocks**: Improves customization options

**Total Estimate**: 5.5-6.5 hours

---

## Success Criteria

### Issue 1: Spacing System ✓

- [ ] **No hardcoded spacing values**: Zero instances of `space-y-3`, `space-y-4`, `gap-x-4`, `gap-x-6`, `gap-y-3` in template files
- [ ] **Centralized tokens**: All templates use `space-y-doc-section`, `gap-x-doc-column`, `space-y-doc-item` utilities
- [ ] **Visual consistency**: All 12 templates have identical spacing between equivalent sections (e.g., all templates have 16px between major sections)
- [ ] **Metadata control**: Changing `metadata.spacing.sectionGap` updates all template spacing instantly
- [ ] **Design system compliance**: Uses `--doc-*` namespace, follows existing token architecture

### Issue 2: Typography Defaults ✓

- [ ] **Schema and mapper aligned**: Schema defaults match mapper defaults exactly (Inter, 16px, 1.5)
- [ ] **WCAG compliant**: Line height ≥ 1.5 in both mapper defaults (resume.ts, coverLetter.ts)
- [ ] **Single source of truth**: Schema documents actual behavior, no conflicting defaults
- [ ] **User preferences preserved**: Existing resumes with explicit typography settings unchanged
- [ ] **Accessibility improved**: New resumes render with 1.5 line height by default

### Issue 3: Font Family Support ✓

- [ ] **Expanded font options**: At least 11 professional fonts available in `FONT_FAMILY_MAP`
- [ ] **Complete fallback stacks**: Every font entry includes fallback chain terminating in generic family
- [ ] **Font loading reliable**: Primary font failure gracefully falls back without layout shift
- [ ] **Professional variety**: Covers sans-serif (5), serif (4), monospace (2) categories
- [ ] **Backwards compatible**: Existing font selections continue to work, new fonts additive

---

## Open Questions / Decisions Needed

### Question 1: Spacing Token Architecture

**Question**: Should spacing tokens be CSS custom properties or TypeScript constants?

**Option A: CSS Custom Properties** (`--doc-spacing-*`)
- **Pros**: Runtime customization via metadata, consistent with color system, user can override via appearance settings
- **Cons**: Requires Tailwind config mapping, less compile-time safety

**Option B: TypeScript Constants**
- **Pros**: Type-safe, compile-time validation, better IDE autocomplete
- **Cons**: No runtime customization, requires template recompilation for changes, inconsistent with color token pattern

**Recommendation**: **Option A (CSS Custom Properties)**
- Aligns with existing design token system (colors use CSS variables)
- Enables future feature: spacing controls in appearance settings
- Consistent with ResumePair architecture [04_design_system.md]
- Follows Reactive Resume pattern [SOURCE_REFERENCE.md:146-263]

---

### Question 2: Default Font Choice

**Question**: Should we switch from IBM Plex Serif to Inter as the default font?

**Option A: Keep IBM Plex Serif**
- **Pros**: Matches current schema documentation, serif font is traditional for resumes
- **Cons**: Mapper overrides it anyway (dead code), IBM Plex Serif requires web font loading, serif less ATS-friendly

**Option B: Switch to Inter**
- **Pros**: Matches actual mapper behavior, modern sans-serif preferred by ATS systems, web-safe system font, no loading delay
- **Cons**: Schema change (documentation impact), users expecting serif may be surprised

**Recommendation**: **Option B (Switch to Inter)**
- Fixes inconsistency: schema should document reality
- Inter is modern, professional, ATS-optimized, web standard
- 16px is better default than 14px (web accessibility standard)
- Reactive Resume uses IBM Plex Serif but ResumePair already defaults to Inter in practice
- Users can still select serif fonts from expanded font map (Georgia, Merriweather, Source Serif 4)

---

### Question 3: Migration of Existing Resumes

**Question**: Should we auto-migrate existing resumes from 1.4 to 1.5 line height?

**Option A: Auto-migrate all resumes**
- **Pros**: Improves accessibility globally, ensures WCAG compliance for all users
- **Cons**: Changes existing resume appearance without user consent, may disrupt users who carefully tuned spacing

**Option B: Migrate only resumes without explicit lineSpacing setting**
- **Pros**: Respects user preferences, improves accessibility for new/default resumes only
- **Cons**: Some resumes remain non-compliant

**Option C: No migration, new resumes only**
- **Pros**: Zero breaking changes, safest approach
- **Cons**: Existing resumes with 1.4 line height remain below WCAG guidelines

**Recommendation**: **Option C (New resumes only)**
- Mapper checks `resume.settings.lineSpacing` and `appearance.typography.lineHeight`
- Only resumes with **both undefined** receive new default (1.5)
- Existing resumes with explicit settings unchanged
- Users can manually update via appearance settings if desired
- Avoids breaking changes, respects user agency

---

### Question 4: Spacing Customization UI

**Question**: Should we add spacing controls to appearance settings UI?

**Option A: Add spacing sliders to appearance settings**
- **Pros**: Empowers users to customize spacing per preference, leverages new metadata system
- **Cons**: Increases UI complexity, requires additional development time, most users unlikely to change spacing

**Option B: No UI, metadata-only (advanced users can edit JSON)**
- **Pros**: Simpler implementation, focuses on consistency fix, power users can still customize
- **Cons**: Feature invisible to most users, metadata capability underutilized

**Recommendation**: **Option B (No UI for now, add later if requested)**
- Current scope: Fix consistency and centralize spacing
- Future enhancement: Add appearance settings UI for spacing customization
- Metadata system supports it, can add UI non-disruptively later
- Keep implementation focused on core issues

---

## Next Steps

1. **Review this plan** with user for approval and decisions on open questions
2. **Start with Phase 1** - Spacing system (highest impact, enables template consistency)
   - Define types and infrastructure first (types.ts, styles.ts, tailwind.artboard.config.js)
   - Update one template as proof-of-concept (azurill.tsx)
   - Validate spacing renders correctly, then update remaining 11 templates
3. **Phase 2** - Typography defaults (quick win, accessibility improvement)
   - Update mapper line heights (resume.ts, coverLetter.ts)
   - Update schema defaults (metadata/index.ts)
4. **Phase 3** - Font families (low risk, additive feature)
   - Expand FONT_FAMILY_MAP (resume.ts)
   - Test font selection and fallback behavior
5. **Validate** all changes before commit:
   - Visual verification: Load all 12 templates, check spacing consistency
   - Edge case testing: Empty sections, long content, extreme zoom levels
   - Typography testing: Default values, font selection, line height rendering
6. **Document** new spacing tokens and font options for developers

---

**Document Version**: 1.0
**Created**: 2025-10-12
**Estimated Effort**: 5.5-6.5 hours
**Risk Level**: Medium (12 template files affected, but changes are isolated to CSS classes and well-tested patterns from Reactive Resume)
**Dependencies**: None (no schema changes, no external library updates, no database migrations)

---

## Appendix A: Spacing Token Reference

**Design Token Hierarchy**:
```
Page Level:
  --margin              Page padding (18px default)

Section Level:
  --doc-section-gap     Gap between major sections (16px default)

Item Level:
  --doc-item-gap        Gap between items within section (8px default)

Column Level:
  --doc-column-gap      Gap between columns in grid (24px default)
```

**Tailwind Utility Mapping**:
```css
/* Page margin (existing) */
.p-custom { padding: var(--margin); }

/* Section gaps (new) */
.space-y-doc-section { ... }  /* Vertical section spacing */
.gap-doc-section { ... }      /* Grid section spacing */

/* Item gaps (new) */
.space-y-doc-item { ... }     /* Vertical item spacing */
.gap-y-doc-item { ... }       /* Grid vertical item spacing */

/* Column gaps (new) */
.gap-x-doc-column { ... }     /* Grid horizontal column spacing */
```

---

## Appendix B: Font Family Reference

**Sans-Serif Fonts**:
- **Inter**: Modern, web standard, excellent screen readability (DEFAULT)
- **Roboto**: Google's standard font, widely used, neutral
- **Open Sans**: Web-safe, ATS-friendly, professional
- **Lato**: Geometric, warm, friendly
- **Source Sans 3**: Adobe's sans-serif, technical aesthetics

**Serif Fonts**:
- **Georgia**: Classic serif, web-safe, traditional
- **Merriweather**: Designed for screens, highly readable
- **Source Serif 4**: Adobe's serif, professional, elegant
- **Playfair Display**: Display serif, creative/executive resumes

**Monospace Fonts**:
- **IBM Plex Mono**: Professional monospace, technical resumes
- **JetBrains Mono**: Developer-focused, code-friendly

**Fallback Stack Pattern**:
```typescript
'font-name': 'PrimaryFont, Fallback1, Fallback2, generic-family'

// Example:
'inter': 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
```

---

## Appendix C: WCAG Line Height Guidelines

**WCAG 2.1 Success Criterion 1.4.12 (Level AA)**:
- **Body text**: Minimum line height 1.5 times font size
- **Paragraph spacing**: Minimum 2 times font size
- **Letter spacing**: Minimum 0.12 times font size
- **Word spacing**: Minimum 0.16 times font size

**Current State**:
- Mapper default: 1.4 line height (BELOW guideline)
- Schema default: 1.5 line height (COMPLIANT)

**After Fix**:
- Mapper default: 1.5 line height (COMPLIANT)
- Schema default: 1.5 line height (COMPLIANT)

---

**End of Implementation Plan**
