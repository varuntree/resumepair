/**
 * PDF Import Page
 *
 * Page route for importing resumes from PDF files.
 * Uses UnifiedAITool for PDF + text unified import/generation.
 *
 * @page
 */

import UnifiedAITool from '@/components/ai/UnifiedAITool'

export const metadata = {
  title: 'Import PDF Resume | ResumePair',
  description: 'Import your existing resume from PDF and convert it to editable format',
};

export default function ImportPDFPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto rounded-lg border bg-card p-6">
        <UnifiedAITool docType="resume" />
      </div>
    </div>
  )
}
