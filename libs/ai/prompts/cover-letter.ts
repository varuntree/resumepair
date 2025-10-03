/**
 * AI Prompts for Cover Letter Operations
 *
 * Contains all prompts used for AI-powered cover letter generation.
 * Prompts follow Gemini 2.0 best practices for optimal results.
 *
 * @module libs/ai/prompts/cover-letter
 */

/**
 * Tone options for cover letter generation
 */
export type CoverLetterTone = 'formal' | 'friendly' | 'enthusiastic'

/**
 * Length options for cover letter generation
 */
export type CoverLetterLength = 'short' | 'medium' | 'long'

/**
 * Resume context for cover letter generation
 */
export interface ResumeContext {
  fullName: string
  email: string
  phone?: string
  location?: string
  summary?: string
  recentRole?: string
  recentCompany?: string
  keySkills: string[]
  yearsOfExperience?: number
}

/**
 * Build cover letter generation prompt
 *
 * @param jobDescription - Target job description
 * @param resumeContext - Optional resume data for context
 * @param tone - Tone of the cover letter (formal, friendly, enthusiastic)
 * @param length - Desired length (short: 200-250 words, medium: 250-350 words, long: 350-450 words)
 * @returns Formatted prompt for AI generation
 */
export function buildCoverLetterGenerationPrompt(
  jobDescription: string,
  resumeContext?: ResumeContext,
  tone: CoverLetterTone = 'formal',
  length: CoverLetterLength = 'medium'
): string {
  // Tone instructions
  const toneInstructions = {
    formal: `
TONE: Professional and Respectful
- Use formal language and traditional business writing conventions
- Maintain professional distance while showing genuine interest
- Use phrases like "I am writing to express my interest in..." and "I would welcome the opportunity to discuss..."
- Avoid contractions (use "I am" not "I'm")
- Keep sentences structured and grammatically formal`,
    friendly: `
TONE: Warm and Personable
- Use conversational yet professional language
- Show personality while maintaining professionalism
- Use phrases like "I'm excited about..." and "I'd love to contribute..."
- Contractions are acceptable for natural flow
- Create a sense of connection with the reader`,
    enthusiastic: `
TONE: Energetic and Passionate
- Express genuine excitement about the opportunity
- Use dynamic, action-oriented language
- Show enthusiasm for the company's mission and values
- Use phrases like "I'm thrilled about..." and "I'm passionate about..."
- Convey energy and motivation throughout`,
  }

  // Length instructions
  const lengthInstructions = {
    short: `
LENGTH: Short (200-250 words, ~3 paragraphs)
- Opening: 1 sentence stating interest and how you learned about the role
- Body: 1 paragraph (4-5 sentences) highlighting key qualifications
- Closing: 1-2 sentences expressing interest in next steps`,
    medium: `
LENGTH: Medium (250-350 words, ~4 paragraphs)
- Opening: 2-3 sentences stating interest and initial hook
- Body Paragraph 1: 4-5 sentences on relevant experience
- Body Paragraph 2: 3-4 sentences on key achievements and skills
- Closing: 2-3 sentences on value proposition and call to action`,
    long: `
LENGTH: Long (350-450 words, ~5 paragraphs)
- Opening: 3-4 sentences with compelling hook and background
- Body Paragraph 1: 5-6 sentences on most relevant experience
- Body Paragraph 2: 4-5 sentences on key achievements with metrics
- Body Paragraph 3: 3-4 sentences on cultural fit and motivation
- Closing: 3-4 sentences on value proposition and next steps`,
  }

  // Resume context text
  const resumeContextText = resumeContext
    ? `
RESUME CONTEXT:
Name: ${resumeContext.fullName}
Email: ${resumeContext.email}
${resumeContext.phone ? `Phone: ${resumeContext.phone}` : ''}
${resumeContext.location ? `Location: ${resumeContext.location}` : ''}
${resumeContext.summary ? `Summary: ${resumeContext.summary}` : ''}
${resumeContext.recentRole && resumeContext.recentCompany ? `Current/Recent Role: ${resumeContext.recentRole} at ${resumeContext.recentCompany}` : ''}
${resumeContext.yearsOfExperience ? `Years of Experience: ${resumeContext.yearsOfExperience}` : ''}
Key Skills: ${resumeContext.keySkills.join(', ')}

Use this information to create a personalized cover letter that aligns with the candidate's background.`
    : `
IMPORTANT: No resume context provided. Generate a compelling cover letter template using placeholder content that the user can customize.
Use [Your Name], [Your Experience], [Specific Achievement] as placeholders where personal details would go.`

  return `You are a professional cover letter writer. Generate a compelling cover letter for this job posting.

JOB DESCRIPTION:
${jobDescription}
${resumeContextText}

${toneInstructions[tone]}

${lengthInstructions[length]}

STRICT REQUIREMENTS:
1. STRUCTURE: Follow RichTextBlock format with type: 'paragraph' for each paragraph
2. PERSONALIZATION: Reference specific details from the job description
3. VALUE PROPOSITION: Clearly state what you bring to the role
4. COMPANY RESEARCH: If company name is mentioned, show knowledge of their mission/values
5. KEYWORDS: Naturally incorporate 3-5 key requirements from the job description
6. ACHIEVEMENTS: Include 1-2 specific achievements (with metrics if possible)
7. CALL TO ACTION: End with clear next steps (interview request, discussion, etc.)
8. NO CLICHÉS: Avoid overused phrases like "team player" or "think outside the box"
9. ACTIVE VOICE: Use active voice throughout (I led, I developed, I achieved)
10. PROOFREAD: Ensure perfect grammar, spelling, and punctuation

OUTPUT FORMAT:
Generate a complete CoverLetterJson object with:
- from: Sender information (use resume context or placeholders)
- to: Recipient information (extract from job description if available)
- jobInfo: Job title and company (extract from job description)
- date: Current date (ISO format)
- salutation: Appropriate greeting (e.g., "Dear Hiring Manager," or "Dear [Name]," if specified)
- body: Array of RichTextBlock objects (paragraphs with text runs)
- closing: Professional closing (e.g., "Sincerely," "Best regards,")
- settings: Default cover letter settings

BODY STRUCTURE:
Each paragraph should be a RichTextBlock with:
- type: "paragraph"
- content: Array of TextRun objects with formatting
  - Use bold for emphasis on key achievements (marks: ["bold"])
  - Use italic sparingly for company/product names (marks: ["italic"])

Example paragraph structure:
{
  "type": "paragraph",
  "content": [
    { "text": "I am writing to express my strong interest in the " },
    { "text": "Senior Software Engineer", "marks": ["bold"] },
    { "text": " position at " },
    { "text": "Acme Corp", "marks": ["italic"] },
    { "text": ". With over 5 years of experience in full-stack development, I am confident I can contribute significantly to your engineering team." }
  ]
}

Focus on creating a cover letter that tells a compelling story while directly addressing the job requirements.`
}
