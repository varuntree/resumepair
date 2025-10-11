import 'dotenv/config'
import { generateResume } from '../libs/ai/resumeGenerator'
import { buildResumeTextPrompt } from '../libs/ai/prompts'

// Load environment variables
import { config } from 'dotenv'
config({ path: '.env.local' })

async function testResumeGeneration() {
  console.log('=== Testing Resume Generation ===\n')

  const jobDescription = 'create a resume for applying as CEO of Tesla'
  const traceId = `test-${Date.now()}`

  console.log('Job Description:', jobDescription)
  console.log('Trace ID:', traceId)
  console.log('\n--- Building Prompt ---')

  const prompt = buildResumeTextPrompt({ jobDescription })
  console.log('Prompt length:', prompt.length, 'characters')
  console.log('Prompt preview:', prompt.slice(0, 300) + '...\n')

  console.log('--- Calling generateResume ---\n')

  try {
    const startTime = Date.now()
    const result = await generateResume({
      traceId,
      prompt,
      temperature: 0.3,
      topP: 0.9,
      maxOutputTokens: 16000,
      onUsage: (usage) => {
        console.log('\n--- Token Usage ---')
        console.log('Input tokens:', usage.inputTokens)
        console.log('Output tokens:', usage.outputTokens)
        console.log('Total tokens:', usage.totalTokens)
      }
    })

    const duration = Date.now() - startTime

    console.log('\n--- Generation Complete ---')
    console.log('Duration:', duration, 'ms')
    console.log('\n--- Resume Sections ---')
    console.log('Profile:', result.resume.profile ? '✓ Present' : '✗ Missing')
    console.log('Summary:', result.resume.summary ? `✓ Present (${result.resume.summary.length} chars)` : '✗ Missing')
    console.log('Work:', result.resume.work ? `✓ Present (${result.resume.work.length} entries)` : '✗ Missing')
    console.log('Education:', result.resume.education ? `✓ Present (${result.resume.education.length} entries)` : '✗ Missing')
    console.log('Projects:', result.resume.projects ? `✓ Present (${result.resume.projects.length} entries)` : '✗ Missing')
    console.log('Skills:', result.resume.skills ? `✓ Present (${result.resume.skills.length} groups)` : '✗ Missing')
    console.log('Certifications:', result.resume.certifications ? `✓ Present (${result.resume.certifications.length} entries)` : '✗ Missing')
    console.log('Awards:', result.resume.awards ? `✓ Present (${result.resume.awards.length} entries)` : '✗ Missing')
    console.log('Languages:', result.resume.languages ? `✓ Present (${result.resume.languages.length} entries)` : '✗ Missing')
    console.log('Extras:', result.resume.extras ? `✓ Present (${result.resume.extras.length} entries)` : '✗ Missing')

    console.log('\n--- Sample Data ---')
    if (result.resume.profile) {
      console.log('\nProfile:')
      console.log('  Name:', result.resume.profile.fullName)
      console.log('  Email:', result.resume.profile.email)
      console.log('  Headline:', result.resume.profile.headline)
    }

    if (result.resume.work && result.resume.work.length > 0) {
      console.log('\nFirst Work Entry:')
      console.log('  Company:', result.resume.work[0].company)
      console.log('  Role:', result.resume.work[0].role)
      console.log('  Bullets:', result.resume.work[0].descriptionBullets?.length || 0)
    }

    if (result.resume.education && result.resume.education.length > 0) {
      console.log('\nFirst Education Entry:')
      console.log('  School:', result.resume.education[0].school)
      console.log('  Degree:', result.resume.education[0].degree)
    }

    if (result.resume.skills && result.resume.skills.length > 0) {
      console.log('\nFirst Skill Group:')
      console.log('  Category:', result.resume.skills[0].category)
      console.log('  Items:', result.resume.skills[0].items.length)
    }

    console.log('\n--- Raw Data (first 500 chars) ---')
    console.log(JSON.stringify(result.raw, null, 2).slice(0, 500) + '...')

    console.log('\n✅ Test completed successfully!')

  } catch (error) {
    console.error('\n❌ Test failed!')
    console.error('Error:', error)
    if (error instanceof Error) {
      console.error('Message:', error.message)
      console.error('Stack:', error.stack)
    }
    process.exit(1)
  }
}

testResumeGeneration().catch(console.error)
