# Reactive-Resume Rich Text Editor - Data Format & Schema

## Content Storage Format

### HTML String Format

All rich text content is stored as **plain HTML strings** in the application state and database.

**Example from experience.summary**:
```html
<p>Led a team of 5 developers in building a scalable microservices platform</p>
<ul>
  <li>Implemented event-driven architecture using Kafka</li>
  <li>Reduced API response time by 40%</li>
  <li>Mentored junior developers</li>
</ul>
```

**Example from summary.content**:
```html
<p>Senior Full-Stack Developer with 8+ years of experience building scalable web applications.</p>
<p>Specialized in React, Node.js, and cloud infrastructure.</p>
```

### Why HTML?

1. **Rich Formatting**: Preserves all formatting (bold, italic, lists, etc.)
2. **Universal**: HTML is universally supported for display
3. **TipTap Native**: TipTap's `getHTML()` method naturally produces HTML
4. **Sanitizable**: Can be safely sanitized before rendering
5. **Searchable**: Text content can be extracted for search

## Schema Definitions

### Base Schemas

**File**: `/libs/schema/src/shared/item.ts` (Lines 1-19)

```typescript
import { z } from "zod";
import { idSchema } from "./id";

// Schema
export const itemSchema = z.object({
  id: idSchema,
  visible: z.boolean(),
});

// Type
export type Item = z.infer<typeof itemSchema>;

// Defaults
export const defaultItem: Item = {
  id: "",
  visible: true,
};
```

**Purpose**: Base for all section items, provides:
- `id` - Unique identifier (CUID2)
- `visible` - Toggle item visibility on resume

### URL Schema

**File**: `/libs/schema/src/shared/url.ts` (Lines 1-17)

```typescript
import { z } from "zod";

// Schema
export const urlSchema = z.object({
  label: z.string(),
  href: z.literal("").or(z.string().url()),
});

// Type
export type URL = z.infer<typeof urlSchema>;

// Defaults
export const defaultUrl: URL = {
  label: "",
  href: "",
};
```

**Validation Rules**:
- `href` must be empty string OR valid URL
- `label` is always a string (can be empty)
- Pattern allows optional labels for URLs

**Usage**:
- `url.href` - The actual URL (e.g., "https://company.com")
- `url.label` - Display text (e.g., "Company Website")
- If label empty, href is displayed instead

### ID Schema

**File**: `/libs/schema/src/shared/id.ts` (Referenced from item.ts:3)

```typescript
import { z } from "zod";

export const idSchema = z.string();
```

Simple string type, but typically uses CUID2 generation:
- Library: `@paralleldrive/cuid2`
- Function: `createId()`
- Format: URL-safe, collision-resistant IDs

## Section Schemas

### Experience Schema

**File**: `/libs/schema/src/sections/experience.ts` (Lines 1-28)

```typescript
import { z } from "zod";
import { defaultItem, defaultUrl, itemSchema, urlSchema } from "../shared";

// Schema
export const experienceSchema = itemSchema.extend({
  company: z.string().min(1),      // Required (min 1 char)
  position: z.string(),            // Optional (empty string allowed)
  location: z.string(),            // Optional
  date: z.string(),                // Optional (free-form text)
  summary: z.string(),             // HTML content stored here
  url: urlSchema,                  // Company website
});

// Type
export type Experience = z.infer<typeof experienceSchema>;

// Defaults
export const defaultExperience: Experience = {
  ...defaultItem,                  // id, visible
  company: "",
  position: "",
  location: "",
  date: "",
  summary: "",                     // Empty HTML
  url: defaultUrl,                 // { label: "", href: "" }
};
```

**Field Types**:
- All text fields are `z.string()`
- Only `company` has `.min(1)` validation (required)
- `summary` field holds HTML string
- `url` is structured object (not string)

### Education Schema

**File**: `/libs/schema/src/sections/education.ts` (Lines 1-31)

```typescript
import { z } from "zod";
import { defaultItem, defaultUrl, itemSchema, urlSchema } from "../shared";

// Schema
export const educationSchema = itemSchema.extend({
  institution: z.string().min(1),  // Required
  studyType: z.string(),           // e.g., "Bachelor's Degree"
  area: z.string(),                // e.g., "Computer Science"
  score: z.string(),               // e.g., "3.8 GPA"
  date: z.string(),                // Free-form date range
  summary: z.string(),             // HTML content
  url: urlSchema,                  // Institution website
});

// Type
export type Education = z.infer<typeof educationSchema>;

// Defaults
export const defaultEducation: Education = {
  ...defaultItem,
  id: "",                          // Explicitly set (redundant with defaultItem)
  institution: "",
  studyType: "",
  area: "",
  score: "",
  date: "",
  summary: "",
  url: defaultUrl,
};
```

**Similar Pattern**: Same structure as Experience with different field names.

### Project Schema

**File**: `/libs/schema/src/sections/project.ts` (Lines 1-28)

```typescript
import { z } from "zod";
import { defaultItem, defaultUrl, itemSchema, urlSchema } from "../shared";

// Schema
export const projectSchema = itemSchema.extend({
  name: z.string().min(1),         // Required
  description: z.string(),         // Short description
  date: z.string(),                // Project date/duration
  summary: z.string(),             // HTML content for details
  keywords: z.array(z.string()).default([]),  // Tags/technologies
  url: urlSchema,                  // Project URL (demo, repo, etc.)
});

// Type
export type Project = z.infer<typeof projectSchema>;

// Defaults
export const defaultProject: Project = {
  ...defaultItem,
  name: "",
  description: "",
  date: "",
  summary: "",
  keywords: [],                    // Empty array, not undefined
  url: defaultUrl,
};
```

**Keywords Pattern**:
- Array of strings
- `.default([])` ensures never undefined
- Used for technologies, tags, etc.
- Displayed as comma-separated list on resume

### Custom Section Schema

**File**: `/libs/schema/src/sections/custom-section.ts` (Lines 1-30)

```typescript
import { z } from "zod";
import { defaultItem, defaultUrl, itemSchema, urlSchema } from "../shared";

// Schema
export const customSectionSchema = itemSchema.extend({
  name: z.string(),                // Entry name/title
  description: z.string(),         // Short description
  date: z.string(),                // Date/duration
  location: z.string(),            // Location
  summary: z.string(),             // HTML content
  keywords: z.array(z.string()).default([]),
  url: urlSchema,
});

// Type
export type CustomSection = z.infer<typeof customSectionSchema>;

// Defaults
export const defaultCustomSection: CustomSection = {
  ...defaultItem,
  name: "",
  description: "",
  date: "",
  location: "",
  summary: "",
  keywords: [],
  url: defaultUrl,
};
```

**Most Flexible**: Combines fields from multiple schemas, allows users to create any section type.

### Skill Schema

**File**: `/libs/schema/src/sections/skill.ts** (Lines 1-24)

```typescript
import { z } from "zod";
import { defaultItem, itemSchema } from "../shared";

// Schema
export const skillSchema = itemSchema.extend({
  name: z.string(),                // Skill name
  description: z.string(),         // Description (NOT rich text)
  level: z.coerce.number().min(0).max(5).default(1),  // Proficiency level
  keywords: z.array(z.string()).default([]),
});

// Type
export type Skill = z.infer<typeof skillSchema>;

// Defaults
export const defaultSkill: Skill = {
  ...defaultItem,
  name: "",
  description: "",                 // Plain text, not HTML
  level: 1,
  keywords: [],
};
```

**No Rich Text**: Skills use plain text description, not HTML.
**Level System**: 0-5 scale for proficiency visualization.
**Coercion**: `z.coerce.number()` converts string input to number.

### Profile Schema

**File**: `/libs/schema/src/sections/profile.ts` (Lines 1-28)

```typescript
import { z } from "zod";
import { defaultItem, defaultUrl, itemSchema, urlSchema } from "../shared";

// Schema
export const profileSchema = itemSchema.extend({
  network: z.string().min(1),      // e.g., "GitHub", "LinkedIn"
  username: z.string().min(1),     // Username/handle
  icon: z.string()                 // Simple Icons slug
    .describe(
      'Slug for the icon from https://simpleicons.org. For example, "github", "linkedin", etc.',
    ),
  url: urlSchema,                  // Profile URL
});

// Type
export type Profile = z.infer<typeof profileSchema>;

// Defaults
export const defaultProfile: Profile = {
  ...defaultItem,
  network: "",
  username: "",
  icon: "",                        // Maps to Simple Icons
  url: defaultUrl,
};
```

**Icon System**: Uses [Simple Icons](https://simpleicons.org/) slugs for brand icons.
**No Rich Text**: Profiles are simple links with icons.

## Section Container Schema

**File**: `/libs/schema/src/sections/index.ts` (Lines 20-87)

### Base Section Schema (Lines 20-25)

```typescript
export const sectionSchema = z.object({
  name: z.string(),                // Section title (e.g., "Work Experience")
  columns: z.number().min(1).max(5).default(1),  // Layout columns
  separateLinks: z.boolean().default(true),      // Show URLs separately
  visible: z.boolean().default(true),            // Section visibility
});
```

**Shared Properties**:
- `name` - Customizable section title
- `columns` - 1-5 columns for multi-column layout
- `separateLinks` - Whether to show URLs inline or separately
- `visible` - Global section visibility toggle

### Summary Section (Lines 34-37)

```typescript
summary: sectionSchema.extend({
  id: z.literal("summary"),        // Fixed ID
  content: z.string().default(""), // HTML content directly on section
}),
```

**Unique Pattern**: No `items` array, content stored directly on section.

### Item-Based Sections (Lines 38-85)

```typescript
experience: sectionSchema.extend({
  id: z.literal("experience"),
  items: z.array(experienceSchema),
}),

education: sectionSchema.extend({
  id: z.literal("education"),
  items: z.array(educationSchema),
}),

// ... similar for all other sections
```

**Pattern**: Each section has:
- Fixed ID (literal type)
- Items array of specific type
- Base section properties (name, columns, visible, etc.)

### Custom Sections (Line 86)

```typescript
custom: z.record(z.string(), customSchema),
```

**Dynamic Keys**: Record type allows arbitrary section IDs.
**Schema**:
```typescript
export const customSchema = sectionSchema.extend({
  id: idSchema,                    // Dynamic ID (not literal)
  items: z.array(customSectionSchema),
});
```

## Complete Sections Type

**File**: `/libs/schema/src/sections/index.ts` (Lines 89-96)

```typescript
export type Section = z.infer<typeof sectionSchema>;
export type Sections = z.infer<typeof sectionsSchema>;

export type SectionKey = "basics" | keyof Sections | `custom.${string}`;
export type SectionWithItem<T = unknown> = Sections[FilterKeys<Sections, { items: T[] }>];
export type SectionItem = SectionWithItem["items"][number];
export type CustomSectionGroup = z.infer<typeof customSchema>;
```

**Key Types**:
- `Sections` - The complete sections object
- `SectionKey` - Union of all valid section keys (including dynamic custom)
- `SectionWithItem<T>` - Type helper for item-based sections
- `SectionItem` - Union of all item types

## Default Values

**File**: `/libs/schema/src/sections/index.ts` (Lines 99-121)

```typescript
export const defaultSection: Section = {
  name: "",
  columns: 1,
  separateLinks: true,
  visible: true,
};

export const defaultSections: Sections = {
  summary: { ...defaultSection, id: "summary", name: "Summary", content: "" },
  awards: { ...defaultSection, id: "awards", name: "Awards", items: [] },
  certifications: { ...defaultSection, id: "certifications", name: "Certifications", items: [] },
  education: { ...defaultSection, id: "education", name: "Education", items: [] },
  experience: { ...defaultSection, id: "experience", name: "Experience", items: [] },
  volunteer: { ...defaultSection, id: "volunteer", name: "Volunteering", items: [] },
  interests: { ...defaultSection, id: "interests", name: "Interests", items: [] },
  languages: { ...defaultSection, id: "languages", name: "Languages", items: [] },
  profiles: { ...defaultSection, id: "profiles", name: "Profiles", items: [] },
  projects: { ...defaultSection, id: "projects", name: "Projects", items: [] },
  publications: { ...defaultSection, id: "publications", name: "Publications", items: [] },
  references: { ...defaultSection, id: "references", name: "References", items: [] },
  skills: { ...defaultSection, id: "skills", name: "Skills", items: [] },
  custom: {},
};
```

**Usage**:
- Initial state for new resumes
- Fallback when section doesn't exist
- Reset values in forms

## Resume Data Structure

**File**: `/libs/schema/src/index.ts` (Lines 1-29)

```typescript
import { z } from "zod";
import { basicsSchema, defaultBasics } from "./basics";
import { defaultMetadata, metadataSchema } from "./metadata";
import { defaultSections, sectionsSchema } from "./sections";

// Schema
export const resumeDataSchema = z.object({
  basics: basicsSchema,            // Personal info (name, email, etc.)
  sections: sectionsSchema,        // All resume sections
  metadata: metadataSchema,        // Styling, layout, fonts, etc.
});

// Type
export type ResumeData = z.infer<typeof resumeDataSchema>;

// Defaults
export const defaultResumeData: ResumeData = {
  basics: defaultBasics,
  sections: defaultSections,
  metadata: defaultMetadata,
};
```

**Top-Level Structure**:
```typescript
{
  basics: {
    name: "John Doe",
    email: "john@example.com",
    // ...
  },
  sections: {
    summary: { id: "summary", name: "Summary", content: "<p>...</p>", ... },
    experience: { id: "experience", name: "Experience", items: [...], ... },
    // ...
  },
  metadata: {
    template: "azurill",
    theme: { ... },
    // ...
  }
}
```

## Serialization & Deserialization

### Editor → Storage

**Process**:
1. User types in TipTap editor
2. `onUpdate` callback fires
3. `editor.getHTML()` extracts HTML string
4. HTML string passed to `onChange` callback
5. React Hook Form updates field value
6. Form submission sends HTML string to store/API

**Code Path**:
```typescript
// In RichInput component (line 484)
onUpdate: ({ editor }) => onChange?.(editor.getHTML())

// In dialog form field (experience.tsx line 128)
onChange={(value) => field.onChange(value)}

// Form submission (section-dialog.tsx lines 65-96)
onSubmit(values: T) {
  setValue(`sections.${id}.items`, updatedItems);
}
```

### Storage → Editor

**Process**:
1. Data loaded from store/API (HTML string)
2. Passed as `content` prop to RichInput
3. TipTap's `useEditor` hook parses HTML
4. Editor renders formatted content

**Code Path**:
```typescript
// In dialog (experience.tsx line 118)
<RichInput content={field.value} ... />

// In RichInput (rich-input.tsx line 482)
useEditor({ content, ... })
```

### Storage → Display

**Process**:
1. Resume data retrieved from store
2. HTML string extracted from section item
3. Sanitized using `sanitize()` function
4. Rendered using `dangerouslySetInnerHTML`

**Code Path**:
```typescript
// In template (azurill.tsx lines 226-230)
const summary = get(item, summaryKey, "") as string;

{summary !== undefined && !isEmptyString(summary) && (
  <div dangerouslySetInnerHTML={{ __html: sanitize(summary) }} className="wysiwyg" />
)}
```

## HTML Sanitization

**File**: `/libs/utils/src/namespaces/string.ts` (Lines 60-150)

### Sanitize Function

```typescript
export const sanitize = (html: string, options?: sanitizeHtml.IOptions) => {
  const allowedTags = (options?.allowedTags ?? []) as string[];

  return sanitizeHtml(html, {
    ...options,
    allowedTags: [
      ...allowedTags,
      // Text formatting
      "b", "strong", "i", "em", "u", "s", "mark",

      // Structure
      "p", "br", "div", "span",
      "h1", "h2", "h3", "h4", "h5", "h6",

      // Lists
      "ul", "ol", "li",

      // Links & Media
      "a", "img",

      // Code
      "code", "pre", "kbd", "samp",

      // Semantic
      "article", "section", "header", "footer", "aside", "nav", "main",
      "blockquote", "q", "cite", "abbr", "address",

      // Tables (if needed)
      "table", "thead", "tbody", "tfoot", "tr", "th", "td", "caption",
      "col", "colgroup",

      // Other
      "hr", "figure", "figcaption", "time", "data",
      "sub", "sup", "small", "wbr",
      "bdi", "bdo", "ruby", "rt", "rp", "rb", "rtc",
      "dl", "dt", "dd",
    ],
    allowedAttributes: {
      ...options?.allowedAttributes,
      "*": ["class", "style"],           // All tags can have class/style
      "a": ["href", "target"],           // Links need href/target
      "img": ["src", "alt"],             // Images need src/alt
    },
    allowedStyles: {
      ...options?.allowedStyles,
      "*": {
        "text-align": [/^left$/, /^right$/, /^center$/, /^justify$/],
      },
    },
  });
};
```

### Allowed Tags Breakdown

**Text Formatting**: b, strong, i, em, u, s, mark
**Structure**: p, br, div, span, h1-h6
**Lists**: ul, ol, li
**Links**: a (with href, target)
**Images**: img (with src, alt)
**Code**: code, pre, kbd, samp
**Semantic**: article, section, header, footer, etc.

### Security Features

1. **Whitelist-Based**: Only explicitly allowed tags pass through
2. **Attribute Filtering**: Only safe attributes allowed per tag
3. **Style Restrictions**: Only text-align styles allowed
4. **XSS Prevention**: Script tags, onclick handlers, etc. are stripped

### Usage Pattern

```typescript
// In templates
<div dangerouslySetInnerHTML={{ __html: sanitize(htmlString) }} />

// With custom options
<div dangerouslySetInnerHTML={{
  __html: sanitize(htmlString, { allowedTags: ["p", "strong"] })
}} />
```

## Validation Patterns

### Field-Level Validation

```typescript
// Required field
company: z.string().min(1)  // Error if empty

// Optional field
position: z.string()  // Empty string allowed

// URL validation
url: urlSchema  // Must be empty or valid URL

// Number with bounds
level: z.coerce.number().min(0).max(5)
```

### Form Validation

```typescript
const form = useForm<FormValues>({
  defaultValues: defaultExperience,
  resolver: zodResolver(experienceSchema),  // Zod schema validation
});
```

**Features**:
- Validation on submit
- Field-level error messages
- Type-safe form values
- Auto-completion in IDE

### Runtime Validation

```typescript
// Check URL validity
const hasError = useMemo(() => !urlSchema.safeParse(value).success, [value]);

// Validate before storage
resumeDataSchema.parse(resumeData);  // Throws if invalid
resumeDataSchema.safeParse(resumeData);  // Returns { success, data/error }
```

## Data Migration Patterns

**File**: `/libs/parser/src/reactive-resume-v3/index.ts`

The codebase includes parsers for importing from:
- LinkedIn exports
- JSON Resume format
- Reactive Resume v3 format

**Pattern**: Transform external data to match current schema, ensuring all required fields present with defaults.

## Next Document
See `RR_EDITOR_04_SECTION_PATTERNS.md` for section-specific implementation patterns and best practices.
