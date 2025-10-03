/**
 * Unified Documents Dashboard
 *
 * Shows both resumes and cover letters in a single view.
 * Supports filtering, searching, and bulk operations.
 *
 * @module app/documents/page
 */

import * as React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/libs/supabase/server'
import { UnifiedDocumentDashboard } from '@/components/documents/UnifiedDocumentDashboard'

export const metadata = {
  title: 'Documents | ResumePair',
  description: 'Manage your resumes and cover letters',
}

export default async function DocumentsPage(): Promise<React.ReactElement> {
  const supabase = createClient()

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/signin')
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <UnifiedDocumentDashboard userId={user.id} />
    </div>
  )
}
