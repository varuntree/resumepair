/**
 * Template Store
 *
 * Zustand store for managing template selection and customizations.
 * Persists user preferences to localStorage.
 *
 * @module stores/templateStore
 */

'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { z } from 'zod'
import { TemplateSlug, Customizations } from '@/types/template'
import { getTemplate, getDefaultTemplateSlug } from '@/libs/templates/registry'

/**
 * Validation schema for persisted state
 *
 * Ensures localStorage data is valid before restoring to prevent crashes
 * from corrupt or manually edited data.
 */
const PersistedStateSchema = z.object({
  templateId: z.enum(['minimal', 'modern', 'classic', 'creative', 'technical', 'executive']),
  customizations: z
    .object({
      colors: z.object({
        primary: z.string(),
        secondary: z.string(),
        accent: z.string(),
        text: z.string(),
        background: z.string(),
        muted: z.string(),
        border: z.string(),
      }),
      typography: z.object({
        fontFamily: z.string(),
        fontSize: z.number().min(0.8).max(1.2),
        lineHeight: z.number().min(1.0).max(1.8),
        fontWeight: z.number().min(300).max(700),
      }),
      spacing: z.object({
        sectionGap: z.number().min(12).max(48),
        itemGap: z.number().min(8).max(24),
        pagePadding: z.number().min(24).max(96),
      }),
      icons: z.object({
        enabled: z.boolean(),
        style: z.enum(['solid', 'outline']),
        size: z.number().min(12).max(24),
        color: z.string(), // allow 'currentColor' or HSL
      }),
      layout: z.object({
        columns: z.union([z.literal(1), z.literal(2)]),
        sidebarPosition: z.union([z.literal('left'), z.literal('right'), z.null()]),
        headerAlignment: z.enum(['left', 'center']),
        photoPosition: z.union([z.literal('header'), z.literal('sidebar'), z.null()]),
      }),
    })
    .optional(),
})

/**
 * Template state interface
 */
interface TemplateState {
  // Current template
  templateId: TemplateSlug

  // Customizations for current template
  customizations: Customizations

  // Actions
  selectTemplate: (templateId: TemplateSlug) => void
  updateCustomization: <K extends keyof Customizations>(
    key: K,
    value: Customizations[K]
  ) => void
  updateCustomizations: (customizations: Partial<Customizations>) => void
  resetCustomizations: () => void
  resetToTemplateDefaults: (templateId: TemplateSlug) => void
}

/**
 * Template store with persistence
 *
 * Manages template selection and customization state.
 * Persists to localStorage for cross-session consistency.
 */
export const useTemplateStore = create<TemplateState>()(
  persist(
    (set, get) => ({
      // Initial state
      templateId: getDefaultTemplateSlug(),
      customizations: getTemplate(getDefaultTemplateSlug()).defaults,

      // Actions
      /**
       * Select a template and load its default customizations
       */
      selectTemplate: (templateId: TemplateSlug) => {
        const template = getTemplate(templateId)
        set({
          templateId,
          customizations: template.defaults,
        })
      },

      /**
       * Update a single customization category
       */
      updateCustomization: <K extends keyof Customizations>(
        key: K,
        value: Customizations[K]
      ) => {
        set((state) => ({
          customizations: {
            ...state.customizations,
            [key]: value,
          },
        }))
      },

      /**
       * Update multiple customizations at once
       */
      updateCustomizations: (customizations: Partial<Customizations>) => {
        set((state) => ({
          customizations: {
            ...state.customizations,
            ...customizations,
          },
        }))
      },

      /**
       * Reset customizations to current template's defaults
       */
      resetCustomizations: () => {
        const { templateId } = get()
        const template = getTemplate(templateId)
        set({
          customizations: template.defaults,
        })
      },

      /**
       * Reset customizations to a specific template's defaults
       */
      resetToTemplateDefaults: (templateId: TemplateSlug) => {
        const template = getTemplate(templateId)
        set({
          customizations: template.defaults,
        })
      },
    }),
    {
      name: 'template-store', // localStorage key
      // Only persist essential state
      partialize: (state) => ({
        templateId: state.templateId,
        customizations: state.customizations,
      }),
      // Validate persisted data before restoring
      merge: (persistedState, currentState) => {
        // Validate structure with Zod schema
        // Backward-compat coercions
        const coerceLegacy = (state: any) => {
          if (!state || typeof state !== 'object') return state
          const s = { ...state }
          if (s.customizations && s.customizations.layout) {
            const l = { ...s.customizations.layout }
            // sidebarPosition: 'none' -> null
            if (l.sidebarPosition === 'none') l.sidebarPosition = null
            // headerAlignment: disallow 'right' -> coerce to 'left'
            if (l.headerAlignment === 'right') l.headerAlignment = 'left'
            // photoPosition: 'left'|'right'|'none' -> map to header/sidebar/null
            if (l.photoPosition === 'left') l.photoPosition = 'header'
            if (l.photoPosition === 'right') l.photoPosition = 'sidebar'
            if (l.photoPosition === 'none') l.photoPosition = null
            s.customizations.layout = l
          }
          if (s.customizations && s.customizations.icons) {
            const i = { ...s.customizations.icons }
            // icons.color: previously enum; keep existing string
            if (['primary', 'secondary', 'muted'].includes(i.color)) {
              // leave as is; templates interpret via CSS vars if desired
            }
            s.customizations.icons = i
          }
          return s
        }

        const validation = PersistedStateSchema.safeParse(coerceLegacy(persistedState))

        if (!validation.success) {
          // Invalid data - log warning and use defaults
          console.warn(
            'Invalid localStorage data detected, resetting to defaults:',
            validation.error.format()
          )
          return currentState
        }

        // Verify template exists in registry
        try {
          getTemplate(validation.data.templateId)
        } catch (error) {
          console.warn(
            `Template '${validation.data.templateId}' not found in registry, using default template`
          )
          return currentState
        }

        // Valid data - merge with current state
        return {
          ...currentState,
          ...validation.data,
        }
      },
    }
  )
)

/**
 * Selectors for specific parts of the store
 * Use these to optimize re-renders (shallow equality checks)
 */
export const useTemplateId = () => useTemplateStore((state) => state.templateId)
export const useCustomizations = () => useTemplateStore((state) => state.customizations)
export const useColors = () => useTemplateStore((state) => state.customizations.colors)
export const useTypography = () => useTemplateStore((state) => state.customizations.typography)
export const useSpacing = () => useTemplateStore((state) => state.customizations.spacing)
export const useIcons = () => useTemplateStore((state) => state.customizations.icons)
export const useLayout = () => useTemplateStore((state) => state.customizations.layout)
