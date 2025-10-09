'use client'

import { forwardRef } from 'react'
import { cn, isUrl } from '../utils'

type BrandIconProps = {
  slug: string
  className?: string
}

const SIMPLE_ICONS_BASE = 'https://cdn.simpleicons.org'

export const BrandIcon = forwardRef<HTMLImageElement, BrandIconProps>(({ slug, className }, ref) => {
  const normalized = (slug || '').toLowerCase()
  const href = isUrl(slug) ? slug : `${SIMPLE_ICONS_BASE}/${encodeURIComponent(normalized || 'link')}`

  return <img ref={ref} alt={slug} className={cn('h-4 w-4', className)} src={href} />
})

BrandIcon.displayName = 'BrandIcon'
