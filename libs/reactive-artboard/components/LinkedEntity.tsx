'use client'

import { Globe } from 'lucide-react'
import { Link } from './Link'
import { cn, isUrl } from '../utils'

type Url = {
  href: string
  label?: string
}

type LinkedEntityProps = {
  name: string
  url: Url
  separateLinks: boolean
  className?: string
}

export function LinkedEntity({ name, url, separateLinks, className }: LinkedEntityProps) {
  if (!separateLinks && isUrl(url.href)) {
    return (
      <Link
        url={url}
        label={name}
        icon={<Globe className="h-4 w-4 text-primary" strokeWidth={2.5} />}
        iconOnRight
        className={className}
      />
    )
  }

  return <div className={cn(className)}>{name}</div>
}
