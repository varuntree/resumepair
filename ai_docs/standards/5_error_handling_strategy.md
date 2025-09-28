# Error Handling Strategy

**Purpose**: Define how ResumePair handles, reports, and recovers from errors at every level. Good error handling is the difference between a frustrating and delightful user experience.

---

## Core Philosophy

**Fail Fast, Recover Gracefully, Learn Always**

1. **Detect** errors early (validation at boundaries)
2. **Handle** errors appropriately (user vs system)
3. **Recover** when possible (fallbacks and retries)
4. **Report** for improvement (logging and monitoring)

---

## 1. Error Categories

### User Errors (Expected)

```typescript
// These are not bugs - they're expected user mistakes
type UserError =
  | ValidationError     // Invalid input
  | BusinessRuleError   // Can't delete last admin
  | QuotaError         // Exceeded limits
  | AuthError          // Not logged in
```

### System Errors (Unexpected)

```typescript
// These are bugs or infrastructure issues
type SystemError =
  | NetworkError       // API unreachable
  | DatabaseError      // Query failed
  | ServiceError       // AI API down
  | UnknownError      // Truly unexpected
```

### Error Response Strategy

| Error Type | User Sees | Log Level | Action |
|------------|-----------|-----------|--------|
| Validation | Specific message | None | Show inline |
| Business Rule | Explanation | Info | Show toast |
| Network | "Try again" | Warning | Retry automatically |
| System | Generic message | Error | Alert developers |

---

## 2. Frontend Error Handling

### Practical Error Boundaries (from Vercel/Novel)

```typescript
// Only wrap components that can actually fail
<ErrorBoundary fallback={<SimpleMessage />}>
  <AIAssistant />  // External API calls
</ErrorBoundary>

<ErrorBoundary fallback={<BasicEditor />}>
  <RichTextEditor />  // Complex component
</ErrorBoundary>

// Don't wrap simple components - over-engineering
```

### Async Error Handling

```typescript
// Custom hook for async operations
export function useAsync<T>() {
  const [state, setState] = useState<{
    status: 'idle' | 'loading' | 'success' | 'error'
    data?: T
    error?: Error
  }>({ status: 'idle' })

  const execute = useCallback(async (asyncFunction: () => Promise<T>) => {
    setState({ status: 'loading' })
    try {
      const data = await asyncFunction()
      setState({ status: 'success', data })
      return data
    } catch (error) {
      setState({ status: 'error', error: error as Error })
      throw error
    }
  }, [])

  return { ...state, execute }
}

// Usage
function DocumentList() {
  const { status, data, error, execute } = useAsync<Document[]>()

  useEffect(() => {
    execute(() => api.getDocuments())
  }, [])

  if (status === 'error') {
    return <ErrorMessage error={error} retry={() => execute(...)} />
  }

  // ... render documents
}
```

### Form Validation Errors

```typescript
// Inline validation with helpful messages
const FormField = ({ name, validation, ...props }) => {
  const [error, setError] = useState<string>()
  const [touched, setTouched] = useState(false)

  const validate = (value: string) => {
    try {
      validation.parse(value)
      setError(undefined)
    } catch (e) {
      if (touched) { // Only show after interaction
        setError(e.message)
      }
    }
  }

  return (
    <div>
      <input
        onBlur={() => setTouched(true)}
        onChange={(e) => validate(e.target.value)}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : undefined}
        {...props}
      />
      {error && (
        <p id={`${name}-error`} className="text-sm text-destructive mt-1">
          {error}
        </p>
      )}
    </div>
  )
}
```

---

## 3. Backend Error Handling

### API Route Error Handler

```typescript
// libs/api-utils/errorHandler.ts
export async function withErrorHandler(
  handler: (req: Request, context: any) => Promise<Response>
) {
  return async (req: Request, context: any) => {
    try {
      return await handler(req, context)
    } catch (error) {
      // Known errors
      if (error instanceof ValidationError) {
        return apiError('VALIDATION_ERROR', error.message, 400)
      }

      if (error instanceof AuthError) {
        return apiError('UNAUTHORIZED', error.message, 401)
      }

      if (error instanceof QuotaError) {
        return apiError('QUOTA_EXCEEDED', error.message, 402)
      }

      // Database errors
      if (error.code === 'P2002') { // Prisma unique constraint
        return apiError('DUPLICATE_ENTRY', 'This already exists', 409)
      }

      // Default to 500
      console.error('Unhandled error:', error)
      return apiError('INTERNAL_ERROR', 'Something went wrong', 500)
    }
  }
}
```

### Service Layer Errors

```typescript
// Use Result type for operations that can fail
type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E }

// Repository example
export async function createDocument(
  data: CreateDocumentDto
): Promise<Result<Document>> {
  try {
    // Validate business rules
    if (await hasReachedDocumentLimit(data.userId)) {
      return {
        success: false,
        error: new QuotaError('Document limit reached')
      }
    }

    const document = await db.document.create({ data })
    return { success: true, data: document }
  } catch (error) {
    return { success: false, error }
  }
}

// Usage in API route
const result = await createDocument(data)
if (!result.success) {
  return handleError(result.error)
}
return apiSuccess(result.data)
```

---

## 4. Network & Retry Strategy

### Smart Retry with Timeout Protection (from Cal.com)

```typescript
async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  options = { maxAttempts: 3, initialDelay: 1000, timeout: 30000 }
): Promise<T> {
  // Add timeout protection for O(n²) operations
  const withTimeout = Promise.race([
    fn(),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), options.timeout)
    )
  ])

  // Exponential backoff: 1s, 2s, 4s
  for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
    try {
      return await withTimeout
    } catch (error) {
      if (error.status >= 400 && error.status < 500) throw error // Don't retry client errors
      if (attempt < options.maxAttempts) {
        await new Promise(r => setTimeout(r, options.initialDelay * Math.pow(2, attempt - 1)))
      }
    }
  }
}
```

### Network Status Detection

```typescript
// Hook to detect network status
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}

// Show offline banner
function App() {
  const isOnline = useNetworkStatus()

  return (
    <>
      {!isOnline && (
        <div className="bg-warning text-center p-2">
          You're offline. Changes will sync when connection returns.
        </div>
      )}
      {/* Rest of app */}
    </>
  )
}
```

---

## 5. AI Service Error Handling

### Enhanced Error Classification (from Cal.com)

```typescript
enum ErrorSeverity {
  LOW = 'low',       // Log only
  MEDIUM = 'medium', // Show toast
  HIGH = 'high',     // Show modal
  CRITICAL = 'critical' // Block operation
}

// Graceful degradation with severity
async function enhanceWithAI(content: string): Promise<Enhancement> {
  try {
    return await ai.enhance(content)
  } catch (error) {
    const severity = classifyError(error)

    if (severity === ErrorSeverity.LOW) {
      // Silent fallback
      return basicEnhancement(content)
    } else if (severity === ErrorSeverity.MEDIUM) {
      // Notify user, continue with basic
      toast.warning('AI unavailable, using basic enhancement')
      return basicEnhancement(content)
    } else {
      // Critical - must handle
      throw error
    }
  }
}
```

---

## 6. User Feedback Patterns

### Toast Notifications

```typescript
// User-friendly error messages
const errorMessages: Record<string, string> = {
  NETWORK_ERROR: "Can't connect to server. Please check your internet.",
  AUTH_EXPIRED: "Session expired. Please sign in again.",
  FILE_TOO_LARGE: "File is too large. Maximum size is 10MB.",
  INVALID_PDF: "Couldn't read PDF. Try a different file.",
  AI_UNAVAILABLE: "AI assistant is temporarily unavailable.",
  QUOTA_EXCEEDED: "You've reached your monthly limit.",
}

// Show appropriate message
function showError(code: string) {
  const message = errorMessages[code] || "Something went wrong"
  toast.error(message, {
    action: code === 'AUTH_EXPIRED' ? {
      label: 'Sign In',
      onClick: () => router.push('/signin')
    } : undefined
  })
}
```

### Inline Error States

```typescript
// Component-level error display
function DocumentEditor({ documentId }) {
  const { data, error, isLoading, retry } = useDocument(documentId)

  if (error) {
    return (
      <Card className="p-8 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
        <h3 className="mt-4 text-lg font-medium">
          Couldn't load document
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {error.message}
        </p>
        <Button onClick={retry} className="mt-4">
          Try Again
        </Button>
      </Card>
    )
  }

  // Normal render...
}
```

---

## 7. Logging Strategy

### What to Log

```typescript
// Log levels and when to use them
enum LogLevel {
  DEBUG,   // Development only - detailed debugging
  INFO,    // Normal operations - user actions
  WARN,    // Recoverable issues - retries, fallbacks
  ERROR,   // Errors that need attention
}

// Structured logging
const log = {
  info: (message: string, meta?: any) => {
    console.log(JSON.stringify({
      level: 'INFO',
      message,
      timestamp: new Date().toISOString(),
      ...meta
    }))
  },

  error: (message: string, error: Error, meta?: any) => {
    console.error(JSON.stringify({
      level: 'ERROR',
      message,
      error: {
        message: error.message,
        stack: error.stack,
        code: error.code
      },
      timestamp: new Date().toISOString(),
      ...meta
    }))
  }
}
```

### What NOT to Log

```typescript
// ❌ NEVER log sensitive data
log.error('Login failed', {
  email: user.email,      // OK
  password: user.password // NEVER!
})

// ❌ NEVER log PII in production
log.info('Document created', {
  documentId: doc.id,     // OK
  content: doc.content    // Not OK - contains user data
})

// ✅ Log identifiers only
log.info('Document created', {
  documentId: doc.id,
  userId: user.id,
  templateType: doc.template
})
```

---

## 8. Error Recovery Patterns

```typescript
class AutoSave {
  async save(id: string, data: any) {
    try {
      const result = await api.saveDocument(id, data)
      return result
    } catch (error) {
      // Retry with exponential backoff
      if (this.retryCount < 3) {
        this.retryCount++
        setTimeout(() => this.save(id, data), 1000 * this.retryCount)
        return
      }

      // Fallback to local storage after retries exhausted
      localStorage.setItem(`unsaved_${id}`, JSON.stringify(data))
      toast.warning('Saved locally, will sync when online')
    }
  }
}
```

---

## Error Handling Checklist

- [ ] All async operations wrapped in try-catch
- [ ] Error boundaries around risky components
- [ ] User-friendly error messages (no technical jargon)
- [ ] Retry logic for transient failures
- [ ] Fallbacks for non-critical features
- [ ] Proper HTTP status codes in API responses
- [ ] Structured logging without sensitive data
- [ ] Loading and error states in UI components
- [ ] Network status detection and offline support
- [ ] Form validation with helpful messages

---

## Production Insights

**Cal.com**: Error severity classification for prioritization
**Novel**: Feature-specific error boundaries, granular fallbacks
**Vercel**: Simple error handling, avoid over-engineering

**Core Principle**: Errors are information. Handle gracefully, recover automatically, learn continuously.

---

**Next Document**: Security Checklist (protecting user data and preventing attacks)