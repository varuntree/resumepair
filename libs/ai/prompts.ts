/**
 * AI Prompts for Resume Operations
 *
 * Contains all prompts used for AI-powered resume processing.
 * Prompts follow Gemini 2.0 best practices for optimal results.
 *
 * @module libs/ai/prompts
 */

/**
 * Build extraction prompt for parsing resume text to ResumeJson (Legacy)
 *
 * @deprecated Use buildPDFExtractionPrompt() for multimodal PDF parsing
 * @param text - Raw text extracted from PDF
 * @returns Formatted prompt for AI extraction
 */
export function buildExtractionPrompt(text: string): string {
  return `You are an expert resume parser with deep knowledge of ATS formats and resume structures.

TASK:
Extract structured resume data from the following text and convert it to a valid ResumeJson format.

STRICT RULES:
1. TRUTHFULNESS: Only extract explicitly stated information - never fabricate or infer data
2. EXACT WORDING: Preserve the exact wording from the original text
3. DATE FORMAT: Convert all dates to ISO format (YYYY-MM-DD). If only month/year known, use first day of month
4. SKILL GROUPING: Group similar skills into categories (e.g., "Programming Languages", "Frameworks", "Tools")
5. CURRENT ROLES: Use endDate="Present" for current positions
6. BULLETS: Preserve bullet points as arrays of strings
7. MISSING DATA: Leave optional fields undefined if not present in text

CONTEXT:
The text is from a PDF resume upload and may contain OCR errors. Handle formatting inconsistencies gracefully.

RESUME TEXT:
${text}

OUTPUT FORMAT:
Return a complete ResumeJson object with:
- profile: { fullName, email, phone?, location?, links? }
- summary?: string (if professional summary present)
- work?: Array of work experiences with company, role, dates, bullets
- education?: Array of education entries
- skills?: Array of skill groups with categories
- projects?: Array of projects (if present)
- certifications?: Array of certifications (if present)

Focus on accuracy over completeness. Better to leave a field empty than to guess.`;
}

/**
 * Build PDF extraction prompt for multimodal parsing (Phase 4.5)
 *
 * Designed for Gemini multimodal API with native PDF input.
 * Leverages document layout and visual hierarchy understanding.
 *
 * @returns Formatted prompt for PDF extraction
 */
export function buildPDFExtractionPrompt(): string {
  return `You are extracting resume data from a PDF document.

CONTEXT:
- You can see the document layout, formatting, and visual hierarchy
- Extract both typed and handwritten text (use OCR if needed)
- Preserve section structure based on visual hierarchy (headings, spacing, bullets)
- Handle scanned PDFs, LinkedIn exports, Indeed exports, and custom formats
- Dates may appear in various formats - convert to ISO format (YYYY-MM-DD)
- Contact information may be formatted in many ways - extract accurately

STRICT EXTRACTION RULES:
1. TRUTHFULNESS: Only extract explicitly stated information - NEVER fabricate or infer data
2. EXACT WORDING: Preserve the exact wording from the original document
3. NO FABRICATION: If a field is missing, leave it empty (null/undefined) - DO NOT guess
4. DATE FORMAT: Convert all dates to ISO format (YYYY-MM-DD). If only month/year, use first day of month
5. CURRENT ROLES: Use endDate="Present" for current positions (not a date)
6. PRESERVE STRUCTURE: Maintain bullet points, job descriptions, and achievements as written
7. SKILL GROUPING: Group related skills into categories (e.g., "Programming Languages", "Frameworks", "Tools")
8. COMPANY NAMES: Extract exact company names (do not normalize or abbreviate)
9. JOB TITLES: Preserve original capitalization and wording
10. UNCLEAR TEXT: If handwritten text is unclear, skip it rather than guess

VISUAL HIERARCHY UNDERSTANDING:
- Section headings are typically larger, bold, or uppercase
- Work experience is usually reverse chronological (most recent first)
- Education is typically in a separate section
- Skills may be grouped by category or listed as keywords
- Contact info is usually at top or in a header/sidebar
- Dates are commonly formatted as MM/YYYY or Month YYYY
- Bullet points indicate list items (skills, responsibilities, achievements)
- Horizontal lines may separate major sections
- Whitespace indicates section boundaries

COMMON RESUME FORMATS:
- LinkedIn Export: Sections in order (Profile, Summary, Experience, Education, Skills)
- Indeed Resume: Simple layout, minimal formatting
- Traditional: Contact info at top, experience/education sequential
- Modern: Sidebar with contact/skills, main content with experience/education
- ATS-Friendly: Plain text, no tables, clear section headings

OUTPUT FORMAT:
Return a complete ResumeJson object with this structure:
{
  "profile": {
    "fullName": "string",
    "email": "string",
    "phone": "string",
    "location": "string",
    "website": "string",
    "linkedin": "string",
    "github": "string"
  },
  "summary": "string (if professional summary present)",
  "work": [
    {
      "company": "string",
      "position": "string",
      "location": "string",
      "startDate": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD or Present",
      "description": "string",
      "highlights": ["string"]
    }
  ],
  "education": [
    {
      "institution": "string",
      "degree": "string",
      "field": "string",
      "location": "string",
      "graduationDate": "YYYY-MM-DD",
      "gpa": "number or null"
    }
  ],
  "skills": {
    "categories": [
      {
        "name": "string (e.g., Programming Languages, Frameworks)",
        "skills": ["string"]
      }
    ]
  },
  "projects": [...],
  "certifications": [...],
  "awards": [...],
  "languages": [...]
}

QUALITY CHECKS:
- All dates in ISO format (YYYY-MM-DD)
- Email addresses validated (contains @)
- Phone numbers cleaned (remove formatting, keep digits and +)
- URLs validated (must start with http/https)
- No duplicate entries in arrays

Begin extraction now.`;
}

/**
 * Personal information for resume generation
 */
export interface PersonalInfo {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
}

/**
 * Build generation prompt for creating resume from job description
 *
 * @param jobDescription - Target job description
 * @param personalInfo - Optional personal information to seed the resume
 * @returns Formatted prompt for AI generation
 */
export function buildGenerationPrompt(
  jobDescription: string,
  personalInfo?: PersonalInfo
): string {
  const personalInfoText = personalInfo
    ? `
PERSONAL INFORMATION:
Name: ${personalInfo.name || 'Not provided'}
Email: ${personalInfo.email || 'Not provided'}
Phone: ${personalInfo.phone || 'Not provided'}
Location: ${personalInfo.location || 'Not provided'}
`
    : '';

  return `You are a professional resume writer. Generate a complete, ATS-optimized resume tailored to this job description.

JOB DESCRIPTION:
${jobDescription}
${personalInfoText}

STRICT REQUIREMENTS:
1. TRUTHFULNESS: Create 3-4 work experiences highly relevant to the job (realistic but not fabricated from real people)
2. PROJECTS: Include 2-3 projects showcasing required skills from the job description
3. SKILLS: Extract key skills directly from the job description
4. ACTION VERBS: Use strong action verbs (Led, Architected, Implemented, Designed, Built)
5. QUANTIFIABLE ACHIEVEMENTS: Include metrics where appropriate (%, time saved, users impacted)
6. DATE FORMAT: Use ISO strings (YYYY-MM-DD) for all dates
7. URL FORMAT: All URLs must include protocol (https://linkedin.com/... not linkedin.com/...)
8. CONCISENESS: Keep bullet points to 10-15 words maximum
9. EDUCATION: Include relevant education and certifications
10. CONSISTENCY: Use present tense for current roles, past tense for previous roles
11. ATS OPTIMIZATION: Use standard section headers, avoid graphics or tables
12. OUTPUT KEYS: Always include top-level arrays for education, projects, and skills. Do not omit these keys.
13. MINIMUM CONTENT: Include at least 1 education entry, at least 1 projects entry, and at least 1 skills group (with 5-8 items).
14. LAYOUT FIELDS: Do not include settings or appearance unless necessary. If included, margins must be pixel values between 8 and 144 (not inches).

OUTPUT FORMAT:
Generate a complete ResumeJson object with:
- profile: Complete contact information
- summary: 2-3 sentence professional summary highlighting key qualifications
- work: 3-4 relevant work experiences with compelling bullet points (array)
- education: At least 1 relevant degree and institution (array)
- skills: At least 1 group with 5-8 items matching job requirements (array)
- projects: 2-3 projects demonstrating required skills (array)
- certifications: Relevant certifications (if applicable to the role)

Focus on creating a resume that would realistically match this job posting while being truthful and impactful.`;
}

/**
 * Build repair prompt for invalid JSON responses
 * Used when initial generation fails schema validation
 *
 * @param invalidResponse - The invalid response from previous attempt
 * @param validationError - Error message from Zod validation
 * @returns Repair prompt
 */
export function buildRepairPrompt(
  invalidResponse: string,
  validationError: string
): string {
  return `The previous resume generation had validation errors. Please fix them.

VALIDATION ERROR:
${validationError}

PREVIOUS RESPONSE:
${invalidResponse}

Fix the validation errors while maintaining the content quality. Ensure the output is a valid ResumeJson object.`;
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
