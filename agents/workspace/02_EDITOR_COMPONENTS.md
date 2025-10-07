# Editor Components Analysis

**Date**: 2025-10-07
**Phase**: 2 - Editor Components Exploration

## Overview

The editor system uses a three-column layout with:
1. **Left sidebar**: AI Tool / Traditional Editor (tabbed)
2. **Center panel**: Live preview with tabs (Preview / Customize / Score)
3. **Form-based editing**: React Hook Form + Zod validation

The system features real-time auto-save (2s debounce), undo/redo support (via Zundo), and optimistic locking for concurrent editing.

---

## Architecture Overview

### Component Hierarchy

```
EditorPage (app/(app)/editor/[id]/page.tsx)
├── EditorLayout (layout wrapper)
│   ├── EditorHeader (title, save status, undo/redo)
│   ├── Sidebar (left - 420px wide)
│   │   ├── Tabs (AI Tool / Traditional Editor)
│   │   │   ├── UnifiedAITool (AI-powered editing)
│   │   │   └── Traditional Editor Tab
│   │   │       ├── EditorSidebar (section navigation)
│   │   │       ├── VersionHistory (button)
│   │   │       └── EditorForm
│   │   │           └── SectionAccordion[] (10 sections)
│   │   │               └── Section Components
│   │   │                   └── Field Components
│   └── Main Content (center)
│       └── Tabs (Preview / Customize / Score)
│           ├── LivePreview + UnifiedStreamOverlay
│           ├── CustomizationPanel
│           └── ScorePanel
└── VersionHistory (modal)
```

---

## Core Components

### 1. EditorPage (`app/(app)/editor/[id]/page.tsx`)

**Lines**: 295 total
**Role**: Main orchestrator for the editor experience

#### State Management (`lines 56-73`)
```typescript
const {
  document: resumeDocument,
  documentId,
  documentTitle,
  isLoading,
  isSaving,
  lastSaved,
  saveError,
  loadDocument,
  updateDocument,
  setTitle,
  saveDocument,
} = useDocumentStore()

const { undo, redo, clear, canUndo, canRedo } = useTemporalStore()
```

**Key Hooks**:
- `useDocumentStore`: Zustand store with temporal (undo/redo) support
- `useTemporalStore`: Exposes undo/redo actions and state
- `useParams`: Gets `id` from route
- `useToast`: Displays save/error notifications

#### Lifecycle (`lines 91-131`)

1. **Document Load** (`lines 91-97`):
   ```typescript
   React.useEffect(() => {
     if (resumeId) {
       loadDocument(resumeId)
     }
     return () => { clear() } // Clear undo history on unmount
   }, [resumeId])
   ```

2. **Error Handling** (`lines 99-103`):
   - Displays toast on save errors

3. **Active Section Tracking** (`lines 106-131`):
   - Uses `IntersectionObserver` to highlight active section in sidebar
   - Threshold: 50% visibility
   - Root margin: `-100px 0px -50% 0px` (sticky header compensation)
   - Updates `activeSection` state based on scroll position

#### Section Definitions (`lines 78-89`)

10 sections defined with metadata:
```typescript
const sections = React.useMemo(() => [
  { id: 'profile', label: 'Profile', icon: <User />, description: '...' },
  { id: 'summary', label: 'Summary', ... },
  { id: 'work', label: 'Work Experience', ... },
  { id: 'education', ... },
  { id: 'projects', ... },
  { id: 'skills', ... },
  { id: 'certifications', ... },
  { id: 'awards', ... },
  { id: 'languages', ... },
  { id: 'extras', label: 'Additional', ... },
], [])
```

#### Data Flow (`lines 133-148`)

**User edits form**:
```typescript
handleChange = (data: ResumeJson) => updateDocument(data)
  ↓
updateDocument() in store
  ↓
Debounced auto-save (2s)
  ↓
saveDocument() → API PUT /api/v1/resumes/:id
```

**Manual save**:
```typescript
handleSubmit = async () => {
  await saveDocument()
  toast({ title: 'Saved' })
}
```

**Version restore** (`lines 144-148`):
```typescript
handleRestoreVersion = async (versionNumber: number) => {
  await fetch(`/api/v1/resumes/${resumeId}/versions/${versionNumber}/restore`,
    { method: 'POST' })
  await loadDocument(resumeId) // Reload document
}
```

#### Layout Structure (`lines 167-292`)

**Header** (`lines 169-180`):
- Editable title
- Save status indicator (saving/saved/error)
- Last saved timestamp
- Undo/Redo buttons with enabled state

**Sidebar Tabs** (`lines 182-253`):
- **AI Tool tab**: `UnifiedAITool` component
- **Traditional Editor tab**:
  - Section navigation (`EditorSidebar`)
  - Version history button
  - Scrollable form with 10 accordion sections

**Main Content Tabs** (`lines 258-283`):
- **Preview**: `LivePreview` + `UnifiedStreamOverlay` (AI streaming)
- **Customize**: `CustomizationPanel` (colors, fonts, layout)
- **Score**: `ScorePanel` (ATS scoring)

---

### 2. EditorLayout (`components/editor/EditorLayout.tsx`)

**Lines**: 53 total
**Role**: Flex-based layout wrapper

#### Structure (`lines 22-50`)
```typescript
<div className="h-full flex flex-col">
  {/* Header - fixed */}
  <div className="flex-shrink-0 z-50 border-b">
    {header}
  </div>

  {/* Main Content - flex grow */}
  <div className="flex-1 flex overflow-hidden">
    {/* Sidebar - 420px (configurable) */}
    <aside className="w-60 border-r overflow-hidden">
      {sidebar}
    </aside>

    {/* Editor Content - flex grow */}
    <main className="flex-1 overflow-hidden">
      {children}
    </main>
  </div>
</div>
```

**Props** (`lines 6-12`):
- `children`: Main content area
- `sidebar`: Left sidebar content
- `header`: Top header
- `sidebarClassName`: Custom sidebar width (default: `w-60`, overridden to `w-[420px]`)
- `sidebarMobileVisible`: Show sidebar on mobile (default: hidden)

**Key CSS Classes**:
- `overflow-hidden` + `min-h-0`: Forces flex children to scroll independently
- `flex-shrink-0`: Prevents header from shrinking
- `flex-1`: Allows main content to fill available space

---

### 3. EditorForm (`components/editor/EditorForm.tsx`)

**Lines**: 63 total
**Role**: React Hook Form wrapper with Zod validation

#### Setup (`lines 27-31`)
```typescript
const methods = useForm<ResumeJson>({
  resolver: zodResolver(ResumeJsonSchema), // Zod validation
  defaultValues: document,
  mode: 'onBlur', // Validate on blur
})
```

#### Change Detection (`lines 34-41`)
```typescript
React.useEffect(() => {
  const subscription = methods.watch((data) => {
    if (onChange && data) {
      onChange(data as ResumeJson) // Propagate to parent
    }
  })
  return () => subscription.unsubscribe()
}, [methods, onChange])
```

**Flow**:
1. User edits field
2. React Hook Form updates internal state
3. `watch()` detects change
4. `onChange` callback triggered
5. Parent's `handleChange` → `updateDocument()` in store
6. Store triggers auto-save after 2s debounce

#### Document ID Tracking (`lines 44-50`)
```typescript
const prevDocIdRef = React.useRef<string | null>(null)
React.useEffect(() => {
  if (prevDocIdRef.current !== documentId) {
    methods.reset(document) // Reset form when switching documents
    prevDocIdRef.current = documentId
  }
}, [documentId, document, methods])
```

**Purpose**: Prevents form state from bleeding between documents

#### Form Structure (`lines 52-60`)
```typescript
<FormProvider {...methods}>
  <form onSubmit={methods.handleSubmit(onSubmit)}>
    {children} {/* Section accordions rendered here */}
  </form>
</FormProvider>
```

**FormProvider**: Makes form context available to nested field components via `useFormContext()`

---

## Section Components

### 4. ProfileSection (`components/editor/sections/ProfileSection.tsx`)

**Lines**: 99 total
**Role**: Personal info and contact details

#### Structure
```typescript
<div className="space-y-6">
  {/* Name and Headline */}
  <TextField name="profile.fullName" required />
  <TextField name="profile.headline" maxLength={200} />

  {/* Email and Phone */}
  <TextField name="profile.email" required />
  <TextField name="profile.phone" />

  {/* Location (nested object) */}
  <h3>Location</h3>
  <TextField name="profile.location.city" />
  <TextField name="profile.location.region" />
  <TextField name="profile.location.country" />
  <TextField name="profile.location.postal" />

  {/* Links array */}
  <ArrayField name="profile.links" emptyItem={{...}} maxItems={10}>
    {(index) => (
      <>
        <TextField name={`profile.links.${index}.type`} />
        <TextField name={`profile.links.${index}.label`} />
        <LinkField name={`profile.links.${index}.url`} required />
      </>
    )}
  </ArrayField>
</div>
```

**Key Features**:
- Grid layout (2 columns on md+)
- Nested object support (`profile.location.city`)
- Dynamic arrays via `ArrayField` component
- Link validation via `LinkField` component

---

### 5. WorkSection (`components/editor/sections/WorkSection.tsx`)

**Lines**: 104 total
**Role**: Work experience entries

#### Structure (`lines 26-101`)
```typescript
<ArrayField name="work" emptyItem={emptyWork} maxItems={15}>
  {(index) => (
    <div className="space-y-4">
      {/* Company and Role */}
      <TextField name={`work.${index}.company`} required />
      <TextField name={`work.${index}.role`} required />

      {/* Location */}
      <TextField name={`work.${index}.location`} />

      {/* Date range */}
      <DateField name={`work.${index}.startDate`} required />
      <DateField name={`work.${index}.endDate`} allowPresent />

      {/* Description bullets (nested array) */}
      <ArrayField name={`work.${index}.descriptionBullets`} maxItems={10}>
        {(bulletIndex) => (
          <TextAreaField
            name={`work.${index}.descriptionBullets.${bulletIndex}`}
            rows={2}
            maxLength={200}
          />
        )}
      </ArrayField>

      {/* Tech stack (nested array) */}
      <ArrayField name={`work.${index}.techStack`} maxItems={20}>
        {(techIndex) => (
          <TextField name={`work.${index}.techStack.${techIndex}`} />
        )}
      </ArrayField>
    </div>
  )}
</ArrayField>
```

**Empty Work Item** (`lines 10-19`):
```typescript
const emptyWork = {
  company: '',
  role: '',
  location: '',
  startDate: '',
  endDate: null,
  descriptionBullets: [],
  achievements: [],
  techStack: [],
}
```

**Pattern**: Nested `ArrayField` components for multi-level arrays (work → bullets, work → tech stack)

---

## Field Components

### 6. TextField (`components/editor/fields/TextField.tsx`)

Basic text input with React Hook Form integration:
- Uses `useFormContext()` to access form state
- `Controller` component for controlled input
- Validation via Zod schema
- Error display below input

### 7. ArrayField (`components/editor/fields/ArrayField.tsx`)

Dynamic array management:
- Add/Remove buttons
- Reorder support (drag-and-drop - inferred from imports)
- Render prop pattern: `children(index)`
- Max items limit

### 8. DateField (`components/editor/fields/DateField.tsx`)

Date input with:
- ISO format (YYYY-MM-DD)
- Optional "Present" toggle for end dates
- Validation via Zod regex

### 9. TextAreaField (`components/editor/fields/TextAreaField.tsx`)

Multi-line text input:
- Configurable rows
- Character count display
- Max length validation

### 10. LinkField (`components/editor/fields/LinkField.tsx`)

URL input with:
- URL validation
- Link preview/test button (inferred)

---

## State Management (Zustand)

### 11. documentStore (`stores/documentStore.ts`)

**Lines**: 42 total
**Role**: Resume-specific store instance

Created via factory function:
```typescript
export const useDocumentStore = createDocumentStore<ResumeJson>({
  apiEndpoint: '/api/v1/resumes',
  schemaValidator: ResumeJsonSchema,
})
```

**Exported Hooks**:
- `useDocumentStore`: Main store hook
- `useTemporalStore`: Undo/redo actions
- `selectDocumentForPreview`: Shallow selector (prevents re-renders)
- `selectDocumentMetadata`: Metadata-only selector

---

### 12. createDocumentStore (`stores/createDocumentStore.ts`)

**Lines**: 404 total
**Role**: Generic document store factory with undo/redo

#### Factory Configuration (`lines 21-28`)
```typescript
interface DocumentStoreConfig<T> {
  apiEndpoint: string              // '/api/v1/resumes' or '/api/v1/cover-letters'
  schemaValidator: ZodType<T>      // Zod schema for validation
  defaultDocument?: () => T        // Optional factory for empty document
}
```

#### Store State (`lines 33-62`)
```typescript
interface DocumentState<T> {
  // Current document
  document: T | null
  documentId: string | null
  documentVersion: number | null   // For optimistic locking
  documentTitle: string | null

  // Loading state
  isLoading: boolean

  // Original document (for dirty check)
  originalDocument: T | null

  // Save state
  isDirty: boolean
  isSaving: boolean
  lastSaved: Date | null
  saveError: Error | null

  // Actions
  loadDocument: (id: string) => Promise<void>
  updateDocument: (updates: Partial<T>) => void
  setTitle: (title: string) => void
  saveDocument: () => Promise<void>
  resetChanges: () => void
  clearDocument: () => void

  // Computed
  hasChanges: boolean
}
```

#### Key Actions

**1. loadDocument** (`lines 112-143`):
```typescript
loadDocument: async (id: string) => {
  set({ isLoading: true })

  const response = await fetch(`${apiEndpoint}/${id}`)
  const doc = result.data

  set({
    document: doc.data,              // ResumeJson
    documentId: doc.id,
    documentVersion: doc.version,    // For optimistic locking
    documentTitle: doc.title,
    originalDocument: JSON.parse(JSON.stringify(doc.data)), // Deep copy
    isDirty: false,
    lastSaved: new Date(doc.updated_at),
    hasChanges: false,
  })
}
```

**2. updateDocument** (`lines 149-194`):
```typescript
updateDocument: (updates: Partial<T>) => {
  const nextDocument = { ...currentDocument, ...updates }

  // Skip if no change (deep equality check)
  if (isEqual(nextDocument, currentDocument)) return

  // Check if dirty
  const isDirty = !isEqual(nextDocument, originalDocument)

  set({ document: nextDocument, isDirty, hasChanges: isDirty })

  // Debounced auto-save (2 seconds)
  clearTimeout(existingTimer)
  const newTimer = setTimeout(() => {
    if (isDirty && !isSaving) {
      saveDocument()
    }
  }, 2000)

  autoSaveTimers.set(timerKey, newTimer)
}
```

**Pattern**:
- Deep equality check via `lodash/isEqual` (prevents unnecessary updates)
- 2-second debounce timer (cleared and reset on each change)
- Auto-save only if dirty and not already saving

**3. saveDocument** (`lines 227-293`):
```typescript
saveDocument: async () => {
  // Build minimal payload
  const updates: any = { version: documentVersion } // Required for locking

  // Include title only if changed
  if (documentTitle?.trim()) {
    updates.title = documentTitle.trim()
  }

  // Include data only if changed AND valid
  if (!isEqual(document, originalDocument)) {
    const parsed = schemaValidator.safeParse(document)
    if (parsed.success) {
      updates.data = document
    }
  }

  // Skip if nothing to update
  if (Object.keys(updates).length === 1) return // Only version

  const response = await fetch(`${apiEndpoint}/${documentId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  })

  const updatedDoc = result.data

  set({
    document: updatedDoc.data,
    documentVersion: updatedDoc.version, // Incremented by server
    originalDocument: JSON.parse(JSON.stringify(updatedDoc.data)),
    isDirty: false,
    lastSaved: new Date(updatedDoc.updated_at),
    hasChanges: false,
  })
}
```

**Key Features**:
- **Minimal updates**: Only sends changed fields
- **Optimistic locking**: Includes `version` field (server validates)
- **Schema validation**: Zod check before save
- **No-op optimization**: Skips API call if nothing changed

#### Temporal (Undo/Redo) Integration (`lines 334-347`)

```typescript
temporal(
  (set, get) => ({ /* store state */ }),
  {
    limit: 50, // Keep last 50 states
    partialize: (state) => ({
      document: state.document, // Only track document changes
    }),
    equality: (a, b) => {
      // Custom equality to avoid duplicate history entries
      return JSON.stringify(a.document) === JSON.stringify(b.document)
    },
  }
)
```

**Library**: `zundo` (Zustand middleware for undo/redo)

**Configuration**:
- History limit: 50 states
- Only document content tracked (not loading/saving state)
- JSON equality check (prevents duplicate snapshots)

---

## API Routes

### 13. GET /api/v1/resumes/:id (`app/api/v1/resumes/[id]/route.ts`)

**Lines**: 20-42

```typescript
export const GET = withAuth(
  async (req, user, { params }) => {
    const supabase = createClient()
    const resume = await getResume(supabase, params.id)
    return apiSuccess(resume)
  }
)
```

**Flow**:
1. `withAuth` middleware authenticates user
2. Create user-scoped Supabase client
3. `getResume` repository function (RLS enforces ownership)
4. Return JSON response

**Error Handling**:
- 404 if not found
- 500 for other errors

---

### 14. PUT /api/v1/resumes/:id (`app/api/v1/resumes/[id]/route.ts`)

**Lines**: 48-101

```typescript
export const PUT = withAuth(
  async (req, user, { params }) => {
    const body = await req.json()

    // Validate with Zod
    const result = UpdateResumeSchema.safeParse(body)
    if (!result.success) {
      return apiError(400, 'Validation failed', result.error.format())
    }

    const { title, data, version } = result.data

    // Update with optimistic locking
    const updatedResume = await updateResume(supabase, id, { title, data }, version)

    return apiSuccess(updatedResume)
  }
)
```

**Key Points**:
- `version` field required (Zod validation)
- Repository function checks version match
- Returns 409 CONFLICT if version mismatch
- Server increments version on success

---

### 15. POST /api/v1/resumes (`app/api/v1/resumes/route.ts`)

**Lines**: 57-109

```typescript
export const POST = withAuth(async (req, user) => {
  const { title, template_id } = CreateResumeSchema.parse(body)

  // Get user profile for defaults
  const profile = await getProfile(supabase, user.id)

  // Create empty resume with user preferences
  const initialData = createEmptyResume(
    user.email,
    profile.full_name,
    {
      locale: profile.locale,
      dateFormat: profile.date_format,
      pageSize: profile.page_size,
    }
  )

  const resume = await createResume(supabase, user.id, title, initialData)

  return apiSuccess(resume)
})
```

**Flow**:
1. Parse and validate input
2. Fetch user profile (for locale/date format preferences)
3. Create empty resume with defaults
4. Insert into database
5. Return new resume

**Note**: Template support mentioned but not implemented (`template_id` parameter exists but unused)

---

## Data Repository

### 16. getResume (`libs/repositories/documents.ts`)

Located in repository layer (not read completely in excerpt, but inferred):

```typescript
export async function getResume(
  supabase: SupabaseClient,
  id: string
): Promise<Resume> {
  const { data, error } = await supabase
    .from('resumes')
    .select('*')
    .eq('id', id)
    .eq('is_deleted', false)
    .single()

  if (error) throw new Error('Failed to fetch resume')
  if (!data) throw new Error('Resume not found')

  return data as Resume
}
```

**Pattern**: Pure function, dependency injection (Supabase client as parameter)

---

### 17. updateResume (`libs/repositories/documents.ts`)

```typescript
export async function updateResume(
  supabase: SupabaseClient,
  id: string,
  updates: { title?: string; data?: Partial<ResumeJson> },
  expectedVersion: number
): Promise<Resume> {
  // 1. Fetch current document
  const current = await getResume(supabase, id)

  // 2. Check version (optimistic locking)
  if (current.version !== expectedVersion) {
    throw new Error('CONFLICT: Document was modified by another process')
  }

  // 3. Create version snapshot
  await supabase
    .from('resume_versions')
    .insert({
      resume_id: id,
      version_number: current.version,
      data: current.data,
      created_by: current.user_id,
    })

  // 4. Update document and increment version
  const { data, error } = await supabase
    .from('resumes')
    .update({
      title: updates.title,
      data: updates.data ? { ...current.data, ...updates.data } : current.data,
      version: current.version + 1,
    })
    .eq('id', id)
    .eq('version', expectedVersion) // Double-check in WHERE clause
    .select()
    .single()

  if (error) throw new Error('Failed to update resume')

  return data as Resume
}
```

**Optimistic Concurrency Control**:
1. Read current version
2. Validate expected version matches
3. Create immutable snapshot in `resume_versions`
4. Update with version check in WHERE clause
5. Increment version atomically

**Failure Modes**:
- If another client updated first, version mismatch → 409 CONFLICT
- Client must reload and retry

---

## Preview System

### 18. LivePreview (`components/preview/LivePreview.tsx`)

Real-time preview component (not fully read, but inferred from imports):

**Features**:
- Subscribes to `useDocumentStore` (shallow selector)
- Renders selected template with current data
- Updates on every change (debounced via shallow comparison)
- Supports zoom controls, page navigation
- Renders `TemplateRenderer` component

**Props**:
- `documentId`: Resume ID
- `showControls`: Show zoom/page controls (default true)

---

## Key Design Patterns

### 1. Factory Pattern (Document Store)
- `createDocumentStore<T>()` generic factory
- Shared between resume and cover letter stores
- Type-safe via TypeScript generics

### 2. Dependency Injection (Repositories)
- All repository functions accept `supabase` as first param
- Testable without mocking global state
- Supports admin vs user clients

### 3. Optimistic Concurrency Control
- `version` field in database
- Version check before update
- Returns 409 CONFLICT on mismatch
- Client reloads and retries

### 4. Auto-Save with Debouncing
- 2-second debounce timer
- Cleared and reset on each change
- Only saves if dirty
- Deep equality check via `lodash/isEqual`

### 5. Temporal (Undo/Redo)
- Zundo middleware for Zustand
- 50-state history limit
- Only document content tracked
- JSON equality to prevent duplicates

### 6. Form Context (React Hook Form)
- `FormProvider` wraps all sections
- Field components use `useFormContext()`
- Zod validation via resolver
- Watch API for change detection

### 7. Shallow Selectors (Zustand)
- `selectDocumentForPreview`: Returns only `{ content, isLoading }`
- Prevents re-renders when unrelated state changes
- Used in preview components

### 8. Intersection Observer (Scroll Tracking)
- Tracks active section in viewport
- 50% visibility threshold
- Updates sidebar highlight
- Root margin compensates for sticky header

---

## Data Flow Diagram

```
User Types in Field
  ↓
React Hook Form (controlled input)
  ↓
methods.watch() detects change
  ↓
onChange(data) callback
  ↓
EditorPage.handleChange(data)
  ↓
useDocumentStore.updateDocument(data)
  ↓
Store: Deep equality check (lodash/isEqual)
  ↓
If changed:
  - Update document state
  - Set isDirty = true
  - Clear existing auto-save timer
  - Set new timer (2s)
  ↓
After 2 seconds (if no new changes):
  ↓
Store: saveDocument()
  ↓
API: PUT /api/v1/resumes/:id
  - Body: { title?, data?, version }
  ↓
Server: withAuth middleware
  ↓
Zod validation (UpdateResumeSchema)
  ↓
Repository: updateResume(supabase, id, updates, version)
  - Fetch current document
  - Check version match (optimistic locking)
  - Create snapshot in resume_versions
  - Update resumes table with version + 1
  ↓
Response: Updated resume
  ↓
Store: Update state
  - document = response.data
  - documentVersion = response.version
  - originalDocument = deep copy
  - isDirty = false
  - lastSaved = now
  ↓
UI: EditorHeader shows "Saved"
  ↓
LivePreview re-renders with new data
```

---

## File Reference Index

### Page Component
- `/app/(app)/editor/[id]/page.tsx` - Main editor page (295 lines)

### Layout
- `/components/editor/EditorLayout.tsx` - Layout wrapper (53 lines)
- `/components/editor/EditorHeader.tsx` - Header with save status (not read)
- `/components/editor/EditorSidebar.tsx` - Section navigation (not read)

### Form Components
- `/components/editor/EditorForm.tsx` - React Hook Form wrapper (63 lines)
- `/components/editor/SectionAccordion.tsx` - Accordion wrapper (not read)

### Section Components
- `/components/editor/sections/ProfileSection.tsx` - Profile section (99 lines)
- `/components/editor/sections/WorkSection.tsx` - Work experience (104 lines)
- `/components/editor/sections/SummarySection.tsx` - (not read)
- `/components/editor/sections/EducationSection.tsx` - (not read)
- `/components/editor/sections/ProjectsSection.tsx` - (not read)
- `/components/editor/sections/SkillsSection.tsx` - (not read)
- `/components/editor/sections/CertificationsSection.tsx` - (not read)
- `/components/editor/sections/AwardsSection.tsx` - (not read)
- `/components/editor/sections/LanguagesSection.tsx` - (not read)
- `/components/editor/sections/ExtrasSection.tsx` - (not read)

### Field Components
- `/components/editor/fields/TextField.tsx` - Text input (not read)
- `/components/editor/fields/DateField.tsx` - Date input (not read)
- `/components/editor/fields/ArrayField.tsx` - Dynamic arrays (not read)
- `/components/editor/fields/TextAreaField.tsx` - Multi-line text (not read)
- `/components/editor/fields/LinkField.tsx` - URL input (not read)
- `/components/editor/fields/SelectField.tsx` - Dropdown (not read)

### State Management
- `/stores/documentStore.ts` - Resume store instance (42 lines)
- `/stores/createDocumentStore.ts` - Generic factory (404 lines)

### API Routes
- `/app/api/v1/resumes/[id]/route.ts` - GET/PUT/DELETE (123 lines)
- `/app/api/v1/resumes/route.ts` - GET/POST list/create (109 lines)

### Repositories
- `/libs/repositories/documents.ts` - Resume CRUD (150+ lines, partial read)
- `/libs/repositories/index.ts` - Central exports (92 lines)

### Preview
- `/components/preview/LivePreview.tsx` - Real-time preview (not fully read)
- `/components/preview/UnifiedStreamOverlay.tsx` - AI streaming overlay (not read)
- `/components/preview/TemplateRenderer.tsx` - Template rendering (not read)

---

## Observations & Gaps

### Strengths
1. **Clean separation**: Layout → Form → Sections → Fields
2. **Generic store**: Reusable for resumes + cover letters
3. **Auto-save**: Debounced with dirty check
4. **Undo/redo**: Temporal middleware with 50-state history
5. **Optimistic locking**: Prevents concurrent edit conflicts
6. **Validation**: Zod at API + form boundaries
7. **Performance**: Shallow selectors, deep equality checks
8. **Scroll tracking**: IntersectionObserver for active section

### Questions/Gaps
1. **Template rendering**: How are templates selected/rendered?
   - `LivePreview` component not fully explored
   - Template registry exists (`/libs/templates/registry.ts`)
2. **AI integration**: How does `UnifiedAITool` work?
   - Streaming overlay mentioned but not explored
   - Store: `/stores/unifiedAIStore.ts` (not read)
3. **Customization panel**: How are colors/fonts applied?
   - `CustomizationPanel` component (not read)
   - Customization types exist in `/types/template.ts`
4. **Version history UI**: How are versions displayed?
   - `VersionHistory` component (not read)
   - API route exists: `/api/v1/resumes/:id/versions`
5. **Field components**: How do dynamic arrays work?
   - `ArrayField` component (not read)
   - Add/remove/reorder logic
6. **Error handling**: Where are validation errors displayed?
   - React Hook Form error handling (inferred but not seen)

### Next Steps
Phase 3 will explore:
- Complete API route set (versions, restore, duplicate)
- Repository implementation details
- Database queries and RLS policies
- Export/PDF generation system
