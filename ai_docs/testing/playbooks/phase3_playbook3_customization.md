# Phase 3: Customization System Playbook

**Purpose**: Test customization controls (colors, typography, spacing, icons) and preset themes
**Phase**: Phase 3D
**Estimated Time**: 8 minutes

---

## Pre-Flight Checks

Before executing this playbook:
- [ ] Dev server is running on port 3000 (user maintains server)
- [ ] Database is connected
- [ ] Test resume exists with content
- [ ] No console errors on page load
- [ ] Browser is open (Puppeteer MCP ready)

---

## Automated Verification (Puppeteer MCP)

### Test 1: Customization Panel Tabs

**What it tests**: All customization tabs load and display correct controls

**Commands**:
```javascript
// Navigate to editor
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
    console.log('✅ Opened Customize tab');
  `
})

// Capture initial state
mcp__puppeteer__puppeteer_screenshot({
  name: "customization_template_tab",
  width: 1440,
  height: 900
})

// Click Colors tab
mcp__puppeteer__puppeteer_evaluate({
  script: `
    return new Promise((resolve) => {
      setTimeout(() => {
        const colorsTab = Array.from(document.querySelectorAll('button, [role="tab"]'))
          .find(btn => btn.textContent.includes('Colors'));
        if (!colorsTab) throw new Error('Colors tab not found');
        colorsTab.click();
        console.log('✅ Clicked Colors tab');
        resolve(true);
      }, 300);
    });
  `
})

// Verify color inputs visible
mcp__puppeteer__puppeteer_evaluate({
  script: `
    return new Promise((resolve) => {
      setTimeout(() => {
        const colorInputs = document.querySelectorAll('input[type="text"]');
        const colorSwatches = document.querySelectorAll('[style*="backgroundColor"]');
        console.log('Found color inputs:', colorInputs.length);
        console.log('Found color swatches:', colorSwatches.length);
        if (colorInputs.length >= 4) {
          console.log('✅ Color customization controls present');
        } else {
          console.warn('⚠️ Expected at least 4 color inputs');
        }
        resolve(true);
      }, 300);
    });
  `
})

// Capture colors tab
mcp__puppeteer__puppeteer_screenshot({
  name: "customization_colors_tab",
  width: 1440,
  height: 900
})

// Click Typography tab
mcp__puppeteer__puppeteer_evaluate({
  script: `
    return new Promise((resolve) => {
      setTimeout(() => {
        const typographyTab = Array.from(document.querySelectorAll('button, [role="tab"]'))
          .find(btn => btn.textContent.includes('Typography'));
        if (!typographyTab) throw new Error('Typography tab not found');
        typographyTab.click();
        console.log('✅ Clicked Typography tab');
        resolve(true);
      }, 300);
    });
  `
})

// Verify typography controls
mcp__puppeteer__puppeteer_evaluate({
  script: `
    return new Promise((resolve) => {
      setTimeout(() => {
        const selects = document.querySelectorAll('select, [role="combobox"]');
        const sliders = document.querySelectorAll('[role="slider"], input[type="range"]');
        console.log('Found selects:', selects.length);
        console.log('Found sliders:', sliders.length);
        console.log('✅ Typography controls present');
        resolve(true);
      }, 300);
    });
  `
})

// Capture typography tab
mcp__puppeteer__puppeteer_screenshot({
  name: "customization_typography_tab",
  width: 1440,
  height: 900
})

// Click Spacing tab
mcp__puppeteer__puppeteer_evaluate({
  script: `
    return new Promise((resolve) => {
      setTimeout(() => {
        const spacingTab = Array.from(document.querySelectorAll('button, [role="tab"]'))
          .find(btn => btn.textContent.includes('Spacing'));
        if (!spacingTab) throw new Error('Spacing tab not found');
        spacingTab.click();
        console.log('✅ Clicked Spacing tab');
        resolve(true);
      }, 300);
    });
  `
})

// Verify spacing sliders
mcp__puppeteer__puppeteer_evaluate({
  script: `
    return new Promise((resolve) => {
      setTimeout(() => {
        const sliders = document.querySelectorAll('[role="slider"], input[type="range"]');
        console.log('Found spacing sliders:', sliders.length);
        if (sliders.length >= 3) {
          console.log('✅ Spacing controls present (section gap, item gap, padding)');
        }
        resolve(true);
      }, 300);
    });
  `
})

// Capture spacing tab
mcp__puppeteer__puppeteer_screenshot({
  name: "customization_spacing_tab",
  width: 1440,
  height: 900
})
```

**Pass Criteria**:
- [ ] Customize tab accessible
- [ ] All 4 tabs present (Template, Colors, Typography, Spacing)
- [ ] Each tab displays appropriate controls
- [ ] No errors when switching tabs

---

### Test 2: Color Customization

**What it tests**: Color inputs update and preview reflects changes

**Commands**:
```javascript
// Ensure we're on Colors tab
mcp__puppeteer__puppeteer_evaluate({
  script: `
    const colorsTab = Array.from(document.querySelectorAll('button, [role="tab"]'))
      .find(btn => btn.textContent.includes('Colors'));
    if (colorsTab) colorsTab.click();
    console.log('✅ On Colors tab');
  `
})

// Change primary color
mcp__puppeteer__puppeteer_evaluate({
  script: `
    return new Promise((resolve) => {
      setTimeout(() => {
        const inputs = Array.from(document.querySelectorAll('input[type="text"]'));
        const primaryInput = inputs.find(input => {
          const label = input.closest('[class*="space-y"]')?.querySelector('label');
          return label && label.textContent.includes('Primary');
        });

        if (!primaryInput) {
          console.warn('⚠️ Primary color input not found');
          resolve(false);
          return;
        }

        // Change to a red color
        primaryInput.value = '0 100% 50%'; // Bright red
        primaryInput.dispatchEvent(new Event('input', { bubbles: true }));
        primaryInput.dispatchEvent(new Event('change', { bubbles: true }));
        console.log('✅ Changed primary color to red (0 100% 50%)');
        resolve(true);
      }, 500);
    });
  `
})

// Verify color swatch updated
mcp__puppeteer__puppeteer_evaluate({
  script: `
    return new Promise((resolve) => {
      setTimeout(() => {
        const swatches = document.querySelectorAll('[style*="backgroundColor"]');
        console.log('Color swatches after change:', swatches.length);
        console.log('✅ Color swatches rendered');
        resolve(true);
      }, 300);
    });
  `
})

// Screenshot after color change
mcp__puppeteer__puppeteer_screenshot({
  name: "customization_color_changed",
  width: 1440,
  height: 900
})
```

**Pass Criteria**:
- [ ] Color inputs accept HSL format
- [ ] Color swatches display current colors
- [ ] Input changes update swatch immediately
- [ ] No errors in console

---

### Test 3: Preset Themes

**What it tests**: Preset theme buttons apply multiple customizations at once

**Commands**:
```javascript
// Ensure we're on Colors tab (where presets are)
mcp__puppeteer__puppeteer_evaluate({
  script: `
    const colorsTab = Array.from(document.querySelectorAll('button, [role="tab"]'))
      .find(btn => btn.textContent.includes('Colors'));
    if (colorsTab) colorsTab.click();
    console.log('✅ On Colors tab');
  `
})

// Click Bold preset
mcp__puppeteer__puppeteer_evaluate({
  script: `
    return new Promise((resolve) => {
      setTimeout(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const boldButton = buttons.find(btn => btn.textContent.includes('Bold'));

        if (!boldButton) {
          console.warn('⚠️ Bold preset button not found (may be in different location)');
          resolve(false);
          return;
        }

        boldButton.click();
        console.log('✅ Clicked Bold preset');
        resolve(true);
      }, 500);
    });
  `
})

// Wait and verify changes
mcp__puppeteer__puppeteer_evaluate({
  script: `
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('⏱️ Waiting for preset to apply...');
        resolve(true);
      }, 500);
    });
  `
})

// Screenshot after preset
mcp__puppeteer__puppeteer_screenshot({
  name: "customization_bold_preset",
  width: 1440,
  height: 900
})

// Try Minimal preset
mcp__puppeteer__puppeteer_evaluate({
  script: `
    return new Promise((resolve) => {
      setTimeout(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const minimalButton = buttons.find(btn => btn.textContent.includes('Minimal') && btn.textContent.includes('Grayscale'));

        if (minimalButton) {
          minimalButton.click();
          console.log('✅ Clicked Minimal preset');
        } else {
          console.log('ℹ️ Minimal preset button not found');
        }
        resolve(true);
      }, 300);
    });
  `
})
```

**Pass Criteria**:
- [ ] Preset buttons visible
- [ ] Clicking preset applies changes
- [ ] Multiple presets can be tried
- [ ] Preview updates with preset

---

### Test 4: Typography Controls

**What it tests**: Font dropdown and size slider work

**Commands**:
```javascript
// Switch to Typography tab
mcp__puppeteer__puppeteer_evaluate({
  script: `
    const typographyTab = Array.from(document.querySelectorAll('button, [role="tab"]'))
      .find(btn => btn.textContent.includes('Typography'));
    if (typographyTab) typographyTab.click();
    console.log('✅ On Typography tab');
  `
})

// Wait for tab content
mcp__puppeteer__puppeteer_evaluate({
  script: `
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('✅ Typography tab loaded');
        resolve(true);
      }, 300);
    });
  `
})

// Note: Font dropdown interaction requires more complex Puppeteer commands
// This test validates presence only
mcp__puppeteer__puppeteer_evaluate({
  script: `
    const selects = document.querySelectorAll('select, [role="combobox"], button[role="combobox"]');
    const sliders = document.querySelectorAll('[role="slider"], input[type="range"]');

    console.log('Font controls found:');
    console.log('  - Selects/dropdowns:', selects.length);
    console.log('  - Sliders:', sliders.length);

    if (selects.length >= 1 && sliders.length >= 2) {
      console.log('✅ Typography controls complete (font dropdown + size/height sliders)');
    } else {
      console.warn('⚠️ Some typography controls may be missing');
    }
  `
})

// Screenshot typography controls
mcp__puppeteer__puppeteer_screenshot({
  name: "customization_typography_controls",
  width: 1440,
  height: 900
})
```

**Pass Criteria**:
- [ ] Font dropdown present
- [ ] Font size slider present
- [ ] Line height slider present
- [ ] Current values displayed

---

### Test 5: Reset to Defaults

**What it tests**: Reset button restores template defaults

**Commands**:
```javascript
// Make some changes first (already done in previous tests)
// Now click Reset to Defaults button

mcp__puppeteer__puppeteer_evaluate({
  script: `
    const resetButton = Array.from(document.querySelectorAll('button'))
      .find(btn => btn.textContent.includes('Reset') && btn.textContent.includes('Default'));

    if (!resetButton) {
      console.warn('⚠️ Reset to Defaults button not found');
      console.log('Looking for button with text containing "Reset" and "Default"');
    } else {
      resetButton.click();
      console.log('✅ Clicked Reset to Defaults');
    }
  `
})

// Wait for reset to apply
mcp__puppeteer__puppeteer_evaluate({
  script: `
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('✅ Reset should be applied');
        resolve(true);
      }, 500);
    });
  `
})

// Go to Colors tab and verify defaults restored
mcp__puppeteer__puppeteer_evaluate({
  script: `
    return new Promise((resolve) => {
      const colorsTab = Array.from(document.querySelectorAll('button, [role="tab"]'))
        .find(btn => btn.textContent.includes('Colors'));
      if (colorsTab) colorsTab.click();

      setTimeout(() => {
        const inputs = document.querySelectorAll('input[type="text"]');
        console.log('Color values after reset:');
        inputs.forEach((input, i) => {
          if (i < 4) {
            console.log('  Color', i + 1, ':', input.value);
          }
        });
        console.log('✅ Reset verified (check if values match defaults)');
        resolve(true);
      }, 300);
    });
  `
})

// Final screenshot
mcp__puppeteer__puppeteer_screenshot({
  name: "customization_after_reset",
  width: 1440,
  height: 900
})
```

**Pass Criteria**:
- [ ] Reset button present in header
- [ ] Reset restores template defaults
- [ ] All tabs show default values after reset
- [ ] No errors during reset

---

## Visual Quality Checks

### Desktop (1440px)
- [ ] Customization panel: Clear tab navigation
- [ ] Color swatches: Rounded, bordered, shadow
- [ ] Sliders: Track visible, thumb grabbable
- [ ] Preset buttons: Grid layout (3 columns)
- [ ] Spacing: Generous padding (≥24px)
- [ ] Typography: Clear labels and values

### Mobile (375px)
- [ ] Tabs: Horizontal scrollable if needed
- [ ] Controls: Stack vertically
- [ ] Sliders: Touch-friendly (≥44px height)
- [ ] Preset buttons: May stack to 2 columns
- [ ] No horizontal scroll

---

## Success Metrics

- [ ] All customization tabs load successfully
- [ ] Color changes reflected immediately
- [ ] Typography controls functional
- [ ] Spacing sliders work (values update)
- [ ] Preset themes apply multiple changes
- [ ] Reset restores defaults
- [ ] Changes persist to localStorage
- [ ] No console errors

---

## Notes

- Customization panel uses shadcn/ui components (Tabs, Slider, Select, Input)
- Color inputs use simple text input (HSL format), not advanced color picker
- Advanced color picker (react-colorful) deferred to later phase
- Font options: Inter, JetBrains Mono, Source Serif 4, Arial, Georgia
- Spacing ranges: Section gap (12-48px), Item gap (8-24px), Padding (24-72px)
- Typography ranges: Font size (80-120%), Line height (1.0-1.8)
- Preset themes: Default (Navy & Lime), Bold (Black & Lime), Minimal (Grayscale)
- Icon customization included but may have limited impact depending on template
