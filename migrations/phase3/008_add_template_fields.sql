-- Migration 008: Add Template and Customization Fields to Resumes Table
-- Phase: 3A - Template Foundation
-- Created: 2025-10-01
-- Purpose: Enable template selection and customization storage for resumes
--
-- IMPORTANT: This migration file is for documentation only.
-- DO NOT apply automatically. User must apply via Supabase MCP tools.
--
-- Tables Modified: resumes
-- New Columns: template_id (TEXT), customizations (JSONB)
-- New Indexes: idx_resumes_template_id
--
-- Rollback SQL (if needed):
--   ALTER TABLE resumes DROP COLUMN IF EXISTS template_id;
--   ALTER TABLE resumes DROP COLUMN IF EXISTS customizations;
--   DROP INDEX IF EXISTS idx_resumes_template_id;

-- Add template_id column with default value 'minimal'
ALTER TABLE resumes
  ADD COLUMN template_id TEXT DEFAULT 'minimal' NOT NULL;

-- Add customizations column for storing template-specific customizations
-- This is a JSONB column for flexible storage of colors, fonts, spacing, etc.
ALTER TABLE resumes
  ADD COLUMN customizations JSONB DEFAULT NULL;

-- Add index for querying resumes by template
-- Useful for: "Find all resumes using template X"
CREATE INDEX idx_resumes_template_id ON resumes(template_id);

-- Add comment to document the customizations schema
COMMENT ON COLUMN resumes.customizations IS 'JSONB storage for template customizations. Schema: { colors: { primary, secondary, accent, text, background, muted, border }, typography: { fontFamily, fontSize, lineHeight, fontWeight }, spacing: { sectionGap, itemGap, pagePadding }, icons: { enabled, style, size, color }, layout: { columns, sidebarPosition, headerAlignment, photoPosition } }';

-- RLS Policies: No changes needed
-- Users can only access their own resumes (policy already exists from Phase 2)
-- The existing RLS policy on user_id covers all columns including new ones

-- Validation: Template IDs should match registry
-- In Phase 3C, we may add a CHECK constraint or ENUM type:
--   CREATE TYPE template_type AS ENUM ('minimal', 'modern', 'classic', 'creative', 'technical', 'executive');
--   ALTER TABLE resumes ALTER COLUMN template_id TYPE template_type USING template_id::template_type;
-- For now, we keep it as TEXT for flexibility during development.
