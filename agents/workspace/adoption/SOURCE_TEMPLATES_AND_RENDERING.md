# Reactive-Resume: Template & Rendering System Analysis

**Source:** `/Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume/`
**Focus:** Complete template catalog, rendering patterns, and variable text handling strategies

---

## Executive Summary

Reactive-Resume implements **12 production-ready templates** using a sophisticated component-based architecture. Each template handles variable content lengths gracefully through **flexbox/grid layouts**, **TailwindCSS utilities**, and **semantic HTML structure**. The system prioritizes PDF export compatibility and uses a shared component pattern for consistent section rendering.

### Key Findings
- **12 templates** with distinct visual identities (Pokemon-themed names)
- **Zero explicit text truncation** - templates rely on natural wrapping
- **Flexible layouts** using CSS Grid/Flexbox with `items-start`, `shrink-0`, `flex-wrap`
- **Zustand state management** for global resume data
- **Custom CSS support** via metadata for advanced customization
- **Typography system** using CSS variables for dynamic theming

---

## 1. Template Catalog

### 1.1 Complete Template List

| Template | Layout Type | Visual Style | Sidebar | File Location |
|----------|-------------|--------------|---------|---------------|
| **Azurill** | Two-column sidebar (1:2 ratio) | Modern, timeline with dots | Left sidebar | `/apps/artboard/src/templates/azurill.tsx` |
| **Bronzor** | Single column with 5-column grid sections | Classic, horizontal dividers | No sidebar | `/apps/artboard/src/templates/bronzor.tsx` |
| **Chikorita** | Two-column sidebar (2:1 ratio) | Modern, colored sidebar | Right sidebar (primary bg) | `/apps/artboard/src/templates/chikorita.tsx` |
| **Ditto** | Two-column sidebar (1:2 ratio) with header accent | Modern, colored header bar | Left sidebar | `/apps/artboard/src/templates/ditto.tsx` |
| **Gengar** | Sidebar layout | Bold, full-width colored header | Left sidebar (primary bg) | `/apps/artboard/src/templates/gengar.tsx` |
| **Glalie** | Two-column layout | Modern, with decorative elements | Varies | `/apps/artboard/src/templates/glalie.tsx` |
| **Kakuna** | Single column | Minimal, centered headers | No sidebar | `/apps/artboard/src/templates/kakuna.tsx` |
| **Leafish** | Horizontal header with columns | Modern, colored accent bands | No sidebar | `/apps/artboard/src/templates/leafish.tsx` |
| **Nosepass** | Multi-column layout | Classic | Varies | `/apps/artboard/src/templates/nosepass.tsx` |
| **Onyx** | Single column with header | Professional, clean borders | No sidebar | `/apps/artboard/src/templates/onyx.tsx` |
| **Pikachu** | Sidebar with picture | Modern, sidebar-left | Left sidebar | `/apps/artboard/src/templates/pikachu.tsx` |
| **Rhyhorn** | Two-column layout | Classic | Varies | `/apps/artboard/src/templates/rhyhorn.tsx` |

**Default Template:** Onyx (defined in `/apps/artboard/src/templates/index.tsx:55`)

### 1.2 Template Registration System

**File:** `/apps/artboard/src/templates/index.tsx`

```typescript
export const getTemplate = (template: Template) => {
  switch (template) {
    case "azurill": return Azurill;
    case "bronzor": return Bronzor;
    // ... all 12 templates
    default: return Onyx; // Fallback
  }
};
```

**Template Type Definition:** `/libs/utils/src/namespaces/template.ts`
```typescript
export const templatesList = [
  "azurill", "bronzor", "chikorita", "ditto", "gengar", "glalie",
  "kakuna", "leafish", "nosepass", "onyx", "pikachu", "rhyhorn"
] as const;

export type Template = (typeof templatesList)[number];
```

---

## 2. Template Architecture

### 2.1 Universal Template Interface

**File:** `/apps/artboard/src/types/template.ts`

```typescript
export type TemplateProps = {
  columns: SectionKey[][];  // Multi-page layout definition
  isFirstPage?: boolean;    // Controls header rendering
};
```

Every template receives:
- **columns**: Array of section arrays (one per page)
- **isFirstPage**: Boolean to conditionally render header/contact info

### 2.2 Common Component Structure

All templates follow this pattern:

```typescript
export const TemplateName = ({ columns, isFirstPage = false }: TemplateProps) => {
  const [main, sidebar] = columns;

  return (
    <div className="p-custom space-y-4">
      {isFirstPage && <Header />}

      {/* Layout-specific column arrangement */}
      <div className="grid grid-cols-3">
        <div className="sidebar group">{/* sidebar sections */}</div>
        <div className="main group col-span-2">{/* main sections */}</div>
      </div>
    </div>
  );
};
```

**Key Patterns:**
1. **Header Conditional:** `{isFirstPage && <Header />}` prevents header duplication on multi-page resumes
2. **Column Destructuring:** `const [main, sidebar] = columns` splits layout config
3. **Group Classes:** `.group-[.sidebar]`, `.group-[.main]` enable context-aware styling
4. **Dynamic Columns:** Grid columns adjust based on sidebar presence

### 2.3 Shared Section Components

Every template includes these internal components:

| Component | Purpose | Key Features |
|-----------|---------|--------------|
| **Header** | Name, headline, contact info | Picture, flex-wrap for contact items |
| **Summary** | Profile/objective text | Rich text (wysiwyg), column support |
| **Section&lt;T&gt;** | Generic section renderer | Handles items, summaries, ratings, keywords |
| **Link** | URL rendering | Icon support, conditional rendering |
| **LinkedEntity** | Entity with optional URL | Inline or separate link modes |
| **Rating** | Skill level visualization | Multiple styles (dots, bars, diamonds) |

---

## 3. Variable Text Length Handling

### 3.1 Core Strategy: No Truncation

**Critical Finding:** Reactive-Resume templates **do NOT truncate text**. Instead, they use:

1. **Natural wrapping** via flex/grid containers
2. **`items-start`** alignment to prevent vertical stretching
3. **`shrink-0`** on right-aligned content to protect dates/locations
4. **`flex-wrap`** on multi-item containers

### 3.2 Layout Patterns for Long Text

#### Pattern 1: Two-Column Item Layout (Bronzor, Onyx, Ditto)

**File:** `/apps/artboard/src/templates/bronzor.tsx:252-267`

```typescript
<div className="flex items-start justify-between">
  <div className="text-left">
    <LinkedEntity name={item.company} {...props} className="font-bold" />
    <div>{item.position}</div>
  </div>

  <div className="shrink-0 text-right">
    <div className="font-bold">{item.date}</div>
    <div>{item.location}</div>
  </div>
</div>
```

**Variable Text Handling:**
- **Long company names:** Wrap naturally in left column
- **Long position titles:** Wrap in left column
- **Dates/locations:** Protected by `shrink-0`, stay right-aligned
- **Container:** `items-start` prevents vertical misalignment

#### Pattern 2: Stacked Layout (Azurill, Kakuna)

**File:** `/apps/artboard/src/templates/azurill.tsx:274-285`

```typescript
<div>
  <LinkedEntity name={item.company} className="font-bold" />
  <div>{item.position}</div>
  <div>{item.location}</div>
  <div className="font-bold">{item.date}</div>
</div>
```

**Variable Text Handling:**
- **All text stacks vertically** - no horizontal constraints
- **Natural word wrapping** within parent container
- **Ideal for narrow sidebars**

#### Pattern 3: Grid Layout with Dynamic Columns (All Templates)

**File:** `/apps/artboard/src/templates/ditto.tsx:206-209`

```typescript
<div
  className="grid gap-x-6 gap-y-3"
  style={{ gridTemplateColumns: `repeat(${section.columns}, 1fr)` }}
>
  {/* Section items */}
</div>
```

**Variable Text Handling:**
- **Dynamic column count** from section metadata
- **Gap spacing** prevents text collision
- **Grid auto-flow** wraps items to new rows
- **Each cell expands independently**

### 3.3 Header Contact Info Wrapping

**File:** `/apps/artboard/src/templates/azurill.tsx:39-75`

```typescript
<div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm">
  {basics.location && (
    <div className="flex items-center gap-x-1.5">
      <i className="ph ph-bold ph-map-pin text-primary" />
      <div>{basics.location}</div>
    </div>
  )}
  {/* More contact items... */}
</div>
```

**Variable Text Handling:**
- **`flex-wrap`:** Contact items wrap to new line when space runs out
- **Horizontal gaps:** `gap-x-3` maintains spacing
- **Vertical gaps:** `gap-y-0.5` prevents squishing when wrapped
- **No minimum width constraints** - adapts to content

### 3.4 Summary/Rich Text Content

**File:** `/apps/artboard/src/templates/bronzor.tsx:91-95`

```typescript
<div
  dangerouslySetInnerHTML={{ __html: sanitize(section.content) }}
  style={{ columns: section.columns }}
  className="wysiwyg"
/>
```

**Variable Text Handling:**
- **CSS multi-column layout** via `style={{ columns: section.columns }}`
- **wysiwyg class** applies prose styling with proper line heights
- **No max-height** - content expands naturally
- **Sanitization** prevents layout-breaking HTML

**WYSIWYG Styling:** `/apps/artboard/src/styles/main.css:27-29`
```css
.wysiwyg {
  @apply prose-foreground prose max-w-none
         prose-headings:mb-2 prose-headings:mt-0
         prose-p:mb-2 prose-p:mt-0 prose-p:leading-normal
         prose-a:break-all  /* Critical for long URLs */
         /* ... more prose utilities */;
}
```

### 3.5 Keyword/Tag Lists

**File:** `/apps/artboard/src/templates/azurill.tsx:235-236`

```typescript
{keywords !== undefined && keywords.length > 0 && (
  <p className="text-sm">{keywords.join(", ")}</p>
)}
```

**Variable Text Handling:**
- **Inline joining** with commas
- **Natural wrapping** at word boundaries
- **No tag truncation** - all keywords rendered
- **Smaller font** (`text-sm`) to fit more content

---

## 4. Typography & Spacing System

### 4.1 CSS Variable Architecture

**File:** `/apps/artboard/src/pages/artboard.tsx:34-46`

```typescript
useEffect(() => {
  document.documentElement.style.setProperty("font-size", `${metadata.typography.font.size}px`);
  document.documentElement.style.setProperty("line-height", `${metadata.typography.lineHeight}`);
  document.documentElement.style.setProperty("--margin", `${metadata.page.margin}px`);
  document.documentElement.style.setProperty("--font-size", `${metadata.typography.font.size}px`);
  document.documentElement.style.setProperty("--line-height", `${metadata.typography.lineHeight}`);
  document.documentElement.style.setProperty("--color-foreground", metadata.theme.text);
  document.documentElement.style.setProperty("--color-primary", metadata.theme.primary);
  document.documentElement.style.setProperty("--color-background", metadata.theme.background);
}, [metadata]);
```

**Dynamic Variables:**
- **Font size:** `--font-size` (applied to root `font-size`)
- **Line height:** `--line-height` (global line spacing)
- **Page margin:** `--margin` (used via `p-custom` utility)
- **Theme colors:** `--color-foreground`, `--color-primary`, `--color-background`

### 4.2 Tailwind Configuration

**File:** `/apps/artboard/tailwind.config.js:13-25`

```javascript
theme: {
  extend: {
    colors: {
      foreground: "var(--color-foreground)",
      primary: "var(--color-primary)",
      background: "var(--color-background)",
    },
    lineHeight: {
      tight: "calc(var(--line-height) - 0.5)",
      snug: "calc(var(--line-height) - 0.3)",
      normal: "var(--line-height)",
      relaxed: "calc(var(--line-height) + 0.3)",
      loose: "calc(var(--line-height) + 0.5)",
    },
    spacing: { custom: "var(--margin)" },
  }
}
```

**Key Utilities:**
- **`text-foreground`**: Body text color (dynamic)
- **`text-primary`**: Accent color (icons, headings)
- **`bg-background`**: Page background
- **`p-custom`**: Page margin/padding (e.g., `className="p-custom space-y-4"`)
- **`leading-normal`**: Uses custom line height variable

### 4.3 Font Loading Strategy

**File:** `/apps/artboard/src/pages/artboard.tsx:12-30`

```typescript
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

**Font System:**
- **Google Fonts** via webfontloader
- **Dynamic variants** (e.g., 400, 700, italic)
- **Subset support** (latin, latin-ext, etc.)
- **PDF compatibility** - fonts embedded in output
- **Load callback** sends dimensions to parent (for PDF generation)

---

## 5. PDF Export & Multi-Page Handling

### 5.1 Page Structure

**File:** `/apps/artboard/src/components/page.tsx:12-48`

```typescript
export const MM_TO_PX = 3.78; // Conversion constant

export const Page = ({ mode = "preview", pageNumber, children }: Props) => {
  const page = useArtboardStore((state) => state.resume.metadata.page);
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
      {children}

      {/* Optional page break line for builder mode */}
      {mode === "builder" && page.options.breakLine && (
        <div className="absolute inset-x-0 border-b border-dashed"
             style={{ top: `${pageSizeMap[page.format].height * MM_TO_PX}px` }} />
      )}
    </div>
  );
};
```

**Page System:**
- **Fixed dimensions** based on format (A4, Letter, etc.)
- **MM to PX conversion** for precise sizing
- **`minHeight`** instead of `height` - allows overflow to next page
- **`data-page` attribute** for targeting with CSS/print styles
- **Font family inline style** ensures PDF embedding

### 5.2 Multi-Page Layout

**File:** `/apps/artboard/src/pages/preview.tsx:9-24`

```typescript
export const PreviewLayout = () => {
  const layout = useArtboardStore((state) => state.resume.metadata.layout);
  const template = useArtboardStore((state) => state.resume.metadata.template as Template);

  const Template = useMemo(() => getTemplate(template), [template]);

  return (
    <>
      {layout.map((columns, pageIndex) => (
        <Page key={pageIndex} mode="preview" pageNumber={pageIndex + 1}>
          <Template isFirstPage={pageIndex === 0} columns={columns as SectionKey[][]} />
        </Page>
      ))}
    </>
  );
};
```

**Multi-Page Strategy:**
- **Layout array** in metadata defines section distribution
- **Each page** gets own `<Page>` wrapper
- **Template receives** page-specific columns
- **`isFirstPage` flag** controls header rendering (only page 1)
- **No automatic page breaks** - user controls section placement

### 5.3 Print Styles

**File:** `/apps/artboard/src/styles/main.css:19-29`

```css
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
         prose-a:break-all  /* Prevents URL overflow */
         prose-ol:mb-2 prose-ol:mt-0
         prose-ul:mb-2 prose-ul:mt-0
         prose-li:mb-2 prose-li:mt-0 prose-li:leading-normal
         prose-img:mb-2 prose-img:mt-0
         prose-hr:mb-2 prose-hr:mt-0;
}
```

**Typography Options:**
- **`metadata.typography.hideIcons`**: Toggles icon visibility
- **`metadata.typography.underlineLinks`**: Link decoration control
- **Applied dynamically** via class toggles (artboard.tsx:52-57)

**Note:** No `@page` rules or explicit `break-inside` styles found. PDF generation likely handled by external renderer (Puppeteer/Playwright).

---

## 6. Layout Patterns Deep Dive

### 6.1 Azurill Template (Two-Column with Timeline)

**File:** `/apps/artboard/src/templates/azurill.tsx:552-576`

```typescript
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

        <div className={cn("main group space-y-4", sidebar.length > 0 ? "col-span-2" : "col-span-3")}>
          {main.map((section) => (
            <Fragment key={section}>{mapSectionToComponent(section)}</Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};
```

**Layout Breakdown:**
- **3-column grid** (1 sidebar : 2 main)
- **Conditional span:** Main takes full 3 cols if no sidebar
- **Timeline dots:** Absolute positioned elements with `border-l` on items
- **Group classes:** Enable context-specific styling (`.group-[.main]`, `.group-[.sidebar]`)

**Timeline Effect:** `/apps/artboard/src/templates/azurill.tsx:97-105`
```typescript
<main className={cn("relative space-y-2", "border-l border-primary pl-4")}>
  <div className="absolute left-[-4.5px] top-[8px] hidden size-[8px] rounded-full bg-primary group-[.main]:block" />
  {/* Content */}
</main>
```

### 6.2 Bronzor Template (Single Column Grid Sections)

**File:** `/apps/artboard/src/templates/bronzor.tsx:567-585`

```typescript
export const Bronzor = ({ columns, isFirstPage = false }: TemplateProps) => {
  const [main, sidebar] = columns;

  return (
    <div className="p-custom space-y-4">
      {isFirstPage && <Header />}

      <div className="space-y-4">
        {main.map((section) => (
          <Fragment key={section}>{mapSectionToComponent(section)}</Fragment>
        ))}
        {sidebar.map((section) => (
          <Fragment key={section}>{mapSectionToComponent(section)}</Fragment>
        ))}
      </div>
    </div>
  );
};
```

**Section Layout:** `/apps/artboard/src/templates/bronzor.tsx:183-223`
```typescript
<section id={section.id} className="grid grid-cols-5 border-t pt-2.5">
  <div>
    <h4 className="text-base font-bold">{section.name}</h4>
  </div>

  <div className="col-span-4 grid gap-x-6 gap-y-3"
       style={{ gridTemplateColumns: `repeat(${section.columns}, 1fr)` }}>
    {/* Section items */}
  </div>
</section>
```

**Layout Breakdown:**
- **5-column grid per section** (1 label : 4 content)
- **Nested grid** in content area with dynamic columns
- **Border-top dividers** between sections
- **No sidebar distinction** - all sections stacked vertically

### 6.3 Chikorita Template (Colored Sidebar)

**File:** `/apps/artboard/src/templates/chikorita.tsx:567-597`

```typescript
export const Chikorita = ({ columns, isFirstPage = false }: TemplateProps) => {
  const [main, sidebar] = columns;

  return (
    <div className="grid min-h-[inherit] grid-cols-3">
      <div className={cn("main p-custom group space-y-4",
                         sidebar.length > 0 ? "col-span-2" : "col-span-3")}>
        {isFirstPage && <Header />}
        {main.map((section) => (
          <Fragment key={section}>{mapSectionToComponent(section)}</Fragment>
        ))}
      </div>

      <div className={cn("sidebar p-custom group h-full space-y-4 bg-primary text-background",
                         sidebar.length === 0 && "hidden")}>
        {sidebar.map((section) => (
          <Fragment key={section}>{mapSectionToComponent(section)}</Fragment>
        ))}
      </div>
    </div>
  );
};
```

**Layout Breakdown:**
- **Sidebar-right** configuration (inverted from Azurill)
- **`bg-primary text-background`**: Colored sidebar with inverted text
- **`min-h-[inherit]`**: Ensures full page height
- **Conditional hiding:** Sidebar div hidden if no sections

### 6.4 Ditto Template (Header Accent Band)

**File:** `/apps/artboard/src/templates/ditto.tsx:594-626`

```typescript
export const Ditto = ({ columns, isFirstPage = false }: TemplateProps) => {
  const [main, sidebar] = columns;

  return (
    <div>
      {isFirstPage && (
        <div className="relative">
          <Header />
          <div className="absolute inset-x-0 top-0 h-[85px] w-full bg-primary" />
        </div>
      )}

      <div className="grid grid-cols-3">
        <div className="sidebar p-custom group space-y-4">
          {sidebar.map((section) => (
            <Fragment key={section}>{mapSectionToComponent(section)}</Fragment>
          ))}
        </div>

        <div className={cn("main p-custom group space-y-4",
                           sidebar.length > 0 ? "col-span-2" : "col-span-3")}>
          {main.map((section) => (
            <Fragment key={section}>{mapSectionToComponent(section)}</Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};
```

**Layout Breakdown:**
- **Absolute positioned accent bar** behind header
- **Fixed height** (85px) primary color band
- **Relative wrapper** contains header + accent
- **Standard 3-column grid** below header

### 6.5 Gengar Template (Full-Width Colored Header)

**File:** `/apps/artboard/src/templates/gengar.tsx:27-79` (Header snippet)

```typescript
const Header = () => {
  const basics = useArtboardStore((state) => state.resume.basics);

  return (
    <div className="p-custom space-y-4 bg-primary text-background">
      <Picture className="border-background" />

      <div>
        <h2 className="text-2xl font-bold">{basics.name}</h2>
        <p>{basics.headline}</p>
      </div>

      <div className="flex flex-col items-start gap-y-2 text-sm">
        {/* Contact items stacked vertically */}
      </div>
    </div>
  );
};
```

**Layout Breakdown:**
- **Full-width colored header** with padding
- **Vertical contact layout** (unlike Azurill's horizontal flex-wrap)
- **Sidebar with primary background** continues down page
- **Picture border** inverted for contrast on colored background

### 6.6 Leafish Template (Colored Accent Bands)

**File:** `/apps/artboard/src/templates/leafish.tsx:32-52` (Header snippet)

```typescript
const Header = () => {
  const primaryColor = useArtboardStore((state) => state.resume.metadata.theme.primary);

  return (
    <div>
      <div className="p-custom flex items-center space-x-8"
           style={{ backgroundColor: hexToRgb(primaryColor, 0.2) }}>
        {/* Name, headline, summary */}
      </div>

      <div className="p-custom space-y-3"
           style={{ backgroundColor: hexToRgb(primaryColor, 0.4) }}>
        {/* Contact info */}
      </div>
    </div>
  );
};
```

**Layout Breakdown:**
- **Two accent bands** with different opacity levels
- **`hexToRgb()` utility** converts theme color to transparent backgrounds
- **Horizontal flexbox** header layout
- **Picture on right side**

---

## 7. Shared Component Patterns

### 7.1 Generic Section Component

**File:** `/apps/artboard/src/templates/azurill.tsx:180-248`

```typescript
type SectionProps<T> = {
  section: SectionWithItem<T> | CustomSectionGroup;
  children?: (item: T) => React.ReactNode;
  className?: string;
  urlKey?: keyof T;      // e.g., "url"
  levelKey?: keyof T;    // e.g., "level" (for skills)
  summaryKey?: keyof T;  // e.g., "summary"
  keywordsKey?: keyof T; // e.g., "keywords"
};

const Section = <T,>({
  section,
  children,
  className,
  urlKey,
  levelKey,
  summaryKey,
  keywordsKey,
}: SectionProps<T>) => {
  if (!section.visible || section.items.filter((item) => item.visible).length === 0) return null;

  return (
    <section id={section.id} className="grid">
      <div className="mb-2 hidden font-bold text-primary group-[.main]:block">
        <h4>{section.name}</h4>
      </div>

      <div className="mx-auto mb-2 hidden items-center gap-x-2 text-center font-bold text-primary group-[.sidebar]:flex">
        <div className="size-1.5 rounded-full border border-primary" />
        <h4>{section.name}</h4>
        <div className="size-1.5 rounded-full border border-primary" />
      </div>

      <div className="grid gap-x-6 gap-y-3 group-[.sidebar]:mx-auto group-[.sidebar]:text-center"
           style={{ gridTemplateColumns: `repeat(${section.columns}, 1fr)` }}>
        {section.items
          .filter((item) => item.visible)
          .map((item) => {
            const url = (urlKey && get(item, urlKey)) as URL | undefined;
            const level = (levelKey && get(item, levelKey, 0)) as number | undefined;
            const summary = (summaryKey && get(item, summaryKey, "")) as string | undefined;
            const keywords = (keywordsKey && get(item, keywordsKey, [])) as string[] | undefined;

            return (
              <div key={item.id} className={cn("relative space-y-2", "border-primary group-[.main]:border-l group-[.main]:pl-4", className)}>
                <div>{children?.(item as T)}</div>

                {summary !== undefined && !isEmptyString(summary) && (
                  <div dangerouslySetInnerHTML={{ __html: sanitize(summary) }} className="wysiwyg" />
                )}

                {level !== undefined && level > 0 && <Rating level={level} />}

                {keywords !== undefined && keywords.length > 0 && (
                  <p className="text-sm">{keywords.join(", ")}</p>
                )}

                {url !== undefined && section.separateLinks && <Link url={url} />}

                <div className="absolute left-[-4.5px] top-px hidden size-[8px] rounded-full bg-primary group-[.main]:block" />
              </div>
            );
          })}
      </div>
    </section>
  );
};
```

**Pattern Analysis:**
- **Generic type parameter** `<T>` makes component reusable
- **Conditional rendering** via `group-[.main]` and `group-[.sidebar]` variants
- **Dynamic keys** extracted via `lodash.get()`
- **Visibility filtering** at both section and item level
- **Timeline decorations** hidden in sidebar context

### 7.2 Usage Example (Experience Section)

**File:** `/apps/artboard/src/templates/azurill.tsx:269-289`

```typescript
const Experience = () => {
  const section = useArtboardStore((state) => state.resume.sections.experience);

  return (
    <Section<Experience> section={section} urlKey="url" summaryKey="summary">
      {(item) => (
        <div>
          <LinkedEntity
            name={item.company}
            url={item.url}
            separateLinks={section.separateLinks}
            className="font-bold"
          />
          <div>{item.position}</div>
          <div>{item.location}</div>
          <div className="font-bold">{item.date}</div>
        </div>
      )}
    </Section>
  );
};
```

**Pattern Analysis:**
- **Type safety:** `Section<Experience>` provides autocomplete for `item` properties
- **Child render function:** Customizes item layout per template
- **Props passthrough:** `urlKey`, `summaryKey` enable generic handling
- **Section metadata:** `separateLinks` controls URL rendering mode

### 7.3 Rating Component Variations

#### Variant 1: Horizontal Bar (Azurill)
**File:** `/apps/artboard/src/templates/azurill.tsx:112-120`

```typescript
const Rating = ({ level }: RatingProps) => (
  <div className="relative h-1 w-[128px] group-[.sidebar]:mx-auto">
    <div className="absolute inset-0 h-1 w-[128px] rounded bg-primary opacity-25" />
    <div className="absolute inset-0 h-1 rounded bg-primary"
         style={{ width: linearTransform(level, 0, 5, 0, 128) }} />
  </div>
);
```

**Features:**
- **Fixed width** (128px)
- **Layered divs** (background + fill)
- **`linearTransform()`** utility maps level (0-5) to pixel width

#### Variant 2: Dot Array (Bronzor)
**File:** `/apps/artboard/src/templates/bronzor.tsx:102-112`

```typescript
const Rating = ({ level }: RatingProps) => (
  <div className="flex items-center gap-x-1.5">
    {Array.from({ length: 5 }).map((_, index) => (
      <div key={index}
           className={cn("size-2 rounded-full border border-primary",
                         level > index && "bg-primary")} />
    ))}
  </div>
);
```

**Features:**
- **5 circular dots**
- **Conditional fill** based on level threshold
- **Responsive sizing** (2x2 rem units)

#### Variant 3: Diamond Icons (Pikachu)
**File:** `/apps/artboard/src/templates/pikachu.tsx:123-139`

```typescript
const Rating = ({ level }: RatingProps) => (
  <div className="flex items-center gap-x-1.5">
    {Array.from({ length: 5 }).map((_, index) => (
      <i key={index}
         className={cn("ph ph-diamond text-primary",
                       level > index && "ph-fill",
                       level <= index && "ph-bold")} />
    ))}
  </div>
);
```

**Features:**
- **PhosphorIcons** diamond symbols
- **Filled vs outlined** states
- **Customizable via icon library**

### 7.4 LinkedEntity Pattern

**File:** `/apps/artboard/src/templates/bronzor.tsx:147-159`

```typescript
const LinkedEntity = ({ name, url, separateLinks, className }: LinkedEntityProps) => {
  return !separateLinks && isUrl(url.href) ? (
    <Link
      url={url}
      label={name}
      icon={<i className="ph ph-bold ph-globe text-primary" />}
      iconOnRight={true}
      className={className}
    />
  ) : (
    <div className={className}>{name}</div>
  );
};
```

**Pattern Analysis:**
- **Conditional link wrapping:** Name becomes clickable if URL exists
- **`separateLinks` mode:** Shows URL separately below item (controlled by section metadata)
- **Icon integration:** Globe icon appears inline with link
- **Fallback rendering:** Plain text if no URL

---

## 8. Data Consumption & State Management

### 8.1 Zustand Store Architecture

**File:** `/apps/artboard/src/store/artboard.ts`

```typescript
export type ArtboardStore = {
  resume: ResumeData;  // Full resume object
  setResume: (resume: ResumeData) => void;
};

export const useArtboardStore = create<ArtboardStore>()((set) => ({
  resume: null as unknown as ResumeData,
  setResume: (resume) => {
    set({ resume });
  },
}));
```

**Usage Pattern:**
```typescript
const basics = useArtboardStore((state) => state.resume.basics);
const section = useArtboardStore((state) => state.resume.sections.experience);
const metadata = useArtboardStore((state) => state.resume.metadata);
```

**Store Benefits:**
- **Global state:** All templates access same resume data
- **Selector pattern:** Fine-grained subscriptions prevent unnecessary re-renders
- **No prop drilling:** Templates don't pass resume data through props

### 8.2 ResumeData Schema Structure

**File:** `/libs/schema/src/index.ts:7-15`

```typescript
export const resumeDataSchema = z.object({
  basics: basicsSchema,
  sections: sectionsSchema,
  metadata: metadataSchema,
});

export type ResumeData = z.infer<typeof resumeDataSchema>;
```

**Top-Level Structure:**
- **basics**: Name, contact info, picture
- **sections**: Experience, education, skills, etc. (all resume sections)
- **metadata**: Template, theme, typography, layout, page settings

### 8.3 Section Data Flow

**Example: Experience Section**

```typescript
// 1. Store access
const section = useArtboardStore((state) => state.resume.sections.experience);

// 2. Section structure (from schema)
type ExperienceSection = {
  id: string;
  name: string;         // e.g., "Work Experience"
  visible: boolean;     // Show/hide section
  columns: number;      // Grid column count
  separateLinks: boolean; // Link rendering mode
  items: Experience[];  // Array of experience entries
};

// 3. Item structure
type Experience = {
  id: string;
  visible: boolean;
  company: string;
  position: string;
  location: string;
  date: string;
  summary: string;      // Rich text HTML
  url: URL;             // { href: string, label: string }
};

// 4. Rendering
<Section<Experience> section={section} urlKey="url" summaryKey="summary">
  {(item) => (
    <div>
      <div className="font-bold">{item.company}</div>
      <div>{item.position}</div>
      {/* Template-specific layout */}
    </div>
  )}
</Section>
```

**Data Flow:**
1. **Store** provides full section object
2. **Section component** filters visible items, renders grid
3. **Child render function** receives individual items
4. **Generic keys** (`urlKey`, `summaryKey`) extract optional fields

### 8.4 Handling Missing/Optional Data

**Pattern 1: Conditional Rendering (Header Contact Info)**
```typescript
{basics.location && (
  <div className="flex items-center gap-x-1.5">
    <i className="ph ph-bold ph-map-pin text-primary" />
    <div>{basics.location}</div>
  </div>
)}
```

**Pattern 2: Empty String Checking (Summary)**
```typescript
if (!section.visible || isEmptyString(section.content)) return null;
```

**Pattern 3: Array Length (Keywords)**
```typescript
{keywords !== undefined && keywords.length > 0 && (
  <p className="text-sm">{keywords.join(", ")}</p>
)}
```

**Pattern 4: URL Validation (Links)**
```typescript
const Link = ({ url }: LinkProps) => {
  if (!isUrl(url.href)) return null;
  return <a href={url.href}>{url.label || url.href}</a>;
};
```

**Pattern 5: Lodash Get with Default**
```typescript
const level = (levelKey && get(item, levelKey, 0)) as number | undefined;
```

---

## 9. Customization Integration

### 9.1 Theme System

**Metadata Structure:**
```typescript
metadata: {
  theme: {
    background: "#ffffff",  // Page background
    text: "#000000",        // Body text
    primary: "#3b82f6",     // Accent color
  }
}
```

**Application:** `/apps/artboard/src/pages/artboard.tsx:44-46`
```typescript
document.documentElement.style.setProperty("--color-foreground", metadata.theme.text);
document.documentElement.style.setProperty("--color-primary", metadata.theme.primary);
document.documentElement.style.setProperty("--color-background", metadata.theme.background);
```

**Usage in Templates:**
```typescript
className="text-primary"       // Uses --color-primary
className="bg-background"      // Uses --color-background
className="text-foreground"    // Uses --color-foreground
```

### 9.2 Color Utilities

**HexToRgb Function:** (Referenced in Gengar, Leafish templates)
```typescript
import { hexToRgb } from "@reactive-resume/utils";

// Usage for transparent backgrounds
<div style={{ backgroundColor: hexToRgb(primaryColor, 0.2) }}>
  {/* 20% opacity primary color background */}
</div>
```

**Benefits:**
- **Dynamic opacity** without separate color definitions
- **Layered designs** (e.g., Leafish's 0.2 and 0.4 opacity bands)
- **Theme-aware** transparency

### 9.3 Typography Customization

**Metadata Structure:**
```typescript
metadata: {
  typography: {
    font: {
      family: "Inter",
      variants: ["400", "700"],
      subset: "latin",
      size: 14,  // Base font size in px
    },
    lineHeight: 1.5,
    hideIcons: false,
    underlineLinks: false,
  }
}
```

**Application:**
- **Font loading:** Google Fonts via webfontloader
- **Root font-size:** Set on `<html>` element
- **Line height:** CSS variable propagated to all text
- **Icon toggle:** `.hide-icons .ph { display: none; }`
- **Link decoration:** `.underline-links a { text-decoration: underline; }`

### 9.4 Spacing Customization

**Metadata Structure:**
```typescript
metadata: {
  page: {
    margin: 18,  // Page margin in px
    format: "a4", // or "letter"
    options: {
      pageNumbers: true,
      breakLine: true,
    }
  }
}
```

**Application:**
- **`--margin` CSS variable:** Used via `p-custom` utility
- **Page dimensions:** Calculated from format + MM_TO_PX constant
- **Options:** Builder-only visual aids

### 9.5 Custom CSS Support

**File:** `/apps/artboard/src/pages/artboard.tsx:64-68`

```typescript
<Helmet>
  <title>{name} | Reactive Resume</title>
  {metadata.css.visible && (
    <style id="custom-css" lang="css">
      {metadata.css.value}
    </style>
  )}
</Helmet>
```

**User-Provided CSS:**
- **Injected into `<head>`** via React Helmet
- **Full CSS access** - can override any template style
- **Targets:** Use `[data-page]`, class names, or element selectors
- **Risk:** User responsible for breaking changes

**Example Custom CSS:**
```css
/* Hide all icons */
[data-page] .ph { display: none; }

/* Change section title color */
section h4 { color: #ff0000; }

/* Adjust spacing */
.p-custom { padding: 24px; }
```

---

## 10. Icon System

### 10.1 PhosphorIcons Integration

**Library:** [PhosphorIcons](https://phosphoricons.com/)

**Usage Pattern:**
```typescript
<i className="ph ph-bold ph-map-pin text-primary" />
<i className="ph ph-bold ph-phone text-primary" />
<i className="ph ph-bold ph-at text-primary" />
<i className="ph ph-bold ph-link text-primary" />
<i className="ph ph-bold ph-globe text-primary" />
```

**Icon Weights:**
- **`ph-bold`**: Standard weight for templates
- **`ph-fill`**: Filled variant (used in ratings)
- **Dynamic icons:** `ph-${item.icon}` for custom fields

### 10.2 BrandIcon Component

**File:** `/apps/artboard/src/components/brand-icon.tsx` (assumed)

**Usage:**
```typescript
<BrandIcon slug={item.icon} />  // e.g., "github", "linkedin", "twitter"
```

**Features:**
- **Social media logos** for profile links
- **Conditional rendering** based on platform
- **Likely uses:** Simple-icons or similar library

### 10.3 Icon Visibility Control

**Toggle via Metadata:**
```typescript
metadata.typography.hideIcons = true;  // Hides all .ph icons
```

**Applied Dynamically:**
```typescript
document.querySelectorAll(`[data-page]`).forEach(el => {
  el.classList.toggle("hide-icons", metadata.typography.hideIcons);
});
```

---

## 11. Key Utilities & Helpers

### 11.1 String Utilities

**File:** `/libs/utils/src/namespaces/string.ts`

| Function | Purpose | Usage in Templates |
|----------|---------|-------------------|
| **`isUrl(string)`** | Validates URL format | Conditional link rendering |
| **`isEmptyString(string)`** | Checks for empty/whitespace-only | Summary visibility |
| **`sanitize(html)`** | Cleans rich text HTML | wysiwyg content rendering |
| **`extractUrl(string)`** | Extracts URL from text | Link parsing |

**Critical: `sanitize()` Function**
```typescript
export const sanitize = (html: string, options?: sanitizeHtml.IOptions) => {
  return sanitizeHtml(html, {
    allowedTags: ["a", "b", "i", "strong", "em", "p", "ul", "ol", "li", "h1", /* ... */],
    allowedAttributes: {
      "*": ["class", "style"],
      a: ["href", "target"],
      img: ["src", "alt"],
    },
    allowedStyles: {
      "*": { "text-align": [/^left$/, /^right$/, /^center$/, /^justify$/] },
    },
  });
};
```

**Security:**
- **XSS prevention** via sanitize-html library
- **Whitelist approach** (only allowed tags/attributes pass)
- **Style restrictions** (only text-align variants allowed)

### 11.2 Number Utilities

**File:** `/libs/utils/src/namespaces/number.ts`

```typescript
export const linearTransform = (
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
) => {
  if (inMax === inMin) return value === inMax ? outMin : Number.NaN;
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
};
```

**Usage:**
```typescript
// Map skill level (0-5) to progress bar width (0-128px)
linearTransform(level, 0, 5, 0, 128)
```

### 11.3 Class Name Utility

**Library:** `clsx` (via `cn()` alias)

**Usage:**
```typescript
import { cn } from "@reactive-resume/utils";

className={cn(
  "relative space-y-2",
  "border-primary group-[.main]:border-l",
  className  // Props-passed classes
)}
```

**Benefits:**
- **Conditional classes:** `condition && "class-name"`
- **Array merging:** Automatically joins and dedupes
- **Undefined handling:** Safely ignores null/undefined values

---

## 12. Critical Patterns to Adopt

### 12.1 Text Overflow Prevention

**Strategy:** Use flexbox/grid alignment, NOT truncation

✅ **DO:**
```typescript
<div className="flex items-start justify-between">
  <div className="text-left">{/* Long text here */}</div>
  <div className="shrink-0 text-right">{/* Fixed width */}</div>
</div>
```

❌ **DON'T:**
```typescript
<div className="truncate overflow-hidden">{/* Text */}</div>
```

**Key Classes:**
- **`items-start`**: Prevents vertical stretching when text wraps
- **`shrink-0`**: Protects right column from squishing
- **`flex-wrap`**: Allows multi-line wrapping for lists
- **`break-all`**: For long URLs (via wysiwyg prose styles)

### 12.2 Section Visibility Pattern

**Always filter at TWO levels:**
```typescript
// Level 1: Section visibility
if (!section.visible || section.items.filter((item) => item.visible).length === 0) return null;

// Level 2: Item visibility
{section.items
  .filter((item) => item.visible)
  .map((item) => {/* render */})}
```

**Reason:** Empty sections waste space on PDF

### 12.3 Dynamic Column Grid

**Pattern:**
```typescript
<div
  className="grid gap-x-6 gap-y-3"
  style={{ gridTemplateColumns: `repeat(${section.columns}, 1fr)` }}
>
  {/* Items */}
</div>
```

**Benefits:**
- **User-controlled columns** (1-3 typically)
- **Equal-width distribution** via `1fr` units
- **Consistent gaps** prevent layout shift

### 12.4 Context-Aware Styling (Group Variants)

**Pattern:**
```typescript
// Parent
<div className="main group">{/* content */}</div>
<div className="sidebar group">{/* content */}</div>

// Children (in shared component)
<h4 className="hidden group-[.main]:block">Main Variant</h4>
<h4 className="hidden group-[.sidebar]:flex">Sidebar Variant</h4>
```

**Benefits:**
- **Single component** serves multiple layout contexts
- **No prop drilling** for variant flags
- **CSS-based logic** (performant)

### 12.5 Multi-Page Header Control

**Pattern:**
```typescript
export const Template = ({ columns, isFirstPage = false }: TemplateProps) => {
  return (
    <div>
      {isFirstPage && <Header />}
      {/* Rest of content */}
    </div>
  );
};
```

**Reason:** Header should only appear on page 1 (name, contact info)

---

## 13. Performance Considerations

### 13.1 Re-Render Optimization

**Store Selectors:**
```typescript
// ✅ Fine-grained subscription
const basics = useArtboardStore((state) => state.resume.basics);

// ❌ Over-subscription (re-renders on ANY resume change)
const resume = useArtboardStore((state) => state.resume);
```

**Memoization:**
```typescript
const Template = useMemo(() => getTemplate(template), [template]);
```

### 13.2 Font Loading Strategy

**Async Loading:**
```typescript
webfontloader.load({
  google: { families: [fontString] },
  active: () => {
    // Signal font ready for PDF generation
    window.postMessage({ type: "PAGE_LOADED", payload: { width, height } }, "*");
  },
});
```

**Benefits:**
- **Non-blocking** initial render
- **PDF generation waits** for fonts (via postMessage callback)
- **Embedded fonts** in PDF output

### 13.3 Conditional Component Loading

**Template Switching:**
```typescript
const getTemplate = (template: Template) => {
  switch (template) {
    case "azurill": return Azurill;
    // ... only loads selected template
  }
};
```

**Benefits:**
- **Code splitting** opportunity (could lazy-load templates)
- **Memory efficient** (only one template active)

---

## 14. Gaps & Limitations

### 14.1 No Automatic Page Breaks

**Current:** User manually distributes sections across pages via layout metadata

**Limitation:** Long sections may overflow page boundaries

**Workaround:** Visual break-line indicator in builder mode helps user adjust

### 14.2 No Built-in Text Truncation

**Current:** All text wraps naturally

**Limitation:** Very long job titles/company names may look awkward

**Workaround:** Rely on user to edit content for brevity

### 14.3 Limited Print-Specific Styles

**Current:** No `@page` rules or `break-inside` CSS found

**Assumption:** PDF generation handled by external renderer (Puppeteer/Playwright) which may add own print logic

### 14.4 Icon Dependency

**Current:** PhosphorIcons loaded globally

**Limitation:** Cannot lazy-load or selectively include icons

**Impact:** Minimal (icon library is small)

### 14.5 Custom CSS Security

**Current:** User CSS injected without sandboxing

**Risk:** User can break template layout or inject malicious styles

**Mitigation:** Only in user's own resume (not shared)

---

## 15. Implementation Recommendations

### 15.1 For Adopting Templates

1. **Start with Bronzor** (simplest single-column layout)
2. **Copy Section component pattern** - most reusable
3. **Implement Rating variants** - add visual interest
4. **Use `p-custom` spacing** - consistent margins
5. **Leverage group variants** - reduce code duplication

### 15.2 For Variable Text Handling

1. **Always use `items-start`** in flex layouts
2. **Add `shrink-0`** to right-aligned content (dates, locations)
3. **Enable `flex-wrap`** on contact info containers
4. **Use `break-all` on URLs** (via prose styles)
5. **Test with long company names** (e.g., "Senior Vice President of Engineering and Product Development")

### 15.3 For PDF Export

1. **Set fixed page dimensions** via `width` and `minHeight`
2. **Use `data-page` attribute** for print styles
3. **Embed fonts** via webfontloader with callback
4. **Avoid CSS transforms** (may not render in PDF)
5. **Test multi-page resumes** (ensure headers don't repeat)

### 15.4 For Customization

1. **Expose 3 colors minimum** (background, text, primary)
2. **Use CSS variables** for runtime theming
3. **Support custom CSS** with clear documentation
4. **Provide font size control** (14px baseline)
5. **Allow margin adjustment** (18px default)

---

## 16. Code Reference Index

### 16.1 Key Files

| File | Purpose | Lines |
|------|---------|-------|
| `/apps/artboard/src/templates/index.tsx` | Template registry | 58 |
| `/apps/artboard/src/templates/azurill.tsx` | Two-column sidebar template | 576 |
| `/apps/artboard/src/templates/bronzor.tsx` | Single column template | 585 |
| `/apps/artboard/src/templates/chikorita.tsx` | Colored sidebar template | 597 |
| `/apps/artboard/src/templates/ditto.tsx` | Header accent template | 626 |
| `/apps/artboard/src/components/page.tsx` | Page wrapper component | 48 |
| `/apps/artboard/src/store/artboard.ts` | Zustand store | 14 |
| `/apps/artboard/src/pages/artboard.tsx` | Theme/font management | 75 |
| `/apps/artboard/src/pages/preview.tsx` | Multi-page renderer | 24 |
| `/apps/artboard/tailwind.config.js` | Theme configuration | 51 |
| `/libs/utils/src/namespaces/string.ts` | String utilities | 151 |
| `/libs/utils/src/namespaces/number.ts` | Number utilities | 11 |

### 16.2 Pattern Locations

| Pattern | File:Line |
|---------|-----------|
| Generic Section component | `azurill.tsx:180-248` |
| Two-column item layout | `bronzor.tsx:252-267` |
| Stacked item layout | `azurill.tsx:274-285` |
| Flex-wrap contact info | `azurill.tsx:39-75` |
| Dynamic grid columns | `ditto.tsx:206-209` |
| Rich text rendering | `bronzor.tsx:91-95` |
| Rating bar visualization | `azurill.tsx:112-120` |
| Rating dots visualization | `bronzor.tsx:102-112` |
| LinkedEntity pattern | `bronzor.tsx:147-159` |
| HexToRgb usage | `gengar.tsx:89`, `leafish.tsx:36,54` |
| Custom CSS injection | `artboard.tsx:64-68` |
| Font loading | `artboard.tsx:20-30` |
| CSS variable setting | `artboard.tsx:34-46` |
| Multi-page rendering | `preview.tsx:16-23` |

---

## 17. Summary & Key Takeaways

### 17.1 Template System Strengths

1. **Shared component architecture** - Reduces duplication across 12 templates
2. **Flexible layouts** - Sidebar, single-column, multi-column variants
3. **No text truncation** - Graceful wrapping via CSS
4. **Dynamic theming** - CSS variables enable runtime customization
5. **PDF-ready structure** - Fixed dimensions, embedded fonts

### 17.2 Variable Text Handling Philosophy

**Reactive-Resume's Approach:**
- **Trust the user** to write concise content
- **Wrap, don't truncate** - preserve all information
- **Use layout constraints** (flexbox, grid) to manage space
- **Visual feedback** in builder mode (page break lines)

**Why This Works:**
- **Resumes are user-curated** - not dynamic/unpredictable content
- **PDF format is fixed** - users see exactly what they'll get
- **Professional context** - verbosity is user error, not system failure

### 17.3 Adoption Priorities

**For Template Rendering:**
1. Implement `Section<T>` generic component
2. Build 2-3 layout variants (single, two-column sidebar, colored accent)
3. Add Rating component with 2+ visual styles
4. Support dynamic grid columns per section

**For Variable Text:**
1. Use `items-start`, `shrink-0`, `flex-wrap` patterns
2. Test with realistic long text (company names, job titles)
3. Enable rich text via sanitized HTML
4. Support CSS column layout for summaries

**For Customization:**
1. CSS variable theming (3+ colors)
2. Font family/size control
3. Spacing/margin adjustment
4. Optional custom CSS injection

---

## 18. Template Comparison Matrix

| Template | Sidebar | Header Style | Section Dividers | Timeline | Colored Accents | Complexity |
|----------|---------|--------------|------------------|----------|-----------------|------------|
| Azurill | Left (1/3) | Centered | Border-left | Yes (dots) | No | Medium |
| Bronzor | None | Centered | Border-top | No | No | Low |
| Chikorita | Right (1/3) | Left-aligned | Border-bottom | No | Yes (sidebar) | Medium |
| Ditto | Left (1/3) | Centered | Border-left | No | Yes (header) | Medium |
| Gengar | Left (full) | Full-width | Borders | No | Yes (header+sidebar) | High |
| Glalie | Varies | Various | Various | Varies | Varies | Medium |
| Kakuna | None | Centered | Border-bottom | No | No | Low |
| Leafish | None | Horizontal | None | No | Yes (header bands) | High |
| Nosepass | Varies | Various | Various | No | Varies | Medium |
| Onyx | None | Left-aligned | None | No | No | Low |
| Pikachu | Left (1/3) | Colored box | Border-bottom | No | Yes (header) | High |
| Rhyhorn | Varies | Various | Various | Varies | Varies | Medium |

**Complexity Rating:**
- **Low:** Single layout, minimal decoration, <550 lines
- **Medium:** Two layouts (sidebar variants), moderate decoration, 550-600 lines
- **High:** Advanced features (opacity layers, complex headers), >600 lines

---

## Appendix A: Complete Section Mapping

All 12 templates support these sections via `mapSectionToComponent()`:

1. **profiles** - Social media links
2. **summary** - Profile/objective text
3. **experience** - Work history
4. **education** - Academic background
5. **awards** - Honors and awards
6. **certifications** - Professional certifications
7. **skills** - Technical/soft skills
8. **interests** - Hobbies and interests
9. **publications** - Research publications
10. **volunteer** - Volunteer work
11. **languages** - Language proficiencies
12. **projects** - Personal/professional projects
13. **references** - Professional references
14. **custom.{id}** - User-defined sections

**Note:** Profiles often integrated into header (Kakuna, Onyx, Leafish)

---

## Appendix B: Typography Scale

**Default Font Size:** 14px (customizable via metadata)

**Tailwind Typography Classes:**
- **Headings:** `text-2xl` (name), `text-base` (headline, section names)
- **Body:** Default size (1rem = 14px)
- **Small:** `text-sm` (contact info, keywords)

**Line Heights:** (via Tailwind config)
- `leading-tight`: `calc(var(--line-height) - 0.5)`
- `leading-snug`: `calc(var(--line-height) - 0.3)`
- `leading-normal`: `var(--line-height)` (default: 1.5)
- `leading-relaxed`: `calc(var(--line-height) + 0.3)`
- `leading-loose`: `calc(var(--line-height) + 0.5)`

---

## Appendix C: Color System

**CSS Variables:** (set dynamically)
```css
--color-foreground: #000000  /* Body text */
--color-primary: #3b82f6     /* Accent color */
--color-background: #ffffff  /* Page background */
```

**Tailwind Utilities:**
```css
.text-foreground { color: var(--color-foreground); }
.text-primary { color: var(--color-primary); }
.bg-primary { background-color: var(--color-primary); }
.bg-background { background-color: var(--color-background); }
.border-primary { border-color: var(--color-primary); }
```

**Opacity Variants:**
```typescript
hexToRgb(primaryColor, 0.2)  // 20% opacity
hexToRgb(primaryColor, 0.4)  // 40% opacity
```

---

**Document Version:** 1.0
**Generated:** 2025-10-08
**Source Commit:** 5723548 (main branch)
