/**
 * Template System Types
 *
 * Type definitions for resume templates, customizations, and rendering modes.
 * These types support the template registry and customization system.
 *
 * @module types/template
 */

import { ResumeJson } from './resume'

/**
 * Template category for organization and filtering
 */
export type TemplateCategory = 'minimal' | 'modern' | 'classic' | 'creative' | 'technical' | 'executive'

/**
 * Template slug - unique identifier for each template
 */
export type TemplateSlug = 'minimal' | 'modern' | 'classic' | 'creative' | 'technical' | 'executive'

/**
 * Rendering mode for templates
 * - edit: Interactive editing mode (live preview)
 * - preview: Read-only preview mode
 * - print: Print/PDF export mode
 */
export type TemplateMode = 'edit' | 'preview' | 'print'

/**
 * Color scheme customization
 * All colors stored as HSL values in space-separated format: "h s% l%"
 * Example: "225 52% 8%" for navy
 */
export interface ColorScheme {
  primary: string       // Main heading color
  secondary: string     // Subheading color
  accent: string        // Accent color (links, icons)
  text: string          // Body text color
  background: string    // Background color
  muted: string         // Muted text color (dates, meta)
  border: string        // Border/divider color
}

/**
 * Typography customization
 */
export interface Typography {
  fontFamily: string    // Font family name (e.g., 'Inter', 'Source Serif 4')
  fontSize: number      // Font size scale multiplier (0.8 to 1.2)
  lineHeight: number    // Line height multiplier (1.0 to 1.5)
  fontWeight: number    // Base font weight (400, 500, 600)
}

/**
 * Spacing customization
 * All values in pixels
 */
export interface Spacing {
  sectionGap: number    // Gap between sections (12-48px)
  itemGap: number       // Gap between items within sections (8-24px)
  pagePadding: number   // Page margins (24-72px)
}

/**
 * Icon settings
 */
export interface IconSettings {
  enabled: boolean      // Show/hide icons
  style: 'outline' | 'solid'  // Icon style
  size: number          // Icon size in pixels (12-20px)
  color: string         // Icon color ('currentColor' or HSL)
}

/**
 * Layout settings
 */
export interface LayoutSettings {
  columns: 1 | 2        // Single or two-column layout
  sidebarPosition: 'left' | 'right' | null  // Sidebar position (null for single column)
  headerAlignment: 'left' | 'center'  // Profile header alignment
  photoPosition: 'header' | 'sidebar' | null  // Photo placement
}

/**
 * Complete customizations object
 * Stored in resumes.customizations JSONB column
 */
export interface Customizations {
  colors: ColorScheme
  typography: Typography
  spacing: Spacing
  icons: IconSettings
  layout: LayoutSettings
}

/**
 * Template metadata
 * Describes a template for display in template picker
 */
export interface TemplateMetadata {
  id: TemplateSlug
  name: string
  category: TemplateCategory
  description: string
  thumbnail: string     // Path to thumbnail image
  features: string[]    // List of key features (e.g., "ATS-friendly", "Icons")
  version: string       // Template version (semver)
  atsScore?: number     // Pre-calculated ATS friendliness score (0-100)
}

/**
 * Template component props
 * Passed to all template components
 */
export interface TemplateProps {
  data: ResumeJson
  customizations?: Customizations
  mode?: TemplateMode
}

/**
 * Template registry entry
 * Combines component reference with metadata
 */
export interface ResumeTemplate {
  component: React.ComponentType<TemplateProps>
  metadata: TemplateMetadata
  defaults: Customizations  // Default customizations for this template
}

/**
 * Default customizations factory
 * Creates default customizations matching the Ramp design system
 */
export function createDefaultCustomizations(): Customizations {
  return {
    colors: {
      primary: '225 52% 8%',      // Navy dark
      secondary: '226 36% 16%',   // Navy medium
      accent: '73 100% 50%',      // Lime
      text: '210 11% 15%',        // Gray 900
      background: '0 0% 100%',    // White
      muted: '210 11% 46%',       // Gray 500
      border: '210 16% 93%',      // Gray 200
    },
    typography: {
      fontFamily: 'Inter',
      fontSize: 1.0,
      lineHeight: 1.4,
      fontWeight: 400,
    },
    spacing: {
      sectionGap: 24,
      itemGap: 12,
      pagePadding: 48,
    },
    icons: {
      enabled: false,
      style: 'outline',
      size: 16,
      color: 'currentColor',
    },
    layout: {
      columns: 1,
      sidebarPosition: null,
      headerAlignment: 'left',
      photoPosition: null,
    },
  }
}

/**
 * Template-specific default customizations
 * Each template can override specific values
 */
export function createTemplateDefaults(templateId: TemplateSlug): Customizations {
  const base = createDefaultCustomizations()

  switch (templateId) {
    case 'minimal':
      return {
        ...base,
        icons: { ...base.icons, enabled: false },
        spacing: { ...base.spacing, sectionGap: 32 },
      }

    case 'modern':
      return {
        ...base,
        icons: { ...base.icons, enabled: true, style: 'outline' },
        spacing: { ...base.spacing, sectionGap: 28 },
      }

    case 'classic':
      return {
        ...base,
        typography: { ...base.typography, fontFamily: 'Source Serif 4' },
        icons: { ...base.icons, enabled: false },
        spacing: { ...base.spacing, sectionGap: 20 },
      }

    case 'creative':
      return {
        ...base,
        icons: { ...base.icons, enabled: true, style: 'solid' },
        layout: { ...base.layout, columns: 2, sidebarPosition: 'left' },
      }

    case 'technical':
      return {
        ...base,
        typography: { ...base.typography, fontFamily: 'JetBrains Mono', fontSize: 0.95 },
        icons: { ...base.icons, enabled: true, style: 'outline' },
      }

    case 'executive':
      return {
        ...base,
        typography: { ...base.typography, fontFamily: 'Source Serif 4', fontSize: 1.05 },
        spacing: { ...base.spacing, sectionGap: 36, pagePadding: 56 },
        layout: { ...base.layout, headerAlignment: 'center' },
      }

    default:
      return base
  }
}
