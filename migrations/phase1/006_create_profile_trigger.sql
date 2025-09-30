-- Migration: Create Profile Auto-Creation Trigger
-- Purpose: Automatically create profile + preferences on user signup
-- Phase: Phase 1 - Foundation
-- Date: 2025-09-30
-- Status: NOT APPLIED - Awaiting user permission

-- Function: Auto-create profile and preferences on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Ensure stable search_path for security definer
  PERFORM set_config('search_path', 'public', true);
  -- Insert profile (extract name from OAuth metadata if available)
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email
  );

  -- Insert default preferences
  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$;

-- Trigger: Fire on every new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Add comments
COMMENT ON FUNCTION public.handle_new_user IS 'Auto-creates profile and preferences for new authenticated users';
COMMENT ON TRIGGER on_auth_user_created ON auth.users IS 'Automatically creates profile and preferences after OAuth signup';
