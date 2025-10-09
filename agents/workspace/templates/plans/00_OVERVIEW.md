# Template System Migration - Complete Overview

**⚠️ CRITICAL: READ THIS FIRST**

This document provides an overview of the complete template system migration project. If you are the engineer implementing this, you are reading a plan written by someone else. You may lack full context of the codebase and the decisions made.

---

## Source Repository Location

**IMPORTANT**: We are adopting the template system from an open-source project called Reactive-Resume.

**Local Path**: `/Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume`

This repository is cloned locally in the `agents/repos/` directory. Throughout implementation, you will need to reference this source code frequently to understand exact implementation patterns, component APIs, and logic flows.

**Key Source Locations**:
- Templates: `agents/repos/Reactive-Resume/apps/artboard/src/templates/*.tsx`
- Schema: `agents/repos/Reactive-Resume/libs/schema/src/`
- Components: `agents/repos/Reactive-Resume/apps/artboard/src/components/`
- PDF Generation: `agents/repos/Reactive-Resume/apps/server/src/printer/printer.service.ts`

---

## Project Goal

**What We're Doing**: Complete replacement of our current 4 templates with 12 professionally designed templates from Reactive-Resume, along with adopting their superior architecture patterns.

**Why**: Our current templates have:
- Poor PDF rendering (overflow issues, layout problems)
- Code duplication (~200 lines per template)
- Hardcoded CSS (750-line monolith)
- Limited customization
- Bad default values and sizing

**End State**:
- 12 new templates (Azurill, Bronzor, Chikorita, Ditto, Gengar, Glalie, Kakuna, Leafish, Nosepass, Onyx, Pikachu, Rhyhorn)
- Clean, modular architecture
- Per-page PDF processing (fixes overflow)
- 3D layout system (drag-drop section ordering)
- 900+ Google Fonts support
- Perfect PDF quality matching preview

---

## Architecture Philosophy

**ADOPT EVERYTHING FROM SOURCE** - We are not cherry-picking features. We are doing a wholesale adoption of their proven template system because:

1. Their architecture is production-tested
2. Their PDF rendering works perfectly
3. Their components are reusable and well-designed
4. Their patterns solve all our current problems

**Key Adoptions**:
- ✅ Tailwind CSS (replace our CSS-in-JS)
- ✅ Phosphor Icons (replace Lucide React)
- ✅ Generic `<Section>` component pattern
- ✅ 3D layout array `layout[page][column][section]`
- ✅ Per-page PDF processing with pdf-lib
- ✅ Zoom/pan preview with react-zoom-pan-pinch
- ✅ Font system with 438KB Google Fonts metadata
- ✅ Social icon CDN integration
- ✅ Zod-validated schemas
- ✅ Their store patterns (adapted to our Zustand)

---

## Current vs. Target State

### Current State (ResumePair)
```
Templates:
├── onyx.tsx (136 lines)
├── modern.tsx (162 lines)
├── creative.tsx (149 lines)
└── technical.tsx (140 lines)

Rendering:
- Single-pass Puppeteer PDF
- Iframe-isolated preview
- CSS-in-JS styling (750 lines monolith)

Schema:
- ResumeJson → mappers → ArtboardDocument → templates
- Fixed layouts per template
- Limited customization (3 colors)
```

### Target State (After Migration)
```
Templates:
├── azurill.tsx (576 lines) ← NEW
├── bronzor.tsx (585 lines) ← NEW
├── chikorita.tsx (597 lines) ← NEW
├── ditto.tsx (626 lines) ← NEW
├── gengar.tsx (605 lines) ← NEW
├── glalie.tsx (612 lines) ← NEW
├── kakuna.tsx (541 lines) ← NEW
├── leafish.tsx (537 lines) ← NEW
├── nosepass.tsx (600 lines) ← NEW
├── onyx.tsx (579 lines) ← REPLACED
├── pikachu.tsx (622 lines) ← NEW
└── rhyhorn.tsx (582 lines) ← NEW

Rendering:
- Per-page Puppeteer PDF (each page separate, then merged)
- Zoom/pan builder mode + clean preview mode
- Tailwind utility classes

Schema:
- ResumeJson → adapter layer → templates (direct consumption)
- Dynamic 3D layout array (user-configurable)
- Rich customization (theme, fonts, layout, custom CSS)
```

---

## Implementation Phases

This migration is broken into **5 sequential phases**. Each phase has its own detailed plan document.

### Phase 1: Foundation & Infrastructure
**File**: `01_PHASE1_FOUNDATION.md`
**Duration**: ~5-7 days
**Goal**: Build the foundation - schema changes, store adapters, shared components

**Deliverables**:
- Extended schema with 3D layout array
- Store adapter layer (wraps documentStore)
- Generic `<Section>` component (reusable)
- Shared components (Rating, Link, LinkedEntity, Picture, BrandIcon, Page)
- Tailwind CSS integration
- Phosphor Icons integration

**Why First**: Everything else depends on this foundation.

---

### Phase 2: PDF Per-Page Processing
**File**: `02_PHASE2_PDF_PROCESSING.md`
**Duration**: ~3-4 days
**Goal**: Replace single-pass PDF rendering with per-page processing

**Deliverables**:
- Per-page DOM cloning and isolation
- pdf-lib multi-page merging
- Custom CSS injection per page
- Image loading synchronization
- Performance benchmarking

**Why Second**: Need working PDF before migrating templates (validates approach).

---

### Phase 3: Template Migration
**File**: `03_PHASE3_TEMPLATES.md`
**Duration**: ~7-10 days
**Goal**: Migrate all 12 templates from source

**Approach**:
1. Migrate Onyx first (proof-of-concept)
2. Validate preview + PDF quality
3. Migrate remaining 11 templates in parallel

**Deliverables**:
- 12 fully functional templates
- Template registry updated
- Catalog metadata for all templates
- Template thumbnails generated
- Old templates deleted

**Why Third**: Foundation + PDF must work before templates.

---

### Phase 4: Font System & Layout Editor
**File**: `04_PHASE4_FONTS_AND_LAYOUT.md`
**Duration**: ~4-5 days
**Goal**: Add advanced customization features

**Deliverables**:
- 900+ Google Fonts integration
- Font loading with webfontloader
- Typography customization panel
- Drag-drop layout editor (dnd-kit)
- Add/remove page controls
- Layout reset functionality

**Why Fourth**: Templates work with default layouts; this adds power features.

---

### Phase 5: Migration & Validation
**File**: `05_PHASE5_MIGRATION_VALIDATION.md`
**Duration**: ~3-4 days
**Goal**: Migrate existing user resumes and validate everything works

**Deliverables**:
- Database migration script
- Old template → new template mapping
- Default layout generation logic
- Rollback mechanism
- Manual testing checklist (12 templates × preview + PDF)
- Performance validation
- Bundle size analysis

**Why Last**: Only migrate users after everything is proven to work.

---

## Critical Dependencies Between Phases

```
Phase 1 (Foundation)
    ↓ (Required for all)
    ├─→ Phase 2 (PDF Processing)
    │       ↓ (Required for templates)
    │       └─→ Phase 3 (Templates)
    │               ↓ (Required for advanced features)
    │               └─→ Phase 4 (Fonts & Layout)
    │                       ↓ (Required for user migration)
    │                       └─→ Phase 5 (Migration & Validation)
```

**You cannot skip phases. Each builds on the previous.**

---

## Key Technical Decisions

### 1. CSS Strategy: Tailwind (Adopted from Source)
- Templates use Tailwind utility classes
- Removes 750-line CSS-in-JS monolith
- Requires Tailwind added to artboard build config

### 2. Icon System: Phosphor Icons (Adopted from Source)
- Replace all Lucide React icons
- Source uses `<i className="ph ph-bold ph-link">`
- Requires `@phosphor-icons/core` package

### 3. Data Flow: Thin Adapter Layer
- Keep existing mappers for backward compatibility
- Add thin adapter that makes our data "look like" source data
- Templates consume adapter output

### 4. Preview System: Dual Mode (Adopted from Source)
- Builder mode: Zoom/pan with controls
- Preview mode: Clean HTML for PDF
- Uses `react-zoom-pan-pinch` library

### 5. PDF Strategy: Per-Page Processing (Adopted from Source)
- Each page cloned from DOM
- Rendered separately to PDF buffer
- Merged with pdf-lib
- Solves overflow issues

### 6. Layout System: 3D Array (Adopted from Source)
- `layout[page][column][section]` structure
- Drag-drop editing with dnd-kit
- User-configurable section ordering

### 7. Font System: Google Fonts Full Integration (Adopted from Source)
- 438KB metadata file with 900+ fonts
- Dynamic loading with webfontloader
- Font subset and variant selection

---

## Migration Strategy for Existing Users

**Old Template → New Template Mapping**:
- `onyx` (ours) → `kakuna` (source) - Both simple single-column
- `modern` (ours) → `azurill` (source) - Both two-column with sidebar
- `creative` (ours) → `pikachu` (source) - Both bold/creative designs
- `technical` (ours) → `bronzor` (source) - Both clean/professional

**Default Layout Generation**:
- Page 1, Column 1 (Main): ["summary", "experience", "education", "projects"]
- Page 1, Column 2 (Sidebar): ["skills", "certifications", "languages", "awards"]

**Appearance Preservation**:
- Migrate existing `appearance.theme` colors
- Migrate existing `appearance.typography` settings
- Migrate existing `appearance.layout` page settings
- Add default `appearance.layout` array

---

## Testing Strategy

**No Automated Testing** (per project constraints)

**Manual Validation Checklist** (per template):
1. ✅ Preview renders correctly in browser
2. ✅ All sections display with sample data
3. ✅ Theme colors apply correctly
4. ✅ Font changes work
5. ✅ PDF exports without errors
6. ✅ PDF matches preview (WYSIWYG)
7. ✅ No content overflow in PDF
8. ✅ Multi-page resumes work
9. ✅ Custom CSS applies
10. ✅ Icons render correctly

**Multiply by 12 templates = 120 validation points**

---

## Risk Mitigation

### High Risk: PDF Rendering Issues
**Mitigation**: Implement Phase 2 (PDF processing) early, validate thoroughly before Phase 3

### High Risk: Bundle Size Explosion
**Mitigation**: Implement lazy loading per template, measure bundle impact

### Medium Risk: User Data Migration Failures
**Mitigation**: Create rollback mechanism, test on staging data first

### Medium Risk: Font Loading Performance
**Mitigation**: Load fonts on-demand, cache aggressively

### Low Risk: Icon System Conflicts
**Mitigation**: Namespace Phosphor classes, gradual rollout

---

## Success Metrics

**Must Achieve**:
- ✅ All 12 templates render perfectly in preview
- ✅ All 12 templates export perfect PDFs (no overflow)
- ✅ PDF generation time ≤ 3 seconds per page
- ✅ Preview update latency ≤ 120ms
- ✅ Zero user data loss during migration
- ✅ Bundle size increase ≤ 100KB (after gzip)

**Nice to Have**:
- Font loading ≤ 1 second
- Template thumbnails auto-generated
- Layout editor intuitive and fast

---

## Timeline Estimate

| Phase | Duration | Cumulative |
|-------|----------|------------|
| Phase 1: Foundation | 5-7 days | Week 1 |
| Phase 2: PDF Processing | 3-4 days | Week 1-2 |
| Phase 3: Templates | 7-10 days | Week 2-3 |
| Phase 4: Fonts & Layout | 4-5 days | Week 3-4 |
| Phase 5: Migration | 3-4 days | Week 4 |
| **Total** | **22-30 days** | **~1 month** |

**Assumes**: Single engineer working full-time, no major blockers

---

## Next Steps

1. **Read Phase 1 plan**: `01_PHASE1_FOUNDATION.md`
2. **Set up development environment**: Ensure you can run both main app and artboard locally
3. **Study source repository**: Spend 2-4 hours reading source code in `agents/repos/Reactive-Resume`
4. **Start Phase 1 implementation**: Begin with schema changes

---

## Questions? Stuck?

**Reference Materials**:
- Source code: `/Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume`
- Research reports: `/Users/varunprasad/code/prjs/resumepair/agents/workspace/templates/`
  - `CURRENT_TEMPLATE_SYSTEM.md` - Our current system analysis
  - `SOURCE_TEMPLATE_SYSTEM.md` - Source system analysis

**Key Insight**: When in doubt, look at how Reactive-Resume does it. We are adopting their patterns wholesale, not inventing new ones.

---

**Author**: Planning Agent
**Date**: 2025-10-08
**Version**: 1.0
**Status**: Ready for Implementation
