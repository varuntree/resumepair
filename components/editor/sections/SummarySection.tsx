'use client'

import * as React from 'react'
import { RichTextField } from '../fields/RichTextField'

export function SummarySection(): React.ReactElement {
  return (
    <div className="space-y-6">
      <RichTextField
        name="summary"
        label="Professional Summary"
        placeholder="Experienced software engineer with 5+ years building scalable web applications..."
        maxLength={600}
        helperText="Use bullets, bold, and italics to highlight achievements."
      />
    </div>
  )
}
