# ResumePair Current Implementation - Template System Issues

## Investigation Scope
- Repository: ResumePair (current implementation at `/Users/varunprasad/code/prjs/resumepair/.conductor/jackson`)
- Focus: Template structure, layout, spacing, colors, defaults
- Investigation Date: 2025-10-12

---

## Issue 1: Two-Column Layout Not Working

### Current Implementation

Two-column layouts ARE implemented and functional. The issue description claims "two-column layouts appear linear," but this is **INCORRECT**. The templates use CSS Grid with proper column definitions.

**Evidence of Working Two-Column Layouts:**

1. **Azurill Template** (`/libs/reactive-artboard/templates/azurill.tsx:569`):
```tsx
<div className="grid grid-cols-3 gap-x-4">
  <div className="sidebar group space-y-4">
    {sidebar.map((section) => ...)}
  </div>
  <div className={cn("main group space-y-4", sidebar.length > 0 ? "col-span-2" : "col-span-3")}>
    {main.map((section) => ...)}
  </div>
</div>
```

2. **Pikachu Template** (`/libs/reactive-artboard/templates/pikachu.tsx:612`):
```tsx
<FlowRoot className="p-custom grid grid-cols-3 space-x-6">
  <div className="sidebar group space-y-4">
    {sidebar.map((section) => ...)}
  </div>
  <div className={cn("main group space-y-4", sidebar.length > 0 ? "col-span-2" : "col-span-3")}>
    {main.map((section) => ...)}
  </div>
</FlowRoot>
```

3. **Glalie Template** (`/libs/reactive-artboard/templates/glalie.tsx:588-607`):
```tsx
<FlowRoot className="grid min-h-[inherit] grid-cols-3">
  <div className={cn("sidebar p-custom group space-y-4", sidebar.length === 0 && "hidden")}>
    {sidebar.map((section) => ...)}
  </div>
  <div className={cn("main p-custom group space-y-4", sidebar.length > 0 ? "col-span-2" : "col-span-3")}>
    {main.map((section) => ...)}
  </div>
</FlowRoot>
```

### Relevant Files
- `/libs/reactive-artboard/templates/azurill.tsx:562-586` - Two-column grid layout (1/3 + 2/3)
- `/libs/reactive-artboard/templates/pikachu.tsx:608-630` - Two-column grid with spacing
- `/libs/reactive-artboard/templates/glalie.tsx:588-607` - Two-column with colored sidebar
- `/libs/reactive-artboard/templates/bronzor.tsx:588-606` - Single column (renders both main and sidebar linearly)
- `/libs/reactive-artboard/templates/kakuna.tsx:533-551` - Single column (renders both main and sidebar linearly)

### Code Evidence - Working Two-Column Layout Pattern

**Pattern 1: Grid with column spans (Azurill, Pikachu, Glalie)**
```tsx
// Grid container with 3 columns total
<FlowRoot className="grid grid-cols-3 gap-x-4">
  {/* Sidebar takes 1 column */}
  <div className="sidebar group space-y-4">
    {sidebar.map(...)}
  </div>

  {/* Main takes 2 columns (or 3 if no sidebar) */}
  <div className={cn("main group", sidebar.length > 0 ? "col-span-2" : "col-span-3")}>
    {main.map(...)}
  </div>
</FlowRoot>
```

**Pattern 2: Linear (Kakuna, Bronzor)**
```tsx
// No grid - sections stack vertically
<FlowRoot className="p-custom space-y-4">
  {main.map(...)}
  {sidebar.map(...)}
</FlowRoot>
```

### Root Cause

**NOT A BUG - TWO-COLUMN LAYOUTS WORK CORRECTLY**

The confusion may arise from:
1. **Template Selection**: Not all templates use two-column layouts (Kakuna, Bronzor are single-column by design)
2. **Layout Configuration**: The layout is defined in `metadata.layout` which controls which sections go in which column
3. **Default Layout**: (`/libs/reactive-artboard/schema/metadata/index.ts:3-8`)
```tsx
export const defaultLayout = [
  [
    ["profiles", "summary", "experience", "education", "projects", "volunteer", "references"],
    ["skills", "interests", "certifications", "awards", "publications", "languages"],
  ],
];
```
This defines: Page 1 -> Column 1 (main), Column 2 (sidebar)

**Key Technical Detail:**
- Templates receive `columns: SectionKey[][]` where `columns[0]` is main, `columns[1]` is sidebar
- Templates decide how to render these columns (grid vs linear)
- Azurill/Pikachu/Glalie use CSS Grid for true two-column layout
- Kakuna/Bronzor render both arrays linearly (design choice, not a bug)

---

## Issue 2: Spacing and Alignment Issues

### Current Implementation

Spacing uses a **HYBRID approach**: mix of Tailwind spacing utilities (hardcoded) and CSS custom properties (--margin for page margins only).

**Current Spacing Patterns:**

1. **Page-level margin** (consistent via CSS custom property):
```tsx
// tailwind.artboard.config.js:24
spacing: {
  custom: 'var(--margin)',
}

// Template usage:
<FlowRoot className="p-custom space-y-4">
```

2. **Section-level spacing** (hardcoded Tailwind classes):
```tsx
// Azurill template - hardcoded spacing values
<FlowRoot className="p-custom space-y-3">
  <div className="grid grid-cols-3 gap-x-4">
    <div className="sidebar group space-y-4">
```

3. **Item-level spacing** (hardcoded Tailwind classes):
```tsx
// Section component in templates - hardcoded gaps
<div className="grid gap-x-6 gap-y-3">
```

### Relevant Files
- `/libs/reactive-artboard/templates/kakuna.tsx:537` - `space-y-4` (16px between sections)
- `/libs/reactive-artboard/templates/azurill.tsx:566` - `space-y-3` (12px), `gap-x-4` (16px)
- `/libs/reactive-artboard/templates/pikachu.tsx:612` - `space-x-6` (24px), `space-y-4` (16px)
- `/libs/reactive-artboard/templates/bronzor.tsx:215` - `gap-x-6 gap-y-3` (24px horizontal, 12px vertical)
- `/tailwind.artboard.config.js:23-25` - Custom spacing token definition

### Code Evidence - Inconsistent Spacing

**Inconsistency #1: Different section spacing across templates**
```tsx
// Kakuna: 16px between sections
<FlowRoot className="p-custom space-y-4">

// Azurill: 12px between sections
<FlowRoot className="p-custom space-y-3">

// Pikachu: 16px between sections
<FlowRoot className="p-custom grid grid-cols-3 space-x-6">
  <div className="sidebar group space-y-4">
```

**Inconsistency #2: Item gaps vary**
```tsx
// Kakuna Section component: 24px horizontal, 12px vertical
<div className="grid gap-x-6 gap-y-3">

// Bronzor Section component: Same but defined in col-span-4 context
<div className="col-span-4 grid gap-x-6 gap-y-3">
```

**Inconsistency #3: Margin/padding patterns**
```tsx
// Azurill: Direct gap classes
<div className="grid grid-cols-3 gap-x-4">

// Pikachu: Uses space-x utility instead
<FlowRoot className="p-custom grid grid-cols-3 space-x-6">
```

### Root Cause

**LACK OF SPACING DESIGN TOKENS**

1. **No centralized spacing scale**: Each template hardcodes `space-y-3`, `space-y-4`, `gap-x-4`, `gap-x-6` values
2. **Only page margin is tokenized**: `--margin` CSS custom property exists but only controls page padding
3. **No semantic spacing tokens**: No `--section-gap`, `--item-gap`, `--column-gap` CSS variables
4. **Tailwind classes baked into templates**: Makes global spacing changes impossible without editing every template
5. **Inconsistent alignment**: Headers use different patterns (center vs left-align) without system

**Technical Debt:**
- Changing section spacing requires editing 12+ template files individually
- No way to adjust spacing via appearance settings
- Mixing `space-*` (margin-based) and `gap-*` (gap-based) creates alignment edge cases

---

## Issue 3: Color Theme System Not Working

### Current Implementation

Color theme system **WORKS CORRECTLY** using CSS custom properties. Themes are defined, mapped, and applied consistently across templates.

**Theme Architecture:**

1. **Theme Definition** (`/libs/reactive-artboard/mappers/resume.ts:12-16`):
```tsx
const COLOR_THEMES: Record<string, typeof DEFAULT_COLORS> = {
  ocean: { background: '#ffffff', text: '#0f172a', primary: '#2563eb' },
  forest: { background: '#ffffff', text: '#0b1d17', primary: '#059669' },
  charcoal: { background: '#0f172a', text: '#f8fafc', primary: '#38bdf8' },
}
```

2. **CSS Custom Properties** (`/libs/reactive-artboard/styles.ts:730-759`):
```tsx
:root {
  --artboard-color-background: ${metadata.colors.background};
  --artboard-color-text: ${metadata.colors.text};
  --artboard-color-primary: ${metadata.colors.primary};
  --color-background: ${metadata.colors.background};
  --color-foreground: ${metadata.colors.text};
  --color-primary: ${metadata.colors.primary};
  // ... HSL variants
}
```

3. **Tailwind Integration** (`/tailwind.artboard.config.js:13-21`):
```tsx
colors: {
  background: 'var(--color-background)',
  foreground: 'var(--color-foreground)',
  primary: 'var(--color-primary)',
  'primary-foreground': 'var(--color-primary-foreground)',
  // ...
}
```

4. **Template Usage** (consistent across all templates):
```tsx
// Azurill template examples
<i className="ph ph-bold ph-map-pin text-primary" />
<div className="size-1.5 rounded-full border border-primary" />
<div className="absolute left-[-4.5px] size-[8px] rounded-full bg-primary" />
```

### Relevant Files
- `/libs/reactive-artboard/styles.ts:715-772` - buildArtboardStyles function, CSS variable injection
- `/libs/reactive-artboard/mappers/resume.ts:132-178` - createMetadata, theme resolution
- `/tailwind.artboard.config.js:13-22` - Tailwind color token mapping
- All template files use `text-primary`, `bg-primary`, `border-primary` consistently

### Code Evidence - Theme System Working

**Color Resolution Flow:**
```tsx
// 1. Resume data contains theme preference
resume.settings.colorTheme = 'ocean'  // or 'forest', 'charcoal'

// 2. Mapper resolves theme colors
const colorTheme = resume.settings.colorTheme?.toLowerCase()
const themeColors = COLOR_THEMES[colorTheme ?? ''] || DEFAULT_COLORS

// 3. Metadata stores resolved colors
return {
  colors: {
    background: colors.background ?? themeColors.background,
    text: colors.text ?? themeColors.text,
    primary: colors.primary ?? themeColors.primary,
  },
  // ...
}

// 4. Styles builder injects CSS variables
const root = `
  :root {
    --artboard-color-primary: ${metadata.colors.primary};
    --color-primary: ${metadata.colors.primary};
    --primary: ${primaryHsl};
  }
`

// 5. Templates use Tailwind classes that reference CSS vars
<i className="text-primary" />  // → color: var(--color-primary)
```

**Template Color Usage Examples:**
```tsx
// Azurill - colors applied consistently
<i className="ph ph-bold ph-map-pin text-primary" />
<div className="border-primary" />
<div className="bg-primary" />
<h4 className="text-primary">Section Title</h4>

// Pikachu - even complex colored blocks work
<FlowItem className="bg-primary text-background">
  <h2>{basics.name}</h2>
</FlowItem>
```

### Root Cause

**NOT A BUG - COLOR THEMES WORK CORRECTLY**

The claim "color theme system not working" is unfounded. The system is well-architected:
- 3 pre-defined themes (ocean, forest, charcoal) + custom color support
- CSS custom properties ensure consistent color application
- Tailwind classes abstract CSS variables for maintainability
- All templates use semantic color classes (`text-primary` vs hardcoded hex)

**Possible Confusion Points:**
1. **Theme preview in UI**: May not be showing live preview before applying
2. **Default theme**: If no theme selected, uses DEFAULT_COLORS (blue primary: #2563eb)
3. **Template-specific overrides**: Some templates (Glalie) apply color alpha: `hexToRgb(primaryColor, 0.2)` for backgrounds

**Two-Column Theme Application:**
The claim "two-column templates don't respect color themes" is **FALSE**. Evidence:
- Azurill (two-column) uses `text-primary`, `border-primary`, `bg-primary` throughout
- Pikachu (two-column) uses `bg-primary text-background` for hero banner
- Glalie (two-column) applies primary color to sidebar background dynamically

---

## Issue 4: Limited Template Count (Only 3)

### Current Implementation

**12 templates are registered and functional**, not 3. All are exported and available.

**Template Registry** (`/libs/reactive-artboard/templates/index.tsx:19-34`):
```tsx
const registry: Record<string, TemplateComponent> = {
  azurill: AzurillTemplate,
  bronzor: BronzorTemplate,
  chikorita: ChikoritaTemplate,
  ditto: DittoTemplate,
  gengar: GengarTemplate,
  glalie: GlalieTemplate,
  kakuna: KakunaTemplate,
  leafish: LeafishTemplate,
  nosepass: NosepassTemplate,
  onyx: OnyxTemplate,
  pikachu: PikachuTemplate,
  rhyhorn: RhyhornTemplate,
  'cover-letter': CoverLetterTemplate,
  default: KakunaTemplate,
}
```

**Template Metadata** (`/libs/reactive-artboard/catalog.ts:12-108`):
All 12 templates have complete metadata:
- kakuna: Minimal single-column (ATS: 94)
- azurill: Two-column with timeline (ATS: 93)
- bronzor: Technical aesthetic (ATS: 91)
- chikorita: Serif typography (ATS: 90)
- ditto: Hero banner (ATS: 88)
- gengar: Gradient header (ATS: 89)
- glalie: Corporate two-column (ATS: 92)
- leafish: Creative gradients (ATS: 87)
- nosepass: Geometric layout (ATS: 91)
- onyx: Bold divider (ATS: 92)
- pikachu: Vibrant sidebar (ATS: 88)
- rhyhorn: Executive alternating blocks (ATS: 93)

**Template Gallery Display** (`/components/templates/TemplateGallery.tsx:19`):
```tsx
const templates = React.useMemo(() => listResumeTemplateMetadata(), [])
// Returns all 12 templates

{templates.map((template) => (
  <TemplateCard key={template.id} template={template} />
))}
```

### Relevant Files
- `/libs/reactive-artboard/templates/index.tsx:19-34` - Registry with 12 templates + cover letter
- `/libs/reactive-artboard/catalog.ts:12-121` - Metadata for all 12 templates
- `/components/templates/TemplateGallery.tsx:19-38` - Gallery displays all templates
- All template files exist: `azurill.tsx`, `bronzor.tsx`, `chikorita.tsx`, etc.

### Code Evidence

**All Templates Exist and Are Functional:**
```bash
# Template files in /libs/reactive-artboard/templates/
azurill.tsx       (16,501 bytes) - Two-column timeline
bronzor.tsx       (16,613 bytes) - Technical grid
chikorita.tsx     (17,513 bytes) - Serif classic
ditto.tsx         (18,641 bytes) - Hero banner
gengar.tsx        (17,905 bytes) - Gradient header
glalie.tsx        (17,842 bytes) - Corporate two-column
kakuna.tsx        (15,090 bytes) - Minimal single-column
leafish.tsx       (15,430 bytes) - Creative gradients
nosepass.tsx      (17,053 bytes) - Geometric badges
onyx.tsx          (16,656 bytes) - Bold divider
pikachu.tsx       (18,578 bytes) - Vibrant sidebar
rhyhorn.tsx       (16,647 bytes) - Executive alternating
coverLetter.tsx   (3,203 bytes)  - Cover letter template
```

**Metadata Completeness:**
```tsx
// Example: Azurill metadata
{
  id: 'azurill',
  name: 'Azurill',
  description: 'Two-column layout with prominent sidebar cards and experience timeline.',
  features: ['Two Columns', 'Timeline', 'Profile Cards'],
  thumbnail: '/templates/modern-thumb.svg',
  atsScore: 93,
}
```

### Root Cause

**NOT A BUG - 12 TEMPLATES ARE ACTIVE**

The claim "only 3 templates" is completely incorrect. Possible explanations:
1. **UI filtering bug**: Gallery may be filtering templates by mistake
2. **Permission issue**: User account may have limited template access (subscription tier?)
3. **Load failure**: Template thumbnails or metadata may not be loading
4. **User confusion**: May only be seeing first row before scrolling

**Technical Verification:**
- `listResumeTemplateMetadata()` returns all 12 templates
- `getTemplateRenderer(template)` can resolve any of the 12 IDs
- Default template is `kakuna` if invalid ID provided
- Registry uses string lookup, no filtering applied

---

## Issue 5: Default Values (Font Size, Line Height, Fonts)

### Current Implementation

Default typography values are defined in two places with **INCONSISTENT values**.

**Schema Defaults** (`/libs/reactive-artboard/schema/metadata/index.ts:32-38, 70-76`):
```tsx
typography: z.object({
  font: z.object({
    family: z.string().default("IBM Plex Serif"),
    subset: z.string().default("latin"),
    variants: z.array(z.string()).default(["regular"]),
    size: z.number().default(14),  // ← 14px default
  }),
  lineHeight: z.number().default(1.5),  // ← 1.5 default
  hideIcons: z.boolean().default(false),
  underlineLinks: z.boolean().default(true),
})

// Default object
defaultMetadata: Metadata = {
  typography: {
    font: {
      family: "IBM Plex Serif",
      size: 14,  // ← 14px
    },
    lineHeight: 1.5,  // ← 1.5
  }
}
```

**Mapper Defaults** (`/libs/reactive-artboard/mappers/resume.ts:137-141, 168-169`):
```tsx
const typography = appearance.typography ?? {
  fontFamily: 'Inter, system-ui',  // ← Different font!
  fontSize: Math.round(16 * (resume.settings.fontSizeScale || 1)),  // ← 16px base!
  lineHeight: resume.settings.lineSpacing || 1.4,  // ← 1.4 default!
}

// Later resolution
typography: {
  fontFamily: fallbackFontFamily,
  fontSize: typography.fontSize ?? Math.round(16 * (resume.settings.fontSizeScale || 1)),
  lineHeight: typography.lineHeight ?? (resume.settings.lineSpacing || 1.4),
}
```

**Font Family Mapping** (`/libs/reactive-artboard/mappers/resume.ts:18-22`):
```tsx
const FONT_FAMILY_MAP: Record<string, string> = {
  inter: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  'source sans 3': '"Source Sans 3", system-ui, sans-serif',
  georgia: 'Georgia, serif',
}
```

### Relevant Files
- `/libs/reactive-artboard/schema/metadata/index.ts:32-38` - Schema default: 14px, 1.5 line height, IBM Plex Serif
- `/libs/reactive-artboard/mappers/resume.ts:137-141` - Mapper default: 16px, 1.4 line height, Inter
- `/libs/reactive-artboard/mappers/resume.ts:18-22` - Font family fallback map
- `/libs/reactive-artboard/mappers/coverLetter.ts:99-102` - Cover letter defaults (same as resume)

### Code Evidence - Inconsistent Defaults

**Problem #1: Font Size Mismatch**
```tsx
// Schema says 14px
size: z.number().default(14)

// Mapper says 16px
fontSize: Math.round(16 * (resume.settings.fontSizeScale || 1))
```

**Problem #2: Line Height Mismatch**
```tsx
// Schema says 1.5
lineHeight: z.number().default(1.5)

// Mapper says 1.4
lineHeight: resume.settings.lineSpacing || 1.4
```

**Problem #3: Font Family Mismatch**
```tsx
// Schema says IBM Plex Serif (serif font)
family: z.string().default("IBM Plex Serif")

// Mapper says Inter (sans-serif font)
fontFamily: 'Inter, system-ui'
```

**Problem #4: Limited Font Family Options**
Only 3 fonts have full fallback stacks:
```tsx
const FONT_FAMILY_MAP: Record<string, string> = {
  inter: 'Inter, system-ui, -apple-system, ...',
  'source sans 3': '"Source Sans 3", system-ui, sans-serif',
  georgia: 'Georgia, serif',
}
// Any other font name falls through to user's raw input
```

**Problem #5: Font Size Scale Complexity**
```tsx
// Base size is 16px, but can be scaled by settings
fontSize: Math.round(16 * (resume.settings.fontSizeScale || 1))

// User sets fontSizeScale=1.2
// Result: 19px (16 * 1.2 = 19.2 → 19)

// But schema default is 14px, creating confusion
```

### Root Cause

**CONFLICTING DEFAULT VALUE DEFINITIONS**

1. **Two sources of truth**: Schema defaults (14px, 1.5, IBM Plex Serif) vs Mapper defaults (16px, 1.4, Inter)
2. **Schema defaults ignored**: Mapper never reads schema defaults, computes own values from `resume.settings`
3. **Poor font family coverage**: Only 3 fonts have proper fallbacks, others may render with system fonts
4. **No centralized typography config**: Font size scale (16 base), line height (1.4), not documented
5. **Migration gap**: Schema appears to be from older codebase (IBM Plex Serif), mapper uses newer defaults (Inter)

**Technical Impact:**
- New resumes get 16px / 1.4 / Inter (mapper defaults)
- Schema defaults (14px / 1.5 / IBM Plex Serif) are dead code
- Users can't rely on schema documentation
- Font size scale is non-linear (base 16 * scale factor)

**Recommended Defaults Analysis:**
- **Font Size**: 16px is web standard (mapper is correct)
- **Line Height**: 1.5 is accessibility standard (schema is correct, mapper should be 1.5)
- **Font Family**: Inter is modern/professional (mapper is correct)

---

## Summary: Critical Gaps

### GAP 1: Spacing System Lacks Centralization (CONFIRMED ISSUE)
**Technical Details:**
- Only `--margin` CSS custom property exists for page-level spacing
- Section gaps (`space-y-3`, `space-y-4`), item gaps (`gap-x-6`, `gap-y-3`), and column gaps (`gap-x-4`) are hardcoded in 12 template files
- No semantic design tokens (`--section-gap`, `--item-gap`, `--column-gap`)
- Inconsistent values: Azurill uses 12px section spacing, Kakuna uses 16px
- Mixing `space-*` (margin-based) and `gap-*` (gap-based) utilities creates edge cases

**Impact:**
- Cannot adjust spacing globally via appearance settings
- Template spacing changes require editing 12+ files individually
- Inconsistent spacing across templates confuses users

### GAP 2: Default Typography Values Are Inconsistent (CONFIRMED ISSUE)
**Technical Details:**
- Schema defines: 14px, 1.5 line height, IBM Plex Serif
- Mapper uses: 16px (scaled), 1.4 line height, Inter
- Schema defaults are **dead code** (never read by mapper)
- Font size scale formula: `Math.round(16 * (fontSizeScale || 1))` not documented
- Only 3 fonts have proper fallback stacks in `FONT_FAMILY_MAP`

**Impact:**
- Developers using schema defaults get wrong values
- Users receive 16px/1.4/Inter by default (mapper wins)
- Line height 1.4 is below WCAG 2.1 AA recommendation (1.5 minimum)
- Custom fonts may lack fallbacks, causing layout shifts

### GAP 3: Template Gallery May Have Display Bug (POSSIBLE ISSUE)
**Technical Details:**
- 12 templates fully implemented and registered
- `listResumeTemplateMetadata()` returns all 12
- Issue claim "only 3 templates" suggests UI filtering or loading problem
- Possible causes: thumbnail load failure, grid pagination, subscription filtering

**Impact:**
- If UI shows only 3 templates, users have limited choice despite 12 being available
- Requires investigation of `TemplateGallery` component rendering logic

### GAP 4: False Issue Claims - No Actual Problems
**Two-Column Layouts Work Correctly:**
- Azurill, Pikachu, Glalie use CSS Grid `grid-cols-3` properly
- Templates receive `columns: [main, sidebar]` and render as designed
- Some templates (Kakuna, Bronzor) are single-column **by design**, not a bug

**Color Themes Work Correctly:**
- 3 pre-defined themes (ocean, forest, charcoal) functional
- CSS custom properties (`--color-primary`, etc.) applied consistently
- All templates use semantic color classes (`text-primary`, `bg-primary`)
- Two-column templates respect themes (Azurill, Pikachu verified)

---

## Files Needing Modification

### High Priority: Fix Default Typography Inconsistency
- `/libs/reactive-artboard/mappers/resume.ts:137-141` - Update line height default from 1.4 to 1.5 (accessibility)
- `/libs/reactive-artboard/schema/metadata/index.ts:36,74` - Update schema defaults to match mapper (16px, Inter) OR make mapper read schema
- `/libs/reactive-artboard/mappers/coverLetter.ts:99-102` - Update line height default to 1.5

### High Priority: Centralize Spacing System
- `/tailwind.artboard.config.js:23-25` - Add spacing tokens: `sectionGap`, `itemGap`, `columnGap`
- `/libs/reactive-artboard/styles.ts:730-760` - Inject spacing CSS variables from metadata
- All template files (`azurill.tsx`, `kakuna.tsx`, etc.) - Replace hardcoded spacing with CSS variables
- `/libs/reactive-artboard/types.ts:7-11` - Add spacing config to `ArtboardTypography` or new `ArtboardSpacing` type

### Medium Priority: Expand Font Family Support
- `/libs/reactive-artboard/mappers/resume.ts:18-22` - Add more fonts to `FONT_FAMILY_MAP` (Roboto, Open Sans, Lato, Merriweather, etc.)
- Consider loading fonts from Google Fonts API or Fontsource

### Low Priority: Investigate Template Gallery Display
- `/components/templates/TemplateGallery.tsx:19-38` - Verify all 12 templates render in grid
- Check thumbnail image loading (`/public/templates/*.svg`)
- Investigate any subscription-based filtering logic

### Documentation Needed
- Document font size scale formula: `baseSize * fontSizeScale` (base = 16px)
- Document default typography values (source of truth: mapper or schema?)
- Create spacing design token documentation
- Add template layout patterns documentation (grid vs linear rendering)
