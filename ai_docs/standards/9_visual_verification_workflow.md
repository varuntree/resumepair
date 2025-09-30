# Visual Verification Workflow

**Purpose**: Step-by-step process for agents to verify visual quality using Puppeteer MCP

**When to use**: After implementing ANY UI feature

---

## Overview

This workflow ensures all UI features meet visual quality standards before being marked complete.

**Tools**: Puppeteer MCP (already configured)
**Standards**: `ai_docs/standards/3_component_standards.md` (Visual Quality Standards)
**Time**: 5-10 minutes per feature

---

## Complete Workflow

### Step 1: Pre-Flight Check

**Before starting**:
- [ ] Feature code is complete
- [ ] Dev server can start (`npm run dev`)
- [ ] No TypeScript/ESLint errors
- [ ] Design tokens used (no hardcoded values in code)

---

### Step 2: Start Development Server

```bash
npm run dev
```

**Verify**: Server starts successfully, navigate to http://localhost:3000

---

### Step 3: Navigate to Feature Page

```javascript
mcp__puppeteer__puppeteer_navigate({
  url: "http://localhost:3000/YOUR_FEATURE_PAGE"
})
```

**Examples**:
- Dashboard: `http://localhost:3000/dashboard`
- Settings: `http://localhost:3000/settings`
- New feature: `http://localhost:3000/your-new-page`

---

### Step 4: Take Desktop Screenshot

```javascript
mcp__puppeteer__puppeteer_screenshot({
  name: "feature_name_desktop",
  width: 1440,
  height: 900
})
```

**Naming convention**: `{feature}_{variant}_desktop`

**Examples**:
- `dashboard_empty_desktop`
- `dashboard_with_data_desktop`
- `settings_profile_desktop`

---

### Step 5: Take Mobile Screenshot

```javascript
mcp__puppeteer__puppeteer_screenshot({
  name: "feature_name_mobile",
  width: 375,
  height: 667
})
```

**Standard mobile width**: 375px (iPhone SE/12/13 Mini)

---

### Step 6: Analyze Desktop Screenshot

**Open screenshot** and check against Visual Quality Checklist:

#### Spacing & Layout
- [ ] Spacing feels generous (not cramped)
- [ ] Section padding ≥64px mobile, ≥96px desktop
- [ ] Card padding ≥24px
- [ ] Gaps between elements ≥16px

**Quick test**: Does it feel "airy" or "cramped"?

#### Typography
- [ ] Clear hierarchy (can identify primary/secondary/tertiary at a glance)
- [ ] Page title is largest
- [ ] Headings descend in size (h1 > h2 > h3)
- [ ] Body text readable (≥16px)

**Quick test**: Can you instantly identify the most important text?

#### Color
- [ ] Only ONE lime button (primary action) per section
- [ ] Navy/lime/gray palette only (no off-palette colors)
- [ ] Good contrast (text readable against backgrounds)

**Quick test**: Is the primary action obvious?

#### Components
- [ ] Buttons: Clear primary vs secondary distinction
- [ ] Cards: Rounded corners (12px), subtle shadow, generous padding
- [ ] Forms: Labels above fields, clear focus states

**Quick test**: Do buttons/cards/forms match existing design system?

---

### Step 7: Analyze Mobile Screenshot

**Open screenshot** and check:

#### Responsive Layout
- [ ] No horizontal scroll
- [ ] Content fits viewport
- [ ] Text readable (≥14px)

#### Touch Targets
- [ ] Buttons ≥48px height
- [ ] Links ≥48px tap area
- [ ] Form inputs ≥48px height

#### Mobile Navigation
- [ ] Hamburger menu visible (if applicable)
- [ ] Desktop nav hidden
- [ ] Navigation accessible

**Quick test**: Could you comfortably tap all interactive elements?

---

### Step 8: Decision Point

**If ALL checks pass** → Proceed to Step 9 (Document)

**If ANY checks fail** → Proceed to Step 8a (Refine)

---

### Step 8a: Refine (If Needed)

**Identify issues**:
1. List all failing checklist items
2. Prioritize by severity:
   - **Critical**: Broken layout, unreadable text, missing primary action
   - **High**: Poor spacing, unclear hierarchy, multiple primary actions
   - **Medium**: Minor spacing issues, slight color mismatches
   - **Low**: Cosmetic improvements

**Fix issues**:
1. Update code (increase spacing, adjust typography, fix colors)
2. Verify design tokens used (no hardcoded values)
3. Save changes

**Re-test**:
1. Refresh page in browser
2. Re-take screenshots (Steps 4-5)
3. Re-analyze (Steps 6-7)
4. Repeat until all checks pass

**Common fixes**:
- Cramped → Increase gaps (gap-4 → gap-6), padding (p-4 → p-6)
- No hierarchy → Increase heading sizes, use bold weights
- Too many CTAs → Change secondary to variant="secondary"
- Wrong colors → Use navy-dark, lime, gray-* classes

---

### Step 9: Save Screenshots

**Create directories** (if not exist):
```bash
mkdir -p ai_docs/progress/phase_N/screenshots/desktop
mkdir -p ai_docs/progress/phase_N/screenshots/mobile
```

**Save screenshots**:
- Desktop: `ai_docs/progress/phase_N/screenshots/desktop/{feature}_desktop.png`
- Mobile: `ai_docs/progress/phase_N/screenshots/mobile/{feature}_mobile.png`

---

### Step 10: Document Results

**Create/update**: `ai_docs/progress/phase_N/visual_review.md`

**Template**:
```markdown
## {Feature Name}

**Date**: YYYY-MM-DD
**Screenshots**:
- Desktop: `screenshots/desktop/{feature}_desktop.png`
- Mobile: `screenshots/mobile/{feature}_mobile.png`

### Analysis

**Spacing**: ✅ Pass - Generous padding (space-6), good gaps
**Typography**: ✅ Pass - Clear hierarchy (text-4xl → text-xl → text-base)
**Color**: ✅ Pass - Single lime CTA, navy background, good contrast
**Components**: ✅ Pass - Buttons, cards, forms match standards
**Responsive**: ✅ Pass - Mobile layout works, touch targets ≥48px

### Design Tokens Used
- `--space-6` for card padding
- `--text-4xl` for page title
- `--text-base` for body text
- `bg-navy-dark` for dark sections
- `bg-lime` for primary button

### Issues Found
None - all standards met

### Status
✅ **Approved** - Ready for phase gate
```

---

### Step 11: Mark Feature Complete

**Update task status**:
- Feature code: ✅ Complete
- Visual verification: ✅ Complete
- Screenshots: ✅ Saved
- Documentation: ✅ Updated

**Feature is now ready for phase gate review**.

---

## Quick Reference Checklist

Use this for rapid verification:

### Must-Have (Critical)
- [ ] Desktop screenshot taken (1440px)
- [ ] Mobile screenshot taken (375px)
- [ ] Spacing generous (≥16px gaps, ≥24px card padding)
- [ ] One primary action per section (lime button)
- [ ] Design tokens used (no hardcoded values)
- [ ] Responsive (no horizontal scroll on mobile)

### Should-Have (High Priority)
- [ ] Clear typography hierarchy
- [ ] Ramp palette only (navy, lime, grays)
- [ ] Touch targets ≥48px on mobile
- [ ] Cards use rounded-lg + shadow-sm
- [ ] Forms have visible focus states

### Nice-to-Have (Medium Priority)
- [ ] Smooth transitions (200ms)
- [ ] Hover states visible
- [ ] Consistent component patterns

---

## Common Mistakes

### ❌ Skipping Mobile Screenshot
**Why it's bad**: Mobile issues won't be caught until production
**Fix**: Always take both desktop AND mobile screenshots

### ❌ Not Checking Against Checklist
**Why it's bad**: Subjective "looks good" isn't reliable
**Fix**: Use the checklist - all items must pass

### ❌ Using Hardcoded Values
**Why it's bad**: Inconsistent with design system, hard to maintain
**Fix**: Always use design tokens (space-*, text-*, bg-*, etc.)

### ❌ Multiple Primary Actions
**Why it's bad**: Confuses users, reduces conversion
**Fix**: Only ONE lime button per section

### ❌ Cramped Spacing
**Why it's bad**: Looks unprofessional, hard to scan
**Fix**: Increase gaps and padding until it feels "airy"

---

## Troubleshooting

### Issue: Can't Navigate to Page
**Symptoms**: MCP navigate command fails
**Solutions**:
1. Verify dev server is running (`npm run dev`)
2. Check URL is correct
3. Verify route exists in `app/` directory
4. Check for auth requirements

### Issue: Screenshots Look Broken
**Symptoms**: Layout broken, content missing
**Solutions**:
1. Wait for page load (add delay if needed)
2. Check for JavaScript errors in console
3. Verify CSS is loading
4. Check responsive breakpoints

### Issue: Can't Tell If Standards Met
**Symptoms**: Unsure if spacing/hierarchy/colors are correct
**Solutions**:
1. Compare against existing pages (dashboard, settings)
2. Reference `ai_docs/design-system.md`
3. Use the checklist - be objective, not subjective
4. When in doubt, increase spacing and size differentiation

### Issue: Too Many Refinement Cycles
**Symptoms**: Multiple rounds of fix → screenshot → analyze
**Solutions**:
1. Fix all issues at once (not one at a time)
2. Reference component standards BEFORE coding
3. Use design tokens from the start
4. Copy patterns from existing components

---

## Integration with Playbooks

**Visual verification is part of playbook execution**:

1. Playbook includes MCP commands for navigation + screenshots
2. Agent executes playbook
3. Agent performs visual verification (this workflow)
4. Agent documents results in playbook
5. Agent marks playbook as pass/fail

**See**: `ai_docs/testing/playbooks/` for examples

---

## Related Documentation

- **Component Standards**: `ai_docs/standards/3_component_standards.md` (Visual Quality Standards section)
- **Design System**: `ai_docs/design-system.md` (Token definitions)
- **MCP Patterns**: `ai_docs/testing/mcp_patterns.md` (Reusable commands)
- **Testing README**: `ai_docs/testing/README.md` (Overview)
- **Code Review Standards**: `ai_docs/standards/8_code_review_standards.md` (Visual review section)

---

## Summary

**Visual verification is mandatory** for all UI features.

**Process**: Screenshot → Analyze → Refine (if needed) → Document

**Time**: 5-10 minutes per feature

**Result**: High-quality, consistent UI that matches Ramp design system

**Remember**: Visual quality is not subjective - use the checklist, follow the standards, verify objectively.