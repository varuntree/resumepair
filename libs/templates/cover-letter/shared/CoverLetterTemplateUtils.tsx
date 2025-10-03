/**
 * Cover Letter Template Utilities
 *
 * Shared utility functions for formatting cover letter data.
 * All templates use these utilities for consistent formatting.
 *
 * @module libs/templates/cover-letter/shared/CoverLetterTemplateUtils
 */

/**
 * Format date for cover letter
 * Supports multiple locale formats
 */
export function formatCoverLetterDate(
  dateString: string,
  format: 'US' | 'ISO' | 'EU' = 'US'
): string {
  const date = new Date(dateString)

  switch (format) {
    case 'US':
      // September 30, 2025
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    case 'ISO':
      // 2025-09-30
      return date.toISOString().split('T')[0]
    case 'EU':
      // 30 September 2025
      return date.toLocaleDateString('en-GB', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    default:
      return date.toLocaleDateString()
  }
}

/**
 * Format phone number for display
 */
export function formatPhone(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '')

  // US phone number: (555) 123-4567
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  }

  // US phone with country code: +1 (555) 123-4567
  if (digits.length === 11 && digits[0] === '1') {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`
  }

  // Return original if format not recognized
  return phone
}

/**
 * Format address for display
 */
export function formatAddress(address: {
  street?: string
  city?: string
  region?: string
  postal?: string
  country?: string
}): string {
  const parts: string[] = []

  if (address.street) parts.push(address.street)
  if (address.city) parts.push(address.city)
  if (address.region) parts.push(address.region)
  if (address.postal) parts.push(address.postal)
  if (address.country) parts.push(address.country)

  return parts.join(', ')
}

/**
 * Format address as multiline (for letterhead)
 */
export function formatAddressMultiline(address: {
  street?: string
  city?: string
  region?: string
  postal?: string
  country?: string
}): string[] {
  const lines: string[] = []

  if (address.street) lines.push(address.street)

  // City, State ZIP
  const cityLine: string[] = []
  if (address.city) cityLine.push(address.city)
  if (address.region) cityLine.push(address.region)
  if (address.postal) cityLine.push(address.postal)
  if (cityLine.length > 0) lines.push(cityLine.join(', '))

  if (address.country) lines.push(address.country)

  return lines
}

/**
 * Format email as mailto link
 */
export function formatEmailLink(email: string): string {
  return `mailto:${email}`
}
