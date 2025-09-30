import { NextResponse } from "next/server";

/**
 * Standard API response envelope
 * All API routes return this structure for consistency
 */
export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
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
  error?: string
): NextResponse<ApiResponse<never>> {
  return NextResponse.json(
    {
      success: false,
      // message: Canonical user-facing text (clients should prefer this)
      message,
      // error: Optional technical detail (useful for logging/debugging)
      error,
    },
    { status }
  );
}
