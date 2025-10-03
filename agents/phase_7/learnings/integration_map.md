# Phase 7 Integration Map

**Date**: 2025-10-03
**Principles to Integrate**: 7
**Documents to Update**: 6
**Status**: Ready for application

---

## Integration 1: Granular Component Composition Over Monolithic Components

**Source**: Principle 1 from generalized.md
**Priority**: High

### Primary Location

**Document**: `/ai_docs/standards/3_component_standards.md`
**Section**: After "## 4. Composition Patterns" (line 183)
**Action**: Add new subsection

### Integration Content

```markdown
### Component Size Guidelines (Phase 7)

**Rule**: Keep components focused and under 200 lines.

**Sweet Spot**: 100-150 lines per component
- If component exceeds 200 lines → split into smaller components
- If component has 10+ props → doing too much, extract subcomponents
- If component handles 3+ distinct concerns → use composition pattern

**Pattern**: Break complex features into minimal, focused components that compose at parent level.

#### Example: Dashboard Composition

```typescript
// ❌ WRONG: Monolithic component (500+ lines, 20+ props)
<UnifiedDashboard
  filters={filters}
  onFilterChange={handleFilter}
  items={items}
  selection={selection}
  onSelect={handleSelect}
  bulkActions={actions}
  onBulkAction={handleBulk}
  // 15+ more props...
/>

// ✅ CORRECT: Composed from focused components (each 100-150 lines)
<DashboardLayout>
  <FilterPanel onFilter={handleFilter} />
  <SearchBar onSearch={handleSearch} />
  <ItemTable
    items={items}
    selection={selection}
    onSelectionChange={setSelection}
  />
  <BulkActions
    selectedIds={selection}
    onAction={handleBulkAction}
  />
</DashboardLayout>
```

**Benefits**:
- Each component < 200 lines
- Single responsibility (filtering, search, display, actions)
- Easy to test and maintain
- Reusable in different contexts
- Natural design consistency

**When NOT to Apply**:
- Simple presentational components (<50 lines)
- Single-purpose utilities (loading spinner, error message)
- Design system primitives legitimately needing 10+ props (Button, Input)
```

### Secondary Locations (Cross-References)

**Document 1**: `/ai_docs/coding_patterns.md`
- **Section**: After "## 🎨 Component Pattern" (line 449)
- **Action**: Add reference: "See Component Size Guidelines in Component Standards Section 4 for detailed composition patterns"

**Document 2**: `/ai_docs/standards/1_architecture_principles.md`
- **Section**: Under "### 8. Composition Over Inheritance" (line 201)
- **Action**: Add note: "Component composition guidelines: See Component Standards Section 4 for size limits and composition examples"

### Dependencies

- None (standalone principle)

### Conflict Resolution

- No conflicts - adds new content to existing composition section

---

## Integration 2: Parallel Fetch + Client-Side Merge for Multi-Entity Views

**Source**: Principle 2 from generalized.md
**Priority**: Critical

### Primary Location

**Document**: `/ai_docs/coding_patterns.md`
**Section**: After "## 🏗️ Database Access Pattern (Pure Function Repositories)" (line 77)
**Action**: Add new section

### Integration Content

```markdown
## 🔀 Multi-Entity Data Pattern

### ✅ REQUIRED: Parallel Fetch + Client Merge for Unified Views

**Pattern**: For Edge runtime or multi-entity aggregations, fetch entities in parallel and merge client-side.

**When to Apply**:
- Multi-entity dashboards (documents + templates + exports)
- Unified activity feeds (posts + comments + likes)
- Cross-type search results
- Edge runtime API routes (no database-specific features)

**When NOT to Apply**:
- Single entity type with complex filtering
- Need for database-level aggregations (COUNT, SUM, GROUP BY)
- Very large datasets (>10,000 records)

#### Implementation Pattern

```typescript
// Pure function for multi-entity fetch
export async function getUnifiedDocumentView(
  supabase: SupabaseClient,
  userId: string
): Promise<UnifiedDocument[]> {
  // 1. Parallel fetch (Promise.all)
  const [resumes, coverLetters] = await Promise.all([
    supabase.from('resumes').select('*').eq('user_id', userId),
    supabase.from('cover_letters').select('*').eq('user_id', userId)
  ])

  // 2. Merge with type discriminator
  const documents: UnifiedDocument[] = [
    ...resumes.data!.map(r => ({ ...r, type: 'resume' as const })),
    ...coverLetters.data!.map(c => ({ ...c, type: 'cover_letter' as const }))
  ]

  // 3. Sort/filter in application (negligible cost ~5ms)
  return documents.sort((a, b) =>
    new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  )
}

// Type-safe discriminated union
type UnifiedDocument =
  | { type: 'resume'; /* resume fields */ }
  | { type: 'cover_letter'; /* cover letter fields */ }
```

#### Performance Budget

**Target**: Total time ≤ 300ms for 2-3 parallel queries including merge/sort

**Why This Works**:
- Parallel queries (200ms total) vs sequential (400ms+)
- Client merge is fast (5ms for hundreds of records)
- Edge runtime compatible (no complex SQL)
- Simple and maintainable

#### Benefits Over Database UNION

- ✅ Edge runtime compatible
- ✅ Simpler code (no complex SQL)
- ✅ Type-safe with TypeScript discriminated unions
- ✅ Flexible filtering/sorting in application
- ✅ Excellent performance (200ms total)
```

### Secondary Locations (Cross-References)

**Document 1**: `/ai_docs/standards/2_data_flow_patterns.md`
- **Section**: After "## 1. State Management Architecture" (line 53)
- **Action**: Add reference: "For multi-entity views, see Multi-Entity Data Pattern in Coding Patterns"

**Document 2**: `/ai_docs/standards/1_architecture_principles.md`
- **Section**: Under "### 6. Progressive Enhancement" (line 147)
- **Action**: Add note: "Data fetching: Use parallel fetch + client merge for Edge runtime. See Coding Patterns for implementation."

### Dependencies

- Depends on: Integration 7 (discriminated unions provide type safety)

### Conflict Resolution

- No conflicts - adds new pattern to repository section

---

## Integration 3: SSE Streaming for Perceived Performance in Long Operations

**Source**: Principle 3 from generalized.md
**Priority**: Critical

### Primary Location

**Document**: `/ai_docs/coding_patterns.md`
**Section**: After "## 🚀 API Route Pattern" (line 246)
**Action**: Add new section

### Integration Content

```markdown
## 📡 Server-Sent Events (SSE) Pattern

### ✅ REQUIRED: Streaming for Long Operations (>3 seconds)

**Rule**: For all operations >3 seconds, use SSE streaming with progress updates every 500-1000ms.

**Why**: Real-time progress transforms perception from "slow loading" to "fast and engaging". 10s with streaming feels faster than 5s without.

**When to Apply**:
- AI content generation (>3s)
- File processing (PDF import, optimization)
- Batch operations (bulk delete, export)
- Complex calculations (analytics, scoring)

**When NOT to Apply**:
- Operations <3 seconds (overhead not worth it)
- No meaningful progress stages
- Need bidirectional communication (use WebSockets)

### Server Pattern (Edge Runtime)

```typescript
export const runtime = 'edge'

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const input = await req.json()

        // Processing stages with progress updates
        for (let i = 0; i < stages.length; i++) {
          // Send progress (0.0 to 1.0)
          controller.enqueue(encoder.encode(
            `event: progress\ndata: ${JSON.stringify({
              progress: i / stages.length,
              message: `Processing stage ${i + 1}...`
            })}\n\n`
          ))

          // Process stage
          const result = await processStage(stages[i], input)

          // Send intermediate update
          controller.enqueue(encoder.encode(
            `event: update\ndata: ${JSON.stringify({
              data: result
            })}\n\n`
          ))
        }

        // Send completion
        controller.enqueue(encoder.encode(
          `event: complete\ndata: ${JSON.stringify({
            data: finalResult
          })}\n\n`
        ))
      } catch (error) {
        // Send error event
        controller.enqueue(encoder.encode(
          `event: error\ndata: ${JSON.stringify({
            message: error.message
          })}\n\n`
        ))
      } finally {
        controller.close()
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  })
}
```

### Client Pattern (Type-Safe Event Handling)

```typescript
// Define event types with discriminated union
type SSEEvent =
  | { type: 'progress'; progress: number; message?: string }
  | { type: 'update'; data: Partial<T> }
  | { type: 'complete'; data: T }
  | { type: 'error'; message: string }

// Custom hook for SSE consumption
function useSSEStream<T>(endpoint: string) {
  const [progress, setProgress] = useState(0)
  const [data, setData] = useState<Partial<T>>()
  const [error, setError] = useState<string>()

  const start = async (input: unknown) => {
    const eventSource = new EventSource(endpoint)

    eventSource.addEventListener('progress', (e) => {
      const event: SSEEvent = { type: 'progress', ...JSON.parse(e.data) }
      setProgress(event.progress)
    })

    eventSource.addEventListener('update', (e) => {
      const event: SSEEvent = { type: 'update', ...JSON.parse(e.data) }
      setData(event.data)
    })

    eventSource.addEventListener('complete', (e) => {
      const event: SSEEvent = { type: 'complete', ...JSON.parse(e.data) }
      setData(event.data)
      eventSource.close()
    })

    eventSource.addEventListener('error', (e) => {
      const event: SSEEvent = { type: 'error', ...JSON.parse(e.data) }
      setError(event.message)
      eventSource.close()
    })
  }

  return { progress, data, error, start }
}
```

### Performance Impact

**Perceived vs Actual**:
- 10s with streaming (progress visible) feels faster than 5s without
- User tolerance increases when progress is transparent
- First update within 500ms keeps user engaged

**Budget**: Send progress updates every 500-1000ms
```

### Secondary Locations (Cross-References)

**Document 1**: `/ai_docs/standards/7_performance_guidelines.md`
- **Section**: After "## 7. Loading States & Perceived Performance" (line 359)
- **Action**: Add reference: "For long operations (>3s), use SSE streaming. See SSE Pattern in Coding Patterns."

**Document 2**: `/ai_docs/development_decisions.md`
- **Section**: After "## 🔐 Authentication (FIXED)" (line 19)
- **Action**: Add: "## 📡 Streaming (FIXED)\n- **Long Operations**: SSE streaming for operations >3s\n- **Rule**: Always show progress for user-facing async operations\n- **Implementation**: Edge runtime with text/event-stream"

### Dependencies

- Depends on: Integration 7 (discriminated unions for type-safe events)

### Conflict Resolution

- Complements existing performance guidelines
- Updates API route pattern with streaming variant

---

## Integration 4: 2-3 Customization Options Sweet Spot for AI Personalization

**Source**: Principle 4 from generalized.md
**Priority**: Medium

### Primary Location

**Document**: `/ai_docs/coding_patterns.md`
**Section**: Create new section after "## 📡 Server-Sent Events (SSE) Pattern"
**Action**: Add new section

### Integration Content

```markdown
## 🤖 AI Customization Pattern

### ✅ REQUIRED: 2-3 Options for AI Features

**Rule**: For AI-powered features, provide exactly 2-3 customization dimensions with 3 choices each.

**Golden Ratio**: 2-3 dimensions × 3 choices = 6-9 total combinations (sweet spot)

**Why**: Limited options make AI feel personalized while avoiding decision paralysis.
- 0 options → "too generic"
- 2-3 options → "perfectly customized"
- 5+ options → "overwhelming"

**When to Apply**:
- AI content generation (writing, rewriting, summarizing)
- Recommendation engines
- AI-assisted search/filtering

**When NOT to Apply**:
- Deterministic operations (no AI involved)
- Technical operations (exports, imports)
- Features with "one right answer"

### Standard Implementation

```typescript
// Standard AI customization interface
interface AIGenerationOptions {
  // Dimension 1: Style/Tone (how it's written)
  tone: 'professional' | 'casual' | 'enthusiastic'

  // Dimension 2: Length/Scope (how much)
  length: 'short' | 'medium' | 'long'

  // Dimension 3: Context/Focus (what to emphasize) - optional
  focus?: 'features' | 'benefits' | 'storytelling'
}

// Prompt templates for each dimension
const promptTemplates = {
  tone: {
    professional: 'Use formal language, focus on specifications',
    casual: 'Use conversational language, speak directly',
    enthusiastic: 'Use energetic language, emphasize excitement'
  },
  length: {
    short: 'Target 200-250 words',
    medium: 'Target 250-350 words',
    long: 'Target 350-450 words'
  },
  focus: {
    features: 'Emphasize technical specifications',
    benefits: 'Emphasize customer gains',
    storytelling: 'Create narrative about purpose'
  }
}

// Build prompt from options
function buildAIPrompt(
  input: string,
  options: AIGenerationOptions
): string {
  return `
${promptTemplates.tone[options.tone]}
${promptTemplates.length[options.length]}
${options.focus ? promptTemplates.focus[options.focus] : ''}

Input: ${input}
`
}
```

### UI Component Pattern

```typescript
export function AIOptionsPanel({
  options,
  onChange
}: AIOptionsPanelProps) {
  return (
    <div className="space-y-4">
      {/* Dimension 1: Tone */}
      <div>
        <Label>Tone</Label>
        <RadioGroup value={options.tone} onValueChange={(v) =>
          onChange({ ...options, tone: v })
        }>
          <RadioItem value="professional">Professional</RadioItem>
          <RadioItem value="casual">Casual</RadioItem>
          <RadioItem value="enthusiastic">Enthusiastic</RadioItem>
        </RadioGroup>
      </div>

      {/* Dimension 2: Length */}
      <div>
        <Label>Length</Label>
        <RadioGroup value={options.length} onValueChange={(v) =>
          onChange({ ...options, length: v })
        }>
          <RadioItem value="short">Short (200-250 words)</RadioItem>
          <RadioItem value="medium">Medium (250-350 words)</RadioItem>
          <RadioItem value="long">Long (350-450 words)</RadioItem>
        </RadioGroup>
      </div>
    </div>
  )
}
```

### Benefits

- Increased perceived AI personalization
- Avoids decision paralysis
- Maintains simplicity
- Easy to implement and maintain
```

### Secondary Locations (Cross-References)

**Document 1**: `/ai_docs/standards/3_component_standards.md`
- **Section**: After "## 5. State Management in Components" (line 257)
- **Action**: Add reference: "For AI option panels, see AI Customization Pattern in Coding Patterns"

### Dependencies

- None (standalone pattern)

### Conflict Resolution

- No conflicts - adds new AI-specific pattern

---

## Integration 5: Context-Aware AI with Progressive Enhancement

**Source**: Principle 5 from generalized.md
**Priority**: High

### Primary Location

**Document**: `/ai_docs/coding_patterns.md`
**Section**: Within "## 🤖 AI Customization Pattern" (after Integration 4)
**Action**: Add subsection

### Integration Content

```markdown
### Context-Aware AI Pattern

**Rule**: Always provide structured context from related user data to AI prompts, but design to work without it (progressive enhancement).

**Pattern**: Extract context → Build prompt → Handle missing context gracefully

#### Context Extraction

```typescript
interface AIContext {
  user: {
    profile?: UserProfile
    history?: HistoryItem[]
    preferences?: UserPreferences
  }
  related: {
    entity?: RelatedEntity
    connections?: Connection[]
  }
}

async function extractAIContext(
  userId: string,
  relatedId?: string
): Promise<AIContext> {
  // Parallel fetch for efficiency
  const [user, related] = await Promise.all([
    fetchUserData(userId),
    relatedId ? fetchRelatedData(relatedId) : Promise.resolve(null)
  ])

  // Defensive coding with optional chaining
  return {
    user: {
      profile: user?.profile,
      history: user?.history?.slice(0, 10), // Limit context size
      preferences: user?.preferences
    },
    related: {
      entity: related?.entity,
      connections: related?.connections?.slice(0, 5)
    }
  }
}
```

#### Progressive Enhancement Pattern

```typescript
// Build prompt with optional context
function buildContextualPrompt(
  input: string,
  context?: AIContext
): string {
  const basePrompt = `Task: ${input}`

  // Works without context (basic tier)
  if (!context) return basePrompt

  // Enhanced with context (better tier)
  const contextSection = `
${context.user.profile ? `User: ${context.user.profile.name}, ${context.user.profile.role}` : ''}
${context.user.history ? `History: ${context.user.history.map(h => h.summary).join(', ')}` : ''}
${context.related.entity ? `Related: ${context.related.entity.name}` : ''}
`

  return `${contextSection}\n\n${basePrompt}`
}

// Usage with fallback
async function generateContent(input: string, userId: string) {
  try {
    const context = await extractAIContext(userId)
    const prompt = buildContextualPrompt(input, context)
    return await generateWithAI(prompt)
  } catch (error) {
    // Fallback: Generate without context if extraction fails
    console.warn('Context extraction failed, using basic prompt:', error)
    const prompt = buildContextualPrompt(input)
    return await generateWithAI(prompt)
  }
}
```

#### Context Rules

1. **Privacy**: Never include PII (emails, phones, addresses) in prompts
2. **Size Limits**: Limit context to most recent/relevant items (top 10)
3. **Progressive**: Feature must work without context (new users)
4. **Performance**: Parallel fetch context with Promise.all

#### Impact

**Generic → Tailored**:
- Without context: "Write a cover letter"
- With context: "Write a cover letter for [Name], [Role] at [Company], applying to [Industry] position based on resume showing [Skills]"
```

### Secondary Locations (Cross-References)

**Document 1**: `/ai_docs/standards/1_architecture_principles.md`
- **Section**: Under "### 6. Progressive Enhancement" (line 147)
- **Action**: Add example: "AI features: Work without context (basic), enhanced with user data (better). See Context-Aware AI Pattern."

### Dependencies

- Depends on: Integration 2 (parallel fetch pattern)

### Conflict Resolution

- Extends AI customization pattern (Integration 4)

---

## Integration 6: Edge for Streaming, Node for Heavy Computation

**Source**: Principle 6 from generalized.md
**Priority**: Critical

### Primary Location

**Document**: `/ai_docs/coding_patterns.md`
**Section**: Update "## 🚀 API Route Pattern" (line 203)
**Action**: Replace existing runtime guidance

### Integration Content

```markdown
## 🚀 API Route Pattern

### ✅ REQUIRED: Runtime Selection Based on Operation

**Decision Tree**:

```
Is this operation >60 seconds OR uses heavy dependencies?
  Yes → Node Runtime
  No → Continue...

Does this operation stream responses (SSE)?
  Yes → Edge Runtime
  No → Continue...

Is this a global, lightweight endpoint (auth, simple reads)?
  Yes → Edge Runtime
  No → Node Runtime (default)
```

### Edge Runtime Pattern

**Use When**:
- AI streaming (SSE, real-time generation)
- Lightweight database reads
- Global endpoints (auth, public APIs)
- Simple data transformations
- Operations <60 seconds

```typescript
// app/api/ai/generate/route.ts
export const runtime = 'edge'
export const dynamic = 'force-dynamic'
export const maxDuration = 60 // Max 60 seconds

export async function POST(req: NextRequest) {
  // ✅ ALLOWED in Edge:
  // - ReadableStream / SSE
  // - fetch API
  // - AI SDK streaming
  // - Supabase client
  // - Simple transformations

  const stream = new ReadableStream({
    async start(controller) {
      // Stream AI response
    }
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream' }
  })
}
```

### Node Runtime Pattern

**Use When**:
- PDF generation (Puppeteer, Chromium)
- File processing (Sharp, FFmpeg)
- Heavy computations
- Operations >60 seconds
- Packages requiring Node.js APIs

```typescript
// app/api/export/pdf/route.ts
// No runtime export = Node runtime (default)

export async function POST(req: NextRequest) {
  // ✅ ALLOWED in Node (forbidden in Edge):
  // - fs (filesystem)
  // - Puppeteer (browser automation)
  // - Sharp (image processing)
  // - Heavy npm packages
  // - Operations >60 seconds

  const browser = await puppeteer.launch()
  const pdf = await generatePDF(browser, data)
  await browser.close()

  return new NextResponse(pdf, {
    headers: { 'Content-Type': 'application/pdf' }
  })
}
```

### Hybrid Pattern

**Use When**: Need both streaming AND heavy processing

```typescript
// Edge endpoint initiates, streams progress
// app/api/process/start/route.ts
export const runtime = 'edge'

export async function POST(req: NextRequest) {
  const { jobId } = await req.json()

  // Start background job in Node runtime
  await fetch('/api/process/execute', {
    method: 'POST',
    body: JSON.stringify({ jobId })
  })

  // Stream progress from Edge
  return streamJobProgress(jobId)
}

// Node endpoint processes
// app/api/process/execute/route.ts
export async function POST(req: NextRequest) {
  const { jobId } = await req.json()
  // Heavy processing with Node dependencies
  await processJob(jobId)
  return NextResponse.json({ success: true })
}
```

### Runtime Comparison

| Feature | Edge | Node |
|---------|------|------|
| Streaming (SSE) | ✅ Yes | ❌ Limited |
| Global Distribution | ✅ Yes | ❌ No |
| Heavy Dependencies | ❌ No | ✅ Yes |
| Filesystem Access | ❌ No | ✅ Yes |
| Max Duration | 60s | 300s+ |
| Cold Start | Fast | Slower |

### Performance Impact

- **Edge**: Low latency worldwide, ideal for user-facing endpoints
- **Node**: Full Node.js capabilities, ideal for background processing

**Rule**: Never choose runtime arbitrarily. Match capabilities to requirements.
```

### Secondary Locations (Cross-References)

**Document 1**: `/ai_docs/development_decisions.md`
- **Section**: After "## 🔐 Authentication (FIXED)" (line 19)
- **Action**: Add: "## ⚡ API Runtime (FIXED)\n- **Edge Runtime**: Streaming, lightweight ops (<60s), global endpoints\n- **Node Runtime**: Heavy deps (Puppeteer, Sharp), ops >60s\n- **Rule**: Match runtime to operation requirements (see API Route Pattern)"

**Document 2**: `/ai_docs/standards/7_performance_guidelines.md`
- **Section**: After "## 3. Backend Performance" (line 133)
- **Action**: Add reference: "Runtime selection impacts performance. See API Route Pattern in Coding Patterns for Edge vs Node decision tree."

### Dependencies

- Supports: Integration 3 (SSE streaming requires Edge)

### Conflict Resolution

- Replaces existing runtime guidance in API Route Pattern
- Action: Update lines 203-246 with new runtime selection logic

---

## Integration 7: Discriminated Unions for Type-Safe Event Handling

**Source**: Principle 7 from generalized.md
**Priority**: High

### Primary Location

**Document**: `/ai_docs/coding_patterns.md`
**Section**: After "## 🔧 TypeScript Strict Mode Patterns" (line 640)
**Action**: Add new subsection

### Integration Content

```markdown
### Discriminated Unions for Event Systems

**Pattern**: Use TypeScript discriminated unions for typed message passing and state transitions.

**When to Apply**:
- SSE streaming events
- WebSocket message types
- State machine transitions
- Redux-style actions
- API response variants

**When NOT to Apply**:
- Simple boolean flags
- Single event type
- Dynamic types determined at runtime

#### Standard Pattern

```typescript
// 1. Define discriminated union with shared discriminant property
type Event =
  | { type: 'event_a'; propA: string; propB: number }
  | { type: 'event_b'; propC: boolean }
  | { type: 'event_c'; propD: string[]; propE: Date }

// 2. Type-safe handler with switch/case
function handleEvent(event: Event) {
  switch (event.type) {
    case 'event_a':
      // TypeScript knows: event.propA and event.propB exist
      processEventA(event.propA, event.propB)
      break

    case 'event_b':
      // TypeScript knows: event.propC exists (propA, propB don't)
      processEventB(event.propC)
      break

    case 'event_c':
      // TypeScript knows: event.propD and event.propE exist
      processEventC(event.propD, event.propE)
      break

    default:
      // Exhaustiveness check: Compile error if we miss a case
      const _exhaustive: never = event
      return _exhaustive
  }
}
```

#### SSE Event Example

```typescript
// SSE streaming events (from Integration 3)
type SSEEvent =
  | { type: 'progress'; progress: number; message?: string }
  | { type: 'update'; data: Partial<T> }
  | { type: 'complete'; data: T }
  | { type: 'error'; message: string }

// Type-safe event handling
eventSource.addEventListener('progress', (e) => {
  const event: SSEEvent = { type: 'progress', ...JSON.parse(e.data) }
  // TypeScript knows event.progress exists
  setProgress(event.progress)
})
```

#### State Machine Example

```typescript
// Request lifecycle states
type RequestState<T> =
  | { status: 'idle' }
  | { status: 'loading'; startedAt: number }
  | { status: 'success'; data: T; loadedAt: number }
  | { status: 'error'; error: Error; failedAt: number }

// Type-safe rendering
function RequestDisplay<T>({ state }: { state: RequestState<T> }) {
  switch (state.status) {
    case 'idle':
      return <div>Click to load</div>

    case 'loading':
      return <Spinner startedAt={state.startedAt} />

    case 'success':
      // TypeScript knows state.data exists
      return <Data data={state.data} />

    case 'error':
      return <Error error={state.error} />

    default:
      const _exhaustive: never = state
      return null
  }
}
```

#### Benefits

- **Compile-time safety**: TypeScript catches missing cases
- **IDE autocomplete**: IntelliSense shows available properties
- **Exhaustiveness checking**: Never forget to handle a case
- **No runtime guards**: Type narrowing happens automatically

#### Generic Pattern

```typescript
// Generic Result type (reusable)
type Result<T, E = Error> =
  | { status: 'success'; data: T }
  | { status: 'error'; error: E }

function handleResult<T>(result: Result<T>) {
  if (result.status === 'success') {
    // TypeScript knows result.data exists
    return result.data
  } else {
    // TypeScript knows result.error exists
    throw result.error
  }
}
```
```

### Secondary Locations (Cross-References)

**Document 1**: `/ai_docs/standards/1_architecture_principles.md`
- **Section**: Under "### 9. Make Invalid States Unrepresentable" (line 229)
- **Action**: Add example: "Use discriminated unions for event systems. See TypeScript Strict Mode Patterns for implementation."

**Document 2**: `/ai_docs/standards/2_data_flow_patterns.md`
- **Section**: After "## 5. Form State Management" (line 203)
- **Action**: Update form state machine example to reference discriminated union pattern

### Dependencies

- Blocks: Integrations 2, 3 (they depend on this for type safety)

### Conflict Resolution

- Extends existing TypeScript strict mode section
- No conflicts

---

## Integration Order

**Dependency-Based Sequence**:

1. **Integration 7** - Discriminated Unions (no dependencies)
2. **Integration 2** - Parallel Fetch + Client Merge (depends on #7)
3. **Integration 3** - SSE Streaming (depends on #7)
4. **Integration 6** - Edge/Node Runtime Selection (supports #3)
5. **Integration 1** - Component Composition (no dependencies)
6. **Integration 4** - AI Customization Options (no dependencies)
7. **Integration 5** - Context-Aware AI (depends on #2)

---

## Summary

**Total Documents**: 6
- `/ai_docs/coding_patterns.md` (4 new sections, 1 updated section)
- `/ai_docs/standards/3_component_standards.md` (1 new subsection)
- `/ai_docs/standards/1_architecture_principles.md` (3 cross-references)
- `/ai_docs/standards/2_data_flow_patterns.md` (2 cross-references)
- `/ai_docs/standards/7_performance_guidelines.md` (2 cross-references)
- `/ai_docs/development_decisions.md` (2 new sections)

**New Sections**: 7
**Updated Sections**: 1
**Cross-References**: 9

**Ready to Apply**: Yes
**Conflicts**: None (all integrations are additive or replace specific sections)
**Dependencies Mapped**: All dependencies identified and ordered

---

## Next Steps

1. Apply integrations in dependency order (1-7)
2. Verify cross-references link correctly
3. Update table of contents in affected documents
4. Test that examples compile/run correctly
5. Create summary commit documenting Phase 7 learnings integration
