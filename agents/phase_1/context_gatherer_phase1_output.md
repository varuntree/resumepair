# Phase 1 Context Document: Foundation & Core Infrastructure

**Generated**: 2025-09-30
**Project**: ResumePair
**Purpose**: Definitive implementation context for Phase 1 with zero ambiguity

---

## Executive Summary

Phase 1 establishes ResumePair's production-ready foundation: Google OAuth authentication, Supabase database with RLS, responsive application shell (Header/Sidebar/Footer/Mobile Menu), navigation system, settings pages, and comprehensive error handling. The phase implements the architectural patterns defined in coding_patterns.md and development_decisions.md, preparing the codebase for Phase 2's document editing features.

**Critical Constraint**: This is FOUNDATION ONLY. No document editing, no AI features, no PDF exports. Build authentication, navigation, layouts, and settings—nothing more.

**Validation Gate**: ~20-30 minutes manual testing with Puppeteer MCP playbooks + visual verification.

---

## 1. Complete Scope Definition

### 1.1 Core Features (Must Implement)

#### Feature 1: Google OAuth Authentication
**User Story**: As a user, I need to sign in with my Google account to access the application.

**Components Required**:
- Sign in page (`/app/signin/page.tsx`)
- Sign in button component (`/components/auth/SignInButton.tsx`)
- Sign out button component (`/components/auth/SignOutButton.tsx`)
- Protected route wrapper/middleware (`/middleware.ts`)
- Auth state management (if needed for client components)

**Acceptance Criteria**:
- [ ] Landing page shows "Sign in with Google" button (lime CTA)
- [ ] Clicking button initiates Supabase Google OAuth flow
- [ ] Successful auth redirects to `/dashboard`
- [ ] Failed auth shows error message, stays on signin page
- [ ] Session persists across page refreshes
- [ ] Sign out button clears session and redirects to `/`
- [ ] Protected routes redirect unauthenticated users to `/signin`

**API Endpoints Required**: None (Supabase handles OAuth)

**Edge Cases**:
- OAuth callback error (user cancels, network failure)
- Expired session during navigation
- Concurrent sessions across devices
- Browser back button after sign out

---

#### Feature 2: Database Setup & Connection
**User Story**: As the system, I need a connected database with RLS to store user data securely.

**Tables Required** (Migrations only, apply with permission):
- `profiles` (id, full_name, avatar_url, locale, date_format, page_size, created_at, updated_at)
- `user_preferences` (user_id, theme, email_notifications, auto_save, default_template, created_at, updated_at)

**Migration Files** (Create, do NOT apply):
```
migrations/phase1/
├── 001_enable_extensions.sql
├── 002_create_profiles_table.sql
├── 003_create_user_preferences_table.sql
├── 004_setup_rls_policies_profiles.sql
├── 005_setup_rls_policies_preferences.sql
├── 006_create_profile_trigger.sql
└── 007_create_indexes.sql
```

**RLS Policies Required**:
- profiles: SELECT/INSERT/UPDATE where `id = auth.uid()`
- user_preferences: SELECT/INSERT/UPDATE where `user_id = auth.uid()`

**Acceptance Criteria**:
- [ ] Migration files created in `migrations/phase1/`
- [ ] Each migration is atomic and documented
- [ ] RLS policies enforce user-only access
- [ ] Profile auto-created on first sign-in (trigger)
- [ ] Supabase client configured in `libs/supabase/`
- [ ] Type generation working (`npm run db:types` if implemented)

**Edge Cases**:
- First-time user (profile creation)
- User without preferences (default values)
- Supabase connection failure (graceful degradation)

---

#### Feature 3: Application Shell & Layouts
**User Story**: As a user, I need consistent navigation and layouts to move through the app efficiently.

**Components Required**:
- Root layout (`/app/layout.tsx`) - already exists, enhance
- Dashboard layout (`/app/dashboard/layout.tsx`)
- Header component (`/components/layout/Header.tsx`)
- Sidebar component (`/components/layout/Sidebar.tsx`)
- Footer component (`/components/layout/Footer.tsx`)
- Mobile menu component (`/components/layout/MobileMenu.tsx`)
- Breadcrumbs component (`/components/layout/Breadcrumbs.tsx`)

**Pages Required**:
- Landing page (`/app/page.tsx`) - exists, enhance
- Sign in page (`/app/signin/page.tsx`)
- Dashboard page (`/app/dashboard/page.tsx`)
- Settings main (`/app/settings/page.tsx`)
- Profile settings (`/app/settings/profile/page.tsx`)
- Preferences settings (`/app/settings/preferences/page.tsx`)
- Account management (`/app/settings/account/page.tsx`)
- 404 page (`/app/not-found.tsx`) - exists, verify
- Error boundary (`/app/error.tsx`) - exists, verify
- Offline page (`/app/offline.tsx`)

**Acceptance Criteria**:
- [ ] Header: Logo (left) + Navigation (center) + User menu (right)
- [ ] Sidebar: Main navigation links, collapsible on desktop, hidden on mobile
- [ ] Footer: Links (Terms, Privacy, Support), copyright, social icons
- [ ] Mobile menu: Hamburger icon, slide-out drawer, all nav links
- [ ] Responsive breakpoints: Mobile (< 768px), Tablet (768-1024px), Desktop (> 1024px)
- [ ] All layouts use design tokens (no hardcoded values)
- [ ] Navigation highlights active route
- [ ] User menu shows avatar/name, dropdown with Sign Out

**Design System Compliance**:
- Header: `bg-app-background border-b border-app-border py-4 px-6`
- Sidebar: `bg-app-background border-r border-app-border w-64 lg:block hidden`
- Footer: `bg-app-background border-t border-app-border py-8 px-6`
- Mobile menu: `fixed inset-0 z-50 bg-app-background transform transition-transform`

**Edge Cases**:
- Very long username (truncate with ellipsis)
- No avatar (show initials fallback)
- Mobile landscape orientation
- Tablet edge case (768px exactly)

---

#### Feature 4: Navigation System
**User Story**: As a user, I need clear navigation to access all application features.

**Navigation Items** (Protected, authenticated only):
- Dashboard (`/dashboard`)
- Settings (`/settings`)
- Sign Out (action, not route)

**Navigation Items** (Public):
- Home (`/`)
- Sign In (`/signin`)

**Implementation Details**:
- Top nav (Header): Dashboard, Settings
- Side nav (Sidebar): Same as top nav, expanded descriptions
- Mobile menu: All nav items, sign out at bottom
- User menu dropdown: Profile, Settings, Sign Out

**Acceptance Criteria**:
- [ ] All nav links functional
- [ ] Active route highlighted (lime accent or bold)
- [ ] Keyboard navigation works (Tab, Enter)
- [ ] Focus indicators visible
- [ ] Mobile menu opens/closes smoothly (200ms transition)
- [ ] Clicking outside mobile menu closes it

**Edge Cases**:
- Navigation during page load (disable links until ready)
- Rapid clicking (debounce navigation)
- Deep linking to protected routes (redirect to signin)

---

#### Feature 5: Settings Pages
**User Story**: As a user, I need to manage my profile, preferences, and account.

**Settings Routes**:
- `/settings` - Main settings page (redirect to `/settings/profile`)
- `/settings/profile` - Edit full_name, avatar, locale, date format, page size
- `/settings/preferences` - Edit theme, email_notifications, auto_save
- `/settings/account` - View email, account created date, delete account (future)

**Form Fields**:

**Profile**:
- Full Name (text input, required, max 100 chars)
- Avatar (file upload, optional, max 5MB, PNG/JPG/WebP)
- Locale (dropdown: en-US, en-GB, etc.)
- Date Format (radio: US, ISO, EU)
- Page Size (radio: Letter, A4)

**Preferences**:
- Theme (dropdown: Light, Dark, System)
- Email Notifications (toggle)
- Auto Save (toggle)
- Default Template (dropdown, future - show placeholder)

**Account**:
- Email (read-only, from Supabase auth)
- Account Created (read-only, formatted date)
- Delete Account (button, shows confirmation dialog, future)

**Acceptance Criteria**:
- [ ] Settings pages accessible from nav
- [ ] Forms pre-populated with current values
- [ ] Save button prominent (lime)
- [ ] Cancel button resets form
- [ ] Success toast on save
- [ ] Error toast on failure
- [ ] Form validation (client + server)
- [ ] Avatar upload to Supabase Storage (`avatars` bucket)
- [ ] Changes persist to database
- [ ] Optimistic UI updates

**API Endpoints Required**:
- `GET /api/v1/me` - Get current user profile + preferences
- `PUT /api/v1/me` - Update user profile
- `PUT /api/v1/settings` - Update user preferences
- `POST /api/v1/storage/upload` - Upload avatar

**Edge Cases**:
- Upload file too large (validate, show error)
- Invalid file type (validate, show error)
- Network failure during save (retry with exponential backoff)
- Concurrent edits (optimistic concurrency with version)

---

### 1.2 Explicitly Out of Scope (Phase 2+)

**DO NOT IMPLEMENT**:
- Document creation/editing (resumes, cover letters)
- AI drafting features
- PDF/DOCX export
- PDF import
- Scoring system
- Templates
- Live preview
- Undo/redo
- Autosave for documents
- Email functionality
- Stripe payment integration
- Analytics

**Phase 1 Focus**: Authentication + Database + Navigation + Settings ONLY.

---

## 2. Technical Architecture Deep Dive

### 2.1 Database Layer

#### Tables & Schema

**profiles**:
```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  locale TEXT NOT NULL DEFAULT 'en-US',
  date_format TEXT NOT NULL DEFAULT 'US',
  page_size TEXT NOT NULL DEFAULT 'Letter',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**user_preferences**:
```sql
CREATE TABLE public.user_preferences (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  theme TEXT NOT NULL DEFAULT 'system',
  email_notifications BOOLEAN NOT NULL DEFAULT true,
  auto_save BOOLEAN NOT NULL DEFAULT true,
  default_template TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Indexes**:
```sql
CREATE INDEX profiles_updated_at_idx ON public.profiles(updated_at DESC);
CREATE INDEX user_preferences_user_id_idx ON public.user_preferences(user_id);
```

**RLS Policies** (Enable RLS on both tables):
```sql
-- profiles
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- user_preferences
CREATE POLICY "prefs_select_own" ON public.user_preferences FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "prefs_insert_own" ON public.user_preferences FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "prefs_update_own" ON public.user_preferences FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
```

**Trigger** (Auto-create profile on sign-up):
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));

  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

**Migration Strategy**:
- Create 7 migration files in `migrations/phase1/`
- Do NOT apply migrations during development
- Await explicit user permission to apply
- Each migration must be idempotent (use `IF NOT EXISTS`)

---

#### Repository Pattern (Pure Functions)

**Location**: `libs/repositories/`

**Files to Create**:
- `libs/repositories/profiles.ts`
- `libs/repositories/preferences.ts`
- `libs/repositories/index.ts` (exports)

**Example Implementation**:
```typescript
// libs/repositories/profiles.ts
import { SupabaseClient } from '@supabase/supabase-js'

export async function getProfile(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) throw error
  return data
}

export async function updateProfile(
  supabase: SupabaseClient,
  userId: string,
  updates: Partial<Profile>
) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}
```

**Critical Rules**:
- Pure functions with dependency injection (no classes)
- Never import repositories in client components
- Always pass user-scoped Supabase client
- Never use service role key in runtime

---

### 2.2 Authentication System

#### Supabase Auth Configuration

**Provider**: Google OAuth ONLY

**Setup Requirements**:
1. Supabase project created (manual, outside agent scope)
2. Google OAuth credentials configured in Supabase dashboard
3. Allowed callback URLs configured: `http://localhost:3000/auth/callback`, production domain

**Environment Variables Required**:
```
NEXT_PUBLIC_SUPABASE_URL=<your-project-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

**Supabase Client Setup** (Already exists in `libs/supabase/`):
- `client.ts` - Browser client
- `server.ts` - Server component/route handler client
- `middleware.ts` - Middleware client with session refresh

**Usage Pattern**:
```typescript
// Server Component
import { createClient } from '@/libs/supabase/server'

export default async function Page() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/signin')

  return <div>Welcome {user.email}</div>
}

// Client Component
'use client'
import { createClient } from '@/libs/supabase/client'

export function Component() {
  const supabase = createClient()
  // Use supabase for client-side operations
}
```

---

#### Protected Route Implementation

**Middleware Approach** (`middleware.ts`):
```typescript
import { createClient } from '@/libs/supabase/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const supabase = createClient(request)
  const { data: { user } } = await supabase.auth.getUser()

  // Protected routes
  const protectedPaths = ['/dashboard', '/settings']
  const isProtected = protectedPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  )

  if (isProtected && !user) {
    const redirectUrl = new URL('/signin', request.url)
    redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

**Alternative: Server Component Guard**:
```typescript
// app/dashboard/layout.tsx
import { createClient } from '@/libs/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({ children }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/signin')
  }

  return <>{children}</>
}
```

**Decision**: Use middleware for global protection, server component guard for layout-specific logic.

---

#### Sign In Flow

**Implementation**:
```typescript
// app/signin/page.tsx
import { SignInButton } from '@/components/auth/SignInButton'

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold">Welcome to ResumePair</h1>
          <p className="mt-2 text-gray-600">Sign in to get started</p>
        </div>
        <SignInButton />
      </div>
    </div>
  )
}

// components/auth/SignInButton.tsx
'use client'
import { createClient } from '@/libs/supabase/client'
import { Button } from '@/components/ui/button'

export function SignInButton() {
  const handleSignIn = async () => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
  }

  return (
    <Button onClick={handleSignIn} variant="primary" size="lg">
      Sign in with Google
    </Button>
  )
}
```

**OAuth Callback Handler**:
```typescript
// app/auth/callback/route.ts
import { createClient } from '@/libs/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(new URL('/dashboard', request.url))
}
```

---

#### Sign Out Flow

**Implementation**:
```typescript
// components/auth/SignOutButton.tsx
'use client'
import { createClient } from '@/libs/supabase/client'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export function SignOutButton() {
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <Button onClick={handleSignOut} variant="ghost">
      Sign Out
    </Button>
  )
}
```

---

### 2.3 API Layer

#### API Utilities Setup

**Location**: `libs/api-utils/`

**Files to Create**:
- `libs/api-utils/index.ts` (exports)
- `libs/api-utils/responses.ts` (apiSuccess, apiError)
- `libs/api-utils/middleware.ts` (withAuth, withApiHandler)
- `libs/api-utils/errors.ts` (error types)
- `libs/api-utils/types.ts` (ApiResponse type)

**Core Types**:
```typescript
// libs/api-utils/types.ts
export type ApiResponse<T = any> = {
  success: boolean
  data?: T
  error?: string
  message?: string
}
```

**Response Helpers**:
```typescript
// libs/api-utils/responses.ts
import { NextResponse } from 'next/server'
import type { ApiResponse } from './types'

export function apiSuccess<T>(data: T, message?: string): NextResponse {
  const response: ApiResponse<T> = {
    success: true,
    data,
    ...(message && { message })
  }
  return NextResponse.json(response)
}

export function apiError(status: number, error: string, message?: string): NextResponse {
  const response: ApiResponse = {
    success: false,
    error,
    ...(message && { message })
  }
  return NextResponse.json(response, { status })
}
```

**Auth Middleware**:
```typescript
// libs/api-utils/middleware.ts
import { createClient } from '@/libs/supabase/server'
import { NextRequest } from 'next/server'
import { apiError } from './responses'

export function withAuth(
  handler: (req: NextRequest, context: { user: User; supabase: SupabaseClient }) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return apiError(401, 'Unauthorized', 'Authentication required')
    }

    return handler(req, { user, supabase })
  }
}

export function withApiHandler(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    try {
      return await handler(req)
    } catch (error) {
      console.error('API Error:', error)
      return apiError(500, 'Internal Server Error', 'An unexpected error occurred')
    }
  }
}
```

---

#### API Endpoints

**Required Endpoints**:

**1. GET /api/v1/me**
- **Purpose**: Get current user profile + preferences
- **Auth**: Required
- **Runtime**: Edge
- **Response**: `{ success: true, data: { profile, preferences } }`

**Implementation**:
```typescript
// app/api/v1/me/route.ts
import { withAuth, apiSuccess, apiError } from '@/libs/api-utils'
import { getProfile } from '@/libs/repositories/profiles'
import { getPreferences } from '@/libs/repositories/preferences'

export const GET = withAuth(async (req, { user, supabase }) => {
  const [profile, preferences] = await Promise.all([
    getProfile(supabase, user.id),
    getPreferences(supabase, user.id)
  ])

  return apiSuccess({ profile, preferences })
})

export const runtime = 'edge'
```

**2. PUT /api/v1/me**
- **Purpose**: Update user profile
- **Auth**: Required
- **Runtime**: Node
- **Body**: `{ full_name?, avatar_url?, locale?, date_format?, page_size? }`
- **Response**: `{ success: true, data: profile }`

**Implementation**:
```typescript
// app/api/v1/me/route.ts (add PUT handler)
import { updateProfile } from '@/libs/repositories/profiles'
import { z } from 'zod'

const UpdateProfileSchema = z.object({
  full_name: z.string().max(100).optional(),
  avatar_url: z.string().url().optional(),
  locale: z.string().optional(),
  date_format: z.enum(['US', 'ISO', 'EU']).optional(),
  page_size: z.enum(['Letter', 'A4']).optional()
})

export const PUT = withAuth(async (req, { user, supabase }) => {
  const body = await req.json()
  const validated = UpdateProfileSchema.parse(body)

  const updated = await updateProfile(supabase, user.id, validated)

  return apiSuccess(updated, 'Profile updated successfully')
})
```

**3. PUT /api/v1/settings**
- **Purpose**: Update user preferences
- **Auth**: Required
- **Runtime**: Node
- **Body**: `{ theme?, email_notifications?, auto_save?, default_template? }`
- **Response**: `{ success: true, data: preferences }`

**Implementation**:
```typescript
// app/api/v1/settings/route.ts
import { withAuth, apiSuccess } from '@/libs/api-utils'
import { getPreferences, updatePreferences } from '@/libs/repositories/preferences'
import { z } from 'zod'

const UpdatePreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  email_notifications: z.boolean().optional(),
  auto_save: z.boolean().optional(),
  default_template: z.string().optional()
})

export const GET = withAuth(async (req, { user, supabase }) => {
  const preferences = await getPreferences(supabase, user.id)
  return apiSuccess(preferences)
})

export const PUT = withAuth(async (req, { user, supabase }) => {
  const body = await req.json()
  const validated = UpdatePreferencesSchema.parse(body)

  const updated = await updatePreferences(supabase, user.id, validated)

  return apiSuccess(updated, 'Preferences updated successfully')
})
```

**4. POST /api/v1/storage/upload**
- **Purpose**: Upload avatar to Supabase Storage
- **Auth**: Required
- **Runtime**: Node
- **Body**: `multipart/form-data { file, bucket, path }`
- **Response**: `{ success: true, data: { bucket, path, url } }`

**Implementation**:
```typescript
// app/api/v1/storage/upload/route.ts
import { withAuth, apiSuccess, apiError } from '@/libs/api-utils'

export const POST = withAuth(async (req, { user, supabase }) => {
  const formData = await req.formData()
  const file = formData.get('file') as File
  const bucket = formData.get('bucket') as string
  const path = formData.get('path') as string

  if (!file || !bucket || !path) {
    return apiError(400, 'Missing required fields')
  }

  // Validate file
  if (file.size > 5 * 1024 * 1024) {
    return apiError(400, 'File too large', 'Maximum size is 5MB')
  }

  const allowedTypes = ['image/png', 'image/jpeg', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    return apiError(400, 'Invalid file type', 'Only PNG, JPG, and WebP allowed')
  }

  // Enforce path-based ownership
  const userPath = `${user.id}/${path}`

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(userPath, file, {
      cacheControl: '3600',
      upsert: true
    })

  if (error) {
    return apiError(500, 'Upload failed', error.message)
  }

  // Generate signed URL
  const { data: { signedUrl } } = await supabase.storage
    .from(bucket)
    .createSignedUrl(userPath, 3600)

  return apiSuccess({
    bucket,
    path: userPath,
    url: signedUrl
  }, 'File uploaded successfully')
})
```

---

### 2.4 UI Layer & Design System

#### Ramp Design System Integration

**Reference**: `ai_docs/design-system.md`

**Core Principles**:
- Dual-token architecture: `--app-*` for application, `--doc-*` for documents
- Phase 1 uses ONLY `--app-*` tokens (no document templates yet)
- HSL color format for all colors
- 8px spacing grid
- Typography scale with Inter font
- Generous whitespace (minimum 16px gaps, 24px card padding)

**Color Palette** (from `app/globals.css`):
```css
:root {
  /* Navy (dark sections, dark mode) */
  --app-navy-dark: 225 52% 8%;        /* #0B0F1E */
  --app-navy-medium: 226 36% 16%;     /* #1A1F35 */

  /* Lime (primary accent) */
  --app-lime: 73 100% 50%;            /* #CDFF00 */
  --app-lime-hover: 70 100% 45%;

  /* Gray scale */
  --app-gray-50: 210 17% 98%;
  --app-gray-100: 210 17% 95%;
  --app-gray-200: 210 16% 93%;
  --app-gray-300: 210 14% 89%;
  --app-gray-500: 210 11% 46%;
  --app-gray-700: 210 9% 31%;
  --app-gray-900: 210 11% 15%;

  /* Semantic colors */
  --app-background: 0 0% 100%;        /* white in light mode */
  --app-foreground: 210 11% 15%;      /* gray-900 */
  --app-primary: 73 100% 50%;         /* lime */
  --app-border: 210 16% 93%;          /* gray-200 */
}

.dark {
  --app-background: 225 52% 8%;       /* navy-dark */
  --app-foreground: 0 0% 100%;        /* white */
  --app-border: 226 36% 16%;          /* navy-medium */
}
```

**Spacing Tokens**:
```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-4: 1rem;      /* 16px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-16: 4rem;     /* 64px */
--space-24: 6rem;     /* 96px */
```

**Typography Scale**:
```css
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-4xl: 2.25rem;   /* 36px */
```

---

#### shadcn/ui Components to Install

**Required Components** (install via CLI):
```bash
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add input
npx shadcn@latest add label
npx shadcn@latest add dropdown-menu
npx shadcn@latest add avatar
npx shadcn@latest add dialog
npx shadcn@latest add toast
npx shadcn@latest add skeleton
npx shadcn@latest add form
npx shadcn@latest add separator
npx shadcn@latest add select
npx shadcn@latest add switch
npx shadcn@latest add radio-group
```

**Component Customization**:
- All components automatically use design tokens via `globals.css`
- No manual customization needed for Phase 1
- Verify lime primary color works for all variants

---

#### Page Components (Detailed Specs)

**Landing Page** (`/app/page.tsx`):
```typescript
// Enhance existing page with:
// - Hero section (navy-dark bg, white text)
// - Single lime CTA button: "Sign in with Google"
// - Value props: "Create ATS-optimized resumes in 60 seconds"
// - Simple footer

// Layout:
<main>
  <section className="section section-dark"> {/* Navy bg */}
    <h1 className="headline-hero text-white">Build Your Perfect Resume</h1>
    <p className="body-large text-gray-300">ATS-optimized resumes in under 60 seconds</p>
    <Button variant="primary" size="lg">Sign in with Google</Button>
  </section>
  <Footer />
</main>
```

**Sign In Page** (`/app/signin/page.tsx`):
```typescript
// Minimal centered layout:
// - App logo
// - "Welcome to ResumePair" headline
// - "Sign in with Google" button (lime)
// - Footer

// Layout:
<main className="flex min-h-screen flex-col items-center justify-center">
  <div className="w-full max-w-md space-y-8 p-6">
    <div className="text-center">
      <Logo className="mx-auto h-12 w-auto" />
      <h1 className="mt-6 text-4xl font-bold">Welcome to ResumePair</h1>
      <p className="mt-2 text-gray-600">Sign in to get started</p>
    </div>
    <SignInButton />
  </div>
</main>
```

**Dashboard Page** (`/app/dashboard/page.tsx`):
```typescript
// Protected page, show after auth:
// - Welcome message: "Welcome back, [name]"
// - Empty state: "You have no resumes yet" (Phase 2 will add document list)
// - CTA placeholder: "Create Resume" (disabled, shows "Coming in Phase 2" tooltip)

// Layout:
<DashboardLayout>
  <div className="space-y-6">
    <div>
      <h1 className="text-4xl font-bold">Welcome back, {user.name || 'there'}</h1>
      <p className="text-gray-600">Ready to build your next resume?</p>
    </div>

    <Card className="p-8 text-center">
      <p className="text-gray-500 mb-4">You have no resumes yet</p>
      <Button variant="primary" disabled>
        Create Resume (Coming in Phase 2)
      </Button>
    </Card>
  </div>
</DashboardLayout>
```

**Settings Pages**:

**Profile** (`/app/settings/profile/page.tsx`):
```typescript
<SettingsLayout>
  <Card className="p-6">
    <h2 className="text-2xl font-bold mb-6">Profile Settings</h2>
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label>Full Name</Label>
        <Input name="full_name" defaultValue={profile.full_name} />
      </div>

      <div>
        <Label>Avatar</Label>
        <AvatarUpload current={profile.avatar_url} onUpload={handleUpload} />
      </div>

      <div>
        <Label>Locale</Label>
        <Select name="locale" defaultValue={profile.locale}>
          <option value="en-US">English (US)</option>
          <option value="en-GB">English (UK)</option>
        </Select>
      </div>

      <div>
        <Label>Date Format</Label>
        <RadioGroup name="date_format" defaultValue={profile.date_format}>
          <Radio value="US">US (MM/DD/YYYY)</Radio>
          <Radio value="ISO">ISO (YYYY-MM-DD)</Radio>
          <Radio value="EU">EU (DD/MM/YYYY)</Radio>
        </RadioGroup>
      </div>

      <div>
        <Label>Page Size</Label>
        <RadioGroup name="page_size" defaultValue={profile.page_size}>
          <Radio value="Letter">Letter (8.5" × 11")</Radio>
          <Radio value="A4">A4 (210mm × 297mm)</Radio>
        </RadioGroup>
      </div>

      <div className="flex gap-4">
        <Button type="submit" variant="primary">Save Changes</Button>
        <Button type="button" variant="secondary" onClick={handleCancel}>Cancel</Button>
      </div>
    </form>
  </Card>
</SettingsLayout>
```

**Preferences** (`/app/settings/preferences/page.tsx`):
```typescript
<SettingsLayout>
  <Card className="p-6">
    <h2 className="text-2xl font-bold mb-6">Preferences</h2>
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label>Theme</Label>
        <Select name="theme" defaultValue={preferences.theme}>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="system">System</option>
        </Select>
      </div>

      <div className="flex items-center justify-between">
        <Label>Email Notifications</Label>
        <Switch name="email_notifications" defaultChecked={preferences.email_notifications} />
      </div>

      <div className="flex items-center justify-between">
        <Label>Auto Save</Label>
        <Switch name="auto_save" defaultChecked={preferences.auto_save} />
      </div>

      <div className="flex gap-4">
        <Button type="submit" variant="primary">Save Changes</Button>
        <Button type="button" variant="secondary" onClick={handleCancel}>Cancel</Button>
      </div>
    </form>
  </Card>
</SettingsLayout>
```

**Account** (`/app/settings/account/page.tsx`):
```typescript
<SettingsLayout>
  <Card className="p-6">
    <h2 className="text-2xl font-bold mb-6">Account</h2>
    <div className="space-y-4">
      <div>
        <Label>Email</Label>
        <p className="text-gray-700">{user.email}</p>
      </div>

      <div>
        <Label>Account Created</Label>
        <p className="text-gray-700">{formatDate(profile.created_at)}</p>
      </div>

      <Separator className="my-6" />

      <div>
        <h3 className="text-lg font-semibold text-destructive mb-2">Danger Zone</h3>
        <p className="text-sm text-gray-600 mb-4">Permanently delete your account and all data</p>
        <Button variant="destructive" disabled>
          Delete Account (Coming Soon)
        </Button>
      </div>
    </div>
  </Card>
</SettingsLayout>
```

---

#### Layout Components (Detailed Specs)

**Header** (`/components/layout/Header.tsx`):
```typescript
// Desktop: Logo (left) + Nav (center) + User Menu (right)
// Mobile: Logo (left) + Hamburger (right)
// Responsive: < 768px shows mobile version

<header className="sticky top-0 z-50 border-b border-app-border bg-app-background">
  <div className="container mx-auto flex h-16 items-center justify-between px-6">
    {/* Logo */}
    <Link href="/" className="flex items-center">
      <Logo className="h-8 w-auto" />
      <span className="ml-2 text-xl font-bold">ResumePair</span>
    </Link>

    {/* Desktop Navigation */}
    <nav className="hidden md:flex items-center gap-6">
      <NavLink href="/dashboard">Dashboard</NavLink>
      <NavLink href="/settings">Settings</NavLink>
    </nav>

    {/* User Menu (Desktop) */}
    <div className="hidden md:block">
      <UserMenu />
    </div>

    {/* Mobile Menu Button */}
    <button
      className="md:hidden"
      onClick={toggleMobileMenu}
      aria-label="Menu"
    >
      <MenuIcon />
    </button>
  </div>
</header>

// UserMenu Component:
<DropdownMenu>
  <DropdownMenuTrigger>
    <Avatar src={user.avatar_url} fallback={initials} />
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem>
      <Link href="/settings/profile">Profile</Link>
    </DropdownMenuItem>
    <DropdownMenuItem>
      <Link href="/settings">Settings</Link>
    </DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem>
      <SignOutButton />
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

**Sidebar** (`/components/layout/Sidebar.tsx`):
```typescript
// Desktop only, hidden on mobile
// Collapsible with button
// Shows active route with lime accent

<aside className="hidden lg:flex h-screen w-64 flex-col border-r border-app-border bg-app-background">
  <div className="flex-1 overflow-y-auto p-6">
    <nav className="space-y-2">
      <NavItem href="/dashboard" icon={<LayoutDashboard />}>
        Dashboard
      </NavItem>
      <NavItem href="/settings" icon={<Settings />}>
        Settings
      </NavItem>
    </nav>
  </div>

  <div className="border-t border-app-border p-4">
    <SignOutButton variant="ghost" className="w-full" />
  </div>
</aside>

// NavItem Component:
<Link
  href={href}
  className={cn(
    "flex items-center gap-3 rounded-lg px-3 py-2 transition-colors",
    isActive
      ? "bg-app-primary/10 text-app-primary font-semibold"
      : "text-gray-700 hover:bg-gray-100"
  )}
>
  {icon}
  {children}
</Link>
```

**Footer** (`/components/layout/Footer.tsx`):
```typescript
// Simple footer with links and copyright
// Light gray background, centered content

<footer className="border-t border-app-border bg-app-background">
  <div className="container mx-auto px-6 py-8">
    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
      {/* Links */}
      <nav className="flex gap-6 text-sm">
        <Link href="/tos" className="text-gray-600 hover:text-gray-900">
          Terms
        </Link>
        <Link href="/privacy-policy" className="text-gray-600 hover:text-gray-900">
          Privacy
        </Link>
        <a href="mailto:support@resumepair.com" className="text-gray-600 hover:text-gray-900">
          Support
        </a>
      </nav>

      {/* Copyright */}
      <p className="text-sm text-gray-500">
        © {new Date().getFullYear()} ResumePair. All rights reserved.
      </p>
    </div>
  </div>
</footer>
```

**Mobile Menu** (`/components/layout/MobileMenu.tsx`):
```typescript
// Slide-out drawer from right
// Covers full screen
// Backdrop with click-to-close

<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent className="fixed inset-0 z-50 md:hidden">
    {/* Backdrop */}
    <div
      className="fixed inset-0 bg-black/50"
      onClick={() => setIsOpen(false)}
    />

    {/* Drawer */}
    <div className="fixed right-0 top-0 bottom-0 w-80 bg-app-background shadow-2xl">
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-app-border p-6">
          <h2 className="text-lg font-semibold">Menu</h2>
          <button onClick={() => setIsOpen(false)}>
            <XIcon />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-6 space-y-2">
          <MobileNavItem href="/dashboard" icon={<LayoutDashboard />}>
            Dashboard
          </MobileNavItem>
          <MobileNavItem href="/settings" icon={<Settings />}>
            Settings
          </MobileNavItem>
        </nav>

        {/* Footer */}
        <div className="border-t border-app-border p-6">
          <SignOutButton variant="outline" className="w-full" />
        </div>
      </div>
    </div>
  </DialogContent>
</Dialog>
```

**Breadcrumbs** (`/components/layout/Breadcrumbs.tsx`):
```typescript
// Show current path hierarchy
// Home > Dashboard > Settings > Profile

<nav aria-label="Breadcrumb" className="mb-6">
  <ol className="flex items-center gap-2 text-sm">
    <li>
      <Link href="/" className="text-gray-600 hover:text-gray-900">
        Home
      </Link>
    </li>
    {segments.map((segment, index) => (
      <li key={segment.path} className="flex items-center gap-2">
        <ChevronRight className="h-4 w-4 text-gray-400" />
        <Link
          href={segment.path}
          className={cn(
            index === segments.length - 1
              ? "text-gray-900 font-semibold"
              : "text-gray-600 hover:text-gray-900"
          )}
        >
          {segment.label}
        </Link>
      </li>
    ))}
  </ol>
</nav>
```

---

### 2.5 State Management (Minimal for Phase 1)

**Zustand Not Required for Phase 1** - All state is server-driven:
- Auth state: Supabase session
- Profile/preferences: Fetched from API, managed by React state
- UI state (mobile menu open): Local component state

**If Client State Needed** (future):
```typescript
// libs/stores/auth.ts (example, likely not needed)
import { create } from 'zustand'

interface AuthState {
  user: User | null
  setUser: (user: User | null) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user })
}))
```

**Decision**: Avoid Zustand in Phase 1 unless absolutely necessary. Use server components and React state.

---

## 3. Dependencies & Integration Points

### 3.1 Implementation Order

**Critical Path** (Must be done in order):
1. ✅ Supabase client setup (already exists in `libs/supabase/`)
2. Database migration files (create, do not apply)
3. Repository functions (`libs/repositories/`)
4. API utilities (`libs/api-utils/`)
5. API endpoints (`/api/v1/me`, `/api/v1/settings`, `/api/v1/storage/upload`)
6. Auth components (SignInButton, SignOutButton)
7. Protected route middleware
8. Sign in page
9. Layout components (Header, Sidebar, Footer, MobileMenu)
10. Dashboard page
11. Settings pages (Profile, Preferences, Account)
12. Visual verification & testing

**Parallel Work Allowed**:
- Layout components can be built while API endpoints are in progress
- Settings pages can be built in parallel (Profile, Preferences, Account are independent)
- shadcn/ui components can be installed anytime

---

### 3.2 Component Dependencies

**Header depends on**:
- Logo component (create simple SVG)
- NavLink component (create)
- UserMenu component (create with DropdownMenu)
- SignOutButton component

**Sidebar depends on**:
- NavItem component (create)
- Icons (Lucide React)
- Active route detection (usePathname hook)

**Settings pages depend on**:
- Form components (shadcn/ui: Input, Label, Select, Switch, RadioGroup)
- API client functions
- Toast notifications
- File upload component (for avatar)

**Mobile Menu depends on**:
- Dialog component (shadcn/ui)
- Navigation items (same as Sidebar)
- Open/close state

---

### 3.3 Data Flow

**Auth Flow**:
```
User clicks "Sign in"
→ Supabase OAuth redirect
→ Google auth
→ Callback to /auth/callback
→ Create session
→ Redirect to /dashboard
→ Trigger creates profile in DB (if first time)
```

**Profile Update Flow**:
```
User edits form in /settings/profile
→ Client submits to PUT /api/v1/me
→ API validates with Zod
→ Repository updates DB (with RLS)
→ API returns updated profile
→ Client shows success toast
→ Optimistic UI update
```

**Avatar Upload Flow**:
```
User selects file
→ Client validates (size, type)
→ POST /api/v1/storage/upload (multipart)
→ API validates again
→ Upload to Supabase Storage (avatars bucket, user_id/ prefix)
→ Generate signed URL
→ Return URL to client
→ Client updates form field
→ Submit profile update with new avatar_url
```

---

### 3.4 External Dependencies

**Required Services**:
- Supabase project (manual setup, outside agent scope)
- Google OAuth credentials (manual setup, outside agent scope)

**Environment Variables** (`.env.local`):
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**NPM Packages** (already in package.json):
- `@supabase/supabase-js`
- `@supabase/ssr`
- `next`
- `react`
- `tailwindcss`
- `lucide-react`
- `zod`
- (shadcn/ui components will add more)

**No Additional Packages Needed** for Phase 1.

---

## 4. Constraints & Non-Negotiables

### 4.1 Architectural Constraints (from coding_patterns.md)

**Repository Pattern** (MANDATORY):
- ✅ Pure functions with dependency injection
- ❌ NO classes or singletons
- ✅ Always pass user-scoped Supabase client
- ❌ NEVER use service role key in runtime

**API Pattern** (MANDATORY):
- ✅ Always use `withAuth` or `withApiHandler`
- ❌ NO raw route handlers
- ✅ All responses use `ApiResponse<T>` envelope
- ✅ Validate all inputs with Zod

**Migration Pattern** (MANDATORY):
- ✅ Create migration files in `migrations/phase1/`
- ❌ DO NOT apply migrations during development
- ✅ Wait for explicit user permission
- ✅ Each migration must be idempotent

**Design System** (MANDATORY):
- ✅ Use only `--app-*` tokens (Phase 1 has no documents)
- ❌ NO hardcoded colors (#hex) or spacing (px values)
- ✅ Install shadcn/ui components via CLI
- ❌ NO other UI libraries (no DaisyUI, no Chakra, no Material-UI)

---

### 4.2 Technology Constraints (from development_decisions.md)

**Authentication** (FIXED):
- ✅ Google OAuth ONLY
- ❌ NO email/password auth
- ❌ NO other social providers

**Database** (FIXED):
- ✅ Supabase ONLY
- ✅ Postgres with RLS
- ❌ NO other databases

**UI Framework** (FIXED):
- ✅ Tailwind CSS + shadcn/ui
- ❌ NO DaisyUI (migrated away)
- ❌ NO other component libraries

**Testing** (FIXED):
- ✅ Puppeteer MCP + Manual Playbooks
- ❌ NO Playwright
- ❌ NO Vitest
- ❌ NO automated test files

**Deployment** (FIXED):
- ❌ Agents DO NOT handle deployment
- ❌ Agents DO NOT configure CI/CD
- ❌ Focus on application code only

**Payment** (FIXED):
- ❌ NO Stripe integration in Phase 1
- ✅ Stripe added at ABSOLUTE LAST STEP (after all features)

---

### 4.3 Design Constraints (from design-system.md)

**Color Usage**:
- ✅ ONE lime CTA button per screen section
- ✅ Navy backgrounds (dark mode)
- ✅ Gray scale for hierarchy
- ❌ NO multiple lime elements competing
- ❌ NO off-palette colors (blue, green, red except destructive)

**Spacing**:
- ✅ Minimum 16px gaps between elements
- ✅ Minimum 24px card padding
- ✅ Section padding: 64px mobile, 96px desktop
- ❌ NO cramped spacing (< 16px gaps)

**Typography**:
- ✅ Clear hierarchy (4xl headlines, 2xl sections, xl cards, base body)
- ✅ Proper weights (400 body, 600 headings)
- ❌ NO same size/weight for all text

**Components**:
- ✅ Buttons: Prominent primary (lime), subtle secondary
- ✅ Cards: rounded-lg, shadow-sm, p-6
- ✅ Forms: Clear labels, visible focus states
- ❌ NO inconsistent patterns

---

### 4.4 Testing Constraints (from testing/README.md)

**Visual Verification** (MANDATORY):
- ✅ Take desktop screenshot (1440px) for every UI feature
- ✅ Take mobile screenshot (375px) for every UI feature
- ✅ Analyze against Visual Quality Checklist
- ✅ Save screenshots to `ai_docs/progress/phase_1/screenshots/`
- ❌ NO marking feature complete without screenshots

**Playbook Execution** (MANDATORY):
- ✅ Execute `phase_1_auth.md` playbook
- ✅ Execute `phase_1_navigation.md` playbook
- ✅ Document results in `ai_docs/progress/phase_1/playbook_results.md`
- ❌ NO proceeding to Phase 2 without passing playbooks

**No Test Code**:
- ❌ DO NOT write test files
- ❌ DO NOT use Playwright or Vitest
- ✅ Execute manual playbooks with Puppeteer MCP commands

---

## 5. Testing & Validation Requirements

### 5.1 Playbook Execution

**Required Playbooks**:
1. `ai_docs/testing/playbooks/phase_1_auth.md` (~15-20 min)
2. `ai_docs/testing/playbooks/phase_1_navigation.md` (~10-15 min)

**Execution Process**:
1. Start dev server: `npm run dev`
2. Open playbook markdown file
3. Execute each MCP command in sequence
4. Take screenshots as specified
5. Verify against pass criteria
6. Document results

**Pass Criteria Summary**:

**Auth Playbook**:
- ✅ Sign in button present and functional
- ✅ OAuth flow initiates correctly
- ✅ Successful auth redirects to dashboard
- ✅ Protected routes redirect unauthenticated users
- ✅ Sign out clears session
- ✅ Session persists across refreshes

**Navigation Playbook**:
- ✅ Header elements present (logo, nav, user menu)
- ✅ Navigation links work
- ✅ Mobile menu functional
- ✅ Breadcrumbs present (if applicable)
- ✅ Active route highlighted
- ✅ Keyboard navigation works

---

### 5.2 Visual Verification Standards

**Screenshot Requirements**:
- Desktop: 1440px × 900px
- Mobile: 375px × 667px
- Save to: `ai_docs/progress/phase_1/screenshots/{desktop,mobile}/`

**Pages to Screenshot**:
- Landing page (desktop + mobile)
- Sign in page (desktop + mobile)
- Dashboard (desktop + mobile)
- Header (desktop)
- Settings pages (Profile, Preferences, Account - desktop only)
- Mobile menu (mobile open state)

**Visual Quality Checklist** (from component_standards.md):
- [ ] Spacing generous (≥16px gaps, ≥24px card padding)
- [ ] Clear typography hierarchy (4xl → 2xl → xl → base)
- [ ] One primary action (lime button) per section
- [ ] Design tokens used (no hardcoded values)
- [ ] Responsive (no horizontal scroll on mobile)
- [ ] Ramp palette only (navy, lime, grays)
- [ ] Touch targets ≥48px on mobile
- [ ] All cards use rounded-lg + shadow-sm
- [ ] Forms have visible focus states

---

### 5.3 Validation Scripts

**Run Before Phase Gate**:
```bash
# Type check
npm run type-check

# Lint
npm run lint

# Build
npm run build
```

**Expected Output**:
- ✅ No TypeScript errors
- ✅ No ESLint errors
- ✅ Build succeeds

---

### 5.4 Phase Gate Criteria

**Before marking Phase 1 complete**:

**Functional Requirements**:
- [ ] All 5 core features implemented
- [ ] All API endpoints functional
- [ ] All pages render without errors
- [ ] Authentication flow complete (sign in, sign out, protected routes)
- [ ] Settings forms submit and persist data

**Testing Requirements**:
- [ ] Auth playbook executed and passed
- [ ] Navigation playbook executed and passed
- [ ] All screenshots captured and saved
- [ ] Visual quality standards met

**Code Quality**:
- [ ] No TypeScript errors
- [ ] No ESLint warnings (critical errors only)
- [ ] Build succeeds
- [ ] All design tokens used (no hardcoded values found)

**Documentation**:
- [ ] Migration files created (not applied)
- [ ] Playbook results documented
- [ ] Visual review documented
- [ ] Screenshots organized in correct folders

**Approval**:
- [ ] User reviews and approves Phase 1 work
- [ ] User gives permission to apply migrations
- [ ] User confirms Phase 2 can begin

**Time Estimate**: 20-30 minutes for complete phase gate validation

---

## 6. Risk Analysis & Mitigation

### 6.1 Technical Risks

**Risk 1: Supabase OAuth Configuration Issues**
- **Likelihood**: Medium
- **Impact**: High (blocks all auth)
- **Symptoms**: OAuth redirect fails, callback errors, session not created
- **Mitigation**:
  - Verify Google OAuth credentials in Supabase dashboard
  - Check allowed callback URLs include localhost and production
  - Test OAuth flow manually before implementation
  - Provide clear error messages to user
- **Fallback**: Document issue, ask user to verify Supabase setup

**Risk 2: RLS Policies Block Expected Operations**
- **Likelihood**: Medium
- **Impact**: High (data access fails)
- **Symptoms**: API returns 404 even with valid user, queries return empty
- **Mitigation**:
  - Test RLS policies with real user after migration
  - Ensure SELECT policy exists (required even for updates)
  - Use user-scoped client, never service role
  - Add logging to repository functions
- **Fallback**: Review and fix policies, re-apply migration

**Risk 3: Migration Application Failures**
- **Likelihood**: Low
- **Impact**: Medium (need to rollback)
- **Symptoms**: Migration fails, database in inconsistent state
- **Mitigation**:
  - Make migrations idempotent (IF NOT EXISTS)
  - Test each migration on separate Supabase project first
  - Apply migrations one at a time
  - Have rollback SQL ready
- **Fallback**: Rollback migration, fix issue, re-apply

**Risk 4: Design Token Missing for Component**
- **Likelihood**: Low
- **Impact**: Low (visual inconsistency)
- **Symptoms**: Component uses hardcoded value, doesn't match design
- **Mitigation**:
  - Review `globals.css` for all required tokens
  - Add missing tokens before implementation
  - Grep codebase for hardcoded hex/px values
- **Fallback**: Add token, update component, re-verify

---

### 6.2 Implementation Complexity Risks

**Risk 1: Avatar Upload Complexity**
- **Likelihood**: Medium
- **Impact**: Medium (feature works but rough edges)
- **Challenges**: File validation, size limits, Supabase Storage setup, signed URLs
- **Mitigation**:
  - Start with simple upload (no preview, no crop)
  - Validate size and type on both client and server
  - Use Supabase Storage RLS with path-based ownership
  - Generate signed URL with short TTL (1 hour)
- **Simplification**: Skip preview/crop in Phase 1, just show uploaded avatar

**Risk 2: Mobile Menu State Management**
- **Likelihood**: Low
- **Impact**: Low (UX issue)
- **Challenges**: Open/close state, click outside, body scroll lock
- **Mitigation**:
  - Use shadcn/ui Dialog component (handles all state)
  - Test on real mobile device (not just responsive view)
- **Simplification**: Use Dialog/Sheet component from shadcn/ui

**Risk 3: Protected Route Edge Cases**
- **Likelihood**: Medium
- **Impact**: Medium (security concern if wrong)
- **Challenges**: Session expiry, race conditions, redirect loops
- **Mitigation**:
  - Use middleware for all protection (single source of truth)
  - Add redirect param to preserve intended destination
  - Test session expiry manually (clear cookies)
  - Add max redirect check to prevent loops
- **Simplification**: Keep middleware logic simple, no complex state

---

### 6.3 Schedule Risks

**Risk 1: Scope Creep (Adding Phase 2 Features)**
- **Likelihood**: High
- **Impact**: High (delays Phase 1, mixes concerns)
- **Prevention**:
  - Review scope section (1.2 Out of Scope) before starting
  - Disable/hide Phase 2 features (show "Coming Soon" placeholders)
  - Resist urge to "just quickly add" document editing
- **Enforcement**: User reviews and confirms only Phase 1 features present

**Risk 2: Over-Engineering**
- **Likelihood**: Medium
- **Impact**: Medium (wastes time, adds complexity)
- **Prevention**:
  - Follow YAGNI (You Aren't Gonna Need It)
  - No Zustand unless clearly needed (Phase 1 likely doesn't need it)
  - No complex state machines for simple UI
  - No premature optimization
- **Enforcement**: Code review focuses on simplicity

---

## 7. Success Metrics & Definition of Done

### 7.1 Feature Completeness

**Authentication**:
- ✅ User can sign in with Google
- ✅ User can sign out
- ✅ Session persists across refreshes
- ✅ Protected routes redirect unauthenticated users
- ✅ OAuth errors handled gracefully

**Database**:
- ✅ Migration files created (7 files in `migrations/phase1/`)
- ✅ RLS policies defined
- ✅ Trigger for profile creation defined
- ✅ Repository functions implemented (profiles, preferences)
- ✅ No direct SQL in route handlers

**API**:
- ✅ GET /api/v1/me returns user profile + preferences
- ✅ PUT /api/v1/me updates profile
- ✅ PUT /api/v1/settings updates preferences
- ✅ POST /api/v1/storage/upload handles avatar upload
- ✅ All endpoints use withAuth wrapper
- ✅ All responses use ApiResponse envelope
- ✅ All inputs validated with Zod

**Layouts**:
- ✅ Header with logo, nav, user menu
- ✅ Sidebar with nav links (desktop only)
- ✅ Footer with links and copyright
- ✅ Mobile menu functional
- ✅ Breadcrumbs present (if nested routes)
- ✅ All layouts use design tokens

**Pages**:
- ✅ Landing page with sign in CTA
- ✅ Sign in page functional
- ✅ Dashboard page accessible after auth
- ✅ Settings pages (Profile, Preferences, Account)
- ✅ 404 and error pages verified
- ✅ All pages responsive

**Settings**:
- ✅ Profile form pre-populated with current values
- ✅ Avatar upload works
- ✅ Form validation (client + server)
- ✅ Save/Cancel buttons functional
- ✅ Success/error toasts shown
- ✅ Changes persist to database

---

### 7.2 Quality Metrics

**Code Quality**:
- ✅ No TypeScript errors
- ✅ No ESLint critical errors
- ✅ Build succeeds without warnings
- ✅ No hardcoded values (grep for #, px outside tokens)
- ✅ All components follow naming conventions

**Visual Quality**:
- ✅ All screenshots meet Visual Quality Checklist
- ✅ Spacing generous (≥16px gaps, ≥24px padding)
- ✅ Typography hierarchy clear
- ✅ One primary action per section
- ✅ Responsive layouts work

**Performance** (not measured in Phase 1, but avoid obvious issues):
- ✅ No layout shift on page load
- ✅ No slow queries (< 1s for all API calls)
- ✅ Images optimized (avatars < 500KB)

---

### 7.3 Testing Metrics

**Playbook Execution**:
- ✅ Auth playbook: 5/5 tests passed
- ✅ Navigation playbook: 4/4 tests passed
- ✅ All screenshots captured (8+ total)
- ✅ No critical issues found

**Manual Testing**:
- ✅ Sign in/out flow tested manually
- ✅ Settings forms tested (all fields)
- ✅ Avatar upload tested (valid and invalid files)
- ✅ Mobile menu tested on real device
- ✅ Keyboard navigation tested

---

### 7.4 Definition of Done

**Phase 1 is DONE when**:
1. All 5 core features implemented
2. All API endpoints functional and tested
3. All pages render without errors
4. Auth playbook passed (5/5 tests)
5. Navigation playbook passed (4/4 tests)
6. All screenshots captured and reviewed
7. Visual quality standards met
8. No TypeScript errors
9. No ESLint critical errors
10. Build succeeds
11. Migration files created (not applied yet)
12. Documentation complete (playbook results, visual review)
13. User reviews and approves
14. User gives permission to apply migrations

**User must explicitly confirm**:
- "Phase 1 features are complete and working"
- "Visual quality meets standards"
- "I approve applying migrations"
- "Ready to proceed to Phase 2"

---

## 8. Open Questions & Clarifications Needed

### 8.1 Clarifications from Requirements

**Question 1: Breadcrumbs Implementation**
- **Issue**: Phase 1 doc mentions breadcrumbs, but no nested routes exist yet
- **Current Routes**: `/`, `/signin`, `/dashboard`, `/settings`, `/settings/profile`, etc.
- **Clarification Needed**: Are breadcrumbs needed for Settings sub-pages?
- **Recommendation**: Implement for `/settings/*` only (e.g., "Settings > Profile")

**Question 2: Theme Switching Mechanism**
- **Issue**: Preferences include theme selection, but no ThemeProvider implemented
- **Current Status**: `globals.css` has dark mode styles with `.dark` class
- **Clarification Needed**: Is theme switching functional in Phase 1, or just saved preference?
- **Recommendation**: Implement ThemeProvider with `next-themes`, apply theme immediately

**Question 3: Email Notifications Toggle**
- **Issue**: No email functionality in Phase 1, but preferences has email_notifications toggle
- **Clarification Needed**: Does this toggle do anything in Phase 1?
- **Recommendation**: Save preference but show tooltip "Email notifications coming soon"

**Question 4: Delete Account Implementation**
- **Issue**: Account page shows "Delete Account" button but marked "Coming Soon"
- **Clarification Needed**: Should button be disabled or hidden?
- **Recommendation**: Show button disabled with tooltip "Coming soon"

---

### 8.2 Assumptions (Proceeding with These)

**Assumption 1: Supabase Project Already Exists**
- User has manually created Supabase project
- Google OAuth credentials configured
- Environment variables provided
- Agent does NOT create project

**Assumption 2: No AI Features in Phase 1**
- Dashboard shows empty state: "No resumes yet"
- "Create Resume" button disabled with "Coming in Phase 2" tooltip
- No AI drafting, no templates, no scoring

**Assumption 3: Theme Switching Functional**
- Implement next-themes provider
- Theme preference immediately applied
- Dark mode fully functional (not just CSS stub)

**Assumption 4: Avatar Upload Simple**
- No image cropping or preview
- Upload directly to Supabase Storage
- Show uploaded avatar immediately
- File validation (type, size) only

**Assumption 5: Settings Forms Use React Hook Form**
- shadcn/ui Form component (wraps react-hook-form)
- Zod validation
- Optimistic updates
- Toast notifications

**Assumption 6: Mobile Menu Uses shadcn/ui Sheet**
- Not custom implementation
- Handles all state, backdrop, transitions
- Accessibility built-in

---

### 8.3 Edge Cases Requiring Decisions

**Edge Case 1: User Cancels OAuth Mid-Flow**
- **Scenario**: User clicks "Sign in with Google" but cancels Google popup
- **Current Behavior**: Undefined
- **Decision**: Stay on sign in page, show info toast "Sign in cancelled", allow retry

**Edge Case 2: Profile Creation Trigger Fails**
- **Scenario**: User signs in but profile creation fails (DB error, timeout)
- **Current Behavior**: Undefined
- **Decision**: Show error page with "Setup incomplete" message, contact support

**Edge Case 3: Avatar Upload Fails (Network Error)**
- **Scenario**: User uploads avatar but POST /api/v1/storage/upload fails
- **Current Behavior**: Undefined
- **Decision**: Show error toast, keep old avatar, allow retry

**Edge Case 4: Concurrent Settings Updates**
- **Scenario**: User has Settings open in two tabs, updates in both
- **Current Behavior**: Last write wins (no conflict detection)
- **Decision**: Accept last write wins for Phase 1, add optimistic concurrency in Phase 2

**Edge Case 5: Very Long User Names**
- **Scenario**: User has name > 50 characters (Google allows this)
- **Current Behavior**: May overflow UI
- **Decision**: Truncate in Header/Sidebar with ellipsis, show full name in Settings/tooltip

---

## 9. Implementation Checklist (for Implementer)

### 9.1 Pre-Implementation Setup

- [ ] Review complete Phase 1 scope (section 1)
- [ ] Read coding patterns (`ai_docs/coding_patterns.md`)
- [ ] Read development decisions (`ai_docs/development_decisions.md`)
- [ ] Read design system (`ai_docs/design-system.md`)
- [ ] Verify Supabase environment variables present
- [ ] Install shadcn/ui components (see section 2.4)

---

### 9.2 Database & Migrations

- [ ] Create `migrations/phase1/` directory
- [ ] Write 001_enable_extensions.sql
- [ ] Write 002_create_profiles_table.sql
- [ ] Write 003_create_user_preferences_table.sql
- [ ] Write 004_setup_rls_policies_profiles.sql
- [ ] Write 005_setup_rls_policies_preferences.sql
- [ ] Write 006_create_profile_trigger.sql
- [ ] Write 007_create_indexes.sql
- [ ] Verify each migration is idempotent
- [ ] Document migration files (DO NOT APPLY)

---

### 9.3 Repository Layer

- [ ] Create `libs/repositories/profiles.ts`
  - [ ] getProfile(supabase, userId)
  - [ ] updateProfile(supabase, userId, updates)
- [ ] Create `libs/repositories/preferences.ts`
  - [ ] getPreferences(supabase, userId)
  - [ ] updatePreferences(supabase, userId, updates)
- [ ] Create `libs/repositories/index.ts` (exports)
- [ ] Test repositories with mocked Supabase client

---

### 9.4 API Layer

- [ ] Create `libs/api-utils/types.ts` (ApiResponse)
- [ ] Create `libs/api-utils/responses.ts` (apiSuccess, apiError)
- [ ] Create `libs/api-utils/middleware.ts` (withAuth, withApiHandler)
- [ ] Create `libs/api-utils/errors.ts` (error types)
- [ ] Create `libs/api-utils/index.ts` (exports)
- [ ] Create `app/api/v1/me/route.ts`
  - [ ] GET handler (returns profile + preferences)
  - [ ] PUT handler (updates profile)
- [ ] Create `app/api/v1/settings/route.ts`
  - [ ] GET handler (returns preferences)
  - [ ] PUT handler (updates preferences)
- [ ] Create `app/api/v1/storage/upload/route.ts`
  - [ ] POST handler (handles avatar upload)
  - [ ] File validation (size, type)
  - [ ] Path-based ownership enforcement
- [ ] Test all endpoints with curl/Postman

---

### 9.5 Auth Components

- [ ] Create `components/auth/SignInButton.tsx`
  - [ ] Implements Google OAuth sign in
  - [ ] Shows loading state
  - [ ] Handles errors
- [ ] Create `components/auth/SignOutButton.tsx`
  - [ ] Implements sign out
  - [ ] Redirects to home
  - [ ] Shows confirmation (optional)
- [ ] Create `app/auth/callback/route.ts`
  - [ ] Handles OAuth callback
  - [ ] Exchanges code for session
  - [ ] Redirects to dashboard
- [ ] Create `middleware.ts`
  - [ ] Protects routes (/dashboard, /settings)
  - [ ] Refreshes session
  - [ ] Redirects unauthenticated users to /signin

---

### 9.6 Layout Components

- [ ] Create `components/layout/Header.tsx`
  - [ ] Logo (left)
  - [ ] Navigation (center, desktop only)
  - [ ] User menu (right, desktop only)
  - [ ] Hamburger button (right, mobile only)
  - [ ] Responsive breakpoint: 768px
- [ ] Create `components/layout/Sidebar.tsx`
  - [ ] Navigation links with icons
  - [ ] Active route highlighting
  - [ ] Hidden on mobile (lg:flex)
  - [ ] Sign out button at bottom
- [ ] Create `components/layout/Footer.tsx`
  - [ ] Links (Terms, Privacy, Support)
  - [ ] Copyright text
  - [ ] Centered on mobile, spaced on desktop
- [ ] Create `components/layout/MobileMenu.tsx`
  - [ ] Uses shadcn/ui Sheet/Dialog
  - [ ] Slide-out from right
  - [ ] All navigation links
  - [ ] Sign out button
  - [ ] Close on link click
- [ ] Create `components/layout/Breadcrumbs.tsx`
  - [ ] Show route hierarchy
  - [ ] Highlight current page
  - [ ] Links clickable

---

### 9.7 Pages

- [ ] Enhance `app/page.tsx` (Landing)
  - [ ] Hero section with navy background
  - [ ] Lime "Sign in with Google" CTA
  - [ ] Value proposition text
  - [ ] Footer
- [ ] Create `app/signin/page.tsx`
  - [ ] Centered layout
  - [ ] Logo + headline
  - [ ] SignInButton component
  - [ ] Footer
- [ ] Create `app/dashboard/page.tsx`
  - [ ] Protected route (use middleware)
  - [ ] Welcome message with user name
  - [ ] Empty state card
  - [ ] "Create Resume" button (disabled)
- [ ] Create `app/dashboard/layout.tsx`
  - [ ] Renders Header
  - [ ] Renders Sidebar (desktop)
  - [ ] Main content area
  - [ ] Responsive grid
- [ ] Create `app/settings/page.tsx`
  - [ ] Redirects to /settings/profile
- [ ] Create `app/settings/layout.tsx`
  - [ ] Settings navigation tabs
  - [ ] Main content area
- [ ] Create `app/settings/profile/page.tsx`
  - [ ] Profile form
  - [ ] Avatar upload
  - [ ] Locale, date format, page size
  - [ ] Save/Cancel buttons
- [ ] Create `app/settings/preferences/page.tsx`
  - [ ] Theme selector
  - [ ] Email notifications toggle
  - [ ] Auto save toggle
  - [ ] Save/Cancel buttons
- [ ] Create `app/settings/account/page.tsx`
  - [ ] Read-only email
  - [ ] Read-only created date
  - [ ] Delete account button (disabled)
- [ ] Verify `app/not-found.tsx` (already exists)
- [ ] Verify `app/error.tsx` (already exists)
- [ ] Create `app/offline.tsx`
  - [ ] Offline message
  - [ ] Retry button

---

### 9.8 Visual Verification

- [ ] Start dev server (`npm run dev`)
- [ ] Navigate to each page
- [ ] Take desktop screenshot (1440px) for:
  - [ ] Landing page
  - [ ] Sign in page
  - [ ] Dashboard
  - [ ] Settings > Profile
  - [ ] Settings > Preferences
  - [ ] Settings > Account
- [ ] Take mobile screenshot (375px) for:
  - [ ] Landing page
  - [ ] Sign in page
  - [ ] Dashboard
  - [ ] Mobile menu (open state)
- [ ] Review against Visual Quality Checklist
- [ ] Fix any issues found
- [ ] Save screenshots to `ai_docs/progress/phase_1/screenshots/`

---

### 9.9 Playbook Execution

- [ ] Execute `ai_docs/testing/playbooks/phase_1_auth.md`
  - [ ] All 5 tests passed
  - [ ] Screenshots captured
  - [ ] Results documented
- [ ] Execute `ai_docs/testing/playbooks/phase_1_navigation.md`
  - [ ] All 4 tests passed
  - [ ] Screenshots captured
  - [ ] Results documented
- [ ] Create `ai_docs/progress/phase_1/playbook_results.md`
  - [ ] Summary of all tests
  - [ ] Pass/fail status
  - [ ] Issues found and resolved
- [ ] Create `ai_docs/progress/phase_1/visual_review.md`
  - [ ] All pages reviewed
  - [ ] Design standards met
  - [ ] Screenshots referenced

---

### 9.10 Code Quality

- [ ] Run `npm run type-check` (no errors)
- [ ] Run `npm run lint` (no critical errors)
- [ ] Run `npm run build` (build succeeds)
- [ ] Grep for hardcoded values:
  - [ ] `grep -r "#[0-9a-f]" app/` (no hex colors outside comments)
  - [ ] `grep -r "px" app/` (no px values except in design tokens)
- [ ] Review all files for:
  - [ ] No `any` types
  - [ ] Proper imports (path aliases)
  - [ ] Consistent naming

---

### 9.11 Documentation

- [ ] Update README if needed
- [ ] Document migration files (header comments)
- [ ] Document API endpoints (inline comments)
- [ ] Complete playbook results
- [ ] Complete visual review
- [ ] Organize screenshots

---

### 9.12 User Review & Approval

- [ ] Present completed Phase 1 to user
- [ ] Demo auth flow
- [ ] Demo settings pages
- [ ] Show screenshots
- [ ] Show playbook results
- [ ] Request user approval
- [ ] Request permission to apply migrations
- [ ] Await user confirmation to proceed to Phase 2

---

## 10. Summary

### What Phase 1 Delivers

**Functional Foundation**:
- ✅ Google OAuth authentication (sign in, sign out)
- ✅ Protected routes (middleware-based)
- ✅ Supabase database with RLS
- ✅ User profile and preferences storage
- ✅ Settings pages (Profile, Preferences, Account)
- ✅ Avatar upload to Supabase Storage
- ✅ Responsive layouts (Header, Sidebar, Footer, Mobile Menu)
- ✅ Navigation system with active route highlighting

**Technical Foundation**:
- ✅ Repository pattern (pure functions)
- ✅ API utilities (withAuth, apiSuccess, apiError)
- ✅ Design system integration (Ramp palette, design tokens)
- ✅ shadcn/ui components installed
- ✅ Migration files created (ready to apply)
- ✅ Type-safe codebase (no TypeScript errors)

**Testing & Quality**:
- ✅ Puppeteer MCP playbooks executed
- ✅ Visual verification complete
- ✅ Screenshots documented
- ✅ Code quality validated

---

### What Phase 1 Does NOT Deliver

**Explicitly Out of Scope**:
- ❌ Document editing (resumes, cover letters)
- ❌ AI features (drafting, suggestions)
- ❌ PDF/DOCX export
- ❌ PDF import
- ❌ Scoring system
- ❌ Templates
- ❌ Live preview
- ❌ Undo/redo
- ❌ Email functionality
- ❌ Stripe payments
- ❌ Analytics

**These Are Phase 2+ Features** - Do not implement in Phase 1.

---

### Key Success Criteria

**Phase 1 is successful when**:
1. User can sign in with Google and access dashboard
2. User can update profile and preferences
3. Settings persist to database
4. All layouts work on desktop and mobile
5. Visual quality meets Ramp design standards
6. All playbooks pass
7. No TypeScript or build errors
8. User approves and authorizes migration application

---

### Next Steps After Phase 1

**Immediate**:
1. User reviews and approves Phase 1 work
2. User authorizes migration application
3. Agent applies migrations using Supabase MCP
4. Agent verifies migrations applied successfully
5. Agent confirms Phase 1 complete

**Then Phase 2**:
- Document schema design
- Database tables for documents
- Document CRUD API
- Editor components
- Live preview
- Zustand state management
- Autosave functionality

---

## File Reference Map

**What was read to create this document**:

- [internal:/Users/varunprasad/code/prjs/resumepair/ai_docs/phases/phase_1.md] - Phase 1 requirements
- [internal:/Users/varunprasad/code/prjs/resumepair/ai_docs/coding_patterns.md] - Repository pattern, API pattern, migration pattern
- [internal:/Users/varunprasad/code/prjs/resumepair/ai_docs/development_decisions.md] - Fixed technology decisions
- [internal:/Users/varunprasad/code/prjs/resumepair/ai_docs/project_documentation/1_prd_v1.md] - Product requirements
- [internal:/Users/varunprasad/code/prjs/resumepair/ai_docs/project_documentation/2_system_architecture.md] - System architecture
- [internal:/Users/varunprasad/code/prjs/resumepair/ai_docs/project_documentation/3_api_specification.md] - API contracts
- [internal:/Users/varunprasad/code/prjs/resumepair/ai_docs/project_documentation/4_database_schema.md] - Database schema
- [internal:/Users/varunprasad/code/prjs/resumepair/ai_docs/project_documentation/8_authentication_and_authorization_matrix.md] - Auth requirements
- [internal:/Users/varunprasad/code/prjs/resumepair/ai_docs/project_documentation/9_development_standards_and_guidelines.md] - Development standards
- [internal:/Users/varunprasad/code/prjs/resumepair/ai_docs/design-system.md] - Design system (Ramp palette, tokens)
- [internal:/Users/varunprasad/code/prjs/resumepair/ai_docs/standards/3_component_standards.md] - Component standards, visual quality
- [internal:/Users/varunprasad/code/prjs/resumepair/ai_docs/testing/README.md] - Testing system overview
- [internal:/Users/varunprasad/code/prjs/resumepair/ai_docs/testing/playbooks/phase_1_auth.md] - Auth testing playbook
- [internal:/Users/varunprasad/code/prjs/resumepair/ai_docs/testing/playbooks/phase_1_navigation.md] - Navigation testing playbook
- [internal:/Users/varunprasad/code/prjs/resumepair/config.ts] - Application configuration

**Current codebase structure** (verified):
- `/app` - Next.js app directory with existing pages (landing, blog, dashboard stub, signin stub, not-found, error)
- `/libs` - Utilities (api.ts, design-tokens.ts, resend.ts, seo.tsx, stripe.ts, supabase/, utils.ts, api-utils/)
- `/libs/supabase` - Supabase client setup (client.ts, server.ts, middleware.ts) ✅ Already exists
- `/libs/api-utils` - API utilities ✅ Already exists (needs enhancement)
- `/migrations` - Does not exist yet, needs creation

---

**This document is complete and self-contained. The implementer can proceed with Phase 1 development using only this context file.**

---

**Signed off**: Context Gatherer Agent
**Date**: 2025-09-30
**Next**: Planner-Architect Agent → Implementation Plan