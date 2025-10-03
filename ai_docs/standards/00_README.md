# Standards Documentation

**Purpose**: Development standards and patterns for ResumePair.

---

## 📚 Index

| File | Purpose | Key Topics |
|------|---------|------------|
| **01_architecture.md** | Architectural principles | Schema-driven, layered boundaries, DI |
| **02_implementation.md** | Implementation patterns | TypeScript, API routes, repositories |
| **03_state_and_data.md** | State & data management | Zustand, forms, caching |
| **04_design_system.md** | Design tokens & theming | Dual tokens, Ramp palette |
| **05_components.md** | Component patterns | Composition, styling, performance |
| **06_visual_quality.md** | Visual verification | Quality standards, Puppeteer workflow |
| **07_quality_and_security.md** | Quality assurance | Errors, security, performance |

---

## 🚀 Quick Start

**For New Developers**:
1. Read 01_architecture.md - Core principles
2. Read 02_implementation.md - Required patterns
3. Read 04_design_system.md - Styling approach
4. Skim 07_quality_and_security.md - Quality standards

---

## 🎯 Core Principles

### Architecture
- **Schema-driven**: One JSON powers everything
- **Pure functions**: Repository pattern with DI
- **Layered boundaries**: Presentation → Application → Domain → Infrastructure

### Implementation
- **TypeScript strict**: No `any`, explicit types
- **API patterns**: Always use `withAuth`/`withApiHandler`
- **Design tokens**: Two systems (`--app-*` vs `--doc-*`)

### Quality
- **Performance budgets**: Preview 120ms, PDF 2.5s
- **Security**: RLS enforced, no PII logging
- **Visual standards**: Generous spacing, one primary CTA

---

See individual files for complete documentation.
