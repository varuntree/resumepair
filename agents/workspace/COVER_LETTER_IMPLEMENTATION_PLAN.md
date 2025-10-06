# Cover Letter Feature Parity Implementation Plan

**Project:** ResumePair Cover Letter System Completion
**Objective:** Achieve 100% feature parity between Cover Letter and Resume systems
**Status:** Implementation-Ready
**Created:** 2025-10-06

---

## Executive Summary

### Current State
- **Cover Letter Completion:** ~60% (CRUD works, preview/export/customization missing)
- **Database & API:** ✅ Complete foundation (stores, repositories, API routes)
- **Critical Gaps:** Preview system, PDF export, customization panel, version history, AI enhancement

### Total Effort Estimate
- **Total Developer-Hours:** 62-86 hours (8-11 developer-days)
- **Critical Path:** Preview System → Export System → Customization Panel
- **Parallel Work Opportunities:** AI features, version history, utility endpoints can run in parallel with UI work

### Key Architectural Decisions

**Decision 1: Separate vs. Polymorphic Preview Components**
- **Choice:** Separate cover letter preview components (create `CoverLetterLivePreview.tsx`)
- **Rationale:** Type safety, faster implementation, clearer separation of concerns
- **Trade-off:** Some code duplication vs. complex type gymnastics with discriminated unions

**Decision 2: Extend vs. Duplicate Export System**
- **Choice:** Extend existing export system with document type discrimination
- **Rationale:** Reuse job queue infrastructure, unified export history, consistent UX
- **Implementation:** Add `document_type` field to export jobs, dispatch to appropriate renderer

**Decision 3: Template System Integration**
- **Choice:** Keep separate registries, create unified selector pattern
- **Rationale:** Cover letter templates have fundamentally different props; separation is intentional
- **Implementation:** Polymorphic template selector that dispatches to appropriate registry

**Decision 4: Customization Panel Architecture**
- **Choice:** Create `CoverLetterCustomizationPanel.tsx` with shared subcomponents where possible
- **Rationale:** Reuse ColorCustomizer, TypographyCustomizer; only header and layout differ
- **Savings:** ~40% code reuse from existing customization components

### Critical Path Items
1. **Preview System** (8-12 hours) - Blocks customization and template switching
2. **Export System** (12-16 hours) - Blocks production readiness
3. **Customization Panel** (6-8 hours) - Depends on preview being functional

### Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Type incompatibilities in preview system | Medium | High | Create strict type guards, extensive TypeScript checks |
| Puppeteer rendering issues with cover letter templates | Medium | High | Test each template individually, create fallback renderer |
| Performance regression in export queue | Low | Medium | Benchmark before/after, maintain separate queues if needed |
| Version history migration breaks existing data | Low | High | Test migration on staging, implement rollback procedure |

---

## 1. Scope Map

### Files to Create (19 new files)

**Preview System:**
- `/components/preview/cover-letter/CoverLetterLivePreview.tsx` - Cover letter preview component
- `/components/preview/cover-letter/CoverLetterTemplateRenderer.tsx` - Template dispatcher
- `/components/preview/cover-letter/CoverLetterPreviewContainer.tsx` - Wrapper with cover letter styling

**Customization System:**
- `/components/customization/cover-letter/CoverLetterCustomizationPanel.tsx` - Main customization UI
- `/components/customization/cover-letter/CoverLetterTemplateSelector.tsx` - Template gallery
- `/components/customization/cover-letter/CoverLetterCustomizationHeader.tsx` - Panel header

**Version History:**
- `/components/editor/cover-letter/CoverLetterVersionHistory.tsx` - Version history modal
- `/libs/repositories/coverLetterVersions.ts` - Version repository functions

**AI Enhancement:**
- `/components/enhance/cover-letter/CoverLetterEnhancementPanel.tsx` - AI enhancement UI
- `/app/api/v1/cover-letters/[id]/enhance/route.ts` - Enhancement endpoint

**Export System:**
- `/libs/export/renderers/coverLetterRenderer.ts` - Puppeteer render logic for cover letters
- `/libs/export/utils/documentTypeHelpers.ts` - Type discrimination utilities

**API Routes:**
- `/app/api/v1/cover-letters/[id]/duplicate/route.ts` - Duplicate endpoint
- `/app/api/v1/cover-letters/[id]/restore/route.ts` - Restore endpoint
- `/app/api/v1/cover-letters/[id]/versions/route.ts` - List versions
- `/app/api/v1/cover-letters/[id]/versions/[versionNumber]/route.ts` - Get specific version
- `/app/api/v1/cover-letters/[id]/versions/[versionNumber]/restore/route.ts` - Restore version

**Database:**
- `/migrations/phase7/024_create_cover_letter_versions_table.sql` - Version history table

**Stores:**
- `/stores/coverLetterTemplateStore.ts` - Template selection state for cover letters

### Files to Modify (22 existing files)

**Editor Page:**
- `/app/(app)/cover-letter-editor/[id]/page.tsx` - Wire up preview, customization, version history, enhancement

**Export System:**
- `/app/api/v1/export/pdf/route.ts` - Add document type discrimination
- `/app/api/v1/export/batch/route.ts` - Support cover letter batch export
- `/app/api/v1/export/history/route.ts` - Include cover letter exports
- `/libs/export/queue.ts` - Handle both document types
- `/libs/export/renderers/index.ts` - Export type dispatcher

**Cover Letter Store:**
- `/stores/coverLetterStore.ts` - Add version snapshot triggers

**Repository Layer:**
- `/libs/repositories/coverLetters.ts` - Add version snapshot on update

**Type Definitions:**
- `/types/export.ts` - Add document_type discriminator
- `/types/cover-letter.ts` - Add version-related types

**Dashboard:**
- `/app/(app)/documents/page.tsx` - Add duplicate/restore actions for cover letters
- `/components/documents/UnifiedDocumentDashboard.tsx` - Show template name, export status

**Utilities:**
- `/libs/utils/templateUtils.ts` - Polymorphic template helpers

**Database Schema:**
- `/migrations/phase7/020_create_cover_letters_table.sql` - Document current state (no changes)

### Current vs Desired Behavior

**Current Behavior:**
- ✅ User can create cover letter via "New Cover Letter" link
- ✅ User can edit cover letter content (from, to, body, closing)
- ✅ Auto-save works with optimistic concurrency
- ❌ Preview tab shows "Preview functionality coming soon"
- ❌ Customize tab shows "Customization panel coming soon"
- ❌ No export button (cannot download PDF)
- ❌ Cannot change template after creation
- ❌ No version history
- ❌ No AI enhancement for paragraphs

**Desired Behavior:**
- ✅ Preview tab renders live cover letter with current template
- ✅ Preview updates in <120ms with RAF batching (same as resume)
- ✅ Customize tab allows template switching, color/typography/spacing adjustments
- ✅ Export button generates PDF via queue system (2.5s target)
- ✅ Version history modal shows all snapshots, can restore
- ✅ AI enhancement panel improves paragraphs (tone, clarity, persuasiveness)
- ✅ Duplicate button creates copy
- ✅ Restore functionality for soft-deleted cover letters

---

## 2. Task Understanding

**One-liner:** Implement missing preview, export, customization, version history, and AI enhancement features for cover letters to achieve 100% parity with resume system.

### Complete Acceptance Criteria

**Preview System:**
- [ ] Cover letter preview renders with selected template
- [ ] Preview updates in <120ms after edit (RAF-batched)
- [ ] Scroll position preserved during updates
- [ ] All 4 cover letter templates render correctly
- [ ] Template switching works without data loss
- [ ] Preview shows actual fonts, colors, spacing from customizations

**Export System:**
- [ ] PDF export button appears in cover letter editor
- [ ] Export generates PDF in <2.5s for single-page cover letter
- [ ] All 4 templates export correctly to PDF
- [ ] Export history tracks cover letter exports
- [ ] Download link provides signed URL for retrieval
- [ ] Batch export supports cover letters
- [ ] Export respects customizations (colors, fonts, spacing)

**Customization Panel:**
- [ ] Template selector shows 4 cover letter templates with thumbnails
- [ ] Color picker modifies accent color, heading color, text color
- [ ] Typography controls adjust font family, size scale, line spacing
- [ ] Spacing controls modify margins, padding
- [ ] Customizations persist to database
- [ ] Customizations apply immediately to preview

**Version History:**
- [ ] Version snapshots created on every save
- [ ] Version history modal lists all versions with timestamps
- [ ] User can view diff between versions
- [ ] User can restore any previous version
- [ ] Restore creates new version (doesn't overwrite history)
- [ ] Version limit enforced (keep last 50 versions)

**AI Enhancement:**
- [ ] Enhancement panel accessible from editor sidebar
- [ ] User can enhance individual paragraphs
- [ ] Enhancement prompts support tone adjustment (formal, friendly, enthusiastic)
- [ ] Streaming response shows enhancement in real-time
- [ ] User can accept/reject enhancement
- [ ] AI quota tracked and enforced

**Utility Features:**
- [ ] Duplicate button creates copy with " (Copy)" suffix
- [ ] Restore button undeletes soft-deleted cover letters
- [ ] Resume linking UI shows linked resume name
- [ ] Sync contact info button pulls from linked resume

### Assumptions to Validate

**Assumption 1:** Cover letter templates support same customization props as resume templates (colors, typography, spacing)
- **Validation:** Inspect `CoverLetterTemplateBase.tsx` and verify props interface
- **Impact if false:** May need to create separate customization schema

**Assumption 2:** Existing export queue can handle both document types without performance degradation
- **Validation:** Load test with mixed queue (50/50 resumes and cover letters)
- **Impact if false:** May need separate queue or priority scheduling

**Assumption 3:** Cover letter version history can reuse same database pattern as resume versions
- **Validation:** Check foreign key constraints, RLS policies, index patterns
- **Impact if false:** Minimal - pattern is proven, just need cover_letter_versions table

**Assumption 4:** Puppeteer can render cover letter templates without layout issues
- **Validation:** Manual test each template in headless Chrome
- **Impact if false:** May need CSS adjustments for print media queries

**Assumption 5:** AI enhancement prompts for cover letters differ from resume prompts
- **Validation:** Review existing resume enhancement prompts, identify differences
- **Impact if false:** Can reuse prompts, but quality may suffer (cover letters emphasize persuasion vs. ATS optimization)

---

## 3. Constraints & Context

### Technical Constraints

**Database Constraints:**
- PostgreSQL 15+ with RLS enabled
- `cover_letters` table already has version field (integer, increments on update)
- Foreign key to `resumes` table via `linked_resume_id` (nullable)
- Soft delete pattern required (`is_deleted` flag, not hard delete)
- User isolation via RLS policies (auth.uid() = user_id)

**API Constraints:**
- All routes use Next.js App Router (async handlers)
- Authentication via `withAuth` middleware (Supabase JWT)
- Edge runtime where possible (collection routes), Node runtime for export (Puppeteer)
- Response format: `{ success: boolean, data?: T, error?: { code, message } }`
- Optimistic concurrency via version field (409 Conflict on mismatch)

**Performance Budgets:**
- Preview update: <120ms (RAF-batched, must match resume)
- PDF export: <2.5s for single-page cover letter (Puppeteer render + upload)
- API response: <500ms for CRUD operations
- Version history load: <300ms for 50 versions

**Type System:**
- TypeScript strict mode enabled
- Zod schemas for runtime validation
- Discriminated unions for polymorphic types (document_type: 'resume' | 'cover_letter')
- Type guards for safe narrowing

**Storage Constraints:**
- Supabase Storage for PDF exports
- Signed URLs for downloads (expires in 1 hour)
- Export retention: 30 days for free tier, unlimited for pro

### Stack Context

**Frontend:**
- Next.js 14 (App Router)
- React 18
- Zustand for state management (with zundo for undo/redo)
- TailwindCSS for styling
- Radix UI for components
- TipTap for rich text editing (cover letter body)

**Backend:**
- Supabase (PostgreSQL + Auth + Storage)
- Vercel AI SDK for streaming responses
- Puppeteer for PDF generation (headless Chrome)
- BullMQ for export job queue (Redis-backed)

**AI:**
- OpenAI GPT-4 for generation and enhancement
- Streaming with Server-Sent Events (SSE)
- Quota system (credits per user, tracked in database)

### Risks & Unknowns

**Risk 1: Type System Complexity**
- **Description:** Polymorphic preview system may create complex type hierarchies
- **Likelihood:** Medium
- **Impact:** High (could block implementation)
- **Mitigation:** Use separate components for cover letter preview (avoid complex generics)
- **Detection:** TypeScript compilation errors, excessive `as` casts

**Risk 2: Export Queue Performance**
- **Description:** Adding cover letter exports may increase queue latency
- **Likelihood:** Low
- **Impact:** Medium (user-facing delay)
- **Mitigation:** Monitor queue depth, add separate queue if needed, implement priority
- **Detection:** Queue depth > 100 jobs, p95 latency > 5s

**Risk 3: Template Rendering Inconsistencies**
- **Description:** Cover letter templates may render differently in Puppeteer vs. browser
- **Likelihood:** Medium
- **Impact:** High (broken PDFs)
- **Mitigation:** Test each template in headless mode, add print CSS media queries
- **Detection:** Manual PDF review, automated screenshot comparison

**Risk 4: Version History Storage Growth**
- **Description:** Storing 50 versions per cover letter may increase storage costs
- **Likelihood:** Low
- **Impact:** Low (JSONB is compressed, cover letters are small)
- **Mitigation:** Compress old versions, implement version pruning policy
- **Detection:** Database size monitoring, row count alerts

**Risk 5: AI Enhancement Prompt Quality**
- **Description:** Cover letter enhancement prompts may produce generic, unhelpful suggestions
- **Likelihood:** Medium
- **Impact:** Medium (poor UX, wasted AI credits)
- **Mitigation:** Test prompts manually, gather user feedback, iterate on prompt engineering
- **Detection:** User feedback, enhancement rejection rate > 50%

---

## 4. Solution Options

### Option A: Full Polymorphic Refactor (Unified System)

**Approach:**
Refactor existing preview, export, and customization systems to work with discriminated unions (`DocumentJson = ResumeJson | CoverLetterJson`). Create generic components that accept document type and dispatch to appropriate logic.

**Architecture:**
```typescript
// Unified preview component
interface LivePreviewProps<T extends DocumentJson> {
  documentType: 'resume' | 'cover_letter'
  store: DocumentStore<T>
  templateRegistry: TemplateRegistry<T>
}

// Unified export system
interface ExportJob {
  documentId: string
  documentType: 'resume' | 'cover_letter'
  templateId: string
  customizations: Customizations | CoverLetterCustomizations
}
```

**Scope of Changes:**
- Refactor `LivePreview.tsx` → `GenericLivePreview.tsx` with type parameter
- Refactor `TemplateRenderer.tsx` → accept discriminated union, dispatch at runtime
- Refactor `CustomizationPanel.tsx` → accept document type prop, conditional rendering
- Refactor export system → add document_type field, dispatch in renderer
- Update all stores to use generic base type
- Create type guards for safe narrowing (`isResumeJson`, `isCoverLetterJson`)

**Pros:**
- Single source of truth for preview/export logic
- Less code duplication (~30% reduction)
- Easier to add new document types (e.g., portfolio)
- Consistent UX across document types

**Cons:**
- High refactoring risk (breaks existing resume system temporarily)
- Complex type system (discriminated unions, type guards everywhere)
- Harder to debug (runtime dispatch obscures type errors)
- Longer implementation time (need to refactor + test resume system)
- Potential performance impact (runtime type checks)

**Effort Estimate:** 80-100 hours (10-12 days)

**Risks:**
- Breaking changes to resume system during refactor
- Type system complexity may introduce bugs
- Performance regression from runtime dispatch
- Rollback difficulty if approach fails

---

### Option B: Parallel Implementation (Separate Systems)

**Approach:**
Create completely separate preview, export, and customization components for cover letters. Mirror the resume implementation but with cover letter types. No shared code except utility functions.

**Architecture:**
```typescript
// Separate preview components
CoverLetterLivePreview.tsx     // Same pattern as LivePreview.tsx
CoverLetterTemplateRenderer.tsx // Same pattern as TemplateRenderer.tsx
CoverLetterCustomizationPanel.tsx // Same pattern as CustomizationPanel.tsx

// Separate export logic
coverLetterExportQueue.ts       // Separate BullMQ queue
coverLetterRenderer.ts          // Separate Puppeteer renderer
```

**Scope of Changes:**
- Create `/components/preview/cover-letter/` directory with 3 new files
- Create `/components/customization/cover-letter/` directory with 6 new files
- Create `/libs/export/queues/coverLetterQueue.ts`
- Create separate API routes for cover letter export
- No changes to existing resume system

**Pros:**
- Zero risk to existing resume system
- Type safety guaranteed (no runtime type checks)
- Easier to debug (clear separation of concerns)
- Faster implementation (no refactoring, just replication)
- Can implement incrementally (preview first, then export, etc.)

**Cons:**
- Code duplication (~60% similar code)
- Maintenance burden (fix bugs in two places)
- Inconsistent UX if implementations diverge
- Harder to add new document types later

**Effort Estimate:** 62-86 hours (8-11 days)

**Risks:**
- Drift between resume and cover letter implementations over time
- Duplicate bug fixes required
- Larger bundle size from duplicated components

---

### Option C: Hybrid Approach (Recommended)

**Approach:**
Create separate cover letter components for high-level orchestration (LivePreview, CustomizationPanel), but share low-level utilities and subcomponents (ColorCustomizer, TypographyCustomizer, export queue infrastructure).

**Architecture:**
```typescript
// Separate high-level components
CoverLetterLivePreview.tsx      // Dispatches to CoverLetterTemplateRenderer
CoverLetterCustomizationPanel.tsx // Uses shared ColorCustomizer, TypographyCustomizer

// Shared low-level components
ColorCustomizer.tsx              // Accepts callback prop, no document type coupling
TypographyCustomizer.tsx         // Same - just updates settings object
exportQueue.ts                   // Accepts document_type, dispatches to renderer
```

**Scope of Changes:**
- Create cover letter preview components (3 files)
- Create cover letter customization panel (3 files, reuse 4 subcomponents)
- Extend export queue with document_type field (modify 1 file)
- Create cover letter renderer (1 file)
- Create document type utilities (1 file for type guards, helpers)

**Pros:**
- Best of both worlds: type safety + code reuse
- Low risk to resume system (minimal changes)
- Moderate code reuse (~40%)
- Clear separation at orchestration layer
- Shared infrastructure (queue, utilities)
- Incremental implementation possible

**Cons:**
- Some code duplication in orchestration layer
- Need to maintain compatibility in shared components
- Slightly more complex than full separation

**Effort Estimate:** 62-86 hours (8-11 days)

**Risks:**
- Shared components may need refactoring for cover letter compatibility
- Interface drift if not careful with shared component contracts

---

## 5. Recommendation

### Chosen Approach: **Option C - Hybrid Approach**

**Rationale:**

1. **Type Safety:** Separate high-level components avoid complex discriminated unions and runtime type checking, maintaining TypeScript's compile-time guarantees.

2. **Risk Management:** Minimal changes to existing resume system reduce regression risk. Cover letter features can be developed and tested independently.

3. **Code Reuse:** Sharing low-level components (ColorCustomizer, TypographyCustomizer, export queue) eliminates ~40% duplication while keeping high-level orchestration separate.

4. **Incremental Delivery:** Can ship preview system first, then export, then customization. Each phase delivers user value independently.

5. **Maintainability:** Clear contracts for shared components (callbacks, props) prevent drift. High-level separation keeps domain logic isolated.

6. **Performance:** No runtime type discrimination in hot paths (preview rendering). Export queue is the only place with runtime dispatch, and it's already async.

**Evidence:**
- Implementation report shows resume preview system is ~300 LOC (lines of code)
- CustomizationPanel subcomponents are ~150 LOC each
- Export queue is ~400 LOC
- Total duplication: ~300 LOC (preview) + ~200 LOC (customization panel) = **~500 LOC duplicated**
- Total reuse: ~600 LOC (4 subcomponents @ ~150 each) + ~400 LOC (queue) = **~1000 LOC reused**
- **Reuse ratio: 67%** (1000 / 1500 total LOC)

**Trade-offs Accepted:**
- Some orchestration code duplication (CoverLetterLivePreview vs LivePreview)
- Need to document shared component contracts clearly
- Export queue becomes slightly more complex (document type dispatch)

### Impact Radius Assessment

**Low Impact (Isolated Changes):**
- Cover letter preview components (new directory, no dependencies)
- Cover letter customization panel (new files, imports shared components)
- Cover letter AI enhancement (new API route, new component)
- Version history table (new migration, no FK to resume_versions)

**Medium Impact (Extends Existing Systems):**
- Export queue (adds document_type field, dispatch logic)
- Export API routes (adds type discrimination)
- Cover letter editor page (wires up new components)
- Document dashboard (adds new actions for cover letters)

**High Impact (Cross-Cutting Changes):**
- None (by design - hybrid approach isolates high-risk changes)

**Testing Strategy for Impact Areas:**
- **Isolated changes:** Unit tests for components, API route tests
- **Extended systems:** Integration tests for export queue, end-to-end tests for full export flow
- **Regression testing:** Full resume system test suite must pass (no regressions)

---

## 6. Implementation Plan (Detailed Steps)

### Phase 1: Foundation & Type System (6-8 hours)

**Goal:** Establish type infrastructure and utilities for polymorphic document handling.

#### 1.1 Create Document Type Utilities (2 hours)

**File:** `/libs/utils/documentTypeHelpers.ts`

Create type guards and discriminator utilities:
- `isResumeDocument(doc: Resume | CoverLetter): doc is Resume` - Type guard using schema_version field
- `isCoverLetterDocument(doc: Resume | CoverLetter): doc is CoverLetter` - Type guard
- `getDocumentType(doc: Resume | CoverLetter): 'resume' | 'cover_letter'` - Extract type
- `getTemplateRegistry(type: 'resume' | 'cover_letter')` - Return appropriate registry

**Dependencies:** None
**Acceptance Criteria:**
- [ ] Type guards correctly narrow TypeScript types
- [ ] All functions have unit tests
- [ ] JSDoc comments explain usage

#### 1.2 Extend Export Types (1 hour)

**File:** `/types/export.ts`

Add document type discrimination to export types:
- Update `ExportJobInput` interface to include `documentType: 'resume' | 'cover_letter'`
- Update `ExportJob` interface with `documentType` field
- Update `ExportJobWithDocument` to use discriminated union

**Dependencies:** None
**Acceptance Criteria:**
- [ ] TypeScript compilation succeeds
- [ ] Export job creation enforces document type
- [ ] Existing resume exports continue working (backward compatible)

#### 1.3 Create Cover Letter Template Store (2 hours)

**File:** `/stores/coverLetterTemplateStore.ts`

Create Zustand store for cover letter template selection:
```typescript
interface CoverLetterTemplateState {
  templateId: CoverLetterTemplateSlug
  customizations: CoverLetterCustomizations
  setTemplateId: (id: CoverLetterTemplateSlug) => void
  updateCustomizations: (updates: Partial<CoverLetterCustomizations>) => void
}
```

Pattern: Mirror `templateStore.ts` but with cover letter types.

**Dependencies:** None
**Acceptance Criteria:**
- [ ] Store persists to localStorage (template selection survives refresh)
- [ ] Default template is 'classic-block'
- [ ] Customizations merge correctly (deep merge)
- [ ] Selectors prevent unnecessary re-renders

#### 1.4 Update Cover Letter Types (1 hour)

**File:** `/types/cover-letter.ts`

Add version history types:
- `CoverLetterVersion` interface (mirrors `ResumeVersion`)
- `CoverLetterVersionListResponse` interface
- Add utility functions: `createCoverLetterVersion()`, `parseCoverLetterVersion()`

**Dependencies:** None
**Acceptance Criteria:**
- [ ] Types align with database schema (cover_letter_versions table)
- [ ] Version number is integer, auto-incremented
- [ ] Timestamps are ISO strings

---

### Phase 2: Preview System (8-12 hours)

**Goal:** Implement live preview for cover letters with <120ms updates.

#### 2.1 Create Cover Letter Template Renderer (3 hours)

**File:** `/components/preview/cover-letter/CoverLetterTemplateRenderer.tsx`

Implement template renderer that dispatches to cover letter registry:
- Accept props: `templateId: CoverLetterTemplateSlug, data: CoverLetterJson, customizations: CoverLetterCustomizations, mode: 'edit' | 'preview' | 'print'`
- Get template from registry: `getCoverLetterTemplate(templateId)`
- Render template component with data and customizations
- Fallback to 'classic-block' if template not found
- Add error boundary for template rendering errors

**Pattern:** Mirror `TemplateRenderer.tsx` but with cover letter types.

**Dependencies:** Phase 1.1 (document type helpers), Phase 1.3 (template store)
**Acceptance Criteria:**
- [ ] All 4 cover letter templates render correctly
- [ ] Fallback template works
- [ ] Error boundary catches template errors
- [ ] Customizations apply to rendered template
- [ ] Print mode hides UI chrome (just content)

#### 2.2 Create Cover Letter Preview Container (2 hours)

**File:** `/components/preview/cover-letter/CoverLetterPreviewContainer.tsx`

Create wrapper component for cover letter preview:
- Mirror `PreviewContainer.tsx` but with cover letter page dimensions
- Apply Letter/A4 page size based on settings
- Add shadows, borders for visual fidelity
- Support zoom levels (50%, 75%, 100%, 125%, 150%)

**Dependencies:** None
**Acceptance Criteria:**
- [ ] Page size matches cover letter settings (Letter vs A4)
- [ ] Zoom works correctly
- [ ] Page breaks visible for multi-page letters
- [ ] Print preview mode hides page chrome

#### 2.3 Create Cover Letter Live Preview (4 hours)

**File:** `/components/preview/cover-letter/CoverLetterLivePreview.tsx`

Implement live preview with RAF batching:
- Subscribe to `useCoverLetterStore` with shallow selector
- Subscribe to `useCoverLetterTemplateStore` for template and customizations
- RAF-batch preview updates (requestAnimationFrame)
- Save and restore scroll position on updates
- Performance monitoring (warn if >120ms)
- Loading skeleton while document loads
- Error boundary for preview errors

**Pattern:** Mirror `LivePreview.tsx` exactly, but with cover letter types.

**Dependencies:** Phase 2.1 (renderer), Phase 2.2 (container), Phase 1.3 (template store)
**Acceptance Criteria:**
- [ ] Preview updates in <120ms (measured in dev mode)
- [ ] Scroll position preserved during updates
- [ ] Loading skeleton shows while loading
- [ ] Error boundary catches and displays errors
- [ ] RAF batching prevents redundant renders
- [ ] Performance warnings logged in dev mode

#### 2.4 Wire Up Preview to Editor Page (2 hours)

**File:** `/app/(app)/cover-letter-editor/[id]/page.tsx`

Replace preview placeholder with live preview:
- Import `CoverLetterLivePreview`
- Replace "Preview functionality coming soon" with `<CoverLetterLivePreview />`
- Add preview controls (zoom, page navigation)
- Ensure tab switching doesn't remount preview (performance)

**Dependencies:** Phase 2.3 (live preview)
**Acceptance Criteria:**
- [ ] Preview tab renders cover letter
- [ ] Preview updates when content changes
- [ ] Zoom controls work
- [ ] Tab switching is instant (no remount)
- [ ] No console errors or warnings

#### 2.5 Testing & Performance Validation (1 hour)

Run comprehensive preview tests:
- Test all 4 templates with sample data
- Measure preview update time (must be <120ms)
- Test scroll position restoration
- Test with large cover letters (3+ pages)
- Test rapid typing (ensure RAF batching works)

**Dependencies:** Phase 2.4 (wired up preview)
**Acceptance Criteria:**
- [ ] All templates render without errors
- [ ] p95 update time < 120ms
- [ ] Scroll position stable during edits
- [ ] No memory leaks (profile with DevTools)

---

### Phase 3: Template System (6-8 hours)

**Goal:** Implement template selection and switching for cover letters.

#### 3.1 Create Cover Letter Template Selector (4 hours)

**File:** `/components/customization/cover-letter/CoverLetterTemplateSelector.tsx`

Build template gallery UI:
- Fetch all cover letter templates: `listCoverLetterTemplates()`
- Display templates in grid layout (2 columns on desktop)
- Show template thumbnail (static image or live preview)
- Show template metadata (name, description, category)
- Highlight currently selected template
- On click: `setTemplateId(slug)` via template store
- Show loading state during template switch

**Pattern:** Mirror `TemplateSelector.tsx` but with cover letter registry.

**Dependencies:** Phase 1.3 (template store), Phase 2.1 (renderer for thumbnails)
**Acceptance Criteria:**
- [ ] All 4 templates displayed with thumbnails
- [ ] Current template highlighted
- [ ] Click switches template (preview updates immediately)
- [ ] Template metadata visible
- [ ] Responsive layout (1 column on mobile, 2 on desktop)
- [ ] Loading state during switch

#### 3.2 Generate Template Thumbnails (2 hours)

**Task:** Create static thumbnails for each cover letter template.

**Approach:**
- Option A: Use Puppeteer to generate screenshots (automated)
- Option B: Manually screenshot each template (faster for 4 templates)
- **Recommendation:** Option B for speed

**Steps:**
1. Load each template in preview mode with sample data
2. Screenshot at 400x600px resolution
3. Save to `/public/templates/cover-letter/[slug]-thumbnail.png`
4. Update template metadata to reference thumbnail URLs

**Dependencies:** Phase 2 (preview system working)
**Acceptance Criteria:**
- [ ] 4 thumbnail images created (classic-block, modern-minimal, creative-bold, executive-formal)
- [ ] Thumbnails optimized (< 50KB each)
- [ ] Thumbnails display correctly in template selector

#### 3.3 Wire Up Template Selector to Customization Panel (1 hour)

**File:** `/components/customization/cover-letter/CoverLetterCustomizationPanel.tsx`

Create main customization panel (initially with just template tab):
- Create panel header: "Customize Cover Letter"
- Create tab navigation: Template | Colors | Typography | Spacing
- Render `CoverLetterTemplateSelector` in Template tab
- Show placeholders for other tabs (implement in Phase 4)

**Dependencies:** Phase 3.1 (template selector)
**Acceptance Criteria:**
- [ ] Panel renders in Customize tab of editor
- [ ] Template selector shows in Template tab
- [ ] Tabs switch correctly
- [ ] Panel is scrollable if content exceeds height

#### 3.4 Update Editor Page with Customization Panel (1 hour)

**File:** `/app/(app)/cover-letter-editor/[id]/page.tsx`

Replace customization placeholder:
- Import `CoverLetterCustomizationPanel`
- Replace "Customization panel coming soon" with panel component
- Ensure panel doesn't remount on tab switch

**Dependencies:** Phase 3.3 (customization panel)
**Acceptance Criteria:**
- [ ] Customize tab shows customization panel
- [ ] Template selection works
- [ ] Preview updates immediately when template changes
- [ ] No performance issues when switching templates

---

### Phase 4: Customization System (6-8 hours)

**Goal:** Implement full customization panel (colors, typography, spacing).

#### 4.1 Verify Shared Component Compatibility (1 hour)

**Files to check:**
- `/components/customization/ColorCustomizer.tsx`
- `/components/customization/TypographyCustomizer.tsx`
- `/components/customization/SpacingCustomizer.tsx`
- `/components/customization/IconCustomizer.tsx`

**Task:** Verify these components work with cover letter customizations.

**Checks:**
- Do components accept customization object via props? (Yes, they do)
- Do components use callbacks to update customizations? (Yes, via `updateCustomizations` prop)
- Are there any resume-specific assumptions? (Check for hardcoded resume types)

**Actions if incompatible:**
- Refactor to accept generic customization object
- Add type parameter if needed
- Create cover letter-specific variants if fundamentally different

**Dependencies:** Phase 3 (customization panel structure)
**Acceptance Criteria:**
- [ ] Shared components work with `CoverLetterCustomizations` type
- [ ] No resume-specific logic in shared components
- [ ] Components accept callback props for updates

#### 4.2 Implement Color Customization (2 hours)

**File:** `/components/customization/cover-letter/CoverLetterCustomizationPanel.tsx` (Colors tab)

Wire up `ColorCustomizer` component:
- Get current customizations from `useCoverLetterTemplateStore`
- Pass `updateCustomizations` callback
- Show color preview in real-time
- Support template-specific color schemes (e.g., classic-block uses blue, creative-bold uses vibrant colors)

**Shared Component:** `ColorCustomizer.tsx` (reuse existing)

**Dependencies:** Phase 4.1 (compatibility verified)
**Acceptance Criteria:**
- [ ] Color picker shows current accent color
- [ ] Changing color updates preview immediately
- [ ] Color persists to template store (localStorage)
- [ ] Template-specific color schemes work

#### 4.3 Implement Typography Customization (2 hours)

**File:** `/components/customization/cover-letter/CoverLetterCustomizationPanel.tsx` (Typography tab)

Wire up typography controls:
- Font family dropdown (Inter, Source Sans 3, Lora, etc.)
- Font size scale slider (0.8 - 1.2)
- Line spacing slider (1.0 - 1.8) - Cover letters need more spacing than resumes
- Icon toggle (show/hide icons in letterhead)

**Shared Components:** `TypographyCustomizer.tsx`, `IconCustomizer.tsx`

**Dependencies:** Phase 4.1 (compatibility verified)
**Acceptance Criteria:**
- [ ] Font family changes apply to preview
- [ ] Font size scale adjusts heading and body text proportionally
- [ ] Line spacing affects paragraph spacing
- [ ] Icon toggle works if template supports icons
- [ ] Settings persist to store

#### 4.4 Implement Spacing Customization (2 hours)

**File:** `/components/customization/cover-letter/CoverLetterCustomizationPanel.tsx` (Spacing tab)

Wire up spacing controls:
- Margin slider (page margins: 0.5in - 1.5in)
- Section spacing slider (spacing between paragraphs)
- Letterhead toggle (show/hide sender info header)
- Date toggle (show/hide date field)

**Shared Component:** `SpacingCustomizer.tsx`

**Cover Letter Specific:**
- Letterhead toggle (unique to cover letters)
- Date toggle (unique to cover letters)

**Dependencies:** Phase 4.1 (compatibility verified)
**Acceptance Criteria:**
- [ ] Margin changes visible in preview
- [ ] Section spacing adjusts paragraph gaps
- [ ] Letterhead toggle hides/shows sender info
- [ ] Date toggle hides/shows date field
- [ ] Settings persist to store

#### 4.5 Persist Customizations to Database (1 hour)

**File:** `/stores/coverLetterStore.ts`

Update store to save customizations to database:
- Merge customizations into `data.settings` field
- Trigger auto-save when customizations change
- Ensure customizations persist on page reload

**Pattern:**
```typescript
updateCustomizations: (updates) => {
  const current = get().document
  if (!current) return

  const nextSettings = { ...current.settings, ...updates }
  updateDocument({ settings: nextSettings })
}
```

**Dependencies:** Phase 4.2-4.4 (customization UI working)
**Acceptance Criteria:**
- [ ] Customizations saved to database on auto-save
- [ ] Customizations loaded correctly on page reload
- [ ] No loss of customizations when switching tabs
- [ ] Undo/redo works for customization changes

---

### Phase 5: Export System (12-16 hours)

**Goal:** Implement PDF export for cover letters with <2.5s target.

#### 5.1 Create Cover Letter Version Table Migration (2 hours)

**File:** `/migrations/phase7/024_create_cover_letter_versions_table.sql`

Create version history table:
```sql
CREATE TABLE public.cover_letter_versions (
  id BIGSERIAL PRIMARY KEY,
  cover_letter_id UUID NOT NULL REFERENCES public.cover_letters(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  data JSONB NOT NULL CHECK (jsonb_typeof(data) = 'object'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  UNIQUE (cover_letter_id, version_number)
);

CREATE INDEX idx_cover_letter_versions_cover_letter
  ON public.cover_letter_versions(cover_letter_id, version_number DESC);

-- RLS policies
ALTER TABLE public.cover_letter_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY cover_letter_versions_select_own ON public.cover_letter_versions
  FOR SELECT USING (
    created_by = auth.uid()
  );

CREATE POLICY cover_letter_versions_insert_own ON public.cover_letter_versions
  FOR INSERT WITH CHECK (
    created_by = auth.uid()
  );
```

**Dependencies:** None
**Acceptance Criteria:**
- [ ] Migration runs successfully
- [ ] Table created with correct schema
- [ ] RLS policies enforce user isolation
- [ ] Foreign keys cascade correctly
- [ ] Index supports efficient version listing

#### 5.2 Add Version Snapshot to Cover Letter Update (2 hours)

**File:** `/libs/repositories/coverLetters.ts`

Modify `updateCoverLetter` function to create version snapshots:
- Before update, insert current version into `cover_letter_versions` table
- Use transaction to ensure atomicity
- Limit to last 50 versions (delete older versions)

**Pattern:** Mirror resume version snapshot logic from `updateResume`.

**Dependencies:** Phase 5.1 (versions table exists)
**Acceptance Criteria:**
- [ ] Version created on every update
- [ ] Version number matches cover letter version field
- [ ] Transaction ensures version + update are atomic
- [ ] Old versions pruned (keep only last 50)
- [ ] No version created if update fails

#### 5.3 Extend Export Queue with Document Type (3 hours)

**File:** `/libs/export/queue.ts`

Add document type discrimination to export queue:
- Update `createExportJob` to accept `documentType: 'resume' | 'cover_letter'`
- Update job payload to include document type
- Dispatch to appropriate renderer based on document type:
  - `documentType === 'resume'` → `resumeRenderer.ts`
  - `documentType === 'cover_letter'` → `coverLetterRenderer.ts`
- Maintain backward compatibility (default to 'resume' for existing jobs)

**Dependencies:** Phase 1.2 (export types extended)
**Acceptance Criteria:**
- [ ] Queue accepts both document types
- [ ] Job payload includes documentType field
- [ ] Dispatcher routes to correct renderer
- [ ] Existing resume exports continue working
- [ ] Error handling for unknown document types

#### 5.4 Create Cover Letter Puppeteer Renderer (5 hours)

**File:** `/libs/export/renderers/coverLetterRenderer.ts`

Implement Puppeteer rendering for cover letters:
- Accept job payload: `{ coverLetterId, templateId, customizations }`
- Fetch cover letter from database
- Get template component from registry
- Render template in headless Chrome
- Apply print CSS (hide UI chrome, optimize for PDF)
- Generate PDF with Puppeteer (page size from settings)
- Upload PDF to Supabase Storage
- Return download URL

**Pattern:** Mirror `resumeRenderer.ts` but with cover letter types.

**Key Differences:**
- Cover letters are typically 1 page (simpler page break logic)
- Use cover letter template registry
- Apply cover letter customizations

**Dependencies:** Phase 5.3 (queue dispatcher), Phase 2.1 (template renderer)
**Acceptance Criteria:**
- [ ] PDF generated for all 4 templates
- [ ] Page size respects settings (Letter vs A4)
- [ ] Customizations applied (fonts, colors, spacing)
- [ ] PDF uploaded to Supabase Storage
- [ ] Render time <2.5s for single-page letter
- [ ] Error handling for template rendering failures

#### 5.5 Create Export API Routes for Cover Letters (2 hours)

**Files:**
- `/app/api/v1/cover-letters/[id]/export/route.ts` - Single export
- Update `/app/api/v1/export/batch/route.ts` - Batch export

**Single Export Endpoint:**
```typescript
POST /api/v1/cover-letters/[id]/export
Body: { templateId?, customizations? }
Response: { jobId, status: 'queued' }
```

**Batch Export Update:**
Add support for cover letter documents in batch export payload.

**Dependencies:** Phase 5.4 (renderer working)
**Acceptance Criteria:**
- [ ] Single export creates job and returns job ID
- [ ] Batch export supports cover letters
- [ ] Authentication enforced (withAuth)
- [ ] Ownership verified (user owns cover letter)
- [ ] Error handling for invalid IDs
- [ ] Quota enforcement (export credits)

#### 5.6 Wire Up Export Button to Editor Page (1 hour)

**File:** `/app/(app)/cover-letter-editor/[id]/page.tsx`

Add export functionality to editor:
- Add "Export PDF" button in editor header or tab
- On click: call export API, show loading state
- Poll job status until complete
- Show download link when ready
- Handle export errors

**Dependencies:** Phase 5.5 (export API working)
**Acceptance Criteria:**
- [ ] Export button visible in editor
- [ ] Loading state during export
- [ ] Download link appears when ready
- [ ] Error messages shown on failure
- [ ] Export uses current template and customizations

#### 5.7 Add Export History for Cover Letters (1 hour)

**File:** `/app/api/v1/export/history/route.ts`

Update export history endpoint to include cover letters:
- Accept `documentType` query parameter
- Filter exports by document type
- Return unified history (resumes + cover letters)

**Dependencies:** Phase 5.5 (export API working)
**Acceptance Criteria:**
- [ ] Export history shows cover letter exports
- [ ] Filter by document type works
- [ ] Download links valid for 1 hour
- [ ] Pagination works correctly

---

### Phase 6: Version History (8-10 hours)

**Goal:** Implement version history for cover letters.

#### 6.1 Create Version Repository Functions (3 hours)

**File:** `/libs/repositories/coverLetterVersions.ts`

Implement version history repository:
- `getCoverLetterVersions(supabase, coverLetterId)` - List all versions
- `getCoverLetterVersion(supabase, coverLetterId, versionNumber)` - Get specific version
- `restoreCoverLetterVersion(supabase, userId, coverLetterId, versionNumber)` - Restore version (creates new version with restored data)
- `pruneCoverLetterVersions(supabase, coverLetterId, keepLast = 50)` - Delete old versions

**Pattern:** Mirror `versions.ts` (resume versions).

**Dependencies:** Phase 5.1 (versions table created)
**Acceptance Criteria:**
- [ ] All functions have proper error handling
- [ ] RLS policies enforced (user isolation)
- [ ] Restore creates new version (doesn't overwrite)
- [ ] Prune deletes oldest versions first
- [ ] All functions tested (unit tests)

#### 6.2 Create Version History API Routes (3 hours)

**Files:**
- `/app/api/v1/cover-letters/[id]/versions/route.ts` - List versions
- `/app/api/v1/cover-letters/[id]/versions/[versionNumber]/route.ts` - Get version
- `/app/api/v1/cover-letters/[id]/versions/[versionNumber]/restore/route.ts` - Restore version

**Endpoints:**
```typescript
GET    /api/v1/cover-letters/[id]/versions
       Response: { versions: CoverLetterVersion[], total: number }

GET    /api/v1/cover-letters/[id]/versions/[versionNumber]
       Response: { version: CoverLetterVersion }

POST   /api/v1/cover-letters/[id]/versions/[versionNumber]/restore
       Response: { coverLetter: CoverLetter } (new version created)
```

**Dependencies:** Phase 6.1 (repository functions)
**Acceptance Criteria:**
- [ ] All endpoints authenticated (withAuth)
- [ ] Ownership verified (user owns cover letter)
- [ ] Error handling for not found, unauthorized
- [ ] Restore creates new version number
- [ ] API responses follow standard format

#### 6.3 Create Version History UI Component (4 hours)

**File:** `/components/editor/cover-letter/CoverLetterVersionHistory.tsx`

Build version history modal:
- Show list of versions (version number, timestamp, preview)
- Highlight current version
- Show diff between versions (optional - nice to have)
- "Restore" button for each version
- Confirmation dialog before restore

**Pattern:** Mirror `VersionHistory.tsx` (resume version history).

**UI Elements:**
- Modal with scrollable version list
- Version card: version number, date, preview snippet
- Restore button (confirm before restore)
- Current version badge
- Loading states

**Dependencies:** Phase 6.2 (API routes working)
**Acceptance Criteria:**
- [ ] All versions displayed with timestamps
- [ ] Current version highlighted
- [ ] Restore creates new version (updates editor)
- [ ] Confirmation dialog before restore
- [ ] Error handling for restore failures
- [ ] Modal accessible (keyboard navigation, screen reader)

#### 6.4 Wire Up Version History to Editor Page (1 hour)

**File:** `/app/(app)/cover-letter-editor/[id]/page.tsx`

Add version history to editor:
- Add "Version History" button in editor header
- On click: open `CoverLetterVersionHistory` modal
- Update editor when version restored

**Dependencies:** Phase 6.3 (version history UI)
**Acceptance Criteria:**
- [ ] Version history button visible
- [ ] Modal opens on click
- [ ] Editor updates when version restored
- [ ] Undo/redo history cleared after restore
- [ ] Save status updates after restore

---

### Phase 7: AI Features (8-10 hours)

**Goal:** Implement AI enhancement for cover letter paragraphs.

#### 7.1 Create AI Enhancement API Route (4 hours)

**File:** `/app/api/v1/cover-letters/[id]/enhance/route.ts`

Implement enhancement endpoint:
```typescript
POST /api/v1/cover-letters/[id]/enhance
Body: {
  paragraphIndex: number,
  tone: 'formal' | 'friendly' | 'enthusiastic',
  focus: 'clarity' | 'persuasiveness' | 'conciseness'
}
Response: StreamingTextResponse (SSE)
```

**Enhancement Prompt:**
```
You are a professional cover letter editor. Improve the following paragraph:

Original: {paragraph text}

Requirements:
- Tone: {tone}
- Focus: {focus}
- Length: Keep similar length (±20%)
- Preserve: Key facts, company name, position title
- Improve: Clarity, persuasiveness, professionalism

Enhanced paragraph:
```

**Dependencies:** None (uses existing AI infrastructure)
**Acceptance Criteria:**
- [ ] Endpoint accepts paragraph index and options
- [ ] Streaming response works (SSE)
- [ ] Enhancement respects tone parameter
- [ ] Enhancement preserves key facts
- [ ] Quota enforcement (AI credits)
- [ ] Error handling for quota exceeded, AI failures

#### 7.2 Create Enhancement UI Component (4 hours)

**File:** `/components/enhance/cover-letter/CoverLetterEnhancementPanel.tsx`

Build AI enhancement panel:
- Show enhancement trigger button for each paragraph
- Show enhancement options (tone, focus)
- Show streaming response in real-time
- Accept/reject buttons for enhancement
- Loading state during enhancement

**UI Flow:**
1. User hovers over paragraph → enhancement button appears
2. User clicks → enhancement panel opens with options
3. User selects tone and focus → enhancement streams in
4. User reviews → clicks "Accept" or "Reject"
5. Accept → paragraph updated, panel closes
6. Reject → original text kept, panel closes

**Dependencies:** Phase 7.1 (API route working)
**Acceptance Criteria:**
- [ ] Enhancement button visible on paragraph hover
- [ ] Options panel shows tone and focus dropdowns
- [ ] Streaming enhancement displays in real-time
- [ ] Accept updates paragraph in editor
- [ ] Reject discards enhancement
- [ ] Undo/redo works after accept
- [ ] Loading state during enhancement

#### 7.3 Wire Up Enhancement to Editor Page (1 hour)

**File:** `/app/(app)/cover-letter-editor/[id]/page.tsx`

Integrate enhancement panel:
- Add enhancement panel to editor sidebar or as floating panel
- Connect to rich text editor (TipTap integration)
- Update cover letter store when enhancement accepted

**Dependencies:** Phase 7.2 (enhancement UI)
**Acceptance Criteria:**
- [ ] Enhancement panel accessible in editor
- [ ] Panel doesn't block editing
- [ ] Accepted enhancements trigger auto-save
- [ ] Enhancement history tracked (analytics)

#### 7.4 Add Quota Enforcement (1 hour)

**File:** `/app/api/v1/cover-letters/[id]/enhance/route.ts`

Enforce AI quota limits:
- Check user's remaining AI credits before enhancement
- Deduct credits on successful enhancement
- Return error if quota exceeded
- Show remaining credits in UI

**Dependencies:** Phase 7.1 (API route), existing quota system
**Acceptance Criteria:**
- [ ] Quota checked before enhancement
- [ ] Credits deducted on success
- [ ] Error shown if quota exceeded
- [ ] Remaining credits visible in UI

---

### Phase 8: Utility Features (4-6 hours)

**Goal:** Implement duplicate, restore, and resume linking UI.

#### 8.1 Create Duplicate API Route (1 hour)

**File:** `/app/api/v1/cover-letters/[id]/duplicate/route.ts`

Implement duplicate endpoint:
```typescript
POST /api/v1/cover-letters/[id]/duplicate
Response: { coverLetter: CoverLetter } (new cover letter with " (Copy)" title)
```

**Repository function already exists:** `duplicateCoverLetter(supabase, userId, id)`

**Dependencies:** None (repository already implemented)
**Acceptance Criteria:**
- [ ] Creates copy with " (Copy)" suffix
- [ ] Copies all data (except id, created_at)
- [ ] Sets status to 'draft'
- [ ] Returns new cover letter
- [ ] Ownership verified

#### 8.2 Create Restore API Route (1 hour)

**File:** `/app/api/v1/cover-letters/[id]/restore/route.ts`

Implement restore endpoint:
```typescript
POST /api/v1/cover-letters/[id]/restore
Response: { coverLetter: CoverLetter } (undeleted cover letter)
```

**Repository function already exists:** `restoreCoverLetter(supabase, id)`

**Dependencies:** None (repository already implemented)
**Acceptance Criteria:**
- [ ] Sets is_deleted = false
- [ ] Clears deleted_at timestamp
- [ ] Returns restored cover letter
- [ ] Ownership verified

#### 8.3 Add Duplicate Button to Dashboard (1 hour)

**File:** `/components/documents/UnifiedDocumentDashboard.tsx`

Add duplicate action to cover letter cards:
- Add "Duplicate" button to cover letter action menu
- On click: call duplicate API, navigate to new cover letter
- Show loading state during duplication

**Dependencies:** Phase 8.1 (duplicate API)
**Acceptance Criteria:**
- [ ] Duplicate button visible for cover letters
- [ ] Click creates copy and navigates to editor
- [ ] Loading state during duplication
- [ ] Error handling for duplicate failures

#### 8.4 Implement Resume Linking UI (2 hours)

**File:** `/app/(app)/cover-letter-editor/[id]/page.tsx`

Add resume linking controls:
- Add "Link to Resume" dropdown in editor sidebar
- Dropdown lists user's resumes
- On select: call link API
- Add "Sync Contact Info" button (calls sync API)
- Show linked resume name in editor header

**Existing APIs:**
- `POST /api/v1/cover-letters/[id]/link` - Link to resume
- `POST /api/v1/cover-letters/[id]/sync` - Sync contact info from resume

**Dependencies:** None (APIs already exist)
**Acceptance Criteria:**
- [ ] Dropdown shows user's resumes
- [ ] Linking works (updates linked_resume_id)
- [ ] Linked resume name visible in header
- [ ] Sync button pulls contact info from resume
- [ ] "Unlink" option available
- [ ] Error handling for link/sync failures

#### 8.5 Add Trash and Restore UI (1 hour)

**File:** `/components/documents/UnifiedDocumentDashboard.tsx`

Add trash view for soft-deleted cover letters:
- Add "Trash" tab to dashboard
- Show deleted cover letters with restore button
- On restore: call restore API, remove from trash
- Add permanent delete option (optional)

**Dependencies:** Phase 8.2 (restore API)
**Acceptance Criteria:**
- [ ] Trash tab shows deleted cover letters
- [ ] Restore button works
- [ ] Restored cover letters removed from trash
- [ ] Empty state for empty trash
- [ ] Confirmation before permanent delete (if implemented)

---

### Phase 9: Integration & Polish (6-8 hours)

**Goal:** Final integration, testing, performance optimization, accessibility.

#### 9.1 Update Navigation and Routing (1 hour)

**Files:**
- `/components/layout/Sidebar.tsx` - Verify cover letter links
- `/app/(app)/layout.tsx` - Verify routing

**Tasks:**
- Ensure "New Cover Letter" link works
- Ensure cover letter editor is accessible from dashboard
- Ensure breadcrumbs show correct paths
- Ensure active states highlight correctly

**Dependencies:** All phases (full feature set)
**Acceptance Criteria:**
- [ ] Navigation links work correctly
- [ ] Active states highlight appropriately
- [ ] Breadcrumbs show correct paths
- [ ] Mobile navigation works

#### 9.2 Add Analytics Tracking (1 hour)

**Files:** All cover letter components

**Events to track:**
- `cover_letter_created` - When user creates cover letter
- `cover_letter_template_changed` - When user switches template
- `cover_letter_customization_changed` - When user modifies customizations
- `cover_letter_exported` - When user exports PDF
- `cover_letter_enhanced` - When user uses AI enhancement
- `cover_letter_version_restored` - When user restores version

**Pattern:** Use existing analytics infrastructure (PostHog, Mixpanel, or GA4).

**Dependencies:** All phases
**Acceptance Criteria:**
- [ ] All events tracked correctly
- [ ] Event metadata includes document ID, user ID, timestamp
- [ ] No PII in event payloads
- [ ] Analytics don't block user interactions

#### 9.3 Performance Optimization (2 hours)

**Tasks:**
- Profile preview rendering (ensure <120ms)
- Profile export rendering (ensure <2.5s)
- Optimize bundle size (lazy load cover letter components)
- Optimize database queries (add indexes if needed)
- Test with large cover letters (3+ pages)

**Tools:**
- Chrome DevTools Performance profiler
- React DevTools Profiler
- Lighthouse audit
- Database query analyzer (Supabase dashboard)

**Dependencies:** All phases
**Acceptance Criteria:**
- [ ] Preview update time p95 < 120ms
- [ ] Export time p95 < 2.5s
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3.5s
- [ ] Lighthouse Performance score > 90
- [ ] No unnecessary re-renders (React DevTools)

#### 9.4 Accessibility Audit (2 hours)

**Tasks:**
- Run axe DevTools audit
- Test keyboard navigation (tab, enter, escape)
- Test screen reader (VoiceOver or NVDA)
- Add ARIA labels where needed
- Ensure color contrast meets WCAG AA
- Test with reduced motion preference

**Key Areas:**
- Template selector (keyboard navigation)
- Customization controls (sliders, dropdowns)
- Version history modal (modal focus trap)
- Export button (loading state announced)
- Enhancement panel (streaming text accessible)

**Dependencies:** All phases
**Acceptance Criteria:**
- [ ] axe DevTools reports 0 critical issues
- [ ] Keyboard navigation works (all interactive elements reachable)
- [ ] Screen reader announces all state changes
- [ ] Color contrast ratio ≥ 4.5:1 for text
- [ ] Focus indicators visible
- [ ] Reduced motion preference respected

#### 9.5 Cross-Browser Testing (1 hour)

**Browsers to test:**
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

**Features to test:**
- Preview rendering
- Template switching
- Customization controls
- PDF export
- Version history modal

**Dependencies:** All phases
**Acceptance Criteria:**
- [ ] All features work in Chrome
- [ ] All features work in Firefox
- [ ] All features work in Safari
- [ ] All features work in Edge
- [ ] No browser-specific bugs

#### 9.6 Mobile Responsiveness (1 hour)

**Tasks:**
- Test on mobile devices (iPhone, Android)
- Ensure touch targets ≥ 44x44px
- Ensure text is readable (font size ≥ 16px)
- Ensure modals fit screen (version history, enhancement)
- Test mobile preview (zoom, pan)

**Dependencies:** All phases
**Acceptance Criteria:**
- [ ] All features work on mobile
- [ ] Touch targets meet minimum size
- [ ] Text is readable without zoom
- [ ] Modals don't overflow screen
- [ ] Preview usable on mobile (zoom, pan work)

---

## 7. Quality Gates

### Static Checks (Required before merge)

**TypeScript Compilation:**
```bash
npm run type-check
# Expected: 0 errors
```

**Linting:**
```bash
npm run lint
# Expected: 0 errors, warnings acceptable if documented
```

**Build:**
```bash
npm run build
# Expected: Successful build, no errors
```

**Unit Tests:**
```bash
npm run test
# Expected: All tests pass, coverage ≥ 80% for new code
```

**Integration Tests:**
```bash
npm run test:integration
# Expected: All cover letter integration tests pass
```

### Code Health Standards

**TypeScript:**
- No `any` types (use `unknown` or proper types)
- No `@ts-ignore` (use `@ts-expect-error` with explanation)
- All functions have return types
- All public APIs have JSDoc comments

**React:**
- All components have display names
- No inline function definitions in JSX (use useCallback)
- Memoize expensive components (React.memo)
- Use shallow selectors for Zustand (prevent re-renders)

**Performance:**
- Preview updates <120ms (p95)
- Export time <2.5s (p95)
- Bundle size increase <100KB (gzipped)
- No memory leaks (Chrome DevTools Profiler)

**Accessibility:**
- axe DevTools: 0 critical issues
- Keyboard navigation: All features accessible
- Screen reader: All state changes announced
- Color contrast: WCAG AA (4.5:1 for text)

### Manual Smoke Test Procedure

**Prerequisites:**
- Local development environment running
- Test user account with AI quota
- Test resumes created (for linking)

**Test Scenarios:**

**Scenario 1: Create and Edit Cover Letter**
1. Click "New Cover Letter" in sidebar
2. Verify redirect to editor
3. Edit sender info (name, email, phone)
4. Edit recipient info (company name)
5. Edit letter body (type several paragraphs)
6. Verify auto-save works (save status indicator)
7. Verify preview updates in <120ms

**Expected:** All edits save correctly, preview updates smoothly.

**Scenario 2: Template Switching**
1. Open customization panel
2. Switch to each template (4 total)
3. Verify preview updates for each template
4. Verify no data loss during switch

**Expected:** All templates render correctly, data persists.

**Scenario 3: Customization**
1. Change accent color
2. Change font family
3. Adjust font size scale
4. Adjust line spacing
5. Adjust margins
6. Toggle letterhead
7. Toggle date

**Expected:** All customizations apply to preview immediately, persist on reload.

**Scenario 4: PDF Export**
1. Click "Export PDF" button
2. Verify loading state
3. Wait for download link
4. Download PDF
5. Open PDF, verify layout matches preview

**Expected:** Export completes in <2.5s, PDF matches preview.

**Scenario 5: Version History**
1. Edit cover letter (change body text)
2. Wait for auto-save
3. Edit again (change salutation)
4. Wait for auto-save
5. Open version history
6. Verify 2 versions listed
7. Restore first version
8. Verify editor updates with old content

**Expected:** All versions listed, restore works correctly.

**Scenario 6: AI Enhancement**
1. Open enhancement panel
2. Select a paragraph
3. Choose tone and focus
4. Click "Enhance"
5. Verify streaming response
6. Click "Accept"
7. Verify paragraph updated in editor

**Expected:** Enhancement streams correctly, paragraph updates on accept.

**Scenario 7: Duplicate and Restore**
1. Duplicate cover letter from dashboard
2. Verify copy created with " (Copy)" suffix
3. Delete original cover letter
4. Go to trash tab
5. Restore deleted cover letter
6. Verify cover letter restored

**Expected:** Duplicate works, restore works, trash UI shows deleted items.

---

## 8. Observability & Operations

### Logging Requirements

**Application Logs:**
- **Preview rendering:** Log preview update time if >120ms (warn level)
- **Export jobs:** Log job creation, start, completion, failure (info/error level)
- **AI enhancement:** Log enhancement requests, success/failure, token usage (info level)
- **Version history:** Log version creation, restore operations (info level)
- **Errors:** Log all errors with stack traces, user ID, document ID (error level)

**Log Format:**
```typescript
{
  timestamp: "2025-10-06T12:34:56Z",
  level: "info" | "warn" | "error",
  message: "Preview update completed",
  context: {
    userId: "uuid",
    documentId: "uuid",
    documentType: "cover_letter",
    duration: 85, // ms
    templateId: "classic-block"
  }
}
```

**Log Destinations:**
- Development: Console
- Production: Vercel Logs, Supabase Logs, PostHog (optional)

### Metrics to Track

**Performance Metrics:**
- `cover_letter.preview.update_time` - Histogram (ms)
- `cover_letter.export.duration` - Histogram (ms)
- `cover_letter.export.queue_depth` - Gauge
- `cover_letter.api.response_time` - Histogram (ms)

**Business Metrics:**
- `cover_letter.created` - Counter
- `cover_letter.exported` - Counter
- `cover_letter.template_switched` - Counter
- `cover_letter.enhanced` - Counter
- `cover_letter.version_restored` - Counter

**Error Metrics:**
- `cover_letter.export.failed` - Counter
- `cover_letter.enhancement.failed` - Counter
- `cover_letter.api.errors` - Counter (labeled by route)

**Metric Collection:**
- Use PostHog for product analytics
- Use Vercel Analytics for performance metrics
- Use Supabase metrics for database performance

### Monitoring & Alerting

**Alerts to Create:**

**Critical Alerts (PagerDuty/Slack):**
- Export queue depth > 500 jobs (indicates queue backup)
- p95 export time > 10s (indicates performance degradation)
- Error rate > 5% (indicates systemic issue)
- Database CPU > 80% (indicates query performance issue)

**Warning Alerts (Slack only):**
- Export queue depth > 100 jobs
- p95 export time > 5s
- Error rate > 1%
- Preview update time > 200ms (p95)

**Alert Channels:**
- Critical: PagerDuty + Slack #engineering-alerts
- Warning: Slack #engineering-alerts

### Configuration Changes

**Environment Variables:**
- `COVER_LETTER_EXPORT_TIMEOUT_MS` - Export timeout (default: 30000)
- `COVER_LETTER_VERSION_LIMIT` - Max versions to keep (default: 50)
- `COVER_LETTER_ENHANCEMENT_QUOTA` - AI credits per enhancement (default: 10)

**Feature Flags:**
- `cover_letter_export_enabled` - Enable/disable export feature
- `cover_letter_enhancement_enabled` - Enable/disable AI enhancement
- `cover_letter_version_history_enabled` - Enable/disable version history

**Database Configuration:**
- No configuration changes required
- Indexes created via migrations

---

## 9. Rollout & Cutover

### Deployment Strategy

**Approach:** Incremental rollout with feature flags.

**Phase 1: Preview System (Week 1)**
- Deploy preview components
- Enable for internal team (feature flag: `cover_letter_preview_enabled`)
- Verify preview works for all templates
- Monitor performance (preview update time)
- Enable for 10% of users
- Monitor error rate, performance
- Enable for 100% of users

**Phase 2: Export System (Week 2)**
- Deploy export queue changes
- Deploy cover letter renderer
- Enable for internal team (feature flag: `cover_letter_export_enabled`)
- Test exports for all templates
- Monitor queue depth, export time
- Enable for 10% of users
- Monitor error rate, queue performance
- Enable for 100% of users

**Phase 3: Customization & Version History (Week 3)**
- Deploy customization panel
- Deploy version history
- Enable for internal team
- Test customizations, version restore
- Enable for 50% of users
- Monitor performance, error rate
- Enable for 100% of users

**Phase 4: AI Enhancement (Week 4)**
- Deploy enhancement API and UI
- Enable for internal team (feature flag: `cover_letter_enhancement_enabled`)
- Test enhancement quality
- Monitor AI quota usage, error rate
- Enable for 25% of users
- Gather user feedback
- Enable for 100% of users

### Feature Flag Management

**Tool:** LaunchDarkly, Vercel Edge Config, or custom solution

**Flag Definitions:**
```typescript
{
  cover_letter_preview_enabled: boolean,
  cover_letter_export_enabled: boolean,
  cover_letter_customization_enabled: boolean,
  cover_letter_version_history_enabled: boolean,
  cover_letter_enhancement_enabled: boolean
}
```

**Flag Evaluation:**
- Server-side evaluation (API routes)
- Client-side evaluation (UI components)
- Default: `false` (all features disabled until explicitly enabled)

### Verification Steps

**Post-Deployment Verification:**

**Step 1: Health Check**
- [ ] All API routes return 200 OK for health checks
- [ ] Database connections healthy
- [ ] Export queue processing jobs
- [ ] No critical errors in logs

**Step 2: Feature Verification (Internal Team)**
- [ ] Create cover letter → works
- [ ] Preview renders → works
- [ ] Template switch → works
- [ ] Customization → works
- [ ] Export PDF → works
- [ ] Version history → works
- [ ] AI enhancement → works

**Step 3: Performance Verification**
- [ ] Preview update time p95 < 120ms
- [ ] Export time p95 < 2.5s
- [ ] API response time p95 < 500ms
- [ ] No memory leaks (monitor for 1 hour)

**Step 4: Error Monitoring**
- [ ] Error rate < 1%
- [ ] No critical errors in logs
- [ ] All alerts configured and working

**Step 5: User Testing (10% Rollout)**
- [ ] Monitor user feedback (support tickets, in-app feedback)
- [ ] Monitor analytics (feature usage, conversion rate)
- [ ] Monitor performance (p95 latency, error rate)

**Step 6: Full Rollout (100%)**
- [ ] Enable all feature flags
- [ ] Monitor for 24 hours
- [ ] Verify no regressions in resume system

### Rollback Plan

**Rollback Triggers:**
- Error rate > 5% for 5 minutes
- Export queue depth > 1000 jobs
- p95 export time > 10s
- Critical bug discovered (data loss, security issue)

**Rollback Procedure:**

**Step 1: Disable Feature Flags**
```bash
# Disable all cover letter features
vercel env set COVER_LETTER_PREVIEW_ENABLED false
vercel env set COVER_LETTER_EXPORT_ENABLED false
vercel env set COVER_LETTER_CUSTOMIZATION_ENABLED false
vercel env set COVER_LETTER_VERSION_HISTORY_ENABLED false
vercel env set COVER_LETTER_ENHANCEMENT_ENABLED false
```

**Step 2: Revert Deployment**
```bash
# Revert to previous deployment
vercel rollback
```

**Step 3: Verify Rollback**
- [ ] Resume system works correctly
- [ ] Error rate returns to baseline
- [ ] Export queue drains
- [ ] No new cover letter data created

**Step 4: Root Cause Analysis**
- Analyze logs to identify root cause
- Create bug report with reproduction steps
- Fix issue in separate branch
- Re-test before re-deployment

**Step 5: Re-deployment**
- Deploy fix to staging
- Test all features in staging
- Deploy to production with 10% rollout
- Monitor for 24 hours
- Gradual rollout to 100%

---

## 10. Legacy Cleanup

### Code to Delete

**Placeholder Components:**
- Remove "Preview functionality coming soon" placeholder from `/app/(app)/cover-letter-editor/[id]/page.tsx`
- Remove "Customization panel coming soon" placeholder from `/app/(app)/cover-letter-editor/[id]/page.tsx`

**Unused Files:**
- None (no dead code identified in implementation report)

**Deprecated APIs:**
- None (cover letter repository functions already exist, just need routes)

### Documentation to Update

**User-Facing Documentation:**
- [ ] Update cover letter guide with preview, export, customization instructions
- [ ] Add screenshots of new features
- [ ] Document template selection process
- [ ] Document AI enhancement feature
- [ ] Document version history feature

**Developer Documentation:**
- [ ] Update architecture docs with cover letter system design
- [ ] Document export queue changes (document type discrimination)
- [ ] Document cover letter template development guide
- [ ] Update API reference with new endpoints
- [ ] Update database schema docs with cover_letter_versions table

**Inline Code Comments:**
- [ ] Add JSDoc comments to all new functions
- [ ] Document type guards and discriminators
- [ ] Document performance optimizations (RAF batching)
- [ ] Document export renderer logic

### Migration Guides

**Database Migration:**
- Migration `/migrations/phase7/024_create_cover_letter_versions_table.sql` is additive (no breaking changes)
- No data migration required (new table, no existing data)

**API Changes:**
- All new endpoints (no breaking changes to existing APIs)
- Export queue change is backward compatible (defaults to 'resume' for existing jobs)

**Breaking Changes:**
- None (all changes are additive)

---

## 11. Ready-to-Implement Checklist

### Pre-Implementation Checklist

**Environment Setup:**
- [ ] Local development environment running (Next.js dev server)
- [ ] Supabase project accessible (local or cloud)
- [ ] Database migrations up to date (Phase 7 migrations applied)
- [ ] Test data available (resumes for linking, AI quota allocated)
- [ ] Feature flags configured (if using feature flag system)

**Code Readiness:**
- [ ] Main branch up to date
- [ ] No merge conflicts
- [ ] All tests passing on main
- [ ] TypeScript compilation successful
- [ ] Linting passing

**Knowledge Requirements:**
- [ ] Familiarity with Zustand state management
- [ ] Familiarity with Zustand temporal middleware (undo/redo)
- [ ] Understanding of RAF batching for performance
- [ ] Understanding of Puppeteer PDF generation
- [ ] Understanding of Server-Sent Events (SSE) for streaming

**Dependencies:**
- [ ] Puppeteer installed and configured
- [ ] Redis running (for BullMQ export queue)
- [ ] OpenAI API key configured (for AI enhancement)
- [ ] Supabase Storage configured (for PDF storage)

### During Implementation Checklist

**Phase 1 (Foundation):**
- [ ] Document type helpers created and tested
- [ ] Export types extended
- [ ] Cover letter template store created
- [ ] Cover letter types updated with version history

**Phase 2 (Preview):**
- [ ] Cover letter template renderer working
- [ ] Cover letter preview container working
- [ ] Cover letter live preview working with RAF batching
- [ ] Preview wired up to editor page
- [ ] Performance validated (<120ms updates)

**Phase 3 (Templates):**
- [ ] Cover letter template selector created
- [ ] Template thumbnails generated
- [ ] Template selector wired to customization panel
- [ ] Customization panel wired to editor page

**Phase 4 (Customization):**
- [ ] Shared components verified for compatibility
- [ ] Color customization working
- [ ] Typography customization working
- [ ] Spacing customization working
- [ ] Customizations persisted to database

**Phase 5 (Export):**
- [ ] Cover letter versions table created
- [ ] Version snapshots created on update
- [ ] Export queue extended with document type
- [ ] Cover letter Puppeteer renderer working
- [ ] Export API routes created
- [ ] Export button wired to editor
- [ ] Export history includes cover letters

**Phase 6 (Version History):**
- [ ] Version repository functions created
- [ ] Version API routes created
- [ ] Version history UI component created
- [ ] Version history wired to editor page

**Phase 7 (AI Features):**
- [ ] AI enhancement API route created
- [ ] Enhancement UI component created
- [ ] Enhancement wired to editor page
- [ ] Quota enforcement working

**Phase 8 (Utilities):**
- [ ] Duplicate API route created
- [ ] Restore API route created
- [ ] Duplicate button added to dashboard
- [ ] Resume linking UI created
- [ ] Trash and restore UI created

**Phase 9 (Integration):**
- [ ] Navigation and routing verified
- [ ] Analytics tracking added
- [ ] Performance optimized
- [ ] Accessibility audited
- [ ] Cross-browser tested
- [ ] Mobile responsiveness verified

### Post-Implementation Checklist

**Quality Assurance:**
- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] Manual smoke tests passing
- [ ] Performance benchmarks met
- [ ] Accessibility audit passing
- [ ] Cross-browser testing complete

**Documentation:**
- [ ] User documentation updated
- [ ] Developer documentation updated
- [ ] API reference updated
- [ ] Inline code comments complete
- [ ] Migration guides complete (if applicable)

**Deployment Readiness:**
- [ ] Feature flags configured
- [ ] Environment variables set
- [ ] Monitoring and alerts configured
- [ ] Rollback plan documented
- [ ] Deployment runbook created

**Stakeholder Sign-Off:**
- [ ] Product manager approval
- [ ] Engineering lead approval
- [ ] Design approval (UI/UX)
- [ ] QA sign-off

---

## Appendix A: Time Estimates Summary

| Phase | Tasks | Estimated Hours | Parallel Work Opportunities |
|-------|-------|-----------------|----------------------------|
| Phase 1: Foundation | 4 tasks | 6-8 hours | None (foundational) |
| Phase 2: Preview | 5 tasks | 8-12 hours | None (sequential) |
| Phase 3: Templates | 4 tasks | 6-8 hours | Thumbnails can be done in parallel with UI |
| Phase 4: Customization | 5 tasks | 6-8 hours | None (depends on Phase 3) |
| Phase 5: Export | 7 tasks | 12-16 hours | None (sequential due to dependencies) |
| Phase 6: Version History | 4 tasks | 8-10 hours | Can start after Phase 5.1-5.2 |
| Phase 7: AI Features | 4 tasks | 8-10 hours | Can start after Phase 2 (preview) |
| Phase 8: Utilities | 5 tasks | 4-6 hours | Can start after Phase 1 (APIs independent) |
| Phase 9: Integration | 6 tasks | 6-8 hours | Can only start after all phases |
| **Total** | **44 tasks** | **62-86 hours** | **8-11 developer-days** |

**Parallelization Strategy:**
- **Week 1:** Phase 1 (foundation), Phase 2 (preview), start Phase 3 (templates)
- **Week 2:** Finish Phase 3, Phase 4 (customization), start Phase 5 (export), start Phase 7 (AI features)
- **Week 3:** Finish Phase 5, Phase 6 (version history), finish Phase 7, Phase 8 (utilities)
- **Week 4:** Phase 9 (integration), testing, polish

**Critical Path:**
1. Foundation (6-8 hours)
2. Preview (8-12 hours)
3. Export (12-16 hours)
4. Integration (6-8 hours)

**Total Critical Path:** 32-44 hours (4-6 developer-days)

**Parallel Work:** 30-42 hours (can be done by additional developers or during waiting periods)

---

## Appendix B: Risk Mitigation Strategies

### Risk 1: Type System Complexity

**Mitigation Strategy:**
1. Use separate components for cover letter preview (avoid discriminated unions)
2. Create strict type guards with runtime checks
3. Use TypeScript strict mode (enforce null checks, no implicit any)
4. Run type-check on every commit (pre-commit hook)
5. Review all type-related changes with TypeScript expert

**Rollback Plan:**
- If type issues block implementation, revert to separate systems (Option B)
- No impact on existing resume system (isolated changes)

### Risk 2: Export Queue Performance

**Mitigation Strategy:**
1. Monitor queue depth in real-time (alert if >100 jobs)
2. Implement separate queues if performance degrades (resume queue, cover letter queue)
3. Add priority field to jobs (prioritize paid users)
4. Load test with 1000 mixed jobs (50/50 resumes and cover letters)
5. Profile Puppeteer rendering (identify slow templates)

**Rollback Plan:**
- Disable cover letter export via feature flag
- Resume queue continues processing resume exports
- Fix performance issue in separate release

### Risk 3: Template Rendering Inconsistencies

**Mitigation Strategy:**
1. Test each template individually in Puppeteer
2. Add print CSS media queries to all templates
3. Use screenshot comparison tests (visual regression testing)
4. Create fallback renderer (plain text PDF if template fails)
5. Manual review of first 100 exported PDFs

**Rollback Plan:**
- Disable problematic template via feature flag
- Fall back to "classic-block" template for exports
- Fix template in separate release

### Risk 4: Version History Storage Growth

**Mitigation Strategy:**
1. Monitor database size weekly
2. Implement version pruning (keep only last 50 versions)
3. Compress old versions (JSONB compression in PostgreSQL)
4. Add database retention policy (delete versions >6 months old)
5. Estimate storage cost (100 users × 10 cover letters × 50 versions × 5KB = 250MB)

**Rollback Plan:**
- Disable version history via feature flag
- Prune versions table (keep only last 10 versions)
- Re-enable with lower retention (e.g., last 20 versions)

### Risk 5: AI Enhancement Prompt Quality

**Mitigation Strategy:**
1. Test enhancement prompts manually with 50 sample paragraphs
2. Gather user feedback via in-app rating (thumbs up/down)
3. A/B test different prompt variations
4. Monitor enhancement rejection rate (alert if >50%)
5. Iterate on prompts based on feedback

**Rollback Plan:**
- Disable AI enhancement via feature flag
- Refine prompts based on user feedback
- Re-enable with improved prompts

---

## Appendix C: Testing Strategy Details

### Unit Testing

**Components to Test:**
- `/components/preview/cover-letter/CoverLetterLivePreview.tsx` - Preview rendering, RAF batching
- `/components/preview/cover-letter/CoverLetterTemplateRenderer.tsx` - Template dispatch, fallback
- `/components/customization/cover-letter/CoverLetterCustomizationPanel.tsx` - Customization updates
- `/stores/coverLetterTemplateStore.ts` - Template selection, customization merging
- `/libs/utils/documentTypeHelpers.ts` - Type guards, discriminators

**Test Framework:** Jest + React Testing Library

**Example Test:**
```typescript
describe('CoverLetterTemplateRenderer', () => {
  it('renders template with data and customizations', () => {
    const data = createEmptyCoverLetter('test@example.com')
    const customizations = createDefaultCoverLetterCustomizations()

    render(
      <CoverLetterTemplateRenderer
        templateId="classic-block"
        data={data}
        customizations={customizations}
        mode="preview"
      />
    )

    expect(screen.getByText(data.from.email)).toBeInTheDocument()
  })

  it('falls back to default template if template not found', () => {
    const data = createEmptyCoverLetter('test@example.com')

    render(
      <CoverLetterTemplateRenderer
        templateId="nonexistent" as any
        data={data}
        customizations={{}}
        mode="preview"
      />
    )

    // Should render with classic-block (fallback)
    expect(screen.getByText(data.from.email)).toBeInTheDocument()
  })
})
```

### Integration Testing

**End-to-End Scenarios:**

**Scenario 1: Create, Edit, Preview, Export**
1. Create cover letter via API
2. Load cover letter in editor
3. Edit content (update body)
4. Verify preview updates
5. Export PDF via API
6. Verify PDF generated

**Scenario 2: Template Switching**
1. Load cover letter with template A
2. Switch to template B
3. Verify preview updates
4. Verify data persists
5. Export PDF
6. Verify PDF uses template B

**Scenario 3: Version History**
1. Create cover letter
2. Edit content (version 1)
3. Save and edit again (version 2)
4. List versions via API
5. Restore version 1
6. Verify content reverted

**Test Framework:** Playwright or Cypress

**Example Test:**
```typescript
test('create and export cover letter', async ({ page }) => {
  // Login
  await page.goto('/login')
  await page.fill('[name="email"]', 'test@example.com')
  await page.fill('[name="password"]', 'password')
  await page.click('button[type="submit"]')

  // Create cover letter
  await page.click('text=New Cover Letter')
  await page.waitForURL('**/cover-letter-editor/**')

  // Edit content
  await page.fill('[name="from.fullName"]', 'John Doe')
  await page.fill('[name="to.companyName"]', 'Acme Corp')

  // Verify preview renders
  const preview = page.locator('[data-testid="cover-letter-preview"]')
  await expect(preview).toContainText('John Doe')
  await expect(preview).toContainText('Acme Corp')

  // Export PDF
  await page.click('text=Export PDF')
  await page.waitForSelector('text=Download PDF')

  // Verify download link exists
  const downloadLink = page.locator('a[download]')
  await expect(downloadLink).toBeVisible()
})
```

### Performance Testing

**Benchmarks:**
- Preview update time: <120ms (p95)
- Export time: <2.5s (p95)
- API response time: <500ms (p95)

**Load Testing:**
- Export queue: 1000 concurrent jobs
- API: 100 requests/second
- Database: 1000 concurrent users

**Tools:**
- k6 for load testing
- Chrome DevTools Performance profiler
- React DevTools Profiler

**Example Load Test:**
```javascript
import http from 'k6/http'
import { check, sleep } from 'k6'

export let options = {
  vus: 100, // 100 virtual users
  duration: '30s',
}

export default function () {
  const res = http.get('https://app.resumepair.com/api/v1/cover-letters')

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  })

  sleep(1)
}
```

---

## Appendix D: Success Metrics

### User-Facing Success Criteria

**Feature Adoption:**
- 80% of users who create cover letter use preview feature
- 60% of users export cover letter to PDF within 7 days of creation
- 40% of users switch templates at least once
- 30% of users customize colors or typography
- 20% of users use AI enhancement

**User Satisfaction:**
- NPS score for cover letter feature ≥ 50
- Feature rating ≥ 4.0/5.0 stars
- Support ticket volume <5% of cover letter users
- User feedback sentiment ≥ 70% positive

**Performance:**
- Preview update time p95 <120ms
- Export time p95 <2.5s
- Feature availability ≥ 99.9%
- Error rate <1%

### Business Success Criteria

**Conversion:**
- Cover letter creation increases resume creation by 15%
- Cover letter export increases paid conversion by 10%
- Cover letter feature contributes to 20% of new sign-ups

**Engagement:**
- Users with cover letters have 30% higher retention
- Cover letter users export 2x more PDFs than resume-only users
- Cover letter feature drives 25% increase in session duration

**Revenue:**
- Cover letter exports contribute to 15% of export quota usage
- AI enhancement contributes to 10% of AI quota usage
- Cover letter feature drives 5% increase in MRR

### Technical Success Criteria

**Reliability:**
- Uptime ≥ 99.9%
- Error rate <1%
- Export success rate ≥ 95%
- Version history success rate ≥ 99%

**Performance:**
- Preview update time p95 <120ms
- Export time p95 <2.5s
- API response time p95 <500ms
- Database query time p95 <100ms

**Quality:**
- TypeScript coverage 100%
- Unit test coverage ≥ 80%
- Integration test coverage ≥ 60%
- Accessibility compliance: WCAG AA

**Maintainability:**
- Code duplication <10%
- Cyclomatic complexity <10
- Documentation coverage 100% (public APIs)
- Technical debt ratio <5%

---

## End of Implementation Plan

**This plan is comprehensive, actionable, and implementation-ready.**

All architectural decisions have been made. All dependencies identified. All risks mitigated.

An implementer can follow this plan step-by-step to achieve 100% feature parity between Cover Letter and Resume systems.

**Total Estimated Effort:** 62-86 hours (8-11 developer-days)
**Critical Path:** 32-44 hours (4-6 developer-days)
**Recommended Timeline:** 4 weeks with incremental rollout

**Questions? Refer to specific phase sections above.**

**Ready to implement? Start with Phase 1: Foundation & Type System.**
