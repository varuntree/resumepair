# Reactive-Resume Template System Architecture

## Overview

Reactive-Resume implements a **React-based template system** where each template is a TypeScript/React component that dynamically renders resume data. The architecture is clean, composable, and highly maintainable with strong separation of concerns.

---

## Directory Structure

```
apps/
├── artboard/                           # Rendering application (separate from client)
│   ├── src/
│   │   ├── templates/                  # All template implementations
│   │   │   ├── index.tsx              # Template registry/selector
│   │   │   ├── azurill.tsx            # Sidebar template (col: 1/3, 2/3)
│   │   │   ├── bronzor.tsx            # Single column with header
│   │   │   ├── ditto.tsx              # Sidebar with colored header
│   │   │   ├── onyx.tsx               # Single column clean
│   │   │   ├── pikachu.tsx            # Sidebar with picture in sidebar
│   │   │   ├── rhyhorn.tsx            # Single column classic
│   │   │   └── [8 more templates...]
│   │   ├── components/                 # Shared template components
│   │   │   ├── page.tsx               # Page wrapper with size/styling
│   │   │   ├── picture.tsx            # Profile picture component
│   │   │   └── brand-icon.tsx         # Social media icons
│   │   ├── store/
│   │   │   └── artboard.ts            # Zustand store for resume data
│   │   ├── pages/
│   │   │   ├── builder.tsx            # Editor preview with zoom/pan
│   │   │   └── preview.tsx            # Print/PDF preview mode
│   │   └── types/
│   │       └── template.ts            # Template prop types
├── client/                             # Main client application
│   └── public/templates/               # Template previews & samples
│       ├── jpg/                        # Template preview images
│       ├── json/                       # Sample resume data per template
│       └── pdf/                        # Sample PDFs
└── server/
    └── src/printer/
        └── printer.service.ts          # Puppeteer-based PDF generation

libs/
├── schema/                             # Resume data schemas (Zod)
│   └── src/
│       ├── index.ts                    # Main ResumeData schema
│       ├── sections/                   # Section schemas (Experience, Education, etc.)
│       ├── metadata/                   # Template metadata & layout config
│       └── shared/                     # Shared types (Item, URL, etc.)
└── utils/
    └── src/namespaces/
        └── template.ts                 # Template type definitions
```

**File Reference**: Template registry at `/apps/artboard/src/templates/index.tsx:16-58`

---

## Core Architecture Principles

### 1. **Template-as-Component Pattern**

Each template is a React functional component that receives resume data via Zustand store and renders it according to its unique layout.

**Template Signature**:
```typescript
// /apps/artboard/src/types/template.ts:3-6
export type TemplateProps = {
  columns: SectionKey[][];    // Sections organized into columns
  isFirstPage?: boolean;       // Whether this is page 1 (for header)
};
```

**Template Selection**:
```typescript
// /apps/artboard/src/templates/index.tsx:16-58
export const getTemplate = (template: Template) => {
  switch (template) {
    case "azurill": return Azurill;
    case "bronzor": return Bronzor;
    // ... 10 more templates
    default: return Onyx;
  }
};
```

### 2. **Data Access via Zustand Store**

Templates don't receive props for data—they **pull data from a global store** using selectors:

```typescript
// /apps/artboard/src/store/artboard.ts:1-14
export type ArtboardStore = {
  resume: ResumeData;
  setResume: (resume: ResumeData) => void;
};

export const useArtboardStore = create<ArtboardStore>()((set) => ({
  resume: null as unknown as ResumeData,
  setResume: (resume) => set({ resume }),
}));
```

**Usage in Template**:
```typescript
// Example from /apps/artboard/src/templates/azurill.tsx:27-28
const Header = () => {
  const basics = useArtboardStore((state) => state.resume.basics);
  // ... render header
};
```

### 3. **Section-to-Component Mapping**

Every template implements the same section components but styles them differently:

```typescript
// Common pattern across all templates (e.g., azurill.tsx:503-550)
const mapSectionToComponent = (section: SectionKey) => {
  switch (section) {
    case "profiles": return <Profiles />;
    case "summary": return <Summary />;
    case "experience": return <Experience />;
    case "education": return <Education />;
    case "awards": return <Awards />;
    case "certifications": return <Certifications />;
    case "skills": return <Skills />;
    case "interests": return <Interests />;
    case "publications": return <Publications />;
    case "volunteer": return <Volunteer />;
    case "languages": return <Languages />;
    case "projects": return <Projects />;
    case "references": return <References />;
    default:
      if (section.startsWith("custom."))
        return <Custom id={section.split(".")[1]} />;
      return null;
  }
};
```

### 4. **Layout Configuration**

Layout is **data-driven**, not template-specific. Each resume stores its layout in metadata:

```typescript
// /libs/schema/src/metadata/index.ts:3-8
export const defaultLayout = [
  [
    ["profiles", "summary", "experience", "education", "projects", "volunteer", "references"],
    ["skills", "interests", "certifications", "awards", "publications", "languages"],
  ],
];

// Schema definition
layout: z.array(z.array(z.array(z.string()))).default(defaultLayout)
// Structure: pages -> columns -> sections
```

**Interpretation**:
- First level: Pages (for multi-page resumes)
- Second level: Columns (typically 2: main + sidebar, or 1 for single-column)
- Third level: Section keys (strings like "experience", "education")

---

## Template Lifecycle

### Rendering Flow

```
1. User selects template → metadata.template = "azurill"
2. BuilderLayout/PreviewLayout gets template string
3. getTemplate(template) returns component
4. Template component receives columns prop from metadata.layout
5. Template maps sections to components
6. Each section component pulls data from useArtboardStore
7. React renders the template with live data
```

**Builder Mode** (Interactive Editor):
```typescript
// /apps/artboard/src/pages/builder.tsx:66-79
<AnimatePresence>
  {layout.map((columns, pageIndex) => (
    <motion.div key={pageIndex}>
      <Page mode="builder" pageNumber={pageIndex + 1}>
        <Template isFirstPage={pageIndex === 0} columns={columns as SectionKey[][]} />
      </Page>
    </motion.div>
  ))}
</AnimatePresence>
```

**Preview Mode** (PDF Generation):
```typescript
// /apps/artboard/src/pages/preview.tsx:16-23
{layout.map((columns, pageIndex) => (
  <Page key={pageIndex} mode="preview" pageNumber={pageIndex + 1}>
    <Template isFirstPage={pageIndex === 0} columns={columns as SectionKey[][]} />
  </Page>
))}
```

---

## Template Types & Variations

### Layout Patterns Observed

| Template | Layout Type | Grid Structure | Header Style | Notable Features |
|----------|-------------|----------------|--------------|------------------|
| **Azurill** | Sidebar (1/3, 2/3) | `grid-cols-3` | Centered, picture at top | Decorative dots, timeline bullets |
| **Onyx** | Single column | Full width | Horizontal, picture left | Clean lines, border separators |
| **Ditto** | Sidebar (1/3, 2/3) | `grid-cols-3` | Colored background band | Absolute positioned header overlay |
| **Pikachu** | Sidebar (1/3, 2/3) | `grid-cols-3` | Colored background | Picture in sidebar, diamond ratings |
| **Rhyhorn** | Single column | Full width | Horizontal, picture left | Border separators, simple & clean |
| **Bronzor** | Two-column content | `grid-cols-5` | Centered, picture top | Section titles in left column (1/5), content in right (4/5) |

**File References**:
- Azurill: `/apps/artboard/src/templates/azurill.tsx:552-576`
- Onyx: `/apps/artboard/src/templates/onyx.tsx:563-579`
- Ditto: `/apps/artboard/src/templates/ditto.tsx:594-626`

### Common Template Structures

All templates share these elements:

1. **Header Component**: Name, headline, contact info, photo
2. **Summary Component**: Optional rich-text summary section
3. **Section Components**: Reusable components for each resume section
4. **Generic Section Wrapper**: Handles visibility, columns, items rendering
5. **Helper Components**: Link, Rating, LinkedEntity

---

## Template Composition Patterns

### Pattern 1: Header Variations

Templates differentiate themselves primarily through header design:

```typescript
// Azurill - Centered with picture
const Header = () => (
  <div className="flex flex-col items-center justify-center space-y-2 pb-2 text-center">
    <Picture />
    <div className="text-2xl font-bold">{basics.name}</div>
    {/* ... */}
  </div>
);

// Onyx - Horizontal with profiles in header
const Header = () => (
  <div className="flex items-center justify-between space-x-4 border-b border-primary">
    <Picture />
    <div className="flex-1 space-y-2">
      <div className="text-2xl font-bold">{basics.name}</div>
      {/* ... */}
    </div>
    {/* Profiles grid on right */}
  </div>
);
```

### Pattern 2: Section Layout Strategies

**Sidebar Templates** (Azurill, Ditto, Pikachu):
```typescript
// /apps/artboard/src/templates/azurill.tsx:555-574
<div className="grid grid-cols-3 gap-x-4">
  <div className="sidebar group space-y-4">
    {sidebar.map((section) => (
      <Fragment key={section}>{mapSectionToComponent(section)}</Fragment>
    ))}
  </div>
  <div className="main group col-span-2 space-y-4">
    {main.map((section) => (
      <Fragment key={section}>{mapSectionToComponent(section)}</Fragment>
    ))}
  </div>
</div>
```

**Single Column Templates** (Onyx, Rhyhorn):
```typescript
// /apps/artboard/src/templates/onyx.tsx:567-578
<div className="p-custom space-y-4">
  {isFirstPage && <Header />}
  {main.map((section) => (
    <Fragment key={section}>{mapSectionToComponent(section)}</Fragment>
  ))}
  {sidebar.map((section) => (
    <Fragment key={section}>{mapSectionToComponent(section)}</Fragment>
  ))}
</div>
```

**Two-Column Content** (Bronzor):
```typescript
// /apps/artboard/src/templates/bronzor.tsx:567-584
<div className="p-custom space-y-4">
  {isFirstPage && <Header />}
  <div className="space-y-4">
    {/* Each section is grid-cols-5 internally */}
    {main.map((section) => mapSectionToComponent(section))}
    {sidebar.map((section) => mapSectionToComponent(section))}
  </div>
</div>
```

---

## Styling Architecture

### CSS Strategy: Tailwind + CSS Variables

Templates use Tailwind CSS with theme variables for colors:

```typescript
// /libs/schema/src/metadata/index.ts:26-30
theme: z.object({
  background: z.string().default("#ffffff"),
  text: z.string().default("#000000"),
  primary: z.string().default("#dc2626"),
})
```

These map to CSS variables that Tailwind classes reference:
- `text-primary` → `theme.primary`
- `bg-primary` → `theme.primary`
- `text-background` → `theme.background`
- `text-foreground` → `theme.text`

### Group-Based Conditional Styling

Templates use CSS groups to apply different styles in sidebar vs main:

```typescript
// Azurill example - same section, different appearance
<section id={section.id}>
  {/* Main column style */}
  <div className="mb-2 hidden font-bold text-primary group-[.main]:block">
    <h4>{section.name}</h4>
  </div>

  {/* Sidebar column style */}
  <div className="mx-auto mb-2 hidden items-center gap-x-2 text-center font-bold text-primary group-[.sidebar]:flex">
    <div className="size-1.5 rounded-full border border-primary" />
    <h4>{section.name}</h4>
    <div className="size-1.5 rounded-full border border-primary" />
  </div>
</section>
```

**File Reference**: `/apps/artboard/src/templates/azurill.tsx:86-95`

---

## Key Design Decisions

### 1. **No Template-Specific Data Schema**

All templates consume the **same data structure**. This means:
- Users can switch templates without data loss
- Templates are purely presentational
- Data migration is trivial

### 2. **Section Components are Template-Scoped**

Each template file contains its own section component implementations. This seems redundant but allows:
- Per-template styling variations
- Template-specific rendering logic
- Easy customization without affecting other templates

### 3. **Conditional Rendering Based on Visibility**

Every section checks `section.visible` and `item.visible`:

```typescript
// Common pattern across all templates
if (!section.visible || section.items.filter((item) => item.visible).length === 0)
  return null;
```

This gives users granular control over what appears in their resume.

### 4. **Dynamic Column Grid**

Section items can span multiple columns (1-5):

```typescript
// /libs/schema/src/sections/index.ts:20-25
export const sectionSchema = z.object({
  name: z.string(),
  columns: z.number().min(1).max(5).default(1),
  separateLinks: z.boolean().default(true),
  visible: z.boolean().default(true),
});
```

Templates render this as:
```typescript
<div
  className="grid gap-x-6 gap-y-3"
  style={{ gridTemplateColumns: `repeat(${section.columns}, 1fr)` }}
>
  {section.items.map(/* ... */)}
</div>
```

---

## Template Registration & Discovery

### Available Templates

```typescript
// /libs/utils/src/namespaces/template.ts:1-16
export const templatesList = [
  "azurill", "bronzor", "chikorita", "ditto", "gengar", "glalie",
  "kakuna", "leafish", "nosepass", "onyx", "pikachu", "rhyhorn",
] as const;

export type Template = (typeof templatesList)[number];
```

Total: **12 templates** (all named after Pokémon)

### Template Metadata Storage

Each template has preview assets:
- `/apps/client/public/templates/jpg/{template}.jpg` - Preview image
- `/apps/client/public/templates/json/{template}.json` - Sample resume data
- `/apps/client/public/templates/pdf/{template}.pdf` - Sample PDF

---

## Summary: Architecture Highlights

✅ **Clean Separation**: Templates (view) completely separate from data (model)
✅ **Composable**: Reusable section components within each template
✅ **Data-Driven Layout**: Column configuration stored in resume metadata
✅ **Type-Safe**: Full TypeScript + Zod schema validation
✅ **Theme-Aware**: CSS variables allow runtime theming
✅ **Multi-Page Support**: Layout array handles pagination naturally
✅ **PDF-Ready**: Same components render in browser and Puppeteer

---

## Related Files for Deep Dive

- **Template Base Type**: `/apps/artboard/src/types/template.ts`
- **Template Registry**: `/apps/artboard/src/templates/index.tsx`
- **Resume Schema**: `/libs/schema/src/index.ts`
- **Section Definitions**: `/libs/schema/src/sections/index.ts`
- **Metadata Schema**: `/libs/schema/src/metadata/index.ts`
- **Store Definition**: `/apps/artboard/src/store/artboard.ts`
- **Page Wrapper**: `/apps/artboard/src/components/page.tsx`
