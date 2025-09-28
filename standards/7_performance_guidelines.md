# Performance Guidelines

**Purpose**: Define performance standards and optimization strategies for ResumePair. Fast applications delight users; slow applications lose them.

---

## Core Performance Principles

**Performance is a Feature, Not an Afterthought**

1. **Measure First** - Never optimize blindly
2. **Optimize the Critical Path** - Focus on what users experience most
3. **Progressive Enhancement** - Fast core experience, enhanced features layer on top
4. **Perceived Performance** - How fast it feels matters more than actual speed

---

## 1. Performance Budgets

### Target Metrics (from PRD)

| Metric | Target | Measurement |
|--------|--------|-------------|
| Preview Update | < 120ms | Keystroke to visual change |
| AI First Token | < 1s | Request to first streamed token |
| PDF Export | < 2.5s | Click to download (2 pages) |
| DOCX Export | < 1.5s | Click to download |
| Page Load (FCP) | < 1.5s | First Contentful Paint |
| Time to Interactive | < 3s | Page fully interactive |
| Bundle Size | < 200KB | Initial JavaScript |

### Monitoring Performance

```typescript
// Custom performance observer
export function measurePerformance(metricName: string, fn: () => void) {
  const start = performance.now()
  fn()
  const end = performance.now()
  const duration = end - start

  // Log if over budget
  const budget = PERFORMANCE_BUDGETS[metricName]
  if (budget && duration > budget) {
    console.warn(`Performance budget exceeded: ${metricName} took ${duration}ms (budget: ${budget}ms)`)
  }

  // Report to analytics (in production)
  if (process.env.NODE_ENV === 'production') {
    reportMetric(metricName, duration)
  }
}
```

---

## 2. Frontend Performance

### Core Optimizations

- [ ] **Code Splitting**: Dynamic imports for heavy components
```typescript
const PDFViewer = dynamic(() => import('@/components/PDFViewer'), {
  loading: () => <Skeleton />,
  ssr: false
})
```

- [ ] **Parallel Data Fetching** (from Vercel):
```typescript
const [user, docs] = await Promise.all([getUser(), getDocs()])
```

- [ ] **RAF-Based Updates** (from Novel):
```typescript
class PreviewOptimizer {
  scheduleUpdate(content) {
    cancelAnimationFrame(this.rafId)
    this.rafId = requestAnimationFrame(() => {
      if (performance.now() - this.lastUpdate > 16) { // 60fps
        this.updatePreview(content)
      }
    })
  }
}
```

### React Performance Rules

- [ ] **Measure First**: Use React DevTools Profiler before optimizing
- [ ] **Memo Strategically**: Only for expensive renders, not everything
- [ ] **Virtual Scrolling**: For lists > 100 items
- [ ] **Debounce/Throttle**:
  - Debounce: Saves (2s), Search (300ms)
  - Throttle: Scroll (100ms), Resize (200ms)
  - RAF: Preview updates (16ms for 60fps)

### Image Optimization

- [ ] **Next.js Image Component**
```typescript
import Image from 'next/image'

// ✅ CORRECT: Optimized loading
<Image
  src="/avatar.jpg"
  width={100}
  height={100}
  loading="lazy"        // Lazy load
  placeholder="blur"    // Show blur while loading
  blurDataURL={base64}  // Tiny placeholder
  alt="User avatar"
/>

// ❌ WRONG: Unoptimized
<img src="/huge-image.jpg" />
```

- [ ] **Responsive Images**
```typescript
<Image
  src="/hero.jpg"
  sizes="(max-width: 768px) 100vw,
         (max-width: 1200px) 50vw,
         33vw"
  fill
  style={{ objectFit: 'cover' }}
  alt="Hero"
/>
```

---

## 3. Backend Performance

### Database Optimization

- [ ] **Efficient Queries**
```typescript
// ✅ CORRECT: Select only needed fields
const documents = await supabase
  .from('documents')
  .select('id, title, updatedAt') // Only what you need
  .eq('userId', userId)
  .order('updatedAt', { ascending: false })
  .limit(20)

// ❌ WRONG: Over-fetching
const documents = await supabase
  .from('documents')
  .select('*') // Fetches entire document content
```

- [ ] **Pagination**
```typescript
// Cursor-based pagination (more efficient than offset)
const getDocuments = async (cursor?: string) => {
  let query = supabase
    .from('documents')
    .select('id, title, updatedAt')
    .order('createdAt', { ascending: false })
    .limit(20)

  if (cursor) {
    query = query.lt('createdAt', cursor)
  }

  return await query
}
```

- [ ] **Indexing Strategy**
```sql
-- Add indexes for common queries
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_created_at ON documents(created_at DESC);
CREATE INDEX idx_documents_user_created ON documents(user_id, created_at DESC);
```

### API Response Optimization

- [ ] **Response Compression**
```typescript
// Next.js handles gzip automatically
// But for large responses, consider streaming

export async function GET() {
  const stream = new ReadableStream({
    async start(controller) {
      const documents = await getDocuments()

      for (const doc of documents) {
        controller.enqueue(JSON.stringify(doc) + '\n')
      }

      controller.close()
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson',
      'Cache-Control': 'no-cache',
    }
  })
}
```

- [ ] **Caching Strategy**
```typescript
// Cache templates (rarely change)
export async function GET() {
  const templates = await getTemplates()

  return new Response(JSON.stringify(templates), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      'ETag': generateETag(templates),
    }
  })
}

// Don't cache user data
export async function GET() {
  const userData = await getUserData()

  return new Response(JSON.stringify(userData), {
    headers: {
      'Cache-Control': 'private, no-cache, no-store, must-revalidate',
    }
  })
}
```

---

## 4. Editor Performance Patterns

### Update Batching
```typescript
class UpdateBatcher {
  private queue: Change[] = []
  scheduleUpdate(change: Change) {
    this.queue.push(change)
    if (!this.rafId) {
      this.rafId = requestAnimationFrame(() => {
        this.flush() // Apply all changes at once
      })
    }
  }
}
```

### Performance Monitoring
```typescript
// Detect expensive operations
if (items.length > 1000 && isNestedLoop) {
  console.warn('Performance: O(n²) detected, consider optimization')
}
```

---

## 5. AI Performance

### Streaming Responses

```typescript
// Stream AI responses for better perceived performance
export async function POST(req: Request) {
  const { prompt } = await req.json()

  const stream = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }],
    stream: true,
  })

  // Return streaming response
  return new Response(
    new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content || ''
          controller.enqueue(new TextEncoder().encode(text))
        }
        controller.close()
      }
    }),
    {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
      }
    }
  )
}
```

### Caching AI Responses

```typescript
// Cache similar AI requests
const aiCache = new Map()

const getCachedOrGenerate = async (prompt: string) => {
  // Create cache key from prompt
  const cacheKey = hashPrompt(prompt)

  // Check cache
  if (aiCache.has(cacheKey)) {
    const cached = aiCache.get(cacheKey)
    if (Date.now() - cached.timestamp < 3600000) { // 1 hour
      return cached.response
    }
  }

  // Generate new response
  const response = await generateAIResponse(prompt)

  // Cache it
  aiCache.set(cacheKey, {
    response,
    timestamp: Date.now()
  })

  return response
}
```

---

## 6. Export Performance

### Optimized PDF Generation
```typescript
const browser = await puppeteer.launch({
  args: ['--single-process', '--no-sandbox'], // Serverless optimized
})

// Pre-render HTML, disable JS for static content
await page.setJavaScriptEnabled(false)
await page.setContent(html, { waitUntil: 'domcontentloaded' })
```

### Timeout Protection (from Cal.com)
```typescript
// Add timeout for expensive operations
Promise.race([
  generatePDF(document),
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error('PDF timeout')), 30000)
  )
])
```

---

## 7. Loading States & Perceived Performance

### Skeleton Screens

```typescript
// Show structure immediately
const DocumentSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-8 bg-gray-200 rounded w-3/4 mb-4" />
    <div className="h-4 bg-gray-200 rounded w-full mb-2" />
    <div className="h-4 bg-gray-200 rounded w-5/6 mb-2" />
  </div>
)

// Use while loading
function DocumentEditor({ id }) {
  const { data, isLoading } = useDocument(id)

  if (isLoading) return <DocumentSkeleton />
  return <ActualEditor data={data} />
}
```

### Optimistic Updates

```typescript
// Update UI immediately, sync later
const updateDocument = async (updates: Partial<ResumeJson>) => {
  // Optimistic update
  setDocument(prev => ({ ...prev, ...updates }))

  try {
    // Sync with server
    await api.updateDocument(id, updates)
  } catch (error) {
    // Rollback on failure
    setDocument(previousDocument)
    toast.error('Failed to save changes')
  }
}
```

---

## 8. Memory Management

### Cleanup Patterns

```typescript
// Clean up resources
useEffect(() => {
  const timer = setInterval(poll, 1000)
  const handler = (e) => handleResize(e)
  window.addEventListener('resize', handler)

  return () => {
    clearInterval(timer)
    window.removeEventListener('resize', handler)
  }
}, [])

// Clean up large objects
useEffect(() => {
  return () => {
    // Clear large data from memory
    largeImageBlob = null
    URL.revokeObjectURL(objectUrl)
  }
}, [])
```

### Memory-Efficient Patterns

```typescript
// Use WeakMap for metadata
const metadata = new WeakMap()

// Will be garbage collected when document is removed
metadata.set(document, { loaded: Date.now() })

// Stream large files instead of loading fully
const processLargeFile = async (file: File) => {
  const stream = file.stream()
  const reader = stream.getReader()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    processChunk(value)
  }
}
```

---

## Performance Checklist

### Before Every Feature:
- [ ] Set performance budget
- [ ] Plan loading states
- [ ] Consider code splitting
- [ ] Plan for slow networks

### During Development:
- [ ] Measure actual performance
- [ ] Use React DevTools Profiler
- [ ] Check bundle size impact
- [ ] Test on slow devices

### Before Deployment:
- [ ] Run Lighthouse audit
- [ ] Check Core Web Vitals
- [ ] Verify lazy loading works
- [ ] Test with throttled network

### Monitoring:
- [ ] Track real user metrics
- [ ] Monitor API response times
- [ ] Check error rates
- [ ] Review performance trends

---

## Performance Insights

**Novel**: RAF-based updates, extension architecture for performance
**Cal.com**: Algorithmic complexity monitoring, interval trees
**Vercel**: Parallel data fetching, simple optimizations

**Core Rule**: Measure first, optimize the critical path, perceived > actual speed.

---

**Next Document**: Code Review Standards (ensuring quality and consistency)