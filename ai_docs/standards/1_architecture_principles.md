# Architecture Principles

**Purpose**: Define the fundamental architectural rules that govern all technical decisions in ResumePair. These principles ensure consistency, maintainability, and scalability while keeping complexity appropriate for an indie SaaS.

---

## Core Principles

### 1. Schema-Driven Architecture
**Why**: Single source of truth prevents data inconsistencies.

**Rule**: Data schema drives ALL system behavior: `Schema → Editor → Preview → Export → Score`

**Implementation**: Templates and exporters are pure functions that transform schemas. Use Supabase type generation for automatic TypeScript types from database schema.

```typescript
// Generate types: npm run supabase:types
export type Database = // Auto-generated from schema
```

---

### 2. Layered Architecture with Clear Boundaries

**Why**: Separation of concerns enables independent evolution and testing of each layer.

**Layers** (top to bottom):
```
┌─────────────────────────────────┐
│   Presentation (Components)     │ ← User interaction
├─────────────────────────────────┤
│   Application (Business Logic)  │ ← Use cases, workflows
├─────────────────────────────────┤
│   Domain (Core Models/Schema)   │ ← Business rules
├─────────────────────────────────┤
│   Infrastructure (External)     │ ← Database, AI, Storage
└─────────────────────────────────┘
```

**Rules**:
- **Dependency Rule**: Dependencies point downward only (Presentation depends on Domain, never reverse)
- **No layer skipping**: Presentation cannot directly access Infrastructure
- **Pure Domain**: Domain layer has zero external dependencies

**Example**:
```typescript
// ✅ CORRECT: Proper layering
// Component → Repository → Supabase
const user = await userRepository.getUser(supabaseClient)

// ❌ WRONG: Layer skipping
// Component → Supabase directly
const { data } = await supabase.from('users').select()
```

---

### 3. Explicit Dependencies (Dependency Injection)

**Why**: Makes dependencies visible, testable, and replaceable.

**Rule**: Always pass dependencies explicitly - no hidden imports or creation.

```typescript
// ✅ CORRECT
export async function getDocument(
  supabase: SupabaseClient,
  documentId: string
): Promise<Document>
```

---

### 4. Unidirectional Data Flow

**Why**: Predictable state changes make debugging and reasoning about the app easier.

**Flow Pattern**:
```
User Action → State Update → UI Re-render
     ↑              ↓              ↓
     ←──── Side Effects ←── New State
```

**Rules**:
- State flows from parent to child components
- Events bubble from child to parent
- Side effects happen outside the render cycle
- Never mutate state directly

**Example**:
```typescript
// ✅ CORRECT: Unidirectional flow
const [resume, setResume] = useState(initialResume)
const updateField = (field: string, value: any) => {
  setResume(prev => ({ ...prev, [field]: value }))
}

// ❌ WRONG: Direct mutation
resume.profile.name = "New Name" // Breaks React's rendering
```

---

### 5. Fail Fast, Recover Gracefully

**Why**: Early failure detection prevents cascade failures. Graceful recovery maintains user trust.

**Rules**:
1. **Validate at boundaries** (API inputs, user inputs, external data)
2. **Use Result types** for operations that can fail
3. **Provide fallbacks** for non-critical features
4. **Never swallow errors** - log, notify, or display them

**Pattern**:
```typescript
// ✅ CORRECT: Explicit error handling
type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E }

async function importPDF(file: File): Promise<Result<ResumeJson>> {
  try {
    const text = await extractText(file)
    if (!text) {
      return { ok: false, error: new Error("No text found") }
    }
    const resume = await parseResume(text)
    return { ok: true, value: resume }
  } catch (error) {
    return { ok: false, error }
  }
}

// ❌ WRONG: Silent failures
async function importPDF(file: File) {
  try {
    return await parseResume(await extractText(file))
  } catch {
    return null // What went wrong?
  }
}
```

---

### 6. Progressive Enhancement

**Why**: Core functionality should work even when advanced features fail.

**Layers**:
1. **Core**: Manual resume editing (always works)
2. **Enhanced**: AI assistance (may fail/be slow)
3. **Premium**: Advanced exports, scoring (optional)

**Implementation**:
```typescript
// Start with basic functionality
const BasicEditor = () => <textarea />

// Enhance progressively
const EnhancedEditor = () => {
  if (!browserSupportsFeature) return <BasicEditor />
  return <RichTextEditor fallback={<BasicEditor />} />
}
```

---

### 7. Performance Budget Mindset

**Why**: Speed is a feature. Slow apps lose users.

**Budgets** (from PRD):
- Preview update: < 120ms
- AI response: < 1s first token
- PDF export: < 2.5s
- Page load: < 3s

**Rules**:
- Measure before optimizing
- Optimize the critical path first
- Use lazy loading for non-critical features
- Cache expensive computations

**Example**:
```typescript
// ✅ CORRECT: Debounced preview updates
const debouncedUpdate = useMemo(
  () => debounce(updatePreview, 120),
  []
)

// ❌ WRONG: Update on every keystroke
onChange={(e) => updatePreview(e.target.value)}
```

---

### 8. Composition Over Inheritance

**Why**: Composition is more flexible and explicit than inheritance chains.

**Pattern**: Build complex behavior by combining simple pieces.

**Example**:
```typescript
// ✅ CORRECT: Composition
const withAuth = (Component) => (props) => {
  const user = useAuth()
  if (!user) return <Redirect to="/signin" />
  return <Component {...props} user={user} />
}

const withScoring = (Component) => (props) => {
  const score = useScore(props.document)
  return <Component {...props} score={score} />
}

// Compose features
export default withAuth(withScoring(ResumeEditor))

// ❌ WRONG: Inheritance chain
class ResumeEditor extends AuthenticatedComponent extends ScoredComponent
```

---

### 9. Make Invalid States Unrepresentable

**Why**: If the type system prevents invalid states, runtime errors disappear.

**Example**:
```typescript
// ✅ CORRECT: Type-safe state machine
type EditorState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; document: Document }
  | { status: 'error'; error: Error }

// Cannot have document without being ready
// Cannot have error without error status

// ❌ WRONG: Nullable fields
interface EditorState {
  isLoading: boolean
  document: Document | null
  error: Error | null
  // Can be loading with document? Error with document?
}
```

---

### 10. Explicit Over Implicit

**Why**: Implicit behavior is hard to discover, debug, and maintain.

**Rules**: Name constants, avoid magic values, make side effects obvious.

```typescript
const PDF_EXPORT_TIMEOUT_MS = 10000
const SCORE_WEIGHTS = { atsReadiness: 0.3, keywordMatch: 0.25 }
```

---

## Architecture Decisions Record (ADR)

| Decision | Status | Rationale |
|----------|--------|----------|
| Pure Function Repositories | Accepted | Testable and replaceable |
| Schema-First Development | Accepted | Single source of truth |
| No Client-Side Database Access | Accepted | Better security |
| Automated Type Generation | Accepted | Prevents schema drift |
| Server Actions for Forms | Accepted | Simpler than API routes for user actions |

---

## Enforcement Checklist

Before merging any code, verify:

- [ ] Dependencies flow downward only (no circular dependencies)
- [ ] All external dependencies are injected, not imported directly
- [ ] State mutations happen through declared actions only
- [ ] Error cases are handled explicitly with user feedback
- [ ] Performance budgets are met for affected features
- [ ] Complex components are composed from simple ones
- [ ] Type definitions make invalid states impossible
- [ ] Magic values are replaced with named constants
- [ ] Schema changes are versioned and migrated
- [ ] Each module has a single, clear responsibility

---

## Learning Notes

**Industry Validation**:
- **Schema-Driven**: LinkedIn, Stripe, Cal.com - all schema-first
- **Layered Architecture**: Clean Architecture (Robert Martin) - proven at scale
- **Dependency Injection**: Spring, NestJS - enables testing and modularity
- **Unidirectional Flow**: Flux/Redux - makes complex UIs manageable
- **Composition**: React's core philosophy - proven by Facebook
- **Type Safety**: Rust's approach - catch bugs at compile time

---

**Next Document**: Data Flow Patterns (how state moves through the system)