import type { CoverLetterJson, RichTextBlock, CoverLetterAppearance } from '@/types/cover-letter'
import { createDefaultCoverLetterAppearance } from '@/types/cover-letter'
import {
  ArtboardDocument,
  ArtboardMetadata,
  ArtboardRichTextBlock,
  ArtboardSection,
} from '../types'

const DEFAULT_COLORS = {
  background: '#ffffff',
  text: '#1f2937',
  primary: '#1d4ed8',
}

export function mapCoverLetterToArtboardDocument(letter: CoverLetterJson): ArtboardDocument {
  const metadata = createMetadata(letter)

  const sections: ArtboardSection[] = []

  const senderLines = buildSenderLines(letter)
  if (senderLines.length) {
    sections.push(createCustomSection('sender', 'Sender', senderLines))
  }

  const metaLines = buildMetaLines(letter)
  if (metaLines.length) {
    sections.push(createCustomSection('meta', 'Details', metaLines))
  }

  const recipientLines = buildRecipientLines(letter)
  if (recipientLines.length) {
    sections.push(createCustomSection('recipient', 'Recipient', recipientLines))
  }

  sections.push({
    id: 'body',
    title: 'Letter Body',
    type: 'summary',
    visible: true,
    blocks: (letter.body ?? []).map(mapBlock),
  })

  const closingLines = buildClosingLines(letter)
  if (closingLines.length) {
    sections.push(createCustomSection('closing', 'Closing', closingLines))
  }

  const profileLocation = [
    letter.from.location?.city,
    letter.from.location?.region,
    letter.from.location?.country,
  ]
    .filter(Boolean)
    .join(', ')

  return {
    template: 'cover-letter',
    profile: {
      fullName: letter.from.fullName,
      headline: letter.jobInfo?.jobTitle,
      email: letter.from.email,
      phone: letter.from.phone,
      location: profileLocation || undefined,
      summary: letter.salutation,
      links: [],
    },
    sections,
    metadata,
  }
}

function createCustomSection(id: string, title: string, lines: string[]): ArtboardSection {
  return {
    id,
    title,
    type: 'custom',
    visible: true,
    blocks: lines.map(createParagraphBlock),
  }
}

function createMetadata(letter: CoverLetterJson): ArtboardMetadata {
  const appearance: CoverLetterAppearance =
    letter.appearance ?? createDefaultCoverLetterAppearance(letter.settings.pageSize)

  return {
    colors: appearance.theme ?? DEFAULT_COLORS,
    typography: {
      fontFamily: appearance.typography?.fontFamily || letter.settings.fontFamily || 'Inter, system-ui',
      fontSize:
        appearance.typography?.fontSize ?? Math.round(16 * (letter.settings.fontSizeScale || 1)),
      lineHeight: appearance.typography?.lineHeight ?? (letter.settings.lineSpacing || 1.5),
    },
    page: {
      format: appearance.layout?.pageFormat ?? letter.settings.pageSize ?? 'Letter',
      margin: appearance.layout?.margin ?? 64,
      showPageNumbers: appearance.layout?.showPageNumbers ?? false,
    },
    customCss: appearance.customCss,
  }
}

function buildSenderLines(letter: CoverLetterJson): string[] {
  const lines = [letter.from.fullName]
  if (letter.from.email) lines.push(letter.from.email)
  if (letter.from.phone) lines.push(letter.from.phone)

  const address = formatAddress(letter.from.location)
  if (address) lines.push(address)

  return lines.filter(Boolean)
}

function buildMetaLines(letter: CoverLetterJson): string[] {
  const lines: string[] = []
  if (letter.settings.includeDate !== false && letter.date) {
    lines.push(formatDate(letter.date, letter.settings.locale))
  }
  if (letter.jobInfo?.jobTitle) {
    lines.push(`Role: ${letter.jobInfo.jobTitle}`)
  }
  if (letter.jobInfo?.jobId) {
    lines.push(`Reference: ${letter.jobInfo.jobId}`)
  }
  if (letter.jobInfo?.source) {
    lines.push(`Source: ${letter.jobInfo.source}`)
  }
  return lines
}

function buildRecipientLines(letter: CoverLetterJson): string[] {
  const lines: string[] = []
  if (letter.to.recipientName) lines.push(letter.to.recipientName)
  if (letter.to.recipientTitle) lines.push(letter.to.recipientTitle)
  lines.push(letter.to.companyName)

  const address = formatAddress(letter.to.companyAddress)
  if (address) lines.push(address)

  return lines.filter(Boolean)
}

function buildClosingLines(letter: CoverLetterJson): string[] {
  const lines: string[] = []
  if (letter.closing) lines.push(letter.closing)
  lines.push(letter.from.fullName)
  return lines.filter(Boolean)
}

function formatAddress(address?: CoverLetterJson['from']['location'] | CoverLetterJson['to']['companyAddress']): string {
  if (!address) return ''
  const parts = [address.street, address.city, address.region, address.postal, address.country]
  return parts.filter(Boolean).join(', ')
}

function formatDate(isoDate: string, locale?: string): string {
  try {
    const date = new Date(isoDate)
    if (Number.isNaN(date.getTime())) return isoDate
    return new Intl.DateTimeFormat(locale || 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date)
  } catch {
    return isoDate
  }
}

function mapBlock(block: RichTextBlock): ArtboardRichTextBlock {
  if (block.type === 'bullet_list' || block.type === 'numbered_list') {
    return {
      type: 'list',
      content: block.content.map((run) => run.text),
    }
  }

  return createParagraphBlock(block.content.map((run) => run.text).join(''))
}

function createParagraphBlock(text: string): ArtboardRichTextBlock {
  return {
    type: 'paragraph',
    content: [text.trim()],
  }
}
