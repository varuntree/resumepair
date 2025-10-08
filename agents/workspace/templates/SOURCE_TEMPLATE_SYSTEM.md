# Reactive-Resume Template System: Comprehensive Research Report

**Research Date**: October 8, 2025
**Repository**: Reactive-Resume (MIT License)
**Research Scope**: Template architecture, data flow, rendering, and customization system

---

## Executive Summary

Reactive-Resume implements a **sophisticated, production-grade template system** built on React and TypeScript that separates concerns between data management, template rendering, and PDF generation. The system's standout features include:

- **12 professionally designed templates** (Pokemon-themed naming: Azurill, Bronzor, Chikorita, Ditto, Gengar, Glalie, Kakuna, Leafish, Nosepass, Onyx, Pikachu, Rhyhorn)
- **Zero-configuration template switching** without data loss
- **Multi-page pagination** with drag-and-drop section reordering
- **Isolated rendering environment** (artboard app) for clean PDF generation
- **Zod-validated data schema** ensuring type safety across the entire stack
- **Headless Chrome PDF rendering** via Puppeteer with per-page processing
- **Real-time preview** with theme customization and live updates

**Key Innovation**: The separation of the "artboard" rendering app from the main client app allows for a pristine, browser-based PDF rendering environment without builder UI interference.

---

## Architecture Overview

### High-Level System Design

```
┌─────────────────────────────────────────────────────────────────┐
│                        REACTIVE-RESUME                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐      ┌──────────────┐      ┌──────────────┐  │
│  │   CLIENT    │      │   ARTBOARD   │      │    SERVER    │  │
│  │     APP     │◄────►│     APP      │◄────►│   (NestJS)   │  │
│  │  (Builder)  │      │  (Renderer)  │      │              │  │
│  └─────────────┘      └──────────────┘      └──────────────┘  │
│         │                     │                      │          │
│         │                     │                      │          │
│  ┌──────▼──────┐      ┌──────▼──────┐      ┌────────▼──────┐  │
│  │   Zustand   │      │   Zustand   │      │  Puppeteer    │  │
│  │ ResumeStore │      │ Artboard    │      │  (Headless    │  │
│  │  + Temporal │      │   Store     │      │   Chrome)     │  │
│  └─────────────┘      └─────────────┘      └───────────────┘  │
│         │                     │                                 │
│         │                     │                                 │
│  ┌──────▼─────────────────────▼─────────────────────┐          │
│  │          SHARED LIBRARIES (@reactive-resume)      │          │
│  ├───────────────────────────────────────────────────┤          │
│  │  @reactive-resume/schema  (Zod schemas)           │          │
│  │  @reactive-resume/utils   (Helpers, validators)   │          │
│  │  @reactive-resume/ui      (Radix UI components)   │          │
│  │  @reactive-resume/dto     (Data transfer objects) │          │
│  └───────────────────────────────────────────────────┘          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Three-Tier Application Structure

1. **Client App** (`apps/client/`)
   - Builder UI with drag-and-drop layout editor
   - Template selector gallery
   - Theme & typography customization panels
   - Real-time preview iframe embedding artboard

2. **Artboard App** (`apps/artboard/`)
   - Standalone React app for rendering resumes
   - No builder UI - pure template rendering
   - Receives data via `postMessage` or `localStorage`
   - Serves both `/builder` (live preview) and `/preview` (PDF render) routes

3. **Server App** (`apps/server/`)
   - NestJS backend
   - Puppeteer integration for PDF generation
   - Minio object storage for resume PDFs
   - PDF-lib for multi-page PDF merging

---

## File Structure Mapping

### Template Files Location

```
apps/artboard/src/templates/
├── index.tsx                    # Template registry & getTemplate() factory
├── azurill.tsx                  # Template: 576 lines, sidebar + main layout
├── bronzor.tsx                  # Template: 585 lines, two-column layout
├── chikorita.tsx                # Template: 597 lines, classic design
├── ditto.tsx                    # Template: 626 lines, colored header
├── gengar.tsx                   # Template: 605 lines, timeline-based
├── glalie.tsx                   # Template: 612 lines, modern design
├── kakuna.tsx                   # Template: 541 lines, minimalist
├── leafish.tsx                  # Template: 537 lines, nature-inspired
├── nosepass.tsx                 # Template: 600 lines, geometric
├── onyx.tsx                     # Template: 579 lines, professional
├── pikachu.tsx                  # Template: 622 lines, bold header
└── rhyhorn.tsx                  # Template: 582 lines, traditional
```

**Pattern**: Each template is ~550-625 lines, self-contained React component with:
- Header component
- Summary component
- Section-specific components (Experience, Education, Skills, etc.)
- `mapSectionToComponent()` dispatcher
- Main layout component accepting `TemplateProps`

### Schema Files Location

```
libs/schema/src/
├── index.ts                     # Main ResumeData schema aggregator
├── basics/
│   ├── index.ts                 # Basics schema (name, email, phone, location, picture)
│   └── custom.ts                # Custom fields schema
├── sections/
│   ├── index.ts                 # All sections schema aggregator
│   ├── experience.ts            # Work experience schema
│   ├── education.ts             # Education schema
│   ├── skill.ts                 # Skills with level & keywords
│   ├── project.ts               # Projects schema
│   ├── certification.ts         # Certifications schema
│   ├── award.ts                 # Awards schema
│   ├── publication.ts           # Publications schema
│   ├── volunteer.ts             # Volunteer work schema
│   ├── language.ts              # Languages with proficiency
│   ├── interest.ts              # Interests schema
│   ├── profile.ts               # Social profiles schema
│   ├── reference.ts             # References schema
│   └── custom-section.ts        # User-defined custom sections
├── metadata/
│   └── index.ts                 # Template, layout, theme, typography, page config
└── shared/
    ├── item.ts                  # Base item schema (id, visible)
    ├── url.ts                   # URL schema (label, href)
    └── types.ts                 # Shared TypeScript types
```

### Utility & Helper Files

```
libs/utils/src/namespaces/
├── template.ts                  # Template list constant
├── string.ts                    # sanitize(), isUrl(), isEmptyString()
├── array.ts                     # Layout manipulation (moveItemInLayout, findItemInLayout)
├── page.ts                      # Page size mappings (A4, Letter)
├── fonts.ts                     # 438KB Google Fonts metadata
├── color.ts                     # Color utilities
├── style.ts                     # CSS/style helpers
└── types.ts                     # LayoutLocator, SortablePayload types
```

### Artboard App Structure

```
apps/artboard/src/
├── main.tsx                     # React app entry point
├── router/
│   └── index.tsx                # Routes: /artboard/builder, /artboard/preview
├── pages/
│   ├── artboard.tsx             # Wrapper: font loading, theme CSS vars
│   ├── builder.tsx              # Live preview with zoom/pan controls
│   └── preview.tsx              # PDF render mode (no UI)
├── components/
│   ├── page.tsx                 # Page wrapper (A4/Letter sizing, page numbers)
│   ├── picture.tsx              # Profile picture with effects
│   └── brand-icon.tsx           # Social media icons loader
├── store/
│   └── artboard.ts              # Zustand store for resume data
├── templates/
│   └── [12 template files]
├── types/
│   └── template.ts              # TemplateProps interface
├── styles/
│   └── main.css                 # Tailwind + wysiwyg prose styles
└── providers/
    └── index.tsx                # Data loading via postMessage/localStorage
```

---

## Data Flow Architecture

### 1. Data Schema (Zod-Based Validation)

**File**: `libs/schema/src/index.ts:8-12`

```typescript
export const resumeDataSchema = z.object({
  basics: basicsSchema,
  sections: sectionsSchema,
  metadata: metadataSchema,
});

export type ResumeData = z.infer<typeof resumeDataSchema>;
```

**Three Root Objects**:

#### A. Basics (`libs/schema/src/basics/index.ts:7-26`)

```typescript
export const basicsSchema = z.object({
  name: z.string(),
  headline: z.string(),
  email: z.literal("").or(z.string().email()),
  phone: z.string(),
  location: z.string(),
  url: urlSchema,
  customFields: z.array(customFieldSchema),
  picture: z.object({
    url: z.string(),
    size: z.number().default(64),
    aspectRatio: z.number().default(1),
    borderRadius: z.number().default(0),
    effects: z.object({
      hidden: z.boolean().default(false),
      border: z.boolean().default(false),
      grayscale: z.boolean().default(false),
    }),
  }),
});
```

**Key Features**:
- Email validation with Zod
- Custom fields array for extensibility
- Picture effects (grayscale, border, hidden)
- URL as separate object with label + href

#### B. Sections (`libs/schema/src/sections/index.ts:33-87`)

**Base Section Schema** (line 20):
```typescript
export const sectionSchema = z.object({
  name: z.string(),
  columns: z.number().min(1).max(5).default(1),  // Multi-column layout support
  separateLinks: z.boolean().default(true),       // Show URLs separately or inline
  visible: z.boolean().default(true),
});
```

**All Available Sections**:
- `summary`: Rich text content section
- `experience`: Work history with company, position, location, dates
- `education`: Degrees with institution, area, score, study type
- `skills`: Name + description + level (0-5) + keywords array
- `projects`: Name + description + URL + keywords + dates
- `certifications`: Name + issuer + URL + date
- `awards`: Title + awarder + URL + date
- `publications`: Name + publisher + URL + date
- `volunteer`: Organization + position + location + dates
- `languages`: Name + description + level (0-5)
- `interests`: Name + keywords array
- `profiles`: Social profiles (username, network, URL, icon)
- `references`: Name + description + URL
- `custom`: Record of user-defined custom sections

**Example**: Experience Schema (`libs/schema/src/sections/experience.ts:6-13`)
```typescript
export const experienceSchema = itemSchema.extend({
  company: z.string().min(1),
  position: z.string(),
  location: z.string(),
  date: z.string(),
  summary: z.string(),
  url: urlSchema,
});
```

**Item Base Schema** (`libs/schema/src/shared/item.ts:6-9`):
```typescript
export const itemSchema = z.object({
  id: idSchema,      // CUID2 unique identifier
  visible: z.boolean(),  // Show/hide individual items
});
```

#### C. Metadata (`libs/schema/src/metadata/index.ts:11-43`)

```typescript
export const metadataSchema = z.object({
  template: z.string().default("rhyhorn"),
  layout: z.array(z.array(z.array(z.string()))).default(defaultLayout), // pages -> columns -> sections
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

**Critical**: The `layout` field is a **3D array**:
```typescript
// Default layout (libs/schema/src/metadata/index.ts:3-8)
export const defaultLayout = [
  [  // Page 1
    [  // Column 1 (Main)
      "profiles", "summary", "experience", "education",
      "projects", "volunteer", "references"
    ],
    [  // Column 2 (Sidebar)
      "skills", "interests", "certifications",
      "awards", "publications", "languages"
    ],
  ],
];
```

**Layout Structure**: `layout[pageIndex][columnIndex][sectionIndex] = "section-id"`

---

### 2. State Management Flow

#### Client App: Zustand + Immer + Temporal (Undo/Redo)

**File**: `apps/client/src/stores/resume.ts:28-79`

```typescript
export const useResumeStore = create<ResumeStore>()(
  temporal(
    immer((set) => ({
      resume: {} as ResumeDto,
      setValue: (path, value) => {
        set((state) => {
          if (path === "visibility") {
            state.resume.visibility = value as "public" | "private";
          } else {
            state.resume.data = _set(state.resume.data, path, value);  // lodash.set
          }

          void debouncedUpdateResume(JSON.parse(JSON.stringify(state.resume)));
        });
      },
      addSection: () => { /* Creates custom section */ },
      removeSection: (sectionId: SectionKey) => { /* Removes custom section */ },
    })),
    {
      limit: 100,  // 100 undo/redo states
      wrapTemporal: (fn) => devtools(fn),
      partialize: ({ resume }) => ({ resume }),
    },
  ),
);
```

**Key Features**:
- **Immer**: Immutable updates with mutable syntax
- **Temporal**: Built-in undo/redo with 100-state history
- **Lodash.set**: Deep path updates (`metadata.theme.primary`)
- **Debounced persistence**: Auto-save to backend on changes

#### Artboard App: Minimal Zustand Store

**File**: `apps/artboard/src/store/artboard.ts:4-14`

```typescript
export type ArtboardStore = {
  resume: ResumeData;
  setResume: (resume: ResumeData) => void;
};

export const useArtboardStore = create<ArtboardStore>()((set) => ({
  resume: null as unknown as ResumeData,
  setResume: (resume) => {
    set({ resume });
  },
}));
```

**Data Loading**: `apps/artboard/src/providers/index.tsx:12-29`

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

useEffect(() => {
  const resumeData = window.localStorage.getItem("resume");
  if (resumeData) setResume(JSON.parse(resumeData));
}, [window.localStorage.getItem("resume")]);
```

**Two Loading Mechanisms**:
1. **PostMessage**: For live preview iframe communication
2. **LocalStorage**: For headless PDF rendering (set by Puppeteer)

---

### 3. Template Rendering Data Flow

```
ResumeData (Zustand)
        ↓
  useArtboardStore((state) => state.resume.basics)
        ↓
  Template Component (e.g., Azurill)
        ↓
  mapSectionToComponent(sectionId)
        ↓
  Section Component (e.g., Experience)
        ↓
  Generic <Section> Wrapper
        ↓
  Individual Item Rendering
```

**Example**: Experience Section in Azurill Template

**File**: `apps/artboard/src/templates/azurill.tsx:269-289`

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

**Generic Section Component** (`apps/artboard/src/templates/azurill.tsx:180-248`):

```typescript
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

      <div
        className="grid gap-x-6 gap-y-3 group-[.sidebar]:mx-auto group-[.sidebar]:text-center"
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
              <div key={item.id} className={cn("relative space-y-2", "border-primary group-[.main]:border-l group-[.main]:pl-4", className)}>
                <div>{children?.(item as T)}</div>

                {summary !== undefined && !isEmptyString(summary) && (
                  <div
                    dangerouslySetInnerHTML={{ __html: sanitize(summary) }}
                    className="wysiwyg"
                  />
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

**Reusable Section Logic**:
- Visibility filtering (section + items)
- Multi-column grid layout (`columns` prop)
- Conditional rendering of URL, level rating, keywords, summary
- Uses lodash `get()` for safe property access
- HTML sanitization via `sanitize-html` library
- CSS group selectors for sidebar/main styling variations

---

## Component Catalog

### 1. Core Template Components

#### Template Props Interface
**File**: `apps/artboard/src/types/template.ts:3-6`

```typescript
export type TemplateProps = {
  columns: SectionKey[][];  // Array of columns, each containing section IDs
  isFirstPage?: boolean;    // Show/hide header on subsequent pages
};
```

#### Template Factory
**File**: `apps/artboard/src/templates/index.tsx:16-58`

```typescript
export const getTemplate = (template: Template) => {
  switch (template) {
    case "azurill": return Azurill;
    case "bronzor": return Bronzor;
    // ... 10 more cases
    default: return Onyx;  // Fallback template
  }
};
```

#### Main Template Structure (Example: Azurill)

**File**: `apps/artboard/src/templates/azurill.tsx:552-576`

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

**Layout Pattern**: Two-column grid with `sidebar` (1/3 width) and `main` (2/3 width). If sidebar empty, main expands to full width.

### 2. Shared Components

#### Page Wrapper
**File**: `apps/artboard/src/components/page.tsx:14-48`

```typescript
export const MM_TO_PX = 3.78;

export const Page = ({ mode = "preview", pageNumber, children }: Props) => {
  const { isDarkMode } = useTheme();
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
      {mode === "builder" && page.options.pageNumbers && (
        <div className={cn("absolute -top-7 left-0 font-bold", isDarkMode && "text-white")}>
          Page {pageNumber}
        </div>
      )}

      {children}

      {mode === "builder" && page.options.breakLine && (
        <div
          className="absolute inset-x-0 border-b border-dashed"
          style={{ top: `${pageSizeMap[page.format].height * MM_TO_PX}px` }}
        />
      )}
    </div>
  );
};
```

**Features**:
- MM to PX conversion (1mm = 3.78px)
- A4 (210x297mm) and Letter (216x279mm) support
- Builder mode: Shows page numbers and breaklines
- Preview mode: Clean output for PDF

**Page Sizes** (`libs/utils/src/namespaces/page.ts:1-10`):
```typescript
export const pageSizeMap = {
  a4: { width: 210, height: 297 },
  letter: { width: 216, height: 279 },
} as const;
```

#### Picture Component
**File**: `apps/artboard/src/components/picture.tsx:9-33`

```typescript
export const Picture = ({ className }: PictureProps) => {
  const picture = useArtboardStore((state) => state.resume.basics.picture);
  const fontSize = useArtboardStore((state) => state.resume.metadata.typography.font.size);

  if (!isUrl(picture.url) || picture.effects.hidden) return null;

  return (
    <img
      src={picture.url}
      alt="Profile"
      className={cn(
        "relative z-20 object-cover",
        picture.effects.border && "border-primary",
        picture.effects.grayscale && "grayscale",
        className,
      )}
      style={{
        maxWidth: `${picture.size}px`,
        aspectRatio: `${picture.aspectRatio}`,
        borderRadius: `${picture.borderRadius}px`,
        borderWidth: `${picture.effects.border ? fontSize / 3 : 0}px`,
      }}
    />
  );
};
```

**Effects**:
- Border width scales with font size (fontSize / 3)
- Grayscale filter toggle
- Configurable aspect ratio and border radius
- Hidden state support

#### Brand Icon Loader
**File**: `apps/artboard/src/components/brand-icon.tsx:7-22`

```typescript
export const BrandIcon = forwardRef<HTMLImageElement, BrandIconProps>(({ slug }, ref) => {
  if (slug.toLowerCase() === "linkedin") {
    return (
      <img
        ref={ref}
        alt="LinkedIn"
        className="size-4"
        src={`${window.location.origin}/support-logos/linkedin.svg`}
      />
    );
  }

  return (
    <img ref={ref} alt={slug} className="size-4" src={`https://cdn.simpleicons.org/${slug}`} />
  );
});
```

**Icon Strategy**:
- LinkedIn: Self-hosted SVG (avoids CDN issues)
- Others: Simple Icons CDN (`https://cdn.simpleicons.org/`)

### 3. Reusable Template Sub-Components

All templates share these common sub-components:

#### Rating Component (Skill Level Visualization)

**Azurill Style** (`apps/artboard/src/templates/azurill.tsx:112-120`):
```typescript
const Rating = ({ level }: RatingProps) => (
  <div className="relative h-1 w-[128px] group-[.sidebar]:mx-auto">
    <div className="absolute inset-0 h-1 w-[128px] rounded bg-primary opacity-25" />
    <div
      className="absolute inset-0 h-1 rounded bg-primary"
      style={{ width: linearTransform(level, 0, 5, 0, 128) }}
    />
  </div>
);
```

**Ditto Style** (`apps/artboard/src/templates/ditto.tsx:122-131`):
```typescript
const Rating = ({ level }: RatingProps) => (
  <div className="flex items-center gap-x-1.5">
    {Array.from({ length: 5 }).map((_, index) => (
      <div
        key={index}
        className={cn("h-2 w-4 border border-primary", level > index && "bg-primary")}
      />
    ))}
  </div>
);
```

**Pikachu Style** (`apps/artboard/src/templates/pikachu.tsx:123-140`):
```typescript
const Rating = ({ level }: RatingProps) => (
  <div className="flex items-center gap-x-1.5">
    {Array.from({ length: 5 }).map((_, index) => (
      <i
        key={index}
        className={cn(
          "ph ph-diamond text-primary",
          level > index && "ph-fill",
          level <= index && "ph-bold",
        )}
      />
    ))}
  </div>
);
```

**Three Styles**:
1. **Progress bar**: Linear transformation 0-5 → 0-128px
2. **Box indicators**: 5 boxes, filled based on level
3. **Icon indicators**: Phosphor icons (diamond), filled/outlined

#### Link Component

**File**: `apps/artboard/src/templates/azurill.tsx:130-147`

```typescript
const Link = ({ url, icon, iconOnRight, label, className }: LinkProps) => {
  if (!isUrl(url.href)) return null;

  return (
    <div className="flex items-center gap-x-1.5">
      {!iconOnRight && (icon ?? <i className="ph ph-bold ph-link text-primary" />)}
      <a
        href={url.href}
        target="_blank"
        rel="noreferrer noopener nofollow"
        className={cn("inline-block", className)}
      >
        {label ?? (url.label || url.href)}
      </a>
      {iconOnRight && (icon ?? <i className="ph ph-bold ph-link text-primary" />)}
    </div>
  );
};
```

**Features**:
- URL validation before rendering
- Default icon: Link icon from Phosphor library
- Icon position toggle (left/right)
- Security: `rel="noreferrer noopener nofollow"`
- Label fallback: label → url.label → url.href

#### LinkedEntity Component

**File**: `apps/artboard/src/templates/azurill.tsx:156-168`

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

**Logic**:
- If `separateLinks=false` and URL exists → render as clickable link with globe icon
- Otherwise → render plain text (URL shown separately below)

#### Section Mapper

**File**: `apps/artboard/src/templates/azurill.tsx:503-550`

```typescript
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
    default: {
      if (section.startsWith("custom.")) return <Custom id={section.split(".")[1]} />;
      return null;
    }
  }
};
```

**Pattern**: Switch statement mapping section IDs to React components. Custom sections extracted from `"custom.{id}"` format.

---

## Customization System

### 1. Template Selection

**File**: `apps/client/src/pages/builder/sidebars/right/sections/template.tsx:10-51`

```typescript
export const TemplateSection = () => {
  const setValue = useResumeStore((state) => state.setValue);
  const currentTemplate = useResumeStore((state) => state.resume.data.metadata.template);

  return (
    <section id="template" className="grid gap-y-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-x-4">
          <SectionIcon id="template" size={18} name={t`Template`} />
          <h2 className="line-clamp-1 text-2xl font-bold lg:text-3xl">{t`Template`}</h2>
        </div>
      </header>

      <main className="grid grid-cols-2 gap-8 @lg/right:grid-cols-3 @2xl/right:grid-cols-4">
        {templatesList.map((template, index) => (
          <AspectRatio key={template} ratio={1 / 1.4142}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: index * 0.1 } }}
              whileTap={{ scale: 0.98, transition: { duration: 0.1 } }}
              className={cn(
                "relative cursor-pointer rounded-sm ring-primary transition-all hover:ring-2",
                currentTemplate === template && "ring-2",
              )}
              onClick={() => {
                setValue("metadata.template", template);
              }}
            >
              <img src={`/templates/jpg/${template}.jpg`} alt={template} className="rounded-sm" />

              <div className="absolute inset-x-0 bottom-0 h-32 w-full bg-gradient-to-b from-transparent to-background/80">
                <p className="absolute inset-x-0 bottom-2 text-center font-bold capitalize text-primary">
                  {template}
                </p>
              </div>
            </motion.div>
          </AspectRatio>
        ))}
      </main>
    </section>
  );
};
```

**Features**:
- Grid layout (2-4 columns based on screen size)
- Preview images from `/public/templates/jpg/`
- Framer Motion stagger animation (0.1s delay per template)
- Active template highlighted with ring
- Single click to switch templates

**Template Images Location**: `apps/client/public/templates/jpg/{template}.jpg`

### 2. Layout Customization (Drag & Drop)

**File**: `apps/client/src/pages/builder/sidebars/right/sections/layout.tsx:110-271`

**Key Libraries**:
- `@dnd-kit/core`: Core drag-and-drop functionality
- `@dnd-kit/sortable`: Sortable list behavior
- `@dnd-kit/utilities`: CSS transform utilities

**Layout State Structure** (line 112):
```typescript
const layout = useResumeStore((state) => state.resume.data.metadata.layout);
// layout[pageIndex][columnIndex] = ["section-id-1", "section-id-2", ...]
```

**Drag Handlers** (lines 131-159):

```typescript
const onDragEvent = ({ active, over }: DragOverEvent | DragEndEvent) => {
  if (!over || !active.data.current) return;

  const currentPayload = active.data.current.sortable as SortablePayload | null;
  const current = parseLayoutLocator(currentPayload);

  if (active.id === over.id) return;

  if (!over.data.current) {
    const [page, column] = (over.id as string).split(".").map(Number);
    const target = { page, column, section: 0 } as LayoutLocator;

    const newLayout = moveItemInLayout(current, target, layout);
    setValue("metadata.layout", newLayout);

    return;
  }

  const targetPayload = over.data.current.sortable as SortablePayload | null;
  const target = parseLayoutLocator(targetPayload);

  const newLayout = moveItemInLayout(current, target, layout);
  setValue("metadata.layout", newLayout);
};
```

**Layout Utilities** (`libs/utils/src/namespaces/array.ts:29-52`):

```typescript
export const moveItemInLayout = (
  current: LayoutLocator,
  target: LayoutLocator,
  layout: string[][][],
): string[][][] => {
  try {
    const newLayout = JSON.parse(JSON.stringify(layout));  // Deep clone

    const item = newLayout[current.page][current.column][current.section];

    newLayout[current.page][current.column].splice(current.section, 1);  // Remove from source
    newLayout[target.page][target.column].splice(target.section, 0, item);  // Insert at target

    return newLayout;
  } catch {
    return layout;  // Fallback on error
  }
};
```

**Add/Remove Pages** (lines 161-178):

```typescript
const onAddPage = () => {
  const layoutCopy = JSON.parse(JSON.stringify(layout));
  layoutCopy.push([[], []]);  // New page with 2 empty columns
  setValue("metadata.layout", layoutCopy);
};

const onRemovePage = (page: number) => {
  const layoutCopy = JSON.parse(JSON.stringify(layout));

  layoutCopy[0][0].push(...layoutCopy[page][0]); // Move Main sections to Page 1
  layoutCopy[0][1].push(...layoutCopy[page][1]); // Move Sidebar sections to Page 1

  layoutCopy.splice(page, 1);  // Remove page

  setValue("metadata.layout", layoutCopy);
};
```

**Reset Layout** (lines 180-196):
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

### 3. Theme Customization

**File**: `apps/client/src/pages/builder/sidebars/right/sections/theme.tsx:11-134`

**Color Palette** (lines 25-40):
```typescript
<div className="mb-2 grid grid-cols-6 flex-wrap justify-items-center gap-y-4 @xs/right:grid-cols-9">
  {colors.map((color) => (
    <div
      key={color}
      className={cn(
        "flex size-6 cursor-pointer items-center justify-center rounded-full ring-primary ring-offset-1 ring-offset-background transition-shadow hover:ring-1",
        theme.primary === color && "ring-1",
      )}
      onClick={() => {
        setValue("metadata.theme.primary", color);
      }}
    >
      <div className="size-5 rounded-full" style={{ backgroundColor: color }} />
    </div>
  ))}
</div>
```

**Color Picker** (lines 42-69):
```typescript
<div className="space-y-1.5">
  <Label htmlFor="theme.primary">{t`Primary Color`}</Label>
  <div className="relative">
    <Popover>
      <PopoverTrigger asChild>
        <div
          className="absolute inset-y-0 left-3 my-2.5 size-4 cursor-pointer rounded-full ring-primary ring-offset-2 ring-offset-background transition-shadow hover:ring-1"
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
</div>
```

**Three Color Controls**:
1. Primary color (accent color for headings, icons, borders)
2. Background color
3. Text color

**Library**: `react-colorful` for hex color picker

### 4. Typography Customization

**File**: `apps/client/src/pages/builder/sidebars/right/sections/typography.tsx:37-209`

**Font Family Selection** (lines 82-104):
```typescript
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
          "flex h-12 items-center justify-center overflow-hidden rounded border text-center text-xs ring-primary transition-colors hover:bg-secondary-accent focus:outline-none focus:ring-1 disabled:opacity-100 lg:text-sm",
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

**Font Suggestions** (lines 14-28):
```typescript
const localFonts = ["Arial", "Cambria", "Garamond", "Times New Roman"];

const fontSuggestions = [
  ...localFonts,
  "IBM Plex Sans",
  "IBM Plex Serif",
  "Lato",
  "Lora",
  "Merriweather",
  "Open Sans",
  "Playfair Display",
  "PT Sans",
  "PT Serif",
  "Roboto Condensed",
];
```

**Font Loading** (lines 44-58):
```typescript
const loadFontSuggestions = useCallback(() => {
  for (const font of fontSuggestions) {
    if (localFonts.includes(font)) continue;

    webfontloader.load({
      events: false,
      classes: false,
      google: { families: [font], text: font },  // Load only font name characters
    });
  }
}, [fontSuggestions]);

useEffect(() => {
  loadFontSuagestions();
}, []);
```

**Typography Controls**:
- **Font Family**: 13+ preset fonts + 900+ Google Fonts via Combobox
- **Font Subset**: Latin, Cyrillic, Greek, etc.
- **Font Variants**: Regular, Bold, Italic, etc. (multi-select)
- **Font Size**: 6-18px slider
- **Line Height**: 0-3 slider
- **Hide Icons**: Toggle
- **Underline Links**: Toggle

**Dynamic Font Metadata** (`libs/utils/src/namespaces/fonts.ts`):
- 438KB file containing metadata for 900+ Google Fonts
- Includes family, variants, subsets for each font

### 5. Page Settings

**File**: `apps/client/src/pages/builder/sidebars/right/sections/page.tsx`

**Page Format** (A4 vs Letter):
```typescript
<Select
  value={page.format}
  onValueChange={(value) => {
    setValue("metadata.page.format", value);
  }}
>
  <SelectTrigger>
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="a4">A4 (210mm × 297mm)</SelectItem>
    <SelectItem value="letter">Letter (216mm × 279mm)</SelectItem>
  </SelectContent>
</Select>
```

**Page Margin** (Slider):
```typescript
<Slider
  min={0}
  max={36}
  step={1}
  value={[page.margin]}
  onValueChange={(value) => {
    setValue("metadata.page.margin", value[0]);
  }}
/>
```

**Page Options** (Toggles):
- `breakLine`: Show page break line in builder
- `pageNumbers`: Show page numbers in builder

### 6. Custom CSS

**File**: `apps/client/src/pages/builder/sidebars/right/sections/css.tsx`

```typescript
<Textarea
  rows={10}
  value={css.value}
  className="font-mono text-xs"
  onChange={(event) => {
    setValue("metadata.css.value", event.target.value);
  }}
/>

<Switch
  id="metadata.css.visible"
  checked={css.visible}
  onCheckedChange={(checked) => {
    setValue("metadata.css.visible", checked);
  }}
/>
```

**CSS Injection** (`apps/artboard/src/pages/artboard.tsx:64-68`):
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

**Default CSS** (metadata schema):
```css
* {
  outline: 1px solid #000;
  outline-offset: 4px;
}
```

---

## Rendering System

### 1. Live Preview (Builder Mode)

**Architecture**: Client app embeds artboard app in iframe with postMessage communication.

**Artboard Route**: `/artboard/builder`

**File**: `apps/artboard/src/pages/builder.tsx:13-84`

```typescript
export const BuilderLayout = () => {
  const [wheelPanning, setWheelPanning] = useState(true);
  const transformRef = useRef<ReactZoomPanPinchRef>(null);

  const layout = useArtboardStore((state) => state.resume.metadata.layout);
  const format = useArtboardStore((state) => state.resume.metadata.page.format);
  const template = useArtboardStore((state) => state.resume.metadata.template as Template);

  const Template = useMemo(() => getTemplate(template), [template]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data.type === "ZOOM_IN") transformRef.current?.zoomIn(0.2);
      if (event.data.type === "ZOOM_OUT") transformRef.current?.zoomOut(0.2);
      if (event.data.type === "CENTER_VIEW") transformRef.current?.centerView();
      if (event.data.type === "RESET_VIEW") {
        transformRef.current?.resetTransform(0);
        setTimeout(() => transformRef.current?.centerView(0.8, 0), 10);
      }
      if (event.data.type === "TOGGLE_PAN_MODE") {
        setWheelPanning(event.data.panMode);
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [transformRef]);

  return (
    <TransformWrapper
      ref={transformRef}
      centerOnInit
      maxScale={2}
      minScale={0.4}
      initialScale={0.8}
      limitToBounds={false}
      wheel={{ wheelDisabled: wheelPanning }}
      panning={{ wheelPanning: wheelPanning }}
    >
      <TransformComponent
        wrapperClass="!w-screen !h-screen"
        contentClass="grid items-start justify-center space-x-12 pointer-events-none"
        contentStyle={{
          width: `${layout.length * (pageSizeMap[format].width * MM_TO_PX + 42)}px`,
          gridTemplateColumns: `repeat(${layout.length}, 1fr)`,
        }}
      >
        <AnimatePresence>
          {layout.map((columns, pageIndex) => (
            <motion.div
              key={pageIndex}
              layout
              initial={{ opacity: 0, x: -200, y: 0 }}
              animate={{ opacity: 1, x: 0, transition: { delay: pageIndex * 0.3 } }}
              exit={{ opacity: 0, x: -200 }}
            >
              <Page mode="builder" pageNumber={pageIndex + 1}>
                <Template isFirstPage={pageIndex === 0} columns={columns as SectionKey[][]} />
              </Page>
            </motion.div>
          ))}
        </AnimatePresence>
      </TransformComponent>
    </TransformWrapper>
  );
};
```

**Features**:
- **Zoom/Pan Controls**: `react-zoom-pan-pinch` library
  - Min scale: 0.4x, Max scale: 2x, Initial: 0.8x
  - PostMessage API for external zoom controls
- **Framer Motion**: Page animations (0.3s stagger per page)
- **Multi-page Layout**: Horizontal grid layout for all pages
- **Responsive Width**: Calculated based on page count and format

### 2. PDF Rendering (Server-Side)

**Architecture**: Puppeteer headless Chrome renders artboard app and captures PDF.

**Artboard Route**: `/artboard/preview`

**File**: `apps/artboard/src/pages/preview.tsx:9-25`

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

**Differences from Builder**:
- No zoom/pan wrapper
- No animations
- Clean HTML output

**Server PDF Generation** (`apps/server/src/printer/printer.service.ts:93-233`):

**Step 1: Navigate to Preview Page**
```typescript
await page.goto(`${url}/artboard/preview`, { waitUntil: "domcontentloaded" });

await page.evaluate((data) => {
  window.localStorage.setItem("resume", JSON.stringify(data));
}, resume.data);

await Promise.all([
  page.reload({ waitUntil: "load" }),
  page.waitForSelector('[data-page="1"]', { timeout: 15_000 }),
]);
```

**Step 2: Wait for Images**
```typescript
if (resume.data.basics.picture.url) {
  await page.waitForSelector('img[alt="Profile"]');
  await page.evaluate(() =>
    Promise.all(
      Array.from(document.images).map((img) => {
        if (img.complete) return Promise.resolve();
        return new Promise((resolve) => {
          img.onload = img.onerror = resolve;
        });
      }),
    ),
  );
}
```

**Step 3: Process Each Page**
```typescript
const processPage = async (index: number) => {
  const pageElement = await page.$(`[data-page="${index}"]`);
  const width = (await (await pageElement?.getProperty("scrollWidth"))?.jsonValue()) ?? 0;
  const height = (await (await pageElement?.getProperty("scrollHeight"))?.jsonValue()) ?? 0;

  const temporaryHtml = await page.evaluate((element: HTMLDivElement) => {
    const clonedElement = element.cloneNode(true) as HTMLDivElement;
    const temporaryHtml_ = document.body.innerHTML;
    document.body.innerHTML = clonedElement.outerHTML;
    return temporaryHtml_;
  }, pageElement);

  // Apply custom CSS, if enabled
  const css = resume.data.metadata.css;
  if (css.visible) {
    await page.evaluate((cssValue: string) => {
      const styleTag = document.createElement("style");
      styleTag.textContent = cssValue;
      document.head.append(styleTag);
    }, css.value);
  }

  const uint8array = await page.pdf({ width, height, printBackground: true });
  const buffer = Buffer.from(uint8array);
  pagesBuffer.push(buffer);

  await page.evaluate((temporaryHtml_: string) => {
    document.body.innerHTML = temporaryHtml_;
  }, temporaryHtml);
};

for (let index = 1; index <= numberPages; index++) {
  await processPage(index);
}
```

**Step 4: Merge PDFs with pdf-lib**
```typescript
const pdf = await PDFDocument.create();

for (const element of pagesBuffer) {
  const page = await PDFDocument.load(element);
  const [copiedPage] = await pdf.copyPages(page, [0]);
  pdf.addPage(copiedPage);
}

const buffer = Buffer.from(await pdf.save());
```

**Step 5: Upload to Minio**
```typescript
const resumeUrl = await this.storageService.uploadObject(
  resume.userId,
  "resumes",
  buffer,
  resume.title,
);
```

**Performance** (line 65-68):
```typescript
const duration = +(performance.now() - start).toFixed(0);
const numberPages = resume.data.metadata.layout.length;

this.logger.debug(`Chrome took ${duration}ms to print ${numberPages} page(s)`);
```

**Retry Strategy** (line 56-63):
```typescript
const url = await retry<string | undefined>(() => this.generateResume(resume), {
  retries: 3,
  randomize: true,
  onRetry: (_, attempt) => {
    this.logger.log(`Retrying to print resume #${resume.id}, attempt #${attempt}`);
  },
});
```

### 3. Font Loading

**File**: `apps/artboard/src/pages/artboard.tsx:12-30`

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

**Font String Format**: `{family}:{variants}:{subset}`
- Example: `IBM Plex Serif:regular,italic,600:latin`

**Post-Load Message**: Notify parent window when fonts loaded + DOM ready

### 4. Theme CSS Variables

**File**: `apps/artboard/src/pages/artboard.tsx:32-47`

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

**CSS Variables Set**:
- `--margin`: Page margin
- `--font-size`: Base font size
- `--line-height`: Line height
- `--color-foreground`: Text color
- `--color-primary`: Accent color
- `--color-background`: Background color

**Typography Options** (lines 49-58):
```typescript
useEffect(() => {
  const elements = Array.from(document.querySelectorAll(`[data-page]`));

  for (const el of elements) {
    el.classList.toggle("hide-icons", metadata.typography.hideIcons);
    el.classList.toggle("underline-links", metadata.typography.underlineLinks);
  }
}, [metadata]);
```

**CSS Classes** (`apps/artboard/src/styles/main.css:19-25`):
```css
[data-page].hide-icons .ph {
  @apply hidden;
}

[data-page].underline-links a {
  @apply underline underline-offset-2;
}
```

### 5. Wysiwyg Content Rendering

**HTML Sanitization** (`libs/utils/src/namespaces/string.ts:60-150`):

```typescript
export const sanitize = (html: string, options?: sanitizeHtml.IOptions) => {
  const allowedTags = (options?.allowedTags ?? []) as string[];

  return sanitizeHtml(html, {
    ...options,
    allowedTags: [
      ...allowedTags,
      "a", "abbr", "address", "article", "aside", "b", "bdi", "bdo", "blockquote", "br",
      "caption", "cite", "code", "col", "colgroup", "data", "dd", "dfn", "div", "dl", "dt",
      "em", "figcaption", "figure", "footer", "h1", "h2", "h3", "h4", "h5", "h6", "header",
      "hgroup", "hr", "i", "img", "kbd", "li", "main", "mark", "nav", "ol", "p", "pre", "q",
      "rb", "rp", "rt", "rtc", "ruby", "s", "samp", "section", "small", "span", "strong",
      "sub", "sup", "table", "tbody", "td", "tfoot", "th", "thead", "time", "tr", "u", "ul",
      "var", "wbr",
    ],
    allowedAttributes: {
      ...options?.allowedAttributes,
      "*": ["class", "style"],
      a: ["href", "target"],
      img: ["src", "alt"],
    },
    allowedStyles: {
      ...options?.allowedStyles,
      "*": { "text-align": [/^left$/, /^right$/, /^center$/, /^justify$/] },
    },
  });
};
```

**Wysiwyg Styles** (`apps/artboard/src/styles/main.css:27-29`):
```css
.wysiwyg {
  @apply prose-foreground prose max-w-none prose-headings:mb-2 prose-headings:mt-0 prose-p:mb-2 prose-p:mt-0 prose-p:leading-normal prose-a:break-all prose-ol:mb-2 prose-ol:mt-0 prose-ul:mb-2 prose-ul:mt-0 prose-li:mb-2 prose-li:mt-0 prose-li:leading-normal prose-img:mb-2 prose-img:mt-0 prose-hr:mb-2 prose-hr:mt-0;
}
```

**Usage in Templates** (Example: Summary section):
```typescript
<div
  dangerouslySetInnerHTML={{ __html: sanitize(section.content) }}
  style={{ columns: section.columns }}
  className="wysiwyg"
/>
```

---

## Key Innovations

### 1. Isolated Artboard Architecture

**Problem**: PDF rendering with builder UI elements (sidebars, toolbars) visible in output.

**Solution**: Separate standalone React app (`artboard`) for rendering only.

**Benefits**:
- Clean PDF output without UI pollution
- Easier testing of template rendering
- Independent deployment/optimization
- Simplified CSS (no UI framework conflicts)

### 2. Three-Dimensional Layout Array

**Problem**: Flexible multi-page, multi-column section arrangement.

**Solution**: `layout[page][column][section]` array structure.

**Example**:
```typescript
[
  [  // Page 1
    ["experience", "education", "projects"],  // Main column
    ["skills", "languages"]                   // Sidebar column
  ],
  [  // Page 2
    ["volunteer", "certifications"],          // Main column
    ["interests"]                             // Sidebar column
  ]
]
```

**Benefits**:
- Drag-and-drop implementation with `@dnd-kit`
- Easy section visibility toggling
- Multi-column layouts within pages
- Unlimited pages support

### 3. Template-Agnostic Data Model

**Problem**: Different templates need different data structures.

**Solution**: Comprehensive Zod schema covering all possible resume sections.

**Benefits**:
- Zero data loss when switching templates
- Type-safe data access across entire app
- Runtime validation
- Easy custom section creation

### 4. Per-Page PDF Processing

**Problem**: Multi-page PDFs with variable heights causing rendering issues.

**Solution**: Render each page individually, then merge with `pdf-lib`.

**Benefits**:
- Correct page dimensions (no overflow/clipping)
- Custom CSS per page (if needed)
- Parallel processing potential
- Accurate page breaks

**Code** (`apps/server/src/printer/printer.service.ts:160-192`):
```typescript
const pagesBuffer: Buffer[] = [];

const processPage = async (index: number) => {
  const pageElement = await page.$(`[data-page="${index}"]`);
  const width = (await (await pageElement?.getProperty("scrollWidth"))?.jsonValue()) ?? 0;
  const height = (await (await pageElement?.getProperty("scrollHeight"))?.jsonValue()) ?? 0;

  const temporaryHtml = await page.evaluate((element: HTMLDivElement) => {
    const clonedElement = element.cloneNode(true) as HTMLDivElement;
    const temporaryHtml_ = document.body.innerHTML;
    document.body.innerHTML = clonedElement.outerHTML;
    return temporaryHtml_;
  }, pageElement);

  const uint8array = await page.pdf({ width, height, printBackground: true });
  const buffer = Buffer.from(uint8array);
  pagesBuffer.push(buffer);

  await page.evaluate((temporaryHtml_: string) => {
    document.body.innerHTML = temporaryHtml_;
  }, temporaryHtml);
};

for (let index = 1; index <= numberPages; index++) {
  await processPage(index);
}

const pdf = await PDFDocument.create();
for (const element of pagesBuffer) {
  const page = await PDFDocument.load(element);
  const [copiedPage] = await pdf.copyPages(page, [0]);
  pdf.addPage(copiedPage);
}
```

### 5. Generic Section Component Pattern

**Problem**: Code duplication across templates for similar section rendering.

**Solution**: Parameterized `<Section<T>>` component with render props.

**Code** (`apps/artboard/src/templates/azurill.tsx:180-248`):
```typescript
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

      <div
        className="grid gap-x-6 gap-y-3 group-[.sidebar]:mx-auto group-[.sidebar]:text-center"
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
              <div key={item.id} className={cn("relative space-y-2", className)}>
                <div>{children?.(item as T)}</div>

                {summary !== undefined && !isEmptyString(summary) && (
                  <div dangerouslySetInnerHTML={{ __html: sanitize(summary) }} className="wysiwyg" />
                )}

                {level !== undefined && level > 0 && <Rating level={level} />}

                {keywords !== undefined && keywords.length > 0 && (
                  <p className="text-sm">{keywords.join(", ")}</p>
                )}

                {url !== undefined && section.separateLinks && <Link url={url} />}
              </div>
            );
          })}
      </div>
    </section>
  );
};
```

**Usage**:
```typescript
<Section<Experience> section={section} urlKey="url" summaryKey="summary">
  {(item) => (
    <div>
      <LinkedEntity name={item.company} url={item.url} separateLinks={section.separateLinks} className="font-bold" />
      <div>{item.position}</div>
      <div>{item.location}</div>
      <div className="font-bold">{item.date}</div>
    </div>
  )}
</Section>
```

**Benefits**:
- DRY principle (single source of logic)
- Type-safe with generics
- Consistent section behavior
- Easy to customize per template

### 6. CSS Group Selectors for Layout Variants

**Problem**: Different styling for sidebar vs main column sections.

**Solution**: CSS group selectors with Tailwind's `group-[.sidebar]:` and `group-[.main]:` modifiers.

**Code** (`apps/artboard/src/templates/azurill.tsx:552-576`):
```typescript
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
```

**Section Header Styling** (`apps/artboard/src/templates/azurill.tsx:193-200`):
```typescript
<div className="mb-2 hidden font-bold text-primary group-[.main]:block">
  <h4>{section.name}</h4>
</div>

<div className="mx-auto mb-2 hidden items-center gap-x-2 text-center font-bold text-primary group-[.sidebar]:flex">
  <div className="size-1.5 rounded-full border border-primary" />
  <h4>{section.name}</h4>
  <div className="size-1.5 rounded-full border border-primary" />
</div>
```

**Result**: Same component renders differently based on parent container class.

---

## Patterns to Adopt

### 1. Zod Schema-Driven Architecture

**Why**:
- Single source of truth for data structure
- Runtime validation prevents corrupt data
- Auto-generated TypeScript types
- Easy defaults and migrations

**Implementation**:
```typescript
// Schema definition
export const resumeDataSchema = z.object({
  basics: basicsSchema,
  sections: sectionsSchema,
  metadata: metadataSchema,
});

// Type inference
export type ResumeData = z.infer<typeof resumeDataSchema>;

// Default values
export const defaultResumeData: ResumeData = {
  basics: defaultBasics,
  sections: defaultSections,
  metadata: defaultMetadata,
};
```

**Benefit for Us**: Consistent data model across client, server, and rendering layers.

### 2. Monorepo with Shared Libraries

**Structure**:
```
apps/
  client/          # Builder UI
  artboard/        # Template renderer
  server/          # Backend API
libs/
  schema/          # Zod schemas
  utils/           # Shared utilities
  ui/              # Shared UI components
  dto/             # Data transfer objects
```

**Why**:
- Code reuse across apps
- Shared type definitions
- Unified build system (Nx)
- Easy refactoring

**Benefit for Us**: Easier to maintain consistency between editor and preview.

### 3. Separation of Editor and Renderer

**Why**:
- Clean PDF output
- Independent optimization
- Easier testing
- Simpler CSS

**Implementation**:
- **Editor**: Full builder UI with sidebars, toolbars, drag-and-drop
- **Renderer**: Minimal app with only template rendering

**Communication**: PostMessage API or LocalStorage for data transfer

**Benefit for Us**: Our current architecture could benefit from this separation.

### 4. Template as Pure React Components

**Why**:
- Leverage React ecosystem
- Easy styling with Tailwind
- Component reusability
- Simple data binding

**Pattern**:
```typescript
// Template component
export const MyTemplate = ({ columns, isFirstPage }: TemplateProps) => {
  const [main, sidebar] = columns;

  return (
    <div>
      {isFirstPage && <Header />}
      <div className="grid grid-cols-3">
        <Sidebar sections={sidebar} />
        <Main sections={main} />
      </div>
    </div>
  );
};

// Section components
const Experience = () => {
  const section = useStore((state) => state.resume.sections.experience);
  return <Section section={section} urlKey="url" summaryKey="summary">...</Section>;
};
```

**Benefit for Us**: We're already using React, this pattern would fit naturally.

### 5. Generic Section Component with Render Props

**Why**:
- DRY principle
- Consistent behavior
- Type-safe
- Flexible customization

**Pattern**:
```typescript
const Section = <T,>({
  section,
  children,
  urlKey,
  levelKey,
  summaryKey,
  keywordsKey,
}: SectionProps<T>) => {
  // Common logic: visibility, columns, URL, level, summary, keywords
  return (
    <section>
      <h4>{section.name}</h4>
      <div style={{ gridTemplateColumns: `repeat(${section.columns}, 1fr)` }}>
        {section.items.map((item) => (
          <div key={item.id}>
            {children?.(item as T)}
            {/* Render URL, level, summary, keywords based on props */}
          </div>
        ))}
      </div>
    </section>
  );
};
```

**Benefit for Us**: Could significantly reduce code in our templates.

### 6. Multi-Dimensional Layout Array

**Why**:
- Flexible page layouts
- Easy drag-and-drop
- Multi-column support
- Section reordering

**Structure**:
```typescript
type Layout = SectionKey[][][];  // [page][column][section]

// Example
const layout: Layout = [
  [  // Page 1
    ["summary", "experience", "education"],  // Main
    ["skills", "languages"]                  // Sidebar
  ],
  [  // Page 2
    ["projects", "certifications"],
    ["interests"]
  ]
];
```

**Utilities**:
```typescript
export const moveItemInLayout = (
  current: LayoutLocator,
  target: LayoutLocator,
  layout: Layout,
): Layout => {
  const newLayout = JSON.parse(JSON.stringify(layout));
  const item = newLayout[current.page][current.column][current.section];
  newLayout[current.page][current.column].splice(current.section, 1);
  newLayout[target.page][target.column].splice(target.section, 0, item);
  return newLayout;
};
```

**Benefit for Us**: Our current section ordering could use this approach.

### 7. Zustand + Immer + Temporal for State

**Why**:
- Lightweight (no Redux boilerplate)
- Immer: Mutable syntax, immutable updates
- Temporal: Built-in undo/redo
- Devtools integration

**Pattern**:
```typescript
export const useResumeStore = create<ResumeStore>()(
  temporal(
    immer((set) => ({
      resume: {} as ResumeDto,
      setValue: (path, value) => {
        set((state) => {
          state.resume.data = _set(state.resume.data, path, value);  // lodash.set
          void debouncedUpdateResume(state.resume);
        });
      },
    })),
    { limit: 100 },  // 100 undo/redo states
  ),
);
```

**Benefit for Us**: Our current Zustand store could add temporal middleware for undo/redo.

### 8. Tailwind with CSS Variables for Theming

**Why**:
- Dynamic theming without CSS-in-JS overhead
- CSS variables for runtime color changes
- Tailwind for utility classes

**Pattern**:
```typescript
// Set CSS variables
useEffect(() => {
  document.documentElement.style.setProperty("--color-primary", theme.primary);
  document.documentElement.style.setProperty("--color-background", theme.background);
  document.documentElement.style.setProperty("--color-foreground", theme.text);
}, [theme]);
```

```css
/* Tailwind config */
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: "var(--color-primary)",
        background: "var(--color-background)",
        foreground: "var(--color-foreground)",
      },
    },
  },
};
```

```tsx
// Usage
<div className="bg-primary text-background">...</div>
```

**Benefit for Us**: Clean theming without re-rendering entire app.

### 9. Per-Page PDF Processing with pdf-lib

**Why**:
- Correct page dimensions
- No overflow/clipping
- Variable page heights
- Cleaner code

**Pattern**:
```typescript
const pagesBuffer: Buffer[] = [];

for (let pageIndex = 1; pageIndex <= numPages; pageIndex++) {
  const pageElement = await page.$(`[data-page="${pageIndex}"]`);
  const { width, height } = await pageElement.boundingBox();

  // Isolate page content
  const originalHtml = await page.evaluate((el) => {
    const clone = el.cloneNode(true);
    const temp = document.body.innerHTML;
    document.body.innerHTML = clone.outerHTML;
    return temp;
  }, pageElement);

  // Render PDF
  const pdfBuffer = await page.pdf({ width, height, printBackground: true });
  pagesBuffer.push(pdfBuffer);

  // Restore
  await page.evaluate((html) => { document.body.innerHTML = html; }, originalHtml);
}

// Merge PDFs
const pdf = await PDFDocument.create();
for (const buffer of pagesBuffer) {
  const page = await PDFDocument.load(buffer);
  const [copiedPage] = await pdf.copyPages(page, [0]);
  pdf.addPage(copiedPage);
}
```

**Benefit for Us**: Could solve our multi-page PDF rendering issues.

### 10. HTML Sanitization for Rich Text

**Why**:
- XSS protection
- Consistent styling
- Limited HTML tags
- Safe user input

**Pattern**:
```typescript
import sanitizeHtml from "sanitize-html";

export const sanitize = (html: string) => {
  return sanitizeHtml(html, {
    allowedTags: [
      "a", "b", "i", "u", "strong", "em", "p", "br", "ul", "ol", "li",
      "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "code",
    ],
    allowedAttributes: {
      "*": ["class", "style"],
      a: ["href", "target"],
    },
    allowedStyles: {
      "*": { "text-align": [/^left$/, /^right$/, /^center$/, /^justify$/] },
    },
  });
};

// Usage
<div dangerouslySetInnerHTML={{ __html: sanitize(userContent) }} className="wysiwyg" />
```

**Benefit for Us**: Essential for our rich text editor.

---

## Technology Insights

### 1. React + TypeScript + Zod Stack

**Rationale**: Type safety from schema to UI.

**Flow**:
```
Zod Schema → TypeScript Types → React Components → Runtime Validation
```

**Example**:
```typescript
// Schema
export const experienceSchema = itemSchema.extend({
  company: z.string().min(1),
  position: z.string(),
  date: z.string(),
});

// Auto-generated type
export type Experience = z.infer<typeof experienceSchema>;

// Component usage (fully typed)
const Experience = () => {
  const section = useStore((state) => state.resume.sections.experience);  // Type: SectionWithItem<Experience>

  return (
    <Section<Experience> section={section}>
      {(item) => (
        <div>
          <div>{item.company}</div>  {/* TypeScript knows this exists */}
          <div>{item.position}</div>
        </div>
      )}
    </Section>
  );
};
```

**Benefit**: Catch errors at compile time, not runtime.

### 2. NestJS Backend

**Why NestJS**:
- TypeScript-native
- Modular architecture (services, controllers, modules)
- Built-in dependency injection
- Easy Puppeteer integration
- OpenAPI/Swagger auto-generation

**Structure**:
```
apps/server/src/
├── printer/
│   ├── printer.module.ts
│   └── printer.service.ts
├── storage/
│   ├── storage.module.ts
│   └── storage.service.ts
└── resume/
    ├── resume.module.ts
    ├── resume.controller.ts
    └── resume.service.ts
```

**Benefit**: Clean separation of concerns, easy to test.

### 3. Puppeteer for PDF Generation

**Why Puppeteer over other solutions**:
- Real browser rendering (accurate CSS)
- Handles Google Fonts
- Supports custom CSS
- Page-level control
- Screenshots for previews

**Alternatives**:
- **Playwright**: Similar to Puppeteer, could be swapped easily
- **jsPDF**: Client-side, but limited CSS support
- **PDFKit**: Node.js, requires manual layout

**Benefit**: Pixel-perfect PDFs matching browser preview.

### 4. Minio for Object Storage

**Why Minio**:
- S3-compatible API
- Self-hostable (no AWS lock-in)
- Open source
- Easy Docker deployment

**Usage**:
```typescript
await this.storageService.uploadObject(
  userId,
  "resumes",
  pdfBuffer,
  resumeTitle,
);
```

**Benefit**: Cloud-agnostic storage layer.

### 5. Nx Monorepo

**Why Nx**:
- Shared libraries across apps
- Incremental builds
- Dependency graph visualization
- Code generation (scaffolding)
- Caching for faster builds

**Workspace Structure**:
```json
{
  "projects": {
    "client": { "root": "apps/client" },
    "artboard": { "root": "apps/artboard" },
    "server": { "root": "apps/server" },
    "@reactive-resume/schema": { "root": "libs/schema" },
    "@reactive-resume/utils": { "root": "libs/utils" },
    "@reactive-resume/ui": { "root": "libs/ui" }
  }
}
```

**Benefit**: Easy to maintain multiple apps with shared code.

### 6. Tailwind CSS

**Why Tailwind**:
- Utility-first (no CSS files needed)
- Purge unused CSS (small bundle)
- JIT compiler (fast builds)
- Easy theming with CSS variables

**Config** (`tailwind.config.js`):
```javascript
module.exports = {
  content: [
    "./apps/*/src/**/*.{ts,tsx}",
    "./libs/*/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "var(--color-primary)",
        background: "var(--color-background)",
        foreground: "var(--color-foreground)",
      },
      padding: {
        custom: "var(--margin)",
      },
    },
  },
};
```

**Benefit**: Rapid UI development without context switching.

### 7. Radix UI + Shadcn/ui

**Why Radix**:
- Unstyled, accessible primitives
- WAI-ARIA compliant
- Headless components (bring your own styles)

**Why Shadcn**:
- Pre-styled Radix components
- Copy-paste, not npm install
- Full customization
- Tailwind-based

**Usage**:
```tsx
import { Button } from "@reactive-resume/ui";

<Button variant="outline" onClick={onSave}>
  Save Resume
</Button>
```

**Benefit**: Accessible UI out of the box.

### 8. Framer Motion for Animations

**Why Framer Motion**:
- Declarative animations
- Layout animations (automatic)
- Gesture support
- AnimatePresence for exit animations

**Usage** (`apps/artboard/src/pages/builder.tsx:66-80`):
```tsx
<AnimatePresence>
  {layout.map((columns, pageIndex) => (
    <motion.div
      key={pageIndex}
      layout
      initial={{ opacity: 0, x: -200, y: 0 }}
      animate={{ opacity: 1, x: 0, transition: { delay: pageIndex * 0.3 } }}
      exit={{ opacity: 0, x: -200 }}
    >
      <Page mode="builder" pageNumber={pageIndex + 1}>
        <Template isFirstPage={pageIndex === 0} columns={columns as SectionKey[][]} />
      </Page>
    </motion.div>
  ))}
</AnimatePresence>
```

**Benefit**: Smooth, professional animations with minimal code.

### 9. react-zoom-pan-pinch for Builder Preview

**Why**:
- Smooth zoom/pan controls
- Touch/mouse/wheel support
- Imperative API (for external controls)
- Lightweight

**Usage** (`apps/artboard/src/pages/builder.tsx:47-83`):
```tsx
<TransformWrapper
  ref={transformRef}
  centerOnInit
  maxScale={2}
  minScale={0.4}
  initialScale={0.8}
  wheel={{ wheelDisabled: wheelPanning }}
  panning={{ wheelPanning: wheelPanning }}
>
  <TransformComponent>
    {pages.map((page) => <Page {...page} />)}
  </TransformComponent>
</TransformWrapper>
```

**Benefit**: Professional preview experience.

### 10. @dnd-kit for Drag & Drop

**Why @dnd-kit**:
- Modern API (hooks-based)
- Accessible (keyboard support)
- Performant (no layout thrashing)
- Flexible (supports complex layouts)

**Usage** (`apps/client/src/pages/builder/sidebars/right/sections/layout.tsx:215-262`):
```tsx
<DndContext
  sensors={sensors}
  collisionDetection={closestCenter}
  onDragEnd={onDragEnd}
  onDragStart={onDragStart}
>
  {layout.map((page, pageIndex) => {
    const mainIndex = `${pageIndex}.0`;
    const sidebarIndex = `${pageIndex}.1`;

    return (
      <div key={pageIndex}>
        <SortableContext id={mainIndex} items={page[0]}>
          {page[0].map((section) => <SortableSection key={section} id={section} />)}
        </SortableContext>

        <SortableContext id={sidebarIndex} items={page[1]}>
          {page[1].map((section) => <SortableSection key={section} id={section} />)}
        </SortableContext>
      </div>
    );
  })}

  <DragOverlay>
    {activeId && <Section isDragging id={activeId} />}
  </DragOverlay>
</DndContext>
```

**Benefit**: Polished drag-and-drop with minimal code.

---

## Code Examples with Detailed Explanations

### Example 1: Template Component with Multi-Column Layout

**File**: `apps/artboard/src/templates/ditto.tsx:594-626`

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

        <div
          className={cn(
            "main p-custom group space-y-4",
            sidebar.length > 0 ? "col-span-2" : "col-span-3",
          )}
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

**Explanation**:
1. **Destructuring columns**: `const [main, sidebar] = columns;`
   - `columns` is a 2D array: `[["section1", "section2"], ["section3"]]`
   - First array = main column, second = sidebar

2. **Conditional header**: `{isFirstPage && <Header />}`
   - Only show header on first page
   - Prevents header duplication on multi-page resumes

3. **Absolute background**:
   ```tsx
   <div className="absolute inset-x-0 top-0 h-[85px] w-full bg-primary" />
   ```
   - Colored header background (85px tall)
   - Positioned absolutely behind header content

4. **Grid layout**: `grid grid-cols-3`
   - 3-column grid: sidebar (1/3) + main (2/3)

5. **Dynamic main column span**:
   ```tsx
   sidebar.length > 0 ? "col-span-2" : "col-span-3"
   ```
   - If sidebar has sections → main takes 2/3 width
   - If sidebar empty → main takes full width

6. **CSS group classes**: `group`
   - Enables `group-[.sidebar]:` and `group-[.main]:` modifiers
   - Child components style differently based on parent

7. **Section mapping**: `mapSectionToComponent(section)`
   - Dispatcher function that returns the correct component for each section ID

### Example 2: Generic Section Component with Conditional Rendering

**File**: `apps/artboard/src/templates/azurill.tsx:180-248`

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

      <div
        className="grid gap-x-6 gap-y-3 group-[.sidebar]:mx-auto group-[.sidebar]:text-center"
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
              <div
                key={item.id}
                className={cn(
                  "relative space-y-2",
                  "border-primary group-[.main]:border-l group-[.main]:pl-4",
                  className,
                )}
              >
                <div>{children?.(item as T)}</div>

                {summary !== undefined && !isEmptyString(summary) && (
                  <div
                    dangerouslySetInnerHTML={{ __html: sanitize(summary) }}
                    className="wysiwyg"
                  />
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

**Explanation**:

1. **Generic Type**: `<T,>`
   - Allows type-safe usage with any section item type (Experience, Education, Skill, etc.)
   - Example: `Section<Experience>` → `children` receives `Experience` type

2. **Optional Key Props**: `urlKey`, `levelKey`, `summaryKey`, `keywordsKey`
   - Not all sections have URL/level/summary/keywords
   - Only provided when needed

3. **Visibility Filter**:
   ```tsx
   if (!section.visible || section.items.filter((item) => item.visible).length === 0) return null;
   ```
   - Don't render section if hidden
   - Don't render section if all items hidden

4. **Dual Section Headers**:
   ```tsx
   <div className="mb-2 hidden font-bold text-primary group-[.main]:block">
     <h4>{section.name}</h4>
   </div>

   <div className="mx-auto mb-2 hidden items-center gap-x-2 text-center font-bold text-primary group-[.sidebar]:flex">
     <div className="size-1.5 rounded-full border border-primary" />
     <h4>{section.name}</h4>
     <div className="size-1.5 rounded-full border border-primary" />
   </div>
   ```
   - Both headers exist in DOM, but only one is visible
   - `group-[.main]:block` → visible when parent has `main` class
   - `group-[.sidebar]:flex` → visible when parent has `sidebar` class
   - Sidebar header has decorative dots

5. **Multi-Column Grid**:
   ```tsx
   style={{ gridTemplateColumns: `repeat(${section.columns}, 1fr)` }}
   ```
   - Dynamic column count (1-5)
   - Each column equal width

6. **Safe Property Access**: `lodash.get`
   ```tsx
   const url = (urlKey && get(item, urlKey)) as URL | undefined;
   ```
   - Safely access nested properties
   - Returns `undefined` if path doesn't exist

7. **Conditional Rendering**: Only render if property exists and non-empty
   ```tsx
   {summary !== undefined && !isEmptyString(summary) && (
     <div dangerouslySetInnerHTML={{ __html: sanitize(summary) }} className="wysiwyg" />
   )}
   ```

8. **Render Props Pattern**: `children?.(item as T)`
   - Template-specific item rendering
   - Parent component controls layout

9. **Timeline Dot** (Main column only):
   ```tsx
   <div className="absolute left-[-4.5px] top-px hidden size-[8px] rounded-full bg-primary group-[.main]:block" />
   ```
   - 8px circle on left border
   - Only visible in main column

### Example 3: Puppeteer PDF Generation with Image Waiting

**File**: `apps/server/src/printer/printer.service.ts:93-233`

```typescript
async generateResume(resume: ResumeDto) {
  try {
    const browser = await this.getBrowser();
    const page = await browser.newPage();

    const publicUrl = this.configService.getOrThrow<string>("PUBLIC_URL");
    const storageUrl = this.configService.getOrThrow<string>("STORAGE_URL");

    let url = publicUrl;

    // Development: Replace localhost with host.docker.internal
    if ([publicUrl, storageUrl].some((url) => /https?:\/\/localhost(:\d+)?/.test(url))) {
      url = url.replace(
        /localhost(:\d+)?/,
        (_match, port) => `host.docker.internal${port ?? ""}`,
      );

      await page.setRequestInterception(true);

      page.on("request", (request) => {
        if (request.url().startsWith(storageUrl)) {
          const modifiedUrl = request
            .url()
            .replace(/localhost(:\d+)?/, (_match, port) => `host.docker.internal${port ?? ""}`);

          void request.continue({ url: modifiedUrl });
        } else {
          void request.continue();
        }
      });
    }

    const numberPages = resume.data.metadata.layout.length;

    // Load preview page
    await page.goto(`${url}/artboard/preview`, { waitUntil: "domcontentloaded" });

    // Set resume data in localStorage
    await page.evaluate((data) => {
      window.localStorage.setItem("resume", JSON.stringify(data));
    }, resume.data);

    // Reload and wait for first page
    await Promise.all([
      page.reload({ waitUntil: "load" }),
      page.waitForSelector('[data-page="1"]', { timeout: 15_000 }),
    ]);

    // Wait for profile picture to load
    if (resume.data.basics.picture.url) {
      await page.waitForSelector('img[alt="Profile"]');
      await page.evaluate(() =>
        Promise.all(
          Array.from(document.images).map((img) => {
            if (img.complete) return Promise.resolve();
            return new Promise((resolve) => {
              img.onload = img.onerror = resolve;
            });
          }),
        ),
      );
    }

    const pagesBuffer: Buffer[] = [];

    const processPage = async (index: number) => {
      const pageElement = await page.$(`[data-page="${index}"]`);
      const width = (await (await pageElement?.getProperty("scrollWidth"))?.jsonValue()) ?? 0;
      const height = (await (await pageElement?.getProperty("scrollHeight"))?.jsonValue()) ?? 0;

      // Clone page element and isolate in DOM
      const temporaryHtml = await page.evaluate((element: HTMLDivElement) => {
        const clonedElement = element.cloneNode(true) as HTMLDivElement;
        const temporaryHtml_ = document.body.innerHTML;
        document.body.innerHTML = clonedElement.outerHTML;
        return temporaryHtml_;
      }, pageElement);

      // Apply custom CSS
      const css = resume.data.metadata.css;
      if (css.visible) {
        await page.evaluate((cssValue: string) => {
          const styleTag = document.createElement("style");
          styleTag.textContent = cssValue;
          document.head.append(styleTag);
        }, css.value);
      }

      // Generate PDF for this page
      const uint8array = await page.pdf({ width, height, printBackground: true });
      const buffer = Buffer.from(uint8array);
      pagesBuffer.push(buffer);

      // Restore original HTML
      await page.evaluate((temporaryHtml_: string) => {
        document.body.innerHTML = temporaryHtml_;
      }, temporaryHtml);
    };

    // Process each page
    for (let index = 1; index <= numberPages; index++) {
      await processPage(index);
    }

    // Merge PDFs
    const pdf = await PDFDocument.create();

    for (const element of pagesBuffer) {
      const page = await PDFDocument.load(element);
      const [copiedPage] = await pdf.copyPages(page, [0]);
      pdf.addPage(copiedPage);
    }

    // Save to storage
    const buffer = Buffer.from(await pdf.save());

    const resumeUrl = await this.storageService.uploadObject(
      resume.userId,
      "resumes",
      buffer,
      resume.title,
    );

    await page.close();
    await browser.disconnect();

    return resumeUrl;
  } catch (error) {
    this.logger.error(error);

    throw new InternalServerErrorException(
      ErrorMessage.ResumePrinterError,
      (error as Error).message,
    );
  }
}
```

**Explanation**:

1. **Docker Networking Fix** (lines 102-125):
   ```typescript
   if ([publicUrl, storageUrl].some((url) => /https?:\/\/localhost(:\d+)?/.test(url))) {
     url = url.replace(/localhost(:\d+)?/, (_match, port) => `host.docker.internal${port ?? ""}`);
   ```
   - Puppeteer runs in Docker container
   - Container can't access `localhost` on host machine
   - `host.docker.internal` is special DNS name for host

2. **Request Interception** (lines 111-124):
   ```typescript
   await page.setRequestInterception(true);

   page.on("request", (request) => {
     if (request.url().startsWith(storageUrl)) {
       const modifiedUrl = request.url().replace(/localhost(:\d+)?/, ...);
       void request.continue({ url: modifiedUrl });
     } else {
       void request.continue();
     }
   });
   ```
   - Intercept image requests to Minio storage
   - Rewrite `localhost` to `host.docker.internal`

3. **Data Loading** (lines 130-140):
   ```typescript
   await page.goto(`${url}/artboard/preview`, { waitUntil: "domcontentloaded" });

   await page.evaluate((data) => {
     window.localStorage.setItem("resume", JSON.stringify(data));
   }, resume.data);

   await Promise.all([
     page.reload({ waitUntil: "load" }),
     page.waitForSelector('[data-page="1"]', { timeout: 15_000 }),
   ]);
   ```
   - Navigate to preview page
   - Set resume data in localStorage
   - Reload page (artboard reads from localStorage)
   - Wait for first page element

4. **Image Loading** (lines 142-156):
   ```typescript
   if (resume.data.basics.picture.url) {
     await page.waitForSelector('img[alt="Profile"]');
     await page.evaluate(() =>
       Promise.all(
         Array.from(document.images).map((img) => {
           if (img.complete) return Promise.resolve();
           return new Promise((resolve) => {
             img.onload = img.onerror = resolve;
           });
         }),
       ),
     );
   }
   ```
   - Wait for profile picture selector
   - Wait for ALL images to load (or error)
   - Prevents blank images in PDF

5. **Per-Page Processing** (lines 160-192):
   ```typescript
   const processPage = async (index: number) => {
     const pageElement = await page.$(`[data-page="${index}"]`);
     const width = (await (await pageElement?.getProperty("scrollWidth"))?.jsonValue()) ?? 0;
     const height = (await (await pageElement?.getProperty("scrollHeight"))?.jsonValue()) ?? 0;

     const temporaryHtml = await page.evaluate((element: HTMLDivElement) => {
       const clonedElement = element.cloneNode(true) as HTMLDivElement;
       const temporaryHtml_ = document.body.innerHTML;
       document.body.innerHTML = clonedElement.outerHTML;
       return temporaryHtml_;
     }, pageElement);

     // ... CSS injection ...

     const uint8array = await page.pdf({ width, height, printBackground: true });
     const buffer = Buffer.from(uint8array);
     pagesBuffer.push(buffer);

     await page.evaluate((temporaryHtml_: string) => {
       document.body.innerHTML = temporaryHtml_;
     }, temporaryHtml);
   };
   ```
   - Get actual page dimensions (scrollWidth/scrollHeight)
   - Clone page element
   - Replace entire body with just this page
   - Render PDF
   - Restore original HTML

6. **PDF Merging** (lines 199-206):
   ```typescript
   const pdf = await PDFDocument.create();

   for (const element of pagesBuffer) {
     const page = await PDFDocument.load(element);
     const [copiedPage] = await pdf.copyPages(page, [0]);
     pdf.addPage(copiedPage);
   }

   const buffer = Buffer.from(await pdf.save());
   ```
   - Create new PDF document
   - Load each page buffer as separate PDF
   - Copy page to main document
   - Save merged PDF

---

## Comparison Notes

### How Reactive-Resume Differs from Typical Resume Builders

1. **Separated Artboard App**
   - **Typical**: Single app with conditional rendering
   - **Reactive-Resume**: Separate app for rendering only
   - **Benefit**: Clean PDF output, easier testing

2. **Schema-First Architecture**
   - **Typical**: Loose data structures, runtime errors
   - **Reactive-Resume**: Zod schemas, compile-time safety
   - **Benefit**: Fewer bugs, easier refactoring

3. **Template as React Components**
   - **Typical**: JSON templates or string templates
   - **Reactive-Resume**: Full React components
   - **Benefit**: Leverage React ecosystem, easier debugging

4. **Per-Page PDF Processing**
   - **Typical**: Single page.pdf() call, overflow issues
   - **Reactive-Resume**: Render each page separately, merge with pdf-lib
   - **Benefit**: Correct page dimensions, no clipping

5. **3D Layout Array**
   - **Typical**: Flat array of sections
   - **Reactive-Resume**: `layout[page][column][section]`
   - **Benefit**: Flexible multi-page, multi-column layouts

6. **Generic Section Component**
   - **Typical**: Separate component per section
   - **Reactive-Resume**: Single generic component with render props
   - **Benefit**: DRY, consistent behavior

7. **CSS Variables for Theming**
   - **Typical**: CSS-in-JS with runtime overhead
   - **Reactive-Resume**: Tailwind + CSS variables
   - **Benefit**: Fast theme switching, no re-renders

8. **Monorepo with Shared Libraries**
   - **Typical**: Duplicate code across apps
   - **Reactive-Resume**: Shared libs (schema, utils, ui)
   - **Benefit**: Single source of truth, easy maintenance

9. **Zustand + Temporal**
   - **Typical**: Redux or Context API
   - **Reactive-Resume**: Zustand with built-in undo/redo
   - **Benefit**: Less boilerplate, free undo/redo

10. **Headless Chrome PDF Rendering**
    - **Typical**: jsPDF or client-side libraries
    - **Reactive-Resume**: Puppeteer on server
    - **Benefit**: Pixel-perfect PDFs, handles complex CSS

---

## Conclusion

Reactive-Resume demonstrates a **production-grade, scalable architecture** for template-based document generation. Key takeaways:

1. **Separation of Concerns**: Artboard app isolates rendering from editing
2. **Type Safety**: Zod schemas ensure data integrity across stack
3. **Component Reusability**: Generic Section component reduces duplication
4. **Flexible Layouts**: 3D array enables complex multi-page designs
5. **Clean PDF Generation**: Per-page processing with pdf-lib merging
6. **Modern React Patterns**: Hooks, render props, CSS-in-JS alternatives
7. **Developer Experience**: TypeScript, Nx monorepo, shared libraries
8. **User Experience**: Undo/redo, drag-and-drop, live preview

**For Our Project**: We should strongly consider adopting:
- Separated rendering environment (similar to artboard)
- Zod schema-driven data model
- Generic section components
- Per-page PDF processing
- 3D layout array for flexibility
- Tailwind + CSS variables for theming

This architecture would significantly improve maintainability, type safety, and user experience in our resume/cover letter builder.

---

**Report Generated**: October 8, 2025
**Research Scope**: `/Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume`
**Files Analyzed**: 50+ files across apps/, libs/, and documentation
**Lines of Code Reviewed**: ~7,000+ lines across templates, schemas, and utilities
