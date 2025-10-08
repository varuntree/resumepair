'use client'

import * as React from 'react'
import { TextField } from '../fields/TextField'
import { ArrayField } from '../fields/ArrayField'
import { LinkField } from '../fields/LinkField'

export function ProfileSection(): React.ReactElement {
  const emptyLink = { type: '', label: '', url: '' }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TextField
          name="profile.fullName"
          label="Full Name"
          placeholder="John Doe"
          required
        />
        <TextField
          name="profile.headline"
          label="Headline"
          placeholder="Software Engineer"
          maxLength={200}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TextField
          name="profile.email"
          label="Email"
          placeholder="john@example.com"
          required
        />
        <TextField
          name="profile.phone"
          label="Phone"
          placeholder="+1 (555) 123-4567"
        />
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Location</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TextField
            name="profile.location.city"
            label="City"
            placeholder="San Francisco"
          />
          <TextField
            name="profile.location.region"
            label="State/Region"
            placeholder="CA"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TextField
            name="profile.location.country"
            label="Country"
            placeholder="United States"
          />
          <TextField
            name="profile.location.postal"
            label="Postal Code"
            placeholder="94103"
          />
        </div>
      </div>

      <ArrayField
        name="profile.links"
        label="Links"
        emptyItem={emptyLink}
        maxItems={10}
        renderSummary={(item) => (
          <div className="space-y-0.5">
            <p className="text-sm font-medium text-foreground">{item.label || item.type || 'Link'}</p>
            {item.url && <p className="text-xs text-muted-foreground line-clamp-1">{item.url}</p>}
          </div>
        )}
      >
        {(index) => (
          <>
            <TextField
              name={`profile.links.${index}.type`}
              label="Type"
              placeholder="LinkedIn, GitHub, Website, etc."
            />
            <TextField
              name={`profile.links.${index}.label`}
              label="Label"
              placeholder="My GitHub"
            />
            <LinkField
              name={`profile.links.${index}.url`}
              label="URL"
              placeholder="https://github.com/username"
              required
            />
          </>
        )}
      </ArrayField>
    </div>
  )
}
