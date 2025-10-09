'use client'

import { Link2 } from 'lucide-react'
import { cn, isUrl } from '../utils'

type Url = {
  href: string
  label?: string
}

type LinkProps = {
  url: Url
  icon?: React.ReactNode
  iconOnRight?: boolean
  label?: string
  className?: string
}

export function Link({ url, icon, iconOnRight, label, className }: LinkProps) {
  if (!isUrl(url?.href)) return null

  const content = label ?? url.label ?? url.href

  return (
    <div className="flex items-center gap-x-1.5">
      {!iconOnRight && (icon ?? <Link2 className="h-4 w-4 text-primary" strokeWidth={2.5} />)}
      <a
        href={url.href}
        target="_blank"
        rel="noreferrer noopener nofollow"
        className={cn('inline-block', className)}
      >
        {content}
      </a>
      {iconOnRight && (icon ?? <Link2 className="h-4 w-4 text-primary" strokeWidth={2.5} />)}
    </div>
  )
}
