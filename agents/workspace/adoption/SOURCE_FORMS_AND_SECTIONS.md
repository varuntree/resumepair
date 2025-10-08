# Reactive-Resume: Forms and Sections Implementation Guide

**Source Repository**: `/Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume/`

This document provides a comprehensive analysis of how Reactive-Resume implements forms, sections, and input components. These patterns can be adopted for building similar resume editing features.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Technology Stack](#2-technology-stack)
3. [Data Schema Structure](#3-data-schema-structure)
4. [Section Implementations](#4-section-implementations)
5. [Rich Text Editor (TipTap)](#5-rich-text-editor-tiptap)
6. [Skill Level/Rating System](#6-skill-levelrating-system)
7. [Form Components](#7-form-components)
8. [Input Components](#8-input-components)
9. [State Management](#9-state-management)
10. [Key Patterns to Adopt](#10-key-patterns-to-adopt)

---

## 1. Architecture Overview

### Application Structure

```
apps/
├── client/          # React frontend application
│   └── src/
│       ├── components/   # Shared components
│       ├── pages/
│       │   └── builder/  # Resume builder page
│       │       └── sidebars/
│       │           ├── left/     # Editor sidebar (forms)
│       │           │   ├── dialogs/    # Section item dialogs
│       │           │   └── sections/   # Section containers
│       │           └── right/    # Customization sidebar
│       └── stores/       # Zustand stores
├── artboard/        # PDF rendering
└── server/          # NestJS backend

libs/
├── schema/          # Zod schemas and TypeScript types
├── ui/              # Reusable UI components (shadcn/ui based)
├── utils/           # Utility functions
└── hooks/           # React hooks
```

### Editor Organization

**Left Sidebar** (`apps/client/src/pages/builder/sidebars/left/`):
- Contains all resume editing forms
- Organized into sections (Basics, Summary, Experience, etc.)
- Each section uses dialog-based forms for editing items

**Dialogs** (`apps/client/src/pages/builder/sidebars/left/dialogs/`):
- Modal forms for editing section items
- One dialog per section type
- All use the shared `SectionDialog` wrapper

---

## 2. Technology Stack

### Core Dependencies

**Form Management:**
```json
{
  "react-hook-form": "^7.63.0",
  "@hookform/resolvers": "^3.10.0"
}
```

**Validation:**
```json
{
  "zod": "^3.25.76"
}
```

**Rich Text Editor:**
```json
{
  "@tiptap/core": "^2.26.2",
  "@tiptap/react": "^2.26.2",
  "@tiptap/starter-kit": "^2.26.1",
  "@tiptap/extension-highlight": "^2.26.2",
  "@tiptap/extension-image": "^2.26.2",
  "@tiptap/extension-link": "^2.26.2",
  "@tiptap/extension-text-align": "^2.26.2",
  "@tiptap/extension-underline": "^2.26.2"
}
```

**UI Components:**
```json
{
  "@radix-ui/react-slider": "^1.3.6",
  "@radix-ui/react-dialog": "^1.1.15",
  "@radix-ui/react-label": "^2.1.7"
}
```

**State Management:**
```json
{
  "zustand": "^4.5.7",
  "zundo": "^2.3.0",  // Undo/redo for zustand
  "immer": "^10.1.3"
}
```

**Drag and Drop:**
```json
{
  "@dnd-kit/core": "^6.3.1",
  "@dnd-kit/sortable": "^8.0.0"
}
```

**Animation:**
```json
{
  "framer-motion": "^11.18.2"
}
```

---

## 3. Data Schema Structure

### Top-Level Schema

**Location**: `libs/schema/src/index.ts`

```typescript
export const resumeDataSchema = z.object({
  basics: basicsSchema,
  sections: sectionsSchema,
  metadata: metadataSchema,
});

export type ResumeData = z.infer<typeof resumeDataSchema>;
```

### Base Item Schema

**Location**: `libs/schema/src/shared/item.ts`

Every section item extends this base:

```typescript
export const itemSchema = z.object({
  id: idSchema,      // CUID2 generated ID
  visible: z.boolean(),
});

export type Item = z.infer<typeof itemSchema>;

export const defaultItem: Item = {
  id: "",
  visible: true,
};
```

### URL Schema

**Location**: `libs/schema/src/shared/url.ts`

URLs have both href and label:

```typescript
export const urlSchema = z.object({
  label: z.string(),
  href: z.literal("").or(z.string().url()),
});

export type URL = z.infer<typeof urlSchema>;

export const defaultUrl: URL = {
  label: "",
  href: "",
};
```

### Section Container Schema

**Location**: `libs/schema/src/sections/index.ts`

```typescript
export const sectionSchema = z.object({
  name: z.string(),                    // Display name
  columns: z.number().min(1).max(5).default(1),  // Layout columns
  separateLinks: z.boolean().default(true),      // Link rendering
  visible: z.boolean().default(true),            // Section visibility
});

export type Section = z.infer<typeof sectionSchema>;
```

### Sections Schema

All resume sections:

```typescript
export const sectionsSchema = z.object({
  summary: sectionSchema.extend({
    id: z.literal("summary"),
    content: z.string().default(""),  // HTML content from rich text
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

---

## 4. Section Implementations

### 4.1 Basics Section

**Schema**: `libs/schema/src/basics/index.ts`

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

**Fields:**
- Name (required)
- Headline
- Email (validated)
- Phone
- Location
- Website (URL with label)
- Custom fields (array)
- Picture (with size, aspect ratio, border radius, effects)

**Component**: `apps/client/src/pages/builder/sidebars/left/sections/basics.tsx`

**Pattern**: Direct editing (no dialog), uses `setValue` directly on change

```typescript
<Input
  id="basics.name"
  value={basics.name}
  onChange={(event) => {
    setValue("basics.name", event.target.value);
  }}
/>
```

---

### 4.2 Summary Section

**Schema**: Part of `sectionsSchema` with `content: z.string()`

**Component**: `apps/client/src/pages/builder/sidebars/left/sections/summary.tsx`

**Fields:**
- Content (HTML from rich text editor)

**Pattern**: Uses RichInput directly with AI actions footer

```typescript
<RichInput
  content={section.content}
  footer={(editor) => (
    <AiActions
      value={editor.getText()}
      onChange={(value) => {
        editor.commands.setContent(value, true);
        setValue("sections.summary.content", value);
      }}
    />
  )}
  onChange={(value) => {
    setValue("sections.summary.content", value);
  }}
/>
```

---

### 4.3 Experience Section

**Schema**: `libs/schema/src/sections/experience.ts`

```typescript
export const experienceSchema = itemSchema.extend({
  company: z.string().min(1),
  position: z.string(),
  location: z.string(),
  date: z.string(),         // Free-form date string
  summary: z.string(),      // HTML from rich text
  url: urlSchema,
});
```

**Dialog**: `apps/client/src/pages/builder/sidebars/left/dialogs/experience.tsx`

**Fields:**
- Company (required)
- Position
- Location
- Date (text input, e.g., "March 2023 - Present")
- Website (URL)
- Summary (rich text with AI actions)

**Pattern**: Uses `SectionDialog` wrapper with form grid

---

### 4.4 Education Section

**Schema**: `libs/schema/src/sections/education.ts`

```typescript
export const educationSchema = itemSchema.extend({
  institution: z.string().min(1),
  studyType: z.string(),    // e.g., "Bachelor's Degree"
  area: z.string(),         // e.g., "Computer Science"
  score: z.string(),        // e.g., "9.2 GPA"
  date: z.string(),
  summary: z.string(),      // HTML
  url: urlSchema,
});
```

**Dialog**: `apps/client/src/pages/builder/sidebars/left/dialogs/education.tsx`

**Fields:**
- Institution (required)
- Type of Study
- Area of Study
- Score
- Date
- Website (URL)
- Summary (rich text with AI actions)

---

### 4.5 Skills Section ⭐ CRITICAL

**Schema**: `libs/schema/src/sections/skill.ts`

```typescript
export const skillSchema = itemSchema.extend({
  name: z.string(),
  description: z.string(),
  level: z.coerce.number().min(0).max(5).default(1),  // 0-5 scale
  keywords: z.array(z.string()).default([]),
});
```

**Dialog**: `apps/client/src/pages/builder/sidebars/left/dialogs/skills.tsx`

**Fields:**
- Name
- Description
- **Level (0-5 slider)** ⭐
- Keywords (badge input with drag-to-reorder)

**Level Implementation:**

```typescript
<FormField
  name="level"
  control={form.control}
  render={({ field }) => (
    <FormItem className="sm:col-span-2">
      <FormLabel>{t`Level`}</FormLabel>
      <FormControl className="py-2">
        <div className="flex items-center gap-x-4">
          <Slider
            {...field}
            min={0}
            max={5}
            value={[field.value]}
            orientation="horizontal"
            onValueChange={(value) => {
              field.onChange(value[0]);
            }}
          />

          {field.value > 0 ? (
            <span className="text-base font-bold">{field.value}</span>
          ) : (
            <span className="text-base font-bold">{t`Hidden`}</span>
          )}
        </div>
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

**Key Features:**
- Level 0 = Hidden (doesn't show level on resume)
- Levels 1-5 = Visible ratings
- Uses Radix UI Slider
- Shows numeric value next to slider

---

### 4.6 Languages Section ⭐ CRITICAL

**Schema**: `libs/schema/src/sections/language.ts`

```typescript
export const languageSchema = itemSchema.extend({
  name: z.string().min(1),
  description: z.string(),
  level: z.coerce.number().min(0).max(5).default(1),  // Same as skills
});
```

**Dialog**: `apps/client/src/pages/builder/sidebars/left/dialogs/languages.tsx`

**Fields:**
- Name
- Description
- **Level (0-5 slider)** - Same implementation as Skills

---

### 4.7 Projects Section

**Schema**: `libs/schema/src/sections/project.ts`

```typescript
export const projectSchema = itemSchema.extend({
  name: z.string().min(1),
  description: z.string(),
  date: z.string(),
  summary: z.string(),      // HTML
  keywords: z.array(z.string()).default([]),
  url: urlSchema,
});
```

**Dialog**: `apps/client/src/pages/builder/sidebars/left/dialogs/projects.tsx`

**Fields:**
- Name (required)
- Description
- Date
- Website (URL)
- Summary (rich text with AI actions)
- Keywords (badge input with drag-to-reorder)

---

### 4.8 Certifications Section

**Schema**: `libs/schema/src/sections/certification.ts`

```typescript
export const certificationSchema = itemSchema.extend({
  name: z.string().min(1),
  issuer: z.string(),
  date: z.string(),
  summary: z.string(),
  url: urlSchema,
});
```

**Fields:**
- Name (required)
- Issuer
- Date
- Website (URL)
- Summary (rich text)

---

### 4.9 Awards Section

**Schema**: `libs/schema/src/sections/award.ts`

```typescript
export const awardSchema = itemSchema.extend({
  title: z.string().min(1),
  awarder: z.string(),
  date: z.string(),
  summary: z.string(),
  url: urlSchema,
});
```

**Fields:**
- Title (required)
- Awarder
- Date
- Website (URL)
- Summary (rich text)

---

### 4.10 Publications Section

**Schema**: `libs/schema/src/sections/publication.ts`

```typescript
export const publicationSchema = itemSchema.extend({
  name: z.string().min(1),
  publisher: z.string(),
  date: z.string(),
  summary: z.string(),
  url: urlSchema,
});
```

**Fields:**
- Name (required)
- Publisher
- Date
- Website (URL)
- Summary (rich text)

---

### 4.11 Volunteer Section

**Schema**: `libs/schema/src/sections/volunteer.ts`

```typescript
export const volunteerSchema = itemSchema.extend({
  organization: z.string().min(1),
  position: z.string(),
  location: z.string(),
  date: z.string(),
  summary: z.string(),
  url: urlSchema,
});
```

**Fields:**
- Organization (required)
- Position
- Location
- Date
- Website (URL)
- Summary (rich text)

---

### 4.12 Interests Section

**Schema**: `libs/schema/src/sections/interest.ts`

```typescript
export const interestSchema = itemSchema.extend({
  name: z.string().min(1),
  keywords: z.array(z.string()).default([]),
});
```

**Fields:**
- Name (required)
- Keywords (badge input)

---

### 4.13 References Section

**Schema**: `libs/schema/src/sections/reference.ts`

```typescript
export const referenceSchema = itemSchema.extend({
  name: z.string().min(1),
  description: z.string(),
  summary: z.string(),
  url: urlSchema,
});
```

**Fields:**
- Name (required)
- Description
- Website (URL)
- Summary (rich text)

---

### 4.14 Profiles Section

**Schema**: `libs/schema/src/sections/profile.ts`

```typescript
export const profileSchema = itemSchema.extend({
  network: z.string().min(1),      // e.g., "LinkedIn"
  username: z.string().min(1),
  icon: z.string(),                // Simple Icons slug
  url: urlSchema,
});
```

**Fields:**
- Network (required, e.g., "LinkedIn", "GitHub")
- Username (required)
- Icon (Simple Icons slug)
- URL

---

## 5. Rich Text Editor (TipTap) ⭐ CRITICAL

### Implementation

**Location**: `libs/ui/src/components/rich-input.tsx`

**Library**: TipTap (ProseMirror-based)

### Configuration

```typescript
const editor = useEditor({
  extensions: [
    StarterKit,              // Basic functionality
    Image,                   // Image insertion
    Underline,              // Underline text
    Highlight,              // Text highlighting
    TextAlign.configure({ types: ["heading", "paragraph"] }),
    Link.extend({ inclusive: false }).configure({ openOnClick: false }),
  ],
  editorProps: {
    attributes: {
      class: cn(
        "prose prose-sm prose-zinc max-h-[200px] max-w-none overflow-y-scroll dark:prose-invert focus:outline-none [&_*]:my-2",
        editorClassName,
      ),
    },
  },
  content,  // Initial HTML content
  parseOptions: { preserveWhitespace: "full" },
  onUpdate: ({ editor }) => onChange?.(editor.getHTML()),  // Returns HTML
});
```

### Features Enabled

**Text Formatting:**
- Bold
- Italic
- Strikethrough
- Underline
- Highlight
- Inline code
- Code blocks

**Structure:**
- Headings (H1, H2, H3)
- Paragraphs
- Bullet lists
- Numbered lists
- Indent/outdent

**Alignment:**
- Left
- Center
- Right
- Justify

**Media:**
- Hyperlinks (with URL prompt)
- Images (from URL)
- Horizontal rules
- Hard breaks

**Editing:**
- Undo
- Redo

### Toolbar Implementation

**Location**: Lines 125-449 in `rich-input.tsx`

Each button uses a `Toggle` or `Button` component with TipTap commands:

```typescript
<Toggle
  size="sm"
  type="button"
  pressed={editor.isActive("bold")}
  disabled={!editor.can().chain().toggleBold().run()}
  onPressedChange={() => editor.chain().focus().toggleBold().run()}
>
  <TextBIcon />
</Toggle>
```

### Data Storage

**Format**: HTML string

**Example**:
```html
<p>Led a team of <strong>5 engineers</strong> to build:</p>
<ul>
<li>Feature A with 99% uptime</li>
<li>Feature B used by 10k+ users</li>
</ul>
```

### Usage Pattern

```typescript
<RichInput
  content={field.value}           // HTML string
  onChange={(value) => {          // value is HTML
    field.onChange(value);
  }}
  footer={(editor) => (           // Optional footer
    <AiActions
      value={editor.getText()}     // Plain text for AI
      onChange={(value) => {
        editor.commands.setContent(value, true);  // Set HTML
        field.onChange(value);
      }}
    />
  )}
/>
```

### Key Methods

- `editor.getHTML()` - Get HTML string
- `editor.getText()` - Get plain text
- `editor.commands.setContent(html, true)` - Set HTML content
- `editor.chain().focus().toggleBold().run()` - Chain commands

---

## 6. Skill Level/Rating System ⭐ CRITICAL

### Scale

**Range**: 0-5
- **0**: Hidden (level not displayed on resume)
- **1-5**: Visible levels (beginner to expert)

### Implementation

**Slider Component**: `libs/ui/src/components/slider.tsx`

Based on Radix UI Slider:

```typescript
import * as SliderPrimitive from "@radix-ui/react-slider";

export const Slider = forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn("relative flex w-full touch-none select-none items-center", className)}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-2.5 w-full grow overflow-hidden rounded-full bg-secondary">
      <SliderPrimitive.Range className="absolute h-full bg-primary" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="block size-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
  </SliderPrimitive.Root>
));
```

### Usage in Forms

**From Skills Dialog**:

```typescript
<FormField
  name="level"
  control={form.control}
  render={({ field }) => (
    <FormItem className="sm:col-span-2">
      <FormLabel>{t`Level`}</FormLabel>
      <FormControl className="py-2">
        <div className="flex items-center gap-x-4">
          <Slider
            {...field}
            min={0}
            max={5}
            value={[field.value]}      // Array for multi-thumb support
            orientation="horizontal"
            onValueChange={(value) => {
              field.onChange(value[0]);  // Extract first value
            }}
          />

          {/* Display current value */}
          {field.value > 0 ? (
            <span className="text-base font-bold">{field.value}</span>
          ) : (
            <span className="text-base font-bold">{t`Hidden`}</span>
          )}
        </div>
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

### Key Features

1. **Visual Feedback**: Shows numeric value next to slider
2. **Hidden State**: Level 0 shows "Hidden" text
3. **Responsive**: Works on touch and desktop
4. **Accessible**: Uses Radix UI primitives
5. **Styled**: Custom thumb and track styling

### Rendering Levels on Resume

Templates can display levels as:
- Numeric (1-5)
- Bars/dots
- Percentages (20%, 40%, 60%, 80%, 100%)
- Text labels (Beginner, Intermediate, Advanced, Expert, Master)

---

## 7. Form Components

### 7.1 SectionDialog Wrapper

**Location**: `apps/client/src/pages/builder/sidebars/left/sections/shared/section-dialog.tsx`

**Purpose**: Reusable dialog wrapper for all section item forms

**Features:**
- Handles create/update/duplicate/delete modes
- Manages form state
- Integrates with Zustand store
- Handles pending keywords (for badge inputs)

**Usage Pattern:**

```typescript
export const ExperienceDialog = () => {
  const form = useForm<FormValues>({
    defaultValues: defaultExperience,
    resolver: zodResolver(formSchema),
  });

  return (
    <SectionDialog<FormValues>
      id="experience"
      form={form}
      defaultValues={defaultExperience}
    >
      {/* Form fields go here */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField ... />
        <FormField ... />
      </div>
    </SectionDialog>
  );
};
```

**Props:**
- `id`: Section key (e.g., "skills", "experience")
- `form`: React Hook Form instance
- `defaultValues`: Default values for form reset
- `pendingKeyword`: For badge input integration
- `children`: Form fields

**Modes:**
- `create`: Add new item
- `update`: Edit existing item
- `duplicate`: Copy item
- `delete`: Remove item (shows confirmation)

---

### 7.2 SectionBase Component

**Location**: `apps/client/src/pages/builder/sidebars/left/sections/shared/section-base.tsx`

**Purpose**: Container for section lists (Experience, Skills, etc.)

**Features:**
- Renders section header with icon
- Shows list of items
- Drag-and-drop reordering (via @dnd-kit)
- Add new item button
- Item visibility toggle
- Section options (visibility, columns, etc.)

**Usage Pattern:**

```typescript
<SectionBase<Skill>
  id="skills"
  title={(item) => item.name}
  description={(item) => {
    if (item.description) return item.description;
    if (item.keywords.length > 0) return `${item.keywords.length} keywords`;
  }}
/>
```

**Props:**
- `id`: Section key
- `title`: Function to extract item title
- `description`: Optional function to extract item description

---

### 7.3 SectionListItem Component

**Location**: `apps/client/src/pages/builder/sidebars/left/sections/shared/section-list-item.tsx`

**Purpose**: Individual item in section list

**Features:**
- Drag handle for reordering
- Click to edit
- Context menu with:
  - Toggle visibility
  - Edit
  - Copy
  - Remove

**Visual States:**
- Normal
- Dragging (50% opacity)
- Hidden (50% opacity)
- Hover (background change)

---

### 7.4 Form Field Components

**Location**: `libs/ui/src/components/form.tsx`

Based on React Hook Form, wraps Radix UI:

**FormField**: Controller wrapper
```typescript
<FormField
  name="company"
  control={form.control}
  render={({ field }) => (
    <FormItem>
      <FormLabel>{t`Company`}</FormLabel>
      <FormControl>
        <Input {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

**Components:**
- `FormField`: Wrapper for Controller
- `FormItem`: Container with spacing
- `FormLabel`: Label with error styling
- `FormControl`: Input wrapper with accessibility
- `FormDescription`: Helper text
- `FormMessage`: Error message display

---

## 8. Input Components

### 8.1 Input Component

**Location**: `libs/ui/src/components/input.tsx`

**Features:**
- Error state styling (`hasError` prop)
- Auto-complete off
- File input styling
- Number input (removes spin buttons)
- Focus states

**Usage:**
```typescript
<Input
  value={basics.email}
  hasError={!basicsSchema.pick({ email: true }).safeParse({ email: basics.email }).success}
  onChange={(event) => setValue("basics.email", event.target.value)}
/>
```

---

### 8.2 URLInput Component ⭐

**Location**: `apps/client/src/pages/builder/sidebars/left/sections/shared/url-input.tsx`

**Purpose**: Input for URLs with label

**Features:**
- URL validation
- Label input in popover
- Error display
- Icon button to open label input

**Usage:**
```typescript
<URLInput
  value={basics.url}  // { label: "", href: "" }
  placeholder="https://example.com"
  onChange={(value) => setValue("basics.url", value)}
/>
```

**Structure:**
```typescript
<div className="flex gap-x-1">
  <Input
    value={value.href}
    hasError={hasError}
    onChange={(event) => onChange({ ...value, href: event.target.value })}
  />
  <Popover>
    <PopoverTrigger>
      <Button size="icon" variant="ghost">
        <TagIcon />
      </Button>
    </PopoverTrigger>
    <PopoverContent>
      <Input
        value={value.label}
        placeholder={t`Label`}
        onChange={(event) => onChange({ ...value, label: event.target.value })}
      />
    </PopoverContent>
  </Popover>
</div>
```

---

### 8.3 BadgeInput Component ⭐

**Location**: `libs/ui/src/components/badge-input.tsx`

**Purpose**: Input for array of strings (keywords, tags)

**Features:**
- Comma-separated input
- Enter to add
- Prevents duplicates
- Returns array of strings

**Usage:**
```typescript
<BadgeInput
  value={field.value}  // string[]
  onChange={field.onChange}
  setPendingKeyword={setPendingKeyword}  // Optional, for SectionDialog
/>
```

**Display with Drag-to-Reorder:**

```typescript
<div className="flex flex-wrap items-center gap-x-2 gap-y-3">
  <AnimatePresence>
    {field.value.map((item, index) => (
      <motion.div
        key={item}
        layout
        draggable
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0, transition: { delay: index * 0.1 } }}
        exit={{ opacity: 0, x: -50 }}
        onDragStart={() => setDraggedIndex(index)}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, index, field)}
      >
        <Badge className="cursor-pointer">
          <span className="mr-1">{item}</span>
          <XIcon
            size={12}
            weight="bold"
            onClick={() => field.onChange(field.value.filter((v) => item !== v))}
          />
        </Badge>
      </motion.div>
    ))}
  </AnimatePresence>
</div>
```

---

### 8.4 RichInput Component

See [Section 5: Rich Text Editor](#5-rich-text-editor-tiptap)

---

### 8.5 Slider Component

See [Section 6: Skill Level/Rating System](#6-skill-levelrating-system)

---

## 9. State Management

### 9.1 Resume Store

**Location**: `apps/client/src/stores/resume.ts`

**Library**: Zustand with Immer and Zundo (undo/redo)

**Schema:**

```typescript
type ResumeStore = {
  resume: ResumeDto;  // Complete resume data

  // Actions
  setValue: (path: string, value: unknown) => void;
  addSection: () => void;
  removeSection: (sectionId: SectionKey) => void;
};
```

**Usage:**

```typescript
const setValue = useResumeStore((state) => state.setValue);
const basics = useResumeStore((state) => state.resume.data.basics);

// Update any path in resume data
setValue("basics.email", "john@example.com");
setValue("sections.skills.items[0].level", 4);
setValue("sections.summary.content", "<p>New summary</p>");
```

**Features:**
- **Immer**: Immutable updates with mutable syntax
- **Zundo**: Built-in undo/redo (100 levels)
- **Debounced Save**: Auto-saves to server after updates
- **Deep Path Updates**: Uses lodash.set for nested updates

---

### 9.2 Dialog Store

**Location**: `apps/client/src/stores/dialog.ts`

**Purpose**: Manages modal dialogs for editing section items

**Schema:**

```typescript
type Dialog<T = unknown> = {
  name: DialogName;     // Section key or special dialog
  mode: DialogMode;     // "create" | "update" | "duplicate" | "delete"
  payload?: DialogPayload<T>;
};

type DialogPayload<T = unknown> = {
  id: DialogName;
  item?: T;  // Item being edited
};
```

**Usage:**

```typescript
const { open, close, isOpen, mode, payload } = useDialog<Skill>("skills");

// Open dialog to create new skill
open("create", { id: "skills" });

// Open dialog to edit existing skill
open("update", { id: "skills", item: existingSkill });

// Open dialog to duplicate skill
open("duplicate", { id: "skills", item: existingSkill });

// Open confirmation to delete skill
open("delete", { id: "skills", item: existingSkill });
```

---

### 9.3 Data Flow

**Editing Flow:**

1. User clicks "Add" or "Edit" on a section item
2. `SectionBase` calls `useDialog().open()` with mode and payload
3. Dialog opens (e.g., `SkillsDialog`)
4. User edits form fields
5. User clicks "Save"
6. `SectionDialog` calls `onSubmit`
7. `onSubmit` updates store via `setValue()`
8. Store updates trigger debounced server save
9. Dialog closes
10. List re-renders with updated data

**Store Update Pattern:**

```typescript
// In SectionDialog onSubmit:
if (isCreate || isDuplicate) {
  setValue(
    `sections.${id}.items`,
    produce(section.items, (draft: T[]): void => {
      draft.push({ ...values, id: createId() });
    }),
  );
}

if (isUpdate) {
  setValue(
    `sections.${id}.items`,
    produce(section.items, (draft: T[]): void => {
      const index = draft.findIndex((item) => item.id === payload.item?.id);
      if (index !== -1) draft[index] = values;
    }),
  );
}
```

---

## 10. Key Patterns to Adopt

### 10.1 Schema-Driven Development

**Pattern**: Define Zod schemas first, derive types

```typescript
// 1. Define schema
export const skillSchema = itemSchema.extend({
  name: z.string(),
  level: z.coerce.number().min(0).max(5).default(1),
});

// 2. Derive TypeScript type
export type Skill = z.infer<typeof skillSchema>;

// 3. Create default values
export const defaultSkill: Skill = {
  ...defaultItem,
  name: "",
  level: 1,
};

// 4. Use in form validation
const form = useForm<Skill>({
  defaultValues: defaultSkill,
  resolver: zodResolver(skillSchema),  // Automatic validation
});
```

**Benefits:**
- Single source of truth
- Type safety
- Runtime validation
- Auto-generated error messages
- Easy schema evolution

---

### 10.2 Composition Over Inheritance

**Pattern**: Build complex forms from simple, reusable components

**Example: Section Dialog Pattern**

```typescript
// Reusable wrapper
<SectionDialog id="skills" form={form} defaultValues={defaultSkill}>
  {/* Compose with any fields */}
  <FormField name="name" ... />
  <FormField name="level" ... />
</SectionDialog>
```

**Reusable Components:**
- `SectionDialog` - Modal wrapper
- `SectionBase` - List container
- `SectionListItem` - List item with actions
- `FormField` - Form field wrapper
- `URLInput` - URL with label
- `BadgeInput` - Array of strings
- `RichInput` - Rich text editor

---

### 10.3 Controlled Components with Zustand

**Pattern**: Store as single source of truth

```typescript
// Component reads from store
const email = useResumeStore((state) => state.resume.data.basics.email);
const setValue = useResumeStore((state) => state.setValue);

// Component updates store directly
<Input
  value={email}
  onChange={(e) => setValue("basics.email", e.target.value)}
/>

// Store handles:
// 1. Immutable updates (via Immer)
// 2. Undo/redo tracking (via Zundo)
// 3. Server sync (debounced)
```

**Benefits:**
- No local state needed
- Undo/redo works automatically
- Auto-save works automatically
- Easy to debug (single store)

---

### 10.4 Dialog-Based Editing

**Pattern**: Edit complex items in modals

**Structure:**
```
Section Container (SectionBase)
  ├─ Section Header
  ├─ Item List
  │   ├─ Item 1 (click to edit)
  │   ├─ Item 2 (click to edit)
  │   └─ Item 3 (click to edit)
  └─ Add Button

Dialog (SkillsDialog)
  ├─ Form Fields
  └─ Save Button
```

**Benefits:**
- Keeps main view clean
- Focuses user attention
- Reuses validation logic
- Handles create/update/duplicate/delete

---

### 10.5 Rich Text Storage

**Pattern**: Store HTML, display with TipTap

**Reasoning:**
- Markdown: Limited formatting, requires conversion
- JSON: Large, requires custom renderer
- **HTML**: Standard, portable, works everywhere

**Implementation:**
```typescript
// Store
summary: z.string()  // HTML string

// Edit
<RichInput
  content={summary}  // HTML in
  onChange={(html) => setValue("summary", html)}  // HTML out
/>

// Display (in templates)
<div dangerouslySetInnerHTML={{ __html: summary }} />
```

---

### 10.6 Level/Rating System

**Pattern**: 0-5 numeric scale with Radix Slider

**Implementation:**
```typescript
// Schema
level: z.coerce.number().min(0).max(5).default(1)

// UI
<Slider
  min={0}
  max={5}
  value={[field.value]}
  onValueChange={(value) => field.onChange(value[0])}
/>

// Display options in templates:
// - Numeric: 4/5
// - Bars: ████░
// - Percentage: 80%
// - Text: "Expert"
```

**Why 0-5:**
- 0 = Hidden
- 1-5 = Common rating scale
- Easy to understand
- Maps well to visual representations

---

### 10.7 URL with Label

**Pattern**: Store both href and label

```typescript
// Schema
url: z.object({
  label: z.string(),
  href: z.literal("").or(z.string().url()),
})

// Display
{url.href && (
  <a href={url.href}>
    {url.label || url.href}  // Show label or fallback to URL
  </a>
)}
```

**Benefits:**
- Cleaner display ("Portfolio" vs "https://example.com")
- Still accessible (full URL in href)
- User-friendly editing

---

### 10.8 Keywords/Tags with Drag-to-Reorder

**Pattern**: BadgeInput + Framer Motion + native drag-and-drop

**Benefits:**
- Easy to add (comma-separated or Enter)
- Visual feedback (badges)
- Reorderable (drag-and-drop)
- Deletable (click X)

**Implementation:**
```typescript
// Input
<BadgeInput value={keywords} onChange={setKeywords} />

// Display
<AnimatePresence>
  {keywords.map((keyword, index) => (
    <motion.div
      draggable
      onDragStart={() => setDraggedIndex(index)}
      onDrop={(e) => handleDrop(e, index)}
    >
      <Badge onClick={() => removeKeyword(keyword)}>
        {keyword} <XIcon />
      </Badge>
    </motion.div>
  ))}
</AnimatePresence>
```

---

### 10.9 Date as String

**Pattern**: Free-form text input, not date picker

**Reasoning:**
- Resumes often use non-standard formats:
  - "March 2023 - Present"
  - "Summer 2022"
  - "2020 - 2022"
  - "Q1 2023"
- Users know how they want to format dates
- Simpler UX (no calendar widget)

**Implementation:**
```typescript
date: z.string()

<Input
  placeholder={t`March 2023 - Present`}
  value={date}
  onChange={(e) => setDate(e.target.value)}
/>
```

---

### 10.10 Custom Sections

**Pattern**: Allow users to add custom sections

**Schema:**
```typescript
custom: z.record(z.string(), customSchema)

// custom = {
//   "abc123": { id: "abc123", name: "Patents", items: [...] },
//   "def456": { id: "def456", name: "Publications", items: [...] }
// }
```

**Benefits:**
- Unlimited extensibility
- User-defined section names
- Same editing pattern as built-in sections

---

## Summary: Critical Features to Adopt

### 1. Technology Stack
- **Forms**: React Hook Form + Zod
- **Rich Text**: TipTap (ProseMirror)
- **UI**: Radix UI primitives
- **State**: Zustand + Immer + Zundo
- **Drag-and-Drop**: @dnd-kit

### 2. Rich Text Editor
- Use TipTap with StarterKit
- Store as HTML
- Enable: bold, italic, underline, lists, headings, links, alignment
- Optional: images, highlighting, code blocks

### 3. Skill/Language Level System
- 0-5 numeric scale
- Radix UI Slider
- 0 = Hidden
- Show numeric value next to slider

### 4. Section Architecture
- Base schema: `{ id, visible }`
- Section container: `{ name, columns, separateLinks, visible, items[] }`
- Dialog-based editing
- Drag-and-drop reordering
- Create/Update/Duplicate/Delete modes

### 5. Input Components
- **URLInput**: URL with label
- **BadgeInput**: Keywords/tags with drag-to-reorder
- **RichInput**: TipTap editor with toolbar
- **Slider**: Radix UI for levels

### 6. Form Patterns
- Schema-first with Zod
- `SectionDialog` wrapper for modals
- `SectionBase` for item lists
- Direct store updates (no local state)
- Debounced auto-save

### 7. State Management
- Single Zustand store
- Path-based updates (`setValue("path.to.field", value)`)
- Immer for immutability
- Zundo for undo/redo
- Dialog state separate from data

### 8. Data Patterns
- HTML for rich text
- String for dates (free-form)
- URL objects with label and href
- Arrays for keywords/tags
- Numeric levels (0-5)
- Record for custom sections

---

## File Reference Quick Guide

### Schema Files
- Base: `libs/schema/src/shared/item.ts`
- URL: `libs/schema/src/shared/url.ts`
- Sections: `libs/schema/src/sections/`
- Main: `libs/schema/src/index.ts`

### UI Components
- RichInput: `libs/ui/src/components/rich-input.tsx`
- Slider: `libs/ui/src/components/slider.tsx`
- BadgeInput: `libs/ui/src/components/badge-input.tsx`
- Input: `libs/ui/src/components/input.tsx`
- Form: `libs/ui/src/components/form.tsx`

### Dialog Components
- Wrapper: `apps/client/src/pages/builder/sidebars/left/sections/shared/section-dialog.tsx`
- Skills: `apps/client/src/pages/builder/sidebars/left/dialogs/skills.tsx`
- Languages: `apps/client/src/pages/builder/sidebars/left/dialogs/languages.tsx`
- Experience: `apps/client/src/pages/builder/sidebars/left/dialogs/experience.tsx`
- All others: `apps/client/src/pages/builder/sidebars/left/dialogs/`

### Section Containers
- Base: `apps/client/src/pages/builder/sidebars/left/sections/shared/section-base.tsx`
- List Item: `apps/client/src/pages/builder/sidebars/left/sections/shared/section-list-item.tsx`
- URLInput: `apps/client/src/pages/builder/sidebars/left/sections/shared/url-input.tsx`

### Main Editor
- Left Sidebar: `apps/client/src/pages/builder/sidebars/left/index.tsx`
- Basics: `apps/client/src/pages/builder/sidebars/left/sections/basics.tsx`
- Summary: `apps/client/src/pages/builder/sidebars/left/sections/summary.tsx`

### State Management
- Resume Store: `apps/client/src/stores/resume.ts`
- Dialog Store: `apps/client/src/stores/dialog.ts`

---

## End of Document

This comprehensive guide covers all form and section implementation patterns from Reactive-Resume. Use it as a reference when building similar resume editing features.

**Key Takeaways:**
1. TipTap for rich text (stores HTML)
2. Radix Slider for skill levels (0-5 scale)
3. Zod schemas drive everything
4. Dialog-based editing keeps UI clean
5. Zustand + Immer + Zundo for state
6. Composition of simple components
7. URL with label for better UX
8. BadgeInput for keywords
9. Free-form date strings
10. Custom sections for extensibility
