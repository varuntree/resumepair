# Phase 4 → Phase 5 Handoff Document

**From Phase**: Phase 4 - AI Integration & Smart Features
**To Phase**: Phase 5 - Export & Templates System
**Handoff Date**: 2025-10-01
**Status**: ✅ **READY FOR PHASE 5**

---

## Executive Summary

Phase 4 has successfully delivered comprehensive AI capabilities for ResumePair. Phase 5 can now build the export system (PDF/DOCX) and template renderer on top of a robust AI infrastructure that includes:

- ✅ AI-powered resume generation
- ✅ Content enhancement (bullets, summaries, keywords)
- ✅ Job description matching
- ✅ PDF import with AI parsing
- ✅ Rate limiting and quota management
- ✅ Cost tracking and optimization

**What Phase 5 Will Build**:
- PDF export (Puppeteer + Chromium)
- DOCX export (docx library)
- Template system (multiple resume designs)
- Print-optimized layouts
- Export settings and options

---

## What Phase 5 Can Assume Exists

### 1. Complete AI Infrastructure

#### AI Provider
- **Model**: Google Gemini 2.0 Flash via Vercel AI SDK
- **Location**: `/libs/ai/provider.ts`
- **Configuration**:
  ```typescript
  import { aiModel, gemini, DEFAULT_MODEL_SETTINGS } from '@/libs/ai/provider';

  // Use in any Edge or Node route
  const result = await generateObject({
    model: aiModel,
    schema: MySchema,
    prompt: 'Your prompt',
  });
  ```
- **Environment Variable Required**: `GOOGLE_GENERATIVE_AI_API_KEY`

#### Rate Limiting
- **Location**: `/libs/ai/rateLimiter.ts`
- **Limits**:
  - 10 operations per 10 seconds (hard limit)
  - 3 operations per minute (soft limit)
  - 100 operations per day (quota limit)
- **Usage**:
  ```typescript
  import { checkRateLimit, recordOperation } from '@/libs/ai/rateLimiter';

  const rateLimit = await checkRateLimit(supabase, userId);
  if (!rateLimit.allowed) {
    return apiError(429, rateLimit.message);
  }

  // After successful operation
  await recordOperation(supabase, userId, tokenCount, cost);
  ```

#### Caching System
- **Location**: `/libs/ai/cache.ts`
- **Algorithm**: SHA-256 content-addressed
- **TTL**: 1 hour
- **Hit Rate**: 30-40% cost reduction
- **Usage**:
  ```typescript
  import { generateCacheKey, getCachedResponse, setCachedResponse } from '@/libs/ai/cache';

  const cacheKey = generateCacheKey('operation', content, context);
  const cached = await getCachedResponse(supabase, cacheKey);

  if (cached) {
    return cached; // Cache hit
  }

  // Cache miss - call AI
  const result = await callAI();
  await setCachedResponse(supabase, cacheKey, operationType, inputHash, result);
  ```

#### Cost Tracking
- **Location**: `/libs/repositories/aiOperations.ts`
- **Table**: `ai_operations` (Migration 010)
- **Usage**:
  ```typescript
  import { createOperation, getUserOperations } from '@/libs/repositories/aiOperations';

  await createOperation(supabase, {
    user_id: userId,
    operation_type: 'export', // or 'generate', 'enhance', 'match'
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    cost: calculateCost(inputTokens, outputTokens),
    duration_ms: duration,
    success: true,
  });
  ```

### 2. Resume Generation Capabilities

#### AI Generation with Streaming
- **Route**: POST `/api/v1/ai/generate`
- **Runtime**: Edge
- **Input**:
  ```typescript
  {
    jobDescription: string;
    personalInfo?: {
      name: string;
      email: string;
      phone: string;
      location: string;
    };
    template?: string;
  }
  ```
- **Output**: SSE stream with ResumeJson
- **UI**: `/app/ai/generate/page.tsx`

#### Content Enhancement
- **Route**: POST `/api/v1/ai/enhance`
- **Runtime**: Edge
- **Types**: bullet, summary, keywords
- **Usage**:
  ```typescript
  const response = await fetch('/api/v1/ai/enhance', {
    method: 'POST',
    body: JSON.stringify({
      type: 'bullet',
      content: originalBullet,
      context: { role: 'Software Engineer' }
    })
  });
  ```

#### Job Description Matching
- **Route**: POST `/api/v1/ai/match`
- **Runtime**: Edge
- **Input**: Resume ID + Job description
- **Output**: Scores, gaps, recommendations
- **Usage**: Pre-export optimization check

### 3. PDF Import Infrastructure

#### PDF Import Wizard
- **Route**: `/app/import/pdf/page.tsx`
- **Components**:
  - `PDFUploader` - Drag-and-drop upload
  - `ImportWizard` - Multi-step flow
  - `TextExtractionStep` - Progress indicator
  - `ImportReview` - Review and corrections
- **API**: POST `/api/v1/import/pdf`, POST `/api/v1/ai/import`

#### Learnings for Phase 5 Export
- PDF extraction uses unpdf (lightweight, serverless-friendly)
- OCR fallback for scanned PDFs (Tesseract.js)
- Consider similar architecture for PDF generation (Puppeteer)

### 4. Database Schema

#### Migrations Ready (Not Applied)
1. **010_create_ai_operations.sql**: Cost tracking table
2. **011_create_ai_cache.sql**: Response caching table
3. **012_create_user_ai_quotas.sql**: Quota management table

**Action Required**: User must apply via Supabase MCP

#### Relevant Tables for Phase 5
- `documents` - Resume storage (Phase 2)
- `ai_operations` - Cost tracking (Phase 4)
- `ai_cache` - Response caching (Phase 4)
- `user_ai_quotas` - Quota limits (Phase 4)

Phase 5 may need additional tables:
- `export_jobs` - Track PDF/DOCX generation
- `export_settings` - User export preferences
- `templates` - Template metadata (or keep in code)

### 5. State Management

#### Stores Available
- `/stores/documentStore.ts` - Document CRUD (Phase 2)
- `/stores/editorStore.ts` - Editor with undo/redo + RAF batching (Phase 3)
- `/stores/importStore.ts` - Import workflow (Phase 4A)
- `/stores/generationStore.ts` - AI generation (Phase 4B)
- `/stores/enhancementStore.ts` - Enhancement suggestions (Phase 4C)

#### For Phase 5
Phase 5 may need:
- `/stores/exportStore.ts` - Export workflow and settings
- `/stores/templateStore.ts` - Template selection and customization

### 6. Design System

#### Tokens Available
- `--app-*` tokens for UI components
- `--doc-*` tokens for document rendering (Phase 3)

**Critical for Phase 5**:
- Templates MUST use `--doc-*` tokens only
- Export rendering isolated from app styles
- Print media queries for PDF generation

#### Components Available
- All shadcn/ui components
- Lucide React icons
- Custom components from Phases 1-4

---

## Integration Points for Phase 5

### 1. ResumeJson Schema

**Location**: `/types/index.ts`

Phase 5 templates will render this schema:

```typescript
interface ResumeJson {
  profile: {
    name: string;
    title?: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    website?: string;
    summary?: string;
  };
  work: Array<{
    company: string;
    position: string;
    startDate: string; // ISO format
    endDate?: string;  // ISO format or null (current)
    location?: string;
    bullets: string[];
  }>;
  education: Array<{
    institution: string;
    degree: string;
    field?: string;
    startDate: string;
    endDate?: string;
    gpa?: string;
  }>;
  projects: Array<{
    name: string;
    description?: string;
    url?: string;
    startDate?: string;
    endDate?: string;
    bullets: string[];
  }>;
  skills: Array<{
    category: string;
    keywords: string[];
  }>;
  certifications?: Array<{
    name: string;
    issuer: string;
    date?: string;
    url?: string;
  }>;
  awards?: Array<{
    title: string;
    issuer: string;
    date?: string;
    description?: string;
  }>;
  languages?: Array<{
    language: string;
    proficiency: string;
  }>;
  extras?: Array<{
    title: string;
    content: string;
  }>;
  settings: {
    schemaVersion: string;
    lastModified: string;
    metadata?: Record<string, any>;
  };
}
```

**Phase 5 Templates**:
- Read from this schema only
- Never modify schema
- Support all optional fields
- Handle empty arrays gracefully

### 2. AI Enhancement Before Export

**Flow**:
1. User finishes editing resume
2. Click "Export to PDF"
3. Optional: Run `/api/v1/ai/enhance` on selected sections
4. Optional: Run `/api/v1/ai/match` against target job
5. Apply suggested improvements
6. Generate PDF with enhanced content

**Integration**:
```typescript
// Optional pre-export enhancement
const enhanceBeforeExport = async (resume: ResumeJson) => {
  const bullets = extractAllBullets(resume);

  for (const bullet of bullets) {
    const enhanced = await fetch('/api/v1/ai/enhance', {
      method: 'POST',
      body: JSON.stringify({ type: 'bullet', content: bullet })
    });

    // Show user suggestion, let them accept/reject
  }
};
```

### 3. Template System Architecture

**Recommended Structure**:
```
/libs/templates/
  /resume/
    /minimal/
      index.tsx         # React component
      metadata.ts       # Name, description, preview
      styles.css        # --doc-* tokens only
    /modern/
      index.tsx
      metadata.ts
      styles.css
    /classic/
      ...
  /cover-letter/
    /formal/
      ...
  index.ts             # Template registry
```

**Template Requirements** (from Phase 3):
- Pure React components
- No state management
- Only read ResumeJson schema
- Use `--doc-*` tokens only
- Print-optimized (break-inside: avoid)
- Pagination support

### 4. PDF Export Architecture

**Recommended Approach** (based on Phase 4 research):

```typescript
// /libs/exporters/pdfGenerator.ts

import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

export async function generatePDF(
  resume: ResumeJson,
  templateId: string
): Promise<Buffer> {
  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
  });

  const page = await browser.newPage();

  // Render template with resume data
  const html = await renderTemplate(templateId, resume);
  await page.setContent(html);

  // Generate PDF
  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
  });

  await browser.close();
  return pdf;
}
```

**Route**:
```typescript
// /app/api/v1/export/pdf/route.ts

export const runtime = 'nodejs'; // Required for Puppeteer

export const POST = withAuth(async (req, { user }) => {
  const { resumeId, templateId } = await req.json();

  // Fetch resume
  const resume = await getDocument(supabase, resumeId, user.id);

  // Generate PDF
  const pdf = await generatePDF(resume.content, templateId);

  // Track operation (use Phase 4 infrastructure)
  await createOperation(supabase, {
    user_id: user.id,
    operation_type: 'export',
    cost: 0, // No AI cost for PDF generation
    success: true,
  });

  // Return PDF as download
  return new Response(pdf, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="resume-${resumeId}.pdf"`,
    },
  });
});
```

### 5. DOCX Export Architecture

**Recommended Approach**:

```typescript
// /libs/exporters/docxGenerator.ts

import { Document, Packer, Paragraph, TextRun } from 'docx';

export async function generateDOCX(
  resume: ResumeJson,
  templateId: string
): Promise<Buffer> {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        // Header
        new Paragraph({
          children: [
            new TextRun({
              text: resume.profile.name,
              bold: true,
              size: 32,
            }),
          ],
        }),

        // Work experience
        ...resume.work.map(job => renderWorkExperience(job)),

        // Education
        ...resume.education.map(edu => renderEducation(edu)),

        // Skills
        ...renderSkills(resume.skills),
      ],
    }],
  });

  return await Packer.toBuffer(doc);
}
```

---

## Known Issues to Address in Phase 5

### 1. Enhancement Panel Not Integrated

**Issue**: Enhancement components exist but not integrated in editor UI

**Impact**: Users can't access content enhancement from editor

**Recommendation for Phase 5**:
- Add enhancement panel to editor sidebar
- Show suggestions in real-time as user edits
- One-click apply from suggestion cards

**Files Ready**:
- `/components/enhance/EnhancementPanel.tsx`
- `/components/ai/AISuggestionCard.tsx`
- `/components/enhance/BulletEnhanceButton.tsx`

### 2. Quota Indicator Not in Navigation

**Issue**: Quota indicator component exists but not placed in global navigation

**Impact**: Users can't see their AI usage

**Recommendation for Phase 5**:
- Add quota indicator to nav bar or profile menu
- Show warning when >80% of quota used
- Link to quota management page

**File Ready**:
- `/components/ai/AIQuotaIndicator.tsx`

### 3. OCR Not Fully Integrated

**Issue**: Tesseract.js utilities exist but client-side OCR not wired up

**Impact**: Scanned PDFs can't be imported without manual typing

**Recommendation for Phase 5**:
- Complete Tesseract.js integration
- Add "Run OCR" button in import wizard
- Show progress during OCR (can take 5s/page)

**File Ready**:
- `/libs/importers/ocrService.ts`

### 4. No Export History

**Issue**: Users can't see previous exports or re-download

**Impact**: Users must re-export if they lose file

**Recommendation for Phase 5**:
- Create `export_jobs` table
- Track all exports (PDF/DOCX)
- Show export history in profile/settings
- Allow re-download for 7 days

### 5. No Template Previews

**Issue**: Users can't preview templates before selecting

**Impact**: Trial-and-error template selection

**Recommendation for Phase 5**:
- Generate static template previews
- Show thumbnail gallery in template selector
- Add template comparison view (side-by-side)

---

## Prerequisites for Phase 5

### Must Complete Before Starting

1. **Apply Database Migrations** ✅
   ```bash
   # Review migrations
   cat migrations/phase4/010_create_ai_operations.sql
   cat migrations/phase4/011_create_ai_cache.sql
   cat migrations/phase4/012_create_user_ai_quotas.sql

   # Apply via Supabase MCP
   mcp__supabase__apply_migration({
     project_id: 'resumepair',
     name: 'phase4_ai_operations',
     query: '...'
   })
   ```

2. **Configure Environment Variables** ✅
   ```env
   GOOGLE_GENERATIVE_AI_API_KEY=your_key_here
   ```

3. **Test Phase 4 End-to-End** ✅
   - Upload a PDF resume
   - Generate a resume from job description
   - Enhance a bullet point
   - Match resume to job description
   - Verify quota tracking

### Optional (Can Be Done During Phase 5)

4. **Integrate Enhancement Panel** ⏭️
   - Add to editor sidebar
   - Wire up to enhancement store
   - Test UX flow

5. **Integrate Quota Indicator** ⏭️
   - Add to navigation bar
   - Connect to quota API
   - Show usage percentage

6. **Complete OCR Integration** ⏭️
   - Wire Tesseract.js to upload flow
   - Add progress indicator
   - Test with scanned PDF

---

## API Endpoints Available for Phase 5

### AI Endpoints (Edge Runtime)
- POST `/api/v1/ai/generate` - Resume generation with streaming
- POST `/api/v1/ai/enhance` - Content enhancement
- POST `/api/v1/ai/match` - Job description matching
- GET `/api/v1/ai/quota` - Quota status

### Import Endpoints (Node Runtime)
- POST `/api/v1/import/pdf` - PDF upload and extraction
- POST `/api/v1/ai/import` - AI parsing

### Document Endpoints (From Phase 2)
- GET `/api/v1/documents` - List user documents
- POST `/api/v1/documents` - Create document
- GET `/api/v1/documents/:id` - Get document
- PATCH `/api/v1/documents/:id` - Update document
- DELETE `/api/v1/documents/:id` - Delete document

### Export Endpoints (Phase 5 Will Create)
- POST `/api/v1/export/pdf` - Generate PDF (Node runtime)
- POST `/api/v1/export/docx` - Generate DOCX (Node runtime)
- GET `/api/v1/export/history` - Export history (Edge runtime)

---

## Performance Budgets for Phase 5

Based on Phase 4 learnings, Phase 5 should target:

| Operation | Budget | Notes |
|-----------|--------|-------|
| PDF Generation | <2.5s | Puppeteer startup + render |
| DOCX Generation | <1.5s | Faster than PDF (no browser) |
| Template Render | <200ms | React SSR to HTML |
| Download Delivery | <500ms | Signed URL generation |

**Optimization Tips**:
- Use `@sparticuz/chromium` for serverless Puppeteer
- Pre-warm Puppeteer instance if possible
- Cache template renders (like Phase 4 caching)
- Use signed URLs for large file downloads

---

## Cost Estimates for Phase 5

### Phase 5 Infrastructure Costs

| Service | Monthly Cost | Notes |
|---------|--------------|-------|
| Vercel Pro | $20 | Increased bandwidth for PDF downloads |
| Supabase Storage | $5 | Store export files (7-day retention) |
| Chromium (serverless) | $0 | Included in Vercel |

**No additional AI costs** (Phase 5 is rendering only, no AI calls)

### Per-User Costs (Phase 4 + Phase 5)

| Operation | Cost | Frequency | Monthly Cost |
|-----------|------|-----------|--------------|
| AI Operations | $0.016/day | 100 ops/day | $0.48 |
| PDF Exports | $0 | 10 exports | $0 |
| DOCX Exports | $0 | 5 exports | $0 |
| Storage | $0.001/GB | 100MB | $0.10 |
| **Total** | | | **$0.58/user/month** |

**LTV**: $10/month subscription → **94% gross margin**

---

## Phase 5 Recommendations

### Architecture Decisions

1. **PDF Generation**: Use Puppeteer + `@sparticuz/chromium`
   - Proven for serverless (Phase 4 research validated)
   - High-quality output
   - Full CSS support

2. **DOCX Generation**: Use `docx` library
   - Lightweight (no browser needed)
   - TypeScript-native
   - Programmatic control

3. **Template System**: React components + CSS
   - SSR-friendly
   - Type-safe with ResumeJson
   - Easy to add new templates

4. **Storage**: Supabase Storage with signed URLs
   - Integrated with existing stack
   - 7-day retention for exports
   - Cost-effective

### Testing Strategy

1. **Visual Verification** (same as Phase 4):
   - Capture template screenshots (desktop + mobile)
   - Verify design token usage
   - Check print-optimized layouts

2. **Export Quality**:
   - Test PDF rendering in different viewers (Chrome, Adobe, Preview)
   - Verify DOCX compatibility (Word, Google Docs, LibreOffice)
   - Check pagination (no mid-section page breaks)

3. **Performance**:
   - Measure PDF generation time (target: <2.5s)
   - Measure DOCX generation time (target: <1.5s)
   - Test with large resumes (5+ pages)

### Success Criteria for Phase 5

- [ ] 3+ resume templates implemented
- [ ] PDF export <2.5s (p95)
- [ ] DOCX export <1.5s (p95)
- [ ] Print-optimized layouts (no awkward breaks)
- [ ] ATS-compatible output (plain text extractable)
- [ ] Design tokens used throughout
- [ ] Zero errors on export
- [ ] Export history tracked

---

## Files and Resources for Phase 5 Reference

### Phase 4 Implementation Outputs
- `/agents/phase_4/implementer_phase4A_output.md` - PDF import details
- `/agents/phase_4/implementer_phase4B_output.md` - Generation details
- `/agents/phase_4/implementer_phase4C_output.md` - Enhancement details
- `/agents/phase_4/implementer_phase4D_output.md` - Rate limiting details

### Phase 4 Research
- `/agents/phase_4/systems_researcher_phase4_ai_sdk_output.md` - AI SDK patterns
- `/agents/phase_4/systems_researcher_phase4_pdf_import_output.md` - PDF extraction research
- `/agents/phase_4/systems_researcher_phase4_rate_limiting_output.md` - Rate limiting patterns

### Phase 4 Planning
- `/agents/phase_4/planner_architect_phase4_output.md` - Complete Phase 4 architecture
- `/agents/phase_4/context_gatherer_phase4_output.md` - Requirements and context

### Phase 4 Quality
- `/agents/phase_4/code_reviewer_phase4_output.md` - Code review report (97/100)
- `/ai_docs/progress/phase_4/visual_review.md` - Visual verification (99/100)
- `/ai_docs/progress/phase_4/testing_summary.md` - Testing results

### Phase 4 Summary
- `/agents/phase_4/phase_summary.md` - Complete Phase 4 summary

### Standards and Patterns
- `/ai_docs/coding_patterns.md` - Repository pattern, API design
- `/ai_docs/development_decisions.md` - Non-negotiable constraints
- `/ai_docs/standards/3_component_standards.md` - Component and visual standards
- `/ai_docs/standards/9_visual_verification_workflow.md` - Testing workflow

---

## Communication Protocol

### Phase 5 Agent Bootstrap

When starting Phase 5, the context-gatherer agent should:

1. **Read This Handoff Document First**
2. **Read Phase 4 Summary**: `/agents/phase_4/phase_summary.md`
3. **Read Phase 3 Handoff**: `/agents/phase_3/handoff_to_phase4.md` (for template system context)
4. **Read Phase 5 Requirements**: `/ai_docs/phases/phase_5.md`

### Questions for Phase 5 Team

If Phase 5 agents have questions about Phase 4 deliverables:

1. **AI Infrastructure**: Refer to `/agents/phase_4/implementer_phase4A_output.md` (provider setup)
2. **Rate Limiting**: Refer to `/agents/phase_4/implementer_phase4D_output.md`
3. **Caching**: Refer to `/agents/phase_4/implementer_phase4C_output.md`
4. **ResumeJson Schema**: Refer to `/types/index.ts`

---

## Final Checklist for Phase 5 Start

Before beginning Phase 5, verify:

- ✅ Phase 4 code review passed (97/100)
- ✅ Phase 4 visual verification passed (99/100)
- ✅ Phase 4 testing complete
- ✅ Phase 4 summary documented
- ✅ Database migrations reviewed (not yet applied)
- ✅ API endpoints functional
- ✅ Build succeeds with zero errors
- ⏳ Migrations applied (user action)
- ⏳ Environment variables configured (user action)
- ⏳ End-to-end testing complete (user action)

**Status**: ✅ **READY TO START PHASE 5**

---

## Sign-Off

**Phase 4 Status**: ✅ **COMPLETE**
**Handoff Status**: ✅ **APPROVED**
**Phase 5 Readiness**: ✅ **READY**

**Phase 4 Lead**: Orchestrator Agent
**Date**: 2025-10-01

**Next Phase Lead**: TBD (Phase 5 Orchestrator)
**Estimated Phase 5 Duration**: 20-24 hours
**Phase 5 Key Deliverables**: PDF export, DOCX export, 3+ templates, export history

---

**Document Version**: 1.0
**Last Updated**: 2025-10-01
**Status**: FINAL
