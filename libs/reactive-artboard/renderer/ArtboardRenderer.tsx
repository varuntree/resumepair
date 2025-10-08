'use client'

import * as React from 'react'
import { ArtboardDocument } from '../types'
import { getTemplateRenderer } from '../templates'
import { buildArtboardStyles } from '../styles'

type ArtboardRendererProps = {
  document: ArtboardDocument
}

export function ArtboardRenderer({ document }: ArtboardRendererProps): React.ReactElement {
  const Template = getTemplateRenderer(document.template)
  const style = React.useMemo(() => buildArtboardStyles(document.metadata), [document.metadata])

  return (
    <div className="artboard-root" style={{ backgroundColor: 'var(--artboard-color-background)' }}>
      <style dangerouslySetInnerHTML={{ __html: style }} />
      <Template document={document} />
    </div>
  )
}
