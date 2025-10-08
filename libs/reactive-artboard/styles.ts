import { ArtboardMetadata } from './types'

const BASE_CSS = `
  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    font-family: var(--artboard-font-family);
    font-size: var(--artboard-font-size);
    line-height: var(--artboard-line-height);
    color: var(--artboard-color-text);
    background: var(--artboard-color-background);
  }

  .artboard-page {
    font-family: inherit;
    font-size: inherit;
    line-height: inherit;
    color: inherit;
    background: var(--artboard-color-background);
    padding: 3rem;
    max-width: 816px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .artboard-header {
    border-bottom: 2px solid var(--artboard-color-primary);
    padding-bottom: 1.5rem;
  }

  .artboard-name {
    font-size: calc(var(--artboard-font-size) * 2.2);
    margin: 0;
  }

  .artboard-headline {
    margin: 0.25rem 0 0;
    font-weight: 500;
    color: var(--artboard-color-primary);
  }

  .artboard-contact {
    margin-top: 1rem;
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    font-size: calc(var(--artboard-font-size) * 0.95);
  }

  .artboard-sections {
    display: flex;
    flex-direction: column;
    gap: 1.75rem;
  }

  .artboard-section-heading {
    margin: 0 0 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-size: calc(var(--artboard-font-size) * 1.05);
    color: var(--artboard-color-primary);
  }

  .artboard-section {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .artboard-paragraph {
    margin: 0;
  }

  .artboard-bullets {
    margin: 0;
    padding-left: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .artboard-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .artboard-list-item {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .artboard-list-item-title {
    font-weight: 600;
  }

  .artboard-list-item-subtitle {
    font-weight: 500;
  }

  .artboard-list-item-meta {
    font-size: calc(var(--artboard-font-size) * 0.9);
    color: rgba(0,0,0,0.6);
  }

  .artboard-skill-grid {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 0.75rem;
  }

  .artboard-skill {
    display: flex;
    justify-content: space-between;
    font-size: calc(var(--artboard-font-size) * 0.95);
  }

  .artboard-skill-level {
    color: var(--artboard-color-primary);
    font-weight: 500;
  }

  /* Cover Letter Template */
  .artboard-template-cover-letter {
    max-width: 660px;
    padding: 2.75rem 3rem;
    gap: 1.5rem;
  }

  .cover-letter-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1.5rem;
  }

  .cover-letter-sender,
  .cover-letter-meta {
    font-size: calc(var(--artboard-font-size) * 0.95);
    line-height: 1.6;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    white-space: pre-line;
  }

  .cover-letter-meta {
    text-align: right;
    color: rgba(0,0,0,0.65);
  }

  .cover-letter-recipient {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    font-size: calc(var(--artboard-font-size) * 0.95);
    color: rgba(0,0,0,0.8);
  }

  .cover-letter-body {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    font-size: var(--artboard-font-size);
  }

  .cover-letter-salutation {
    margin: 0;
    font-weight: 500;
  }

  .cover-letter-paragraph {
    margin: 0;
    text-align: justify;
  }

  .cover-letter-list {
    margin: 0;
    padding-left: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .cover-letter-closing {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    font-size: calc(var(--artboard-font-size) * 0.95);
  }

  .cover-letter-text {
    margin: 0;
  }

  /* Modern Template */
  .artboard-template-modern {
    background: linear-gradient(135deg, rgba(37,99,235,0.05), rgba(16,185,129,0.05));
  }

  .modern-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 1.5rem;
    border-bottom: 3px solid var(--artboard-color-primary);
    padding-bottom: 1.5rem;
  }

  .modern-name {
    font-size: calc(var(--artboard-font-size) * 2.4);
    margin: 0;
    letter-spacing: -0.01em;
  }

  .modern-headline {
    margin: 0.25rem 0 0;
    font-weight: 500;
    color: var(--artboard-color-primary);
  }

  .modern-contact {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.5rem 1.25rem;
    font-size: calc(var(--artboard-font-size) * 0.9);
    text-align: right;
  }

  .modern-body {
    display: grid;
    grid-template-columns: 280px 1fr;
    gap: 2rem;
  }

  .modern-aside {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .modern-card {
    background: rgba(255, 255, 255, 0.8);
    border: 1px solid rgba(37, 99, 235, 0.15);
    border-left: 4px solid rgba(37, 99, 235, 0.6);
    border-radius: 0.75rem;
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .modern-skill-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .modern-skill {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    font-size: calc(var(--artboard-font-size) * 0.95);
  }

  .modern-skill-meter {
    height: 4px;
    background: rgba(37, 99, 235, 0.15);
    border-radius: 999px;
    overflow: hidden;
  }

  .modern-skill-meter > div {
    height: 100%;
    background: var(--artboard-color-primary);
    border-radius: inherit;
  }

  .modern-main {
    display: flex;
    flex-direction: column;
    gap: 1.75rem;
  }

  .modern-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .modern-section-heading {
    margin: 0;
    font-size: calc(var(--artboard-font-size) * 1.05);
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--artboard-color-primary);
  }

  .modern-timeline {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    position: relative;
  }

  .modern-timeline::before {
    content: '';
    position: absolute;
    top: 0.25rem;
    left: 0.5rem;
    bottom: 0.5rem;
    width: 2px;
    background: rgba(37, 99, 235, 0.18);
  }

  .modern-timeline-item {
    padding-left: 1.75rem;
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .modern-timeline-item::before {
    content: '';
    position: absolute;
    left: 0.3rem;
    top: 0.35rem;
    width: 0.55rem;
    height: 0.55rem;
    border-radius: 999px;
    background: var(--artboard-color-primary);
  }

  .modern-timeline-header {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: baseline;
  }

  .modern-timeline-role {
    margin: 0;
    font-weight: 600;
  }

  .modern-timeline-company {
    margin: 0;
    color: rgba(0,0,0,0.65);
  }

  .modern-timeline-meta {
    color: rgba(0,0,0,0.55);
    font-size: calc(var(--artboard-font-size) * 0.9);
  }

  .modern-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 1rem;
  }

  .modern-grid-item {
    border: 1px solid rgba(16, 185, 129, 0.2);
    border-radius: 0.75rem;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .modern-grid-title {
    margin: 0;
    font-weight: 600;
  }

  .modern-grid-subtitle {
    margin: 0;
    color: rgba(0,0,0,0.65);
  }

  .modern-grid-meta {
    margin: 0;
    font-size: calc(var(--artboard-font-size) * 0.9);
    color: rgba(0,0,0,0.55);
  }

  .modern-list {
    margin: 0;
    padding-left: 1.1rem;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .modern-paragraph {
    margin: 0;
  }

  /* Creative Template */
  .creative-layout {
    display: grid;
    grid-template-columns: 250px 1fr;
    gap: 2rem;
  }

  .creative-sidebar {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    background: linear-gradient(180deg, rgba(37,99,235,0.9), rgba(99,102,241,0.9));
    color: #f8fafc;
    border-radius: 1.5rem;
    padding: 1.75rem;
  }

  .creative-profile {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .creative-name {
    margin: 0;
    font-size: calc(var(--artboard-font-size) * 2.1);
    letter-spacing: -0.01em;
  }

  .creative-headline {
    margin: 0;
    font-weight: 500;
    opacity: 0.85;
  }

  .creative-contact {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    font-size: calc(var(--artboard-font-size) * 0.92);
  }

  .creative-section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .creative-section-heading {
    margin: 0;
    font-size: calc(var(--artboard-font-size) * 1.05);
    text-transform: uppercase;
    letter-spacing: 0.12em;
  }

  .creative-main {
    display: flex;
    flex-direction: column;
    gap: 1.75rem;
  }

  .creative-main-section {
    background: rgba(255,255,255,0.9);
    border: 1px solid rgba(15,23,42,0.08);
    border-radius: 1.25rem;
    padding: 1.5rem 1.75rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .creative-summary p {
    margin: 0;
  }

  .creative-skill-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .creative-skill-list li {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: calc(var(--artboard-font-size) * 0.95);
  }

  .creative-badge {
    background: rgba(15,23,42,0.85);
    color: #f8fafc;
    border-radius: 999px;
    padding: 0.15rem 0.6rem;
    font-size: calc(var(--artboard-font-size) * 0.75);
  }

  .creative-timeline {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .creative-timeline-item {
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
  }

  .creative-timeline-item header {
    display: flex;
    justify-content: space-between;
    gap: 1.5rem;
    align-items: baseline;
  }

  .creative-timeline-role {
    margin: 0;
    font-weight: 600;
  }

  .creative-timeline-company {
    margin: 0;
    color: rgba(15,23,42,0.75);
  }

  .creative-timeline-meta {
    color: rgba(15,23,42,0.55);
    font-size: calc(var(--artboard-font-size) * 0.9);
  }

  .creative-list {
    margin: 0;
    padding-left: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .creative-paragraph {
    margin: 0;
  }

  .creative-education {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  .creative-education-degree {
    margin: 0;
    font-weight: 600;
  }

  .creative-education-school {
    margin: 0;
  }

  .creative-education-meta {
    margin: 0;
    color: rgba(15,23,42,0.55);
    font-size: calc(var(--artboard-font-size) * 0.9);
  }

  /* Technical Template */
  .artboard-template-technical {
    font-family: 'JetBrains Mono', 'Fira Code', 'Source Code Pro', var(--artboard-font-family);
    background: #0f172a;
    color: #e2e8f0;
    border-radius: 1.25rem;
    padding: 2.5rem;
  }

  .technical-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 1px solid rgba(148, 163, 184, 0.25);
    padding-bottom: 1.5rem;
    margin-bottom: 1.75rem;
    gap: 1.5rem;
  }

  .technical-name {
    margin: 0;
    font-size: calc(var(--artboard-font-size) * 2.2);
    letter-spacing: -0.015em;
  }

  .technical-headline {
    margin: 0.25rem 0 0;
    color: #38bdf8;
  }

  .technical-contact {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    font-size: calc(var(--artboard-font-size) * 0.9);
    text-align: right;
  }

  .technical-body {
    display: flex;
    flex-direction: column;
    gap: 1.75rem;
  }

  .technical-section {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .technical-section-heading {
    margin: 0;
    font-size: calc(var(--artboard-font-size) * 1.05);
    text-transform: uppercase;
    letter-spacing: 0.18em;
    color: #38bdf8;
  }

  .technical-skills {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 0.75rem;
  }

  .technical-skill {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    font-size: calc(var(--artboard-font-size) * 0.95);
  }

  .technical-skill-bar {
    height: 6px;
    background: rgba(56, 189, 248, 0.2);
    border-radius: 999px;
    overflow: hidden;
    transform-origin: left center;
  }

  .technical-skill-bar > div {
    height: 100%;
    background: #38bdf8;
    transform-origin: left center;
    transition: transform 0.2s ease;
  }

  .technical-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 1rem;
  }

  .technical-card {
    background: rgba(15, 23, 42, 0.9);
    border: 1px solid rgba(148, 163, 184, 0.25);
    border-radius: 1rem;
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .technical-card-title {
    margin: 0;
    font-weight: 600;
  }

  .technical-card-subtitle {
    margin: 0;
    color: rgba(226, 232, 240, 0.7);
  }

  .technical-card-meta {
    margin: 0;
    font-size: calc(var(--artboard-font-size) * 0.9);
    color: rgba(226, 232, 240, 0.55);
  }

  .technical-list {
    margin: 0;
    padding-left: 1.2rem;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .technical-paragraph {
    margin: 0;
  }
`

const PAGE_DIMENSIONS = {
  Letter: { width: '8.5in', height: '11in' },
  A4: { width: '210mm', height: '297mm' },
} as const

export function buildArtboardStyles(
  metadata: ArtboardMetadata,
  options: { includePageRule?: boolean } = {}
): string {
  const customCss = metadata.customCss ?? ''
  const dimensions = PAGE_DIMENSIONS[metadata.page.format] ?? PAGE_DIMENSIONS.Letter
  const marginInches = pxToInches(metadata.page.margin)

  const root = `
    :root {
      --artboard-color-background: ${metadata.colors.background};
      --artboard-color-text: ${metadata.colors.text};
      --artboard-color-primary: ${metadata.colors.primary};
      --artboard-font-family: ${metadata.typography.fontFamily};
      --artboard-font-size: ${metadata.typography.fontSize}px;
      --artboard-line-height: ${metadata.typography.lineHeight};
    }
  `

  const pageRule = options.includePageRule
    ? `
      @page {
        size: ${dimensions.width} ${dimensions.height};
        margin: ${marginInches}in;
      }
    `
    : ''

  return [root, BASE_CSS, pageRule, customCss].filter(Boolean).join('\n')
}

function pxToInches(px: number): number {
  const inches = px / 96
  return Math.max(0.1, Number(inches.toFixed(3)))
}
