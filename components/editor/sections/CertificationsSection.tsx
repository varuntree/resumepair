'use client'

import * as React from 'react'
import { TextField } from '../fields/TextField'
import { DateField } from '../fields/DateField'
import { ArrayField } from '../fields/ArrayField'

export function CertificationsSection(): React.ReactElement {
  const emptyCertification = {
    name: '',
    issuer: '',
    date: '',
  }

  return (
    <div className="space-y-6">
      <ArrayField
        name="certifications"
        label="Certifications"
        emptyItem={emptyCertification}
        maxItems={10}
      >
        {(index) => (
          <div className="space-y-4">
            <TextField
              name={`certifications.${index}.name`}
              label="Certification Name"
              placeholder="AWS Certified Solutions Architect"
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextField
                name={`certifications.${index}.issuer`}
                label="Issuing Organization"
                placeholder="Amazon Web Services"
                required
              />
              <DateField
                name={`certifications.${index}.date`}
                label="Date Obtained"
              />
            </div>
          </div>
        )}
      </ArrayField>
    </div>
  )
}