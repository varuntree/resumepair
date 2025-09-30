# Puppeteer MCP Testing Patterns

**Purpose**: Reusable command patterns for testing with Puppeteer MCP

**Usage**: Copy-paste these patterns into playbooks or execute directly

---

## Navigation & Screenshots

### Pattern: Navigate to Page
```javascript
mcp__puppeteer__puppeteer_navigate({
  url: "http://localhost:3000/YOUR_PAGE"
})
```

**Example**:
```javascript
mcp__puppeteer__puppeteer_navigate({ url: "http://localhost:3000/dashboard" })
```

---

### Pattern: Take Desktop Screenshot
```javascript
mcp__puppeteer__puppeteer_screenshot({
  name: "page_name_desktop",
  width: 1440,
  height: 900
})
```

**Naming convention**: `{feature}_{variant}_desktop` (e.g., `dashboard_empty_desktop`)

---

### Pattern: Take Mobile Screenshot
```javascript
mcp__puppeteer__puppeteer_screenshot({
  name: "page_name_mobile",
  width: 375,
  height: 667
})
```

**Standard mobile width**: 375px (iPhone SE/12/13 Mini)

---

### Pattern: Screenshot with Scroll
```javascript
// Scroll to element first
mcp__puppeteer__puppeteer_evaluate({
  script: `
    const element = document.querySelector('YOUR_SELECTOR');
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  `
})

// Wait for scroll animation
// Then take screenshot
mcp__puppeteer__puppeteer_screenshot({
  name: "section_name",
  width: 1440,
  height: 900
})
```

---

## Element Verification

### Pattern: Verify Element Exists
```javascript
mcp__puppeteer__puppeteer_evaluate({
  script: `
    const element = document.querySelector('YOUR_SELECTOR');
    if (!element) throw new Error('Element not found: YOUR_SELECTOR');
    console.log('✅ Element found');
  `
})
```

**Example**:
```javascript
mcp__puppeteer__puppeteer_evaluate({
  script: `
    const button = document.querySelector('button[data-testid="sign-in"]');
    if (!button) throw new Error('Sign in button not found');
    console.log('✅ Sign in button present');
  `
})
```

---

### Pattern: Verify Text Content
```javascript
mcp__puppeteer__puppeteer_evaluate({
  script: `
    const element = document.querySelector('YOUR_SELECTOR');
    const expectedText = 'YOUR_TEXT';
    if (!element) throw new Error('Element not found: YOUR_SELECTOR');
    if (!element.textContent.includes(expectedText)) {
      throw new Error(\`Expected "\${expectedText}", got "\${element.textContent}"\`);
    }
    console.log('✅ Text matches');
  `
})
```

**Example**:
```javascript
mcp__puppeteer__puppeteer_evaluate({
  script: `
    const heading = document.querySelector('h1');
    if (!heading.textContent.includes('Dashboard')) {
      throw new Error('Dashboard heading not found');
    }
    console.log('✅ Dashboard heading correct');
  `
})
```

---

### Pattern: Verify Multiple Elements
```javascript
mcp__puppeteer__puppeteer_evaluate({
  script: `
    const selectors = ['SELECTOR1', 'SELECTOR2', 'SELECTOR3'];
    const missing = selectors.filter(sel => !document.querySelector(sel));
    if (missing.length > 0) {
      throw new Error(\`Missing elements: \${missing.join(', ')}\`);
    }
    console.log(\`✅ All \${selectors.length} elements found\`);
  `
})
```

---

### Pattern: Count Elements
```javascript
mcp__puppeteer__puppeteer_evaluate({
  script: `
    const elements = document.querySelectorAll('YOUR_SELECTOR');
    const expectedCount = EXPECTED_NUMBER;
    if (elements.length !== expectedCount) {
      throw new Error(\`Expected \${expectedCount} elements, found \${elements.length}\`);
    }
    console.log(\`✅ Found \${elements.length} elements\`);
  `
})
```

---

## Interactions

### Pattern: Click Element
```javascript
mcp__puppeteer__puppeteer_click({
  selector: 'YOUR_SELECTOR'
})
```

**Example**:
```javascript
mcp__puppeteer__puppeteer_click({ selector: 'button[type="submit"]' })
```

---

### Pattern: Fill Input Field
```javascript
mcp__puppeteer__puppeteer_fill({
  selector: 'input[name="FIELD_NAME"]',
  value: 'YOUR_VALUE'
})
```

**Example**:
```javascript
mcp__puppeteer__puppeteer_fill({
  selector: 'input[name="email"]',
  value: 'test@example.com'
})
```

---

### Pattern: Fill Form (Multiple Fields)
```javascript
// Fill first field
mcp__puppeteer__puppeteer_fill({
  selector: 'input[name="fullName"]',
  value: 'Test User'
})

// Fill second field
mcp__puppeteer__puppeteer_fill({
  selector: 'input[name="email"]',
  value: 'test@example.com'
})

// Fill third field
mcp__puppeteer__puppeteer_fill({
  selector: 'input[name="phone"]',
  value: '+1234567890'
})

// Submit
mcp__puppeteer__puppeteer_click({
  selector: 'button[type="submit"]'
})
```

---

### Pattern: Click and Wait for Navigation
```javascript
// Click link
mcp__puppeteer__puppeteer_click({ selector: 'a[href="/dashboard"]' })

// Wait for navigation
mcp__puppeteer__puppeteer_evaluate({
  script: `
    // Wait 1 second for navigation
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (!window.location.href.includes('/dashboard')) {
      throw new Error('Navigation to dashboard failed');
    }
    console.log('✅ Navigated to dashboard');
  `
})
```

---

## Form Validation

### Pattern: Test Required Field Validation
```javascript
// Leave field empty and submit
mcp__puppeteer__puppeteer_click({ selector: 'button[type="submit"]' })

// Check for error message
mcp__puppeteer__puppeteer_evaluate({
  script: `
    const error = document.querySelector('[role="alert"]');
    if (!error || !error.textContent.includes('required')) {
      throw new Error('Required field error not shown');
    }
    console.log('✅ Required field validation working');
  `
})
```

---

### Pattern: Test Email Format Validation
```javascript
// Fill with invalid email
mcp__puppeteer__puppeteer_fill({
  selector: 'input[name="email"]',
  value: 'invalid-email'
})

mcp__puppeteer__puppeteer_click({ selector: 'button[type="submit"]' })

// Check for validation error
mcp__puppeteer__puppeteer_evaluate({
  script: `
    const error = document.querySelector('[role="alert"]');
    if (!error || !error.textContent.includes('valid email')) {
      throw new Error('Email validation error not shown');
    }
    console.log('✅ Email validation working');
  `
})
```

---

### Pattern: Test Successful Form Submission
```javascript
// Fill form with valid data
mcp__puppeteer__puppeteer_fill({
  selector: 'input[name="email"]',
  value: 'test@example.com'
})

mcp__puppeteer__puppeteer_fill({
  selector: 'input[name="password"]',
  value: 'SecurePassword123'
})

// Submit
mcp__puppeteer__puppeteer_click({ selector: 'button[type="submit"]' })

// Verify success (e.g., redirect or success message)
mcp__puppeteer__puppeteer_evaluate({
  script: `
    await new Promise(resolve => setTimeout(resolve, 1000));
    const success = document.querySelector('[role="status"]');
    if (success && success.textContent.includes('Success')) {
      console.log('✅ Form submitted successfully');
    } else if (window.location.href.includes('/dashboard')) {
      console.log('✅ Redirected after successful submission');
    } else {
      throw new Error('Form submission failed');
    }
  `
})
```

---

## API Testing

### Pattern: Test API Endpoint (GET)
```javascript
mcp__puppeteer__puppeteer_evaluate({
  script: `
    (async () => {
      const response = await fetch('/api/v1/YOUR_ENDPOINT');
      const json = await response.json();

      if (!response.ok) {
        throw new Error(\`API request failed: \${response.status}\`);
      }

      if (!json.success) {
        throw new Error(\`API returned error: \${json.error}\`);
      }

      console.log('✅ API request successful');
    })();
  `
})
```

---

### Pattern: Test API Endpoint (POST)
```javascript
mcp__puppeteer__puppeteer_evaluate({
  script: `
    (async () => {
      const response = await fetch('/api/v1/YOUR_ENDPOINT', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          field1: 'value1',
          field2: 'value2'
        })
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(\`API request failed: \${response.status}\`);
      }

      if (!json.success) {
        throw new Error(\`API returned error: \${json.error}\`);
      }

      console.log('✅ POST request successful');
    })();
  `
})
```

---

### Pattern: Verify API Response Structure
```javascript
mcp__puppeteer__puppeteer_evaluate({
  script: `
    (async () => {
      const response = await fetch('/api/v1/resumes');
      const json = await response.json();

      // Check ApiResponse structure
      if (typeof json.success !== 'boolean') {
        throw new Error('Missing success field');
      }

      if (!json.success) {
        throw new Error('API request failed');
      }

      if (!Array.isArray(json.data)) {
        throw new Error('Expected data to be an array');
      }

      console.log(\`✅ API returned \${json.data.length} items\`);
    })();
  `
})
```

---

## Responsive Testing

### Pattern: Test Mobile Layout
```javascript
// Take mobile screenshot
mcp__puppeteer__puppeteer_screenshot({
  name: "page_mobile",
  width: 375,
  height: 667
})

// Verify mobile menu exists
mcp__puppeteer__puppeteer_evaluate({
  script: `
    const mobileMenu = document.querySelector('[data-testid="mobile-menu"]');
    const desktopNav = document.querySelector('[data-testid="desktop-nav"]');

    if (!mobileMenu || mobileMenu.offsetParent === null) {
      throw new Error('Mobile menu not visible on mobile');
    }

    if (desktopNav && desktopNav.offsetParent !== null) {
      throw new Error('Desktop nav should be hidden on mobile');
    }

    console.log('✅ Mobile layout correct');
  `
})
```

---

### Pattern: Test Responsive Breakpoints
```javascript
// Desktop (1440px)
mcp__puppeteer__puppeteer_screenshot({
  name: "page_desktop",
  width: 1440,
  height: 900
})

// Tablet (768px)
mcp__puppeteer__puppeteer_screenshot({
  name: "page_tablet",
  width: 768,
  height: 1024
})

// Mobile (375px)
mcp__puppeteer__puppeteer_screenshot({
  name: "page_mobile",
  width: 375,
  height: 667
})

// Verify responsive behavior
mcp__puppeteer__puppeteer_evaluate({
  script: `
    // Check that layout adapts (basic check)
    const container = document.querySelector('.container-ramp');
    if (!container) throw new Error('Container not found');
    console.log('✅ Responsive layouts captured');
  `
})
```

---

## Visual Quality Checks

### Pattern: Verify Design Tokens Used
```javascript
mcp__puppeteer__puppeteer_evaluate({
  script: `
    // Check that no hardcoded colors exist
    const allElements = document.querySelectorAll('*');
    const hardcodedColors = [];

    allElements.forEach(el => {
      const style = window.getComputedStyle(el);
      // Check for hardcoded hex colors (simplified check)
      if (el.getAttribute('style')?.includes('#')) {
        hardcodedColors.push(el.className);
      }
    });

    if (hardcodedColors.length > 0) {
      console.warn('⚠️  Found hardcoded colors in:', hardcodedColors.slice(0, 5));
    } else {
      console.log('✅ No obvious hardcoded colors found');
    }
  `
})
```

---

### Pattern: Check Spacing (8px Grid)
```javascript
mcp__puppeteer__puppeteer_evaluate({
  script: `
    // Check common spacing violations
    const cards = document.querySelectorAll('.card, [class*="card"]');
    let violations = 0;

    cards.forEach(card => {
      const style = window.getComputedStyle(card);
      const padding = parseInt(style.padding);

      // Check if padding follows 8px grid (16px = space-4, 24px = space-6)
      if (padding > 0 && padding < 16) {
        violations++;
      }
    });

    if (violations > 0) {
      console.warn(\`⚠️  Found \${violations} spacing violations\`);
    } else {
      console.log('✅ Spacing follows 8px grid');
    }
  `
})
```

---

### Pattern: Verify Typography Hierarchy
```javascript
mcp__puppeteer__puppeteer_evaluate({
  script: `
    const h1 = document.querySelector('h1');
    const h2 = document.querySelector('h2');
    const body = document.querySelector('p');

    if (!h1) {
      console.warn('⚠️  No h1 found');
      return;
    }

    const h1Size = parseInt(window.getComputedStyle(h1).fontSize);
    const h2Size = h2 ? parseInt(window.getComputedStyle(h2).fontSize) : 0;
    const bodySize = body ? parseInt(window.getComputedStyle(body).fontSize) : 0;

    // Check hierarchy: h1 > h2 > body
    if (h2 && h1Size <= h2Size) {
      console.warn('⚠️  Typography hierarchy issue: h1 not larger than h2');
    } else if (body && (h2Size <= bodySize || h1Size <= bodySize)) {
      console.warn('⚠️  Typography hierarchy issue: headings not larger than body');
    } else {
      console.log('✅ Typography hierarchy correct');
    }
  `
})
```

---

## Authentication Testing

### Pattern: Verify Protected Route Redirect
```javascript
// Try to access protected page without auth
mcp__puppeteer__puppeteer_navigate({ url: "http://localhost:3000/dashboard" })

// Check if redirected to signin
mcp__puppeteer__puppeteer_evaluate({
  script: `
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (!window.location.href.includes('/signin')) {
      throw new Error('Protected route did not redirect to signin');
    }
    console.log('✅ Protected route redirect working');
  `
})
```

---

### Pattern: Test Sign Out
```javascript
// Click sign out button
mcp__puppeteer__puppeteer_click({ selector: '[data-testid="sign-out"]' })

// Verify redirect to landing page
mcp__puppeteer__puppeteer_evaluate({
  script: `
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (window.location.pathname !== '/' && !window.location.href.includes('/signin')) {
      throw new Error('Sign out did not redirect to home/signin');
    }
    console.log('✅ Sign out successful');
  `
})
```

---

## Accessibility Checks

### Pattern: Check Focus States
```javascript
mcp__puppeteer__puppeteer_evaluate({
  script: `
    // Get all interactive elements
    const interactive = document.querySelectorAll('button, a, input, select, textarea');
    let missingFocus = 0;

    interactive.forEach(el => {
      // Trigger focus
      el.focus();
      const focused = document.activeElement === el;
      const style = window.getComputedStyle(el, ':focus-visible');

      // Check if focus indicator exists (simplified)
      if (focused && style.outline === 'none' && style.boxShadow === 'none') {
        missingFocus++;
      }
    });

    if (missingFocus > 0) {
      console.warn(\`⚠️  \${missingFocus} elements missing focus indicators\`);
    } else {
      console.log('✅ Focus states present');
    }
  `
})
```

---

### Pattern: Check Heading Structure
```javascript
mcp__puppeteer__puppeteer_evaluate({
  script: `
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    const levels = headings.map(h => parseInt(h.tagName[1]));

    // Check for h1
    if (!levels.includes(1)) {
      console.warn('⚠️  No h1 found on page');
      return;
    }

    // Check for skipped levels
    for (let i = 0; i < levels.length - 1; i++) {
      if (levels[i + 1] - levels[i] > 1) {
        console.warn(\`⚠️  Heading level skipped: h\${levels[i]} to h\${levels[i + 1]}\`);
      }
    }

    console.log('✅ Heading structure valid');
  `
})
```

---

## Performance Checks

### Pattern: Measure Page Load Time
```javascript
mcp__puppeteer__puppeteer_evaluate({
  script: `
    const perfData = performance.getEntriesByType('navigation')[0];
    const loadTime = perfData.loadEventEnd - perfData.fetchStart;

    console.log(\`⏱️  Page load time: \${Math.round(loadTime)}ms\`);

    if (loadTime > 3000) {
      console.warn('⚠️  Page load time exceeds 3s');
    } else {
      console.log('✅ Page load time acceptable');
    }
  `
})
```

---

## Tips for Using These Patterns

1. **Copy-paste**: These patterns are designed to be copied directly into playbooks
2. **Customize selectors**: Replace `YOUR_SELECTOR` with actual CSS selectors
3. **Adjust expectations**: Modify expected values for your specific use case
4. **Combine patterns**: Chain multiple patterns together for complex workflows
5. **Add waits**: Use `await new Promise(resolve => setTimeout(resolve, MS))` for loading states
6. **Error messages**: Make error messages descriptive for easier debugging

---

## Related Documentation

- **Testing README**: `ai_docs/testing/README.md`
- **Visual Verification Workflow**: `ai_docs/standards/9_visual_verification_workflow.md`
- **Component Standards**: `ai_docs/standards/3_component_standards.md`

---

**Remember**: These are building blocks. Combine and customize them for your specific testing needs.