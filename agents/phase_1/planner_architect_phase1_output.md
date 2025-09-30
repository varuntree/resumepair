# Phase 1 Implementation Plan: Foundation & Core Infrastructure

**Generated**: 2025-09-30
**Project**: ResumePair
**Phase**: Phase 1 - Foundation & Core Infrastructure
**Audience**: Implementer Agent
**Status**: Ready for Implementation

---

## Executive Summary

### High-Level Overview

Phase 1 establishes ResumePair's production-ready foundation through five core deliverables:
1. **Google OAuth authentication** with Supabase (sign in, sign out, protected routes)
2. **Database layer** with RLS-enforced user profiles and preferences
3. **Application shell** with responsive layouts (Header, Sidebar, Footer, Mobile Menu)
4. **Settings system** for profile and preferences management
5. **API infrastructure** with standardized patterns and error handling

This phase implements ZERO document editing features. The focus is purely on authentication, navigation, and settings—creating a solid foundation for Phase 2's document management capabilities.

### Key Technical Decisions

**Authentication Strategy**:
- Google OAuth ONLY via Supabase Auth (no email/password)
- Middleware-based route protection for global security
- Server component guards for layout-specific auth checks

**Database Strategy**:
- **Create migrations as files ONLY** during development
- Apply migrations ONLY after explicit user permission
- Two-table schema: `profiles` + `user_preferences`
- RLS enforced on all tables (user-scoped access only)

**API Architecture**:
- All routes use `withAuth` or `withApiHandler` wrappers
- Standardized `ApiResponse<T>` envelope for all responses
- Zod validation for all inputs
- Edge runtime for light reads, Node for heavy operations

**UI Framework**:
- shadcn/ui components ONLY (no other UI libraries)
- Ramp design system with dual-token architecture (`--app-*` and `--doc-*`)
- Mobile-first responsive design (breakpoints: 768px, 1024px)

### Critical Dependencies

**External Setup Required** (User must provide):
- Supabase project created with Google OAuth configured
- Environment variables: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Google OAuth credentials configured in Supabase dashboard

**Internal Dependencies**:
- Supabase client setup ✅ (Already exists in `libs/supabase/`)
- API utilities ✅ (Already exists in `libs/api-utils/`, needs enhancement)
- Design system ✅ (Defined in `app/globals.css` and `design-system.md`)

### Overall Timeline Estimate

**Total Estimated Time**: 20-24 hours of focused development

**Breakdown**:
- Database migrations & repositories: 3-4 hours
- API routes & utilities: 4-5 hours
- Auth components & middleware: 2-3 hours
- Layout components: 4-5 hours
- Settings pages: 3-4 hours
- Visual verification & testing: 3-4 hours

**Gate Requirements**: 20-30 minutes for phase gate validation (playbooks + screenshots)

---

## 1. Database Layer Implementation Plan

### Overview

Create database schema files for user profiles and preferences with Row Level Security (RLS). All migrations are **file-only** until explicit user permission.

### 1.1 Migration Files to Create

**Location**: `/Users/varunprasad/code/prjs/resumepair/migrations/phase1/`

**Critical Rule**: Create these files but DO NOT apply them to the database. Wait for user permission.

#### File 001: Enable Extensions
**File**: `001_enable_extensions.sql`

```sql
-- Enable UUID extension for primary keys
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgcrypto for additional crypto functions if needed
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

**Why**: UUID generation for primary keys, crypto functions for future security features.

#### File 002: Create Profiles Table
**File**: `002_create_profiles_table.sql`

```sql
-- Profiles table: User profile information
-- One profile per authenticated user (1:1 with auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  -- Primary key references auth.users (Supabase auth table)
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Profile fields
  full_name TEXT,
  avatar_url TEXT,
  locale TEXT NOT NULL DEFAULT 'en-US',
  date_format TEXT NOT NULL DEFAULT 'US',
  page_size TEXT NOT NULL DEFAULT 'Letter',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add comment for documentation
COMMENT ON TABLE public.profiles IS 'User profile information, one per authenticated user';
COMMENT ON COLUMN public.profiles.id IS 'References auth.users.id, CASCADE delete';
COMMENT ON COLUMN public.profiles.locale IS 'User locale (en-US, en-GB, etc.)';
COMMENT ON COLUMN public.profiles.date_format IS 'Date format preference (US, ISO, EU)';
COMMENT ON COLUMN public.profiles.page_size IS 'Page size preference (Letter, A4)';
```

**Why**: Stores user profile data separate from auth system for flexibility. `id` directly references `auth.users` for automatic relationship.

**Field Rationale**:
- `full_name`: Display name for UI (can differ from OAuth name)
- `avatar_url`: Signed URL from Supabase Storage
- `locale`: For i18n formatting (dates, addresses)
- `date_format`: Resume date formatting preference
- `page_size`: Export page size preference (US Letter vs A4)

#### File 003: Create User Preferences Table
**File**: `003_create_user_preferences_table.sql`

```sql
-- User preferences: Application settings
-- One preferences record per user (1:1 with profiles)
CREATE TABLE IF NOT EXISTS public.user_preferences (
  -- Primary key references profiles (not auth.users directly)
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Preference fields
  theme TEXT NOT NULL DEFAULT 'system',
  email_notifications BOOLEAN NOT NULL DEFAULT true,
  auto_save BOOLEAN NOT NULL DEFAULT true,
  default_template TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_theme CHECK (theme IN ('light', 'dark', 'system'))
);

-- Add comments
COMMENT ON TABLE public.user_preferences IS 'User application preferences and settings';
COMMENT ON COLUMN public.user_preferences.theme IS 'UI theme preference (light, dark, system)';
COMMENT ON COLUMN public.user_preferences.email_notifications IS 'Enable email notifications (Phase 2+)';
COMMENT ON COLUMN public.user_preferences.auto_save IS 'Enable auto-save for documents (Phase 2+)';
COMMENT ON COLUMN public.user_preferences.default_template IS 'Default template slug for new documents (Phase 2+)';
```

**Why**: Separate table for preferences allows independent schema evolution and easier caching.

**Field Rationale**:
- `theme`: Immediate use in Phase 1 (next-themes integration)
- `email_notifications`: Stored but not functional until Phase 2+ (email service)
- `auto_save`: Stored but not functional until Phase 2 (document editing)
- `default_template`: Stored but not functional until Phase 2 (templates)

#### File 004: Setup RLS Policies - Profiles
**File**: `004_setup_rls_policies_profiles.sql`

```sql
-- Enable Row Level Security on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile
CREATE POLICY "profiles_select_own"
ON public.profiles
FOR SELECT
USING (id = auth.uid());

-- Policy: Users can insert their own profile (during signup)
CREATE POLICY "profiles_insert_own"
ON public.profiles
FOR INSERT
WITH CHECK (id = auth.uid());

-- Policy: Users can update their own profile
CREATE POLICY "profiles_update_own"
ON public.profiles
FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Note: No DELETE policy - account deletion will be handled separately
```

**Why**: RLS ensures users can only access their own data. `auth.uid()` is Supabase function returning current authenticated user ID.

**Security Rationale**:
- `SELECT` policy: User can only read their own profile
- `INSERT` policy: User can only create profile for themselves
- `UPDATE` policy: User can only modify their own profile
- No `DELETE` policy: Account deletion requires additional checks (Phase 2+)

#### File 005: Setup RLS Policies - Preferences
**File**: `005_setup_rls_policies_preferences.sql`

```sql
-- Enable Row Level Security on user_preferences table
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own preferences
CREATE POLICY "prefs_select_own"
ON public.user_preferences
FOR SELECT
USING (user_id = auth.uid());

-- Policy: Users can insert their own preferences
CREATE POLICY "prefs_insert_own"
ON public.user_preferences
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Policy: Users can update their own preferences
CREATE POLICY "prefs_update_own"
ON public.user_preferences
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
```

**Why**: Same RLS pattern as profiles. Ensures preferences are user-scoped.

#### File 006: Create Profile Trigger
**File**: `006_create_profile_trigger.sql`

```sql
-- Function: Auto-create profile and preferences on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert profile (extract name from OAuth metadata if available)
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );

  -- Insert default preferences
  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$;

-- Trigger: Fire on every new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Add comment
COMMENT ON FUNCTION public.handle_new_user IS 'Auto-creates profile and preferences for new authenticated users';
```

**Why**: Automatically creates profile + preferences when user signs in for first time. Eliminates need for manual user setup.

**How It Works**:
1. User completes Google OAuth
2. Supabase creates record in `auth.users`
3. Trigger fires, calls `handle_new_user()`
4. Function creates profile (with name from OAuth) and preferences (with defaults)
5. User immediately has complete account

**Security Note**: `SECURITY DEFINER` allows function to bypass RLS (required for initial insert).

#### File 007: Create Indexes
**File**: `007_create_indexes.sql`

```sql
-- Index on profiles.updated_at for efficient sorting/filtering
CREATE INDEX IF NOT EXISTS profiles_updated_at_idx
ON public.profiles(updated_at DESC);

-- Index on user_preferences.user_id (already primary key, but explicit for clarity)
-- This is technically redundant but documents intent
CREATE INDEX IF NOT EXISTS user_preferences_user_id_idx
ON public.user_preferences(user_id);

-- Add comments
COMMENT ON INDEX profiles_updated_at_idx IS 'Optimize queries sorting by profile update time';
```

**Why**:
- `profiles_updated_at_idx`: Enables fast "recently updated profiles" queries (future admin features)
- `user_preferences_user_id_idx`: Explicit documentation (redundant with PK but clear)

### 1.2 Type Generation Strategy

**Goal**: Generate TypeScript types from database schema automatically.

**Approach**: Use Supabase CLI

```bash
# Generate types (when migrations are applied)
npx supabase gen types typescript --project-id [project-id] > libs/types/database.ts
```

**Usage in Code**:
```typescript
// Import generated types
import { Database } from '@/libs/types/database'

// Use types
type Profile = Database['public']['Tables']['profiles']['Row']
type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
type ProfileUpdate = Database['public']['Tables']['profiles']['Update']
```

**When to Generate**: After migrations are applied to database (not during Phase 1 development).

### 1.3 Implementation Order

**Sequence** (strict order):
1. Create `migrations/phase1/` directory
2. Write all 7 migration files (001-007)
3. Review each migration for idempotency (`IF NOT EXISTS`, `CREATE OR REPLACE`)
4. Document migrations in checklist
5. **DO NOT APPLY** - wait for user permission
6. Proceed to repository layer

**Verification**:
- [ ] All 7 files created in `migrations/phase1/`
- [ ] Each file is idempotent (can run multiple times safely)
- [ ] Comments explain purpose of each element
- [ ] No migrations applied to database
- [ ] User is aware migrations exist and need approval

---

## 2. Repository Functions Implementation Plan

### Overview

Implement pure functions with dependency injection for database access. Follow the **pure function pattern** (not class-based).

### 2.1 Repository Structure

**Location**: `/Users/varunprasad/code/prjs/resumepair/libs/repositories/`

**Files to Create**:
```
libs/repositories/
├── index.ts              # Exports all functions
├── profiles.ts           # Profile CRUD operations
└── preferences.ts        # Preferences CRUD operations
```

### 2.2 Profiles Repository

**File**: `/Users/varunprasad/code/prjs/resumepair/libs/repositories/profiles.ts`

**Implementation**:

```typescript
import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Profile type (will be replaced with generated type after migrations)
 */
export interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  locale: string
  date_format: 'US' | 'ISO' | 'EU'
  page_size: 'Letter' | 'A4'
  created_at: string
  updated_at: string
}

/**
 * Profile update data (partial)
 */
export interface ProfileUpdate {
  full_name?: string
  avatar_url?: string
  locale?: string
  date_format?: 'US' | 'ISO' | 'EU'
  page_size?: 'Letter' | 'A4'
}

/**
 * Get user profile by ID
 * @param supabase - User-scoped Supabase client (with RLS)
 * @param userId - User ID (must match authenticated user)
 * @returns Profile or throws error
 */
export async function getProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    throw new Error(`Failed to fetch profile: ${error.message}`)
  }

  if (!data) {
    throw new Error('Profile not found')
  }

  return data as Profile
}

/**
 * Update user profile
 * @param supabase - User-scoped Supabase client (with RLS)
 * @param userId - User ID (must match authenticated user)
 * @param updates - Partial profile data to update
 * @returns Updated profile or throws error
 */
export async function updateProfile(
  supabase: SupabaseClient,
  userId: string,
  updates: ProfileUpdate
): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update profile: ${error.message}`)
  }

  if (!data) {
    throw new Error('Profile not found after update')
  }

  return data as Profile
}
```

**Function Signatures Explained**:
- `getProfile`: Fetches single profile by user ID. Uses `.single()` to enforce one result.
- `updateProfile`: Updates profile and returns updated data. Automatically sets `updated_at`.

**RLS Enforcement**: All queries use user-scoped client, so RLS policies automatically filter by `auth.uid()`.

### 2.3 Preferences Repository

**File**: `/Users/varunprasad/code/prjs/resumepair/libs/repositories/preferences.ts`

**Implementation**:

```typescript
import { SupabaseClient } from '@supabase/supabase-js'

/**
 * User preferences type
 */
export interface UserPreferences {
  user_id: string
  theme: 'light' | 'dark' | 'system'
  email_notifications: boolean
  auto_save: boolean
  default_template: string | null
  created_at: string
  updated_at: string
}

/**
 * Preferences update data (partial)
 */
export interface PreferencesUpdate {
  theme?: 'light' | 'dark' | 'system'
  email_notifications?: boolean
  auto_save?: boolean
  default_template?: string | null
}

/**
 * Get user preferences by user ID
 * @param supabase - User-scoped Supabase client (with RLS)
 * @param userId - User ID (must match authenticated user)
 * @returns Preferences or throws error
 */
export async function getPreferences(
  supabase: SupabaseClient,
  userId: string
): Promise<UserPreferences> {
  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    throw new Error(`Failed to fetch preferences: ${error.message}`)
  }

  if (!data) {
    throw new Error('Preferences not found')
  }

  return data as UserPreferences
}

/**
 * Update user preferences
 * @param supabase - User-scoped Supabase client (with RLS)
 * @param userId - User ID (must match authenticated user)
 * @param updates - Partial preferences data to update
 * @returns Updated preferences or throws error
 */
export async function updatePreferences(
  supabase: SupabaseClient,
  userId: string,
  updates: PreferencesUpdate
): Promise<UserPreferences> {
  const { data, error } = await supabase
    .from('user_preferences')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update preferences: ${error.message}`)
  }

  if (!data) {
    throw new Error('Preferences not found after update')
  }

  return data as UserPreferences
}
```

**Function Signatures Explained**:
- `getPreferences`: Fetches user preferences. Enforces single result with `.single()`.
- `updatePreferences`: Updates preferences and returns updated data.

### 2.4 Index File

**File**: `/Users/varunprasad/code/prjs/resumepair/libs/repositories/index.ts`

```typescript
/**
 * Repository Functions
 * Pure functions for database access with dependency injection
 */

// Profile operations
export {
  getProfile,
  updateProfile,
  type Profile,
  type ProfileUpdate
} from './profiles'

// Preferences operations
export {
  getPreferences,
  updatePreferences,
  type UserPreferences,
  type PreferencesUpdate
} from './preferences'
```

**Why**: Centralized exports for clean imports elsewhere.

**Usage**:
```typescript
import { getProfile, updatePreferences } from '@/libs/repositories'
```

### 2.5 Critical Rules

**Pure Function Pattern**:
- ✅ Always accept `SupabaseClient` as first parameter
- ✅ No hidden dependencies or imports
- ✅ No side effects (logging is okay, mutation is not)
- ❌ NO classes or singletons
- ❌ NO auto-detection of client type

**Error Handling**:
- Throw errors with descriptive messages
- Let API routes catch and format errors
- No silent failures

**RLS Reliance**:
- Trust RLS policies to enforce security
- Don't add redundant user ID checks in repository code
- RLS automatically filters queries by `auth.uid()`

### 2.6 Implementation Order

**Sequence**:
1. Create `libs/repositories/` directory
2. Write `profiles.ts` with types and functions
3. Write `preferences.ts` with types and functions
4. Write `index.ts` with exports
5. Verify imports work (no circular dependencies)

**Verification**:
- [ ] All repository files created
- [ ] Functions follow pure function pattern
- [ ] No classes or singletons used
- [ ] Error messages are descriptive
- [ ] Index file exports all functions and types

---

## 3. API Routes Implementation Plan

### Overview

Create API endpoints for user profile and preferences management. All routes use existing `withAuth` wrapper and `ApiResponse<T>` envelope.

### 3.1 API Utilities Enhancement

**Existing Files** (in `libs/api-utils/`):
- ✅ `index.ts` - Exports
- ✅ `responses.ts` - apiSuccess, apiError, ApiResponse
- ✅ `with-auth.ts` - withAuth wrapper
- ✅ `with-api-handler.ts` - withApiHandler wrapper

**No Changes Needed**: Current API utilities already support Phase 1 requirements.

**Current API Utilities Status**:
- `withAuth` provides `(req, user)` signature ✅
- `apiSuccess<T>(data, message?)` returns standardized response ✅
- `apiError(status, message, error?)` returns error response ✅
- `ApiResponse<T>` type available ✅

### 3.2 GET /api/v1/me

**Purpose**: Fetch current user's profile + preferences

**File**: `/Users/varunprasad/code/prjs/resumepair/app/api/v1/me/route.ts`

**Implementation**:

```typescript
import { NextRequest } from 'next/server'
import { withAuth, apiSuccess, apiError } from '@/libs/api-utils'
import { getProfile, getPreferences } from '@/libs/repositories'
import { createClient } from '@/libs/supabase/server'

/**
 * GET /api/v1/me
 * Fetch current user's profile and preferences
 */
export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    const supabase = createClient()

    // Fetch profile and preferences in parallel
    const [profile, preferences] = await Promise.all([
      getProfile(supabase, user.id),
      getPreferences(supabase, user.id)
    ])

    return apiSuccess({
      user: {
        id: user.id,
        email: user.email
      },
      profile,
      preferences
    })
  } catch (error) {
    console.error('GET /api/v1/me error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return apiError(500, 'Failed to fetch user data', message)
  }
})

// Use Edge runtime for fast reads
export const runtime = 'edge'
```

**Response Shape**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com"
    },
    "profile": {
      "id": "uuid",
      "full_name": "John Doe",
      "avatar_url": "https://...",
      "locale": "en-US",
      "date_format": "US",
      "page_size": "Letter",
      "created_at": "...",
      "updated_at": "..."
    },
    "preferences": {
      "user_id": "uuid",
      "theme": "system",
      "email_notifications": true,
      "auto_save": true,
      "default_template": null,
      "created_at": "...",
      "updated_at": "..."
    }
  }
}
```

**Why Parallel Fetching**: Uses `Promise.all` to fetch profile and preferences simultaneously for better performance.

### 3.3 PUT /api/v1/me

**Purpose**: Update current user's profile

**File**: `/Users/varunprasad/code/prjs/resumepair/app/api/v1/me/route.ts` (same file)

**Implementation**:

```typescript
import { z } from 'zod'

/**
 * Zod schema for profile updates
 */
const UpdateProfileSchema = z.object({
  full_name: z.string().max(100).optional(),
  avatar_url: z.string().url().optional().nullable(),
  locale: z.string().optional(),
  date_format: z.enum(['US', 'ISO', 'EU']).optional(),
  page_size: z.enum(['Letter', 'A4']).optional()
})

/**
 * PUT /api/v1/me
 * Update current user's profile
 */
export const PUT = withAuth(async (req: NextRequest, user) => {
  try {
    const body = await req.json()

    // Validate input with Zod
    const result = UpdateProfileSchema.safeParse(body)
    if (!result.success) {
      return apiError(
        400,
        'Invalid input',
        result.error.errors.map(e => `${e.path}: ${e.message}`).join(', ')
      )
    }

    const supabase = createClient()

    // Update profile
    const updatedProfile = await updateProfile(
      supabase,
      user.id,
      result.data
    )

    return apiSuccess(updatedProfile, 'Profile updated successfully')
  } catch (error) {
    console.error('PUT /api/v1/me error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return apiError(500, 'Failed to update profile', message)
  }
})

// Use Node runtime for database writes
export const runtime = 'nodejs'
```

**Request Body**:
```json
{
  "full_name": "Jane Smith",
  "locale": "en-GB",
  "date_format": "ISO",
  "page_size": "A4"
}
```

**Response Shape**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "full_name": "Jane Smith",
    "avatar_url": "https://...",
    "locale": "en-GB",
    "date_format": "ISO",
    "page_size": "A4",
    "created_at": "...",
    "updated_at": "..."
  },
  "message": "Profile updated successfully"
}
```

**Validation**: Zod schema ensures:
- `full_name` max 100 characters
- `avatar_url` is valid URL or null
- `date_format` is one of allowed values
- `page_size` is one of allowed values

### 3.4 GET /api/v1/settings

**Purpose**: Fetch current user's preferences

**File**: `/Users/varunprasad/code/prjs/resumepair/app/api/v1/settings/route.ts`

**Implementation**:

```typescript
import { NextRequest } from 'next/server'
import { withAuth, apiSuccess, apiError } from '@/libs/api-utils'
import { getPreferences } from '@/libs/repositories'
import { createClient } from '@/libs/supabase/server'

/**
 * GET /api/v1/settings
 * Fetch current user's preferences
 */
export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    const supabase = createClient()
    const preferences = await getPreferences(supabase, user.id)

    return apiSuccess(preferences)
  } catch (error) {
    console.error('GET /api/v1/settings error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return apiError(500, 'Failed to fetch preferences', message)
  }
})

export const runtime = 'edge'
```

**Response Shape**:
```json
{
  "success": true,
  "data": {
    "user_id": "uuid",
    "theme": "dark",
    "email_notifications": false,
    "auto_save": true,
    "default_template": null,
    "created_at": "...",
    "updated_at": "..."
  }
}
```

### 3.5 PUT /api/v1/settings

**Purpose**: Update current user's preferences

**File**: `/Users/varunprasad/code/prjs/resumepair/app/api/v1/settings/route.ts` (same file)

**Implementation**:

```typescript
import { z } from 'zod'
import { updatePreferences } from '@/libs/repositories'

/**
 * Zod schema for preferences updates
 */
const UpdatePreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  email_notifications: z.boolean().optional(),
  auto_save: z.boolean().optional(),
  default_template: z.string().nullable().optional()
})

/**
 * PUT /api/v1/settings
 * Update current user's preferences
 */
export const PUT = withAuth(async (req: NextRequest, user) => {
  try {
    const body = await req.json()

    // Validate input
    const result = UpdatePreferencesSchema.safeParse(body)
    if (!result.success) {
      return apiError(
        400,
        'Invalid input',
        result.error.errors.map(e => `${e.path}: ${e.message}`).join(', ')
      )
    }

    const supabase = createClient()

    // Update preferences
    const updatedPreferences = await updatePreferences(
      supabase,
      user.id,
      result.data
    )

    return apiSuccess(updatedPreferences, 'Preferences updated successfully')
  } catch (error) {
    console.error('PUT /api/v1/settings error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return apiError(500, 'Failed to update preferences', message)
  }
})

export const runtime = 'nodejs'
```

**Request Body**:
```json
{
  "theme": "dark",
  "email_notifications": false,
  "auto_save": true
}
```

**Response Shape**:
```json
{
  "success": true,
  "data": {
    "user_id": "uuid",
    "theme": "dark",
    "email_notifications": false,
    "auto_save": true,
    "default_template": null,
    "created_at": "...",
    "updated_at": "..."
  },
  "message": "Preferences updated successfully"
}
```

### 3.6 POST /api/v1/storage/upload

**Purpose**: Upload avatar to Supabase Storage

**File**: `/Users/varunprasad/code/prjs/resumepair/app/api/v1/storage/upload/route.ts`

**Implementation**:

```typescript
import { NextRequest } from 'next/server'
import { withAuth, apiSuccess, apiError } from '@/libs/api-utils'
import { createClient } from '@/libs/supabase/server'

// File upload constraints
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp']

/**
 * POST /api/v1/storage/upload
 * Upload file to Supabase Storage (avatars bucket)
 */
export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File

    // Validate file presence
    if (!file) {
      return apiError(400, 'No file provided')
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return apiError(
        400,
        `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        `File size: ${file.size} bytes`
      )
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return apiError(
        400,
        'Invalid file type. Only PNG, JPG, and WebP allowed',
        `File type: ${file.type}`
      )
    }

    const supabase = createClient()

    // Generate unique file path (user-scoped)
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}.${fileExt}`
    const filePath = `${user.id}/${fileName}`

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false // Don't overwrite existing files
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return apiError(500, 'Upload failed', uploadError.message)
    }

    // Generate signed URL (1 hour expiry)
    const { data: urlData } = await supabase.storage
      .from('avatars')
      .createSignedUrl(filePath, 3600)

    if (!urlData?.signedUrl) {
      return apiError(500, 'Failed to generate file URL')
    }

    return apiSuccess({
      bucket: 'avatars',
      path: filePath,
      url: urlData.signedUrl,
      size: file.size,
      type: file.type
    }, 'File uploaded successfully')
  } catch (error) {
    console.error('POST /api/v1/storage/upload error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return apiError(500, 'Upload failed', message)
  }
})

// Use Node runtime for file handling
export const runtime = 'nodejs'
```

**Request**: Multipart form data with `file` field

**Response Shape**:
```json
{
  "success": true,
  "data": {
    "bucket": "avatars",
    "path": "user-id/1234567890.png",
    "url": "https://supabase.co/storage/v1/object/sign/avatars/...",
    "size": 123456,
    "type": "image/png"
  },
  "message": "File uploaded successfully"
}
```

**Security Features**:
- User-scoped paths (`user.id/filename`)
- File size validation (5MB max)
- File type validation (PNG/JPG/WebP only)
- Signed URLs with expiry (not public URLs)

**Storage Bucket Setup** (Manual, outside agent scope):
- Create `avatars` bucket in Supabase dashboard
- Enable RLS on bucket
- Policy: Users can only upload to `{user_id}/*` path
- Policy: Anyone can read (for public avatars)

### 3.7 Implementation Order

**Sequence**:
1. Verify existing API utilities (no changes needed)
2. Create `/api/v1/me/route.ts` with GET and PUT handlers
3. Create `/api/v1/settings/route.ts` with GET and PUT handlers
4. Create `/api/v1/storage/upload/route.ts` with POST handler
5. Test each endpoint with curl or Postman

**Verification**:
- [ ] All API routes created in correct locations
- [ ] All routes use `withAuth` wrapper
- [ ] All routes return `ApiResponse<T>` envelope
- [ ] All inputs validated with Zod
- [ ] Error handling comprehensive
- [ ] Runtime specified (edge vs nodejs)

---

## 4. Authentication System Implementation Plan

### Overview

Implement Google OAuth authentication using Supabase Auth with middleware-based route protection.

### 4.1 Sign In Page

**File**: `/Users/varunprasad/code/prjs/resumepair/app/signin/page.tsx`

**Implementation**:

```typescript
import { redirect } from 'next/navigation'
import { createClient } from '@/libs/supabase/server'
import { SignInButton } from '@/components/auth/SignInButton'

export default async function SignInPage() {
  // Redirect if already authenticated
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-app-background">
      <div className="w-full max-w-md space-y-8 px-6 py-8">
        {/* Logo */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-app-foreground">
            Welcome to ResumePair
          </h1>
          <p className="mt-2 text-app-foreground/70">
            Sign in to get started building your perfect resume
          </p>
        </div>

        {/* Sign in button */}
        <SignInButton />

        {/* Footer */}
        <p className="text-center text-sm text-app-foreground/60">
          By signing in, you agree to our{' '}
          <a href="/tos" className="underline hover:text-app-foreground">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="/privacy-policy" className="underline hover:text-app-foreground">
            Privacy Policy
          </a>
        </p>
      </div>
    </main>
  )
}
```

**Why Server Component**: Checks auth status server-side before rendering. Redirects authenticated users to dashboard.

### 4.2 Sign In Button Component

**File**: `/Users/varunprasad/code/prjs/resumepair/components/auth/SignInButton.tsx`

**Implementation**:

```typescript
'use client'

import { useState } from 'react'
import { createClient } from '@/libs/supabase/client'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

export function SignInButton() {
  const [isLoading, setIsLoading] = useState(false)

  const handleSignIn = async () => {
    setIsLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        console.error('Sign in error:', error)
        alert('Failed to sign in. Please try again.')
        setIsLoading(false)
      }
      // Don't set loading false on success - page will redirect
    } catch (error) {
      console.error('Sign in error:', error)
      alert('Failed to sign in. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handleSignIn}
      disabled={isLoading}
      variant="default"
      size="lg"
      className="w-full"
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Signing in...
        </>
      ) : (
        'Sign in with Google'
      )}
    </Button>
  )
}
```

**Features**:
- Loading state with spinner
- Error handling with alert (simple for Phase 1)
- Disabled while loading
- Full-width button (mobile-friendly)

**Why Client Component**: Handles click events and browser API (window.location).

### 4.3 OAuth Callback Handler

**File**: `/Users/varunprasad/code/prjs/resumepair/app/auth/callback/route.ts`

**Implementation**:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/libs/supabase/server'

/**
 * GET /auth/callback
 * Handles OAuth callback from Google via Supabase
 */
export async function GET(req: NextRequest) {
  const requestUrl = new URL(req.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error)
    return NextResponse.redirect(
      new URL(`/signin?error=${encodeURIComponent(error)}`, req.url)
    )
  }

  // Exchange code for session
  if (code) {
    const supabase = createClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error('Session exchange error:', exchangeError)
      return NextResponse.redirect(
        new URL('/signin?error=auth_failed', req.url)
      )
    }
  }

  // Redirect to dashboard on success
  return NextResponse.redirect(new URL('/dashboard', req.url))
}
```

**Flow**:
1. Google redirects to `/auth/callback?code=xyz`
2. Handler extracts code
3. Exchanges code for Supabase session
4. Redirects to dashboard

**Error Handling**: Redirects to signin page with error parameter if OAuth fails.

### 4.4 Sign Out Button Component

**File**: `/Users/varunprasad/code/prjs/resumepair/components/auth/SignOutButton.tsx`

**Implementation**:

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/libs/supabase/client'
import { Button } from '@/components/ui/button'
import { LogOut, Loader2 } from 'lucide-react'

interface SignOutButtonProps {
  variant?: 'default' | 'ghost' | 'outline'
  className?: string
}

export function SignOutButton({
  variant = 'ghost',
  className
}: SignOutButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignOut = async () => {
    setIsLoading(true)

    try {
      const supabase = createClient()
      await supabase.auth.signOut()

      // Redirect to home page
      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('Sign out error:', error)
      alert('Failed to sign out. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handleSignOut}
      disabled={isLoading}
      variant={variant}
      className={className}
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <LogOut className="mr-2 h-4 w-4" />
      )}
      Sign Out
    </Button>
  )
}
```

**Features**:
- Configurable variant (ghost, outline, default)
- Loading state with spinner
- Icon (LogOut from lucide-react)
- Redirects to home page after sign out

**Why `router.refresh()`**: Forces re-validation of server components to reflect signed-out state.

### 4.5 Middleware for Route Protection

**File**: `/Users/varunprasad/code/prjs/resumepair/middleware.ts` (root level)

**Implementation**:

```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/libs/supabase/middleware'

/**
 * Middleware: Protect routes and refresh sessions
 */
export async function middleware(request: NextRequest) {
  const { supabase, response } = createClient(request)

  // Refresh session (important for long-lived sessions)
  const { data: { user } } = await supabase.auth.getUser()

  // Protected routes that require authentication
  const protectedPaths = ['/dashboard', '/settings']
  const isProtectedPath = protectedPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  )

  // Redirect unauthenticated users to signin
  if (isProtectedPath && !user) {
    const redirectUrl = new URL('/signin', request.url)
    // Preserve intended destination for post-login redirect
    redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Allow request to proceed
  return response
}

/**
 * Matcher: Apply middleware to all routes except static assets
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - public folder files (*.svg, *.png, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

**How It Works**:
1. Middleware runs on every request (except static assets)
2. Creates Supabase client with middleware adapter
3. Checks if path is protected
4. If protected and user not authenticated, redirects to `/signin`
5. If authenticated or public path, allows request

**Session Refresh**: Middleware automatically refreshes expiring sessions (handled by Supabase middleware client).

**Redirect Preservation**: Saves intended destination in `?redirect=` param for post-login redirect.

### 4.6 Implementation Order

**Sequence**:
1. Create `SignInButton` component
2. Create `SignOutButton` component
3. Create `app/signin/page.tsx`
4. Create `app/auth/callback/route.ts`
5. Create `middleware.ts` at root level
6. Test auth flow manually

**Verification**:
- [ ] Sign in button initiates Google OAuth
- [ ] Callback handler exchanges code for session
- [ ] Protected routes redirect unauthenticated users
- [ ] Sign out clears session and redirects
- [ ] Middleware refreshes sessions automatically

---

## 5. Layout Components Implementation Plan

### Overview

Build responsive application shell with Header, Sidebar, Footer, and Mobile Menu following Ramp design system.

### 5.1 shadcn/ui Component Installation

**Install Required Components** (via CLI):

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
npx shadcn@latest add sheet
```

**Why Sheet**: Used for mobile menu slide-out drawer.

**Installation Order**: Run all commands before creating components.

### 5.2 Header Component

**File**: `/Users/varunprasad/code/prjs/resumepair/components/layout/Header.tsx`

**Implementation**:

```typescript
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UserMenu } from './UserMenu'
import { cn } from '@/libs/utils'

interface HeaderProps {
  onMobileMenuToggle?: () => void
}

export function Header({ onMobileMenuToggle }: HeaderProps) {
  const pathname = usePathname()

  // Check if link is active
  const isActive = (path: string) => pathname.startsWith(path)

  return (
    <header className="sticky top-0 z-50 border-b border-app-border bg-app-background">
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-xl font-bold text-app-foreground">
            ResumePair
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link
            href="/dashboard"
            className={cn(
              'text-sm font-medium transition-colors hover:text-app-foreground',
              isActive('/dashboard')
                ? 'text-app-foreground'
                : 'text-app-foreground/60'
            )}
          >
            Dashboard
          </Link>
          <Link
            href="/settings"
            className={cn(
              'text-sm font-medium transition-colors hover:text-app-foreground',
              isActive('/settings')
                ? 'text-app-foreground'
                : 'text-app-foreground/60'
            )}
          >
            Settings
          </Link>
        </nav>

        {/* User Menu (Desktop) */}
        <div className="hidden md:block">
          <UserMenu />
        </div>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMobileMenuToggle}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>
    </header>
  )
}
```

**Features**:
- Sticky header (stays at top when scrolling)
- Active route highlighting
- Responsive (desktop nav hidden on mobile)
- Mobile menu trigger button

**Design Tokens Used**:
- `border-app-border`: Border color
- `bg-app-background`: Background color
- `text-app-foreground`: Text color

### 5.3 User Menu Component

**File**: `/Users/varunprasad/code/prjs/resumepair/components/layout/UserMenu.tsx`

**Implementation**:

```typescript
'use client'

import { User } from '@supabase/supabase-js'
import Link from 'next/link'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { SignOutButton } from '@/components/auth/SignOutButton'
import { Settings, User as UserIcon } from 'lucide-react'

interface UserMenuProps {
  user?: User
  avatarUrl?: string | null
  fullName?: string | null
}

export function UserMenu({ user, avatarUrl, fullName }: UserMenuProps) {
  // Generate initials from email or name
  const initials = (fullName || user?.email || 'U')
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center space-x-2 rounded-full focus:outline-none focus:ring-2 focus:ring-lime">
          <Avatar>
            <AvatarImage src={avatarUrl || undefined} alt={fullName || 'User'} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{fullName || 'User'}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings/profile" className="flex items-center">
            <UserIcon className="mr-2 h-4 w-4" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings" className="flex items-center">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <div className="w-full">
            <SignOutButton variant="ghost" className="w-full justify-start px-2" />
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

**Features**:
- Avatar with initials fallback
- Dropdown menu with profile links
- Sign out button at bottom
- Shows user email and name

**Why Props Optional**: Component can be used with or without user data (for loading states).

### 5.4 Sidebar Component

**File**: `/Users/varunprasad/code/prjs/resumepair/components/layout/Sidebar.tsx`

**Implementation**:

```typescript
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Settings } from 'lucide-react'
import { SignOutButton } from '@/components/auth/SignOutButton'
import { cn } from '@/libs/utils'

export function Sidebar() {
  const pathname = usePathname()

  // Check if link is active
  const isActive = (path: string) => pathname.startsWith(path)

  return (
    <aside className="hidden lg:flex h-screen w-64 flex-col border-r border-app-border bg-app-background">
      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-6">
        <nav className="space-y-2">
          <Link
            href="/dashboard"
            className={cn(
              'flex items-center space-x-3 rounded-lg px-3 py-2 transition-colors',
              isActive('/dashboard')
                ? 'bg-app-primary/10 text-app-primary font-semibold'
                : 'text-app-foreground/70 hover:bg-app-background/50 hover:text-app-foreground'
            )}
          >
            <LayoutDashboard className="h-5 w-5" />
            <span>Dashboard</span>
          </Link>
          <Link
            href="/settings"
            className={cn(
              'flex items-center space-x-3 rounded-lg px-3 py-2 transition-colors',
              isActive('/settings')
                ? 'bg-app-primary/10 text-app-primary font-semibold'
                : 'text-app-foreground/70 hover:bg-app-background/50 hover:text-app-foreground'
            )}
          >
            <Settings className="h-5 w-5" />
            <span>Settings</span>
          </Link>
        </nav>
      </div>

      {/* Sign Out (Bottom) */}
      <div className="border-t border-app-border p-4">
        <SignOutButton variant="ghost" className="w-full justify-start" />
      </div>
    </aside>
  )
}
```

**Features**:
- Desktop only (hidden on mobile/tablet)
- Active route highlighting with lime accent
- Icons from lucide-react
- Sign out at bottom

**Design Pattern**: Active link has lime background (`bg-app-primary/10`) and lime text.

### 5.5 Footer Component

**File**: `/Users/varunprasad/code/prjs/resumepair/components/layout/Footer.tsx`

**Implementation**:

```typescript
import Link from 'next/link'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-app-border bg-app-background">
      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Links */}
          <nav className="flex gap-6 text-sm">
            <Link
              href="/tos"
              className="text-app-foreground/60 hover:text-app-foreground transition-colors"
            >
              Terms
            </Link>
            <Link
              href="/privacy-policy"
              className="text-app-foreground/60 hover:text-app-foreground transition-colors"
            >
              Privacy
            </Link>
            <a
              href="mailto:support@resumepair.com"
              className="text-app-foreground/60 hover:text-app-foreground transition-colors"
            >
              Support
            </a>
          </nav>

          {/* Copyright */}
          <p className="text-sm text-app-foreground/50">
            © {currentYear} ResumePair. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
```

**Features**:
- Responsive layout (stacked on mobile, row on desktop)
- Links to Terms, Privacy, Support
- Dynamic copyright year

### 5.6 Mobile Menu Component

**File**: `/Users/varunprasad/code/prjs/resumepair/components/layout/MobileMenu.tsx`

**Implementation**:

```typescript
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { LayoutDashboard, Settings } from 'lucide-react'
import { SignOutButton } from '@/components/auth/SignOutButton'
import { cn } from '@/libs/utils'

interface MobileMenuProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MobileMenu({ open, onOpenChange }: MobileMenuProps) {
  const pathname = usePathname()

  // Check if link is active
  const isActive = (path: string) => pathname.startsWith(path)

  // Close menu when link is clicked
  const handleLinkClick = () => {
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-80">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>

        {/* Navigation */}
        <nav className="mt-8 space-y-2">
          <Link
            href="/dashboard"
            onClick={handleLinkClick}
            className={cn(
              'flex items-center space-x-3 rounded-lg px-3 py-3 transition-colors',
              isActive('/dashboard')
                ? 'bg-app-primary/10 text-app-primary font-semibold'
                : 'text-app-foreground/70 hover:bg-app-background/50'
            )}
          >
            <LayoutDashboard className="h-5 w-5" />
            <span>Dashboard</span>
          </Link>
          <Link
            href="/settings"
            onClick={handleLinkClick}
            className={cn(
              'flex items-center space-x-3 rounded-lg px-3 py-3 transition-colors',
              isActive('/settings')
                ? 'bg-app-primary/10 text-app-primary font-semibold'
                : 'text-app-foreground/70 hover:bg-app-background/50'
            )}
          >
            <Settings className="h-5 w-5" />
            <span>Settings</span>
          </Link>
        </nav>

        {/* Sign Out (Bottom) */}
        <div className="absolute bottom-6 left-6 right-6">
          <SignOutButton variant="outline" className="w-full" />
        </div>
      </SheetContent>
    </Sheet>
  )
}
```

**Features**:
- Slide-out from right (Sheet component)
- Same navigation as Sidebar
- Closes on link click
- Sign out button at bottom

**Why Sheet**: shadcn/ui Sheet component handles all animation, backdrop, and accessibility.

### 5.7 Implementation Order

**Sequence**:
1. Install all shadcn/ui components (run all `npx shadcn@latest add` commands)
2. Create `UserMenu` component (used by Header)
3. Create `Header` component
4. Create `Sidebar` component
5. Create `Footer` component
6. Create `MobileMenu` component
7. Test responsiveness at breakpoints (375px, 768px, 1440px)

**Verification**:
- [ ] All shadcn/ui components installed
- [ ] Header shows on all pages
- [ ] Sidebar shows on desktop (lg: breakpoint)
- [ ] Mobile menu opens/closes smoothly
- [ ] Footer shows on all pages
- [ ] Active routes highlighted correctly
- [ ] User menu dropdown works

---

## 6. Page Components Implementation Plan

### Overview

Create pages for landing, signin, dashboard, and settings following Ramp design system with generous spacing.

### 6.1 Landing Page Enhancement

**File**: `/Users/varunprasad/code/prjs/resumepair/app/page.tsx`

**Current Status**: Exists, needs enhancement

**Implementation**:

```typescript
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Footer } from '@/components/layout/Footer'

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center py-16 md:py-24 bg-navy-dark">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            Build Your Perfect Resume
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto">
            ATS-optimized resumes and cover letters in under 60 seconds
          </p>
          <Button asChild size="lg" className="bg-lime hover:bg-lime-hover text-navy-dark">
            <Link href="/signin">
              Sign in with Google
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </main>
  )
}
```

**Design Features**:
- Navy dark background for hero
- Large, bold typography (5xl on mobile, 7xl on desktop)
- Single lime CTA button
- Generous vertical padding (16 on mobile, 24 on desktop)

### 6.2 Dashboard Page

**File**: `/Users/varunprasad/code/prjs/resumepair/app/dashboard/page.tsx`

**Implementation**:

```typescript
import { redirect } from 'next/navigation'
import { createClient } from '@/libs/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/signin')
  }

  // Extract first name from email or use 'there'
  const firstName = user.email?.split('@')[0] || 'there'

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-4xl font-bold text-app-foreground">
          Welcome back, {firstName}
        </h1>
        <p className="text-app-foreground/70 mt-2">
          Ready to build your next resume?
        </p>
      </div>

      {/* Empty State Card */}
      <Card className="p-8 text-center">
        <CardHeader>
          <CardTitle>No Resumes Yet</CardTitle>
          <CardDescription>
            Create your first resume to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button disabled className="mt-4">
            Create Resume (Coming in Phase 2)
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            Document creation will be available in the next phase
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
```

**Design Features**:
- Large welcome headline (text-4xl)
- Empty state with explanation
- Disabled CTA with tooltip text
- Generous spacing (space-y-8)

### 6.3 Dashboard Layout

**File**: `/Users/varunprasad/code/prjs/resumepair/app/dashboard/layout.tsx`

**Implementation**:

```typescript
'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import { MobileMenu } from '@/components/layout/MobileMenu'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <Header onMobileMenuToggle={() => setMobileMenuOpen(true)} />

      <div className="flex flex-1">
        {/* Sidebar (Desktop) */}
        <Sidebar />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 lg:p-12">
          <div className="container mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Menu */}
      <MobileMenu open={mobileMenuOpen} onOpenChange={setMobileMenuOpen} />
    </div>
  )
}
```

**Layout Structure**:
- Header at top (sticky)
- Sidebar on left (desktop only)
- Main content in center (responsive padding)
- Mobile menu overlay

**Why Client Component**: Manages mobile menu open/close state.

### 6.4 Settings Main Page

**File**: `/Users/varunprasad/code/prjs/resumepair/app/settings/page.tsx`

**Implementation**:

```typescript
import { redirect } from 'next/navigation'

export default function SettingsPage() {
  // Redirect to profile settings (default)
  redirect('/settings/profile')
}
```

**Why Redirect**: Settings has sub-pages. Main `/settings` route redirects to first tab.

### 6.5 Settings Layout

**File**: `/Users/varunprasad/code/prjs/resumepair/app/settings/layout.tsx`

**Implementation**:

```typescript
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/libs/utils'

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  // Check if tab is active
  const isActive = (path: string) => pathname === path

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-app-foreground">Settings</h1>
        <p className="text-app-foreground/70 mt-2">
          Manage your profile and preferences
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-app-border">
        <nav className="flex space-x-8">
          <Link
            href="/settings/profile"
            className={cn(
              'pb-4 border-b-2 transition-colors',
              isActive('/settings/profile')
                ? 'border-app-primary text-app-primary font-semibold'
                : 'border-transparent text-app-foreground/60 hover:text-app-foreground'
            )}
          >
            Profile
          </Link>
          <Link
            href="/settings/preferences"
            className={cn(
              'pb-4 border-b-2 transition-colors',
              isActive('/settings/preferences')
                ? 'border-app-primary text-app-primary font-semibold'
                : 'border-transparent text-app-foreground/60 hover:text-app-foreground'
            )}
          >
            Preferences
          </Link>
          <Link
            href="/settings/account"
            className={cn(
              'pb-4 border-b-2 transition-colors',
              isActive('/settings/account')
                ? 'border-app-primary text-app-primary font-semibold'
                : 'border-transparent text-app-foreground/60 hover:text-app-foreground'
            )}
          >
            Account
          </Link>
        </nav>
      </div>

      {/* Content */}
      <div>{children}</div>
    </div>
  )
}
```

**Design Features**:
- Tab navigation with active indicator (lime underline)
- Large header (text-4xl)
- Generous spacing between sections

### 6.6 Profile Settings Page

**File**: `/Users/varunprasad/code/prjs/resumepair/app/settings/profile/page.tsx`

**Implementation**:

```typescript
import { redirect } from 'next/navigation'
import { createClient } from '@/libs/supabase/server'
import { getProfile } from '@/libs/repositories'
import { ProfileForm } from '@/components/settings/ProfileForm'

export default async function ProfileSettingsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/signin')
  }

  // Fetch profile
  const profile = await getProfile(supabase, user.id)

  return (
    <div>
      <ProfileForm profile={profile} />
    </div>
  )
}
```

**Why Server Component**: Fetches profile data server-side before rendering form.

### 6.7 ProfileForm Component

**File**: `/Users/varunprasad/code/prjs/resumepair/components/settings/ProfileForm.tsx`

**Implementation**:

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useToast } from '@/hooks/use-toast'
import type { Profile } from '@/libs/repositories'

interface ProfileFormProps {
  profile: Profile
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    full_name: profile.full_name || '',
    locale: profile.locale,
    date_format: profile.date_format,
    page_size: profile.page_size
  })
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/v1/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.message || 'Failed to update profile')
      }

      toast({
        title: 'Success',
        description: 'Profile updated successfully'
      })

      router.refresh()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update profile',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      full_name: profile.full_name || '',
      locale: profile.locale,
      date_format: profile.date_format,
      page_size: profile.page_size
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="Enter your full name"
            />
          </div>

          {/* Locale */}
          <div className="space-y-2">
            <Label htmlFor="locale">Locale</Label>
            <Select
              value={formData.locale}
              onValueChange={(value) => setFormData({ ...formData, locale: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en-US">English (US)</SelectItem>
                <SelectItem value="en-GB">English (UK)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Format */}
          <div className="space-y-2">
            <Label>Date Format</Label>
            <RadioGroup
              value={formData.date_format}
              onValueChange={(value) => setFormData({ ...formData, date_format: value as any })}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="US" id="date-us" />
                <Label htmlFor="date-us">US (MM/DD/YYYY)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="ISO" id="date-iso" />
                <Label htmlFor="date-iso">ISO (YYYY-MM-DD)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="EU" id="date-eu" />
                <Label htmlFor="date-eu">EU (DD/MM/YYYY)</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Page Size */}
          <div className="space-y-2">
            <Label>Page Size</Label>
            <RadioGroup
              value={formData.page_size}
              onValueChange={(value) => setFormData({ ...formData, page_size: value as any })}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Letter" id="size-letter" />
                <Label htmlFor="size-letter">Letter (8.5" × 11")</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="A4" id="size-a4" />
                <Label htmlFor="size-a4">A4 (210mm × 297mm)</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button type="button" variant="secondary" onClick={handleCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
```

**Features**:
- Form state management
- Optimistic UI (shows loading state)
- Toast notifications for success/error
- Cancel button resets form
- Uses shadcn/ui form components

### 6.8 Preferences Settings Page

**File**: `/Users/varunprasad/code/prjs/resumepair/app/settings/preferences/page.tsx`

**Implementation**:

```typescript
import { redirect } from 'next/navigation'
import { createClient } from '@/libs/supabase/server'
import { getPreferences } from '@/libs/repositories'
import { PreferencesForm } from '@/components/settings/PreferencesForm'

export default async function PreferencesSettingsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/signin')
  }

  // Fetch preferences
  const preferences = await getPreferences(supabase, user.id)

  return (
    <div>
      <PreferencesForm preferences={preferences} />
    </div>
  )
}
```

### 6.9 PreferencesForm Component

**File**: `/Users/varunprasad/code/prjs/resumepair/components/settings/PreferencesForm.tsx`

**Implementation**:

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { useTheme } from 'next-themes'
import type { UserPreferences } from '@/libs/repositories'

interface PreferencesFormProps {
  preferences: UserPreferences
}

export function PreferencesForm({ preferences }: PreferencesFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    theme: preferences.theme,
    email_notifications: preferences.email_notifications,
    auto_save: preferences.auto_save
  })
  const router = useRouter()
  const { toast } = useToast()
  const { setTheme } = useTheme()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/v1/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.message || 'Failed to update preferences')
      }

      // Apply theme immediately
      setTheme(formData.theme)

      toast({
        title: 'Success',
        description: 'Preferences updated successfully'
      })

      router.refresh()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update preferences',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      theme: preferences.theme,
      email_notifications: preferences.email_notifications,
      auto_save: preferences.auto_save
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preferences</CardTitle>
        <CardDescription>
          Manage your application preferences
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Theme */}
          <div className="space-y-2">
            <Label htmlFor="theme">Theme</Label>
            <Select
              value={formData.theme}
              onValueChange={(value) => setFormData({ ...formData, theme: value as any })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Email Notifications */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive email updates (Coming soon)
              </p>
            </div>
            <Switch
              checked={formData.email_notifications}
              onCheckedChange={(checked) => setFormData({ ...formData, email_notifications: checked })}
            />
          </div>

          {/* Auto Save */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto Save</Label>
              <p className="text-sm text-muted-foreground">
                Automatically save document changes (Phase 2+)
              </p>
            </div>
            <Switch
              checked={formData.auto_save}
              onCheckedChange={(checked) => setFormData({ ...formData, auto_save: checked })}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button type="button" variant="secondary" onClick={handleCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
```

**Features**:
- Theme selector with immediate application
- Switches for boolean preferences
- Tooltip text for Phase 2+ features
- Same form pattern as ProfileForm

### 6.10 Account Settings Page

**File**: `/Users/varunprasad/code/prjs/resumepair/app/settings/account/page.tsx`

**Implementation**:

```typescript
import { redirect } from 'next/navigation'
import { createClient } from '@/libs/supabase/server'
import { getProfile } from '@/libs/repositories'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

export default async function AccountSettingsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/signin')
  }

  const profile = await getProfile(supabase, user.id)

  // Format date
  const createdAt = new Date(profile.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account</CardTitle>
        <CardDescription>
          View your account information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Email */}
        <div className="space-y-2">
          <Label>Email</Label>
          <p className="text-sm text-app-foreground">{user.email}</p>
        </div>

        {/* Account Created */}
        <div className="space-y-2">
          <Label>Account Created</Label>
          <p className="text-sm text-app-foreground">{createdAt}</p>
        </div>

        <Separator />

        {/* Danger Zone */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-destructive">
              Danger Zone
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Permanently delete your account and all associated data
            </p>
          </div>
          <Button variant="destructive" disabled>
            Delete Account (Coming Soon)
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
```

**Features**:
- Read-only account information
- Formatted account creation date
- Danger zone section for account deletion
- Delete button disabled with "Coming Soon" label

### 6.11 Implementation Order

**Sequence**:
1. Enhance landing page (`app/page.tsx`)
2. Create dashboard layout (`app/dashboard/layout.tsx`)
3. Create dashboard page (`app/dashboard/page.tsx`)
4. Create settings layout (`app/settings/layout.tsx`)
5. Create settings main page (`app/settings/page.tsx`)
6. Create ProfileForm component
7. Create profile page (`app/settings/profile/page.tsx`)
8. Create PreferencesForm component
9. Create preferences page (`app/settings/preferences/page.tsx`)
10. Create account page (`app/settings/account/page.tsx`)

**Verification**:
- [ ] All pages render without errors
- [ ] Landing page shows hero with CTA
- [ ] Dashboard shows welcome message
- [ ] Settings tabs work and highlight correctly
- [ ] Profile form submits and saves
- [ ] Preferences form submits and saves
- [ ] Theme switcher works immediately
- [ ] Account page shows read-only data

---

## 7. Visual Verification Plan

### Overview

Every UI feature MUST be visually verified before marking complete. This ensures design quality meets Ramp standards.

### 7.1 Screenshot Requirements

**Desktop Screenshots** (1440px × 900px):
- Landing page
- Sign in page
- Dashboard
- Settings > Profile
- Settings > Preferences
- Settings > Account
- Header (zoomed)

**Mobile Screenshots** (375px × 667px):
- Landing page
- Sign in page
- Dashboard
- Mobile menu (open state)

**Total Screenshots**: ~11 screenshots minimum

### 7.2 Visual Quality Checklist

**For EVERY screenshot, verify**:

**Spacing**:
- [ ] Minimum 16px gaps between major elements
- [ ] Card padding ≥24px
- [ ] Section padding ≥64px mobile, ≥96px desktop
- [ ] No cramped spacing (elements feel generous)

**Typography**:
- [ ] Clear hierarchy (headlines largest, body text smallest)
- [ ] Page titles use text-4xl or larger
- [ ] Proper font weights (bold headings, normal body)
- [ ] Line height comfortable for reading

**Color**:
- [ ] Only ONE lime button per screen section (primary CTA)
- [ ] Navy or gray backgrounds only (no off-palette colors)
- [ ] Sufficient contrast (text readable against background)
- [ ] No hardcoded #hex values in code

**Components**:
- [ ] Buttons have clear primary/secondary distinction
- [ ] Cards use rounded-lg + shadow-sm
- [ ] Forms have visible focus states (lime ring)
- [ ] Touch targets ≥48px on mobile

**Responsiveness**:
- [ ] No horizontal scroll on mobile
- [ ] Text readable on small screens
- [ ] Mobile menu accessible and functional
- [ ] Layout adapts smoothly across breakpoints

**Design System Compliance**:
- [ ] Only design tokens used (--app-*, --space-*, etc.)
- [ ] No inline styles with hardcoded values
- [ ] Follows Ramp aesthetic (dark navy + lime + generous space)

### 7.3 Screenshot Process

**Steps**:
1. Start dev server: `npm run dev`
2. Navigate to page in browser
3. Resize browser window to target dimension (1440px or 375px)
4. Use Puppeteer MCP to capture screenshot:
   ```typescript
   mcp__puppeteer__puppeteer_screenshot({
     name: "page_name_desktop",
     width: 1440,
     height: 900
   })
   ```
5. Review screenshot against checklist
6. Fix issues if found
7. Re-capture screenshot
8. Save to `ai_docs/progress/phase_1/screenshots/desktop/` or `mobile/`

### 7.4 Common Visual Issues & Fixes

**Issue: Looks cramped**
- Fix: Increase gaps (gap-4 → gap-6), add more padding (p-4 → p-6)

**Issue: No clear hierarchy**
- Fix: Increase heading sizes, use bold weights, add size differentiation

**Issue: Too many primary actions**
- Fix: Change secondary actions to variant="secondary" or variant="ghost"

**Issue: Colors don't match Ramp**
- Fix: Replace with navy (bg-navy-dark), lime (bg-lime), or grays

**Issue: Hardcoded values**
- Fix: Replace px with space-* tokens, #hex with semantic classes

### 7.5 Documentation Requirements

**Create**: `ai_docs/progress/phase_1/visual_review.md`

**Contents**:
```markdown
# Phase 1 Visual Verification

## Summary
All Phase 1 UI features have been visually verified and meet Ramp design standards.

## Screenshots Taken
- [x] Landing page (desktop)
- [x] Landing page (mobile)
- [x] Sign in page (desktop)
- [x] Sign in page (mobile)
- [x] Dashboard (desktop)
- [x] Dashboard (mobile)
- [x] Settings > Profile (desktop)
- [x] Settings > Preferences (desktop)
- [x] Settings > Account (desktop)
- [x] Mobile menu open (mobile)
- [x] Header detail (desktop)

## Issues Found & Resolved
1. **Dashboard**: Spacing too tight between cards
   - Fix: Changed gap-4 to gap-6, increased card padding to p-8
2. **Settings tabs**: Multiple lime buttons competing
   - Fix: Changed secondary buttons to variant="secondary"

## Design Compliance
- [x] All spacing uses design tokens
- [x] Only one primary action per section
- [x] Typography hierarchy clear
- [x] Responsive layouts work
- [x] No hardcoded values found

## Screenshots Location
`ai_docs/progress/phase_1/screenshots/`
```

### 7.6 Implementation Order

**Sequence**:
1. Complete all page implementations
2. Start dev server
3. Capture all screenshots (desktop + mobile)
4. Review each against checklist
5. Fix issues found
6. Re-capture screenshots
7. Create visual review document
8. Organize screenshots in folders

**Verification**:
- [ ] All screenshots captured
- [ ] All issues documented and fixed
- [ ] Visual review document created
- [ ] Screenshots organized in correct folders
- [ ] Design system compliance verified

---

## 8. Testing Strategy

### Overview

Phase 1 uses **manual testing with Puppeteer MCP playbooks**. No automated test files.

### 8.1 Playbook Execution

**Required Playbooks**:
1. `ai_docs/testing/playbooks/phase_1_auth.md` (~15-20 min)
2. `ai_docs/testing/playbooks/phase_1_navigation.md` (~10-15 min)

**Execution Process**:
1. Start dev server: `npm run dev`
2. Open playbook file
3. Execute each MCP command sequentially
4. Verify pass criteria for each test
5. Document results

**Example Playbook Commands**:
```typescript
// Navigate to page
mcp__puppeteer__puppeteer_navigate({ url: "http://localhost:3000/signin" })

// Take screenshot
mcp__puppeteer__puppeteer_screenshot({ name: "signin_page", width: 1440, height: 900 })

// Click button
mcp__puppeteer__puppeteer_click({ selector: "button:has-text('Sign in with Google')" })

// Verify element exists
mcp__puppeteer__puppeteer_evaluate({ script: "document.querySelector('.header')" })
```

### 8.2 Authentication Playbook

**File**: `ai_docs/testing/playbooks/phase_1_auth.md` (Already exists)

**Tests to Execute**:
1. Sign in button present on landing/signin pages
2. OAuth flow initiates correctly
3. Successful auth redirects to dashboard
4. Protected routes redirect unauthenticated users
5. Sign out clears session and redirects

**Pass Criteria**:
- [ ] All 5 tests passed
- [ ] Screenshots captured for each step
- [ ] No errors in console
- [ ] Session persists across page refreshes

### 8.3 Navigation Playbook

**File**: `ai_docs/testing/playbooks/phase_1_navigation.md` (Already exists)

**Tests to Execute**:
1. Header elements present (logo, nav, user menu)
2. Navigation links work correctly
3. Mobile menu functional
4. Active route highlighted
5. Keyboard navigation works

**Pass Criteria**:
- [ ] All 5 tests passed
- [ ] Mobile menu opens/closes smoothly
- [ ] Active routes highlighted correctly
- [ ] Keyboard navigation accessible

### 8.4 Validation Scripts

**Run Before Phase Gate**:

```bash
# Type check
npx tsc --noEmit

# Lint
npm run lint

# Build
npm run build
```

**Expected Output**:
- ✅ No TypeScript errors
- ✅ No ESLint critical errors (warnings okay)
- ✅ Build succeeds without errors

### 8.5 Manual Verification Tasks

**API Endpoints**:
- [ ] GET /api/v1/me returns profile + preferences
- [ ] PUT /api/v1/me updates profile successfully
- [ ] GET /api/v1/settings returns preferences
- [ ] PUT /api/v1/settings updates preferences successfully
- [ ] POST /api/v1/storage/upload uploads avatar

**Auth Flow**:
- [ ] Sign in with Google works
- [ ] Profile created automatically on first sign in
- [ ] Protected routes redirect unauthenticated users
- [ ] Sign out clears session
- [ ] Session persists across refreshes

**Settings Forms**:
- [ ] Profile form saves changes
- [ ] Preferences form saves changes
- [ ] Theme switcher works immediately
- [ ] Form validation shows errors
- [ ] Cancel button resets form

### 8.6 Documentation Requirements

**Create**: `ai_docs/progress/phase_1/playbook_results.md`

**Contents**:
```markdown
# Phase 1 Playbook Results

## Authentication Playbook
**Executed**: 2025-09-30
**Duration**: 18 minutes

### Test Results
1. Sign in button present: ✅ PASS
2. OAuth flow initiates: ✅ PASS
3. Successful auth redirect: ✅ PASS
4. Protected route redirect: ✅ PASS
5. Sign out works: ✅ PASS

**Overall**: 5/5 tests passed

## Navigation Playbook
**Executed**: 2025-09-30
**Duration**: 12 minutes

### Test Results
1. Header elements present: ✅ PASS
2. Navigation links work: ✅ PASS
3. Mobile menu functional: ✅ PASS
4. Active route highlighted: ✅ PASS
5. Keyboard navigation: ✅ PASS

**Overall**: 5/5 tests passed

## Issues Found
None - all tests passed on first execution

## Screenshots
All screenshots saved to `ai_docs/progress/phase_1/screenshots/`
```

### 8.7 Implementation Order

**Sequence**:
1. Complete all implementations (database, API, UI)
2. Run validation scripts (type-check, lint, build)
3. Execute authentication playbook
4. Execute navigation playbook
5. Document results
6. Fix any issues found
7. Re-run failed tests
8. Create playbook results document

**Verification**:
- [ ] All playbooks executed
- [ ] All tests passed
- [ ] Results documented
- [ ] Screenshots captured
- [ ] No critical issues remaining

---

## 9. Implementation Sequence (Master Checklist)

### Overview

This is the definitive order of operations for implementing Phase 1. Follow this sequence strictly.

### Phase A: Foundation (Days 1-2)

**Database Migrations** (~3 hours):
- [ ] Create `migrations/phase1/` directory
- [ ] Write 001_enable_extensions.sql
- [ ] Write 002_create_profiles_table.sql
- [ ] Write 003_create_user_preferences_table.sql
- [ ] Write 004_setup_rls_policies_profiles.sql
- [ ] Write 005_setup_rls_policies_preferences.sql
- [ ] Write 006_create_profile_trigger.sql
- [ ] Write 007_create_indexes.sql
- [ ] Verify idempotency of all migrations
- [ ] Document migrations (DO NOT APPLY)

**Repository Functions** (~2 hours):
- [ ] Create `libs/repositories/` directory
- [ ] Write `profiles.ts` (getProfile, updateProfile)
- [ ] Write `preferences.ts` (getPreferences, updatePreferences)
- [ ] Write `index.ts` (exports)
- [ ] Verify imports work (no circular dependencies)

**API Utilities** (~1 hour):
- [ ] Verify existing utilities in `libs/api-utils/`
- [ ] No changes needed (already complete)

### Phase B: API Layer (Days 2-3)

**API Routes** (~4 hours):
- [ ] Create `/api/v1/me/route.ts` with GET handler
- [ ] Add PUT handler to `/api/v1/me/route.ts`
- [ ] Create `/api/v1/settings/route.ts` with GET handler
- [ ] Add PUT handler to `/api/v1/settings/route.ts`
- [ ] Create `/api/v1/storage/upload/route.ts` with POST handler
- [ ] Test all endpoints with curl or Postman

### Phase C: Authentication (Days 3-4)

**Auth Components** (~3 hours):
- [ ] Install shadcn/ui components (button, avatar, dropdown-menu, etc.)
- [ ] Create `components/auth/SignInButton.tsx`
- [ ] Create `components/auth/SignOutButton.tsx`
- [ ] Create `app/signin/page.tsx`
- [ ] Create `app/auth/callback/route.ts`
- [ ] Create `middleware.ts` at root
- [ ] Test auth flow manually (sign in, sign out, protection)

### Phase D: Layout Components (Days 4-5)

**Core Layouts** (~4 hours):
- [ ] Create `components/layout/UserMenu.tsx`
- [ ] Create `components/layout/Header.tsx`
- [ ] Create `components/layout/Sidebar.tsx`
- [ ] Create `components/layout/Footer.tsx`
- [ ] Create `components/layout/MobileMenu.tsx`
- [ ] Test responsiveness at breakpoints (375px, 768px, 1440px)

### Phase E: Pages (Days 5-6)

**Main Pages** (~3 hours):
- [ ] Enhance `app/page.tsx` (landing page)
- [ ] Create `app/dashboard/layout.tsx`
- [ ] Create `app/dashboard/page.tsx`
- [ ] Test landing page and dashboard rendering

### Phase F: Settings (Days 6-7)

**Settings Pages** (~4 hours):
- [ ] Create `app/settings/layout.tsx` with tabs
- [ ] Create `app/settings/page.tsx` (redirect)
- [ ] Create `components/settings/ProfileForm.tsx`
- [ ] Create `app/settings/profile/page.tsx`
- [ ] Create `components/settings/PreferencesForm.tsx`
- [ ] Create `app/settings/preferences/page.tsx`
- [ ] Create `app/settings/account/page.tsx`
- [ ] Test all settings pages and forms

### Phase G: Visual Verification (Day 7)

**Screenshots & Review** (~3 hours):
- [ ] Start dev server
- [ ] Capture all desktop screenshots (1440px)
- [ ] Capture all mobile screenshots (375px)
- [ ] Review each against Visual Quality Checklist
- [ ] Fix issues found
- [ ] Re-capture screenshots
- [ ] Create visual review document
- [ ] Organize screenshots in folders

### Phase H: Testing & Documentation (Day 7-8)

**Playbook Execution** (~2 hours):
- [ ] Run validation scripts (type-check, lint, build)
- [ ] Execute authentication playbook
- [ ] Execute navigation playbook
- [ ] Document results
- [ ] Fix any issues found
- [ ] Re-run failed tests
- [ ] Create playbook results document

**Final Verification** (~1 hour):
- [ ] All migrations created (not applied)
- [ ] All API endpoints functional
- [ ] All pages render without errors
- [ ] All playbooks passed
- [ ] All screenshots captured
- [ ] Visual quality standards met
- [ ] No TypeScript errors
- [ ] No ESLint critical errors
- [ ] Build succeeds

### Phase I: User Review & Approval (Day 8)

**Handoff** (~30 minutes):
- [ ] Present completed Phase 1 to user
- [ ] Demo auth flow
- [ ] Demo settings pages
- [ ] Show screenshots
- [ ] Show playbook results
- [ ] Request user approval
- [ ] Request permission to apply migrations
- [ ] Await user confirmation

### Phase J: Migration Application (After Approval)

**Database Setup** (~30 minutes):
- [ ] User approves Phase 1 work
- [ ] User gives explicit permission to apply migrations
- [ ] Apply migrations using Supabase MCP
- [ ] Verify migrations applied successfully
- [ ] Generate TypeScript types from schema
- [ ] Update repository type imports
- [ ] Test API endpoints with real database
- [ ] Confirm Phase 1 complete

---

## 10. Risk Mitigation Plan

### Overview

Identify risks and provide specific mitigation strategies with contingency plans.

### 10.1 Technical Risks

#### Risk 1: Supabase OAuth Configuration Issues

**Likelihood**: Medium
**Impact**: High (blocks all auth)

**Symptoms**:
- OAuth redirect fails with error
- Callback receives error parameter
- Session not created after callback

**Mitigation**:
1. Verify Google OAuth credentials in Supabase dashboard before development
2. Check allowed callback URLs include `http://localhost:3000/auth/callback` and production domain
3. Test OAuth flow in Supabase dashboard before implementing components
4. Provide clear error messages in callback handler

**Contingency**:
- Document exact error for user
- Ask user to verify Supabase OAuth setup
- Provide screenshot of error for debugging

**Detection**: OAuth fails during first sign in test

---

#### Risk 2: RLS Policies Block Expected Operations

**Likelihood**: Medium
**Impact**: High (data access fails)

**Symptoms**:
- API returns 404 even with valid user
- Queries return empty arrays
- Database operations silently fail

**Mitigation**:
1. Test RLS policies with real user after migration application
2. Ensure SELECT policy exists (required for all operations)
3. Use user-scoped client, never service role in runtime
4. Add logging to repository functions for debugging

**Contingency**:
- Review RLS policies in Supabase dashboard
- Manually test queries in SQL editor with `auth.uid()`
- Fix policies and re-apply migration if needed

**Detection**: API endpoints return empty data after migrations applied

---

#### Risk 3: Migration Application Failures

**Likelihood**: Low
**Impact**: Medium (need to rollback)

**Symptoms**:
- Migration fails with SQL error
- Database in inconsistent state
- Some tables created, others missing

**Mitigation**:
1. Make migrations idempotent (`IF NOT EXISTS`, `CREATE OR REPLACE`)
2. Test each migration on separate Supabase project first
3. Apply migrations one at a time
4. Have rollback SQL ready for each migration

**Contingency**:
- Rollback failed migration manually
- Fix SQL error
- Re-apply corrected migration
- Verify database state in Supabase dashboard

**Detection**: MCP tool returns error during migration application

---

#### Risk 4: Design Token Missing for Component

**Likelihood**: Low
**Impact**: Low (visual inconsistency)

**Symptoms**:
- Component uses hardcoded value
- Styling doesn't match design system
- Dark mode doesn't work correctly

**Mitigation**:
1. Review `app/globals.css` before implementing components
2. Add missing tokens proactively
3. Grep codebase for hardcoded hex/px values
4. Verify dark mode works for every component

**Contingency**:
- Add missing token to `globals.css`
- Update component to use token
- Re-verify visual quality

**Detection**: Visual verification finds hardcoded values or inconsistent styling

---

### 10.2 Implementation Complexity Risks

#### Risk 1: Avatar Upload Complexity

**Likelihood**: Medium
**Impact**: Medium (feature works but rough edges)

**Challenges**:
- File validation (size, type)
- Supabase Storage setup (bucket, RLS)
- Signed URL generation
- Error handling

**Mitigation**:
1. Start with simple upload (no preview, no crop)
2. Validate size and type on both client and server
3. Use Supabase Storage RLS with path-based ownership
4. Generate signed URL with short TTL (1 hour)

**Simplification**:
- Skip preview/crop in Phase 1
- Just show uploaded avatar immediately
- Phase 2 can add advanced features

**Detection**: Upload fails or security issues found during testing

---

#### Risk 2: Mobile Menu State Management

**Likelihood**: Low
**Impact**: Low (UX issue)

**Challenges**:
- Open/close state
- Click outside to close
- Body scroll lock

**Mitigation**:
1. Use shadcn/ui Sheet component (handles all state)
2. Test on real mobile device (not just responsive view)
3. Verify backdrop click closes menu

**Simplification**:
- Use Sheet component from shadcn/ui (pre-built)
- Don't build custom drawer logic

**Detection**: Mobile menu doesn't open/close smoothly during testing

---

#### Risk 3: Protected Route Edge Cases

**Likelihood**: Medium
**Impact**: Medium (security concern if wrong)

**Challenges**:
- Session expiry
- Race conditions
- Redirect loops
- Concurrent tabs

**Mitigation**:
1. Use middleware for all protection (single source of truth)
2. Add redirect param to preserve intended destination
3. Test session expiry manually (clear cookies)
4. Add max redirect check to prevent loops

**Simplification**:
- Keep middleware logic simple
- No complex state machines
- Trust Supabase session management

**Detection**: Users get stuck in redirect loops or can access protected routes unauthenticated

---

### 10.3 Schedule Risks

#### Risk 1: Scope Creep (Adding Phase 2 Features)

**Likelihood**: High
**Impact**: High (delays Phase 1, mixes concerns)

**Symptoms**:
- Implementer adds document editing features
- AI features sneaking in
- "Just quickly add" attitude

**Prevention**:
1. Review scope section (Out of Scope) before starting
2. Disable/hide Phase 2 features (show "Coming Soon" placeholders)
3. Resist urge to add features
4. Focus on authentication and navigation ONLY

**Enforcement**:
- User reviews and confirms only Phase 1 features present
- Checklist explicitly lists what NOT to build

**Detection**: Code review finds document editing or AI features

---

#### Risk 2: Over-Engineering

**Likelihood**: Medium
**Impact**: Medium (wastes time, adds complexity)

**Symptoms**:
- Adding Zustand when not needed
- Complex state machines for simple UI
- Premature optimization
- Too many abstractions

**Prevention**:
1. Follow YAGNI (You Aren't Gonna Need It)
2. No Zustand unless clearly needed (Phase 1 likely doesn't need it)
3. No complex patterns for simple UI
4. Keep it simple

**Enforcement**:
- Code review focuses on simplicity
- Ask "Do we need this now?"

**Detection**: Implementation takes longer than estimated, code is overly complex

---

## 11. Definition of Done

### Overview

Phase 1 is DONE when all criteria below are met and user explicitly approves.

### 11.1 Feature Completeness

**Authentication**:
- [x] User can sign in with Google
- [x] User can sign out
- [x] Session persists across refreshes
- [x] Protected routes redirect unauthenticated users
- [x] OAuth errors handled gracefully

**Database**:
- [x] Migration files created (7 files in `migrations/phase1/`)
- [x] RLS policies defined
- [x] Trigger for profile creation defined
- [x] Repository functions implemented (profiles, preferences)
- [x] No direct SQL in route handlers

**API**:
- [x] GET /api/v1/me returns user profile + preferences
- [x] PUT /api/v1/me updates profile
- [x] PUT /api/v1/settings updates preferences
- [x] POST /api/v1/storage/upload handles avatar upload
- [x] All endpoints use withAuth wrapper
- [x] All responses use ApiResponse envelope
- [x] All inputs validated with Zod

**Layouts**:
- [x] Header with logo, nav, user menu
- [x] Sidebar with nav links (desktop only)
- [x] Footer with links and copyright
- [x] Mobile menu functional
- [x] All layouts use design tokens

**Pages**:
- [x] Landing page with sign in CTA
- [x] Sign in page functional
- [x] Dashboard page accessible after auth
- [x] Settings pages (Profile, Preferences, Account)
- [x] 404 and error pages verified
- [x] All pages responsive

**Settings**:
- [x] Profile form pre-populated with current values
- [x] Avatar upload works
- [x] Form validation (client + server)
- [x] Save/Cancel buttons functional
- [x] Success/error toasts shown
- [x] Changes persist to database

### 11.2 Quality Metrics

**Code Quality**:
- [x] No TypeScript errors
- [x] No ESLint critical errors
- [x] Build succeeds without warnings
- [x] No hardcoded values (grep for #, px outside tokens)
- [x] All components follow naming conventions

**Visual Quality**:
- [x] All screenshots meet Visual Quality Checklist
- [x] Spacing generous (≥16px gaps, ≥24px padding)
- [x] Typography hierarchy clear
- [x] One primary action per section
- [x] Responsive layouts work

**Performance**:
- [x] No layout shift on page load
- [x] No slow queries (< 1s for all API calls)
- [x] Images optimized (avatars < 500KB)

### 11.3 Testing Metrics

**Playbook Execution**:
- [x] Auth playbook: 5/5 tests passed
- [x] Navigation playbook: 5/5 tests passed
- [x] All screenshots captured (11+ total)
- [x] No critical issues found

**Manual Testing**:
- [x] Sign in/out flow tested manually
- [x] Settings forms tested (all fields)
- [x] Avatar upload tested (valid and invalid files)
- [x] Mobile menu tested on real device
- [x] Keyboard navigation tested

### 11.4 Documentation

- [x] Migration files documented (not applied yet)
- [x] Playbook results documented
- [x] Visual review documented
- [x] Screenshots organized in correct folders

### 11.5 User Approval

**User must explicitly confirm**:
- [ ] "Phase 1 features are complete and working"
- [ ] "Visual quality meets standards"
- [ ] "I approve applying migrations"
- [ ] "Ready to proceed to Phase 2"

**Time Estimate**: 20-30 minutes for complete phase gate validation

---

## 12. Handoff Notes for Implementer

### Critical Instructions

**Start Here**:
1. Read this entire plan document (you are here)
2. Review context document: `/agents/phase_1/context_gatherer_phase1_output.md`
3. Review coding patterns: `/ai_docs/coding_patterns.md`
4. Review design system: `/ai_docs/design-system.md`
5. Begin with Phase A (Database Migrations)

**Follow This Order**:
- Database migrations → Repositories → API routes → Auth components → Layouts → Pages → Settings → Visual verification → Testing

**Do NOT Deviate**:
- No Phase 2 features (document editing, AI, exports)
- No Stripe integration
- No analytics
- No email functionality
- Migrations created as files ONLY (apply after user permission)

### Implementation Standards

**Repository Pattern**:
- Pure functions with dependency injection
- NO classes or singletons
- Always pass Supabase client as parameter

**API Pattern**:
- Always use `withAuth` or `withApiHandler`
- Always validate inputs with Zod
- Always return `ApiResponse<T>` envelope

**Design System**:
- Only use `--app-*` tokens (Phase 1 has no documents)
- NO hardcoded colors (#hex) or spacing (px values)
- Install shadcn/ui components via CLI

**Testing**:
- Manual testing with Puppeteer MCP
- NO automated test files
- Execute playbooks and document results

### When You Get Stuck

**Questions to Ask User**:
1. "I need Google OAuth credentials configured in Supabase. Is this done?"
2. "I need permission to apply migrations. Are you ready?"
3. "I found an issue with [X]. Should I proceed or wait for clarification?"

**Things You Can Decide**:
- Exact wording of UI text
- Specific spacing values (within design system constraints)
- Order of form fields (within usability standards)

### Capture Learnings

**As you implement, note**:
- Issues encountered
- Solutions found
- Time taken per section
- Improvements for future phases

**Document in**: `agents/phase_1/observations.md`

### Success Measure

**You are successful when**:
- User reviews and approves all work
- All playbooks pass
- All visual standards met
- Zero Phase 2 features present
- Migrations ready to apply (not applied yet)

---

## 13. Summary

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

### Next Steps After Phase 1

**Immediate** (After User Approval):
1. User reviews Phase 1 work
2. User authorizes migration application
3. Apply migrations using Supabase MCP
4. Verify migrations applied successfully
5. Confirm Phase 1 complete

**Then Phase 2** (Document Management):
- Document schema design
- Database tables for documents
- Document CRUD API
- Editor components
- Live preview
- Zustand state management
- Autosave functionality

---

## 14. References

### Documentation

**Project Documentation** (`ai_docs/project_documentation/`):
- PRD: `1_prd_v1.md`
- System Architecture: `2_system_architecture.md`
- API Specification: `3_api_specification.md`
- Database Schema: `4_database_schema.md`
- Authentication Matrix: `8_authentication_and_authorization_matrix.md`

**Standards** (`ai_docs/standards/`):
- Architecture Principles: `1_architecture_principles.md`
- Data Flow Patterns: `2_data_flow_patterns.md`
- Component Standards: `3_component_standards.md`
- API Design Contracts: `4_api_design_contracts.md`
- Error Handling: `5_error_handling_strategy.md`
- Security Checklist: `6_security_checklist.md`
- Performance Guidelines: `7_performance_guidelines.md`
- Visual Verification: `9_visual_verification_workflow.md`

**Design & Patterns**:
- Design System: `ai_docs/design-system.md`
- Coding Patterns: `ai_docs/coding_patterns.md`
- Development Decisions: `ai_docs/development_decisions.md`

**Testing**:
- Testing README: `ai_docs/testing/README.md`
- MCP Patterns: `ai_docs/testing/mcp_patterns.md`
- Auth Playbook: `ai_docs/testing/playbooks/phase_1_auth.md`
- Navigation Playbook: `ai_docs/testing/playbooks/phase_1_navigation.md`

### Context Files

**Primary Context**:
- Context Document: `/agents/phase_1/context_gatherer_phase1_output.md`
- Implementation Plan: `/agents/phase_1/planner_architect_phase1_output.md` (this file)

**Configuration**:
- App Config: `/config.ts`
- TypeScript Config: `/tsconfig.json`
- Tailwind Config: `/tailwind.config.js`

### Existing Code

**Already Implemented**:
- Supabase Clients: `libs/supabase/` (client.ts, server.ts, middleware.ts)
- API Utilities: `libs/api-utils/` (index.ts, responses.ts, with-auth.ts, with-api-handler.ts)
- Design Tokens: `app/globals.css`, `libs/design-tokens.ts`

**Need Implementation** (Phase 1 Work):
- Database Migrations: `migrations/phase1/` (7 files)
- Repositories: `libs/repositories/` (profiles.ts, preferences.ts)
- API Routes: `app/api/v1/me/`, `app/api/v1/settings/`, `app/api/v1/storage/upload/`
- Auth Components: `components/auth/` (SignInButton, SignOutButton)
- Layout Components: `components/layout/` (Header, Sidebar, Footer, MobileMenu, UserMenu)
- Settings Components: `components/settings/` (ProfileForm, PreferencesForm)
- Pages: `app/signin/`, `app/dashboard/`, `app/settings/`

---

## 15. Final Notes

### Completeness

This implementation plan is **comprehensive, actionable, and self-contained**. The implementer agent can build Phase 1 without additional questions by following this plan section by section.

### Key Success Factors

1. **Follow the order**: Database → Repositories → API → Auth → Layouts → Pages → Settings → Verification → Testing
2. **Respect constraints**: No Phase 2 features, migrations file-only, no hardcoded values
3. **Honor patterns**: Repository pattern, API utilities, design tokens
4. **Verify visually**: Screenshot every UI feature before marking complete
5. **Test manually**: Execute playbooks, document results
6. **Get approval**: User must explicitly approve before applying migrations

### Time Expectations

**Realistic Estimate**: 20-24 hours of focused development + 20-30 minutes for phase gate

**Breakdown**:
- Database & Repositories: 5-6 hours
- API Routes: 4-5 hours
- Auth Components: 2-3 hours
- Layout Components: 4-5 hours
- Pages & Settings: 3-4 hours
- Visual Verification: 3-4 hours
- Testing & Documentation: 2-3 hours

### Support

**If Issues Arise**:
1. Check context document for detailed explanations
2. Review coding patterns for implementation examples
3. Check design system for styling guidance
4. Ask user for clarification if truly stuck

**Remember**: This plan eliminates ambiguity. Every decision is documented. Every pattern is specified. Every constraint is clear.

---

**Plan Status**: ✅ Complete and Ready for Implementation
**Generated**: 2025-09-30
**Next Agent**: Implementer Agent
**Output Location**: `/Users/varunprasad/code/prjs/resumepair/agents/phase_1/planner_architect_phase1_output.md`

---

**End of Phase 1 Implementation Plan**