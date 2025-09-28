# Security Checklist

**Purpose**: Ensure ResumePair protects user data, prevents common attacks, and maintains trust. Security isn't optional - it's fundamental.

---

## Core Security Principles

1. **Defense in Depth** - Multiple layers of security
2. **Principle of Least Privilege** - Minimum necessary access
3. **Zero Trust** - Verify everything, trust nothing
4. **Fail Secure** - When in doubt, deny access

---

## 1. Authentication & Authorization

### Authentication Checklist

- [x] **Google OAuth Only** (per fixed decisions)
```typescript
// ✅ CORRECT: Single auth provider
const supabase = createClient()
await supabase.auth.signInWithOAuth({ provider: 'google' })

// ❌ WRONG: Multiple providers increase attack surface
```

- [ ] **Session Management**
```typescript
// Set appropriate session expiry
const sessionConfig = {
  expiry: 7 * 24 * 60 * 60, // 7 days
  refresh: true,
  sameSite: 'lax',
  secure: true, // HTTPS only
}
```

- [ ] **Token Storage**
```typescript
// ✅ CORRECT: HTTPOnly cookies for tokens
// Handled automatically by Supabase Auth

// ❌ WRONG: localStorage (XSS vulnerable)
localStorage.setItem('token', authToken)
```

### Authorization Patterns

- [ ] **Check Authorization on Every Request**
```typescript
// API route protection
export const GET = withAuth(async (req, { user }) => {
  const documentId = req.params.id

  // Verify ownership
  const document = await getDocument(documentId)
  if (document.userId !== user.id) {
    return apiError('FORBIDDEN', 'Access denied', 403)
  }

  return apiSuccess(document)
})
```

- [ ] **Row Level Security (RLS)**
```sql
-- Supabase RLS policies
CREATE POLICY "Users can only see own documents"
ON documents FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can only update own documents"
ON documents FOR UPDATE
USING (auth.uid() = user_id);
```

---

## 2. Input Validation & Sanitization

- [ ] **Zod Validation + Generated Types**
```typescript
// Combine Zod with Supabase generated types
type Document = Database['public']['Tables']['documents']['Row']
const schema = z.object({ /* validation */ }) satisfies z.ZodType<Document>
```

- [ ] **React Default Escaping** - Trust React's built-in XSS protection
- [ ] **SQL Injection** - Use Supabase/Prisma parameterized queries only

---

## 3. Data Protection

- [ ] **Logging** - Only log IDs, never PII or content
- [ ] **File Uploads**:
```typescript
const LIMITS = { size: 10MB, types: ['pdf', 'jpeg', 'png'] }
// Validate size, type, content match
// Strip EXIF metadata
// Use unique names: `${userId}/${uuid()}_${sanitized}`
```
- [ ] **Encryption** - Supabase handles at-rest; add application-level for extra sensitive data

---

## 4. API Security

### Rate Limiting

- [ ] **Implement Rate Limits**
```typescript
// Per-user rate limiting
const rateLimits = {
  api: { requests: 100, window: '1m' },
  ai: { requests: 10, window: '1m' },
  export: { requests: 20, window: '5m' },
}

// Apply to routes
export const POST = withRateLimit('ai', async (req) => {
  // Handler
})
```

### CORS Configuration

- [ ] **Configure CORS Properly**
```typescript
// next.config.js
const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL,
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
}

// ❌ WRONG: Allow all origins
'Access-Control-Allow-Origin': '*'
```

### API Key Security

- [ ] **Never Expose API Keys**
```typescript
// ✅ CORRECT: Server-side only
// app/api/ai/route.ts
const apiKey = process.env.OPENAI_API_KEY // Server-side

// ❌ WRONG: Client-side exposure
// app/components/AIChat.tsx
const apiKey = process.env.NEXT_PUBLIC_OPENAI_KEY // Exposed!
```

---

## 5. Security Headers & Webhooks

- [ ] **CSP Headers** - Set restrictive Content-Security-Policy
- [ ] **Webhook Security** (from Vercel):
```typescript
// Always verify signatures
const sig = headers.get('stripe-signature')
const event = stripe.webhooks.constructEvent(body, sig, secret)
// Implement idempotency for duplicate deliveries
```
- [ ] **DOM Safety** - Trust React's escaping, sanitize only when using dangerouslySetInnerHTML

---

## 6. CSRF Protection

- [ ] **Use CSRF Tokens**
```typescript
// Supabase handles CSRF automatically with SameSite cookies
// But for custom forms:

// Generate token
const csrfToken = generateCSRFToken()
session.csrfToken = csrfToken

// Verify on submission
if (req.body.csrfToken !== session.csrfToken) {
  return apiError('INVALID_CSRF_TOKEN', 'Invalid request', 403)
}
```

---

## 7. Secure Communication

- [ ] **HTTPS Only**
```typescript
// Force HTTPS in production
if (process.env.NODE_ENV === 'production' && !req.secure) {
  return redirect(`https://${req.headers.host}${req.url}`)
}
```

- [ ] **Secure Cookies**
```typescript
// Cookie configuration
const cookieOptions = {
  httpOnly: true,    // No JavaScript access
  secure: true,      // HTTPS only
  sameSite: 'lax',   // CSRF protection
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
}
```

---

## 8. Error Handling (Security)

- [ ] **Don't Leak Information**
```typescript
// ✅ CORRECT: Generic error messages
if (!user) {
  return apiError('AUTH_FAILED', 'Invalid credentials', 401)
}

// ❌ WRONG: Specific information
if (!user) {
  return apiError('USER_NOT_FOUND', 'No user with email: ' + email)
}
```

- [ ] **Hide Stack Traces**
```typescript
// Production error handler
if (process.env.NODE_ENV === 'production') {
  return {
    error: 'Something went wrong',
    // No stack trace, no details
  }
} else {
  return {
    error: error.message,
    stack: error.stack, // Dev only
  }
}
```

---

## 9. Dependencies Security

- [ ] **Regular Updates**
```bash
# Check for vulnerabilities
npm audit

# Update dependencies
npm update

# Fix vulnerabilities
npm audit fix
```

- [ ] **Lock File Integrity**
```json
// package.json
{
  "scripts": {
    "preinstall": "npx npm-force-resolutions"
  }
}
```

---

## 10. Environment Variables

- [ ] **Proper Secret Management**
```typescript
// .env.local (never commit)
DATABASE_URL=postgresql://...
OPENAI_API_KEY=sk-...
STRIPE_SECRET_KEY=sk_live_...

// .env.example (commit this)
DATABASE_URL=your_database_url_here
OPENAI_API_KEY=your_api_key_here
STRIPE_SECRET_KEY=your_stripe_key_here
```

- [ ] **Validate Environment**
```typescript
// libs/env.ts
const requiredEnvVars = [
  'DATABASE_URL',
  'NEXTAUTH_SECRET',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
]

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`)
  }
}
```

---

## Security Incident Response

### If a Security Issue Occurs:

1. **Immediate Actions**
   - Revoke affected tokens/keys
   - Block affected users if needed
   - Enable maintenance mode

2. **Investigation**
   - Check logs for breach extent
   - Identify attack vector
   - Document timeline

3. **Recovery**
   - Patch vulnerability
   - Reset affected credentials
   - Notify affected users (if required)

4. **Prevention**
   - Add test for this vulnerability
   - Update security checklist
   - Review similar code patterns

---

## Security Checklist Summary

### Before Every Deploy:

- [ ] All inputs validated with Zod
- [ ] No sensitive data in logs
- [ ] API routes use withAuth wrapper
- [ ] Rate limiting configured
- [ ] Error messages are generic
- [ ] Dependencies updated (npm audit)
- [ ] Environment variables secured
- [ ] CSP headers configured
- [ ] File uploads validated
- [ ] RLS policies enabled in Supabase

### Monthly Review:

- [ ] Review authentication logs
- [ ] Check for unusual API patterns
- [ ] Update dependencies
- [ ] Review security advisories
- [ ] Test rate limiting
- [ ] Verify backups work

---

## Security Insights

**Vercel**: Webhook signature verification, simple security layers
**Cal.com**: RLS policies, service-level authorization
**Novel**: Minimal attack surface, trust platform defaults

**Core**: Security through simplicity. Use platform features (Supabase RLS, React escaping), avoid custom crypto.

---

**Next Document**: Performance Guidelines (making ResumePair fast and responsive)