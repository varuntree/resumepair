import assert from 'node:assert/strict'
import assert from 'node:assert/strict'
import { generateResume, generateCoverLetter } from '../../libs/ai/resumeGenerator.ts'

async function run() {
  console.log('Running AI integration tests...')

  const expectedResume = {
    profile: {
      fullName: 'Taylor Applicant',
      email: 'taylor@example.com',
      headline: 'Senior Frontend Engineer',
    },
    summary: 'Senior frontend engineer focused on performant and accessible React applications.',
    work: [
      {
        company: 'Acme Corp',
        role: 'Senior Frontend Engineer',
        startDate: '2021-01',
        endDate: null,
        descriptionBullets: ['Led redesign of design system', 'Improved Lighthouse scores by 15%'],
      },
      {
        company: 'Globex',
        role: 'Frontend Engineer',
        startDate: '2018-05',
        endDate: '2020-12',
        descriptionBullets: ['Built reusable React components', 'Collaborated with designers to ship new UI'],
      },
    ],
    education: [
      {
        school: 'State University',
        degree: 'B.S. Computer Science',
      },
    ],
    skills: [
      {
        category: 'Core',
        items: ['React', 'TypeScript', 'Accessibility'],
      },
    ],
  }

  const resumePrompt = `Return the following ResumeJson object exactly as valid JSON (no commentary):\n${JSON.stringify(expectedResume)}`

  const resumeResponse = await tryGenerateResume({
    traceId: 'test-resume-text',
    prompt: resumePrompt,
  })

  assert.deepStrictEqual(resumeResponse.resume.profile.fullName, expectedResume.profile.fullName)
  assert.deepStrictEqual(resumeResponse.resume.work?.length, expectedResume.work.length)
  assert.deepStrictEqual(resumeResponse.resume.education?.length, expectedResume.education.length)
  assert.deepStrictEqual(resumeResponse.resume.skills?.length, expectedResume.skills.length)
  console.log('Resume text prompt test passed')

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
        descriptionBullets: ['Shipped design system', 'Improved Lighthouse by 20%'],
      },
    ],
  }
  const editorResponse = await tryGenerateResume({
    traceId: 'test-resume-editor',
    prompt: `Return this ResumeJson, making no changes: ${JSON.stringify(editorData)}`,
  })
  assert.ok(editorResponse.resume.work && editorResponse.resume.work.length === 1, 'Editor resume missing work data')
  console.log('Resume editor prompt test passed')

  const expectedCoverLetter = {
    from: {
      fullName: 'Taylor Applicant',
      email: 'taylor@example.com',
    },
    to: {
      companyName: 'Acme Corp',
    },
    date: '2025-10-10',
    salutation: 'Dear Hiring Manager,',
    body: [
      { type: 'paragraph', content: [{ text: 'Opening paragraph.' }] },
      { type: 'paragraph', content: [{ text: 'Body paragraph.' }] },
      { type: 'paragraph', content: [{ text: 'Closing paragraph.' }] },
    ],
    closing: 'Sincerely,\nTaylor Applicant',
    settings: {
      locale: 'en-US',
      dateFormat: 'US',
      fontFamily: 'Inter',
      fontSizeScale: 1,
      lineSpacing: 1.4,
      colorTheme: 'default',
      pageSize: 'Letter',
      showLetterhead: true,
      includeDate: true,
    },
  }

  const coverLetterPrompt = `Return the following CoverLetterJson exactly as JSON:\n${JSON.stringify(expectedCoverLetter)}`
  const coverLetterResponse = await tryGenerateCoverLetter({
    traceId: 'test-cover-letter',
    prompt: coverLetterPrompt,
  })
  assert.deepStrictEqual(coverLetterResponse.coverLetter.body?.length, expectedCoverLetter.body.length)
  console.log('Cover letter test passed')

  console.log('All AI integration tests passed.')
}

run().catch((err) => {
  console.error('AI integration tests failed:', err)
  process.exitCode = 1
})

async function tryGenerateResume(options: { traceId: string; prompt: string }) {
  const attempts = [900, 700, 500]
  let lastError: unknown
  for (const maxTokens of attempts) {
    try {
      const result = await generateResume({
        traceId: `${options.traceId}-max${maxTokens}`,
        prompt: options.prompt,
        temperature: 0,
        maxOutputTokens: maxTokens,
      })
      return result
    } catch (error) {
      lastError = error
    }
  }
  throw lastError
}

async function tryGenerateCoverLetter(options: { traceId: string; prompt: string }) {
  const attempts = [900, 700, 500]
  let lastError: unknown
  for (const maxTokens of attempts) {
    try {
      const result = await generateCoverLetter({
        traceId: `${options.traceId}-max${maxTokens}`,
        prompt: options.prompt,
        temperature: 0,
        maxOutputTokens: maxTokens,
      })
      return result
    } catch (error) {
      lastError = error
    }
  }
  throw lastError
}
