# ResumePair × Reactive-Resume: Comprehensive Adoption Plan

**Created**: 2025-10-07
**Purpose**: Systematic adoption of proven patterns from Reactive-Resume to enhance ResumePair's resume editing and templating system

---

## Executive Summary

**Current State**: ResumePair has foundational scaffolding (Zustand, JSONB storage, version control, auto-save) but templates are broken/poorly designed and lack rich text editing capabilities.

**Goal**: Extract and adapt proven patterns from Reactive-Resume (450K+ users) to build a production-ready resume editor with:
- Rich text editing for all resume sections
- 7 high-quality resume templates with same visual designs as RR
- Custom sections support for user flexibility
- Robust data-to-template mapping system
- PDF generation (already using same stack: Puppeteer + Chromium)

**Approach**: Agentic engineering with parallel workstreams and clear phase boundaries. No time estimates—comprehensive execution is the priority.

---

## Decision Framework & Adoption Rubric

### When to Adopt from RR

**✅ ADOPT**: Pattern solves a problem we have, is battle-tested, and integrates with our stack

**🔄 ADAPT**: Pattern needs modification to fit our schema/architecture but core concept is sound

**❌ SKIP**: Pattern is orthogonal to our goals, incompatible with our stack, or we have better alternative

### Evaluation Criteria

1. **Functional Fit**: Does it solve our specific problem?
2. **Stack Compatibility**: Does it work with Next.js, React, Zustand, Supabase?
3. **Schema Alignment**: Can we adapt it to our ResumeJson schema without breaking changes?
4. **Maintenance Burden**: Is it worth maintaining or too complex?
5. **Differentiation**: Does adopting it prevent us from differentiating later?

### Applied to Key Components

| Component | Decision | Rationale |
|-----------|----------|-----------|
| TipTap Editor | ✅ ADOPT | Solves rich text need, React-compatible, proven at scale |
| HTML Storage | ✅ ADOPT | Pragmatic for rich text, sanitization patterns exist |
| Template Architecture | ✅ ADOPT | Solves broken templates, layout-as-data is brilliant |
| 7 Templates | ✅ EXTRACT | Direct extraction with same designs, rebrand names |
| Custom Sections | 🔄 ADAPT | Add to our schema as Record<string, CustomSection> |
| CSS Variable Theming | ✅ ADOPT | Runtime themes without re-renders, Tailwind-compatible |
| Layout-as-Data | ✅ ADOPT | Core innovation, enables flexible multi-column layouts |
| Generic Section Component | ✅ ADOPT | DRY principle, property-key extraction pattern |
| Two Section Patterns | ✅ ADOPT | Summary (inline) vs Item-based (dialog) patterns |
| Drag-Drop Reordering | ✅ ADOPT | @dnd-kit library, accessibility built-in |
| Prisma/Database | ❌ SKIP | We use Supabase, no benefit to switching |
| Monorepo Structure | ❌ SKIP | Our Next.js structure works fine |
| Auth System | ❌ SKIP | Orthogonal to this work |

---

## Phase 0: Exploration & Validation (COMPLETED)

**Status**: ✅ Complete

**Deliverables Created**:
- 18 comprehensive exploration documents in `/agents/workspace/`
- RR architecture, schemas, templates, editor patterns fully documented
- Current ResumePair state analyzed
- PDF generation confirmed (same stack: puppeteer-core + @sparticuz/chromium)

**Key Findings**:
1. ResumePair already uses Puppeteer + Chromium (no PDF migration needed)
2. ResumePair has 6 templates but they're broken/buggy
3. RR has 12 templates, we'll extract 7 best ones
4. RR uses TipTap v2.26.2 for rich text (add to ResumePair)
5. Custom sections use Record<string, CustomSection> pattern
6. Layout-as-data: `pages → columns → sections` (3-level array)

---

## Phase 1: Schema Evolution & Data Foundation

**Goal**: Extend ResumePair schema to support rich text, custom sections, and layout metadata without breaking existing data

### 1.1 Rich Text Schema Support

**Files to Modify**:
- `/types/resume.ts` - Add HTML string support
- `/libs/validation/resume.ts` - Update Zod schemas

**Changes**:
```typescript
// Before
interface ResumeJson {
  summary?: string;  // Plain text
  work?: Array<{
    descriptionBullets: string[];  // Plain text
  }>;
}

// After
interface ResumeJson {
  summary?: string;  // HTML string (rich text)
  work?: Array<{
    descriptionBullets: string[];  // HTML strings (rich text)
  }>;
}
```

**Validation**:
- Update Zod schemas to accept HTML strings
- Add HTML sanitization function (extract from RR)
- Whitelist 60+ safe tags (p, ul, li, strong, em, a, etc.)

**Migration Strategy**:
- Existing plain text renders as `<p>{text}</p>` automatically
- No data migration needed (backward compatible)

### 1.2 Custom Sections Support

**Files to Create/Modify**:
- `/types/resume.ts` - Add `custom` field
- `/libs/validation/resume.ts` - Add `customSectionSchema`
- `/types/database.ts` - Update Resume type

**Schema Addition**:
```typescript
interface CustomSection {
  id: string;           // CUID2
  visible: boolean;
  name: string;         // Section title
  description: string;
  date: string;
  location: string;
  summary: string;      // HTML rich text
  keywords: string[];
  url: { label: string; href: string };
}

interface CustomSectionGroup {
  id: string;           // CUID2
  name: string;         // Group name (user-editable)
  columns: number;      // 1-5
  separateLinks: boolean;
  visible: boolean;
  items: CustomSection[];
}

interface ResumeJson {
  // ... existing fields
  custom?: Record<string, CustomSectionGroup>;  // Key: section ID
}
```

**Implementation Notes**:
- Custom sections stored as Record (object/map)
- Each section has unique CUID2 key
- Layout references as `"custom.{id}"`
- Supports unlimited custom sections

### 1.3 Layout-as-Data Metadata

**Files to Modify**:
- `/types/resume.ts` - Extend `ResumeSettings`
- `/types/template.ts` - Add layout types

**Schema Addition**:
```typescript
interface LayoutMetadata {
  template: string;                    // Template slug
  layout: string[][][];                // pages → columns → sections
  theme: {
    background: string;                // hex color
    text: string;
    primary: string;
  };
  typography: {
    fontFamily: string;
    fontSize: number;                  // base size in px
    lineHeight: number;                // multiplier
  };
  page: {
    format: 'a4' | 'letter';
    margin: number;                    // in mm
  };
}

interface ResumeSettings {
  // ... existing fields (locale, dateFormat, etc.)
  templateMetadata?: LayoutMetadata;   // Optional for backward compat
}
```

**Default Layout**:
```typescript
const defaultLayout = [
  [  // Page 1
    ['profile', 'summary', 'work', 'education', 'projects'],  // Main column
    ['skills', 'certifications', 'awards', 'languages']       // Sidebar
  ]
];
```

**Agent Tasks**:
1. Create migration helper to generate default layout for existing resumes
2. Add Zod validation for layout structure
3. Update `createDefaultSettings()` to include layout metadata
4. Test with existing resume data (ensure no breaks)

---

## Phase 2: Rich Text Editor Implementation

**Goal**: Add TipTap editor with toolbar, form integration, and HTML sanitization

### 2.1 Dependencies & Setup

**Install**:
```bash
pnpm add @tiptap/core@2.26.2 \
         @tiptap/react@2.26.2 \
         @tiptap/starter-kit@2.26.1 \
         @tiptap/extension-underline@2.26.2 \
         @tiptap/extension-link@2.26.2 \
         @tiptap/extension-text-align@2.26.2 \
         sanitize-html@2.17.0
```

**Why These Versions**: Match RR's proven configuration

### 2.2 RichInput Component

**File to Create**: `/components/editor/RichInput.tsx`

**Extract from RR**:
- **Source**: `/libs/ui/src/components/rich-input.tsx` (517 lines)
- **Extract**:
  - TipTap editor configuration
  - Extension setup (StarterKit + Underline + Link + TextAlign)
  - Toolbar implementation (Bold, Italic, Underline, Lists, Alignment)
  - onChange handler integration
  - Error boundary

**Customizations**:
- Remove AI actions footer (we'll build our own later)
- Simplify toolbar to 10 core features initially:
  - **Formatting**: Bold, Italic, Underline
  - **Structure**: Bullet list, Numbered list
  - **Alignment**: Left, Center, Right
  - **Actions**: Undo, Redo
  - **Links**: Add/remove hyperlink
- Use Lucide icons (our existing icon library)
- Match our design system (Tailwind classes)

**Toolbar Order** (left to right):
```
[B] [I] [U] | [• List] [1. List] | [Left] [Center] [Right] | [Link] | [Undo] [Redo]
```

**Props Interface**:
```typescript
interface RichInputProps {
  content: string;              // HTML string
  onChange: (html: string) => void;
  placeholder?: string;
  editable?: boolean;
  className?: string;
}
```

### 2.3 HTML Sanitization

**File to Create**: `/libs/rich-text/sanitizeHtml.ts`

**Extract from RR**:
- **Source**: `/libs/utils/src/namespaces/string.ts` lines 60-150
- **Extract**:
  - Allowed tags whitelist (60+ tags)
  - Allowed attributes per tag
  - URL protocol validation (http, https, mailto only)
  - Strip dangerous attributes (onclick, onerror, etc.)

**Usage**:
```typescript
import { sanitizeHtml } from '@/libs/rich-text/sanitizeHtml';

// On render (display)
<div dangerouslySetInnerHTML={{ __html: sanitizeHtml(summary) }} />
```

### 2.4 Form Integration

**Update Components**:
- All section components (WorkSection, EducationSection, etc.)

**Pattern**:
```typescript
// Before
<TextAreaField name="work.0.descriptionBullets.0" />

// After
<RichInput
  content={field.value}
  onChange={(html) => field.onChange(html)}
/>
```

**Integration with React Hook Form**:
```typescript
<Controller
  name="work.0.descriptionBullets.0"
  control={form.control}
  render={({ field }) => (
    <RichInput
      content={field.value}
      onChange={field.onChange}
    />
  )}
/>
```

**Agent Tasks**:
1. Create RichInput component with toolbar
2. Create sanitizeHtml utility with RR's whitelist
3. Update ProfileSection to use RichInput for summary
4. Update WorkSection for description bullets
5. Update EducationSection for details
6. Update ProjectsSection for descriptions
7. Update all other sections with rich text fields
8. Test form submission and validation
9. Test HTML sanitization (try injecting `<script>` tags)
10. Test undo/redo functionality

---

## Phase 3: Custom Sections UI Implementation

**Goal**: Enable users to create, edit, and delete custom resume sections

### 3.1 Custom Section Management UI

**Files to Create**:
- `/components/editor/sections/CustomSectionsManager.tsx`
- `/components/editor/sections/CustomSectionDialog.tsx`
- `/components/editor/sections/CustomSectionList.tsx`

**Extract from RR**:
- Custom section UI patterns from `/apps/client/src/pages/builder/sidebars/left/dialogs/custom-section.tsx`
- Section management logic

**UI Components**:

**1. CustomSectionsManager** (Parent Component)
- Lists all custom sections
- "Add Custom Section" button
- Edit/Delete actions per section

**2. CustomSectionDialog** (Modal Form)
- Section name input
- Item fields:
  - Name (text)
  - Description (text)
  - Date (text, free format)
  - Location (text)
  - Summary (RichInput)
  - Keywords (tag input)
  - URL (label + href)
- Visibility toggle
- Create/Update/Delete modes

**3. CustomSectionList** (Reordering)
- Drag-drop to reorder custom sections
- Use @dnd-kit library (same as RR)

### 3.2 Section Operations

**Store Methods to Add**:
```typescript
// In documentStore or new customSectionsStore

// Create custom section group
createCustomSection(name: string): void {
  const id = generateCUID2();
  const sectionGroup: CustomSectionGroup = {
    id,
    name,
    columns: 1,
    separateLinks: true,
    visible: true,
    items: []
  };

  const custom = document.custom || {};
  custom[id] = sectionGroup;

  updateDocument({ custom });
}

// Add item to custom section
addCustomItem(sectionId: string, item: CustomSection): void {
  const section = document.custom?.[sectionId];
  if (!section) return;

  section.items.push({ ...item, id: generateCUID2(), visible: true });
  updateDocument({ custom: { ...document.custom } });
}

// Delete custom section
deleteCustomSection(sectionId: string): void {
  const custom = { ...document.custom };
  delete custom[sectionId];
  updateDocument({ custom });
}
```

### 3.3 Layout Integration

**Update Layout Editor**:
- Add custom sections to available sections list
- Show as `"custom.{id}"` in layout array
- Allow dragging custom sections into columns
- Display custom section name in layout editor

**Agent Tasks**:
1. Create CustomSectionsManager component
2. Create CustomSectionDialog with form
3. Add CRUD operations to store
4. Wire up custom sections to layout system
5. Add custom section rendering in templates (generic)
6. Test creating, editing, deleting custom sections
7. Test drag-drop reordering
8. Test custom sections in PDF export

---

## Phase 4: Template Architecture Overhaul

**Goal**: Replace broken templates with RR's proven architecture and layout-as-data system

### 4.1 Template Foundation

**Files to Create**:
- `/libs/templates/shared/TemplatePage.tsx` - Page wrapper with sizing
- `/libs/templates/shared/GenericSection.tsx` - Universal section component
- `/libs/templates/shared/HelperComponents.tsx` - Link, Rating, Picture helpers
- `/libs/templates/templateRegistry.ts` - Template registration system

**Extract from RR**:
- **Page Component**: `/apps/artboard/src/components/page.tsx`
  - Page size calculation (A4: 210mm × 297mm, Letter: 8.5" × 11")
  - Margin handling
  - Print mode vs preview mode
  - Page break handling

- **Generic Section Pattern**: Extract from any RR template
  - Property-key based data extraction using lodash.get
  - Dynamic component mapping: `section key → component`
  - Visibility handling at section level
  - Multi-column support

**GenericSection Component** (Critical Innovation):
```typescript
interface GenericSectionProps {
  sectionKey: string;        // e.g., "work", "education", "custom.abc123"
  data: ResumeJson;
  Component: React.ComponentType<any>;  // Section-specific component
}

const GenericSection: React.FC<GenericSectionProps> = ({ sectionKey, data, Component }) => {
  // Extract section data using property key
  const sectionData = get(data, sectionKey);

  if (!sectionData || !sectionData.visible) return null;

  return (
    <section className="template-section">
      {/* Render section-specific component */}
      <Component data={sectionData} />
    </section>
  );
};
```

**Why This Pattern is Brilliant**:
- Templates don't need to know data structure
- Custom sections work automatically
- Layout changes don't require template updates
- DRY: One section renderer for all templates

### 4.2 Section-to-Component Mapping

**File to Create**: `/libs/templates/shared/sectionMapper.tsx`

**Extract from RR**: Pattern from any template's `mapSectionToComponent()` function

```typescript
import { WorkSection } from './sections/WorkSection';
import { EducationSection } from './sections/EducationSection';
import { SkillsSection } from './sections/SkillsSection';
// ... import all section components

export type SectionKey =
  | 'profile' | 'summary' | 'work' | 'education'
  | 'projects' | 'skills' | 'certifications'
  | 'awards' | 'languages'
  | `custom.${string}`;  // Template literal for custom sections

export const mapSectionToComponent = (sectionKey: SectionKey) => {
  // Handle custom sections dynamically
  if (sectionKey.startsWith('custom.')) {
    const customId = sectionKey.split('.')[1];
    return <CustomSection id={customId} />;
  }

  // Built-in sections
  switch (sectionKey) {
    case 'profile': return <ProfileSection />;
    case 'summary': return <SummarySection />;
    case 'work': return <WorkSection />;
    case 'education': return <EducationSection />;
    case 'projects': return <ProjectsSection />;
    case 'skills': return <SkillsSection />;
    case 'certifications': return <CertificationsSection />;
    case 'awards': return <AwardsSection />;
    case 'languages': return <LanguagesSection />;
    default: return null;
  }
};
```

### 4.3 Template Base Structure

**Pattern for All Templates**:
```typescript
interface TemplateProps {
  data: ResumeJson;
  customizations?: LayoutMetadata;
  mode?: 'preview' | 'print';
}

const TemplateComponent: React.FC<TemplateProps> = ({ data, customizations, mode }) => {
  // Extract layout from metadata or use default
  const layout = customizations?.layout || defaultLayout;

  // Render pages → columns → sections
  return (
    <>
      {layout.map((columnsInPage, pageIndex) => (
        <TemplatePage
          key={pageIndex}
          pageNumber={pageIndex + 1}
          format={customizations?.page.format || 'letter'}
          margin={customizations?.page.margin || 18}
        >
          {/* Render columns */}
          <div className={getColumnGridClass(columnsInPage.length)}>
            {columnsInPage.map((sectionsInColumn, colIndex) => (
              <div key={colIndex} className="template-column">
                {sectionsInColumn.map((sectionKey) => (
                  <Fragment key={sectionKey}>
                    {mapSectionToComponent(sectionKey)}
                  </Fragment>
                ))}
              </div>
            ))}
          </div>
        </TemplatePage>
      ))}
    </>
  );
};
```

**Agent Tasks**:
1. Create TemplatePage component with A4/Letter sizing
2. Create GenericSection wrapper component
3. Create section-to-component mapper
4. Create individual section components (WorkSection, EducationSection, etc.)
5. Implement helper components (Link, Rating, Picture)
6. Test layout-as-data rendering with different configurations
7. Test custom section rendering via property keys
8. Verify page breaks and multi-page layouts

---

## Phase 5: Template Extraction (7 Templates)

**Goal**: Extract 7 high-quality templates from RR with identical visual designs, then rebrand

### 5.1 Template Selection

**Templates to Extract** (from 12 available in RR):

| # | RR Name | Our Name | Layout Type | Visual Style | File Source |
|---|---------|----------|-------------|--------------|-------------|
| 1 | **Rhyhorn** | **Professional** | Single column | Clean, minimal, borders | `/apps/artboard/src/templates/rhyhorn.tsx` |
| 2 | **Azurill** | **Timeline** | Sidebar (1/3, 2/3) | Timeline dots, centered header | `/apps/artboard/src/templates/azurill.tsx` |
| 3 | **Pikachu** | **Modern** | Sidebar (1/3, 2/3) | Colored header band | `/apps/artboard/src/templates/pikachu.tsx` |
| 4 | **Onyx** | **Executive** | Single column | Horizontal header, profiles visible | `/apps/artboard/src/templates/onyx.tsx` |
| 5 | **Bronzor** | **Academic** | Single column | Two-column content (label + content) | `/apps/artboard/src/templates/bronzor.tsx` |
| 6 | **Ditto** | **Creative** | Sidebar (1/3, 2/3) | Layered header with colored strip | `/apps/artboard/src/templates/ditto.tsx` |
| 7 | **Gengar** | **Bold** | Sidebar (1/3, 2/3) | Colored sidebar background | `/apps/artboard/src/templates/gengar.tsx` |

**Why These 7**:
- Cover all layout patterns (single column, sidebar, academic)
- Represent different industries (corporate, creative, academic)
- Visual diversity (clean, bold, colorful, minimal)
- All proven at scale with 450K+ RR users

### 5.2 Extraction Process (Per Template)

**For Each Template**:

**Step 1: Direct File Copy**
- Copy RR template file to `/libs/templates/{our-name}/`
- Copy as-is initially (don't modify yet)

**Step 2: Component Analysis**
- Read template completely (450+ lines each)
- Document:
  - Header layout and styling
  - Grid structure (columns, gaps)
  - Section rendering patterns
  - Rating system used (circles, bars, diamonds, boxes, progress bars)
  - Color usage (where primary color applied)
  - Spacing patterns (gaps, padding)
  - Border usage
  - Typography hierarchy

**Step 3: Dependency Extraction**
- Identify RR-specific imports:
  - `useArtboardStore` → Replace with `useDocumentStore`
  - RR utility functions → Extract to our utils
  - RR components → Extract or recreate
- Extract helper functions:
  - hexToRgb (color with opacity)
  - linearTransform (progress bars)
  - cn (classnames utility - we already have this)

**Step 4: Data Access Adaptation**
```typescript
// RR Pattern
const basics = useArtboardStore((state) => state.resume.basics);
const sections = useArtboardStore((state) => state.resume.sections);

// Our Pattern
const { profile, summary, work, education } = data;  // Props
// OR
const resume = useDocumentStore((state) => state.document);
```

**Step 5: Schema Mapping**
```typescript
// Map RR field names to our field names
RR: basics.name          → Our: profile.fullName
RR: basics.email         → Our: profile.email
RR: basics.headline      → Our: profile.headline
RR: sections.experience  → Our: work
RR: sections.education   → Our: education
RR: sections.skills      → Our: skills
```

**Step 6: Styling Extraction**
- Copy all Tailwind classes as-is
- Extract any custom CSS to template-specific stylesheet
- Note CSS variable usage (`var(--primary)`, `var(--text)`)
- Preserve all spacing, sizing, color application

**Step 7: Testing & Validation**
- Render with sample data
- Compare visually with RR version (screenshot comparison)
- Test all sections (work, education, skills, etc.)
- Test with/without data (empty states)
- Test multi-page layouts
- Test different column configurations

### 5.3 Template-Specific Extraction Details

#### Template 1: Professional (Rhyhorn)
**Key Features to Extract**:
- Horizontal header with picture left, info right
- Inline contact info with pipe separators (`|`)
- Section headers with bottom border (pb-0.5)
- Circular dot rating system (5 filled/unfilled circles)
- Date/location alignment (flex justify-between)

**Critical Code Sections**:
- Lines 27-81: Header layout
- Lines 89-98: Section header with border
- Lines 103-112: Circular rating dots
- Lines 249-269: Work experience flex layout

**Custom CSS**:
```css
.professional-template .rating-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--primary);
}

.professional-template .rating-dot.empty {
  background: transparent;
  border: 1px solid var(--primary);
}
```

#### Template 2: Timeline (Azurill)
**Key Features to Extract**:
- Grid-cols-3 layout (1/3 sidebar, 2/3 main)
- Centered header with picture at top
- Timeline effect: vertical left border with dots on main sections
- Decorative dots beside sidebar section headers
- Progress bar rating with linearTransform utility

**Critical Code Sections**:
- Lines 31-77: Centered header
- Lines 87-106: Dual section header styles (main vs sidebar)
- Lines 112-119: Progress bar rating
- Lines 559-575: Grid layout with col-span

**Helper Functions to Extract**:
```typescript
const linearTransform = (value: number, min: number, max: number) => {
  return ((value - min) / (max - min)) * 100;
};
```

**Custom CSS**:
```css
.timeline-template .timeline-dot {
  position: absolute;
  left: -6px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--primary);
}

.timeline-template .timeline-line {
  border-left: 2px solid var(--primary);
  padding-left: 1rem;
}
```

#### Template 3: Modern (Pikachu)
**Key Features to Extract**:
- Colored header bar spanning full width (bg-primary, text-background)
- Sidebar-first layout with picture at top of sidebar
- Diamond icon rating system (filled/unfilled diamonds)
- Section headers with bottom border (primary color)
- Contact info separated by dots

**Critical Code Sections**:
- Lines 27-101: Colored header with rounded corners
- Lines 124-139: Diamond rating system
- Lines 600-622: Sidebar layout with picture placement

**Custom CSS**:
```css
.modern-template .header-bar {
  background: var(--primary);
  color: var(--background);
  padding: 2rem;
  border-radius: 0.5rem 0.5rem 0 0;
}

.modern-template .rating-diamond {
  width: 0;
  height: 0;
  border: 6px solid transparent;
  border-bottom-color: var(--primary);
  position: relative;
  top: -6px;
}

.modern-template .rating-diamond::after {
  content: '';
  position: absolute;
  left: -6px;
  top: 6px;
  width: 0;
  height: 0;
  border: 6px solid transparent;
  border-top-color: var(--primary);
}
```

#### Template 4: Executive (Onyx)
**Key Features to Extract**:
- Horizontal header with border-b (primary)
- Picture on left, info center, profiles grid on right
- Single column content flow
- Clean, minimal styling
- Circular rating dots (small)

**Critical Code Sections**:
- Lines 27-92: Header with three sections
- Lines 563-579: Single column flow

#### Template 5: Academic (Bronzor)
**Key Features to Extract**:
- Centered header (traditional CV style)
- Grid-cols-5 content structure (unique!)
- Label column (1/5) + content column (4/5)
- Section headers with border-top separator
- Small circular rating dots

**Critical Code Sections**:
- Lines 86-96: Grid-cols-5 structure
- Lines 183-223: Section wrapper with 1:4 column split

**Custom CSS**:
```css
.academic-template .section-wrapper {
  display: grid;
  grid-template-columns: 1fr 4fr;
  gap: 1rem;
}

.academic-template .section-label {
  font-weight: 600;
  color: var(--primary);
}
```

#### Template 6: Creative (Ditto)
**Key Features to Extract**:
- 85px primary-colored band at top
- Picture overlays band (absolute positioning)
- Thick 4px left border on main section items
- Rectangular box rating system
- Two-column sidebar layout

**Critical Code Sections**:
- Lines 594-626: Absolute positioned colored band with header overlay
- Lines 229-245: 4px left border styling
- Lines 124-130: Box-style rating indicators

**Custom CSS**:
```css
.creative-template .colored-band {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 85px;
  background: var(--primary);
  z-index: 0;
}

.creative-template .header-overlay {
  position: relative;
  z-index: 1;
  padding-top: 2rem;
}

.creative-template .item-border {
  border-left: 4px solid var(--primary);
  padding-left: 1rem;
}
```

#### Template 7: Bold (Gengar)
**Key Features to Extract**:
- Colored sidebar background (20% opacity primary)
- Full-colored header in sidebar (bg-primary, text-background)
- Summary section with colored background (20% opacity)
- Horizontal bar rating system
- Min-height grid ensures sidebar extends full height

**Critical Code Sections**:
- Lines 569-605: Min-height grid with colored sidebar
- Lines 31-79: Full-colored sidebar header
- Lines 82-98: Summary with hexToRgb opacity background

**Helper Functions to Extract**:
```typescript
const hexToRgb = (hex: string, alpha?: number): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return hex;

  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);

  return alpha !== undefined
    ? `rgba(${r}, ${g}, ${b}, ${alpha})`
    : `rgb(${r}, ${g}, ${b})`;
};
```

**Custom CSS**:
```css
.bold-template .sidebar-colored {
  background: var(--primary-20);  /* 20% opacity */
  min-height: 100%;
}

.bold-template .sidebar-header {
  background: var(--primary);
  color: var(--background);
  padding: 2rem 1.5rem;
}
```

### 5.4 Rating System Extraction

**5 Different Rating Styles Used Across Templates**:

1. **Circular Dots** (Rhyhorn, Onyx, Bronzor)
   - Filled circles vs empty circles
   - Size: 8-10px diameter
   - Level 3/5: ⚫⚫⚫⚪⚪

2. **Progress Bars** (Azurill, Gengar)
   - Horizontal bars with linearTransform
   - Percentage-based width
   - Level 3/5: ▓▓▓▓▓▓▓▓▓▓░░░░░ (60% filled)

3. **Diamonds** (Pikachu)
   - CSS diamond shapes (rotated squares)
   - Filled vs outlined
   - Level 3/5: ◆◆◆◇◇

4. **Rectangles** (Ditto)
   - Small boxes/rectangles
   - Filled vs empty
   - Level 3/5: ▬▬▬▭▭

5. **Horizontal Bars** (Gengar)
   - Thick horizontal lines
   - Filled with primary color
   - Level 3/5: ▬▬▬(empty)(empty)

**Extraction Strategy**:
- Create `/libs/templates/shared/RatingComponents.tsx`
- Export all 5 rating styles as separate components
- Each template imports its preferred style

### 5.5 Template Registry

**File to Create**: `/libs/templates/templateRegistry.ts`

```typescript
import { Professional } from './professional/ProfessionalTemplate';
import { Timeline } from './timeline/TimelineTemplate';
import { Modern } from './modern/ModernTemplate';
import { Executive } from './executive/ExecutiveTemplate';
import { Academic } from './academic/AcademicTemplate';
import { Creative } from './creative/CreativeTemplate';
import { Bold } from './bold/BoldTemplate';

export interface TemplateMetadata {
  id: string;
  name: string;
  category: 'traditional' | 'modern' | 'creative' | 'academic';
  description: string;
  thumbnail: string;
  layoutType: 'single-column' | 'sidebar';
  features: string[];
  atsScore: number;  // 0-100, how ATS-friendly
}

export interface ResumeTemplate {
  component: React.ComponentType<TemplateProps>;
  metadata: TemplateMetadata;
  defaults: Partial<LayoutMetadata>;
}

export const TEMPLATE_REGISTRY: Record<string, ResumeTemplate> = {
  professional: {
    component: Professional,
    metadata: {
      id: 'professional',
      name: 'Professional',
      category: 'traditional',
      description: 'Clean, minimal design for corporate roles',
      thumbnail: '/templates/professional.png',
      layoutType: 'single-column',
      features: ['ATS-friendly', 'Clean layout', 'Minimal design'],
      atsScore: 95
    },
    defaults: {
      theme: { primary: '#000000', text: '#1a1a1a', background: '#ffffff' },
      typography: { fontFamily: 'Inter', fontSize: 14, lineHeight: 1.5 }
    }
  },

  timeline: {
    component: Timeline,
    metadata: {
      id: 'timeline',
      name: 'Timeline',
      category: 'modern',
      description: 'Timeline-style with visual flow indicators',
      thumbnail: '/templates/timeline.png',
      layoutType: 'sidebar',
      features: ['Timeline dots', 'Two-column', 'Visual hierarchy'],
      atsScore: 85
    },
    defaults: {
      theme: { primary: '#dc2626', text: '#1a1a1a', background: '#ffffff' },
      typography: { fontFamily: 'Inter', fontSize: 14, lineHeight: 1.5 }
    }
  },

  // ... Define all 7 templates
};

export const getTemplate = (slug: string): ResumeTemplate => {
  return TEMPLATE_REGISTRY[slug] || TEMPLATE_REGISTRY.professional;
};

export const listTemplates = (): TemplateMetadata[] => {
  return Object.values(TEMPLATE_REGISTRY).map(t => t.metadata);
};
```

**Agent Tasks (Per Template)**:
1. Copy RR template file as-is
2. Analyze and document all features
3. Extract helper functions (hexToRgb, linearTransform, etc.)
4. Adapt data access (useArtboardStore → props or useDocumentStore)
5. Map RR schema to our schema
6. Extract and adapt all styling (Tailwind + custom CSS)
7. Extract rating system component
8. Test rendering with sample data
9. Visual comparison with RR original (screenshot diff)
10. Register in templateRegistry.ts
11. Create thumbnail (screenshot of rendered template)
12. Test PDF export

**Parallel Execution**: All 7 templates can be extracted simultaneously by different agents

---

## Phase 6: CSS Variable Theming System

**Goal**: Enable runtime theme customization without re-rendering templates

### 6.1 CSS Variable Setup

**File to Create**: `/libs/templates/shared/cssVariables.ts`

**Extract from RR**: Pattern from artboard styling

```typescript
export const generateCSSVariables = (theme: LayoutMetadata['theme']): string => {
  return `
    :root {
      --theme-background: ${theme.background};
      --theme-text: ${theme.text};
      --theme-primary: ${theme.primary};
      --theme-primary-rgb: ${hexToRgb(theme.primary, 1)};
      --theme-primary-20: ${hexToRgb(theme.primary, 0.2)};
      --theme-primary-50: ${hexToRgb(theme.primary, 0.5)};
    }
  `;
};
```

**Inject in Templates**:
```typescript
const TemplateComponent: React.FC<TemplateProps> = ({ data, customizations }) => {
  const cssVars = generateCSSVariables(customizations.theme);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: cssVars }} />
      {/* Template content */}
    </>
  );
};
```

### 6.2 Tailwind Configuration

**Update**: `/tailwind.config.js`

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        'template-bg': 'var(--theme-background)',
        'template-text': 'var(--theme-text)',
        'template-primary': 'var(--theme-primary)',
      }
    }
  }
};
```

**Usage in Templates**:
```tsx
<h1 className="text-template-text">John Doe</h1>
<div className="bg-template-primary text-template-bg">Header</div>
<div className="border-template-primary">Section</div>
```

### 6.3 Customization UI

**Files to Create**:
- `/components/customization/ThemeCustomizer.tsx`
- `/components/customization/ColorPicker.tsx`
- `/components/customization/FontSelector.tsx`

**UI Structure**:
```
Customization Panel
├── Theme Colors
│   ├── Primary Color [Color Picker]
│   ├── Text Color [Color Picker]
│   └── Background Color [Color Picker]
├── Typography
│   ├── Font Family [Dropdown: 20 curated fonts]
│   ├── Font Size [Slider: 12-18px]
│   └── Line Height [Slider: 1.0-2.0]
└── Page Settings
    ├── Format [Radio: A4 / Letter]
    └── Margin [Slider: 10-30mm]
```

**Color Presets** (Extract from RR):
```typescript
const COLOR_PRESETS = [
  { name: 'Classic Black', primary: '#000000' },
  { name: 'Navy Blue', primary: '#1e3a8a' },
  { name: 'Forest Green', primary: '#166534' },
  { name: 'Burgundy', primary: '#991b1b' },
  { name: 'Royal Purple', primary: '#7e22ce' },
  { name: 'Teal', primary: '#0f766e' },
  { name: 'Slate Gray', primary: '#475569' },
  // ... 12 more presets from RR
];
```

**Font List** (Curated 20 Fonts):
```typescript
const FONT_OPTIONS = [
  'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat',
  'Source Sans Pro', 'Raleway', 'PT Sans', 'Merriweather', 'Playfair Display',
  'IBM Plex Sans', 'IBM Plex Serif', 'Crimson Text', 'Libre Baskerville',
  'Archivo', 'Work Sans', 'Noto Sans', 'Nunito', 'Quicksand', 'Karla'
];
```

**Font Loading** (webfontloader):
```typescript
import WebFont from 'webfontloader';

const loadFont = (fontFamily: string) => {
  WebFont.load({
    google: {
      families: [`${fontFamily}:400,600,700`]
    }
  });
};
```

**Agent Tasks**:
1. Create generateCSSVariables utility
2. Update Tailwind config with CSS variable colors
3. Create ColorPicker component
4. Create FontSelector with Google Fonts integration
5. Create ThemeCustomizer panel
6. Wire up customization to documentStore
7. Test real-time theme changes (no page refresh)
8. Test font loading from Google Fonts
9. Test all 7 templates with different themes
10. Ensure PDF export includes custom theme

---

## Phase 7: Section Patterns Implementation

**Goal**: Implement two distinct section patterns (Summary vs Item-based) from RR

### 7.1 Summary Pattern (Inline Editor)

**Use Cases**:
- Profile section (basic info)
- Summary section (professional summary)
- Any single rich-text section

**Files to Update**:
- `/components/editor/sections/ProfileSection.tsx`
- `/components/editor/sections/SummarySection.tsx`

**Extract from RR**:
- **Source**: `/apps/client/src/pages/builder/sidebars/left/sections/summary.tsx` (51 lines)

**Pattern**:
```typescript
const SummarySection: React.FC = () => {
  const setValue = useDocumentStore((state) => state.setValue);
  const section = useDocumentStore((state) => state.document.summary);

  return (
    <section id="summary" className="grid gap-y-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Professional Summary</h2>
        <SectionOptions id="summary" />
      </header>

      {/* Direct Editor */}
      <RichInput
        content={section || ''}
        onChange={(html) => setValue('summary', html)}
        placeholder="Write a compelling professional summary..."
      />
    </section>
  );
};
```

**Key Characteristics**:
- No modal dialog
- Direct inline editing
- Immediate store updates
- Single field only

### 7.2 Item-Based Pattern (Dialog + List)

**Use Cases**:
- Work experience (multiple jobs)
- Education (multiple schools)
- Projects (multiple projects)
- Skills (multiple skill categories)
- All other multi-item sections

**Components Needed**:
1. **SectionBase** - List display with drag-drop
2. **SectionDialog** - CRUD modal wrapper
3. **SectionListItem** - Individual item display

**Extract from RR**:
- **SectionBase**: `/apps/client/src/pages/builder/sidebars/left/sections/shared/section-base.tsx` (181 lines)
- **SectionDialog**: `/apps/client/src/pages/builder/sidebars/left/sections/shared/section-dialog.tsx` (191 lines)
- **SectionListItem**: `/apps/client/src/pages/builder/sidebars/left/sections/shared/section-list-item.tsx`

**SectionBase Pattern**:
```typescript
interface SectionBaseProps<T extends { id: string; visible: boolean }> {
  id: string;                              // Section key ('work', 'education')
  title: (item: T) => string;              // Extract title from item
  description?: (item: T) => string;       // Optional subtitle
}

const SectionBase = <T,>({ id, title, description }: SectionBaseProps<T>) => {
  const { open } = useDialog(id);
  const setValue = useDocumentStore((state) => state.setValue);
  const items = useDocumentStore((state) => state.document[id] || []);

  // Drag-drop handler
  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex(item => item.id === active.id);
    const newIndex = items.findIndex(item => item.id === over.id);
    const sortedList = arrayMove(items, oldIndex, newIndex);

    setValue(id, sortedList);
  };

  return (
    <section>
      {/* Header */}
      <header>
        <h2>Work Experience</h2>
        <SectionOptions />
      </header>

      {/* Drag-Drop List */}
      <DndContext onDragEnd={onDragEnd}>
        <SortableContext items={items}>
          {items.map((item, index) => (
            <SectionListItem
              key={item.id}
              item={item}
              title={title(item)}
              description={description?.(item)}
              onUpdate={() => open('update', { item })}
              onDelete={() => open('delete', { item })}
              onDuplicate={() => open('duplicate', { item })}
            />
          ))}
        </SortableContext>
      </DndContext>

      {/* Add Button */}
      <Button onClick={() => open('create')}>
        Add Work Experience
      </Button>
    </section>
  );
};
```

**SectionDialog Pattern**:
```typescript
interface SectionDialogProps<T> {
  id: string;
  form: UseFormReturn<T>;
  defaultValues: T;
  children: React.ReactNode;  // Form fields
}

const SectionDialog = <T,>({ id, form, defaultValues, children }: SectionDialogProps<T>) => {
  const { isOpen, mode, close, payload } = useDialog<T>(id);
  const setValue = useDocumentStore((state) => state.setValue);
  const items = useDocumentStore((state) => state.document[id] || []);

  const onSubmit = (values: T) => {
    if (mode === 'create' || mode === 'duplicate') {
      setValue(id, [...items, { ...values, id: generateCUID2(), visible: true }]);
    }

    if (mode === 'update') {
      const index = items.findIndex(item => item.id === payload.item.id);
      const updated = [...items];
      updated[index] = values;
      setValue(id, updated);
    }

    if (mode === 'delete') {
      setValue(id, items.filter(item => item.id !== payload.item.id));
    }

    close();
  };

  return (
    <Dialog open={isOpen} onOpenChange={close}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' && 'Add Work Experience'}
            {mode === 'update' && 'Edit Work Experience'}
            {mode === 'delete' && 'Delete Work Experience?'}
          </DialogTitle>
        </DialogHeader>

        {mode === 'delete' ? (
          <div>
            <p>Are you sure? This action cannot be undone.</p>
            <Button onClick={() => onSubmit(null)}>Delete</Button>
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)}>
            {children}
            <DialogFooter>
              <Button type="submit">
                {mode === 'create' ? 'Create' : 'Update'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
```

**Usage Example (WorkSection)**:
```typescript
const WorkSection: React.FC = () => {
  return (
    <SectionBase<WorkExperience>
      id="work"
      title={(item) => item.role}
      description={(item) => `${item.company} • ${item.startDate} - ${item.endDate || 'Present'}`}
    />
  );
};

const WorkDialog: React.FC = () => {
  const form = useForm<WorkExperience>({
    defaultValues: defaultWorkExperience,
    resolver: zodResolver(workExperienceSchema)
  });

  return (
    <SectionDialog id="work" form={form} defaultValues={defaultWorkExperience}>
      <TextField name="company" label="Company" required />
      <TextField name="role" label="Role" required />
      <TextField name="location" label="Location" />
      <DateField name="startDate" label="Start Date" required />
      <DateField name="endDate" label="End Date" allowPresent />
      <RichInput name="descriptionBullets.0" label="Description" />
    </SectionDialog>
  );
};
```

### 7.3 Drag-Drop Library Setup

**Install**: `@dnd-kit/core` + `@dnd-kit/sortable`

```bash
pnpm add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

**Extract from RR**: Drag-drop setup patterns

### 7.4 Dialog System

**File to Create**: `/hooks/useDialog.ts`

**Extract from RR**: Dialog state management hook

```typescript
interface DialogPayload<T> {
  item?: T;
  // ... other context
}

type DialogMode = 'create' | 'update' | 'duplicate' | 'delete';

export const useDialog = <T,>(id: string) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<DialogMode>('create');
  const [payload, setPayload] = useState<DialogPayload<T>>({});

  const open = (mode: DialogMode, payload?: DialogPayload<T>) => {
    setMode(mode);
    setPayload(payload || {});
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
    setPayload({});
  };

  return { isOpen, mode, payload, open, close };
};
```

**Agent Tasks**:
1. Create SectionBase generic component
2. Create SectionDialog generic wrapper
3. Create SectionListItem component
4. Install and configure @dnd-kit
5. Create useDialog hook
6. Update WorkSection with item-based pattern
7. Update EducationSection with item-based pattern
8. Update ProjectsSection with item-based pattern
9. Update SkillsSection with item-based pattern
10. Update all other item-based sections
11. Test drag-drop reordering
12. Test CRUD operations (create, update, duplicate, delete)
13. Test form validation
14. Test with empty lists

---

## Phase 8: PDF Generation & Template Rendering

**Goal**: Ensure PDF export works flawlessly with new templates and rich text content

### 8.1 Template Renderer Update

**File to Update**: `/libs/exporters/templateRenderer.ts`

**Current State**: Basic renderer exists

**Enhancements Needed**:
1. Support layout-as-data (pages → columns → sections)
2. Inject CSS variables for themes
3. Include custom section CSS
4. Load Google Fonts before rendering

**Pattern**:
```typescript
export async function renderResumeTemplate(
  resumeData: ResumeJson,
  options: { templateSlug: string; pageSize: string; margins?: any }
): Promise<string> {
  // 1. Get template from registry
  const template = getTemplate(options.templateSlug);

  // 2. Generate CSS variables
  const cssVars = generateCSSVariables(resumeData.settings.templateMetadata.theme);

  // 3. Collect all custom CSS
  const customCSS = `
    ${cssVars}
    ${template.customCSS || ''}
    /* Print-specific CSS */
    @media print {
      * { animation: none !important; transition: none !important; }
    }
  `;

  // 4. Render React component to HTML
  const Component = template.component;
  const htmlContent = ReactDOMServer.renderToStaticMarkup(
    <Component
      data={resumeData}
      customizations={resumeData.settings.templateMetadata}
      mode="print"
    />
  );

  // 5. Wrap in full HTML document
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${resumeData.profile.fullName} - Resume</title>

        <!-- Tailwind CSS (CDN for simplicity) -->
        <script src="https://cdn.tailwindcss.com"></script>

        <!-- Google Fonts -->
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=${resumeData.settings.templateMetadata.typography.fontFamily.replace(' ', '+')}:wght@400;600;700&display=swap" rel="stylesheet">

        <!-- Custom CSS -->
        <style>${customCSS}</style>
      </head>
      <body>
        ${htmlContent}
      </body>
    </html>
  `;
}
```

### 8.2 Rich Text Sanitization in PDF

**Ensure**: All rich text content is sanitized before PDF generation

```typescript
// In template renderer, before passing data to template
const sanitizedData = {
  ...resumeData,
  summary: sanitizeHtml(resumeData.summary),
  work: resumeData.work?.map(job => ({
    ...job,
    descriptionBullets: job.descriptionBullets.map(sanitizeHtml)
  }))
};
```

### 8.3 PDF Generator Configuration

**File to Review**: `/libs/exporters/pdfGenerator.ts` (already exists)

**Verify**:
- Puppeteer timeout sufficient (30s default)
- Page size handling (A4 vs Letter)
- Margin configuration
- Print background colors enabled
- Wait for fonts to load

**Add Font Loading Wait**:
```typescript
// In configurePage() function
await page.evaluateOnNewDocument(() => {
  document.fonts.ready.then(() => {
    console.log('Fonts loaded');
  });
});
```

### 8.4 Print CSS Optimization

**Files to Create**: Per-template print.css files

**Example**: `/libs/templates/professional/print.css`

```css
@media print {
  /* Disable animations */
  *, *::before, *::after {
    animation-duration: 0s !important;
    animation-delay: 0s !important;
    transition-duration: 0s !important;
    transition-delay: 0s !important;
  }

  /* Force page breaks */
  .page-break-before {
    page-break-before: always;
  }

  .page-break-after {
    page-break-after: always;
  }

  /* Avoid page breaks inside */
  .avoid-break {
    page-break-inside: avoid;
  }

  /* Print backgrounds */
  * {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
}
```

**Agent Tasks**:
1. Update templateRenderer to support layout-as-data
2. Add CSS variable injection
3. Add Google Fonts loading
4. Add HTML sanitization for all rich text fields
5. Create print.css for each template
6. Test PDF generation with all 7 templates
7. Test with custom themes
8. Test with custom sections
9. Test multi-page layouts
10. Verify fonts render correctly in PDF
11. Verify colors print accurately
12. Test with A4 and Letter page sizes

---

## Phase 9: Integration & Testing

**Goal**: Integrate all components and ensure system works end-to-end

### 9.1 End-to-End Flows

**Test Scenarios**:

**Scenario 1: New Resume Creation**
1. User creates new resume
2. Fills profile info (plain text initially)
3. Adds work experience with rich text descriptions
4. Adds custom section ("Volunteer Work")
5. Switches between templates
6. Customizes theme (primary color, font)
7. Exports to PDF
8. Verifies PDF looks identical to preview

**Scenario 2: Template Switching**
1. User opens existing resume
2. Switches from Professional to Timeline template
3. Verifies layout changes correctly
4. Checks all sections visible
5. Verifies custom sections appear
6. Exports to PDF with new template

**Scenario 3: Rich Text Editing**
1. User edits work experience description
2. Formats text (bold, italic, lists)
3. Adds link to company website
4. Saves (auto-save triggers)
5. Verifies formatted text in preview
6. Exports to PDF
7. Verifies formatting preserved in PDF

**Scenario 4: Custom Section Management**
1. User creates custom section "Publications"
2. Adds 3 publication items
3. Reorders via drag-drop
4. Edits item with rich text
5. Toggles item visibility
6. Deletes one item
7. Verifies in preview
8. Exports to PDF

**Scenario 5: Theme Customization**
1. User opens customization panel
2. Changes primary color to navy blue
3. Changes font to Merriweather
4. Adjusts font size to 16px
5. Verifies real-time preview updates
6. Switches template
7. Verifies theme persists
8. Exports to PDF with custom theme

### 9.2 Integration Points

**Checklist**:
- [ ] Rich text editor integrates with React Hook Form
- [ ] Form validation works with HTML content
- [ ] Auto-save triggers on rich text changes
- [ ] Undo/redo works with rich text
- [ ] Templates access data via layout-as-data
- [ ] Custom sections render in templates
- [ ] Theme customization updates all templates
- [ ] PDF export includes custom themes
- [ ] PDF export includes custom sections
- [ ] PDF export preserves rich text formatting
- [ ] Layout changes reflect immediately in preview
- [ ] Drag-drop reordering persists on save

### 9.3 Browser & Device Testing

**Browsers**:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

**Devices**:
- Desktop (1920x1080, 1366x768)
- Tablet (iPad, 1024x768)
- Mobile (responsive, but editor may be desktop-only)

**PDF Rendering**:
- Verify consistent output across browsers
- Check font rendering
- Check color accuracy
- Check page breaks

### 9.4 Performance Testing

**Metrics**:
- Initial page load: < 3s
- Template switch: < 500ms
- Rich text edit to preview update: < 200ms (RAF-batched)
- PDF generation: < 10s for 1-page, < 20s for 2-page
- Auto-save latency: < 2s after last edit

**Optimization Checks**:
- Templates use React.memo for sections
- Preview uses shallow selectors
- Large lists virtualized (if > 20 items)
- Images lazy-loaded
- Fonts preloaded

### 9.5 Error Handling

**Error Scenarios**:
- PDF generation fails (browser timeout)
- Invalid HTML in rich text (sanitization)
- Network error during save (retry)
- Concurrent edit (version conflict)
- Missing custom section data
- Invalid layout structure
- Font loading failure

**User Experience**:
- Clear error messages
- Retry mechanisms
- Graceful degradation
- Loading states
- Optimistic UI updates

**Agent Tasks**:
1. Create comprehensive test plan document
2. Execute all 5 test scenarios manually
3. Document any bugs found
4. Fix critical bugs
5. Test all 7 templates with sample data
6. Test browser compatibility
7. Test PDF generation quality
8. Performance benchmark all operations
9. Stress test with large resumes (10+ work items)
10. Test error scenarios and recovery

---

## Phase 10: Documentation & Migration

**Goal**: Document new system and provide migration path for existing resumes

### 10.1 Developer Documentation

**Files to Create**:

**1. `/docs/templates/README.md`**
- Template architecture overview
- How to create a new template
- Layout-as-data explanation
- Section mapping guide
- CSS variable usage
- Rating system options

**2. `/docs/templates/TEMPLATE_GUIDE.md`**
- Step-by-step template creation
- Code examples
- Best practices
- Common pitfalls

**3. `/docs/editor/RICH_TEXT.md`**
- RichInput component usage
- Toolbar customization
- HTML sanitization rules
- Form integration patterns

**4. `/docs/editor/SECTIONS.md`**
- Two section patterns explained
- SectionBase usage
- SectionDialog usage
- Custom sections guide

**5. `/docs/customization/THEMES.md`**
- CSS variable theming
- Color customization
- Font loading
- Theme presets

### 10.2 User Documentation

**Files to Create**:

**1. User guide for rich text editing**
- Formatting options explained
- Keyboard shortcuts
- Link insertion
- Best practices for ATS compatibility

**2. User guide for templates**
- Template selection
- Template customization
- Theme picker
- Layout customization

**3. User guide for custom sections**
- Creating custom sections
- Adding items
- Reordering
- Visibility toggle

### 10.3 Data Migration

**For Existing Resumes**:

**Migration Script**: `/scripts/migrateToRichText.ts`

```typescript
// Pseudo-code
async function migrateResume(resumeId: string) {
  const resume = await getResume(resumeId);

  // 1. Wrap plain text in <p> tags
  if (resume.data.summary && !resume.data.summary.startsWith('<')) {
    resume.data.summary = `<p>${resume.data.summary}</p>`;
  }

  // 2. Wrap bullet points in <ul><li>
  resume.data.work = resume.data.work?.map(job => ({
    ...job,
    descriptionBullets: job.descriptionBullets.map(bullet =>
      bullet.startsWith('<') ? bullet : `<p>${bullet}</p>`
    )
  }));

  // 3. Add default layout metadata if missing
  if (!resume.data.settings.templateMetadata) {
    resume.data.settings.templateMetadata = {
      template: 'professional',  // Default to Professional
      layout: defaultLayout,
      theme: { primary: '#000000', text: '#1a1a1a', background: '#ffffff' },
      typography: { fontFamily: 'Inter', fontSize: 14, lineHeight: 1.5 },
      page: { format: 'letter', margin: 18 }
    };
  }

  // 4. Save migrated resume
  await updateResume(resumeId, resume.data);
}
```

**Migration Strategy**:
- Run as one-time script on all resumes
- OR migrate on-the-fly when resume is loaded (lazy migration)
- Track migration with `schema_version` field

**Recommended**: Lazy migration
```typescript
// In getResume repository function
export async function getResume(id: string): Promise<Resume> {
  const resume = await fetchFromDB(id);

  // Check if migration needed
  if (resume.schema_version === 'resume.v1' && needsMigration(resume)) {
    const migrated = migrateToRichText(resume);
    await updateResume(id, { data: migrated.data, schema_version: 'resume.v2' });
    return migrated;
  }

  return resume;
}
```

### 10.4 API Documentation

**Update**: `/ai_docs/project/06_api.md`

- Document new fields in ResumeJson schema
- Document layout metadata structure
- Document custom section operations
- Update example requests/responses

**Agent Tasks**:
1. Write complete developer documentation (5 docs)
2. Write user-facing guides (3 guides)
3. Create migration script
4. Test migration with sample resumes
5. Update API documentation
6. Create video walkthrough (optional)
7. Update README with new features
8. Create changelog entry

---

## Phase 11: Optimization & Polish

**Goal**: Performance tuning, accessibility, and final polish

### 11.1 Performance Optimizations

**Template Rendering**:
- Memoize template components
- Memoize section components
- Use React.memo for expensive components
- Implement virtual scrolling for large lists (if needed)

**Preview Updates**:
- RAF-batched updates (already planned)
- Debounce preview re-render (100ms)
- Shallow comparison for data changes

**PDF Generation**:
- Cache rendered HTML (if same data)
- Parallel PDF generation for batch exports
- Progress indicators for long operations

**Code Splitting**:
- Lazy load templates (dynamic import)
- Lazy load TipTap extensions
- Lazy load color picker library

### 11.2 Accessibility (a11y)

**Keyboard Navigation**:
- Tab order correct in all forms
- Enter to submit forms
- Escape to close dialogs
- Arrow keys for drag-drop

**Screen Reader Support**:
- ARIA labels on all buttons
- ARIA live regions for dynamic content
- Semantic HTML (header, section, article, nav)
- Focus management in modals

**Visual Accessibility**:
- Color contrast ratios meet WCAG AA
- Focus indicators visible
- Text resizable to 200%
- No flashing/blinking content

**Testing**:
- Run axe-core accessibility scanner
- Test with keyboard only
- Test with screen reader (NVDA, JAWS, VoiceOver)

### 11.3 Error Boundaries

**Wrap Critical Sections**:
- Wrap each template in error boundary
- Wrap editor sections in error boundary
- Wrap PDF generation in error boundary

**Graceful Degradation**:
- Template fails → Show error message + fallback to Professional template
- Rich text fails → Show plain textarea fallback
- PDF fails → Show error + retry button

### 11.4 Loading States

**All Async Operations**:
- Document loading: Skeleton UI
- Template switching: Fade transition
- PDF generation: Progress bar (0-100%)
- Font loading: System font fallback

**Optimistic UI**:
- Section reordering: Immediate UI update
- Item visibility toggle: Immediate feedback
- Theme changes: Instant preview

### 11.5 Final Polish

**Visual Details**:
- Smooth animations (150ms easing)
- Hover states on all interactive elements
- Active states for buttons
- Disabled states styled appropriately
- Empty states with helpful messages

**Consistency**:
- Spacing consistent (Tailwind scale: 4px base)
- Typography hierarchy clear
- Color usage consistent
- Icon sizes consistent (16px, 20px, 24px)

**Agent Tasks**:
1. Profile all operations (React DevTools Profiler)
2. Identify performance bottlenecks
3. Implement memoization where needed
4. Add code splitting for large components
5. Run accessibility audit (axe-core)
6. Fix all critical a11y issues
7. Test keyboard navigation
8. Add error boundaries
9. Implement loading states
10. Polish animations and transitions
11. Final visual QA pass on all 7 templates

---

## Success Criteria

**Must-Have (MVP)**:
- ✅ 7 templates extracted and working identically to RR
- ✅ Rich text editor with 10 core features
- ✅ Custom sections (create, edit, delete, reorder)
- ✅ Layout-as-data (pages → columns → sections)
- ✅ Theme customization (colors, fonts)
- ✅ PDF export with custom themes
- ✅ HTML sanitization for security
- ✅ Auto-save with rich text support
- ✅ Undo/redo with rich text support
- ✅ All existing resumes still work (backward compat)

**Nice-to-Have (Post-MVP)**:
- Additional toolbar features (headings, images)
- AI text improvement integration
- Template preview gallery
- Template favorites/bookmarks
- Export to JSON/DOCX
- Import from LinkedIn
- More custom themes (20+)
- Template builder (user-created templates)

**Quality Metrics**:
- Test coverage: > 80% (critical paths)
- Lighthouse score: > 90
- Accessibility score: > 95
- PDF generation time: < 10s (1-page)
- Zero console errors in production
- Zero data loss in 1000 saves

---

## Risk Mitigation

**Risk 1: Schema Migration Breaks Existing Resumes**
- **Mitigation**: Lazy migration + backward compatibility
- **Fallback**: Keep old template system working in parallel
- **Testing**: Test with 100 real production resumes

**Risk 2: PDF Generation Quality Issues**
- **Mitigation**: Extensive visual testing with screenshot comparison
- **Fallback**: Keep existing PDF generator as backup option
- **Testing**: Test all 7 templates with various data sets

**Risk 3: Performance Degradation with Rich Text**
- **Mitigation**: RAF-batched updates, memoization, profiling
- **Fallback**: Disable real-time preview if too slow
- **Testing**: Benchmark with large resumes (10+ pages)

**Risk 4: Browser Compatibility Issues**
- **Mitigation**: Test on all major browsers early
- **Fallback**: Feature detection + graceful degradation
- **Testing**: BrowserStack for cross-browser testing

**Risk 5: Template Extraction Takes Longer Than Expected**
- **Mitigation**: Parallel extraction by multiple agents
- **Fallback**: Start with 3 templates, add 4 more later
- **Testing**: N/A

---

## Appendix A: File Structure

**New Files Created**:
```
/components/
  /editor/
    RichInput.tsx                   # Rich text editor component
    /sections/
      CustomSectionsManager.tsx     # Custom section management
      CustomSectionDialog.tsx       # Custom section form
      CustomSectionList.tsx         # Custom section list

/libs/
  /rich-text/
    sanitizeHtml.ts                 # HTML sanitization utility

  /templates/
    templateRegistry.ts             # Template registration

    /shared/
      TemplatePage.tsx              # Page wrapper with sizing
      GenericSection.tsx            # Universal section component
      sectionMapper.tsx             # Section-to-component mapping
      HelperComponents.tsx          # Link, Rating, Picture
      RatingComponents.tsx          # 5 rating styles
      cssVariables.ts               # CSS variable generation

    /professional/
      ProfessionalTemplate.tsx      # Template 1
      styles.css
      print.css

    /timeline/
      TimelineTemplate.tsx          # Template 2
      styles.css
      print.css

    /modern/
      ModernTemplate.tsx            # Template 3
      styles.css
      print.css

    /executive/
      ExecutiveTemplate.tsx         # Template 4
      styles.css
      print.css

    /academic/
      AcademicTemplate.tsx          # Template 5
      styles.css
      print.css

    /creative/
      CreativeTemplate.tsx          # Template 6
      styles.css
      print.css

    /bold/
      BoldTemplate.tsx              # Template 7
      styles.css
      print.css

/hooks/
  useDialog.ts                      # Dialog state management

/docs/
  /templates/
    README.md
    TEMPLATE_GUIDE.md
  /editor/
    RICH_TEXT.md
    SECTIONS.md
  /customization/
    THEMES.md

/scripts/
  migrateToRichText.ts              # Data migration script
```

**Modified Files**:
```
/types/
  resume.ts                         # Add custom, templateMetadata
  template.ts                       # Add layout types

/libs/validation/
  resume.ts                         # Update Zod schemas

/libs/exporters/
  templateRenderer.ts               # Support layout-as-data, CSS vars
  pdfGenerator.ts                   # Font loading, verification

/components/editor/sections/
  ProfileSection.tsx                # Use RichInput
  SummarySection.tsx                # Use RichInput
  WorkSection.tsx                   # Item-based pattern + RichInput
  EducationSection.tsx              # Item-based pattern + RichInput
  ProjectsSection.tsx               # Item-based pattern + RichInput
  SkillsSection.tsx                 # Item-based pattern + RichInput
  [All other sections]              # Item-based pattern + RichInput

/stores/
  documentStore.ts                  # Add custom section operations

/tailwind.config.js                 # CSS variable colors

/ai_docs/project/
  06_api.md                         # Update API docs
  02_schemas.md                     # Update schema docs
```

---

## Appendix B: Dependencies to Add

```json
{
  "dependencies": {
    "@tiptap/core": "^2.26.2",
    "@tiptap/react": "^2.26.2",
    "@tiptap/starter-kit": "^2.26.1",
    "@tiptap/extension-underline": "^2.26.2",
    "@tiptap/extension-link": "^2.26.2",
    "@tiptap/extension-text-align": "^2.26.2",
    "@dnd-kit/core": "^6.1.0",
    "@dnd-kit/sortable": "^8.0.0",
    "@dnd-kit/utilities": "^3.2.2",
    "sanitize-html": "^2.17.0",
    "webfontloader": "^1.6.28"
  }
}
```

**Total New Dependencies**: 9 packages (~5MB)

---

## Appendix C: Estimated Complexity

**Low Complexity** (1-2 agents, 1-2 days):
- Phase 1: Schema evolution
- Phase 2.3: HTML sanitization
- Phase 6: CSS variable theming
- Phase 10: Documentation

**Medium Complexity** (2-3 agents, 2-4 days):
- Phase 2.1-2.2: Rich text editor
- Phase 2.4: Form integration
- Phase 3: Custom sections UI
- Phase 7: Section patterns
- Phase 8: PDF updates

**High Complexity** (3-5 agents, 4-7 days):
- Phase 4: Template architecture
- Phase 5: Template extraction (7 templates)
- Phase 9: Integration & testing
- Phase 11: Optimization & polish

**Total Estimated Effort**: 20-40 agent-days (parallelizable)

---

## Appendix D: Quality Checklist

**Before Deployment**:
- [ ] All 7 templates visually match RR originals
- [ ] Rich text formatting works in all sections
- [ ] Custom sections can be created, edited, deleted
- [ ] Layout customization works for all templates
- [ ] Theme customization updates all templates
- [ ] PDF export includes all customizations
- [ ] PDF export preserves rich text formatting
- [ ] Existing resumes still load and work
- [ ] No console errors or warnings
- [ ] Accessibility score > 95
- [ ] Performance benchmarks pass
- [ ] All browsers tested (Chrome, Firefox, Safari, Edge)
- [ ] Mobile responsive (if applicable)
- [ ] Security: XSS prevention via sanitization
- [ ] Data integrity: No data loss in saves
- [ ] Error handling: Graceful failure modes
- [ ] Loading states: All async ops have UI feedback
- [ ] Documentation complete
- [ ] Migration tested with real data
- [ ] API docs updated
- [ ] Changelog entry created

---

**END OF PLAN**

This comprehensive plan provides a complete roadmap for adopting Reactive-Resume patterns into ResumePair. Each phase is self-contained and can be executed by autonomous agents with clear success criteria and deliverables.
