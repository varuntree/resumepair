export const MM_TO_PX = 3.78

export const PAGE_SIZE_MM = {
  a4: { width: 210, height: 297 },
  letter: { width: 215.9, height: 279.4 },
} as const

export type PageFormat = keyof typeof PAGE_SIZE_MM

export const DEFAULT_PAGE_FORMAT: PageFormat = 'a4'

export const PREVIEW_PAGE_GAP_PX = 32

export function normalizePageFormat(format: string | undefined | null): PageFormat {
  const normalized = (format ?? DEFAULT_PAGE_FORMAT).toString().trim().toLowerCase()
  if (normalized in PAGE_SIZE_MM) {
    return normalized as PageFormat
  }
  return DEFAULT_PAGE_FORMAT
}
