import type { ResumeTemplateId } from '@/types/resume'

export type ResumeTemplateMetadata = {
  id: ResumeTemplateId
  name: string
  description: string
  features: string[]
  thumbnail: string
  atsScore?: number
}

const RESUME_TEMPLATE_METADATA: ResumeTemplateMetadata[] = [
  {
    id: 'onyx',
    name: 'Onyx',
    description: 'Clean single-column layout with prominent header and balanced typography.',
    features: ['ATS-Friendly', 'Single Column', 'Flexible Sections'],
    thumbnail: '/templates/minimal-thumb.svg',
    atsScore: 92,
  },
  {
    id: 'modern',
    name: 'Modern Grid',
    description: 'Two-column hybrid layout with timeline styling and skill meters.',
    features: ['Timeline', 'Two Columns', 'Skill Levels'],
    thumbnail: '/templates/modern-thumb.svg',
    atsScore: 94,
  },
  {
    id: 'creative',
    name: 'Creative Sidebar',
    description: 'Bold sidebar design with accent gradients and spacious main content area.',
    features: ['Sidebar', 'Gradients', 'Highlight Cards'],
    thumbnail: '/templates/creative-thumb.svg',
    atsScore: 88,
  },
  {
    id: 'technical',
    name: 'Technical',
    description: 'Monospace-inspired layout optimized for developers and technical roles.',
    features: ['Monospace', 'Skill Bars', 'Grid Cards'],
    thumbnail: '/templates/technical-thumb.svg',
    atsScore: 90,
  },
]

export function listResumeTemplateMetadata(): ResumeTemplateMetadata[] {
  return RESUME_TEMPLATE_METADATA
}

export function getResumeTemplateMetadata(id: ResumeTemplateId): ResumeTemplateMetadata {
  const template = RESUME_TEMPLATE_METADATA.find((item) => item.id === id)
  if (!template) {
    throw new Error(`Resume template metadata not found for id "${id}"`)
  }
  return template
}
