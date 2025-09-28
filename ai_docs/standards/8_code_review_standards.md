# Code Review Standards

**Purpose**: Define what we check during code reviews to ensure quality, consistency, and maintainability. Every line of code is a future liability or asset - reviews determine which.

---

## Core Review Philosophy

**Code reviews are about:**
1. **Catching bugs** before they reach production
2. **Knowledge sharing** across the team
3. **Maintaining standards** consistently
4. **Continuous learning** for everyone

**Code reviews are NOT about:**
- Personal preferences
- Showing superiority
- Perfection (good enough is good enough)
- Rewriting someone else's solution

---

## 1. Quick Review Checklist

### Must Check
- [ ] **Security**: No exposed secrets, validated inputs, auth on routes
- [ ] **Errors**: Try-catch on async, error boundaries on risky components
- [ ] **Performance**: No N+1 queries, debounced updates, lazy loading
- [ ] **Patterns**: Follows our 8 standards documents

### Code Quality Basics
- [ ] **Clear naming** - Can another dev understand in 30 seconds?
- [ ] **No magic values** - All constants named
- [ ] **Single responsibility** - Each function/component does one thing

### Functionality

- [ ] **Works as Expected**
  - Meets requirements
  - Handles edge cases
  - No obvious bugs

- [ ] **Error Handling**
```typescript
// ✅ GOOD: Comprehensive error handling
try {
  const result = await riskyOperation()
  return { success: true, data: result }
} catch (error) {
  logger.error('Operation failed', { error, context })
  return { success: false, error: error.message }
}

// ❌ BAD: Swallowing errors
try {
  return await riskyOperation()
} catch {
  return null // What went wrong?
}
```

- [ ] **Input Validation**
```typescript
// ✅ GOOD: Validate inputs
export const handler = async (req) => {
  const result = InputSchema.safeParse(req.body)
  if (!result.success) {
    return apiError('VALIDATION_ERROR', result.error)
  }
  // Use result.data (validated)
}

// ❌ BAD: Trust inputs
export const handler = async (req) => {
  const { email } = req.body // Unvalidated!
  await sendEmail(email)
}
```

### Performance

- [ ] **No Obvious Performance Issues**
```typescript
// ✅ GOOD: Efficient
const documentIds = documents.map(d => d.id)

// ❌ BAD: N+1 query
for (const doc of documents) {
  const user = await getUser(doc.userId) // N queries!
}
```

- [ ] **Appropriate Optimization**
```typescript
// ✅ GOOD: Optimize when measured
// Comment: This component re-renders 50+ times per second
const MemoizedComponent = memo(ExpensiveComponent)

// ❌ BAD: Premature optimization
const SimpleDiv = memo(({ text }) => <div>{text}</div>) // Why?
```

### Security

- [ ] **No Security Vulnerabilities**
```typescript
// ✅ GOOD: Parameterized query
await db.query('SELECT * FROM users WHERE id = ?', [userId])

// ❌ BAD: SQL injection risk
await db.query(`SELECT * FROM users WHERE id = ${userId}`)
```

- [ ] **No Sensitive Data Exposure**
```typescript
// ✅ GOOD: Minimal logging
logger.info('User action', { userId, action })

// ❌ BAD: Logging sensitive data
logger.info('User action', { user: fullUserObject }) // Contains password!
```

- [ ] **Proper Authentication**
```typescript
// ✅ GOOD: Protected route
export const DELETE = withAuth(async (req, { user }) => {
  // user is guaranteed authenticated
})

// ❌ BAD: Unprotected route
export const DELETE = async (req) => {
  // Anyone can call this!
}
```

### Testing Mindset

- [ ] **Testable Code**
```typescript
// ✅ GOOD: Testable pure function
export const calculateScore = (document: ResumeJson): number => {
  // Pure logic, no side effects
}

// ❌ BAD: Hard to test
const calculateScore = () => {
  const doc = globalStore.document // Hidden dependency
  fetch('/api/score') // Side effect
  // ...
}
```

- [ ] **Edge Cases Considered**
```typescript
// ✅ GOOD: Handles edge cases
const parseDate = (date?: string | null): Date | null => {
  if (!date) return null
  if (date === 'Present') return new Date()
  const parsed = new Date(date)
  return isNaN(parsed.getTime()) ? null : parsed
}

// ❌ BAD: Happy path only
const parseDate = (date: string): Date => {
  return new Date(date) // What if invalid?
}
```

---

## 2. Component Review Standards

### Component Checklist

- [ ] **Follows Component Standards**
  - Single responsibility
  - Props are minimal and clear
  - Uses composition patterns appropriately

- [ ] **Proper State Management**
```typescript
// ✅ GOOD: Appropriate state location
// Local state for UI
const [isOpen, setIsOpen] = useState(false)

// Global store for shared data
const document = useDocumentStore(s => s.document)

// ❌ BAD: Wrong state location
// Global store for local UI
useGlobalStore(s => s.dropdownStates[componentId])
```

- [ ] **Accessibility**
```typescript
// ✅ GOOD: Accessible
<button
  aria-label="Delete section"
  onClick={handleDelete}
  onKeyDown={handleKeyboard}
>

// ❌ BAD: Not accessible
<div onClick={handleDelete}> // Not keyboard accessible
```

- [ ] **Uses Design System**
```typescript
// ✅ GOOD: Design tokens
<div className="p-4 text-primary bg-background">

// ❌ BAD: Hard-coded values
<div style={{ padding: '16px', color: '#333' }}>
```

---

## 3. API Review Standards

### API Checklist

- [ ] **RESTful Conventions**
  - Correct HTTP methods
  - Proper status codes
  - Consistent URL patterns

- [ ] **Standard Response Format**
```typescript
// ✅ GOOD: Consistent envelope
return apiSuccess(data, 'Document created')
return apiError('NOT_FOUND', 'Document not found', 404)

// ❌ BAD: Inconsistent responses
return NextResponse.json(data) // Sometimes
return { error: 'Not found' } // Other times
```

- [ ] **Rate Limiting Applied**
```typescript
// ✅ GOOD: Protected endpoint
export const POST = withRateLimit('ai',
  withAuth(async (req, { user }) => {
    // Limited to 10 requests per minute
  })
)
```

---

## 4. Database Review Standards

### Database Checklist

- [ ] **Efficient Queries**
  - Only selects needed fields
  - Proper indexes used
  - No N+1 queries

- [ ] **Migrations Are Safe**
```sql
-- ✅ GOOD: Non-breaking migration
ALTER TABLE documents ADD COLUMN template_version INTEGER DEFAULT 1;

-- ❌ BAD: Breaking migration without safeguards
ALTER TABLE documents DROP COLUMN important_field; -- Data loss!
```

- [ ] **RLS Policies**
```sql
-- ✅ GOOD: Row-level security
CREATE POLICY "Users see own documents"
ON documents FOR SELECT
USING (auth.uid() = user_id);
```

---

## 5. Efficient Review Process

### Review Feedback Levels
- **🔴 MUST FIX**: Security, bugs, breaks production
- **🟡 CONSIDER**: Performance, readability improvements
- **💭 THOUGHT**: Alternative approaches, discussions

### Good Feedback Example
```
"🟡 This could cause N+1 queries with large datasets.
Consider: await Promise.all(ids.map(id => fetch(id)))"
```

---

## 6. Common Issues (Quick Reference)

**Memory Leaks**: Missing cleanup in useEffect
**Race Conditions**: Not cancelling old requests
**Infinite Loops**: Missing/wrong dependencies
**N+1 Queries**: Fetching in loops instead of batch
**XSS**: Using dangerouslySetInnerHTML without sanitization
**Exposed Secrets**: API keys in client code

---

## 7. Code Review Metrics

### What Makes a Good Review?

- **Timeliness**: Reviewed within 24 hours
- **Thoroughness**: Catches actual issues
- **Constructiveness**: Helps author improve
- **Efficiency**: Doesn't block unnecessarily

### Red Flags in Code

- Very large PRs (>500 lines)
- No error handling
- Copy-pasted code
- Complex nested conditionals
- Unexplained workarounds
- Missing validation
- Hard-coded secrets
- Console.logs in production

---

## Review Decision Tree

```
Is it secure?
  No → 🔴 MUST FIX
  Yes → Continue

Does it work correctly?
  No → 🔴 MUST FIX
  Yes → Continue

Does it follow standards?
  No → 🔴 MUST FIX (if critical) or 🟡 CONSIDER
  Yes → Continue

Is it performant enough?
  No → 🟡 CONSIDER (unless critical path)
  Yes → Continue

Could it be clearer?
  Yes → 💭 THOUGHT
  No → ✅ APPROVE
```

---

## Review Philosophy

**Google's Approach**: Perfect is the enemy of good
**Key Rule**: If it's secure, works, and follows standards - ship it

**Time Targets**:
- Review within 24 hours
- PRs < 500 lines
- Review in one sitting

---

## Final Checklist

Before approving any code:

- [ ] No security vulnerabilities
- [ ] No obvious bugs
- [ ] Follows established patterns
- [ ] Handles errors appropriately
- [ ] Validates inputs
- [ ] Includes necessary cleanup
- [ ] Uses design tokens (no hard-coded values)
- [ ] Accessible where applicable
- [ ] Performance is acceptable
- [ ] Code is clear and maintainable

---

**Remember**: The goal isn't perfect code - it's code that's good enough, safe enough, and maintainable enough. Ship it!

---

**Standards Documentation Complete!**

We now have a comprehensive set of 8 standards documents that cover:
1. Architecture Principles
2. Data Flow Patterns
3. Component Standards
4. API Design Contracts
5. Error Handling Strategy
6. Security Checklist
7. Performance Guidelines
8. Code Review Standards

These form the foundation for all development on ResumePair.