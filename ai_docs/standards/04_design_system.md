# Design System

**Design tokens, colors, typography, and component styling.**

---

## 1. Dual-Token Architecture

**Critical**: Two separate token namespaces.

- **`--app-*`**: Application shell (dashboard, nav, settings)
- **`--doc-*`**: Templates (resume, cover letter)

**Rule**: Never mix namespaces in same component.

---

## 2. Ramp Color Palette (HSL)

```css
/* Navy */
--app-navy-dark: 225 52% 8%        /* #0B0F1E */
--app-navy-medium: 226 36% 16%     /* #1A1F35 */

/* Lime (Primary) */
--app-lime: 73 100% 50%            /* #CDFF00 */

/* Neutral Scale */
--app-gray-50: 210 17% 98%
--app-gray-200: 210 16% 93%
--app-gray-500: 210 11% 46%
--app-gray-900: 210 11% 15%
```

---

## 3. Typography System

```css
/* Font Families */
--font-sans: 'Inter', system-ui
--font-serif: 'Source Serif 4', Georgia
--font-mono: 'JetBrains Mono', Consolas

/* Font Sizes (Ramp Scale) */
--text-xs: 0.75rem      /* 12px */
--text-base: 1rem       /* 16px - Body */
--text-2xl: 1.5rem      /* 24px */
--text-4xl: 2.25rem     /* 36px - Section headers */
--text-6xl: 3.75rem     /* 60px - Hero */
```

---

## 4. Spacing System (8px Grid)

```css
--space-1: 0.25rem   /* 4px */
--space-4: 1rem      /* 16px - Default gap */
--space-6: 1.5rem    /* 24px - Card padding */
--space-8: 2rem      /* 32px */
--space-16: 4rem     /* 64px */
```

---

## 5. Shadows & Border Radius

```css
/* Shadows */
--shadow-sm: 0 2px 4px rgba(0,0,0,0.06)      /* Cards */
--shadow-2xl: 0 24px 48px rgba(0,0,0,0.15)   /* Modals */

/* Border Radius */
--radius-md: 0.5rem     /* 8px - Buttons */
--radius-lg: 0.75rem    /* 12px - Cards */
--radius-full: 9999px   /* Circular */
```

---

## 6. Dark Mode

**Provider**: `<ThemeProvider>` in root layout
**Class**: `.dark` on `<html>` element

```typescript
// Auto-adapts
<div className="bg-background text-foreground">

// Manual
<div className="bg-white dark:bg-navy-dark">
```

---

## Usage

```typescript
// ✅ CORRECT - Design tokens
<div className="p-6 text-base bg-app-background rounded-lg shadow-sm">

// ❌ WRONG - Hardcoded
<div style={{ padding: '24px', fontSize: '16px' }}>
```

---

**Next**: Components (`05_components.md`)
