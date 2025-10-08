# Reactive Resume - Customization System Documentation

**Source**: `/Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume/`

## Table of Contents
1. [Overview](#overview)
2. [UI Structure](#ui-structure)
3. [Customization Options](#customization-options)
4. [State Management](#state-management)
5. [Data Schema](#data-schema)
6. [Template Application](#template-application)
7. [Live Preview Integration](#live-preview-integration)
8. [Code Architecture](#code-architecture)
9. [Key Implementation Patterns](#key-implementation-patterns)

---

## Overview

Reactive Resume implements a comprehensive customization system that allows users to modify:
- **Colors**: Primary, background, and text colors
- **Typography**: Font family, size, line height, and styling options
- **Layout**: Page margins, section ordering, multi-page layouts
- **Page Settings**: Format (A4/Letter), margins, page numbers
- **Custom CSS**: Advanced styling with custom CSS

**Architecture**: The system uses a **dual-app architecture**:
- **Client App** (`apps/client`): Builder UI with customization panels
- **Artboard App** (`apps/artboard`): Isolated rendering engine in an iframe

**Communication**: PostMessage API for real-time updates between client and artboard.

---

## UI Structure

### Right Sidebar Organization
**Location**: `apps/client/src/pages/builder/sidebars/right/index.tsx`

The customization UI is organized as a **vertical scrolling sidebar** with sections:

```tsx
// Section order (lines 33-53)
<TemplateSection />      // Template selection
<LayoutSection />        // Drag-and-drop section ordering
<TypographySection />    // Font controls
<ThemeSection />         // Color customization
<CssSection />           // Custom CSS editor
<PageSection />          // Page format & margins
<SharingSection />       // Visibility settings
<StatisticsSection />    // Resume stats
<ExportSection />        // PDF export
<NotesSection />         // Personal notes
<InformationSection />   // Metadata
```

**Navigation**: Icon-based quick scroll menu on the right edge (lines 59-143).

---

## Customization Options

### 1. Color System

**Location**: `apps/client/src/pages/builder/sidebars/right/sections/theme.tsx`

#### Available Colors
- **Primary Color**: Used for headings, icons, accents
- **Background Color**: Page background
- **Text Color**: Main text color

#### Color Selection Methods
1. **Preset Palette** (lines 25-40):
   ```tsx
   // 19 preset colors from Tailwind color palette
   const colors = [
     "#475569", // slate-600
     "#dc2626", // red-600
     "#2563eb", // blue-600
     // ... 16 more colors
   ];
   ```

2. **Color Picker** (lines 45-59, 75-89, 105-119):
   - Uses `react-colorful` library
   - HexColorPicker component for custom colors
   - Popover UI pattern

3. **Text Input** (lines 61-68):
   - Direct hex code input
   - Real-time validation

#### Storage
Colors stored in `metadata.theme`:
```typescript
theme: {
  background: "#ffffff",
  text: "#000000",
  primary: "#dc2626"
}
```

---

### 2. Typography System

**Location**: `apps/client/src/pages/builder/sidebars/right/sections/typography.tsx`

#### Font Family Selection

**Suggested Fonts** (lines 14-28):
```typescript
const localFonts = ["Arial", "Cambria", "Garamond", "Times New Roman"];
const fontSuggestions = [
  ...localFonts,
  "IBM Plex Sans", "IBM Plex Serif", "Lato", "Lora",
  "Merriweather", "Open Sans", "Playfair Display",
  "PT Sans", "PT Serif", "Roboto Condensed"
];
```

**Full Font Library** (lines 30-33):
- Sourced from `@reactive-resume/utils/fonts`
- 1000+ Google Fonts available via combobox
- Local system fonts included

**Font Loading** (lines 44-58):
- Uses `webfontloader` library
- Preloads suggested fonts on mount
- Lazy loads selected fonts on demand

#### Font Configuration

**Font Subsets** (lines 121-131):
- Dynamic based on selected font family
- Options: latin, latin-ext, cyrillic, etc.

**Font Variants** (lines 133-144):
- Multi-select combobox
- Options: regular, italic, 600, 700, etc.
- Multiple weights can be selected

**Font Size** (lines 147-162):
- Slider control: 6-18px
- Step: 0.05px
- Default: 14px

**Line Height** (lines 164-179):
- Slider control: 0-3
- Step: 0.05
- Default: 1.5

#### Typography Options

**Hide Icons** (lines 182-193):
- Toggle to hide all Phosphor icons
- Applied via CSS class

**Underline Links** (lines 195-204):
- Toggle to underline hyperlinks
- Applied via CSS class

#### Storage
```typescript
typography: {
  font: {
    family: "IBM Plex Serif",
    subset: "latin",
    variants: ["regular", "italic", "600"],
    size: 14
  },
  lineHeight: 1.5,
  hideIcons: false,
  underlineLinks: true
}
```

---

### 3. Layout System

**Location**: `apps/client/src/pages/builder/sidebars/right/sections/layout.tsx`

#### Multi-Page, Multi-Column Layout

**Structure**:
```typescript
layout: [  // Array of pages
  [        // Page 0
    ["profiles", "summary", "experience", "education"],  // Column 0 (main)
    ["skills", "interests", "certifications"]            // Column 1 (sidebar)
  ],
  [        // Page 1 (if added)
    ["projects", "volunteer"],  // Column 0
    ["languages", "references"] // Column 1
  ]
]
```

#### Drag-and-Drop Implementation

**Library**: `@dnd-kit/core` and `@dnd-kit/sortable` (lines 1-18)

**Features**:
- Drag sections between columns and pages
- Visual feedback with DragOverlay (lines 259-261)
- Keyboard navigation support (lines 115-121)

**Event Handlers**:
- `onDragStart` (lines 123-125): Track active item
- `onDragEvent` (lines 131-154): Handle drop logic
- `onDragEnd` (lines 156-159): Update state

#### Page Management

**Add Page** (lines 161-167):
```typescript
const onAddPage = () => {
  layoutCopy.push([[], []]);  // Add empty page with 2 columns
  setValue("metadata.layout", layoutCopy);
};
```

**Remove Page** (lines 169-178):
- Moves sections from deleted page to first page
- Cannot delete first page

**Reset Layout** (lines 180-196):
- Restores default layout
- Preserves custom sections

---

### 4. Page Settings

**Location**: `apps/client/src/pages/builder/sidebars/right/sections/page.tsx`

#### Page Format (lines 31-47)
- **Options**: A4, Letter
- **Select dropdown** component

#### Page Margin (lines 49-64)
- **Range**: 0-48px
- **Step**: 2px
- **Slider** control with numeric display

#### Page Options

**Show Break Line** (lines 69-80):
- Visual indicator between pages in builder
- Toggle switch

**Show Page Numbers** (lines 82-93):
- Display "Page N" label in builder
- Toggle switch

#### Storage
```typescript
page: {
  margin: 18,
  format: "a4",
  options: {
    breakLine: true,
    pageNumbers: true
  }
}
```

---

### 5. Custom CSS

**Location**: `apps/client/src/pages/builder/sidebars/right/sections/css.tsx`

#### CSS Editor (lines 44-54)
- **Library**: `react-simple-code-editor`
- **Syntax Highlighting**: Prism.js
- **Theme-aware**: Light/dark mode support (lines 20-23)

#### Enable/Disable Toggle (lines 33-42)
```typescript
css: {
  value: "* {\n\toutline: 1px solid #000;\n\toutline-offset: 4px;\n}",
  visible: false  // Enable/disable custom CSS
}
```

#### Application
Custom CSS injected via React Helmet (artboard):
```tsx
{metadata.css.visible && (
  <style id="custom-css" lang="css">
    {metadata.css.value}
  </style>
)}
```

---

### 6. Template Selection

**Location**: `apps/client/src/pages/builder/sidebars/right/sections/template.tsx`

#### Available Templates
**Source**: `libs/utils/src/namespaces/template.ts`
```typescript
const templatesList = [
  "azurill", "bronzor", "chikorita", "ditto",
  "gengar", "glalie", "kakuna", "leafish",
  "nosepass", "onyx", "pikachu", "rhyhorn"
];
```

#### Template Gallery (lines 23-47)
- **Grid Layout**: 2-4 columns (responsive)
- **Preview Images**: `/templates/jpg/{template}.jpg`
- **Animation**: Staggered fade-in with Framer Motion
- **Selection**: Click to select, visual ring indicator

---

## State Management

### Zustand Store Architecture

**Location**: `apps/client/src/stores/resume.ts`

#### Store Structure (lines 17-26)
```typescript
type ResumeStore = {
  resume: ResumeDto;
  setValue: (path: string, value: unknown) => void;
  addSection: () => void;
  removeSection: (sectionId: SectionKey) => void;
};
```

#### Key Features

**Immer Middleware** (line 30):
- Immutable state updates with mutable syntax
- Simplifies nested object updates

**Temporal Middleware** (lines 29, 73-78):
- **Library**: `zundo`
- **Undo/Redo Support**: 100 levels
- **Devtools Integration**: Redux DevTools compatible

**Lodash Set** (line 37):
- Deep path-based updates: `_set(state.resume.data, path, value)`
- Example: `setValue("metadata.theme.primary", "#dc2626")`

#### Update Flow (lines 32-42)
```typescript
setValue: (path, value) => {
  set((state) => {
    if (path === "visibility") {
      state.resume.visibility = value;
    } else {
      state.resume.data = _set(state.resume.data, path, value);
    }
    void debouncedUpdateResume(JSON.parse(JSON.stringify(state.resume)));
  });
}
```

**Debounced Backend Sync** (line 40):
- 500ms debounce (from `services/resume/update.tsx:28`)
- Automatic API updates on every change
- Deep clone to prevent mutation during async operation

---

## Data Schema

**Location**: `libs/schema/src/metadata/index.ts`

### Complete Metadata Schema

```typescript
export const metadataSchema = z.object({
  template: z.string().default("rhyhorn"),

  layout: z.array(z.array(z.array(z.string()))).default(defaultLayout),
  // pages -> columns -> sections

  css: z.object({
    value: z.string().default("* {\n\toutline: 1px solid #000;\n\toutline-offset: 4px;\n}"),
    visible: z.boolean().default(false),
  }),

  page: z.object({
    margin: z.number().default(18),
    format: z.enum(["a4", "letter"]).default("a4"),
    options: z.object({
      breakLine: z.boolean().default(true),
      pageNumbers: z.boolean().default(true),
    }),
  }),

  theme: z.object({
    background: z.string().default("#ffffff"),
    text: z.string().default("#000000"),
    primary: z.string().default("#dc2626"),
  }),

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

  notes: z.string().default(""),
});
```

### Default Layout
```typescript
const defaultLayout = [
  [
    ["profiles", "summary", "experience", "education", "projects", "volunteer", "references"],
    ["skills", "interests", "certifications", "awards", "publications", "languages"],
  ],
];
```

---

## Template Application

### **CRITICAL: CSS Variables Pattern**

**Location**: `apps/artboard/src/pages/artboard.tsx` (lines 32-47)

#### How Customizations Apply to Templates

**1. CSS Custom Properties Injection**

All customization values are injected as CSS variables on `document.documentElement`:

```typescript
useEffect(() => {
  // Font settings
  document.documentElement.style.setProperty("font-size", `${metadata.typography.font.size}px`);
  document.documentElement.style.setProperty("line-height", `${metadata.typography.lineHeight}`);

  // Spacing
  document.documentElement.style.setProperty("--margin", `${metadata.page.margin}px`);

  // Typography variables
  document.documentElement.style.setProperty("--font-size", `${metadata.typography.font.size}px`);
  document.documentElement.style.setProperty("--line-height", `${metadata.typography.lineHeight}`);

  // Theme colors
  document.documentElement.style.setProperty("--color-foreground", metadata.theme.text);
  document.documentElement.style.setProperty("--color-primary", metadata.theme.primary);
  document.documentElement.style.setProperty("--color-background", metadata.theme.background);
}, [metadata]);
```

**2. Tailwind CSS Configuration**

**Location**: `apps/artboard/tailwind.config.js` (lines 13-25)

Tailwind references these CSS variables:

```javascript
theme: {
  extend: {
    colors: {
      foreground: "var(--color-foreground)",  // Text color
      primary: "var(--color-primary)",        // Accent color
      background: "var(--color-background)",  // Background color
    },
    lineHeight: {
      tight: "calc(var(--line-height) - 0.5)",
      snug: "calc(var(--line-height) - 0.3)",
      normal: "var(--line-height)",
      relaxed: "calc(var(--line-height) + 0.3)",
      loose: "calc(var(--line-height) + 0.5)",
    },
    spacing: {
      custom: "var(--margin)"  // Page margins
    },
  }
}
```

**3. Template Usage**

Templates use Tailwind utility classes that reference these variables:

```tsx
// Example from rhyhorn.tsx (line 42)
<i className="ph ph-bold ph-map-pin text-primary" />
// text-primary -> var(--color-primary)

// Background color (line 23)
<div className="relative bg-background text-foreground">
// bg-background -> var(--color-background)
// text-foreground -> var(--color-foreground)

// Custom margin (line 570)
<div className="p-custom space-y-4">
// p-custom -> padding: var(--margin)
```

**4. Font Family Application**

**Location**: `apps/artboard/src/components/page.tsx` (lines 18, 24-25)

```typescript
const fontFamily = useArtboardStore((state) => state.resume.metadata.typography.font.family);

<div style={{ fontFamily }} className="...">
  {children}
</div>
```

**5. Font Loading**

**Location**: `apps/artboard/src/pages/artboard.tsx` (lines 12-30)

```typescript
const fontString = useMemo(() => {
  const family = metadata.typography.font.family;
  const variants = metadata.typography.font.variants.join(",");
  const subset = metadata.typography.font.subset;
  return `${family}:${variants}:${subset}`;
}, [metadata.typography.font]);

useEffect(() => {
  webfontloader.load({
    google: { families: [fontString] }
  });
}, [fontString]);
```

**6. Typography Options**

**Location**: `apps/artboard/src/pages/artboard.tsx` (lines 49-58)

```typescript
useEffect(() => {
  const elements = Array.from(document.querySelectorAll(`[data-page]`));

  for (const el of elements) {
    el.classList.toggle("hide-icons", metadata.typography.hideIcons);
    el.classList.toggle("underline-links", metadata.typography.underlineLinks);
  }
}, [metadata]);
```

**Corresponding CSS** (`apps/artboard/src/styles/main.css`):
```css
[data-page].hide-icons .ph {
  @apply hidden;
}

[data-page].underline-links a {
  @apply underline underline-offset-2;
}
```

**7. Advanced Color Usage**

Some templates use programmatic color manipulation:

**Location**: `apps/artboard/src/templates/gengar.tsx` (lines 84, 89)

```typescript
const primaryColor = useArtboardStore((state) => state.resume.metadata.theme.primary);

<div style={{ backgroundColor: hexToRgb(primaryColor, 0.2) }}>
  {/* Tinted background at 20% opacity */}
</div>
```

**Utility Function** (`libs/utils/src/namespaces/color.ts`):
```typescript
export const hexToRgb = (hex: string, alpha = 0) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  return alpha ? `rgba(${r}, ${g}, ${b}, ${alpha})` : `rgb(${r}, ${g}, ${b})`;
};
```

---

## Live Preview Integration

### PostMessage Communication

**Location**: `apps/client/src/pages/builder/page.tsx`

#### Client → Artboard Data Flow

**Initial Load** (lines 29-37):
```typescript
useEffect(() => {
  if (!frameRef) return;

  frameRef.addEventListener("load", syncResumeToArtboard);

  return () => {
    frameRef.removeEventListener("load", syncResumeToArtboard);
  };
}, [frameRef]);
```

**On Data Change** (line 54):
```typescript
useEffect(syncResumeToArtboard, [resume.data]);
```

**Sync Function** (lines 20-26):
```typescript
const syncResumeToArtboard = useCallback(() => {
  setImmediate(() => {
    if (!frameRef?.contentWindow) return;
    const message = { type: "SET_RESUME", payload: resume.data };
    frameRef.contentWindow.postMessage(message, "*");
  });
}, [frameRef?.contentWindow, resume.data]);
```

#### Artboard Listener

**Location**: `apps/artboard/src/providers/index.tsx` (lines 12-23)

```typescript
useEffect(() => {
  const handleMessage = (event: MessageEvent) => {
    if (event.origin !== window.location.origin) return;
    if (event.data.type === "SET_RESUME") setResume(event.data.payload);
  };

  window.addEventListener("message", handleMessage, false);

  return () => {
    window.removeEventListener("message", handleMessage, false);
  };
}, []);
```

### Debouncing Strategy

**No Debouncing in UI → Artboard**:
- Updates are immediate (setImmediate)
- Zustand already handles re-render optimization

**Debouncing in UI → Backend**:
- 500ms debounce on API calls
- Prevents excessive server requests

**Location**: `apps/client/src/services/resume/update.tsx` (line 28)
```typescript
export const debouncedUpdateResume = debounce(updateResume, 500);
```

### Performance Optimizations

1. **Immer Structural Sharing**: Only re-renders affected components
2. **CSS Variable Updates**: No component re-renders, just style recalculation
3. **Font Loading**: Cached by browser, only loads once per font
4. **PostMessage**: Asynchronous, non-blocking communication

---

## Code Architecture

### Separation of Concerns

**1. UI Layer** (`apps/client/src/pages/builder/sidebars/right/sections/`)
- Individual section components
- Form controls and interactions
- No business logic

**2. State Layer** (`apps/client/src/stores/resume.ts`)
- Single source of truth
- Zustand store with temporal middleware
- Automatic backend sync

**3. Service Layer** (`apps/client/src/services/resume/`)
- API communication
- Data transformation
- Debounced updates

**4. Rendering Layer** (`apps/artboard/`)
- Isolated iframe environment
- Template components
- CSS variable application

**5. Schema Layer** (`libs/schema/src/`)
- Zod validation
- Type generation
- Default values

**6. Utilities Layer** (`libs/utils/src/`)
- Pure functions
- Color manipulation
- Font lists
- Layout helpers

### Reusable Components

**Location**: `@reactive-resume/ui` (Shadcn-based component library)

Used throughout customization UI:
- `Input`: Text inputs with validation
- `Label`: Accessible form labels
- `Slider`: Range controls
- `Switch`: Toggle switches
- `Select`: Dropdown selects
- `Combobox`: Searchable select with multi-select support
- `Popover`: Color picker container
- `Button`: Action buttons
- `Separator`: Visual section dividers

### Type Safety

**End-to-End Type Safety**:

1. **Schema Definition** (Zod):
   ```typescript
   export const metadataSchema = z.object({...});
   export type Metadata = z.infer<typeof metadataSchema>;
   ```

2. **Store Types**:
   ```typescript
   type ResumeStore = {
     resume: ResumeDto;  // Generated from schema
     setValue: (path: string, value: unknown) => void;
   };
   ```

3. **Component Props**:
   ```typescript
   const theme = useResumeStore((state) => state.resume.data.metadata.theme);
   // theme is typed as { background: string; text: string; primary: string; }
   ```

4. **API Types** (DTO):
   - `@reactive-resume/dto` package
   - Shared between client and server
   - Generated from Zod schemas

### Validation

**Zod Schema Validation**:
- All metadata validated on parse
- Default values provided
- Type coercion for numbers/booleans

**Example**: If user enters invalid color, Zod defaults to `#dc2626`.

---

## Key Implementation Patterns

### 1. Path-Based Updates

**Pattern**: Use dot notation paths for nested updates

```typescript
setValue("metadata.theme.primary", "#dc2626");
setValue("metadata.typography.font.size", 16);
setValue("metadata.page.format", "letter");
```

**Benefits**:
- Simple API for deeply nested objects
- No need to spread entire object tree
- Works seamlessly with Lodash `set` and Immer

### 2. CSS Variables for Theming

**Pattern**: Inject theme values as CSS custom properties

```typescript
document.documentElement.style.setProperty("--color-primary", color);
```

**Benefits**:
- No component re-renders on theme change
- Works with Tailwind utility classes
- Can be overridden with custom CSS
- Supports CSS calculations

### 3. Iframe Isolation

**Pattern**: Render preview in separate iframe app

**Benefits**:
- Style isolation (no CSS conflicts)
- Security (sandboxed execution)
- Independent font loading
- Can apply custom CSS without affecting builder UI

### 4. Zustand Temporal Middleware

**Pattern**: Wrap store with temporal middleware

```typescript
export const useResumeStore = create<ResumeStore>()(
  temporal(
    immer((set) => ({...})),
    { limit: 100, ... }
  )
);
```

**Benefits**:
- Built-in undo/redo
- Time-travel debugging
- DevTools integration
- Minimal boilerplate

### 5. Debounced Backend Sync

**Pattern**: Optimistic UI with debounced persistence

```typescript
setValue: (path, value) => {
  set((state) => {
    // Update UI immediately (optimistic)
    state.resume.data = _set(state.resume.data, path, value);

    // Persist to backend (debounced)
    void debouncedUpdateResume(state.resume);
  });
}
```

**Benefits**:
- Instant UI feedback
- Reduced server load
- Handles rapid changes gracefully

### 6. Combobox Pattern for Large Lists

**Pattern**: Use searchable combobox for 1000+ font options

```typescript
<Combobox
  options={families.sort((a, b) => a.label.localeCompare(b.label))}
  value={typography.font.family}
  searchPlaceholder={t`Search for a font family`}
  onValueChange={(value) => setValue("metadata.typography.font.family", value)}
/>
```

**Benefits**:
- Better UX than long dropdown
- Supports keyboard navigation
- Built-in search
- Multi-select support

### 7. Preset Quick Actions

**Pattern**: Show preset options as clickable grid

```typescript
{fontSuggestions.map((font) => (
  <Button
    key={font}
    variant="outline"
    style={{ fontFamily: font }}
    className={currentFont === font && "ring-1"}
    onClick={() => setValue("metadata.typography.font.family", font)}
  >
    {font}
  </Button>
))}
```

**Benefits**:
- Visual preview of presets
- Quick access to common choices
- Still supports custom values via combobox

### 8. Drag-and-Drop Layout

**Pattern**: Use dnd-kit for layout customization

**Benefits**:
- Accessible (keyboard support)
- Performant (CSS transforms)
- Flexible (supports nested containers)
- Mobile-friendly (touch events)

---

## Libraries & Dependencies

### Client App
- **State Management**: `zustand` + `zundo` (temporal)
- **Form Controls**: Shadcn UI components
- **Color Picker**: `react-colorful`
- **Code Editor**: `react-simple-code-editor` + `prismjs`
- **Drag & Drop**: `@dnd-kit/core`, `@dnd-kit/sortable`
- **Animation**: `framer-motion`
- **Path Updates**: `lodash.set`
- **Validation**: `zod`
- **API**: `@tanstack/react-query`, `axios`

### Artboard App
- **Font Loading**: `webfontloader`
- **Styling**: TailwindCSS + CSS variables
- **State**: `zustand` (minimal artboard store)
- **Type Safety**: `@reactive-resume/schema`
- **Utilities**: `@reactive-resume/utils`

---

## Reset/Default Functionality

### Theme Reset
No explicit reset button in theme section. Users can:
1. Select preset color from palette
2. Manually enter default hex code

### Layout Reset
**Location**: `apps/client/src/pages/builder/sidebars/right/sections/layout.tsx` (lines 180-196)

```typescript
const onResetLayout = () => {
  const layoutCopy = JSON.parse(JSON.stringify(defaultMetadata.layout));

  // Preserve custom sections
  const customSections: string[] = [];
  for (const page of layout) {
    for (const column of page) {
      customSections.push(...column.filter((section) => section.startsWith("custom.")));
    }
  }

  if (customSections.length > 0) layoutCopy[0][0].push(...customSections);

  setValue("metadata.layout", layoutCopy);
};
```

**Features**:
- Resets to default 2-column layout
- Preserves user-created custom sections
- Triggered by header button with undo icon

### Global Reset
Not implemented in customization panels. Could be added by:
```typescript
setValue("metadata", defaultMetadata);
```

---

## Summary: Adoption Recommendations

### **Must-Have Patterns**
1. **CSS Variables for Theming**: Cleanest way to apply colors/fonts without re-renders
2. **Path-Based State Updates**: Simplifies nested object manipulation
3. **Debounced Backend Sync**: Essential for performance with frequent changes
4. **Iframe Isolation**: Critical for style isolation and custom CSS safety

### **Nice-to-Have Patterns**
1. **Preset Quick Actions**: Improves UX for common customizations
2. **Drag-and-Drop Layout**: Great for advanced users, but could start with simpler approach
3. **Temporal Middleware**: Undo/redo is powerful but adds complexity

### **Key Learnings**
1. **Separation of Concerns**: Clear boundaries between UI, state, services, rendering
2. **Type Safety**: End-to-end types prevent runtime errors
3. **Progressive Enhancement**: Start with basic customization, add advanced features incrementally
4. **Performance First**: Use CSS variables, debouncing, and structural sharing to minimize re-renders

---

**Document Version**: 1.0
**Last Updated**: 2025-10-08
**Source Commit**: 5723548 (yep)
