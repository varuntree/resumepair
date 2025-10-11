import path from 'path'
import { promises as fs } from 'fs'
import { ArtboardDocument } from '../types'
import type { ResumeData, SectionKey } from '../schema'
import { getTemplateRenderer } from '../templates'
import { buildArtboardStyles } from '../styles'
import { setArtboardResume, resetArtboardResume } from '../store/artboard'

let cachedTailwindCss: string | null = null

async function loadTailwindCss(): Promise<string> {
  if (cachedTailwindCss !== null) {
    return cachedTailwindCss
  }

  const filePath = path.join(process.cwd(), 'public', 'artboard', 'tailwind.css')
  try {
    cachedTailwindCss = await fs.readFile(filePath, 'utf8')
  } catch {
    cachedTailwindCss = ''
  }

  return cachedTailwindCss
}

export async function renderArtboardToHtml(
  document: ArtboardDocument,
  resumeData?: ResumeData
): Promise<string> {
  const React = await import('react')
  const { renderToStaticMarkup } = await import('react-dom/server')
  const Template = getTemplateRenderer(document.template)
  if (resumeData) {
    setArtboardResume(resumeData)
  }
  const pages = document.layout.map((columns, pageIndex) =>
    React.createElement(
      'div',
      {
        key: pageIndex,
        'data-page': pageIndex + 1,
        className: 'artboard-page',
      },
      React.createElement(Template, {
        columns: columns as SectionKey[][],
        isFirstPage: pageIndex === 0,
        document,
      })
    )
  )

  const element = React.createElement(
    'div',
    {
      className: 'artboard-root',
      style: { backgroundColor: 'var(--artboard-color-background)' },
    },
    pages
  )
  const styles = buildArtboardStyles(document.metadata, { includePageRule: true })
  const tailwindCss = await loadTailwindCss()
  const markup = renderToStaticMarkup(element)

  if (resumeData) {
    resetArtboardResume()
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>${tailwindCss}</style>
<style>${styles}</style>
</head>
<body>
${markup}
</body>
</html>`
}
