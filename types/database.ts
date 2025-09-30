/**
 * Database Type Definitions
 * Type definitions for database entities
 */

/**
 * Profile entity from Supabase profiles table
 * Mirrors auth.users with additional user preferences
 */
export type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  email: string | null;
  customer_id: string | null;
  locale: string;
  date_format: string;
  page_size: string;
  created_at: string;
  updated_at: string;
};