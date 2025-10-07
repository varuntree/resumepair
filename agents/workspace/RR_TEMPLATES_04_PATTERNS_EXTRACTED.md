# Reactive-Resume: Reusable Patterns & Implementation Strategies

## Overview

This document extracts **actionable patterns** from Reactive-Resume's template system that can be adapted for other resume/document generation systems. Each pattern includes the problem it solves, implementation details, and code examples.

---

## Pattern 1: Schema-First Template Design

### Problem
Templates need to be flexible but consistent. Hard-coding data structures into templates makes switching between designs difficult.

### Solution
Define a **single, universal data schema** that all templates consume. Templates are purely presentational and adapt to the data, not vice versa.

### Implementation

**Data Schema (Zod)**:
```typescript
// Define once, use everywhere
const resumeDataSchema = z.object({
  basics: basicsSchema,
  sections: sectionsSchema,
  metadata: metadataSchema,
});

type ResumeData = z.infer<typeof resumeDataSchema>;
```

**Template Consumption**:
```typescript
// Templates pull from global store, no props
const Header = () => {
  const basics = useArtboardStore((state) => state.resume.basics);
  return <div>{basics.name}</div>;
};
```

**Benefits**:
- ✅ Switch templates without data migration
- ✅ Add new templates without changing schema
- ✅ Type safety across entire application
- ✅ Single source of truth for validation

**Files Referenced**:
- `/libs/schema/src/index.ts`
- `/apps/artboard/src/store/artboard.ts`

---

## Pattern 2: Layout as Data, Not Code

### Problem
Hard-coded layouts in templates prevent users from customizing section order and column arrangement.

### Solution
Store layout configuration as a **nested array** in resume metadata. Templates interpret this config to render sections dynamically.

### Implementation

**Layout Schema**:
```typescript
// Structure: layout[page][column][sections]
layout: z.array(z.array(z.array(z.string()))).default([
  [
    ["summary", "experience", "education"],  // Main column
    ["skills", "languages"]                   // Sidebar
  ],
  [
    ["projects"],  // Page 2, left column
    ["awards"]     // Page 2, right column
  ]
])
```

**Template Interpretation**:
```typescript
export const Template = ({ columns, isFirstPage }: TemplateProps) => {
  const [main, sidebar] = columns;

  return (
    <div>
      {isFirstPage && <Header />}
      <div className="grid grid-cols-3">
        <div className="col-span-1">
          {sidebar.map((sectionKey) => (
            <Fragment key={sectionKey}>
              {mapSectionToComponent(sectionKey)}
            </Fragment>
          ))}
        </div>
        <div className="col-span-2">
          {main.map((sectionKey) => (
            <Fragment key={sectionKey}>
              {mapSectionToComponent(sectionKey)}
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};
```

**Benefits**:
- ✅ Users control section order
- ✅ Multi-page support built-in
- ✅ Flexible column arrangements
- ✅ No template code changes for layout tweaks

**Files Referenced**:
- `/libs/schema/src/metadata/index.ts:3-8`
- `/apps/artboard/src/templates/azurill.tsx:552-576`

---

## Pattern 3: Generic Section Component with Property Keys

### Problem
Each section type (Experience, Education, Skills) has similar rendering logic (visibility, grid, items) but different field names.

### Solution
Create a **generic section component** that accepts property key names as configuration. Use `lodash.get` to dynamically extract fields.

### Implementation

```typescript
type SectionProps<T> = {
  section: SectionWithItem<T> | CustomSectionGroup;
  children?: (item: T) => React.ReactNode;
  urlKey?: keyof T;       // Name of URL property
  levelKey?: keyof T;     // Name of level property
  summaryKey?: keyof T;   // Name of summary property
  keywordsKey?: keyof T;  // Name of keywords property
};

const Section = <T,>({
  section,
  children,
  urlKey,
  levelKey,
  summaryKey,
  keywordsKey,
}: SectionProps<T>) => {
  if (!section.visible || section.items.filter((item) => item.visible).length === 0)
    return null;

  return (
    <section id={section.id}>
      <h4>{section.name}</h4>
      <div style={{ gridTemplateColumns: `repeat(${section.columns}, 1fr)` }}>
        {section.items
          .filter((item) => item.visible)
          .map((item) => {
            // Extract common fields using property keys
            const url = (urlKey && get(item, urlKey)) as URL | undefined;
            const level = (levelKey && get(item, levelKey, 0)) as number | undefined;
            const summary = (summaryKey && get(item, summaryKey, "")) as string | undefined;
            const keywords = (keywordsKey && get(item, keywordsKey, [])) as string[] | undefined;

            return (
              <div key={item.id}>
                {/* Custom item rendering */}
                {children?.(item as T)}

                {/* Conditional common elements */}
                {summary && <div dangerouslySetInnerHTML={{ __html: sanitize(summary) }} />}
                {level > 0 && <Rating level={level} />}
                {keywords?.length > 0 && <p>{keywords.join(", ")}</p>}
                {url && section.separateLinks && <Link url={url} />}
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
const Experience = () => {
  const section = useArtboardStore((state) => state.resume.sections.experience);

  return (
    <Section<Experience> section={section} urlKey="url" summaryKey="summary">
      {(item) => (
        <div>
          <div className="font-bold">{item.company}</div>
          <div>{item.position}</div>
          <div>{item.date}</div>
        </div>
      )}
    </Section>
  );
};

const Skills = () => {
  const section = useArtboardStore((state) => state.resume.sections.skills);

  return (
    <Section<Skill> section={section} levelKey="level" keywordsKey="keywords">
      {(item) => (
        <div>
          <div className="font-bold">{item.name}</div>
          <div>{item.description}</div>
        </div>
      )}
    </Section>
  );
};
```

**Benefits**:
- ✅ DRY principle: common logic in one place
- ✅ Flexible: each section can render items differently
- ✅ Type-safe: generics ensure correct property types
- ✅ Maintainable: changes to common logic affect all sections

**Files Referenced**:
- `/apps/artboard/src/templates/onyx.tsx:181-242`
- `/apps/artboard/src/templates/azurill.tsx:170-248`

---

## Pattern 4: Visibility at Multiple Levels

### Problem
Users need granular control over what appears in their resume (hide entire sections, hide specific items, hide optional fields).

### Solution
Implement **three-tier visibility**:
1. Section-level: `section.visible` (show/hide entire section)
2. Item-level: `item.visible` (show/hide specific experiences, skills, etc.)
3. Field-level: Conditional rendering based on value presence

### Implementation

**Schema**:
```typescript
// Section visibility
const sectionSchema = z.object({
  name: z.string(),
  visible: z.boolean().default(true),  // ← Section visibility
  items: z.array(itemSchema),
});

// Item visibility
const itemSchema = z.object({
  id: idSchema,
  visible: z.boolean(),  // ← Item visibility
  // ... other fields
});
```

**Rendering**:
```typescript
// 1. Section-level check
if (!section.visible || section.items.filter((item) => item.visible).length === 0)
  return null;

// 2. Item-level filtering
{section.items
  .filter((item) => item.visible)  // ← Only visible items
  .map((item) => (
    <div key={item.id}>
      {/* 3. Field-level checks */}
      {item.company && <div>{item.company}</div>}
      {item.position && <div>{item.position}</div>}
      {item.date && <div>{item.date}</div>}

      {/* Conditional sub-components */}
      {item.summary && !isEmptyString(item.summary) && <Summary content={item.summary} />}
      {item.url && isUrl(item.url.href) && <Link url={item.url} />}
    </div>
  ))}
```

**Benefits**:
- ✅ Fine-grained control without deleting data
- ✅ Easy to toggle sections on/off
- ✅ Graceful handling of incomplete data
- ✅ No null/undefined errors in rendering

**Files Referenced**:
- `/libs/schema/src/sections/index.ts:20-25`
- `/libs/schema/src/shared/item.ts:5-18`

---

## Pattern 5: CSS Variables for Theming

### Problem
Hard-coded colors in templates prevent runtime theme customization.

### Solution
Store theme colors in resume metadata and inject as **CSS custom properties**. Use Tailwind utilities that reference these variables.

### Implementation

**Theme Schema**:
```typescript
theme: z.object({
  background: z.string().default("#ffffff"),
  text: z.string().default("#000000"),
  primary: z.string().default("#dc2626"),
})
```

**CSS Injection** (handled by framework):
```css
:root {
  --color-background: #ffffff;
  --color-text: #000000;
  --color-primary: #dc2626;
}
```

**Tailwind Config**:
```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        background: 'var(--color-background)',
        foreground: 'var(--color-text)',
      }
    }
  }
}
```

**Template Usage**:
```typescript
<div className="text-primary">  {/* Uses --color-primary */}
  <i className="text-primary" />
</div>

<div className="bg-primary">  {/* Uses --color-primary for background */}
  Header
</div>
```

**Benefits**:
- ✅ Runtime theme changes without rebuilding
- ✅ Consistent color usage across templates
- ✅ Easy to swap color schemes
- ✅ Works in PDF generation (Puppeteer renders CSS vars)

**Files Referenced**:
- `/libs/schema/src/metadata/index.ts:26-30`

---

## Pattern 6: Conditional Styling via CSS Groups

### Problem
Same section component needs different styling when rendered in sidebar vs main column.

### Solution
Use **CSS groups** (`:has()` or parent class selectors) to apply context-specific styles.

### Implementation

**Template Structure**:
```typescript
<div className="grid grid-cols-3">
  {/* Sidebar with 'sidebar' group class */}
  <div className="sidebar group">
    {sections.map((section) => <Section key={section} />)}
  </div>

  {/* Main with 'main' group class */}
  <div className="main group col-span-2">
    {sections.map((section) => <Section key={section} />)}
  </div>
</div>
```

**Section Component with Conditional Styling**:
```typescript
const Section = () => (
  <section>
    {/* Show in main, hide in sidebar */}
    <h4 className="hidden font-bold text-primary group-[.main]:block">
      {section.name}
    </h4>

    {/* Show in sidebar, hide in main */}
    <div className="hidden items-center gap-x-2 font-bold text-primary group-[.sidebar]:flex">
      <div className="size-1.5 rounded-full border border-primary" />
      <h4>{section.name}</h4>
      <div className="size-1.5 rounded-full border border-primary" />
    </div>

    {/* Content with context-specific layout */}
    <div className="space-y-2 group-[.sidebar]:text-center group-[.main]:text-left">
      {/* items */}
    </div>
  </section>
);
```

**Tailwind CSS Group Syntax**:
- `group-[.main]:block` → Show if parent has class `main` and class `group`
- `group-[.sidebar]:flex` → Show if parent has class `sidebar` and class `group`

**Benefits**:
- ✅ Single component, multiple contexts
- ✅ Avoids duplicate section components
- ✅ CSS-driven, no JS logic needed
- ✅ Clean separation of layout concerns

**Files Referenced**:
- `/apps/artboard/src/templates/azurill.tsx:86-105`
- `/apps/artboard/src/templates/ditto.tsx:218-245`

---

## Pattern 7: Section-to-Component Mapping

### Problem
Layout is dynamic (stored as string keys), but components are static. Need to map between them.

### Solution
Implement a **mapping function** that converts section keys to component instances.

### Implementation

```typescript
const mapSectionToComponent = (section: SectionKey) => {
  switch (section) {
    case "profiles":
      return <Profiles />;
    case "summary":
      return <Summary />;
    case "experience":
      return <Experience />;
    case "education":
      return <Education />;
    case "awards":
      return <Awards />;
    case "certifications":
      return <Certifications />;
    case "skills":
      return <Skills />;
    case "interests":
      return <Interests />;
    case "publications":
      return <Publications />;
    case "volunteer":
      return <Volunteer />;
    case "languages":
      return <Languages />;
    case "projects":
      return <Projects />;
    case "references":
      return <References />;
    default: {
      // Handle custom sections
      if (section.startsWith("custom.")) {
        return <Custom id={section.split(".")[1]} />;
      }
      return null;
    }
  }
};
```

**Usage in Template**:
```typescript
{columns.map((sectionKey) => (
  <Fragment key={sectionKey}>
    {mapSectionToComponent(sectionKey)}
  </Fragment>
))}
```

**Benefits**:
- ✅ Dynamic rendering based on data
- ✅ Type-safe (exhaustive switch check)
- ✅ Supports custom sections
- ✅ Easy to add new section types

**Files Referenced**:
- `/apps/artboard/src/templates/azurill.tsx:503-550`
- `/apps/artboard/src/templates/onyx.tsx:517-561`

---

## Pattern 8: Zustand Store for Global Resume State

### Problem
Passing resume data through deeply nested template components causes prop drilling and tight coupling.

### Solution
Use a **global state store** (Zustand) that components can directly select from.

### Implementation

**Store Definition**:
```typescript
import { create } from "zustand";

export type ArtboardStore = {
  resume: ResumeData;
  setResume: (resume: ResumeData) => void;
};

export const useArtboardStore = create<ArtboardStore>()((set) => ({
  resume: null as unknown as ResumeData,
  setResume: (resume) => set({ resume }),
}));
```

**Component Usage**:
```typescript
// Select only what you need
const Header = () => {
  const basics = useArtboardStore((state) => state.resume.basics);
  return <div>{basics.name}</div>;
};

const Experience = () => {
  const section = useArtboardStore((state) => state.resume.sections.experience);
  return <Section section={section}>{/* ... */}</Section>;
};

const Page = () => {
  const format = useArtboardStore((state) => state.resume.metadata.page.format);
  const fontFamily = useArtboardStore((state) => state.resume.metadata.typography.font.family);
  // ...
};
```

**Benefits**:
- ✅ No prop drilling
- ✅ Selective re-renders (only when selected slice changes)
- ✅ Clean component interfaces
- ✅ Easy to add new data without refactoring

**Why Zustand over Redux**:
- Smaller bundle size
- Simpler API (no actions/reducers)
- TypeScript-first
- Less boilerplate

**Files Referenced**:
- `/apps/artboard/src/store/artboard.ts`

---

## Pattern 9: Puppeteer for WYSIWYG PDF Generation

### Problem
Pure JS PDF libraries (jsPDF, pdfmake) require manual layout calculations and don't support modern CSS (grid, flexbox).

### Solution
Render templates in a **headless browser** (Puppeteer) and use native browser PDF printing.

### Implementation

**Server-Side PDF Service**:
```typescript
async generateResume(resume: ResumeDto) {
  const browser = await this.getBrowser();  // Connect to Chrome
  const page = await browser.newPage();

  // Navigate to preview page
  await page.goto(`${url}/artboard/preview`, { waitUntil: "domcontentloaded" });

  // Inject resume data
  await page.evaluate((data) => {
    window.localStorage.setItem("resume", JSON.stringify(data));
  }, resume.data);

  // Reload to apply data
  await page.reload({ waitUntil: "load" });
  await page.waitForSelector('[data-page="1"]', { timeout: 15_000 });

  // Wait for images
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

  // Generate PDF for each page
  for (let index = 1; index <= numberPages; index++) {
    const pageElement = await page.$(`[data-page="${index}"]`);
    const width = await pageElement?.evaluate((el) => el.scrollWidth);
    const height = await pageElement?.evaluate((el) => el.scrollHeight);

    // Isolate page element
    const originalHtml = await page.evaluate((element) => {
      const clone = element.cloneNode(true);
      const temp = document.body.innerHTML;
      document.body.innerHTML = clone.outerHTML;
      return temp;
    }, pageElement);

    // Generate PDF
    const buffer = await page.pdf({ width, height, printBackground: true });
    pagesBuffer.push(Buffer.from(buffer));

    // Restore body
    await page.evaluate((html) => {
      document.body.innerHTML = html;
    }, originalHtml);
  }

  // Merge PDFs
  const pdf = await PDFDocument.create();
  for (const buffer of pagesBuffer) {
    const page = await PDFDocument.load(buffer);
    const [copiedPage] = await pdf.copyPages(page, [0]);
    pdf.addPage(copiedPage);
  }

  const finalBuffer = Buffer.from(await pdf.save());

  await browser.disconnect();
  return finalBuffer;
}
```

**Benefits**:
- ✅ WYSIWYG: Preview matches PDF exactly
- ✅ Full CSS support (grid, flexbox, custom fonts)
- ✅ No layout calculations needed
- ✅ Reuse React components for PDF

**Trade-offs**:
- ❌ Requires Chrome instance (infrastructure cost)
- ❌ Slower than pure JS solutions (2-5 seconds per page)
- ❌ More complex deployment

**Files Referenced**:
- `/apps/server/src/printer/printer.service.ts:93-233`

---

## Pattern 10: Page Component for Size Management

### Problem
Different page sizes (A4, Letter) need consistent dimensions across builder, preview, and PDF.

### Solution
Create a **Page wrapper component** that handles size calculations and applies them consistently.

### Implementation

**Page Component**:
```typescript
export const MM_TO_PX = 3.78;  // Conversion constant

type Props = {
  mode?: "preview" | "builder";
  pageNumber: number;
  children: React.ReactNode;
};

export const Page = ({ mode = "preview", pageNumber, children }: Props) => {
  const page = useArtboardStore((state) => state.resume.metadata.page);
  const fontFamily = useArtboardStore((state) => state.resume.metadata.typography.font.family);

  return (
    <div
      data-page={pageNumber}  // For Puppeteer targeting
      className={cn(
        "relative bg-background text-foreground",
        mode === "builder" && "shadow-2xl"
      )}
      style={{
        fontFamily,
        width: `${pageSizeMap[page.format].width * MM_TO_PX}px`,
        minHeight: `${pageSizeMap[page.format].height * MM_TO_PX}px`,
      }}
    >
      {/* Builder-only page number */}
      {mode === "builder" && page.options.pageNumbers && (
        <div className="absolute -top-7 left-0 font-bold">
          Page {pageNumber}
        </div>
      )}

      {children}

      {/* Builder-only break line */}
      {mode === "builder" && page.options.breakLine && (
        <div
          className="absolute inset-x-0 border-b border-dashed"
          style={{
            top: `${pageSizeMap[page.format].height * MM_TO_PX}px`,
          }}
        />
      )}
    </div>
  );
};
```

**Page Sizes**:
```typescript
export const pageSizeMap = {
  a4: { width: 210, height: 297 },    // mm → 794px × 1123px
  letter: { width: 216, height: 279 } // mm → 816px × 1055px
};
```

**Benefits**:
- ✅ Single source of truth for dimensions
- ✅ Consistent sizing across modes
- ✅ Easy to add new page sizes
- ✅ Handles mode-specific UI (page numbers, break lines)

**Files Referenced**:
- `/apps/artboard/src/components/page.tsx:1-48`

---

## Pattern 11: isFirstPage Pattern for Headers

### Problem
Headers should only appear on the first page, but layout is dynamic.

### Solution
Pass an **isFirstPage boolean** to templates and conditionally render headers.

### Implementation

**Layout Iteration**:
```typescript
{layout.map((columns, pageIndex) => (
  <Page key={pageIndex} pageNumber={pageIndex + 1}>
    <Template
      isFirstPage={pageIndex === 0}  // ← First page flag
      columns={columns as SectionKey[][]}
    />
  </Page>
))}
```

**Template Usage**:
```typescript
export const Template = ({ columns, isFirstPage = false }: TemplateProps) => {
  const [main, sidebar] = columns;

  return (
    <div>
      {isFirstPage && <Header />}  {/* Only on page 1 */}

      {main.map((section) => <Section key={section} />)}
      {sidebar.map((section) => <Section key={section} />)}
    </div>
  );
};
```

**Benefits**:
- ✅ Simple boolean check
- ✅ No need to track page numbers in template
- ✅ Easy to extend (e.g., `isLastPage` for footer)

**Files Referenced**:
- `/apps/artboard/src/pages/preview.tsx:16-23`
- `/apps/artboard/src/templates/azurill.tsx:552-576`

---

## Pattern 12: Helper Components for Common Elements

### Problem
Links, ratings, and profile pictures have consistent behavior but vary in styling.

### Solution
Create **reusable helper components** with flexible styling via props.

### Implementation

**Link Component**:
```typescript
type LinkProps = {
  url: URL;
  icon?: React.ReactNode;
  iconOnRight?: boolean;
  label?: string;
  className?: string;
};

const Link = ({ url, icon, iconOnRight, label, className }: LinkProps) => {
  if (!isUrl(url.href)) return null;  // Guard

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

**Picture Component**:
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

**Rating Component**:
```typescript
const Rating = ({ level }: RatingProps) => (
  <div className="flex items-center gap-x-1.5">
    {Array.from({ length: 5 }).map((_, index) => (
      <div
        key={index}
        className={cn(
          "size-2 rounded-full border border-primary",
          level > index && "bg-primary"
        )}
      />
    ))}
  </div>
);
```

**Benefits**:
- ✅ DRY principle
- ✅ Consistent behavior across templates
- ✅ Easy to update globally
- ✅ Flexible styling via props/className

**Files Referenced**:
- `/apps/artboard/src/templates/onyx.tsx:133-158` (Link)
- `/apps/artboard/src/components/picture.tsx` (Picture)
- `/apps/artboard/src/templates/rhyhorn.tsx:101-112` (Rating)

---

## Pattern 13: Custom Sections via Naming Convention

### Problem
Users want to add sections beyond predefined types (e.g., "Hobbies", "Volunteer Work").

### Solution
Use **custom section IDs** with a naming convention (`custom.{id}`). Template mapper detects prefix and renders generic custom component.

### Implementation

**Section Key Type**:
```typescript
type SectionKey = "basics" | keyof Sections | `custom.${string}`;
```

**Schema**:
```typescript
sections: z.object({
  experience: sectionSchema.extend({ items: z.array(experienceSchema) }),
  education: sectionSchema.extend({ items: z.array(educationSchema) }),
  // ... predefined sections
  custom: z.record(z.string(), customSchema),  // ← Dynamic custom sections
})
```

**Mapper Function**:
```typescript
const mapSectionToComponent = (section: SectionKey) => {
  switch (section) {
    case "experience":
      return <Experience />;
    case "education":
      return <Education />;
    // ... other predefined sections
    default: {
      if (section.startsWith("custom.")) {
        return <Custom id={section.split(".")[1]} />;  // ← Extract ID
      }
      return null;
    }
  }
};
```

**Custom Component**:
```typescript
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
        <div>
          <div className="font-bold">{item.name}</div>
          <div>{item.description}</div>
          <div>{item.date}</div>
          <div>{item.location}</div>
        </div>
      )}
    </Section>
  );
};
```

**Benefits**:
- ✅ Unlimited custom sections
- ✅ No template changes needed
- ✅ Type-safe via string literal union
- ✅ Consistent rendering with predefined sections

**Files Referenced**:
- `/libs/schema/src/sections/index.ts:86-96`
- `/apps/artboard/src/templates/onyx.tsx:485-515, 544-559`

---

## Anti-Patterns to Avoid

### ❌ Template-Specific Data Schemas

**Bad**:
```typescript
// Don't create separate schemas per template
type AzurillData = { /* fields specific to Azurill */ };
type OnyxData = { /* fields specific to Onyx */ };
```

**Why**: Users can't switch templates without data migration. Violates single source of truth.

---

### ❌ Hard-Coded Layouts in Templates

**Bad**:
```typescript
const Template = () => (
  <div>
    <Header />
    <Experience />  {/* Fixed order */}
    <Education />
    <Skills />
  </div>
);
```

**Why**: Users can't reorder sections. Layout should be data-driven.

---

### ❌ Prop Drilling Resume Data

**Bad**:
```typescript
<Template resume={resume}>
  <Header basics={resume.basics}>
    <ContactInfo email={resume.basics.email} phone={resume.basics.phone} />
  </Header>
</Template>
```

**Why**: Creates tight coupling and verbose code. Use global store instead.

---

### ❌ Inline Styles Everywhere

**Bad**:
```typescript
<div style={{ fontSize: "14px", color: "#dc2626", fontWeight: "bold" }}>
  {section.name}
</div>
```

**Why**: Hard to theme, not reusable, verbose. Use Tailwind classes or CSS-in-JS.

---

### ❌ Mixing Business Logic in Templates

**Bad**:
```typescript
const Experience = () => {
  const section = useArtboardStore((state) => state.resume.sections.experience);

  // Don't do data transformations here
  const sortedItems = section.items.sort((a, b) => new Date(b.date) - new Date(a.date));
  const filteredItems = sortedItems.filter((item) => item.company !== "Acme Corp");

  return <div>{/* render */}</div>;
};
```

**Why**: Templates should be pure view components. Do transformations in store or service layer.

---

## Best Practices Summary

### Data Architecture
- ✅ Single, universal schema for all templates
- ✅ Zod for runtime validation and type generation
- ✅ Metadata for layout, theme, typography config
- ✅ Nested arrays for multi-page, multi-column layouts

### Component Design
- ✅ Generic Section component with property keys
- ✅ Helper components for common elements (Link, Rating, Picture)
- ✅ Conditional rendering at section, item, and field levels
- ✅ Section-to-component mapping function

### Styling
- ✅ CSS variables for theming
- ✅ Tailwind classes for consistency
- ✅ CSS groups for context-specific styles
- ✅ Mode-specific rendering (builder vs preview)

### State Management
- ✅ Zustand for global resume state
- ✅ Selector-based data access (no prop drilling)
- ✅ Immutable updates

### PDF Generation
- ✅ Puppeteer for WYSIWYG accuracy
- ✅ Page component for size management
- ✅ Page-by-page isolation for clean PDFs
- ✅ Image pre-loading for complete renders

### Developer Experience
- ✅ TypeScript everywhere
- ✅ Schema-driven types
- ✅ Exhaustive pattern matching in mappers
- ✅ Separation of concerns (rendering vs business logic)

---

## Integration Strategies

### For Existing Resume Apps

1. **Adopt Schema-First Approach**
   - Define Zod schemas for resume data
   - Migrate existing data to new schema
   - Generate TypeScript types from schemas

2. **Implement Global Store**
   - Add Zustand or similar state management
   - Refactor templates to pull from store
   - Remove prop drilling

3. **Add Layout Configuration**
   - Store layout as nested array in metadata
   - Implement section-to-component mapper
   - Update templates to interpret layout config

4. **Upgrade PDF Generation**
   - Set up Puppeteer infrastructure
   - Create preview route for static rendering
   - Implement page-by-page PDF generation

### For New Resume Apps

1. **Start with Schema**
   - Define data schema first
   - Add validation layer
   - Generate types

2. **Build Page Component**
   - Handle sizing and page breaks
   - Support multiple formats (A4, Letter)
   - Add mode switching (builder vs preview)

3. **Create Generic Section Component**
   - Implement property-key-based extraction
   - Add conditional sub-component rendering
   - Make it reusable across templates

4. **Develop First Template**
   - Use schema and components
   - Test with real data
   - Refine based on edge cases

5. **Add More Templates**
   - Reuse components and patterns
   - Focus on layout differences
   - Maintain consistency

---

## Files Referenced

- **Architecture**: `/apps/artboard/src/templates/index.tsx`
- **Schema**: `/libs/schema/src/index.ts`
- **Store**: `/apps/artboard/src/store/artboard.ts`
- **Templates**: `/apps/artboard/src/templates/{template}.tsx`
- **Components**: `/apps/artboard/src/components/`
- **PDF Service**: `/apps/server/src/printer/printer.service.ts`
- **Metadata**: `/libs/schema/src/metadata/index.ts`
