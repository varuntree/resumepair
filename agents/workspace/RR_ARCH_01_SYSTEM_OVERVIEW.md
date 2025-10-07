# RR_ARCH_01: Reactive Resume - System Overview

**Generated:** 2025-10-07
**Source Repository:** `/Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume`
**Purpose:** Complete architectural overview of Reactive Resume system

---

## 1. TECHNOLOGY STACK

### Core Framework & Build System
- **Monorepo:** NX Workspace (v19.8.14)
- **Package Manager:** pnpm (v10.17.1)
- **Node Version:** >= 22.13.1
- **Build Tool:** Vite (v5.4.20)
- **TypeScript:** v5.9.3

### Frontend Stack
- **Framework:** React 18.3.1
- **State Management:** Zustand v4.5.7 with Zundo (temporal/undo-redo)
- **Router:** React Router v7.9.3
- **Data Fetching:** TanStack Query v5.90.2 (React Query)
- **Forms:** React Hook Form v7.63.0 with @hookform/resolvers
- **Styling:** TailwindCSS v3.4.17 with tailwindcss-animate
- **UI Components:** Radix UI (complete suite)
- **Internationalization:** Lingui v4.14.1
- **Rich Text:** TipTap v2.26.2
- **Drag & Drop:** dnd-kit v6.3.1

### Backend Stack
- **Framework:** NestJS v10.4.20
- **Runtime:** Node.js (Express)
- **Database ORM:** Prisma v5.22.0
- **Database:** PostgreSQL
- **Authentication:** Passport.js with multiple strategies
  - Local (email/password)
  - GitHub OAuth
  - Google OAuth
  - OpenID Connect
- **Session Management:** express-session
- **Validation:** Zod v3.25.76 with nestjs-zod
- **API Documentation:** Swagger/OpenAPI

### PDF Generation & Rendering
- **Browser Automation:** Puppeteer v23.11.1
- **PDF Manipulation:** pdf-lib v1.17.1
- **Image Processing:** Sharp v0.34.4

### Storage & External Services
- **Object Storage:** MinIO (via minio v8.0.6)
- **Email:** Nodemailer v6.10.1
- **AI Integration:** OpenAI SDK v4.104.0

### Testing & Quality
- **Test Framework:** Vitest v2.1.9
- **Coverage:** @vitest/coverage-v8
- **Linting:** ESLint v8.57.1
- **Formatting:** Prettier v3.6.2

---

## 2. PROJECT STRUCTURE

### Repository Layout
```
/Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume/
├── apps/                    # Application workspaces
│   ├── artboard/           # PDF rendering engine (React)
│   ├── client/             # Main frontend application (React)
│   └── server/             # Backend API (NestJS)
├── libs/                    # Shared libraries
│   ├── dto/                # Data Transfer Objects
│   ├── hooks/              # Shared React hooks
│   ├── parser/             # Resume parsing utilities
│   ├── schema/             # Zod schemas & types
│   ├── ui/                 # Shared UI components
│   └── utils/              # Utility functions
├── tools/
│   ├── prisma/             # Database schema
│   └── compose/            # Docker compose files
├── package.json            # Root workspace config
├── nx.json                 # NX configuration
├── pnpm-workspace.yaml     # pnpm workspaces
└── tsconfig.base.json      # Base TypeScript config
```

### Apps Structure

#### Client App (`apps/client/src/`)
```
apps/client/src/
├── assets/              # Static assets
├── components/          # Shared React components
├── constants/           # Application constants
├── hooks/              # Custom React hooks
├── libs/               # Client libraries (axios, query-client)
├── locales/            # i18n translation files (60+ languages)
├── pages/              # Page components
│   ├── auth/          # Authentication pages
│   ├── builder/       # Resume builder interface
│   ├── dashboard/     # User dashboard
│   ├── home/          # Landing page
│   └── public/        # Public resume viewing
├── providers/          # React context providers
├── router/             # React Router configuration
│   ├── guards/        # Route guards (auth, guest)
│   └── loaders/       # Route loaders
├── services/           # API service layer
│   ├── auth/
│   ├── resume/
│   ├── user/
│   ├── openai/
│   └── storage/
├── stores/             # Zustand stores
│   ├── resume.ts      # Resume state management
│   ├── builder.ts     # Builder UI state
│   ├── auth.ts        # Auth state
│   ├── dialog.ts      # Dialog state
│   └── openai.ts      # AI feature state
├── styles/             # Global styles
└── main.tsx            # Application entry point
```

#### Server App (`apps/server/src/`)
```
apps/server/src/
├── auth/               # Authentication module
│   ├── guards/        # Auth guards
│   ├── strategy/      # Passport strategies
│   └── utils/         # Auth utilities
├── config/             # Configuration schemas
├── database/           # Database module
├── feature/            # Feature flags
├── health/             # Health check endpoints
├── mail/              # Email service
├── printer/            # PDF generation service
├── resume/             # Resume CRUD operations
│   ├── decorators/    # Custom decorators
│   └── guards/        # Resume-specific guards
├── storage/            # Object storage service
├── translation/        # Translation service
├── user/              # User management
│   └── decorators/    # User decorators
├── app.module.ts       # Root module
└── main.ts             # Application bootstrap
```

#### Artboard App (`apps/artboard/src/`)
```
apps/artboard/src/
├── components/         # Artboard components
│   ├── page.tsx       # Page wrapper component
│   ├── picture.tsx    # Profile picture component
│   └── brand-icon.tsx # Icon component
├── templates/          # Resume templates (12 templates)
│   ├── azurill.tsx
│   ├── bronzor.tsx
│   ├── chikorita.tsx
│   ├── ditto.tsx
│   ├── gengar.tsx
│   ├── glalie.tsx
│   ├── kakuna.tsx
│   ├── leafish.tsx
│   ├── nosepass.tsx
│   ├── onyx.tsx
│   ├── pikachu.tsx
│   ├── rhyhorn.tsx     # Default template
│   └── index.tsx       # Template registry
├── types/
│   └── template.ts     # Template type definitions
├── store/              # Artboard-specific state
├── providers/          # Artboard providers
└── main.tsx            # Artboard entry point
```

### Shared Libraries

#### Schema Library (`libs/schema/src/`)
```
libs/schema/src/
├── basics/             # Basic info schemas
│   ├── index.ts       # Basics schema (name, email, etc.)
│   └── custom.ts      # Custom fields
├── sections/           # Section schemas (13 types)
│   ├── index.ts       # Section definitions
│   ├── award.ts
│   ├── certification.ts
│   ├── custom-section.ts
│   ├── education.ts
│   ├── experience.ts
│   ├── interest.ts
│   ├── language.ts
│   ├── profile.ts
│   ├── project.ts
│   ├── publication.ts
│   ├── reference.ts
│   ├── skill.ts
│   └── volunteer.ts
├── shared/             # Shared schemas
│   ├── id.ts          # ID validation
│   ├── item.ts        # Base item schema
│   ├── url.ts         # URL schema
│   └── types.ts       # Utility types
├── metadata/           # Resume metadata
│   └── index.ts       # Template, layout, theme, typography
├── index.ts            # Main schema export
└── sample.ts           # Sample data
```

---

## 3. ARCHITECTURE PATTERNS

### Monorepo Architecture
- **NX Workspace** manages multiple applications and libraries
- **Shared Libraries** enable code reuse across apps
- **Strict Dependency Graph** enforces proper separation of concerns
- **Incremental Builds** optimize development and CI/CD

### Frontend Architecture

#### State Management Strategy
1. **Zustand Stores** for client-side state
   - `resume.ts`: Resume data with undo/redo (Zundo)
   - `builder.ts`: Builder UI state (sidebar, frame ref)
   - `auth.ts`: Authentication state
   - `dialog.ts`: Dialog/modal state
   - `openai.ts`: AI features state

2. **TanStack Query** for server state
   - Automatic caching and invalidation
   - Background refetching
   - Optimistic updates
   - Query key structure: `['resume', { id }]`

3. **Temporal State (Zundo)** for undo/redo
   - Integrated with Zustand resume store
   - 100 history states limit
   - Partialize strategy for selective persistence

#### Component Architecture
- **Radix UI Primitives** for accessible base components
- **Compound Components** pattern for complex UI
- **Render Props** for flexible composition
- **Custom Hooks** for business logic extraction

#### Data Flow
```
User Input → Form (React Hook Form)
          → Zustand Store (setValue)
          → Debounced API Call
          → Backend Update
          → Query Invalidation
          → Re-render
```

### Backend Architecture

#### Layered Architecture
1. **Controllers** (`*.controller.ts`)
   - HTTP request/response handling
   - Route definitions with decorators
   - Guard application
   - DTO validation

2. **Services** (`*.service.ts`)
   - Business logic implementation
   - Prisma database operations
   - External service integration

3. **Guards** (`*.guard.ts`)
   - Authentication checks (TwoFactorGuard)
   - Authorization checks (ResumeGuard)
   - Optional authentication (OptionalGuard)

4. **Decorators** (`*.decorator.ts`)
   - Custom parameter decorators
   - `@User()`: Extract user from request
   - `@Resume()`: Extract resume from request

#### Module Organization
- **Feature Modules** (auth, resume, user, printer, etc.)
- **Shared Modules** (database, config, storage)
- **Dynamic Module** pattern for configuration

### Database Architecture

#### Prisma Schema
**Location:** `tools/prisma/schema.prisma`

**Models:**
1. **User** - User accounts
2. **Secrets** - Sensitive user data (passwords, tokens)
3. **Resume** - Resume documents (data stored as JSON)
4. **Statistics** - Resume view/download counters

**Key Patterns:**
- Cascade deletes for data integrity
- Composite unique constraints
- JSON column for flexible resume data
- Enum types for provider and visibility

---

## 4. KEY INTEGRATIONS

### PDF Generation Pipeline
```
Client Request → Server API → Printer Service
                                  ↓
                            Puppeteer + Chrome
                                  ↓
                            Artboard App (iframe)
                                  ↓
                            Template Rendering
                                  ↓
                            PDF per Page
                                  ↓
                            pdf-lib Merge
                                  ↓
                            MinIO Storage
                                  ↓
                            Return URL
```

**Key Implementation:**
- `/Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume/apps/server/src/printer/printer.service.ts`
- Chrome runs in Docker container
- Artboard accessed via `/artboard/preview`
- Resume data passed via localStorage
- Each page rendered and converted to PDF separately
- Pages merged using pdf-lib
- Result stored in MinIO

### Builder to Artboard Communication
```
Builder (Client) → iframe postMessage
                      ↓
              Artboard (React App)
                      ↓
              Zustand Store Update
                      ↓
              Template Re-render
```

**Message Format:**
```typescript
{
  type: "SET_RESUME",
  payload: ResumeData
}
```

**Implementation:**
- `/Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume/apps/client/src/pages/builder/page.tsx:20-26`

### Authentication Flow
1. **Local Strategy:** Email/password with bcrypt
2. **OAuth Strategies:** GitHub, Google, OpenID
3. **JWT Tokens:** Access tokens in cookies
4. **Session Management:** express-session
5. **Two-Factor Auth:** OTP with backup codes
6. **Email Verification:** Token-based verification

---

## 5. DATA PERSISTENCE

### Client-Side Storage
- **localStorage:** Resume data for artboard
- **Query Cache:** TanStack Query cache
- **Zustand Persist:** Not used (server as source of truth)

### Server-Side Storage
- **PostgreSQL:** Structured data (users, metadata)
- **JSON Column:** Resume data (flexible schema)
- **MinIO:** Generated PDFs and previews

### Caching Strategy
- **Query Keys:** Structured for granular invalidation
- **Debounced Updates:** 1000ms debounce on resume updates
- **Optimistic Updates:** Not extensively used
- **Background Refetch:** Disabled for resume data

---

## 6. DEPLOYMENT ARCHITECTURE

### Docker Composition
- **Client:** Vite dev server / static build
- **Server:** NestJS application
- **Database:** PostgreSQL container
- **Storage:** MinIO container
- **Chrome:** Browserless Chrome container

### Environment Configuration
**Location:** `apps/server/src/config/schema.ts`

**Key Variables:**
- `DATABASE_URL`: PostgreSQL connection
- `STORAGE_URL`: MinIO endpoint
- `CHROME_URL`: Chrome WebSocket endpoint
- `PUBLIC_URL`: Frontend URL
- `ACCESS_TOKEN_SECRET`: JWT secret
- OAuth credentials (GitHub, Google, OpenID)
- Email SMTP settings

---

## 7. DEVELOPMENT WORKFLOW

### Scripts (from package.json:17-33)
```bash
pnpm dev                    # Start all apps in dev mode
pnpm build                  # Build all apps
pnpm start                  # Start production server
pnpm test                   # Run tests
pnpm lint                   # Lint code
pnpm format                 # Format code
pnpm prisma:generate        # Generate Prisma client
pnpm prisma:migrate         # Run migrations
pnpm prisma:migrate:dev     # Dev migrations
pnpm messages:extract       # Extract i18n messages
pnpm crowdin:sync           # Sync translations
```

### Development Flow
1. Run `pnpm dev` to start all apps
2. Client available at `http://localhost:5173`
3. Server available at `http://localhost:3000`
4. Artboard available at `http://localhost:5174`
5. Hot reload enabled for all apps

---

## 8. CODE QUALITY & TOOLING

### Linting & Formatting
- **ESLint:** v8.57.1 with TypeScript, React, Prettier plugins
- **Prettier:** v3.6.2 with Tailwind plugin
- **Import Sorting:** eslint-plugin-simple-import-sort
- **Unused Imports:** eslint-plugin-unused-imports
- **Accessibility:** eslint-plugin-jsx-a11y

### Type Safety
- **Strict TypeScript:** Full strict mode enabled
- **Zod Validation:** Runtime type checking
- **Prisma Types:** Generated database types
- **nestjs-zod:** Bridge Zod to NestJS DTOs

---

## 9. INTERNATIONALIZATION

### Lingui Setup
- **Extractor:** Macro-based extraction
- **Catalogs:** 60+ language files in `apps/client/src/locales/`
- **Crowdin Integration:** Automatic translation sync
- **Runtime Loading:** Dynamic locale loading

### Supported Languages (Sample)
- English (en-US) - Default
- Spanish (es-ES)
- French (fr-FR)
- German (de-DE)
- Chinese (zh-CN, zh-TW)
- Japanese (ja-JP)
- Korean (ko-KR)
- Arabic (ar-SA)
- Hindi (hi-IN)
- And 50+ more...

---

## 10. SECURITY CONSIDERATIONS

### Authentication Security
- **Password Hashing:** bcrypt
- **JWT Tokens:** HTTP-only cookies
- **CSRF Protection:** Cookie-based
- **Two-Factor Auth:** TOTP with backup codes
- **OAuth:** Industry-standard flows

### API Security
- **Helmet:** Security headers
- **CORS:** Credential-based
- **Rate Limiting:** Not visible in current scan
- **Input Validation:** Zod schemas on all inputs
- **SQL Injection:** Prevented by Prisma ORM

### Data Privacy
- **Resume Locking:** Prevents editing
- **Visibility Control:** Public/private resumes
- **User Isolation:** userId scoped queries
- **Cascade Deletes:** Clean data removal

---

## 11. PERFORMANCE OPTIMIZATIONS

### Frontend
- **Code Splitting:** Vite automatic splitting
- **Lazy Loading:** React.lazy for routes
- **Memoization:** React.memo where needed
- **Debouncing:** 1000ms on resume updates
- **Virtual Scrolling:** Not implemented

### Backend
- **Connection Pooling:** Prisma default
- **Indexed Queries:** Prisma schema indexes
- **Caching:** MinIO for generated PDFs
- **Retry Logic:** async-retry for PDF generation

### PDF Generation
- **Page-by-Page:** Parallel processing possible
- **Retry Mechanism:** 3 attempts with randomization
- **Image Preloading:** Wait for image load
- **Font Loading:** webfontloader integration

---

## 12. ERROR HANDLING

### Frontend
- **Error Boundaries:** React error boundaries
- **Toast Notifications:** Radix Toast for user feedback
- **Query Errors:** TanStack Query error states
- **Form Validation:** React Hook Form with Zod

### Backend
- **Global Exception Filter:** NestJS built-in
- **Typed Errors:** ErrorMessage enum
- **Logging:** NestJS Logger
- **Sentry Integration:** nest-raven (optional)

---

## 13. TESTING STRATEGY

### Unit Testing
- **Framework:** Vitest
- **Coverage:** v8 coverage provider
- **Test Location:** Co-located with source files

### Integration Testing
- **Not Extensively Implemented:** Based on file scan

### E2E Testing
- **Not Visible:** No Playwright/Cypress detected

---

## 14. DEPENDENCIES ANALYSIS

### Critical Dependencies
1. **React Ecosystem:** 18.3.1 (stable)
2. **NestJS:** 10.4.20 (stable)
3. **Prisma:** 5.22.0 (stable)
4. **Zustand:** 4.5.7 (stable)
5. **Puppeteer:** 23.11.1 (stable)

### Potential Concerns
- **Large Dependency Count:** ~250+ dependencies
- **Radix UI Suite:** 20+ packages (necessary for UI)
- **Multiple i18n Files:** 60+ locale catalogs

### Update Strategy
- **npm-check-updates:** Configured via `.ncurc.json`
- **Renovate/Dependabot:** Not visible in scan
- **pnpm Lockfile:** Ensures reproducible builds

---

## 15. KEY ARCHITECTURAL DECISIONS

### Why Monorepo?
- **Code Reuse:** Shared libraries across apps
- **Type Safety:** Shared types between client/server
- **Atomic Commits:** Related changes in single commit
- **Simplified Dependencies:** Centralized management

### Why NestJS?
- **TypeScript-First:** Full type safety
- **Modular Architecture:** Scalable organization
- **Dependency Injection:** Testable code
- **Swagger Integration:** Auto-generated docs

### Why Zustand over Redux?
- **Simplicity:** Minimal boilerplate
- **Performance:** Direct state access
- **TypeScript:** Excellent type inference
- **Middleware:** Easy undo/redo with Zundo

### Why Prisma?
- **Type Safety:** Generated types
- **Migration System:** Version control for schema
- **Query Performance:** Optimized queries
- **Developer Experience:** Intuitive API

### Why Artboard Separation?
- **Isolation:** Clean rendering environment
- **PDF Generation:** Headless Chrome access
- **Template Testing:** Independent preview
- **Performance:** Doesn't block main app

---

## 16. SCALABILITY CONSIDERATIONS

### Current Limitations
- **Single Server:** No horizontal scaling visible
- **In-Memory Session:** Not distributed
- **PDF Generation:** Synchronous, blocks during generation
- **Database:** Single PostgreSQL instance

### Potential Improvements
- **Queue System:** Bull/BullMQ for PDF jobs
- **Redis Session Store:** Distributed sessions
- **CDN:** Static asset distribution
- **Database Replication:** Read replicas
- **Microservices:** Split printer service

---

## 17. GAPS & UNKNOWNS

### From This Analysis
1. **Rate Limiting:** Not visible in scanned files
2. **Logging Strategy:** Beyond NestJS Logger
3. **Monitoring:** No APM/observability detected
4. **Backup Strategy:** Database backup procedures
5. **CI/CD Pipeline:** GitHub Actions visible but not analyzed
6. **Feature Flags:** Feature module exists but implementation unclear
7. **Analytics:** User behavior tracking
8. **WebSocket Usage:** Realtime features?

### Recommended Further Investigation
- Printer service retry logic details
- Storage service caching implementation
- Parser library functionality (not scanned)
- Feature flag system
- Email templates and delivery
- Migration strategy for schema changes
- Performance benchmarks

---

## 18. CONCLUSION

Reactive Resume is a well-architected, modern full-stack application with:

**Strengths:**
- Strong type safety (TypeScript + Zod + Prisma)
- Clean separation of concerns
- Comprehensive internationalization
- Flexible resume data model
- Modern tech stack
- Good developer experience

**Areas for Enhancement:**
- Scalability (queue systems, caching)
- Testing coverage
- Monitoring and observability
- Documentation
- Performance optimization for large resumes

**Overall Assessment:**
Production-ready for small to medium scale. Requires infrastructure improvements for large-scale deployment.

---

**Document End**
