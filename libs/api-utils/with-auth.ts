import { NextRequest, NextResponse } from "next/server";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/libs/supabase/server";
import { ApiResponse, apiError } from "./responses";

/**
 * Handler function type for authenticated API routes
 * Receives the authenticated user as a parameter
 */
type AuthenticatedHandler<T = unknown> = (
  req: NextRequest,
  user: User
) => Promise<NextResponse<ApiResponse<T>>>;

/**
 * Wrapper for protected API routes requiring authentication
 * Automatically checks user authentication and injects the user object
 *
 * @param handler - The API route handler function that receives the authenticated user
 * @returns Wrapped handler with auth check and error handling
 *
 * @example
 * ```typescript
 * export const POST = withAuth(async (req, user) => {
 *   // user is guaranteed to be authenticated
 *   const data = await getUserData(user.id);
 *   return apiSuccess(data);
 * });
 * ```
 */
export function withAuth<T = unknown>(
  handler: AuthenticatedHandler<T>
): (req: NextRequest) => Promise<NextResponse<ApiResponse<T>>> {
  return async (req: NextRequest): Promise<NextResponse<ApiResponse<T>>> => {
    try {
      const supabase = createClient();

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        return apiError(
          401,
          "You must be logged in to access this resource",
          authError?.message
        );
      }

      return await handler(req, user);
    } catch (error) {
      console.error("Auth Handler Error:", error);

      const errorMessage = error instanceof Error
        ? error.message
        : "An unknown error occurred";

      return apiError(500, "Internal server error", errorMessage);
    }
  };
}