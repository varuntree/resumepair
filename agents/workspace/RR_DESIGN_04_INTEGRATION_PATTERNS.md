# Reactive Resume: Integration Patterns & Best Practices

**Document:** RR_DESIGN_04_INTEGRATION_PATTERNS.md
**Source:** /Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume
**Date:** 2025-10-07

---

## Overview

This document extracts reusable patterns, architectural decisions, and best practices from Reactive Resume's template and design system implementation. These patterns can be directly applied to our ResumePair application.

---

## Architecture Patterns

### 1. Template Component Architecture

**Pattern: Generic Section Component**

All templates use a reusable `Section<T>` component that handles:
- Visibility filtering
- Item iteration
- URL, rating, summary, keywords rendering
- Responsive column layouts

**Implementation Pattern:**

```typescript
type SectionProps<T> = {
  section: SectionWithItem<T> | CustomSectionGroup;
  children?: (item: T) => React.ReactNode;
  className?: string;
  urlKey?: keyof T;
  levelKey?: keyof T;
  summaryKey?: keyof T;
  keywordsKey?: keyof T;
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
  // Visibility check
  if (!section.visible || section.items.filter((item) => item.visible).length === 0)
    return null;

  return (
    <section id={section.id} className="grid">
      <h4>{section.name}</h4>

      <div
        className="grid gap-x-6 gap-y-3"
        style={{ gridTemplateColumns: `repeat(${section.columns}, 1fr)` }}
      >
        {section.items
          .filter((item) => item.visible)
          .map((item) => {
            const url = (urlKey && get(item, urlKey)) as URL | undefined;
            const level = (levelKey && get(item, levelKey, 0)) as number | undefined;
            const summary = (summaryKey && get(item, summaryKey, "")) as string | undefined;
            const keywords = (keywordsKey && get(item, keywordsKey, [])) as string[] | undefined;

            return (
              <div key={item.id} className={cn("space-y-2", className)}>
                <div>{children?.(item as T)}</div>

                {summary && !isEmptyString(summary) && (
                  <div dangerouslySetInnerHTML={{ __html: sanitize(summary) }} />
                )}

                {level && level > 0 && <Rating level={level} />}

                {keywords && keywords.length > 0 && (
                  <p className="text-sm">{keywords.join(", ")}</p>
                )}

                {url && section.separateLinks && <Link url={url} />}
              </div>
            );
          })}
      </div>
    </section>
  );
};
```

**Benefits:**
- Single component handles all section types
- Type-safe via generics
- Reduces code duplication
- Consistent behavior across templates
- Easy to extend with new features

**Application for Our App:**
Create similar generic section components for resume and cover letter sections.

---

### 2. Template Factory Pattern

**Pattern: Template Selection via Factory Function**

```typescript
// templates/index.tsx
export const getTemplate = (template: Template) => {
  switch (template) {
    case "azurill": return Azurill;
    case "bronzor": return Bronzor;
    case "pikachu": return Pikachu;
    // ... more templates
    default: return Onyx;
  }
};

// Usage
const TemplateComponent = getTemplate(metadata.template);
<TemplateComponent columns={columns} isFirstPage={isFirstPage} />
```

**Benefits:**
- Centralized template lookup
- Type-safe template selection
- Easy to add new templates
- Default fallback template

**Application for Our App:**
Implement similar factory for both resume and cover letter templates.

---

### 3. Metadata-Driven Rendering

**Pattern: All Customizations in Single Object**

```typescript
// Single source of truth for all design customizations
const metadata = {
  template: "rhyhorn",
  layout: [...],
  theme: {
    primary: "#dc2626",
    background: "#ffffff",
    text: "#000000",
  },
  typography: {
    font: {
      family: "IBM Plex Serif",
      size: 14,
      variants: ["regular", "600"],
    },
    lineHeight: 1.5,
  },
  page: {
    margin: 18,
    format: "a4",
  },
  // ... more settings
};
```

**Benefits:**
- Single object to save/load
- Easy serialization to database
- Type-safe with Zod validation
- Clear separation from content data
- Portable across documents

**Application for Our App:**
Structure our design customizations similarly, separate from resume content.

---

### 4. CSS Variable Bridge Pattern

**Pattern: Runtime CSS Variable Injection**

```typescript
// Bridge metadata to CSS variables
useEffect(() => {
  document.documentElement.style.setProperty("--color-primary", metadata.theme.primary);
  document.documentElement.style.setProperty("--font-size", `${metadata.typography.font.size}px`);
  document.documentElement.style.setProperty("--margin", `${metadata.page.margin}px`);
}, [metadata]);
```

**Then use in Tailwind:**
```javascript
// tailwind.config.js
colors: {
  primary: "var(--color-primary)",
}
```

**Benefits:**
- Decouples template code from theming
- Real-time updates without re-render
- Works with both Tailwind classes and inline styles
- Standard CSS cascade applies

**Application for Our App:**
Essential pattern for dynamic theming. Implement same bridge.

---

### 5. Group-Based Conditional Styling

**Pattern: Parent Group Classes for Context-Aware Styling**

```tsx
// Parent defines context
<div className="main group">
  <Section /> {/* Styled for main column */}
</div>

<div className="sidebar group">
  <Section /> {/* Styled for sidebar */}
</div>

// Within Section component
<div className="flex justify-between group-[.sidebar]:flex-col">
  {/* Horizontal in main, vertical in sidebar */}
</div>

<h4 className="text-left group-[.sidebar]:text-center">
  {/* Left-aligned in main, centered in sidebar */}
</h4>
```

**Benefits:**
- Same component adapts to context
- No prop drilling needed
- Clean separation of concerns
- Leverages Tailwind's group utilities

**Application for Our App:**
Use for sections that render differently in different layout positions.

---

## Component Patterns

### 1. Reusable Sub-Components

**Pattern: Small, Focused Components**

```typescript
// Rating Component (5 variations across templates)
const Rating = ({ level }: { level: number }) => (
  <div className="flex items-center gap-x-1.5">
    {Array.from({ length: 5 }).map((_, index) => (
      <div
        key={index}
        className={cn("size-2 rounded-full border border-primary", level > index && "bg-primary")}
      />
    ))}
  </div>
);

// Link Component (consistent across templates)
const Link = ({ url, icon, label }: LinkProps) => {
  if (!isUrl(url.href)) return null;

  return (
    <div className="flex items-center gap-x-1.5">
      {icon ?? <i className="ph ph-bold ph-link text-primary" />}
      <a href={url.href} target="_blank" rel="noreferrer">
        {label ?? url.label || url.href}
      </a>
    </div>
  );
};

// LinkedEntity Component (combines name with optional link)
const LinkedEntity = ({ name, url, separateLinks }: LinkedEntityProps) => {
  return !separateLinks && isUrl(url.href) ? (
    <Link url={url} label={name} icon={<i className="ph ph-globe text-primary" />} />
  ) : (
    <div>{name}</div>
  );
};
```

**Benefits:**
- Consistent behavior
- Easy to test
- Reusable across templates
- Single point of change

**Application for Our App:**
Extract common patterns into shared components (ratings, links, badges, etc.).

---

### 2. Render Prop Pattern for Section Items

**Pattern: Custom Rendering per Section Type**

```typescript
<Section<Experience> section={section} urlKey="url" summaryKey="summary">
  {(item) => (
    <div className="flex items-start justify-between">
      <div>
        <LinkedEntity name={item.company} url={item.url} />
        <div>{item.position}</div>
      </div>
      <div className="shrink-0 text-right">
        <div className="font-bold">{item.date}</div>
        <div>{item.location}</div>
      </div>
    </div>
  )}
</Section>
```

**Benefits:**
- Generic Section component handles common logic
- Custom rendering for each section type
- Type-safe via generics
- Clean separation of concerns

**Application for Our App:**
Use for both resume sections and cover letter sections.

---

### 3. Template Props Interface Pattern

**Pattern: Consistent Template Interface**

```typescript
type TemplateProps = {
  columns: SectionKey[][];  // Layout configuration
  isFirstPage?: boolean;    // Conditional header rendering
};

export const Rhyhorn = ({ columns, isFirstPage = false }: TemplateProps) => {
  const [main, sidebar] = columns;

  return (
    <div>
      {isFirstPage && <Header />}
      {main.map((section) => <Fragment>{mapSectionToComponent(section)}</Fragment>)}
      {sidebar.map((section) => <Fragment>{mapSectionToComponent(section)}</Fragment>)}
    </div>
  );
};
```

**Benefits:**
- All templates have identical interface
- Easy to swap templates
- Supports multi-page layouts
- Header logic consistent

**Application for Our App:**
Define consistent TemplateProps for resume and cover letter templates.

---

## Styling Patterns

### 1. Utility-First with Semantic Classes

**Pattern: Combine Tailwind Utilities with Semantic Color Classes**

```tsx
// Good: Semantic color class + utility classes
<div className="bg-primary text-background px-6 py-4 rounded">
  Content
</div>

// Avoid: Hardcoded colors
<div className="bg-red-600 text-white px-6 py-4 rounded">
  Content
</div>
```

**Benefits:**
- Colors controlled by theme
- Layout utilities from Tailwind
- Easy to read and maintain
- Automatic theme updates

---

### 2. Dynamic Inline Styles for Computed Values

**Pattern: Use inline styles for runtime-computed values**

```tsx
// Grid columns (dynamic based on data)
<div
  className="grid gap-x-6 gap-y-3"
  style={{ gridTemplateColumns: `repeat(${section.columns}, 1fr)` }}
>

// Opacity backgrounds (computed from primary color)
<div style={{ backgroundColor: hexToRgb(primaryColor, 0.2) }}>

// Progress bar width (computed from level)
<div
  className="h-2.5 rounded bg-primary"
  style={{ width: `${linearTransform(level, 0, 5, 0, 100)}%` }}
/>
```

**When to use inline styles:**
- Dynamic values from data
- Computed colors with opacity
- Runtime-calculated dimensions
- Unique values per item

**When to use classes:**
- Static layout
- Predefined spacing
- Theme colors
- Reusable patterns

---

### 3. Border Current Pattern

**Pattern: Borders inherit text color**

```tsx
// Border color automatically matches text color
<div className="border-b">
  {/* Border inherits from border-current (default) */}
</div>

// Explicit with primary text
<div className="border-b border-primary text-primary">
  {/* Border matches primary color */}
</div>
```

**Benefits:**
- Consistent color relationships
- Less manual color management
- Follows color hierarchy

---

### 4. Responsive Typography Hierarchy

**Pattern: Consistent Size Scale**

```tsx
// Name: Largest, boldest
<h2 className="text-2xl font-bold">{name}</h2>

// Headline: Medium
<p className="text-base">{headline}</p>

// Section Headers: Small, bold, often colored
<h4 className="text-sm font-bold text-primary">{section.name}</h4>

// Body: Default size
<div>{content}</div>

// Metadata: Smallest
<p className="text-sm">{location}</p>
```

**Scale:**
- `text-2xl` (1.5rem/24px): Names
- `text-base` (1rem/16px): Headlines, important text
- `text-sm` (0.875rem/14px): Metadata, secondary info
- Default: Body text

---

## Layout Patterns

### 1. Two-Column Grid Pattern

**Pattern: Main + Sidebar Columns**

```tsx
// Equal columns
<div className="grid grid-cols-2 gap-x-4">
  <div>{main}</div>
  <div>{sidebar}</div>
</div>

// 1/3 - 2/3 split
<div className="grid grid-cols-3 gap-x-4">
  <div>{sidebar}</div>
  <div className="col-span-2">{main}</div>
</div>

// Conditional spanning
<div className={cn("main", sidebar.length > 0 ? "col-span-2" : "col-span-3")}>
  {main}
</div>
```

**Benefits:**
- Responsive to content
- Clear visual hierarchy
- Flexible proportions

---

### 2. Flex Justify-Between Pattern

**Pattern: Left-Right Content Distribution**

```tsx
<div className="flex items-start justify-between">
  <div className="text-left">
    <div className="font-bold">{company}</div>
    <div>{position}</div>
  </div>

  <div className="shrink-0 text-right">
    <div className="font-bold">{date}</div>
    <div>{location}</div>
  </div>
</div>
```

**Key aspects:**
- `items-start`: Top-align content
- `justify-between`: Push to edges
- `shrink-0`: Prevent date/location collapse
- `text-right`: Right-align dates

**Application:** Experience, education, projects, awards

---

### 3. Centered Header Pattern

**Pattern: Centered Contact Information**

```tsx
<div className="flex flex-col items-center space-y-2 text-center">
  <Picture />

  <div>
    <div className="text-2xl font-bold">{name}</div>
    <div className="text-base">{headline}</div>
  </div>

  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm">
    {/* Contact items */}
  </div>
</div>
```

**Key aspects:**
- `flex-col`: Vertical stack
- `items-center`: Center horizontally
- `text-center`: Center text
- `flex-wrap`: Contact info wraps on small screens

---

### 4. Absolute Positioning for Overlays

**Pattern: Layered Headers**

```tsx
<div className="relative">
  <Header />
  <div className="absolute inset-x-0 top-0 h-[85px] w-full bg-primary" />
</div>
```

**Usage in Ditto template:**
- Picture overlays colored band
- Creates depth effect
- Band height: 85px
- Header content has higher z-index

---

## Data Flow Patterns

### 1. Store-Based State Management

**Pattern: Zustand Store for Resume Data**

```typescript
// Single store for entire resume
const useResumeStore = create<ResumeStore>((set) => ({
  resume: initialResume,
  setValue: (path, value) => set((state) => {
    const newState = { ...state };
    set(newState, path, value);  // lodash.set
    return newState;
  }),
}));

// Usage in components
const setValue = useResumeStore((state) => state.setValue);
const theme = useResumeStore((state) => state.resume.data.metadata.theme);

setValue("metadata.theme.primary", "#2563eb");
```

**Benefits:**
- Single source of truth
- Nested updates via dot notation
- Type-safe selectors
- Minimal re-renders (only affected components)

---

### 2. Artboard Store Pattern

**Pattern: Separate Store for Rendering Context**

```typescript
const useArtboardStore = create<ArtboardStore>((set) => ({
  resume: initialResume,
  // Rendering-specific state
}));
```

**Separation of concerns:**
- Main store: Editor interactions, data updates
- Artboard store: Rendering, preview, PDF generation
- Communication via postMessage or shared state

---

### 3. Section Mapping Pattern

**Pattern: Map Section Keys to Components**

```typescript
const mapSectionToComponent = (section: SectionKey) => {
  switch (section) {
    case "profiles": return <Profiles />;
    case "summary": return <Summary />;
    case "experience": return <Experience />;
    case "education": return <Education />;
    // ... more sections
    default: {
      if (section.startsWith("custom.")) {
        return <Custom id={section.split(".")[1]} />;
      }
      return null;
    }
  }
};

// Usage
{main.map((section) => (
  <Fragment key={section}>{mapSectionToComponent(section)}</Fragment>
))}
```

**Benefits:**
- Dynamic section rendering
- Supports custom sections
- Type-safe section keys
- Easy to add new sections

---

## Validation Patterns

### 1. Zod Schema Validation

**Pattern: Define Schema First**

```typescript
// Schema definition
export const metadataSchema = z.object({
  template: z.string().default("rhyhorn"),
  theme: z.object({
    background: z.string().default("#ffffff"),
    text: z.string().default("#000000"),
    primary: z.string().default("#dc2626"),
  }),
  // ... more fields
});

// Type inference
export type Metadata = z.infer<typeof metadataSchema>;

// Validation
const result = metadataSchema.safeParse(userInput);
if (!result.success) {
  console.error(result.error);
}
```

**Benefits:**
- Runtime validation
- Type safety
- Default values
- Error messages
- Easy to extend

---

### 2. URL Validation Pattern

**Pattern: Check URLs Before Rendering**

```typescript
const Link = ({ url }: LinkProps) => {
  if (!isUrl(url.href)) return null;

  return (
    <a href={url.href} target="_blank" rel="noreferrer">
      {url.label || url.href}
    </a>
  );
};
```

**Utility function:**
```typescript
const isUrl = (value: string) => {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};
```

**Application:** Always validate URLs to prevent broken links and security issues.

---

### 3. Empty String Checks

**Pattern: Check for Empty/Whitespace Strings**

```typescript
const Summary = () => {
  if (!section.visible || isEmptyString(section.content)) return null;

  return <section>{/* content */}</section>;
};
```

**Utility function:**
```typescript
const isEmptyString = (value: string) => {
  return !value || value.trim().length === 0;
};
```

**Application:** Prevent rendering empty sections.

---

## Performance Patterns

### 1. Memoized Font String

**Pattern: Compute Font String Once**

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
  });
}, [fontString]);
```

**Benefits:**
- Font only loads when family/variants/subset change
- Avoids unnecessary font requests
- Cleaner dependency array

---

### 2. Conditional Rendering

**Pattern: Early Returns for Invisible Sections**

```typescript
const Section = ({ section }: SectionProps) => {
  // Early return if not visible
  if (!section.visible) return null;

  // Early return if no items
  if (section.items.filter((item) => item.visible).length === 0) return null;

  // Render section
  return <section>{/* content */}</section>;
};
```

**Benefits:**
- Avoid unnecessary rendering
- Cleaner code
- Better performance

---

### 3. Lazy Font Loading

**Pattern: Load Fonts on Demand**

```typescript
// Load font suggestions in background
useEffect(() => {
  for (const font of fontSuggestions) {
    if (localFonts.includes(font)) continue;

    webfontloader.load({
      events: false,
      classes: false,
      google: { families: [font], text: font },
    });
  }
}, []);
```

**Benefits:**
- Fonts available immediately when selected
- Preview accurate in font selector
- Better UX

---

## Accessibility Patterns

### 1. Semantic HTML

**Pattern: Use Semantic Elements**

```tsx
<header>
  <h2>{name}</h2>
</header>

<section id="experience">
  <h4>{section.name}</h4>
  <div>{/* content */}</div>
</section>

<a href={url} target="_blank" rel="noreferrer">
  {label}
</a>
```

**Benefits:**
- Screen reader friendly
- SEO friendly
- Clear document structure

---

### 2. External Link Safety

**Pattern: Add rel="noreferrer" to External Links**

```tsx
<a href={url} target="_blank" rel="noreferrer noopener nofollow">
  {label}
</a>
```

**Security attributes:**
- `noreferrer`: Don't send referrer
- `noopener`: Prevent window.opener access
- `nofollow`: Don't pass SEO value (for user content)

---

### 3. Icon Alternative Text

**Pattern: Icons with Text Labels**

```tsx
// Good: Icon + text
<div className="flex items-center gap-x-1.5">
  <i className="ph ph-phone text-primary" />
  <span>{phone}</span>
</div>

// With hideIcons option
<div className="flex items-center gap-x-1.5">
  <i className="ph ph-phone text-primary" /> {/* Hidden via CSS */}
  <span>{phone}</span> {/* Text remains */}
</div>
```

**Benefits:**
- Screen readers read text
- Icons can be hidden without losing meaning
- Visual enhancement, not dependency

---

## Security Patterns

### 1. HTML Sanitization

**Pattern: Sanitize User HTML**

```tsx
import { sanitize } from "@reactive-resume/utils";

<div dangerouslySetInnerHTML={{ __html: sanitize(section.content) }} />
```

**Critical for:**
- Summary sections
- Custom HTML fields
- Any user-provided HTML

---

### 2. URL Validation

**Pattern: Validate Before Rendering**

```typescript
if (!isUrl(url.href)) return null;

<a href={url.href}>{label}</a>
```

**Prevents:**
- XSS via javascript: URLs
- Invalid href attributes
- Broken links

---

## Integration Checklist for Our App

### Essential Patterns to Adopt

**✅ Template Architecture:**
- [ ] Generic Section component with render props
- [ ] Template factory function
- [ ] Consistent TemplateProps interface
- [ ] Section mapping utility

**✅ Styling System:**
- [ ] CSS variable bridge
- [ ] Tailwind token mapping
- [ ] Group-based conditional styling
- [ ] Semantic color classes

**✅ Metadata Structure:**
- [ ] Zod schema for validation
- [ ] Default values defined
- [ ] Nested update utilities
- [ ] Type inference from schema

**✅ State Management:**
- [ ] Zustand store setup
- [ ] setValue utility for nested updates
- [ ] Separate editor and artboard stores

**✅ Theme Engine:**
- [ ] Runtime CSS variable application
- [ ] hexToRgb utility for opacity
- [ ] Font loading with webfontloader
- [ ] Preset color palette

**✅ Component Library:**
- [ ] Rating component (multiple styles)
- [ ] Link component
- [ ] LinkedEntity component
- [ ] Picture/Avatar component
- [ ] Section wrapper component

**✅ Validation & Security:**
- [ ] URL validation utility
- [ ] Empty string checks
- [ ] HTML sanitization
- [ ] External link safety attributes

---

## Key Takeaways

### Architectural Decisions

1. **Metadata-Driven Design**: All customizations in single, validated object
2. **CSS Variable Bridge**: Enables real-time theming without re-render
3. **Component Composition**: Small, focused components composed into templates
4. **Type Safety**: Zod schemas + TypeScript generics throughout
5. **Performance**: Early returns, memoization, lazy loading

### Best Practices

1. **Separation of Concerns**: Content data ≠ design metadata
2. **Progressive Enhancement**: Basic features visible, advanced hidden
3. **Accessibility First**: Semantic HTML, icon + text, link safety
4. **Security Conscious**: Sanitize HTML, validate URLs, prevent XSS
5. **Default Values**: Every setting has sensible default

### Scalability Patterns

1. **Template Factory**: Easy to add new templates
2. **Section Mapping**: Easy to add new section types
3. **CSS Variables**: Easy to add new theme properties
4. **Validation Schema**: Easy to extend with new fields
5. **Component Library**: Reusable across templates

---

## Reference Implementation Locations

**Core Files:**
- `/libs/schema/src/metadata/index.ts` - Schema definitions
- `/apps/artboard/src/templates/rhyhorn.tsx` - Reference template
- `/apps/artboard/src/pages/artboard.tsx` - CSS variable bridge
- `/apps/client/src/pages/builder/sidebars/right/sections/theme.tsx` - Color picker

**Patterns:**
- Any template file: Section component pattern
- `templates/index.tsx`: Factory pattern
- `artboard.tsx`: CSS variable pattern
- `theme.tsx`: Color picker pattern
- `typography.tsx`: Font selector pattern

---

**Document Version:** 1.0
**Exploration Completed:** 2025-10-07
