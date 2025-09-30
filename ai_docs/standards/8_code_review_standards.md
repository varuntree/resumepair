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

## 9. Visual Quality Review

**For UI Features Only**

### When to Apply Visual Review

Apply this section when reviewing PRs that include:
- New UI components
- Changes to existing layouts
- Template modifications
- Responsive design updates
- Any user-facing interface changes

### Visual Review Checklist

Before approving any PR with UI changes:

#### Screenshots Required
- [ ] Desktop screenshot (1440px) provided
- [ ] Mobile screenshot (375px) provided
- [ ] Screenshots saved to `ai_docs/progress/phase_N/screenshots/`

#### Visual Quality Standards

**Reference**: See `3_component_standards.md` Section 10 for complete details.

**Quick checks**:
- [ ] **Spacing generous** - Minimum 16px gaps between major elements
- [ ] **Clear typography hierarchy** - Page title largest, descending sizes
- [ ] **One primary action per section** - Single lime button, not multiple CTAs
- [ ] **Design tokens used** - No hardcoded hex colors or px values
- [ ] **Responsive layout works** - No horizontal scroll on mobile
- [ ] **Ramp palette only** - Navy (dark/medium), lime accent, gray scale

#### Visual Verification Process

- [ ] Agent executed visual verification workflow
- [ ] `visual_review.md` document updated with results
- [ ] All mandatory checklist items passed
- [ ] Refinement cycle completed if issues found

**Reference**: `ai_docs/standards/9_visual_verification_workflow.md`

### Visual Quality Review Feedback Levels

- **🔴 MUST FIX Visual Issues**:
  - Multiple primary actions competing for attention
  - Hardcoded colors/spacing (not using design tokens)
  - Broken responsive layout (horizontal scroll)
  - Missing screenshots
  - Cramped spacing (< 16px gaps)

- **🟡 CONSIDER Visual Improvements**:
  - Typography hierarchy could be clearer
  - Touch targets < 48px on mobile
  - Minor color palette deviations
  - Spacing feels generous but not optimal

- **💭 THOUGHT Visual Enhancements**:
  - Alternative layout approaches
  - Animation/transition suggestions
  - Accessibility improvements beyond basics

### Common Visual Issues

**Cramped Spacing**:
```tsx
// ❌ BAD: Too tight
<div className="p-2 space-y-1">

// ✅ GOOD: Generous spacing
<div className="p-6 space-y-4">
```

**Multiple Primary Actions**:
```tsx
// ❌ BAD: Too many CTAs competing
<Button variant="primary">Action 1</Button>
<Button variant="primary">Action 2</Button>

// ✅ GOOD: Clear hierarchy
<Button variant="primary">Primary Action</Button>
<Button variant="secondary">Secondary Action</Button>
```

**Hardcoded Values**:
```tsx
// ❌ BAD: Magic numbers and hex codes
<div style={{ padding: '24px', color: '#CDFF00' }}>

// ✅ GOOD: Design tokens
<div className="p-6 text-lime">
```

### Visual Review Decision Tree

```
Are screenshots provided (desktop + mobile)?
  No → 🔴 MUST FIX (cannot approve without visual proof)
  Yes → Continue

Do screenshots show hardcoded values (not design tokens)?
  Yes → 🔴 MUST FIX (violates design system)
  No → Continue

Are there multiple primary actions (lime buttons) per section?
  Yes → 🔴 MUST FIX (violates visual hierarchy)
  No → Continue

Is spacing generous (≥16px gaps, ≥24px card padding)?
  No → 🔴 MUST FIX (violates spacing standards)
  Yes → Continue

Is mobile layout responsive (no horizontal scroll)?
  No → 🔴 MUST FIX (violates responsive standards)
  Yes → Continue

Is visual verification workflow documented?
  No → 🟡 CONSIDER (request documentation)
  Yes → ✅ APPROVE VISUAL QUALITY
```

---

**Remember**: The goal isn't perfect code - it's code that's good enough, safe enough, and maintainable enough. Ship it!

---

**Standards Documentation Complete!**

We now have a comprehensive set of standards documents that cover:
1. Architecture Principles
2. Data Flow Patterns
3. Component Standards (including Visual Quality Standards)
4. API Design Contracts
5. Error Handling Strategy
6. Security Checklist
7. Performance Guidelines
8. Code Review Standards (including Visual Quality Review)
9. Visual Verification Workflow

These form the foundation for all development on ResumePair.