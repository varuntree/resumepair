# Reactive Resume Source - Template System Reference

## Investigation Scope
- Repository: `/Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume/`
- Focus: Template layouts, spacing, colors, variety, defaults
- Analysis Date: 2025-10-12
- Source Version: Latest commit (ff1b6cd)

---

## Feature 1: Two-Column Layout Implementation

### Implementation Approach
Reactive Resume uses **CSS Grid with dynamic column allocation** for two-column layouts. Each template receives a `columns` prop containing a two-dimensional array `[main, sidebar]` representing section distribution. Templates use `grid-cols-3` as the base grid, with the sidebar taking 1 column and main content taking 2 columns (ratio 1:2). Layout responsiveness is handled through **Tailwind's `group-[.sidebar]` and `group-[.main]` utility classes** to apply context-specific styles.

### Relevant Files
- `/Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume/apps/artboard/src/templates/azurill.tsx:559` - Grid layout with sidebar/main split
- `/Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume/apps/artboard/src/templates/ditto.tsx:606` - Grid cols-3 implementation
- `/Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume/apps/artboard/src/templates/pikachu.tsx:604` - Grid with conditional column spanning
- `/Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume/apps/artboard/src/templates/rhyhorn.tsx:566-582` - Single-column stacked layout (no sidebar)
- `/Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume/apps/artboard/src/templates/gengar.tsx:575-604` - Grid with min-height inheritance
- `/Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume/apps/artboard/src/types/template.ts:3-4` - TemplateProps type definition

### Code Evidence

**Template Props Structure:**
```typescript
// /Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume/apps/artboard/src/types/template.ts:3-6
export type TemplateProps = {
  columns: SectionKey[][];  // [main[], sidebar[]]
  isFirstPage?: boolean;
};
```

**Azurill Two-Column Grid (1:2 ratio):**
```tsx
// /Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume/apps/artboard/src/templates/azurill.tsx:552-576
export const Azurill = ({ columns, isFirstPage = false }: TemplateProps) => {
  const [main, sidebar] = columns;

  return (
    <div className="p-custom space-y-3">
      {isFirstPage && <Header />}

      <div className="grid grid-cols-3 gap-x-4">
        <div className="sidebar group space-y-4">
          {sidebar.map((section) => (
            <Fragment key={section}>{mapSectionToComponent(section)}</Fragment>
          ))}
        </div>

        <div
          className={cn("main group space-y-4", sidebar.length > 0 ? "col-span-2" : "col-span-3")}
        >
          {main.map((section) => (
            <Fragment key={section}>{mapSectionToComponent(section)}</Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};
```

**Gengar Full-Height Grid:**
```tsx
// /Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume/apps/artboard/src/templates/gengar.tsx:575-604
return (
  <div className="grid min-h-[inherit] grid-cols-3">
    <div className={cn("sidebar group flex flex-col", !(isFirstPage || sidebar.length > 0) && "hidden")}>
      {isFirstPage && <Header />}
      <div className="p-custom flex-1 space-y-4" style={{ backgroundColor: hexToRgb(primaryColor, 0.2) }}>
        {sidebar.map((section) => (
          <Fragment key={section}>{mapSectionToComponent(section)}</Fragment>
        ))}
      </div>
    </div>

    <div className={cn("main group", sidebar.length > 0 ? "col-span-2" : "col-span-3")}>
      {isFirstPage && <Summary />}
      <div className="p-custom space-y-4">
        {main.map((section) => (
          <Fragment key={section}>{mapSectionToComponent(section)}</Fragment>
        ))}
      </div>
    </div>
  </div>
);
```

**Rhyhorn Single-Column Stacked Layout:**
```tsx
// /Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume/apps/artboard/src/templates/rhyhorn.tsx:566-582
export const Rhyhorn = ({ columns, isFirstPage = false }: TemplateProps) => {
  const [main, sidebar] = columns;

  return (
    <div className="p-custom space-y-4">
      {isFirstPage && <Header />}

      {main.map((section) => (
        <Fragment key={section}>{mapSectionToComponent(section)}</Fragment>
      ))}

      {sidebar.map((section) => (
        <Fragment key={section}>{mapSectionToComponent(section)}</Fragment>
      ))}
    </div>
  );
};
```

### Key Techniques

1. **Fixed Grid Ratio with Conditional Spanning**
   - Base: `grid-cols-3` creates 3-column grid
   - Sidebar: 1 column (33.33% width)
   - Main: 2 columns (66.67% width) via `col-span-2`
   - Fallback: If no sidebar, main spans all 3 columns (`col-span-3`)

2. **Context-Aware Styling with Group Utilities**
   - Parent divs marked with `.sidebar` or `.main` classes
   - Children use `group-[.sidebar]:` and `group-[.main]:` Tailwind modifiers
   - Example: `group-[.sidebar]:text-center` centers text only in sidebar sections
   - Enables different layouts for same component based on column context

3. **Section-Level Column Control**
   - Individual sections support `section.columns` for multi-column content within a section
   - Inline style: `style={{ gridTemplateColumns: 'repeat(${section.columns}, 1fr)' }}`
   - Allows grid within grid (e.g., 2-column skill list inside a sidebar)

4. **Responsive Column Wrapping**
   - `flex items-start justify-between` for horizontal card layouts
   - `group-[.sidebar]:flex-col group-[.sidebar]:items-start` converts to vertical in sidebar
   - Ensures dates/locations stack below titles in narrow sidebar

5. **No Sidebar Fallback Pattern**
   - Check: `sidebar.length > 0 ? "col-span-2" : "col-span-3"`
   - Dynamically adjusts main column span based on sidebar presence
   - Maintains single-column appearance when sidebar empty

---

## Feature 2: Spacing and Alignment System

### Implementation Approach
Reactive Resume uses a **multi-tier spacing system**: (1) **Custom padding utility** `p-custom` for page margins controlled by metadata, (2) **Tailwind spacing scale** for gaps and margins between elements, and (3) **CSS Grid gaps** for section columns. Alignment is managed through **Flexbox utilities** (`justify-between`, `items-start`, `shrink-0`) combined with **group-based responsive modifiers** to handle sidebar vs. main column differences.

### Relevant Files
- `/Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume/libs/schema/src/metadata/index.ts:19` - Page margin default (18px)
- `/Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume/apps/artboard/src/templates/azurill.tsx:559` - `space-y-3` between sections
- `/Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume/apps/artboard/src/templates/ditto.tsx:207` - `gap-x-6 gap-y-3` for grid items
- `/Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume/apps/artboard/src/templates/pikachu.tsx:604` - `space-x-6` for horizontal column spacing
- `/Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume/apps/artboard/src/styles/main.css:28` - Wysiwyg prose spacing overrides

### Code Evidence

**Page Margin System:**
```typescript
// /Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume/libs/schema/src/metadata/index.ts:18-19
page: z.object({
  margin: z.number().default(18),
  // ...
})
```

**Vertical Section Spacing:**
```tsx
// /Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume/apps/artboard/src/templates/azurill.tsx:556-574
<div className="p-custom space-y-3">
  {isFirstPage && <Header />}

  <div className="grid grid-cols-3 gap-x-4">
    <div className="sidebar group space-y-4">
      {/* sidebar sections with 16px vertical spacing */}
    </div>

    <div className="main group space-y-4">
      {/* main sections with 16px vertical spacing */}
    </div>
  </div>
</div>
```

**Grid Item Spacing:**
```tsx
// /Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume/apps/artboard/src/templates/ditto.tsx:203-209
<div
  className="grid gap-x-6 gap-y-3"
  style={{ gridTemplateColumns: `repeat(${section.columns}, 1fr)` }}
>
  {/* Items: 24px horizontal gap, 12px vertical gap */}
</div>
```

**Alignment in Experience Section:**
```tsx
// /Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume/apps/artboard/src/templates/ditto.tsx:279-294
<div className="flex items-start justify-between group-[.sidebar]:flex-col group-[.sidebar]:items-start">
  <div className="text-left">
    <LinkedEntity name={item.company} url={item.url} className="font-bold" />
    <div>{item.position}</div>
  </div>

  <div className="shrink-0 text-right">
    <div className="font-bold">{item.date}</div>
    <div>{item.location}</div>
  </div>
</div>
```

**Wysiwyg Content Spacing:**
```css
/* /Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume/apps/artboard/src/styles/main.css:27-29 */
.wysiwyg {
  @apply prose-foreground prose max-w-none
    prose-headings:mb-2 prose-headings:mt-0
    prose-p:mb-2 prose-p:mt-0 prose-p:leading-normal
    prose-ol:mb-2 prose-ol:mt-0
    prose-ul:mb-2 prose-ul:mt-0
    prose-li:mb-2 prose-li:mt-0 prose-li:leading-normal;
}
```

### Key Techniques

1. **Tailwind Spacing Scale (Consistent Units)**
   - `space-y-2` = 8px vertical gap (for item children)
   - `space-y-3` = 12px vertical gap (between sections in pages)
   - `space-y-4` = 16px vertical gap (between sections in columns)
   - `gap-x-1.5` = 6px horizontal gap (icon + text)
   - `gap-x-2` = 8px horizontal gap (contact items)
   - `gap-x-4` = 16px horizontal gap (columns)
   - `gap-x-6` = 24px horizontal gap (section items)

2. **Custom Padding Utility Pattern**
   - `p-custom` class applied to all page containers
   - Controlled by `metadata.page.margin` (default 18px)
   - Converts margin value to padding via CSS variable or inline style
   - Provides uniform page edges across all templates

3. **Flexbox Alignment Strategy**
   - `flex items-start justify-between`: Left-align content, right-align dates/locations
   - `shrink-0`: Prevents date/location column from collapsing
   - `text-left` / `text-right`: Explicit text alignment within flex children
   - Responsive: `group-[.sidebar]:flex-col` switches to vertical stacking in narrow sidebar

4. **Grid Gap Consistency**
   - Horizontal: `gap-x-6` (24px) for multi-column section items
   - Vertical: `gap-y-3` (12px) between stacked items in same section
   - Maintains visual breathing room without excessive whitespace

5. **Prose Typography Spacing Override**
   - Tailwind Typography plugin provides default prose spacing
   - Override with `prose-p:mb-2 prose-p:mt-0` to tighten paragraph spacing
   - Ensures consistent 8px margins for rich text content
   - `leading-normal` (1.5 line-height) for readability

6. **Nested Spacing Pattern**
   - Parent: `space-y-4` between major sections
   - Child: `space-y-2` within individual section items
   - Creates visual hierarchy: larger gaps = higher-level separation

---

## Feature 3: Color Theme System

### Implementation Approach
Reactive Resume implements colors through **CSS custom properties (HSL format)** defined in metadata and applied via Tailwind config. The theme consists of three core colors: `background`, `text`, and `primary`. These are converted to HSL format and injected as CSS variables (`--background`, `--text`, `--primary`), which Tailwind utilities reference. The system includes a **utility function `hexToRgb()`** for creating semi-transparent backgrounds from the primary color. Theme colors are stored in `metadata.theme` and can be customized per-resume.

### Relevant Files
- `/Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume/libs/schema/src/metadata/index.ts:26-30` - Theme schema and defaults
- `/Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume/tailwind.config.js:13-46` - Tailwind color configuration
- `/Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume/libs/utils/src/namespaces/color.ts:1-7` - hexToRgb utility
- `/Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume/apps/artboard/src/templates/gengar.tsx:572,584,89` - Primary color with alpha for backgrounds
- `/Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume/apps/artboard/src/templates/pikachu.tsx:33` - Primary background with text-background utility

### Code Evidence

**Theme Schema and Defaults:**
```typescript
// /Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume/libs/schema/src/metadata/index.ts:26-30
theme: z.object({
  background: z.string().default("#ffffff"),
  text: z.string().default("#000000"),
  primary: z.string().default("#dc2626"),  // red-600
}),
```

```typescript
// /Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume/libs/schema/src/metadata/index.ts:64-68
theme: {
  background: "#ffffff",
  text: "#000000",
  primary: "#dc2626",
},
```

**Tailwind Custom Properties Integration:**
```javascript
// /Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume/tailwind.config.js:13-46
extend: {
  colors: {
    background: "hsl(var(--background))",
    foreground: "hsl(var(--foreground))",
    border: "hsl(var(--border))",
    primary: {
      DEFAULT: "hsl(var(--primary))",
      accent: "hsl(var(--primary-accent))",
      foreground: "hsl(var(--primary-foreground))",
    },
    // ...
  }
}
```

**HexToRgb Utility for Transparency:**
```typescript
// /Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume/libs/utils/src/namespaces/color.ts:1-7
export const hexToRgb = (hex: string, alpha = 0) => {
  const r = Number.parseInt(hex.slice(1, 3), 16),
    g = Number.parseInt(hex.slice(3, 5), 16),
    b = Number.parseInt(hex.slice(5, 7), 16);

  return alpha ? `rgba(${r}, ${g}, ${b}, ${alpha})` : `rgb(${r}, ${g}, ${b})`;
};
```

**Gengar Template: Primary Color with Alpha:**
```tsx
// /Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume/apps/artboard/src/templates/gengar.tsx:572-591
const primaryColor = useArtboardStore((state) => state.resume.metadata.theme.primary);

return (
  <div className="grid min-h-[inherit] grid-cols-3">
    <div className="sidebar group flex flex-col">
      {isFirstPage && <Header />}
      <div
        className="p-custom flex-1 space-y-4"
        style={{ backgroundColor: hexToRgb(primaryColor, 0.2) }}  // 20% opacity
      >
        {/* sidebar content */}
      </div>
    </div>
    {/* ... */}
  </div>
);
```

**Pikachu Template: Primary Background Header:**
```tsx
// /Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume/apps/artboard/src/templates/pikachu.tsx:27-100
const Header = () => {
  const basics = useArtboardStore((state) => state.resume.basics);

  return (
    <div className="summary group bg-primary px-6 pb-7 pt-6 text-background">
      {/* Header content with inverted colors */}
    </div>
  );
};
```

**Context-Aware Icon Colors:**
```tsx
// /Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume/apps/artboard/src/templates/gengar.tsx:129-142
<i className="ph ph-bold ph-link text-primary group-[.sidebar]:text-background" />
```

### Key Techniques

1. **CSS Custom Properties with HSL Format**
   - Theme colors stored as hex in metadata (#dc2626)
   - Converted to HSL and injected as CSS vars (--primary)
   - Tailwind references: `background: "hsl(var(--background))"`
   - Enables dynamic theming without recompiling CSS

2. **Three-Color Semantic System**
   - `background`: Page/card background color (default #ffffff)
   - `text` (foreground): Body text color (default #000000)
   - `primary`: Accent color for headings, icons, borders (default #dc2626 red-600)
   - Provides sufficient contrast and hierarchy with minimal complexity

3. **Alpha Channel Backgrounds via hexToRgb()**
   - Primary color used at 20% opacity for subtle section backgrounds
   - Example: `style={{ backgroundColor: hexToRgb(primaryColor, 0.2) }}`
   - Avoids need to store separate "light" color variants
   - Maintains consistency when primary color changes

4. **Group-Based Color Context Switching**
   - Icons: `text-primary` in main area, `text-background` in sidebar
   - Pattern: `text-primary group-[.sidebar]:text-background`
   - Ensures icons remain visible against colored sidebar backgrounds
   - No manual color tracking required

5. **Tailwind Utility Integration**
   - Direct use: `bg-primary`, `text-primary`, `border-primary`
   - No inline styles needed for most cases
   - IDE autocomplete and type-safety preserved
   - Fallback: Inline styles for dynamic alpha values

6. **Inverted Color Sections**
   - Headers with `bg-primary text-background`
   - Automatically inverts text for contrast
   - Summary sections with `group-[.summary]:text-background`
   - Scoped color context for specific areas

---

## Feature 4: Template Variety and Structure

### Implementation Approach
Reactive Resume provides **12 templates** with diverse layout patterns. Templates are registered in a centralized **template registry** (`/templates/index.tsx`) using a switch statement to map template names to React components. Each template follows a **standardized component contract** (TemplateProps) but implements unique visual styles through different grid systems, section ordering, header placements, and decorative elements. The template name is stored in `metadata.template` and retrieved via the `getTemplate()` function.

### Relevant Files
- `/Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume/apps/artboard/src/templates/index.tsx:16-58` - Template registry
- `/Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume/libs/utils/src/namespaces/template.ts:1-16` - Template list constants
- `/Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume/libs/schema/src/metadata/index.ts:12,50` - Template selection in metadata
- Template files in `/Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume/apps/artboard/src/templates/`:
  - `azurill.tsx` (16256 bytes) - Two-column with centered header and circular decorative dots
  - `bronzor.tsx` (16230 bytes) - Similar to Azurill with minor variations
  - `chikorita.tsx` (17106 bytes) - Decorative section headers with circular accents
  - `ditto.tsx` (18337 bytes) - Two-column with colored header bar background
  - `gengar.tsx` (17580 bytes) - Full-height sidebar with tinted background
  - `glalie.tsx` (17503 bytes) - Unique section styling
  - `kakuna.tsx` (14814 bytes) - Minimalist clean layout
  - `leafish.tsx` (15181 bytes) - Botanical-inspired design elements
  - `nosepass.tsx` (16730 bytes) - Geometric section dividers
  - `onyx.tsx` (16331 bytes) - Default template with solid foundations
  - `pikachu.tsx` (18261 bytes) - Left sidebar with picture, colored header
  - `rhyhorn.tsx` (16354 bytes) - Single-column stacked layout

### Code Evidence

**Template List Definition:**
```typescript
// /Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume/libs/utils/src/namespaces/template.ts:1-16
export const templatesList = [
  "azurill",
  "bronzor",
  "chikorita",
  "ditto",
  "gengar",
  "glalie",
  "kakuna",
  "leafish",
  "nosepass",
  "onyx",
  "pikachu",
  "rhyhorn",
] as const;

export type Template = (typeof templatesList)[number];
```

**Template Registry:**
```tsx
// /Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume/apps/artboard/src/templates/index.tsx:16-58
export const getTemplate = (template: Template) => {
  switch (template) {
    case "azurill": {
      return Azurill;
    }
    case "bronzor": {
      return Bronzor;
    }
    case "chikorita": {
      return Chikorita;
    }
    case "ditto": {
      return Ditto;
    }
    case "gengar": {
      return Gengar;
    }
    case "glalie": {
      return Glalie;
    }
    case "kakuna": {
      return Kakuna;
    }
    case "leafish": {
      return Leafish;
    }
    case "nosepass": {
      return Nosepass;
    }
    case "onyx": {
      return Onyx;
    }
    case "pikachu": {
      return Pikachu;
    }
    case "rhyhorn": {
      return Rhyhorn;
    }
    default: {
      return Onyx;  // Fallback to default template
    }
  }
};
```

**Template Metadata Storage:**
```typescript
// /Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume/libs/schema/src/metadata/index.ts:12,50
template: z.string().default("rhyhorn"),

// Default metadata:
template: "rhyhorn",
```

**Template Component Structure (Azurill example):**
```tsx
// /Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume/apps/artboard/src/templates/azurill.tsx:552-576
export const Azurill = ({ columns, isFirstPage = false }: TemplateProps) => {
  const [main, sidebar] = columns;

  return (
    <div className="p-custom space-y-3">
      {isFirstPage && <Header />}

      <div className="grid grid-cols-3 gap-x-4">
        <div className="sidebar group space-y-4">
          {sidebar.map((section) => (
            <Fragment key={section}>{mapSectionToComponent(section)}</Fragment>
          ))}
        </div>

        <div
          className={cn("main group space-y-4", sidebar.length > 0 ? "col-span-2" : "col-span-3")}
        >
          {main.map((section) => (
            <Fragment key={section}>{mapSectionToComponent(section)}</Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};
```

### Key Techniques

1. **Standardized Template Contract**
   - All templates receive identical props: `{ columns, isFirstPage }`
   - `columns`: Two-dimensional array `[main[], sidebar[]]` with section keys
   - `isFirstPage`: Boolean flag for first-page-only elements (header, picture)
   - Enables hot-swapping templates without data changes

2. **Centralized Template Registry**
   - Single source of truth: `getTemplate(template: Template)`
   - Switch statement maps string IDs to React components
   - Default fallback: Returns Onyx template for unknown IDs
   - Type-safe: Template type is const array of string literals

3. **Shared Section Mapping Function**
   - `mapSectionToComponent(section: SectionKey)` in each template
   - Maps section IDs to React components (Experience, Education, etc.)
   - Handles custom sections: `if (section.startsWith("custom."))`
   - Consistent section rendering across all templates

4. **Layout Pattern Variations**
   - **Two-column split (1:2 ratio)**: Azurill, Bronzor, Ditto, Gengar, Pikachu
   - **Single-column stacked**: Rhyhorn (no sidebar)
   - **Full-height sidebar**: Gengar (sidebar spans entire page height)
   - **Colored sidebar background**: Gengar (primary color at 20% opacity)
   - **Colored header bar**: Ditto, Pikachu (primary background with inverted text)

5. **Decorative Differentiators**
   - **Azurill**: Circular dots beside section headers (`size-1.5 rounded-full border`)
   - **Ditto**: Absolute positioned colored bar at top (`h-[85px] bg-primary`)
   - **Pikachu**: Diamond-shaped rating icons (`ph-diamond`)
   - **Rhyhorn**: Rounded borders on contact items (`border-r pr-2`)
   - **Gengar**: Border bottom on section headers (`border-b border-primary`)

6. **Template Organization Strategy**
   - Templates stored in `/apps/artboard/src/templates/`
   - One file per template (14-18KB each)
   - Consistent naming: lowercase, Pokemon-themed
   - Self-contained: Each template includes Header, Summary, Section components

---

## Feature 5: Default Values and Typography

### Implementation Approach
Reactive Resume defines typography through a **metadata.typography object** with nested font properties. The default font is **IBM Plex Serif at 14px** with a **1.5 line-height**. Font families are dynamically loaded and applied via inline styles on the page component. Typography includes options for **icon visibility** (`hideIcons`) and **link underlines** (`underlineLinks`). The system uses **Tailwind Typography plugin** for rich text styling with custom spacing overrides in `.wysiwyg` class.

### Relevant Files
- `/Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume/libs/schema/src/metadata/index.ts:31-41,69-79` - Typography schema and defaults
- `/Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume/apps/artboard/src/components/page.tsx:18,24-28` - Font family application
- `/Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume/apps/artboard/src/styles/main.css:19-29` - Typography utilities
- `/Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume/tailwind.config.js:48-50` - Font family configuration

### Code Evidence

**Typography Schema and Defaults:**
```typescript
// /Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume/libs/schema/src/metadata/index.ts:31-41
typography: z.object({
  font: z.object({
    family: z.string().default("IBM Plex Serif"),
    subset: z.string().default("latin"),
    variants: z.array(z.string()).default(["regular"]),
    size: z.number().default(14),
  }),
  lineHeight: z.number().default(1.5),
  hideIcons: z.boolean().default(false),
  underlineLinks: z.boolean().default(true),
}),
```

```typescript
// /Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume/libs/schema/src/metadata/index.ts:69-79
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
```

**Font Family Application:**
```tsx
// /Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume/apps/artboard/src/components/page.tsx:18,24-28
const fontFamily = useArtboardStore((state) => state.resume.metadata.typography.font.family);

return (
  <div
    data-page={pageNumber}
    className={cn("relative bg-background text-foreground", mode === "builder" && "shadow-2xl")}
    style={{
      fontFamily,
      width: `${pageSizeMap[page.format].width * MM_TO_PX}px`,
      minHeight: `${pageSizeMap[page.format].height * MM_TO_PX}px`,
    }}
  >
```

**Typography Utilities:**
```css
/* /Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume/apps/artboard/src/styles/main.css:19-29 */
[data-page].hide-icons .ph {
  @apply hidden;
}

[data-page].underline-links a {
  @apply underline underline-offset-2;
}

.wysiwyg {
  @apply prose-foreground prose max-w-none
    prose-headings:mb-2 prose-headings:mt-0
    prose-p:mb-2 prose-p:mt-0 prose-p:leading-normal
    prose-a:break-all
    prose-ol:mb-2 prose-ol:mt-0
    prose-ul:mb-2 prose-ul:mt-0
    prose-li:mb-2 prose-li:mt-0 prose-li:leading-normal
    prose-img:mb-2 prose-img:mt-0
    prose-hr:mb-2 prose-hr:mt-0;
}
```

**Tailwind Font Configuration:**
```javascript
// /Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume/tailwind.config.js:48-50
fontFamily: {
  sans: ["IBM Plex Sans", "sans-serif"],
},
```

**Template Typography Usage:**
```tsx
// /Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume/apps/artboard/src/templates/azurill.tsx:35-36
<div className="text-2xl font-bold">{basics.name}</div>
<div className="text-base">{basics.headline}</div>
```

### Key Techniques

1. **Dynamic Font Loading and Application**
   - Font family stored in `metadata.typography.font.family`
   - Applied via inline style on page container: `style={{ fontFamily }}`
   - Supports Google Fonts and system fonts
   - Font variants array enables loading multiple weights: `["regular", "italic", "600"]`

2. **Default Font Stack**
   - Body font: **IBM Plex Serif 14px** (professional, readable serif)
   - UI font: **IBM Plex Sans** (for application UI, not resume)
   - Size: 14px base (standard for resume printing at 300dpi)
   - Line height: 1.5 (optimal for body text readability)

3. **Typography Scale via Tailwind Utilities**
   - Name: `text-2xl` (24px, 1.5rem)
   - Headline: `text-base` (14px, inherits base size)
   - Section headings: `text-base` (14px) or `text-sm` (12px)
   - Body text: Base size (14px)
   - Small text: `text-sm` (12px, 0.875rem)

4. **Font Weight System**
   - Default: `regular` (400 weight)
   - Bold: `font-bold` (600 weight via Tailwind utility)
   - Variants loaded: `["regular", "italic", "600"]`
   - Ensures bold text renders correctly without faux-bold

5. **Icon Control System**
   - Icons: Phosphor icon library (ph-bold classes)
   - Global toggle: `hideIcons` boolean in metadata
   - CSS: `[data-page].hide-icons .ph { display: none; }`
   - Enables icon-free minimalist layouts on demand

6. **Link Underline Control**
   - Global toggle: `underlineLinks` boolean in metadata
   - CSS: `[data-page].underline-links a { text-decoration: underline; }`
   - Underline offset: 2px (`underline-offset-2`)
   - Improves link visibility without disrupting design

7. **Wysiwyg Content Typography**
   - Tailwind Typography plugin provides base prose styles
   - Custom overrides via `.wysiwyg` class
   - Spacing: `mb-2 mt-0` (8px bottom, 0px top) for all elements
   - Line height: `leading-normal` (1.5) for paragraphs and list items
   - Max width: `max-w-none` (no width constraint)
   - Link handling: `prose-a:break-all` (prevents overflow)

8. **Typography Metadata Structure**
   - Font object: `{ family, subset, variants, size }`
   - Root level: `{ font, lineHeight, hideIcons, underlineLinks }`
   - Enables per-resume font customization
   - Subset field for internationalization (latin, cyrillic, etc.)

---

## Summary: Best Practices to Adopt

1. **Use CSS Grid with fixed ratios for multi-column layouts**
   - Rationale: Grid provides predictable, responsive layouts without complex media queries. Fixed ratios (1:2 for sidebar:main) maintain consistent proportions across templates. Conditional spanning (`col-span-2` vs `col-span-3`) gracefully handles empty columns.

2. **Implement group-based context-aware styling with Tailwind modifiers**
   - Rationale: `group-[.sidebar]:` and `group-[.main]:` enable DRY component design. Same React component renders differently based on parent context (e.g., horizontal card in main, vertical in sidebar) without prop drilling or conditional logic.

3. **Define theme colors as CSS custom properties in HSL format**
   - Rationale: HSL format enables dynamic theming without CSS recompilation. Three-color system (background, text, primary) provides sufficient hierarchy with minimal complexity. CSS variables integrate seamlessly with Tailwind utilities.

4. **Use hexToRgb utility for semi-transparent backgrounds from primary color**
   - Rationale: Avoids need to store separate "light" color variants. Maintains visual consistency when primary color changes. Simple utility function (`hexToRgb(color, 0.2)`) creates 20% opacity backgrounds on-demand.

5. **Adopt multi-tier spacing system: page margins, section gaps, item spacing**
   - Rationale: Three-tier system (custom padding, Tailwind scale, grid gaps) provides consistent visual rhythm. Larger gaps between major elements, smaller gaps within sections creates clear hierarchy. Tailwind spacing scale (2, 3, 4, 6) offers sufficient granularity without pixel-perfect complexity.

6. **Centralize template registry with standardized component contract**
   - Rationale: Switch statement registry enables hot-swapping templates without data changes. Standardized props (`{ columns, isFirstPage }`) ensure all templates work with same data structure. Type-safe template IDs prevent runtime errors.

7. **Store typography as metadata object with dynamic font loading**
   - Rationale: Per-resume font customization enables brand consistency. Font variants array ensures proper weight rendering. Inline style application (`style={{ fontFamily }}`) avoids CSS bundle bloat from unused fonts.

8. **Implement global toggles for icons and link underlines**
   - Rationale: Enables minimalist vs. expressive design variants without duplicating templates. Attribute selectors (`[data-page].hide-icons .ph`) provide clean on/off switches. Improves accessibility and ATS compatibility.

---

## Implementation Patterns

- **Template Structure Pattern**: Export named component receiving `{ columns, isFirstPage }` props. Destructure columns into `[main, sidebar]`. Conditionally render header on `isFirstPage`. Map sections via `mapSectionToComponent()`.

- **Section Component Pattern**: Generic `Section<T>` component handles all section types. Uses `urlKey`, `levelKey`, `summaryKey`, `keywordsKey` props to extract item properties. Renders children via render prop pattern. Handles visibility filtering and grid layout.

- **Responsive Layout Pattern**: Use `flex justify-between` for horizontal layouts. Add `group-[.sidebar]:flex-col` for vertical sidebar stacking. Apply `shrink-0` to date/location columns to prevent collapse. Use `text-left` and `text-right` for explicit alignment.

- **Color Context Pattern**: Icons use `text-primary` in main area. Override with `group-[.sidebar]:text-background` for visibility on colored backgrounds. Headers use `bg-primary text-background` for inverted sections.

- **Spacing Hierarchy Pattern**: Page container uses `p-custom`. Column container uses `space-y-4` (16px). Section items use `space-y-2` (8px). Grid items use `gap-x-6 gap-y-3` (24px horizontal, 12px vertical).

- **Typography Application Pattern**: Page component reads `fontFamily` from store. Applies via inline style on root div. Template headings use `text-2xl font-bold` (24px). Section headers use `text-base font-bold` (14px). Body text inherits base size.

---

## Code Techniques

### CSS Grid Two-Column Layout
```tsx
<div className="grid grid-cols-3 gap-x-4">
  <div className="sidebar group space-y-4">
    {/* 1 column (33.33%) */}
  </div>
  <div className={cn("main group space-y-4", sidebar.length > 0 ? "col-span-2" : "col-span-3")}>
    {/* 2 columns (66.67%) or 3 columns (100%) if no sidebar */}
  </div>
</div>
```

### Group-Based Responsive Layout
```tsx
<div className="flex items-start justify-between group-[.sidebar]:flex-col group-[.sidebar]:items-start">
  <div className="text-left">{/* Left content */}</div>
  <div className="shrink-0 text-right group-[.sidebar]:text-left">{/* Right content */}</div>
</div>
```

### Dynamic Grid Columns from Section Data
```tsx
<div
  className="grid gap-x-6 gap-y-3"
  style={{ gridTemplateColumns: `repeat(${section.columns}, 1fr)` }}
>
  {/* Grid items with configurable column count */}
</div>
```

### Theme Color with Alpha Channel
```tsx
const primaryColor = useArtboardStore((state) => state.resume.metadata.theme.primary);

<div style={{ backgroundColor: hexToRgb(primaryColor, 0.2) }}>
  {/* Content with 20% opacity primary background */}
</div>
```

### Context-Aware Icon Colors
```tsx
<i className="ph ph-bold ph-link text-primary group-[.sidebar]:text-background" />
```

### Custom Padding from Metadata
```tsx
// In page component:
const page = useArtboardStore((state) => state.resume.metadata.page);
// CSS: .p-custom { padding: calc(var(--margin) * 1px); }
// JS: Set CSS variable from page.margin value
```

### Typography Application
```tsx
const fontFamily = useArtboardStore((state) => state.resume.metadata.typography.font.family);

<div style={{ fontFamily }}>
  {/* Content with dynamic font family */}
</div>
```

### Section Visibility and Grid Rendering
```tsx
const Section = <T,>({ section, children, className, urlKey, levelKey, summaryKey, keywordsKey }: SectionProps<T>) => {
  if (!section.visible || section.items.filter((item) => item.visible).length === 0) return null;

  return (
    <section id={section.id} className="grid">
      <h4 className="mb-2 text-base font-bold">{section.name}</h4>
      <div
        className="grid gap-x-6 gap-y-3"
        style={{ gridTemplateColumns: `repeat(${section.columns}, 1fr)` }}
      >
        {section.items
          .filter((item) => item.visible)
          .map((item) => {
            const url = (urlKey && get(item, urlKey)) as URL | undefined;
            const level = (levelKey && get(item, levelKey, 0)) as number | undefined;
            // ...
            return (
              <div key={item.id} className={cn("space-y-2", className)}>
                {children?.(item as T)}
                {/* Render summary, level, keywords if present */}
              </div>
            );
          })}
      </div>
    </section>
  );
};
```

### Template Registry Switch
```tsx
export const getTemplate = (template: Template) => {
  switch (template) {
    case "azurill": return Azurill;
    case "bronzor": return Bronzor;
    // ... 12 templates
    default: return Onyx;  // Fallback
  }
};
```

### Wysiwyg Content Rendering
```tsx
<div
  dangerouslySetInnerHTML={{ __html: sanitize(section.content) }}
  style={{ columns: section.columns }}
  className="wysiwyg"
/>
```

---

## EVIDENCE: File Structure Map

```
/Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume/
├── apps/artboard/src/
│   ├── templates/
│   │   ├── index.tsx              [Template registry: getTemplate() switch]
│   │   ├── azurill.tsx            [Two-column: centered header, circular dots]
│   │   ├── bronzor.tsx            [Two-column: similar to Azurill]
│   │   ├── chikorita.tsx          [Two-column: circular section accents]
│   │   ├── ditto.tsx              [Two-column: colored header bar]
│   │   ├── gengar.tsx             [Two-column: full-height sidebar, tinted bg]
│   │   ├── glalie.tsx             [Two-column: unique section styles]
│   │   ├── kakuna.tsx             [Two-column: minimalist clean]
│   │   ├── leafish.tsx            [Two-column: botanical elements]
│   │   ├── nosepass.tsx           [Two-column: geometric dividers]
│   │   ├── onyx.tsx               [Two-column: default solid foundations]
│   │   ├── pikachu.tsx            [Two-column: left sidebar with picture]
│   │   └── rhyhorn.tsx            [Single-column: stacked layout]
│   ├── components/
│   │   └── page.tsx               [Font family application, page sizing]
│   ├── types/
│   │   └── template.ts            [TemplateProps: { columns, isFirstPage }]
│   ├── store/
│   │   └── artboard.ts            [Zustand store: resume data]
│   └── styles/
│       └── main.css               [Wysiwyg prose spacing, icon/link toggles]
├── libs/
│   ├── schema/src/
│   │   ├── index.ts               [ResumeData schema aggregation]
│   │   └── metadata/
│   │       └── index.ts           [Theme, typography, layout defaults]
│   └── utils/src/namespaces/
│       ├── template.ts            [templatesList constant, Template type]
│       ├── style.ts               [cn() utility for Tailwind merge]
│       └── color.ts               [hexToRgb() for alpha backgrounds]
└── tailwind.config.js             [HSL custom properties, font config]
```

---

## INVARIANTS

- **Template contract**: All templates must accept `{ columns: SectionKey[][], isFirstPage?: boolean }` props
- **Color system**: Theme consists of exactly three colors (background, text, primary) in hex format
- **Spacing scale**: Use Tailwind spacing utilities (2, 3, 4, 6) for consistency; avoid arbitrary values
- **Grid ratio**: Two-column layouts use 1:2 ratio (sidebar 33.33%, main 66.67%)
- **Typography base**: Default font size is 14px; all relative sizes scale from this base
- **Section visibility**: Sections with `visible: false` or zero visible items must not render
- **Group classes**: Sidebar and main divs must have `.sidebar` and `.main` classes for context styling

---

## CONSTRAINTS

- **Performance**: Templates render via React, so avoid heavy computations in render functions
- **Print compatibility**: All measurements must convert to print units (MM_TO_PX = 3.78)
- **Type safety**: Template IDs must match const array in `templatesList` for type checking
- **CSS scope**: Template-specific styles should use Tailwind utilities, not custom CSS files
- **Icon library**: Limited to Phosphor icons (ph-* classes); custom SVGs require component changes
- **Font loading**: Dynamic fonts require external loading mechanism (not shown in templates)

---

## SOURCE MAP

**Templates investigated** (7 of 12):
- `/Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume/apps/artboard/src/templates/azurill.tsx` - Two-column reference implementation
- `/Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume/apps/artboard/src/templates/ditto.tsx` - Colored header pattern
- `/Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume/apps/artboard/src/templates/gengar.tsx` - Full-height sidebar, alpha backgrounds
- `/Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume/apps/artboard/src/templates/pikachu.tsx` - Left sidebar with picture
- `/Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume/apps/artboard/src/templates/rhyhorn.tsx` - Single-column stacked

**Schema and configuration**:
- `/Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume/libs/schema/src/metadata/index.ts` - Theme, typography, layout defaults
- `/Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume/libs/schema/src/index.ts` - ResumeData structure
- `/Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume/tailwind.config.js` - Color system, font configuration

**Utilities and styles**:
- `/Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume/libs/utils/src/namespaces/template.ts` - Template list constants
- `/Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume/libs/utils/src/namespaces/color.ts` - hexToRgb utility
- `/Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume/libs/utils/src/namespaces/style.ts` - Tailwind merge utility
- `/Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume/apps/artboard/src/styles/main.css` - Global typography overrides

**Component infrastructure**:
- `/Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume/apps/artboard/src/templates/index.tsx` - Template registry
- `/Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume/apps/artboard/src/types/template.ts` - TemplateProps definition
- `/Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume/apps/artboard/src/store/artboard.ts` - Zustand state management
- `/Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume/apps/artboard/src/components/page.tsx` - Page sizing and font application

**Why these files**: Selected files represent core template system architecture (layouts, colors, spacing, registry, defaults). Covered all major layout patterns (two-column, single-column, full-height sidebar) and key techniques (grid systems, group modifiers, theme application, spacing hierarchy). Schema files provide ground truth for defaults and structure. Utility files show reusable patterns for colors and styles.
