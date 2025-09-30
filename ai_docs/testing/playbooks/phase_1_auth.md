# Phase 1: Authentication Playbook

**Purpose**: Test Google OAuth authentication flow, session management, and protected routes
**Phase**: Phase 1
**Estimated Time**: 15-20 minutes

---

## Pre-Flight Checks

Before executing this playbook:
- [ ] Dev server is running (`npm run dev`)
- [ ] Supabase connection working
- [ ] Google OAuth configured
- [ ] No console errors on page load

---

## Test 1: Sign In Button Present

**What it tests**: Landing page has Google sign in button

**Commands**:
```javascript
// Navigate to landing page
mcp__puppeteer__puppeteer_navigate({
  url: "http://localhost:3000"
})

// Take desktop screenshot
mcp__puppeteer__puppeteer_screenshot({
  name: "landing_page_desktop",
  width: 1440,
  height: 900
})

// Take mobile screenshot
mcp__puppeteer__puppeteer_screenshot({
  name: "landing_page_mobile",
  width: 375,
  height: 667
})

// Verify sign in button exists
mcp__puppeteer__puppeteer_evaluate({
  script: `
    const button = document.querySelector('button:has-text("Sign in with Google"), a:has-text("Sign in with Google")');
    if (!button) throw new Error('Sign in button not found');
    console.log('✅ Sign in button present');
  `
})
```

**Pass Criteria**:
- [ ] Landing page loads
- [ ] Screenshots captured
- [ ] Sign in button found

---

## Test 2: OAuth Flow Initiation

**What it tests**: Clicking sign in initiates OAuth flow

**Manual Steps**:
1. Click "Sign in with Google" button
2. Verify redirect to Google OAuth page OR localhost callback
3. Complete OAuth flow in real browser (manual)
4. Verify redirect to dashboard

**Automated Check** (post-auth):
```javascript
// After manual OAuth, navigate to dashboard
mcp__puppeteer__puppeteer_navigate({
  url: "http://localhost:3000/dashboard"
})

// Take screenshot
mcp__puppeteer__puppeteer_screenshot({
  name: "dashboard_authenticated_desktop",
  width: 1440,
  height: 900
})

// Verify user menu shows (indicates authenticated)
mcp__puppeteer__puppeteer_evaluate({
  script: `
    const userMenu = document.querySelector('[data-testid="user-menu"], [aria-label="User menu"]');
    if (!userMenu) throw new Error('User menu not found - may not be authenticated');
    console.log('✅ User authenticated - user menu present');
  `
})
```

**Pass Criteria**:
- [ ] OAuth redirect works
- [ ] Dashboard loads after auth
- [ ] User menu visible

---

## Test 3: Protected Route Redirect

**What it tests**: Unauthenticated users redirect from protected routes

**Commands**:
```javascript
// Clear any existing auth (simulate logged out state)
mcp__puppeteer__puppeteer_evaluate({
  script: `
    // Clear cookies and localStorage
    document.cookie.split(";").forEach(c => {
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    localStorage.clear();
    sessionStorage.clear();
    console.log('✅ Cleared auth state');
  `
})

// Try to access protected route
mcp__puppeteer__puppeteer_navigate({
  url: "http://localhost:3000/dashboard"
})

// Wait and check if redirected
mcp__puppeteer__puppeteer_evaluate({
  script: `
    await new Promise(resolve => setTimeout(resolve, 2000));
    if (!window.location.href.includes('/signin') && !window.location.href.includes('/auth')) {
      throw new Error('Protected route did not redirect to signin');
    }
    console.log('✅ Protected route redirect working');
  `
})
```

**Pass Criteria**:
- [ ] Redirect to signin occurs
- [ ] Dashboard not accessible when logged out

---

## Test 4: Sign Out Flow

**What it tests**: Sign out clears session and redirects

**Prerequisites**: Must be authenticated first

**Commands**:
```javascript
// Navigate to dashboard (must be authenticated)
mcp__puppeteer__puppeteer_navigate({
  url: "http://localhost:3000/dashboard"
})

// Click sign out
mcp__puppeteer__puppeteer_click({
  selector: '[data-testid="sign-out"], button:has-text("Sign out")'
})

// Wait and verify redirect
mcp__puppeteer__puppeteer_evaluate({
  script: `
    await new Promise(resolve => setTimeout(resolve, 2000));
    const isHome = window.location.pathname === '/';
    const isSignin = window.location.href.includes('/signin');
    if (!isHome && !isSignin) {
      throw new Error('Sign out did not redirect to home/signin');
    }
    console.log('✅ Sign out successful');
  `
})

// Verify cannot access dashboard
mcp__puppeteer__puppeteer_navigate({
  url: "http://localhost:3000/dashboard"
})

mcp__puppeteer__puppeteer_evaluate({
  script: `
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (!window.location.href.includes('/signin')) {
      throw new Error('Dashboard accessible after sign out');
    }
    console.log('✅ Dashboard protected after sign out');
  `
})
```

**Pass Criteria**:
- [ ] Sign out button works
- [ ] Redirect to home/signin
- [ ] Dashboard no longer accessible

---

## Test 5: Session Persistence

**What it tests**: Session persists across page refreshes

**Prerequisites**: Must be authenticated

**Commands**:
```javascript
// Navigate to dashboard
mcp__puppeteer__puppeteer_navigate({
  url: "http://localhost:3000/dashboard"
})

// Verify authenticated
mcp__puppeteer__puppeteer_evaluate({
  script: `
    const userMenu = document.querySelector('[data-testid="user-menu"]');
    if (!userMenu) throw new Error('Not authenticated');
    console.log('✅ Initial auth verified');
  `
})

// Reload page
mcp__puppeteer__puppeteer_evaluate({
  script: `
    window.location.reload();
  `
})

// Wait for reload and verify still authenticated
mcp__puppeteer__puppeteer_evaluate({
  script: `
    await new Promise(resolve => setTimeout(resolve, 2000));
    const userMenu = document.querySelector('[data-testid="user-menu"]');
    if (!userMenu) throw new Error('Session not persisted after reload');
    console.log('✅ Session persisted after reload');
  `
})
```

**Pass Criteria**:
- [ ] User stays authenticated after page refresh
- [ ] No redirect to signin

---

## Visual Quality Checks

### Landing Page

**Screenshot**: `landing_page_desktop.png`

**Checklist**:
- [ ] Sign in button prominent (lime background, clear CTA)
- [ ] Generous spacing around elements
- [ ] Clear headline and value prop
- [ ] Ramp color palette (navy, lime, grays)
- [ ] No hardcoded colors visible

**Mobile**: `landing_page_mobile.png`
- [ ] Responsive layout (no horizontal scroll)
- [ ] Button still prominent
- [ ] Text readable

### Dashboard (Authenticated)

**Screenshot**: `dashboard_authenticated_desktop.png`

**Checklist**:
- [ ] User menu visible in header
- [ ] Navigation present
- [ ] Layout spacious (not cramped)
- [ ] Typography hierarchy clear
- [ ] Design tokens used throughout

---

## Edge Cases

### Edge Case 1: OAuth Callback Error

**Manual Test**: Simulate OAuth failure (cancel OAuth dialog)

**Expected**:
- Error message shown
- User stays on landing/signin page
- Can retry sign in

---

### Edge Case 2: Expired Session

**Manual Test**: Wait for session to expire (or clear cookies)

**Expected**:
- Redirect to signin when accessing protected route
- No errors in console
- Can sign in again

---

## Accessibility Checks

- [ ] Can tab to sign in button
- [ ] Can activate button with Enter key
- [ ] Focus indicator visible
- [ ] Sign out button keyboard accessible
- [ ] Screen reader can announce auth state

---

## Results

**Date Executed**: _____________
**Executed By**: _____________

### Summary
- **Tests Passed**: ☐☐☐☐☐ / 5
- **Visual Quality**: ☐ Pass / ☐ Needs Refinement / ☐ Fail
- **Critical Issues**: _____________

### Screenshots Saved
- Desktop: `ai_docs/progress/phase_1/screenshots/desktop/`
  - `landing_page_desktop.png`
  - `dashboard_authenticated_desktop.png`
- Mobile: `ai_docs/progress/phase_1/screenshots/mobile/`
  - `landing_page_mobile.png`

### Issues Found
1. _____________________________________________
2. _____________________________________________

### Next Actions
- [ ] _____________________________________________
- [ ] _____________________________________________

---

**Status**: ☐ Pass / ☐ Pass with Notes / ☐ Fail

**Approved for Phase Gate**: ☐ Yes / ☐ No

---

## Related Documentation

- **MCP Patterns**: `ai_docs/testing/mcp_patterns.md`
- **Visual Verification Workflow**: `ai_docs/standards/9_visual_verification_workflow.md`
- **Component Standards**: `ai_docs/standards/3_component_standards.md`