# Phase N: [Feature Name] Playbook

**Purpose**: Test [brief description of what this playbook tests]
**Phase**: Phase N
**Estimated Time**: [X minutes]

---

## Pre-Flight Checks

Before executing this playbook:
- [ ] Dev server is running (`npm run dev`)
- [ ] Database is connected
- [ ] No console errors on page load
- [ ] Browser is open (Puppeteer MCP ready)

---

## Manual Steps (Human Verification)

### Scenario 1: [Test Scenario Name]

**User Story**: As a [user type], I want to [action] so that [benefit].

**Manual Steps**:
1. [Step 1 description]
2. [Step 2 description]
3. [Step 3 description]

**Expected Outcome**:
- [What should happen]
- [Visual confirmation]
- [State change]

---

## Automated Verification (Puppeteer MCP)

### Test 1: [Test Name]

**What it tests**: [Brief description]

**Commands**:
```javascript
// Navigate to page
mcp__puppeteer__puppeteer_navigate({
  url: "http://localhost:3000/YOUR_PAGE"
})

// Take desktop screenshot
mcp__puppeteer__puppeteer_screenshot({
  name: "feature_name_desktop",
  width: 1440,
  height: 900
})

// Take mobile screenshot
mcp__puppeteer__puppeteer_screenshot({
  name: "feature_name_mobile",
  width: 375,
  height: 667
})

// Verify element exists
mcp__puppeteer__puppeteer_evaluate({
  script: `
    const element = document.querySelector('YOUR_SELECTOR');
    if (!element) throw new Error('Element not found');
    console.log('✅ Element verified');
  `
})
```

**Pass Criteria**:
- [ ] Navigation successful
- [ ] Screenshots captured
- [ ] Element verification passed

---

### Test 2: [Test Name]

**What it tests**: [Brief description]

**Commands**:
```javascript
// [Add your MCP commands here]
// Reference ai_docs/testing/mcp_patterns.md for patterns
```

**Pass Criteria**:
- [ ] [Criterion 1]
- [ ] [Criterion 2]
- [ ] [Criterion 3]

---

## Visual Quality Checks

### Desktop (1440px)

**Screenshot**: `ai_docs/progress/phase_N/screenshots/desktop/feature_name_desktop.png`

**Checklist** (from `ai_docs/standards/3_component_standards.md`):
- [ ] Spacing is generous (minimum 16px gaps between major elements)
- [ ] Clear visual hierarchy (can identify primary/secondary/tertiary)
- [ ] One primary action per screen section (lime button)
- [ ] Design tokens used (no hardcoded #hex or px values)
- [ ] Typography hierarchy clear (heading sizes descend appropriately)
- [ ] Colors match Ramp palette (navy, lime, grays)
- [ ] Components follow standards (buttons, cards, forms)

**Notes**: [Any specific visual observations]

---

### Mobile (375px)

**Screenshot**: `ai_docs/progress/phase_N/screenshots/mobile/feature_name_mobile.png`

**Checklist**:
- [ ] Responsive layout works (no horizontal scroll)
- [ ] Touch targets ≥48px (buttons, links)
- [ ] Text is readable (font size ≥14px)
- [ ] Navigation accessible (mobile menu present)
- [ ] Spacing maintained (not cramped)

**Notes**: [Any specific mobile observations]

---

## Edge Cases & Error States

### Edge Case 1: [Scenario]

**Test**:
```javascript
// [MCP commands to test edge case]
```

**Expected**: [What should happen]

**Pass Criteria**:
- [ ] [Criterion]

---

### Error State 1: [Scenario]

**Test**:
```javascript
// [MCP commands to trigger error state]
```

**Expected**: [Error message or state]

**Pass Criteria**:
- [ ] Error message shown
- [ ] User can recover
- [ ] No console errors (or expected errors only)

---

## Accessibility Quick Checks

### Keyboard Navigation
- [ ] Can tab through all interactive elements
- [ ] Focus indicators visible
- [ ] Can activate buttons/links with Enter/Space
- [ ] Can escape modals with Esc

### Screen Reader Support
- [ ] Form labels present
- [ ] ARIA labels where needed
- [ ] Heading structure logical (h1 → h2 → h3)
- [ ] Error messages announced

---

## Results

**Date Executed**: [YYYY-MM-DD]
**Executed By**: [Agent/Human name]

### Summary
- **Tests Passed**: [ ] / [ ]
- **Visual Quality**: ✅ Pass / ⚠️ Needs Refinement / ❌ Fail
- **Critical Issues**: [None / List issues]

### Issues Found
1. [Issue description] - [Severity: Critical/High/Medium/Low]
2. [Issue description] - [Severity]

### Screenshots Saved
- Desktop: `ai_docs/progress/phase_N/screenshots/desktop/`
- Mobile: `ai_docs/progress/phase_N/screenshots/mobile/`

### Next Actions
- [ ] [Action item 1]
- [ ] [Action item 2]

---

## Sign-Off

**Status**: ✅ Pass / ⚠️ Pass with Notes / ❌ Fail

**Notes**: [Any additional observations or context]

**Approved for Phase Gate**: [ ] Yes / [ ] No (pending fixes)

---

## Related Documentation

- **MCP Patterns**: `ai_docs/testing/mcp_patterns.md`
- **Visual Verification Workflow**: `ai_docs/standards/9_visual_verification_workflow.md`
- **Component Standards**: `ai_docs/standards/3_component_standards.md`
- **Phase Document**: `ai_docs/phases/phase_N.md`