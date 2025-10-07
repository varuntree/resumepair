# Reactive-Resume Rich Text Editor - Implementation Details

## Complete RichInput Component Implementation

**File**: `/libs/ui/src/components/rich-input.tsx`

### Component Structure (Lines 460-517)

```typescript
type RichInputProps = {
  content?: string;                    // Initial HTML content
  onChange?: (value: string) => void;  // Callback with HTML string
  hideToolbar?: boolean;               // Hide formatting toolbar
  className?: string;                  // Editor container styles
  editorClassName?: string;            // Editor content styles
  footer?: (editor: Editor) => React.ReactNode;  // Custom footer (AI actions)
} & Omit<EditorContentProps, "ref" | "editor" | "content" | "value" | "onChange" | "className">;

export const RichInput = forwardRef<Editor, RichInputProps>(
  ({ content, onChange, footer, hideToolbar = false, className, editorClassName, ...props }, _ref) => {
    // Implementation details below
  }
);
```

### Editor Initialization (Lines 465-485)

```typescript
const editor = useEditor({
  extensions: [
    StarterKit,                    // Bold, italic, lists, headings, etc.
    Image,                         // Image insertion
    Underline,                     // Underline extension
    Highlight,                     // Text highlighting
    TextAlign.configure({
      types: ["heading", "paragraph"]  // Apply alignment to these node types
    }),
    Link.extend({
      inclusive: false             // Link doesn't extend to adjacent text
    }).configure({
      openOnClick: false           // Don't follow link on click (edit mode)
    }),
  ],
  editorProps: {
    attributes: {
      class: cn(
        "prose prose-sm prose-zinc",           // Tailwind typography
        "max-h-[200px]",                       // Max height with scroll
        "max-w-none",                          // No max width
        "overflow-y-scroll",                   // Scroll for overflow
        "dark:prose-invert",                   // Dark mode support
        "focus:outline-none",                  // Remove focus outline
        "[&_*]:my-2",                         // Spacing between elements
        editorClassName,                       // Custom classes
      ),
    },
  },
  content,                                     // Initial content
  parseOptions: { preserveWhitespace: "full" }, // Keep all whitespace
  onUpdate: ({ editor }) => onChange?.(editor.getHTML()),  // Emit HTML on change
});
```

### Key Configuration Details

1. **Extensions Array** (Lines 466-473):
   - StarterKit includes: Bold, Italic, Strike, Code, Paragraph, Headings, Lists, History, etc.
   - Custom extensions added for specific features
   - Link configured to NOT be inclusive (doesn't extend to adjacent typing)
   - Link configured to NOT open on click (better for editing)

2. **Editor Props** (Lines 474-481):
   - Uses Tailwind's typography plugin (`prose`)
   - Small size variant (`prose-sm`)
   - Zinc color scheme (`prose-zinc`)
   - Max height of 200px with vertical scroll
   - Dark mode support via `dark:prose-invert`
   - Removes focus outline for cleaner look
   - Adds consistent spacing to all child elements

3. **Parse Options** (Line 482):
   - `preserveWhitespace: "full"` - Important for maintaining exact formatting
   - Without this, multiple spaces collapse to one

4. **Update Handler** (Line 484):
   - Calls `editor.getHTML()` to convert editor state to HTML string
   - Invokes onChange callback with HTML string
   - Optional chaining (`?.`) handles cases where onChange not provided

### Loading State (Lines 487-494)

```typescript
if (!editor) {
  return (
    <div className="space-y-2">
      <Skeleton className={cn("h-[42px] w-full", hideToolbar && "hidden")} />
      <Skeleton className="h-[90px] w-full" />
    </div>
  );
}
```

Shows skeleton loaders while editor initializes. Conditional toolbar skeleton based on `hideToolbar` prop.

### Render Structure (Lines 496-512)

```typescript
return (
  <div>
    {!hideToolbar && <Toolbar editor={editor} />}

    <EditorContent
      editor={editor}
      className={cn(
        "grid min-h-[160px] w-full rounded-sm border",
        "bg-transparent px-3 py-2 text-sm",
        "placeholder:opacity-80",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary",
        "disabled:cursor-not-allowed disabled:opacity-50",
        hideToolbar && "pt-2",
        className,
      )}
      {...props}
    />

    {footer?.(editor)}
  </div>
);
```

Three-part structure:
1. Optional Toolbar
2. EditorContent (TipTap's content container)
3. Optional Footer (for AI actions or other features)

## Toolbar Implementation

**File**: `/libs/ui/src/components/rich-input.tsx` (Lines 125-449)

### Toolbar Component Signature (Lines 125-144)

```typescript
const Toolbar = ({ editor }: { editor: Editor }) => {
  // Link handler
  const setLink = useCallback(() => {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL", previousUrl);

    // Cancelled
    if (url === null) return;

    // Empty - remove link
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    // Update link
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  // ... toolbar JSX
};
```

### Link Handling Pattern (Lines 126-144)
- Gets current link URL from editor state
- Uses native `window.prompt()` for URL input
- Three cases:
  1. `null` - User cancelled, do nothing
  2. Empty string - Remove link
  3. URL provided - Set link
- `extendMarkRange("link")` ensures full link is selected before modification

### Toggle Button Pattern

Each formatting option follows this pattern:

```typescript
<Tooltip content="Bold">
  <Toggle
    size="sm"
    type="button"
    pressed={editor.isActive("bold")}                      // Show active state
    disabled={!editor.can().chain().toggleBold().run()}    // Disable if unavailable
    onPressedChange={() => editor.chain().focus().toggleBold().run()}
  >
    <TextBIcon />
  </Toggle>
</Tooltip>
```

**Key Elements**:
- `pressed` - Visual indication of active state
- `disabled` - Command availability check
- `onPressedChange` - Toggle command execution
- `editor.chain().focus()` - Ensures editor keeps focus
- Tooltip for accessibility

### Complete Toolbar Features (Lines 148-446)

1. **Basic Formatting** (Lines 148-206):
   - Bold (lines 148-158)
   - Italic (lines 160-170)
   - Strikethrough (lines 172-182)
   - Underline (lines 184-194)
   - Highlight (lines 196-206)

2. **Links** (Lines 208-212):
   - Uses Button instead of Toggle (not a toggle state)
   - Calls `setLink` callback

3. **Code** (Lines 214-236):
   - Inline code (lines 214-224)
   - Code block (lines 226-236)

4. **Headings** (Lines 238-272):
   - H1 with level parameter (lines 238-248)
   - H2 (lines 250-260)
   - H3 (lines 262-272)
   - Note: `isActive("heading", { level: 1 })` checks specific heading level

5. **Paragraph** (Lines 274-283):
   - Sets node type to paragraph
   - No disabled state check

6. **Text Alignment** (Lines 285-331):
   - Left align (lines 285-295)
   - Center align (lines 297-307)
   - Right align (lines 309-319)
   - Justify (lines 321-331)
   - Note: Uses `isActive({ textAlign: "left" })` format

7. **Lists** (Lines 333-355):
   - Bullet list (lines 333-343)
   - Ordered list (lines 345-355)

8. **List Indentation** (Lines 357-381):
   - Outdent/Lift (lines 357-368)
   - Indent/Sink (lines 370-381)
   - Uses `liftListItem` and `sinkListItem` commands
   - Only works when cursor in list item

9. **Image Insertion** (Lines 383-394):
   - Popover with form (InsertImageForm component)
   - Separate component for image URL and alt text

10. **Special Elements** (Lines 396-420):
    - Hard break (lines 396-407)
    - Horizontal rule (lines 409-420)

11. **History** (Lines 422-446):
    - Undo (lines 422-433)
    - Redo (lines 435-446)
    - Checks availability with `editor.can().undo()`

### Insert Image Form (Lines 51-123)

```typescript
const InsertImageFormSchema = z.object({
  src: z.string(),
  alt: z.string().optional(),
});

type InsertImageFormValues = z.infer<typeof InsertImageFormSchema>;

const InsertImageForm = ({ onInsert }: { onInsert: (value: InsertImageFormValues) => void }) => {
  const form = useForm<InsertImageFormValues>({
    resolver: zodResolver(InsertImageFormSchema),
    defaultValues: { src: "", alt: "" },
  });

  const onSubmit = (values: InsertImageFormValues) => {
    onInsert(values);
    form.reset();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField name="src" ... />  {/* URL input */}
        <FormField name="alt" ... />  {/* Alt text input */}
        <Button type="submit">Insert Image</Button>
      </form>
    </Form>
  );
};
```

**Pattern**:
- Zod schema validation
- React Hook Form
- Popover trigger on toolbar button
- Form resets after submission

### Toolbar Button Styling

Common classes (line 147):
```typescript
className="flex flex-wrap gap-0.5 border p-1"
```

- Wraps on small screens
- Small gap between buttons
- Border around entire toolbar
- Small padding

Button sizes:
- `size="sm"` - Consistent small size for all buttons
- Icons sized with `<IconComponent />` (default size)

## Form Integration Patterns

### Experience Dialog Implementation

**File**: `/apps/client/src/pages/builder/sidebars/left/dialogs/experience.tsx`

#### Complete Structure (Lines 1-141)

```typescript
import { zodResolver } from "@hookform/resolvers/zod";
import { t } from "@lingui/macro";
import { defaultExperience, experienceSchema } from "@reactive-resume/schema";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  RichInput,
} from "@reactive-resume/ui";
import { useForm } from "react-hook-form";
import type { z } from "zod";

import { AiActions } from "@/client/components/ai-actions";

import { SectionDialog } from "../sections/shared/section-dialog";
import { URLInput } from "../sections/shared/url-input";

const formSchema = experienceSchema;
type FormValues = z.infer<typeof formSchema>;

export const ExperienceDialog = () => {
  const form = useForm<FormValues>({
    defaultValues: defaultExperience,
    resolver: zodResolver(formSchema),
  });

  return (
    <SectionDialog<FormValues> id="experience" form={form} defaultValues={defaultExperience}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Form fields... */}
      </div>
    </SectionDialog>
  );
};
```

#### Rich Text Field Implementation (Lines 109-136)

```typescript
<FormField
  name="summary"
  control={form.control}
  render={({ field }) => (
    <FormItem className="sm:col-span-2">
      <FormLabel>{t`Summary`}</FormLabel>
      <FormControl>
        <RichInput
          {...field}                              // Spread field props (value, onChange, etc.)
          content={field.value}                   // Explicit content prop
          footer={(editor) => (                   // Custom footer with AI actions
            <AiActions
              value={editor.getText()}            // Pass plain text to AI
              onChange={(value) => {              // Handle AI-generated content
                editor.commands.setContent(value, true);  // Update editor
                field.onChange(value);            // Update form state
              }}
            />
          )}
          onChange={(value) => {                  // Handle manual changes
            field.onChange(value);                // Update form state
          }}
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

**Key Integration Points**:
1. `{...field}` - Spreads React Hook Form field props
2. `content={field.value}` - Explicit content binding
3. Dual onChange handlers:
   - Direct onChange for manual edits
   - Footer onChange for AI actions
4. `editor.commands.setContent(value, true)` - Replaces editor content
   - Second param `true` = emit update event
5. Both paths call `field.onChange(value)` to sync form state

### Standard Input Fields Pattern

Company field example (lines 34-46):
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

### URL Input Pattern

URL field (lines 95-107):
```typescript
<FormField
  name="url"
  control={form.control}
  render={({ field }) => (
    <FormItem className="sm:col-span-2">
      <FormLabel>{t`Website`}</FormLabel>
      <FormControl>
        <URLInput {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

### Date Input Pattern

Date field with placeholder (lines 67-78):
```typescript
<FormField
  name="date"
  control={form.control}
  render={({ field }) => (
    <FormItem>
      <FormLabel>{t`Date or Date Range`}</FormLabel>
      <FormControl>
        <Input {...field} placeholder={t`March 2023 - Present`} />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

## URL Input Component

**File**: `/apps/client/src/pages/builder/sidebars/left/sections/shared/url-input.tsx`

### Complete Implementation (Lines 1-66)

```typescript
import { t } from "@lingui/macro";
import { TagIcon } from "@phosphor-icons/react";
import type { URL } from "@reactive-resume/schema";
import { urlSchema } from "@reactive-resume/schema";
import {
  Button,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Tooltip,
} from "@reactive-resume/ui";
import { forwardRef, useMemo } from "react";

type Props = {
  id?: string;
  value: URL;
  placeholder?: string;
  onChange: (value: URL) => void;
};

export const URLInput = forwardRef<HTMLInputElement, Props>(
  ({ id, value, placeholder, onChange }, ref) => {
    const hasError = useMemo(() => !urlSchema.safeParse(value).success, [value]);

    return (
      <>
        <div className="flex gap-x-1">
          <Input
            ref={ref}
            id={id}
            value={value.href}
            className="flex-1"
            hasError={hasError}
            placeholder={placeholder}
            onChange={(event) => {
              onChange({ ...value, href: event.target.value });
            }}
          />

          <Popover>
            <Tooltip content={t`Label`}>
              <PopoverTrigger asChild>
                <Button size="icon" variant="ghost">
                  <TagIcon />
                </Button>
              </PopoverTrigger>
            </Tooltip>
            <PopoverContent className="p-1.5">
              <Input
                value={value.label}
                placeholder={t`Label`}
                onChange={(event) => {
                  onChange({ ...value, label: event.target.value });
                }}
              />
            </PopoverContent>
          </Popover>
        </div>

        {hasError && <small className="opacity-75">{t`URL must start with https://`}</small>}
      </>
    );
  },
);
```

**Features**:
1. **Validation** (Line 24):
   - Real-time validation using Zod schema
   - `useMemo` prevents unnecessary re-validation

2. **Two-Part Input**:
   - Main input for URL (href)
   - Popover button for optional label

3. **Error Display** (Line 61):
   - Shows validation error message
   - Only visible when validation fails

4. **Object Update Pattern**:
   - Spreads existing object: `{ ...value, href: newValue }`
   - Preserves other properties while updating one field

## Summary Section Pattern

**File**: `/apps/client/src/pages/builder/sidebars/left/sections/summary.tsx`

### Direct Editor Usage (Lines 1-51)

```typescript
import { defaultSections } from "@reactive-resume/schema";
import { RichInput } from "@reactive-resume/ui";
import { cn } from "@reactive-resume/utils";

import { AiActions } from "@/client/components/ai-actions";
import { useResumeStore } from "@/client/stores/resume";

import { SectionIcon } from "./shared/section-icon";
import { SectionOptions } from "./shared/section-options";

export const SummarySection = () => {
  const setValue = useResumeStore((state) => state.setValue);
  const section = useResumeStore(
    (state) => state.resume.data.sections.summary ?? defaultSections.summary,
  );

  return (
    <section id="summary" className="grid gap-y-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-x-4">
          <SectionIcon id="summary" size={18} />
          <h2 className="line-clamp-1 text-2xl font-bold lg:text-3xl">{section.name}</h2>
        </div>
        <div className="flex items-center gap-x-2">
          <SectionOptions id="summary" />
        </div>
      </header>

      <main className={cn(!section.visible && "opacity-50")}>
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
      </main>
    </section>
  );
};
```

**Pattern Differences**:
- No dialog wrapper (direct inline editing)
- No form (direct store integration)
- Uses Zustand store's `setValue` directly
- Same RichInput + AiActions pattern as dialogs
- Opacity reduced when section not visible

## Store Integration

### setValue Pattern

Throughout the app:
```typescript
setValue("sections.summary.content", htmlString);
setValue("sections.experience.items", updatedArray);
setValue(`sections.${id}.items[${index}].visible`, !visible);
```

**Features**:
- Type-safe paths (TypeScript enforces valid paths)
- Dot notation for nested properties
- Array index notation for array items
- Immutable updates (using Immer under the hood)

## Next Document
See `RR_EDITOR_03_DATA_FORMAT.md` for schema definitions and data serialization patterns.
