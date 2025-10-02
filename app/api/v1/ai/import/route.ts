/**
 * AI Import API Route - PDF Multimodal Streaming
 *
 * Parses PDF resume using Gemini multimodal with SSE streaming.
 * Edge runtime for optimal performance and streaming support.
 *
 * @route POST /api/v1/ai/import
 */

import { streamObject } from 'ai';
import { aiModel, TEMPERATURE_BY_OPERATION } from '@/libs/ai/provider';
import { ResumeJsonSchema } from '@/libs/validation/resume';
import { buildPDFExtractionPrompt } from '@/libs/ai/prompts';
import { z } from 'zod';
import { createClient } from '@/libs/supabase/server';
import { checkDailyQuota, incrementQuota } from '@/libs/ai/rateLimiter';
import { createOperation, calculateCost } from '@/libs/repositories/aiOperations';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds max for PDF parsing

/**
 * Request validation schema
 */
const ImportRequestSchema = z.object({
  fileData: z.string().min(1, 'File data is required'),
  fileName: z.string().min(1, 'File name is required'),
  mimeType: z.literal('application/pdf'),
});

/**
 * POST /api/v1/ai/import
 *
 * Parse PDF resume with Gemini multimodal streaming
 */
export async function POST(req: Request) {
  const startTime = Date.now();

  try {
    // Get user from Supabase
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
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
      );
    }

    // Parse and validate request
    const body = await req.json();
    const validation = ImportRequestSchema.safeParse(body);

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

    const { fileData, fileName } = validation.data;

    // Decode base64 to buffer
    const buffer = Buffer.from(fileData, 'base64');

    // Validate file size (10MB limit)
    if (buffer.length > 10 * 1024 * 1024) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'File too large',
          message: 'PDF must be under 10MB',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Check quota
    const quota = await checkDailyQuota(supabase, user.id);
    if (!quota.allowed) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Quota exceeded',
          message: quota.error || 'Daily quota exceeded',
          resetAt: quota.resetAt.toISOString(),
        }),
        {
          status: 429,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Build prompt
    const prompt = buildPDFExtractionPrompt();

    // Start streaming with Gemini multimodal
    const result = streamObject({
      model: aiModel,
      schema: ResumeJsonSchema,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'file',
              data: buffer,
              mimeType: 'application/pdf',
            },
          ],
        },
      ],
      temperature: 0.3, // Low for extraction accuracy
      maxRetries: 1,
    });

    // Create SSE stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const sectionsExtracted = new Set<string>();
        const totalSections = 7; // profile, summary, work, education, projects, skills, certifications

        try {
          for await (const partialObject of result.partialObjectStream) {
            // Track unique sections as they appear
            Object.keys(partialObject).forEach(key => {
              if (['profile', 'summary', 'work', 'education', 'projects', 'skills', 'certifications'].includes(key)) {
                sectionsExtracted.add(key);
              }
            });

            // Calculate progress based on sections completed
            const currentProgress = Math.min(
              sectionsExtracted.size / totalSections,
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
          }

          // Get final object
          const finalObject = await result.object;
          const duration = Date.now() - startTime;

          // Calculate cost and record operation
          const usage = await result.usage;
          const cost = calculateCost(usage.promptTokens, usage.completionTokens);

          await incrementQuota(supabase, user.id, usage.promptTokens + usage.completionTokens, cost);

          await createOperation(supabase, {
            user_id: user.id,
            operation_type: 'import',
            input_tokens: usage.promptTokens,
            output_tokens: usage.completionTokens,
            cost,
            duration_ms: duration,
            success: true,
          });

          // Send completion event
          controller.enqueue(
            encoder.encode(
              `event: complete\ndata: ${JSON.stringify({
                type: 'complete',
                data: finalObject,
                duration,
                fileName,
              })}\n\n`
            )
          );

          controller.close();
        } catch (error: unknown) {
          console.error('[AI Import] Stream error:', error);

          const errorMessage =
            error instanceof Error ? error.message : 'PDF parsing failed';

          // Log failed operation
          await createOperation(supabase, {
            user_id: user.id,
            operation_type: 'import',
            duration_ms: Date.now() - startTime,
            success: false,
            error_message: errorMessage,
          });

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
    console.error('[AI Import] Request error:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Failed to import PDF';

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
