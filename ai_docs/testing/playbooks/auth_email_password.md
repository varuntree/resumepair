# Testing Playbook: Email/Password Authentication

**Feature**: Email/Password Authentication with Duplicate Prevention
**Phase**: Auth Enhancement
**Estimated Time**: 20-25 minutes
**Last Updated**: 2025-10-01

---

## Pre-flight Checks

**Before starting**:
- [ ] Development server running (`npm run dev`)
- [ ] Supabase project configured (email provider enabled, verification disabled)
- [ ] Browser console open for error inspection
- [ ] Clean test environment (consider using incognito/private mode)

**Required MCP Tools**:
- `mcp__puppeteer__puppeteer_navigate`
- `mcp__puppeteer__puppeteer_screenshot`
- `mcp__puppeteer__puppeteer_fill`
- `mcp__puppeteer__puppeteer_click`
- `mcp__puppeteer__puppeteer_evaluate`

---

## Test Scenarios

### Scenario 1: New User Sign-Up (Email/Password)

**Objective**: Verify new users can create accounts with email/password

**Steps**:

1. Navigate to sign-in page
```javascript
mcp__puppeteer__puppeteer_navigate({
  url: "http://localhost:3000/signin"
})
```

2. Take screenshot of initial state
```javascript
mcp__puppeteer__puppeteer_screenshot({
  name: "signin_page_initial",
  width: 1440,
  height: 900
})
```

3. Verify toggle to sign-up mode works
```javascript
mcp__puppeteer__puppeteer_evaluate({
  script: `
    const signupToggle = document.querySelector('button:has-text("Sign up")');
    if (!signupToggle) throw new Error('Sign up toggle not found');
    console.log('✅ Sign up toggle found');
  `
})
```

4. Click sign-up toggle
```javascript
mcp__puppeteer__puppeteer_click({
  selector: 'button'
})
// Note: This will click the first button; adjust selector if needed
```

5. Fill in email and password fields
```javascript
mcp__puppeteer__puppeteer_fill({
  selector: 'input[type="email"]',
  value: 'newuser@test.com'
})

mcp__puppeteer__puppeteer_fill({
  selector: 'input[id="password"]',
  value: 'TestPass123'
})

mcp__puppeteer__puppeteer_fill({
  selector: 'input[id="confirmPassword"]',
  value: 'TestPass123'
})
```

6. Submit form
```javascript
mcp__puppeteer__puppeteer_click({
  selector: 'button[type="submit"]'
})
```

7. Wait and verify redirect to dashboard
```javascript
mcp__puppeteer__puppeteer_evaluate({
  script: `
    await new Promise(resolve => setTimeout(resolve, 3000));
    if (!window.location.pathname.includes('/dashboard')) {
      throw new Error('Did not redirect to dashboard');
    }
    console.log('✅ Successfully redirected to dashboard');
  `
})
```

**Expected Result**: ✅ User created, redirected to dashboard

---

### Scenario 2: Password Validation (Weak Password)

**Objective**: Verify client-side password validation works

**Steps**:

1. Navigate to sign-in page (sign-up mode)
```javascript
mcp__puppeteer__puppeteer_navigate({
  url: "http://localhost:3000/signin"
})
```

2. Fill in weak password
```javascript
mcp__puppeteer__puppeteer_fill({
  selector: 'input[type="email"]',
  value: 'test@example.com'
})

mcp__puppeteer__puppeteer_fill({
  selector: 'input[id="password"]',
  value: 'weak'  // Too short, no uppercase, no number
})

mcp__puppeteer__puppeteer_fill({
  selector: 'input[id="confirmPassword"]',
  value: 'weak'
})
```

3. Submit and verify error
```javascript
mcp__puppeteer__puppeteer_click({
  selector: 'button[type="submit"]'
})

mcp__puppeteer__puppeteer_evaluate({
  script: `
    await new Promise(resolve => setTimeout(resolve, 500));
    const error = document.querySelector('[class*="destructive"]');
    if (!error) throw new Error('Password validation error not shown');
    console.log('✅ Password validation error displayed:', error.textContent);
  `
})
```

**Expected Result**: ✅ Error message shown for weak password

---

### Scenario 3: Password Mismatch

**Objective**: Verify password confirmation validation

**Steps**:

1. Fill in mismatched passwords
```javascript
mcp__puppeteer__puppeteer_fill({
  selector: 'input[id="password"]',
  value: 'TestPass123'
})

mcp__puppeteer__puppeteer_fill({
  selector: 'input[id="confirmPassword"]',
  value: 'TestPass456'  // Different
})
```

2. Submit and verify error
```javascript
mcp__puppeteer__puppeteer_click({
  selector: 'button[type="submit"]'
})

mcp__puppeteer__puppeteer_evaluate({
  script: `
    await new Promise(resolve => setTimeout(resolve, 500));
    const error = document.querySelector('p:has-text("match")');
    if (!error) throw new Error('Password mismatch error not shown');
    console.log('✅ Password mismatch error displayed');
  `
})
```

**Expected Result**: ✅ "Passwords don't match" error shown

---

### Scenario 4: Duplicate Email Prevention (Email → Email)

**Objective**: Verify duplicate email signup is blocked

**Prerequisites**: User `duplicate@test.com` already exists (created in Scenario 1)

**Steps**:

1. Try to sign up with existing email
```javascript
mcp__puppeteer__puppeteer_fill({
  selector: 'input[type="email"]',
  value: 'newuser@test.com'  // Already registered
})

mcp__puppeteer__puppeteer_fill({
  selector: 'input[id="password"]',
  value: 'DifferentPass123'
})

mcp__puppeteer__puppeteer_fill({
  selector: 'input[id="confirmPassword"]',
  value: 'DifferentPass123'
})

mcp__puppeteer__puppeteer_click({
  selector: 'button[type="submit"]'
})
```

2. Verify duplicate email error
```javascript
mcp__puppeteer__puppeteer_evaluate({
  script: `
    await new Promise(resolve => setTimeout(resolve, 2000));
    const error = document.body.textContent;
    if (!error.includes('already exists')) {
      throw new Error('Duplicate email error not shown');
    }
    console.log('✅ Duplicate email blocked with clear message');
  `
})
```

3. Take screenshot of error
```javascript
mcp__puppeteer__puppeteer_screenshot({
  name: "duplicate_email_error",
  width: 1440,
  height: 900
})
```

**Expected Result**: ✅ Error message: "An account with this email already exists..."

---

### Scenario 5: Sign-In with Email/Password

**Objective**: Verify existing users can sign in

**Prerequisites**: User `newuser@test.com` with password `TestPass123` exists

**Steps**:

1. Navigate to sign-in page (ensure in sign-in mode)
```javascript
mcp__puppeteer__puppeteer_navigate({
  url: "http://localhost:3000/signin"
})
```

2. Fill in credentials
```javascript
mcp__puppeteer__puppeteer_fill({
  selector: 'input[type="email"]',
  value: 'newuser@test.com'
})

mcp__puppeteer__puppeteer_fill({
  selector: 'input[id="password"]',
  value: 'TestPass123'
})
```

3. Submit and verify success
```javascript
mcp__puppeteer__puppeteer_click({
  selector: 'button[type="submit"]'
})

mcp__puppeteer__puppeteer_evaluate({
  script: `
    await new Promise(resolve => setTimeout(resolve, 3000));
    if (!window.location.pathname.includes('/dashboard')) {
      throw new Error('Sign-in failed, not redirected to dashboard');
    }
    console.log('✅ Successfully signed in and redirected');
  `
})
```

**Expected Result**: ✅ Signed in successfully, redirected to dashboard

---

### Scenario 6: Invalid Credentials

**Objective**: Verify error handling for wrong password

**Steps**:

1. Try to sign in with wrong password
```javascript
mcp__puppeteer__puppeteer_navigate({
  url: "http://localhost:3000/signin"
})

mcp__puppeteer__puppeteer_fill({
  selector: 'input[type="email"]',
  value: 'newuser@test.com'
})

mcp__puppeteer__puppeteer_fill({
  selector: 'input[id="password"]',
  value: 'WrongPassword123'
})

mcp__puppeteer__puppeteer_click({
  selector: 'button[type="submit"]'
})
```

2. Verify error message
```javascript
mcp__puppeteer__puppeteer_evaluate({
  script: `
    await new Promise(resolve => setTimeout(resolve, 2000));
    const error = document.body.textContent;
    if (!error.includes('Invalid') || !error.includes('password')) {
      throw new Error('Invalid credentials error not shown');
    }
    console.log('✅ Invalid credentials error displayed');
  `
})
```

**Expected Result**: ✅ Error message shown for invalid credentials

---

### Scenario 7: Google OAuth Still Works (Regression Test)

**Objective**: Verify Google OAuth not broken by email/password addition

**Steps**:

1. Verify Google button exists and is clickable
```javascript
mcp__puppeteer__puppeteer_navigate({
  url: "http://localhost:3000/signin"
})

mcp__puppeteer__puppeteer_evaluate({
  script: `
    const googleButton = document.querySelector('button:has-text("Continue with Google")');
    if (!googleButton) throw new Error('Google sign-in button not found');
    if (googleButton.disabled) throw new Error('Google button is disabled');
    console.log('✅ Google OAuth button present and enabled');
  `
})
```

2. Take screenshot showing both auth methods
```javascript
mcp__puppeteer__puppeteer_screenshot({
  name: "dual_auth_methods",
  width: 1440,
  height: 900
})
```

**Expected Result**: ✅ Google OAuth button visible and functional

---

### Scenario 8: Profile Auto-Creation

**Objective**: Verify profile is auto-created for email/password users

**Prerequisites**: Test database access or Supabase dashboard access

**Manual Verification**:
1. After successful email/password signup, check Supabase dashboard
2. Verify `profiles` table has new entry for the user
3. Verify `user_preferences` table has entry for the user
4. Verify `email` column populated correctly

**Expected Result**: ✅ Profile and preferences auto-created via trigger

---

### Scenario 9: Sign-Out Works for Both Methods

**Objective**: Verify sign-out works regardless of auth method

**Steps**:

1. Sign in with email/password (from Scenario 5)

2. Navigate to dashboard and sign out
```javascript
mcp__puppeteer__puppeteer_navigate({
  url: "http://localhost:3000/dashboard"
})

// Click user menu (adjust selector based on your layout)
mcp__puppeteer__puppeteer_click({
  selector: 'button[class*="rounded-full"]'  // Avatar button
})

// Click sign out
mcp__puppeteer__puppeteer_click({
  selector: 'button:has-text("Sign Out")'
})
```

3. Verify redirect to home
```javascript
mcp__puppeteer__puppeteer_evaluate({
  script: `
    await new Promise(resolve => setTimeout(resolve, 2000));
    if (window.location.pathname.includes('/dashboard')) {
      throw new Error('Still on dashboard after sign out');
    }
    console.log('✅ Signed out successfully');
  `
})
```

**Expected Result**: ✅ Signed out, redirected to home/signin page

---

## Visual Quality Verification

### Desktop (1440px)

**Checklist**:
- [ ] Card has generous padding (≥24px)
- [ ] Spacing between elements is comfortable (≥16px gaps)
- [ ] Google button and email form have clear visual separation (divider)
- [ ] Typography hierarchy clear (title > description > labels)
- [ ] One primary action (Submit button is lime/primary color)
- [ ] Error messages visible and readable (red background, clear text)
- [ ] Password visibility toggle icons visible
- [ ] Sign-up/Sign-in toggle link is lime colored

```javascript
mcp__puppeteer__puppeteer_screenshot({
  name: "auth_desktop_signin",
  width: 1440,
  height: 900
})

mcp__puppeteer__puppeteer_screenshot({
  name: "auth_desktop_signup",
  width: 1440,
  height: 900
})
```

### Mobile (375px)

**Checklist**:
- [ ] No horizontal scroll
- [ ] Touch targets ≥48px height
- [ ] Text readable on small screen
- [ ] Card responsive (adapts to viewport)
- [ ] Form fields stack vertically
- [ ] Buttons full-width on mobile

```javascript
mcp__puppeteer__puppeteer_screenshot({
  name: "auth_mobile_signin",
  width: 375,
  height: 667
})

mcp__puppeteer__puppeteer_screenshot({
  name: "auth_mobile_signup",
  width: 375,
  height: 667
})
```

---

## Pass/Fail Criteria

### ✅ Pass Requirements

- [ ] All 9 test scenarios passed
- [ ] Desktop and mobile screenshots taken
- [ ] Visual quality checklist items verified
- [ ] No console errors during testing
- [ ] Error messages are user-friendly and actionable
- [ ] Google OAuth still functional (regression)
- [ ] Profile auto-creation verified

### ❌ Fail Conditions

- Any test scenario fails
- Visual quality standards not met
- Console errors during normal operation
- Duplicate emails not properly blocked
- Google OAuth broken

---

## Known Limitations

1. **No email verification**: Users can sign up with any email (design decision)
2. **No password reset**: Future enhancement
3. **No "forgot password" link**: To be added later
4. **Method separation**: Users cannot link Google + email accounts (design decision)

---

## Cleanup

**After testing**:
- [ ] Delete test users from Supabase Auth (if needed)
- [ ] Clear browser cache/cookies
- [ ] Save screenshots to `ai_docs/progress/auth_implementation/screenshots/`
- [ ] Document any issues found
- [ ] Update this playbook if scenarios change

---

## Next Steps

If all tests pass:
1. Mark testing task as complete in todo list
2. Proceed with Supabase console configuration (enable email provider)
3. Perform user acceptance testing
4. Deploy to staging/production

If tests fail:
1. Document failure details
2. Fix issues
3. Re-run affected scenarios
4. Update playbook if needed
