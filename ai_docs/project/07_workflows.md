# Business Workflows

**Purpose**: End-to-end user flows and business processes.

---

## Table of Contents

1. [Authentication Flow](#1-authentication-flow)
2. [Document Creation Workflows](#2-document-creation-workflows)
3. [Template Customization](#3-template-customization)
4. [Export Workflow](#4-export-workflow)
5. [Scoring Workflow](#5-scoring-workflow)

---

## 1. Authentication Flow

### Google OAuth (Only Method)

```
┌─────────────────────────────────────────────────┐
│ 1. User lands on landing page                   │
│    - Sees "Sign in with Google" button          │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│ 2. Click "Sign in with Google"                  │
│    - Redirects to Supabase Auth                 │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│ 3. Supabase redirects to Google OAuth           │
│    - User selects Google account                │
│    - Grants permissions                         │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│ 4. Google returns to Supabase callback          │
│    - Supabase creates/updates auth.users        │
│    - Trigger creates profile if new user        │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│ 5. Supabase returns JWT to client               │
│    - Client stores in cookie (httpOnly)         │
│    - Redirects to /dashboard                    │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│ 6. All API requests include JWT                 │
│    Authorization: Bearer <jwt>                  │
└─────────────────────────────────────────────────┘
```

### Session Refresh

```
Client makes API request
  │
  ▼
Middleware checks JWT expiry
  │
  ├─► Valid → Continue
  │
  └─► Expired → Refresh token
        │
        ▼
      New JWT issued
        │
        ▼
      Continue with request
```

---

## 2. Document Creation Workflows

### Mode A: Manual Creation

```
1. User clicks "Create Resume" → Select "Start from Scratch"
   │
   ▼
2. POST /api/v1/resumes (empty template)
   - Creates document with minimal profile
   - Returns document ID
   │
   ▼
3. Redirect to /editor/{id}
   │
   ▼
4. User fills profile section
   - Each field update → Zustand store
   - Preview updates <120ms
   │
   ▼
5. Autosave triggers (2s debounce)
   - PUT /api/v1/resumes/{id}
   - Optimistic update (no blocking)
   │
   ▼
6. User adds work experience
   - Click "Add Experience"
   - Form modal opens
   - Fill fields → Save
   - Preview updates
   │
   ▼
7. Repeat for education, skills, projects
   │
   ▼
8. User clicks "Export PDF" → See Export Workflow
```

### Mode B: PDF Import (Phase 4.5 Refactored)

```
1. User clicks "Create Resume" → Select "Upload PDF"
   │
   ▼
2. File picker opens → User selects PDF
   │
   ▼
3. POST /api/v1/ai/import?stream=true
   - Edge function receives PDF
   - Gemini multimodal processes (text + OCR)
   │
   ▼
4. SSE streaming starts
   - event: progress (20%, 40%, 60%)
   - event: update (profile extracted)
   - event: update (work experience extracted)
   - event: complete (full ResumeJson)
   │
   ▼
5. Client shows real-time streaming preview
   - Progressively hydrates form fields
   - Live preview updates as data arrives
   │
   ▼
6. Stream completes → Review & Fix UI
   - Side-by-side comparison (extracted vs. fields)
   - Highlight confidence scores (low = yellow)
   - User corrects errors
   │
   ▼
7. User clicks "Save as New Resume"
   - POST /api/v1/resumes (with imported data)
   - Redirect to /editor/{id}
```

**Key Changes (Phase 4.5)**:
- Single streaming endpoint (not 2 separate)
- Gemini handles OCR natively (no unpdf, no Tesseract)
- Real-time streaming UX (identical to AI generation)
- Edge runtime (faster performance)

### Mode C: AI Zero-to-Draft

```
1. User clicks "Create Resume" → Select "AI Assistant"
   │
   ▼
2. Freeform input form
   - Text area: "Paste your info + job description"
   - Optional: Upload JD separately
   │
   ▼
3. User submits
   - POST /api/v1/ai/draft/resume?stream=true
   │
   ▼
4. Edge function processes
   - Detects JD (regex on keywords)
   - Sends to Gemini with structured output schema
   │
   ▼
5. SSE streaming starts
   - event: progress (analyzing)
   - event: update (profile generated)
   - event: update (work section generated)
   - event: update (skills generated)
   - event: complete (full ResumeJson)
   │
   ▼
6. Client shows streaming preview
   - Progressively renders sections
   - Live preview updates
   │
   ▼
7. Stream completes
   - User reviews draft
   - "Save as Document" button
   │
   ▼
8. POST /api/v1/resumes
   - Saves generated resume
   - Redirect to /editor/{id}
```

---

## 3. Template Customization

```
User in editor (/editor/{id})
  │
  ▼
Opens customization panel (right sidebar)
  │
  ├─► Template Tab
  │   - Gallery of 6 templates
  │   - Click to switch
  │   - Preview updates <200ms
  │
  ├─► Colors Tab
  │   - Primary color picker
  │   - Accent color picker
  │   - Preview updates immediately
  │
  ├─► Typography Tab
  │   - Font family dropdown
  │   - Font size slider (0.9x - 1.2x)
  │   - Line spacing slider (1.0 - 1.4)
  │   - Preview updates immediately
  │
  └─► Spacing Tab
      - Section padding slider
      - Element gaps slider
      - Icons on/off toggle
      - Preview updates immediately
  │
  ▼
All changes auto-save to settings
  │
  ▼
Export uses current settings
```

---

## 4. Export Workflow

```
1. User clicks "Export PDF"
   │
   ▼
2. Export modal opens
   - Shows current template preview
   - "Download" button
   │
   ▼
3. Click "Download"
   - POST /api/v1/export/pdf
   - Payload: { documentId, templateSlug }
   │
   ▼
4. Node function processes (< 2.5s)
   - SSR renders template HTML
   - Launches Puppeteer + Chromium
   - page.pdf() with print CSS
   │
   ▼
5. Upload to Supabase Storage
   - Path: {userId}/resume_{timestamp}.pdf
   - Generate signed URL (7 days)
   │
   ▼
6. Response returns
   {
     "downloadUrl": "https://...signed-url...",
     "expiresAt": "2025-01-08T00:00:00Z"
   }
   │
   ▼
7. Client triggers browser download
   - fetch(downloadUrl)
   - Create blob → download link
   - User saves PDF locally
   │
   ▼
8. Success toast: "PDF downloaded successfully"
```

### Export Queue (Future Enhancement)

```
For multiple exports or large documents:

1. Click "Export PDF" → Job created
   │
   ▼
2. POST /api/v1/export/pdf
   - Creates export_jobs record
   - Returns { jobId, status: 'pending' }
   │
   ▼
3. Background worker processes
   - Polls export_jobs table
   - Processes job
   - Updates status → 'complete'
   │
   ▼
4. Client polls GET /api/v1/export/jobs/{jobId}
   - Shows progress bar
   │
   ▼
5. Job complete → Download URL returned
```

---

## 5. Scoring Workflow

```
User in editor with live scoring panel
  │
  ▼
Document changes (user types, adds section)
  │
  ▼
Debounced scoring request (500ms idle)
  │
  ▼
POST /api/v1/score
  │
  ├─► Phase A: Deterministic checks (<200ms)
  │   - Run locally on JSON structure
  │   - ATS readiness (fonts, layout)
  │   - Completeness (required fields)
  │   - Format quality (line length, spacing)
  │   │
  │   ▼
  │   Return partial score immediately
  │
  └─► Phase B: LLM rubric (<1.2s, optional)
      - Gemini analyzes vs. JD
      - Keyword match
      - Content strength
      │
      ▼
      Merge with Phase A scores
  │
  ▼
Response: { total, dimensions, suggestions }
  │
  ▼
Update ScoreDashboard
  - Overall score ring
  - 5 sub-score bars
  - Actionable suggestions
  │
  ▼
User clicks suggestion
  - Navigates to relevant field
  - Highlights issue
  - Quick fix button (if available)
```

---

## Data Flow Patterns

### Optimistic Updates

```
User edits field
  │
  ▼
Zustand updates immediately (optimistic)
  │
  ▼
UI shows new value (no loading state)
  │
  ├─► Autosave starts (2s debounce)
  │   │
  │   ▼
  │   PUT /api/v1/resumes/{id}
  │   │
  │   ├─► Success → Confirm save
  │   │
  │   └─► Error → Rollback + toast error
  │
  └─► Preview updates (<120ms)
```

### Undo/Redo

```
User types "Software Engineer"
  │
  ▼
Zustand updates with zundo middleware
  - Stores patch in history
  - Debounced grouping (180ms)
  │
  ▼
User presses Cmd+Z
  │
  ▼
zundo.undo() applies previous state
  │
  ▼
Preview updates
  │
  ▼
Autosave triggers (debounced)
```

---

## Key Takeaways

1. **Google OAuth only** - No other auth methods
2. **3 creation modes** - Manual, PDF import, AI draft
3. **Real-time streaming** - SSE for AI/import (Phase 4.5)
4. **Optimistic updates** - Immediate UI feedback
5. **Auto-save** - Debounced (2s idle)
6. **Undo/redo** - zundo middleware with grouping
7. **Live scoring** - Deterministic + optional LLM

---

**Complete**: You've now reviewed all project documentation. Return to `/ai_docs/project/00_README.md` for index and overview.
