# Phase 1: Foundation & Core Infrastructure

## Phase Objective
Establish a complete, production-ready foundation with authentication, database connectivity, navigation, routing, and all supporting infrastructure that future phases will build upon.

## Phase Validation Gate

**This phase is complete only when ALL of the following are verified:**

### Playbook Execution (~20-30 minutes)
- [ ] **Authentication Playbook** (`ai_docs/testing/playbooks/phase_1_auth.md`)
  - Google OAuth flow working
  - Session management verified
  - Protected routes redirect correctly
  - Sign out functionality working
- [ ] **Navigation Playbook** (`ai_docs/testing/playbooks/phase_1_navigation.md`)
  - Header navigation functional
  - Navigation links working
  - Mobile menu responsive
  - Breadcrumbs present (if applicable)

### Visual Verification (~10 minutes)
- [ ] **Desktop screenshots** (1440px) captured and documented
- [ ] **Mobile screenshots** (375px) captured and documented
- [ ] All UI features meet visual quality standards:
  - Spacing generous (≥16px gaps, ≥24px card padding)
  - Clear typography hierarchy
  - One primary action per section
  - Design tokens used (no hardcoded values)
  - Responsive layouts work

### Documentation
- [ ] Screenshots saved to `ai_docs/progress/phase_1/screenshots/`
- [ ] `visual_review.md` completed
- [ ] `playbook_results.md` completed
- [ ] All critical issues resolved

**Reference**: See `ai_docs/testing/README.md` for complete testing workflow

## Comprehensive Scope

### Core Features
1. **Google OAuth Authentication**
   - Sign in/sign up flow with Google
   - Session management
   - Protected route system
   - Sign out functionality
   - Auth state persistence

2. **Database Setup & Connection**
   - Supabase initialization
   - Connection management
   - Environment variable validation
   - Database types generation
   - RLS policies setup

3. **Application Shell & Layout**
   - Responsive main layout
   - Navigation header with user menu
   - Sidebar for main navigation
   - Footer with links
   - Mobile-responsive hamburger menu

### Supporting Infrastructure
- **Navigation**: Top nav bar, side nav, breadcrumbs, mobile menu
- **Settings Pages**: Profile settings, application preferences, account management
- **Error Handling**: 404 page, 500 page, error boundary, offline page
- **Layout Components**: Header, sidebar, footer, content wrapper
- **Authentication States**: Loading, authenticated, unauthenticated, error states
- **Data Management**: User profile CRUD, preferences persistence

### User Flows Covered
1. **First-time User Registration**
   - Landing page → Sign up with Google → Profile completion → Dashboard

2. **Returning User Login**
   - Landing page → Sign in with Google → Dashboard

3. **Settings Management**
   - Dashboard → Settings → Update profile/preferences → Save

4. **Error Recovery**
   - Any error → Error page → Recovery action → Continue

## Test Specifications

### Unit Tests Required
```typescript
// tests/phase1/unit/

describe('Component: Header', () => {
  test('renders logo and navigation')
  test('shows user menu when authenticated')
  test('shows sign in button when unauthenticated')
  test('handles mobile menu toggle')
  test('displays user avatar correctly')
})

describe('Component: Sidebar', () => {
  test('renders navigation links')
  test('highlights active route')
  test('collapses on mobile')
  test('expands/collapses on desktop')
  test('shows correct menu items based on auth')
})

describe('Component: AuthButton', () => {
  test('initiates Google OAuth flow')
  test('handles auth errors')
  test('shows loading state during auth')
  test('redirects after successful auth')
})

describe('Repository: authRepository', () => {
  test('signs in with Google')
  test('signs out user')
  test('gets current user')
  test('updates user profile')
  test('handles session refresh')
})

describe('Repository: profileRepository', () => {
  test('creates user profile')
  test('updates user profile')
  test('deletes user data')
  test('handles profile photo upload')
})

describe('Utils: cn', () => {
  test('merges class names correctly')
  test('handles conditional classes')
  test('removes duplicates')
})
```

### Integration Tests Required
```typescript
// tests/phase1/integration/

describe('Feature: Authentication Flow', () => {
  test('complete Google OAuth flow works')
  test('session persists across page refreshes')
  test('logout clears session completely')
  test('redirects to sign in for protected routes')
  test('handles OAuth errors gracefully')
})

describe('Feature: Profile Management', () => {
  test('creates profile on first sign in')
  test('updates profile information')
  test('uploads and displays avatar')
  test('saves user preferences')
})

describe('API Route: /api/v1/auth/callback', () => {
  test('handles OAuth callback')
  test('creates user session')
  test('returns proper error codes')
})

describe('API Route: /api/v1/me', () => {
  test('returns current user when authenticated')
  test('returns 401 when unauthenticated')
  test('includes complete user profile')
})

describe('Feature: Navigation', () => {
  test('navigation reflects auth state')
  test('protected routes require auth')
  test('public routes accessible to all')
  test('breadcrumbs update correctly')
})
```

### E2E Tests Required
```typescript
// tests/phase1/e2e/

describe('User Journey: First Time User', () => {
  test('user can sign up with Google')
  test('user completes profile after signup')
  test('user can access dashboard after auth')
})

describe('User Journey: Returning User', () => {
  test('user can sign in with existing account')
  test('user session persists')
  test('user can sign out')
})

describe('Critical Path: Settings Update', () => {
  test('user can update profile information')
  test('changes persist after page refresh')
})
```

### Performance Benchmarks
```typescript
describe('Performance: Core Pages', () => {
  test('landing page loads < 1.5s')
  test('dashboard loads < 2s')
  test('auth redirect < 3s')
  test('settings save < 500ms')
})
```

### Accessibility Tests
```typescript
describe('Accessibility: Foundation', () => {
  test('all pages keyboard navigable')
  test('ARIA labels present')
  test('color contrast meets WCAG AA')
  test('focus indicators visible')
  test('screen reader navigation works')
})
```

### Security Validations
```typescript
describe('Security: Authentication', () => {
  test('OAuth state parameter validated')
  test('sessions expire appropriately')
  test('CSRF protection active')
  test('secure cookies only')
  test('RLS policies enforced')
})
```

## Technical Implementation Scope

### Database Layer
```sql
Tables/Collections:
- profiles: User profile information
  - id: uuid (primary key, references auth.users)
  - email: text
  - full_name: text
  - avatar_url: text
  - phone: text
  - locale: text
  - date_format: text
  - created_at: timestamp
  - updated_at: timestamp

- user_preferences: Application preferences
  - user_id: uuid (references profiles.id)
  - theme: text ('light', 'dark', 'system')
  - email_notifications: boolean
  - auto_save: boolean
  - default_template: text
  - created_at: timestamp
  - updated_at: timestamp

RLS Policies:
- profiles: Users can only read/update their own profile
- user_preferences: Users can only read/update their own preferences

Migrations Required:
- 001_create_profiles_table.sql
- 002_create_user_preferences_table.sql
- 003_setup_rls_policies.sql
```

### API Endpoints
```
Authentication:
- GET /api/v1/auth/signin - Initiate Google OAuth
- GET /api/v1/auth/callback - Handle OAuth callback
- POST /api/v1/auth/signout - Sign out user
- GET /api/v1/auth/session - Get current session

User Management:
- GET /api/v1/me - Get current user profile
- PUT /api/v1/me - Update user profile
- DELETE /api/v1/me - Delete user account

Settings:
- GET /api/v1/settings - Get user preferences
- PUT /api/v1/settings - Update preferences
```

### Frontend Components

#### Page Components
```
/app/
├── page.tsx - Landing page
├── signin/
│   └── page.tsx - Sign in page
├── dashboard/
│   ├── page.tsx - Main dashboard
│   └── layout.tsx - Dashboard layout wrapper
├── settings/
│   ├── page.tsx - Settings main page
│   ├── profile/
│   │   └── page.tsx - Profile settings
│   ├── preferences/
│   │   └── page.tsx - App preferences
│   └── account/
│       └── page.tsx - Account management
├── error.tsx - Error boundary
├── not-found.tsx - 404 page
├── offline.tsx - Offline page
└── layout.tsx - Root layout
```

#### Feature Components
```
/components/
├── auth/
│   ├── SignInButton.tsx - Google sign in button
│   ├── SignOutButton.tsx - Sign out button
│   ├── AuthGuard.tsx - Protected route wrapper
│   └── UserAvatar.tsx - User profile avatar
├── layout/
│   ├── Header.tsx - Main header with nav
│   ├── Sidebar.tsx - Side navigation
│   ├── Footer.tsx - App footer
│   ├── MobileMenu.tsx - Mobile navigation
│   └── Breadcrumbs.tsx - Breadcrumb navigation
├── settings/
│   ├── ProfileForm.tsx - Profile edit form
│   ├── PreferencesForm.tsx - Preferences form
│   └── DeleteAccountDialog.tsx - Account deletion
└── common/
    ├── LoadingSpinner.tsx - Loading indicator
    ├── ErrorMessage.tsx - Error display
    └── Toast.tsx - Notification system
```

#### Shared/UI Components
```
/components/ui/
├── button.tsx - Base button component
├── card.tsx - Card container
├── dialog.tsx - Modal dialog
├── dropdown-menu.tsx - Dropdown menus
├── form.tsx - Form components
├── input.tsx - Input fields
├── label.tsx - Form labels
├── skeleton.tsx - Loading skeletons
├── toast.tsx - Toast notifications
└── avatar.tsx - User avatars
```

### State Management
```
Stores Required:
- authStore: Authentication state
  - user: User | null
  - isLoading: boolean
  - error: Error | null
  - signIn(): Promise<void>
  - signOut(): Promise<void>
  - refreshSession(): Promise<void>

- preferenceStore: User preferences
  - theme: 'light' | 'dark' | 'system'
  - preferences: UserPreferences
  - updatePreference(key, value): void
  - loadPreferences(): Promise<void>

Context Providers:
- AuthProvider: Wraps app with auth state
- ThemeProvider: Handles theme switching
```

### Design System Setup
```
/app/globals.css:
- CSS variables for colors (HSL format)
- Spacing scale (4px base unit)
- Typography scale
- Border radius tokens
- Shadow tokens
- Animation durations
- Breakpoint values
```

## Test Implementation Strategy

### Test Development Order
1. **Unit tests for utilities** (cn, formatters)
2. **Component unit tests** (isolated components)
3. **Repository unit tests** (with mocked Supabase)
4. **API integration tests** (with test database)
5. **Auth flow E2E tests** (full user journey)
6. **Accessibility tests** (automated checks)
7. **Security validation** (auth and data protection)

### Test Data Management
```
/tests/fixtures/
├── users.json - Test user data
├── profiles.json - Test profile data
└── preferences.json - Test preferences
```

### Test Utilities
```typescript
// tests/utils/
- renderWithProviders() - Render with auth/theme context
- createTestUser() - Generate test user
- mockSupabase() - Mock Supabase client
- waitForAuth() - Wait for auth to complete
```

## Integration Requirements

### Dependencies on Previous Phases
- None (this is the foundation)

### Interfaces for Future Phases
- **Exports**:
  - Authentication system (all phases need this)
  - Layout components (used by all pages)
  - UI component library (used everywhere)
  - Design tokens (consistent styling)
  - User profile data structure
  - API utilities (withAuth, apiSuccess, apiError)
  - Supabase client configuration

- **Extension Points**:
  - Navigation items can be added
  - Settings pages can be extended
  - Additional auth providers (future)
  - More UI components can be added

## Detailed Feature Specifications

### Google OAuth Authentication
**User Story**: As a user, I want to sign in with my Google account so that I can access the application securely.

**Acceptance Criteria** (Test Cases):
- [ ] Google OAuth button visible on landing → Test: signin_button_visible
- [ ] Clicking button redirects to Google → Test: oauth_redirect
- [ ] Successful auth creates session → Test: session_creation
- [ ] Failed auth shows error → Test: auth_error_handling
- [ ] Session persists on refresh → Test: session_persistence
- [ ] Sign out clears session → Test: signout_complete

**Test Coverage Required**:
- Unit: SignInButton, authRepository methods
- Integration: OAuth flow, session management
- E2E: Complete sign in journey
- Edge Cases: Network errors, OAuth failures, rate limiting

### User Profile Management
**User Story**: As a user, I want to manage my profile information so that the app can personalize my experience.

**Acceptance Criteria** (Test Cases):
- [ ] Profile form displays current data → Test: profile_form_loads
- [ ] Can update all profile fields → Test: profile_update
- [ ] Avatar upload works → Test: avatar_upload
- [ ] Changes persist → Test: profile_persistence
- [ ] Validation prevents bad data → Test: profile_validation

### Navigation System
**User Story**: As a user, I want clear navigation so that I can easily access all features.

**Acceptance Criteria** (Test Cases):
- [ ] Desktop navigation visible → Test: desktop_nav
- [ ] Mobile menu works → Test: mobile_menu
- [ ] Active route highlighted → Test: active_route
- [ ] Breadcrumbs show path → Test: breadcrumbs
- [ ] Protected routes redirect → Test: route_protection

## Edge Cases & Completeness Checklist

### User Scenarios (All Need Tests)
- [ ] First-time user with no Google account → Test: no_google_account
- [ ] User with multiple Google accounts → Test: multiple_accounts
- [ ] Session expiry during use → Test: session_expiry
- [ ] Network failure during auth → Test: network_failure
- [ ] Browser back button after signout → Test: browser_back
- [ ] Concurrent sessions → Test: concurrent_sessions
- [ ] Profile photo upload failures → Test: upload_failure

### Technical Considerations (Test Requirements)
- [ ] Mobile responsiveness (320px to 4K) → Test: responsive_layouts
- [ ] Keyboard navigation throughout → Test: keyboard_nav
- [ ] Screen reader compatibility → Test: screen_reader
- [ ] Browser compatibility (Chrome, Firefox, Safari, Edge) → Test: cross_browser
- [ ] Slow network conditions → Test: slow_network
- [ ] JavaScript disabled fallbacks → Test: no_js
- [ ] Dark/light theme switching → Test: theme_switch

## Phase Exit Criteria

### Test Suite Requirements
```yaml
Unit Tests:
  Total: 45
  Passing: 45
  Coverage: >80%

Integration Tests:
  Total: 20
  Passing: 20
  Coverage: Critical auth flows

E2E Tests:
  Total: 8
  Passing: 8
  Coverage: Main user journeys

Performance:
  Landing page: <1.5s
  Dashboard: <2s
  Auth flow: <3s

Accessibility:
  WCAG AA compliant: YES
  Keyboard navigable: YES

Security:
  OAuth validated: YES
  RLS policies active: YES
  HTTPS only: YES
```

### Phase Gate Checklist
- [ ] 100% of tests passing
- [ ] No critical or high-severity bugs
- [ ] Performance budgets met
- [ ] Security review completed
- [ ] Accessibility audit passed
- [ ] Code coverage >80%
- [ ] Documentation updated
- [ ] All supporting UI functional
- [ ] Error handling comprehensive
- [ ] Mobile experience verified

## Known Constraints & Decisions
- **Google OAuth Only**: No email/password auth per requirements
- **Supabase for everything**: Auth, database, storage per stack decision
- **Server-side session**: More secure than client-side tokens
- **Mobile-first responsive**: Design for mobile, enhance for desktop
- **Accessibility from start**: WCAG AA compliance non-negotiable
- **Test database required**: Separate test environment for integration tests

## Phase Completion Definition
This phase is complete when:
1. **ALL tests are passing (100%)**
2. Google OAuth fully functional
3. User can sign in, manage profile, sign out
4. All navigation working (desktop and mobile)
5. Settings pages operational
6. Error pages implemented
7. Design system established
8. Performance benchmarks met
9. Security validations passed
10. **Gate check approved for Phase 2**