/**
 * Document Type Filter Component
 *
 * Filters documents by type (All, Resumes, Cover Letters).
 *
 * @module components/documents/DocumentTypeFilter
 */

'use client'

import * as React from 'react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

export type DocumentType = 'all' | 'resume' | 'cover_letter'

export interface DocumentTypeFilterProps {
  value: DocumentType
  // eslint-disable-next-line no-unused-vars
  onChange: (value: DocumentType) => void
  resumeCount: number
  coverLetterCount: number
}

export function DocumentTypeFilter({
  value,
  onChange,
  resumeCount,
  coverLetterCount,
}: DocumentTypeFilterProps): React.ReactElement {
  const totalCount = resumeCount + coverLetterCount

  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as DocumentType)}>
      <TabsList>
        <TabsTrigger value="all" className="gap-2">
          All
          <span className="text-xs opacity-60">({totalCount})</span>
        </TabsTrigger>
        <TabsTrigger value="resume" className="gap-2">
          Resumes
          <span className="text-xs opacity-60">({resumeCount})</span>
        </TabsTrigger>
        <TabsTrigger value="cover_letter" className="gap-2">
          Cover Letters
          <span className="text-xs opacity-60">({coverLetterCount})</span>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
