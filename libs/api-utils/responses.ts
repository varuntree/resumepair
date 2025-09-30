import { NextResponse } from "next/server";

/**
 * Standard API response envelope
 * All API routes return this structure for consistency
 */
export type ApiErrorObject = {
  code: string;
  message: string;
  details?: unknown;
};

export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  // message: canonical user-facing text (clients should prefer this)
  message?: string;
  // error: structured error details; keep backward compat with string
  error?: string | ApiErrorObject;
};

/**
 * Create a successful API response
 * @param data - The data to return
 * @param message - Optional success message
 * @returns NextResponse with ApiResponse envelope
 */
export function apiSuccess<T>(
  data: T,
  message?: string
): NextResponse<ApiResponse<T>> {
  return NextResponse.json({
    success: true,
    data,
    message,
  });
}

/**
 * Create an error API response
 * @param status - HTTP status code
 * @param message - User-facing error message
 * @param error - Optional technical error details
 * @returns NextResponse with ApiResponse envelope and error status
 */
export function apiError(
  status: number,
  message: string,
  error?: string | Record<string, unknown>,
  code?: string
): NextResponse<ApiResponse<never>> {
  // Map common HTTP statuses to default codes if none provided
  const defaultCode =
    code ||
    (status === 400
      ? "VALIDATION_ERROR"
      : status === 401
      ? "UNAUTHORIZED"
      : status === 403
      ? "FORBIDDEN"
      : status === 404
      ? "NOT_FOUND"
      : status === 429
      ? "RATE_LIMITED"
      : "INTERNAL_ERROR");

  const details =
    typeof error === "string" ? (error ? { info: error } : undefined) : error;

  return NextResponse.json(
    {
      success: false,
      message,
      error: {
        code: defaultCode,
        message,
        ...(details ? { details } : {}),
      } as ApiErrorObject,
    },
    { status }
  );
}
