/**
 * Executive Formal Cover Letter Template
 *
 * Prestigious, authoritative design for senior professionals.
 * Refined typography and generous spacing.
 *
 * @module libs/templates/cover-letter/executive-formal/ExecutiveFormalTemplate
 */

import React from 'react'
import { CoverLetterTemplateProps } from '@/types/cover-letter-template'
import { CoverLetterTemplateBase } from '../shared/CoverLetterTemplateBase'
import {
  formatCoverLetterDate,
  formatPhone,
  formatAddressMultiline,
} from '../shared/CoverLetterTemplateUtils'
import { RichTextRenderer } from '@/components/rich-text/RichTextRenderer'
import './styles.css'

/**
 * Executive Formal Template Component
 *
 * Features:
 * - Centered header with name
 * - Serif typography for elegance
 * - Generous spacing and margins
 * - Traditional formal layout
 * - Suitable for C-level and senior positions
 */
const ExecutiveFormalTemplate = React.memo(
  ({ data, customizations, mode = 'preview' }: CoverLetterTemplateProps) => {
    const { from, to, date, salutation, body, closing, settings } = data

    return (
      <CoverLetterTemplateBase
        className="executive-formal-template"
        customizations={customizations}
        mode={mode}
      >
        {/* Centered Header */}
        {settings.showLetterhead && (
          <div className="doc-letterhead">
            <div className="doc-sender-name">{from.fullName}</div>
            <div className="doc-sender-details">
              {from.location && (
                <div className="doc-sender-address">
                  {formatAddressMultiline(from.location).map((line, idx) => (
                    <span key={idx}>
                      {line}
                      {idx < formatAddressMultiline(from.location!).length - 1 && ' • '}
                    </span>
                  ))}
                </div>
              )}
              <div className="doc-sender-contact">
                {from.phone && <span>{formatPhone(from.phone)}</span>}
                {from.email && <span>{from.email}</span>}
              </div>
            </div>
            <div className="doc-header-divider" />
          </div>
        )}

        {/* Date (centered) */}
        {settings.includeDate && (
          <div className="doc-date">
            {formatCoverLetterDate(date, settings.dateFormat)}
          </div>
        )}

        {/* Recipient */}
        <div className="doc-recipient">
          {to.recipientName && (
            <div className="doc-recipient-name">{to.recipientName}</div>
          )}
          {to.recipientTitle && (
            <div className="doc-recipient-title">{to.recipientTitle}</div>
          )}
          <div className="doc-recipient-company">{to.companyName}</div>
          {to.companyAddress && (
            <div className="doc-recipient-address">
              {formatAddressMultiline(to.companyAddress).map((line, idx) => (
                <div key={idx}>{line}</div>
              ))}
            </div>
          )}
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

ExecutiveFormalTemplate.displayName = 'ExecutiveFormalTemplate'

export default ExecutiveFormalTemplate
