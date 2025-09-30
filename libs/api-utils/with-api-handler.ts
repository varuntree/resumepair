import { NextRequest, NextResponse } from "next/server";
import { ApiResponse, apiError } from "./responses";

/**
 * Handler function type for public API routes
 */
type Handler<T = unknown> = (
  req: NextRequest
) => Promise<NextResponse<ApiResponse<T>>>;

/**
 * Wrapper for public API routes
 * Provides consistent error handling and response envelope
 *
 * @param handler - The API route handler function
 * @returns Wrapped handler with error handling
 *
 * @example
 * ```typescript
 * export const GET = withApiHandler(async (req) => {
 *   const data = await fetchPublicData();
 *   return apiSuccess(data);
 * });
 * ```
 */
export function withApiHandler<T = unknown>(
  handler: Handler<T>
): (req: NextRequest) => Promise<NextResponse<ApiResponse<T>>> {
  return async (req: NextRequest): Promise<NextResponse<ApiResponse<T>>> => {
    try {
      return await handler(req);
    } catch (error) {
      console.error("API Handler Error:", error);

      const errorMessage = error instanceof Error
        ? error.message
        : "An unknown error occurred";

      return apiError(500, "Internal server error", errorMessage);
    }
  };
}