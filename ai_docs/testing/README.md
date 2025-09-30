# Testing System - ResumePair

**Approach**: Puppeteer MCP + Manual Playbooks
**Philosophy**: Test what matters. Skip what doesn't. Never let testing block shipping.

---

## Overview

ResumePair uses a **simple, agent-friendly testing system** designed for indie SaaS development:

1. **Manual Playbooks**: Human-readable checklists with embedded Puppeteer MCP commands
2. **Visual Verification**: Screenshots + design principles compliance checks
3. **No Test Code**: Agents execute playbooks, don't write test files
4. **No Watch Mode**: Manual triggers only, preventing system freeze

### Why This Approach?

**Previous system problems**:
- Multiple tools (Playwright + Vitest) with complex configs
- Watch modes spawning numerous processes → system freeze
- 600+ tests across 8 phases → maintenance burden
- Agents spending time writing test code vs. features

**New system benefits**:
- ✅ Single tool (Puppeteer MCP already configured)
- ✅ No watchers (on-demand execution)
- ✅ ~20 playbooks total (vs 600 tests)
- ✅ Agents execute checklists (vs writing test code)
- ✅ Fast phase gates (20-30 min vs hours)

---

## System Components

### 1. Puppeteer MCP

**Purpose**: Universal testing tool for visual + functional verification

**Available Commands**:
- `mcp__puppeteer__puppeteer_navigate` - Navigate to URLs
- `mcp__puppeteer__puppeteer_screenshot` - Take screenshots
- `mcp__puppeteer__puppeteer_click` - Click elements
- `mcp__puppeteer__puppeteer_fill` - Fill form inputs
- `mcp__puppeteer__puppeteer_evaluate` - Run JavaScript in browser

**Use cases**:
- Visual verification (screenshots)
- Functional testing (click, fill, verify)
- API testing (via evaluate + fetch)
- Responsive testing (different viewport sizes)

### 2. Manual Playbooks

**Location**: `ai_docs/testing/playbooks/`

**Structure**:
- Pre-flight checks
- Manual steps (human verification)
- Automated verification (Puppeteer MCP commands)
- Visual quality checks (design principles)
- Pass/fail criteria
- Screenshot requirements

**Execution**:
- Agents read playbook during development
- Agents execute MCP commands
- Agents take screenshots
- Agents analyze against design principles
- Agents document results
- Agents mark playbook as pass/fail

### 3. Visual Verification

**Integrated into development workflow**:
1. Agent builds feature
2. Agent starts dev server
3. Agent navigates to page (MCP)
4. Agent takes desktop screenshot (1440px)
5. Agent takes mobile screenshot (375px)
6. Agent analyzes against design principles
7. Agent refines if needed
8. Agent documents in visual_review.md

**Standards**: See `ai_docs/standards/3_component_standards.md` (Visual Quality Standards)

---

## File Structure

```
ai_docs/testing/
├── README.md                          # This file
├── mcp_patterns.md                    # Reusable Puppeteer MCP commands
└── playbooks/
    ├── playbook_template.md           # Template for new playbooks
    ├── phase_1_auth.md                # Phase 1: Authentication tests
    ├── phase_1_navigation.md          # Phase 1: Navigation tests
    └── ...                            # Additional phase playbooks

ai_docs/progress/
├── phase_1/
│   ├── screenshots/
│   │   ├── desktop/                   # 1440px screenshots
│   │   └── mobile/                    # 375px screenshots
│   ├── visual_review.md               # Visual analysis results
│   └── playbook_results.md            # Playbook execution results
└── ...                                # Additional phases
```

---

## Phase Gate Process

**Before marking any phase complete**:

1. **Execute Playbook** (~15-20 min)
   - Read `ai_docs/testing/playbooks/phase_N_*.md`
   - Execute all manual steps
   - Execute all Puppeteer MCP commands
   - Document results

2. **Visual Verification** (~5-10 min)
   - Take screenshots (desktop + mobile)
   - Analyze against design principles
   - Document in `visual_review.md`

3. **Validation Scripts** (~30 sec)
   ```bash
   npm run validate  # Type check, lint, DB connection, env vars
   ```

4. **Gate Decision**
   - ✅ All playbook checks passed?
   - ✅ Visual quality meets standards?
   - ✅ Validation scripts passed?
   - ✅ No critical bugs?
   → **Proceed to next phase**

**Total time**: 20-30 minutes per phase

---

## Agent Workflow

### For Every UI Feature

1. **Build Feature**
   - Write code following architectural patterns
   - Use design tokens (no hardcoded values)

2. **Visual Verification** (Mandatory)
   ```
   # Start dev server
   npm run dev

   # Navigate
   mcp__puppeteer__puppeteer_navigate({ url: "http://localhost:3000/YOUR_PAGE" })

   # Screenshot desktop
   mcp__puppeteer__puppeteer_screenshot({
     name: "feature_desktop",
     width: 1440,
     height: 900
   })

   # Screenshot mobile
   mcp__puppeteer__puppeteer_screenshot({
     name: "feature_mobile",
     width: 375,
     height: 667
   })

   # Analyze against ai_docs/standards/3_component_standards.md
   # Refine if needed
   # Save screenshots to ai_docs/progress/phase_N/screenshots/
   ```

3. **Execute Playbook**
   - Open relevant playbook
   - Execute all MCP commands
   - Update playbook status (pass/fail)

4. **Document**
   - Save screenshots
   - Update visual_review.md
   - Update playbook_results.md

### For API Features

1. **Build Feature**
   - Write API route
   - Use API utilities (withAuth, apiSuccess, apiError)

2. **Test with MCP**
   ```javascript
   mcp__puppeteer__puppeteer_evaluate({
     script: `
       (async () => {
         const response = await fetch('/api/v1/YOUR_ENDPOINT');
         const json = await response.json();
         if (!json.success) throw new Error('API request failed');
         console.log('✅ API test passed');
       })();
     `
   })
   ```

3. **Document**
   - Update playbook results

---

## Common Patterns

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

### Pattern: Test Form Validation
```javascript
// Fill with invalid data
mcp__puppeteer__puppeteer_fill({ selector: 'input[name="email"]', value: 'invalid' })
mcp__puppeteer__puppeteer_click({ selector: 'button[type="submit"]' })

// Check error message
mcp__puppeteer__puppeteer_evaluate({
  script: `
    const error = document.querySelector('[role="alert"]');
    if (!error || !error.textContent.includes('valid email')) {
      throw new Error('Validation error not shown');
    }
    console.log('✅ Validation working');
  `
})
```

### Pattern: API Contract Test
```javascript
mcp__puppeteer__puppeteer_evaluate({
  script: `
    (async () => {
      const response = await fetch('/api/v1/resumes');
      const json = await response.json();
      if (!json.success) throw new Error('API request failed');
      if (!Array.isArray(json.data)) throw new Error('Expected data array');
      console.log(\`✅ API returned \${json.data.length} items\`);
    })();
  `
})
```

**More patterns**: See `ai_docs/testing/mcp_patterns.md`

---

## Visual Quality Standards

Every UI feature must meet these standards:

### Spacing (8px Grid)
- ✅ Section padding: 64px+ mobile, 96px+ desktop
- ✅ Card padding: 24px minimum
- ✅ Element gaps: 16-24px between major elements
- ❌ Cramped spacing (< 16px gaps)

### Typography Hierarchy
- ✅ Clear size differences (page title > section heading > card title)
- ✅ Proper weights (400 body, 600 headings)
- ❌ All text same size/weight

### Color Usage (Ramp Palette)
- ✅ One lime CTA per screen section
- ✅ Navy backgrounds with white text
- ✅ Gray scale for hierarchy
- ❌ Multiple lime elements competing

### Component Composition
- ✅ Buttons: Prominent primary, subtle secondary
- ✅ Cards: Rounded-lg, shadow-sm, p-6 padding
- ✅ Forms: Clear labels, visible focus states
- ❌ Inconsistent patterns

**Full standards**: See `ai_docs/standards/3_component_standards.md`

---

## Troubleshooting

### Issue: MCP Command Fails
**Solution**: Check dev server is running, verify selector/URL is correct, check browser console for errors

### Issue: Screenshots Look Wrong
**Solution**: Wait for page load, check responsive breakpoints, verify CSS is applied

### Issue: Can't Navigate to Page
**Solution**: Verify route exists, check auth requirements, ensure `npm run dev` is running

### Issue: Visual Standards Not Met
**Solution**: Review design-system.md, use design tokens, increase spacing, clarify hierarchy

---

## FAQs

**Q: Do I need to write test files?**
A: No. Execute playbooks with MCP commands, don't write test code.

**Q: When do I take screenshots?**
A: After implementing any UI feature, before marking it complete.

**Q: How do I know if visual quality is good enough?**
A: Follow the checklist in `ai_docs/standards/3_component_standards.md` (Visual Quality Standards).

**Q: What if a playbook check fails?**
A: Fix the issue, re-run the check, document the fix.

**Q: Can I skip visual verification?**
A: No. It's mandatory for all UI features and part of phase gate criteria.

**Q: How often should I run playbooks?**
A: During development (after major features) and before phase gate.

---

## Migration from Old System

**Old system** (Playwright + Vitest, 600+ tests):
- Archived in `ai_docs/archived/12_testing_strategy_OLD.md`
- Not used going forward
- Agents should follow this new system

**New system** (Puppeteer MCP + Playbooks):
- Simpler, faster, no freeze risk
- Visual verification integrated
- Agent-friendly checklists

---

## Related Documentation

- **MCP Patterns**: `ai_docs/testing/mcp_patterns.md`
- **Visual Verification Workflow**: `ai_docs/standards/9_visual_verification_workflow.md`
- **Component Standards**: `ai_docs/standards/3_component_standards.md`
- **Code Review Standards**: `ai_docs/standards/8_code_review_standards.md`
- **Design System**: `ai_docs/design-system.md`
- **Main Instructions**: `CLAUDE.md`

---

**Remember**: Test what matters. Keep it simple. Never let testing block shipping.