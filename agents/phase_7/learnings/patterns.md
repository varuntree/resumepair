# Phase 7 Patterns

**Date**: 2025-10-03
**Observations Analyzed**: 10
**Patterns Identified**: 7

---

## Pattern 1: Component Composition Architecture

**Category**: Technical Pattern
**Confidence**: High (3+ observations)
**Recurring Probability**: Definite

### Evidence
- Learning 1: Component Composition > Monolithic Components
- Learning 7: Multi-Select UX Requires Careful State Management
- Learning 10: Design Token Consistency Across Components
- Phase summary: 5 focused dashboard components working together
- Code review: 92/100 score emphasizes modular architecture

### Core Insight
Breaking complex UIs into small, focused components (<200 lines each) with single responsibilities creates maintainable, reusable, and testable code that naturally enforces design consistency.

### When This Applies
- Dashboard/listing pages with multiple concerns (filtering, search, bulk operations)
- Complex forms with distinct sections
- Editor interfaces with multiple tools/panels
- Any UI requiring different feature combinations

### Actionable Recommendation
**DO**: Create focused components with single responsibility
- Maximum 200 lines per component
- Each component manages one concern (filter, search, actions)
- Compose components at parent level
- Use children prop for flexibility

**DON'T**: Build monolithic components with 20+ props
- Avoid single components handling multiple concerns
- Don't pass complex configuration objects as props
- Never embed all functionality in one file

### Related Observations
- Observation 1: 3 independent components in Phase 7F
- Observation 1: 5 components in Phase 7G dashboard
- Observation 10: Design tokens create automatic consistency

---

## Pattern 2: Client-Side Data Merge for Multi-Entity Views

**Category**: Technical Pattern
**Confidence**: High (strong evidence + performance validation)
**Recurring Probability**: Likely

### Evidence
- Learning 2: UNION Query Pattern for Multi-Entity Dashboards
- Performance metrics: 2 parallel queries ~100ms each, merge ~5ms, total ~200ms
- Edge runtime compatibility requirement
- Phase 7G implementation success

### Core Insight
For Edge runtime environments, parallel entity queries with client-side merge/sort outperforms database UNION queries in simplicity, flexibility, and Edge compatibility while maintaining excellent performance.

### When This Applies
- Multi-entity dashboards (resumes + cover letters + portfolios)
- Edge runtime API routes (no Postgres-specific features)
- Entities with different schemas requiring type annotation
- Need for flexible filtering/sorting after merge

### Actionable Recommendation
**Pattern**:
```typescript
// 1. Parallel fetch
const [typeA, typeB] = await Promise.all([
  supabase.from('table_a').select(...),
  supabase.from('table_b').select(...)
])

// 2. Merge with type annotation
const merged = [
  ...typeA.map(a => ({ ...a, type: 'type_a' as const })),
  ...typeB.map(b => ({ ...b, type: 'type_b' as const }))
]

// 3. Sort/filter in application
return merged.sort(...).filter(...)
```

**Performance Budget**: Total time ≤ 300ms for 2-3 parallel queries

**DON'T**: Use database UNION queries in Edge runtime (not supported, more complex)

### Related Observations
- Observation 2: ~200ms total for unified documents fetch
- Performance: Merge + sort negligible cost (~5ms)

---

## Pattern 3: SSE Streaming for AI Transparency

**Category**: UX Pattern
**Confidence**: High (strong user perception evidence)
**Recurring Probability**: Definite

### Evidence
- Learning 3: SSE Streaming Provides Superior UX for AI Generation
- Learning 6: Edge Runtime Works Well for Streaming
- Learning 8: Type-Safe Event Handling with Discriminated Unions
- User perception: Streaming feels fast despite 10-15s total time

### Core Insight
Real-time SSE streaming transforms user perception of AI generation from "slow loading" to "fast and engaging" by providing transparency into progress, even when total processing time remains unchanged.

### When This Applies
- All AI generation tasks >3 seconds
- Long-running backend operations (imports, exports)
- Multi-step processes where intermediate results are useful
- Any operation where showing progress improves perceived speed

### Actionable Recommendation
**Server-Side Pattern**:
```typescript
// Edge runtime with SSE
export const runtime = 'edge'

// Send typed events
controller.enqueue(`event: progress\ndata: ${JSON.stringify({ progress: 0.25 })}\n\n`)
controller.enqueue(`event: update\ndata: ${JSON.stringify({ data: partial })}\n\n`)
controller.enqueue(`event: complete\ndata: ${JSON.stringify({ data: final })}\n\n`)
```

**Client-Side Pattern**:
```typescript
// Use discriminated unions for type safety
type SSEEvent =
  | { type: 'progress'; progress: number }
  | { type: 'update'; data: Partial<T> }
  | { type: 'complete'; data: T }
  | { type: 'error'; message: string }

// Type-safe switch
switch (event.type) {
  case 'progress': setProgress(event.progress); break
  case 'complete': onComplete(event.data); break
}
```

**User Perception Rule**: Streaming makes 10s feel faster than non-streaming 5s

**DON'T**: Use polling (setInterval) - inefficient and higher latency

### Related Observations
- Observation 3: Progress updates every ~500ms
- Observation 6: Edge runtime supports ReadableStream
- Observation 8: Discriminated unions provide type safety

---

## Pattern 4: AI Customization Options Increase Perceived Value

**Category**: UX Pattern
**Confidence**: High (user feedback evidence)
**Recurring Probability**: Definite

### Evidence
- Learning 4: Tone/Length Customization Increases Perceived AI Value
- Learning 5: Resume Context Dramatically Improves AI Output
- Learning 9: Progressive Enhancement for Resume Context
- User feedback: "Without options → too generic, With options → understands what I need"

### Core Insight
Providing 2-3 meaningful customization options (tone, length, context) makes AI feel personalized and powerful, transforming user perception from "generic template" to "understands my needs."

### When This Applies
- All AI content generation features
- Resume writing/rewriting
- Job description matching
- Cover letter generation
- Any feature using LLM for content creation

### Actionable Recommendation
**Sweet Spot**: 2-3 customization options (not more, avoid overwhelming)

**Standard Options Pattern**:
1. **Style/Tone** (3 choices): formal, friendly, enthusiastic
2. **Length** (3 choices): short, medium, long with word counts
3. **Context** (optional enhancement): Link to related data (resume, job posting)

**Implementation**:
```typescript
const tones = {
  formal: 'Use "I am writing to express..." and avoid contractions',
  friendly: 'Use "I\'m excited about..." and conversational language',
  enthusiastic: 'Use "I\'m thrilled..." and dynamic action verbs'
}

const lengths = {
  short: 'Target 200-250 words',
  medium: 'Target 250-350 words',
  long: 'Target 350-450 words'
}
```

**Progressive Enhancement**: Context should be optional (works without, better with)

**DON'T**:
- Offer 10+ options (decision paralysis)
- Make context required (friction)
- Use identical prompts for all tones (users will notice)

### Related Observations
- Observation 4: Tone options produce noticeably different styles
- Observation 5: Resume context produces dramatically better output
- Observation 9: AI works without context, enhanced with it

---

## Pattern 5: Context-Aware AI as Default

**Category**: Technical Pattern
**Confidence**: High (strong output quality evidence)
**Recurring Probability**: Definite

### Evidence
- Learning 5: Resume Context Dramatically Improves AI Output
- Learning 9: Progressive Enhancement for Resume Context
- Evidence: Without resume → generic template, With resume → personalized content
- Defensive coding: Optional chaining, fallbacks, graceful degradation

### Core Insight
Providing structured context from related user data (profile, skills, experience) to AI prompts produces dramatically more personalized output while maintaining functionality when context is unavailable.

### When This Applies
- Cover letter generation (pull from resume)
- Resume section rewriting (pull from other sections)
- Job matching (pull from resume + job posting)
- Any AI feature where user has existing data

### Actionable Recommendation
**Context Extraction Pattern**:
```typescript
// Extract relevant context with defensive coding
const context = resumeId ? {
  fullName: profile.fullName,
  email: profile.email,
  keySkills: skills.categories.flatMap(c => c.skills).slice(0, 10),
  recentRole: work[0]?.position,
  recentCompany: work[0]?.company,
  yearsOfExperience: work.length
} : undefined

// Build prompt with optional context
const prompt = buildPrompt(input, context)
```

**Defensive Coding Rules**:
- Use optional chaining (`work[0]?.position`)
- Provide fallbacks for missing data
- Graceful degradation (works with incomplete context)
- Never fail if context unavailable

**Progressive Enhancement**:
- Basic tier: Works without context
- Enhanced tier: Better with context

**DON'T**:
- Require context (blocks users without existing data)
- Fail silently when context missing
- Hardcode context structure (use optional fields)

### Related Observations
- Observation 5: Personalized vs generic output comparison
- Observation 9: Optional enhancement better than required input

---

## Pattern 6: Edge Runtime for Streaming, Node for Heavy Processing

**Category**: Technical Pattern
**Confidence**: High (runtime requirements validated)
**Recurring Probability**: Definite

### Evidence
- Learning 6: Edge Runtime Works Well for Streaming
- Phase architecture: AI streaming on Edge, PDF export on Node
- Edge constraints: No filesystem, no Puppeteer, 60s max duration
- Global distribution benefit for international users

### Core Insight
Edge runtime excels at AI streaming (low latency, global distribution, ReadableStream support) while Node runtime handles heavy dependencies (Puppeteer, filesystem) - choose runtime based on operation type, not arbitrarily.

### When This Applies
- **Use Edge**: AI streaming, lightweight reads, global endpoints
- **Use Node**: PDF export, file processing, heavy dependencies, >60s operations

### Actionable Recommendation
**Edge Runtime Checklist**:
```typescript
// Required for streaming endpoints
export const runtime = 'edge'
export const dynamic = 'force-dynamic'
export const maxDuration = 60 // seconds
```

**Edge Runtime ALLOWED**:
- ReadableStream / SSE
- Fetch API
- Lightweight AI SDK calls
- Database queries (Supabase)
- Simple data transformations

**Edge Runtime FORBIDDEN**:
- Node.js filesystem APIs (fs, path)
- Heavy dependencies (Puppeteer, Sharp)
- Operations >60 seconds
- Native Node modules

**Migration Path**: If Edge endpoint needs heavy processing, split into:
1. Edge endpoint receives request, starts async job
2. Node endpoint processes job
3. Client polls or uses webhooks for completion

**DON'T**: Use Node runtime for simple streaming (wastes global distribution benefit)

### Related Observations
- Observation 6: Edge runtime supports ReadableStream perfectly
- Phase architecture: Clear runtime separation

---

## Pattern 7: Type-Safe Event Handling with Discriminated Unions

**Category**: Technical Pattern
**Confidence**: Medium (2 observations)
**Recurring Probability**: Likely

### Evidence
- Learning 8: Type-Safe Event Handling with Discriminated Unions
- Learning 3: SSE streaming implementation
- Benefits: Compile-time validation, IDE autocomplete, no runtime checks

### Core Insight
TypeScript discriminated unions provide compile-time type safety for event handling in SSE streams, eliminating runtime type checks and enabling IDE autocomplete for event-specific properties.

### When This Applies
- SSE streaming endpoints (progress, update, complete, error events)
- WebSocket messages with different payloads
- State machines with distinct states and data
- Any system with typed message passing

### Actionable Recommendation
**Discriminated Union Pattern**:
```typescript
// Define all event types with discriminant
type SSEEvent =
  | { type: 'progress'; progress: number }
  | { type: 'update'; data: Partial<T> }
  | { type: 'complete'; data: T; duration: number }
  | { type: 'error'; message: string }

// Type-safe switch (TypeScript narrows type in each case)
switch (event.type) {
  case 'progress':
    setProgress(event.progress) // TypeScript knows progress exists
    break
  case 'complete':
    onComplete(event.data) // TypeScript knows data is T
    break
  case 'error':
    showError(event.message) // TypeScript knows message exists
    break
}
```

**Benefits**:
- Compile-time validation (typos caught at build)
- IDE autocomplete (sees event-specific properties)
- No runtime type checks needed
- Exhaustiveness checking (switch covers all cases)

**DON'T**:
- Use `any` or `unknown` for events (loses type safety)
- Use runtime `instanceof` checks (discriminated unions are cleaner)
- Mix event types in one handler (defeats purpose)

### Related Observations
- Observation 8: Type-safe event handling pattern
- Observation 3: SSE streaming with multiple event types

---

## Cross-Cutting Observations

### Design System Consistency (Learning 10)
**Pattern**: Strict adherence to design tokens creates automatic visual consistency across components

**Evidence**: All Phase 7 components use `--app-*` tokens, zero hardcoded values

**Impact**: Design system changes propagate automatically (update CSS variables once)

**Status**: Not classified as standalone pattern (embedded in Component Composition Pattern #1)

---

## Multi-Select State Management (Learning 7)
**Pattern**: Bulk operations require synchronized state between checkboxes, selection array, and visual indicators

**Evidence**: Clear visual feedback, "Select All" toggle, selection clear after action

**Status**: Not classified as standalone pattern (specific implementation detail, not generalizable beyond multi-select)

---

## Pattern Summary

| Pattern | Category | Confidence | Recurring Probability | Evidence Count |
|---------|----------|------------|----------------------|----------------|
| Component Composition | Technical | High | Definite | 5 |
| Client-Side Data Merge | Technical | High | Likely | 4 |
| SSE Streaming UX | UX | High | Definite | 4 |
| AI Customization Options | UX | High | Definite | 4 |
| Context-Aware AI | Technical | High | Definite | 3 |
| Runtime Selection | Technical | High | Definite | 3 |
| Discriminated Unions | Technical | Medium | Likely | 2 |

---

## Anti-Patterns Avoided (Referenced in Learnings)

1. **Monolithic Components** - Learning 1
2. **Database UNION Queries** - Learning 2
3. **Polling for Progress** - Learning 3
4. **Hardcoded AI Prompts** - Learning 4
5. **Untyped Event Handling** - Learning 8

These anti-patterns validate the positive patterns identified above.

---

## Recommendations for Future Phases

### Immediate Applications (Next 1-2 Phases)
1. **Apply Component Composition** to all new dashboard/listing UIs
2. **Use SSE Streaming** for any AI feature >3 seconds
3. **Provide 2-3 AI Customization Options** for all content generation
4. **Extract Context** from related user data for AI personalization

### Medium-Term Standardization (Next 3-5 Phases)
1. **Create Component Library** for common patterns (DocumentPicker, StreamingProgress)
2. **Standardize SSE Event Types** across all streaming endpoints
3. **Document Runtime Selection Criteria** in architecture guide
4. **Build AI Context Extraction Utilities** as reusable functions

### Long-Term Architecture Evolution (6+ Phases)
1. **Generalize Client-Side Merge Pattern** for 3+ entity types
2. **Performance Monitoring** for all patterns (track actual vs budgets)
3. **Pattern Compliance Linting** (automated checks for anti-patterns)

---

**Document Version**: 1.0
**Created**: 2025-10-03
**Patterns Identified**: 7 high-value patterns
**Anti-Patterns Referenced**: 5 validated avoidances
**Confidence Distribution**: 6 High, 1 Medium
