import fs from 'node:fs'
import path from 'node:path'
import { generateResume } from '../../libs/ai/resumeGenerator.ts'
import { buildResumeTextPrompt, buildResumeEditorPrompt, buildResumePDFPrompt } from '../../libs/ai/prompts.ts'

async function run() {
  console.log('Starting manual resume generation tests')

  const textPrompt = `You are an expert resume generator.
Return a ResumeJson object with AT MOST 2 work entries, 2 education entries, and skill arrays capped at 4 items.
If information is missing, omit the field.
Candidate: Taylor Applicant (taylor@example.com) in San Francisco, CA targeting Senior Frontend Engineer (React, TypeScript, accessibility, build tooling).
Keep the JSON concise and do not duplicate entries.`;

  const textResult = await generateResume({ traceId: 'manual-text', prompt: textPrompt, maxOutputTokens: 4000, temperature: 0 })
  console.log('Text-only generation complete:', {
    work: textResult.resume.work?.length ?? 0,
    skills: textResult.resume.skills?.length ?? 0,
    warnings: textResult.warnings,
  })

  const editorData = {
    profile: {
      fullName: 'Taylor Applicant',
      email: 'taylor@example.com',
    },
    work: [
      {
        company: 'Example Corp',
        role: 'Frontend Engineer',
        startDate: '2022-01',
        endDate: null,
        descriptionBullets: ['Built component library', 'Improved Lighthouse scores by 20%'],
      },
    ],
  }
  const editorPrompt = buildResumeEditorPrompt({ editorData })
  const editorResult = await generateResume({ traceId: 'manual-editor', prompt: editorPrompt, maxOutputTokens: 4000, temperature: 0 })
  console.log('Editor-only generation complete:', {
    work: editorResult.resume.work?.length ?? 0,
    warnings: editorResult.warnings,
  })

  const combinedPrompt = buildResumeTextPrompt({
    jobDescription: 'Hiring Staff Frontend Engineer with focus on design systems and accessibility.',
    editorData,
  })
  const combinedResult = await generateResume({ traceId: 'manual-combined', prompt: combinedPrompt, maxOutputTokens: 4000, temperature: 0 })
  console.log('Combined generation complete:', {
    work: combinedResult.resume.work?.length ?? 0,
    warnings: combinedResult.warnings,
  })

  const pdfPath = path.resolve('agents/temp/temp_resume.pdf')
  if (!fs.existsSync(pdfPath)) {
    console.warn(`PDF fixture not found at ${pdfPath}; skipping PDF test.`)
  } else {
    const pdfBytes = fs.readFileSync(pdfPath)
    const pdfPrompt = buildResumePDFPrompt({ userInstructions: 'Focus on recent experience and keep skills grouped.' })
    const pdfResult = await generateResume({
      traceId: 'manual-pdf',
      parts: [
        { type: 'text', text: pdfPrompt },
        { type: 'file', data: new Uint8Array(pdfBytes.buffer, pdfBytes.byteOffset, pdfBytes.byteLength), mediaType: 'application/pdf' },
      ],
      maxOutputTokens: 4000,
      temperature: 0,
    })
    console.log('PDF import generation complete:', {
      work: pdfResult.resume.work?.length ?? 0,
      warnings: pdfResult.warnings,
      usage: pdfResult.usage,
    })
  }
}

run().catch((err) => {
  console.error('Manual resume generation tests failed:', err)
  process.exitCode = 1
})
