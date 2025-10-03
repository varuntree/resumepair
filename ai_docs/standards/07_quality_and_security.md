# Quality & Security

**Error handling, security standards, performance budgets, code review.**

---

## 1. Error Handling

### Error Categories

| Category | Status | User Message |
|----------|--------|--------------|
| USER_INPUT | 400-422 | "Please check your input" |
| AUTH | 401-403 | "Please sign in" |
| NOT_FOUND | 404 | "Not found" |
| CONFLICT | 409 | "Conflict detected" |
| RATE_LIMIT | 429 | "Too many requests" |
| SERVER | 5xx | "Something went wrong" |

### Pattern

```typescript
// API error
const result = schema.safeParse(input)
if (!result.success) {
  return apiError(400, 'Validation failed', result.error)
}

// Client handling
try {
  await api.save(doc)
  toast.success("Saved")
} catch (error) {
  if (error.status === 409) {
    toast.error("Document was modified. Refresh.")
  } else {
    toast.error(error.message || "Failed to save")
  }
}
```

### No Empty Catch Blocks (CRITICAL)

```typescript
// ❌ WRONG
try {
  await operation()
} catch {}

// ✅ CORRECT
try {
  await operation()
} catch (error) {
  console.error('Operation failed:', error)
}
```

---

## 2. Security Standards

### Authentication & Authorization
- ✅ Google OAuth only
- ✅ JWT validation on all protected routes
- ✅ RLS enforced (4 policies per table: SELECT, INSERT, UPDATE, DELETE)
- ❌ No service role in runtime

### Input Validation
```typescript
// Validate all inputs with Zod
const result = InputSchema.safeParse(body)
if (!result.success) {
  return apiError(400, 'Validation failed')
}
```

### Storage Security
```typescript
// User-scoped paths
${userId}/filename.pdf

// Signed URLs with expiration
createSignedUrl(path, 604800) // 7 days
```

---

## 3. Performance Budgets

| Metric | Budget | How to Measure |
|--------|--------|----------------|
| Keystroke → preview | p95 ≤ 120ms | React DevTools Profiler |
| Template switch | ≤ 200ms | Performance.now() |
| PDF export (1-2 pages) | ≤ 2.5s | Server logs |
| Scoring (deterministic) | ≤ 200ms | Performance.now() |
| Scoring (with LLM) | ≤ 1.2s | API latency |

### Measurement
```typescript
const start = performance.now()
await operation()
const duration = performance.now() - start
if (duration > BUDGET) {
  console.warn('Budget exceeded:', duration)
}
```

---

## 4. Code Review Checklist

### Architecture
- [ ] Repository pattern used
- [ ] API routes use wrappers
- [ ] Migrations file-only

### TypeScript
- [ ] No `any` types
- [ ] Explicit return types
- [ ] Null/undefined handled

### Security
- [ ] RLS policies complete (4 per table)
- [ ] withAuth on protected routes
- [ ] No PII in logs

### Styling
- [ ] Design tokens only
- [ ] Templates use `--doc-*`, app uses `--app-*`
- [ ] shadcn/ui components only

### Quality
- [ ] No empty catch blocks
- [ ] Performance budgets met
- [ ] Visual verification done (UI features)

---

**Complete**: All standards documented. Return to `00_README.md` for index.
