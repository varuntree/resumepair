import type { SectionKey } from '../schema'
import type { ArtboardDocument } from '../types'

export type TemplateProps = {
  columns: SectionKey[][]
  isFirstPage?: boolean
  document?: ArtboardDocument
}
