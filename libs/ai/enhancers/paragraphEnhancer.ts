/**
 * Cover Letter Paragraph Enhancement Module
 *
 * Improves cover letter paragraphs using AI with professional tone,
 * compelling language, and clear value proposition.
 *
 * @module libs/ai/enhancers/paragraphEnhancer
 */

import { generateText } from 'ai'
import { aiModel, TEMPERATURE_BY_OPERATION } from '@/libs/ai/provider'

/**
 * Context for paragraph enhancement
 */
export interface ParagraphContext {
  role?: string
  companyName?: string
  industry?: string
  jobDescription?: string
  paragraphIndex?: number
  totalParagraphs?: number
}

/**
 * Enhanced paragraph result
 */
export interface ParagraphEnhancement {
  enhanced: string
  original: string
  changes: string[]
}

/**
 * Enhance a single cover letter paragraph
 *
 * @param paragraph - Original paragraph text
 * @param context - Optional context (role, company, industry, job description)
 * @returns Enhanced paragraph with list of improvements
 */
export async function enhanceParagraph(
  paragraph: string,
  context?: ParagraphContext
): Promise<ParagraphEnhancement> {
  const contextText = buildContextText(context)
  const positionGuidance = getPositionGuidance(context?.paragraphIndex, context?.totalParagraphs)

  const prompt = `You are enhancing a cover letter paragraph. Make it more compelling and professional while maintaining authenticity.

GUIDELINES:
- Use confident, professional tone
- Show enthusiasm for the role and company
- Highlight specific skills and achievements
- Be concise (3-5 sentences ideal)
- Avoid generic phrases ("I am writing to apply...")
- Use active voice and strong verbs
- Connect your experience to the company's needs
${positionGuidance}${contextText}

ORIGINAL PARAGRAPH:
${paragraph}

Provide the enhanced paragraph and list exactly what improvements were made.

Format your response EXACTLY as:
Enhanced: [improved paragraph]

Changes:
- [improvement 1]
- [improvement 2]
- [improvement 3]`

  try {
    const result = await generateText({
      model: aiModel,
      prompt,
      temperature: TEMPERATURE_BY_OPERATION.enhance,
    })

    const enhanced = extractEnhancement(result.text)
    const changes = extractChanges(result.text)

    return {
      enhanced,
      original: paragraph,
      changes,
    }
  } catch (error) {
    throw new Error(
      `Paragraph enhancement failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Build context text from optional context object
 */
function buildContextText(context?: ParagraphContext): string {
  if (!context) return ''

  const parts: string[] = []

  if (context.role) {
    parts.push(`Target Role: ${context.role}`)
  }

  if (context.companyName) {
    parts.push(`Company: ${context.companyName}`)
  }

  if (context.industry) {
    parts.push(`Industry: ${context.industry}`)
  }

  if (context.jobDescription) {
    parts.push(`Job Requirements: ${context.jobDescription.substring(0, 300)}...`)
  }

  return parts.length > 0 ? '\n' + parts.join('\n') : ''
}

/**
 * Get position-specific guidance based on paragraph index
 */
function getPositionGuidance(
  paragraphIndex?: number,
  totalParagraphs?: number
): string {
  if (paragraphIndex === undefined || totalParagraphs === undefined) {
    return ''
  }

  if (paragraphIndex === 0) {
    return '\n- Opening paragraph: Hook the reader, show enthusiasm, mention specific role'
  }

  if (paragraphIndex === totalParagraphs - 1) {
    return '\n- Closing paragraph: Call to action, reiterate interest, thank reader'
  }

  return '\n- Body paragraph: Showcase relevant experience, achievements, or skills'
}

/**
 * Extract enhanced paragraph from AI response
 */
function extractEnhancement(text: string): string {
  const match = text.match(/Enhanced:\s*(.+?)(?:\n\nChanges:|$)/is)
  if (match) {
    return match[1].trim()
  }

  // Fallback: return first meaningful block
  const lines = text.split('\n\n').filter((block) => block.trim())
  return lines[0]?.trim() || text.trim()
}

/**
 * Extract list of changes from AI response
 */
function extractChanges(text: string): string[] {
  const changesMatch = text.match(/Changes:\s*((?:[-•]\s*.+\n?)+)/i)

  if (!changesMatch) {
    return ['Enhanced with improved tone and clarity']
  }

  return changesMatch[1]
    .split('\n')
    .filter((line) => /^[-•]\s*.+/.test(line.trim()))
    .map((line) => line.replace(/^[-•]\s*/, '').trim())
    .filter((change) => change.length > 0)
}
