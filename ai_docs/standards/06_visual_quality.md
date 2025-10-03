# Visual Quality Standards

**Visual verification workflow and quality standards.**

---

## 1. Visual Quality Standards

### Spacing
- ✅ Generous spacing: ≥16px gaps, ≥24px card padding
- ✅ Section padding: 64px mobile, 96px desktop

### Typography
- ✅ Clear hierarchy: Display → Section → Card → Body
- ✅ Readable: text-base (16px) minimum

### Color
- ✅ Ramp palette only: Navy, lime, grays
- ✅ One primary action: Single lime button per section
- ✅ WCAG AA contrast: 4.5:1 minimum

### Components
- ✅ shadcn/ui only
- ✅ Design tokens only (no hardcoded values)

### Responsive
- ✅ No horizontal scroll on mobile (375px)
- ✅ Touch targets ≥44x44px
- ✅ Single column on mobile

---

## 2. Visual Verification Workflow

### 11-Step Mandatory Process

1. **Build feature** with design tokens
2. **Start dev server** (maintained on port 3000)
3. **Authenticate** (test@gmail.com / Test@123 - email/password ONLY)
4. **Navigate** to feature page
5. **Desktop screenshot** (1440px) - analyze, don't save
6. **Analyze desktop** against checklist
7. **Mobile screenshot** (375px) - analyze, don't save
8. **Analyze mobile** against checklist
9. **Refine** if issues found
10. **Document** results in `/ai_docs/progress/phase_N/visual_review.md`
11. **Pass/fail** gate before merge

---

## 3. Puppeteer MCP Workflow

```typescript
// Navigate
await mcp__puppeteer__puppeteer_navigate({
  url: "http://localhost:3000/feature"
})

// Screenshot desktop
await mcp__puppeteer__puppeteer_screenshot({
  name: "feature_desktop",
  width: 1440,
  height: 900
})

// Screenshot mobile
await mcp__puppeteer__puppeteer_screenshot({
  name: "feature_mobile",
  width: 375,
  height: 667
})
```

---

## 4. Visual Quality Checklist

### Layout & Spacing
- [ ] Sections ≥64px padding (mobile) / ≥96px (desktop)
- [ ] Cards ≥24px padding (p-6)
- [ ] Elements ≥16px gaps (gap-4 minimum)

### Typography
- [ ] Clear hierarchy (Display > Section > Card > Body)
- [ ] Body text readable (text-base, line-height 1.5)

### Color & Tokens
- [ ] Ramp palette only
- [ ] No hardcoded colors
- [ ] One lime button per section
- [ ] Semantic tokens used

### Responsive (375px)
- [ ] No horizontal scroll
- [ ] Text ≥16px
- [ ] Touch targets ≥44x44px
- [ ] Single column layout

### Accessibility
- [ ] WCAG AA contrast (4.5:1)
- [ ] Keyboard navigable
- [ ] ARIA labels on icon buttons

---

**Next**: Quality & Security (`07_quality_and_security.md`)
