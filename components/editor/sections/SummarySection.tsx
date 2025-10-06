'use client'

import * as React from 'react'
import { TextAreaField } from '../fields/TextAreaField'

export function SummarySection(): React.ReactElement {
  return (
    <div className="space-y-6">
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