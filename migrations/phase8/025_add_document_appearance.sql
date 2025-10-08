-- Migration: Add per-document appearance metadata
-- Phase: 8
-- Date: 2025-10-08

BEGIN;

-- Seed appearance defaults for resumes lacking metadata
UPDATE documents
SET data = jsonb_set(
  data,
  '{appearance}',
  jsonb_build_object(
    'theme', jsonb_build_object(
      'background', '#ffffff',
      'text', '#111827',
      'primary', '#2563eb'
    ),
    'typography', jsonb_build_object(
      'fontFamily', 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      'fontSize', 16,
      'lineHeight', 1.4
    ),
    'layout', jsonb_build_object(
      'pageFormat', coalesce(data->'settings'->>'pageSize', 'Letter'),
      'margin', 48,
      'showPageNumbers', false
    )
  ),
  true
)
WHERE type = 'resume' AND NOT (data ? 'appearance');

-- Seed appearance defaults for cover letters lacking metadata
UPDATE documents
SET data = jsonb_set(
  data,
  '{appearance}',
  jsonb_build_object(
    'theme', jsonb_build_object(
      'background', '#ffffff',
      'text', '#1f2937',
      'primary', '#1d4ed8'
    ),
    'typography', jsonb_build_object(
      'fontFamily', 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      'fontSize', 16,
      'lineHeight', 1.5
    ),
    'layout', jsonb_build_object(
      'pageFormat', coalesce(data->'settings'->>'pageSize', 'Letter'),
      'margin', 64,
      'showPageNumbers', false
    )
  ),
  true
)
WHERE type = 'cover-letter' AND NOT (data ? 'appearance');

COMMIT;
