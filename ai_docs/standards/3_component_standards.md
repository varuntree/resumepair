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
import { cn } from '@/libs/utils'                // Utilities
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

## 10. Visual Quality Standards

**Purpose**: Ensure all UI features meet design quality standards based on the Ramp-inspired design system.

### Design Philosophy: Apple-Inspired Simplicity

1. **Generous whitespace**: "Empty" space is design, not wasted space
2. **Clear actions**: Primary action always obvious (one lime button per section)
3. **Subtle details**: Smooth transitions (200ms), visible hover states
4. **Consistency**: Same patterns everywhere (button styles, card layouts)
5. **Restraint**: Remove unnecessary before adding new

### Color Usage (Ramp Palette)

**Reference**: `ai_docs/design-system.md` and `app/globals.css`

**Rules**:
```typescript
// ✅ CORRECT: Minimal, purposeful color
<button className="bg-lime text-navy-dark">  // Primary CTA
<div className="bg-navy-dark text-white">     // Dark section
<p className="text-gray-500">                // Secondary text

// ❌ WRONG: Multiple competing accents
<button className="bg-lime">Action 1</button>
<button className="bg-lime">Action 2</button>  // Too many primary actions
<div className="bg-blue-500">                 // Not in Ramp palette
```

**Standards**:
- **Primary accent (lime)**: Use sparingly for CTAs and focus states only
- **Navy dark/medium**: Backgrounds, containers, dark mode
- **Gray scale**: Text hierarchy, borders, subtle elements
- **White**: Clean backgrounds, cards in light mode

**Examples**:
- ✅ Single lime CTA button per screen section
- ❌ Multiple lime elements competing for attention
- ✅ Navy backgrounds with white text (9.8:1 contrast)
- ❌ Gray text on navy (insufficient contrast)

---

### Spacing Rules (8px Grid)

**Reference**: Design system spacing tokens (`--space-*`)

**Standards**:
- **Section padding**: Minimum 64px (`space-16`) mobile, 96px (`space-24`) desktop
- **Card padding**: 24px (`space-6`) minimum
- **Element gaps**: 16-24px (`space-4` to `space-6`) between major elements
- **Form field spacing**: 16px (`space-4`) vertical spacing minimum

**Cramped test**: If elements feel crowded, increase gap by +8px increment

**Examples**:
```typescript
// ✅ CORRECT: Generous spacing
<div className="grid gap-6">          // 24px gaps
<Card className="p-6">                // 24px padding
<section className="py-16 md:py-24"> // 64px/96px section padding

// ❌ WRONG: Cramped spacing
<div className="grid gap-2">          // 8px too tight
<Card className="p-2">                // 8px too cramped
<section className="py-4">            // 16px insufficient
```

---

### Typography Hierarchy

**Reference**: Design system typography scale

**Standards**:
- **Display headlines**: `text-6xl` (60px), bold, tight leading
- **Section headings**: `text-4xl` (36px), bold
- **Card titles**: `text-xl` (20px), semibold
- **Body text**: `text-base` (16px), normal weight, 1.5 line height
- **Labels**: `text-sm` (14px), semibold

**Clear hierarchy test**: Can you tell primary/secondary/tertiary importance at a glance?

**Examples**:
```typescript
// ✅ CORRECT: Clear hierarchy
<h1 className="text-4xl font-bold">Page Title</h1>
<h2 className="text-2xl font-bold">Section</h2>
<h3 className="text-xl font-semibold">Card Title</h3>
<p className="text-base">Body text</p>

// ❌ WRONG: No hierarchy
<h1 className="text-2xl">Page Title</h1>
<h2 className="text-2xl">Section</h2>  // Same as h1
<h3 className="text-2xl">Card</h3>     // Same as h1, h2
```

---

### Component Composition Standards

#### Buttons
**Rules**:
- **Primary**: Lime background, navy text, `px-6 py-3` minimum
- **Secondary**: Gray-100 background, gray-900 text
- **Ghost**: Transparent, visible hover state
- **Prominence**: ONE primary button per viewport/section

```typescript
// ✅ CORRECT
<Button variant="primary">Create Resume</Button>  // Only one
<Button variant="secondary">Cancel</Button>

// ❌ WRONG
<Button variant="primary">Action 1</Button>
<Button variant="primary">Action 2</Button>  // Multiple primary
```

#### Cards
**Rules**:
- `rounded-lg` (12px radius)
- `shadow-sm` (subtle elevation)
- `p-6` (24px padding) minimum
- **Breathing room**: Never fill entire card with content

```typescript
// ✅ CORRECT
<Card className="rounded-lg shadow-sm p-6 space-y-4">
  <CardTitle>...</CardTitle>
  <CardContent>...</CardContent>
</Card>

// ❌ WRONG
<Card className="rounded-sm p-2">  // Too small, cramped
```

#### Forms
**Rules**:
- Input height: `h-12` (48px minimum for touch targets)
- Labels above fields, `text-sm`, semibold
- Error messages below fields, `text-sm`, red
- **Clear focus states**: `ring-2 ring-lime` on focus

```typescript
// ✅ CORRECT
<div className="space-y-2">
  <Label className="text-sm font-semibold">Email</Label>
  <Input className="h-12 focus:ring-2 focus:ring-lime" />
  {error && <p className="text-sm text-destructive">{error}</p>}
</div>

// ❌ WRONG
<Input className="h-8" />  // Too small for touch
```

---

### Visual Quality Checklist (Mandatory)

Before marking any UI feature complete, verify:

**Spacing & Layout**:
- [ ] Spacing feels generous, not cramped (minimum 16px gaps)
- [ ] Section padding ≥64px mobile, ≥96px desktop
- [ ] Card padding ≥24px
- [ ] All spacing uses design tokens (no hardcoded px)

**Typography**:
- [ ] Clear visual hierarchy (can identify primary/secondary/tertiary)
- [ ] Page title largest, body text smallest
- [ ] Headings use bold or semibold (not medium)
- [ ] Body text has 1.5 line height minimum

**Color**:
- [ ] Only ONE primary action (lime button) per screen section
- [ ] Ramp palette used (navy, lime, grays) - no off-palette colors
- [ ] Sufficient contrast (WCAG AA: 4.5:1 for body text)
- [ ] No hardcoded #hex colors visible in code

**Components**:
- [ ] Buttons have clear primary/secondary distinction
- [ ] Cards use rounded-lg + shadow-sm
- [ ] Forms have visible focus states (ring on focus)
- [ ] Touch targets ≥48px on mobile

**Responsiveness**:
- [ ] Desktop screenshot (1440px) taken
- [ ] Mobile screenshot (375px) taken
- [ ] No horizontal scroll on mobile
- [ ] Text readable on small screens

**Design System Compliance**:
- [ ] Only design tokens used (--space-*, --text-*, etc.)
- [ ] No inline style with hardcoded values
- [ ] Follows existing design-system.md patterns
- [ ] Matches Ramp aesthetic (dark navy + lime + generous space)

---

### Visual Verification Process

**When to verify**: After implementing ANY UI feature

**Steps**:
1. Start dev server (`npm run dev`)
2. Navigate to page
3. Take desktop screenshot (1440px)
4. Take mobile screenshot (375px)
5. Check against Visual Quality Checklist
6. Refine if needed
7. Save screenshots to `ai_docs/progress/phase_N/screenshots/`

**Reference**: See `ai_docs/standards/9_visual_verification_workflow.md` for detailed workflow

---

### Common Visual Issues & Fixes

**Issue: Looks cramped**
- **Fix**: Increase gaps (gap-4 → gap-6), add more padding (p-4 → p-6)

**Issue**: No clear hierarchy**
- **Fix**: Increase heading sizes, use bold weights, add more size differentiation

**Issue: Too many primary actions**
- **Fix**: Change secondary actions to variant="secondary" or variant="ghost"

**Issue: Colors don't match Ramp aesthetic**
- **Fix**: Replace with navy (bg-navy-dark), lime (bg-lime), or grays (bg-gray-*)

**Issue: Hardcoded values**
- **Fix**: Replace px values with space-* tokens, #hex with semantic color classes

---

## Component Checklist (Updated)

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
- [ ] **Does it meet visual quality standards?** ← NEW
- [ ] **Have screenshots been taken and reviewed?** ← NEW

---

## Production Patterns

**Novel**: Extension architecture for editor features
**Cal.com**: Service layer separation for complex logic
**Vercel**: Simple error boundaries only where needed

**Priority**: Clarity > Flexibility > Performance > Maintenance

---

**Related Documentation**:
- Visual Verification Workflow: `ai_docs/standards/9_visual_verification_workflow.md`
- Design System: `ai_docs/design-system.md`
- Testing: `ai_docs/testing/README.md`
- Code Review Standards: `ai_docs/standards/8_code_review_standards.md`

**Next Document**: API Design Contracts (how frontend and backend communicate)