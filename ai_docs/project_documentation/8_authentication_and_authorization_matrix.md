# 7) Authentication & Authorization Matrix

**Principles (binding)**

* **Authentication**: Supabase Auth with **Google OAuth only**.
* **Authorization**: Row‑Level Security (RLS) in Postgres; **document owner‑only** access in v1.
* **Runtime keys**: Never use `SERVICE_ROLE_KEY` in user‑facing runtime. Use the **per‑request user server client** so RLS is always enforced.
* **Transport**: App → API with `Authorization: Bearer <supabase access_token>`; cookies/session handled by Supabase helpers in Next.js.

---

## 1. Authentication Flows

### 1.1 Sign‑In (Google)

1. Client clicks **Sign in with Google** → `supabase.auth.signInWithOAuth({ provider: 'google' })`
2. On success, Supabase stores the session; we redirect to `/` or `/documents`.
3. If first sign‑in, a `profiles` row is created by trigger (see DB migrations).

### 1.2 Session in Route Handlers

* **Server components / API** use `createClient()` (server) to obtain the user from request cookies.
* **`withAuth` wrapper**:

  * Validates token via Supabase.
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

### 1.3 Sign‑Out

* Client: `supabase.auth.signOut()` and redirect to `/signin`.

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
