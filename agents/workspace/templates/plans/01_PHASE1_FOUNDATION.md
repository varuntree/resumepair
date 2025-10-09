# Phase 1: Foundation & Infrastructure

**⚠️ CONTEXT FOR IMPLEMENTER**

You are implementing Phase 1 of a 5-phase template system migration. This plan was written by someone else. You may not have full context of decisions made or codebase history.

**Source Repository**: `/Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume`

Throughout this phase, you will frequently reference the source code above. When instructions say "copy from source", navigate to that path.

---

## Phase Overview

**Goal**: Build the foundational infrastructure that all templates will depend on.

**Duration**: 5-7 days

**Why This Phase Matters**: Everything in Phases 2-5 depends on this foundation. If this phase is done correctly, the remaining phases will be straightforward. If shortcuts are taken here, you'll face constant issues later.

**Deliverables**:
1. Extended ResumeJson schema with 3D layout array
2. Store adapter layer (makes our data compatible with source templates)
3. Shared components (Section, Rating, Link, etc.)
4. Tailwind CSS integration
5. Phosphor Icons integration
6. Page component for A4/Letter sizing

---

## Prerequisites

Before starting:
- [ ] Read `00_OVERVIEW.md` completely
- [ ] Study source templates for 2-4 hours: `agents/repos/Reactive-Resume/apps/artboard/src/templates/`
- [ ] Understand current system: Read `/Users/varunprasad/code/prjs/resumepair/agents/workspace/templates/CURRENT_TEMPLATE_SYSTEM.md`
- [ ] Development environment running (app + preview working)

---

## Step 1: Extend Schema with 3D Layout Array

**Duration**: 1-2 hours

### 1.1 Understand the Layout Structure

**Source Reference**: `agents/repos/Reactive-Resume/libs/schema/src/metadata/index.ts:11-43`

The layout is a **3D array**: `layout[pageIndex][columnIndex][sectionId]`

```typescript
// Example:
const layout = [
  [  // Page 1
    ["summary", "experience", "education"],  // Column 1 (Main)
    ["skills", "certifications", "languages"]  // Column 2 (Sidebar)
  ],
  [  // Page 2
    ["projects", "awards"],  // Column 1
    ["references", "interests"]  // Column 2
  ]
]
```

### 1.2 Modify ResumeAppearance Interface

**File**: `types/resume.ts`

**Find** the `ResumeAppearance` interface (around line 139-157)

**Add** the layout field:

```typescript
export interface ResumeAppearance {
  template: ResumeTemplateId
  layout: string[][][]  // NEW: 3D array [page][column][section]
  theme: {
    background: string
    text: string
    primary: string
  }
  typography: {
    fontFamily: string
    fontSize: number
    lineHeight: number
  }
  layout_settings: {  // RENAME from 'layout' to 'layout_settings'
    pageFormat: 'A4' | 'Letter'
    margin: number
    showPageNumbers: boolean
  }
  customCss?: string
}
```

**Important**: Rename existing `layout` field to `layout_settings` to avoid conflict.

### 1.3 Update ResumeTemplateId Type

**File**: `types/resume.ts`

**Find**: `export type ResumeTemplateId = 'onyx' | 'modern' | ...`

**Replace with**:

```typescript
export type ResumeTemplateId =
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
```

### 1.4 Update Default Appearance Function

**File**: `types/resume.ts`

**Find**: `createDefaultAppearance()` function (around line 219-244)

**Update** to include default layout:

```typescript
export function createDefaultAppearance(pageSize: 'A4' | 'Letter'): ResumeAppearance {
  return {
    template: 'onyx',  // Default template
    layout: [  // NEW: Default layout
      [
        ['summary', 'experience', 'education', 'projects'],  // Main column
        ['skills', 'certifications', 'languages', 'awards']  // Sidebar column
      ]
    ],
    theme: {
      background: '#ffffff',
      text: '#111827',
      primary: '#2563eb',
    },
    typography: {
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      fontSize: 16,
      lineHeight: 1.4,
    },
    layout_settings: {  // RENAMED from 'layout'
      pageFormat: pageSize,
      margin: 48,
      showPageNumbers: false,
    },
  }
}
```

### Validation:
```bash
npm run type-check
# Should compile without errors
```

---

## Step 2: Install Required Dependencies

**Duration**: 30 minutes

### 2.1 Install Tailwind CSS

```bash
npm install -D tailwindcss@latest postcss@latest autoprefixer@latest
npx tailwindcss init -p
```

**File**: `tailwind.config.js`

**Update** content paths:

```javascript
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './libs/reactive-artboard/**/*.{js,ts,jsx,tsx}',  // NEW: Include artboard
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

### 2.2 Install Phosphor Icons

```bash
npm install @phosphor-icons/react
```

### 2.3 Install Other Required Libraries

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
npm install react-zoom-pan-pinch
npm install sanitize-html
npm install @types/sanitize-html -D
```

### Validation:
```bash
npm run build
# Should build without errors
```

---

## Step 3: Create Store Adapter Layer

**Duration**: 2-3 hours

### 3.1 Understand the Source Store Structure

**Source Reference**: `agents/repos/Reactive-Resume/apps/artboard/src/store/artboard.ts`

Their templates expect:
```typescript
const section = useArtboardStore((state) => state.resume.sections.experience)
const basics = useArtboardStore((state) => state.resume.basics)
```

### 3.2 Create Adapter Store

**Create File**: `libs/reactive-artboard/store/artboard.ts`

```typescript
import { create } from 'zustand'
import type { ResumeJson } from '@/types/resume'

// Adapter interface that matches source expectations
export interface ArtboardResumeData {
  basics: {
    name: string
    headline: string
    email: string
    phone: string
    location: string
    url: { label: string; href: string }
    picture: {
      url: string
      size: number
      aspectRatio: number
      borderRadius: number
      effects: {
        hidden: boolean
        border: boolean
        grayscale: boolean
      }
    }
  }
  sections: {
    summary: {
      id: string
      name: string
      columns: number
      visible: boolean
      items: Array<{ id: string; visible: boolean; content: string }>
    }
    experience: {
      id: string
      name: string
      columns: number
      separateLinks: boolean
      visible: boolean
      items: Array<{
        id: string
        visible: boolean
        company: string
        position: string
        location: string
        date: string
        summary: string
        url: { label: string; href: string }
      }>
    }
    education: {
      id: string
      name: string
      columns: number
      separateLinks: boolean
      visible: boolean
      items: Array<{
        id: string
        visible: boolean
        institution: string
        studyType: string
        area: string
        score: string
        date: string
        summary: string
        url: { label: string; href: string }
      }>
    }
    skills: {
      id: string
      name: string
      columns: number
      visible: boolean
      items: Array<{
        id: string
        visible: boolean
        name: string
        description: string
        level: number  // 0-5
        keywords: string[]
      }>
    }
    // Add other sections as needed...
  }
  metadata: {
    template: string
    layout: string[][][]
    page: {
      format: 'a4' | 'letter'
      margin: number
      options: {
        breakLine: boolean
        pageNumbers: boolean
      }
    }
    theme: {
      background: string
      text: string
      primary: string
    }
    typography: {
      font: {
        family: string
        size: number
      }
      lineHeight: number
      hideIcons: boolean
      underlineLinks: boolean
    }
    css: {
      value: string
      visible: boolean
    }
  }
}

interface ArtboardStore {
  resume: ArtboardResumeData
  setResume: (data: ArtboardResumeData) => void
}

export const useArtboardStore = create<ArtboardStore>()((set) => ({
  resume: null as unknown as ArtboardResumeData,
  setResume: (resume) => {
    set({ resume })
  },
}))
```

### 3.3 Create Mapper Function

**Create File**: `libs/reactive-artboard/adapters/resumeToArtboard.ts`

```typescript
import type { ResumeJson } from '@/types/resume'
import type { ArtboardResumeData } from '../store/artboard'

export function mapResumeJsonToArtboardData(resume: ResumeJson): ArtboardResumeData {
  return {
    basics: {
      name: resume.profile.fullName,
      headline: resume.profile.headline || '',
      email: resume.profile.email || '',
      phone: resume.profile.phone || '',
      location: resume.profile.location || '',
      url: {
        label: resume.profile.website?.label || '',
        href: resume.profile.website?.url || '',
      },
      picture: {
        url: '',  // TODO: Implement image handling in later phase
        size: 64,
        aspectRatio: 1,
        borderRadius: 0,
        effects: {
          hidden: true,  // Hide images for now
          border: false,
          grayscale: false,
        },
      },
    },
    sections: {
      summary: {
        id: 'summary',
        name: 'Summary',
        columns: 1,
        visible: !!resume.summary,
        items: resume.summary ? [{
          id: 'summary-1',
          visible: true,
          content: resume.summary,  // HTML content
        }] : [],
      },
      experience: {
        id: 'experience',
        name: 'Experience',
        columns: 1,
        separateLinks: true,
        visible: (resume.work?.length ?? 0) > 0,
        items: (resume.work || []).map((exp, idx) => ({
          id: `exp-${idx}`,
          visible: true,
          company: exp.company || '',
          position: exp.position || '',
          location: exp.location || '',
          date: formatDateRange(exp.startDate, exp.endDate),
          summary: exp.summary || '',
          url: {
            label: exp.website?.label || '',
            href: exp.website?.url || '',
          },
        })),
      },
      education: {
        id: 'education',
        name: 'Education',
        columns: 1,
        separateLinks: true,
        visible: (resume.education?.length ?? 0) > 0,
        items: (resume.education || []).map((edu, idx) => ({
          id: `edu-${idx}`,
          visible: true,
          institution: edu.school || '',
          studyType: edu.degree || '',
          area: edu.field || '',
          score: '',
          date: formatDateRange(edu.startDate, edu.endDate),
          summary: edu.description || '',
          url: {
            label: '',
            href: '',
          },
        })),
      },
      skills: {
        id: 'skills',
        name: 'Skills',
        columns: 2,
        visible: (resume.skills?.length ?? 0) > 0,
        items: flattenSkills(resume.skills || []),
      },
      // TODO: Add other sections (projects, certifications, etc.)
    },
    metadata: {
      template: resume.appearance?.template || 'onyx',
      layout: resume.appearance?.layout || [
        [
          ['summary', 'experience', 'education'],
          ['skills'],
        ],
      ],
      page: {
        format: resume.appearance?.layout_settings?.pageFormat === 'A4' ? 'a4' : 'letter',
        margin: resume.appearance?.layout_settings?.margin || 18,
        options: {
          breakLine: true,
          pageNumbers: resume.appearance?.layout_settings?.showPageNumbers || false,
        },
      },
      theme: {
        background: resume.appearance?.theme?.background || '#ffffff',
        text: resume.appearance?.theme?.text || '#000000',
        primary: resume.appearance?.theme?.primary || '#dc2626',
      },
      typography: {
        font: {
          family: resume.appearance?.typography?.fontFamily || 'Inter',
          size: resume.appearance?.typography?.fontSize || 14,
        },
        lineHeight: resume.appearance?.typography?.lineHeight || 1.5,
        hideIcons: false,
        underlineLinks: true,
      },
      css: {
        value: resume.appearance?.customCss || '',
        visible: !!resume.appearance?.customCss,
      },
    },
  }
}

function formatDateRange(start?: string, end?: string): string {
  if (!start && !end) return ''
  if (!end) return `${start} - Present`
  return `${start} - ${end}`
}

function flattenSkills(skills: any[]): any[] {
  // Flatten nested skill groups into flat array
  const flattened: any[] = []
  skills.forEach((skillGroup, groupIdx) => {
    skillGroup.items?.forEach((skill: any, skillIdx: number) => {
      flattened.push({
        id: `skill-${groupIdx}-${skillIdx}`,
        visible: true,
        name: skill.name || '',
        description: skillGroup.label || '',
        level: skill.level || 0,
        keywords: [],
      })
    })
  })
  return flattened
}
```

### Validation:
- [ ] TypeScript compiles without errors
- [ ] Adapter creates correct structure
- [ ] Store can be imported and used

---

## Step 4: Create Shared Components

**Duration**: 4-6 hours

### 4.1 Create Page Component

**Source Reference**: `agents/repos/Reactive-Resume/apps/artboard/src/components/page.tsx`

**Create File**: `libs/reactive-artboard/components/Page.tsx`

```typescript
import React from 'react'
import { cn } from '@/libs/utils'

export const MM_TO_PX = 3.78

export const pageSizeMap = {
  a4: { width: 210, height: 297 },
  letter: { width: 216, height: 279 },
} as const

interface PageProps {
  mode?: 'preview' | 'builder'
  pageNumber: number
  children: React.ReactNode
}

export const Page = ({ mode = 'preview', pageNumber, children }: PageProps) => {
  const [pageFormat, setPageFormat] = React.useState<'a4' | 'letter'>('a4')
  const [showPageNumbers, setShowPageNumbers] = React.useState(false)
  const [showBreakLine, setShowBreakLine] = React.useState(true)

  // TODO: Get from store in actual implementation
  // const pageFormat = useArtboardStore((state) => state.resume.metadata.page.format)
  // const showPageNumbers = useArtboardStore((state) => state.resume.metadata.page.options.pageNumbers)
  // const showBreakLine = useArtboardStore((state) => state.resume.metadata.page.options.breakLine)

  return (
    <div
      data-page={pageNumber}
      className={cn(
        'relative bg-background text-foreground',
        mode === 'builder' && 'shadow-2xl'
      )}
      style={{
        width: `${pageSizeMap[pageFormat].width * MM_TO_PX}px`,
        minHeight: `${pageSizeMap[pageFormat].height * MM_TO_PX}px`,
      }}
    >
      {mode === 'builder' && showPageNumbers && (
        <div className="absolute -top-7 left-0 font-bold">
          Page {pageNumber}
        </div>
      )}

      {children}

      {mode === 'builder' && showBreakLine && (
        <div
          className="absolute inset-x-0 border-b border-dashed border-gray-400"
          style={{ top: `${pageSizeMap[pageFormat].height * MM_TO_PX}px` }}
        />
      )}
    </div>
  )
}
```

### 4.2 Create Generic Section Component

**Source Reference**: `agents/repos/Reactive-Resume/apps/artboard/src/templates/azurill.tsx:180-248`

**Create File**: `libs/reactive-artboard/components/Section.tsx`

```typescript
import React from 'react'
import { cn } from '@/libs/utils'
import sanitizeHtml from 'sanitize-html'
import { get } from 'lodash'

interface URL {
  label: string
  href: string
}

interface SectionProps<T> {
  section: {
    id: string
    name: string
    columns: number
    visible: boolean
    separateLinks?: boolean
    items: Array<T & { id: string; visible: boolean }>
  }
  children?: (item: T) => React.ReactNode
  className?: string
  urlKey?: string
  levelKey?: string
  summaryKey?: string
  keywordsKey?: string
}

export const Section = <T,>({
  section,
  children,
  className,
  urlKey,
  levelKey,
  summaryKey,
  keywordsKey,
}: SectionProps<T>) => {
  if (!section.visible || section.items.filter((item) => item.visible).length === 0) {
    return null
  }

  return (
    <section id={section.id} className="grid">
      {/* Main column heading */}
      <div className="mb-2 hidden font-bold text-primary group-[.main]:block">
        <h4>{section.name}</h4>
      </div>

      {/* Sidebar column heading */}
      <div className="mx-auto mb-2 hidden items-center gap-x-2 text-center font-bold text-primary group-[.sidebar]:flex">
        <div className="size-1.5 rounded-full border border-primary" />
        <h4>{section.name}</h4>
        <div className="size-1.5 rounded-full border border-primary" />
      </div>

      {/* Items grid */}
      <div
        className="grid gap-x-6 gap-y-3 group-[.sidebar]:mx-auto group-[.sidebar]:text-center"
        style={{ gridTemplateColumns: `repeat(${section.columns}, 1fr)` }}
      >
        {section.items
          .filter((item) => item.visible)
          .map((item) => {
            const url = (urlKey && get(item, urlKey)) as URL | undefined
            const level = (levelKey && get(item, levelKey, 0)) as number | undefined
            const summary = (summaryKey && get(item, summaryKey, '')) as string | undefined
            const keywords = (keywordsKey && get(item, keywordsKey, [])) as string[] | undefined

            return (
              <div
                key={item.id}
                className={cn(
                  'relative space-y-2',
                  'border-primary group-[.main]:border-l group-[.main]:pl-4',
                  className
                )}
              >
                {/* Render custom content */}
                <div>{children?.(item as T)}</div>

                {/* Summary (HTML content) */}
                {summary !== undefined && summary.trim() !== '' && (
                  <div
                    dangerouslySetInnerHTML={{
                      __html: sanitizeHtml(summary, {
                        allowedTags: ['p', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li', 'br'],
                        allowedAttributes: { a: ['href', 'target', 'rel'] },
                      }),
                    }}
                    className="wysiwyg text-sm"
                  />
                )}

                {/* Skill level rating */}
                {level !== undefined && level > 0 && <Rating level={level} />}

                {/* Keywords */}
                {keywords !== undefined && keywords.length > 0 && (
                  <p className="text-sm">{keywords.join(', ')}</p>
                )}

                {/* Separate link */}
                {url !== undefined && section.separateLinks && <Link url={url} />}

                {/* Timeline dot (for main column) */}
                <div className="absolute left-[-4.5px] top-px hidden size-[8px] rounded-full bg-primary group-[.main]:block" />
              </div>
            )
          })}
      </div>
    </section>
  )
}

// Helper components
const Rating = ({ level }: { level: number }) => {
  const percentage = (level / 5) * 100
  return (
    <div className="relative h-1 w-[128px] group-[.sidebar]:mx-auto">
      <div className="absolute inset-0 h-1 w-[128px] rounded bg-primary opacity-25" />
      <div
        className="absolute inset-0 h-1 rounded bg-primary"
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
}

const Link = ({ url }: { url: URL }) => {
  if (!url.href) return null

  return (
    <div className="flex items-center gap-x-1.5">
      <i className="ph ph-bold ph-link text-primary text-sm" />
      <a
        href={url.href}
        target="_blank"
        rel="noreferrer noopener nofollow"
        className="inline-block text-sm"
      >
        {url.label || url.href}
      </a>
    </div>
  )
}
```

### 4.3 Create Link Component

**Create File**: `libs/reactive-artboard/components/Link.tsx`

```typescript
import React from 'react'
import { cn } from '@/libs/utils'

interface LinkProps {
  url: { label: string; href: string }
  icon?: React.ReactNode
  iconOnRight?: boolean
  label?: string
  className?: string
}

export const Link = ({ url, icon, iconOnRight, label, className }: LinkProps) => {
  if (!url.href || url.href.trim() === '') return null

  return (
    <div className="flex items-center gap-x-1.5">
      {!iconOnRight && (icon ?? <i className="ph ph-bold ph-link text-primary" />)}
      <a
        href={url.href}
        target="_blank"
        rel="noreferrer noopener nofollow"
        className={cn('inline-block', className)}
      >
        {label ?? (url.label || url.href)}
      </a>
      {iconOnRight && (icon ?? <i className="ph ph-bold ph-link text-primary" />)}
    </div>
  )
}
```

### 4.4 Create LinkedEntity Component

**Create File**: `libs/reactive-artboard/components/LinkedEntity.tsx`

```typescript
import React from 'react'
import { Link } from './Link'

interface LinkedEntityProps {
  name: string
  url: { label: string; href: string }
  separateLinks: boolean
  className?: string
}

export const LinkedEntity = ({ name, url, separateLinks, className }: LinkedEntityProps) => {
  const hasUrl = url.href && url.href.trim() !== ''

  return !separateLinks && hasUrl ? (
    <Link
      url={url}
      label={name}
      icon={<i className="ph ph-bold ph-globe text-primary" />}
      iconOnRight={true}
      className={className}
    />
  ) : (
    <div className={className}>{name}</div>
  )
}
```

### 4.5 Create Picture Component (Grey Placeholder)

**Create File**: `libs/reactive-artboard/components/Picture.tsx`

```typescript
import React from 'react'
import { cn } from '@/libs/utils'

interface PictureProps {
  className?: string
}

export const Picture = ({ className }: PictureProps) => {
  // TODO: Implement real image loading in later phase
  // For now, return grey placeholder box
  return (
    <div
      className={cn(
        'relative bg-gray-300 flex items-center justify-center text-gray-500',
        className
      )}
      style={{
        width: '64px',
        height: '64px',
        borderRadius: '0px',
      }}
    >
      <i className="ph ph-user text-2xl" />
    </div>
  )
}
```

### 4.6 Create BrandIcon Component

**Source Reference**: `agents/repos/Reactive-Resume/apps/artboard/src/components/brand-icon.tsx`

**Create File**: `libs/reactive-artboard/components/BrandIcon.tsx`

```typescript
import React from 'react'

interface BrandIconProps {
  slug: string
}

export const BrandIcon = React.forwardRef<HTMLImageElement, BrandIconProps>(
  ({ slug }, ref) => {
    // LinkedIn gets special treatment (self-hosted)
    if (slug.toLowerCase() === 'linkedin') {
      return (
        <img
          ref={ref}
          alt="LinkedIn"
          className="size-4"
          src="/support-logos/linkedin.svg"
        />
      )
    }

    // Others use Simple Icons CDN
    return (
      <img
        ref={ref}
        alt={slug}
        className="size-4"
        src={`https://cdn.simpleicons.org/${slug}`}
      />
    )
  }
)

BrandIcon.displayName = 'BrandIcon'
```

### Validation:
- [ ] All components compile without TypeScript errors
- [ ] Components can be imported
- [ ] Tailwind classes work
- [ ] Phosphor icons render

---

## Step 5: Update Exports and Index Files

**Duration**: 30 minutes

### 5.1 Create Adapter Index

**Create File**: `libs/reactive-artboard/adapters/index.ts`

```typescript
export { mapResumeJsonToArtboardData } from './resumeToArtboard'
```

### 5.2 Create Components Index

**Create File**: `libs/reactive-artboard/components/index.ts`

```typescript
export { Page, MM_TO_PX, pageSizeMap } from './Page'
export { Section } from './Section'
export { Link } from './Link'
export { LinkedEntity } from './LinkedEntity'
export { Picture } from './Picture'
export { BrandIcon } from './BrandIcon'
```

### 5.3 Update Main Index

**File**: `libs/reactive-artboard/index.ts`

**Update** to export new modules:

```typescript
// Existing exports
export { ArtboardRenderer } from './renderer/ArtboardRenderer'
export { renderArtboardToHtml } from './server/renderToHtml'
export * from './mappers'
export * from './types'
export * from './catalog'

// NEW exports
export * from './store/artboard'
export * from './adapters'
export * from './components'
```

---

## Step 6: Add Tailwind Styles to App

**Duration**: 1 hour

### 6.1 Create Tailwind Entry Point

**Create File**: `libs/reactive-artboard/styles/tailwind.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Wysiwyg prose styles for rich text content */
.wysiwyg {
  @apply text-sm;
}

.wysiwyg p {
  @apply mb-2;
}

.wysiwyg ul,
.wysiwyg ol {
  @apply ml-4 mb-2;
}

.wysiwyg ul {
  @apply list-disc;
}

.wysiwyg ol {
  @apply list-decimal;
}

.wysiwyg li {
  @apply mb-1;
}

.wysiwyg strong {
  @apply font-bold;
}

.wysiwyg em {
  @apply italic;
}

.wysiwyg a {
  @apply text-primary underline;
}

/* Custom utility for page margin */
.p-custom {
  padding: calc(var(--page-margin, 18) * 1px);
}

/* CSS Variables for theming */
:root {
  --color-background: 255 255 255;
  --color-foreground: 0 0 0;
  --color-primary: 220 38 38;
}

.bg-background {
  background-color: rgb(var(--color-background));
}

.text-foreground {
  color: rgb(var(--color-foreground));
}

.text-primary {
  color: rgb(var(--color-primary));
}

.border-primary {
  border-color: rgb(var(--color-primary));
}

.bg-primary {
  background-color: rgb(var(--color-primary));
}
```

### 6.2 Import Tailwind in Preview

**File**: `components/preview/LivePreview.tsx`

**Add** at the top:

```typescript
import '@/libs/reactive-artboard/styles/tailwind.css'
```

---

## Step 7: Add Phosphor Icons CSS

**Duration**: 30 minutes

### 7.1 Install Phosphor Icons Web Font

```bash
npm install @phosphor-icons/web
```

### 7.2 Import in App

**File**: `app/globals.css`

**Add** at the top:

```css
@import '@phosphor-icons/web/regular';
@import '@phosphor-icons/web/bold';
@import '@phosphor-icons/web/fill';
```

### Validation:
- [ ] Icon classes work: `<i className="ph ph-link" />`
- [ ] Bold variant works: `<i className="ph ph-bold ph-link" />`

---

## Phase 1 Validation Checklist

Before moving to Phase 2, validate:

- [ ] **Schema Changes**:
  - [ ] `ResumeAppearance.layout` field exists (3D array)
  - [ ] `ResumeAppearance.layout_settings` renamed from `layout`
  - [ ] `ResumeTemplateId` has all 12 template names
  - [ ] `createDefaultAppearance()` returns valid default layout
  - [ ] TypeScript compiles without errors

- [ ] **Dependencies**:
  - [ ] Tailwind CSS installed and configured
  - [ ] Phosphor Icons installed and working
  - [ ] `@dnd-kit/*` packages installed
  - [ ] `react-zoom-pan-pinch` installed
  - [ ] `sanitize-html` installed

- [ ] **Store Adapter**:
  - [ ] `useArtboardStore` created and can be imported
  - [ ] `mapResumeJsonToArtboardData()` function works
  - [ ] Adapter produces correct data structure
  - [ ] Can access `resume.basics`, `resume.sections`, `resume.metadata`

- [ ] **Shared Components**:
  - [ ] `<Page>` component renders with correct dimensions
  - [ ] `<Section>` component compiles and can be imported
  - [ ] `<Link>` component renders links correctly
  - [ ] `<LinkedEntity>` component works
  - [ ] `<Picture>` shows grey placeholder
  - [ ] `<BrandIcon>` component works

- [ ] **Styling**:
  - [ ] Tailwind classes apply correctly
  - [ ] CSS variables for theming work
  - [ ] Wysiwyg prose styles work
  - [ ] Phosphor icon classes render icons

- [ ] **Build**:
  - [ ] `npm run build` succeeds
  - [ ] `npm run type-check` passes
  - [ ] No console errors in development

---

## Troubleshooting

### Issue: Tailwind classes not applying
**Solution**: Ensure `tailwind.config.js` includes artboard path in `content` array

### Issue: Phosphor icons not showing
**Solution**: Verify `@phosphor-icons/web` CSS is imported in `globals.css`

### Issue: TypeScript errors on store
**Solution**: Check `ArtboardResumeData` interface matches source structure exactly

### Issue: Can't import components
**Solution**: Verify index files export all components

---

## Next Steps

Once Phase 1 validation passes:
1. Commit all changes
2. Create feature branch: `feature/template-migration-phase1`
3. Push to remote
4. **Proceed to Phase 2**: `02_PHASE2_PDF_PROCESSING.md`

---

**Phase 1 Complete** ✓

You've built the foundation. All templates will now use these shared components and patterns.
