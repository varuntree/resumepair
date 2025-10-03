# ResumePair Project Documentation

**Purpose**: Product requirements, architecture, schemas, and workflows for ResumePair.

---

## 📚 Index

| File | Purpose | Key Topics |
|------|---------|------------|
| **01_product.md** | Product vision & features | PRD, user personas, core features, success metrics |
| **02_schemas.md** | Data schemas | ResumeJson, CoverLetterJson, versioning |
| **03_architecture.md** | System architecture | Layers, modules, runtimes, key flows |
| **04_tech_stack.md** | Technology decisions | Stack, tools, environment setup |
| **05_database.md** | Database schema | Tables, RLS, indexes, migrations |
| **06_api.md** | API specification | Endpoints, auth, responses, streaming |
| **07_workflows.md** | Business workflows | Auth, document creation, export, scoring |

---

## 🎯 Project Overview

**ResumePair** is an AI-assisted resume & cover letter builder emphasizing:
- **Jobs-level simplicity**: <60s to first draft
- **Schema-driven**: One JSON, multiple consumers (editor → templates → AI → exports)
- **ATS-safe**: Machine-readable PDFs with standard fonts
- **Real-time preview**: <120ms keystroke → paint budget
- **Serverless-friendly**: Next.js 14 + Supabase + Edge functions

---

## 🏗️ Core Architecture

```
┌─────────────────────────────────────────────────┐
│  Client (Next.js App Router)                    │
│  - React 18 components                          │
│  - Zustand stores (state + undo/redo)          │
│  - shadcn/ui + Tailwind CSS                     │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│  API Routes (/api/v1/*)                         │
│  - Edge: AI streaming, light reads             │
│  - Node: PDF export, file processing           │
└─────────────────┬───────────────────────────────┘
                  │
         ┌────────┴────────┐
         ▼                 ▼
┌──────────────┐   ┌──────────────┐
│  Supabase    │   │  Gemini AI   │
│  - Auth (RLS)│   │  - Streaming │
│  - Postgres  │   │  - Structured│
│  - Storage   │   │    outputs   │
└──────────────┘   └──────────────┘
```

---

## 🚀 Core Features

### 1. Resume Creation
- **Manual Mode**: Form-based editor with live preview
- **AI Mode**: Zero-to-draft from job description
- **PDF Import**: Extract from existing resume

### 2. Template System
- 6 professional templates
- Live customization (colors, fonts, spacing)
- Real-time preview (<120ms updates)
- ATS-safe design

### 3. Cover Letters
- Same 3 creation modes
- Rich text editing
- Template gallery

### 4. AI Integration
- Gemini 2.0 Flash for drafting
- Streaming responses (SSE)
- Structured outputs (Zod schemas)
- Phase 4.5: PDF import via Gemini multimodal

### 5. Export System
- PDF generation (Puppeteer + Chromium)
- Serverless (Node runtime)
- <2.5s for 1-2 pages

### 6. Scoring
- Deterministic checks (<200ms)
- Optional LLM rubric (<1.2s)
- 5 dimensions: ATS, Keywords, Content, Format, Completeness

---

## 📊 Tech Stack Summary

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router), React 18, TypeScript |
| Database | Supabase (Postgres + RLS) |
| Auth | Supabase Auth (Google OAuth only) |
| AI | Vercel AI SDK + Google Gemini 2.0 Flash |
| Styling | Tailwind CSS + shadcn/ui |
| Icons | Lucide React |
| State | Zustand + zundo |
| Exports | Puppeteer + Chromium (serverless) |

---

## 📈 Success Metrics

| Metric | Target | Current |
|--------|--------|---------|
| TTFD (Time to First Draft) | < 45s median | - |
| Export Success Rate | > 99.5% | - |
| Preview Latency | p95 < 120ms | - |
| ATS Parsing Score | ≥ 95% | - |

---

## 🔗 Quick Links

### Standards
- **Architecture**: `/ai_docs/standards/01_architecture.md`
- **Implementation**: `/ai_docs/standards/02_implementation.md`
- **Design System**: `/ai_docs/standards/04_design_system.md`
- **Quality**: `/ai_docs/standards/07_quality_and_security.md`

### Getting Started
1. Read **01_product.md** - Understand what we're building
2. Read **02_schemas.md** - Learn the data model
3. Read **03_architecture.md** - Understand system design
4. Read **04_tech_stack.md** - Set up environment
5. Check standards for implementation patterns

---

## 🎯 Development Principles

1. **Schema-driven**: `ResumeJson`/`CoverLetterJson` powers everything
2. **Performance first**: Meet budgets (120ms preview, 2.5s PDF)
3. **Security always**: RLS enforced, no PII logging
4. **ATS-safe**: Machine-readable PDFs, standard fonts
5. **Simple first**: Start with basic algorithms, optimize when needed

---

## 📝 Document Maintenance

Project documentation is updated:
- When product requirements change
- When architecture evolves
- When new features are added
- After major refactorings

**Update process**: Proposal → Review → Apply → Validate

---

**Start here**: Read `01_product.md` to understand product vision and requirements.
