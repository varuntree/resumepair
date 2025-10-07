# Reactive-Resume Rich Text Editor - Quick Reference

## Overview

Reactive-Resume uses **TipTap v2.26.2** (built on ProseMirror) for rich text editing in resume sections.

**Content Storage**: HTML strings
**Sanitization**: sanitize-html library
**Form Management**: React Hook Form + Zod validation
**State Management**: Zustand store with Immer

## Key Files

| File | Lines | Purpose |
|------|-------|---------|
| `/libs/ui/src/components/rich-input.tsx` | 517 | Main RichInput component |
| `/libs/utils/src/namespaces/string.ts` | 151 | Sanitization utilities |
| `/libs/schema/src/sections/*.ts` | 24-31 | Section schemas |
| `/apps/client/src/pages/builder/sidebars/left/dialogs/*.tsx` | 113-229 | Section forms |
| `/apps/client/src/pages/builder/sidebars/left/sections/shared/section-dialog.tsx` | 191 | Generic CRUD dialog |
| `/apps/client/src/pages/builder/sidebars/left/sections/shared/section-base.tsx` | 181 | List + drag-drop |
| `/apps/artboard/src/templates/*.tsx` | ~450 | Resume rendering |

## TipTap Extensions

```typescript
extensions: [
  StarterKit,      // Bold, Italic, Lists, Headings, History, etc.
  Underline,       // Underline text
  Highlight,       // Text highlighting
  Link,            // Hyperlinks
  TextAlign,       // Left/Center/Right/Justify
  Image,           // Image insertion
]
```

## Basic Implementation

### 1. Simple Rich Text Field (Summary Pattern)

```typescript
import { RichInput } from "@reactive-resume/ui";

<RichInput
  content={htmlString}
  onChange={(value) => setHtmlString(value)}
/>
```

### 2. With Form Integration

```typescript
import { useForm } from "react-hook-form";
import { RichInput, FormField } from "@reactive-resume/ui";

const form = useForm();

<FormField
  name="summary"
  control={form.control}
  render={({ field }) => (
    <RichInput
      {...field}
      content={field.value}
      onChange={(value) => field.onChange(value)}
    />
  )}
/>
```

### 3. With AI Actions

```typescript
<RichInput
  content={field.value}
  footer={(editor) => (
    <AiActions
      value={editor.getText()}
      onChange={(value) => {
        editor.commands.setContent(value, true);
        field.onChange(value);
      }}
    />
  )}
  onChange={(value) => field.onChange(value)}
/>
```

## Schema Pattern

```typescript
import { z } from "zod";
import { itemSchema, urlSchema } from "../shared";

export const experienceSchema = itemSchema.extend({
  company: z.string().min(1),      // Required
  position: z.string(),            // Optional
  date: z.string(),                // Free-form text
  summary: z.string(),             // HTML content
  url: urlSchema,                  // { label: "", href: "" }
});

export const defaultExperience: Experience = {
  ...defaultItem,                  // id, visible
  company: "",
  position: "",
  date: "",
  summary: "",
  url: { label: "", href: "" },
};
```

## Rendering Pattern

```typescript
import { sanitize } from "@reactive-resume/utils";

// Safe HTML rendering
<div
  dangerouslySetInnerHTML={{ __html: sanitize(htmlString) }}
  className="wysiwyg"
/>
```

## URL Input Pattern

```typescript
import { URLInput } from "../shared/url-input";

<FormField
  name="url"
  control={form.control}
  render={({ field }) => (
    <URLInput {...field} />  // Handles { label, href }
  )}
/>
```

## Complete Dialog Pattern

```typescript
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { experienceSchema, defaultExperience } from "@reactive-resume/schema";
import { RichInput, Input, FormField } from "@reactive-resume/ui";
import { SectionDialog } from "../sections/shared/section-dialog";
import { URLInput } from "../sections/shared/url-input";

export const ExperienceDialog = () => {
  const form = useForm({
    defaultValues: defaultExperience,
    resolver: zodResolver(experienceSchema),
  });

  return (
    <SectionDialog id="experience" form={form} defaultValues={defaultExperience}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Text Input */}
        <FormField
          name="company"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* URL Input */}
        <FormField
          name="url"
          control={form.control}
          render={({ field }) => (
            <FormItem className="sm:col-span-2">
              <FormLabel>Website</FormLabel>
              <FormControl>
                <URLInput {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Rich Text Input */}
        <FormField
          name="summary"
          control={form.control}
          render={({ field }) => (
            <FormItem className="sm:col-span-2">
              <FormLabel>Summary</FormLabel>
              <FormControl>
                <RichInput
                  {...field}
                  content={field.value}
                  onChange={(value) => field.onChange(value)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </SectionDialog>
  );
};
```

## Toolbar Features

### Basic Formatting
- Bold, Italic, Underline, Strikethrough, Highlight
- Inline Code, Code Block

### Structure
- Headings (H1, H2, H3)
- Paragraph
- Bullet List, Numbered List
- Indent/Outdent

### Alignment
- Left, Center, Right, Justify

### Advanced
- Hyperlinks (prompt-based)
- Images (popover form)
- Hard Break, Horizontal Rule
- Undo/Redo

## Configuration Options

```typescript
<RichInput
  content="<p>Initial HTML</p>"           // Initial content
  onChange={(html) => {}}                 // Change handler
  hideToolbar={false}                     // Show/hide toolbar
  className="custom-container"            // Container styles
  editorClassName="custom-editor"         // Editor content styles
  footer={(editor) => <CustomFooter />}   // Optional footer
/>
```

## Store Integration (Zustand)

```typescript
import { useResumeStore } from "@/client/stores/resume";

// Get setValue function
const setValue = useResumeStore((state) => state.setValue);

// Update summary
setValue("sections.summary.content", htmlString);

// Update experience item
setValue("sections.experience.items", updatedArray);

// Update single field
setValue(`sections.experience.items[${index}].visible`, true);
```

## Sanitization Rules

**Allowed Tags**: p, br, div, span, h1-h6, ul, ol, li, a, img, strong, em, u, s, mark, code, pre, blockquote, hr, table elements, semantic HTML5 tags

**Allowed Attributes**:
- All tags: `class`, `style`
- Links: `href`, `target`
- Images: `src`, `alt`

**Allowed Styles**:
- `text-align`: left, right, center, justify

**Blocked**: Scripts, event handlers, unsafe protocols, etc.

## Empty Content Detection

```typescript
import { isEmptyString } from "@reactive-resume/utils";

// Detects both "" and "<p></p>" as empty
if (!isEmptyString(summary)) {
  // Render content
}
```

## Common Pitfalls

### DON'T
```typescript
// ❌ Wrong prop name
<RichInput value={html} />

// ❌ Unescaped HTML rendering
<div dangerouslySetInnerHTML={{ __html: html }} />

// ❌ Direct mutation
items.push(newItem);

// ❌ Empty check without utility
if (html) { /* "<p></p>" is truthy */ }
```

### DO
```typescript
// ✅ Correct prop
<RichInput content={html} />

// ✅ Sanitized rendering
<div dangerouslySetInnerHTML={{ __html: sanitize(html) }} />

// ✅ Immutable update
setValue("path", [...items, newItem]);

// ✅ Proper empty check
if (!isEmptyString(html)) { /* ... */ }
```

## Package Versions

```json
{
  "@tiptap/core": "^2.26.2",
  "@tiptap/react": "^2.26.2",
  "@tiptap/starter-kit": "^2.26.1",
  "@tiptap/extension-underline": "^2.26.2",
  "@tiptap/extension-highlight": "^2.26.2",
  "@tiptap/extension-link": "^2.26.2",
  "@tiptap/extension-text-align": "^2.26.2",
  "@tiptap/extension-image": "^2.26.2",
  "sanitize-html": "^2.17.0",
  "react-hook-form": "^7.63.0",
  "zod": "^3.25.76"
}
```

## Architecture Summary

```
User Input
    ↓
TipTap Editor (editable)
    ↓
editor.getHTML() → HTML String
    ↓
React Hook Form field.onChange()
    ↓
Zod Validation
    ↓
Zustand Store (setValue)
    ↓
Database/API
    ↓
Retrieve HTML String
    ↓
sanitize() function
    ↓
dangerouslySetInnerHTML
    ↓
Rendered Resume (read-only)
```

## Two Section Patterns

### Pattern 1: Summary (Direct Editor)
- Single RichInput inline
- No dialog
- Direct store updates
- Example: Summary section

### Pattern 2: Item-Based (Dialog + List)
- SectionBase for list display
- SectionDialog for CRUD
- Drag-drop reordering
- Example: Experience, Education, Projects

## Resources

- TipTap Docs: https://tiptap.dev
- Simple Icons: https://simpleicons.org (for profile icons)
- Phosphor Icons: https://phosphoricons.com (UI icons)
- Radix UI: https://radix-ui.com (component primitives)

## File Location Reference

**Schema**: `/libs/schema/src/`
**UI Components**: `/libs/ui/src/components/`
**Utilities**: `/libs/utils/src/namespaces/`
**Builder UI**: `/apps/client/src/pages/builder/`
**Templates**: `/apps/artboard/src/templates/`

---

For detailed implementation, see:
- `RR_EDITOR_01_OVERVIEW.md` - Complete architecture overview
- `RR_EDITOR_02_IMPLEMENTATION.md` - Component implementations with code
- `RR_EDITOR_03_DATA_FORMAT.md` - Schema definitions and data flow
- `RR_EDITOR_04_SECTION_PATTERNS.md` - Section patterns and best practices
