/**
 * Creative Bold Cover Letter Template
 *
 * Designer-friendly template with bold typography and accent colors.
 * Ideal for creative industries.
 *
 * @module libs/templates/cover-letter/creative-bold/CreativeBoldTemplate
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
 * Creative Bold Template Component
 *
 * Features:
 * - Bold header with accent background
 * - Larger, more expressive typography
 * - Creative use of color
 * - Asymmetric layout elements
 * - Designed for creative professionals
 */
const CreativeBoldTemplate = React.memo(
  ({ data, customizations, mode = 'preview' }: CoverLetterTemplateProps) => {
    const { from, to, date, salutation, body, closing, settings } = data

    return (
      <CoverLetterTemplateBase
        className="creative-bold-template"
        customizations={customizations}
        mode={mode}
      >
        {/* Bold Header with Accent */}
        {settings.showLetterhead && (
          <div className="doc-letterhead">
            <div className="doc-header-accent-bar" />
            <div className="doc-header-content">
              <div className="doc-sender-name">{from.fullName}</div>
              <div className="doc-sender-contact">
                {from.email && <span>{from.email}</span>}
                {from.phone && <span>{formatPhone(from.phone)}</span>}
                {from.location?.city && from.location?.region && (
                  <span>
                    {from.location.city}, {from.location.region}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Date with accent */}
        <div className="doc-meta-section">
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
          </div>
        </div>

        {/* Salutation */}
        <div className="doc-salutation">{salutation}</div>

        {/* Body */}
        <div className="doc-body">
          <RichTextRenderer blocks={body} />
        </div>

        {/* Closing with accent */}
        <div className="doc-closing">
          <div className="doc-closing-phrase">{closing}</div>
          <div className="doc-signature-space" />
          <div className="doc-signature-name">{from.fullName}</div>
          <div className="doc-closing-accent-line" />
        </div>
      </CoverLetterTemplateBase>
    )
  }
)

CreativeBoldTemplate.displayName = 'CreativeBoldTemplate'

export default CreativeBoldTemplate
