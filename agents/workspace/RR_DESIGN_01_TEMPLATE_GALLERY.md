# Reactive Resume: Template Gallery & Deep Analysis

**Document:** RR_DESIGN_01_TEMPLATE_GALLERY.md
**Source:** /Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume
**Date:** 2025-10-07

---

## Overview

Reactive Resume includes **12 distinct resume templates**, each with unique visual characteristics and layout approaches. All templates are named after Pokémon characters and share a common architecture while offering different visual styles.

**Template List:**
1. azurill
2. bronzor
3. chikorita
4. ditto
5. gengar
6. glalie
7. kakuna
8. leafish
9. nosepass
10. onyx
11. pikachu
12. rhyhorn (default)

**Location:** `/apps/artboard/src/templates/`
**Entry Point:** `/apps/artboard/src/templates/index.tsx` (lines 1-59)

---

## Template Architecture

### Common Structure

All templates follow a consistent architecture:

```typescript
// Template Props Interface
type TemplateProps = {
  columns: SectionKey[][];  // Array of section arrays [main, sidebar]
  isFirstPage?: boolean;     // Whether this is the first page
};

// Section Types
- profiles, summary, experience, education
- awards, certifications, skills, interests
- publications, volunteer, languages, projects, references
- custom sections (dynamic)
```

**Location:** `/apps/artboard/src/types/template.ts` (lines 1-6)

### Common Components

Each template includes these reusable components:

1. **Header**: Name, headline, contact information
2. **Summary**: Professional summary section
3. **Rating**: Skill level visualization (5 variations)
4. **Link**: URL display component
5. **LinkedEntity**: Clickable organization/company names
6. **Section**: Generic section wrapper with item iteration
7. **Individual Sections**: Experience, Education, Skills, etc.

### Layout System

Templates use a two-column system:
- **Main Column**: Primary content (left or wider column)
- **Sidebar Column**: Secondary content (right or narrower column)

Layout is configured via metadata: `metadata.layout` defines pages → columns → sections

---

## Top 7 Templates: Detailed Analysis

### 1. RHYHORN (Default Template)
**File:** `/apps/artboard/src/templates/rhyhorn.tsx`

**Visual Description:**
- **Layout**: Single column (no sidebar separation), main and sidebar sections flow together
- **Header**: Horizontal layout with picture on left, info on right
- **Contact Info**: Inline with pipe separators (`|`)
- **Section Headers**: Small, bold, with bottom border (pb-0.5)
- **Rating Style**: Circular dots (5 filled/unfilled circles)
- **Key Feature**: Clean, minimal design with subtle borders

**Layout Structure:**
```
┌─────────────────────────────────────────┐
│ [Photo]  Name                           │
│          Headline                       │
│          📍 Location | 📞 Phone | ✉️ Email│
├─────────────────────────────────────────┤
│ Section Header (border-b)               │
│ Content with left/right alignment       │
│   Company (Bold)        Date (Bold)     │
│   Position              Location        │
│   Summary...                            │
└─────────────────────────────────────────┘
```

**Code Highlights:**
- Line 27-81: Header with inline flex layout
- Line 89-98: Border-bottom section headers
- Line 103-112: Circular rating dots
- Line 249-269: Experience section with flex justify-between

**Best For:** Professional, corporate resumes

---

### 2. AZURILL (Timeline Style)
**File:** `/apps/artboard/src/templates/azurill.tsx`

**Visual Description:**
- **Layout**: Two-column grid (1/3 sidebar, 2/3 main)
- **Header**: Centered with picture at top
- **Section Headers**: Different styling for sidebar vs main
  - Main: Bold text with primary color
  - Sidebar: Centered with decorative dots on sides
- **Timeline Effect**: Vertical left border with dots on main sections
- **Rating Style**: Horizontal progress bar with transform
- **Key Feature**: Timeline dots create visual flow

**Layout Structure:**
```
┌────────┬──────────────────────────────┐
│        │     [Photo]                  │
│        │     Name (centered)          │
│        │     Headline (centered)      │
│        │     Contact (centered)       │
├────────┼──────────────────────────────┤
│ SIDE   │ ● Section Header             │
│  BAR   │ ┃ Company      Position      │
│        │ ┃ Date         Location      │
│ •──•   │ ┃ Summary...                 │
│ Title  │ ●─────────────────────       │
└────────┴──────────────────────────────┘
```

**Code Highlights:**
- Line 31-77: Centered header layout
- Line 87-106: Dual section header styles (main vs sidebar)
- Line 112-119: Progress bar rating with linearTransform
- Line 559-575: Grid layout with sidebar (col-span-1) and main (col-span-2)

**Best For:** Creative, design-focused resumes

---

### 3. PIKACHU (Colored Sidebar)
**File:** `/apps/artboard/src/templates/pikachu.tsx`

**Visual Description:**
- **Layout**: Sidebar-left (1/3), main-right (2/3)
- **Header**: Colored header bar spanning top (bg-primary, text-background)
- **Sidebar**: Picture at top, sections below
- **Section Headers**: Bottom border with primary color
- **Rating Style**: Diamond icons (filled/unfilled)
- **Key Feature**: Bold primary-colored header creates strong visual anchor

**Layout Structure:**
```
┌──────────────────────────────────────────┐
│ ████████ Colored Header ████████         │
│ Name (Bold, Large)                       │
│ Headline                                 │
│ Contact • Separated • By • Dots          │
├──────────┬───────────────────────────────┤
│ [Photo]  │ Section Header (border-b)    │
│          │ Company          Date         │
│ Sidebar  │ Position         Location    │
│ Sections │ Summary...                   │
│          │                              │
│ ◆◆◆◆◇    │ Next Section...              │
└──────────┴───────────────────────────────┘
```

**Code Highlights:**
- Line 27-101: Header with bg-primary styling and rounded corners
- Line 124-139: Diamond icon rating system
- Line 600-622: Sidebar-first layout with picture placement

**Best For:** Modern, colorful resumes with visual hierarchy

---

### 4. DITTO (Colored Header Strip)
**File:** `/apps/artboard/src/templates/ditto.tsx`

**Visual Description:**
- **Layout**: Two-column (1/3 sidebar, 2/3 main)
- **Header**: Picture overlays colored strip (85px primary-colored band)
- **Section Headers**: Simple, bold text
- **Borders**: Thick left border (4px) on main section items
- **Rating Style**: Rectangular boxes (filled/unfilled)
- **Key Feature**: Layered header with absolute positioning creates depth

**Layout Structure:**
```
┌──────────────────────────────────────────┐
│ ████████████ (Primary Band) ████████████ │
│ [Photo]  Name (overlays band)            │
│          Headline                        │
│          Contact Info                    │
├──────────┬───────────────────────────────┤
│          │ ┃┃ Section Header             │
│ Sidebar  │ ┃┃ Company        Date        │
│ Sections │ ┃┃ Position       Location    │
│          │ ┃┃ Summary...                 │
│          │ ┃┃                            │
└──────────┴───────────────────────────────┘
```

**Code Highlights:**
- Line 594-626: Absolute positioned colored band with header overlay
- Line 229-245: 4px left border creates strong visual line
- Line 124-130: Box-style rating indicators

**Best For:** Bold, contemporary resumes

---

### 5. GENGAR (Colored Sidebar Background)
**File:** `/apps/artboard/src/templates/gengar.tsx`

**Visual Description:**
- **Layout**: Sidebar-left with colored background (20% opacity primary)
- **Header**: Full-width colored sidebar header (bg-primary, text-background)
- **Summary**: Special placement with colored background (20% opacity)
- **Section Headers**: Bottom border, primary color
- **Rating Style**: Horizontal bars (filled/unfilled)
- **Key Feature**: Colored sidebar creates strong left column separation

**Layout Structure:**
```
┌────────────────────────────────────────┐
│ ▓▓▓▓▓▓▓▓                               │
│ ▓ Header ▓                             │
│ ▓ [Photo]▓                             │
│ ▓▓▓▓▓▓▓▓ (Colored Background)          │
├────────────────────────────────────────┤
│ ▒▒▒▒▒▒▒▒ Summary Section (Light BG) ▒▒ │
├────────────┬───────────────────────────┤
│ ▓▓▓▓▓▓▓▓  │ Section Header            │
│ ▓ Sidebar │ Company         Date       │
│ ▓ Content │ Position        Location   │
│ ▓▓▓▓▓▓▓▓  │ Summary...                │
└────────────┴───────────────────────────┘
```

**Code Highlights:**
- Line 569-605: Min-height grid with colored sidebar
- Line 31-79: Full-colored header in sidebar
- Line 82-98: Summary with hexToRgb opacity background
- Line 586: backgroundColor: hexToRgb(primaryColor, 0.2)

**Best For:** Creative roles, portfolios

---

### 6. BRONZOR (Academic/Traditional)
**File:** `/apps/artboard/src/templates/bronzor.tsx`

**Visual Description:**
- **Layout**: Single column (5-column grid for content sections)
- **Header**: Centered, traditional layout
- **Section Structure**: Label column (1/5) + content (4/5)
- **Section Headers**: Border-top separator (unique approach)
- **Rating Style**: Small circular dots
- **Key Feature**: Two-column section layout (label + content) mimics classic CV format

**Layout Structure:**
```
┌─────────────────────────────────────────┐
│           [Photo]                       │
│           Name (Bold, 2xl)              │
│           Headline                      │
│           Contact (centered)            │
├─────────────────────────────────────────┤
│ Label      │ Content (spans 4 cols)     │
│ (1 col)    │                            │
├────────────┼────────────────────────────┤
│ Summary    │ Professional summary text  │
├────────────┼────────────────────────────┤
│ Experience │ Company        Date        │
│            │ Position       Location    │
│            │ Summary...                 │
└─────────────────────────────────────────┘
```

**Code Highlights:**
- Line 86-96: Grid-cols-5 structure (unique among templates)
- Line 183-223: Section wrapper with 1:4 column split
- Line 567-584: Simple single-column flow

**Best For:** Academic CVs, traditional industries

---

### 7. GLALIE (Sidebar with Tinted Background)
**File:** `/apps/artboard/src/templates/glalie.tsx`

**Visual Description:**
- **Layout**: Left sidebar (1/3) with colored background, main (2/3)
- **Header**: Centered in sidebar with bordered contact box
- **Contact Box**: Rounded border around contact details
- **Rating Style**: Gradient progress bar (primary with 40% opacity background)
- **Key Feature**: Elegant contact information box and gradient ratings

**Layout Structure:**
```
┌────────────┬───────────────────────────┐
│ ▒▒▒▒▒▒▒▒▒ │                           │
│ ▒ [Photo] │ Main Content              │
│ ▒  Name   │                           │
│ ▒┌────────┐│ Section Header            │
│ ▒│Contact ││ Company       Date        │
│ ▒│  Box   ││ Position      Location   │
│ ▒└────────┘│ Summary...                │
│ ▒         │                           │
│ ▒ Sidebar │ ▓▓▓▓▓▓▓▓░░ (Progress Bar) │
│ ▒▒▒▒▒▒▒▒▒ │                           │
└────────────┴───────────────────────────┘
```

**Code Highlights:**
- Line 38-86: Bordered contact box (rounded, border-primary)
- Line 109-123: Gradient progress bar with opacity background
- Line 588-612: Sidebar with hexToRgb background, conditional hiding

**Best For:** Modern professional resumes

---

## Additional Templates Summary

### 8. KAKUNA (Centered Headers)
- **Layout**: Single column, centered section headers
- **Headers**: Border-bottom, centered, primary colored
- **Unique**: Profiles integrated in header
- **Location:** `/apps/artboard/src/templates/kakuna.tsx`

### 9. LEAFISH
- Similar patterns to other templates with unique spacing

### 10. NOSEPASS
- Variations in section arrangements

### 11. CHIKORITA
- Timeline-style with decorative elements

### 12. ONYX
- Clean, structured layout

---

## Rating System Variations

Each template implements a unique rating visualization:

1. **Rhyhorn**: Circular dots (filled/unfilled)
   ```tsx
   <div className="size-2 rounded-full border border-primary bg-primary?" />
   ```

2. **Azurill**: Horizontal progress bar with width transform
   ```tsx
   style={{ width: linearTransform(level, 0, 5, 0, 128) }}
   ```

3. **Pikachu**: Diamond icons (ph-diamond)
   ```tsx
   <i className="ph ph-diamond text-primary ph-fill?" />
   ```

4. **Ditto**: Rectangular boxes
   ```tsx
   <div className="h-2 w-4 border border-primary bg-primary?" />
   ```

5. **Gengar**: Horizontal bars
   ```tsx
   <div className="h-2.5 w-5 border border-primary bg-primary?" />
   ```

6. **Bronzor**: Small circular dots (size-2)

7. **Glalie**: Gradient progress bar with opacity background
   ```tsx
   backgroundColor: hexToRgb(primaryColor, 0.4)
   width: linearTransform(level, 0, 5, 0, 100)%
   ```

---

## Template Selection System

**Location:** `/apps/client/src/pages/builder/sidebars/right/sections/template.tsx`

Users select templates via:
- Visual grid display (2-4 columns responsive)
- Thumbnail images: `/templates/jpg/${template}.jpg`
- Click to apply: `setValue("metadata.template", template)`
- Current template highlighted with ring

**Code Reference:** Lines 23-48

---

## Common Design Patterns

### 1. Section Component Pattern
All templates use a generic `Section<T>` component:
- Handles visibility filtering
- Maps items with URL, level, summary, keywords support
- Configurable columns via `gridTemplateColumns`
- Supports custom rendering per item type

### 2. Responsive Layout Classes
- `group-[.main]` and `group-[.sidebar]` for conditional styling
- `shrink-0` for preventing date/location collapse
- `flex-wrap` for contact information wrapping

### 3. Typography Hierarchy
- Name: `text-2xl font-bold`
- Headline: `text-base`
- Section Headers: `text-sm` or `text-base font-bold`
- Content: Default size with `text-sm` for secondary info

### 4. Color Application
Templates use Tailwind classes tied to CSS variables:
- `text-primary`: User's chosen primary color
- `bg-primary`: Primary background
- `text-background`: Inverted text color
- `border-primary`: Border with primary color

---

## Key Findings

1. **Consistent Architecture**: All templates share section components, making them data-compatible
2. **Visual Variety**: 7+ distinct layout approaches (single column, sidebar-left, sidebar-right, colored backgrounds, timelines)
3. **Rating Flexibility**: 5+ unique rating visualizations
4. **Responsive Sections**: Group-based styling allows same content to render differently in main vs sidebar
5. **Color Integration**: Primary color applied consistently across all templates
6. **Icon System**: Phosphor icons used throughout with optional hiding
7. **Layout Flexibility**: 2-3 column grids, absolute positioning, colored bands all used

---

## Recommendations for Implementation

### Essential Templates to Extract (Ranked by Distinctiveness):
1. **Azurill** - Timeline with decorative elements
2. **Pikachu** - Colored header with sidebar
3. **Gengar** - Full colored sidebar background
4. **Bronzor** - Academic two-column format
5. **Glalie** - Elegant bordered contact box
6. **Rhyhorn** - Clean default template
7. **Ditto** - Layered header with colored band

### Pattern Categories:
- **Traditional**: Rhyhorn, Bronzor, Kakuna
- **Modern**: Pikachu, Ditto, Glalie
- **Creative**: Azurill, Gengar
- **Minimalist**: Rhyhorn, Onyx

---

**Document Version:** 1.0
**Exploration Completed:** 2025-10-07
