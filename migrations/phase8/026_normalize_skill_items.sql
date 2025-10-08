-- Migration: Normalize resume skill items to structured objects
-- Phase: 8
-- Date: 2025-10-08

BEGIN;

WITH normalized_skills AS (
  SELECT
    id,
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'category', skill->>'category',
            'items',
              COALESCE(
                (
                  SELECT jsonb_agg(
                    jsonb_build_object(
                      'name', item_data.name,
                      'level', item_data.level
                    )
                  )
                  FROM (
                    SELECT
                      CASE
                        WHEN jsonb_typeof(item) = 'string' THEN NULLIF(trim(item #>> '{}'), '')
                        WHEN jsonb_typeof(item) = 'object' THEN
                          COALESCE(
                            NULLIF(trim(item->>'name'), ''),
                            NULLIF(trim(item->>'label'), '')
                          )
                        ELSE NULL
                      END AS name,
                      CASE
                        WHEN jsonb_typeof(item) = 'object' AND item ? 'level' THEN
                          CASE
                            WHEN jsonb_typeof(item->'level') = 'number' THEN
                              LEAST(
                                5,
                                GREATEST(
                                  0,
                                  ROUND((item->>'level')::numeric)::int
                                )
                              )
                            WHEN jsonb_typeof(item->'level') = 'string' THEN
                              CASE
                                WHEN lower(item->>'level') IN ('hidden', 'beginner', 'developing', 'competent', 'proficient', 'expert') THEN
                                  CASE lower(item->>'level')
                                    WHEN 'hidden' THEN 0
                                    WHEN 'beginner' THEN 1
                                    WHEN 'developing' THEN 2
                                    WHEN 'competent' THEN 3
                                    WHEN 'proficient' THEN 4
                                    WHEN 'expert' THEN 5
                                  END
                                WHEN (item->>'level') ~ '^[0-5]$' THEN (item->>'level')::int
                                ELSE 3
                              END
                            ELSE 3
                          END
                        ELSE 3
                      END AS level
                    FROM jsonb_array_elements(
                      CASE
                        WHEN jsonb_typeof(skill->'items') = 'array' THEN skill->'items'
                        ELSE '[]'::jsonb
                      END
                    ) AS item
                  ) AS item_data
                  WHERE item_data.name IS NOT NULL
                ),
                '[]'::jsonb
              )
          )
        )
        FROM jsonb_array_elements(data->'skills') AS skill
      ),
      '[]'::jsonb
    ) AS skills_json
  FROM documents
  WHERE type = 'resume' AND data ? 'skills'
)
UPDATE documents d
SET data = jsonb_set(d.data, '{skills}', normalized_skills.skills_json, true)
FROM normalized_skills
WHERE d.id = normalized_skills.id;

WITH normalized_resume_rows AS (
  SELECT
    id,
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'category', skill->>'category',
            'items',
              COALESCE(
                (
                  SELECT jsonb_agg(
                    jsonb_build_object(
                      'name', item_data.name,
                      'level', item_data.level
                    )
                  )
                  FROM (
                    SELECT
                      CASE
                        WHEN jsonb_typeof(item) = 'string' THEN NULLIF(trim(item #>> '{}'), '')
                        WHEN jsonb_typeof(item) = 'object' THEN
                          COALESCE(
                            NULLIF(trim(item->>'name'), ''),
                            NULLIF(trim(item->>'label'), '')
                          )
                        ELSE NULL
                      END AS name,
                      CASE
                        WHEN jsonb_typeof(item) = 'object' AND item ? 'level' THEN
                          CASE
                            WHEN jsonb_typeof(item->'level') = 'number' THEN
                              LEAST(
                                5,
                                GREATEST(
                                  0,
                                  ROUND((item->>'level')::numeric)::int
                                )
                              )
                            WHEN jsonb_typeof(item->'level') = 'string' THEN
                              CASE
                                WHEN lower(item->>'level') IN ('hidden', 'beginner', 'developing', 'competent', 'proficient', 'expert') THEN
                                  CASE lower(item->>'level')
                                    WHEN 'hidden' THEN 0
                                    WHEN 'beginner' THEN 1
                                    WHEN 'developing' THEN 2
                                    WHEN 'competent' THEN 3
                                    WHEN 'proficient' THEN 4
                                    WHEN 'expert' THEN 5
                                  END
                                WHEN (item->>'level') ~ '^[0-5]$' THEN (item->>'level')::int
                                ELSE 3
                              END
                            ELSE 3
                          END
                        ELSE 3
                      END AS level
                    FROM jsonb_array_elements(
                      CASE
                        WHEN jsonb_typeof(skill->'items') = 'array' THEN skill->'items'
                        ELSE '[]'::jsonb
                      END
                    ) AS item
                  ) AS item_data
                  WHERE item_data.name IS NOT NULL
                ),
                '[]'::jsonb
              )
          )
        )
        FROM jsonb_array_elements(data->'skills') AS skill
      ),
      '[]'::jsonb
    ) AS skills_json
  FROM resumes
  WHERE data ? 'skills'
)
UPDATE resumes r
SET data = jsonb_set(r.data, '{skills}', normalized_resume_rows.skills_json, true)
FROM normalized_resume_rows
WHERE r.id = normalized_resume_rows.id;

WITH normalized_resume_versions AS (
  SELECT
    id,
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'category', skill->>'category',
            'items',
              COALESCE(
                (
                  SELECT jsonb_agg(
                    jsonb_build_object(
                      'name', item_data.name,
                      'level', item_data.level
                    )
                  )
                  FROM (
                    SELECT
                      CASE
                        WHEN jsonb_typeof(item) = 'string' THEN NULLIF(trim(item #>> '{}'), '')
                        WHEN jsonb_typeof(item) = 'object' THEN
                          COALESCE(
                            NULLIF(trim(item->>'name'), ''),
                            NULLIF(trim(item->>'label'), '')
                          )
                        ELSE NULL
                      END AS name,
                      CASE
                        WHEN jsonb_typeof(item) = 'object' AND item ? 'level' THEN
                          CASE
                            WHEN jsonb_typeof(item->'level') = 'number' THEN
                              LEAST(
                                5,
                                GREATEST(
                                  0,
                                  ROUND((item->>'level')::numeric)::int
                                )
                              )
                            WHEN jsonb_typeof(item->'level') = 'string' THEN
                              CASE
                                WHEN lower(item->>'level') IN ('hidden', 'beginner', 'developing', 'competent', 'proficient', 'expert') THEN
                                  CASE lower(item->>'level')
                                    WHEN 'hidden' THEN 0
                                    WHEN 'beginner' THEN 1
                                    WHEN 'developing' THEN 2
                                    WHEN 'competent' THEN 3
                                    WHEN 'proficient' THEN 4
                                    WHEN 'expert' THEN 5
                                  END
                                WHEN (item->>'level') ~ '^[0-5]$' THEN (item->>'level')::int
                                ELSE 3
                              END
                            ELSE 3
                          END
                        ELSE 3
                      END AS level
                    FROM jsonb_array_elements(
                      CASE
                        WHEN jsonb_typeof(skill->'items') = 'array' THEN skill->'items'
                        ELSE '[]'::jsonb
                      END
                    ) AS item
                  ) AS item_data
                  WHERE item_data.name IS NOT NULL
                ),
                '[]'::jsonb
              )
          )
        )
        FROM jsonb_array_elements(data->'skills') AS skill
      ),
      '[]'::jsonb
    ) AS skills_json
  FROM resume_versions
  WHERE data ? 'skills'
)
UPDATE resume_versions rv
SET data = jsonb_set(rv.data, '{skills}', normalized_resume_versions.skills_json, true)
FROM normalized_resume_versions
WHERE rv.id = normalized_resume_versions.id;

COMMIT;
