# Phase 4: Font System & Layout Editor

**⚠️ CONTEXT FOR IMPLEMENTER**

You are implementing Phase 4 of a 5-phase template system migration.

**Prerequisites**:
- Phases 1-3 complete
- All 12 templates working

**Source Repository**: `/Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume`

---

## Phase Overview

**Goal**: Add advanced customization features - 900+ Google Fonts and drag-drop layout editor.

**Duration**: 4-5 days

**Deliverables**:
1. Google Fonts metadata (438KB file)
2. Font loading with webfontloader
3. Typography customization UI
4. Drag-drop layout editor (dnd-kit)
5. Add/remove page controls
6. Layout reset functionality

---

## Part A: Font System (Days 1-2)

### Step 1: Copy Font Metadata

**Duration**: 30 minutes

**Source**: `agents/repos/Reactive-Resume/libs/utils/src/namespaces/fonts.ts`

```bash
cp /Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume/libs/utils/src/namespaces/fonts.ts \
   /Users/varunprasad/code/prjs/resumepair/libs/utils/fonts.ts
```

**This file contains**:
- 900+ Google Fonts metadata
- Font families, variants, subsets
- ~438KB size

### Step 2: Install webfontloader

```bash
npm install webfontloader
npm install @types/webfontloader -D
```

### Step 3: Create Typography Panel

**File**: `components/customization/TypographySection.tsx`

```typescript
'use client'

import { useState, useCallback, useEffect } from 'react'
import { useDocumentStore } from '@/stores/documentStore'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { fonts } from '@/libs/utils/fonts'
import webfontloader from 'webfontloader'

const localFonts = ['Arial', 'Cambria', 'Garamond', 'Times New Roman']

const fontSuggestions = [
  ...localFonts,
  'IBM Plex Sans',
  'IBM Plex Serif',
  'Inter',
  'Lato',
  'Lora',
  'Merriweather',
  'Open Sans',
  'Playfair Display',
  'PT Sans',
  'PT Serif',
  'Roboto',
  'Roboto Condensed',
]

export function TypographySection() {
  const document = useDocumentStore((state) => state.document)
  const updateDocument = useDocumentStore((state) => state.updateDocument)

  const typography = document?.appearance?.typography || {
    fontFamily: 'Inter',
    fontSize: 14,
    lineHeight: 1.5,
  }

  // Load font suggestions on mount
  useEffect(() => {
    for (const font of fontSuggestions) {
      if (localFonts.includes(font)) continue
      webfontloader.load({
        events: false,
        classes: false,
        google: { families: [font], text: font },  // Only load font name characters
      })
    }
  }, [])

  const handleFontChange = (font: string) => {
    updateDocument({
      appearance: {
        ...document.appearance,
        typography: {
          ...typography,
          fontFamily: font,
        },
      },
    })

    // Load full font
    if (!localFonts.includes(font)) {
      webfontloader.load({
        google: { families: [font] },
      })
    }
  }

  const handleSizeChange = (value: number[]) => {
    updateDocument({
      appearance: {
        ...document.appearance,
        typography: {
          ...typography,
          fontSize: value[0],
        },
      },
    })
  }

  const handleLineHeightChange = (value: number[]) => {
    updateDocument({
      appearance: {
        ...document.appearance,
        typography: {
          ...typography,
          lineHeight: value[0],
        },
      },
    })
  }

  return (
    <div className="space-y-6">
      {/* Font Family */}
      <div className="space-y-3">
        <Label>Font Family</Label>
        <div className="grid grid-cols-2 gap-3">
          {fontSuggestions.map((font) => (
            <Button
              key={font}
              variant="outline"
              style={{ fontFamily: font }}
              className={cn(
                'h-12 text-sm',
                typography.fontFamily === font && 'ring-2 ring-primary'
              )}
              onClick={() => handleFontChange(font)}
            >
              {font}
            </Button>
          ))}
        </div>
      </div>

      {/* Font Size */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Font Size</Label>
          <span className="text-sm text-gray-600">{typography.fontSize}px</span>
        </div>
        <Slider
          min={10}
          max={20}
          step={1}
          value={[typography.fontSize]}
          onValueChange={handleSizeChange}
        />
      </div>

      {/* Line Height */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Line Height</Label>
          <span className="text-sm text-gray-600">{typography.lineHeight.toFixed(1)}</span>
        </div>
        <Slider
          min={1.0}
          max={2.5}
          step={0.1}
          value={[typography.lineHeight]}
          onValueChange={handleLineHeightChange}
        />
      </div>
    </div>
  )
}
```

### Step 4: Add Typography Panel to CustomizationPanel

**File**: `components/customization/CustomizationPanel.tsx`

```typescript
import { TypographySection } from './TypographySection'

// Inside CustomizationPanel component:
<Accordion type="single" collapsible>
  <AccordionItem value="template">
    <AccordionTrigger>Template</AccordionTrigger>
    <AccordionContent>
      {/* Existing template selector */}
    </AccordionContent>
  </AccordionItem>

  <AccordionItem value="typography">
    <AccordionTrigger>Typography</AccordionTrigger>
    <AccordionContent>
      <TypographySection />
    </AccordionContent>
  </AccordionItem>

  {/* Other sections... */}
</Accordion>
```

### Step 5: Update Store to Handle Typography Changes

**File**: `stores/documentStore.ts`

Ensure `updateDocument` properly merges appearance updates:

```typescript
updateDocument: (partial: Partial<ResumeJson>) => {
  set((state) => ({
    document: {
      ...state.document,
      ...partial,
      appearance: {
        ...state.document.appearance,
        ...partial.appearance,
        typography: {
          ...state.document.appearance?.typography,
          ...partial.appearance?.typography,
        },
      },
    },
  }))
}
```

### Validation:
- [ ] Font selector displays 13 fonts
- [ ] Clicking font loads and applies it
- [ ] Font size slider works (10-20px)
- [ ] Line height slider works (1.0-2.5)
- [ ] Changes reflect in preview immediately
- [ ] Font loads without flash of unstyled text

---

## Part B: Layout Editor (Days 3-4)

### Step 1: Study Source Implementation

**Source**: `agents/repos/Reactive-Resume/apps/client/src/pages/builder/sidebars/right/sections/layout.tsx:110-271`

**Key concepts**:
- Layout array: `layout[page][column][section]`
- Drag-drop with `@dnd-kit/core`
- Add/remove pages
- Reset to default layout

### Step 2: Create Layout Utilities

**File**: `libs/utils/layout.ts`

```typescript
export interface LayoutLocator {
  page: number
  column: number
  section: number
}

export function parseLayoutLocator(data: any): LayoutLocator {
  // Parse from drag-drop payload
  // Format: "page-0-column-1-section-2"
  const parts = (data?.id || '').split('-')
  return {
    page: parseInt(parts[1]) || 0,
    column: parseInt(parts[3]) || 0,
    section: parseInt(parts[5]) || 0,
  }
}

export function moveItemInLayout(
  current: LayoutLocator,
  target: LayoutLocator,
  layout: string[][][]
): string[][][] {
  try {
    const newLayout = JSON.parse(JSON.stringify(layout))  // Deep clone

    // Get item
    const item = newLayout[current.page][current.column][current.section]

    // Remove from source
    newLayout[current.page][current.column].splice(current.section, 1)

    // Insert at target
    newLayout[target.page][target.column].splice(target.section, 0, item)

    return newLayout
  } catch {
    return layout  // Fallback on error
  }
}

export function findItemInLayout(
  sectionId: string,
  layout: string[][][]
): LayoutLocator | null {
  for (let page = 0; page < layout.length; page++) {
    for (let column = 0; column < layout[page].length; column++) {
      const section = layout[page][column].indexOf(sectionId)
      if (section !== -1) {
        return { page, column, section }
      }
    }
  }
  return null
}
```

### Step 3: Create Layout Editor Component

**File**: `components/customization/LayoutEditor.tsx`

```typescript
'use client'

import { useState } from 'react'
import { useDocumentStore } from '@/stores/documentStore'
import { Button } from '@/components/ui/button'
import { DndContext, DragEndEvent, DragOverEvent } from '@dnd-kit/core'
import { SortableContext, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { moveItemInLayout, parseLayoutLocator } from '@/libs/utils/layout'
import { PlusIcon, TrashIcon, RotateCcwIcon } from 'lucide-react'

const sectionLabels: Record<string, string> = {
  summary: 'Summary',
  experience: 'Experience',
  education: 'Education',
  skills: 'Skills',
  projects: 'Projects',
  certifications: 'Certifications',
  awards: 'Awards',
  languages: 'Languages',
  interests: 'Interests',
  publications: 'Publications',
  volunteer: 'Volunteer',
  references: 'References',
  profiles: 'Profiles',
}

export function LayoutEditor() {
  const document = useDocumentStore((state) => state.document)
  const updateDocument = useDocumentStore((state) => state.updateDocument)

  const layout = document?.appearance?.layout || [[[], []]]

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const current = parseLayoutLocator(active.data.current)
    const target = parseLayoutLocator(over.data.current)

    const newLayout = moveItemInLayout(current, target, layout)

    updateDocument({
      appearance: {
        ...document.appearance,
        layout: newLayout,
      },
    })
  }

  const handleAddPage = () => {
    const newLayout = [...layout, [[], []]]  // Add page with 2 empty columns
    updateDocument({
      appearance: {
        ...document.appearance,
        layout: newLayout,
      },
    })
  }

  const handleRemovePage = (pageIndex: number) => {
    if (layout.length === 1) return  // Can't remove last page

    const newLayout = [...layout]

    // Move sections to page 1
    newLayout[0][0].push(...newLayout[pageIndex][0])
    newLayout[0][1].push(...newLayout[pageIndex][1])

    // Remove page
    newLayout.splice(pageIndex, 1)

    updateDocument({
      appearance: {
        ...document.appearance,
        layout: newLayout,
      },
    })
  }

  const handleReset = () => {
    const defaultLayout = [
      [
        ['summary', 'experience', 'education', 'projects'],
        ['skills', 'certifications', 'languages', 'awards'],
      ],
    ]

    updateDocument({
      appearance: {
        ...document.appearance,
        layout: defaultLayout,
      },
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Layout</h3>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handleReset}>
            <RotateCcwIcon className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button size="sm" onClick={handleAddPage}>
            <PlusIcon className="w-4 h-4 mr-2" />
            Add Page
          </Button>
        </div>
      </div>

      {/* Pages */}
      <DndContext onDragEnd={handleDragEnd}>
        <div className="space-y-4">
          {layout.map((page, pageIndex) => (
            <div key={pageIndex} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium">Page {pageIndex + 1}</h4>
                {layout.length > 1 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemovePage(pageIndex)}
                  >
                    <TrashIcon className="w-4 h-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {page.map((column, columnIndex) => (
                  <div key={columnIndex} className="space-y-2">
                    <div className="text-xs font-medium text-gray-600">
                      {columnIndex === 0 ? 'Main' : 'Sidebar'}
                    </div>
                    <SortableContext items={column}>
                      <div className="space-y-2 min-h-[100px] bg-gray-50 rounded p-2">
                        {column.map((sectionId, sectionIndex) => (
                          <SortableItem
                            key={sectionId}
                            id={`page-${pageIndex}-column-${columnIndex}-section-${sectionIndex}`}
                            label={sectionLabels[sectionId] || sectionId}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DndContext>
    </div>
  )
}

function SortableItem({ id, label }: { id: string; label: string }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white border rounded px-3 py-2 text-sm cursor-move hover:border-primary"
    >
      {label}
    </div>
  )
}
```

### Step 4: Add Layout Editor to CustomizationPanel

**File**: `components/customization/CustomizationPanel.tsx`

```typescript
import { LayoutEditor } from './LayoutEditor'

// Add to accordion:
<AccordionItem value="layout">
  <AccordionTrigger>Layout</AccordionTrigger>
  <AccordionContent>
    <LayoutEditor />
  </AccordionContent>
</AccordionItem>
```

### Validation:
- [ ] Layout editor displays all pages
- [ ] Drag-drop sections between columns works
- [ ] Drag-drop sections between pages works
- [ ] Add page button works
- [ ] Remove page button works (moves sections to page 1)
- [ ] Reset button restores default layout
- [ ] Changes reflect in preview immediately

---

## Phase 4 Validation Checklist

- [ ] **Font System**:
  - [ ] 438KB fonts.ts file copied
  - [ ] webfontloader installed
  - [ ] Typography panel renders
  - [ ] 13 font suggestions load
  - [ ] Clicking font applies it
  - [ ] Font size slider works (10-20px)
  - [ ] Line height slider works (1.0-2.5)
  - [ ] Changes apply to preview
  - [ ] No flash of unstyled text

- [ ] **Layout Editor**:
  - [ ] Layout editor renders
  - [ ] Shows all pages with sections
  - [ ] Drag-drop within column works
  - [ ] Drag-drop between columns works
  - [ ] Drag-drop between pages works
  - [ ] Add page creates empty page
  - [ ] Remove page moves sections to page 1
  - [ ] Reset restores default layout
  - [ ] Changes persist across sessions

- [ ] **Integration**:
  - [ ] Both features in CustomizationPanel
  - [ ] No conflicts between features
  - [ ] Performance acceptable
  - [ ] No memory leaks

---

## Troubleshooting

### Issue: Fonts not loading
**Solution**: Check webfontloader imported, API key if needed

### Issue: Drag-drop not working
**Solution**: Verify @dnd-kit packages installed, DndContext wraps items

### Issue: Layout changes don't persist
**Solution**: Check updateDocument properly merges layout array

### Issue: Sections disappear after drag
**Solution**: Check moveItemInLayout logic, ensure deep clone

---

## Next Steps

Once Phase 4 validation passes:
1. Commit all changes
2. Test with multiple fonts
3. Test complex layout rearrangements
4. **Proceed to Phase 5**: `05_PHASE5_MIGRATION_VALIDATION.md`

---

**Phase 4 Complete** ✓

Users now have full control over typography and layout.
