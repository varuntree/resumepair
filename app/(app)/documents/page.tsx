/**
 * Unified Documents Dashboard
 */
import * as React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/libs/supabase/server'
import { UnifiedDocumentDashboard } from '@/components/documents/UnifiedDocumentDashboard'

export default async function DocumentsPage(): Promise<React.ReactElement> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/signin')
  return (
    <div className="container mx-auto py-8 px-4">
      <UnifiedDocumentDashboard />
    </div>
  )
}
