# Phase 2: Document Management & Basic Editor

## Phase Objective
Build a complete document management system with CRUD operations, basic form-based resume editor, auto-save functionality, version history, and state management using Zustand/zundo for undo/redo capabilities.

## Phase Validation Gate

**This phase is complete only when ALL of the following are verified:**

### Playbook Execution (~20-30 minutes)
- [ ] **Document CRUD Playbook** (to be created in `ai_docs/testing/playbooks/phase_2_documents.md`)
  - Create, read, update, delete operations working
  - Document listing with search/filter/sort
  - Soft delete and restore from trash
  - Duplicate documents working
- [ ] **Editor Playbook** (to be created in `ai_docs/testing/playbooks/phase_2_editor.md`)
  - Basic form editor functional
  - Add/remove/reorder sections
  - Field validation working
  - Character counters visible
- [ ] **Auto-save Playbook** (to be created in `ai_docs/testing/playbooks/phase_2_autosave.md`)
  - Auto-save triggers after edits
  - Manual save button works
  - Version history tracking
  - Undo/redo functionality

### Visual Verification (~10 minutes)
- [ ] **Desktop screenshots** (1440px) for document list, editor, version history
- [ ] **Mobile screenshots** (375px) for responsive layouts
- [ ] All UI features meet visual quality standards:
  - Form inputs have clear labels and focus states
  - Document cards use generous padding
  - Primary actions clearly identified
  - Design tokens used throughout
  - Auto-save indicator visible

### Performance Validation
- [ ] Auto-save triggers within 2 seconds of last edit
- [ ] Document list loads in <500ms
- [ ] No performance regressions from Phase 1

### Documentation
- [ ] Screenshots saved to `ai_docs/progress/phase_2/screenshots/`
- [ ] `visual_review.md` completed
- [ ] `playbook_results.md` completed
- [ ] All critical issues resolved

**Reference**: See `ai_docs/testing/README.md` for complete testing workflow

## Comprehensive Scope

### Core Features
1. **Resume Document CRUD**
   - Create new resume documents
   - Read/display document content
   - Update document fields
   - Delete documents (soft delete with trash)
   - Duplicate existing documents
   - Restore from trash

2. **Document Listing & Management**
   - Grid and list view options
   - Search by title/content
   - Filter by status/date
   - Sort by multiple criteria
   - Pagination with cursor
   - Bulk selection and operations
   - Document metadata display

3. **Basic Form Editor**
   - Section-based form layout
   - Field validation with error messages
   - Add/remove/reorder sections
   - Rich data structures (arrays of experience, education, etc.)
   - Character counters for text fields
   - Required field indicators

4. **Auto-save & Versioning**
   - Debounced auto-save (2 seconds)
   - Manual save option
   - Version history tracking
   - Restore previous versions
   - Conflict resolution
   - Offline queue for saves

5. **State Management**
   - Zustand store for document state
   - Zundo for undo/redo (50 step history)
   - Optimistic updates
   - Error recovery
   - Persistent draft state

### Supporting Infrastructure
- **Navigation**: Document switcher, breadcrumbs update, quick actions menu
- **Settings Pages**: Auto-save preferences, default document settings
- **Error Handling**: Save failures, validation errors, conflict resolution
- **Layout Components**: Editor layout, form sections, field groups
- **Empty States**: No documents, first document creation wizard
- **Data Management**: Document schema, validation rules, transformations

### User Flows Covered
1. **Create First Resume**
   - Dashboard (empty) → Create Resume → Choose template → Fill form → Auto-save → Document created

2. **Edit Existing Resume**
   - Dashboard → Select document → Editor loads → Make changes → Auto-save → Changes persisted

3. **Manage Documents**
   - Dashboard → Search/filter → Select multiple → Bulk delete → Confirm → Documents updated

4. **Version Recovery**
   - Editor → Version history → Preview version → Restore → Document reverted

## Test Specifications

### Unit Tests Required
```typescript
// tests/phase2/unit/

describe('Component: DocumentCard', () => {
  test('displays document metadata')
  test('shows last edited time')
  test('handles click to open')
  test('shows document status')
  test('displays thumbnail/icon')
})

describe('Component: DocumentList', () => {
  test('renders grid view')
  test('renders list view')
  test('handles empty state')
  test('supports pagination')
  test('handles selection')
})

describe('Component: EditorForm', () => {
  test('renders all sections')
  test('validates required fields')
  test('shows error messages')
  test('handles array fields (add/remove)')
  test('character counter works')
  test('disables submit when invalid')
})

describe('Component: AutoSaveIndicator', () => {
  test('shows saving state')
  test('shows saved state')
  test('shows error state')
  test('displays last saved time')
})

describe('Store: documentStore', () => {
  test('loads document')
  test('updates fields')
  test('handles auto-save')
  test('tracks dirty state')
  test('manages save queue')
  test('handles conflicts')
})

describe('Store: documentListStore', () => {
  test('fetches documents')
  test('applies filters')
  test('handles sorting')
  test('manages pagination')
  test('updates cache')
})

describe('Repository: documentRepository', () => {
  test('creates document')
  test('updates document')
  test('deletes document')
  test('fetches document list')
  test('searches documents')
  test('duplicates document')
  test('restores from trash')
})

describe('Utils: documentValidation', () => {
  test('validates email format')
  test('validates phone format')
  test('validates URLs')
  test('validates required fields')
  test('validates date ranges')
})

describe('Utils: documentTransform', () => {
  test('formats dates correctly')
  test('normalizes phone numbers')
  test('cleans HTML input')
  test('transforms for save')
  test('transforms for display')
})
```

### Integration Tests Required
```typescript
// tests/phase2/integration/

describe('Feature: Document Creation', () => {
  test('creates document with all fields')
  test('validates before creation')
  test('assigns correct ownership')
  test('generates unique ID')
  test('sets initial version')
})

describe('Feature: Document Editing', () => {
  test('loads document data')
  test('saves changes')
  test('auto-saves after delay')
  test('prevents concurrent edits')
  test('handles save failures')
})

describe('Feature: Undo/Redo', () => {
  test('undo reverses last change')
  test('redo reapplies change')
  test('history limited to 50')
  test('clears on document switch')
  test('groups related changes')
})

describe('API Route: /api/v1/resumes', () => {
  test('GET returns user documents')
  test('POST creates new document')
  test('enforces rate limits')
  test('validates request data')
  test('handles pagination')
})

describe('API Route: /api/v1/resumes/:id', () => {
  test('GET returns specific document')
  test('PUT updates document')
  test('DELETE soft deletes')
  test('checks ownership')
  test('handles not found')
})

describe('Feature: Version History', () => {
  test('tracks all changes')
  test('stores snapshots')
  test('allows restoration')
  test('limits history count')
  test('shows diff view')
})

describe('Feature: Search & Filter', () => {
  test('searches by title')
  test('searches by content')
  test('filters by date')
  test('combines filters')
  test('maintains filter state')
})
```

### E2E Tests Required
```typescript
// tests/phase2/e2e/

describe('User Journey: Create First Resume', () => {
  test('new user creates resume from dashboard')
  test('fills all form sections')
  test('document appears in list')
  test('can reopen and edit')
})

describe('User Journey: Edit Resume', () => {
  test('opens existing document')
  test('makes multiple edits')
  test('changes auto-save')
  test('undo/redo works')
})

describe('User Journey: Manage Documents', () => {
  test('creates multiple documents')
  test('searches for document')
  test('deletes document')
  test('restores from trash')
})

describe('Critical Path: Auto-save', () => {
  test('changes trigger auto-save')
  test('indicator shows status')
  test('handles network failure')
  test('queues offline saves')
})
```

### Performance Benchmarks
```typescript
describe('Performance: Editor', () => {
  test('form renders < 200ms')
  test('field update < 50ms')
  test('auto-save triggers < 100ms')
  test('undo operation < 20ms')
})

describe('Performance: Document List', () => {
  test('list loads < 500ms')
  test('search results < 300ms')
  test('pagination < 200ms')
  test('bulk operations < 1s')
})
```

### Accessibility Tests
```typescript
describe('Accessibility: Editor', () => {
  test('form fields labeled correctly')
  test('error messages announced')
  test('keyboard navigation works')
  test('focus management correct')
  test('required fields indicated')
})
```

### Security Validations
```typescript
describe('Security: Documents', () => {
  test('user isolation enforced')
  test('XSS prevention in fields')
  test('SQL injection prevented')
  test('rate limiting on saves')
  test('file size limits enforced')
})
```

## Technical Implementation Scope

### Database Layer
```sql
Tables/Collections:
- resumes: Main document storage
  - id: uuid (primary key)
  - user_id: uuid (references profiles.id)
  - title: text
  - slug: text (unique per user)
  - data: jsonb (ResumeJson schema)
  - version: integer
  - status: text ('draft', 'active', 'archived')
  - is_deleted: boolean (soft delete)
  - deleted_at: timestamp
  - created_at: timestamp
  - updated_at: timestamp
  - last_accessed_at: timestamp

- resume_versions: Version history
  - id: uuid (primary key)
  - resume_id: uuid (references resumes.id)
  - version_number: integer
  - data: jsonb (snapshot)
  - changes: jsonb (diff from previous)
  - created_at: timestamp
  - created_by: uuid

- resume_templates: Starter templates
  - id: uuid (primary key)
  - name: text
  - description: text
  - data: jsonb (ResumeJson schema)
  - thumbnail_url: text
  - category: text
  - is_default: boolean
  - created_at: timestamp

RLS Policies:
- resumes: Users can only CRUD their own documents
- resume_versions: Users can only read their document versions
- resume_templates: All users can read templates

Indexes:
- resumes(user_id, status, updated_at)
- resumes(user_id, is_deleted, updated_at)
- resume_versions(resume_id, version_number)

Migrations Required:
- 004_create_resumes_table.sql
- 005_create_resume_versions_table.sql
- 006_create_resume_templates_table.sql
- 007_add_resume_indexes.sql
```

### Resume Data Schema (ResumeJson v1)
```typescript
interface ResumeJson {
  profile: {
    fullName: string
    headline?: string
    email: string
    phone?: string
    location?: {
      city?: string
      region?: string
      country?: string
      postal?: string
    }
    links?: Array<{
      type?: string
      label?: string
      url: string
    }>
    photo?: {
      url: string
      path: string
    }
  }
  summary?: string
  work?: Array<{
    company: string
    role: string
    location?: string
    startDate: string
    endDate?: string | null | 'Present'
    descriptionBullets?: string[]
    achievements?: string[]
    techStack?: string[]
  }>
  education?: Array<{
    school: string
    degree: string
    field?: string
    startDate?: string
    endDate?: string
    details?: string[]
  }>
  projects?: Array<{
    name: string
    link?: string
    summary?: string
    bullets?: string[]
    techStack?: string[]
  }>
  skills?: Array<{
    category: string
    items: string[]
  }>
  certifications?: Array<{
    name: string
    issuer: string
    date?: string
  }>
  awards?: Array<{
    name: string
    org: string
    date?: string
    summary?: string
  }>
  languages?: Array<{
    name: string
    level: string
  }>
  extras?: Array<{
    title: string
    content: string
  }>
  settings: {
    locale: string
    dateFormat: 'US' | 'ISO' | 'EU'
    addressFormat?: string
    fontFamily: string
    fontSizeScale: number
    lineSpacing: number
    colorTheme: string
    iconSet: 'lucide'
    showIcons: boolean
    sectionOrder: string[]
    pageSize: 'A4' | 'Letter'
  }
}
```

### API Endpoints
```
Document Management:
- GET /api/v1/resumes - List user's resumes
  Query params: ?status=active&sort=updated_at&order=desc&cursor=xxx&limit=20
- POST /api/v1/resumes - Create new resume
- GET /api/v1/resumes/:id - Get specific resume
- PUT /api/v1/resumes/:id - Update resume
- DELETE /api/v1/resumes/:id - Soft delete resume
- POST /api/v1/resumes/:id/duplicate - Duplicate resume
- POST /api/v1/resumes/:id/restore - Restore from trash

Version Management:
- GET /api/v1/resumes/:id/versions - List versions
- GET /api/v1/resumes/:id/versions/:version - Get specific version
- POST /api/v1/resumes/:id/versions/:version/restore - Restore version

Templates:
- GET /api/v1/templates - List available templates
- GET /api/v1/templates/:id - Get template details

Bulk Operations:
- POST /api/v1/resumes/bulk/delete - Delete multiple
- POST /api/v1/resumes/bulk/archive - Archive multiple
```

### Frontend Components

#### Page Components
```
/app/
├── dashboard/
│   ├── page.tsx - Document list/grid view
│   └── empty.tsx - Empty state for new users
├── editor/
│   ├── [id]/
│   │   ├── page.tsx - Main editor page
│   │   ├── layout.tsx - Editor layout wrapper
│   │   └── loading.tsx - Editor skeleton
│   └── new/
│       └── page.tsx - New document creation
├── templates/
│   └── page.tsx - Template selection
└── trash/
    └── page.tsx - Deleted documents
```

#### Feature Components
```
/components/
├── documents/
│   ├── DocumentCard.tsx - Grid view card
│   ├── DocumentListItem.tsx - List view item
│   ├── DocumentGrid.tsx - Grid container
│   ├── DocumentList.tsx - List container
│   ├── DocumentSearch.tsx - Search bar
│   ├── DocumentFilters.tsx - Filter controls
│   ├── DocumentSort.tsx - Sort dropdown
│   ├── DocumentActions.tsx - Bulk actions bar
│   ├── EmptyDocuments.tsx - Empty state
│   └── CreateDocumentDialog.tsx - Creation modal
├── editor/
│   ├── EditorLayout.tsx - Editor container
│   ├── EditorHeader.tsx - Save status, actions
│   ├── EditorSidebar.tsx - Section navigation
│   ├── EditorForm.tsx - Main form container
│   ├── sections/
│   │   ├── ProfileSection.tsx
│   │   ├── SummarySection.tsx
│   │   ├── WorkSection.tsx
│   │   ├── EducationSection.tsx
│   │   ├── ProjectsSection.tsx
│   │   ├── SkillsSection.tsx
│   │   ├── CertificationsSection.tsx
│   │   ├── AwardsSection.tsx
│   │   ├── LanguagesSection.tsx
│   │   └── ExtrasSection.tsx
│   ├── fields/
│   │   ├── TextField.tsx
│   │   ├── TextAreaField.tsx
│   │   ├── SelectField.tsx
│   │   ├── DateField.tsx
│   │   ├── ArrayField.tsx
│   │   └── LinkField.tsx
│   ├── AutoSaveIndicator.tsx
│   ├── UndoRedoButtons.tsx
│   └── VersionHistory.tsx
└── templates/
    ├── TemplateCard.tsx
    ├── TemplateGrid.tsx
    └── TemplatePreview.tsx
```

### State Management
```typescript
// stores/documentStore.ts
interface DocumentStore {
  // State
  document: ResumeJson | null
  originalDocument: ResumeJson | null
  isDirty: boolean
  isSaving: boolean
  lastSaved: Date | null
  saveError: Error | null

  // Actions
  loadDocument(id: string): Promise<void>
  updateField(path: string, value: any): void
  saveDocument(): Promise<void>
  autoSave(): void
  resetChanges(): void
  deleteDocument(): Promise<void>

  // Computed
  canSave: boolean
  hasChanges: boolean
}

// stores/documentListStore.ts
interface DocumentListStore {
  // State
  documents: Document[]
  totalCount: number
  isLoading: boolean
  error: Error | null
  filters: DocumentFilters
  sort: SortConfig
  selectedIds: Set<string>

  // Actions
  fetchDocuments(cursor?: string): Promise<void>
  searchDocuments(query: string): Promise<void>
  setFilter(key: string, value: any): void
  setSorting(field: string, order: 'asc' | 'desc'): void
  selectDocument(id: string): void
  selectAll(): void
  deselectAll(): void
  bulkDelete(ids: string[]): Promise<void>

  // Computed
  hasSelection: boolean
  filteredDocuments: Document[]
}

// Undo/Redo with Zundo
const useDocumentStore = create<DocumentStore>()(
  temporal(
    (set, get) => ({
      // Implementation
    }),
    {
      limit: 50,
      partialize: (state) => ({
        document: state.document
      })
    }
  )
)
```

## Edge Cases & Completeness Checklist

### User Scenarios (All Need Tests)
- [ ] First resume creation → Test: first_document_flow
- [ ] Import from template → Test: template_import
- [ ] Concurrent editing (multiple tabs) → Test: concurrent_edit_handling
- [ ] Network failure during save → Test: offline_save_queue
- [ ] Session expiry while editing → Test: session_recovery
- [ ] Large document handling → Test: large_document_performance
- [ ] Rapid consecutive saves → Test: save_debouncing
- [ ] Browser crash recovery → Test: draft_persistence

### Technical Considerations (Test Requirements)
- [ ] Form validation on all fields → Test: field_validation
- [ ] Special characters in text → Test: special_char_handling
- [ ] International characters → Test: unicode_support
- [ ] Date format localization → Test: date_localization
- [ ] Phone number formats → Test: phone_validation
- [ ] URL validation → Test: url_validation
- [ ] Email validation → Test: email_validation
- [ ] Maximum field lengths → Test: field_limits

## Phase Exit Criteria

### Test Suite Requirements
```yaml
Unit Tests:
  Total: 62
  Passing: 62
  Coverage: >85%

Integration Tests:
  Total: 28
  Passing: 28
  Coverage: All CRUD operations

E2E Tests:
  Total: 12
  Passing: 12
  Coverage: Core user journeys

Performance:
  Auto-save: <100ms
  List load: <500ms
  Form update: <50ms

Accessibility:
  Form navigation: PASS
  Screen readers: PASS

Security:
  Input validation: PASS
  User isolation: PASS
```

### Phase Gate Checklist
- [ ] 100% of tests passing
- [ ] Document CRUD fully functional
- [ ] Auto-save working reliably
- [ ] Undo/redo operational
- [ ] Version history tracking
- [ ] Search and filtering working
- [ ] Validation comprehensive
- [ ] Performance targets met
- [ ] No data loss scenarios
- [ ] Ready for template system

## Known Constraints & Decisions
- **Form-based editor only**: No rich text editing yet (Phase 3)
- **Basic templates**: Just structure, no styling yet (Phase 3)
- **No preview**: Live preview comes in Phase 3
- **Simple versioning**: Full diff view in future phase
- **Local undo history**: Not persisted across sessions
- **Soft delete**: Documents moved to trash, not permanently deleted

## Phase Completion Definition
This phase is complete when:
1. **ALL tests are passing (100%)**
2. Users can create, edit, save, and delete resumes
3. Auto-save prevents data loss
4. Undo/redo works for last 50 operations
5. Document list with search/filter/sort
6. Version history tracked
7. Form validation comprehensive
8. Performance benchmarks met
9. Security validations passed
10. **Gate check approved for Phase 3**