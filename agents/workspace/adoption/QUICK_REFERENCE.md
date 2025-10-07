# Quick Reference: Adoption Plan Overview

**Main Plan**: See `plan.md` for complete details

---

## Phase Summary

| Phase | Goal | Key Deliverables | Complexity |
|-------|------|------------------|------------|
| **0** | ✅ Exploration | 18 exploration docs | Complete |
| **1** | Schema Evolution | Rich text support, custom sections, layout metadata | Low |
| **2** | Rich Text Editor | TipTap integration, toolbar, sanitization | Medium |
| **3** | Custom Sections UI | Manager, dialog, CRUD operations | Medium |
| **4** | Template Architecture | Foundation, generic section, mapping | High |
| **5** | Template Extraction | 7 templates from RR (identical designs) | High |
| **6** | CSS Theming | CSS variables, color picker, fonts | Low |
| **7** | Section Patterns | Summary (inline) + Item-based (dialog) | Medium |
| **8** | PDF Export | Template rendering, rich text in PDF | Medium |
| **9** | Integration & Testing | E2E flows, browser testing, QA | High |
| **10** | Documentation | Dev docs, user guides, migration | Low |
| **11** | Optimization & Polish | Performance, a11y, error handling | High |

---

## 7 Templates to Extract

| # | RR Name | Our Name | Layout | Key Features |
|---|---------|----------|--------|--------------|
| 1 | Rhyhorn | **Professional** | Single column | Clean, borders, circular rating |
| 2 | Azurill | **Timeline** | Sidebar (1/3, 2/3) | Timeline dots, centered header |
| 3 | Pikachu | **Modern** | Sidebar (1/3, 2/3) | Colored header band, diamonds |
| 4 | Onyx | **Executive** | Single column | Horizontal header, profiles |
| 5 | Bronzor | **Academic** | Single column | Two-column content (1:4) |
| 6 | Ditto | **Creative** | Sidebar (1/3, 2/3) | Layered header, thick borders |
| 7 | Gengar | **Bold** | Sidebar (1/3, 2/3) | Colored sidebar background |

---

## Key Decisions Made

### ✅ ADOPT
- TipTap editor (v2.26.2)
- HTML string storage for rich text
- Layout-as-data: `pages → columns → sections`
- Generic section component pattern
- CSS variable theming
- Custom sections (Record<string, CustomSection>)
- Two section patterns (Summary vs Item-based)
- 7 templates with identical RR designs
- Drag-drop with @dnd-kit
- Puppeteer PDF (already using)

### ❌ SKIP
- All 12 templates (only extract 7 best)
- Prisma/database changes (keep Supabase)
- RR's auth system
- RR's monorepo structure
- RR's AI integration (build our own)

### 🔄 ADAPT
- Schema: Add `custom` field, keep existing structure
- Data access: RR uses `basics`, we use `profile` (map on render)
- Icons: RR uses Phosphor, we keep Lucide (add Simple Icons for brands)

---

## Critical Files to Extract from RR

**Editor**:
- `/libs/ui/src/components/rich-input.tsx` → Our RichInput component
- `/libs/utils/src/namespaces/string.ts` (sanitize function) → Our sanitizeHtml utility

**Templates** (7 files):
- `/apps/artboard/src/templates/rhyhorn.tsx` → Professional
- `/apps/artboard/src/templates/azurill.tsx` → Timeline
- `/apps/artboard/src/templates/pikachu.tsx` → Modern
- `/apps/artboard/src/templates/onyx.tsx` → Executive
- `/apps/artboard/src/templates/bronzor.tsx` → Academic
- `/apps/artboard/src/templates/ditto.tsx` → Creative
- `/apps/artboard/src/templates/gengar.tsx` → Bold

**Architecture Patterns**:
- `/apps/artboard/src/components/page.tsx` → TemplatePage component
- Any template's `mapSectionToComponent()` function → sectionMapper
- Generic Section pattern (extract from template code)

**Section Patterns**:
- `/apps/client/src/pages/builder/sidebars/left/sections/summary.tsx` → Summary pattern
- `/apps/client/src/pages/builder/sidebars/left/sections/shared/section-base.tsx` → SectionBase
- `/apps/client/src/pages/builder/sidebars/left/sections/shared/section-dialog.tsx` → SectionDialog

**Utilities**:
- hexToRgb function (color with opacity)
- linearTransform function (progress bars)
- CSS variable generation pattern

---

## Dependencies to Add

```bash
pnpm add @tiptap/core@2.26.2 \
         @tiptap/react@2.26.2 \
         @tiptap/starter-kit@2.26.1 \
         @tiptap/extension-underline@2.26.2 \
         @tiptap/extension-link@2.26.2 \
         @tiptap/extension-text-align@2.26.2 \
         @dnd-kit/core@^6.1.0 \
         @dnd-kit/sortable@^8.0.0 \
         @dnd-kit/utilities@^3.2.2 \
         sanitize-html@^2.17.0 \
         webfontloader@^1.6.28
```

---

## Schema Changes

### Add to ResumeJson
```typescript
interface ResumeJson {
  // ... existing fields

  // NEW: Custom sections
  custom?: Record<string, CustomSectionGroup>;

  // NEW: Template metadata (in settings)
  settings: {
    // ... existing
    templateMetadata?: {
      template: string;
      layout: string[][][];  // pages → columns → sections
      theme: { primary, text, background };
      typography: { fontFamily, fontSize, lineHeight };
      page: { format: 'a4' | 'letter', margin: number };
    };
  };
}
```

---

## Parallel Execution Strategy

**Phase 1-3** (Foundation): Sequential
- Phase 1 must complete first (schema changes)
- Phase 2 and 3 can run in parallel after Phase 1

**Phase 4** (Template Architecture): Prerequisite for Phase 5
- Must complete before template extraction

**Phase 5** (7 Templates): **FULLY PARALLEL**
- Deploy 7 agents simultaneously
- Each extracts one template independently
- No dependencies between templates

**Phase 6-7** (Theming & Patterns): Can run in parallel
- Independent workstreams

**Phase 8** (PDF): Requires templates (Phase 5)

**Phase 9** (Testing): Requires all phases 1-8

**Phase 10-11** (Docs & Polish): Can overlap with Phase 9

---

## Agent Assignment Strategy

### Phase 1: 1 agent
Schema evolution (low complexity)

### Phase 2: 2 agents
- Agent A: RichInput component + toolbar
- Agent B: Sanitization + form integration

### Phase 3: 2 agents
- Agent A: Custom sections UI
- Agent B: Store operations + layout integration

### Phase 4: 3 agents
- Agent A: TemplatePage + Generic Section
- Agent B: Section mapping + helpers
- Agent C: Individual section components

### Phase 5: 7 agents ⭐ PARALLEL
- Agent A: Professional template
- Agent B: Timeline template
- Agent C: Modern template
- Agent D: Executive template
- Agent E: Academic template
- Agent F: Creative template
- Agent G: Bold template

### Phase 6: 1 agent
CSS theming (low complexity)

### Phase 7: 2 agents
- Agent A: Summary pattern + inline sections
- Agent B: Item-based pattern + all item sections

### Phase 8: 2 agents
- Agent A: Template renderer updates
- Agent B: PDF testing + print CSS

### Phase 9: 3 agents
- Agent A: E2E test scenarios
- Agent B: Browser/device testing
- Agent C: Performance + error testing

### Phase 10: 1 agent
Documentation

### Phase 11: 2 agents
- Agent A: Performance optimization
- Agent B: Accessibility + polish

**Total Agents**: 7 simultaneous max (Phase 5)
**Total Agent-Tasks**: ~30

---

## Success Metrics

**Functional**:
- ✅ All 7 templates render identically to RR
- ✅ Rich text works in all sections
- ✅ Custom sections fully functional
- ✅ Theme customization works
- ✅ PDF export perfect quality
- ✅ Backward compatible (no data loss)

**Performance**:
- Template switch: < 500ms
- Rich text preview update: < 200ms
- PDF generation: < 10s (1-page)
- Auto-save: < 2s

**Quality**:
- Test coverage: > 80%
- Accessibility: > 95
- Zero console errors
- Works in Chrome, Firefox, Safari, Edge

---

## Risk Mitigation

| Risk | Mitigation | Fallback |
|------|------------|----------|
| Schema breaks resumes | Lazy migration + testing | Keep old system in parallel |
| PDF quality issues | Visual regression testing | Keep existing PDF generator |
| Performance degradation | Memoization + profiling | Disable real-time preview |
| Browser compatibility | Early cross-browser testing | Feature detection + graceful degradation |
| Template extraction delays | Parallel agents | Start with 3, add 4 later |

---

## Next Steps

1. **Review plan.md** - Read full comprehensive plan
2. **Confirm approach** - User approves strategy
3. **Begin Phase 1** - Schema evolution
4. **Deploy agents** - Start parallel workstreams
5. **Monitor progress** - Track via todo lists
6. **Test continuously** - QA at each phase boundary
7. **Document** - Maintain clear records
8. **Deploy** - Ship when all criteria met

---

**Questions?** See full plan in `plan.md`
