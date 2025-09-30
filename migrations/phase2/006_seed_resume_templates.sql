-- =============================================================================
-- Migration: Seed resume templates (OPTIONAL for Phase 2)
-- Description: Insert starter templates with example content
-- Author: Phase 2 Implementation
-- Date: 2025-09-30
-- =============================================================================

-- NOTE: This migration is OPTIONAL and can be deferred to Phase 2.5
-- It inserts 1 starter template with empty ResumeJson data

-- Insert: Minimal Professional Template (default)
INSERT INTO public.resume_templates (id, name, description, category, is_default, data)
VALUES (
  gen_random_uuid(),
  'Blank Resume',
  'Start with an empty resume template',
  'Professional',
  TRUE,
  '{
    "profile": {
      "fullName": "",
      "email": "",
      "phone": "",
      "location": {}
    },
    "summary": "",
    "work": [],
    "education": [],
    "projects": [],
    "skills": [],
    "settings": {
      "locale": "en-US",
      "dateFormat": "US",
      "fontFamily": "Inter",
      "fontSizeScale": 1.0,
      "lineSpacing": 1.2,
      "colorTheme": "default",
      "iconSet": "lucide",
      "showIcons": false,
      "sectionOrder": ["profile", "summary", "work", "education", "projects", "skills"],
      "pageSize": "Letter"
    }
  }'::jsonb
)
ON CONFLICT DO NOTHING;