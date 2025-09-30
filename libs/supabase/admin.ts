import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Create a Supabase service-role client.
 * Use ONLY in server-side (Node.js) contexts for admin operations.
 */
export function createAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error("Missing Supabase environment variables for admin client");
  }

  return createClient(url, serviceKey);
}

