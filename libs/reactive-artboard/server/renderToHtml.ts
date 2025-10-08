import { ArtboardDocument } from '../types'
import { getTemplateRenderer } from '../templates'
import { buildArtboardStyles } from '../styles'

export async function renderArtboardToHtml(document: ArtboardDocument): Promise<string> {
  const React = await import('react')
  const { renderToStaticMarkup } = await import('react-dom/server')
  const Template = getTemplateRenderer(document.template)
  const element = React.createElement(Template, { document })
  const styles = buildArtboardStyles(document.metadata, { includePageRule: true })
  const markup = renderToStaticMarkup(element)

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>${styles}</style>
</head>
<body>
${markup}
</body>
</html>`
}
