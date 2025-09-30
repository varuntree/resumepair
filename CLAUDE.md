# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ResumePair is an AI-assisted résumé and cover-letter builder built on Next.js 14 (App Router) with a schema-driven architecture. The product emphasizes Jobs-level simplicity: <60s to first draft, smooth live preview, ATS-safe outputs (PDF/DOCX), and reusable scoring components.

**Core Tech Stack:**
- Framework: Next.js 14 (App Router), React 18, TypeScript (strict mode)
- Auth & Data: Supabase (Google OAuth only, Postgres, Storage)
- AI: Vercel AI SDK with Google Gemini 2.0 Flash (structured outputs via Zod)
- Styling: Tailwind CSS + shadcn/ui components + CSS design tokens
- State: Zustand with zundo (undo/redo)
- Icons: Lucide React only
- Exports: PDF (Puppeteer + Chromium), DOCX (docx library)

## Essential Commands

```bash
# Development
npm run dev              # Start dev server (localhost:3000)

# Build & Production
npm run build            # Build for production
npm run start            # Start production server
npm run postbuild        # Generate sitemap (runs after build)

# Code Quality
npm run lint             # Run ESLint
```

## Critical Database Interaction Rule

**IMPORTANT:** When interacting with the database, you MUST ONLY use the Supabase MCP (Model Context Protocol) tools available in this repository. All database operations should target the project named **"resumepair"** only. DO NOT make changes to any other Supabase project. DO NOT use direct SQL queries or any other database access methods outside of the Supabase MCP.

Available MCP servers:
- `supabase`: For all database operations (configured in `.mcp.json`)
- `puppeteer`: For browser automation tasks

## Architecture Principles

### Schema-Driven Design
The entire app revolves around two canonical JSON schemas:
- **ResumeJson**: Contains `profile`, `summary`, `work`, `education`, `projects`, `skills`, `certifications`, `awards`, `languages`, `extras`, and `settings`
- **CoverLetterJson**: Contains `from`, `to`, `date`, `salutation`, `body`, `closing`, and `settings`

These schemas power the editor, AI interactions, template renderers, and exports. Templates never modify the schema—they only read it.

### Module Structure

#### Current Pre-Phase 1 Structure (Exists Now)

```
app/
  api/v1/              # API routes (versioned)
    stripe/            # Stripe payment routes (checkout, portal)
config.ts              # App configuration (root)
libs/
  api.ts               # API client (axios wrapper)
  design-tokens.ts     # Design token utilities
  resend.ts            # Email service (Resend integration)
  seo.tsx              # SEO utilities and components
  stripe.ts            # Stripe integration
  supabase/            # Supabase client setup
    client.ts          # Browser client
    server.ts          # Server component/route handler client
    middleware.ts      # Middleware client with session refresh
  utils.ts             # Utility functions (cn, etc.)
types/
  config.ts            # Type definitions for config
  index.ts             # Shared type exports
  next-auth.d.ts       # NextAuth type augmentations
```

#### Phase 1 Planned Additions (Will Be Added)

```
app/
  api/v1/
    ai/draft/          # AI-powered drafting (Edge, SSE)
    export/            # PDF/DOCX generation (Node)
    import/            # PDF import & OCR (Node)
    resumes/           # CRUD for resumes
    cover-letters/     # CRUD for cover letters
    score/             # Resume/cover letter scoring
    storage/upload/    # File uploads (Node)
libs/
  api-utils/           # API wrappers (withApiHandler, withAuth, apiSuccess/apiError)
  repositories/        # Pure functions for DB access (server-only, DI with Supabase client)
  ai/                  # AI SDK wrappers, prompt modules, Zod schemas
  scoring/             # Deterministic checks + LLM rubric composer
  exporters/           # PDF (Puppeteer) and DOCX generators
  templates/           # React renderers for resume/cover-letter by slug
  preview/             # HTML paginated preview helpers
  i18n/                # Date/address/phone formatting
  validation/          # Zod validators for inputs
migrations/            # SQL migration files (NEVER auto-apply)
```

**Note:** Development standards, API design principles, and all architectural rules below apply to both current and planned structure.

### API Design
- All API routes MUST use `withApiHandler` (public) or `withAuth` (protected)
- All responses use `ApiResponse<T>` envelope: `{ success, data?, error?, message? }`
- Validate all inputs with Zod schemas
- Edge runtime for: AI streaming, light reads
- Node runtime for: PDF/DOCX export, PDF parsing/OCR, file uploads
- API versioning: `/api/v1/*` (major version only)

### Repository Pattern
- Pure functions with dependency injection of `SupabaseClient`
- Never import repositories in client components
- One repository per entity group (e.g., `documents.ts`, `profiles.ts`)
- Always enforce Row Level Security (RLS) — never use service role in runtime

### Styling & Design Tokens
- Use Tailwind + shadcn/ui components ONLY (no other UI libraries)
- Two token systems:
  - `--app-*`: App-wide tokens in `app/globals.css`
  - `--doc-*`: Document-scoped tokens for templates/preview
- Templates must only read `--doc-*` tokens
- Never use hard-coded hex colors or px values
- Add shadcn components via CLI, not copy-paste

### AI Integration
- Use AI SDK's `generateObject` or `streamObject` with Zod schemas
- All AI calls from server (Edge/Node); no client-side API keys
- Prompts are modular and live in `libs/ai/prompts/*` (Phase 1)
- On invalid JSON, retry once with repair prompt; if still invalid, return 422
- Strict "no fabrication" policy enforced in prompts
- Streaming: Use SSE helpers from `libs/utils/sse.ts` when `?stream=true` (Phase 1)

### State Management
- Zustand stores with zundo middleware for undo/redo
- Group rapid changes (120-180ms debounce)
- Store only UI state + document JSON (not server response cache)
- Autosave is debounced and cancels on unmount

## Key Development Rules

### Prohibited Patterns (Hard Rules)
- ❌ Raw API handlers without wrappers
- ❌ Repositories used in client components
- ❌ Service role key in runtime code
- ❌ Hard-coded CSS values (colors, px)
- ❌ Class-based repos or singletons holding DB clients
- ❌ Mixing `--app-*` and `--doc-*` tokens in the same component
- ❌ Building custom state libraries (use Zustand)
- ❌ Any UI library besides Tailwind + shadcn/ui
- ❌ Icons from any source other than Lucide React

### TypeScript Conventions
- Strict mode enabled; no `any` (use `unknown` + narrowing)
- Explicit return types on all exported functions
- Zod schemas for all external inputs (API bodies, AI outputs)
- Immutable data patterns (use immer in Zustand)

### Naming Conventions
- Files/folders: kebab-case
- Components: PascalCase with `ComponentNameProps` interface
- Hooks: `useXxx`
- Repositories: `{entity}.ts` (e.g., `documents.ts`) — Phase 1
- Templates: `libs/templates/{type}/{slug}` — Phase 1
- Use path aliases from tsconfig: `@/libs/...` (no deep relative imports)

### Performance Budgets
- Keystroke → preview paint: p95 ≤ 120ms
- Template switch render: ≤ 200ms
- PDF export (1-2 pages): ≤ 2.5s
- DOCX export: ≤ 1.5s
- Scoring (deterministic): ≤ 200ms
- Scoring (with LLM): ≤ 1.2s

### Error Handling
- Use `apiError(status, message)` in routes
- Never log PII (emails, phones, addresses) — only IDs and status
- Error categories: `USER_INPUT` (400-422), `AUTH` (401-403), `NOT_FOUND` (404), `CONFLICT` (409), `RATE_LIMIT` (429), `SERVER` (5xx)
- UI: Show toasts + inline hints; preserve user inputs
- Retry only for idempotent operations with exponential backoff

### Security
- Auth: Google OAuth only via Supabase Auth
- RLS enforced on all tables; repository layer always passes `user.id`
- Storage: Signed URLs with short TTL; validate type/size on upload
- No content logging; redact PII from error reports
- CORS: Same-origin; no public write endpoints

### Internationalization
- Dates: `Intl.DateTimeFormat` with user's locale
- Addresses: formatter utility (rules per country)
- Phones: libphonenumber utility
- RTL support: `dir="rtl"` in templates for Arabic/Hebrew

## Adding New Features

### Add API Endpoint
1. Define Zod request/response schemas in `libs/validation` (Phase 1)
2. Create route under `app/api/v1/...` with `withAuth` or `withApiHandler` (Phase 1 wrappers)
3. Use repository functions; never inline SQL (Phase 1 pattern)
4. Return `apiSuccess(data)` or `apiError(status, message)` (Phase 1 helpers)

### Add Template (Phase 1)
1. Create `libs/templates/{type}/{slug}` as pure React component
2. Consume only `--doc-*` tokens (not `--app-*`)
3. Handle pagination with `break-inside: avoid` for print
4. Register in `libs/templates/index.ts`

### Add Document Field (Phase 1)
1. Update runtime Zod schema and bump `schemaVersion`
2. Update editor form and preview rendering
3. Update exporter mappings (PDF/DOCX)
4. Add migration only if storing derived field (rare)
5. Provide upgrade path (clone into new schema)

## Project-Specific Details

### Configuration
Key config lives in `config.ts`:
- App name, description, domain
- Stripe plans (development vs production price IDs)
- Resend email settings (fromNoReply, fromAdmin, supportEmail)
- Auth paths (loginUrl: `/signin`, callbackUrl: `/dashboard`)
- Main theme color

### Supabase Client Setup
Three client types in `libs/supabase/`:
- `client.ts`: Browser client
- `server.ts`: Server component/route handler client
- `middleware.ts`: Middleware client with session refresh

### Documentation Location
Comprehensive planning docs in `ai_docs/`:
- `project_documentation/`: PRD, architecture, API specs, DB schema, tech stack, requirements, UI/UX, auth matrix, standards, error handling, performance
- `standards/`: Architecture principles, data flow patterns, component standards, API contracts, error handling, security, performance, code review
- `design-system.md`: Design token system and guidelines

### Phase-Based Development
The project is organized in phases (see `/phases/` directory):
- Each phase contains its own implementation plan and milestones
- Follow phase documentation for context on current development stage

## Common Workflows (Phase 1)

These workflows describe the target Phase 1 implementation. They document the intended architecture for document handling, AI drafting, PDF import, and scoring features.

### Working with Documents (Resume/Cover Letter)
1. Load document via repository function with user-scoped Supabase client
2. Store in Zustand with zundo for undo/redo
3. Autosave debounced updates via API
4. Templates render from same schema
5. Export to PDF (Puppeteer) or DOCX via `/api/v1/export/*`

### AI Drafting Flow
1. Client sends input to `/api/v1/ai/draft/{type}?stream=true`
2. Edge function uses AI SDK `streamObject` with Zod schema
3. SSE streams deltas to client
4. Client updates preview in real-time
5. User saves final draft as document

### PDF Import Flow
1. Upload to `/api/v1/import/pdf` (Node)
2. Extract text via pdf-parse/unpdf
3. If no text layer, offer OCR (Tesseract, ≤10 pages)
4. Send to Gemini with strict Zod schema → ResumeJson
5. Show Review & Fix UI before saving

### Scoring
1. Phase A (deterministic): Local checks on JSON structure
2. Phase B (LLM rubric): Optional Gemini call for qualitative scoring
3. Return overall score (0-100) + 5 sub-scores with actionable suggestions:
   - ATS Readiness (30 pts)
   - Keyword Match (25 pts)
   - Content Strength (20 pts)
   - Format Quality (15 pts)
   - Completeness (10 pts)

## Testing & Visual Verification Standard

**MANDATORY for all UI features**: Visual verification must be performed before marking any UI feature complete.

### Testing Approach

ResumePair uses **Puppeteer MCP-based manual testing** (no Playwright, no Vitest, no automated test suites).

**Why this approach:**
- Previous testing system (Playwright + Vitest) caused system freezes due to multiple watchers
- Simplified testing reduces complexity while maintaining reliability
- Manual playbooks with embedded MCP commands provide proof of functionality
- Visual verification integrated directly into testing workflow

### Testing Components

1. **Playbooks** (`ai_docs/testing/playbooks/`)
   - Markdown checklists with embedded Puppeteer MCP commands
   - One playbook per phase (~20 total across 8 phases)
   - Combines manual verification + automated checks
   - Estimated 15-20 minutes per playbook

2. **MCP Patterns** (`ai_docs/testing/mcp_patterns.md`)
   - Reusable Puppeteer command library
   - Copy-paste patterns for common scenarios
   - Navigation, screenshots, element verification, API testing

3. **Visual Verification** (`ai_docs/standards/9_visual_verification_workflow.md`)
   - 11-step workflow for UI quality assurance
   - Screenshot → Analyze → Refine → Document
   - Desktop (1440px) + Mobile (375px) screenshots required
   - Design system compliance checks

### Visual Verification Workflow (Mandatory)

**For EVERY UI feature, agents must:**

1. **Build feature** with design tokens (no hardcoded values)
2. **Start dev server** (`npm run dev`)
3. **Navigate to feature page** using `mcp__puppeteer__puppeteer_navigate`
4. **Capture screenshots**:
   ```javascript
   // Desktop
   mcp__puppeteer__puppeteer_screenshot({
     name: "feature_name_desktop",
     width: 1440,
     height: 900
   })

   // Mobile
   mcp__puppeteer__puppeteer_screenshot({
     name: "feature_name_mobile",
     width: 375,
     height: 667
   })
   ```
5. **Analyze against Visual Quality Checklist**:
   - [ ] Spacing generous (≥16px gaps, ≥24px card padding)
   - [ ] Clear typography hierarchy
   - [ ] One primary action (lime button) per section
   - [ ] Design tokens used (no hardcoded values)
   - [ ] Responsive (no horizontal scroll on mobile)
   - [ ] Ramp palette only (navy, lime, grays)
6. **Refine if needed** (increase spacing, fix hierarchy, etc.)
7. **Document results** in `ai_docs/progress/phase_N/visual_review.md`
8. **Save screenshots** to `ai_docs/progress/phase_N/screenshots/`

### Phase Gate Requirements

**Before proceeding to next phase:**
- [ ] All playbook tests passed (✅)
- [ ] Visual verification completed for all UI features
- [ ] Screenshots saved and documented
- [ ] No critical issues remaining

**Time estimate**: 20-30 minutes per phase gate

### Key Rules

- **No watch mode** - All testing is on-demand execution only
- **No test code** - Agents execute playbooks, they don't write tests
- **Visual proof required** - Screenshots are mandatory for UI features
- **Design system compliance** - All UI must use `--app-*` and `--doc-*` tokens
- **One tool only** - Use Puppeteer MCP exclusively (no mixing tools)

### Visual Quality Standards

See `ai_docs/standards/3_component_standards.md` Section 10 for complete visual standards.

**Quick reference:**
- **Spacing**: 8px grid, generous padding (space-6 for cards)
- **Colors**: Navy (dark/medium), lime accent, gray scale only
- **Typography**: Clear hierarchy, Inter font, text-4xl → text-xl → text-base
- **Primary actions**: One lime button per section (not multiple)
- **Components**: shadcn/ui only, follow composition patterns

### Reference Documentation

- **Testing README**: `ai_docs/testing/README.md`
- **MCP Patterns**: `ai_docs/testing/mcp_patterns.md`
- **Visual Verification Workflow**: `ai_docs/standards/9_visual_verification_workflow.md`
- **Component Standards**: `ai_docs/standards/3_component_standards.md` (Section 10)
- **Code Review Standards**: `ai_docs/standards/8_code_review_standards.md` (Section 9)
- **Playbook Template**: `ai_docs/testing/playbooks/playbook_template.md`

## Important Notes

- **Manual testing with MCP** replaces automated testing (no Playwright/Vitest)
- **Visual verification mandatory** for all UI features
- **No analytics** per design decisions (only error/performance logging)
- Migrations are **file-only** until explicitly approved
- Templates must be **pure React** and schema-agnostic
- All dates stored as ISO strings; format via Intl at render time
- Feature flags: Simple env or in-code toggles (no flag service)
- Rate limiting: In-memory token bucket (3 req/s soft, 10 req/10s hard)

## Reference Files

- PRD: `ai_docs/project_documentation/1_prd_v1.md`
- System Architecture: `ai_docs/project_documentation/2_system_architecture.md`
- Development Standards: `ai_docs/project_documentation/9_development_standards_and_guidelines.md`
- API Specification: `ai_docs/project_documentation/3_api_specification.md`
- Database Schema: `ai_docs/project_documentation/4_database_schema.md`