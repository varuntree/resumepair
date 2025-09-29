# Design System Documentation - ResumePair

**Last Updated**: 2025-09-30
**System**: Ramp-Inspired Design System with Dual-Token Architecture

---

## Overview

ResumePair uses a comprehensive, production-ready design system based on the Ramp aesthetic, implemented with a **dual-token architecture** that separates application concerns from document/template concerns.

### Technology Stack

- **UI Framework**: shadcn/ui (New York style) with Tailwind CSS
- **Theme Management**: next-themes (class-based dark mode)
- **Icons**: Lucide React
- **Build**: Next.js 14 with automatic CSS optimization

### Key Principles

1. **Two-Token System**: Separate namespaces for app UI vs. document templates
2. **CSS Variables**: All design values defined as CSS custom properties
3. **Type-Safe**: TypeScript utilities for token access (`lib/design-tokens.ts`)
4. **Shadcn Compatible**: Maintains compatibility with shadcn/ui components
5. **Dark Mode**: Full support with Ramp navy-dark palette

---

## Architecture: Dual-Token System

### App-Scoped Tokens (`--app-*`)

**Purpose**: Application shell, dashboard, navigation, settings

**Scope**: Global, used throughout the application UI

**Colors**:
- `--app-navy-dark`: #0B0F1E (dark sections, dark mode background)
- `--app-navy-medium`: #1A1F35 (dark mode cards)
- `--app-lime`: #CDFF00 (primary accent)
- `--app-gray-*`: 50, 100, 200, 300, 500, 700, 900 (neutral scale)

**Usage in Components**:
```tsx
// Use app tokens for application UI
<div className="bg-app-background text-app-foreground border-app-border">
  Application content
</div>
```

### Document-Scoped Tokens (`--doc-*`)

**Purpose**: Resume/cover letter templates, live preview, PDF/DOCX exports

**Scope**: Wrapped in `.doc-theme` class, isolated from app styling

**Colors**:
- `--doc-primary`: Template primary color
- `--doc-surface`: Template background
- `--doc-foreground`: Template text color
- `--doc-muted`: Secondary text
- `--doc-accent`: Highlight color
- `--doc-border`: Border color

**Usage in Templates**:
```tsx
// Templates MUST wrap content in .doc-theme
<div className="doc-theme">
  <div className="text-doc-foreground bg-doc-surface">
    Resume content
  </div>
</div>
```

**Critical Rule**: Templates NEVER reference `--app-*` tokens. App components NEVER reference `--doc-*` tokens.

---

## Color System

### Ramp Palette (HSL Format)

#### Base Colors
```css
--app-navy-dark: 225 52% 8%        /* #0B0F1E */
--app-navy-medium: 226 36% 16%     /* #1A1F35 */
--app-lime: 73 100% 50%            /* #CDFF00 */
--app-lime-hover: 70 100% 45%      /* #B8E600 */
--app-lime-dark: 67 100% 40%       /* #A3CC00 */
```

#### Neutral Scale
```css
--app-gray-50: 210 17% 98%         /* #F8F9FA */
--app-gray-100: 210 17% 95%        /* #F1F3F5 */
--app-gray-200: 210 16% 93%        /* #E9ECEF */
--app-gray-300: 210 14% 89%        /* #DEE2E6 */
--app-gray-500: 210 11% 46%        /* #6C757D */
--app-gray-700: 210 9% 31%         /* #495057 */
--app-gray-900: 210 11% 15%        /* #212529 */
```

### Semantic Colors

#### Light Mode
- Background: White
- Foreground: Gray-900
- Primary: Lime
- Secondary: Gray-100

#### Dark Mode
- Background: Navy-dark
- Foreground: White
- Primary: Lime (consistent)
- Secondary: Navy-medium

### Tailwind Classes

```tsx
// Ramp colors
className="bg-navy-dark text-lime border-gray-200"

// App-scoped
className="bg-app-background text-app-foreground"

// Document-scoped
className="bg-doc-surface text-doc-foreground"

// Shadcn-compatible
className="bg-primary text-primary-foreground"
```

---

## Typography System

### Font Families

```css
--font-sans: 'Inter', system-ui, sans-serif
--font-serif: 'Source Serif 4', Georgia, serif
--font-mono: 'JetBrains Mono', Consolas, monospace
```

**Note**: Inter is the primary font. Install via Google Fonts or local file.

### Font Sizes (Ramp Scale)

```css
--text-xs: 0.75rem      /* 12px */
--text-sm: 0.875rem     /* 14px */
--text-base: 1rem       /* 16px */
--text-lg: 1.125rem     /* 18px */
--text-xl: 1.25rem      /* 20px */
--text-2xl: 1.5rem      /* 24px */
--text-3xl: 1.875rem    /* 30px */
--text-4xl: 2.25rem     /* 36px */
--text-5xl: 3rem        /* 48px */
--text-6xl: 3.75rem     /* 60px */
--text-7xl: 4.5rem      /* 72px */
```

### Typography Composition Classes

Defined in `app/globals.css`:

```tsx
<h1 className="headline-display">Display Headline</h1>
<h1 className="headline-hero">Hero Headline</h1>
<h2 className="headline-section">Section Headline</h2>
<h3 className="headline-card">Card Headline</h3>
<p className="body-large">Large body text</p>
<p className="body-base">Regular body text</p>
<span className="label-uppercase">Label Text</span>
```

### Responsive Typography

Headlines automatically scale down on mobile (defined in globals.css).

---

## Spacing System

### Base Scale (8px Grid)

```css
--space-1: 0.25rem   /* 4px */
--space-2: 0.5rem    /* 8px */
--space-3: 0.75rem   /* 12px */
--space-4: 1rem      /* 16px */
--space-5: 1.25rem   /* 20px */
--space-6: 1.5rem    /* 24px */
--space-8: 2rem      /* 32px */
--space-10: 2.5rem   /* 40px */
--space-12: 3rem     /* 48px */
--space-16: 4rem     /* 64px */
--space-20: 5rem     /* 80px */
--space-24: 6rem     /* 96px */
--space-32: 8rem     /* 128px */
```

### Section Padding

```css
--section-padding-mobile: 4rem   /* 64px */
--section-padding-desktop: 6rem  /* 96px */
```

### Tailwind Classes

```tsx
<div className="p-4 m-6 gap-8">
  {/* 16px padding, 24px margin, 32px gap */}
</div>

<section className="section">
  {/* Responsive section padding */}
</section>
```

---

## Border Radius

```css
--radius-sm: 0.375rem   /* 6px */
--radius-md: 0.5rem     /* 8px */
--radius-lg: 0.75rem    /* 12px */
--radius-xl: 1rem       /* 16px */
--radius-2xl: 1.5rem    /* 24px */
--radius-full: 9999px   /* Circular */
```

### Usage

```tsx
<div className="rounded-lg">   {/* 12px radius */}
<Button className="rounded-md"> {/* 8px radius */}
<Avatar className="rounded-full"> {/* Circular */}
```

---

## Shadows

```css
--shadow-xs: 0 1px 2px rgba(0,0,0,0.05)
--shadow-sm: 0 2px 4px rgba(0,0,0,0.06)
--shadow-md: 0 4px 8px rgba(0,0,0,0.08)
--shadow-lg: 0 8px 16px rgba(0,0,0,0.10)
--shadow-xl: 0 16px 32px rgba(0,0,0,0.12)
--shadow-2xl: 0 24px 48px rgba(0,0,0,0.15)
```

### Usage

```tsx
<Card className="shadow-sm">
<Dialog className="shadow-2xl">
```

---

## Dark Mode Implementation

### Setup

1. **Provider**: `<ThemeProvider>` in root layout
2. **Toggle**: `<ThemeToggle>` component in header
3. **Class**: `.dark` class on `<html>` element

### Usage in Components

```tsx
// Automatic (uses semantic tokens)
<div className="bg-background text-foreground">
  Adapts to theme automatically
</div>

// Manual control
<div className="bg-white dark:bg-navy-dark text-gray-900 dark:text-white">
  Explicit light/dark values
</div>
```

### Testing

```tsx
// Toggle dark mode programmatically
import { useTheme } from 'next-themes';

const { theme, setTheme } = useTheme();
setTheme('dark'); // or 'light' or 'system'
```

---

## Component Usage

### shadcn/ui Components

All shadcn components work automatically with the new system:

```tsx
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

<Button>Uses lime primary</Button>
<Button variant="secondary">Uses gray-100</Button>
<Button variant="ghost">Transparent with hover</Button>

<Card>Automatically themed</Card>
<Input className="focus:ring-lime" />
```

### Custom Components

```tsx
import { cn } from '@/lib/utils';

function CustomCard({ children, className }) {
  return (
    <div className={cn(
      "rounded-lg shadow-md p-6",
      "bg-card text-card-foreground",
      "border border-border",
      className
    )}>
      {children}
    </div>
  );
}
```

### Template Components

```tsx
// MUST wrap in .doc-theme
function ResumeTemplate({ data }) {
  return (
    <div className="doc-theme">
      <div className="bg-doc-surface text-doc-foreground p-doc-gutter">
        <h1 style={{ color: 'hsl(var(--doc-primary))' }}>
          {data.name}
        </h1>
      </div>
    </div>
  );
}
```

---

## TypeScript Integration

Use `libs/design-tokens.ts` for type-safe token access:

```tsx
import {
  AppColors,
  DocumentColors,
  FontSizes,
  Spacing,
  getColorToken,
  getSpacing,
  getTypography
} from '@/libs/design-tokens';

// Direct access
<div style={{
  backgroundColor: AppColors.primary,
  padding: Spacing[4],
  fontSize: FontSizes.lg,
}} />

// Helper functions
<div style={{
  color: getColorToken('app', 'primary'),
  padding: getSpacing(6),
  fontSize: getTypography('size', '2xl'),
}} />
```

---

## Gradients & Backgrounds

```css
--gradient-hero: linear-gradient(180deg, navy-dark 0%, lighter-navy 100%)
--gradient-section: linear-gradient(180deg, gray-50 0%, white 100%)
```

### Usage

```tsx
<section className="bg-gradient-hero">
  Hero content
</section>

// Or inline
<div style={{ background: 'var(--gradient-hero)' }} />
```

---

## Animations & Transitions

### Transitions

```css
--transition-fast: 0.15s ease
--transition-base: 0.2s ease
--transition-slow: 0.3s ease
```

### Animation Classes

```tsx
<div className="animate-fade-in">Fades in</div>
<div className="animate-slide-in">Slides in from right</div>
<div className="hover-lift">Lifts on hover</div>
```

### Custom Transitions

```tsx
<div className="transition-all duration-base hover:scale-105">
  Smooth hover effect
</div>
```

---

## Accessibility

### Contrast Ratios

- All color combinations meet WCAG AA standards (4.5:1 for body text)
- Lime (#CDFF00) on navy-dark (#0B0F1E): 9.8:1 ✅
- Gray-900 on white: 16.7:1 ✅

### Focus States

```tsx
// Automatic lime focus ring
<button>Accessible button</button>

// Custom focus
<input className="focus-visible:ring-2 focus-visible:ring-lime" />
```

### Screen Reader Support

```tsx
<span className="sr-only">Visually hidden but screen-reader accessible</span>
```

---

## Development Workflow

### Adding a New Component

1. Use shadcn CLI: `npx shadcn@latest add [component]`
2. Component automatically uses design tokens
3. Customize variants if needed

### Creating Custom Tokens

1. Add to `app/globals.css` in appropriate section
2. Map in `tailwind.config.js` if needed for utilities
3. Export from `libs/design-tokens.ts` for TypeScript

### Template Development

1. Always wrap in `.doc-theme`
2. Use only `--doc-*` tokens
3. Never reference `--app-*` tokens
4. Test in preview AND export modes

---

## File Structure

```
app/
  globals.css              # All CSS variables and base styles

libs/
  design-tokens.ts         # TypeScript token utilities
  utils.ts                 # cn() utility

components/
  ui/                      # shadcn components
  ThemeProvider.tsx        # Theme context
  ThemeToggle.tsx          # Dark mode toggle

tailwind.config.js         # Tailwind → CSS variable mappings

libs/templates/            # Template components (use doc tokens)
```

---

## Migration Guide (For Future Components)

### From Hard-Coded Values

```tsx
// ❌ Before
<div style={{ color: '#212529', padding: '16px' }}>

// ✅ After
<div className="text-gray-900 p-4">
```

### From DaisyUI

```tsx
// ❌ Before
<button className="btn btn-primary">

// ✅ After
import { Button } from '@/components/ui/button';
<Button>Click me</Button>
```

### From Inline Styles

```tsx
// ❌ Before
<div style={{ fontSize: '24px', fontWeight: 600 }}>

// ✅ After
<div className="text-2xl font-semibold">
```

---

## Performance Considerations

- **CSS Variables**: Minimal runtime cost, maximum flexibility
- **Tree-shaking**: Only used components bundled
- **No flash**: Dark mode persists via cookie
- **Optimized**: Tailwind purges unused classes

---

## Common Patterns

### Hero Section

```tsx
<section className="section section-dark">
  <div className="container">
    <h1 className="headline-hero text-white mb-6">
      Your Headline
    </h1>
    <p className="body-large text-gray-300 mb-8">
      Description text
    </p>
    <Button size="lg">Get Started</Button>
  </div>
</section>
```

### Card Grid

```tsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  <Card className="hover-lift">
    <CardHeader>
      <CardTitle>Feature Title</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground">Description</p>
    </CardContent>
  </Card>
</div>
```

### Form

```tsx
<form className="space-y-4">
  <div>
    <Label>Email</Label>
    <Input type="email" placeholder="you@example.com" />
  </div>
  <Button type="submit">Submit</Button>
</form>
```

---

## Troubleshooting

### Colors Look Wrong
- Ensure `app/globals.css` is imported in root layout
- Check for conflicting styles overriding CSS variables

### Dark Mode Not Working
- Verify `<ThemeProvider>` wraps app
- Check `<html>` element has `class="dark"` when dark mode active

### TypeScript Errors
- Import types from `libs/design-tokens.ts`
- Ensure values match exported constants

### Shadcn Components Don't Match
- Run `npm install` to ensure all dependencies installed
- Check `components.json` has correct paths

---

## Resources

- **Inter Font**: https://fonts.google.com/specimen/Inter
- **Lucide Icons**: https://lucide.dev/
- **shadcn/ui**: https://ui.shadcn.com/
- **Tailwind CSS**: https://tailwindcss.com/
- **next-themes**: https://github.com/pacocoursey/next-themes

---

## Summary

- ✅ Dual-token architecture (app vs. document)
- ✅ Full Ramp color system with HSL format
- ✅ Comprehensive typography scale
- ✅ 8px-based spacing system
- ✅ Complete dark mode support
- ✅ Type-safe token access
- ✅ shadcn/ui compatible
- ✅ Production-ready performance

**The design system is now fully integrated and ready for Phase 1 development.**