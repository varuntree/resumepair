# Phase 1: Navigation & Layout Playbook

**Purpose**: Test navigation system, header, sidebar, responsive layouts
**Phase**: Phase 1
**Estimated Time**: 10-15 minutes

---

## Pre-Flight Checks

- [ ] Dev server running
- [ ] User authenticated
- [ ] Dashboard accessible

---

## Test 1: Header Navigation

```javascript
// Navigate to dashboard
mcp__puppeteer__puppeteer_navigate({ url: "http://localhost:3000/dashboard" })

// Screenshot
mcp__puppeteer__puppeteer_screenshot({
  name: "header_desktop",
  width: 1440,
  height: 900
})

// Verify header elements
mcp__puppeteer__puppeteer_evaluate({
  script: `
    const logo = document.querySelector('[data-testid="logo"], header img, header a[href="/"]');
    const nav = document.querySelector('nav, [role="navigation"]');
    const userMenu = document.querySelector('[data-testid="user-menu"]');

    if (!logo) throw new Error('Logo not found');
    if (!nav) throw new Error('Navigation not found');
    if (!userMenu) throw new Error('User menu not found');

    console.log('✅ Header elements present');
  `
})
```

**Pass Criteria**:
- [ ] Logo visible
- [ ] Navigation present
- [ ] User menu visible

---

## Test 2: Navigation Links Work

```javascript
// Click Settings link
mcp__puppeteer__puppeteer_click({
  selector: 'a[href="/settings"], nav a:has-text("Settings")'
})

// Verify navigation
mcp__puppeteer__puppeteer_evaluate({
  script: `
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (!window.location.href.includes('/settings')) {
      throw new Error('Navigation to settings failed');
    }
    console.log('✅ Settings navigation works');
  `
})

// Screenshot settings page
mcp__puppeteer__puppeteer_screenshot({
  name: "settings_page_desktop",
  width: 1440,
  height: 900
})

// Return to dashboard
mcp__puppeteer__puppeteer_navigate({ url: "http://localhost:3000/dashboard" })
```

**Pass Criteria**:
- [ ] Settings link navigates correctly
- [ ] Settings page loads
- [ ] Can navigate back to dashboard

---

## Test 3: Mobile Navigation

```javascript
// Mobile screenshot
mcp__puppeteer__puppeteer_screenshot({
  name: "dashboard_mobile",
  width: 375,
  height: 667
})

// Verify mobile menu
mcp__puppeteer__puppeteer_evaluate({
  script: `
    const mobileMenu = document.querySelector('[data-testid="mobile-menu"], button[aria-label="Menu"]');
    const desktopNav = document.querySelector('[data-testid="desktop-nav"]');

    // Mobile menu should exist
    if (!mobileMenu) {
      console.warn('⚠️  Mobile menu not found');
    } else {
      console.log('✅ Mobile menu present');
    }

    // Desktop nav should be hidden on mobile
    if (desktopNav && window.getComputedStyle(desktopNav).display !== 'none') {
      console.warn('⚠️  Desktop nav not hidden on mobile');
    }
  `
})
```

**Pass Criteria**:
- [ ] Mobile menu exists
- [ ] Desktop nav hidden on mobile
- [ ] Layout responsive

---

## Test 4: Breadcrumbs (If Applicable)

```javascript
// Navigate to nested page
mcp__puppeteer__puppeteer_navigate({ url: "http://localhost:3000/settings/profile" })

// Check for breadcrumbs
mcp__puppeteer__puppeteer_evaluate({
  script: `
    const breadcrumbs = document.querySelector('[aria-label="Breadcrumb"], nav ol, .breadcrumb');
    if (breadcrumbs) {
      console.log('✅ Breadcrumbs present');
    } else {
      console.log('ℹ️  No breadcrumbs found (may not be implemented yet)');
    }
  `
})
```

**Pass Criteria**:
- [ ] Breadcrumbs show current path (if implemented)
- [ ] Or note: not yet implemented

---

## Visual Quality Checks

**Header Desktop** (`header_desktop.png`):
- [ ] Logo + nav + user menu aligned properly
- [ ] Generous padding (space-4 minimum)
- [ ] Clear visual separation (border or shadow)
- [ ] Typography hierarchy clear

**Mobile** (`dashboard_mobile.png`):
- [ ] Hamburger menu visible and prominent
- [ ] Touch targets ≥48px
- [ ] No horizontal scroll
- [ ] Content readable

---

## Accessibility

- [ ] Keyboard navigation works (Tab through all links)
- [ ] Focus indicators visible
- [ ] Can open mobile menu with keyboard
- [ ] Screen reader can announce navigation

---

## Results

**Date**: _____________
**Tests Passed**: ☐☐☐☐ / 4
**Visual Quality**: ☐ Pass / ☐ Needs Refinement
**Status**: ☐ Pass / ☐ Fail

**Screenshots**:
- `header_desktop.png`
- `settings_page_desktop.png`
- `dashboard_mobile.png`

**Issues**: _____________

**Approved**: ☐ Yes / ☐ No