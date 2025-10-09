import DOMPurify from 'isomorphic-dompurify'
import { cn as baseCn } from '@/libs/utils'

export const cn = baseCn

export function isUrl(value?: string | null): boolean {
  if (!value) return false
  return /^https?:\/\//i.test(value)
}

export function isEmptyString(value?: string | null): boolean {
  if (value === undefined || value === null) return true
  if (value === '<p></p>') return true
  return value.trim().length === 0
}

export function sanitize(html: string, options?: DOMPurify.Config): string {
  if (!html) return ''
  const defaultConfig: DOMPurify.Config = {
    ALLOWED_TAGS: [
      'a',
      'abbr',
      'address',
      'article',
      'aside',
      'b',
      'bdi',
      'bdo',
      'blockquote',
      'br',
      'caption',
      'cite',
      'code',
      'col',
      'colgroup',
      'data',
      'dd',
      'dfn',
      'div',
      'dl',
      'dt',
      'em',
      'figcaption',
      'figure',
      'footer',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'header',
      'hgroup',
      'hr',
      'i',
      'img',
      'kbd',
      'li',
      'main',
      'mark',
      'nav',
      'ol',
      'p',
      'pre',
      'q',
      'ruby',
      's',
      'samp',
      'section',
      'small',
      'span',
      'strong',
      'sub',
      'sup',
      'table',
      'tbody',
      'td',
      'tfoot',
      'th',
      'thead',
      'time',
      'tr',
      'u',
      'ul',
      'var',
      'wbr',
    ],
    ALLOWED_ATTR: {
      '*': ['class', 'style'],
      a: ['href', 'target', 'rel'],
      img: ['src', 'alt'],
    },
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel|sms):|[^a-z]|[a-z+\.\-]+(?:[^a-z+\.\-:]|$))/i,
  }

  return DOMPurify.sanitize(html, {
    ...defaultConfig,
    ...options,
    ALLOWED_TAGS: options?.ALLOWED_TAGS ?? defaultConfig.ALLOWED_TAGS,
    ALLOWED_ATTR: options?.ALLOWED_ATTR ?? defaultConfig.ALLOWED_ATTR,
  })
}

export function linearTransform(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  if (inMax === inMin) {
    return value === inMax ? outMin : Number.NaN
  }
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin
}

export function hexToRgb(hex: string, alpha = 0): string {
  if (!/^#?[0-9a-f]{6}$/i.test(hex)) {
    return hex
  }
  const normalized = hex.startsWith('#') ? hex : `#${hex}`
  const r = Number.parseInt(normalized.slice(1, 3), 16)
  const g = Number.parseInt(normalized.slice(3, 5), 16)
  const b = Number.parseInt(normalized.slice(5, 7), 16)
  return alpha ? `rgba(${r}, ${g}, ${b}, ${alpha})` : `rgb(${r}, ${g}, ${b})`
}
