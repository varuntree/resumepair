/**
 * Classic Block Cover Letter Template
 *
 * Traditional business letter format with block alignment.
 * Conservative, professional design suitable for all industries.
 *
 * @module libs/templates/cover-letter/classic-block/ClassicBlockTemplate
 */

import React from 'react'
import { CoverLetterTemplateProps } from '@/types/cover-letter-template'
import { CoverLetterTemplateBase } from '../shared/CoverLetterTemplateBase'
import {
  formatCoverLetterDate,
  formatPhone,
  formatAddress,
  formatAddressMultiline,
} from '../shared/CoverLetterTemplateUtils'
import { RichTextRenderer } from '@/components/rich-text/RichTextRenderer'
import './styles.css'

/**
 * Classic Block Template Component
 *
 * Features:
 * - Traditional block format (all elements left-aligned)
 * - Sender address at top
 * - Date below sender
 * - Recipient address below date
 * - Formal salutation
 * - Body paragraphs
 * - Closing and signature
 * - Professional, conservative styling
 */
const ClassicBlockTemplate = React.memo(
  ({ data, customizations, mode = 'preview' }: CoverLetterTemplateProps) => {
    const { from, to, date, salutation, body, closing, settings } = data

    return (
      <CoverLetterTemplateBase
        className="classic-block-template"
        customizations={customizations}
        mode={mode}
      >
        {/* Sender Address (if enabled) */}
        {settings.showLetterhead && (
          <div className="doc-letterhead">
            <div className="doc-sender-name">{from.fullName}</div>
            {from.location && (
              <div className="doc-sender-address">
                {formatAddressMultiline(from.location).map((line, idx) => (
                  <div key={idx}>{line}</div>
                ))}
              </div>
            )}
            {from.phone && <div className="doc-sender-phone">{formatPhone(from.phone)}</div>}
            {from.email && <div className="doc-sender-email">{from.email}</div>}
          </div>
        )}

        {/* Date */}
        {settings.includeDate && (
          <div className="doc-date">
            {formatCoverLetterDate(date, settings.dateFormat)}
          </div>
        )}

        {/* Recipient Address */}
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

ClassicBlockTemplate.displayName = 'ClassicBlockTemplate'

export default ClassicBlockTemplate
