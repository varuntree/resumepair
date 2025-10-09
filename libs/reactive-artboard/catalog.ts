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
    id: 'kakuna',
    name: 'Kakuna',
    description: 'Minimal single-column resume with refined typography and generous spacing.',
    features: ['Single Column', 'ATS Friendly', 'Clean Header'],
    thumbnail: '/templates/minimal-thumb.svg',
    atsScore: 94,
  },
  {
    id: 'azurill',
    name: 'Azurill',
    description: 'Two-column layout with prominent sidebar cards and experience timeline.',
    features: ['Two Columns', 'Timeline', 'Profile Cards'],
    thumbnail: '/templates/modern-thumb.svg',
    atsScore: 93,
  },
  {
    id: 'bronzor',
    name: 'Bronzor',
    description: 'Technical aesthetic featuring dark sidebar, skill meters, and grid cards.',
    features: ['Technical', 'Skill Bars', 'Grid Layout'],
    thumbnail: '/templates/technical-thumb.svg',
    atsScore: 91,
  },
  {
    id: 'chikorita',
    name: 'Chikorita',
    description: 'Warm serif typography with stacked sections ideal for traditional roles.',
    features: ['Serif Type', 'Classic Layout', 'Section Accents'],
    thumbnail: '/templates/classic-thumb.svg',
    atsScore: 90,
  },
  {
    id: 'ditto',
    name: 'Ditto',
    description: 'Hero banner resume with vibrant accent block and flexible grids.',
    features: ['Hero Header', 'Accent Color', 'Flexible Grid'],
    thumbnail: '/templates/creative-thumb.svg',
    atsScore: 88,
  },
  {
    id: 'gengar',
    name: 'Gengar',
    description: 'Modern gradient header with modular cards and detailed timelines.',
    features: ['Gradient Header', 'Card Layout', 'Timeline'],
    thumbnail: '/templates/creative-thumb.svg',
    atsScore: 89,
  },
  {
    id: 'glalie',
    name: 'Glalie',
    description: 'Corporate-friendly design with split columns and statistic callouts.',
    features: ['Corporate', 'Two Columns', 'Statistic Callouts'],
    thumbnail: '/templates/executive-thumb.svg',
    atsScore: 92,
  },
  {
    id: 'leafish',
    name: 'Leafish',
    description: 'Creative resume with soft gradients, iconography, and stacked sections.',
    features: ['Creative', 'Iconography', 'Soft Gradient'],
    thumbnail: '/templates/creative-thumb.svg',
    atsScore: 87,
  },
  {
    id: 'nosepass',
    name: 'Nosepass',
    description: 'Geometric layout emphasizing structure, badges, and clear hierarchy.',
    features: ['Geometric', 'Badges', 'Hierarchy'],
    thumbnail: '/templates/executive-thumb.svg',
    atsScore: 91,
  },
  {
    id: 'onyx',
    name: 'Onyx',
    description: 'Refreshed Onyx with bold divider, stacked columns, and quick stats.',
    features: ['Bold Divider', 'Stacked Columns', 'Quick Stats'],
    thumbnail: '/templates/minimal-thumb.svg',
    atsScore: 92,
  },
  {
    id: 'pikachu',
    name: 'Pikachu',
    description: 'Vibrant sidebar resume with badges, progress bars, and highlight panels.',
    features: ['Vibrant Sidebar', 'Progress Bars', 'Highlight Panels'],
    thumbnail: '/templates/creative-thumb.svg',
    atsScore: 88,
  },
  {
    id: 'rhyhorn',
    name: 'Rhyhorn',
    description: 'Executive-friendly layout with alternating blocks and subtle accents.',
    features: ['Executive', 'Alternating Blocks', 'Accent Highlights'],
    thumbnail: '/templates/executive-thumb.svg',
    atsScore: 93,
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
