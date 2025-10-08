# ResumePair: Current Implementation State

**Document Purpose**: Comprehensive map of the current ResumePair implementation
**Date**: 2025-10-08
**Focus**: Resume editor (primary), Cover letter editor (secondary)

---

## 1. Editor Implementation

### 1.1 Resume Editor
**File**: `/app/(app)/editor/[id]/page.tsx`

#### Layout Structure
```
┌─────────────────────────────────────────────────────────────┐
│ EditorHeader (title, save status, undo/redo)                │
├──────────────────┬──────────────────────────────────────────┤
│ Left Sidebar     │ Right Content Area (Tabs)                │
│ (420px width)    │                                          │
│                  │ ┌────────────────────────────────────┐   │
│ AI Tool Tab      │ │ Preview Tab                        │   │
│ - UnifiedAITool  │ │ - LivePreview                      │   │
│                  │ │ - UnifiedStreamOverlay             │   │
│ Traditional      │ │ - PreviewControls                  │   │
│ Editor Tab       │ └────────────────────────────────────┘   │
│ - EditorSidebar  │                                          │
│ - Version Hist.  │ ┌────────────────────────────────────┐   │
│ - Section Forms  │ │ Customize Tab                      │   │
│                  │ │ - CustomizationPanel               │   │
│                  │ └────────────────────────────────────┘   │
│                  │                                          │
│                  │ ┌────────────────────────────────────┐   │
│                  │ │ Score Tab                          │   │
│                  │ │ - ScorePanel                       │   │
│                  │ └────────────────────────────────────┘   │
└──────────────────┴──────────────────────────────────────────┘
```

#### Key Features
- ✅ **Dual sidebar tabs**: AI Tool vs Traditional Editor (lines 183-253)
- ✅ **Three right-side tabs**: Preview / Customize / Score (lines 258-283)
- ✅ **Intersection observer**: Auto-highlights active section on scroll (lines 105-131)
- ✅ **Temporal state**: Undo/redo with Zustand temporal middleware (line 75)
- ✅ **Auto-save**: Triggers save on data changes
- ✅ **Version history**: Dialog to restore previous versions (lines 285-290)

#### Section Components Used
All sections rendered inside `EditorForm` with `SectionAccordion` wrappers:
1. ProfileSection (lines 210-212)
2. SummarySection (lines 214-216)
3. WorkSection (lines 218-220)
4. EducationSection (lines 222-224)
5. ProjectsSection (lines 226-228)
6. SkillsSection (lines 230-232)
7. CertificationsSection (lines 234-236)
8. AwardsSection (lines 238-240)
9. LanguagesSection (lines 242-244)
10. ExtrasSection (lines 246-248)

### 1.2 Cover Letter Editor
**File**: `/app/(app)/cover-letter-editor/[id]/page.tsx`

#### Key Differences from Resume Editor
- ❌ **No Score tab** (only Preview + Customize tabs)
- ✅ **Inline forms** instead of section components (lines 292-417)
- ✅ **RichTextEditor** for body content (line 383-387)
- ✅ **PDF export button** in preview tab (lines 437-448)
- ✅ **Select dropdowns** for salutation/closing (lines 362-416)

#### Cover Letter Sections
1. **Your Info** (from): fullName, email, phone (lines 292-326)
2. **Recipient** (to): recipientName, recipientTitle, companyName (lines 328-360)
3. **Salutation**: Dropdown select (lines 362-379)
4. **Body**: RichTextEditor with RichTextBlock[] (lines 381-389)
5. **Closing**: Dropdown select (lines 391-417)

---

## 2. Section Components (Resume)

**Location**: `/components/editor/sections/`

### 2.1 ProfileSection.tsx
```typescript
Fields captured:
- profile.fullName (TextField, required)
- profile.headline (TextField, max 200 chars)
- profile.email (TextField, required)
- profile.phone (TextField)
- profile.location.city, region, country, postal (TextFields)
- profile.links[] (ArrayField with type, label, url)
```

**Data structure**:
```typescript
{
  fullName: string
  headline?: string
  email: string
  phone?: string
  location?: { city, region, country, postal }
  links?: Array<{ type, label, url }>
}
```

✅ **Good**: Comprehensive contact info
❌ **Missing**: Photo upload UI (schema has `photo?: { url, path }` but no editor field)

### 2.2 SummarySection.tsx
```typescript
Fields: summary (TextAreaField, max 500 chars, 6 rows)
```

✅ **Good**: Simple, focused
❌ **Missing**: Rich text formatting (bullet points, bold/italic)
❌ **Missing**: AI suggestions inline

### 2.3 WorkSection.tsx
```typescript
Fields per entry (ArrayField, max 15):
- company (TextField, required)
- role (TextField, required)
- location (TextField)
- startDate (DateField, required)
- endDate (DateField, allowPresent)
- descriptionBullets[] (ArrayField → TextAreaField, max 10)
- techStack[] (ArrayField → TextField, max 20)
```

**Data structure**:
```typescript
{
  company: string
  role: string
  location?: string
  startDate: string
  endDate?: string | null | 'Present'
  descriptionBullets?: string[]
  techStack?: string[]
}
```

✅ **Good**: Robust work experience capture
❌ **Missing**: `achievements[]` field (exists in schema but not in editor)
❌ **Missing**: Drag-and-drop reordering bullets
❌ **Missing**: Rich text in bullets

### 2.4 EducationSection.tsx
```typescript
Fields per entry (ArrayField, max 10):
- school (TextField, required)
- degree (TextField, required)
- field (TextField)
- startDate (DateField)
- endDate (DateField)
- details[] (ArrayField → TextAreaField, max 5)
```

✅ **Good**: Standard education fields
❌ **Missing**: GPA field (commonly needed)
❌ **Missing**: Honors/awards toggle

### 2.5 ProjectsSection.tsx
```typescript
Fields per entry (ArrayField, max 10):
- name (TextField, required)
- link (LinkField)
- summary (TextAreaField, max 300 chars)
- bullets[] (ArrayField → TextAreaField, max 8)
- techStack[] (ArrayField → TextField, max 15)
```

✅ **Good**: Tech-focused project structure
❌ **Missing**: Date range (start/end dates)
❌ **Missing**: Role/team size context

### 2.6 SkillsSection.tsx
```typescript
Fields per group (ArrayField, max 10):
- category (TextField, required, e.g., "Programming Languages")
- items[] (ArrayField → TextField, max 20 per category)
```

**Data structure**:
```typescript
{
  category: string
  items: string[]
}
```

✅ **Good**: Categorized skill groups
❌ **Missing**: Skill level/proficiency (no sliders, no ratings)
❌ **Missing**: Years of experience per skill
❌ **Missing**: Visual skill bars/chips
🔍 **Note**: Very basic compared to modern resume builders

### 2.7 CertificationsSection.tsx
```typescript
Fields per entry (ArrayField, max 10):
- name (TextField, required)
- issuer (TextField, required)
- date (DateField)
```

✅ **Good**: Simple, effective
❌ **Missing**: Expiration date
❌ **Missing**: Credential ID/URL

### 2.8 AwardsSection.tsx
```typescript
Fields per entry (ArrayField, max 10):
- name (TextField, required)
- org (TextField, required)
- date (DateField)
- summary (TextAreaField, max 200 chars)
```

✅ **Good**: Adequate coverage

### 2.9 LanguagesSection.tsx
```typescript
Fields per entry (ArrayField, max 10):
- name (TextField, required)
- level (SelectField, required)
  Options: Native, Fluent, Professional, Conversational, Elementary
```

✅ **Good**: Proper proficiency levels
❌ **Missing**: Visual proficiency indicators (progress bars)

### 2.10 ExtrasSection.tsx
```typescript
Fields per entry (ArrayField, max 5):
- title (TextField, required, e.g., "Volunteer Work")
- content (TextAreaField, max 500 chars)
```

✅ **Good**: Flexible custom sections
❌ **Missing**: Structured templates (e.g., volunteer = org + role + dates)

---

## 3. Field Components

**Location**: `/components/editor/fields/`

### 3.1 TextField.tsx
- Uses `react-hook-form` with FormField/FormControl
- Props: name, label, placeholder, required, maxLength, disabled
- Returns: Input component with validation

✅ **Capabilities**: Basic text input, maxLength validation
❌ **Limitations**: No rich text, no autocomplete

### 3.2 TextAreaField.tsx
- Props: name, label, placeholder, required, maxLength (default 500), rows, disabled
- Features: Character counter with color coding (90%+ = warning, 100% = error)

✅ **Capabilities**: Multi-line text, character counter
❌ **Limitations**: No rich text, no markdown support, fixed max 500 chars

### 3.3 DateField.tsx
- Uses HTML5 `<input type="month">` (YYYY-MM format)
- Props: name, label, required, disabled, allowPresent
- Converts YYYY-MM to YYYY-MM-01 for storage
- "Present" checkbox for current roles

✅ **Capabilities**: Month/year picker, "Present" option
❌ **Limitations**: No full date picker, awkward UX for month selection

### 3.4 LinkField.tsx
- Auto-formats URLs (adds https:// prefix)
- Icon indicator (LinkIcon from lucide-react)
- Props: name, label, placeholder, required, disabled

✅ **Capabilities**: URL formatting, validation
❌ **Limitations**: No link preview, no social media detection

### 3.5 SelectField.tsx
- Uses shadcn Select component
- Props: name, label, options[], placeholder, required, disabled
- Options format: `{ value: string, label: string }[]`

✅ **Capabilities**: Dropdown selection, keyboard navigation
❌ **Limitations**: Single-select only (no multi-select)

### 3.6 ArrayField.tsx
- Manages dynamic lists with add/remove/reorder
- Features:
  - Add button (respects maxItems limit)
  - Remove button per item (Trash icon)
  - Move up/down buttons (ArrowUp/ArrowDown icons)
  - Keyboard reordering (↑/↓ arrow keys)
  - Numbered items with GripVertical icon
  - Empty state card

✅ **Capabilities**: Full CRUD, drag-like keyboard reordering
❌ **Limitations**: No actual drag-and-drop (only keyboard), no bulk operations

---

## 4. Current Templates

### 4.1 Resume Templates
**Location**: `/libs/templates/`

**Registry**: `/libs/templates/registry.ts`

#### Available Templates (6 total)
1. **minimal** (default)
   - Component: `MinimalTemplate.tsx`
   - Metadata: Simple, ATS-friendly
   - Defaults: No icons, 32px section gap

2. **modern**
   - Component: `ModernTemplate.tsx`
   - Metadata: Contemporary with accent colors
   - Defaults: Icons enabled (outline style), 28px section gap

3. **classic**
   - Component: `ClassicTemplate.tsx`
   - Metadata: Traditional serif design
   - Defaults: Source Serif 4 font, no icons, 20px section gap

4. **creative**
   - Component: `CreativeTemplate.tsx`
   - Metadata: Bold, visual design
   - Defaults: 2-column layout, solid icons, left sidebar

5. **technical**
   - Component: `TechnicalTemplate.tsx`
   - Metadata: Developer-focused
   - Defaults: JetBrains Mono font, 0.95x font size, outline icons

6. **executive**
   - Component: `ExecutiveTemplate.tsx`
   - Metadata: Professional, formal
   - Defaults: Source Serif 4, 1.05x font size, center header, 56px padding

#### Template Structure (from ModernTemplate.tsx)
```typescript
interface TemplateProps {
  data: ResumeJson
  customizations?: Customizations
  mode?: 'edit' | 'preview' | 'print'
}

Components used:
- TemplateBase (wrapper with CSS variables)
- TemplateSection (section title + content)
- TemplateUtils (formatDateRange, formatPhone, formatUrl, formatAddress)
- TemplateIcons (EmailIcon, PhoneIcon, LocationIcon, WorkIcon, etc.)
```

#### How Templates Consume Data
1. Destructure `data` prop: `{ profile, summary, work, education, ... }`
2. Apply `customizations` via CSS variables in TemplateBase
3. Render sections conditionally (e.g., `{summary && <TemplateSection>...}`)
4. Map arrays (work, education, projects) to article elements
5. Format dates, phones, URLs with utility functions
6. Show/hide icons based on `customizations.icons.enabled`

✅ **Good**: Clean React components, reusable utilities, semantic HTML
❌ **Poor**: Hard to extend, CSS-based styling (not Tailwind), no visual builder
🔍 **Note**: These will be DELETED and replaced with Reactive Resume templates

### 4.2 Cover Letter Templates
**Location**: `/libs/templates/cover-letter/`

**Registry**: `/libs/templates/cover-letter/registry.ts`

#### Available Templates (4 total)
1. **classic-block** (default)
2. **modern-minimal**
3. **creative-bold**
4. **executive-formal**

Similar structure to resume templates but adapted for letter format.

---

## 5. Customization System

### 5.1 CustomizationPanel (Resume)
**File**: `/components/customization/CustomizationPanel.tsx`

#### Tabs
1. **Template Tab**
   - TemplateSelector: Grid of template cards with thumbnails
   - Selects from 6 resume templates

2. **Colors Tab**
   - CustomizationPresets: Quick color schemes
   - ColorCustomizer: 7 color pickers (primary, secondary, accent, text, background, muted, border)
   - HSL format: "225 52% 8%"

3. **Typography Tab**
   - TypographyCustomizer: Font family, size scale (0.8-1.2), line height (1.0-1.8), font weight (300-700)
   - IconCustomizer: Enable/disable, style (solid/outline), size (12-24px), color

4. **Spacing Tab**
   - SpacingCustomizer: Section gap (12-48px), item gap (8-24px), page padding (24-96px)

#### Storage
- State: `useTemplateStore` (Zustand with persistence)
- File: `/stores/templateStore.ts`
- LocalStorage key: `template-store`
- Validation: Zod schema with backward-compat coercions
- Default reset: `resetCustomizations()` → template defaults

✅ **Good**: Comprehensive controls, real-time preview, persistent state
❌ **Missing**: Layout customizer (columns, sidebar position) - exists in types but no UI
❌ **Missing**: Presets for specific industries/roles
🔍 **Note**: Customizations stored in templateStore, NOT in resume data

### 5.2 CoverLetterCustomizationPanel
**File**: `/components/customization/CoverLetterCustomizationPanel.tsx`

Similar to resume panel but:
- ❌ **No icons tab** (cover letters don't use icons)
- ✅ **Paragraph gap** slider instead of item gap
- Uses separate store: `useCoverLetterTemplateStore`

---

## 6. Data Flow & Stores

### 6.1 Document Store (Resume)
**File**: `/stores/documentStore.ts`

Uses factory: `createDocumentStore<ResumeJson>`

#### Key Functions
```typescript
{
  // State
  document: ResumeJson | null
  documentId: string | null
  documentTitle: string
  isLoading: boolean
  isSaving: boolean
  lastSaved: Date | null
  saveError: Error | null

  // Actions
  loadDocument(id: string): Promise<void>
  updateDocument(data: ResumeJson): void
  setTitle(title: string): void
  saveDocument(): Promise<void>
}
```

#### Temporal Store (Undo/Redo)
```typescript
useTemporalStore = {
  undo(): void
  redo(): void
  clear(): void
  canUndo: boolean
  canRedo: boolean
}
```

#### Data Flow
```
User edits field
  ↓
TextField onChange → react-hook-form
  ↓
EditorForm onChange(data) → handleChange(data)
  ↓
updateDocument(data) → documentStore
  ↓
Zustand temporal middleware (history tracking)
  ↓
Auto-save debounced → saveDocument() → POST /api/v1/resumes/:id
  ↓
LivePreview subscribes to documentStore
  ↓
RAF-batched update → TemplateRenderer
  ↓
Template renders with new data
```

✅ **Good**: Clean separation, temporal state, optimistic updates
❌ **Missing**: Conflict resolution for concurrent edits
❌ **Missing**: Offline support

### 6.2 Template Store
**File**: `/stores/templateStore.ts`

#### State
```typescript
{
  templateId: TemplateSlug
  customizations: Customizations

  selectTemplate(templateId): void
  updateCustomization(key, value): void
  updateCustomizations(customizations): void
  resetCustomizations(): void
  resetToTemplateDefaults(templateId): void
}
```

#### Persistence
- Uses `zustand/middleware/persist`
- Validates with Zod schema on restore
- Coerces legacy values (e.g., `sidebarPosition: 'none' → null`)
- Falls back to defaults if invalid

✅ **Good**: Persistent across sessions, validated, backward-compatible
❌ **Issue**: Customizations NOT saved in resume.data (only in localStorage)
🔍 **Implication**: Customizations are per-browser, not per-resume

### 6.3 Cover Letter Store
**File**: `/stores/coverLetterStore.ts`

Same pattern as documentStore but for `CoverLetterJson`.

Uses factory: `createDocumentStore<CoverLetterJson>`

Endpoint: `/api/v1/cover-letters`

---

## 7. Types & Schemas

### 7.1 ResumeJson Schema
**File**: `/types/resume.ts`

```typescript
interface ResumeJson {
  profile: Profile
  summary?: string
  work?: WorkExperience[]
  education?: Education[]
  projects?: Project[]
  skills?: SkillGroup[]
  certifications?: Certification[]
  awards?: Award[]
  languages?: Language[]
  extras?: Extra[]
  settings: ResumeSettings
}
```

#### Key Sections
- **Profile**: fullName, headline, email, phone, location, links[], photo?
- **WorkExperience**: company, role, location, startDate, endDate, descriptionBullets[], achievements?, techStack[]
- **Education**: school, degree, field, startDate, endDate, details[]
- **Project**: name, link, summary, bullets[], techStack[]
- **SkillGroup**: category, items[]
- **Certification**: name, issuer, date
- **Award**: name, org, date, summary
- **Language**: name, level
- **Extra**: title, content

#### Settings
```typescript
interface ResumeSettings {
  locale: string // "en-US"
  dateFormat: 'US' | 'ISO' | 'EU'
  fontFamily: string
  fontSizeScale: number // 0.8-1.2
  lineSpacing: number // 1.0-1.5
  colorTheme: string
  iconSet: 'lucide'
  showIcons: boolean
  sectionOrder: string[]
  pageSize: 'A4' | 'Letter'
}
```

✅ **Good**: Comprehensive, well-typed, flexible
❌ **Discrepancy**: Settings in ResumeJson vs Customizations in TemplateStore (duplication)
❌ **Missing**: `achievements[]` in WorkExperience editor but exists in type

### 7.2 CoverLetterJson Schema
**File**: `/types/cover-letter.ts`

```typescript
interface CoverLetterJson {
  from: CoverLetterSender
  to: CoverLetterRecipient
  jobInfo?: JobInfo
  date: string
  salutation: string
  body: RichTextBlock[]
  closing: string
  settings: CoverLetterSettings
}

interface RichTextBlock {
  type: 'paragraph' | 'bullet_list' | 'numbered_list'
  content: TextRun[]
}

interface TextRun {
  text: string
  marks?: ('bold' | 'italic' | 'underline')[]
}
```

✅ **Good**: Rich text support, structured format
❌ **Missing**: Proper RichTextEditor implementation (current editor is basic)

### 7.3 Template Types
**File**: `/types/template.ts`

```typescript
interface Customizations {
  colors: ColorScheme // 7 HSL colors
  typography: Typography // fontFamily, fontSize, lineHeight, fontWeight
  spacing: Spacing // sectionGap, itemGap, pagePadding
  icons: IconSettings // enabled, style, size, color
  layout: LayoutSettings // columns, sidebarPosition, headerAlignment, photoPosition
}
```

✅ **Good**: Comprehensive customization options
❌ **Issue**: Not stored in resume.data (only in templateStore localStorage)
🔍 **Critical**: Customizations are browser-specific, not document-specific

---

## 8. Preview & Rendering

### 8.1 LivePreview
**File**: `/components/preview/LivePreview.tsx`

#### Performance Optimizations
1. **RAF batching**: Updates scheduled with requestAnimationFrame
2. **Shallow selectors**: `useShallow` to prevent unnecessary re-renders
3. **Scroll restoration**: Saves and restores scroll position on updates
4. **Budget monitoring**: Warns if update > 120ms (dev mode)

#### Flow
```typescript
1. Subscribe to documentStore (shallow)
2. On document change:
   - Save scroll position
   - Cancel pending RAF
   - Schedule update in next frame
   - Update preview data (setPreviewData)
   - Restore scroll position
3. Render TemplateRenderer with:
   - templateId (from templateStore)
   - data (from documentStore)
   - customizations (from templateStore)
   - mode: 'preview'
```

✅ **Good**: Smooth updates, scroll preservation, performance-aware
❌ **Missing**: Debouncing for rapid changes
❌ **Missing**: Virtual scrolling for large resumes

### 8.2 TemplateRenderer
Dynamically loads template component from registry and renders with props.

---

## 9. Missing Features & Gaps

### 9.1 Editor Gaps

#### High Priority
- ❌ **Photo upload**: Schema has `profile.photo` but no editor UI
- ❌ **Rich text**: Summary, work bullets, etc. are plain text (no bold, lists)
- ❌ **Skill proficiency**: SkillsSection has no level/rating system
- ❌ **Work achievements**: `WorkExperience.achievements[]` exists in schema but not in editor
- ❌ **Layout customizer**: LayoutSettings exists in types but no UI (columns, sidebar, photo position)

#### Medium Priority
- ❌ **Drag-and-drop reordering**: ArrayField uses keyboard only
- ❌ **GPA field**: Common in education, missing
- ❌ **Project dates**: Projects have no date range
- ❌ **Certification expiration**: No expiry date tracking
- ❌ **Bulk operations**: No select-all/delete-all in ArrayField
- ❌ **Autocomplete**: No suggestions for companies, schools, skills

#### Low Priority
- ❌ **Markdown support**: TextAreaField could support markdown
- ❌ **Link previews**: LinkField could show favicon/preview
- ❌ **Date range validation**: Start date after end date not validated
- ❌ **Character count warnings**: Only TextAreaField has counter, not TextField

### 9.2 Customization Gaps
- ❌ **Per-document customizations**: Currently browser-wide (localStorage), not per-resume
- ❌ **Industry presets**: No "Software Engineer", "Designer", etc. templates
- ❌ **Font upload**: Limited to system fonts
- ❌ **Color picker UI**: Currently manual HSL input (no visual picker)
- ❌ **Preview themes**: Can't preview template before switching

### 9.3 Data Flow Issues
- ❌ **Customizations not saved**: TemplateStore is localStorage only, not synced to backend
- ❌ **Settings duplication**: ResumeSettings vs Customizations overlap (fontFamily, etc.)
- ❌ **Conflict resolution**: No handling for concurrent edits
- ❌ **Offline mode**: No service worker or local cache

### 9.4 Template System Issues
- ❌ **Hard to extend**: Templates are React components, not data-driven
- ❌ **CSS-based**: Custom CSS files, not Tailwind (inconsistent with app)
- ❌ **No visual builder**: Can't create new templates without coding
- 🔍 **Replacement needed**: Reactive Resume template system is superior

---

## 10. What Works Well

### 10.1 Architecture Strengths
- ✅ **Clean separation**: Editor ↔ Store ↔ Preview is well-architected
- ✅ **Temporal state**: Undo/redo "just works" with Zustand middleware
- ✅ **Type safety**: Full TypeScript coverage, well-typed schemas
- ✅ **Performance**: RAF batching keeps preview smooth (<120ms)
- ✅ **Validation**: Zod schemas prevent corrupt data

### 10.2 UX Strengths
- ✅ **Dual mode**: AI Tool + Traditional Editor gives flexibility
- ✅ **Three tabs**: Preview + Customize + Score is logical
- ✅ **Auto-save**: Users don't worry about losing work
- ✅ **Version history**: Can restore previous versions
- ✅ **Intersection observer**: Auto-highlights active section

### 10.3 Component Quality
- ✅ **ArrayField**: Robust add/remove/reorder with keyboard support
- ✅ **DateField**: "Present" checkbox is user-friendly
- ✅ **LinkField**: Auto-formats URLs (https://)
- ✅ **TextAreaField**: Character counter with visual feedback

---

## 11. Summary: Adoption Path

### 11.1 Keep (Reuse)
- ✅ Editor layout structure (left sidebar + right tabs)
- ✅ Section accordion pattern
- ✅ Field components (TextField, TextAreaField, DateField, ArrayField)
- ✅ Data flow architecture (documentStore → preview)
- ✅ Temporal state (undo/redo)
- ✅ Type definitions (ResumeJson, CoverLetterJson)

### 11.2 Replace (Delete)
- ❌ All template components in `/libs/templates/` (6 resume + 4 cover letter)
- ❌ Template registry system
- ❌ TemplateBase, TemplateSection, TemplateUtils, TemplateIcons
- ❌ CustomizationPanel (will be replaced with Reactive Resume theme system)

### 11.3 Enhance (Improve)
- 🔍 **Section components**: Add missing fields (photo, achievements, skill levels)
- 🔍 **Rich text**: Upgrade Summary, Work bullets to TipTap editor
- 🔍 **Customizations**: Save in resume.data, not localStorage
- 🔍 **Layout controls**: Add UI for columns, sidebar, photo position
- 🔍 **Drag-and-drop**: Upgrade ArrayField to use dnd-kit

### 11.4 Integration Points
When adopting Reactive Resume templates:
1. **Data mapping**: ResumeJson → Reactive Resume JSON schema
2. **Preview integration**: Replace TemplateRenderer with Reactive Resume renderer
3. **Customization**: Map Reactive Resume theme system to our CustomizationPanel
4. **PDF export**: Use Reactive Resume's PDF generation
5. **Template gallery**: Reactive Resume templates + metadata → TemplateSelector

---

## Appendix: File Reference

### Key Files
- Editor: `/app/(app)/editor/[id]/page.tsx`
- Cover Letter Editor: `/app/(app)/cover-letter-editor/[id]/page.tsx`
- Sections: `/components/editor/sections/*.tsx` (10 files)
- Fields: `/components/editor/fields/*.tsx` (6 files)
- Document Store: `/stores/documentStore.ts`
- Template Store: `/stores/templateStore.ts`
- Types: `/types/resume.ts`, `/types/cover-letter.ts`, `/types/template.ts`
- Templates: `/libs/templates/` (to be deleted)
- Customization: `/components/customization/CustomizationPanel.tsx`
- Preview: `/components/preview/LivePreview.tsx`
- Score: `/components/score/ScorePanel.tsx`

### Data Flow Summary
```
User Input
  ↓ (react-hook-form)
EditorForm
  ↓ (onChange)
documentStore.updateDocument()
  ↓ (Zustand temporal middleware)
History tracking (undo/redo)
  ↓ (auto-save debounced)
POST /api/v1/resumes/:id
  ↓ (subscription)
LivePreview (RAF-batched)
  ↓ (TemplateRenderer)
Template Component (to be replaced)
  ↓ (PDF export)
/api/v1/resumes/:id/export-pdf
```

---

**End of Document**
