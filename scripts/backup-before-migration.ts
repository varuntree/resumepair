import fs from 'fs/promises'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

interface ResumeRow {
  id: string
  data: unknown
  schema_version: string | null
  updated_at: string
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

  console.log('[backup] fetching resume data...')
  const { data, error } = await supabase
    .from('resumes')
    .select('id, data, schema_version, updated_at')

  if (error) {
    console.error('[backup] failed to fetch resumes:', error.message)
    process.exit(1)
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const outputDir = path.join(process.cwd(), 'backups')
  await fs.mkdir(outputDir, { recursive: true })
  const filePath = path.join(outputDir, `resumes-${timestamp}.json`)

  await fs.writeFile(filePath, JSON.stringify({
    generatedAt: new Date().toISOString(),
    count: data?.length ?? 0,
    rows: (data ?? []) as ResumeRow[],
  }, null, 2))

  console.log(`[backup] wrote ${data?.length ?? 0} rows to ${filePath}`)
}

main().catch((error) => {
  console.error('[backup] unexpected error:', error)
  process.exit(1)
})
