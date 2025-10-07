# Reactive-Resume Data-to-Template Mapping

## Overview

Reactive-Resume uses a **schema-first approach** where resume data conforms to a unified schema, and templates adapt to display that data. There is **NO per-template schema**—all templates consume identical data structures.

---

## Core Data Schema

### Top-Level Resume Structure

```typescript
// /libs/schema/src/index.ts:7-22
export const resumeDataSchema = z.object({
  basics: basicsSchema,      // Personal info, contact details
  sections: sectionsSchema,  // All resume sections (experience, education, etc.)
  metadata: metadataSchema,  // Template, theme, layout, typography
});

export type ResumeData = z.infer<typeof resumeDataSchema>;

export const defaultResumeData: ResumeData = {
  basics: defaultBasics,
  sections: defaultSections,
  metadata: defaultMetadata,
};
```

---

## Data Categories

### 1. Basics (Personal Information)

Schema location: `/libs/schema/src/basics/index.ts`

Contains:
- **name**: Full name (string)
- **headline**: Job title/tagline (string)
- **email**: Email address (string)
- **phone**: Phone number (string)
- **location**: City/country (string)
- **url**: Personal website (URL object)
- **customFields**: Array of custom key-value pairs
- **picture**: Profile picture configuration (URL, size, effects)

**Usage in Templates**:
```typescript
// /apps/artboard/src/templates/azurill.tsx:27-77
const Header = () => {
  const basics = useArtboardStore((state) => state.resume.basics);

  return (
    <div className="flex flex-col items-center">
      <Picture />
      <div className="text-2xl font-bold">{basics.name}</div>
      <div className="text-base">{basics.headline}</div>

      {basics.location && (
        <div className="flex items-center gap-x-1.5">
          <i className="ph ph-bold ph-map-pin text-primary" />
          <div>{basics.location}</div>
        </div>
      )}
      {/* email, phone, url, customFields... */}
    </div>
  );
};
```

**Conditional Rendering Pattern**: Every field is optional and checked before rendering.

---

### 2. Sections (Resume Content)

Schema location: `/libs/schema/src/sections/index.ts`

#### Section Structure

```typescript
// /libs/schema/src/sections/index.ts:20-25
export const sectionSchema = z.object({
  name: z.string(),                      // Section title (e.g., "Experience")
  columns: z.number().min(1).max(5).default(1),  // Grid columns for items
  separateLinks: z.boolean().default(true),      // Show URLs separately or inline
  visible: z.boolean().default(true),            // Show/hide entire section
});
```

#### Available Sections

```typescript
// /libs/schema/src/sections/index.ts:33-87
export const sectionsSchema = z.object({
  summary: sectionSchema.extend({
    id: z.literal("summary"),
    content: z.string().default(""),  // Rich text content
  }),
  awards: sectionSchema.extend({
    id: z.literal("awards"),
    items: z.array(awardSchema),
  }),
  certifications: sectionSchema.extend({
    id: z.literal("certifications"),
    items: z.array(certificationSchema),
  }),
  education: sectionSchema.extend({
    id: z.literal("education"),
    items: z.array(educationSchema),
  }),
  experience: sectionSchema.extend({
    id: z.literal("experience"),
    items: z.array(experienceSchema),
  }),
  volunteer: sectionSchema.extend({
    id: z.literal("volunteer"),
    items: z.array(volunteerSchema),
  }),
  interests: sectionSchema.extend({
    id: z.literal("interests"),
    items: z.array(interestSchema),
  }),
  languages: sectionSchema.extend({
    id: z.literal("languages"),
    items: z.array(languageSchema),
  }),
  profiles: sectionSchema.extend({
    id: z.literal("profiles"),
    items: z.array(profileSchema),
  }),
  projects: sectionSchema.extend({
    id: z.literal("projects"),
    items: z.array(projectSchema),
  }),
  publications: sectionSchema.extend({
    id: z.literal("publications"),
    items: z.array(publicationSchema),
  }),
  references: sectionSchema.extend({
    id: z.literal("references"),
    items: z.array(referenceSchema),
  }),
  skills: sectionSchema.extend({
    id: z.literal("skills"),
    items: z.array(skillSchema),
  }),
  custom: z.record(z.string(), customSchema),  // User-defined sections
});
```

#### Section Types

**File Reference**: `/libs/schema/src/sections/index.ts:93-96`

```typescript
export type SectionKey = "basics" | keyof Sections | `custom.${string}`;
export type SectionWithItem<T = unknown> = Sections[FilterKeys<Sections, { items: T[] }>];
export type SectionItem = SectionWithItem["items"][number];
export type CustomSectionGroup = z.infer<typeof customSchema>;
```

---

### 3. Item Schemas (Section Content)

All sections (except `summary`) contain arrays of items. Each item type has its own schema.

#### Example: Experience Schema

```typescript
// /libs/schema/src/sections/experience.ts:1-27
import { z } from "zod";
import { defaultItem, defaultUrl, itemSchema, urlSchema } from "../shared";

export const experienceSchema = itemSchema.extend({
  company: z.string().min(1),
  position: z.string(),
  location: z.string(),
  date: z.string(),
  summary: z.string(),
  url: urlSchema,
});

export type Experience = z.infer<typeof experienceSchema>;

export const defaultExperience: Experience = {
  ...defaultItem,
  company: "",
  position: "",
  location: "",
  date: "",
  summary: "",
  url: defaultUrl,
};
```

#### Base Item Schema

All items inherit from `itemSchema`:

```typescript
// /libs/schema/src/shared/item.ts:5-18
export const itemSchema = z.object({
  id: idSchema,          // Unique identifier
  visible: z.boolean(),  // Show/hide individual item
});

export type Item = z.infer<typeof itemSchema>;

export const defaultItem: Item = {
  id: "",
  visible: true,
};
```

This means **every section item has**:
- `id`: For React keys and identification
- `visible`: For selective display

---

## Data-to-Template Mapping Strategies

### Strategy 1: Direct Data Access via Selectors

Templates don't receive data as props. They pull from the global store:

```typescript
// Common pattern in all templates
const Experience = () => {
  const section = useArtboardStore((state) => state.resume.sections.experience);

  return (
    <Section<Experience> section={section} urlKey="url" summaryKey="summary">
      {(item) => (
        <div>
          <div className="font-bold">{item.company}</div>
          <div>{item.position}</div>
          <div>{item.date}</div>
          <div>{item.location}</div>
        </div>
      )}
    </Section>
  );
};
```

**Advantages**:
- Templates are pure view components
- Data updates automatically trigger re-renders
- No prop drilling

---

### Strategy 2: Generic Section Component with Key-Based Data Extraction

Templates define a reusable `<Section>` component that handles common logic:

```typescript
// Pattern from /apps/artboard/src/templates/onyx.tsx:181-242
type SectionProps<T> = {
  section: SectionWithItem<T> | CustomSectionGroup;
  children?: (item: T) => React.ReactNode;  // Render function for item details
  className?: string;
  urlKey?: keyof T;       // Which property contains the URL
  levelKey?: keyof T;     // Which property contains skill level
  summaryKey?: keyof T;   // Which property contains description/summary
  keywordsKey?: keyof T;  // Which property contains keywords array
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
  if (!section.visible || section.items.filter((item) => item.visible).length === 0)
    return null;

  return (
    <section id={section.id} className="grid">
      <h4 className="font-bold text-primary">{section.name}</h4>

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

**Key Features**:
1. **Visibility Filtering**: Checks both section and item visibility
2. **Dynamic Grid**: Respects `section.columns` setting
3. **Key-Based Extraction**: Uses `urlKey`, `levelKey`, etc. to find common fields
4. **Conditional Sub-Components**: Renders Rating, Links, Keywords only if present
5. **Custom Item Rendering**: `children` function lets caller define item layout

**Usage Example**:
```typescript
// /apps/artboard/src/templates/onyx.tsx:245-269
const Experience = () => {
  const section = useArtboardStore((state) => state.resume.sections.experience);

  return (
    <Section<Experience> section={section} urlKey="url" summaryKey="summary">
      {(item) => (
        <div className="flex items-start justify-between">
          <div className="text-left">
            <LinkedEntity
              name={item.company}
              url={item.url}
              separateLinks={section.separateLinks}
              className="font-bold"
            />
            <div>{item.position}</div>
          </div>

          <div className="shrink-0 text-right">
            <div className="font-bold">{item.date}</div>
            <div>{item.location}</div>
          </div>
        </div>
      )}
    </Section>
  );
};
```

---

### Strategy 3: Helper Components for Common Patterns

#### Link Component

```typescript
// Pattern from /apps/artboard/src/templates/onyx.tsx:133-158
type LinkProps = {
  url: URL;
  icon?: React.ReactNode;
  iconOnRight?: boolean;
  label?: string;
  className?: string;
};

const Link = ({ url, icon, iconOnRight, label, className }: LinkProps) => {
  if (!isUrl(url.href)) return null;  // Guard against empty URLs

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
- Validates URL before rendering
- Supports custom icons and labels
- Flexible icon positioning

#### LinkedEntity Component

```typescript
// Pattern from /apps/artboard/src/templates/onyx.tsx:160-179
type LinkedEntityProps = {
  name: string;
  url: URL;
  separateLinks: boolean;  // From section.separateLinks
  className?: string;
};

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
- If `separateLinks=false` AND URL exists → Render name as link with globe icon
- Otherwise → Render name as plain text (URL will be shown separately by Section component)

#### Rating Component

```typescript
// Example from /apps/artboard/src/templates/rhyhorn.tsx:101-112
const Rating = ({ level }: RatingProps) => (
  <div className="flex items-center gap-x-1.5">
    {Array.from({ length: 5 }).map((_, index) => (
      <div
        key={index}
        className={cn("size-2 rounded-full border border-primary", level > index && "bg-primary")}
      />
    ))}
  </div>
);
```

Visualizes skill levels (0-5) with filled/unfilled dots.

---

## Data Transformation & Sanitization

### Rich Text Content

Summary and item summaries support HTML content:

```typescript
// Common pattern across templates
<div
  dangerouslySetInnerHTML={{ __html: sanitize(section.content) }}
  style={{ columns: section.columns }}
  className="wysiwyg"
/>
```

**Sanitization**: The `sanitize()` function (from `@reactive-resume/utils`) strips dangerous HTML to prevent XSS attacks.

**Columns**: CSS multi-column layout respects `section.columns` setting.

---

## Conditional Rendering Patterns

### 1. Section-Level Visibility

```typescript
// Every section component starts with this check
if (!section.visible || section.items.filter((item) => item.visible).length === 0)
  return null;
```

**Logic**: Hide section if:
- `section.visible` is false, OR
- All items have `visible: false`

### 2. Item-Level Visibility

```typescript
{section.items
  .filter((item) => item.visible)  // Only visible items
  .map((item) => (
    <div key={item.id}>{/* render item */}</div>
  ))}
```

### 3. Field-Level Presence Checks

```typescript
// Example from header rendering
{basics.location && (
  <div className="flex items-center gap-x-1.5">
    <i className="ph ph-bold ph-map-pin text-primary" />
    <div>{basics.location}</div>
  </div>
)}

{basics.phone && (
  <div className="flex items-center gap-x-1.5">
    <i className="ph ph-bold ph-phone text-primary" />
    <a href={`tel:${basics.phone}`}>{basics.phone}</a>
  </div>
)}
```

**Pattern**: Only render if field has a truthy value.

### 4. Optional Sub-Components

```typescript
// In Section component
{summary !== undefined && !isEmptyString(summary) && (
  <div dangerouslySetInnerHTML={{ __html: sanitize(summary) }} className="wysiwyg" />
)}

{level !== undefined && level > 0 && <Rating level={level} />}

{keywords !== undefined && keywords.length > 0 && (
  <p className="text-sm">{keywords.join(", ")}</p>
)}
```

**Logic**: Render sub-components only if data exists and is meaningful.

---

## Metadata-Driven Rendering

### Layout Configuration

```typescript
// /libs/schema/src/metadata/index.ts:13
layout: z.array(z.array(z.array(z.string()))).default(defaultLayout)
// Structure: layout[page][column][sections]
```

**Example**:
```typescript
[
  [  // Page 1
    ["summary", "experience", "education"],  // Main column
    ["skills", "languages", "interests"]     // Sidebar column
  ],
  [  // Page 2 (if needed)
    ["projects", "volunteer"],
    ["certifications", "awards"]
  ]
]
```

**Template Interpretation**:
```typescript
// /apps/artboard/src/templates/azurill.tsx:552-576
export const Azurill = ({ columns, isFirstPage = false }: TemplateProps) => {
  const [main, sidebar] = columns;  // Destructure columns array

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

**Key Points**:
- `columns` prop contains section keys for this page
- Template decides how to organize columns (sidebar vs main)
- Single-column templates still iterate both arrays sequentially
- `isFirstPage` determines whether to show header

---

### Theme Configuration

```typescript
// /libs/schema/src/metadata/index.ts:26-30
theme: z.object({
  background: z.string().default("#ffffff"),
  text: z.string().default("#000000"),
  primary: z.string().default("#dc2626"),
})
```

**Application**: These values are injected as CSS variables, which Tailwind classes reference:

```css
/* Generated dynamically */
:root {
  --color-background: #ffffff;
  --color-text: #000000;
  --color-primary: #dc2626;
}

/* Tailwind maps to these */
.text-primary { color: var(--color-primary); }
.bg-primary { background-color: var(--color-primary); }
```

---

### Typography Configuration

```typescript
// /libs/schema/src/metadata/index.ts:31-41
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
})
```

**Application in Template**:
```typescript
// /apps/artboard/src/components/page.tsx:14-28
export const Page = ({ mode = "preview", pageNumber, children }: Props) => {
  const page = useArtboardStore((state) => state.resume.metadata.page);
  const fontFamily = useArtboardStore((state) => state.resume.metadata.typography.font.family);

  return (
    <div
      style={{
        fontFamily,
        width: `${pageSizeMap[page.format].width * MM_TO_PX}px`,
        minHeight: `${pageSizeMap[page.format].height * MM_TO_PX}px`,
      }}
    >
      {children}
    </div>
  );
};
```

---

## Custom Sections

Users can add custom sections beyond the predefined ones:

```typescript
// /libs/schema/src/sections/index.ts:86
custom: z.record(z.string(), customSchema)
```

**Handling in Templates**:
```typescript
// /apps/artboard/src/templates/onyx.tsx:485-515
const Custom = ({ id }: { id: string }) => {
  const section = useArtboardStore((state) => state.resume.sections.custom[id]);

  return (
    <Section<CustomSection>
      section={section}
      urlKey="url"
      summaryKey="summary"
      keywordsKey="keywords"
    >
      {(item) => (
        <div className="flex items-start justify-between">
          <div className="text-left">
            <LinkedEntity
              name={item.name}
              url={item.url}
              separateLinks={section.separateLinks}
              className="font-bold"
            />
            <div>{item.description}</div>
          </div>

          <div className="shrink-0 text-right">
            <div className="font-bold">{item.date}</div>
            <div>{item.location}</div>
          </div>
        </div>
      )}
    </Section>
  );
};

// In mapSectionToComponent
default: {
  if (section.startsWith("custom."))
    return <Custom id={section.split(".")[1]} />;
  return null;
}
```

**SectionKey Format**: `"custom.{id}"` (e.g., `"custom.hobbies"`)

---

## Data Flow Summary

```
1. Resume Data (Zod-validated) → Zustand Store
2. Template Component Renders → Reads layout from metadata
3. Template Maps Section Keys → Section Components
4. Section Components → useArtboardStore selector → Pull section data
5. Generic <Section> Component → Extracts common fields (url, level, summary, keywords)
6. Custom render function → Renders item-specific fields
7. Helper Components (Link, Rating) → Render based on presence of data
8. Conditional Rendering → Hides empty/invisible sections and items
```

---

## Key Patterns for Data Mapping

✅ **Schema-First**: Data structure is rigid, templates adapt
✅ **Store-Based**: No prop passing, templates pull what they need
✅ **Key-Based Extraction**: Generic components use property names as config
✅ **Conditional Everywhere**: Every level checks visibility and presence
✅ **Helper Components**: Reusable logic for common patterns (links, ratings)
✅ **Metadata Controls Layout**: Not hardcoded in templates
✅ **Sanitization**: All HTML content sanitized before rendering

---

## Anti-Patterns Avoided

❌ **Template-Specific Data**: Would break template switching
❌ **Prop Drilling**: Store provides global access
❌ **Hard-Coded Layouts**: Layout driven by metadata.layout array
❌ **Unsafe HTML**: All rich text sanitized

---

## Files Referenced

- **Main Schema**: `/libs/schema/src/index.ts`
- **Section Schemas**: `/libs/schema/src/sections/index.ts`
- **Experience Schema**: `/libs/schema/src/sections/experience.ts`
- **Item Base**: `/libs/schema/src/shared/item.ts`
- **Metadata Schema**: `/libs/schema/src/metadata/index.ts`
- **Template Examples**:
  - `/apps/artboard/src/templates/onyx.tsx`
  - `/apps/artboard/src/templates/azurill.tsx`
  - `/apps/artboard/src/templates/rhyhorn.tsx`
- **Store**: `/apps/artboard/src/store/artboard.ts`
- **Page Component**: `/apps/artboard/src/components/page.tsx`
