# ResumePair Phase 3: Customization System Research Dossier

**Project**: ResumePair Template Customization System
**Phase**: 3 of 8 (Template System & Live Preview)
**Research Date**: 2025-10-01
**Researcher**: SYSTEMS-RESEARCHER Agent
**Word Count**: ~11,500

---

## Executive Summary

### Top 3 Recommendations

1. **Use HSL Color Format with CSS Variables**
   - HSL provides intuitive manipulation of lightness/saturation
   - Maps directly to existing `--doc-*` token system in globals.css
   - Enables WCAG contrast calculation with luminance conversion
   - Already established in codebase (lines 22-31, globals.css)

2. **React-Colorful for Color Picker**
   - 2.8KB gzipped (13x lighter than alternatives)
   - Native HSL support via `HslColorPicker` component
   - TypeScript-first with 100% test coverage
   - Zero dependencies beyond React

3. **Zustand Persist with localStorage + Migration Strategy**
   - Leverage existing Zustand + zundo setup
   - Use persist middleware with partialize for customizations
   - LocalStorage sufficient for customization state (<5KB typical)
   - IndexedDB unnecessary given small data size

### Critical UX Patterns

- **Immediate Visual Feedback**: Update CSS variables synchronously in useEffect
- **Preset Theme Grid**: 10+ preset buttons with live preview swatches
- **Debounced Persistence**: Save to localStorage at 500ms, API at 2000ms
- **Undo-Friendly**: Wrap customization changes in temporal() batches
- **Font Fallback Metrics**: Use next/font with size-adjust descriptors

### Key Technical Challenges

1. **CSS Variable Scope Isolation**: Maintain strict `--app-*` vs `--doc-*` separation
2. **Color Contrast Validation**: Ensure WCAG AA compliance (4.5:1 ratio)
3. **Font Loading Performance**: Prevent FOUT/FOIT with font-display: optional
4. **Undo/Redo Granularity**: Group rapid customization changes into single undo steps
5. **State Hydration Race Conditions**: Handle async font loading without blocking render

---

## 1. Color Scheme Management

### Recommended Format: HSL (Hue, Saturation, Lightness)

**Rationale**:
- HSL enables intuitive color manipulation (adjust lightness without changing hue)
- Maps directly to ResumePair's existing token system (see globals.css:22-31)
- Better for programmatic adjustments (e.g., hover states, disabled states)
- WCAG contrast calculation requires luminance conversion regardless of input format

**Existing Implementation** [internal:/Users/varunprasad/code/prjs/resumepair/app/globals.css#L22-L31]:
```css
/* App Color System - Ramp Palette */
--app-navy-dark: 225 52% 8%;           /* #0B0F1E */
--app-navy-medium: 226 36% 16%;        /* #1A1F35 */
--app-black: 0 0% 0%;                  /* #000000 */
--app-white: 0 0% 100%;                /* #FFFFFF */

/* App Accent Colors */
--app-lime: 73 100% 50%;               /* #CDFF00 */
--app-lime-hover: 70 100% 45%;         /* #B8E600 */
--app-lime-dark: 67 100% 40%;          /* #A3CC00 */
```

**Pattern**: Store HSL values as space-separated triplets (no commas), wrap in `hsl()` when used:
```typescript
// Store as: "225 52% 8%"
// Use as: hsl(var(--doc-primary))
```

### CSS Variable Update Pattern

**Dynamic Injection Hook**:
```typescript
// hooks/useDocumentTheme.ts
import { useEffect } from 'react';

interface ThemeColors {
  primary: string;      // "225 52% 8%"
  secondary: string;
  accent: string;
  text: string;
  background: string;
  muted: string;
  border: string;
}

export function useDocumentTheme(colors: ThemeColors) {
  useEffect(() => {
    const root = document.documentElement;

    // Update --doc-* tokens
    root.style.setProperty('--doc-primary', colors.primary);
    root.style.setProperty('--doc-secondary', colors.secondary);
    root.style.setProperty('--doc-accent', colors.accent);
    root.style.setProperty('--doc-foreground', colors.text);
    root.style.setProperty('--doc-surface', colors.background);
    root.style.setProperty('--doc-muted', colors.muted);
    root.style.setProperty('--doc-border', colors.border);

    // Cleanup not needed - variables persist until next update
  }, [colors]);
}
```

**Scoping Strategy** [internal:/Users/varunprasad/code/prjs/resumepair/app/globals.css#L263-L284]:
```css
/* Document-scoped tokens (Templates) */
.doc-theme {
  /* Document Colors (Default - customizable per template) */
  --doc-primary: var(--app-navy-dark);
  --doc-surface: var(--app-white);
  --doc-foreground: var(--app-gray-900);
  --doc-muted: var(--app-gray-500);
  --doc-accent: var(--app-lime);
  --doc-border: var(--app-gray-200);

  /* Document Typography */
  --doc-font-family: var(--font-sans);
  --doc-font-size-scale: 1;              /* Multiplier for sizing */
  --doc-line-spacing: var(--leading-normal);

  /* Document Layout */
  --doc-gutter: var(--space-8);          /* Page margins */
  --doc-section-gap: var(--space-6);     /* Section spacing */

  /* Document Icons */
  --doc-icon-size: 16px;
  --doc-icon-color: currentColor;
}
```

**Performance Considerations**:
- CSS variable updates are synchronous (no reflow if only color changes)
- Browsers optimize `setProperty()` calls on same element
- Use `will-change: background-color, color` on frequently updated elements
- Avoid updating variables in render loops (use useEffect)

### Color Picker Integration

**Library: react-colorful** [gh:omgovich/react-colorful@4.5.0]

**Installation**:
```bash
npm install react-colorful
```

**Implementation**:
```typescript
// components/customization/ColorPicker.tsx
import { HslColorPicker } from 'react-colorful';
import { useState } from 'react';

interface HslColor {
  h: number;  // 0-360
  s: number;  // 0-100
  l: number;  // 0-100
}

export function ColorPicker({
  value,
  onChange,
  label
}: {
  value: string;  // "225 52% 8%"
  onChange: (value: string) => void;
  label: string;
}) {
  // Convert HSL string to object
  const parseHsl = (hsl: string): HslColor => {
    const [h, s, l] = hsl.split(' ').map(v => parseFloat(v));
    return { h, s, l };
  };

  // Convert object to HSL string
  const formatHsl = (color: HslColor): string => {
    return `${Math.round(color.h)} ${Math.round(color.s)}% ${Math.round(color.l)}%`;
  };

  const [color, setColor] = useState<HslColor>(parseHsl(value));

  const handleChange = (newColor: HslColor) => {
    setColor(newColor);
    onChange(formatHsl(newColor));
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <HslColorPicker color={color} onChange={handleChange} />
      <div
        className="h-10 rounded border-2"
        style={{ backgroundColor: `hsl(${value})` }}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => {
          const newValue = e.target.value;
          onChange(newValue);
          try {
            setColor(parseHsl(newValue));
          } catch {}
        }}
        className="w-full px-2 py-1 text-sm border rounded"
        placeholder="225 52% 8%"
      />
    </div>
  );
}
```

**Styling Override** (optional):
```css
/* globals.css - Customize react-colorful */
.react-colorful {
  width: 100%;
  height: 180px;
  border-radius: var(--radius-md);
}

.react-colorful__saturation {
  border-radius: var(--radius-sm) var(--radius-sm) 0 0;
}

.react-colorful__hue,
.react-colorful__alpha {
  height: 12px;
  border-radius: var(--radius-sm);
}

.react-colorful__pointer {
  width: 18px;
  height: 18px;
  border: 2px solid hsl(var(--app-white));
  box-shadow: var(--shadow-md);
}
```

### Preset Theme Structure

**Theme Object Interface**:
```typescript
// types/theme.ts
export interface ColorPreset {
  id: string;
  name: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    background: string;
    muted: string;
    border: string;
  };
  preview?: string; // URL to preview image
}

// Preset collection
export const COLOR_PRESETS: ColorPreset[] = [
  {
    id: 'default',
    name: 'Default',
    description: 'Navy and lime professional theme',
    colors: {
      primary: '225 52% 8%',      // Navy dark
      secondary: '226 36% 16%',   // Navy medium
      accent: '73 100% 50%',      // Lime
      text: '210 11% 15%',        // Gray 900
      background: '0 0% 100%',    // White
      muted: '210 11% 46%',       // Gray 500
      border: '210 16% 93%',      // Gray 200
    }
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Navy and gold for executives',
    colors: {
      primary: '225 52% 8%',      // Navy
      secondary: '226 36% 16%',   // Navy medium
      accent: '45 90% 50%',       // Gold
      text: '210 11% 15%',
      background: '0 0% 100%',
      muted: '210 11% 46%',
      border: '210 16% 93%',
    }
  },
  {
    id: 'creative',
    name: 'Creative',
    description: 'Purple and orange for designers',
    colors: {
      primary: '280 60% 30%',     // Purple
      secondary: '280 50% 50%',   // Light purple
      accent: '25 95% 55%',       // Orange
      text: '210 11% 15%',
      background: '0 0% 100%',
      muted: '210 11% 46%',
      border: '210 16% 93%',
    }
  },
  // ... 7 more presets
];
```

**Preset Selector Component**:
```typescript
// components/customization/PresetThemes.tsx
import { COLOR_PRESETS, type ColorPreset } from '@/types/theme';

export function PresetThemes({
  onSelect
}: {
  onSelect: (preset: ColorPreset) => void
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold">Color Presets</h3>
      <div className="grid grid-cols-2 gap-3">
        {COLOR_PRESETS.map((preset) => (
          <button
            key={preset.id}
            onClick={() => onSelect(preset)}
            className="p-3 border rounded-lg hover:border-primary transition-colors text-left"
          >
            <div className="flex gap-2 mb-2">
              {/* Color swatches */}
              <div
                className="w-6 h-6 rounded"
                style={{ backgroundColor: `hsl(${preset.colors.primary})` }}
              />
              <div
                className="w-6 h-6 rounded"
                style={{ backgroundColor: `hsl(${preset.colors.accent})` }}
              />
            </div>
            <div className="text-sm font-medium">{preset.name}</div>
            <div className="text-xs text-muted-foreground">
              {preset.description}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
```

### WCAG Color Contrast Calculation

**Algorithm** [web:https://www.w3.org/TR/WCAG20-TECHS/G18.html | retrieved 2025-10-01]:

1. Convert HSL → RGB → Relative Luminance
2. Calculate contrast ratio: (L1 + 0.05) / (L2 + 0.05)
3. Validate against WCAG AA: 4.5:1 for normal text, 3:1 for large text

**Implementation** [gh:trajano/hsl-wcag-contrast-ts@gist]:
```typescript
// libs/color-contrast.ts

/**
 * Convert HSL string to RGB values (0-255)
 */
function hslToRgb(hsl: string): { r: number; g: number; b: number } {
  const [h, s, l] = hsl.split(' ').map(v => parseFloat(v));
  const hNorm = h / 360;
  const sNorm = s / 100;
  const lNorm = l / 100;

  let r, g, b;

  if (sNorm === 0) {
    r = g = b = lNorm; // achromatic
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    const q = lNorm < 0.5
      ? lNorm * (1 + sNorm)
      : lNorm + sNorm - lNorm * sNorm;
    const p = 2 * lNorm - q;

    r = hue2rgb(p, q, hNorm + 1/3);
    g = hue2rgb(p, q, hNorm);
    b = hue2rgb(p, q, hNorm - 1/3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
}

/**
 * Calculate relative luminance (WCAG formula)
 */
function getLuminance(rgb: { r: number; g: number; b: number }): number {
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(val => {
    const sRGB = val / 255;
    return sRGB <= 0.03928
      ? sRGB / 12.92
      : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Calculate contrast ratio between two HSL colors
 * @returns Contrast ratio (1-21)
 */
export function getContrastRatio(hsl1: string, hsl2: string): number {
  const rgb1 = hslToRgb(hsl1);
  const rgb2 = hslToRgb(hsl2);

  const lum1 = getLuminance(rgb1);
  const lum2 = getLuminance(rgb2);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if color combination meets WCAG AA standard
 */
export function meetsWCAG_AA(
  foreground: string,
  background: string,
  large: boolean = false
): { passes: boolean; ratio: number; required: number } {
  const ratio = getContrastRatio(foreground, background);
  const required = large ? 3.0 : 4.5;

  return {
    passes: ratio >= required,
    ratio: Math.round(ratio * 100) / 100,
    required
  };
}

/**
 * Usage in ColorPicker component
 */
export function ColorContrastChecker({
  foreground,
  background
}: {
  foreground: string;
  background: string;
}) {
  const result = meetsWCAG_AA(foreground, background);

  return (
    <div className="flex items-center gap-2 text-xs">
      {result.passes ? (
        <>
          <CheckCircle className="w-4 h-4 text-green-600" />
          <span>Contrast: {result.ratio}:1 (WCAG AA ✓)</span>
        </>
      ) : (
        <>
          <AlertCircle className="w-4 h-4 text-amber-600" />
          <span>Contrast: {result.ratio}:1 (need {result.required}:1)</span>
        </>
      )}
    </div>
  );
}
```

**Integration with Color Picker**:
```typescript
// Show live contrast validation while user picks colors
<ColorPicker
  value={customizations.colors.primary}
  onChange={(value) => updateColor('primary', value)}
  label="Primary Color"
/>
<ColorContrastChecker
  foreground={customizations.colors.primary}
  background={customizations.colors.background}
/>
```

---

## 2. Font Loading Strategy

### Next.js Font Optimization

**Pattern**: Use `next/font` with font-display: optional [web:https://nextjs.org/docs/app/api-reference/components/font | retrieved 2025-10-01]

**Why font-display: optional**:
- Eliminates FOUT (Flash of Unstyled Text) entirely
- No layout shift from font swapping
- Browser shows fallback if font not loaded within 100ms
- Best for Core Web Vitals (Cumulative Layout Shift = 0)

**Implementation** [internal:/Users/varunprasad/code/prjs/resumepair/app/layout.tsx]:
```typescript
// app/fonts.ts
import { Inter, Source_Serif_4, JetBrains_Mono } from 'next/font/google';
import localFont from 'next/font/local';

// Sans-serif fonts
export const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'optional',  // Prevent FOUT/FOIT
  preload: true,
  fallback: [
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'Helvetica Neue',
    'Arial',
    'sans-serif'
  ],
  adjustFontFallback: 'Arial',  // Metric override for fallback
});

export const sourceSans3 = localFont({
  src: [
    { path: '../public/fonts/SourceSans3-Regular.woff2', weight: '400', style: 'normal' },
    { path: '../public/fonts/SourceSans3-SemiBold.woff2', weight: '600', style: 'normal' },
    { path: '../public/fonts/SourceSans3-Bold.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-source-sans',
  display: 'optional',
  preload: true,
  fallback: ['Arial', 'sans-serif'],
  adjustFontFallback: 'Arial',
});

// Serif fonts
export const sourceSerif4 = Source_Serif_4({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'optional',
  preload: true,
  fallback: ['Georgia', 'serif'],
  adjustFontFallback: 'Georgia',
});

// Monospace fonts
export const jetBrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'optional',
  preload: true,
  fallback: ['Consolas', 'Monaco', 'monospace'],
  adjustFontFallback: 'Courier New',
});

// Font registry for customization panel
export const AVAILABLE_FONTS = [
  { id: 'inter', name: 'Inter', variable: '--font-sans', family: inter.style.fontFamily },
  { id: 'source-sans-3', name: 'Source Sans 3', variable: '--font-source-sans', family: sourceSans3.style.fontFamily },
  { id: 'roboto', name: 'Roboto', variable: '--font-roboto', family: 'Roboto, sans-serif' },
  { id: 'open-sans', name: 'Open Sans', variable: '--font-open-sans', family: 'Open Sans, sans-serif' },
  { id: 'source-serif-4', name: 'Source Serif 4', variable: '--font-serif', family: sourceSerif4.style.fontFamily },
  { id: 'merriweather', name: 'Merriweather', variable: '--font-merriweather', family: 'Merriweather, serif' },
  { id: 'jetbrains-mono', name: 'JetBrains Mono', variable: '--font-mono', family: jetBrainsMono.style.fontFamily },
  { id: 'courier-new', name: 'Courier New', variable: '--font-courier', family: 'Courier New, monospace' },
] as const;
```

**Root Layout** [internal:/Users/varunprasad/code/prjs/resumepair/app/layout.tsx]:
```typescript
// app/layout.tsx
import { inter, sourceSerif4, jetBrainsMono } from './fonts';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${sourceSerif4.variable} ${jetBrainsMono.variable}`}
    >
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
```

### Fallback Font Metrics Override

**Problem**: Even with font-display: optional, fallback font has different metrics (x-height, cap-height, line-height), causing slight layout shift when web font loads.

**Solution**: Use `adjustFontFallback` (Next.js automatic) or manual CSS overrides [web:https://developer.chrome.com/blog/font-fallbacks | retrieved 2025-10-01]:

```css
/* Manual fallback font adjustment (if not using next/font) */
@font-face {
  font-family: 'Inter Fallback';
  src: local('Arial');
  ascent-override: 90.20%;
  descent-override: 22.48%;
  line-gap-override: 0.00%;
  size-adjust: 107.40%;
}

.doc-theme {
  font-family: 'Inter', 'Inter Fallback', -apple-system, sans-serif;
}
```

**Next.js automatic calculation**:
```typescript
// next/font automatically calculates these values
export const inter = Inter({
  adjustFontFallback: 'Arial',  // Calculates overrides for Arial
});

// Generated CSS includes:
// @font-face {
//   font-family: '__Inter_Fallback_abc123';
//   src: local('Arial');
//   ascent-override: 90.2%;
//   ...
// }
```

### Font Selector Component

```typescript
// components/customization/FontSelector.tsx
import { AVAILABLE_FONTS } from '@/app/fonts';
import { Check } from 'lucide-react';

export function FontSelector({
  value,
  onChange
}: {
  value: string;  // Font ID: "inter", "source-serif-4", etc.
  onChange: (fontId: string) => void;
}) {
  const selectedFont = AVAILABLE_FONTS.find(f => f.id === value);

  return (
    <div className="space-y-3">
      <label className="text-sm font-semibold">Font Family</label>

      {/* Dropdown with preview */}
      <div className="space-y-2">
        {AVAILABLE_FONTS.map((font) => (
          <button
            key={font.id}
            onClick={() => onChange(font.id)}
            className={`
              w-full p-3 border rounded-lg text-left transition-colors
              ${value === font.id ? 'border-primary bg-primary/5' : 'hover:border-gray-300'}
            `}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">{font.name}</div>
                <div
                  className="text-base mt-1"
                  style={{ fontFamily: font.family }}
                >
                  The quick brown fox jumps over the lazy dog
                </div>
              </div>
              {value === font.id && (
                <Check className="w-5 h-5 text-primary" />
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Live preview in context */}
      <div className="p-4 border rounded-lg bg-gray-50">
        <p className="text-xs text-muted-foreground mb-2">Preview</p>
        <div
          className="space-y-1"
          style={{ fontFamily: selectedFont?.family }}
        >
          <div className="text-xl font-bold">John Doe</div>
          <div className="text-sm">Senior Software Engineer</div>
          <div className="text-sm">Led development of scalable microservices...</div>
        </div>
      </div>
    </div>
  );
}
```

### Performance Optimization

**Font Subsetting** (automatic with next/font for Google Fonts):
```typescript
// Automatic subsetting to latin characters only
export const inter = Inter({
  subsets: ['latin'],  // ~40KB instead of 300KB+ for all subsets
  preload: true,       // Add <link rel="preload"> to <head>
});
```

**Preload Critical Fonts**:
```typescript
// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        {/* Automatically added by next/font when preload: true */}
        {/* <link rel="preload" href="/_next/static/media/inter.woff2" as="font" type="font/woff2" crossOrigin="anonymous" /> */}
      </head>
      <body>{children}</body>
    </html>
  );
}
```

**Lazy Load Non-Critical Fonts**:
```typescript
// Only load serif/mono fonts when user selects them
const [fontLoaded, setFontLoaded] = useState(false);

useEffect(() => {
  if (customizations.typography.fontFamily === 'source-serif-4' && !fontLoaded) {
    // Dynamically import font
    import('@/app/fonts').then(() => setFontLoaded(true));
  }
}, [customizations.typography.fontFamily]);
```

---

## 3. Dynamic CSS Variable Injection

### React Hook Pattern

**Implementation**:
```typescript
// hooks/useDynamicTheme.ts
import { useEffect } from 'react';
import type { Customizations } from '@/types/customizations';

export function useDynamicTheme(customizations: Customizations) {
  useEffect(() => {
    const root = document.documentElement;

    // Colors (HSL format)
    root.style.setProperty('--doc-primary', customizations.colors.primary);
    root.style.setProperty('--doc-secondary', customizations.colors.secondary);
    root.style.setProperty('--doc-accent', customizations.colors.accent);
    root.style.setProperty('--doc-foreground', customizations.colors.text);
    root.style.setProperty('--doc-surface', customizations.colors.background);
    root.style.setProperty('--doc-muted', customizations.colors.muted);
    root.style.setProperty('--doc-border', customizations.colors.border);

    // Typography
    root.style.setProperty('--doc-font-family', customizations.typography.fontFamily);
    root.style.setProperty('--doc-font-size-scale', customizations.typography.fontSize.toString());
    root.style.setProperty('--doc-line-spacing', customizations.typography.lineHeight.toString());

    // Spacing (px values)
    root.style.setProperty('--doc-section-gap', `${customizations.spacing.sectionGap}px`);
    root.style.setProperty('--doc-item-gap', `${customizations.spacing.itemGap}px`);
    root.style.setProperty('--doc-gutter', `${customizations.spacing.pagePadding}px`);

    // Icons
    root.style.setProperty('--doc-icon-size', `${customizations.icons.size}px`);
    root.style.setProperty('--doc-icon-color', customizations.icons.enabled ? 'currentColor' : 'transparent');

    // No cleanup needed - variables persist until next update
  }, [customizations]);
}
```

**Usage in Preview Component**:
```typescript
// components/preview/LivePreview.tsx
import { useDynamicTheme } from '@/hooks/useDynamicTheme';
import { useTemplateStore } from '@/stores/templateStore';

export function LivePreview() {
  const customizations = useTemplateStore(state => state.customizations);

  // Apply theme to document root
  useDynamicTheme(customizations);

  return (
    <div className="doc-theme">
      {/* Template renders here with CSS variables applied */}
    </div>
  );
}
```

### Scoping Strategy

**Two-Tier Token System** [internal:/Users/varunprasad/code/prjs/resumepair/app/globals.css#L16-L54]:

1. **App-scoped tokens** (`--app-*`): Application UI, dashboard, navigation
2. **Document-scoped tokens** (`--doc-*`): Resume/cover letter templates

**Isolation Pattern**:
```css
/* App UI uses --app-* tokens */
.dashboard-header {
  background-color: hsl(var(--app-navy-dark));
  color: hsl(var(--app-white));
}

/* Templates use --doc-* tokens (inside .doc-theme wrapper) */
.doc-theme .resume-header {
  background-color: hsl(var(--doc-primary));
  color: hsl(var(--doc-foreground));
}
```

**Benefit**: Templates never accidentally inherit app UI styles; customizations only affect `.doc-theme` descendants.

### Performance Optimization

**Batched Updates**:
```typescript
// Update multiple CSS variables in a single useEffect
useEffect(() => {
  const updates = [
    ['--doc-primary', customizations.colors.primary],
    ['--doc-accent', customizations.colors.accent],
    ['--doc-section-gap', `${customizations.spacing.sectionGap}px`],
  ];

  const root = document.documentElement;

  // Browser batches these updates into a single style recalculation
  updates.forEach(([property, value]) => {
    root.style.setProperty(property, value);
  });
}, [customizations]);
```

**Avoid Excessive Calls**:
```typescript
// BAD: Calling setProperty on every render
function BadComponent() {
  document.documentElement.style.setProperty('--doc-primary', color); // ❌
  return <div>...</div>;
}

// GOOD: Using useEffect with dependencies
function GoodComponent() {
  useEffect(() => {
    document.documentElement.style.setProperty('--doc-primary', color); // ✅
  }, [color]);
  return <div>...</div>;
}
```

**GPU Acceleration** (for frequently animated properties):
```css
/* Hint to browser that these properties will change */
.preview-container {
  will-change: background-color, color;
}

/* Or use transform/opacity for 60fps animations */
.fade-transition {
  transition: opacity 200ms ease;
  will-change: opacity;
}
```

---

## 4. State Persistence

### Zustand Persist Middleware

**Pattern**: Use persist middleware with localStorage [web:https://zustand.docs.pmnd.rs/integrations/persisting-store-data | retrieved 2025-10-01]

**Why localStorage over IndexedDB**:
- Customizations are small (<5KB typical, <50KB worst case)
- Synchronous access (no hydration delay)
- Simpler error handling
- Already used in ResumePair for other state

**Implementation**:
```typescript
// stores/customizationStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { temporal } from 'zundo';
import type { Customizations } from '@/types/customizations';

interface CustomizationState {
  // State
  customizations: Record<string, Customizations>; // Keyed by template ID
  currentTemplate: string;

  // Actions
  updateCustomization: (templateId: string, updates: Partial<Customizations>) => void;
  resetCustomizations: (templateId: string) => void;
  clearAll: () => void;

  // Computed
  current: () => Customizations | null;
}

const DEFAULT_CUSTOMIZATIONS: Customizations = {
  colors: {
    primary: '225 52% 8%',
    secondary: '226 36% 16%',
    accent: '73 100% 50%',
    text: '210 11% 15%',
    background: '0 0% 100%',
    muted: '210 11% 46%',
    border: '210 16% 93%',
  },
  typography: {
    fontFamily: 'var(--font-sans)',
    fontSize: 1.0,
    lineHeight: 1.5,
  },
  spacing: {
    sectionGap: 24,
    itemGap: 12,
    pagePadding: 48,
  },
  icons: {
    enabled: true,
    style: 'outline',
    size: 16,
  },
  layout: {
    columns: 1,
    headerAlignment: 'left',
  },
};

export const useCustomizationStore = create<CustomizationState>()(
  persist(
    temporal(
      (set, get) => ({
        customizations: {},
        currentTemplate: 'minimal',

        updateCustomization: (templateId, updates) => {
          set((state) => {
            const existing = state.customizations[templateId] || DEFAULT_CUSTOMIZATIONS;
            return {
              customizations: {
                ...state.customizations,
                [templateId]: {
                  ...existing,
                  ...updates,
                  // Deep merge nested objects
                  colors: { ...existing.colors, ...updates.colors },
                  typography: { ...existing.typography, ...updates.typography },
                  spacing: { ...existing.spacing, ...updates.spacing },
                  icons: { ...existing.icons, ...updates.icons },
                  layout: { ...existing.layout, ...updates.layout },
                },
              },
            };
          });
        },

        resetCustomizations: (templateId) => {
          set((state) => {
            const { [templateId]: _, ...rest } = state.customizations;
            return { customizations: rest };
          });
        },

        clearAll: () => {
          set({ customizations: {} });
        },

        current: () => {
          const state = get();
          return state.customizations[state.currentTemplate] || DEFAULT_CUSTOMIZATIONS;
        },
      }),
      {
        // Zundo (undo/redo) options
        limit: 50,
        equality: (a, b) => JSON.stringify(a) === JSON.stringify(b),
      }
    ),
    {
      name: 'resumepair-customizations', // localStorage key
      storage: createJSONStorage(() => localStorage),

      // Only persist customizations, not currentTemplate
      partialize: (state) => ({
        customizations: state.customizations,
      }),

      // Migration for schema changes
      version: 1,
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          // Migrate v0 → v1
          return {
            customizations: persistedState.customizations || {},
          };
        }
        return persistedState;
      },
    }
  )
);
```

### Debounced API Persistence

**Pattern**: Save to localStorage immediately, sync to API with debounce

```typescript
// hooks/useCustomizationSync.ts
import { useEffect, useRef } from 'react';
import { useCustomizationStore } from '@/stores/customizationStore';
import { useDebounce } from '@/hooks/useDebounce';

export function useCustomizationSync(resumeId: string) {
  const customizations = useCustomizationStore(state => state.customizations);
  const currentTemplate = useCustomizationStore(state => state.currentTemplate);

  // Debounce API calls to 2000ms (2 seconds)
  const debouncedCustomizations = useDebounce(customizations, 2000);

  const prevRef = useRef(customizations);

  useEffect(() => {
    // Skip first render and unchanged values
    if (prevRef.current === debouncedCustomizations) return;
    prevRef.current = debouncedCustomizations;

    // Save to API
    fetch(`/api/v1/resumes/${resumeId}/customizations`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        templateId: currentTemplate,
        customizations: debouncedCustomizations[currentTemplate],
      }),
    }).catch(err => {
      console.error('Failed to sync customizations:', err);
      // Retry logic could go here
    });
  }, [debouncedCustomizations, resumeId, currentTemplate]);
}
```

**Debounce Hook**:
```typescript
// hooks/useDebounce.ts
import { useEffect, useState } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
```

### Migration Strategy

**Schema Versioning**:
```typescript
// types/customizations.ts
export const CUSTOMIZATION_SCHEMA_VERSION = 2;

export interface CustomizationsV1 {
  colors: { primary: string; accent: string };
  fontSize: number;
}

export interface CustomizationsV2 {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    background: string;
    muted: string;
    border: string;
  };
  typography: {
    fontFamily: string;
    fontSize: number;
    lineHeight: number;
  };
  spacing: {
    sectionGap: number;
    itemGap: number;
    pagePadding: number;
  };
  icons: {
    enabled: boolean;
    style: 'outline' | 'filled';
    size: number;
  };
  layout: {
    columns: 1 | 2;
    headerAlignment: 'left' | 'center' | 'right';
  };
}

export type Customizations = CustomizationsV2;
```

**Automatic Migration**:
```typescript
// Migration in persist middleware
migrate: (persistedState: any, version: number) => {
  if (version === 0) {
    // v0 → v1: Add missing fields
    return {
      customizations: Object.fromEntries(
        Object.entries(persistedState.customizations || {}).map(([key, value]: [string, any]) => [
          key,
          {
            ...value,
            typography: value.typography || {
              fontFamily: 'var(--font-sans)',
              fontSize: value.fontSize || 1.0,
              lineHeight: 1.5,
            },
          },
        ])
      ),
    };
  }

  if (version === 1) {
    // v1 → v2: Expand color palette
    return {
      customizations: Object.fromEntries(
        Object.entries(persistedState.customizations || {}).map(([key, value]: [string, any]) => [
          key,
          {
            ...value,
            colors: {
              primary: value.colors.primary,
              secondary: value.colors.secondary || value.colors.primary,
              accent: value.colors.accent,
              text: value.colors.text || '210 11% 15%',
              background: value.colors.background || '0 0% 100%',
              muted: value.colors.muted || '210 11% 46%',
              border: value.colors.border || '210 16% 93%',
            },
          },
        ])
      ),
    };
  }

  return persistedState;
},
```

### Edge Cases

**localStorage Quota Exceeded**:
```typescript
// Wrap persist storage with error handling
const storage = {
  getItem: (name: string) => {
    try {
      return localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: string) => {
    try {
      localStorage.setItem(name, value);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        // Clear old data or notify user
        console.warn('localStorage quota exceeded. Clearing old customizations...');
        localStorage.removeItem('resumepair-customizations-backup');
      }
      throw error;
    }
  },
  removeItem: (name: string) => {
    try {
      localStorage.removeItem(name);
    } catch {}
  },
};

// Use custom storage in persist middleware
persist(
  // ... store definition
  {
    name: 'resumepair-customizations',
    storage: createJSONStorage(() => storage),
  }
);
```

**Corrupt Data Recovery**:
```typescript
// Add try-catch in migrate function
migrate: (persistedState: any, version: number) => {
  try {
    // ... migration logic
  } catch (error) {
    console.error('Failed to migrate customizations:', error);
    // Return defaults instead of corrupt data
    return { customizations: {} };
  }
},
```

---

## 5. Preset Theme Architecture

### Theme Object Structure

**Flat Structure for Performance**:
```typescript
// types/theme.ts
export interface ThemePreset {
  // Metadata
  id: string;
  name: string;
  description: string;
  category: 'professional' | 'creative' | 'minimal' | 'bold';
  tags: string[];

  // All customization values in one flat object
  customizations: Customizations;

  // Optional preview
  preview?: {
    thumbnail: string;  // URL to static image
    backgroundColor: string;
  };
}
```

**Preset Registry** [similar to WordPress theme.json [web:https://developer.wordpress.org/themes/global-settings-and-styles/ | retrieved 2025-10-01]]:
```typescript
// constants/theme-presets.ts
import type { ThemePreset } from '@/types/theme';

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'default',
    name: 'Default',
    description: 'Professional navy and lime theme',
    category: 'professional',
    tags: ['professional', 'modern', 'tech'],
    customizations: {
      colors: {
        primary: '225 52% 8%',
        secondary: '226 36% 16%',
        accent: '73 100% 50%',
        text: '210 11% 15%',
        background: '0 0% 100%',
        muted: '210 11% 46%',
        border: '210 16% 93%',
      },
      typography: {
        fontFamily: 'var(--font-sans)',
        fontSize: 1.0,
        lineHeight: 1.5,
      },
      spacing: {
        sectionGap: 24,
        itemGap: 12,
        pagePadding: 48,
      },
      icons: {
        enabled: true,
        style: 'outline',
        size: 16,
      },
      layout: {
        columns: 1,
        headerAlignment: 'left',
      },
    },
    preview: {
      thumbnail: '/themes/default.png',
      backgroundColor: '225 52% 8%',
    },
  },
  {
    id: 'executive',
    name: 'Executive Gold',
    description: 'Navy and gold for senior professionals',
    category: 'professional',
    tags: ['executive', 'finance', 'formal'],
    customizations: {
      colors: {
        primary: '225 52% 8%',
        secondary: '226 36% 16%',
        accent: '45 90% 50%',        // Gold
        text: '210 11% 15%',
        background: '0 0% 100%',
        muted: '210 11% 46%',
        border: '210 16% 93%',
      },
      typography: {
        fontFamily: 'var(--font-serif)',  // Serif for executive
        fontSize: 1.05,                    // Slightly larger
        lineHeight: 1.6,                   // More spacious
      },
      spacing: {
        sectionGap: 32,                    // Generous spacing
        itemGap: 16,
        pagePadding: 56,
      },
      icons: {
        enabled: false,                    // No icons for formal
        style: 'outline',
        size: 16,
      },
      layout: {
        columns: 1,
        headerAlignment: 'center',         // Centered header
      },
    },
    preview: {
      thumbnail: '/themes/executive.png',
      backgroundColor: '45 90% 50%',
    },
  },
  {
    id: 'creative',
    name: 'Creative Purple',
    description: 'Bold purple and orange for designers',
    category: 'creative',
    tags: ['creative', 'design', 'colorful'],
    customizations: {
      colors: {
        primary: '280 60% 30%',
        secondary: '280 50% 50%',
        accent: '25 95% 55%',         // Orange
        text: '210 11% 15%',
        background: '0 0% 100%',
        muted: '210 11% 46%',
        border: '280 30% 90%',        // Light purple border
      },
      typography: {
        fontFamily: 'var(--font-sans)',
        fontSize: 1.0,
        lineHeight: 1.5,
      },
      spacing: {
        sectionGap: 28,
        itemGap: 14,
        pagePadding: 44,
      },
      icons: {
        enabled: true,
        style: 'filled',               // Filled icons for bold look
        size: 18,                      // Larger icons
      },
      layout: {
        columns: 2,                    // Two-column layout
        headerAlignment: 'left',
      },
    },
    preview: {
      thumbnail: '/themes/creative.png',
      backgroundColor: '280 60% 30%',
    },
  },
  {
    id: 'minimal-bw',
    name: 'Minimal Black & White',
    description: 'Ultra-clean monochrome design',
    category: 'minimal',
    tags: ['minimal', 'simple', 'clean'],
    customizations: {
      colors: {
        primary: '0 0% 0%',            // Pure black
        secondary: '0 0% 20%',
        accent: '0 0% 0%',             // No accent color
        text: '0 0% 0%',
        background: '0 0% 100%',
        muted: '0 0% 50%',
        border: '0 0% 90%',
      },
      typography: {
        fontFamily: 'var(--font-sans)',
        fontSize: 0.95,                // Slightly smaller
        lineHeight: 1.6,               // More line spacing
      },
      spacing: {
        sectionGap: 40,                // Maximum whitespace
        itemGap: 16,
        pagePadding: 64,
      },
      icons: {
        enabled: false,                // No icons
        style: 'outline',
        size: 16,
      },
      layout: {
        columns: 1,
        headerAlignment: 'left',
      },
    },
    preview: {
      thumbnail: '/themes/minimal-bw.png',
      backgroundColor: '0 0% 0%',
    },
  },
  // ... 6 more presets
];

// Helper functions
export function getPreset(id: string): ThemePreset | undefined {
  return THEME_PRESETS.find(p => p.id === id);
}

export function getPresetsByCategory(category: string): ThemePreset[] {
  return THEME_PRESETS.filter(p => p.category === category);
}

export function searchPresets(query: string): ThemePreset[] {
  const lowerQuery = query.toLowerCase();
  return THEME_PRESETS.filter(p =>
    p.name.toLowerCase().includes(lowerQuery) ||
    p.description.toLowerCase().includes(lowerQuery) ||
    p.tags.some(tag => tag.includes(lowerQuery))
  );
}
```

### User Custom Theme Pattern

**Allow users to save their own presets**:
```typescript
// stores/customizationStore.ts (extended)
interface CustomizationState {
  // ... existing state
  userPresets: ThemePreset[];

  // ... existing actions
  saveAsPreset: (name: string, description: string) => void;
  deleteUserPreset: (id: string) => void;
}

// In store implementation
saveAsPreset: (name, description) => {
  set((state) => {
    const current = state.customizations[state.currentTemplate];

    const newPreset: ThemePreset = {
      id: `user-${Date.now()}`,
      name,
      description,
      category: 'professional', // Default or let user choose
      tags: ['custom', 'user-created'],
      customizations: current,
    };

    return {
      userPresets: [...state.userPresets, newPreset],
    };
  });
},

deleteUserPreset: (id) => {
  set((state) => ({
    userPresets: state.userPresets.filter(p => p.id !== id),
  }));
},
```

**UI Component**:
```typescript
// components/customization/SaveThemeDialog.tsx
import { useState } from 'react';
import { useCustomizationStore } from '@/stores/customizationStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export function SaveThemeDialog({
  open,
  onClose
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const saveAsPreset = useCustomizationStore(state => state.saveAsPreset);

  const handleSave = () => {
    if (!name) return;
    saveAsPreset(name, description);
    onClose();
    setName('');
    setDescription('');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save Custom Theme</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Theme Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Custom Theme"
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Description (optional)</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your theme..."
              className="mt-1"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!name}>
              Save Theme
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 6. Undo/Redo Integration

### Zundo (Temporal State) Pattern

**Already integrated** [internal:/Users/varunprasad/code/prjs/resumepair/package.json#L58]:
```json
"zundo": "^2.3.0",
"zustand": "^5.0.8"
```

**Integration with Customization Store** [gh:charkour/zundo@main/README.md]:
```typescript
// stores/customizationStore.ts
import { temporal } from 'zundo';
import { create } from 'zustand';

export const useCustomizationStore = create<CustomizationState>()(
  persist(
    temporal(
      (set, get) => ({
        // ... store implementation
      }),
      {
        // Zundo options
        limit: 50,                    // Store last 50 states
        equality: (a, b) => {
          // Custom equality check to avoid unnecessary history entries
          return JSON.stringify(a) === JSON.stringify(b);
        },
        diff: (past, current) => {
          // Optional: Track what changed
          return { past, current };
        },
        // Group rapid changes within 180ms into single undo step
        handleSet: (handleSet) => {
          let timeout: NodeJS.Timeout | null = null;

          return (state) => {
            if (timeout) clearTimeout(timeout);

            timeout = setTimeout(() => {
              handleSet(state);
              timeout = null;
            }, 180); // Debounce 180ms
          };
        },
      }
    ),
    {
      // ... persist options
    }
  )
);

// Temporal store (undo/redo controls)
export const useTemporalStore = <T>(
  selector: (state: TemporalState<CustomizationState>) => T
) => useCustomizationStore.temporal(selector);
```

**Undo/Redo Hooks**:
```typescript
// hooks/useCustomizationUndo.ts
import { useTemporalStore } from '@/stores/customizationStore';

export function useCustomizationUndo() {
  const undo = useTemporalStore(state => state.undo);
  const redo = useTemporalStore(state => state.redo);
  const canUndo = useTemporalStore(state => state.pastStates.length > 0);
  const canRedo = useTemporalStore(state => state.futureStates.length > 0);
  const clear = useTemporalStore(state => state.clear);

  return {
    undo,
    redo,
    canUndo,
    canRedo,
    clear,
  };
}
```

### Grouping Strategy

**Problem**: User adjusts color picker → generates 50+ state changes as they drag → creates 50 undo steps

**Solution 1: Debounced HandleSet** (implemented above)
- Groups changes within 180ms window
- User drags color picker → only 1 undo step created after they stop

**Solution 2: Manual Batching** (for multi-field updates):
```typescript
// Batch multiple updates into single undo step
const batchUpdate = () => {
  const temporal = useCustomizationStore.temporal.getState();
  temporal.pause(); // Pause undo tracking

  // Make multiple changes
  updateCustomization(templateId, {
    colors: { primary: '...' },
    typography: { fontSize: 1.1 },
    spacing: { sectionGap: 28 },
  });

  temporal.resume(); // Resume tracking (creates 1 undo step)
};
```

**Solution 3: Transaction API** (future enhancement):
```typescript
// Wrap changes in transaction
useCustomizationStore.transaction(() => {
  updateColor('primary', '225 52% 8%');
  updateColor('accent', '73 100% 50%');
  updateFontSize(1.1);
}); // Creates single undo step
```

### UI Controls

```typescript
// components/editor/EditorToolbar.tsx
import { useCustomizationUndo } from '@/hooks/useCustomizationUndo';
import { Undo2, Redo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function EditorToolbar() {
  const { undo, redo, canUndo, canRedo } = useCustomizationUndo();

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => undo()}
        disabled={!canUndo}
        title="Undo (Cmd+Z)"
      >
        <Undo2 className="w-4 h-4" />
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={() => redo()}
        disabled={!canRedo}
        title="Redo (Cmd+Shift+Z)"
      >
        <Redo2 className="w-4 h-4" />
      </Button>
    </div>
  );
}
```

**Keyboard Shortcuts**:
```typescript
// hooks/useUndoShortcuts.ts
import { useEffect } from 'react';
import { useCustomizationUndo } from './useCustomizationUndo';

export function useUndoShortcuts() {
  const { undo, redo, canUndo, canRedo } = useCustomizationUndo();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      if (modifier && e.key === 'z') {
        e.preventDefault();

        if (e.shiftKey) {
          // Cmd/Ctrl + Shift + Z = Redo
          if (canRedo) redo();
        } else {
          // Cmd/Ctrl + Z = Undo
          if (canUndo) undo();
        }
      }

      // Alternative redo shortcut: Cmd/Ctrl + Y
      if (modifier && e.key === 'y' && canRedo) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, canUndo, canRedo]);
}
```

### History Size Limits

**Memory Management**:
```typescript
// Limit history to prevent memory bloat
temporal(
  // ... store
  {
    limit: 50,  // Keep last 50 states (~5KB × 50 = 250KB max)

    // Custom partialize to exclude large fields from history
    partialize: (state) => ({
      customizations: state.customizations,
      currentTemplate: state.currentTemplate,
      // Exclude userPresets (not needed in undo history)
    }),
  }
)
```

---

## 7. Real-Time Preview Sync

### Sync Pattern

**Optimistic Updates Flow**:
```
User changes color picker
  → Update customization store (synchronous)
  → Update CSS variables via useEffect (synchronous)
  → Preview re-renders with new styles (synchronous)
  → Total time: <50ms
```

**Implementation**:
```typescript
// components/preview/LivePreview.tsx
import { useMemo, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { useDocumentStore } from '@/stores/documentStore';
import { useTemplateStore } from '@/stores/templateStore';
import { useCustomizationStore } from '@/stores/customizationStore';
import { useDynamicTheme } from '@/hooks/useDynamicTheme';

export function LivePreview() {
  const document = useDocumentStore(state => state.document);
  const currentTemplate = useTemplateStore(state => state.currentTemplate);
  const customizations = useCustomizationStore(state => state.current());

  // Apply theme CSS variables (synchronous)
  useDynamicTheme(customizations);

  // Debounce document changes (typing) to 100ms
  const debouncedDocument = useDebounce(document, 100);

  // Memoize template rendering (expensive operation)
  const templateHTML = useMemo(() => {
    const template = TEMPLATE_REGISTRY[currentTemplate];
    if (!template) return null;

    return template.component({
      data: debouncedDocument,
      customizations,
      mode: 'preview',
    });
  }, [debouncedDocument, currentTemplate, customizations]);

  return (
    <div className="preview-container">
      <div className="doc-theme" data-template={currentTemplate}>
        {templateHTML}
      </div>
    </div>
  );
}
```

### Debounce Strategy

**Two-Tier Debouncing**:

1. **Document Changes** (typing): 100ms debounce
   - User types → Zustand updates immediately → 100ms debounce before template re-render
   - Prevents excessive React renders during typing

2. **Customization Changes** (sliders/pickers): No debounce for CSS variables, 180ms for undo
   - CSS variable updates are synchronous (instant visual feedback)
   - Undo history debounced at 180ms (grouped changes)

**Rationale**:
- CSS variable updates are cheap (<5ms)
- Template re-renders are expensive (20-50ms)
- User expects instant feedback for visual changes (colors, fonts)
- User does NOT need instant feedback for content changes (can tolerate 100ms delay)

**Implementation** [web:https://www.developerway.com/posts/debouncing-in-react | retrieved 2025-10-01]:
```typescript
// hooks/useDebounce.ts
import { useEffect, useState } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
```

### Optimistic Updates

**Pattern**: Update UI immediately, sync to API in background

```typescript
// components/customization/CustomizationPanel.tsx
import { useCustomizationStore } from '@/stores/customizationStore';
import { useCustomizationSync } from '@/hooks/useCustomizationSync';

export function CustomizationPanel({ resumeId }: { resumeId: string }) {
  const updateCustomization = useCustomizationStore(state => state.updateCustomization);
  const currentTemplate = useCustomizationStore(state => state.currentTemplate);

  // Sync to API in background (debounced at 2000ms)
  useCustomizationSync(resumeId);

  const handleColorChange = (key: string, value: string) => {
    // Immediate local update
    updateCustomization(currentTemplate, {
      colors: { [key]: value },
    });

    // API sync happens automatically via useCustomizationSync
  };

  return (
    <div className="space-y-4">
      <ColorPicker
        value={customizations.colors.primary}
        onChange={(value) => handleColorChange('primary', value)}
        label="Primary Color"
      />
      {/* ... other controls */}
    </div>
  );
}
```

### Error Handling

**Preview Render Errors**:
```typescript
// components/preview/PreviewErrorBoundary.tsx
import { Component, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class PreviewErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Preview render error:', error, errorInfo);
    // Log to error tracking service (non-PII only)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Preview Error</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Unable to render preview. Try switching templates or resetting customizations.
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => this.setState({ hasError: false })}
            >
              Retry
            </Button>
            <Button
              onClick={() => {
                // Reset to defaults
                window.location.reload();
              }}
            >
              Reset Customizations
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

**Usage**:
```typescript
// Wrap preview in error boundary
<PreviewErrorBoundary>
  <LivePreview />
</PreviewErrorBoundary>
```

---

## 8. UI Component Recommendations

### Color Picker: react-colorful

**Recommendation**: Use `react-colorful` for color picking [gh:omgovich/react-colorful@4.5.0]

**Rationale**:
- 2.8KB gzipped (13x lighter than react-color)
- Native HSL support via `HslColorPicker`
- TypeScript-first with full type safety
- 100% test coverage
- Zero dependencies
- Accessible (keyboard navigation)

**Installation**:
```bash
npm install react-colorful
```

**Code Example**: See Section 1 (Color Picker Integration)

### Font Selector: Custom Component

**Recommendation**: Build custom font selector with preview [see Section 2]

**Rationale**:
- No library needed (simple select + preview)
- Full control over UX
- Integrates with next/font system
- Shows live preview of each font

### Spacing Controls: Slider Component

**Recommendation**: Use shadcn/ui Slider component [web:https://ui.shadcn.com/docs/components/slider | retrieved 2025-10-01]

**Installation**:
```bash
npx shadcn-ui@latest add slider
```

**Implementation**:
```typescript
// components/customization/SpacingControls.tsx
import { Slider } from '@/components/ui/slider';
import { useCustomizationStore } from '@/stores/customizationStore';

export function SpacingControls() {
  const customizations = useCustomizationStore(state => state.current());
  const updateCustomization = useCustomizationStore(state => state.updateCustomization);
  const currentTemplate = useCustomizationStore(state => state.currentTemplate);

  const handleChange = (key: string, value: number[]) => {
    updateCustomization(currentTemplate, {
      spacing: { [key]: value[0] },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="text-sm font-medium flex justify-between mb-2">
          <span>Section Gap</span>
          <span className="text-muted-foreground">{customizations.spacing.sectionGap}px</span>
        </label>
        <Slider
          value={[customizations.spacing.sectionGap]}
          onValueChange={(value) => handleChange('sectionGap', value)}
          min={16}
          max={48}
          step={4}
          className="w-full"
        />
      </div>

      <div>
        <label className="text-sm font-medium flex justify-between mb-2">
          <span>Item Gap</span>
          <span className="text-muted-foreground">{customizations.spacing.itemGap}px</span>
        </label>
        <Slider
          value={[customizations.spacing.itemGap]}
          onValueChange={(value) => handleChange('itemGap', value)}
          min={8}
          max={24}
          step={4}
          className="w-full"
        />
      </div>

      <div>
        <label className="text-sm font-medium flex justify-between mb-2">
          <span>Page Padding</span>
          <span className="text-muted-foreground">{customizations.spacing.pagePadding}px</span>
        </label>
        <Slider
          value={[customizations.spacing.pagePadding]}
          onValueChange={(value) => handleChange('pagePadding', value)}
          min={24}
          max={64}
          step={8}
          className="w-full"
        />
      </div>

      {/* Preset spacing modes */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => updateCustomization(currentTemplate, {
            spacing: { sectionGap: 16, itemGap: 8, pagePadding: 32 },
          })}
        >
          Compact
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => updateCustomization(currentTemplate, {
            spacing: { sectionGap: 24, itemGap: 12, pagePadding: 48 },
          })}
        >
          Normal
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => updateCustomization(currentTemplate, {
            spacing: { sectionGap: 32, itemGap: 16, pagePadding: 56 },
          })}
        >
          Relaxed
        </Button>
      </div>
    </div>
  );
}
```

### Layout Structure

**Responsive Panel Design**:
```typescript
// components/customization/CustomizationPanel.tsx
import { useState } from 'react';
import { Palette, Type, Spacing, Layout, Icons } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

export function CustomizationPanel() {
  return (
    <div className="h-full flex flex-col border-l bg-background">
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Customize</h2>
        <p className="text-sm text-muted-foreground">
          Adjust colors, fonts, and layout
        </p>
      </div>

      {/* Tabbed sections */}
      <Tabs defaultValue="colors" className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start p-4 border-b">
          <TabsTrigger value="colors" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            <span>Colors</span>
          </TabsTrigger>
          <TabsTrigger value="typography" className="flex items-center gap-2">
            <Type className="w-4 h-4" />
            <span>Typography</span>
          </TabsTrigger>
          <TabsTrigger value="spacing" className="flex items-center gap-2">
            <Spacing className="w-4 h-4" />
            <span>Spacing</span>
          </TabsTrigger>
          <TabsTrigger value="icons" className="flex items-center gap-2">
            <Icons className="w-4 h-4" />
            <span>Icons</span>
          </TabsTrigger>
          <TabsTrigger value="layout" className="flex items-center gap-2">
            <Layout className="w-4 h-4" />
            <span>Layout</span>
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-6">
            <TabsContent value="colors">
              <PresetThemes onSelect={applyPreset} />
              <ColorSchemeSelector />
            </TabsContent>

            <TabsContent value="typography">
              <FontSelector />
              <FontSizeSlider />
              <LineHeightSlider />
            </TabsContent>

            <TabsContent value="spacing">
              <SpacingControls />
            </TabsContent>

            <TabsContent value="icons">
              <IconSettings />
            </TabsContent>

            <TabsContent value="layout">
              <LayoutOptions />
            </TabsContent>
          </div>
        </ScrollArea>
      </Tabs>

      {/* Footer actions */}
      <div className="p-4 border-t flex gap-2">
        <Button variant="outline" className="flex-1">
          Reset
        </Button>
        <Button className="flex-1">
          Save Theme
        </Button>
      </div>
    </div>
  );
}
```

### Mobile Responsive Strategy

**Bottom Sheet for Mobile**:
```typescript
// components/customization/MobileCustomizationSheet.tsx
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CustomizationPanel } from './CustomizationPanel';

export function MobileCustomizationSheet() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="md:hidden">
          <Palette className="w-4 h-4 mr-2" />
          Customize
        </Button>
      </SheetTrigger>

      <SheetContent side="bottom" className="h-[80vh]">
        <SheetHeader>
          <SheetTitle>Customize Resume</SheetTitle>
        </SheetHeader>
        <CustomizationPanel />
      </SheetContent>
    </Sheet>
  );
}
```

### Accessibility

**Keyboard Navigation**:
```typescript
// Ensure all controls are keyboard accessible
<Slider
  value={[value]}
  onValueChange={onChange}
  onKeyDown={(e) => {
    // Arrow keys for fine control
    if (e.key === 'ArrowLeft') {
      onChange([Math.max(min, value - step)]);
    } else if (e.key === 'ArrowRight') {
      onChange([Math.min(max, value + step)]);
    }
  }}
  aria-label="Section gap spacing"
  aria-valuemin={min}
  aria-valuemax={max}
  aria-valuenow={value}
/>
```

**ARIA Labels**:
```typescript
<div role="region" aria-label="Color customization">
  <ColorPicker
    aria-label="Primary color picker"
    aria-describedby="primary-color-description"
  />
  <span id="primary-color-description" className="sr-only">
    Select the primary color for your resume template
  </span>
</div>
```

---

## 9. OSS Examples & References

### 1. shadcn/ui Theme System

**Repository**: [gh:shadcn-ui/ui@main]
**Relevant Files**:
- `apps/www/app/globals.css` - CSS variable definitions
- `apps/www/components/theme-customizer.tsx` - Live theme editor
- `apps/www/lib/themes.ts` - Theme presets

**Key Patterns**:
- HSL color format with CSS variables
- Theme switcher with live preview
- Preset themes (default, dark, etc.)

**Code Excerpt** [gh:shadcn-ui/ui@main:/apps/www/app/globals.css]:
```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
  /* ... */
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  /* ... */
}
```

**Lesson**: Store HSL as space-separated triplets, wrap in `hsl()` when used

---

### 2. Radix Themes

**Repository**: [gh:radix-ui/themes@main]
**Relevant Files**:
- `packages/radix-ui-themes/src/styles/tokens/` - Design tokens
- `packages/radix-ui-themes/src/components/theme-panel.tsx` - Customization UI

**Key Patterns**:
- Scale-based color system (1-12)
- CSS variable runtime updates
- Theme panel with live preview

**Code Excerpt** [gh:radix-ui/themes@main:/packages/radix-ui-themes/src/styles/tokens/colors.css]:
```css
:root {
  --color-background: var(--gray-1);
  --color-surface: white;
  --accent-1: var(--blue-1);
  --accent-9: var(--blue-9);
  /* ... */
}
```

**Lesson**: Use semantic token names that map to scale values

---

### 3. Chakra UI Theme Tools

**Repository**: [gh:chakra-ui/chakra-ui@main]
**Relevant Files**:
- `packages/theme/src/foundations/colors.ts` - Color definitions
- `packages/theme-tools/src/color.ts` - Color manipulation utilities

**Key Patterns**:
- Theme object structure (nested config)
- Color mode (light/dark) switching
- Responsive value syntax

**Code Excerpt** [gh:chakra-ui/chakra-ui@main:/packages/theme/src/foundations/colors.ts]:
```typescript
export const colors = {
  gray: {
    50: '#F7FAFC',
    100: '#EDF2F7',
    // ...
    900: '#171923',
  },
  blue: {
    50: '#EBF8FF',
    // ...
  },
}
```

**Lesson**: Structured color palettes with numeric scales

---

### 4. Zundo Temporal State

**Repository**: [gh:charkour/zundo@main]
**Relevant Files**:
- `src/temporal.ts` - Main middleware implementation
- `src/options.ts` - Configuration options

**Key Features**:
- Undo/redo middleware for Zustand
- Configurable history limit
- Custom equality checks
- Pause/resume tracking

**Code Excerpt** [gh:charkour/zundo@main:/src/temporal.ts]:
```typescript
export const temporal = (
  config,
  options = {}
) => (set, get, api) => {
  const temporalState = {
    pastStates: [],
    futureStates: [],
    undo: () => { /* ... */ },
    redo: () => { /* ... */ },
    pause: () => { /* ... */ },
    resume: () => { /* ... */ },
  };

  return config(
    (state) => {
      if (!temporalState.paused) {
        temporalState.pastStates.push(get());
        if (temporalState.pastStates.length > options.limit) {
          temporalState.pastStates.shift();
        }
      }
      set(state);
    },
    get,
    api
  );
};
```

**Lesson**: Middleware wraps store `set` function to track history

---

### 5. React Colorful

**Repository**: [gh:omgovich/react-colorful@master]
**Relevant Files**:
- `src/components/HslColorPicker.tsx` - HSL picker implementation
- `src/utils/convert.ts` - Color conversion utilities

**Key Features**:
- 2.8KB gzipped
- Multiple color models (HSL, RGB, HEX, HSB)
- Accessible (keyboard navigation)
- TypeScript-first

**Code Excerpt** [gh:omgovich/react-colorful@master:/src/components/HslColorPicker.tsx]:
```typescript
export const HslColorPicker = (props: ColorPickerProps<HslColor>): JSX.Element => {
  return (
    <ColorPicker
      {...props}
      colorModel={hslToHsva}
    />
  );
};
```

**Lesson**: Component-per-model approach for tree-shaking

---

### 6. Next.js Font Optimization

**Documentation**: [web:https://nextjs.org/docs/app/api-reference/components/font | retrieved 2025-10-01]
**Blog**: [web:https://developer.chrome.com/blog/framework-tools-font-fallback | retrieved 2025-10-01]

**Key Features**:
- Automatic font subsetting
- Self-hosting Google Fonts
- font-display: optional support
- Fallback font metric override

**Code Example** [web:https://nextjs.org/docs/app/api-reference/components/font]:
```typescript
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  adjustFontFallback: 'Arial',
})

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  )
}
```

**Lesson**: Use next/font for zero-config font optimization

---

### 7. WCAG Contrast Calculation

**Gist**: [gh:trajano/hsl-wcag-contrast-ts@gist]
**Spec**: [web:https://www.w3.org/TR/WCAG20-TECHS/G18.html | retrieved 2025-10-01]

**Algorithm**:
1. Convert HSL → RGB
2. Calculate relative luminance
3. Compute contrast ratio: (L1 + 0.05) / (L2 + 0.05)
4. Check against WCAG AA (4.5:1) or AAA (7:1)

**Key Formula**:
```typescript
// Relative luminance (0-1)
const luminance = 0.2126 * R + 0.7152 * G + 0.0722 * B;

// Contrast ratio (1-21)
const ratio = (lighter + 0.05) / (darker + 0.05);
```

**Lesson**: Always validate color contrast for accessibility

---

### 8. Debouncing in React

**Article**: [web:https://www.developerway.com/posts/debouncing-in-react | retrieved 2025-10-01]
**GitHub**: [gh:podefr/react-debounce-render@main]

**Patterns**:
1. **useDebounce Hook**: Debounce value changes
2. **useDebouncedCallback**: Debounce function calls
3. **Higher-Order Component**: Debounce entire component renders

**Code Example**:
```typescript
// Pattern 1: Debounce value
const debouncedValue = useDebounce(searchTerm, 500);

useEffect(() => {
  // API call only when debouncedValue changes
  fetchResults(debouncedValue);
}, [debouncedValue]);
```

**Lesson**: Choose debounce strategy based on use case (value vs callback vs render)

---

### 9. WordPress theme.json

**Documentation**: [web:https://developer.wordpress.org/themes/global-settings-and-styles/ | retrieved 2025-10-01]

**Structure**:
```json
{
  "version": 2,
  "settings": {
    "color": {
      "palette": [
        { "name": "Primary", "slug": "primary", "color": "#0073aa" },
        { "name": "Secondary", "slug": "secondary", "color": "#005177" }
      ]
    },
    "typography": {
      "fontSizes": [
        { "name": "Small", "slug": "small", "size": "13px" },
        { "name": "Medium", "slug": "medium", "size": "20px" }
      ]
    }
  }
}
```

**Lesson**: Centralized theme configuration in JSON format

---

### 10. Tailwind CSS v4 Theming

**Blog**: [web:https://tailwindcss.com/blog/tailwindcss-v4-alpha | retrieved 2025-01-01]

**Key Changes**:
- CSS-first configuration
- Native CSS variable support
- Theme variants in CSS

**Code Example**:
```css
@theme {
  --color-primary: oklch(0.6 0.2 30);
  --color-secondary: oklch(0.4 0.15 240);
  --font-sans: 'Inter', sans-serif;
}

.button {
  background-color: var(--color-primary);
  font-family: var(--font-sans);
}
```

**Lesson**: CSS-first theming is the future (v4+ trend)

---

## 10. Implementation Roadmap for ResumePair

### Phase 3A: Foundation (Week 1)

**Components to Build**:
1. `hooks/useDynamicTheme.ts` - CSS variable injection
2. `hooks/useDebounce.ts` - Value debouncing
3. `stores/customizationStore.ts` - Zustand store with persist + temporal
4. `types/customizations.ts` - TypeScript interfaces
5. `constants/theme-presets.ts` - 10+ color presets

**Integration Points**:
- Update `globals.css` with `--doc-*` tokens (already exists)
- Create `app/fonts.ts` with next/font setup
- Add `react-colorful` to package.json

**Testing**:
- Unit test: useDynamicTheme updates CSS variables
- Unit test: useDebounce delays value updates
- Unit test: customizationStore persist/hydrate
- Integration test: Theme preset applies all values

**Deliverable**: Customization store + CSS variable system working

---

### Phase 3B: UI Components (Week 2)

**Components to Build**:
1. `components/customization/CustomizationPanel.tsx` - Main panel
2. `components/customization/PresetThemes.tsx` - Preset grid
3. `components/customization/ColorPicker.tsx` - HSL color picker (react-colorful)
4. `components/customization/FontSelector.tsx` - Font dropdown with preview
5. `components/customization/SpacingControls.tsx` - Slider controls
6. `components/customization/IconSettings.tsx` - Icon toggles
7. `components/customization/ColorContrastChecker.tsx` - WCAG validator

**Integration Points**:
- shadcn/ui components: Slider, Tabs, ScrollArea, Sheet, Dialog
- Connect to customizationStore actions
- Add keyboard shortcuts

**Testing**:
- Unit test: Each component renders correctly
- Unit test: User interactions update store
- Integration test: Panel updates preview in real-time
- E2E test: Complete customization flow

**Deliverable**: Full customization panel with all controls

---

### Phase 3C: Preview Integration (Week 3)

**Components to Build**:
1. `components/preview/LivePreview.tsx` - Preview container
2. `components/preview/PreviewErrorBoundary.tsx` - Error handling
3. `hooks/useCustomizationSync.ts` - API sync
4. `libs/color-contrast.ts` - WCAG calculations

**Integration Points**:
- Connect LivePreview to customizationStore
- Apply useDynamicTheme in preview
- Debounce document updates (100ms)
- Add error boundaries

**Testing**:
- Unit test: Preview updates on customization change
- Unit test: Debouncing prevents excessive renders
- Integration test: Preview syncs with panel
- Performance test: Update latency <120ms

**Deliverable**: Live preview responding to customization changes

---

### Phase 3D: Persistence & Undo (Week 4)

**Components to Build**:
1. API route: `/api/v1/resumes/[id]/customizations` (GET/PUT)
2. Migration: `009_add_customizations_column.sql`
3. `hooks/useCustomizationUndo.ts` - Undo/redo hooks
4. `hooks/useUndoShortcuts.ts` - Keyboard shortcuts
5. `components/editor/EditorToolbar.tsx` - Undo/redo buttons

**Integration Points**:
- Add customizations JSONB column to resumes table
- Implement RLS policies
- Connect temporal store to UI controls

**Testing**:
- Unit test: API persists customizations
- Unit test: Undo/redo updates state correctly
- Integration test: Keyboard shortcuts work
- E2E test: Customizations persist across sessions

**Deliverable**: Full persistence + undo/redo system

---

### State Flow Diagram

```
┌─────────────────────┐
│  User Interaction   │
│  (ColorPicker)      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────┐
│  customizationStore     │
│  updateCustomization()  │
└──────────┬──────────────┘
           │
           ├─────────────────┐
           │                 │
           ▼                 ▼
┌──────────────────┐  ┌─────────────────┐
│  useDynamicTheme │  │  temporal()     │
│  (CSS variables) │  │  (undo history) │
└─────────┬────────┘  └─────────────────┘
          │
          ▼
┌──────────────────────┐
│  LivePreview         │
│  (re-render with     │
│   new CSS variables) │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────────┐
│  useCustomizationSync    │
│  (debounced API call)    │
└──────────────────────────┘
```

---

## 11. Edge Cases & Solutions

### Very Long Customization Sessions (Memory)

**Problem**: User customizes for 1+ hours → undo history grows → memory leak risk

**Solution**:
```typescript
// Limit undo history to 50 states (~250KB max)
temporal(
  // ... store
  { limit: 50 }
)

// Periodically clear old history
useEffect(() => {
  const interval = setInterval(() => {
    const temporal = useCustomizationStore.temporal.getState();
    if (temporal.pastStates.length > 40) {
      // Keep only last 25 states
      temporal.pastStates.splice(0, temporal.pastStates.length - 25);
    }
  }, 60000); // Every 1 minute

  return () => clearInterval(interval);
}, []);
```

---

### Rapid Customization Changes (Performance)

**Problem**: User drags color picker rapidly → 100+ state updates/second → UI freezes

**Solution**:
```typescript
// Debounce handleSet in temporal middleware
handleSet: (handleSet) => {
  let timeout: NodeJS.Timeout | null = null;

  return (state) => {
    if (timeout) clearTimeout(timeout);

    timeout = setTimeout(() => {
      handleSet(state);
      timeout = null;
    }, 180); // Group changes within 180ms
  };
},
```

**Alternative**: Use `requestAnimationFrame` for visual updates
```typescript
let rafId: number | null = null;

const handleColorChange = (color: HslColor) => {
  if (rafId) cancelAnimationFrame(rafId);

  rafId = requestAnimationFrame(() => {
    updateCustomization(templateId, { colors: { primary: formatHsl(color) } });
    rafId = null;
  });
};
```

---

### Invalid Color Values (Validation)

**Problem**: User manually types invalid HSL string → preview breaks

**Solution**:
```typescript
// Validate HSL before applying
function isValidHsl(hsl: string): boolean {
  const match = hsl.match(/^(\d+)\s+(\d+)%\s+(\d+)%$/);
  if (!match) return false;

  const [_, h, s, l] = match.map(Number);
  return h >= 0 && h <= 360 && s >= 0 && s <= 100 && l >= 0 && l <= 100;
}

// In color picker
const handleManualInput = (value: string) => {
  if (isValidHsl(value)) {
    onChange(value);
  } else {
    // Show error or revert to previous value
    setError('Invalid HSL format. Use: "H S% L%" (e.g., "225 52% 8%")');
  }
};
```

---

### Font Loading Failures (Fallbacks)

**Problem**: Google Fonts CDN down → fonts don't load → fallback font used but metrics don't match

**Solution**:
```typescript
// Use font-display: optional + adjustFontFallback
export const inter = Inter({
  display: 'optional',         // Show fallback if font not loaded in 100ms
  adjustFontFallback: 'Arial', // Calculate metric overrides for Arial
  fallback: [
    '-apple-system',
    'BlinkMacSystemFont',
    'Arial',
    'sans-serif'
  ],
});

// Detect font load failure
useEffect(() => {
  const checkFontLoad = async () => {
    try {
      await document.fonts.load('16px Inter');
      console.log('Inter loaded successfully');
    } catch (error) {
      console.warn('Inter failed to load, using fallback');
      // Optionally notify user or log to analytics
    }
  };

  checkFontLoad();
}, []);
```

---

### localStorage Quota Exceeded

**Problem**: User has 5MB+ data in localStorage from other apps → customizations fail to persist

**Solution**: See Section 4 (Edge Cases)

---

### Color Contrast Failure (WCAG)

**Problem**: User picks color combination with poor contrast → text unreadable

**Solution**:
```typescript
// Show warning, but don't block (user may have good reason)
const handleColorChange = (key: string, value: string) => {
  updateCustomization(templateId, { colors: { [key]: value } });

  // Check contrast after update
  if (key === 'primary' || key === 'text' || key === 'background') {
    const result = meetsWCAG_AA(
      customizations.colors.text,
      customizations.colors.background
    );

    if (!result.passes) {
      toast.warning(
        `Low contrast (${result.ratio}:1). WCAG AA requires ${result.required}:1 for readability.`,
        {
          action: {
            label: 'Auto-fix',
            onClick: () => autoAdjustContrast(),
          },
        }
      );
    }
  }
};

// Auto-adjust lightness to meet contrast
function autoAdjustContrast() {
  const fg = customizations.colors.text;
  const bg = customizations.colors.background;

  let [h, s, l] = fg.split(' ').map(parseFloat);

  // Darken foreground until contrast is sufficient
  while (l > 0) {
    l -= 5;
    const newFg = `${h} ${s}% ${l}%`;
    if (meetsWCAG_AA(newFg, bg).passes) {
      updateCustomization(templateId, { colors: { text: newFg } });
      break;
    }
  }
}
```

---

## 12. Performance Benchmarks

### Target Metrics

| Operation | Target | Measurement Method |
|-----------|--------|-------------------|
| CSS variable update | <5ms | `performance.now()` before/after `setProperty()` |
| Color picker drag | 60fps | Chrome DevTools Performance tab, no dropped frames |
| Font change | <100ms | Time from onChange to preview re-render |
| Preset theme apply | <50ms | Time from click to preview update |
| Template re-render | <120ms | Debounced document update → paint |
| Undo/redo action | <50ms | Time from click to state update |
| localStorage save | <10ms | `performance.now()` before/after `setItem()` |

### Measurement Code

```typescript
// hooks/usePerformanceMonitor.ts
import { useEffect, useRef } from 'react';

export function usePerformanceMonitor(label: string, dependencies: any[]) {
  const startTime = useRef<number>(0);

  useEffect(() => {
    startTime.current = performance.now();

    return () => {
      const duration = performance.now() - startTime.current;
      if (duration > 100) { // Log slow operations
        console.warn(`[Performance] ${label} took ${duration.toFixed(2)}ms`);
      }
    };
  }, dependencies);
}

// Usage
export function CustomizationPanel() {
  const customizations = useCustomizationStore(state => state.customizations);

  usePerformanceMonitor('CustomizationPanel render', [customizations]);

  // ... component
}
```

### Optimization Checklist

- [ ] useMemo for expensive calculations (template rendering)
- [ ] useCallback for event handlers passed to children
- [ ] React.memo for pure presentational components
- [ ] Debounce rapid updates (color picker drag, typing)
- [ ] Lazy load non-critical fonts
- [ ] Code split per template (dynamic import)
- [ ] Virtual scrolling for long customization panels
- [ ] Batch CSS variable updates in single useEffect
- [ ] Use will-change for frequently animated properties
- [ ] Avoid inline function definitions in render loops

---

## Conclusion

This research dossier provides comprehensive technical guidance for implementing ResumePair's Phase 3 customization system. Key recommendations:

1. **Colors**: HSL format with CSS variables, react-colorful for picking, WCAG validation
2. **Fonts**: next/font with font-display: optional, metric overrides for fallbacks
3. **State**: Zustand + persist (localStorage) + temporal (undo/redo)
4. **Sync**: Immediate CSS updates, debounced document renders (100ms), debounced API (2000ms)
5. **Presets**: Flat JSON structure with 10+ themes, user custom themes supported
6. **UI**: shadcn/ui components, tabbed panel, mobile-responsive bottom sheet

All patterns are proven in production OSS projects (shadcn/ui, Radix Themes, Chakra UI) and optimized for ResumePair's constraints (Next.js 14, React 18, TypeScript strict mode, CSS variables, no external UI libs beyond shadcn).

Implementation roadmap spans 4 weeks with incremental deliverables and comprehensive testing at each phase gate.

**Primary Decision**: Use HSL + CSS variables + react-colorful + Zustand persist + next/font

**Fallback Option**: If localStorage quota issues persist, migrate customizations to IndexedDB using idb-keyval with async hydration handling

---

**End of Research Dossier**
