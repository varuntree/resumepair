# System Architecture: After Adoption

**Visual guide to the adopted architecture**

---

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERACTION                         │
└────────────┬────────────────────────────────────┬────────────────┘
             │                                    │
             ▼                                    ▼
    ┌─────────────────┐                 ┌─────────────────┐
    │  EDITOR (Left)  │                 │ PREVIEW (Right) │
    │                 │                 │                 │
    │  - RichInput    │                 │  - Template     │
    │  - Forms        │                 │  - Live Update  │
    │  - Sections     │                 │  - RAF Batched  │
    └────────┬────────┘                 └────────▲────────┘
             │                                    │
             ▼                                    │
    ┌─────────────────┐                          │
    │ React Hook Form │                          │
    │  + Zod Validate │                          │
    └────────┬────────┘                          │
             │                                    │
             ▼                                    │
    ┌──────────────────────────────────────────────────┐
    │         ZUSTAND STORE (Document State)           │
    │                                                   │
    │  - document: ResumeJson                          │
    │  - temporal (undo/redo)                          │
    │  - setValue()                                    │
    │  - updateDocument()                              │
    └────────┬──────────────────────────┬────────────────┘
             │                          │
             │ Auto-save (2s debounce)  │ Shallow selectors
             ▼                          └─────────────────┘
    ┌─────────────────┐
    │   API LAYER     │
    │                 │
    │  POST /resumes  │
    │  version check  │
    └────────┬────────┘
             │
             ▼
    ┌─────────────────┐
    │   SUPABASE DB   │
    │                 │
    │  JSONB + ver    │
    └─────────────────┘
```

---

## Template Rendering Architecture

```
┌────────────────────────────────────────────────────────┐
│                    RESUME DATA                         │
│                                                        │
│  {                                                     │
│    profile: {...},                                     │
│    work: [...],                                        │
│    custom: { "abc123": {...} },                       │
│    settings: {                                         │
│      templateMetadata: {                               │
│        template: "professional",                       │
│        layout: [                                       │
│          [                              ◄─────── Pages
│            ["profile", "work"],         ◄─────── Columns
│            ["skills", "custom.abc123"]  ◄─────── Sections
│          ]                                             │
│        ],                                              │
│        theme: { primary, text, bg }                    │
│      }                                                 │
│    }                                                   │
│  }                                                     │
└──────────────────┬─────────────────────────────────────┘
                   │
                   ▼
         ┌─────────────────────┐
         │  getTemplate(slug)  │
         │                     │
         │  Returns Component  │
         └──────────┬──────────┘
                    │
                    ▼
          ┌──────────────────────┐
          │  Template Component  │
          │                      │
          │  Props:              │
          │   - data             │
          │   - customizations   │
          │   - mode             │
          └──────────┬───────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
         ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│  Iterate Pages  │     │  CSS Variables  │
│                 │     │                 │
│  layout.map()   │     │  --primary      │
└────────┬────────┘     │  --text         │
         │              └─────────────────┘
         ▼
┌─────────────────┐
│ Iterate Columns │
│                 │
│ Grid layout     │
└────────┬────────┘
         │
         ▼
┌──────────────────────┐
│  Iterate Sections    │
│                      │
│  for sectionKey in   │
│    sectionsInColumn  │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────────────┐
│  mapSectionToComponent()     │
│                              │
│  "work" → <WorkSection />    │
│  "custom.abc" → <Custom />   │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│  Section Component Renders   │
│                              │
│  - Pulls data via key        │
│  - Checks visibility         │
│  - Renders items             │
└──────────────────────────────┘
```

---

## Rich Text Editor Flow

```
┌─────────────────────────────────────────┐
│            USER TYPES                   │
└──────────────────┬──────────────────────┘
                   │
                   ▼
          ┌─────────────────┐
          │    TipTap       │
          │    Editor       │
          │                 │
          │  Extensions:    │
          │   - StarterKit  │
          │   - Underline   │
          │   - Link        │
          │   - TextAlign   │
          └────────┬────────┘
                   │
                   │ onChange
                   ▼
          ┌─────────────────┐
          │ editor.getHTML()│
          │                 │
          │ Returns:        │
          │ "<p>Text</p>"   │
          └────────┬────────┘
                   │
                   ▼
          ┌──────────────────┐
          │ React Hook Form  │
          │                  │
          │ field.onChange() │
          └────────┬─────────┘
                   │
                   ▼
          ┌──────────────────┐
          │  Zod Validation  │
          │                  │
          │  z.string()      │
          └────────┬─────────┘
                   │
                   ▼
          ┌──────────────────┐
          │  Zustand Store   │
          │                  │
          │  setValue()      │
          └────────┬─────────┘
                   │
                   ├─────► Auto-save (2s) ──► Database
                   │
                   └─────► Preview Update
                             │
                             ▼
                    ┌─────────────────┐
                    │  sanitizeHtml() │
                    │                 │
                    │  Whitelist:     │
                    │   p, ul, li     │
                    │   strong, em, a │
                    │   (60+ tags)    │
                    └────────┬────────┘
                             │
                             ▼
                    ┌───────────────────┐
                    │ dangerouslySet... │
                    │                   │
                    │ Render in preview │
                    └───────────────────┘
```

---

## Custom Sections Architecture

```
┌────────────────────────────────────────────────────┐
│               CUSTOM SECTIONS MANAGER               │
│                                                     │
│  [+ Add Custom Section]                            │
│                                                     │
│  ┌──────────────────────────────────────┐          │
│  │  Custom Section: "Volunteer Work"    │  [Edit]  │
│  │  ID: abc123                           │  [Del]   │
│  │  Items: 3                             │          │
│  └──────────────────────────────────────┘          │
│                                                     │
│  ┌──────────────────────────────────────┐          │
│  │  Custom Section: "Publications"      │  [Edit]  │
│  │  ID: def456                           │  [Del]   │
│  │  Items: 5                             │          │
│  └──────────────────────────────────────┘          │
└────────────────────────────────────────────────────┘
                         │
                         │ Click Edit
                         ▼
┌─────────────────────────────────────────────────────┐
│           CUSTOM SECTION DIALOG                     │
│                                                      │
│  Section Name: [Volunteer Work.................]    │
│                                                      │
│  Items:                                              │
│  ┌──────────────────────────────────────────┐       │
│  │  Organization: [Red Cross.............]  │       │
│  │  Role: [Volunteer Coordinator..........]  │       │
│  │  Date: [2020-2022.....................]  │       │
│  │  Location: [New York, NY............]     │       │
│  │  Summary: [RichInput.................]     │       │
│  │  Keywords: [leadership] [healthcare]       │       │
│  │  URL: [https://redcross.org..........]     │       │
│  │                                            │       │
│  │  [Add Item] [Remove]                       │       │
│  └──────────────────────────────────────────┘       │
│                                                      │
│  [Cancel]  [Save]                                    │
└──────────────────────────────────────────────────────┘
                         │
                         │ Save
                         ▼
┌──────────────────────────────────────────────────────┐
│              RESUME DATA STRUCTURE                   │
│                                                      │
│  {                                                   │
│    custom: {                                         │
│      "abc123": {                                     │
│        id: "abc123",                                 │
│        name: "Volunteer Work",                       │
│        columns: 1,                                   │
│        visible: true,                                │
│        items: [                                      │
│          {                                           │
│            id: "item1",                              │
│            visible: true,                            │
│            name: "Red Cross",                        │
│            description: "Volunteer Coordinator",     │
│            date: "2020-2022",                        │
│            location: "New York, NY",                 │
│            summary: "<p>Led team...</p>",           │
│            keywords: ["leadership", "healthcare"],   │
│            url: { label: "Website", href: "..." }    │
│          }                                           │
│        ]                                             │
│      }                                               │
│    }                                                 │
│  }                                                   │
└──────────────────────────────────────────────────────┘
                         │
                         │ Layout references as:
                         ▼
                  "custom.abc123"
                         │
                         ▼
              ┌────────────────────┐
              │  Template Renders  │
              │                    │
              │  Via Generic       │
              │  Section Component │
              └────────────────────┘
```

---

## Section Patterns: Two Approaches

### Pattern 1: Summary (Inline)
```
┌───────────────────────────────────────┐
│  📝 Professional Summary              │
├───────────────────────────────────────┤
│                                       │
│  ┌─────────────────────────────────┐ │
│  │  [RichInput - Direct Editor]    │ │
│  │                                 │ │
│  │  Experienced software engineer  │ │
│  │  with 5+ years...               │ │
│  │                                 │ │
│  │  [B] [I] [U] | [• List] [Link] │ │
│  └─────────────────────────────────┘ │
│                                       │
└───────────────────────────────────────┘
      │
      │ onChange → setValue() → Store
      ▼
  Immediate Update
```

### Pattern 2: Item-Based (Dialog)
```
┌──────────────────────────────────────────┐
│  💼 Work Experience                      │
├──────────────────────────────────────────┤
│                                          │
│  ┌────────────────────────────────────┐ │
│  │ ⋮⋮ Senior Developer             👁 │ │
│  │    Tech Corp • 2020-Present        │ │
│  │    [Edit] [Duplicate] [Delete]     │ │
│  └────────────────────────────────────┘ │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │ ⋮⋮ Software Engineer            👁 │ │
│  │    StartupCo • 2018-2020           │ │
│  │    [Edit] [Duplicate] [Delete]     │ │
│  └────────────────────────────────────┘ │
│                                          │
│  [+ Add Work Experience]                 │
└──────────────────────────────────────────┘
              │
              │ Click Edit
              ▼
    ┌──────────────────────────┐
    │   WORK DIALOG (Modal)    │
    │                          │
    │  Company: [Tech Corp...] │
    │  Role: [Senior Dev...]   │
    │  Dates: [2020] - [Now]   │
    │  Description:            │
    │  [RichInput]             │
    │                          │
    │  [Cancel] [Save]         │
    └──────────────────────────┘
```

---

## Template Layout System

### Layout Definition
```typescript
layout: [
  [  // Page 1
    [  // Column 1 (Main)
      "profile",
      "summary",
      "work",
      "education",
      "projects"
    ],
    [  // Column 2 (Sidebar)
      "skills",
      "certifications",
      "awards",
      "languages",
      "custom.abc123"  // Custom section
    ]
  ]
  // Page 2 could be here
]
```

### Visual Representation
```
┌─────────────────────────────────────────────────────┐
│                     PAGE 1                          │
│                                                     │
│  ┌───────────────────────┬──────────────────────┐  │
│  │     MAIN COLUMN       │   SIDEBAR COLUMN     │  │
│  │       (2/3 width)     │     (1/3 width)      │  │
│  ├───────────────────────┼──────────────────────┤  │
│  │                       │                      │  │
│  │  [Profile Section]    │  [Skills Section]    │  │
│  │  Name, Email, etc.    │  JS, React, Node     │  │
│  │                       │                      │  │
│  ├───────────────────────┤  ────────────────────┤  │
│  │                       │                      │  │
│  │  [Summary Section]    │  [Certifications]    │  │
│  │  Professional summary │  AWS, Azure          │  │
│  │                       │                      │  │
│  ├───────────────────────┤  ────────────────────┤  │
│  │                       │                      │  │
│  │  [Work Experience]    │  [Awards]            │  │
│  │  Job 1                │  Award 1             │  │
│  │  Job 2                │  Award 2             │  │
│  │                       │                      │  │
│  ├───────────────────────┤  ────────────────────┤  │
│  │                       │                      │  │
│  │  [Education]          │  [Languages]         │  │
│  │  University           │  English, Spanish    │  │
│  │                       │                      │  │
│  ├───────────────────────┤  ────────────────────┤  │
│  │                       │                      │  │
│  │  [Projects]           │  [Custom: Volunteer] │  │
│  │  Project 1            │  Red Cross           │  │
│  │  Project 2            │                      │  │
│  │                       │                      │  │
│  └───────────────────────┴──────────────────────┘  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## PDF Generation Flow

```
┌─────────────────┐
│ User Clicks     │
│ "Export PDF"    │
└────────┬────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  Create Export Job (Database)        │
│  - jobId                             │
│  - documentId                        │
│  - status: 'pending'                 │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  Background Worker Picks Up Job      │
│  (Polling with FOR UPDATE SKIP...)   │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  templateRenderer.renderResume()     │
│                                      │
│  1. Get template component           │
│  2. Generate CSS variables           │
│  3. Load Google Fonts                │
│  4. Sanitize HTML content            │
│  5. Render React → HTML string       │
│  6. Wrap in full HTML document       │
└────────┬─────────────────────────────┘
         │
         │ HTML String
         ▼
┌──────────────────────────────────────┐
│  pdfGenerator.generatePdf()          │
│                                      │
│  1. Launch Puppeteer browser         │
│  2. Create new page                  │
│  3. Set viewport (1200x1600)         │
│  4. Load HTML content                │
│  5. Wait for fonts to load           │
│  6. Wait for networkidle0            │
│  7. Generate PDF buffer              │
│  8. Close browser                    │
└────────┬─────────────────────────────┘
         │
         │ PDF Buffer
         ▼
┌──────────────────────────────────────┐
│  Upload to Supabase Storage          │
│  - Path: exports/{userId}/{jobId}.pdf│
│  - Public URL                        │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  Update Export Job                   │
│  - status: 'completed'               │
│  - fileUrl                           │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  User Downloads PDF                  │
└──────────────────────────────────────┘
```

---

## CSS Variable Theming

```
┌────────────────────────────────┐
│  User Picks Primary Color      │
│  Color Picker: #1e3a8a (Navy)  │
└──────────────┬─────────────────┘
               │
               ▼
┌────────────────────────────────────────┐
│  Update Store                          │
│  setValue('settings.templateMetadata   │
│            .theme.primary', '#1e3a8a') │
└──────────────┬─────────────────────────┘
               │
               ▼
┌────────────────────────────────────────┐
│  generateCSSVariables()                │
│                                        │
│  Returns:                              │
│  :root {                               │
│    --theme-primary: #1e3a8a;          │
│    --theme-primary-rgb: 30,58,138;    │
│    --theme-primary-20: rgba(30,58,138,0.2); │
│    --theme-text: #1a1a1a;             │
│    --theme-background: #ffffff;        │
│  }                                     │
└──────────────┬─────────────────────────┘
               │
               ▼
┌────────────────────────────────────────┐
│  Inject via <style> tag in template   │
└──────────────┬─────────────────────────┘
               │
               ▼
┌────────────────────────────────────────┐
│  Template uses CSS variables:         │
│                                        │
│  <h1 className="text-template-primary">│
│  <div className="bg-template-primary"> │
│  <div className="border-template-      │
│                   primary">            │
└────────────────────────────────────────┘
               │
               ▼
        Instant Update
     (No React Re-render!)
```

---

## File Structure After Adoption

```
resumepair/
├── components/
│   ├── editor/
│   │   ├── RichInput.tsx                   ✨ NEW
│   │   └── sections/
│   │       ├── CustomSectionsManager.tsx   ✨ NEW
│   │       ├── WorkSection.tsx             📝 UPDATED
│   │       └── [all other sections]        📝 UPDATED
│   └── customization/
│       ├── ThemeCustomizer.tsx             ✨ NEW
│       ├── ColorPicker.tsx                 ✨ NEW
│       └── FontSelector.tsx                ✨ NEW
│
├── libs/
│   ├── rich-text/
│   │   └── sanitizeHtml.ts                 ✨ NEW
│   │
│   ├── templates/
│   │   ├── templateRegistry.ts             ✨ NEW
│   │   │
│   │   ├── shared/
│   │   │   ├── TemplatePage.tsx            ✨ NEW
│   │   │   ├── GenericSection.tsx          ✨ NEW
│   │   │   ├── sectionMapper.tsx           ✨ NEW
│   │   │   ├── HelperComponents.tsx        ✨ NEW
│   │   │   ├── RatingComponents.tsx        ✨ NEW
│   │   │   └── cssVariables.ts             ✨ NEW
│   │   │
│   │   ├── professional/
│   │   │   ├── ProfessionalTemplate.tsx    ✨ NEW (7 templates)
│   │   │   ├── styles.css
│   │   │   └── print.css
│   │   │
│   │   └── [6 more template folders]       ✨ NEW
│   │
│   ├── exporters/
│   │   ├── templateRenderer.ts             📝 UPDATED
│   │   └── pdfGenerator.ts                 📝 UPDATED
│   │
│   └── validation/
│       └── resume.ts                       📝 UPDATED
│
├── types/
│   ├── resume.ts                           📝 UPDATED (custom, layout)
│   └── template.ts                         📝 UPDATED
│
├── hooks/
│   └── useDialog.ts                        ✨ NEW
│
└── docs/
    ├── templates/
    │   ├── README.md                       ✨ NEW
    │   └── TEMPLATE_GUIDE.md               ✨ NEW
    ├── editor/
    │   ├── RICH_TEXT.md                    ✨ NEW
    │   └── SECTIONS.md                     ✨ NEW
    └── customization/
        └── THEMES.md                       ✨ NEW
```

**Legend**:
- ✨ NEW = Created during adoption
- 📝 UPDATED = Modified during adoption

---

## Agent Deployment Map

```
Phase 1: Schema Evolution
    Agent-1 ──► Types & Validation

Phase 2: Rich Text Editor
    Agent-2A ──► RichInput Component
    Agent-2B ──► Sanitization & Integration

Phase 3: Custom Sections
    Agent-3A ──► UI Components
    Agent-3B ──► Store Operations

Phase 4: Template Architecture
    Agent-4A ──► TemplatePage & GenericSection
    Agent-4B ──► Section Mapping
    Agent-4C ──► Section Components

Phase 5: Template Extraction ⭐ PARALLEL
    Agent-5A ──► Professional
    Agent-5B ──► Timeline
    Agent-5C ──► Modern
    Agent-5D ──► Executive
    Agent-5E ──► Academic
    Agent-5F ──► Creative
    Agent-5G ──► Bold

Phase 6: CSS Theming
    Agent-6 ──► CSS Variables & UI

Phase 7: Section Patterns
    Agent-7A ──► Summary Pattern
    Agent-7B ──► Item-Based Pattern

Phase 8: PDF Export
    Agent-8A ──► Renderer Updates
    Agent-8B ──► Testing & Print CSS

Phase 9: Integration & Testing
    Agent-9A ──► E2E Tests
    Agent-9B ──► Browser Tests
    Agent-9C ──► Performance Tests

Phase 10: Documentation
    Agent-10 ──► All Docs

Phase 11: Optimization
    Agent-11A ──► Performance
    Agent-11B ──► Accessibility
```

---

## Key Innovations from RR

### 1. Layout-as-Data
**Problem**: Hard-coded template layouts
**Solution**: `pages → columns → sections` array structure
**Benefit**: Templates adapt to any section arrangement

### 2. Generic Section Component
**Problem**: Every template needs to implement every section
**Solution**: Property-key based data extraction
**Benefit**: Custom sections work automatically

### 3. CSS Variable Theming
**Problem**: Theme changes require React re-render
**Solution**: CSS variables updated at runtime
**Benefit**: Instant theme updates, no re-render

### 4. Two Section Patterns
**Problem**: One-size-fits-all section editing
**Solution**: Summary (inline) vs Item-based (dialog)
**Benefit**: Right UX for different data types

### 5. Drag-Drop with @dnd-kit
**Problem**: Manual reordering is tedious
**Solution**: Accessible drag-drop library
**Benefit**: Keyboard + mouse reordering

---

**This architecture document provides a visual reference for understanding the adopted system.**
