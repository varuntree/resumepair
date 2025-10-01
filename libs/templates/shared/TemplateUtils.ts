/**
 * Template Utilities
 *
 * Helper functions for date formatting, text processing, and URL handling.
 * Used across all templates for consistent formatting.
 *
 * @module libs/templates/shared/TemplateUtils
 */

/**
 * Format a date range for display
 *
 * Handles:
 * - Single date (e.g., "Jan 2020")
 * - Date range (e.g., "Jan 2020 - Dec 2021")
 * - Current employment (e.g., "Jan 2020 - Present")
 * - Invalid dates (returns empty string)
 *
 * @param startDate - ISO date string or null
 * @param endDate - ISO date string, 'Present', or null
 * @param locale - Locale for formatting (default: 'en-US')
 * @returns Formatted date range
 */
export function formatDateRange(
  startDate?: string | null,
  endDate?: string | null | 'Present',
  locale: string = 'en-US'
): string {
  if (!startDate) return ''

  const formatDate = (dateStr: string): string => {
    try {
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) return ''

      return new Intl.DateTimeFormat(locale, {
        month: 'short',
        year: 'numeric',
      }).format(date)
    } catch {
      return ''
    }
  }

  const start = formatDate(startDate)
  if (!start) return ''

  if (!endDate || endDate === 'Present') {
    return `${start} - Present`
  }

  const end = formatDate(endDate)
  if (!end) return start

  return `${start} - ${end}`
}

/**
 * Format a phone number for display
 *
 * Simple formatter for US/international phones.
 * For production, use libphonenumber-js for proper formatting.
 *
 * @param phone - Phone number string
 * @returns Formatted phone number
 */
export function formatPhone(phone?: string | null): string {
  if (!phone) return ''

  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '')

  // US format: (123) 456-7890
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  }

  // US with country code: +1 (123) 456-7890
  if (digits.length === 11 && digits[0] === '1') {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`
  }

  // International or unknown format: return as-is with spaces
  return phone
}

/**
 * Format a URL for display
 *
 * Removes protocol and www prefix for cleaner display.
 *
 * @param url - Full URL
 * @returns Formatted URL for display
 */
export function formatUrl(url?: string | null): string {
  if (!url) return ''

  try {
    const parsed = new URL(url)
    let hostname = parsed.hostname

    // Remove www. prefix
    if (hostname.startsWith('www.')) {
      hostname = hostname.slice(4)
    }

    // Add pathname if not root
    const path = parsed.pathname !== '/' ? parsed.pathname : ''

    return hostname + path
  } catch {
    // Invalid URL, return as-is
    return url
  }
}

/**
 * Format an address for display
 *
 * Combines city, region, and country into a readable string.
 *
 * @param location - Location object
 * @returns Formatted location string
 */
export function formatAddress(location?: {
  city?: string
  region?: string
  country?: string
  postal?: string
}): string {
  if (!location) return ''

  const parts: string[] = []

  if (location.city) parts.push(location.city)
  if (location.region) parts.push(location.region)
  if (location.country) parts.push(location.country)

  return parts.join(', ')
}

/**
 * Truncate text to a maximum length
 *
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @param ellipsis - String to append (default: '...')
 * @returns Truncated text
 */
export function truncate(text: string, maxLength: number, ellipsis: string = '...'): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - ellipsis.length) + ellipsis
}

/**
 * Capitalize first letter of a string
 *
 * @param text - Text to capitalize
 * @returns Capitalized text
 */
export function capitalize(text: string): string {
  if (!text) return ''
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/**
 * Calculate duration between two dates
 *
 * @param startDate - Start date (ISO string)
 * @param endDate - End date (ISO string) or 'Present'
 * @returns Duration string (e.g., "2 years 3 months")
 */
export function calculateDuration(
  startDate?: string | null,
  endDate?: string | null | 'Present'
): string {
  if (!startDate) return ''

  try {
    const start = new Date(startDate)
    const end = endDate === 'Present' || !endDate ? new Date() : new Date(endDate)

    if (isNaN(start.getTime()) || isNaN(end.getTime())) return ''

    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())

    if (months < 1) return '< 1 month'

    const years = Math.floor(months / 12)
    const remainingMonths = months % 12

    if (years === 0) {
      return `${remainingMonths} ${remainingMonths === 1 ? 'month' : 'months'}`
    }

    if (remainingMonths === 0) {
      return `${years} ${years === 1 ? 'year' : 'years'}`
    }

    return `${years} ${years === 1 ? 'year' : 'years'} ${remainingMonths} ${remainingMonths === 1 ? 'month' : 'months'}`
  } catch {
    return ''
  }
}
