import fs from 'fs/promises'
import { createClient } from '@supabase/supabase-js'
import path from 'path'

interface BackupRow {
  id: string
  data: unknown
  schema_version: string | null
}

async function main() {
  const [, , backupPathArg] = process.argv
  if (!backupPathArg) {
    console.error('Usage: ts-node scripts/rollback-migration.ts <path-to-backup.json>')
    process.exit(1)
  }

  const backupPath = path.resolve(backupPathArg)
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.')
    process.exit(1)
  }

  const file = await fs.readFile(backupPath, 'utf8')
  const payload = JSON.parse(file) as { rows: BackupRow[] }
  const rows = payload.rows ?? []

  const supabase = createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  })

  console.log(`[rollback] restoring ${rows.length} resumes from ${backupPath}`)

  let restored = 0
  for (const row of rows) {
    const { error } = await supabase
      .from('resumes')
      .update({ data: row.data, schema_version: row.schema_version ?? 'resume.v1' })
      .eq('id', row.id)

    if (error) {
      console.error(`[rollback] failed to restore resume ${row.id}:`, error.message)
      continue
    }

    restored += 1
  }

  console.log(`[rollback] restored ${restored} of ${rows.length} resumes`)
}

main().catch((error) => {
  console.error('[rollback] unexpected error:', error)
  process.exit(1)
})
