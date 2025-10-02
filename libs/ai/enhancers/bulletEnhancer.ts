/**
 * Bullet Point Enhancement Module
 *
 * Improves resume bullet points using AI with action verbs,
 * quantification, and professional formatting.
 *
 * @module libs/ai/enhancers/bulletEnhancer
 */

import { generateText } from 'ai';
import { aiModel, TEMPERATURE_BY_OPERATION } from '@/libs/ai/provider';

/**
 * Context for bullet point enhancement
 */
export interface BulletContext {
  role?: string;
  industry?: string;
  jobDescription?: string;
}

/**
 * Enhanced bullet point result
 */
export interface BulletEnhancement {
  enhanced: string;
  original: string;
  changes: string[];
}

/**
 * Enhance a single bullet point
 *
 * @param bullet - Original bullet point text
 * @param context - Optional context (role, industry, job description)
 * @returns Enhanced bullet with list of improvements
 */
export async function enhanceBullet(
  bullet: string,
  context?: BulletContext
): Promise<BulletEnhancement> {
  const contextText = buildContextText(context);

  const prompt = `You are enhancing a resume bullet point. Make it more impactful while keeping the core achievement.

GUIDELINES:
- Start with strong action verbs (Led, Drove, Achieved, Implemented, Designed, Built, Architected)
- Add quantifiable metrics where possible (%, $, #, time saved, users impacted)
- Keep to 10-15 words maximum
- Use past tense for completed work
- Be specific and concrete
${contextText}

ORIGINAL BULLET:
${bullet}

Provide the enhanced bullet and list exactly what improvements were made.

Format your response EXACTLY as:
Enhanced: [improved bullet point]

Changes:
- [improvement 1]
- [improvement 2]
- [improvement 3]`;

  try {
    const result = await generateText({
      model: aiModel,
      prompt,
      temperature: TEMPERATURE_BY_OPERATION.enhance,
    });

    const enhanced = extractEnhancement(result.text);
    const changes = extractChanges(result.text);

    return {
      enhanced,
      original: bullet,
      changes,
    };
  } catch (error) {
    throw new Error(
      `Bullet enhancement failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Build context text from optional context object
 */
function buildContextText(context?: BulletContext): string {
  if (!context) return '';

  const parts: string[] = [];

  if (context.role) {
    parts.push(`Role: ${context.role}`);
  }

  if (context.industry) {
    parts.push(`Industry: ${context.industry}`);
  }

  if (context.jobDescription) {
    parts.push(`Target Job: ${context.jobDescription.substring(0, 200)}...`);
  }

  return parts.length > 0 ? '\n' + parts.join('\n') : '';
}

/**
 * Extract enhanced bullet from AI response
 */
function extractEnhancement(text: string): string {
  const match = text.match(/Enhanced:\s*(.+?)(?:\n|$)/i);
  if (match) {
    return match[1].trim();
  }

  // Fallback: return first non-empty line
  const lines = text.split('\n').filter((line) => line.trim());
  return lines[0]?.trim() || text.trim();
}

/**
 * Extract list of changes from AI response
 */
function extractChanges(text: string): string[] {
  const changesMatch = text.match(/Changes:\s*((?:[-•]\s*.+\n?)+)/i);

  if (!changesMatch) {
    return ['Enhanced with improved action verbs and clarity'];
  }

  return changesMatch[1]
    .split('\n')
    .filter((line) => /^[-•]\s*.+/.test(line.trim()))
    .map((line) => line.replace(/^[-•]\s*/, '').trim())
    .filter((change) => change.length > 0);
}
