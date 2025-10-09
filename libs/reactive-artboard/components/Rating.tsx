'use client'

import { cn } from '../utils'

type RatingProps = {
  level: number
  max?: number
}

export function Rating({ level, max = 5 }: RatingProps) {
  const items = Array.from({ length: max })
  return (
    <div className="flex items-center gap-x-1.5">
      {items.map((_, index) => (
        <div
          key={index}
          className={cn('size-3 rounded border-2 border-primary', level > index && 'bg-primary')}
        />
      ))}
    </div>
  )
}
