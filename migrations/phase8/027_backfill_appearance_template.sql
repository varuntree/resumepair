-- Migration: Backfill appearance template identifiers
-- Phase: 8
-- Date: 2025-10-08

BEGIN;

UPDATE documents
SET data = jsonb_set(
  data,
  '{appearance}',
  jsonb_set(
    COALESCE(data->'appearance', '{}'::jsonb),
    '{template}',
    to_jsonb('onyx'::text),
    true
  ),
  true
)
WHERE type = 'resume'
  AND (data->'appearance'->>'template') IS NULL;

UPDATE documents
SET data = jsonb_set(
  data,
  '{appearance}',
  jsonb_set(
    COALESCE(data->'appearance', '{}'::jsonb),
    '{template}',
    to_jsonb('onyx'::text),
    true
  ),
  true
)
WHERE type = 'cover-letter'
  AND (data->'appearance'->>'template') IS NULL;

UPDATE resumes
SET data = jsonb_set(
  data,
  '{appearance}',
  jsonb_set(
    COALESCE(data->'appearance', '{}'::jsonb),
    '{template}',
    to_jsonb('onyx'::text),
    true
  ),
  true
)
WHERE (data->'appearance'->>'template') IS NULL;

UPDATE resume_versions
SET data = jsonb_set(
  data,
  '{appearance}',
  jsonb_set(
    COALESCE(data->'appearance', '{}'::jsonb),
    '{template}',
    to_jsonb('onyx'::text),
    true
  ),
  true
)
WHERE (data->'appearance'->>'template') IS NULL;

UPDATE cover_letters
SET data = jsonb_set(
  data,
  '{appearance}',
  jsonb_set(
    COALESCE(data->'appearance', '{}'::jsonb),
    '{template}',
    to_jsonb('onyx'::text),
    true
  ),
  true
)
WHERE (data->'appearance'->>'template') IS NULL;

UPDATE cover_letter_versions
SET data = jsonb_set(
  data,
  '{appearance}',
  jsonb_set(
    COALESCE(data->'appearance', '{}'::jsonb),
    '{template}',
    to_jsonb('onyx'::text),
    true
  ),
  true
)
WHERE (data->'appearance'->>'template') IS NULL;

COMMIT;
