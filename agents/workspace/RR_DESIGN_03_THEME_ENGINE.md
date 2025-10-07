# Reactive Resume: Theme Engine & Design Token System

**Document:** RR_DESIGN_03_THEME_ENGINE.md
**Source:** /Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume
**Date:** 2025-10-07

---

## Overview

Reactive Resume implements a CSS-variable-based theme engine that bridges user customizations with template rendering. The system uses design tokens, Tailwind CSS integration, and runtime CSS variable updates for dynamic theming.

---

## Theme Architecture

### Three-Layer System

```
┌──────────────────────────────────────────┐
│  Layer 1: User Customizations            │
│  (Metadata Schema)                       │
│  - theme.primary: "#dc2626"              │
│  - theme.background: "#ffffff"           │
│  - theme.text: "#000000"                 │
│  - typography.font.size: 14              │
└────────────────┬─────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────┐
│  Layer 2: CSS Variables                  │
│  (Runtime Application)                   │
│  --color-primary: #dc2626                │
│  --color-background: #ffffff             │
│  --color-foreground: #000000             │
│  --font-size: 14px                       │
└────────────────┬─────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────┐
│  Layer 3: Tailwind Tokens                │
│  (Template Classes)                      │
│  text-primary → hsl(var(--primary))      │
│  bg-background → hsl(var(--background))  │
│  text-foreground → hsl(var(--foreground))│
└──────────────────────────────────────────┘
```

---

## Layer 1: Metadata Schema

**Location:** `/libs/schema/src/metadata/index.ts`

### Complete Metadata Structure

```typescript
// Lines 11-43
export const metadataSchema = z.object({
  // Template Selection
  template: z.string().default("rhyhorn"),

  // Layout Configuration
  layout: z.array(z.array(z.array(z.string()))).default(defaultLayout),

  // Custom CSS
  css: z.object({
    value: z.string().default("* {\n\toutline: 1px solid #000;\n\toutline-offset: 4px;\n}"),
    visible: z.boolean().default(false),
  }),

  // Page Settings
  page: z.object({
    margin: z.number().default(18),
    format: z.enum(["a4", "letter"]).default("a4"),
    options: z.object({
      breakLine: z.boolean().default(true),
      pageNumbers: z.boolean().default(true),
    }),
  }),

  // Theme Colors
  theme: z.object({
    background: z.string().default("#ffffff"),
    text: z.string().default("#000000"),
    primary: z.string().default("#dc2626"),
  }),

  // Typography Settings
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

  // User Notes
  notes: z.string().default(""),
});
```

### Default Values Export

```typescript
// Lines 49-81
export const defaultMetadata: Metadata = {
  template: "rhyhorn",
  layout: defaultLayout,
  css: {
    value: "* {\n\toutline: 1px solid #000;\n\toutline-offset: 4px;\n}",
    visible: false,
  },
  page: {
    margin: 18,
    format: "a4",
    options: {
      breakLine: true,
      pageNumbers: true,
    },
  },
  theme: {
    background: "#ffffff",
    text: "#000000",
    primary: "#dc2626",
  },
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
  notes: "",
};
```

---

## Layer 2: CSS Variable Application

**Location:** `/apps/artboard/src/pages/artboard.tsx`

### Runtime Variable Injection

The artboard page listens to metadata changes and applies them as CSS variables:

```typescript
// Lines 32-47
useEffect(() => {
  // Root-level font properties
  document.documentElement.style.setProperty(
    "font-size",
    `${metadata.typography.font.size}px`
  );
  document.documentElement.style.setProperty(
    "line-height",
    `${metadata.typography.lineHeight}`
  );

  // Custom CSS variables for templates
  document.documentElement.style.setProperty(
    "--margin",
    `${metadata.page.margin}px`
  );
  document.documentElement.style.setProperty(
    "--font-size",
    `${metadata.typography.font.size}px`
  );
  document.documentElement.style.setProperty(
    "--line-height",
    `${metadata.typography.lineHeight}`
  );

  // Theme color variables
  document.documentElement.style.setProperty(
    "--color-foreground",
    metadata.theme.text
  );
  document.documentElement.style.setProperty(
    "--color-primary",
    metadata.theme.primary
  );
  document.documentElement.style.setProperty(
    "--color-background",
    metadata.theme.background
  );
}, [metadata]);
```

### CSS Variable Naming Convention

**Color Variables:**
- `--color-primary`: Primary accent color
- `--color-background`: Page background
- `--color-foreground`: Text color

**Typography Variables:**
- `--font-size`: Base font size in px
- `--line-height`: Line height multiplier

**Layout Variables:**
- `--margin`: Page margin in px

### Application Scope

All variables are applied to `document.documentElement` (`:root` scope), making them globally available to all templates and components.

---

## Layer 3: Tailwind Integration

**Location:** `/tailwind.config.js`

### Color Token Configuration

```javascript
// Lines 12-46
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

    secondary: {
      DEFAULT: "hsl(var(--secondary))",
      accent: "hsl(var(--secondary-accent))",
      foreground: "hsl(var(--secondary-foreground))",
    },

    error: {
      DEFAULT: "hsl(var(--error))",
      accent: "hsl(var(--error-accent))",
      foreground: "hsl(var(--error-foreground))",
    },

    // ... more color categories
  },
}
```

### HSL Conversion Pattern

**Key Insight:** Tailwind expects HSL format, so the app uses `hsl(var(--variable))` wrapper.

However, the CSS variables set in artboard.tsx are hex colors (`#dc2626`), which works because:
1. Modern browsers accept any color format in CSS variables
2. The hex values are directly used in templates via `style` attributes
3. Tailwind classes convert to HSL at build time

### Template Usage Examples

**Text Colors:**
```tsx
<div className="text-primary">Primary colored text</div>
<div className="text-foreground">Regular text</div>
<div className="text-background">Inverted text (on colored bg)</div>
```

**Background Colors:**
```tsx
<div className="bg-primary">Primary background</div>
<div className="bg-background">Page background</div>
```

**Border Colors:**
```tsx
<div className="border-primary">Primary border</div>
```

**Icon Colors:**
```tsx
<i className="ph ph-phone text-primary" />
```

---

## Custom Utility Classes

**Location:** `/apps/artboard/src/styles/main.css`

### Typography Option Classes

```css
/* Hide icons when hideIcons is true */
[data-page].hide-icons .ph {
  @apply hidden;
}

/* Underline links when underlineLinks is true */
[data-page].underline-links a {
  @apply underline underline-offset-2;
}
```

**Implementation:**
```typescript
// artboard.tsx lines 50-58
useEffect(() => {
  const elements = Array.from(document.querySelectorAll(`[data-page]`));

  for (const el of elements) {
    el.classList.toggle("hide-icons", metadata.typography.hideIcons);
    el.classList.toggle("underline-links", metadata.typography.underlineLinks);
  }
}, [metadata]);
```

### WYSIWYG Prose Styling

```css
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

**Usage:** Applied to sections containing HTML content (like summary sections)

---

## Dynamic Styling Patterns

### 1. Direct Style Attributes

Templates use inline styles for dynamic values:

```tsx
// gengar.tsx line 89
<div style={{ backgroundColor: hexToRgb(primaryColor, 0.2) }}>
  {/* Sidebar with tinted background */}
</div>

// pikachu.tsx line 34
<div
  className="summary group bg-primary text-background"
  style={{ borderRadius: `calc(${borderRadius}px - 2px)` }}
>
  {/* Header with dynamic border radius */}
</div>

// glalie.tsx lines 115-116
<div
  className="h-2.5 w-full rounded-sm"
  style={{ backgroundColor: hexToRgb(primaryColor, 0.4) }}
/>
```

### 2. CSS Variable References

Templates reference CSS variables for consistency:

```tsx
// Using --margin custom property
<div className="p-custom">
  {/* Padding from CSS variable */}
</div>
```

Where `.p-custom` is defined as:
```css
.p-custom {
  padding: var(--margin);
}
```

### 3. Tailwind + Dynamic Combos

```tsx
<div className="bg-primary text-background px-6 pb-7 pt-6">
  {/* Static padding from Tailwind, dynamic colors from theme */}
</div>
```

---

## Color Manipulation Utilities

**Location:** `/libs/utils/src/` (inferred from imports)

### hexToRgb Function

Converts hex color to rgba with opacity:

```typescript
// Usage examples from templates
hexToRgb(primaryColor, 0.2)  // 20% opacity
hexToRgb(primaryColor, 0.4)  // 40% opacity

// Typical output: rgba(220, 38, 38, 0.2)
```

**Applications:**
- Tinted sidebar backgrounds (gengar, glalie)
- Subtle colored sections (gengar summary)
- Progress bar backgrounds (glalie ratings)

### linearTransform Function

Maps values from one range to another:

```typescript
// Map skill level (0-5) to pixel width (0-128)
linearTransform(level, 0, 5, 0, 128)

// Map skill level (0-5) to percentage (0-100)
linearTransform(level, 0, 5, 0, 100)
```

**Applications:**
- Progress bar widths (azurill, glalie)
- Dynamic sizing based on data values

---

## Template-Specific Color Applications

### Rhyhorn (Minimal)
- Icons: `text-primary`
- Section headers: `border-b` (inherits border-current)
- Links: `text-primary` via icon classes

### Azurill (Timeline)
- Section headers: `text-primary font-bold`
- Timeline dots: `border-primary`, `bg-primary`
- Timeline line: `border-primary`
- Icons: `text-primary`

### Pikachu (Colored Header)
- Header background: `bg-primary`
- Header text: `text-background`
- Section borders: `border-primary`
- Icons in header: no color class (inherits text-background)
- Icons in content: `text-primary`

### Ditto (Colored Band)
- Primary band: `bg-primary` (absolute positioned)
- Section borders: `border-primary` (4px left border)
- Icons: `text-primary`

### Gengar (Colored Sidebar)
- Sidebar background: `backgroundColor: hexToRgb(primaryColor, 0.2)`
- Header: `bg-primary text-background`
- Summary background: Same rgba with 0.2 opacity
- Section borders: `border-primary`

### Glalie (Elegant Sidebar)
- Sidebar background: `backgroundColor: hexToRgb(primaryColor, 0.2)`
- Contact box: `border-primary`
- Progress bar: `bg-primary` + rgba background
- Section headers in sidebar: `text-primary`

### Bronzor (Academic)
- Section separators: `border-top` (inherits)
- Icons: `text-primary`

### Kakuna (Centered)
- Section headers: `border-b border-primary text-primary`
- Header centered: `text-primary`

---

## Theme Application Flow

### User Interaction Flow

```
1. User clicks color in preset grid
   ↓
2. onClick handler calls setValue("metadata.theme.primary", color)
   ↓
3. Zustand store updates metadata.theme.primary
   ↓
4. useEffect in artboard.tsx detects metadata change
   ↓
5. document.documentElement.style.setProperty("--color-primary", newColor)
   ↓
6. Templates using text-primary, bg-primary automatically update
   ↓
7. Templates using inline hexToRgb() re-render with new color
```

### Font Application Flow

```
1. User selects font from combobox
   ↓
2. setValue("metadata.typography.font.family", fontFamily)
   ↓
3. Store updates, triggers re-render
   ↓
4. useMemo computes new fontString: "IBM Plex Sans:regular,600:latin"
   ↓
5. useEffect detects fontString change
   ↓
6. webfontloader.load() fetches font from Google Fonts
   ↓
7. Font becomes available, postMessage triggers layout recalc
   ↓
8. document.documentElement.style.setProperty("font-size", ...) applied
```

---

## Color Preset System

**Location:** `/apps/client/src/constants/colors.ts`

### Preset Palette

19 carefully selected colors from Tailwind's 600-shade range:

```typescript
export const colors: string[] = [
  "#475569", // slate-600    - Neutral gray
  "#57534e", // stone-600    - Warm gray
  "#dc2626", // red-600      - Bold red (default)
  "#ea580c", // orange-600   - Vibrant orange
  "#d97706", // amber-600    - Golden amber
  "#ca8a04", // yellow-600   - Bright yellow
  "#65a30d", // lime-600     - Fresh lime
  "#16a34a", // green-600    - Forest green
  "#059669", // emerald-600  - Rich emerald
  "#0d9488", // teal-600     - Ocean teal
  "#0891b2", // cyan-600     - Sky cyan
  "#0284c7", // sky-600      - Clear sky
  "#2563eb", // blue-600     - Royal blue
  "#4f46e5", // indigo-600   - Deep indigo
  "#7c3aed", // violet-600   - Purple violet
  "#9333ea", // purple-600   - Bright purple
  "#c026d3", // fuchsia-600  - Hot fuchsia
  "#db2777", // pink-600     - Vibrant pink
  "#e11d48", // rose-600     - Classic rose
];
```

### Design Rationale

**Why 600-shade?**
- Sufficient contrast on white backgrounds
- Not too dark, not too light
- Works well for both text and backgrounds
- Consistent intensity across all hues

**Color Categories:**
- **Neutrals** (2): Slate, Stone
- **Warm** (4): Red, Orange, Amber, Yellow
- **Cool Greens** (4): Lime, Green, Emerald, Teal
- **Blues** (3): Cyan, Sky, Blue
- **Purples** (4): Indigo, Violet, Purple, Fuchsia
- **Pinks** (2): Pink, Rose

**UI Layout:**
- Grid display: 6-9 columns (responsive)
- Visual selection: Click on colored circle
- Current selection: Ring highlight
- Custom option: Hex input + color picker below grid

---

## Theming Best Practices

### 1. Semantic Color Usage

**Primary Color Usage:**
- Icons and visual accents
- Section headers
- Links and interactive elements
- Timeline/progress indicators
- Borders and dividers

**Background Color Usage:**
- Page background only
- Not used within content (stays white)

**Text Color Usage:**
- All body text
- Not for headers (those use default/bold)

### 2. Opacity for Subtlety

Templates use alpha transparency for softer applications:
- 20% opacity: Sidebar backgrounds (gengar, glalie)
- 40% opacity: Progress bar backgrounds (glalie)
- 50% opacity: Hover states (inferred from UI)

### 3. Contrast Considerations

**Primary on Background:**
When using `bg-primary`, always pair with `text-background`:
```tsx
<div className="bg-primary text-background">
  High contrast text on colored background
</div>
```

**Primary on White:**
Icons use `text-primary` on white backgrounds for accent:
```tsx
<i className="ph ph-phone text-primary" />
```

### 4. Border Current Pattern

Many templates use `border-current` (inherits text color):
```tsx
<div className="border-b">
  {/* Border color matches text color */}
</div>
```

This allows borders to automatically match section styling.

---

## CSS Variable Naming Strategy

### Documented Variables

**Theme Colors:**
- `--color-primary`: User's primary color
- `--color-background`: User's background color
- `--color-foreground`: User's text color

**Typography:**
- `--font-size`: Base font size
- `--line-height`: Line height multiplier

**Layout:**
- `--margin`: Page margin

**Tailwind System Variables (UI Only):**
- `--background`, `--foreground`: UI theme (not resume theme)
- `--primary`, `--secondary`, etc.: UI component colors
- These are separate from resume theming

### Variable Scope

All resume theme variables are applied at `:root` level:
```javascript
document.documentElement.style.setProperty(...)
```

This ensures templates can access them anywhere in the document tree.

---

## Theme Reset & Defaults

### Reset Mechanism

```typescript
// Example from layout.tsx
const onResetLayout = () => {
  const layoutCopy = JSON.parse(JSON.stringify(defaultMetadata.layout));
  // ... custom section preservation logic
  setValue("metadata.layout", layoutCopy);
};
```

### Default Theme Values

From `defaultMetadata` object:
- **Primary Color**: `#dc2626` (red-600) - Vibrant, professional
- **Background**: `#ffffff` (white) - Clean, readable
- **Text**: `#000000` (black) - Maximum contrast
- **Font**: IBM Plex Serif - Professional serif font
- **Font Size**: 14px - Readable standard
- **Line Height**: 1.5 - Comfortable spacing
- **Margin**: 18px - Balanced white space

---

## Integration Patterns for Our App

### Recommended Architecture

**1. Adopt CSS Variable Bridge:**
```javascript
// In your artboard/preview component
useEffect(() => {
  document.documentElement.style.setProperty("--theme-primary", theme.primary);
  document.documentElement.style.setProperty("--theme-bg", theme.background);
  document.documentElement.style.setProperty("--theme-text", theme.text);
}, [theme]);
```

**2. Create Tailwind Token Mapping:**
```javascript
// tailwind.config.js
colors: {
  resume: {
    primary: "var(--theme-primary)",
    background: "var(--theme-bg)",
    text: "var(--theme-text)",
  }
}
```

**3. Template Classes:**
```tsx
<div className="text-resume-primary bg-resume-background">
  Content with theme colors
</div>
```

**4. Utility Functions:**
```typescript
// Implement hexToRgb for opacity support
function hexToRgb(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
```

**5. Font Loading Strategy:**
```typescript
import webfontloader from 'webfontloader';

useEffect(() => {
  webfontloader.load({
    google: { families: [fontString] },
    active: () => {
      // Font loaded callback
    }
  });
}, [fontString]);
```

---

## Key Findings

1. **Three-Layer Architecture**: Metadata → CSS Vars → Tailwind creates flexible theming
2. **Runtime Application**: CSS variables set dynamically via JavaScript
3. **Hex Color Storage**: Colors stored as hex (#dc2626) but used flexibly
4. **Opacity via Utils**: hexToRgb() function enables alpha transparency
5. **Global Scope**: All theme variables at :root for universal access
6. **Preset + Custom**: 19 preset colors + full custom picker
7. **Font Loading**: webfontloader handles Google Fonts dynamically
8. **Class Toggling**: Typography options via data attribute classes
9. **Semantic Usage**: Primary for accents, background for page, text for content
10. **Default Values**: All settings have sensible defaults (rhyhorn template)

---

## Critical Files Reference

**Schema:**
- `/libs/schema/src/metadata/index.ts` - Authoritative metadata structure

**Theme Application:**
- `/apps/artboard/src/pages/artboard.tsx` - CSS variable injection

**Styling:**
- `/apps/artboard/src/styles/main.css` - Global utility classes
- `/tailwind.config.js` - Tailwind token configuration

**UI Controls:**
- `/apps/client/src/pages/builder/sidebars/right/sections/theme.tsx` - Color picker
- `/apps/client/src/constants/colors.ts` - Preset palette

**Templates:**
- All `/apps/artboard/src/templates/*.tsx` files use theme classes

---

**Document Version:** 1.0
**Exploration Completed:** 2025-10-07
