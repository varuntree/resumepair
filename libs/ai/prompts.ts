/**
 * AI Prompts for Resume Operations
 */

export interface PersonalInfo {
  name?: string
  email?: string
  phone?: string
  location?: string
}

export interface ResumePromptOptions {
  jobDescription?: string
  userInstructions?: string
  editorData?: unknown
  personalInfo?: PersonalInfo
  tone?: 'default' | 'concise' | 'enthusiastic'
}

function formatPersonalInfo(info?: PersonalInfo): string {
  if (!info) return ''
  const parts: string[] = []
  if (info.name) parts.push(`- Name: ${info.name}`)
  if (info.email) parts.push(`- Email: ${info.email}`)
  if (info.phone) parts.push(`- Phone: ${info.phone}`)
  if (info.location) parts.push(`- Location: ${info.location}`)
  return parts.length ? `PERSONAL INFO:\n${parts.join('\n')}` : ''
}

function formatEditorDataSnippet(data: unknown): string {
  if (!data) return ''
  try {
    const trimmed = JSON.stringify(data, null, 2)
    const snippet = trimmed.length > 2000 ? `${trimmed.slice(0, 2000)}\n...` : trimmed
    return [
      'STRUCTURED DATA TO HONOR:',
      '```json',
      snippet,
      '```',
    ].join('\n\n')
  } catch {
    return ''
  }
}

function formatUserInstructions(text?: string): string {
  if (!text || !text.trim()) return ''
  return `USER INSTRUCTIONS:\n${text.trim()}`
}

export function buildResumePDFPrompt(options: ResumePromptOptions = {}): string {
  const blocks = [
    'Persona: You are an ATS-savvy resume analyst.',
    'Task: Extract ALL content from the PDF and return a COMPLETE ResumeJson object. Include profile, summary, work, education, projects, skills, certifications, awards, languages, and extras.',
    'Context: Extract EVERY work experience entry, EVERY education entry, EVERY project, and ALL skills. Use original wording, respect current roles with endDate="Present", use YYYY-MM-DD dates, and include http:// or https:// URLs only.',
    'CRITICAL: Do NOT stop early. Extract the ENTIRE document - all work experiences, all education, all projects, all skills, all certifications. The response must be complete.',
    'Format: Return ONLY valid JSON. No explanations, no markdown - just the JSON object with ALL sections filled.',
  ]

  const instructions = [
    formatPersonalInfo(options.personalInfo),
    formatUserInstructions(options.userInstructions),
    formatEditorDataSnippet(options.editorData),
  ]
    .filter(Boolean)
    .join('\n\n')

  return `${blocks.join('\n\n')}${instructions ? `\n\n${instructions}` : ''}`
}

export function buildResumeTextPrompt(options: ResumePromptOptions): string {
  const blocks = [
    'Persona: You are a professional resume writer who understands ATS requirements.',
    'Task: Craft a COMPLETE ResumeJson object with ALL sections filled. Generate realistic, detailed content for profile, summary, work, education, projects, skills, certifications, awards, and languages.',
    'Context: Create 3-4 work experiences with 4-6 bullet points each, 2-3 projects, 5-6 skill groups, 1-2 education entries, and 2-3 certifications. Use strong action verbs, include metrics, and keep bullets under 20 words. Dates should use YYYY-MM-DD format.',
    'CRITICAL: Generate ALL sections - do not stop early. The response MUST include profile, summary, work (array), education (array), projects (array), skills (array), certifications (array), awards (array), and languages (array).',
    'Format: Return ONLY valid JSON. No explanations, no markdown, no code blocks - just the JSON object.',
  ]

  const details: string[] = []
  if (options.jobDescription) {
    details.push(`JOB DESCRIPTION:\n${options.jobDescription.trim()}`)
  }
  const personalInfoBlock = formatPersonalInfo(options.personalInfo)
  if (personalInfoBlock) details.push(personalInfoBlock)
  const editorBlock = formatEditorDataSnippet(options.editorData)
  if (editorBlock) details.push(editorBlock)
  const instructionBlock = formatUserInstructions(options.userInstructions)
  if (instructionBlock) details.push(instructionBlock)

  return `${blocks.join('\n\n')}\n\n${details.join('\n\n')}`
}

export function buildResumeEditorPrompt(options: ResumePromptOptions): string {
  const editorBlock = formatEditorDataSnippet(options.editorData)
  return `Persona: You are refining an existing resume into ResumeJson format.

Task: Use the provided structured data to produce a complete ResumeJson object. Fill reasonable gaps (summary, bullet polish) but never invent personal identifiers.

Context: Keep original meaning, trim whitespace, keep bullets concise, ensure dates use YYYY-MM-DD or YYYY-MM, drop settings/appearance unless included.

${editorBlock || 'Structured data will be provided; respect its values exactly.'}

Output: Return JSON only.`
}

export function buildExtractionPrompt(text: string): string {
  return `Persona: You are an ATS resume analyst.

Task: Convert the following resume text into a ResumeJson object with sections profile, summary, work, education, projects, skills, certifications, awards, languages, extras.

Context: Text may include OCR noise. Omit unknown fields, keep wording concise, use YYYY-MM or YYYY-MM-DD for dates, and only include http(s) URLs.

Output: Return JSON only.

Resume text:
${text.trim()}`
}

export function buildPDFExtractionPrompt(): string {
  return buildResumePDFPrompt()
}

export function buildGenerationPrompt(jobDescription: string, personalInfo?: PersonalInfo): string {
  return buildResumeTextPrompt({ jobDescription, personalInfo })
}

/**
 * Context for bullet enhancement
 */
export interface EnhancementContext {
  role?: string;
  industry?: string;
}

/**
 * Build enhancement prompt for improving a single bullet point
 * (Phase 4C)
 */
export function buildBulletEnhancementPrompt(
  bullet: string,
  context?: EnhancementContext
): string {
  const roleContext = context?.role ? `\nRole: ${context.role}` : '';
  const industryContext = context?.industry ? `\nIndustry: ${context.industry}` : '';

  return `You are enhancing a resume bullet point. Make it more impactful while keeping the core achievement.

GUIDELINES:
- Start with strong action verbs (Led, Drove, Achieved, Implemented, Designed, Built)
- Add quantifiable metrics where possible (%, $, #, time saved, users impacted)
- Keep to 10-15 words maximum
- Use past tense for past roles
- Be specific and concrete
${roleContext}${industryContext}

ORIGINAL:
${bullet}

Provide the enhanced bullet and list the improvements made.

Format:
Enhanced: [improved bullet point]

Changes:
- [improvement 1]
- [improvement 2]
- [improvement 3]`;
}

/**
 * Build summary generation prompt
 * (Phase 4C)
 */
export function buildSummaryPrompt(context: {
  name: string;
  title?: string;
  years: number;
  topSkills: string[];
  industries: string[];
}): string {
  return `Generate a professional resume summary (2-3 sentences, 40-60 words).

PROFILE:
- Name: ${context.name}
- Current Title: ${context.title || 'Professional'}
- Years of Experience: ${context.years}
- Top Skills: ${context.topSkills.join(', ')}
- Industries: ${context.industries.join(', ')}

Write a compelling summary that:
- Opens with current role/expertise
- Highlights key achievements or specializations
- Ends with career goals or value proposition
- Uses active voice and confident tone

Return only the summary text, no formatting.`;
}

/**
 * Build keyword extraction prompt
 * (Phase 4C)
 */
export function buildKeywordExtractionPrompt(jobDescription: string): string {
  return `Extract ATS-optimized keywords from this job description.

JOB DESCRIPTION:
${jobDescription}

Identify:
1. Hard skills (programming languages, tools, frameworks)
2. Soft skills (leadership, communication, problem-solving)
3. Certifications (AWS, PMP, Six Sigma)
4. Required vs preferred qualifications

Categorize each keyword by:
- Type: skill, tool, certification, soft_skill
- Priority: required, preferred, optional

Return as structured JSON matching the KeywordSchema.`;
}

/**
 * Build matching prompt for job description analysis
 * (Phase 4D - not implemented yet)
 */
export function buildMatchingPrompt(
  resume: string,
  jobDescription: string
): string {
  return `Analyze how well this resume matches the job description:

RESUME:
${resume}

JOB DESCRIPTION:
${jobDescription}

Provide a match score (0-100) and specific recommendations for improvement.`;
}
