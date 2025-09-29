/**
 * Design Tokens - Type-Safe Access to CSS Variables
 *
 * Provides TypeScript types and utilities for accessing the Ramp design system tokens.
 * All tokens are defined in app/globals.css and accessible via CSS variables.
 */

/* ========================================
   COLOR TOKENS
   ======================================== */

export const AppColors = {
  // Ramp Base Colors
  navyDark: 'hsl(var(--app-navy-dark))',
  navyMedium: 'hsl(var(--app-navy-medium))',
  black: 'hsl(var(--app-black))',
  white: 'hsl(var(--app-white))',

  // Accent Colors
  lime: 'hsl(var(--app-lime))',
  limeHover: 'hsl(var(--app-lime-hover))',
  limeDark: 'hsl(var(--app-lime-dark))',

  // Semantic Colors (adapt to light/dark mode)
  background: 'hsl(var(--app-background))',
  foreground: 'hsl(var(--app-foreground))',
  primary: 'hsl(var(--app-primary))',
  primaryForeground: 'hsl(var(--app-primary-foreground))',
  secondary: 'hsl(var(--app-secondary))',
  secondaryForeground: 'hsl(var(--app-secondary-foreground))',
  muted: 'hsl(var(--app-muted))',
  mutedForeground: 'hsl(var(--app-muted-foreground))',
  accent: 'hsl(var(--app-accent))',
  accentForeground: 'hsl(var(--app-accent-foreground))',
  border: 'hsl(var(--app-border))',
  input: 'hsl(var(--app-input))',
  ring: 'hsl(var(--app-ring))',

  // Gray Scale
  gray: {
    50: 'hsl(var(--app-gray-50))',
    100: 'hsl(var(--app-gray-100))',
    200: 'hsl(var(--app-gray-200))',
    300: 'hsl(var(--app-gray-300))',
    500: 'hsl(var(--app-gray-500))',
    700: 'hsl(var(--app-gray-700))',
    900: 'hsl(var(--app-gray-900))',
  },
} as const;

export const DocumentColors = {
  primary: 'hsl(var(--doc-primary))',
  surface: 'hsl(var(--doc-surface))',
  foreground: 'hsl(var(--doc-foreground))',
  muted: 'hsl(var(--doc-muted))',
  accent: 'hsl(var(--doc-accent))',
  border: 'hsl(var(--doc-border))',
} as const;

/* ========================================
   TYPOGRAPHY TOKENS
   ======================================== */

export const FontSizes = {
  xs: 'var(--text-xs)',
  sm: 'var(--text-sm)',
  base: 'var(--text-base)',
  lg: 'var(--text-lg)',
  xl: 'var(--text-xl)',
  '2xl': 'var(--text-2xl)',
  '3xl': 'var(--text-3xl)',
  '4xl': 'var(--text-4xl)',
  '5xl': 'var(--text-5xl)',
  '6xl': 'var(--text-6xl)',
  '7xl': 'var(--text-7xl)',
} as const;

export const FontWeights = {
  normal: 'var(--font-normal)',
  medium: 'var(--font-medium)',
  semibold: 'var(--font-semibold)',
  bold: 'var(--font-bold)',
} as const;

export const LineHeights = {
  tight: 'var(--leading-tight)',
  snug: 'var(--leading-snug)',
  normal: 'var(--leading-normal)',
  relaxed: 'var(--leading-relaxed)',
} as const;

export const LetterSpacing = {
  tight: 'var(--tracking-tight)',
  normal: 'var(--tracking-normal)',
  wide: 'var(--tracking-wide)',
} as const;

export const FontFamilies = {
  sans: 'var(--font-sans)',
  serif: 'var(--font-serif)',
  mono: 'var(--font-mono)',
} as const;

/* ========================================
   SPACING TOKENS
   ======================================== */

export const Spacing = {
  1: 'var(--space-1)',
  2: 'var(--space-2)',
  3: 'var(--space-3)',
  4: 'var(--space-4)',
  5: 'var(--space-5)',
  6: 'var(--space-6)',
  8: 'var(--space-8)',
  10: 'var(--space-10)',
  12: 'var(--space-12)',
  16: 'var(--space-16)',
  20: 'var(--space-20)',
  24: 'var(--space-24)',
  32: 'var(--space-32)',
} as const;

export const SectionPadding = {
  mobile: 'var(--section-padding-mobile)',
  desktop: 'var(--section-padding-desktop)',
} as const;

/* ========================================
   RADIUS TOKENS
   ======================================== */

export const BorderRadius = {
  sm: 'var(--radius-sm)',
  md: 'var(--radius-md)',
  lg: 'var(--radius-lg)',
  xl: 'var(--radius-xl)',
  '2xl': 'var(--radius-2xl)',
  full: 'var(--radius-full)',
} as const;

/* ========================================
   SHADOW TOKENS
   ======================================== */

export const Shadows = {
  xs: 'var(--shadow-xs)',
  sm: 'var(--shadow-sm)',
  md: 'var(--shadow-md)',
  lg: 'var(--shadow-lg)',
  xl: 'var(--shadow-xl)',
  '2xl': 'var(--shadow-2xl)',
} as const;

/* ========================================
   TRANSITION TOKENS
   ======================================== */

export const Transitions = {
  fast: 'var(--transition-fast)',
  base: 'var(--transition-base)',
  slow: 'var(--transition-slow)',
} as const;

/* ========================================
   GRADIENT TOKENS
   ======================================== */

export const Gradients = {
  hero: 'var(--gradient-hero)',
  section: 'var(--gradient-section)',
} as const;

/* ========================================
   HELPER UTILITIES
   ======================================== */

/**
 * Get a color token as a CSS variable reference
 * @param scope - 'app' or 'doc'
 * @param token - The token name (e.g., 'primary', 'gray-500')
 * @returns CSS variable reference (e.g., 'hsl(var(--app-primary))')
 *
 * @example
 * ```tsx
 * <div style={{ color: getColorToken('app', 'primary') }}>
 *   Text in primary color
 * </div>
 * ```
 */
export function getColorToken(
  scope: 'app' | 'doc',
  token: string
): string {
  return `hsl(var(--${scope}-${token}))`;
}

/**
 * Get a spacing token as a CSS variable reference
 * @param size - The spacing size (1-32)
 * @returns CSS variable reference (e.g., 'var(--space-4)')
 *
 * @example
 * ```tsx
 * <div style={{ padding: getSpacing(4) }}>
 *   Content with 16px padding
 * </div>
 * ```
 */
export function getSpacing(size: keyof typeof Spacing): string {
  return Spacing[size];
}

/**
 * Get a typography token for inline styles
 * @param property - 'size' | 'weight' | 'lineHeight' | 'letterSpacing' | 'family'
 * @param value - The token key
 * @returns CSS variable reference
 *
 * @example
 * ```tsx
 * <h1 style={{
 *   fontSize: getTypography('size', '4xl'),
 *   fontWeight: getTypography('weight', 'bold'),
 * }}>
 *   Headline
 * </h1>
 * ```
 */
export function getTypography(
  property: 'size' | 'weight' | 'lineHeight' | 'letterSpacing' | 'family',
  value: string
): string {
  const maps = {
    size: FontSizes,
    weight: FontWeights,
    lineHeight: LineHeights,
    letterSpacing: LetterSpacing,
    family: FontFamilies,
  };

  return (maps[property] as any)[value] || '';
}

/* ========================================
   TYPE EXPORTS
   ======================================== */

export type AppColorToken = keyof typeof AppColors;
export type DocumentColorToken = keyof typeof DocumentColors;
export type FontSizeToken = keyof typeof FontSizes;
export type FontWeightToken = keyof typeof FontWeights;
export type LineHeightToken = keyof typeof LineHeights;
export type LetterSpacingToken = keyof typeof LetterSpacing;
export type FontFamilyToken = keyof typeof FontFamilies;
export type SpacingToken = keyof typeof Spacing;
export type RadiusToken = keyof typeof BorderRadius;
export type ShadowToken = keyof typeof Shadows;
export type TransitionToken = keyof typeof Transitions;
export type GradientToken = keyof typeof Gradients;

/* ========================================
   USAGE EXAMPLES
   ======================================== */

/**
 * Example 1: Using tokens in a component with inline styles
 *
 * ```tsx
 * import { AppColors, FontSizes, Spacing } from '@/libs/design-tokens';
 *
 * function MyComponent() {
 *   return (
 *     <div style={{
 *       backgroundColor: AppColors.background,
 *       color: AppColors.foreground,
 *       padding: Spacing[4],
 *       fontSize: FontSizes.lg,
 *     }}>
 *       Content
 *     </div>
 *   );
 * }
 * ```
 *
 * Example 2: Using helper functions
 *
 * ```tsx
 * import { getColorToken, getSpacing, getTypography } from '@/libs/design-tokens';
 *
 * function MyComponent() {
 *   return (
 *     <div style={{
 *       backgroundColor: getColorToken('app', 'primary'),
 *       padding: getSpacing(6),
 *       fontSize: getTypography('size', '2xl'),
 *       fontWeight: getTypography('weight', 'bold'),
 *     }}>
 *       Content
 *     </div>
 *   );
 * }
 * ```
 *
 * Example 3: Document-scoped tokens for templates
 *
 * ```tsx
 * import { DocumentColors } from '@/libs/design-tokens';
 *
 * function ResumeTemplate() {
 *   return (
 *     <div className="doc-theme" style={{
 *       backgroundColor: DocumentColors.surface,
 *       color: DocumentColors.foreground,
 *     }}>
 *       Resume content
 *     </div>
 *   );
 * }
 * ```
 */