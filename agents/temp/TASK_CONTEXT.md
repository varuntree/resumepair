# Preview System Refactoring - Context Pack

## Problem Statement

The preview system in the ResumePair application is fundamentally broken and needs a complete overhaul. The application shows a split-screen layout:
- **Left side**: Form-based editor for inputting resume information
- **Right side**: Live preview showing the formatted resume

### Critical Issues

1. **Mouse/Scroll Events Apply to Whole Page**
   - Scrolling inside the preview container affects the entire application page
   - Zoom gestures (pinch, mouse wheel) are not isolated to the preview area
   - Pan/drag interactions bleed out to the parent page

2. **Multi-Page Logic Broken**
   - Cannot scroll to subsequent pages when content overflows first page
   - Page navigation appears stuck
   - Initially shows only first two sections, zoomed in and fixed
   - No way to navigate to page 2, 3, etc. even when content exists

3. **Preview Container Fixed/Locked**
   - Preview appears "frozen" after initial load
   - Cannot scroll within the preview viewport
   - Cannot zoom or adjust view properly
   - Preview does not respond to user interactions as expected

4. **No Proper Viewport Isolation**
   - The preview content is not properly contained
   - Scroll boundaries are not respected
   - Transform/zoom operations affect parent containers

## Current Implementation Overview

### Architecture Components

**Preview Component Hierarchy:**
```
LivePreview (components/preview/LivePreview.tsx)
├── PreviewControls (zoom, page nav, viewport selector)
└── PreviewContainer (components/preview/PreviewContainer.tsx)
    └── TransformWrapper (react-zoom-pan-pinch)
        └── TransformComponent
            └── ArtboardFrame (components/preview/ArtboardFrame.tsx)
                └── iframe
                    └── ArtboardRenderer (libs/reactive-artboard/renderer/ArtboardRenderer.tsx)
                        └── Page components (libs/reactive-artboard/components/Page.tsx)
```

**Key Technical Details:**

1. **Iframe Isolation**: Uses iframe with `scrolling="no"` to isolate artboard styles
2. **react-zoom-pan-pinch**: Third-party library for zoom/pan functionality
3. **Dynamic Height**: iframe height calculated from `documentElement.scrollHeight`
4. **Page Measurement**: Uses `data-page` attributes and `offsetTop` to track page positions
5. **State Management**:
   - `previewStore.ts` - zoom, pagination, viewport state
   - `documentStore.ts` - resume data via Zustand + zundo (undo/redo)

### Identified Problems in Current Code

1. **PreviewContainer.tsx (lines 217-251)**:
   - Container has `overflow-auto` which competes with TransformWrapper
   - TransformComponent panning is conditionally disabled based on zoom
   - Scroll events handled both by container AND transform wrapper
   - Conflicts between native scroll and library pan behavior

2. **ArtboardFrame.tsx (lines 105-117)**:
   - iframe has `scrolling="no"` but parent container scrolls
   - Height is dynamically set but may not account for transform scaling
   - No communication about scroll boundaries to parent

3. **LivePreview.tsx (lines 41-42)**:
   - `pageOffsets` state tracks page positions
   - But scrolling is handled by PreviewContainer, not LivePreview
   - Disconnect between offset tracking and actual scroll behavior

4. **Page.tsx (lines 31-32)**:
   - Fixed height with `overflow: hidden` may clip content
   - No pagination break logic visible

## Scope of Changes

We are open to **complete reimplementation** if necessary. Priority is getting the preview working correctly over preserving existing code.

### What Needs to Work

1. **Isolated Scroll/Zoom**:
   - All mouse interactions (scroll, zoom, pan, pinch) must be contained within preview area
   - Parent page must not scroll/zoom when interacting with preview

2. **Multi-Page Navigation**:
   - Must be able to scroll through all pages of content
   - Page boundaries should be visible and navigable
   - Page navigation controls should accurately reflect current page
   - Should handle dynamic content that flows to 2, 3, 4+ pages

3. **Zoom Controls**:
   - Zoom in/out should work smoothly
   - Fit-to-width mode should properly calculate and apply zoom
   - Zoom should not break scrolling or pagination

4. **Performance**:
   - Preview updates must meet <120ms budget (per architecture docs)
   - RAF batching for state updates
   - Efficient page offset calculations

## Evidence & Constraints

### Tech Stack (FIXED - Cannot Change)
- Next.js 14 + React 18 + TypeScript (strict mode)
- Zustand + zundo for state management
- Tailwind CSS + shadcn/ui components
- Current dependency: `react-zoom-pan-pinch` v3.7.0

### Performance Budgets
- Preview update: p95 ≤ 120ms (keystroke to paint)
- Template switch: ≤ 200ms

### Design Constraints
- Must maintain iframe isolation for artboard styles
- Must support A4 and Letter page formats
- Must work on desktop (primary) and tablet viewports
- Preview is 50% of screen width in editor layout (EditorLayout.tsx)

### Related Files Context
- `app/(app)/editor/[id]/page.tsx` - Main editor page layout
- `components/editor/EditorLayout.tsx` - 50/50 split sidebar/preview layout
- `stores/previewStore.ts` - Zoom, pagination, viewport state
- `stores/documentStore.ts` - Resume data (Zustand + zundo)
- `libs/utils/previewUtils.ts` - RAF batching, scroll position utils
- `libs/reactive-artboard/constants/page.ts` - Page size constants (A4/Letter)

## What We Need From You

**Deliverable**: Complete refactored preview implementation OR detailed technical plan

**Format**:
- If providing code: Unified diff format rooted at repo root
- If providing plan: Step-by-step refactoring guide with specific code changes

**Approach Options**:
1. **Fix existing architecture**: Identify and patch the scroll/zoom/pagination issues
2. **Replace react-zoom-pan-pinch**: Use alternative library or custom implementation
3. **Redesign container structure**: New component hierarchy that properly isolates interactions
4. **Hybrid**: Keep iframe isolation but redesign scroll/zoom handling

**Requirements**:
- Explain the root cause(s) of current issues
- Provide concrete implementation (code diffs or detailed pseudocode)
- Ensure solution handles multi-page documents (2-5 pages typical)
- Maintain performance budgets (<120ms updates)
- Keep iframe-based style isolation

**If You Need More Context**:
List exact file paths you need to see. We will re-pack with those additions. Available:
- Any file from the full file tree (run `git ls-files` to see all)
- Template implementations (`libs/reactive-artboard/templates/*.tsx`)
- Additional component implementations
- API routes or server-side rendering logic

## Existing Logs/Symptoms (From User Report)

> "Any mouse moment like scroll, zoom, pinch when I try to do in the preview it applies to the whole page."

> "I can't scroll really to the next section. It's like whenever I first open the page I get to see the first two sections zoomed in. That's it. It's fixed."

> "I can't really move. I can't scroll. If the content gets filled in the first page I can't really go to the second page."

## Success Criteria

After implementation:
1. ✅ Scroll inside preview container stays within preview, does not affect parent page
2. ✅ Zoom/pinch gestures isolated to preview area
3. ✅ Can scroll through all pages when content overflows
4. ✅ Page navigation accurately reflects current visible page
5. ✅ Fit-to-width mode works correctly
6. ✅ Preview updates within <120ms performance budget
7. ✅ Works with dynamic content (1-5 pages typical range)
