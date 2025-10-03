/**
 * AI Cover Letter Generation Endpoint
 *
 * Generates a complete cover letter from a job description using streaming.
 * Uses Server-Sent Events (SSE) for real-time preview updates.
 *
 * @endpoint POST /api/v1/cover-letters/generate
 * @runtime edge (required for streaming)
 */

import { streamObject } from 'ai'
import { aiModel, TEMPERATURE_BY_OPERATION } from '@/libs/ai/provider'
import { CoverLetterJsonSchema } from '@/libs/validation/cover-letter'
import {
  buildCoverLetterGenerationPrompt,
  type CoverLetterTone,
  type CoverLetterLength,
  type ResumeContext,
} from '@/libs/ai/prompts/cover-letter'
import { z } from 'zod'
import { createClient } from '@/libs/supabase/server'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'
export const maxDuration = 60 // 60 seconds max for streaming

/**
 * Request validation schema
 */
const GenerationRequestSchema = z.object({
  jobDescription: z
    .string()
    .min(50, 'Job description too short (min 50 characters)')
    .max(5000, 'Job description too long (max 5000 characters)'),
  resumeId: z.string().uuid('Invalid resume ID').optional(),
  tone: z.enum(['formal', 'friendly', 'enthusiastic']).default('formal'),
  length: z.enum(['short', 'medium', 'long']).default('medium'),
})

/**
 * POST /api/v1/cover-letters/generate
 *
 * Generates cover letter from job description with real-time streaming.
 */
export async function POST(req: Request) {
  const startTime = Date.now()

  try {
    // Parse request body
    const body = await req.json()
    const validation = GenerationRequestSchema.safeParse(body)

    if (!validation.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid request',
          message: validation.error.errors[0]?.message || 'Validation failed',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    const { jobDescription, resumeId, tone, length } = validation.data

    // Fetch resume context if resumeId provided
    let resumeContext: ResumeContext | undefined

    if (resumeId) {
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Unauthorized',
            message: 'Authentication required',
          }),
          {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      }

      const { data: resume, error: resumeError } = await supabase
        .from('resumes')
        .select('data')
        .eq('id', resumeId)
        .eq('user_id', user.id)
        .eq('is_deleted', false)
        .single()

      if (!resumeError && resume?.data) {
        const { profile, summary, work, skills } = resume.data

        // Extract key skills from skills section
        const keySkills: string[] = []
        if (skills?.categories) {
          for (const category of skills.categories) {
            if (category.skills) {
              keySkills.push(...category.skills.slice(0, 5)) // Top 5 from each category
            }
          }
        }

        // Get most recent work experience
        const recentWork = work?.[0]

        resumeContext = {
          fullName: profile?.fullName || '',
          email: profile?.email || '',
          phone: profile?.phone,
          location: profile?.location,
          summary: summary,
          recentRole: recentWork?.position,
          recentCompany: recentWork?.company,
          keySkills: keySkills.slice(0, 10), // Top 10 skills overall
          yearsOfExperience: work ? work.length : undefined,
        }
      }
    }

    // Build generation prompt
    const prompt = buildCoverLetterGenerationPrompt(
      jobDescription,
      resumeContext,
      tone as CoverLetterTone,
      length as CoverLetterLength
    )

    // Start streaming
    const result = streamObject({
      model: aiModel,
      schema: CoverLetterJsonSchema,
      prompt,
      temperature: TEMPERATURE_BY_OPERATION.generate,
      maxRetries: 1, // Max 1 retry on error
    })

    // Create SSE stream
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        let sectionsGenerated = 0
        const totalSections = 4 // from, to, salutation, body, closing

        try {
          for await (const partialObject of result.partialObjectStream) {
            // Calculate progress based on sections completed
            const currentProgress = Math.min(
              sectionsGenerated / totalSections,
              0.95
            )

            // Send progress event
            controller.enqueue(
              encoder.encode(
                `event: progress\ndata: ${JSON.stringify({
                  type: 'progress',
                  progress: currentProgress,
                })}\n\n`
              )
            )

            // Send partial object update
            controller.enqueue(
              encoder.encode(
                `event: update\ndata: ${JSON.stringify({
                  type: 'update',
                  data: partialObject,
                })}\n\n`
              )
            )

            // Track sections
            if (partialObject.from) sectionsGenerated = Math.max(sectionsGenerated, 1)
            if (partialObject.to) sectionsGenerated = Math.max(sectionsGenerated, 2)
            if (partialObject.salutation) sectionsGenerated = Math.max(sectionsGenerated, 3)
            if (partialObject.body) sectionsGenerated = Math.max(sectionsGenerated, 4)
          }

          // Get final object
          const finalObject = await result.object

          // Send completion event
          const duration = Date.now() - startTime
          controller.enqueue(
            encoder.encode(
              `event: complete\ndata: ${JSON.stringify({
                type: 'complete',
                data: finalObject,
                duration,
                tone,
                length,
              })}\n\n`
            )
          )

          controller.close()
        } catch (error: unknown) {
          console.error('[AI Generate Cover Letter] Stream error:', error)

          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error occurred'

          // Send error event
          controller.enqueue(
            encoder.encode(
              `event: error\ndata: ${JSON.stringify({
                type: 'error',
                message: errorMessage,
                duration: Date.now() - startTime,
              })}\n\n`
            )
          )

          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no', // Disable nginx buffering
      },
    })
  } catch (error: unknown) {
    console.error('[AI Generate Cover Letter] Request error:', error)

    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Failed to generate cover letter'

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
        message: errorMessage,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
