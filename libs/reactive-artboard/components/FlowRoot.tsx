'use client'

import * as React from 'react'
import { cn } from '../utils'

type FlowRootProps = React.HTMLAttributes<HTMLDivElement> & {
  children: React.ReactNode
}

export const FlowRoot = React.forwardRef<HTMLDivElement, FlowRootProps>(function FlowRootInternal(
  { children, className, ...rest },
  ref
) {
  return (
    <div ref={ref} className={cn(className)} data-flow-root="true" {...rest}>
      {children}
    </div>
  )
})
