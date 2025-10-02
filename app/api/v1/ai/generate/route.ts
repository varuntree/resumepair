/**
 * AI Resume Generation Endpoint
 *
 * Generates a complete resume from a job description using streaming.
 * Uses Server-Sent Events (SSE) for real-time preview updates.
 *
 * @endpoint POST /api/v1/ai/generate
 * @runtime edge (required for streaming)
 */

import { streamObject } from 'ai';
import { aiModel, TEMPERATURE_BY_OPERATION } from '@/libs/ai/provider';
import { ResumeJsonSchema } from '@/libs/validation/resume';
import { buildGenerationPrompt } from '@/libs/ai/prompts';
import { z } from 'zod';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds max for streaming

/**
 * Request validation schema
 */
const GenerationRequestSchema = z.object({
  jobDescription: z
    .string()
    .min(50, 'Job description too short (min 50 characters)')
    .max(5000, 'Job description too long (max 5000 characters)'),
  personalInfo: z
    .object({
      name: z.string().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
      location: z.string().optional(),
    })
    .optional(),
  template: z.string().default('minimal'),
});

/**
 * POST /api/v1/ai/generate
 *
 * Generates resume from job description with real-time streaming.
 */
export async function POST(req: Request) {
  const startTime = Date.now();

  try {
    // Parse request body
    const body = await req.json();
    const validation = GenerationRequestSchema.safeParse(body);

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
      );
    }

    const { jobDescription, personalInfo, template } = validation.data;

    // Build generation prompt
    const prompt = buildGenerationPrompt(jobDescription, personalInfo);

    // Start streaming
    const result = streamObject({
      model: aiModel,
      schema: ResumeJsonSchema,
      prompt,
      temperature: TEMPERATURE_BY_OPERATION.generate,
      maxRetries: 1, // Max 1 retry on error
    });

    // Create SSE stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let sectionsGenerated = 0;
        const totalSections = 7; // profile, summary, work, education, projects, skills, certifications

        try {
          for await (const partialObject of result.partialObjectStream) {
            // Calculate progress based on sections completed
            const currentProgress = Math.min(
              sectionsGenerated / totalSections,
              0.95
            );

            // Send progress event
            controller.enqueue(
              encoder.encode(
                `event: progress\ndata: ${JSON.stringify({
                  type: 'progress',
                  progress: currentProgress,
                })}\n\n`
              )
            );

            // Send partial object update
            controller.enqueue(
              encoder.encode(
                `event: update\ndata: ${JSON.stringify({
                  type: 'update',
                  data: partialObject,
                })}\n\n`
              )
            );

            // Track sections
            if (partialObject.profile) sectionsGenerated = Math.max(sectionsGenerated, 1);
            if (partialObject.summary) sectionsGenerated = Math.max(sectionsGenerated, 2);
            if (partialObject.work) sectionsGenerated = Math.max(sectionsGenerated, 3);
            if (partialObject.education) sectionsGenerated = Math.max(sectionsGenerated, 4);
            if (partialObject.projects) sectionsGenerated = Math.max(sectionsGenerated, 5);
            if (partialObject.skills) sectionsGenerated = Math.max(sectionsGenerated, 6);
            if (partialObject.certifications) sectionsGenerated = Math.max(sectionsGenerated, 7);
          }

          // Get final object
          const finalObject = await result.object;

          // Send completion event
          const duration = Date.now() - startTime;
          controller.enqueue(
            encoder.encode(
              `event: complete\ndata: ${JSON.stringify({
                type: 'complete',
                data: finalObject,
                duration,
                template,
              })}\n\n`
            )
          );

          controller.close();
        } catch (error: unknown) {
          console.error('[AI Generate] Stream error:', error);

          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error occurred';

          // Send error event
          controller.enqueue(
            encoder.encode(
              `event: error\ndata: ${JSON.stringify({
                type: 'error',
                message: errorMessage,
                duration: Date.now() - startTime,
              })}\n\n`
            )
          );

          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // Disable nginx buffering
      },
    });
  } catch (error: unknown) {
    console.error('[AI Generate] Request error:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Failed to generate resume';

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
    );
  }
}
