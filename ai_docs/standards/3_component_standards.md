# Component Standards

**Purpose**: Define how we think about, design, and build components in ResumePair. This document teaches component philosophy while establishing practical patterns.

---

## Core Philosophy: Components as LEGO Blocks

Components should be:
- **Composable** - Combine simple pieces to build complex features
- **Predictable** - Same props = same output
- **Isolated** - Work independently without side effects
- **Reusable** - Write once, use everywhere

---

## 1. Component Hierarchy (Atomic Design)

**Why**: Building from simple to complex creates consistent, maintainable UIs.

```
Atoms → Molecules → Organisms → Templates
Button   FormField    ResumeSection  EditorLayout
Icon     Card        ScorePanel     PreviewLayout
Input    MenuItem    AIAssistant    DashboardLayout
```

**Rules**:
- **Atoms**: Single-purpose, no children
- **Molecules**: Combine atoms, single responsibility
- **Organisms**: Complex features with state
- **Templates**: Page layouts

**Extension Pattern** (from Novel):
```typescript
interface EditorExtension {
  name: string
  commands?: Record<string, Command>
  inputRules?: InputRule[]
  shortcuts?: KeyboardShortcut[]
}
```

---

## 2. Component Anatomy

### Essential Structure

```typescript
// 1. Imports (grouped by source)
import { useState, useMemo } from 'react'        // React
import { cn } from '@/lib/utils'                 // Utilities
import { Button } from '@/components/ui'         // Internal components
import type { ComponentProps } from './types'    // Types

// 2. Component definition (named export or default)
export function ComponentName({
  // Required props first
  title,
  onSave,
  // Optional props with defaults
  variant = 'default',
  className,
  ...props  // Spread remaining props
}: ComponentProps) {
  // 3. Hooks (state, effects, custom)
  const [state, setState] = useState()

  // 4. Handlers (prefix with 'handle')
  const handleClick = () => {
    // Handle event
  }

  // 5. Render logic (early returns first)
  if (!data) return null

  // 6. Main render
  return (
    <div className={cn("base-classes", className)} {...props}>
      {/* Component JSX */}
    </div>
  )
}

// 7. Default props (if needed)
ComponentName.defaultProps = {
  variant: 'default'
}

// 8. Display name (for DevTools)
ComponentName.displayName = 'ComponentName'
```

### Props Pattern

```typescript
interface ComponentProps {
  // Required first
  title: string
  onSave: (data: FormData) => void
  // Optional with defaults
  variant?: 'default' | 'primary'
  className?: string
}

// Extend HTML elements
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary'
}
```

---

## 3. Styling Philosophy

### Centralized Design Tokens

**Rule**: Never hard-code design values. Always reference tokens.

```typescript
// ❌ WRONG: Hard-coded values
<div className="text-blue-600 p-4 rounded-md">

// ✅ CORRECT: Token-based values
<div className="text-primary p-md rounded-base">

// Even better: Semantic tokens
<div className="text-accent-foreground p-section rounded-card">
```

### Styling Patterns

```typescript
// 1. Base + Variants pattern
const buttonVariants = {
  base: "px-4 py-2 rounded-lg transition-colors",
  variants: {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/90",
    ghost: "hover:bg-accent hover:text-accent-foreground"
  }
}

// 2. Conditional styling with cn()
<div className={cn(
  "base-styles",
  isActive && "active-styles",
  isDisabled && "disabled-styles",
  className // Always allow className override
)}>

// 3. Dynamic styles (when needed)
<div
  className="relative"
  style={{
    '--progress': `${progress}%` // CSS custom property
  }}
>
  <div className="h-full bg-primary" style={{ width: 'var(--progress)' }} />
</div>
```

### Responsive Design

```typescript
// Mobile-first approach
<div className="
  p-4         // Mobile
  md:p-6      // Tablet
  lg:p-8      // Desktop
">

// Breakpoint-specific components
<MobileNav className="lg:hidden" />
<DesktopNav className="hidden lg:flex" />
```

---

## 4. Composition Patterns

**Three Core Patterns**:

1. **Compound Components**: Related components sharing context
```typescript
<Tabs defaultValue="general">
  <Tabs.List><Tabs.Tab value="general">General</Tabs.Tab></Tabs.List>
  <Tabs.Panel value="general">Content</Tabs.Panel>
</Tabs>
```

2. **Slots Pattern**: Flexible layouts
```typescript
<Card header={<h2>Title</h2>} footer={<Button>Save</Button>}>
  Content
</Card>
```

3. **Extension Pattern** (from Novel): Modular features
```typescript
const extensions = [ContactExtension, SkillsExtension, AIExtension]
```

---

## 5. State Management in Components

### State Decision Tree

```
Does this state need to persist on refresh?
  Yes → Server state (database)
  No → Continue...

Is it shared between unrelated components?
  Yes → Global store (Zustand)
  No → Continue...

Is it passed to 2+ levels deep?
  Yes → Context
  No → Continue...

Does parent need to control it?
  Yes → Lift state up
  No → Local state
```

### Local State Pattern

```typescript
// ✅ CORRECT: Colocate state with usage
function EditableField({ value, onSave }) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  const handleSave = () => {
    onSave(draft)
    setIsEditing(false)
  }

  // State stays local, events bubble up
  return isEditing ? (
    <Input value={draft} onChange={setDraft} onBlur={handleSave} />
  ) : (
    <Text onClick={() => setIsEditing(true)}>{value}</Text>
  )
}
```

---

## 6. Performance Patterns

### When to Optimize

**Rule**: Measure first, optimize second.

```typescript
// 1. Memo for expensive renders
const ExpensiveList = memo(({ items }) => {
  return items.map(item => <ComplexItem key={item.id} {...item} />)
}, (prev, next) => {
  // Custom comparison
  return prev.items.length === next.items.length &&
         prev.items.every((item, i) => item.id === next.items[i].id)
})

// 2. useMemo for expensive computations
const ResumeScore = ({ document }) => {
  const score = useMemo(
    () => calculateScore(document), // Expensive
    [document.id, document.updatedAt] // Dependencies
  )

  return <ScoreDisplay value={score} />
}

// 3. useCallback for stable references
const DocumentEditor = ({ onSave }) => {
  const handleSave = useCallback(
    (data) => {
      // Process data
      onSave(data)
    },
    [onSave] // Recreate only if onSave changes
  )

  return <Editor onSave={handleSave} />
}
```

### Code Splitting Boundaries

```typescript
// Split at route level
const Dashboard = lazy(() => import('./pages/Dashboard'))

// Split heavy components
const PDFViewer = lazy(() => import('./components/PDFViewer'))

// Provide loading state
<Suspense fallback={<Spinner />}>
  <PDFViewer document={document} />
</Suspense>
```

---

## 7. Component Communication

### Events Bubble Up, Data Flows Down

```typescript
// Parent (owns state)
function ResumePage() {
  const [resume, setResume] = useState(initialResume)

  const updateSection = (sectionId, updates) => {
    setResume(prev => ({
      ...prev,
      sections: prev.sections.map(s =>
        s.id === sectionId ? { ...s, ...updates } : s
      )
    }))
  }

  // Data flows down, events bubble up
  return (
    <ResumeEditor
      resume={resume}
      onSectionUpdate={updateSection}
    />
  )
}

// Child (receives data and callbacks)
function ResumeEditor({ resume, onSectionUpdate }) {
  return resume.sections.map(section => (
    <Section
      key={section.id}
      data={section}
      onChange={(updates) => onSectionUpdate(section.id, updates)}
    />
  ))
}
```

---

## 8. Practical Error Boundaries

**Only wrap components that can fail** (from Vercel template):

```typescript
<ErrorBoundary fallback={<SimpleMessage />}>
  <AIAssistant />  // External API
</ErrorBoundary>
<ErrorBoundary fallback={<BasicEditor />}>
  <RichEditor />   // Complex component
</ErrorBoundary>
```

---

## 9. Accessibility Basics

### Minimum Requirements

```typescript
// 1. Semantic HTML
<button> not <div onClick>
<nav> not <div className="navigation">

// 2. ARIA when needed
<button aria-label="Delete section" aria-pressed={isActive}>
  <TrashIcon />
</button>

// 3. Keyboard support
<div
  role="button"
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick()
    }
  }}
>

// 4. Focus management
const Dialog = ({ isOpen, onClose }) => {
  const closeButtonRef = useRef()

  useEffect(() => {
    if (isOpen) {
      closeButtonRef.current?.focus()
    }
  }, [isOpen])

  return (
    <dialog open={isOpen}>
      <button ref={closeButtonRef} onClick={onClose}>×</button>
    </dialog>
  )
}
```

---

## Component Checklist

Before creating a component, ask:

- [ ] Can this be a simple function instead?
- [ ] Does it do one thing well?
- [ ] Are props minimal and clear?
- [ ] Does it work without external context?
- [ ] Can it be composed with other components?
- [ ] Are design tokens used instead of hard values?
- [ ] Is it keyboard accessible?
- [ ] Does it handle loading and error states?
- [ ] Is it responsive across breakpoints?
- [ ] Would another developer understand it immediately?

---

## Production Patterns

**Novel**: Extension architecture for editor features
**Cal.com**: Service layer separation for complex logic
**Vercel**: Simple error boundaries only where needed

**Priority**: Clarity > Flexibility > Performance > Maintenance

---

**Next Document**: API Design Contracts (how frontend and backend communicate)