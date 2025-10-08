import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { SkillItem } from '@/types/resume'

export const SKILL_LEVEL_LABELS = ['Hidden', 'Beginner', 'Developing', 'Competent', 'Proficient', 'Expert'] as const

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function normalizeSkillNames(items: Array<string | SkillItem | undefined | null>): string[] {
  return items
    .map((item) => {
      if (!item) return ''
      if (typeof item === 'string') return item
      return item.name ?? ''
    })
    .filter((value) => value.trim().length > 0)
}

export function getSkillLevelLabel(level?: number): string {
  if (typeof level !== 'number' || Number.isNaN(level)) {
    return 'Unrated'
  }
  const index = Math.max(0, Math.min(SKILL_LEVEL_LABELS.length - 1, Math.round(level)))
  return SKILL_LEVEL_LABELS[index]
}
