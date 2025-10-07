# Reactive-Resume Rich Text Editor - Section Patterns & Best Practices

## Section Architecture Overview

Reactive-Resume uses two distinct patterns for handling resume sections:

1. **Summary Pattern**: Single rich text field, inline editing
2. **Item-Based Pattern**: Multiple items, dialog-based editing, drag-drop reordering

## Pattern 1: Summary Section (Direct Editor)

### Use Case
- Single rich text content per section
- No list of items
- Direct inline editing
- Examples: Summary, Objective statements

### Implementation

**File**: `/apps/client/src/pages/builder/sidebars/left/sections/summary.tsx` (51 lines)

#### Complete Code (Lines 1-51)

```typescript
import { defaultSections } from "@reactive-resume/schema";
import { RichInput } from "@reactive-resume/ui";
import { cn } from "@reactive-resume/utils";

import { AiActions } from "@/client/components/ai-actions";
import { useResumeStore } from "@/client/stores/resume";

import { SectionIcon } from "./shared/section-icon";
import { SectionOptions } from "./shared/section-options";

export const SummarySection = () => {
  // 1. Get store methods
  const setValue = useResumeStore((state) => state.setValue);

  // 2. Get section data with fallback
  const section = useResumeStore(
    (state) => state.resume.data.sections.summary ?? defaultSections.summary,
  );

  return (
    <section id="summary" className="grid gap-y-6">
      {/* Header with title and options */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-x-4">
          <SectionIcon id="summary" size={18} />
          <h2 className="line-clamp-1 text-2xl font-bold lg:text-3xl">{section.name}</h2>
        </div>

        <div className="flex items-center gap-x-2">
          <SectionOptions id="summary" />
        </div>
      </header>

      {/* Editor with conditional opacity */}
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

#### Key Patterns

**1. Store Integration (Lines 12-17)**
```typescript
const setValue = useResumeStore((state) => state.setValue);
const section = useResumeStore(
  (state) => state.resume.data.sections.summary ?? defaultSections.summary,
);
```
- Direct Zustand store access
- Fallback to defaults if section missing
- No form state management needed

**2. Direct setValue Calls (Lines 40, 44)**
```typescript
setValue("sections.summary.content", value);
```
- Type-safe path strings
- Immediate store updates
- No form submission required

**3. Visibility Handling (Line 31)**
```typescript
className={cn(!section.visible && "opacity-50")}
```
- Visual feedback for hidden sections
- Section still editable when hidden
- Shows on builder, hidden on final resume

**4. Section Options Menu**
```typescript
<SectionOptions id="summary" />
```
- Provides visibility toggle
- Column configuration
- Section renaming
- Reusable across all sections

### Advantages
- Simple, immediate editing
- No modal dialogs
- Quick updates
- Best for single-value sections

### When to Use
- Single rich text field
- No need for multiple items
- Content rarely exceeds viewport
- Direct manipulation preferred

## Pattern 2: Item-Based Section (Dialog + List)

### Use Case
- Multiple items in a section
- Each item has multiple fields
- CRUD operations (Create, Read, Update, Delete)
- Drag-drop reordering
- Examples: Experience, Education, Projects, Skills

### Components Involved

1. **SectionBase** - List display + drag-drop
2. **SectionDialog** - CRUD modal wrapper
3. **[Section]Dialog** - Specific form for section type
4. **SectionListItem** - Individual item display

### SectionBase Component

**File**: `/apps/client/src/pages/builder/sidebars/left/sections/shared/section-base.tsx` (181 lines)

#### Structure (Lines 38-180)

```typescript
type Props<T extends SectionItem> = {
  id: SectionKey;
  title: (item: T) => string;              // Extract title from item
  description?: (item: T) => string | undefined;  // Optional subtitle
};

export const SectionBase = <T extends SectionItem>({ id, title, description }: Props<T>) => {
  const { open } = useDialog(id);
  const setValue = useResumeStore((state) => state.setValue);
  const section = useResumeStore((state) => get(state.resume.data.sections, id)) as SectionWithItem<T>;

  // Drag-drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  if (!section) return null;

  // Drag-drop handler
  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = section.items.findIndex((item) => item.id === active.id);
    const newIndex = section.items.findIndex((item) => item.id === over.id);
    const sortedList = arrayMove(section.items as T[], oldIndex, newIndex);

    setValue(`sections.${id}.items`, sortedList);
  };

  // CRUD handlers
  const onCreate = () => open("create", { id });
  const onUpdate = (item: T) => open("update", { id, item });
  const onDuplicate = (item: T) => open("duplicate", { id, item });
  const onDelete = (item: T) => open("delete", { id, item });
  const onToggleVisibility = (index: number) => {
    const visible = get(section, `items[${index}].visible`, true);
    setValue(`sections.${id}.items[${index}].visible`, !visible);
  };

  return (
    <motion.section id={id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-x-4">
          <SectionIcon id={id} size={18} />
          <h2>{section.name}</h2>
        </div>
        <SectionOptions id={id} />
      </header>

      {/* List */}
      <main className={cn("grid transition-opacity", !section.visible && "opacity-50")}>
        {/* Empty state */}
        {section.items.length === 0 && (
          <Button variant="outline" onClick={onCreate}>
            <PlusIcon size={14} />
            <span>Add a new item</span>
          </Button>
        )}

        {/* Drag-drop list */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToParentElement]}
          onDragEnd={onDragEnd}
        >
          <SortableContext items={section.items} strategy={verticalListSortingStrategy}>
            <AnimatePresence>
              {section.items.map((item, index) => (
                <SectionListItem
                  key={item.id}
                  id={item.id}
                  visible={item.visible}
                  title={title(item as T)}
                  description={description?.(item as T)}
                  onUpdate={() => onUpdate(item as T)}
                  onDelete={() => onDelete(item as T)}
                  onDuplicate={() => onDuplicate(item as T)}
                  onToggleVisibility={() => onToggleVisibility(index)}
                />
              ))}
            </AnimatePresence>
          </SortableContext>
        </DndContext>
      </main>

      {/* Footer add button (when items exist) */}
      {section.items.length > 0 && (
        <footer className="flex items-center justify-end">
          <Button variant="outline" onClick={onCreate}>
            <PlusIcon />
            <span>Add a new item</span>
          </Button>
        </footer>
      )}
    </motion.section>
  );
};
```

#### Key Features

**1. Generic Type Parameter (Line 38)**
```typescript
export const SectionBase = <T extends SectionItem>
```
- Works with any section item type
- Type-safe item operations
- Reusable across all item-based sections

**2. Title Extraction Pattern (Lines 39-40)**
```typescript
title: (item: T) => string;
description?: (item: T) => string | undefined;
```
- Callback functions extract display text
- Different sections show different fields
- Flexible display logic per section

**3. Drag-Drop Integration (Lines 46-67)**
```typescript
const sensors = useSensors(
  useSensor(PointerSensor),        // Mouse/touch
  useSensor(KeyboardSensor, ...),  // Keyboard accessibility
);

const onDragEnd = (event) => {
  const sortedList = arrayMove(items, oldIndex, newIndex);
  setValue(`sections.${id}.items`, sortedList);
};
```
- @dnd-kit library
- Mouse and keyboard support
- Accessibility compliant
- Immediately persists order

**4. CRUD Operation Handlers (Lines 70-78)**
```typescript
const onCreate = () => open("create", { id });
const onUpdate = (item: T) => open("update", { id, item });
const onDuplicate = (item: T) => open("duplicate", { id, item });
const onDelete = (item: T) => open("delete", { id, item });
```
- All operations go through dialog system
- Passes mode and payload to dialog
- Dialog handles actual data manipulation

**5. Item Visibility Toggle (Lines 79-82)**
```typescript
const onToggleVisibility = (index: number) => {
  const visible = get(section, `items[${index}].visible`, true);
  setValue(`sections.${id}.items[${index}].visible`, !visible);
};
```
- Direct store update (no dialog)
- Immediate visual feedback
- Individual item visibility

**6. Empty State (Lines 111-117)**
```typescript
{section.items.length === 0 && (
  <Button variant="outline" onClick={onCreate}>
    <PlusIcon size={14} />
    <span>Add a new item</span>
  </Button>
)}
```
- Prominent when no items
- Encourages first item creation
- Dashed border style

### SectionDialog Component

**File**: `/apps/client/src/pages/builder/sidebars/left/sections/shared/section-dialog.tsx` (191 lines)

#### Structure (Lines 42-190)

```typescript
type Props<T extends SectionItem> = {
  id: DialogName;
  form: UseFormReturn<T>;
  defaultValues: T;
  pendingKeyword?: string;          // For keyword fields
  children: React.ReactNode;        // Form fields
};

export const SectionDialog = <T extends SectionItem>({
  id,
  form,
  defaultValues,
  pendingKeyword,
  children,
}: Props<T>) => {
  const { isOpen, mode, close, payload } = useDialog<T>(id);
  const setValue = useResumeStore((state) => state.setValue);
  const section = useResumeStore((state) => get(state.resume.data.sections, id)) as SectionWithItem<T>;

  const isCreate = mode === "create";
  const isUpdate = mode === "update";
  const isDelete = mode === "delete";
  const isDuplicate = mode === "duplicate";

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) onReset();
  }, [isOpen, payload]);

  // Submit handler
  const onSubmit = (values: T) => {
    if (!section) return;

    if (isCreate || isDuplicate) {
      // Add pending keyword if exists
      if (pendingKeyword && "keywords" in values) {
        values.keywords.push(pendingKeyword);
      }

      setValue(
        `sections.${id}.items`,
        produce(section.items, (draft: T[]): void => {
          draft.push({ ...values, id: createId() });
        }),
      );
    }

    if (isUpdate) {
      if (!payload.item?.id) return;

      if (pendingKeyword && "keywords" in values) {
        values.keywords.push(pendingKeyword);
      }

      setValue(
        `sections.${id}.items`,
        produce(section.items, (draft: T[]): void => {
          const index = draft.findIndex((item) => item.id === payload.item?.id);
          if (index === -1) return;
          draft[index] = values;
        }),
      );
    }

    if (isDelete) {
      if (!payload.item?.id) return;

      setValue(
        `sections.${id}.items`,
        produce(section.items, (draft: T[]): void => {
          const index = draft.findIndex((item) => item.id === payload.item?.id);
          if (index === -1) return;
          draft.splice(index, 1);
        }),
      );
    }

    close();
  };

  // Form reset logic
  const onReset = () => {
    if (isCreate) form.reset({ ...defaultValues, id: createId() } as T);
    if (isUpdate) form.reset({ ...defaultValues, ...payload.item });
    if (isDuplicate) form.reset({ ...payload.item, id: createId() } as T);
    if (isDelete) form.reset({ ...defaultValues, ...payload.item });
  };

  // Delete confirmation dialog
  if (isDelete) {
    return (
      <AlertDialog open={isOpen} onOpenChange={close}>
        <AlertDialogContent>
          <Form {...form}>
            <form>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure you want to delete this item?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action can be reverted by clicking on the undo button.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction variant="error" onClick={form.handleSubmit(onSubmit)}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </form>
          </Form>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  // Create/Update/Duplicate dialog
  return (
    <Dialog open={isOpen} onOpenChange={close}>
      <DialogContent>
        <Form {...form}>
          <ScrollArea>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <DialogHeader>
                <DialogTitle>
                  <div className="flex items-center space-x-2.5">
                    {isCreate && <PlusIcon />}
                    {isUpdate && <PencilSimpleIcon />}
                    {isDuplicate && <CopySimpleIcon />}
                    <h2>
                      {isCreate && "Create a new item"}
                      {isUpdate && "Update an existing item"}
                      {isDuplicate && "Duplicate an existing item"}
                    </h2>
                  </div>
                </DialogTitle>
              </DialogHeader>

              {children}  {/* Form fields go here */}

              <DialogFooter>
                <Button type="submit">
                  {isCreate && "Create"}
                  {isUpdate && "Save Changes"}
                  {isDuplicate && "Duplicate"}
                </Button>
              </DialogFooter>
            </form>
          </ScrollArea>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
```

#### Key Patterns

**1. Mode-Based Rendering (Lines 56-61)**
```typescript
const isCreate = mode === "create";
const isUpdate = mode === "update";
const isDelete = mode === "delete";
const isDuplicate = mode === "duplicate";
```
- Single component handles all CRUD operations
- Different logic per mode
- Different UI per mode

**2. Immer for Immutable Updates (Lines 73-78)**
```typescript
setValue(
  `sections.${id}.items`,
  produce(section.items, (draft: T[]): void => {
    draft.push({ ...values, id: createId() });
  }),
);
```
- Immer's `produce` for immutable array updates
- Mutate draft, returns new array
- Type-safe mutations

**3. ID Generation (Line 76)**
```typescript
draft.push({ ...values, id: createId() });
```
- CUID2 generates unique IDs
- Set on creation/duplication
- Preserved on updates

**4. Form Reset Strategy (Lines 114-119)**
```typescript
const onReset = () => {
  if (isCreate) form.reset({ ...defaultValues, id: createId() } as T);
  if (isUpdate) form.reset({ ...defaultValues, ...payload.item });
  if (isDuplicate) form.reset({ ...payload.item, id: createId() } as T);
  if (isDelete) form.reset({ ...defaultValues, ...payload.item });
};
```
- Create: Fresh defaults + new ID
- Update: Merge defaults with existing item
- Duplicate: Copy item + new ID
- Delete: Show existing values (read-only)

**5. Pending Keyword Pattern (Lines 69-71)**
```typescript
if (pendingKeyword && "keywords" in values) {
  values.keywords.push(pendingKeyword);
}
```
- Handles text in keyword input when form submitted
- Adds pending keyword to array
- Used in custom sections, skills, projects

**6. Two-Dialog Pattern (Lines 121-144, 147-189)**
- AlertDialog for destructive delete action
- Regular Dialog for create/update/duplicate
- Different button styles (error vs primary)
- Different messaging

### Section-Specific Dialog Implementation

**File**: `/apps/client/src/pages/builder/sidebars/left/dialogs/experience.tsx`

#### Usage Example (Lines 25-40)

```typescript
export const ExperienceDialog = () => {
  const form = useForm<FormValues>({
    defaultValues: defaultExperience,
    resolver: zodResolver(experienceSchema),
  });

  return (
    <SectionDialog<FormValues>
      id="experience"
      form={form}
      defaultValues={defaultExperience}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Form fields here */}
      </div>
    </SectionDialog>
  );
};
```

#### Field Layout Pattern (Line 33)

```typescript
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
```
- Single column on mobile
- Two columns on larger screens (`sm:` breakpoint)
- Gap between fields
- Full-width fields use `sm:col-span-2`

#### Rich Text Field Pattern (Lines 109-136)

```typescript
<FormField
  name="summary"
  control={form.control}
  render={({ field }) => (
    <FormItem className="sm:col-span-2">  {/* Full width */}
      <FormLabel>{t`Summary`}</FormLabel>
      <FormControl>
        <RichInput
          {...field}
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
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

**Pattern Details**:
- Full width (`sm:col-span-2`)
- Spreads field props for form integration
- Explicit content binding
- Optional AI actions footer
- Direct form state updates

## Common Section Patterns

### Experience Section

**Components**:
- List: Uses SectionBase
- Dialog: Experience-specific dialog
- Fields: Company, Position, Location, Date, URL, Summary (rich text)

**Title/Description**:
```typescript
title={(item) => item.company}
description={(item) => [item.position, item.date].filter(Boolean).join(" • ")}
```

**Form Layout**:
```
Company          | Position
Date             | Location
URL (full width)
Summary (full width, rich text)
```

### Education Section

**Fields**: Institution, Study Type, Area, Score, Date, URL, Summary

**Title/Description**:
```typescript
title={(item) => item.institution}
description={(item) => [item.area, item.studyType].filter(Boolean).join(" • ")}
```

**Form Layout**:
```
Institution      | Study Type
Area             | Score
Date (full width)
URL (full width)
Summary (full width, rich text)
```

### Projects Section

**Fields**: Name, Description, Date, URL, Summary, Keywords

**Title/Description**:
```typescript
title={(item) => item.name}
description={(item) => item.description}
```

**Features**:
- Keywords array (tags/technologies)
- Optional description + detailed summary
- Dual text fields (description is plain text, summary is rich)

### Custom Sections

**File**: `/apps/client/src/pages/builder/sidebars/left/dialogs/custom-section.tsx`

**Fields**: Name, Description, Date, Location, URL, Summary, Keywords

**Special Features**:
- Most flexible schema
- Combines fields from multiple section types
- Keyword drag-drop reordering
- Pending keyword handling

#### Keywords Field Pattern (Lines 175-224)

```typescript
<FormField
  name="keywords"
  control={form.control}
  render={({ field }) => (
    <div className="space-y-3 sm:col-span-2">
      <FormItem>
        <FormLabel>Keywords</FormLabel>
        <FormControl>
          <BadgeInput {...field} setPendingKeyword={setPendingKeyword} />
        </FormControl>
        <FormDescription>
          You can add multiple keywords by separating them with a comma or pressing enter.
        </FormDescription>
        <FormMessage />
      </FormItem>

      {/* Draggable keyword badges */}
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
              <Badge
                className="cursor-pointer"
                onClick={() => field.onChange(field.value.filter((v) => item !== v))}
              >
                <span className="mr-1">{item}</span>
                <XIcon size={12} weight="bold" />
              </Badge>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )}
/>
```

**Features**:
- BadgeInput for comma/enter-separated input
- Draggable badges for reordering
- Click badge to remove
- Framer Motion animations
- Pending keyword support (text in input when form submitted)

### Skills Section

**Fields**: Name, Description (plain text), Level (0-5), Keywords

**No Rich Text**: Skills use plain text description instead of HTML.

**Level Display**:
- Input: Number 0-5
- Display: Visual rating bar
- Calculation: `linearTransform(level, 0, 5, 0, 128)` pixels

### Profiles Section

**File**: `/apps/client/src/pages/builder/sidebars/left/dialogs/profiles.tsx`

**Fields**: Network, Username, Icon (Simple Icons slug), URL

**No Rich Text**: Profiles are simple links.

**Icon Pattern** (Lines 78-108):
```typescript
<FormField
  name="icon"
  control={form.control}
  render={({ field }) => (
    <FormItem className="sm:col-span-2">
      <FormLabel htmlFor="iconSlug">Icon</FormLabel>
      <FormControl>
        <div className="flex items-center gap-x-2">
          <Avatar className="size-8 bg-white p-1.5">
            <BrandIcon slug={field.value} />
          </Avatar>
          <Input {...field} placeholder="github" onChange={field.onChange} />
        </div>
      </FormControl>
      <FormMessage />
      <FormDescription>
        <Trans>
          Powered by{" "}
          <a href="https://simpleicons.org/" target="_blank" rel="noopener noreferrer nofollow">
            Simple Icons
          </a>
        </Trans>
      </FormDescription>
    </FormItem>
  )}
/>
```

**Features**:
- Live icon preview
- Simple Icons integration
- Link to icon library
- Fallback for missing icons

## Rendering Patterns

### Template Structure

**File**: `/apps/artboard/src/templates/azurill.tsx` (and others)

#### Section Component Pattern (Lines 175-248)

```typescript
type SectionProps<T extends SectionItem> = {
  section: SectionWithItem<T>;
  urlKey?: keyof T;
  summaryKey?: keyof T;
  levelKey?: keyof T;
  keywordsKey?: keyof T;
  className?: string;
  children?: (item: T) => React.ReactNode;
};

const Section = <T extends SectionItem>({
  section,
  urlKey,
  summaryKey,
  levelKey,
  keywordsKey,
  className,
  children,
}: SectionProps<T>) => {
  if (!section.visible || !section.items.length) return null;

  return (
    <section id={section.id}>
      {/* Section header */}
      <div className="mb-2 font-bold text-primary">
        <h4>{section.name}</h4>
      </div>

      {/* Items grid */}
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
              <div key={item.id} className="relative space-y-2">
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
              </div>
            );
          })}
      </div>
    </section>
  );
};
```

#### Usage Examples (Lines 269-289)

```typescript
// Experience section
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

#### Key Features

**1. Generic Section Component (Lines 175-248)**
- Handles all item-based sections
- Conditional rendering of URL, summary, level, keywords
- Respects visibility flags
- Column layout support

**2. Summary Rendering (Lines 226-230)**
```typescript
{summary !== undefined && !isEmptyString(summary) && (
  <div
    dangerouslySetInnerHTML={{ __html: sanitize(summary) }}
    className="wysiwyg"
  />
)}
```
- Sanitizes HTML before rendering
- Uses `wysiwyg` class for typography styles
- Checks for empty content (`<p></p>` considered empty)

**3. Columns Support (Line 205)**
```typescript
style={{ gridTemplateColumns: `repeat(${section.columns}, 1fr)` }}
```
- Dynamic grid based on section.columns (1-5)
- Responsive layout
- Equal-width columns

**4. Separate Links Pattern (Line 239)**
```typescript
{url !== undefined && section.separateLinks && <Link url={url} />}
```
- Option to show URLs inline or separately
- Configurable per section
- Cleaner layout when separate

**5. Item Children Pattern (Line 224)**
```typescript
<div>{children?.(item as T)}</div>
```
- Callback renders item-specific fields
- Different per section type
- Flexible rendering

## Best Practices

### 1. Schema Design

**DO**:
```typescript
// Required fields
company: z.string().min(1)

// Optional fields
location: z.string()

// Arrays with defaults
keywords: z.array(z.string()).default([])
```

**DON'T**:
```typescript
// Don't use undefined
keywords?: string[]

// Don't omit .default() for arrays
keywords: z.array(z.string())
```

### 2. Form Integration

**DO**:
```typescript
<RichInput
  {...field}
  content={field.value}
  onChange={(value) => field.onChange(value)}
/>
```

**DON'T**:
```typescript
<RichInput
  value={field.value}  // Wrong prop name
  onChange={field.onChange}  // Wrong signature
/>
```

### 3. Store Updates

**DO**:
```typescript
setValue("sections.experience.items", newArray);  // Immutable
setValue(`sections.${id}.items[${index}].visible`, !visible);  // Type-safe path
```

**DON'T**:
```typescript
section.items.push(newItem);  // Mutating original
setValue(path, value);  // Using variable paths (not type-safe)
```

### 4. Sanitization

**DO**:
```typescript
<div dangerouslySetInnerHTML={{ __html: sanitize(html) }} />
```

**DON'T**:
```typescript
<div dangerouslySetInnerHTML={{ __html: html }} />  // Unsafe!
<div>{html}</div>  // Shows HTML tags as text
```

### 5. Empty State Handling

**DO**:
```typescript
if (!isEmptyString(summary)) {
  // Render summary
}
```

**DON'T**:
```typescript
if (summary) {
  // "<p></p>" is truthy but visually empty
}
```

### 6. ID Generation

**DO**:
```typescript
import { createId } from "@paralleldrive/cuid2";
const newItem = { ...values, id: createId() };
```

**DON'T**:
```typescript
const newItem = { ...values, id: Math.random().toString() };  // Collision risk
const newItem = { ...values, id: Date.now().toString() };  // Not unique enough
```

## Reusable Patterns Summary

### For Summary-Style Sections
1. Direct RichInput in section component
2. Store setValue calls (no form)
3. Optional AI actions footer
4. Visibility with opacity

### For Item-Based Sections
1. SectionBase for list display
2. SectionDialog wrapper
3. Section-specific dialog with form
4. Generic Section component for rendering
5. Title/description extraction callbacks
6. Drag-drop reordering
7. CRUD operations through dialogs

### For Rich Text Fields
1. FormField with RichInput
2. Spread field props + explicit content
3. Optional AI actions footer
4. onChange syncs form state
5. Full-width in grid layout

### For Keywords Fields
1. BadgeInput component
2. Draggable badges display
3. Pending keyword handling
4. Click to remove

### For URL Fields
1. URLInput component
2. Main input + popover for label
3. Validation with error display
4. Object update pattern

### For Rendering
1. Generic Section component
2. Sanitize HTML before rendering
3. Check for empty HTML
4. Respect visibility flags
5. Column layout support
6. Conditional feature rendering

## Accessibility Considerations

1. **Keyboard Navigation**: Drag-drop supports keyboard
2. **Focus Management**: Editor keeps focus during operations
3. **ARIA Labels**: Tooltips and labels on all buttons
4. **Color Contrast**: Primary colors for visibility
5. **Screen Reader**: Semantic HTML in templates
6. **Error Messages**: FormMessage shows validation errors

## Performance Optimizations

1. **Debounced Updates**: Editor updates throttled
2. **Memoized Validation**: URL validation uses useMemo
3. **Virtualization**: Not needed (small lists typical)
4. **Lazy Loading**: Dialogs render on-demand
5. **Animation**: Framer Motion for smooth transitions
6. **Code Splitting**: NX monorepo enables optimal bundling

## Conclusion

Reactive-Resume demonstrates mature patterns for rich text editing in resume builders:

- **Two-pattern architecture**: Summary vs Item-based
- **TipTap integration**: Clean, extensible editor
- **Type-safe schemas**: Zod validation throughout
- **Generic components**: Reusable across section types
- **Immutable updates**: Immer for state management
- **Safe rendering**: HTML sanitization
- **Accessibility**: Keyboard + screen reader support
- **Developer experience**: TypeScript, type-safe paths, clear patterns

These patterns can be adapted for other document editing applications with similar requirements.
