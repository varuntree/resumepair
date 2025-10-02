# Data Flow Patterns

**Purpose**: Define how data moves through ResumePair, from user input to database persistence. These patterns ensure predictable state management, optimal performance, and maintainable code.

---

## Core Concept: The Data Journey

```
User Input → Client State → Server Processing → Database → Client Update
     ↑                                                            ↓
     ←────────────────── Optimistic Updates ←────────────────────
```

---

## 1. State Management Architecture

### Three Types of State

**Why**: Different state types have different lifecycles.

1. **Server State**: Database truth (documents, user, templates)
2. **Client State**: UI-specific (selectedTool, previewZoom, activeSection)
3. **Form State**: User input (fields, errors, touched, isDirty)

### State Management Rules

**Rule 1**: Server state is always fetched, never initialized locally
```typescript
// ✅ CORRECT: Fetch server state
const { data: document } = await fetchDocument(id)

// ❌ WRONG: Initialize server state locally
const document = { id: uuid(), ...defaultDocument }
```

**Rule 2**: Client state resets on navigation
```typescript
// ✅ CORRECT: Reset UI state between routes
useEffect(() => {
  return () => resetUIState()
}, [pathname])
```

**Rule 3**: Form state validates incrementally
```typescript
// ✅ CORRECT: Validate on blur, save on idle
onBlur={() => validateField(name)}
onIdle(() => autoSave())
```

---

## 2. The Zustand Store Pattern

**Why**: Zustand provides simple, performant state management without boilerplate.

### Store Pattern (Zustand + Immer)

```typescript
const useDocumentStore = create<DocumentStore>()(
  immer((set, get) => ({
    // State
    document: null,
    isDirty: false,

    // Actions (verb-prefixed)
    updateField: (path, value) => set((state) => {
      _.set(state.document, path, value)
      state.isDirty = true
    }),

    // Computed
    get canSave() {
      return get().isDirty && get().document !== null
    },
  }))
)
```

### Store Best Practices

1. **One store per domain concern**
```typescript
useDocumentStore()  // Document editing
usePreviewStore()   // Preview settings
useAIStore()       // AI assistant state
useAuthStore()     // User session
```

2. **Slice pattern for complex stores**
```typescript
const useStore = create<Store>()((...args) => ({
  ...createDocumentSlice(...args),
  ...createPreviewSlice(...args),
  ...createSettingsSlice(...args),
}))
```

3. **Actions are async-aware**
```typescript
saveDocument: async () => {
  set({ saving: true })
  try {
    const doc = get().document
    await api.saveDocument(doc)
    set({ isDirty: false, lastSaved: new Date() })
  } catch (error) {
    set({ error: error.message })
  } finally {
    set({ saving: false })
  }
}
```

---

## 3. Undo/Redo with Zundo

**Why**: Users expect undo/redo in document editors. Zundo provides temporal state management.

### Implementation Pattern

```typescript
// stores/documentStore.ts with temporal state
import { temporal } from 'zundo'

const useDocumentStore = create<DocumentStore>()(
  temporal(
    (set, get) => ({
      // Your store implementation
    }),
    {
      // Temporal options
      limit: 50, // Max undo history
      partialize: (state) => ({
        // Only track document changes, not UI state
        document: state.document
      }),
      equality: (past, current) =>
        // Debounce rapid changes
        JSON.stringify(past) === JSON.stringify(current),
    }
  )
)

// Usage in components
const undo = useDocumentStore.temporal.getState().undo
const redo = useDocumentStore.temporal.getState().redo
```

### Undo/Redo Rules

1. **Group related changes**
```typescript
// ✅ CORRECT: Group formatting changes
const applyBold = () => {
  startTransaction()
  updateField('content', addBoldMarkdown)
  updateField('lastModified', new Date())
  commitTransaction()
}

// ❌ WRONG: Each change is separate undo
updateField('content', addBoldMarkdown)
updateField('lastModified', new Date())
```

2. **Clear history on document switch**
```typescript
loadDocument: async (id) => {
  const doc = await fetchDocument(id)
  set({ document: doc })
  useDocumentStore.temporal.getState().clear()
}
```

---

## 4. Optimistic Updates

**Why**: Instant UI feedback while server processes the request.

```typescript
// Optimistic update with rollback
const updateProfile = async (updates) => {
  const previous = profile
  setProfile({ ...profile, ...updates }) // Instant UI
  try {
    const updated = await api.updateProfile(updates)
    setProfile(updated)
  } catch (error) {
    setProfile(previous) // Rollback
    toast.error("Failed to update")
  }
}
```

---

## 5. Form State Management

**Why**: Forms need special handling for validation, dirty checking, and error display.

### The Form State Machine

```typescript
type FormState =
  | { status: 'idle' }
  | { status: 'editing'; changes: Partial<T>; errors: {} }
  | { status: 'validating'; changes: Partial<T> }
  | { status: 'submitting'; data: T }
  | { status: 'success'; result: any }
  | { status: 'error'; error: Error }
```

### Form Patterns

```typescript
// Custom hook for form management
function useForm<T>(initialValues: T) {
  const [values, setValues] = useState<T>(initialValues)
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({})
  const [touched, setTouched] = useState<Set<keyof T>>(new Set())

  const handleChange = (field: keyof T) => (value: any) => {
    setValues(prev => ({ ...prev, [field]: value }))
    // Clear error on change
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const handleBlur = (field: keyof T) => () => {
    setTouched(prev => new Set(prev).add(field))
    validateField(field)
  }

  const validateField = (field: keyof T) => {
    const error = validators[field]?.(values[field])
    if (error) {
      setErrors(prev => ({ ...prev, [field]: error }))
    }
  }

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    isValid: Object.keys(errors).length === 0,
    isDirty: JSON.stringify(values) !== JSON.stringify(initialValues),
  }
}
```

---

## 6. Real-Time Sync Pattern

**Why**: Keep multiple clients in sync without polling.

### WebSocket/SSE Updates

```typescript
// Server-Sent Events for one-way updates
useEffect(() => {
  const evtSource = new EventSource(`/api/documents/${id}/subscribe`)

  evtSource.onmessage = (event) => {
    const update = JSON.parse(event.data)

    // Apply server update if no local changes
    if (!isDirty) {
      setDocument(update)
    } else {
      // Show conflict resolution UI
      setConflict({ local: document, remote: update })
    }
  }

  return () => evtSource.close()
}, [id])
```

### Conflict Resolution

```typescript
type ConflictStrategy =
  | 'local-wins'    // Keep local changes
  | 'remote-wins'   // Accept server changes
  | 'merge'         // Try to merge both
  | 'manual'        // Ask user

const resolveConflict = (strategy: ConflictStrategy) => {
  switch (strategy) {
    case 'local-wins':
      saveDocument(localDocument)
      break
    case 'remote-wins':
      setDocument(remoteDocument)
      break
    case 'merge':
      const merged = mergeDocuments(localDocument, remoteDocument)
      setDocument(merged)
      break
  }
}
```

---

## 7. Caching Strategy

**Why**: Reduce server load and improve performance.

### Cache Layers

```typescript
// 1. Memory cache (Zustand store)
const memoryCache = new Map<string, CachedItem>()

// 2. Session Storage (tabs share data)
const sessionCache = {
  get: (key: string) => JSON.parse(sessionStorage.getItem(key) || 'null'),
  set: (key: string, value: any) => sessionStorage.setItem(key, JSON.stringify(value)),
}

// 3. Local Storage (persistent)
const localCache = {
  get: (key: string) => JSON.parse(localStorage.getItem(key) || 'null'),
  set: (key: string, value: any) => localStorage.setItem(key, JSON.stringify(value)),
}

// Cache with TTL
interface CachedItem<T> {
  data: T
  timestamp: number
  ttl: number
}

const getCached = <T>(key: string): T | null => {
  const cached = memoryCache.get(key)
  if (!cached) return null

  if (Date.now() - cached.timestamp > cached.ttl) {
    memoryCache.delete(key)
    return null
  }

  return cached.data
}
```

### Cache Invalidation

```typescript
// Strategy: Tag-based invalidation
const cacheKeys = {
  document: (id: string) => `document:${id}`,
  documents: (userId: string) => `documents:${userId}`,
  template: (slug: string) => `template:${slug}`,
}

// Invalidate related caches
const saveDocument = async (doc: Document) => {
  const result = await api.save(doc)

  // Invalidate specific document
  invalidate(cacheKeys.document(doc.id))

  // Invalidate document list
  invalidate(cacheKeys.documents(doc.userId))

  return result
}
```

---

## 8. Loading States Pattern

**Why**: Users need feedback during async operations.

### Loading State Types

```typescript
// 1. Binary loading
const [loading, setLoading] = useState(false)

// 2. Granular loading
const [loadingStates, setLoadingStates] = useState({
  document: false,
  templates: false,
  ai: false,
  export: false,
})

// 3. Progress loading
const [progress, setProgress] = useState({
  status: 'idle' | 'loading' | 'complete' | 'error',
  percent: 0,
  message: '',
})
```

### Skeleton Loading Pattern

```typescript
// Show skeleton while loading
if (loading) {
  return <DocumentSkeleton />
}

// DocumentSkeleton matches the shape of real content
const DocumentSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-8 bg-gray-200 rounded w-3/4 mb-4" />
    <div className="h-4 bg-gray-200 rounded w-full mb-2" />
    <div className="h-4 bg-gray-200 rounded w-5/6 mb-2" />
  </div>
)
```

---

## 9. Error Handling Flow

**Why**: Errors should be caught, logged, and presented appropriately.

### Error Boundary Pattern

```typescript
// Global error boundary
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to error reporting service
    console.error('Error boundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />
    }

    return this.props.children
  }
}
```

### Async Error Pattern

```typescript
// Hook for async error handling
const useAsyncError = () => {
  const [error, setError] = useState<Error | null>(null)

  const execute = useCallback(async (asyncFunction: () => Promise<any>) => {
    try {
      setError(null)
      return await asyncFunction()
    } catch (err) {
      setError(err as Error)
      throw err
    }
  }, [])

  return { error, execute }
}
```

---

## 10. Performance Patterns

```typescript
// Debounce saves (2s), throttle previews (100ms)
const debouncedSave = useMemo(() => debounce(saveDocument, 2000), [])
const throttledPreview = useMemo(() => throttle(updatePreview, 100), [])

// Memoize expensive operations
const score = useMemo(() => calculateScore(document), [document])
```

---

## 11. Rate Limiting Pattern

**Why**: Protect expensive resources (AI, exports) from abuse while maintaining good UX.

**Principle**: Start with client-side protection, add server-side only when needed.

### Standard Implementation

```typescript
// Rate Limit Store Pattern
interface RateLimitConfig {
  maxAttempts: number
  windowMs: number
  identifier: string
}

// Client-side rate limiting (browser memory + localStorage)
const createRateLimiter = (config: RateLimitConfig) => {
  return {
    canAttempt: (): boolean => {
      const attempts = getAttempts(config.identifier)
      const window = getWindow(config.identifier)
      return attempts.length < config.maxAttempts
    },

    recordAttempt: (): void => {
      const attempts = getAttempts(config.identifier)
      attempts.push(Date.now())
      saveAttempts(config.identifier, attempts)
    },

    getRemainingTime: (): number => {
      const attempts = getAttempts(config.identifier)
      if (attempts.length < config.maxAttempts) return 0
      const oldestValid = Date.now() - config.windowMs
      const nextAvailable = attempts.find(t => t > oldestValid)
      return nextAvailable ? nextAvailable + config.windowMs - Date.now() : 0
    },

    reset: (): void => {
      clearAttempts(config.identifier)
    }
  }
}

// Usage example
const aiLimiter = createRateLimiter({
  maxAttempts: 3,
  windowMs: 60000, // 1 minute
  identifier: 'ai-generate'
})

if (!aiLimiter.canAttempt()) {
  const waitTime = aiLimiter.getRemainingTime()
  throw new Error(`Please wait ${Math.ceil(waitTime / 1000)} seconds`)
}
```

### Rate Limiting Rules

1. **Always implement client-side first** (immediate UX feedback)
2. **Use exponential backoff for retries** (1s, 2s, 4s, 8s...)
3. **Show clear feedback** ("Try again in 30 seconds")
4. **Different limits for different operations** (AI: strict, Save: lenient)
5. **Track per-feature, not global** (AI limit doesn't affect exports)

### Rate Limit Hierarchy

- **Tier 1**: UI disabled state (instant)
- **Tier 2**: Browser memory check (milliseconds)
- **Tier 3**: localStorage check (milliseconds)
- **Tier 4**: Server check (future, when needed)

### Operation-Specific Limits

```typescript
const RATE_LIMITS = {
  AI_GENERATE: { max: 3, window: 60000 },      // 3 per minute
  AI_EXTRACT: { max: 1, window: 30000 },       // 1 per 30s
  PDF_EXPORT: { max: 5, window: 60000 },       // 5 per minute
  AUTO_SAVE: { max: 1, window: 2000 },         // 1 per 2s
  SCORE_CALC: { max: 10, window: 60000 },      // 10 per minute
}
```

---

## 12. Strategic Caching Pattern

**Why**: Reduce unnecessary API calls and improve perceived performance without external dependencies.

**Principle**: Cache where it's cheap and effective - the browser.

### Cache Decision Matrix

| Data Type | Cache? | Where | TTL | Why |
|-----------|--------|-------|-----|------|
| Active edits | Yes | Memory (Zustand) | Session | Core UX |
| AI responses | Yes | Memory | 5 min | Expensive |
| Templates | Optional | SessionStorage | 1 hour | Rarely change |
| User prefs | Yes | LocalStorage | Forever | Personal |
| Scores | Yes | Memory | Until change | Deterministic |
| Documents list | No | - | - | Needs freshness |
| Export preview | Yes | Memory | Until change | CPU intensive |

### Cache Rules

1. **No server-side caching in v1** (serverless = no shared memory)
2. **Cache computed values, not raw data** (cache the score, not the algorithm)
3. **User actions always bypass cache** (explicit refresh = fresh data)
4. **Cache keys include version** (schema changes = cache bust)
5. **Memory cache dies on navigation** (that's fine!)

### Implementation Standard

```typescript
// Standard cache wrapper
interface CacheStrategy {
  storage: 'memory' | 'session' | 'local'
  ttl: number
  key: string
  version: number
}

// Every cached operation follows this pattern
const withCache = async <T>(
  fetcher: () => Promise<T>,
  strategy: CacheStrategy
): Promise<T> => {
  const cacheKey = `${strategy.key}_v${strategy.version}`

  // Check cache first
  const cached = getFromCache(cacheKey, strategy.storage)
  if (cached && !isExpired(cached, strategy.ttl)) {
    return cached.data
  }

  // Fetch fresh
  const fresh = await fetcher()

  // Update cache
  setInCache(cacheKey, fresh, strategy.storage)

  return fresh
}

// Usage
const templates = await withCache(
  () => fetch('/api/templates').then(r => r.json()),
  {
    storage: 'session',
    ttl: 3600000, // 1 hour
    key: 'templates',
    version: 1
  }
)
```

### Cache Invalidation Strategy

```typescript
// Version-based invalidation
const CACHE_VERSIONS = {
  templates: 1,
  resume_schema: 2,
  cover_letter_schema: 1,
}

// When schema changes, bump version
// Old cache automatically ignored

// Manual invalidation
const invalidateCache = (pattern: string) => {
  // Memory
  store.setState({ [pattern]: null })

  // SessionStorage
  Object.keys(sessionStorage)
    .filter(key => key.includes(pattern))
    .forEach(key => sessionStorage.removeItem(key))

  // LocalStorage (be careful!)
  Object.keys(localStorage)
    .filter(key => key.includes(pattern))
    .forEach(key => localStorage.removeItem(key))
}
```

---

## 13. Serverless Constraints

**Why**: Serverless architecture has unique constraints we must design around.

### Reality Checks

- ❌ **No persistent memory between requests**
- ❌ **No websockets** (without additional services)
- ❌ **No background jobs** (without queues)
- ✅ **Infinite scaling** (with cold starts)
- ✅ **Pay per use**
- ✅ **No server maintenance**

### Adapted Patterns

1. **Stateless Everything**
```typescript
// ✅ CORRECT: Stateless handler
export async function POST(req: Request) {
  const data = await req.json()
  const result = await process(data)
  return Response.json(result)
}

// ❌ WRONG: Stateful handler
let cache = {} // Dies after request!
export async function POST(req: Request) {
  cache[key] = value // Pointless!
}
```

2. **Client Holds State**
```typescript
// Browser is our memory
const useAppState = create((set) => ({
  // This persists across API calls
  documents: [],
  activeDocument: null,
  preferences: {},
}))
```

3. **Idempotent APIs**
```typescript
// Same request = same result
// Use unique IDs client-side
const createDocument = async (document) => {
  const id = crypto.randomUUID() // Client generates ID
  return await api.put(`/documents/${id}`, document)
  // PUT is idempotent, POST is not
}
```

4. **Optimistic UI**
```typescript
// Don't wait for server confirmation
const updateDocument = (updates) => {
  // Update UI immediately
  setDocument({ ...document, ...updates })

  // Sync with server in background
  api.updateDocument(updates).catch(error => {
    // Rollback on failure
    setDocument(document)
    toast.error('Failed to save')
  })
}
```

---

## 14. Cost-Conscious Patterns

**Why**: Free tier / indie hacker constraints require different patterns than enterprise.

### Standards for Each Resource

**1. AI Calls**
```typescript
const AI_LIMITS = {
  FREE_TIER: {
    perMinute: 3,
    perDay: 100,
    cooldown: 20000, // 20 seconds between calls
  }
}

// Show cost to user
const showAIUsage = () => {
  const used = getTodayUsage()
  const remaining = AI_LIMITS.FREE_TIER.perDay - used
  return `${remaining} AI generations remaining today`
}
```

**2. File Operations**
```typescript
// Process client-side when possible
const optimizeImage = async (file: File) => {
  // Resize on client before upload
  if (file.size > 1_000_000) { // 1MB
    return await resizeInBrowser(file, { maxWidth: 1200 })
  }
  return file
}

// Stream large files
const exportLargeDocument = async () => {
  const response = await fetch('/api/export', {
    method: 'POST',
    body: JSON.stringify({ id: documentId })
  })

  // Stream to user, don't buffer
  const blob = await response.blob()
  downloadBlob(blob, 'resume.pdf')
}
```

**3. Database Reads**
```typescript
// Fetch once, update optimistically
const documentsStore = create((set, get) => ({
  documents: null,
  lastFetch: 0,

  fetchDocuments: async (force = false) => {
    const timeSince = Date.now() - get().lastFetch

    // Don't refetch within 30 seconds unless forced
    if (!force && timeSince < 30000 && get().documents) {
      return get().documents
    }

    const docs = await api.getDocuments({ limit: 10 }) // Paginate
    set({ documents: docs, lastFetch: Date.now() })
    return docs
  }
}))
```

### The Smart Client, Dumb Server Principle

```typescript
// CLIENT (smart) - Does the heavy lifting
const generateResume = async (input) => {
  // Validation
  const errors = validateInput(input)
  if (errors.length) return showErrors(errors)

  // Rate limiting
  if (!canCallAI()) return showRateLimit()

  // Formatting
  const formatted = formatForAI(input)

  // Single simple request to server
  const result = await api.generate(formatted)

  // Post-processing
  return processResult(result)
}

// SERVER (dumb) - Just proxies to AI
export async function POST(req: Request) {
  const data = await req.json()
  const result = await callGemini(data)
  return Response.json(result)
}
```

---

## 15. Database-Backed Queue Pattern

**Why**: Serverless needs persistent job queues without external dependencies like Redis.

**Principle**: Use Postgres with `FOR UPDATE SKIP LOCKED` for atomic job claiming.

### The Problem with Serverless Queues

```
Traditional Queue:         Serverless Reality:
Redis/BullMQ      →       No persistent memory
Background workers →       Functions are stateless
Job locking       →       Need database-level locking
```

### The Solution: Postgres Queue

```sql
-- Export jobs table with queue semantics
CREATE TABLE export_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  document_id UUID NOT NULL REFERENCES resumes(id),

  -- Queue fields
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  next_retry_at TIMESTAMPTZ,

  -- Job data
  template_id TEXT NOT NULL,
  options JSONB DEFAULT '{}'::jsonb,

  -- Progress tracking
  progress INTEGER DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),

  -- Results
  result_url TEXT,
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Indexes for queue operations
  INDEX idx_export_jobs_pending ON export_jobs(user_id, status, created_at)
    WHERE status = 'pending',
  INDEX idx_export_jobs_retry ON export_jobs(next_retry_at)
    WHERE status = 'pending' AND next_retry_at IS NOT NULL
);
```

### Atomic Job Claiming Function

```sql
-- Database function for race-free job claiming
CREATE OR REPLACE FUNCTION fetch_next_export_job(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  document_id UUID,
  template_id TEXT,
  options JSONB,
  retry_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ej.id,
    ej.user_id,
    ej.document_id,
    ej.template_id,
    ej.options,
    ej.retry_count
  FROM export_jobs ej
  WHERE ej.user_id = p_user_id
    AND ej.status = 'pending'
    AND (ej.next_retry_at IS NULL OR ej.next_retry_at <= NOW())
  ORDER BY ej.created_at ASC
  FOR UPDATE SKIP LOCKED  -- Critical: Prevents race conditions
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;
```

### Queue Operations

**1. Enqueue Job**
```typescript
export async function createExportJob(
  supabase: SupabaseClient,
  job: {
    user_id: string
    document_id: string
    template_id: string
    options?: Record<string, any>
  }
): Promise<ExportJob> {
  const { data, error } = await supabase
    .from('export_jobs')
    .insert({
      user_id: job.user_id,
      document_id: job.document_id,
      template_id: job.template_id,
      options: job.options ?? {},
      status: 'pending',
      progress: 0,
    })
    .select()
    .single()

  if (error) throw error
  return data
}
```

**2. Claim Job (Atomic)**
```typescript
export async function claimNextPendingJob(
  supabase: SupabaseClient,
  userId: string
): Promise<ExportJob | null> {
  // Call database function for atomic claim
  const { data, error } = await supabase
    .rpc('fetch_next_export_job', { p_user_id: userId })

  if (error) throw error
  if (!data || data.length === 0) return null

  const job = data[0]

  // Mark as processing
  await supabase
    .from('export_jobs')
    .update({
      status: 'processing',
      started_at: new Date().toISOString(),
    })
    .eq('id', job.id)

  return job
}
```

**3. Complete Job**
```typescript
export async function completeJob(
  supabase: SupabaseClient,
  jobId: string,
  resultUrl: string
): Promise<void> {
  const { error } = await supabase
    .from('export_jobs')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      result_url: resultUrl,
      progress: 100,
    })
    .eq('id', jobId)

  if (error) throw error
}
```

**4. Fail Job with Retry**
```typescript
export async function failJob(
  supabase: SupabaseClient,
  jobId: string,
  error: Error,
  currentRetryCount: number,
  maxRetries: number = 3
): Promise<void> {
  const shouldRetry = currentRetryCount < maxRetries

  if (shouldRetry) {
    // Exponential backoff: 1min, 2min, 4min, 8min, etc.
    const nextRetryDelay = calculateRetryDelay(currentRetryCount + 1)

    await supabase
      .from('export_jobs')
      .update({
        status: 'pending',
        retry_count: currentRetryCount + 1,
        next_retry_at: new Date(Date.now() + nextRetryDelay).toISOString(),
        error_message: error.message,
      })
      .eq('id', jobId)
  } else {
    // Max retries reached
    await supabase
      .from('export_jobs')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_message: error.message,
      })
      .eq('id', jobId)
  }
}

function calculateRetryDelay(attemptNumber: number): number {
  const baseDelay = 60000 // 1 minute
  const maxDelay = 3600000 // 60 minutes
  const jitter = Math.random() * 5000 // 0-5 seconds

  return Math.min(
    Math.pow(2, attemptNumber - 1) * baseDelay + jitter,
    maxDelay
  )
}
```

### Queue Processor

```typescript
// Edge function or API route that processes queue
export async function processExportQueue(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  // Claim next job atomically
  const job = await claimNextPendingJob(supabase, userId)

  if (!job) {
    console.log('No pending jobs for user:', userId)
    return
  }

  try {
    // Process the job
    const document = await getDocument(supabase, job.document_id, userId)
    const pdfBuffer = await generatePDF(document.data, job.template_id, job.options)

    // Upload to storage
    const fileName = `${job.document_id}_${Date.now()}.pdf`
    const filePath = `${userId}/${fileName}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('exports')
      .upload(filePath, pdfBuffer, { contentType: 'application/pdf' })

    if (uploadError) throw uploadError

    // Get signed URL
    const { data: urlData } = await supabase.storage
      .from('exports')
      .createSignedUrl(filePath, 604800) // 7 days

    // Complete job
    await completeJob(supabase, job.id, urlData.signedUrl)
  } catch (error) {
    // Fail job with retry logic
    await failJob(supabase, job.id, error as Error, job.retry_count)
  }
}
```

### Queue Benefits

**✅ Advantages:**
- No external dependencies (uses existing Postgres)
- Serverless-compatible (stateless functions)
- Atomic job claiming (`FOR UPDATE SKIP LOCKED`)
- Built-in retry logic with exponential backoff
- Persistent across cold starts
- Easy to debug (SQL queries visible)
- Simple implementation (~200 LOC vs 2000+ in pg-boss)

**✅ Use Cases:**
- PDF export jobs
- Email sending queues
- AI processing jobs
- Batch operations
- Background tasks

**✅ Performance:**
- Handles 100s of jobs/second for typical workloads
- Postgres index on (status, created_at) makes claim O(log n)
- `SKIP LOCKED` prevents contention between workers

### Queue Monitoring

```typescript
// Get queue statistics
export async function getQueueStats(
  supabase: SupabaseClient,
  userId: string
): Promise<{
  pending: number
  processing: number
  completed: number
  failed: number
}> {
  const { data } = await supabase
    .from('export_jobs')
    .select('status')
    .eq('user_id', userId)

  const stats = {
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
  }

  data?.forEach(job => {
    stats[job.status]++
  })

  return stats
}
```

### Queue Cleanup

```typescript
// Cleanup old completed jobs (cron job)
export async function cleanupOldJobs(
  supabase: SupabaseClient,
  daysToKeep: number = 30
): Promise<void> {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

  await supabase
    .from('export_jobs')
    .delete()
    .in('status', ['completed', 'failed'])
    .lt('completed_at', cutoffDate.toISOString())
}
```

---

## Data Flow Checklist

Before implementing any data flow:

- [ ] Identify state type (server/client/form)
- [ ] Define the complete data journey
- [ ] Plan optimistic updates with rollback
- [ ] Set up proper error boundaries
- [ ] Implement loading states
- [ ] Add undo/redo if applicable
- [ ] Define cache strategy and TTL
- [ ] Debounce/throttle expensive operations
- [ ] Validate at appropriate boundaries
- [ ] Handle conflicts for concurrent edits

---

## Key Patterns from Production Apps

**Novel Editor**: RAF-based preview updates for smooth editing
**Cal.com**: tRPC for type-safe data flow
**Vercel Template**: Parallel data fetching with Promise.all()

**Core Principle**: Predictable, debuggable, performant, resilient data flow.

---

**Next Document**: Component Standards (how to build consistent, reusable UI components)