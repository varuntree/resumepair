# Reactive-Resume Rich Text Editor - Overview

## Technology Stack

### Core Editor Library
- **TipTap v2.26.2** - Primary rich text editor framework
  - Built on ProseMirror
  - Modular extension architecture
  - React integration via @tiptap/react
  - Location: Used throughout client app

### TipTap Extensions Used
Based on package.json (lines 62, 180-187) and implementation analysis:

1. **@tiptap/core** (v2.26.2) - Core editor functionality
2. **@tiptap/react** (v2.26.2) - React bindings
3. **@tiptap/starter-kit** (v2.26.1) - Bundle of common extensions including:
   - Bold, Italic, Strike
   - Headings (H1-H6)
   - Paragraph
   - Lists (Bullet, Ordered)
   - Code, Code Block
   - History (Undo/Redo)
   - Hard Break
   - Horizontal Rule

4. **@tiptap/extension-underline** (v2.26.2) - Underline text
5. **@tiptap/extension-highlight** (v2.26.2) - Text highlighting
6. **@tiptap/extension-link** (v2.26.2) - Hyperlink support
7. **@tiptap/extension-text-align** (v2.26.2) - Text alignment (left, center, right, justify)
8. **@tiptap/extension-image** (v2.26.2) - Image insertion
9. **@tiptap/pm** (v2.26.2) - ProseMirror utilities

### Supporting Libraries
- **sanitize-html** (v2.17.0) - HTML sanitization for safe rendering
- **react-hook-form** (v7.63.0) - Form state management
- **zod** (v3.25.76) - Schema validation
- **@hookform/resolvers** (v3.10.0) - Form validation integration
- **@phosphor-icons/react** (v2.1.10) - Icon system for toolbar
- **@radix-ui** components - UI primitives (tooltips, popovers, dialogs)

## Architecture Overview

### Three-Layer Architecture

1. **UI Component Layer** (`libs/ui/src/components/rich-input.tsx`)
   - Reusable RichInput component
   - Self-contained editor with toolbar
   - Configurable extensions and styling

2. **Form Integration Layer** (`apps/client/src/pages/builder/sidebars/left/dialogs/*.tsx`)
   - Dialog components for each section type
   - React Hook Form integration
   - Zod schema validation
   - Field-level form control

3. **Data/Schema Layer** (`libs/schema/src/`)
   - Type-safe data structures
   - Zod schemas for validation
   - Default values for all section types
   - Shared base schemas (Item, URL, etc.)

### Data Flow

```
User Input → TipTap Editor → HTML String → Form State → Validation → Store
                ↓
         onChange handler
                ↓
         editor.getHTML()
                ↓
    Stored as HTML string in resume data
                ↓
    Rendering: sanitize() → dangerouslySetInnerHTML
```

## Key Files & Components

### Core Editor Component
- **File**: `/libs/ui/src/components/rich-input.tsx` (517 lines)
- **Purpose**: Main rich text editor component
- **Exports**: `RichInput` (forwardRef component)

### Section Dialog Components
Located in: `/apps/client/src/pages/builder/sidebars/left/dialogs/`

- `experience.tsx` (141 lines) - Work experience editor
- `education.tsx` (165 lines) - Education editor
- `custom-section.tsx` (229 lines) - Custom sections with keywords
- `projects.tsx` - Project entries
- `awards.tsx` - Awards/honors
- `volunteer.tsx` - Volunteer work
- `certifications.tsx` - Certifications
- `publications.tsx` - Publications
- `references.tsx` - References
- `languages.tsx` - Languages
- `skills.tsx` - Skills
- `interests.tsx` - Interests
- `profiles.tsx` (113 lines) - Social profiles (no rich text, uses URLInput)

### Summary Section
- **File**: `/apps/client/src/pages/builder/sidebars/left/sections/summary.tsx` (51 lines)
- **Purpose**: Single rich text field for resume summary
- **Pattern**: Direct editor without dialog

### Shared Components
- **section-dialog.tsx** (191 lines) - Generic dialog wrapper for CRUD operations
- **section-base.tsx** (181 lines) - Base component with drag-drop, list management
- **url-input.tsx** (66 lines) - URL input with label support
- **section-list-item.tsx** - Individual list item component
- **section-options.tsx** - Section visibility/options menu
- **section-icon.tsx** - Icon rendering per section type

### Schema Definitions
Located in: `/libs/schema/src/sections/`

- `experience.ts` (28 lines) - Experience schema
- `education.ts` (31 lines) - Education schema
- `custom-section.ts` (30 lines) - Custom section schema
- `profile.ts` (28 lines) - Profile schema
- `skill.ts` (24 lines) - Skill schema
- `project.ts` (28 lines) - Project schema
- `index.ts` (136 lines) - All section schemas and defaults

### Rendering/Display Layer
Located in: `/apps/artboard/src/templates/`

- Multiple template files (azurill.tsx, ditto.tsx, etc.)
- Each ~15-18KB, 450+ lines
- Render sanitized HTML using `dangerouslySetInnerHTML`
- Template pattern with reusable Section components

### Utility Functions
- **File**: `/libs/utils/src/namespaces/string.ts` (151 lines)
- **Key Function**: `sanitize()` (lines 60-150)
- **Purpose**: HTML sanitization with whitelisted tags/attributes

## Content Storage Format

### Format: HTML String
All rich text content is stored as **HTML strings** in the database/state.

Example from experience.summary:
```html
<p>Led a team of 5 developers</p>
<ul>
  <li>Implemented microservices architecture</li>
  <li>Reduced latency by 40%</li>
</ul>
```

### Storage Locations
- `sections.summary.content` - String (direct content)
- `sections.experience.items[].summary` - String (per item)
- `sections.education.items[].summary` - String (per item)
- `sections.projects.items[].summary` - String (per item)
- All other section items with `summary` field

### Schema Pattern
```typescript
// Base item schema
itemSchema = z.object({
  id: idSchema,
  visible: z.boolean(),
});

// Section with summary field
experienceSchema = itemSchema.extend({
  company: z.string().min(1),
  position: z.string(),
  location: z.string(),
  date: z.string(),
  summary: z.string(),  // HTML content stored here
  url: urlSchema,
});
```

## UI/UX Features

### Toolbar Features
- **Text Formatting**: Bold, Italic, Underline, Strikethrough, Highlight
- **Structure**: H1, H2, H3, Paragraph
- **Lists**: Bullet lists, Numbered lists, Indent/Outdent
- **Alignment**: Left, Center, Right, Justify
- **Advanced**: Inline code, Code blocks, Links, Images
- **Actions**: Hard break, Horizontal rule, Undo, Redo

### User-Friendly Elements
1. **Inline Toolbar**: Always visible, no floating menu
2. **Tooltips**: Every button has descriptive tooltip
3. **Visual Feedback**: Active states show current formatting
4. **Disabled States**: Buttons disable when action unavailable
5. **Icon Library**: Phosphor Icons for consistency
6. **Keyboard Support**: Standard shortcuts via StarterKit

### AI Integration
- **File**: `/apps/client/src/components/ai-actions.tsx` (135 lines)
- **Features**:
  - Improve Writing
  - Fix Spelling & Grammar
  - Change Tone (Casual, Professional, Confident, Friendly)
- **Integration**: Footer prop in RichInput allows custom actions
- **API**: OpenAI integration (optional, requires API key)

## Monorepo Structure

```
/libs/
  /ui/              - Shared UI components (RichInput)
  /schema/          - Zod schemas and types
  /utils/           - Utility functions (sanitize)
  /dto/             - Data transfer objects
  /hooks/           - Custom React hooks
  /parser/          - Resume import parsers

/apps/
  /client/          - Main React application
    /pages/builder/ - Resume builder UI
      /sidebars/left/
        /dialogs/   - Section edit dialogs
        /sections/  - Section display/management
  /artboard/        - Resume rendering/templates
  /server/          - NestJS backend

/tools/
  /prisma/          - Database schema
```

## Key Design Patterns

### 1. Generic Section Pattern
All item-based sections follow the same pattern:
- Dialog with form (create/update/duplicate/delete)
- List display with drag-drop reordering
- Visibility toggle per item
- Shared base components

### 2. Form Pattern
```typescript
const form = useForm<FormValues>({
  defaultValues: defaultExperience,
  resolver: zodResolver(experienceSchema),
});
```

### 3. Editor Integration Pattern
```typescript
<RichInput
  content={field.value}
  onChange={(value) => field.onChange(value)}
  footer={(editor) => <AiActions ... />}
/>
```

### 4. Sanitization Pattern
```typescript
dangerouslySetInnerHTML={{ __html: sanitize(summary) }}
```

## Build System
- **Framework**: Nx monorepo
- **Build Tool**: Vite
- **Package Manager**: pnpm
- **TypeScript**: v5.9.3
- **React**: v18.3.1

## Next Steps
See companion documents:
- `RR_EDITOR_02_IMPLEMENTATION.md` - Detailed implementation patterns
- `RR_EDITOR_03_DATA_FORMAT.md` - Data schemas and serialization
- `RR_EDITOR_04_SECTION_PATTERNS.md` - Section-specific patterns
