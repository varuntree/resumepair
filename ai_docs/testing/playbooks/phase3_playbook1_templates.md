# Phase 3: Template System Playbook

**Purpose**: Test template gallery, template switching, and template persistence across editor sessions
**Phase**: Phase 3D
**Estimated Time**: 7 minutes

---

## Pre-Flight Checks

Before executing this playbook:
- [ ] Dev server is running on port 3000 (user maintains server)
- [ ] Database is connected
- [ ] No console errors on page load
- [ ] Browser is open (Puppeteer MCP ready)

---

## Automated Verification (Puppeteer MCP)

### Test 1: Template Gallery Page

**What it tests**: Template gallery loads, displays all 6 templates, and navigation works

**Commands**:
```javascript
// Navigate to templates page
mcp__puppeteer__puppeteer_navigate({
  url: "http://localhost:3000/templates"
})

// Capture desktop screenshot
mcp__puppeteer__puppeteer_screenshot({
  name: "template_gallery_desktop",
  width: 1440,
  height: 900
})

// Verify all 6 templates displayed
mcp__puppeteer__puppeteer_evaluate({
  script: `
    const templates = document.querySelectorAll('[class*="TemplateCard"]');
    console.log('Found templates:', templates.length);
    if (templates.length !== 6) {
      throw new Error('Expected 6 templates, found ' + templates.length);
    }
    console.log('✅ All 6 templates displayed');
  `
})

// Verify ATS scores visible
mcp__puppeteer__puppeteer_evaluate({
  script: `
    const scores = Array.from(document.querySelectorAll('[class*="badge"]'))
      .filter(el => el.textContent.includes('/100'));
    console.log('Found ATS scores:', scores.length);
    if (scores.length < 6) {
      throw new Error('Expected 6 ATS scores, found ' + scores.length);
    }
    console.log('✅ ATS scores visible on all templates');
  `
})
```

**Pass Criteria**:
- [ ] Templates page loads successfully
- [ ] All 6 templates displayed (Minimal, Modern, Classic, Creative, Technical, Executive)
- [ ] ATS scores visible on each template card
- [ ] "Use Template" buttons present

---

### Test 2: Template Switching in Editor

**What it tests**: Template selection changes preview and persists across tab switches

**Commands**:
```javascript
// Navigate to editor (assuming test resume exists or create new)
mcp__puppeteer__puppeteer_navigate({
  url: "http://localhost:3000/editor/new"
})

// Click Customize tab
mcp__puppeteer__puppeteer_evaluate({
  script: `
    const customizeTab = Array.from(document.querySelectorAll('button'))
      .find(btn => btn.textContent.includes('Customize'));
    if (!customizeTab) throw new Error('Customize tab not found');
    customizeTab.click();
    console.log('✅ Clicked Customize tab');
  `
})

// Wait for customization panel to load
mcp__puppeteer__puppeteer_evaluate({
  script: `
    return new Promise((resolve) => {
      setTimeout(() => {
        const panel = document.querySelector('[class*="CustomizationPanel"]');
        if (!panel) throw new Error('Customization panel not found');
        console.log('✅ Customization panel loaded');
        resolve(true);
      }, 500);
    });
  `
})

// Screenshot customization panel
mcp__puppeteer__puppeteer_screenshot({
  name: "customization_panel_template_tab",
  width: 1440,
  height: 900
})

// Select Modern template
mcp__puppeteer__puppeteer_evaluate({
  script: `
    const modernTemplate = Array.from(document.querySelectorAll('[class*="Card"]'))
      .find(card => card.textContent.includes('Modern'));
    if (!modernTemplate) throw new Error('Modern template card not found');
    modernTemplate.click();
    console.log('✅ Selected Modern template');
  `
})

// Switch to Preview tab to verify template change
mcp__puppeteer__puppeteer_evaluate({
  script: `
    return new Promise((resolve) => {
      setTimeout(() => {
        const previewTab = Array.from(document.querySelectorAll('button'))
          .find(btn => btn.textContent.includes('Preview'));
        if (!previewTab) throw new Error('Preview tab not found');
        previewTab.click();
        console.log('✅ Switched to Preview tab');
        resolve(true);
      }, 300);
    });
  `
})

// Verify template changed
mcp__puppeteer__puppeteer_screenshot({
  name: "modern_template_preview",
  width: 1440,
  height: 900
})
```

**Pass Criteria**:
- [ ] Customize tab accessible
- [ ] Template selector shows all 6 templates
- [ ] Clicking template updates selection (checkmark visible)
- [ ] Preview tab shows template change

---

### Test 3: Data Preservation Across Template Switch

**What it tests**: Resume data is preserved when switching templates

**Commands**:
```javascript
// Navigate back to Edit tab and add some data
mcp__puppeteer__puppeteer_evaluate({
  script: `
    return new Promise((resolve) => {
      const editTab = Array.from(document.querySelectorAll('button'))
        .find(btn => btn.textContent.includes('Edit'));
      if (!editTab) throw new Error('Edit tab not found');
      editTab.click();
      setTimeout(() => {
        console.log('✅ Back on Edit tab');
        resolve(true);
      }, 300);
    });
  `
})

// Fill in name field
mcp__puppeteer__puppeteer_fill({
  selector: 'input[name="profile.fullName"], input[placeholder*="Full Name"]',
  value: "Test User"
})

// Switch to Creative template via Customize tab
mcp__puppeteer__puppeteer_evaluate({
  script: `
    return new Promise((resolve) => {
      const customizeTab = Array.from(document.querySelectorAll('button'))
        .find(btn => btn.textContent.includes('Customize'));
      customizeTab.click();
      setTimeout(() => {
        const creativeTemplate = Array.from(document.querySelectorAll('[class*="Card"]'))
          .find(card => card.textContent.includes('Creative'));
        if (!creativeTemplate) throw new Error('Creative template not found');
        creativeTemplate.click();
        console.log('✅ Switched to Creative template');
        resolve(true);
      }, 500);
    });
  `
})

// Go back to Edit tab and verify data still present
mcp__puppeteer__puppeteer_evaluate({
  script: `
    return new Promise((resolve) => {
      setTimeout(() => {
        const editTab = Array.from(document.querySelectorAll('button'))
          .find(btn => btn.textContent.includes('Edit'));
        editTab.click();
        setTimeout(() => {
          const nameInput = document.querySelector('input[name="profile.fullName"], input[placeholder*="Full Name"]');
          if (!nameInput) throw new Error('Name input not found');
          if (nameInput.value !== 'Test User') {
            throw new Error('Data lost during template switch! Expected "Test User", got "' + nameInput.value + '"');
          }
          console.log('✅ Data preserved across template switch');
          resolve(true);
        }, 300);
      }, 300);
    });
  `
})
```

**Pass Criteria**:
- [ ] Data entered in Edit tab
- [ ] Template switch successful
- [ ] Data remains intact after template switch
- [ ] No console errors during switching

---

## Visual Quality Checks

### Desktop (1440px)
- [ ] Template gallery: Cards in 3-column grid
- [ ] Template gallery: Spacing generous (≥16px gaps)
- [ ] Customization panel: Template selector grid readable
- [ ] Customization panel: Checkmark visible on selected template
- [ ] Customization panel: Lime accent color on selected card

### Mobile (375px)
- [ ] Template gallery: Single column layout
- [ ] No horizontal scroll
- [ ] Touch targets ≥44px
- [ ] Template cards fill width

---

## Success Metrics

- [ ] All 6 templates load without errors
- [ ] Template switching <200ms (observe responsiveness)
- [ ] Data preserved across template switches
- [ ] No console errors or warnings
- [ ] Screenshots captured successfully

---

## Notes

- Template thumbnails are placeholders (gray boxes with template name)
- ATS scores range from 82 (Creative) to 95 (Minimal)
- Default template is Minimal on first load
- Template selection persists to localStorage
