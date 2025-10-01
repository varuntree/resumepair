# 7) Authentication & Authorization Matrix

**Principles (binding)**

* **Authentication**: Supabase Auth with **Google OAuth** and **Email/Password**.
* **Method Separation**: Users must continue using the authentication method they originally signed up with. No identity linking between methods.
* **Authorization**: Row‑Level Security (RLS) in Postgres; **document owner‑only** access in v1.
* **Runtime keys**: Never use `SERVICE_ROLE_KEY` in user‑facing runtime. Use the **per‑request user server client** so RLS is always enforced.
* **Transport**: App → API with `Authorization: Bearer <supabase access_token>`; cookies/session handled by Supabase helpers in Next.js.

---

## 1. Authentication Flows

### 1.1 Sign‑In (Google OAuth)

1. Client clicks **Continue with Google** → `supabase.auth.signInWithOAuth({ provider: 'google' })`
2. On success, Supabase stores the session; we redirect to `/dashboard`.
3. If first sign‑in, a `profiles` row is created by trigger (see DB migrations).

### 1.2 Sign‑In (Email/Password)

1. Client enters email and password → `supabase.auth.signInWithPassword({ email, password })`
2. On success, Supabase validates credentials and creates session.
3. Redirect to `/dashboard`.
4. **Error handling**:
   - Invalid credentials → "Invalid email or password. If you signed up with Google, please use 'Continue with Google' to sign in."
   - Account exists with different method → Guided to use original signup method.

### 1.3 Sign‑Up (Email/Password)

1. Client enters email, password, and password confirmation.
2. Client-side validation checks:
   - Email format valid
   - Password meets strength requirements (≥8 chars, uppercase, lowercase, number)
   - Passwords match
3. Call `supabase.auth.signUp({ email, password })`
4. **Email verification**: DISABLED - users can sign in immediately
5. **Duplicate prevention**:
   - If email already exists (from any method), Supabase returns error
   - Show message: "An account with this email already exists. If you signed up with Google, please use 'Continue with Google' to sign in."
6. On success, profile auto-created by trigger → redirect to `/dashboard`.

### 1.4 Duplicate Email Prevention

**Policy**: Strict method separation - no identity linking allowed.

**Scenarios**:

| User Action | Existing Account | Result | Message |
|-------------|------------------|--------|---------|
| Email signup | Email already used for email/password | ❌ Blocked | "An account with this email already exists. Please use 'Sign in' instead." |
| Email signup | Email already used for Google | ❌ Blocked | "An account with this email already exists. If you signed up with Google, please use 'Continue with Google' to sign in." |
| Google signup | Email already used for email/password | ❌ Blocked | Supabase error (user directed to email/password sign-in) |
| Email signin | User registered with Google | ❌ Failed | "Invalid email or password. If you signed up with Google, please use 'Continue with Google' to sign in." |

**Implementation**: Supabase's built-in duplicate email prevention (when email confirmation is disabled) + enhanced error messages.

### 1.5 Session in Route Handlers

* **Server components / API** use `createClient()` (server) to obtain the user from request cookies.
* **`withAuth` wrapper**:

  * Validates token via Supabase (works for both OAuth and email/password).
  * Injects `{ user }` to the handler.
  * Rejects with **401** and standard envelope if absent/invalid.

```ts
// libs/api-utils/middleware.ts
export const withAuth = (handler) => async (req: NextRequest) => {
  const supabase = createServerClientFromReq(req); // attaches cookies
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return apiError(401, 'Unauthorized');
  return handler(req, { user, supabase });
};
```

### 1.6 Sign‑Out

* Client: `supabase.auth.signOut()` and redirect to `/signin`.
* Works for both Google OAuth and email/password users.

---

## 2. Roles & Tenancy

* **Roles (v1)**: `user` (default), **no admin** in v1.
* **Tenancy**: single product, **per‑user isolation** via RLS.
* Future‑proofing: an `admin` role can be added later by expanding RLS and route checks; not implemented now.

---

## 3. Authorization Rules (RLS‑first)

### 3.1 Data Tables

| Resource              | Action                          | Who  | Rule (summary)                                                    |
| --------------------- | ------------------------------- | ---- | ----------------------------------------------------------------- |
| `profiles`            | Read / Create / Update          | user | `id = auth.uid()`                                                 |
| `documents`           | List / Read                     | user | `owner_id = auth.uid()` and (app filters soft‑deleted)            |
| `documents`           | Create                          | user | `owner_id = auth.uid()`                                           |
| `documents`           | Update (incl. soft‑delete)      | user | `owner_id = auth.uid()`                                           |
| `documents`           | Delete (hard delete – optional) | user | `owner_id = auth.uid()`                                           |
| `document_versions`   | Read / Insert                   | user | Exists doc with `d.owner_id = auth.uid()`                         |
| `scores` *(optional)* | Read / Insert                   | user | Exists doc with `d.owner_id = auth.uid()`                         |
| `storage.objects`     | Read / Insert / Update / Delete | user | bucket = `media` AND `name` begins with `auth.uid()` |

### 3.2 API Endpoints

| Endpoint                                | Auth  | Authorization Notes                                       |                           |
| --------------------------------------- | ----- | --------------------------------------------------------- | ------------------------- |
| `GET /me`                               | ✔     | Any signed‑in user                                        |                           |
| `GET /resumes` / `GET /cover-letters`   | ✔     | Lists **own** docs only (RLS filters others)              |                           |
| `POST /resumes` / `POST /cover-letters` | ✔     | Creates doc with `owner_id = auth.uid()`                  |                           |
| `GET /resumes/{id}` etc.                | ✔     | RLS enforces owner                                        |                           |
| `PUT/PATCH/DELETE /{id}`                | ✔     | Owner only                                                |                           |
| `POST /import/pdf`                      | ✔     | Uses user server client; result saved under user          |                           |
| `POST /ai/draft/*`                      | ✔     | Uses Edge runtime; user required (rate‑limited)           |                           |
| `POST /score/*`                         | ✔     | Owner only; optional LLM rubric                           |                           |
| `POST /export/pdf                       | docx` | ✔                                                         | Owner only; server render |
| (removed)                                |       |                                                           |                           |
| `GET /templates/*`                      | ✔     | Non‑sensitive; still gated behind sign‑in for consistency |                           |

**Public endpoints**: none with user data in v1.

---

## 4. Error Semantics

* **401 Unauthorized**: missing/invalid token (sign‑in required).
* **403 Forbidden**: (rare) explicit deny even if authenticated (e.g., future org roles).
* **404 Not Found**: document id not found or not owned (avoid leaking existence).
* **409 Conflict**: optimistic concurrency failure (`version` mismatch).

---

## 5. Token & Session Notes

* Supabase issues access/refresh tokens and manages cookie rotation; **we do not mint custom JWTs**.
* API consumers (the Next.js app) **always** call server routes with user cookies; route handlers build a **user‑scoped server client** to uphold RLS.

---

## 6. Future Extensions (non‑blocking)

* Add `admin` role: separate RLS policies and admin‑only admin routes.
* Organization/team model: `orgs`, `memberships(role)`, `documents.org_id` + RLS by `org_id`.
* API keys (personal) for headless integrations: separate table + HMAC scopes.

---
