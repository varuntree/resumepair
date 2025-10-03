# Component Standards

**Component composition, styling, performance, and accessibility.**

---

## 1. Component Hierarchy

- **Atoms**: Button, Input, Label (shadcn/ui primitives)
- **Molecules**: FormField, IconButton, CardHeader
- **Organisms**: ResumeEditor, TemplateGallery, ScoreDashboard

---

## 2. Composition Over Monoliths

```typescript
// ✅ CORRECT - Composed
<ScoreDashboard score={overall}>
  <ScoreRing value={atsScore} max={30} label="ATS" />
  <ScoreBreakdown dimensions={dimensions} />
  <ScoreSuggestions items={suggestions} />
</ScoreDashboard>

// ❌ WRONG - Monolithic component with 20+ props
<ScoreDashboard {...twentyProps} />
```

---

## 3. Styling with Tokens

```typescript
// ✅ CORRECT
<div className="p-6 text-base bg-app-background">

// ❌ WRONG
<div style={{ padding: '24px', color: '#333' }}>
```

---

## 4. Performance Patterns

```typescript
// React.memo for expensive renders
const ExpensiveList = React.memo(({ items }) => { })

// useMemo for expensive calculations
const score = useMemo(() => calculateScore(doc), [doc.id])

// useCallback for callbacks to children
const handleUpdate = useCallback((field, value) => { }, [])

// Code splitting for heavy components
const TemplatePreview = lazy(() => import('./TemplatePreview'))
```

---

## 5. Accessibility

```typescript
// Keyboard navigation
<button onClick={handleClick}>Action</button>

// ARIA labels on icon buttons
<button aria-label="Delete resume">
  <TrashIcon />
</button>

// Form labels
<label htmlFor="email">Email</label>
<input id="email" type="email" />

// Skip links
<a href="#main-content" className="sr-only focus:not-sr-only">
  Skip to main content
</a>
```

---

## Naming Conventions

- **Components**: PascalCase (`ResumeEditor.tsx`)
- **Props**: `ComponentNameProps`
- **Booleans**: Question form (`isLoading`, `hasError`, `canSave`)

---

**Next**: Visual Quality (`06_visual_quality.md`)
