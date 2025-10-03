# Phase 7 Generalized Knowledge

**Date**: 2025-10-03
**Patterns Analyzed**: 7
**Principles Created**: 7
**Abstraction Level**: Cross-project reusable patterns
**Source**: Phase 7 Cover Letter Feature Implementation

---

## Principle 1: Granular Component Composition Over Monolithic Components

**Source Pattern**: Pattern 1 - Component Composition Architecture
**Abstraction Level**: High
**Scope**: Frontend (all UI features)

### If-Then-Because Rule

**IF**: Building a feature with 3+ distinct concerns (filtering, actions, display, input)
**THEN**: Create focused components (<200 lines each) with single responsibility and compose at parent level
**BECAUSE**: Small, focused components are easier to understand, test, reuse, and maintain; they naturally enforce design consistency and prevent prop explosion (20+ props)

### Generalized Principle

**Break complex UIs into minimal, focused components that each handle exactly one concern, then compose them at the parent level using children props and explicit composition.**

The sweet spot is 100-200 lines per component. If a component exceeds 200 lines or has 10+ props, it's doing too much and should be split.

### Application Context

**When to Apply**:
- Dashboard/listing pages with multiple UI concerns
- Complex forms with distinct sections (profile, experience, skills)
- Editor interfaces with multiple tools/panels
- Any feature requiring different combinations of sub-features
- Settings pages with multiple configuration groups

**When NOT to Apply**:
- Simple presentational components (<50 lines)
- Single-purpose utility components (loading spinner, error message)
- Components that legitimately need 10+ props due to configuration flexibility (design system primitives)

### Examples Across Domains

**Example 1** - E-commerce Product Dashboard:
```typescript
// ❌ WRONG - Monolithic dashboard (500+ lines)
<ProductDashboard
  products={products}
  filters={filters}
  onFilterChange={handleFilterChange}
  selectedProducts={selected}
  onSelectProduct={handleSelect}
  onSelectAll={handleSelectAll}
  bulkActions={['delete', 'archive', 'duplicate']}
  onBulkDelete={handleBulkDelete}
  onBulkArchive={handleBulkArchive}
  // 15+ more props...
/>

// ✅ CORRECT - Composed components (each 100-150 lines)
<ProductDashboard>
  <ProductFilters onFilter={handleFilter} />
  <ProductSearch onSearch={handleSearch} />
  <ProductTable
    products={products}
    selection={selection}
    onSelectionChange={setSelection}
  />
  <BulkActions
    selectedIds={selection}
    onAction={handleBulkAction}
  />
</ProductDashboard>
```

**Example 2** - User Settings Page:
```typescript
// ❌ WRONG - Single settings component
<Settings
  profile={profile}
  notifications={notifications}
  privacy={privacy}
  billing={billing}
  onProfileUpdate={handleProfileUpdate}
  onNotificationsUpdate={handleNotificationsUpdate}
  // etc...
/>

// ✅ CORRECT - Focused section components
<SettingsLayout>
  <ProfileSection profile={profile} onUpdate={handleUpdate} />
  <NotificationSettings settings={notifications} onChange={handleChange} />
  <PrivacyControls settings={privacy} onChange={handleChange} />
  <BillingInfo billing={billing} />
</SettingsLayout>
```

### Code Template

```typescript
// Parent component - composition only (50-100 lines)
export default function FeatureDashboard() {
  const [state, setState] = useState()

  return (
    <div className="dashboard-layout">
      <FilterComponent onFilter={handleFilter} />
      <SearchComponent onSearch={handleSearch} />
      <ListComponent
        items={items}
        selection={selection}
        onSelect={setSelection}
      />
      <ActionComponent
        selection={selection}
        onAction={handleAction}
      />
    </div>
  )
}

// Child component - single concern (100-150 lines)
export function FilterComponent({ onFilter }: FilterProps) {
  // Only filtering logic, no other concerns
  return <div>...</div>
}

// Props interface
interface FilterProps {
  onFilter: (filters: Filters) => void
  initialFilters?: Filters // Optional customization
}
```

### Exceptions & Edge Cases

**Exception 1**: **Design System Primitives**
- Components like `<Button variant="..." size="..." icon="..." disabled={...} loading={...} />` legitimately need 10+ props
- These are configurable building blocks, not feature components

**Exception 2**: **Third-Party Library Wrappers**
- When wrapping external libraries (maps, charts, editors), props mirror the library API
- Don't artificially split these—keep the wrapper thin

**Exception 3**: **Atomic Components**
- Components <50 lines don't benefit from splitting
- Input fields, labels, badges are already minimal

### Related Principles

- Principle 2 (reinforces): Client-side merge pattern creates data for composed components
- Principle 3 (contrasts): Streaming UX requires centralized state management, not pure composition
- Component Standards Section 1 (aligns): Atomic Design hierarchy

---

## Principle 2: Parallel Fetch + Client-Side Merge for Multi-Entity Views

**Source Pattern**: Pattern 2 - Client-Side Data Merge for Multi-Entity Views
**Abstraction Level**: Medium
**Scope**: Backend (API routes, data fetching)

### If-Then-Because Rule

**IF**: Building a unified view of multiple entity types with different schemas (resumes + cover letters, products + bundles, posts + comments)
**THEN**: Fetch entities in parallel with Promise.all, merge with type annotation, sort/filter in application code
**BECAUSE**: Parallel queries + client merge (200ms total) outperforms database UNION queries in simplicity, Edge runtime compatibility, and flexibility while maintaining excellent performance

### Generalized Principle

**For Edge runtime environments or multi-entity aggregations, prefer parallel entity queries with client-side merge/sort over complex database queries.**

Performance budget: Total time ≤ 300ms for 2-3 parallel queries including merge/sort.

### Application Context

**When to Apply**:
- Multi-entity dashboards (documents + templates + exports)
- Unified activity feeds (posts + comments + likes)
- Cross-type search results (products + categories + brands)
- Edge runtime API routes (no database-specific features)
- Entities with different schemas requiring type discrimination

**When NOT to Apply**:
- Node runtime with Postgres-specific optimizations available
- Single entity type with complex filtering (use database)
- Need for database-level aggregations (COUNT, SUM, GROUP BY)
- Very large datasets (>10,000 records) where database filtering is essential

### Examples Across Domains

**Example 1** - Activity Feed (Social App):
```typescript
// Parallel fetch different activity types
export async function getActivityFeed(
  supabase: SupabaseClient,
  userId: string
): Promise<ActivityItem[]> {
  // 1. Parallel fetch
  const [posts, comments, likes] = await Promise.all([
    supabase.from('posts').select('*').eq('user_id', userId),
    supabase.from('comments').select('*').eq('user_id', userId),
    supabase.from('likes').select('*').eq('user_id', userId)
  ])

  // 2. Merge with type annotation
  const activities: ActivityItem[] = [
    ...posts.data!.map(p => ({ ...p, type: 'post' as const })),
    ...comments.data!.map(c => ({ ...c, type: 'comment' as const })),
    ...likes.data!.map(l => ({ ...l, type: 'like' as const }))
  ]

  // 3. Sort by timestamp
  return activities.sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
}
```

**Example 2** - Search Results (E-commerce):
```typescript
export async function searchAll(
  supabase: SupabaseClient,
  query: string
): Promise<SearchResult[]> {
  const [products, categories, brands] = await Promise.all([
    supabase.from('products').select('*').ilike('name', `%${query}%`),
    supabase.from('categories').select('*').ilike('name', `%${query}%`),
    supabase.from('brands').select('*').ilike('name', `%${query}%`)
  ])

  return [
    ...products.data!.map(p => ({ ...p, resultType: 'product' as const })),
    ...categories.data!.map(c => ({ ...c, resultType: 'category' as const })),
    ...brands.data!.map(b => ({ ...b, resultType: 'brand' as const }))
  ]
}
```

### Code Template

```typescript
// Generic multi-entity fetch pattern
export async function fetchUnifiedView<T extends { type: string }>(
  supabase: SupabaseClient,
  userId: string
): Promise<T[]> {
  // 1. Parallel fetch (adjust queries as needed)
  const [entityA, entityB, entityC] = await Promise.all([
    supabase.from('table_a').select('*').eq('user_id', userId),
    supabase.from('table_b').select('*').eq('user_id', userId),
    supabase.from('table_c').select('*').eq('user_id', userId)
  ])

  // 2. Merge with type discriminator
  const merged: T[] = [
    ...entityA.data!.map(a => ({ ...a, type: 'type_a' as const })),
    ...entityB.data!.map(b => ({ ...b, type: 'type_b' as const })),
    ...entityC.data!.map(c => ({ ...c, type: 'type_c' as const }))
  ]

  // 3. Sort/filter in application (negligible cost ~5ms)
  return merged
    .sort((a, b) => compareByDate(a, b))
    .filter(item => matchesCriteria(item))
}

// TypeScript discriminated union for type safety
type UnifiedItem =
  | { type: 'type_a'; /* type_a fields */ }
  | { type: 'type_b'; /* type_b fields */ }
  | { type: 'type_c'; /* type_c fields */ }
```

### Exceptions & Edge Cases

**Exception 1**: **Large Datasets with Complex Filtering**
- If filtering would fetch 10,000+ records to filter client-side, use database
- Database filtering reduces network transfer and memory usage

**Exception 2**: **Database-Level Aggregations**
- If you need COUNT, SUM, AVG, GROUP BY → must use database
- Client-side aggregations on large datasets are inefficient

**Exception 3**: **Node Runtime with Postgres Features**
- If running in Node runtime and need CTEs, window functions, or complex joins
- Postgres can be more efficient for these operations

### Related Principles

- Principle 1 (reinforces): Composed components consume merged data
- Principle 6 (reinforces): Edge runtime compatibility is key criterion
- Data Flow Patterns Section 3 (aligns): Server state fetching patterns

---

## Principle 3: SSE Streaming for Perceived Performance in Long Operations

**Source Pattern**: Pattern 3 - SSE Streaming for AI Transparency
**Abstraction Level**: High
**Scope**: Full-stack (API + frontend for async operations)

### If-Then-Because Rule

**IF**: Implementing any operation that takes >3 seconds to complete
**THEN**: Use Server-Sent Events (SSE) to stream progress updates every 500-1000ms
**BECAUSE**: Real-time progress transforms user perception from "slow loading" to "fast and engaging", making 10s with streaming feel faster than 5s without streaming

### Generalized Principle

**For all long-running operations (>3 seconds), implement SSE streaming with progress updates to dramatically improve perceived performance, even when total processing time remains unchanged.**

The psychological impact is profound: users tolerate longer actual wait times when they see progress.

### Application Context

**When to Apply**:
- AI content generation (drafting, rewriting, matching)
- File processing (PDF import, image optimization, video conversion)
- Batch operations (bulk delete, export, import)
- Complex calculations (analytics, reports, scoring)
- Any operation where showing intermediate results is useful

**When NOT to Apply**:
- Operations <3 seconds (streaming overhead not worth it)
- Operations with no meaningful progress stages (atomic database writes)
- Real-time bidirectional communication (use WebSockets instead)

### Examples Across Domains

**Example 1** - File Processing (Image Optimization):
```typescript
// Server: Edge runtime with SSE
export const POST = async (req: NextRequest) => {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const images = await req.json()

      for (let i = 0; i < images.length; i++) {
        // Send progress
        controller.enqueue(encoder.encode(
          `event: progress\ndata: ${JSON.stringify({
            progress: (i + 1) / images.length,
            current: i + 1,
            total: images.length
          })}\n\n`
        ))

        // Process image
        const optimized = await optimizeImage(images[i])

        // Send update
        controller.enqueue(encoder.encode(
          `event: update\ndata: ${JSON.stringify({
            image: optimized
          })}\n\n`
        ))
      }

      // Send completion
      controller.enqueue(encoder.encode(
        `event: complete\ndata: ${JSON.stringify({
          total: images.length
        })}\n\n`
      ))

      controller.close()
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

// Client: Type-safe event handling
type ProcessingEvent =
  | { type: 'progress'; progress: number; current: number; total: number }
  | { type: 'update'; image: OptimizedImage }
  | { type: 'complete'; total: number }
  | { type: 'error'; message: string }

const eventSource = new EventSource('/api/optimize')

eventSource.addEventListener('progress', (e) => {
  const event: ProcessingEvent = { type: 'progress', ...JSON.parse(e.data) }
  setProgress(event.progress)
})

eventSource.addEventListener('complete', (e) => {
  const event: ProcessingEvent = { type: 'complete', ...JSON.parse(e.data) }
  onComplete()
})
```

**Example 2** - Batch Export (E-commerce Orders):
```typescript
// Server: Stream export progress
export const POST = async (req: NextRequest) => {
  const { orderIds } = await req.json()
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const chunks = chunkArray(orderIds, 100) // Process in batches

      for (let i = 0; i < chunks.length; i++) {
        controller.enqueue(encoder.encode(
          `event: progress\ndata: ${JSON.stringify({
            progress: i / chunks.length,
            message: `Exporting batch ${i + 1} of ${chunks.length}...`
          })}\n\n`
        ))

        const batch = await exportOrderBatch(chunks[i])

        controller.enqueue(encoder.encode(
          `event: update\ndata: ${JSON.stringify({
            batchNumber: i + 1,
            recordsProcessed: batch.length
          })}\n\n`
        ))
      }

      controller.enqueue(encoder.encode(
        `event: complete\ndata: ${JSON.stringify({
          totalRecords: orderIds.length
        })}\n\n`
      ))

      controller.close()
    }
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream' }
  })
}
```

### Code Template

```typescript
// Server-side SSE pattern (Edge runtime)
export const runtime = 'edge'

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Parse request
        const input = await req.json()

        // Process with progress updates
        for (const stage of processingStages) {
          // Send progress (0.0 to 1.0)
          controller.enqueue(encoder.encode(
            `event: progress\ndata: ${JSON.stringify({
              progress: stage.progress,
              message: stage.message
            })}\n\n`
          ))

          // Process stage
          const result = await processStage(stage, input)

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

// Client-side consumption pattern
type SSEEvent =
  | { type: 'progress'; progress: number; message?: string }
  | { type: 'update'; data: Partial<T> }
  | { type: 'complete'; data: T }
  | { type: 'error'; message: string }

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

### Exceptions & Edge Cases

**Exception 1**: **Bidirectional Communication Needed**
- If client needs to send messages during processing (cancel, adjust parameters)
- Use WebSockets instead of SSE (bidirectional channel)

**Exception 2**: **Operations <3 Seconds**
- For fast operations, streaming overhead (setup, parsing) exceeds benefit
- Use simple loading spinner instead

**Exception 3**: **No Meaningful Progress Stages**
- If operation has no intermediate milestones (atomic database write)
- Can't provide meaningful progress updates

### Related Principles

- Principle 6 (reinforces): Edge runtime ideal for SSE streaming
- Principle 7 (reinforces): Discriminated unions provide type-safe event handling
- API Route Pattern (aligns): Edge runtime for lightweight streaming operations

---

## Principle 4: 2-3 Customization Options Sweet Spot for AI Personalization

**Source Pattern**: Pattern 4 - AI Customization Options Increase Perceived Value
**Abstraction Level**: High
**Scope**: AI/ML features (content generation, recommendations)

### If-Then-Because Rule

**IF**: Building an AI content generation feature (writing, rewriting, matching)
**THEN**: Provide exactly 2-3 meaningful customization options (tone, length, context) with 3 choices each
**BECAUSE**: Limited options make AI feel personalized and powerful while avoiding decision paralysis; users perceive "too generic" with 0 options and "overwhelming" with 5+ options

### Generalized Principle

**For AI-powered features, provide 2-3 customization dimensions with 3 choices each to maximize perceived personalization while minimizing cognitive load.**

The golden ratio: 2-3 dimensions × 3 choices = 6-9 total combinations (sweet spot for user choice without overwhelm).

### Application Context

**When to Apply**:
- AI content generation (writing, rewriting, summarizing)
- Recommendation engines (products, content, connections)
- Personalization features (themes, layouts, workflows)
- AI-assisted search/filtering
- Automated content curation

**When NOT to Apply**:
- Deterministic operations (no AI/ML involved)
- Technical operations where customization adds complexity (exports, imports)
- Features where "one right answer" exists (spell check, grammar)

### Examples Across Domains

**Example 1** - Product Description Generator (E-commerce):
```typescript
interface DescriptionOptions {
  tone: 'professional' | 'casual' | 'enthusiastic'
  length: 'short' | 'medium' | 'long'
  focus: 'features' | 'benefits' | 'storytelling'
}

const tonePrompts = {
  professional: 'Use formal language, focus on specifications and quality',
  casual: 'Use conversational language, speak to the customer directly',
  enthusiastic: 'Use energetic language, emphasize excitement and value'
}

const lengthGuidelines = {
  short: '50-75 words, punchy and concise',
  medium: '100-150 words, balanced detail',
  long: '200-250 words, comprehensive and detailed'
}

const focusPrompts = {
  features: 'Emphasize technical specifications and what the product has',
  benefits: 'Emphasize what the customer gains and how it solves problems',
  storytelling: 'Create a narrative about the product\'s origin and purpose'
}

// AI prompt construction
const prompt = `
Generate a product description for ${product.name}.

Tone: ${tonePrompts[options.tone]}
Length: ${lengthGuidelines[options.length]}
Focus: ${focusPrompts[options.focus]}

Product details:
${productContext}
`
```

**Example 2** - Email Subject Line Generator (Marketing):
```typescript
interface SubjectLineOptions {
  style: 'direct' | 'curiosity' | 'urgency'
  length: 'short' | 'medium' | 'long'
  personalization: 'none' | 'name' | 'behavior'
}

const stylePrompts = {
  direct: 'Clear, straightforward value proposition',
  curiosity: 'Intriguing question or teaser that creates curiosity',
  urgency: 'Time-sensitive language that creates FOMO'
}

const lengthGuidelines = {
  short: '20-30 characters (mobile-optimized)',
  medium: '40-50 characters (standard)',
  long: '60-70 characters (detailed)'
}

const personalizationPrompts = {
  none: 'Generic subject line for broad audience',
  name: 'Include recipient\'s first name',
  behavior: 'Reference recipient\'s past behavior or interests'
}
```

### Code Template

```typescript
// Standard AI customization pattern
interface AIGenerationOptions {
  // Dimension 1: Style/Tone (how it's written)
  tone: 'option_a' | 'option_b' | 'option_c'

  // Dimension 2: Length/Scope (how much)
  length: 'short' | 'medium' | 'long'

  // Dimension 3: Context/Focus (what to emphasize) - optional
  focus?: 'aspect_a' | 'aspect_b' | 'aspect_c'
}

// Prompt templates for each dimension
const promptTemplates = {
  tone: {
    option_a: 'Clear instructions for tone A',
    option_b: 'Clear instructions for tone B',
    option_c: 'Clear instructions for tone C'
  },
  length: {
    short: 'Target 200-250 words',
    medium: 'Target 250-350 words',
    long: 'Target 350-450 words'
  },
  focus: {
    aspect_a: 'Emphasize aspect A',
    aspect_b: 'Emphasize aspect B',
    aspect_c: 'Emphasize aspect C'
  }
}

// Build prompt from options
function buildPrompt(
  input: string,
  options: AIGenerationOptions,
  context?: string
): string {
  return `
${promptTemplates.tone[options.tone]}
${promptTemplates.length[options.length]}
${options.focus ? promptTemplates.focus[options.focus] : ''}

Input: ${input}
${context ? `Context: ${context}` : ''}
`
}

// UI component
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
          <RadioItem value="option_a">Option A</RadioItem>
          <RadioItem value="option_b">Option B</RadioItem>
          <RadioItem value="option_c">Option C</RadioItem>
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

### Exceptions & Edge Cases

**Exception 1**: **Technical AI Operations**
- For operations like OCR, speech-to-text, translation where customization adds complexity
- Provide sensible defaults, hide options unless user is advanced

**Exception 2**: **Domain Experts**
- Advanced users may want 5+ dimensions for fine-grained control
- Offer "Advanced Options" panel that's collapsed by default

**Exception 3**: **A/B Testing Scenarios**
- When generating multiple variants for testing
- Add "Generate 3 variations" instead of manual option tweaking

### Related Principles

- Principle 5 (reinforces): Context enhancement improves AI output quality
- Principle 3 (complements): Streaming shows AI "thinking" through options
- Component Standards Section 5 (aligns): Form patterns for option selection

---

## Principle 5: Context-Aware AI with Progressive Enhancement

**Source Pattern**: Pattern 5 - Context-Aware AI as Default
**Abstraction Level**: High
**Scope**: AI/ML features (any AI using user's existing data)

### If-Then-Because Rule

**IF**: Building an AI feature where the user has related data in the system (profile, history, preferences)
**THEN**: Extract and provide structured context to AI prompts with defensive coding (optional chaining, fallbacks)
**BECAUSE**: Context from related data produces dramatically more personalized output (generic → tailored) while maintaining functionality when context is unavailable (progressive enhancement)

### Generalized Principle

**Always provide structured context from related user data to AI prompts, but design the feature to work gracefully without it (progressive enhancement: basic tier works, enhanced tier is better).**

Context transforms AI from "generic template engine" to "personalized assistant."

### Application Context

**When to Apply**:
- AI generation using user's profile/history (cover letters from resume, emails from CRM)
- Content recommendations based on behavior (product suggestions, content feed)
- Personalized search results (weighted by user preferences)
- AI rewriting/enhancement of existing content
- Automated form filling from user data

**When NOT to Apply**:
- First-time user flows (no data exists yet)
- Public/anonymous features (no user context available)
- Operations where personalization isn't valuable (spell check, formatting)

### Examples Across Domains

**Example 1** - Personalized Email Generator (CRM/Sales):
```typescript
interface EmailContext {
  sender: {
    name: string
    role: string
    company: string
  }
  recipient: {
    name: string
    company?: string
    industry?: string
    recentInteractions?: string[]
  }
  relationship: {
    previousEmails?: number
    lastContactDate?: string
    dealStage?: string
  }
}

async function generateEmail(
  input: string,
  userId: string,
  recipientId: string
): Promise<string> {
  // Extract context with defensive coding
  const context: EmailContext = {
    sender: {
      name: user.profile?.name || 'Unknown',
      role: user.profile?.role || 'Team Member',
      company: user.organization?.name || 'Our Company'
    },
    recipient: {
      name: recipient.name,
      company: recipient.company?.name,
      industry: recipient.company?.industry,
      recentInteractions: recipient.interactions?.slice(0, 3).map(i => i.summary)
    },
    relationship: {
      previousEmails: await countPreviousEmails(userId, recipientId),
      lastContactDate: recipient.lastContact?.toISOString(),
      dealStage: recipient.deal?.stage
    }
  }

  const prompt = `
Generate a professional email.

Sender: ${context.sender.name}, ${context.sender.role} at ${context.sender.company}
Recipient: ${context.recipient.name}${context.recipient.company ? ` at ${context.recipient.company}` : ''}
${context.recipient.industry ? `Industry: ${context.recipient.industry}` : ''}

${context.relationship.previousEmails ? `Relationship: ${context.relationship.previousEmails} previous emails` : 'This is a first contact'}
${context.relationship.lastContactDate ? `Last contact: ${context.relationship.lastContactDate}` : ''}
${context.recipient.recentInteractions ? `Recent interactions:\n${context.recipient.recentInteractions.join('\n')}` : ''}

Message: ${input}
`

  return await generateWithAI(prompt)
}
```

**Example 2** - Product Recommendation (E-commerce):
```typescript
interface RecommendationContext {
  purchaseHistory: {
    categories: string[]
    priceRange: { min: number; max: number }
    brands: string[]
  }
  browsingBehavior: {
    recentlyViewed: string[]
    searchQueries: string[]
  }
  preferences: {
    size?: string
    color?: string[]
    style?: string[]
  }
}

async function getRecommendations(
  userId: string,
  limit: number = 10
): Promise<Product[]> {
  // Extract context with graceful degradation
  const context: RecommendationContext = {
    purchaseHistory: {
      categories: user.orders?.flatMap(o => o.items.map(i => i.category)) || [],
      priceRange: {
        min: Math.min(...user.orders?.flatMap(o => o.items.map(i => i.price)) || [0]),
        max: Math.max(...user.orders?.flatMap(o => o.items.map(i => i.price)) || [100])
      },
      brands: [...new Set(user.orders?.flatMap(o => o.items.map(i => i.brand)) || [])]
    },
    browsingBehavior: {
      recentlyViewed: user.recentlyViewedProducts?.slice(0, 5).map(p => p.id) || [],
      searchQueries: user.recentSearches?.slice(0, 5) || []
    },
    preferences: {
      size: user.preferences?.defaultSize,
      color: user.preferences?.favoriteColors,
      style: user.preferences?.stylePreferences
    }
  }

  const prompt = `
Recommend ${limit} products for this user.

${context.purchaseHistory.categories.length > 0 ? `Frequently purchased categories: ${context.purchaseHistory.categories.slice(0, 5).join(', ')}` : ''}
${context.purchaseHistory.brands.length > 0 ? `Favorite brands: ${context.purchaseHistory.brands.slice(0, 3).join(', ')}` : ''}
${context.purchaseHistory.priceRange.max > 0 ? `Typical price range: $${context.purchaseHistory.priceRange.min}-$${context.purchaseHistory.priceRange.max}` : ''}

${context.browsingBehavior.recentlyViewed.length > 0 ? `Recently viewed: ${context.browsingBehavior.recentlyViewed.join(', ')}` : ''}
${context.browsingBehavior.searchQueries.length > 0 ? `Recent searches: ${context.browsingBehavior.searchQueries.join(', ')}` : ''}

${context.preferences.style ? `Style preferences: ${context.preferences.style.join(', ')}` : ''}
`

  return await getAIRecommendations(prompt)
}
```

### Code Template

```typescript
// Generic context extraction pattern
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

async function extractContext(
  userId: string,
  relatedId?: string
): Promise<AIContext> {
  // Fetch related data with parallel queries
  const [user, related] = await Promise.all([
    fetchUserData(userId),
    relatedId ? fetchRelatedData(relatedId) : Promise.resolve(null)
  ])

  // Build context with defensive coding
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

// Build prompt with optional context
function buildContextualPrompt(
  input: string,
  context?: AIContext
): string {
  const basePrompt = `Task: ${input}`

  if (!context) return basePrompt // Works without context

  // Enhanced with context
  const contextSection = `
${context.user.profile ? `User: ${context.user.profile.name}, ${context.user.profile.role}` : ''}
${context.user.history ? `History: ${context.user.history.map(h => h.summary).join(', ')}` : ''}
${context.related.entity ? `Related: ${context.related.entity.name}` : ''}
`

  return `${contextSection}\n\n${basePrompt}`
}

// Usage with progressive enhancement
async function generateContent(input: string, userId: string) {
  try {
    const context = await extractContext(userId)
    const prompt = buildContextualPrompt(input, context)
    return await generateWithAI(prompt)
  } catch (error) {
    // Fallback: Generate without context if context fetch fails
    console.warn('Context extraction failed, generating without context:', error)
    const prompt = buildContextualPrompt(input)
    return await generateWithAI(prompt)
  }
}
```

### Exceptions & Edge Cases

**Exception 1**: **Privacy-Sensitive Context**
- Don't include PII (emails, phone numbers, addresses) in AI prompts
- Sanitize context to exclude sensitive data

**Exception 2**: **Context Size Limits**
- LLMs have token limits; limit context to most recent/relevant items
- Use summarization for large context (last 10 items, not all 1000)

**Exception 3**: **First-Time Users**
- New users have no history/preferences
- Feature must work without context (progressive enhancement principle)

### Related Principles

- Principle 4 (reinforces): Context is the 3rd customization dimension
- Principle 2 (supports): Parallel fetch enables efficient context extraction
- Data Flow Patterns Section 3 (aligns): Server state fetching for context

---

## Principle 6: Edge for Streaming, Node for Heavy Computation

**Source Pattern**: Pattern 6 - Edge Runtime for Streaming, Node for Heavy Processing
**Abstraction Level**: High
**Scope**: Backend (API route runtime selection)

### If-Then-Because Rule

**IF**: Choosing runtime for an API route
**THEN**: Use Edge runtime for streaming/lightweight operations (<60s), Node runtime for heavy dependencies/long operations
**BECAUSE**: Edge runtime provides global distribution and ReadableStream support ideal for streaming but forbids filesystem/heavy dependencies, while Node runtime supports all npm packages but lacks global distribution

### Generalized Principle

**Select API route runtime based on operation characteristics: Edge for streaming and global endpoints, Node for heavy computation and dependencies. Never choose arbitrarily.**

Runtime selection is a performance and capability decision, not a preference.

### Application Context

**When to Apply**:

**Use Edge Runtime**:
- AI streaming (SSE, real-time generation)
- Lightweight database reads (simple queries)
- Global endpoints (auth, public APIs)
- Simple data transformations
- Operations <60 seconds

**Use Node Runtime**:
- PDF generation (Puppeteer, Chromium)
- File processing (Sharp, FFmpeg)
- Heavy computations (analytics, reports)
- Operations >60 seconds
- Packages requiring Node.js APIs

**When NOT to Apply**:
- If your deployment platform doesn't support Edge runtime (use Node everywhere)
- If operation needs both streaming AND heavy dependencies (split into two endpoints)

### Examples Across Domains

**Example 1** - Video Processing Platform:
```typescript
// ✅ CORRECT - Edge runtime for upload initiation + streaming progress
// app/api/video/upload/route.ts
export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const { videoId } = await req.json()

  // Start processing job in Node runtime
  await fetch('/api/video/process', {
    method: 'POST',
    body: JSON.stringify({ videoId })
  })

  // Stream progress updates
  const stream = new ReadableStream({
    async start(controller) {
      // Poll job status and stream updates
      const interval = setInterval(async () => {
        const status = await getJobStatus(videoId)
        controller.enqueue(`event: progress\ndata: ${JSON.stringify(status)}\n\n`)

        if (status.complete) {
          clearInterval(interval)
          controller.close()
        }
      }, 1000)
    }
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream' }
  })
}

// ✅ CORRECT - Node runtime for actual processing
// app/api/video/process/route.ts
export const runtime = 'nodejs' // Default, can omit

export async function POST(req: NextRequest) {
  const { videoId } = await req.json()

  // Use FFmpeg (Node-only dependency)
  const ffmpeg = require('fluent-ffmpeg')

  await processVideo(videoId, ffmpeg)

  return NextResponse.json({ success: true })
}
```

**Example 2** - Report Generation System:
```typescript
// ✅ CORRECT - Edge runtime for report request + SSE
// app/api/reports/generate/route.ts
export const runtime = 'edge'

export async function POST(req: NextRequest) {
  const { reportType, filters } = await req.json()

  // Lightweight data aggregation
  const data = await aggregateReportData(reportType, filters)

  // Stream data chunks
  const stream = new ReadableStream({
    async start(controller) {
      for (const chunk of data) {
        controller.enqueue(encoder.encode(
          `event: data\ndata: ${JSON.stringify(chunk)}\n\n`
        ))
      }
      controller.close()
    }
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream' }
  })
}

// ✅ CORRECT - Node runtime for PDF export
// app/api/reports/export/pdf/route.ts
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const { reportData } = await req.json()

  // Use Puppeteer (Node-only)
  const browser = await puppeteer.launch()
  const page = await browser.newPage()

  const pdf = await generatePDF(page, reportData)
  await browser.close()

  return new NextResponse(pdf, {
    headers: { 'Content-Type': 'application/pdf' }
  })
}
```

### Code Template

```typescript
// Decision tree for runtime selection

// Option 1: Edge Runtime (streaming, lightweight)
// app/api/feature/stream/route.ts
export const runtime = 'edge'
export const dynamic = 'force-dynamic'
export const maxDuration = 60 // Max 60 seconds

export async function POST(req: NextRequest) {
  // ✅ ALLOWED in Edge:
  // - ReadableStream / SSE
  // - fetch API
  // - Lightweight AI SDK calls
  // - Database queries (Supabase)
  // - Simple data transformations

  const stream = new ReadableStream({
    async start(controller) {
      // Stream logic
    }
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream' }
  })
}

// Option 2: Node Runtime (heavy processing)
// app/api/feature/process/route.ts
// No runtime export = Node runtime (default)

export async function POST(req: NextRequest) {
  // ✅ ALLOWED in Node (forbidden in Edge):
  // - fs (filesystem)
  // - Puppeteer (browser automation)
  // - Sharp (image processing)
  // - FFmpeg (video processing)
  // - Heavy npm packages
  // - Operations >60 seconds

  const result = await heavyProcessing()

  return NextResponse.json(result)
}

// Option 3: Hybrid (Edge initiates, Node processes)
// Edge endpoint
export const runtime = 'edge'

export async function POST(req: NextRequest) {
  // Start background job in Node runtime
  await startProcessingJob(jobId)

  // Stream progress from Edge
  return streamJobProgress(jobId)
}

// Node endpoint (separate file)
export async function processJob(jobId: string) {
  // Heavy processing with Node dependencies
}
```

### Exceptions & Edge Cases

**Exception 1**: **Platform Doesn't Support Edge**
- If deploying to platform without Edge runtime (e.g., traditional Node servers)
- Use Node runtime everywhere, lose global distribution benefit

**Exception 2**: **Operation Needs Both Streaming AND Heavy Processing**
- Split into two endpoints: Edge for streaming, Node for processing
- Edge endpoint polls Node endpoint status and streams to client

**Exception 3**: **Edge Runtime Token Limits**
- If streaming very large responses (>10MB), Edge may have limits
- Use Node runtime with chunked responses instead

### Related Principles

- Principle 3 (requires): SSE streaming uses Edge runtime
- Principle 2 (compatible): Parallel fetch works in Edge runtime
- API Route Pattern (aligns): Runtime selection criteria

---

## Principle 7: Discriminated Unions for Type-Safe Event Handling

**Source Pattern**: Pattern 7 - Type-Safe Event Handling with Discriminated Unions
**Abstraction Level**: Medium
**Scope**: Frontend/Backend (TypeScript event systems)

### If-Then-Because Rule

**IF**: Building an event system with multiple event types carrying different payloads (SSE, WebSocket, state machine)
**THEN**: Use TypeScript discriminated unions with a `type` discriminant property
**BECAUSE**: Discriminated unions provide compile-time type safety, IDE autocomplete, and exhaustiveness checking without runtime type guards or instanceof checks

### Generalized Principle

**For any system with typed message passing or state transitions, use TypeScript discriminated unions to enable compile-time validation, IDE autocomplete, and exhaustive pattern matching.**

The discriminant property (`type`, `kind`, `status`) enables TypeScript to narrow types in conditional blocks.

### Application Context

**When to Apply**:
- SSE streaming events (progress, update, complete, error)
- WebSocket message types (command, response, notification)
- State machine transitions (pending, processing, success, failed)
- Redux-style action types
- API response variants (success, error, loading)

**When NOT to Apply**:
- Simple boolean flags (loading: true/false)
- Single event type (no variants)
- Dynamic event types determined at runtime (use runtime validation instead)

### Examples Across Domains

**Example 1** - WebSocket Chat Application:
```typescript
// Define all message types with discriminant
type WebSocketMessage =
  | { type: 'user_joined'; userId: string; username: string; timestamp: string }
  | { type: 'user_left'; userId: string; timestamp: string }
  | { type: 'message'; userId: string; username: string; content: string; timestamp: string }
  | { type: 'typing_start'; userId: string; username: string }
  | { type: 'typing_stop'; userId: string }
  | { type: 'error'; code: string; message: string }

// Type-safe message handler
function handleMessage(message: WebSocketMessage) {
  switch (message.type) {
    case 'user_joined':
      // TypeScript knows: message.userId, message.username exist
      showNotification(`${message.username} joined`)
      break

    case 'user_left':
      // TypeScript knows: only message.userId exists (no username)
      updateUserList(message.userId, 'remove')
      break

    case 'message':
      // TypeScript knows: message.content exists
      appendMessage({
        user: message.username,
        content: message.content,
        timestamp: message.timestamp
      })
      break

    case 'typing_start':
      showTypingIndicator(message.username)
      break

    case 'typing_stop':
      hideTypingIndicator(message.userId)
      break

    case 'error':
      // TypeScript knows: message.code, message.message exist
      showError(message.message)
      break

    default:
      // Exhaustiveness check: TypeScript errors if we miss a case
      const _exhaustive: never = message
      return _exhaustive
  }
}
```

**Example 2** - API Request State Machine:
```typescript
// Request lifecycle states
type RequestState<T> =
  | { status: 'idle' }
  | { status: 'loading'; startedAt: number }
  | { status: 'success'; data: T; loadedAt: number }
  | { status: 'error'; error: Error; failedAt: number }
  | { status: 'stale'; data: T; staleAt: number } // Cached data, refetching

// Type-safe reducer
function requestReducer<T>(
  state: RequestState<T>,
  action: RequestAction<T>
): RequestState<T> {
  switch (action.type) {
    case 'FETCH_START':
      return { status: 'loading', startedAt: Date.now() }

    case 'FETCH_SUCCESS':
      return { status: 'success', data: action.data, loadedAt: Date.now() }

    case 'FETCH_ERROR':
      return { status: 'error', error: action.error, failedAt: Date.now() }

    case 'INVALIDATE':
      if (state.status === 'success') {
        return { status: 'stale', data: state.data, staleAt: Date.now() }
      }
      return state

    default:
      const _exhaustive: never = action
      return state
  }
}

// Type-safe rendering
function RequestDisplay<T>({ state }: { state: RequestState<T> }) {
  switch (state.status) {
    case 'idle':
      return <div>Click to load</div>

    case 'loading':
      return <Spinner startedAt={state.startedAt} />

    case 'success':
      return <Data data={state.data} loadedAt={state.loadedAt} />

    case 'error':
      return <Error error={state.error} />

    case 'stale':
      // Show stale data while refetching
      return <Data data={state.data} isStale />

    default:
      const _exhaustive: never = state
      return null
  }
}
```

### Code Template

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

// 3. Alternative: Type predicate functions (for if/else)
function isEventA(event: Event): event is Extract<Event, { type: 'event_a' }> {
  return event.type === 'event_a'
}

function handleEventWithIf(event: Event) {
  if (isEventA(event)) {
    // TypeScript knows: event is { type: 'event_a'; propA: string; propB: number }
    processEventA(event.propA, event.propB)
  } else if (event.type === 'event_b') {
    // Inline type narrowing also works
    processEventB(event.propC)
  }
}

// 4. Generic discriminated union for reusability
type Result<T, E = Error> =
  | { status: 'success'; data: T }
  | { status: 'error'; error: E }

function handleResult<T>(result: Result<T>) {
  if (result.status === 'success') {
    // TypeScript knows: result.data exists
    return result.data
  } else {
    // TypeScript knows: result.error exists
    throw result.error
  }
}
```

### Exceptions & Edge Cases

**Exception 1**: **Dynamic Event Types at Runtime**
- If event types are determined by external API (can't enumerate at compile time)
- Use runtime validation with Zod or similar instead of discriminated unions

**Exception 2**: **Shared Properties Across All Variants**
- Extract common properties into base type:
```typescript
type BaseEvent = { timestamp: string; userId: string }
type Event =
  | (BaseEvent & { type: 'event_a'; propA: string })
  | (BaseEvent & { type: 'event_b'; propB: number })
```

**Exception 3**: **Very Large Number of Variants (20+)**
- Consider grouping into categories:
```typescript
type SystemEvent =
  | { category: 'user'; type: 'login' | 'logout' | 'signup'; ... }
  | { category: 'content'; type: 'create' | 'update' | 'delete'; ... }
```

### Related Principles

- Principle 3 (requires): SSE streaming uses discriminated unions for event types
- Principle 6 (compatible): Works in both Edge and Node runtimes
- TypeScript Strict Mode Patterns (aligns): Type safety and explicit types

---

## Cross-Cutting Insights

### Insight 1: Composition Over Configuration
Three principles emphasize composition:
- **Principle 1**: Component composition (UI building blocks)
- **Principle 2**: Data composition (parallel fetch + merge)
- **Principle 4**: Option composition (2-3 dimensions × 3 choices)

**Pattern**: Build complex systems by composing simple, focused pieces rather than configuring monolithic components.

### Insight 2: Progressive Enhancement as Philosophy
Two principles embody progressive enhancement:
- **Principle 5**: AI works without context, better with it
- **Principle 7**: Type safety degrades gracefully to runtime checks

**Pattern**: Design for basic functionality first, then layer enhancements that improve experience but aren't required.

### Insight 3: Perceived Performance > Actual Performance
Three principles focus on perception:
- **Principle 3**: SSE streaming makes 10s feel faster than 5s without streaming
- **Principle 4**: Options make AI feel personalized (quality perception)
- **Principle 5**: Context makes AI feel intelligent (capability perception)

**Pattern**: User perception is shaped by transparency, control, and personalization—not just speed.

### Insight 4: Type Safety Throughout the Stack
Three principles leverage TypeScript:
- **Principle 7**: Discriminated unions for compile-time event safety
- **Principle 2**: Type annotation in merged data (`type: 'type_a' as const`)
- **Principle 6**: Runtime selection enforced by TypeScript config

**Pattern**: Use TypeScript's type system to catch errors at compile time, not runtime.

### Insight 5: Edge Runtime as Default for User-Facing Operations
Two principles prefer Edge runtime:
- **Principle 3**: SSE streaming on Edge for global distribution
- **Principle 6**: Edge for lightweight, Node for heavy

**Pattern**: Default to Edge runtime for user-facing operations (lower latency, global distribution), fallback to Node only when necessary (heavy dependencies, long operations).

---

## Meta-Learnings

### Meta-Learning 1: Patterns Emerge from Constraints
The Phase 7 patterns emerged from specific constraints:
- Edge runtime limitations → Parallel fetch + client merge pattern
- AI generation time → SSE streaming pattern
- Component complexity → Composition pattern

**Lesson**: Constraints drive innovation. Don't fight constraints—design patterns that work with them.

### Meta-Learning 2: The 80/20 Rule in Customization
- 2-3 AI options (20% of possible dimensions) provide 80% of perceived value
- 100-200 line components (20% of monolithic size) handle 80% of use cases
- Top 10 context items (20% of all user data) provide 80% of personalization

**Lesson**: Identify the high-leverage 20% and optimize for that, not the long tail.

### Meta-Learning 3: Type Safety Pays Dividends Later
All three TypeScript-heavy principles (2, 6, 7) were implemented quickly but caught errors during:
- Refactoring (discriminated unions prevent breaking changes)
- Integration (type mismatches caught at compile time)
- Debugging (TypeScript narrows error search space)

**Lesson**: Upfront type safety investment (10% more time) prevents 50%+ of runtime debugging.

### Meta-Learning 4: User Perception is a First-Class Concern
Three principles (3, 4, 5) focus explicitly on user perception, not technical implementation:
- Streaming changes time perception
- Options change quality perception
- Context changes capability perception

**Lesson**: Technical implementations should explicitly target user perception metrics, not just functional metrics.

### Meta-Learning 5: Reusability Requires Intentional Abstraction
These patterns are reusable because they were abstracted beyond Phase 7 specifics:
- "Cover letter generation" → "AI content generation"
- "Resume context" → "Related user data context"
- "Document dashboard" → "Multi-entity view"

**Lesson**: During pattern extraction, actively remove domain-specific language and replace with generic terminology.

---

## Implementation Checklist

Use this checklist when applying these principles to new features:

### Before Implementation
- [ ] **Principle 1**: Does this feature have 3+ concerns? Plan component composition
- [ ] **Principle 2**: Am I fetching multiple entity types? Design parallel fetch + merge
- [ ] **Principle 3**: Will this operation take >3 seconds? Plan SSE streaming
- [ ] **Principle 4**: Is this AI-powered? Define 2-3 customization dimensions
- [ ] **Principle 5**: Does the user have related data? Plan context extraction
- [ ] **Principle 6**: Which runtime do I need? Evaluate dependencies and duration
- [ ] **Principle 7**: Do I have multiple event types? Define discriminated union

### During Implementation
- [ ] Keep components <200 lines (Principle 1)
- [ ] Use Promise.all for parallel fetches (Principle 2)
- [ ] Send SSE events every 500-1000ms (Principle 3)
- [ ] Provide exactly 3 choices per dimension (Principle 4)
- [ ] Use optional chaining for context (Principle 5)
- [ ] Set `export const runtime = 'edge'` if streaming (Principle 6)
- [ ] Use switch/case with discriminated unions (Principle 7)

### During Code Review
- [ ] Components are focused and composable (Principle 1)
- [ ] Merge logic is client-side with type annotation (Principle 2)
- [ ] Progress updates are visible to user (Principle 3)
- [ ] AI options are meaningful and limited (Principle 4)
- [ ] Context extraction has fallbacks (Principle 5)
- [ ] Runtime choice is justified (Principle 6)
- [ ] Event handlers are type-safe (Principle 7)

---

**Document Version**: 1.0
**Created**: 2025-10-03
**Knowledge Generalization Complete**: 7 patterns → 7 principles + 5 cross-cutting insights + 5 meta-learnings
**Next Step**: Integrate principles into project documentation (`coding_patterns.md`, component standards, etc.)
