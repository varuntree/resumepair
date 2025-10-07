# Reactive Resume: Customization System Architecture

**Document:** RR_DESIGN_02_CUSTOMIZATION_SYSTEM.md
**Source:** /Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume
**Date:** 2025-10-07

---

## Overview

Reactive Resume implements a comprehensive real-time customization system allowing users to modify colors, typography, page settings, and layout without code. All customizations are stored in the resume metadata and applied dynamically.

---

## Customization Categories

### 1. Theme Customization (Colors)
**UI Location:** `/apps/client/src/pages/builder/sidebars/right/sections/theme.tsx`
**Schema Location:** `/libs/schema/src/metadata/index.ts` (lines 26-30)

#### Available Customizations

**Primary Color:**
- User-selectable primary color for accents, headings, icons
- Default: `#dc2626` (red-600)
- UI: Color picker + hex input + preset grid

**Background Color:**
- Resume background color
- Default: `#ffffff` (white)
- UI: Color picker + hex input

**Text Color:**
- Main text/foreground color
- Default: `#000000` (black)
- UI: Color picker + hex input

#### Implementation

**Preset Colors Grid:**
```typescript
// /apps/client/src/constants/colors.ts (lines 1-21)
colors: [
  "#475569", // slate-600
  "#dc2626", // red-600
  "#ea580c", // orange-600
  "#d97706", // amber-600
  "#ca8a04", // yellow-600
  "#65a30d", // lime-600
  "#16a34a", // green-600
  "#059669", // emerald-600
  "#0d9488", // teal-600
  "#0891b2", // cyan-600
  "#0284c7", // sky-600
  "#2563eb", // blue-600
  "#4f46e5", // indigo-600
  "#7c3aed", // violet-600
  "#9333ea", // purple-600
  "#c026d3", // fuchsia-600
  "#db2777", // pink-600
  "#e11d48", // rose-600
]
```

**Color Picker Component:**
- Library: `react-colorful` (HexColorPicker)
- Location: theme.tsx lines 42-69
- Features:
  - Popover with color picker
  - Inline swatch button
  - Text input for hex values
  - Grid of preset colors (6-9 columns responsive)

**Code Example (Primary Color):**
```typescript
// theme.tsx lines 43-69
<div className="relative">
  <Popover>
    <PopoverTrigger asChild>
      <div
        className="absolute inset-y-0 left-3 my-2.5 size-4 cursor-pointer rounded-full"
        style={{ backgroundColor: theme.primary }}
      />
    </PopoverTrigger>
    <PopoverContent className="rounded-lg border-none bg-transparent p-0">
      <HexColorPicker
        color={theme.primary}
        onChange={(color) => {
          setValue("metadata.theme.primary", color);
        }}
      />
    </PopoverContent>
  </Popover>
  <Input
    id="theme.primary"
    value={theme.primary}
    className="pl-10"
    onChange={(event) => {
      setValue("metadata.theme.primary", event.target.value);
    }}
  />
</div>
```

**Schema Definition:**
```typescript
// /libs/schema/src/metadata/index.ts lines 26-30
theme: z.object({
  background: z.string().default("#ffffff"),
  text: z.string().default("#000000"),
  primary: z.string().default("#dc2626"),
}),
```

---

### 2. Typography Customization
**UI Location:** `/apps/client/src/pages/builder/sidebars/right/sections/typography.tsx`
**Schema Location:** `/libs/schema/src/metadata/index.ts` (lines 31-41)

#### Available Customizations

**Font Family:**
- 1000+ Google Fonts available
- Combobox with search
- Preset suggestions displayed as buttons
- Local fonts: Arial, Cambria, Garamond, Times New Roman
- Popular fonts: IBM Plex Sans, IBM Plex Serif, Lato, Lora, Merriweather, etc.
- Default: `IBM Plex Serif`

**Font Subset:**
- Language-specific character sets (latin, cyrillic, etc.)
- Dynamic based on selected font
- Default: `latin`

**Font Variants:**
- Multiple weights/styles: regular, italic, 600 (bold), etc.
- Multi-select combobox
- Dynamic based on selected font
- Default: `["regular"]`

**Font Size:**
- Range: 6-18px
- Slider control with live preview
- Step: 0.05px
- Default: 14px

**Line Height:**
- Range: 0-3
- Slider control with live preview
- Step: 0.05
- Default: 1.5

**Typography Options:**
- Hide Icons (boolean toggle)
- Underline Links (boolean toggle)

#### Implementation

**Font Loading:**
```typescript
// typography.tsx lines 44-58
const loadFontSuggestions = useCallback(() => {
  for (const font of fontSuggestions) {
    if (localFonts.includes(font)) continue;

    webfontloader.load({
      events: false,
      classes: false,
      google: { families: [font], text: font },
    });
  }
}, [fontSuggestions]);
```

**Font Selector UI:**
```typescript
// typography.tsx lines 82-104
<div className="grid grid-cols-2 gap-4">
  {fontSuggestions
    .sort((a, b) => a.localeCompare(b))
    .map((font) => (
      <Button
        key={font}
        variant="outline"
        style={{ fontFamily: font }}
        disabled={typography.font.family === font}
        className={cn(
          "flex h-12 items-center justify-center overflow-hidden rounded border",
          typography.font.family === font && "ring-1",
        )}
        onClick={() => {
          setValue("metadata.typography.font.family", font);
          setValue("metadata.typography.font.subset", "latin");
          setValue("metadata.typography.font.variants", ["regular"]);
        }}
      >
        {font}
      </Button>
    ))}
</div>
```

**Slider Controls:**
```typescript
// typography.tsx lines 147-162 (Font Size Example)
<div className="space-y-1.5">
  <Label>{t`Font Size`}</Label>
  <div className="flex items-center gap-x-4 py-1">
    <Slider
      min={6}
      max={18}
      step={0.05}
      value={[typography.font.size]}
      onValueChange={(value) => {
        setValue("metadata.typography.font.size", value[0]);
      }}
    />
    <span className="text-base font-bold">{typography.font.size}</span>
  </div>
</div>
```

**Schema Definition:**
```typescript
// /libs/schema/src/metadata/index.ts lines 31-41
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

---

### 3. Page Customization
**UI Location:** `/apps/client/src/pages/builder/sidebars/right/sections/page.tsx`
**Schema Location:** `/libs/schema/src/metadata/index.ts` (lines 18-25)

#### Available Customizations

**Page Format:**
- Options: A4, Letter
- Select dropdown
- Default: `a4`

**Page Margin:**
- Range: 0-48px
- Slider control
- Step: 2px
- Default: 18px

**Page Options:**
- Show Break Line (boolean) - Visual separator between pages
- Show Page Numbers (boolean) - Page numbering
- Defaults: Both true

#### Implementation

**Format Selector:**
```typescript
// page.tsx lines 31-47
<Select
  value={page.format}
  onValueChange={(value) => {
    setValue("metadata.page.format", value);
  }}
>
  <SelectTrigger>
    <SelectValue placeholder={t`Format`} />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="a4">{t`A4`}</SelectItem>
    <SelectItem value="letter">{t`Letter`}</SelectItem>
  </SelectContent>
</Select>
```

**Margin Slider:**
```typescript
// page.tsx lines 49-63
<div className="space-y-1.5">
  <Label>{t`Margin`}</Label>
  <div className="flex items-center gap-x-4 py-1">
    <Slider
      min={0}
      max={48}
      step={2}
      value={[page.margin]}
      onValueChange={(value) => {
        setValue("metadata.page.margin", value[0]);
      }}
    />
    <span className="text-base font-bold">{page.margin}</span>
  </div>
</div>
```

**Schema Definition:**
```typescript
// /libs/schema/src/metadata/index.ts lines 18-25
page: z.object({
  margin: z.number().default(18),
  format: z.enum(["a4", "letter"]).default("a4"),
  options: z.object({
    breakLine: z.boolean().default(true),
    pageNumbers: z.boolean().default(true),
  }),
}),
```

---

### 4. Layout Customization
**UI Location:** `/apps/client/src/pages/builder/sidebars/right/sections/layout.tsx`
**Schema Location:** `/libs/schema/src/metadata/index.ts` (lines 3-13)

#### Features

**Drag-and-Drop Layout:**
- Visual page/column/section organization
- Drag sections between main and sidebar columns
- Multi-page support
- Add/remove pages
- Reset to default layout

**Layout Structure:**
```typescript
// pages -> columns -> sections
layout: [
  [  // Page 1
    ["profiles", "summary", "experience", ...],  // Main column
    ["skills", "interests", "certifications", ...], // Sidebar column
  ],
  [  // Page 2 (optional)
    [...], // Main
    [...], // Sidebar
  ]
]
```

**Default Layout:**
```typescript
// /libs/schema/src/metadata/index.ts lines 3-8
defaultLayout = [
  [
    ["profiles", "summary", "experience", "education", "projects", "volunteer", "references"],
    ["skills", "interests", "certifications", "awards", "publications", "languages"],
  ],
];
```

#### Implementation

**DnD Context:**
```typescript
// layout.tsx lines 215-262
<DndContext
  sensors={sensors}
  collisionDetection={closestCenter}
  onDragEnd={onDragEnd}
  onDragStart={onDragStart}
  onDragCancel={onDragCancel}
>
  {layout.map((page, pageIndex) => {
    const mainIndex = `${pageIndex}.0`;
    const sidebarIndex = `${pageIndex}.1`;

    return (
      <div key={pageIndex} className="rounded border p-3 pb-4">
        <div className="grid grid-cols-2 items-start gap-x-4">
          <Column id={mainIndex} name={t`Main`} items={main} />
          <Column id={sidebarIndex} name={t`Sidebar`} items={sidebar} />
        </div>
      </div>
    );
  })}
</DndContext>
```

**Add/Remove Pages:**
```typescript
// layout.tsx lines 161-177
const onAddPage = () => {
  const layoutCopy = JSON.parse(JSON.stringify(layout));
  layoutCopy.push([[], []]);
  setValue("metadata.layout", layoutCopy);
};

const onRemovePage = (page: number) => {
  const layoutCopy = JSON.parse(JSON.stringify(layout));
  layoutCopy[0][0].push(...layoutCopy[page][0]); // Main
  layoutCopy[0][1].push(...layoutCopy[page][1]); // Sidebar
  layoutCopy.splice(page, 1);
  setValue("metadata.layout", layoutCopy);
};
```

**Schema Definition:**
```typescript
// /libs/schema/src/metadata/index.ts lines 11-13
layout: z.array(z.array(z.array(z.string()))).default(defaultLayout),
```

---

### 5. Custom CSS
**Schema Location:** `/libs/schema/src/metadata/index.ts` (lines 14-17)

#### Features

**Custom CSS Injection:**
- Free-form CSS editor
- Toggle visibility
- Applied globally to resume
- Default: Outline debug CSS (disabled by default)

**Schema:**
```typescript
css: z.object({
  value: z.string().default("* {\n\toutline: 1px solid #000;\n\toutline-offset: 4px;\n}"),
  visible: z.boolean().default(false),
}),
```

**Application:**
```typescript
// /apps/artboard/src/pages/artboard.tsx lines 64-68
<Helmet>
  <title>{name} | Reactive Resume</title>
  {metadata.css.visible && (
    <style id="custom-css" lang="css">
      {metadata.css.value}
    </style>
  )}
</Helmet>
```

---

## State Management

**Store:** Zustand-based resume store
**Location:** `/apps/client/src/stores/resume`

**Key Methods:**
- `setValue(path, value)`: Update nested metadata values
- `useResumeStore((state) => state.resume.data.metadata)`: Access current values

**Example:**
```typescript
const setValue = useResumeStore((state) => state.setValue);
const theme = useResumeStore((state) => state.resume.data.metadata.theme);

// Update primary color
setValue("metadata.theme.primary", "#2563eb");
```

---

## Real-Time Preview System

### Artboard Integration
**Location:** `/apps/artboard/src/pages/artboard.tsx`

**CSS Variable Application:**
```typescript
// artboard.tsx lines 32-47
useEffect(() => {
  // Font size & line height
  document.documentElement.style.setProperty("font-size", `${metadata.typography.font.size}px`);
  document.documentElement.style.setProperty("line-height", `${metadata.typography.lineHeight}`);

  // Custom properties
  document.documentElement.style.setProperty("--margin", `${metadata.page.margin}px`);
  document.documentElement.style.setProperty("--font-size", `${metadata.typography.font.size}px`);
  document.documentElement.style.setProperty("--line-height", `${metadata.typography.lineHeight}`);

  // Theme colors
  document.documentElement.style.setProperty("--color-foreground", metadata.theme.text);
  document.documentElement.style.setProperty("--color-primary", metadata.theme.primary);
  document.documentElement.style.setProperty("--color-background", metadata.theme.background);
}, [metadata]);
```

**Typography Options:**
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

**Font Loading:**
```typescript
// artboard.tsx lines 12-30
const fontString = useMemo(() => {
  const family = metadata.typography.font.family;
  const variants = metadata.typography.font.variants.join(",");
  const subset = metadata.typography.font.subset;
  return `${family}:${variants}:${subset}`;
}, [metadata.typography.font]);

useEffect(() => {
  webfontloader.load({
    google: { families: [fontString] },
    active: () => {
      const width = window.document.body.offsetWidth;
      const height = window.document.body.offsetHeight;
      const message = { type: "PAGE_LOADED", payload: { width, height } };
      window.postMessage(message, "*");
    },
  });
}, [fontString]);
```

---

## CSS Architecture

### Global Styles
**Location:** `/apps/artboard/src/styles/main.css`

```css
/* Typography option classes */
[data-page].hide-icons .ph {
  @apply hidden;
}

[data-page].underline-links a {
  @apply underline underline-offset-2;
}

/* WYSIWYG content styling */
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

### Tailwind Color System
**Location:** `/tailwind.config.js`

```javascript
// Color tokens tied to CSS variables
colors: {
  background: "hsl(var(--background))",
  foreground: "hsl(var(--foreground))",
  primary: {
    DEFAULT: "hsl(var(--primary))",
    accent: "hsl(var(--primary-accent))",
    foreground: "hsl(var(--primary-foreground))",
  },
  // ... more colors
}
```

**Template Usage:**
```tsx
// Templates use Tailwind classes
<div className="bg-primary text-background">
  <i className="ph ph-phone text-primary" />
</div>
```

---

## Design Token Flow

### 1. User Input → State
User changes color → `setValue("metadata.theme.primary", color)` → Zustand store updated

### 2. State → CSS Variables
Artboard useEffect detects change → Sets `--color-primary` CSS variable

### 3. CSS Variables → Tailwind Classes
Tailwind config maps `text-primary` → `hsl(var(--primary))` → User's color value

### 4. Tailwind → Templates
Templates use `text-primary`, `bg-primary`, etc. → Applies user's chosen color

---

## Utility Functions

### Color Manipulation

**hexToRgb Function:**
```typescript
// Converts hex to rgba with opacity
hexToRgb(primaryColor, 0.2) // 20% opacity
```

**Usage in Templates:**
```typescript
// gengar.tsx line 89
style={{ backgroundColor: hexToRgb(primaryColor, 0.2) }}

// glalie.tsx line 116
style={{ backgroundColor: hexToRgb(primaryColor, 0.4) }}
```

### Rating Transforms

**linearTransform Function:**
```typescript
// Maps value from one range to another
linearTransform(level, 0, 5, 0, 128) // Map 0-5 to 0-128px
linearTransform(level, 0, 5, 0, 100) // Map 0-5 to 0-100%
```

**Usage:**
```typescript
// azurill.tsx line 117
style={{ width: linearTransform(level, 0, 5, 0, 128) }}

// glalie.tsx line 120
style={{ width: `${linearTransform(level, 0, 5, 0, 100)}%` }}
```

---

## Best Practices Extracted

### 1. Incremental Updates
All customization inputs trigger immediate updates via `setValue()`, providing instant feedback

### 2. Preset + Custom Options
Color picker combines quick presets (19 colors) with full customization (hex input + picker)

### 3. Responsive Sliders
Sliders show current value alongside control for better UX

### 4. Font Previews
Font buttons render in their actual font family for visual selection

### 5. Scoped Styling
Typography options use data attributes (`[data-page].hide-icons`) for clean toggling

### 6. CSS Variable Bridge
Metadata values → CSS variables → Tailwind tokens creates flexible theming layer

### 7. Default Values
Every customization has sensible defaults in schema (IBM Plex Serif, 14px, red-600, etc.)

---

## Key Findings

1. **Centralized Metadata**: All customizations stored in single `metadata` object
2. **Real-Time Preview**: CSS variable updates trigger immediate visual changes
3. **Type Safety**: Zod schema validates all customization values
4. **Flexible Color System**: Hex colors convert to HSL/RGBA as needed
5. **Font Flexibility**: 1000+ fonts with variants and subsets
6. **Layout Power**: Drag-and-drop provides visual layout customization
7. **Progressive Disclosure**: Basic options visible, advanced (custom CSS) hidden by default
8. **Consistent UI**: All customization panels follow same pattern (header, controls, live preview)

---

## Integration Patterns for Our App

### Recommended Approach:
1. **Adopt Metadata Schema**: Use similar structure for design customizations
2. **CSS Variable Strategy**: Apply theme values via CSS custom properties
3. **Component-Based Controls**: Reuse slider, color picker, font selector patterns
4. **Real-Time Updates**: Implement live preview via CSS variable updates
5. **Default Templates**: Provide sensible defaults like IBM Plex Serif, 14px
6. **Preset Colors**: Offer curated color palette + custom picker
7. **Progressive Options**: Show basic customizations first, hide advanced

### Critical Files to Study:
- `metadata/index.ts`: Schema definition (authoritative source)
- `theme.tsx`: Color picker implementation
- `typography.tsx`: Font selection UI
- `artboard.tsx`: CSS variable application
- `main.css`: Global styles and utility classes

---

**Document Version:** 1.0
**Exploration Completed:** 2025-10-07
