-- 1. Tables currently present in public.
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. Columns and data types for the eight ERD tables.
SELECT table_name, ordinal_position, column_name, data_type,
       character_maximum_length, numeric_precision, numeric_scale,
       is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN (
    'users', 'activity_logs', 'activity_types', 'emission_factors',
    'user_goals', 'badges', 'user_badges', 'feedback'
  )
ORDER BY table_name, ordinal_position;

-- 3. Primary keys, foreign keys, and unique constraints for the eight ERD tables.
SELECT tc.table_name, tc.constraint_name, tc.constraint_type,
       kcu.column_name,
       ccu.table_name AS referenced_table,
       ccu.column_name AS referenced_column
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu
  ON tc.constraint_schema = kcu.constraint_schema
 AND tc.constraint_name = kcu.constraint_name
 AND tc.table_name = kcu.table_name
LEFT JOIN information_schema.constraint_column_usage ccu
  ON tc.constraint_schema = ccu.constraint_schema
 AND tc.constraint_name = ccu.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.table_name IN (
    'users', 'activity_logs', 'activity_types', 'emission_factors',
    'user_goals', 'badges', 'user_badges', 'feedback'
  )
  AND tc.constraint_type IN ('PRIMARY KEY', 'FOREIGN KEY', 'UNIQUE')
ORDER BY tc.table_name, tc.constraint_type, tc.constraint_name;

-- 4. Row counts for the eight ERD tables (only tables that exist).
SELECT 'users' AS table_name, COUNT(*) AS row_count FROM public.users
UNION ALL SELECT 'activity_logs', COUNT(*) FROM public.activity_logs
UNION ALL SELECT 'activity_types', COUNT(*) FROM public.activity_types
UNION ALL SELECT 'emission_factors', COUNT(*) FROM public.emission_factors
UNION ALL SELECT 'user_goals', COUNT(*) FROM public.user_goals
UNION ALL SELECT 'badges', COUNT(*) FROM public.badges
UNION ALL SELECT 'user_badges', COUNT(*) FROM public.user_badges
UNION ALL SELECT 'feedback', COUNT(*) FROM public.feedback;

-- 5. Existing users and IDs. Do not assume an ID value.
SELECT id, name, email, role, is_active, created_at
FROM public.users
ORDER BY created_at;

-- 6. Activity types and the units defined for them.
SELECT id, name, category, unit, is_active
FROM public.activity_types
ORDER BY category, name;

-- 7. Active emission factors and their source/unit information.
SELECT ef.id, at.name AS activity_type, at.category,
       ef.region, ef.value_per_unit, ef.unit, ef.source, ef.is_active
FROM public.emission_factors ef
JOIN public.activity_types at ON at.id = ef.activity_type_id
WHERE ef.is_active = TRUE
ORDER BY at.category, at.name, ef.region, ef.unit;

-- 8. Potential duplicate active factors for same type/region/unit.
SELECT activity_type_id, COALESCE(region, '') AS region_key, unit,
       COUNT(*) AS active_factor_count
FROM public.emission_factors
WHERE is_active = TRUE
GROUP BY activity_type_id, COALESCE(region, ''), unit
HAVING COUNT(*) > 1
ORDER BY activity_type_id, region_key, unit;

-- 9. Activity logs whose activity type has no active factor with the same unit.
-- The ERD has no unit column on activity_logs, so this checks factor availability
-- for each referenced activity type; it cannot compare a per-log unit.
SELECT al.id AS activity_log_id, al.activity_type_id, at.name AS activity_type
FROM public.activity_logs al
JOIN public.activity_types at ON at.id = al.activity_type_id
WHERE NOT EXISTS (
    SELECT 1
    FROM public.emission_factors ef
    WHERE ef.activity_type_id = al.activity_type_id
      AND ef.is_active = TRUE
      AND ef.unit = at.unit
)
ORDER BY al.activity_date;

-- 10. Stored emissions compared with value * active factor.
-- Returns rows where no active factor exists or no matching factor can be chosen.
-- If several active factors exist for one activity type, inspect them in section 8
-- before interpreting the calculated difference.
SELECT al.id AS activity_log_id, al.activity_date, at.name AS activity_type,
       al.value, at.unit, al.calculated_emission,
       ef.value_per_unit,
       ROUND((al.value * ef.value_per_unit)::numeric, 2) AS expected_emission
FROM public.activity_logs al
JOIN public.activity_types at ON at.id = al.activity_type_id
LEFT JOIN LATERAL (
    SELECT value_per_unit
    FROM public.emission_factors
    WHERE activity_type_id = al.activity_type_id
      AND is_active = TRUE
      AND unit = at.unit
    ORDER BY created_at DESC
    LIMIT 1
) ef ON TRUE
WHERE ef.value_per_unit IS NULL
   OR al.calculated_emission IS DISTINCT FROM ROUND((al.value * ef.value_per_unit)::numeric, 2)
ORDER BY al.activity_date;

-- 11. Foreign-key orphan checks for ERD relationships.
SELECT 'activity_logs.user_id' AS relationship, COUNT(*) AS orphan_count
FROM public.activity_logs al LEFT JOIN public.users u ON u.id = al.user_id
WHERE u.id IS NULL
UNION ALL
SELECT 'activity_logs.activity_type_id', COUNT(*)
FROM public.activity_logs al LEFT JOIN public.activity_types at ON at.id = al.activity_type_id
WHERE at.id IS NULL
UNION ALL
SELECT 'emission_factors.activity_type_id', COUNT(*)
FROM public.emission_factors ef LEFT JOIN public.activity_types at ON at.id = ef.activity_type_id
WHERE at.id IS NULL
UNION ALL
SELECT 'user_goals.user_id', COUNT(*)
FROM public.user_goals ug LEFT JOIN public.users u ON u.id = ug.user_id
WHERE u.id IS NULL
UNION ALL
SELECT 'user_badges.user_id', COUNT(*)
FROM public.user_badges ub LEFT JOIN public.users u ON u.id = ub.user_id
WHERE u.id IS NULL
UNION ALL
SELECT 'user_badges.badge_id', COUNT(*)
FROM public.user_badges ub LEFT JOIN public.badges b ON b.id = ub.badge_id
WHERE b.id IS NULL
UNION ALL
SELECT 'feedback.user_id', COUNT(*)
FROM public.feedback f LEFT JOIN public.users u ON u.id = f.user_id
WHERE u.id IS NULL;

-- 12. Check if the Flyway history table exists before querying it.
SELECT table_schema, table_name
FROM information_schema.tables
WHERE table_name = 'flyway_schema_history'
ORDER BY table_schema;

-- If section 12 shows the history table under public, run separately:
-- SELECT installed_rank, version, description, success
-- FROM public.flyway_schema_history
-- ORDER BY installed_rank;
