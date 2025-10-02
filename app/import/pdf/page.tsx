/**
 * PDF Import Page
 *
 * Page route for importing resumes from PDF files.
 * Uses ImportWizard component for multi-step workflow.
 *
 * @page
 */

import { ImportWizard } from '@/components/import/ImportWizard';

export const metadata = {
  title: 'Import PDF Resume | ResumePair',
  description: 'Import your existing resume from PDF and convert it to editable format',
};

export default function ImportPDFPage() {
  return <ImportWizard />;
}
