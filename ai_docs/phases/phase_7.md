# Phase 7: Cover Letters & Extended Documents

## Phase Objective
Extend the platform to support cover letters with rich text editing, multiple templates, AI generation, resume data linking, job-specific customization, and comprehensive multi-document management capabilities.

## Phase Validation Gate

**This phase is complete only when ALL of the following are verified:**

### Playbook Execution (~20-30 minutes)
- [ ] **Cover Letter CRUD Playbook** (to be created in `ai_docs/testing/playbooks/phase_7_cover_letters.md`)
  - Create, read, update, delete cover letters
  - Document listing with cover letters
  - Link to resume functional
  - Job posting reference working
- [ ] **Rich Text Editor Playbook** (to be created in `ai_docs/testing/playbooks/phase_7_editor.md`)
  - Bold, italic, underline formatting
  - Bullet and numbered lists
  - Paragraph spacing controls
  - Undo/redo working
- [ ] **Cover Letter Templates Playbook** (to be created in `ai_docs/testing/playbooks/phase_7_templates.md`)
  - Multiple cover letter templates (3+)
  - Template switching preserves content
  - Preview matches final output
  - Export to PDF/DOCX working
- [ ] **AI Generation Playbook** (to be created in `ai_docs/testing/playbooks/phase_7_ai_generation.md`)
  - "Generate from resume" working
  - Job description context used
  - Tone customization functional
  - Streaming generation visible

### Visual Verification (~10 minutes)
- [ ] **Desktop screenshots** (1440px) for cover letter features
- [ ] **Mobile screenshots** (375px) for cover letter UI
- [ ] All cover letter features meet visual quality standards:
  - Rich text toolbar intuitive
  - Cover letter templates professional
  - Document switcher clear
  - Preview layout accurate
  - Design tokens used throughout

### Performance Validation
- [ ] Cover letter operations match resume performance
- [ ] Rich text editing smooth (<100ms keystroke)
- [ ] Template switching <200ms
- [ ] No performance regressions from Phase 6

### Security Validation
- [ ] Rich text content sanitized (XSS prevention)
- [ ] User isolation enforced (RLS)
- [ ] No script injection in editor
- [ ] Content validation working

### Documentation
- [ ] Screenshots saved to `ai_docs/progress/phase_7/screenshots/`
- [ ] `visual_review.md` completed
- [ ] `playbook_results.md` completed
- [ ] All critical issues resolved

**Reference**: See `ai_docs/testing/README.md` for complete testing workflow

## Comprehensive Scope

### Core Features
1. **Cover Letter Data Model**
   - Recipient information (company, hiring manager, address)
   - Salutation options
   - Body with rich text (bold, italic, underline, lists)
   - Closing variations
   - Signature block
   - Linked resume reference
   - Job posting reference
   - Version tracking

2. **Rich Text Editor**
   - Bold, italic, underline formatting
   - Bullet and numbered lists
   - Paragraph alignment
   - Link insertion
   - Character/word count
   - Spell check integration
   - Format painter
   - Keyboard shortcuts

3. **Cover Letter Templates** (Minimum 4)
   - Classic Block: Traditional business letter
   - Modern Minimal: Clean, contemporary
   - Creative Bold: Designer-friendly
   - Executive Formal: Senior professional

4. **AI-Powered Generation**
   - Generate from job description + resume
   - Tone adjustment (formal, friendly, enthusiastic)
   - Company research integration
   - Industry-specific language
   - Personalization suggestions
   - Opening/closing variations
   - Length optimization

5. **Resume Data Linking**
   - Pull experience from resume
   - Share contact information
   - Reference specific achievements
   - Sync updates automatically
   - Highlight relevant skills
   - Cross-document consistency
   - Smart field mapping

6. **Multi-Document Management**
   - Document type selector
   - Unified dashboard
   - Document relationships
   - Batch operations
   - Cross-document search
   - Template sets (resume + cover letter)
   - Document packages for applications

### Supporting Infrastructure
- **Navigation**: Document type switcher, linked document indicator, package view
- **Settings Pages**: Cover letter preferences, default templates, tone settings
- **Error Handling**: Rich text validation, link verification, sync conflicts
- **Preview System**: Cover letter preview with pagination
- **Export System**: Cover letter PDF/DOCX with formatting preserved
- **Scoring System**: Cover letter scoring and optimization

### User Flows Covered
1. **Create Cover Letter**
   - New document → Choose cover letter → Select template → Fill form → Save

2. **Generate from Job**
   - Input JD → Link resume → AI generates → Customize → Save

3. **Create Application Package**
   - Select resume → Create matching cover letter → Preview both → Export package

4. **Rich Text Editing**
   - Type content → Format text → Add lists → Preview formatting → Save

## Test Specifications

### Unit Tests Required
```typescript
// tests/phase7/unit/

describe('Component: CoverLetterEditor', () => {
  test('renders all sections')
  test('handles recipient input')
  test('manages salutation')
  test('rich text editor works')
  test('closing options display')
  test('character count updates')
})

describe('Component: RichTextEditor', () => {
  test('applies bold formatting')
  test('applies italic formatting')
  test('creates bullet lists')
  test('creates numbered lists')
  test('handles paste from Word')
  test('preserves formatting on save')
  test('keyboard shortcuts work')
})

describe('Component: CoverLetterTemplates', () => {
  test('displays all templates')
  test('shows template preview')
  test('applies template structure')
  test('preserves content on switch')
  test('customization works')
})

describe('Component: DocumentLinker', () => {
  test('shows available resumes')
  test('links to resume')
  test('pulls resume data')
  test('syncs updates')
  test('handles unlink')
})

describe('Component: MultiDocumentDashboard', () => {
  test('shows all documents')
  test('filters by type')
  test('displays relationships')
  test('handles bulk selection')
  test('search works across types')
})

describe('Service: CoverLetterGenerator', () => {
  test('generates from JD')
  test('uses resume data')
  test('applies tone')
  test('respects length')
  test('includes keywords')
})

describe('Store: coverLetterStore', () => {
  test('manages cover letter data')
  test('tracks linked resume')
  test('handles rich text')
  test('saves formatting')
  test('syncs with resume')
})

describe('Store: documentsStore', () => {
  test('manages multiple types')
  test('tracks relationships')
  test('handles filters')
  test('performs search')
  test('manages packages')
})

describe('Utils: richTextSanitizer', () => {
  test('allows safe tags')
  test('strips dangerous tags')
  test('preserves formatting')
  test('handles paste content')
  test('validates structure')
})
```

### Integration Tests Required
```typescript
// tests/phase7/integration/

describe('Feature: Cover Letter Creation', () => {
  test('creates cover letter with all fields')
  test('saves rich text content')
  test('links to resume')
  test('preserves formatting')
  test('version tracking works')
})

describe('Feature: AI Generation', () => {
  test('generates appropriate content')
  test('matches job requirements')
  test('uses resume highlights')
  test('respects tone setting')
  test('includes keywords')
})

describe('Feature: Document Linking', () => {
  test('establishes link')
  test('syncs contact info')
  test('updates on resume change')
  test('handles deletion')
  test('maintains consistency')
})

describe('API Route: /api/v1/cover-letters', () => {
  test('CRUD operations work')
  test('rich text saves correctly')
  test('relationships tracked')
  test('validation enforced')
})

describe('API Route: /api/v1/cover-letters/generate', () => {
  test('accepts generation request')
  test('uses linked resume')
  test('applies parameters')
  test('returns formatted content')
})

describe('Feature: Package Management', () => {
  test('creates document package')
  test('exports together')
  test('maintains relationships')
  test('updates cascade')
})

describe('Feature: Rich Text Operations', () => {
  test('formatting persists')
  test('copy/paste works')
  test('undo/redo functions')
  test('exports maintain format')
})
```

### E2E Tests Required
```typescript
// tests/phase7/e2e/

describe('User Journey: Create Cover Letter', () => {
  test('user creates new cover letter')
  test('fills all sections')
  test('applies formatting')
  test('links to resume')
  test('exports document')
})

describe('User Journey: Generate from Job', () => {
  test('pastes job description')
  test('selects resume')
  test('generates content')
  test('customizes result')
  test('saves and exports')
})

describe('User Journey: Application Package', () => {
  test('selects resume')
  test('creates matching cover letter')
  test('customizes both')
  test('exports as package')
})

describe('Critical Path: Multi-Document', () => {
  test('manages multiple documents')
  test('searches across types')
  test('maintains relationships')
  test('performs bulk operations')
})
```

### Performance Benchmarks
```typescript
describe('Performance: Cover Letters', () => {
  test('editor loads < 200ms')
  test('rich text operations < 50ms')
  test('generation < 5s')
  test('preview updates < 120ms')
  test('export < 2s')
})

describe('Performance: Multi-Document', () => {
  test('dashboard loads < 500ms')
  test('search < 300ms')
  test('filtering < 100ms')
  test('relationship loading < 200ms')
})
```

## Technical Implementation Scope

### Cover Letter Data Model
```typescript
// CoverLetterJson v1
interface CoverLetterJson {
  from: {
    fullName: string
    email: string
    phone?: string
    address?: {
      street?: string
      city: string
      region: string
      postal: string
      country: string
    }
    linkedResumeId?: string
  }
  to: {
    companyName: string
    hiringManager?: string
    title?: string
    department?: string
    address?: {
      street?: string
      city: string
      region: string
      postal: string
      country: string
    }
  }
  jobInfo: {
    title: string
    reference?: string
    source?: string // Where found
    applicationDate?: string
  }
  date: string // ISO format
  salutation: string // "Dear Hiring Manager," etc
  body: RichTextBlock[]
  closing: {
    phrase: string // "Sincerely," etc
    name: string
    signatureImage?: string
  }
  settings: {
    template: string
    fontFamily: string
    fontSize: number
    lineSpacing: number
    colorTheme: string
    margins: Margins
  }
}

// Rich Text Block
interface RichTextBlock {
  type: 'paragraph' | 'bullet_list' | 'numbered_list'
  content: TextRun[]
}

interface TextRun {
  text: string
  marks?: Array<'bold' | 'italic' | 'underline' | 'link'>
  href?: string // For links
}
```

### Database Updates
```sql
Tables/Collections:
- cover_letters: Cover letter documents
  - id: uuid (primary key)
  - user_id: uuid (references profiles.id)
  - title: text
  - data: jsonb (CoverLetterJson)
  - linked_resume_id: uuid (references resumes.id)
  - job_id: text
  - version: integer
  - status: text
  - created_at: timestamp
  - updated_at: timestamp

- document_relationships: Link documents
  - id: uuid (primary key)
  - source_id: uuid
  - source_type: text ('resume', 'cover_letter')
  - target_id: uuid
  - target_type: text
  - relationship_type: text ('linked', 'package', 'variant')
  - metadata: jsonb
  - created_at: timestamp

- document_packages: Application packages
  - id: uuid (primary key)
  - user_id: uuid
  - name: text
  - resume_id: uuid
  - cover_letter_id: uuid
  - additional_docs: jsonb
  - job_application_id: text
  - created_at: timestamp

- cover_letter_templates: Templates
  - id: text (primary key)
  - name: text
  - category: text
  - structure: jsonb
  - styles: jsonb
  - thumbnail: text

Migrations Required:
- 020_create_cover_letters_table.sql
- 021_create_relationships_table.sql
- 022_create_packages_table.sql
- 023_create_cover_letter_templates.sql
```

### API Endpoints
```
Cover Letter Operations:
- GET /api/v1/cover-letters - List cover letters
- POST /api/v1/cover-letters - Create cover letter
- GET /api/v1/cover-letters/:id - Get specific
- PUT /api/v1/cover-letters/:id - Update
- DELETE /api/v1/cover-letters/:id - Delete
- POST /api/v1/cover-letters/:id/link - Link to resume

AI Generation:
- POST /api/v1/cover-letters/generate - Generate from JD
  Body: { jobDescription, resumeId, tone, length }
- POST /api/v1/cover-letters/enhance - Enhance existing
- POST /api/v1/cover-letters/suggestions - Get improvements

Document Management:
- GET /api/v1/documents - List all documents
  Query: ?type=resume,cover_letter&linked=true
- POST /api/v1/documents/package - Create package
- GET /api/v1/documents/relationships/:id - Get related

Templates:
- GET /api/v1/cover-letter-templates - List templates
- GET /api/v1/cover-letter-templates/:id - Get template
```

### Frontend Components

#### Page Components
```
/app/
├── cover-letters/
│   ├── page.tsx - Cover letter list
│   ├── new/
│   │   └── page.tsx - New cover letter
│   └── [id]/
│       ├── page.tsx - Cover letter editor
│       └── preview/
│           └── page.tsx - Preview
├── documents/
│   ├── page.tsx - Multi-document dashboard
│   └── packages/
│       └── page.tsx - Document packages
```

#### Cover Letter Components
```
/components/cover-letters/
├── CoverLetterEditor.tsx - Main editor
├── RecipientForm.tsx - To section
├── SalutationSelector.tsx - Greeting options
├── RichTextEditor.tsx - Body editor
├── ClosingSelector.tsx - Sign-off options
├── CoverLetterPreview.tsx - Preview
├── CoverLetterTemplates.tsx - Template gallery
├── ToneSelector.tsx - Tone adjustment
└── JobInfoForm.tsx - Job details

/components/rich-text/
├── RichTextToolbar.tsx - Formatting toolbar
├── FormatButton.tsx - Format control
├── ListControls.tsx - List formatting
├── LinkDialog.tsx - Link insertion
├── CharacterCount.tsx - Count display
└── FormatPainter.tsx - Copy formatting

/components/documents/
├── DocumentGrid.tsx - Multi-type grid
├── DocumentFilter.tsx - Type filter
├── DocumentSearch.tsx - Cross-type search
├── DocumentRelations.tsx - Show links
├── PackageCreator.tsx - Package builder
└── BulkOperations.tsx - Multi-select actions
```

### Rich Text Editor Implementation
```typescript
// components/rich-text/RichTextEditor.tsx
import { useState, useRef } from 'react'
import { sanitizeHtml } from '@/libs/sanitizer'

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  maxLength,
}: RichTextEditorProps) {
  const [selection, setSelection] = useState<Range | null>(null)
  const editorRef = useRef<HTMLDivElement>(null)

  const applyFormat = (format: 'bold' | 'italic' | 'underline') => {
    document.execCommand(format, false)
    handleChange()
  }

  const insertList = (type: 'bullet' | 'numbered') => {
    const command = type === 'bullet' ? 'insertUnorderedList' : 'insertOrderedList'
    document.execCommand(command, false)
    handleChange()
  }

  const handleChange = () => {
    if (!editorRef.current) return

    const html = editorRef.current.innerHTML
    const sanitized = sanitizeHtml(html)
    const blocks = parseHtmlToBlocks(sanitized)

    onChange(blocks)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Keyboard shortcuts
    if (e.metaKey || e.ctrlKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault()
          applyFormat('bold')
          break
        case 'i':
          e.preventDefault()
          applyFormat('italic')
          break
        case 'u':
          e.preventDefault()
          applyFormat('underline')
          break
      }
    }
  }

  return (
    <div className="border rounded-lg">
      <RichTextToolbar
        onBold={() => applyFormat('bold')}
        onItalic={() => applyFormat('italic')}
        onUnderline={() => applyFormat('underline')}
        onBulletList={() => insertList('bullet')}
        onNumberedList={() => insertList('numbered')}
      />
      <div
        ref={editorRef}
        contentEditable
        className="p-4 min-h-[300px] focus:outline-none"
        onInput={handleChange}
        onKeyDown={handleKeyDown}
        dangerouslySetInnerHTML={{ __html: blocksToHtml(value) }}
      />
      <div className="border-t p-2 text-sm text-muted-foreground">
        <CharacterCount content={value} max={maxLength} />
      </div>
    </div>
  )
}
```

### Document Linking System
```typescript
// libs/documents/documentLinker.ts
export class DocumentLinker {
  async linkDocuments(
    sourceId: string,
    targetId: string,
    type: 'linked' | 'package'
  ): Promise<void> {
    await db.documentRelationships.create({
      sourceId,
      targetId,
      relationshipType: type,
    })

    // Sync shared data
    if (type === 'linked') {
      await this.syncSharedData(sourceId, targetId)
    }
  }

  async syncSharedData(resumeId: string, coverLetterId: string): Promise<void> {
    const resume = await resumeRepository.get(resumeId)
    const coverLetter = await coverLetterRepository.get(coverLetterId)

    // Update cover letter with resume data
    coverLetter.from = {
      ...coverLetter.from,
      fullName: resume.profile.fullName,
      email: resume.profile.email,
      phone: resume.profile.phone,
      linkedResumeId: resumeId,
    }

    await coverLetterRepository.update(coverLetterId, coverLetter)
  }

  async getRelatedDocuments(documentId: string): Promise<RelatedDocuments> {
    const relationships = await db.documentRelationships.findMany({
      where: {
        OR: [{ sourceId: documentId }, { targetId: documentId }],
      },
    })

    return this.resolveDocuments(relationships)
  }
}
```

### State Management
```typescript
// stores/coverLetterStore.ts
interface CoverLetterStore {
  // State
  coverLetter: CoverLetterJson | null
  linkedResume: ResumeJson | null
  isDirty: boolean
  isGenerating: boolean

  // Actions
  loadCoverLetter(id: string): Promise<void>
  updateField(path: string, value: any): void
  updateRichText(blocks: RichTextBlock[]): void
  linkToResume(resumeId: string): Promise<void>
  generateFromJob(jd: string, resumeId: string): Promise<void>
  saveCoverLetter(): Promise<void>

  // Computed
  wordCount: number
  characterCount: number
  hasLinkedResume: boolean
}

// stores/multiDocumentStore.ts
interface MultiDocumentStore {
  // State
  documents: Array<Resume | CoverLetter>
  filter: DocumentFilter
  searchQuery: string
  selectedIds: Set<string>
  packages: DocumentPackage[]

  // Actions
  loadDocuments(): Promise<void>
  setFilter(filter: DocumentFilter): void
  searchDocuments(query: string): void
  createPackage(resumeId: string, coverLetterId: string): Promise<void>
  selectDocument(id: string): void
  bulkDelete(ids: string[]): Promise<void>

  // Computed
  filteredDocuments: Document[]
  documentsByType: Map<string, Document[]>
  hasPackages: boolean
}
```

## Edge Cases & Completeness Checklist

### User Scenarios (All Need Tests)
- [ ] Cover letter without linked resume → Test: standalone_cover_letter
- [ ] Resume deletion with linked cover letter → Test: cascade_handling
- [ ] Rich text paste from Word → Test: word_paste_cleanup
- [ ] Very long cover letter → Test: length_limits
- [ ] Multiple cover letters per job → Test: variant_management
- [ ] Package with missing documents → Test: incomplete_package
- [ ] Circular document relationships → Test: circular_prevention
- [ ] Rich text XSS attempts → Test: xss_prevention

### Technical Considerations (Test Requirements)
- [ ] Rich text sanitization → Test: html_sanitization
- [ ] Format preservation → Test: format_persistence
- [ ] Document sync performance → Test: sync_efficiency
- [ ] Relationship integrity → Test: referential_integrity
- [ ] Search across types → Test: unified_search
- [ ] Export with rich text → Test: rich_text_export
- [ ] Template switching → Test: template_preservation
- [ ] Concurrent editing → Test: edit_conflicts

## Phase Exit Criteria

### Test Suite Requirements
```yaml
Unit Tests:
  Total: 75
  Passing: 75
  Coverage: >85%

Integration Tests:
  Total: 35
  Passing: 35
  Coverage: All features

E2E Tests:
  Total: 13
  Passing: 13
  Coverage: User journeys

Performance:
  Editor load: <200ms
  Generation: <5s
  Export: <2s

Accessibility:
  Rich text: Keyboard support
  Navigation: Screen reader

Security:
  XSS prevention: ACTIVE
  Sanitization: COMPLETE
```

### Phase Gate Checklist
- [ ] Cover letter CRUD working
- [ ] Rich text editor functional
- [ ] Templates rendering correctly
- [ ] AI generation operational
- [ ] Document linking working
- [ ] Multi-document dashboard complete
- [ ] Package management functional
- [ ] Export preserving formatting
- [ ] Performance targets met
- [ ] Security validated

## Known Constraints & Decisions
- **Simple rich text**: Bold, italic, underline, lists only (no complex formatting)
- **Client-side sanitization**: Plus server validation
- **Linked data sync**: One-way from resume to cover letter
- **Package limit**: Resume + cover letter only in v1
- **No collaborative editing**: Single user only
- **English templates**: Localization in future
- **Basic tone options**: Formal, friendly, enthusiastic only

## Phase Completion Definition
This phase is complete when:
1. **ALL tests are passing (100%)**
2. Cover letters fully functional
3. Rich text editing working smoothly
4. Document linking operational
5. AI generation producing quality content
6. Multi-document management complete
7. Packages can be created and exported
8. Templates working correctly
9. Performance benchmarks met
10. **Gate check approved for Phase 8**