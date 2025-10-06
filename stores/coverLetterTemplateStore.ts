/**
 * Cover Letter Template Store
 *
 * Zustand store for managing cover letter template selection and customizations.
 * Persists user preferences to localStorage.
 *
 * @module stores/coverLetterTemplateStore
 */

'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { z } from 'zod'
import {
  CoverLetterTemplateSlug,
  CoverLetterCustomizations,
} from '@/types/cover-letter-template'
import {
  getCoverLetterTemplate,
  getDefaultCoverLetterTemplateSlug,
} from '@/libs/templates/cover-letter/registry'

/**
 * Validation schema for persisted state
 *
 * Ensures localStorage data is valid before restoring to prevent crashes
 * from corrupt or manually edited data.
 */
const PersistedStateSchema = z.object({
  templateId: z.enum(['classic-block', 'modern-minimal', 'creative-bold', 'executive-formal']),
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
        paragraphGap: z.number().min(8).max(20),
        pagePadding: z.number().min(24).max(96),
      }),
    })
    .optional(),
})

/**
 * Cover letter template state interface
 */
interface CoverLetterTemplateState {
  // Current template
  templateId: CoverLetterTemplateSlug

  // Customizations for current template
  customizations: CoverLetterCustomizations

  // Actions
  selectTemplate: (templateId: CoverLetterTemplateSlug) => void
  updateCustomization: <K extends keyof CoverLetterCustomizations>(
    key: K,
    value: CoverLetterCustomizations[K]
  ) => void
  updateCustomizations: (customizations: Partial<CoverLetterCustomizations>) => void
  resetCustomizations: () => void
  resetToTemplateDefaults: (templateId: CoverLetterTemplateSlug) => void
}

/**
 * Cover letter template store with persistence
 *
 * Manages template selection and customization state for cover letters.
 * Persists to localStorage for cross-session consistency.
 */
export const useCoverLetterTemplateStore = create<CoverLetterTemplateState>()(
  persist(
    (set, get) => ({
      // Initial state
      templateId: getDefaultCoverLetterTemplateSlug(),
      customizations: getCoverLetterTemplate(getDefaultCoverLetterTemplateSlug()).defaults,

      // Actions
      /**
       * Select a template and load its default customizations
       */
      selectTemplate: (templateId: CoverLetterTemplateSlug) => {
        const template = getCoverLetterTemplate(templateId)
        set({
          templateId,
          customizations: template.defaults,
        })
      },

      /**
       * Update a single customization category
       */
      updateCustomization: <K extends keyof CoverLetterCustomizations>(
        key: K,
        value: CoverLetterCustomizations[K]
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
      updateCustomizations: (customizations: Partial<CoverLetterCustomizations>) => {
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
        const template = getCoverLetterTemplate(templateId)
        set({
          customizations: template.defaults,
        })
      },

      /**
       * Reset customizations to a specific template's defaults
       */
      resetToTemplateDefaults: (templateId: CoverLetterTemplateSlug) => {
        const template = getCoverLetterTemplate(templateId)
        set({
          customizations: template.defaults,
        })
      },
    }),
    {
      name: 'cover-letter-template-store', // localStorage key
      // Only persist essential state
      partialize: (state) => ({
        templateId: state.templateId,
        customizations: state.customizations,
      }),
      // Validate persisted data before restoring
      merge: (persistedState, currentState) => {
        const validation = PersistedStateSchema.safeParse(persistedState)

        if (!validation.success) {
          // Invalid data - log warning and use defaults
          console.warn(
            'Invalid cover letter template localStorage data detected, resetting to defaults:',
            validation.error.format()
          )
          return currentState
        }

        // Verify template exists in registry
        try {
          getCoverLetterTemplate(validation.data.templateId)
        } catch (error) {
          console.warn(
            `Cover letter template '${validation.data.templateId}' not found in registry, using default template`
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
export const useCoverLetterTemplateId = () =>
  useCoverLetterTemplateStore((state) => state.templateId)
export const useCoverLetterCustomizations = () =>
  useCoverLetterTemplateStore((state) => state.customizations)
export const useCoverLetterColors = () =>
  useCoverLetterTemplateStore((state) => state.customizations.colors)
export const useCoverLetterTypography = () =>
  useCoverLetterTemplateStore((state) => state.customizations.typography)
export const useCoverLetterSpacing = () =>
  useCoverLetterTemplateStore((state) => state.customizations.spacing)
