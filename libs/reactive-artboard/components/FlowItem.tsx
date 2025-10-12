'use client'

import * as React from 'react'
import { cn } from '../utils'

type FlowItemProps<T extends keyof JSX.IntrinsicElements = 'div'> = {
  as?: T
  children: React.ReactNode
  className?: string
  splittable?: boolean
  groupId?: string
} & JSX.IntrinsicElements[T]

export function FlowItem<T extends keyof JSX.IntrinsicElements = 'div'>({
  as,
  children,
  className,
  splittable = false,
  groupId,
  ...rest
}: FlowItemProps<T>): React.ReactElement {
  const Component = (as ?? 'div') as keyof JSX.IntrinsicElements

  return (
    <Component
      className={cn(className)}
      data-flow-item="true"
      data-flow-splittable={splittable ? 'true' : 'false'}
      {...(groupId ? { 'data-flow-group': groupId } : {})}
      {...(rest as object)}
    >
      {children}
    </Component>
  )
}
