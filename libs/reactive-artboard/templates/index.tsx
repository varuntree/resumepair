import type { ComponentType } from 'react'
import { CoverLetterTemplate } from './coverLetter'
import { AzurillTemplate } from './azurill'
import { BronzorTemplate } from './bronzor'
import { ChikoritaTemplate } from './chikorita'
import { DittoTemplate } from './ditto'
import { GengarTemplate } from './gengar'
import { GlalieTemplate } from './glalie'
import { KakunaTemplate } from './kakuna'
import { LeafishTemplate } from './leafish'
import { NosepassTemplate } from './nosepass'
import { OnyxTemplate } from './onyx'
import { PikachuTemplate } from './pikachu'
import { RhyhornTemplate } from './rhyhorn'
import type { TemplateProps } from '../types/template'

type TemplateComponent = ComponentType<TemplateProps>

const registry: Record<string, TemplateComponent> = {
  azurill: AzurillTemplate,
  bronzor: BronzorTemplate,
  chikorita: ChikoritaTemplate,
  ditto: DittoTemplate,
  gengar: GengarTemplate,
  glalie: GlalieTemplate,
  kakuna: KakunaTemplate,
  leafish: LeafishTemplate,
  nosepass: NosepassTemplate,
  onyx: OnyxTemplate,
  pikachu: PikachuTemplate,
  rhyhorn: RhyhornTemplate,
  'cover-letter': CoverLetterTemplate,
  default: KakunaTemplate,
}

export function getTemplateRenderer(template: string): TemplateComponent {
  return registry[template] ?? registry.default
}
