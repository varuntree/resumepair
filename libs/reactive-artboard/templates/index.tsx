import type { ComponentType } from 'react'
import { ArtboardDocument } from '../types'
import { ModernTemplate } from './modern'
import { CreativeTemplate } from './creative'
import { TechnicalTemplate } from './technical'
import { OnyxTemplate } from './onyx'
import { CoverLetterTemplate } from './coverLetter'

type TemplateComponent = ComponentType<{ document: ArtboardDocument }>

const registry: Record<string, TemplateComponent> = {
  onyx: OnyxTemplate,
  modern: ModernTemplate,
  creative: CreativeTemplate,
  technical: TechnicalTemplate,
  'cover-letter': CoverLetterTemplate,
  default: OnyxTemplate,
}

export function getTemplateRenderer(template: string): TemplateComponent {
  return registry[template] ?? registry.default
}
