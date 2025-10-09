# Phase 3: Template Migration (12 Templates)

**⚠️ CONTEXT FOR IMPLEMENTER**

You are implementing Phase 3 of a 5-phase template system migration. This plan was written by someone else.

**Prerequisites**:
- Phase 1 (Foundation) complete
- Phase 2 (PDF Processing) complete and validated

**Source Repository**: `/Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume`

**Source Templates Location**: `apps/artboard/src/templates/`

---

## Phase Overview

**Goal**: Migrate all 12 templates from Reactive-Resume to ResumePair.

**Duration**: 7-10 days

**Strategy**: Start with simplest template (Onyx) as proof-of-concept, validate thoroughly, then migrate remaining 11 in parallel.

**Deliverables**:
1. 12 fully functional template files
2. Updated template registry
3. Updated catalog metadata
4. Template thumbnails
5. Old templates deleted

---

## Template List

| ID | Name | Lines | Complexity | Features |
|----|------|-------|------------|----------|
| onyx | Onyx | 579 | ⭐⭐ Simple | Single-column, professional |
| kakuna | Kakuna | 541 | ⭐⭐ Simple | Minimalist, clean |
| leafish | Leafish | 537 | ⭐⭐ Simple | Nature-inspired |
| azurill | Azurill | 576 | ⭐⭐⭐ Medium | Sidebar + main, two-column |
| bronzor | Bronzor | 585 | ⭐⭐⭐ Medium | Two-column, professional |
| chikorita | Chikorita | 597 | ⭐⭐⭐ Medium | Classic design |
| nosepass | Nosepass | 600 | ⭐⭐⭐ Medium | Geometric style |
| rhyhorn | Rhyhorn | 582 | ⭐⭐⭐ Medium | Traditional layout |
| gengar | Gengar | 605 | ⭐⭐⭐⭐ Complex | Timeline-based |
| glalie | Glalie | 612 | ⭐⭐⭐⭐ Complex | Modern design |
| ditto | Ditto | 626 | ⭐⭐⭐⭐ Complex | Colored header |
| pikachu | Pikachu | 622 | ⭐⭐⭐⭐ Complex | Bold header |

**Migration Order**: Onyx first (proof-of-concept), then simplest to most complex.

---

## Pre-Migration Preparation

**Duration**: 2-3 hours

### Step 0.1: Study Source Templates

Spend 2-3 hours reading source template files:

```bash
cd /Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume/apps/artboard/src/templates/
```

**Read in this order**:
1. `onyx.tsx` - Simplest, understand base patterns
2. `azurill.tsx` - Introduces sidebar/main split
3. `pikachu.tsx` - Most complex, all features

**Key patterns to understand**:
- How `mapSectionToComponent()` works
- How `<Section>` component is used
- How `isFirstPage` controls header display
- How columns array is destructured
- How custom sections are handled

### Step 0.2: Create Template Workspace

```bash
mkdir -p /Users/varunprasad/code/prjs/resumepair/libs/reactive-artboard/templates/backup
```

**Backup old templates**:
```bash
mv libs/reactive-artboard/templates/onyx.tsx libs/reactive-artboard/templates/backup/
mv libs/reactive-artboard/templates/modern.tsx libs/reactive-artboard/templates/backup/
mv libs/reactive-artboard/templates/creative.tsx libs/reactive-artboard/templates/backup/
mv libs/reactive-artboard/templates/technical.tsx libs/reactive-artboard/templates/backup/
```

---

## Template Migration: Onyx (Proof-of-Concept)

**Duration**: 1 day

### Step 1.1: Copy Onyx Template

**Source**: `agents/repos/Reactive-Resume/apps/artboard/src/templates/onyx.tsx`

**Target**: `libs/reactive-artboard/templates/onyx.tsx`

```bash
cp /Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume/apps/artboard/src/templates/onyx.tsx \
   /Users/varunprasad/code/prjs/resumepair/libs/reactive-artboard/templates/onyx.tsx
```

### Step 1.2: Update Imports

**File**: `libs/reactive-artboard/templates/onyx.tsx`

**Find** (lines 1-10 in source):
```typescript
import { useArtboardStore } from "../store";
import { SectionKey } from "@reactive-resume/schema";
```

**Replace with**:
```typescript
import { useArtboardStore } from '../store/artboard'
import { Section, Link, LinkedEntity, Picture, BrandIcon } from '../components'
import { cn, isUrl, isEmptyString, linearTransform, sanitize } from '@/libs/utils'
import React, { Fragment } from 'react'

// Type for section keys
type SectionKey =
  | 'summary' | 'experience' | 'education' | 'skills' | 'projects'
  | 'certifications' | 'awards' | 'languages' | 'interests'
  | 'profiles' | 'publications' | 'volunteer' | 'references'
  | string  // For custom sections like "custom.{id}"
```

### Step 1.3: Fix Component Imports

The source template uses local components defined in the same file. We've extracted some to shared components. Update references:

**Find**:
```typescript
const Section = <T,>({ ... }) => { ... }
```

**Replace with**:
```typescript
// Import from shared components instead
import { Section } from '../components'
```

**BUT** keep template-specific helper components:
- `<Rating>` - Keep if unique styling
- `<Link>` - Import from shared
- `<LinkedEntity>` - Import from shared

### Step 1.4: Update Store Hooks

**Find all instances of**:
```typescript
const section = useArtboardStore((state) => state.resume.sections.experience)
```

**These should work as-is** if Phase 1 adapter is correct. Verify store structure matches.

### Step 1.5: Handle Missing Utilities

**Find**:
```typescript
import { cn, isUrl, isEmptyString } from "@reactive-resume/utils";
```

**These utilities needed**:

**Create**: `libs/utils/string.ts` (if doesn't exist)

```typescript
export function isEmptyString(value: string | undefined | null): boolean {
  return !value || value.trim() === ''
}

export function isUrl(value: string | undefined | null): boolean {
  if (!value) return false
  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}
```

**Create**: `libs/utils/math.ts`

```typescript
export function linearTransform(
  value: number,
  fromMin: number,
  fromMax: number,
  toMin: number,
  toMax: number
): number {
  return ((value - fromMin) / (fromMax - fromMin)) * (toMax - toMin) + toMin
}
```

**Update**: `libs/utils.ts`

```typescript
export * from './utils/string'
export * from './utils/math'
export { cn } from './cn'  // Existing
```

### Step 1.6: Update sanitize Function

**Find**:
```typescript
import { sanitize } from "@reactive-resume/utils/namespaces/string";
```

**Create**: `libs/utils/sanitize.ts`

```typescript
import sanitizeHtml from 'sanitize-html'

export function sanitize(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ['p', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li', 'br', 'span', 'div'],
    allowedAttributes: {
      a: ['href', 'target', 'rel'],
    },
  })
}
```

Export in `libs/utils.ts`:
```typescript
export { sanitize } from './utils/sanitize'
```

### Step 1.7: Test Onyx Template

**Create test file**: `app/(app)/test-onyx/page.tsx`

```typescript
'use client'

import { useEffect } from 'react'
import { useArtboardStore } from '@/libs/reactive-artboard/store/artboard'
import { mapResumeJsonToArtboardData } from '@/libs/reactive-artboard/adapters'
import { Page } from '@/libs/reactive-artboard/components'
import { Onyx } from '@/libs/reactive-artboard/templates/onyx'
import { sampleResume } from '@/libs/samples/resumeSample'

export default function TestOnyxPage() {
  const setResume = useArtboardStore((state) => state.setResume)

  useEffect(() => {
    const artboardData = mapResumeJsonToArtboardData(sampleResume)
    setResume(artboardData)
  }, [setResume])

  const resume = useArtboardStore((state) => state.resume)

  if (!resume) return <div>Loading...</div>

  return (
    <div className="p-8 bg-gray-100">
      <Page mode="builder" pageNumber={1}>
        <Onyx
          isFirstPage={true}
          columns={resume.metadata.layout[0]}
        />
      </Page>
    </div>
  )
}
```

**Navigate to**: `http://localhost:3000/test-onyx`

**Validation checklist**:
- [ ] Template renders without errors
- [ ] All sections display
- [ ] Styling looks correct
- [ ] Colors apply (primary, background, text)
- [ ] Icons render (Phosphor icons)
- [ ] Links work
- [ ] No console errors

### Step 1.8: Test Onyx PDF Export

**Create test API route**: `app/api/v1/test/pdf/route.ts`

```typescript
import { generateResumePdf } from '@/libs/exporters/pdfGenerator'
import { sampleResume } from '@/libs/samples/resumeSample'

export async function GET() {
  const result = await generateResumePdf(sampleResume, {
    resumeId: 'test-onyx',
    userId: 'test-user',
  })

  return new Response(result.buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename="test-onyx.pdf"',
    },
  })
}
```

**Navigate to**: `http://localhost:3000/api/v1/test/pdf`

**Validation**:
- [ ] PDF downloads/opens
- [ ] Content matches preview
- [ ] No overflow
- [ ] Colors correct
- [ ] All sections present

---

## If Onyx Works: Migrate Remaining 11 Templates

**Duration**: 5-7 days (can parallelize)

For each template, repeat Steps 1.1-1.8 above:

### Migration Batch 1: Simple Templates (1-2 days)
- [ ] Kakuna (541 lines)
- [ ] Leafish (537 lines)

### Migration Batch 2: Medium Templates (2-3 days)
- [ ] Azurill (576 lines)
- [ ] Bronzor (585 lines)
- [ ] Chikorita (597 lines)
- [ ] Nosepass (600 lines)
- [ ] Rhyhorn (582 lines)

### Migration Batch 3: Complex Templates (2-3 days)
- [ ] Gengar (605 lines)
- [ ] Glalie (612 lines)
- [ ] Ditto (626 lines)
- [ ] Pikachu (622 lines)

**For each template**:
1. Copy from source
2. Update imports
3. Fix utility references
4. Test in browser
5. Test PDF export
6. Fix any issues
7. Move to next template

---

## Step 2: Update Template Registry

**Duration**: 1 hour

**File**: `libs/reactive-artboard/templates/index.tsx`

**Replace entire file**:

```typescript
import React from 'react'

// Import all 12 templates
import { Azurill } from './azurill'
import { Bronzor } from './bronzor'
import { Chikorita } from './chikorita'
import { Ditto } from './ditto'
import { Gengar } from './gengar'
import { Glalie } from './glalie'
import { Kakuna } from './kakuna'
import { Leafish } from './leafish'
import { Nosepass } from './nosepass'
import { Onyx } from './onyx'
import { Pikachu } from './pikachu'
import { Rhyhorn } from './rhyhorn'

export type Template =
  | 'azurill'
  | 'bronzor'
  | 'chikorita'
  | 'ditto'
  | 'gengar'
  | 'glalie'
  | 'kakuna'
  | 'leafish'
  | 'nosepass'
  | 'onyx'
  | 'pikachu'
  | 'rhyhorn'

export interface TemplateProps {
  columns: string[][]  // Array of columns, each containing section IDs
  isFirstPage?: boolean
}

type TemplateComponent = React.FC<TemplateProps>

const registry: Record<Template, TemplateComponent> = {
  azurill: Azurill,
  bronzor: Bronzor,
  chikorita: Chikorita,
  ditto: Ditto,
  gengar: Gengar,
  glalie: Glalie,
  kakuna: Kakuna,
  leafish: Leafish,
  nosepass: Nosepass,
  onyx: Onyx,
  pikachu: Pikachu,
  rhyhorn: Rhyhorn,
}

export function getTemplate(template: Template): TemplateComponent {
  return registry[template] ?? registry.onyx  // Fallback to Onyx
}

// Export individual templates for direct import
export { Azurill, Bronzor, Chikorita, Ditto, Gengar, Glalie, Kakuna, Leafish, Nosepass, Onyx, Pikachu, Rhyhorn }
```

---

## Step 3: Update Catalog Metadata

**Duration**: 2 hours

**File**: `libs/reactive-artboard/catalog.ts`

**Replace template metadata**:

```typescript
export interface ResumeTemplateMetadata {
  id: string
  name: string
  description: string
  features: string[]
  thumbnail: string
  defaultTheme: {
    background: string
    text: string
    primary: string
  }
}

export const RESUME_TEMPLATE_METADATA: ResumeTemplateMetadata[] = [
  {
    id: 'azurill',
    name: 'Azurill',
    description: 'Two-column layout with sidebar highlighting key skills',
    features: ['Two-Column', 'Sidebar', 'Timeline'],
    thumbnail: '/templates/azurill-thumb.jpg',
    defaultTheme: {
      background: '#ffffff',
      text: '#000000',
      primary: '#3b82f6',  // Blue
    },
  },
  {
    id: 'bronzor',
    name: 'Bronzor',
    description: 'Professional two-column design with clean lines',
    features: ['Two-Column', 'Professional', 'ATS-Friendly'],
    thumbnail: '/templates/bronzor-thumb.jpg',
    defaultTheme: {
      background: '#ffffff',
      text: '#000000',
      primary: '#64748b',  // Slate
    },
  },
  {
    id: 'chikorita',
    name: 'Chikorita',
    description: 'Classic resume layout with timeless design',
    features: ['Classic', 'Traditional', 'Elegant'],
    thumbnail: '/templates/chikorita-thumb.jpg',
    defaultTheme: {
      background: '#ffffff',
      text: '#000000',
      primary: '#22c55e',  // Green
    },
  },
  {
    id: 'ditto',
    name: 'Ditto',
    description: 'Bold colored header with modern flair',
    features: ['Colored Header', 'Modern', 'Eye-Catching'],
    thumbnail: '/templates/ditto-thumb.jpg',
    defaultTheme: {
      background: '#ffffff',
      text: '#000000',
      primary: '#8b5cf6',  // Purple
    },
  },
  {
    id: 'gengar',
    name: 'Gengar',
    description: 'Timeline-based layout emphasizing career progression',
    features: ['Timeline', 'Visual', 'Progressive'],
    thumbnail: '/templates/gengar-thumb.jpg',
    defaultTheme: {
      background: '#ffffff',
      text: '#000000',
      primary: '#6366f1',  // Indigo
    },
  },
  {
    id: 'glalie',
    name: 'Glalie',
    description: 'Modern design with geometric elements',
    features: ['Modern', 'Geometric', 'Clean'],
    thumbnail: '/templates/glalie-thumb.jpg',
    defaultTheme: {
      background: '#ffffff',
      text: '#000000',
      primary: '#06b6d4',  // Cyan
    },
  },
  {
    id: 'kakuna',
    name: 'Kakuna',
    description: 'Minimalist single-column layout for maximum clarity',
    features: ['Minimalist', 'ATS-Friendly', 'Clean'],
    thumbnail: '/templates/kakuna-thumb.jpg',
    defaultTheme: {
      background: '#ffffff',
      text: '#000000',
      primary: '#f59e0b',  // Amber
    },
  },
  {
    id: 'leafish',
    name: 'Leafish',
    description: 'Nature-inspired design with organic flow',
    features: ['Organic', 'Friendly', 'Approachable'],
    thumbnail: '/templates/leafish-thumb.jpg',
    defaultTheme: {
      background: '#ffffff',
      text: '#000000',
      primary: '#10b981',  // Emerald
    },
  },
  {
    id: 'nosepass',
    name: 'Nosepass',
    description: 'Geometric layout with strong visual hierarchy',
    features: ['Geometric', 'Structured', 'Bold'],
    thumbnail: '/templates/nosepass-thumb.jpg',
    defaultTheme: {
      background: '#ffffff',
      text: '#000000',
      primary: '#ef4444',  // Red
    },
  },
  {
    id: 'onyx',
    name: 'Onyx',
    description: 'Simple professional single-column layout',
    features: ['Professional', 'ATS-Friendly', 'Traditional'],
    thumbnail: '/templates/onyx-thumb.jpg',
    defaultTheme: {
      background: '#ffffff',
      text: '#000000',
      primary: '#dc2626',  // Red (default)
    },
  },
  {
    id: 'pikachu',
    name: 'Pikachu',
    description: 'Bold header design that makes a strong first impression',
    features: ['Bold', 'Eye-Catching', 'Memorable'],
    thumbnail: '/templates/pikachu-thumb.jpg',
    defaultTheme: {
      background: '#ffffff',
      text: '#000000',
      primary: '#eab308',  // Yellow
    },
  },
  {
    id: 'rhyhorn',
    name: 'Rhyhorn',
    description: 'Traditional layout with solid structure',
    features: ['Traditional', 'Solid', 'Reliable'],
    thumbnail: '/templates/rhyhorn-thumb.jpg',
    defaultTheme: {
      background: '#ffffff',
      text: '#000000',
      primary: '#78716c',  // Stone
    },
  },
]

export function listResumeTemplateMetadata(): ResumeTemplateMetadata[] {
  return RESUME_TEMPLATE_METADATA
}

export function getTemplateMetadata(id: string): ResumeTemplateMetadata | undefined {
  return RESUME_TEMPLATE_METADATA.find((t) => t.id === id)
}
```

---

## Step 4: Generate Template Thumbnails

**Duration**: 2-3 hours

### Option A: Use Existing Thumbnails from Source

```bash
# If source has thumbnails
cp -r /Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume/apps/client/public/templates \
      /Users/varunprasad/code/prjs/resumepair/public/
```

### Option B: Generate New Thumbnails with Puppeteer

**Create script**: `scripts/generate-thumbnails.mjs`

```javascript
import puppeteer from 'puppeteer'
import fs from 'fs'
import path from 'path'

const templates = [
  'azurill', 'bronzor', 'chikorita', 'ditto', 'gengar', 'glalie',
  'kakuna', 'leafish', 'nosepass', 'onyx', 'pikachu', 'rhyhorn'
]

async function generateThumbnails() {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()

  for (const template of templates) {
    console.log(`Generating thumbnail for ${template}...`)

    // Navigate to test page with template
    await page.goto(`http://localhost:3000/test-${template}`)
    await page.waitForSelector('[data-page="1"]')

    // Screenshot first page
    const element = await page.$('[data-page="1"]')
    const screenshot = await element.screenshot({ type: 'jpeg', quality: 80 })

    // Save thumbnail
    const outputPath = path.join(process.cwd(), 'public', 'templates', `${template}-thumb.jpg`)
    fs.writeFileSync(outputPath, screenshot)

    console.log(`Saved: ${outputPath}`)
  }

  await browser.close()
}

generateThumbnails()
```

**Run**:
```bash
node scripts/generate-thumbnails.mjs
```

---

## Step 5: Update Customization Panel

**Duration**: 1-2 hours

**File**: `components/customization/CustomizationPanel.tsx`

**Find** template selector section

**Update** to show 12 templates:

```typescript
const templates = listResumeTemplateMetadata()

return (
  <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
    {templates.map((template) => (
      <div
        key={template.id}
        className={cn(
          'cursor-pointer rounded-lg border-2 transition-all',
          currentTemplate === template.id
            ? 'border-primary ring-2 ring-primary'
            : 'border-gray-200 hover:border-primary'
        )}
        onClick={() => handleTemplateChange(template.id)}
      >
        <img
          src={template.thumbnail}
          alt={template.name}
          className="w-full aspect-[1/1.4] object-cover rounded-t-lg"
        />
        <div className="p-3">
          <h3 className="font-semibold">{template.name}</h3>
          <p className="text-xs text-gray-600">{template.description}</p>
        </div>
      </div>
    ))}
  </div>
)
```

---

## Step 6: Delete Old Templates

**Duration**: 15 minutes

```bash
rm -rf libs/reactive-artboard/templates/backup/
```

**Verify old templates not referenced**:
```bash
grep -r "modern.tsx\|creative.tsx\|technical.tsx" libs/ components/ app/
# Should return no results
```

---

## Phase 3 Validation Checklist

Test **all 12 templates** individually:

### Per-Template Checklist

For each template:
- [ ] **Preview**:
  - [ ] Renders without errors
  - [ ] All sections display
  - [ ] Colors apply correctly
  - [ ] Fonts load
  - [ ] Icons render
  - [ ] Links work
  - [ ] Multi-column layout works
  - [ ] Responsive to screen size

- [ ] **PDF Export**:
  - [ ] PDF generates successfully
  - [ ] Content matches preview
  - [ ] No overflow
  - [ ] Page breaks correct
  - [ ] Colors accurate
  - [ ] Text readable
  - [ ] No missing content

### Integration Tests

- [ ] Template selector shows all 12
- [ ] Thumbnails display
- [ ] Switching templates works
- [ ] Theme colors apply to all templates
- [ ] Font changes apply to all templates
- [ ] Custom CSS works on all templates

---

## Troubleshooting

### Issue: "Cannot find module './azurill'"
**Solution**: Ensure template file exports default component with correct name

### Issue: Template renders but looks broken
**Solution**: Check Tailwind classes compile, CSS variables set

### Issue: Icons don't render
**Solution**: Verify Phosphor Icons CSS imported in globals.css

### Issue: PDF export fails for specific template
**Solution**: Check for syntax errors, invalid HTML, missing data

### Issue: Colors don't apply
**Solution**: Verify CSS variables injected, check theme mapping

---

## Next Steps

Once Phase 3 validation passes:
1. Commit all template files
2. Test each template with real user data
3. Generate all 12 thumbnails
4. **Proceed to Phase 4**: `04_PHASE4_FONTS_AND_LAYOUT.md`

---

**Phase 3 Complete** ✓

You now have 12 production-ready templates with perfect preview and PDF rendering.
