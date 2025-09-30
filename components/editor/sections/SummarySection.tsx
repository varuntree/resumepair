'use client'

import * as React from 'react'
import { Separator } from '@/components/ui/separator'
import { TextAreaField } from '../fields/TextAreaField'

export function SummarySection(): React.ReactElement {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Summary</h2>
        <p className="text-muted-foreground mt-1">
          A brief overview of your professional background
        </p>
      </div>

      <Separator />

      <TextAreaField
        name="summary"
        label="Professional Summary"
        placeholder="Experienced software engineer with 5+ years building scalable web applications..."
        maxLength={500}
        rows={6}
      />
    </div>
  )
}