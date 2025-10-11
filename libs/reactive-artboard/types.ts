export type ArtboardColorScheme = {
  background: string
  text: string
  primary: string
}

export type ArtboardTypography = {
  fontFamily: string
  fontSize: number
  lineHeight: number
}

import type { PageFormat } from './constants/page'

export type ArtboardMetadata = {
  colors: ArtboardColorScheme
  typography: ArtboardTypography
  page: {
    format: PageFormat
    margin: number
    showPageNumbers: boolean
  }
  customCss?: string
}

export type ArtboardLink = {
  label: string
  url: string
}

export type ArtboardProfile = {
  fullName: string
  headline?: string
  summary?: string
  email?: string
  phone?: string
  location?: string
  links?: ArtboardLink[]
}

export type ArtboardSectionBase = {
  id: string
  title: string
  visible: boolean
}

export type ArtboardRichTextBlock = {
  type: 'paragraph' | 'list'
  content: string[]
}

export type ArtboardExperienceItem = {
  company: string
  role: string
  location?: string
  startDate?: string
  endDate?: string
  summary?: ArtboardRichTextBlock[]
}

export type ArtboardEducationItem = {
  school: string
  degree: string
  field?: string
  startDate?: string
  endDate?: string
  summary?: ArtboardRichTextBlock[]
}

export type ArtboardSkillItem = {
  label: string
  level?: number
}

export type ArtboardSection =
  | (ArtboardSectionBase & { type: 'summary'; blocks: ArtboardRichTextBlock[] })
  | (ArtboardSectionBase & { type: 'experience'; items: ArtboardExperienceItem[] })
  | (ArtboardSectionBase & { type: 'education'; items: ArtboardEducationItem[] })
  | (ArtboardSectionBase & { type: 'skills'; items: ArtboardSkillItem[] })
  | (ArtboardSectionBase & { type: 'custom'; blocks: ArtboardRichTextBlock[] })

export type ArtboardDocument = {
  template: string
  profile: ArtboardProfile
  sections: ArtboardSection[]
  metadata: ArtboardMetadata
  layout: string[][][]
}
