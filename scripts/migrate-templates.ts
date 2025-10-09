import { createClient } from '@supabase/supabase-js'
import { createDefaultAppearance, createDefaultLayout } from '../types/resume'
import type { ResumeJson } from '../types/resume'

const TEMPLATE_MAP: Record<string, string> = {
  onyx: 'kakuna',
  modern: 'azurill',
  creative: 'pikachu',
  technical: 'bronzor',
}

function mapTemplate(input?: string | null): string {
  if (!input) return 'kakuna'
  const normalized = input.toLowerCase()
  return TEMPLATE_MAP[normalized] ?? normalized ?? 'kakuna'
}

function ensureAppearance(resume: ResumeJson): ResumeJson {
  const pageSize = resume.settings?.pageSize ?? 'Letter'
  const defaultAppearance = createDefaultAppearance(pageSize)
  const incoming: any = resume.appearance ?? {}

  const layoutSettings = incoming.layout_settings ?? {
    pageFormat: incoming.layout?.pageFormat ?? pageSize,
    margin: incoming.layout?.margin ?? 48,
    showPageNumbers: incoming.layout?.showPageNumbers ?? false,
  }

  const layout = Array.isArray(incoming.layout) ? incoming.layout : createDefaultLayout()

  return {
    ...resume,
    appearance: {
      ...defaultAppearance,
      ...incoming,
      template: mapTemplate(incoming.template),
      layout_settings: {
        ...defaultAppearance.layout_settings,
        ...layoutSettings,
        pageFormat: layoutSettings.pageFormat === 'A4' ? 'A4' : 'Letter',
      },
      layout,
    },
  }
}

async function main() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.')
    process.exit(1)
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  })

  console.log('[migrate] fetching resumes...')
  const { data, error } = await supabase
    .from('resumes')
    .select('id, data, schema_version')

  if (error) {
    console.error('[migrate] failed to fetch resumes:', error.message)
    process.exit(1)
  }

  const rows = data ?? []
  let updated = 0

  for (const row of rows) {
    const resume = row.data as ResumeJson
    if (!resume) continue

    const migrated = ensureAppearance(resume)

    const { error: updateError } = await supabase
      .from('resumes')
      .update({ data: migrated, schema_version: 'resume.v2' })
      .eq('id', row.id)

    if (updateError) {
      console.error(`[migrate] failed to update resume ${row.id}:`, updateError.message)
      continue
    }

    updated += 1
  }

  console.log(`[migrate] updated ${updated} of ${rows.length} resumes`)
}

main().catch((error) => {
  console.error('[migrate] unexpected error:', error)
  process.exit(1)
})
