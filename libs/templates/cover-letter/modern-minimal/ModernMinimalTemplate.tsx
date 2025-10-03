/**
 * Modern Minimal Cover Letter Template
 *
 * Clean, contemporary design with subtle accents.
 * Minimalist approach focusing on content readability.
 *
 * @module libs/templates/cover-letter/modern-minimal/ModernMinimalTemplate
 */

import React from 'react'
import { CoverLetterTemplateProps } from '@/types/cover-letter-template'
import { CoverLetterTemplateBase } from '../shared/CoverLetterTemplateBase'
import {
  formatCoverLetterDate,
  formatPhone,
} from '../shared/CoverLetterTemplateUtils'
import { RichTextRenderer } from '@/components/rich-text/RichTextRenderer'
import './styles.css'

/**
 * Modern Minimal Template Component
 *
 * Features:
 * - Clean header with contact info in a single line
 * - Subtle accent line
 * - Generous white space
 * - Modern typography
 * - Simplified recipient format
 */
const ModernMinimalTemplate = React.memo(
  ({ data, customizations, mode = 'preview' }: CoverLetterTemplateProps) => {
    const { from, to, date, salutation, body, closing, settings } = data

    return (
      <CoverLetterTemplateBase
        className="modern-minimal-template"
        customizations={customizations}
        mode={mode}
      >
        {/* Modern Header */}
        {settings.showLetterhead && (
          <div className="doc-letterhead">
            <div className="doc-sender-name">{from.fullName}</div>
            <div className="doc-sender-contact">
              {from.email && <span className="doc-contact-item">{from.email}</span>}
              {from.phone && (
                <span className="doc-contact-item">{formatPhone(from.phone)}</span>
              )}
              {from.location?.city && from.location?.region && (
                <span className="doc-contact-item">
                  {from.location.city}, {from.location.region}
                </span>
              )}
            </div>
            <div className="doc-accent-line" />
          </div>
        )}

        {/* Date */}
        {settings.includeDate && (
          <div className="doc-date">
            {formatCoverLetterDate(date, settings.dateFormat)}
          </div>
        )}

        {/* Recipient (simplified) */}
        <div className="doc-recipient">
          {to.recipientName && <div>{to.recipientName}</div>}
          {to.recipientTitle && <div>{to.recipientTitle}</div>}
          <div>{to.companyName}</div>
        </div>

        {/* Salutation */}
        <div className="doc-salutation">{salutation}</div>

        {/* Body */}
        <div className="doc-body">
          <RichTextRenderer blocks={body} />
        </div>

        {/* Closing */}
        <div className="doc-closing">
          <div className="doc-closing-phrase">{closing}</div>
          <div className="doc-signature-space" />
          <div className="doc-signature-name">{from.fullName}</div>
        </div>
      </CoverLetterTemplateBase>
    )
  }
)

ModernMinimalTemplate.displayName = 'ModernMinimalTemplate'

export default ModernMinimalTemplate
