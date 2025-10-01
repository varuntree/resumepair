import { NextResponse, type NextRequest } from "next/server";

/**
 * Edge-safe middleware session passthrough
 *
 * Rationale: Avoid importing supabase-js in Edge runtime to eliminate Node API warnings.
 * The app uses server/client helpers to manage sessions; middleware simply forwards requests
 * and preserves cookies without attempting token refresh here.
 */
export async function updateSession(request: NextRequest) {
  // Forward request with existing cookies; no side effects in Edge runtime
  return NextResponse.next({ request });
}
