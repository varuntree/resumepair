-- Phase 7: Cover Letters & Extended Documents
-- Migration 023: Seed cover letter templates
-- Description: Creates template metadata table and seeds 4 initial cover letter templates
-- Pattern: Template-driven rendering (same pattern as resume templates)

-- Create cover_letter_templates table
CREATE TABLE IF NOT EXISTS public.cover_letter_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('professional', 'creative', 'executive', 'modern')),
  preview_image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_templates_category ON public.cover_letter_templates(category) WHERE is_active = true;
CREATE INDEX idx_templates_sort ON public.cover_letter_templates(sort_order) WHERE is_active = true;

-- Trigger for updated_at
CREATE TRIGGER set_updated_at_on_templates
  BEFORE UPDATE ON public.cover_letter_templates
  FOR EACH ROW EXECUTE PROCEDURE public.tg_set_updated_at();

-- Seed 4 cover letter templates
-- NOTE: These correspond to template components in libs/templates/cover-letter/

-- Template 1: Classic Block (Professional category)
INSERT INTO public.cover_letter_templates (
  slug, name, description, category, sort_order
) VALUES (
  'classic-block',
  'Classic Block',
  'Traditional block-style cover letter with professional formatting. Ideal for corporate and formal applications.',
  'professional',
  1
) ON CONFLICT (slug) DO NOTHING;

-- Template 2: Modern Minimal (Modern category)
INSERT INTO public.cover_letter_templates (
  slug, name, description, category, sort_order
) VALUES (
  'modern-minimal',
  'Modern Minimal',
  'Clean, contemporary design with ample white space. Perfect for tech and creative industries.',
  'modern',
  2
) ON CONFLICT (slug) DO NOTHING;

-- Template 3: Creative Bold (Creative category)
INSERT INTO public.cover_letter_templates (
  slug, name, description, category, sort_order
) VALUES (
  'creative-bold',
  'Creative Bold',
  'Distinctive layout with accent colors and modern typography. Best for design and creative roles.',
  'creative',
  3
) ON CONFLICT (slug) DO NOTHING;

-- Template 4: Executive Formal (Executive category)
INSERT INTO public.cover_letter_templates (
  slug, name, description, category, sort_order
) VALUES (
  'executive-formal',
  'Executive Formal',
  'Prestigious, authoritative design for senior leadership positions. Emphasizes experience and gravitas.',
  'executive',
  4
) ON CONFLICT (slug) DO NOTHING;

-- Public read access (no RLS needed, templates are public)
ALTER TABLE public.cover_letter_templates ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read templates
CREATE POLICY "templates_select_all" ON public.cover_letter_templates
  FOR SELECT TO authenticated USING (true);

-- Add comments
COMMENT ON TABLE public.cover_letter_templates IS 'Cover letter template metadata. Template components live in libs/templates/cover-letter/{slug}/.';
COMMENT ON COLUMN public.cover_letter_templates.slug IS 'Unique template identifier matching directory name in libs/templates/cover-letter/';
COMMENT ON COLUMN public.cover_letter_templates.category IS 'Template category for filtering: professional, creative, executive, modern';
COMMENT ON COLUMN public.cover_letter_templates.preview_image_url IS 'Optional preview image URL (can be generated via screenshot or stored in Supabase Storage)';
