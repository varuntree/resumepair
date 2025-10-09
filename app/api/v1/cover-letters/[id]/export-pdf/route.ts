/**
 * POST /api/v1/cover-letters/[id]/export-pdf
 *
 * Generate and download PDF for a cover letter document.
 * Immediate generation (no queue) for faster user experience.
 *
 * Runtime: Node (requires Puppeteer)
 */

import { NextRequest } from 'next/server'
import { createClient } from '@/libs/supabase/server'
import { getCoverLetter } from '@/libs/repositories/coverLetters'
import { generateCoverLetterPdfWithRetry } from '@/libs/exporters/pdfGenerator'
import { z } from 'zod'

// ============================================
// RUNTIME CONFIG
// ============================================

export const runtime = 'nodejs' // Required for Puppeteer
export const maxDuration = 30 // 30 seconds timeout for PDF generation

// ============================================
// VALIDATION
// ============================================

const ExportPdfSchema = z.object({
  quality: z.enum(['standard', 'high']).optional().default('standard'),
})

// ============================================
// HANDLER
// ============================================

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<Response> {
  try {
    // Create Supabase client
    const supabase = createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const coverLetterId = params.id

    // Validate UUID
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(coverLetterId)) {
      return new Response(JSON.stringify({ error: 'Invalid cover letter ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Parse and validate request body
    const body = await req.json().catch(() => ({}))
    const validation = ExportPdfSchema.safeParse(body)

    if (!validation.success) {
      return new Response(JSON.stringify({ error: validation.error.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const { quality } = validation.data

    // Fetch cover letter (RLS ensures ownership check)
    const coverLetter = await getCoverLetter(supabase, coverLetterId)

    if (!coverLetter) {
      return new Response(JSON.stringify({ error: 'Cover letter not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Generate PDF
    const result = await generateCoverLetterPdfWithRetry(coverLetter.data, {
      quality,
      context: {
        documentId: coverLetter.id,
        userId: user.id,
      },
    })

    console.info('[PDF] cover-letter export complete', {
      documentId: coverLetter.id,
      userId: user.id,
      pageCount: result.pageCount,
      size: result.fileSize,
    })

    // Generate filename
    const sanitizedTitle = coverLetter.title
      .replace(/[^a-z0-9]/gi, '_')
      .toLowerCase()
      .substring(0, 50)
    const filename = `${sanitizedTitle}_cover_letter.pdf`

    // Return PDF as download
    return new Response(result.buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': result.fileSize.toString(),
        'X-Page-Count': result.pageCount.toString(),
      },
    })
  } catch (error) {
    console.error('Cover letter PDF export error:', error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to generate PDF',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
