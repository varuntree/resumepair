# Phase 7: Cover Letters Testing Playbook

**Phase**: Cover Letters & Extended Documents
**Date**: 2025-10-03
**Duration**: ~25 minutes
**Prerequisites**: Development server running on port 3000

---

## Overview

This playbook tests the Phase 7 cover letter system, including:
- ✅ Cover letter templates (4 templates)
- ✅ Document linking (link/unlink/sync)
- ✅ PDF export for cover letters
- ⏳ Rich text editor (Phase 7C - already tested)
- ⏳ CRUD API (Phase 7D - already tested)

---

## Test Environment Setup

### 1. Start Development Server

**Command**: Verify dev server is running
```bash
curl http://localhost:3000/api/health || echo "Server not running - user should start it"
```

**Expected**: Server responds with 200 OK or user confirms server is running

---

## Section 1: Cover Letter Templates (7E)

### Test 1.1: Classic Block Template

**Objective**: Verify Classic Block template renders correctly

**Steps**:
1. Navigate to cover letter preview page
2. Select "Classic Block" template
3. Verify letterhead appears at top
4. Verify sender info is left-aligned
5. Verify traditional business letter format

**Puppeteer MCP Commands**:
```javascript
// Navigate to cover letter preview (replace with actual URL)
await mcp__puppeteer__puppeteer_navigate({
  url: 'http://localhost:3000/cover-letters/new?template=classic-block'
})

// Take screenshot
await mcp__puppeteer__puppeteer_screenshot({
  name: 'classic_block_template',
  width: 1440,
  height: 900
})
```

**Expected**:
- [ ] Letterhead visible at top
- [ ] Sender name, address, phone, email displayed
- [ ] Date below sender info
- [ ] Recipient info below date
- [ ] Body paragraphs with justified text
- [ ] Closing and signature space
- [ ] Serif font (Source Serif 4)

---

### Test 1.2: Modern Minimal Template

**Objective**: Verify Modern Minimal template styling

**Steps**:
1. Switch to "Modern Minimal" template
2. Verify accent line appears
3. Verify contact info in single line
4. Verify generous whitespace

**Puppeteer MCP Commands**:
```javascript
await mcp__puppeteer__puppeteer_navigate({
  url: 'http://localhost:3000/cover-letters/new?template=modern-minimal'
})

await mcp__puppeteer__puppeteer_screenshot({
  name: 'modern_minimal_template',
  width: 1440,
  height: 900
})
```

**Expected**:
- [ ] Horizontal accent line (lime color) below header
- [ ] Contact info in single row with bullet separators
- [ ] Clean, minimalist layout
- [ ] Inter font
- [ ] Generous spacing between sections

---

### Test 1.3: Creative Bold Template

**Objective**: Verify Creative Bold template design

**Steps**:
1. Switch to "Creative Bold" template
2. Verify vertical accent bar
3. Verify bold typography
4. Verify creative layout elements

**Puppeteer MCP Commands**:
```javascript
await mcp__puppeteer__puppeteer_navigate({
  url: 'http://localhost:3000/cover-letters/new?template=creative-bold'
})

await mcp__puppeteer__puppeteer_screenshot({
  name: 'creative_bold_template',
  width: 1440,
  height: 900
})
```

**Expected**:
- [ ] Vertical accent bar on left side of header
- [ ] Large, bold sender name (1.8em)
- [ ] Date in uppercase with lime accent color
- [ ] Accent line at bottom of closing
- [ ] Expressive typography (larger font sizes)

---

### Test 1.4: Executive Formal Template

**Objective**: Verify Executive Formal template elegance

**Steps**:
1. Switch to "Executive Formal" template
2. Verify centered header
3. Verify serif typography
4. Verify generous padding

**Puppeteer MCP Commands**:
```javascript
await mcp__puppeteer__puppeteer_navigate({
  url: 'http://localhost:3000/cover-letters/new?template=executive-formal'
})

await mcp__puppeteer__puppeteer_screenshot({
  name: 'executive_formal_template',
  width: 1440,
  height: 900
})
```

**Expected**:
- [ ] Centered header with sender name
- [ ] Horizontal divider line below header
- [ ] Centered date (italicized)
- [ ] Serif font (Source Serif 4, 1.05 scale)
- [ ] Extra generous padding (80px)
- [ ] Justified body text

---

## Section 2: Document Linking (7F)

### Test 2.1: Link Cover Letter to Resume

**Objective**: Verify linking functionality

**Prerequisites**: At least one resume exists

**API Test**:
```javascript
// Test linking API
const coverLetterId = 'your-cover-letter-id'
const resumeId = 'your-resume-id'

await fetch(`http://localhost:3000/api/v1/cover-letters/${coverLetterId}/link`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    resume_id: resumeId,
    sync_data: true
  })
})
```

**Expected**:
- [ ] Returns 200 OK
- [ ] Cover letter `linked_resume_id` is set
- [ ] If `sync_data: true`, profile data synced from resume

---

### Test 2.2: Sync Profile Data from Resume

**Objective**: Verify one-way sync works

**API Test**:
```javascript
// Test sync API
const coverLetterId = 'your-cover-letter-id'

await fetch(`http://localhost:3000/api/v1/cover-letters/${coverLetterId}/sync`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  }
})
```

**Expected**:
- [ ] Returns 200 OK
- [ ] Cover letter `from` section updated with resume profile data
- [ ] Name, email, phone, location synced
- [ ] Resume data unchanged (one-way sync)

---

### Test 2.3: Unlink Cover Letter from Resume

**Objective**: Verify unlinking functionality

**API Test**:
```javascript
// Test unlink API
const coverLetterId = 'your-cover-letter-id'

await fetch(`http://localhost:3000/api/v1/cover-letters/${coverLetterId}/link`, {
  method: 'DELETE',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
})
```

**Expected**:
- [ ] Returns 200 OK
- [ ] Cover letter `linked_resume_id` set to NULL
- [ ] Cover letter data preserved (not deleted)

---

## Section 3: PDF Export for Cover Letters (7I)

### Test 3.1: Export Cover Letter to PDF

**Objective**: Verify PDF generation works

**API Test**:
```javascript
// Create export job for cover letter
const coverLetterId = 'your-cover-letter-id'

const response = await fetch('http://localhost:3000/api/v1/export/pdf', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    documentId: coverLetterId,
    templateSlug: 'classic-block',
    pageSize: 'letter',
    quality: 'standard',
    documentType: 'cover-letter'  // New parameter
  })
})

const { jobId } = await response.json()
```

**Expected**:
- [ ] Returns 200 OK with `jobId`
- [ ] Export job created in `export_jobs` table
- [ ] Job processes successfully
- [ ] PDF file generated in Supabase Storage
- [ ] PDF contains cover letter content (not resume)

---

### Test 3.2: Verify PDF Content

**Objective**: Verify PDF contains correct cover letter data

**Manual Steps**:
1. Download generated PDF from signed URL
2. Open PDF in viewer
3. Verify content matches cover letter data

**Expected**:
- [ ] Sender info visible (name, address, contact)
- [ ] Date formatted correctly
- [ ] Recipient info visible (name, company, address)
- [ ] Salutation appears
- [ ] Body paragraphs rendered with formatting
- [ ] Closing and signature visible
- [ ] No resume data in PDF

---

### Test 3.3: Test Different Templates in PDF

**Objective**: Verify all 4 templates export correctly

**Steps**:
1. Export cover letter with each template
2. Verify template-specific styling preserved in PDF

**Expected**:
- [ ] Classic Block: Serif font, block layout
- [ ] Modern Minimal: Sans-serif, accent line visible
- [ ] Creative Bold: Bold typography, accent elements
- [ ] Executive Formal: Centered header, elegant spacing

---

## Section 4: Template Registry

### Test 4.1: List Cover Letter Templates

**Code Test**:
```javascript
import { listCoverLetterTemplateMetadata } from '@/libs/templates/cover-letter'

const templates = listCoverLetterTemplateMetadata()
console.log(templates)
```

**Expected**:
- [ ] Returns 4 templates
- [ ] Each has: id, name, category, description, features, version, atsScore
- [ ] IDs: classic-block, modern-minimal, creative-bold, executive-formal

---

### Test 4.2: Get Specific Template

**Code Test**:
```javascript
import { getCoverLetterTemplate } from '@/libs/templates/cover-letter'

const template = getCoverLetterTemplate('classic-block')
console.log(template)
```

**Expected**:
- [ ] Returns template object
- [ ] Contains: component, metadata, defaults
- [ ] Component is React component
- [ ] Metadata matches template
- [ ] Defaults contain customizations

---

## Section 5: Visual Quality Checks

### Test 5.1: Desktop Rendering

**Objective**: Verify templates look good on desktop

**Puppeteer MCP Commands**:
```javascript
// For each template
await mcp__puppeteer__puppeteer_navigate({
  url: 'http://localhost:3000/cover-letters/preview/{id}?template={slug}'
})

await mcp__puppeteer__puppeteer_screenshot({
  name: '{template}_desktop',
  width: 1440,
  height: 900
})
```

**Visual Checklist**:
- [ ] Spacing generous (≥16px gaps)
- [ ] Clear typography hierarchy
- [ ] Design tokens used (no hardcoded values)
- [ ] Ramp palette only (navy, lime, grays)
- [ ] No horizontal scroll

---

### Test 5.2: Print Preview

**Objective**: Verify print CSS works

**Manual Steps**:
1. Open cover letter preview
2. Trigger print preview (Cmd+P)
3. Verify layout is correct

**Expected**:
- [ ] Content fits on Letter/A4 page
- [ ] No overflow or cut-off text
- [ ] Margins appropriate
- [ ] Page breaks avoid splitting sections
- [ ] Colors preserved (if color printing)

---

## Section 6: Integration Tests

### Test 6.1: End-to-End Cover Letter Flow

**Objective**: Test complete user journey

**Steps**:
1. Create new resume
2. Create new cover letter
3. Link cover letter to resume
4. Sync profile data
5. Edit cover letter body
6. Export to PDF
7. Verify PDF contains all data

**Expected**:
- [ ] All steps complete without errors
- [ ] Data persists correctly
- [ ] PDF matches preview
- [ ] Linking works bidirectionally (view from both sides)

---

## Section 7: Error Handling

### Test 7.1: Link Non-Existent Resume

**API Test**:
```javascript
await fetch(`http://localhost:3000/api/v1/cover-letters/${coverLetterId}/link`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    resume_id: 'non-existent-uuid',
    sync_data: false
  })
})
```

**Expected**:
- [ ] Returns 404 Not Found
- [ ] Error message: "Resume not found"

---

### Test 7.2: Sync Unlinked Cover Letter

**API Test**:
```javascript
// Cover letter with no linked_resume_id
await fetch(`http://localhost:3000/api/v1/cover-letters/${coverLetterId}/sync`, {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
})
```

**Expected**:
- [ ] Returns 400 Bad Request
- [ ] Error message: "Cover letter is not linked to a resume"

---

### Test 7.3: Export Invalid Document Type

**API Test**:
```javascript
await fetch('http://localhost:3000/api/v1/export/pdf', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    documentId: 'invalid-id',
    templateSlug: 'classic-block',
    documentType: 'invalid-type'
  })
})
```

**Expected**:
- [ ] Returns 400 Bad Request
- [ ] Validation error for documentType

---

## Phase Gate Checklist

**Before marking Phase 7E-7I complete:**

### Templates (7E)
- [ ] All 4 templates implemented
- [ ] All templates render correctly
- [ ] All templates use design tokens only
- [ ] Template registry works
- [ ] Templates export cleanly

### Document Linking (7F)
- [ ] Link API works
- [ ] Unlink API works
- [ ] Sync API works
- [ ] One-way sync verified (resume → cover letter)
- [ ] Foreign key constraints work (SET NULL on delete)

### PDF Export (7I)
- [ ] Cover letter PDF generation works
- [ ] All templates export correctly
- [ ] PDF content matches preview
- [ ] File naming includes company name
- [ ] Export queue handles cover letters

### Overall Quality
- [ ] No TypeScript errors
- [ ] No console errors
- [ ] All API responses use standard format
- [ ] Edge runtime compatibility verified
- [ ] RLS policies working correctly

---

## Known Limitations

**Phase 7G (Multi-Document Dashboard)**: Not implemented - requires separate implementation
**Phase 7H (AI Generation)**: Not implemented - requires separate implementation
**UI Components**: Only API routes implemented, UI components pending

---

## Estimated Time Breakdown

- Template Testing (1-4): ~10 minutes
- Linking Tests (2.1-2.3): ~5 minutes
- PDF Export Tests (3.1-3.3): ~5 minutes
- Registry Tests (4.1-4.2): ~2 minutes
- Visual Checks (5.1-5.2): ~3 minutes

**Total**: ~25 minutes

---

## Success Criteria

✅ Phase 7E complete when all 4 templates render correctly
✅ Phase 7F complete when linking/syncing works
✅ Phase 7I complete when PDF export generates valid cover letter PDFs

---

**Last Updated**: 2025-10-03
**Version**: 1.0
