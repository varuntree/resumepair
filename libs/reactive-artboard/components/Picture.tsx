'use client'

import { cn, isUrl } from '../utils'
import { useArtboardStore } from '../store/artboard'

type PictureProps = {
  className?: string
}

export function Picture({ className }: PictureProps) {
  const picture = useArtboardStore((state) => state.resume.basics.picture)
  const fontSize = useArtboardStore((state) => state.resume.metadata.typography.font.size)

  if (!picture || !isUrl(picture.url) || picture.effects.hidden) {
    return null
  }

  const borderWidth = picture.effects.border ? fontSize / 3 : 0

  return (
    <img
      src={picture.url}
      alt="Profile"
      className={cn(
        'relative z-20 object-cover',
        picture.effects.border && 'border-primary',
        picture.effects.grayscale && 'grayscale',
        className
      )}
      style={{
        maxWidth: `${picture.size}px`,
        aspectRatio: `${picture.aspectRatio}`,
        borderRadius: `${picture.borderRadius}px`,
        borderWidth: `${borderWidth}px`,
      }}
    />
  )
}
