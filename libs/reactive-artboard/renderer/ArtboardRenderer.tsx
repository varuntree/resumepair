'use client'

import * as React from 'react'
import { ArtboardDocument } from '../types'
import { getTemplateRenderer } from '../templates'
import { buildArtboardStyles } from '../styles'
import { Page } from '../components/Page'
import type { SectionKey } from '../schema'

type ArtboardRendererProps = {
  document: ArtboardDocument
}

export function ArtboardRenderer({ document }: ArtboardRendererProps): React.ReactElement {
  const Template = getTemplateRenderer(document.template)
  const style = React.useMemo(() => buildArtboardStyles(document.metadata), [document.metadata])

  return (
    <div className="artboard-root" style={{ backgroundColor: 'var(--artboard-color-background)' }}>
      <style dangerouslySetInnerHTML={{ __html: style }} />
      {document.layout.map((columns, pageIndex) => (
        <Page key={pageIndex} mode="preview" pageNumber={pageIndex + 1}>
          <Template columns={columns as SectionKey[][]} isFirstPage={pageIndex === 0} />
        </Page>
      ))}
    </div>
  )
}
