-- CarbonTrack V4: corrective migration and API test seed
-- Run ONLY after V1, V2 and (if applicable) V3 have been applied.
-- This is additive/corrective; do not edit migrations already applied in Supabase.
-- PostgreSQL / Supabase SQL Editor compatible.

BEGIN;

-- 1) Make reference rows safe to re-run and ensure expected categories exist.
INSERT INTO activity_categories (name, description)
VALUES
  ('transport', 'Travel and commuting activities including car, bus, train, and flights'),
  ('electricity', 'Home and workplace electricity consumption and energy usage'),
  ('food', 'Food and dietary choices including meat, dairy, and meals'),
  ('shopping', 'Consumer purchases including clothing, electronics, and goods'),
  ('waste', 'Waste disposal, recycling, and material consumption management')
ON CONFLICT (name) DO NOTHING;

-- 2) Ensure the activity types exist, without depending on numeric IDs.
INSERT INTO activity_types (category_id, name, unit_type, description, is_active)
SELECT c.id, x.name, x.unit_type, x.description, TRUE
FROM (VALUES
  ('transport', 'car', 'distance', 'Private vehicle travel'),
  ('transport', 'bus', 'distance', 'Public bus transportation'),
  ('transport', 'train', 'distance', 'Train or rail commute'),
  ('transport', 'flight', 'distance', 'Air travel'),
  ('transport', 'motorcycle', 'distance', 'Motorcycle travel'),
  ('transport', 'bicycle', 'distance', 'Bicycle travel'),
  ('transport', 'walking', 'distance', 'Walking'),
  ('electricity', 'home_electricity', 'kwh', 'Electricity consumed at home'),
  ('electricity', 'office_electricity', 'kwh', 'Electricity consumed at workplace'),
  ('electricity', 'renewable_electricity', 'kwh', 'Renewable energy consumption'),
  ('food', 'beef', 'kg', 'Beef consumption'),
  ('food', 'chicken', 'kg', 'Chicken consumption'),
  ('food', 'pork', 'kg', 'Pork consumption'),
  ('food', 'fish', 'kg', 'Fish consumption'),
  ('food', 'dairy', 'kg', 'Milk and dairy consumption'),
  ('food', 'vegetarian_meal', 'quantity', 'Vegetarian meal count'),
  ('food', 'vegan_meal', 'quantity', 'Vegan meal count'),
  ('shopping', 'clothing', 'items', 'New clothing item purchase'),
  ('shopping', 'electronics', 'items', 'Electronic devices and gadgets'),
  ('shopping', 'furniture', 'items', 'Furniture purchase'),
  ('shopping', 'household_goods', 'kg', 'Household items and supplies'),
  ('waste', 'landfill_waste', 'kg', 'Waste sent to landfill'),
  ('waste', 'recycling', 'kg', 'Recyclable material'),
  ('waste', 'composting', 'kg', 'Organic waste composting')
) AS x(category_name, name, unit_type, description)
JOIN activity_categories c ON c.name = x.category_name
ON CONFLICT (category_id, name) DO UPDATE
SET unit_type = EXCLUDED.unit_type,
    description = EXCLUDED.description,
    is_active = TRUE;

-- 3) Insert/repair emission factors using activity-type names, not assumed IDs.
-- Electricity figures below are DEMONSTRATION estimates (kg CO2e per kWh),
-- not verified authoritative regional factors. Replace source/version/values with
-- the project's chosen official source and region before production use.
INSERT INTO emission_factors
  (activity_type_id, source_name, source_version, factor_value, unit, region,
   scope, valid_from, valid_to, is_active, notes)
SELECT t.id, f.source_name, f.source_version, f.factor_value, f.unit, f.region,
       f.scope, f.valid_from, NULL, TRUE, f.notes
FROM (VALUES
  ('car', 0.192::numeric, 'km', 'EPA / project reference', '2024', 'global', 'DIRECT', TIMESTAMPTZ '2024-01-01 00:00:00+00', 'Illustrative passenger-car factor; verify source and methodology'),
  ('bus', 0.105::numeric, 'km', 'EPA / project reference', '2024', 'global', 'DIRECT', TIMESTAMPTZ '2024-01-01 00:00:00+00', 'Illustrative passenger-bus factor; verify source and methodology'),
  ('train', 0.065::numeric, 'km', 'EPA / project reference', '2024', 'global', 'DIRECT', TIMESTAMPTZ '2024-01-01 00:00:00+00', 'Illustrative rail factor; verify source and methodology'),
  ('bicycle', 0::numeric, 'km', 'Project demo', '2026', 'global', 'DIRECT', TIMESTAMPTZ '2026-01-01 00:00:00+00', 'Zero direct operational emissions for demo'),
  ('walking', 0::numeric, 'km', 'Project demo', '2026', 'global', 'DIRECT', TIMESTAMPTZ '2026-01-01 00:00:00+00', 'Zero direct operational emissions for demo'),
  ('home_electricity', 0.42::numeric, 'kWh', 'DEMO_ESTIMATE_NOT_VERIFIED', 'demo-1', 'unspecified', 'INDIRECT', TIMESTAMPTZ '2026-01-01 00:00:00+00', 'DEMO ONLY: replace with verified grid factor for the user's region'),
  ('office_electricity', 0.38::numeric, 'kWh', 'DEMO_ESTIMATE_NOT_VERIFIED', 'demo-1', 'unspecified', 'INDIRECT', TIMESTAMPTZ '2026-01-01 00:00:00+00', 'DEMO ONLY: replace with verified commercial electricity factor'),
  ('renewable_electricity', 0.01::numeric, 'kWh', 'DEMO_ESTIMATE_NOT_VERIFIED', 'demo-1', 'unspecified', 'INDIRECT', TIMESTAMPTZ '2026-01-01 00:00:00+00', 'DEMO ONLY: lifecycle estimate; verify technology and boundary'),
  ('beef', 27::numeric, 'kg', 'Project reference - verify', 'demo-1', 'unspecified', 'COMBINED', TIMESTAMPTZ '2026-01-01 00:00:00+00', 'Illustrative food factor; verify source and system boundary'),
  ('chicken', 6.9::numeric, 'kg', 'Project reference - verify', 'demo-1', 'unspecified', 'COMBINED', TIMESTAMPTZ '2026-01-01 00:00:00+00', 'Illustrative food factor; verify source and system boundary'),
  ('vegetarian_meal', 2::numeric, 'quantity', 'Project demo estimate', 'demo-1', 'unspecified', 'COMBINED', TIMESTAMPTZ '2026-01-01 00:00:00+00', 'Demo estimate per meal; verify methodology'),
  ('vegan_meal', 1.2::numeric, 'quantity', 'Project demo estimate', 'demo-1', 'unspecified', 'COMBINED', TIMESTAMPTZ '2026-01-01 00:00:00+00', 'Demo estimate per meal; verify methodology'),
  ('clothing', 3.5::numeric, 'items', 'Project demo estimate', 'demo-1', 'unspecified', 'COMBINED', TIMESTAMPTZ '2026-01-01 00:00:00+00', 'Demo estimate per item; verify methodology'),
  ('electronics', 12::numeric, 'items', 'Project demo estimate', 'demo-1', 'unspecified', 'COMBINED', TIMESTAMPTZ '2026-01-01 00:00:00+00', 'Demo estimate per item; verify methodology'),
  ('furniture', 25::numeric, 'items', 'Project demo estimate', 'demo-1', 'unspecified', 'COMBINED', TIMESTAMPTZ '2026-01-01 00:00:00+00', 'Demo estimate per item; verify methodology'),
  ('household_goods', 0.5::numeric, 'kg', 'Project demo estimate', 'demo-1', 'unspecified', 'COMBINED', TIMESTAMPTZ '2026-01-01 00:00:00+00', 'Demo estimate per kg; verify methodology'),
  ('landfill_waste', 0.8::numeric, 'kg', 'Project demo estimate', 'demo-1', 'unspecified', 'COMBINED', TIMESTAMPTZ '2026-01-01 00:00:00+00', 'Demo estimate per kg; verify methodology'),
  ('recycling', 0.15::numeric, 'kg', 'Project demo estimate', 'demo-1', 'unspecified', 'COMBINED', TIMESTAMPTZ '2026-01-01 00:00:00+00', 'Demo estimate per kg; verify methodology'),
  ('composting', 0.05::numeric, 'kg', 'Project demo estimate', 'demo-1', 'unspecified', 'COMBINED', TIMESTAMPTZ '2026-01-01 00:00:00+00', 'Demo estimate per kg; verify methodology')
) AS f(type_name, factor_value, unit, source_name, source_version, region, scope, valid_from, notes)
JOIN activity_types t ON t.name = f.type_name
JOIN activity_categories c ON c.id = t.category_id
WHERE c.name IN ('transport','electricity','food','shopping','waste')
  AND NOT EXISTS (
    SELECT 1 FROM emission_factors ef
    WHERE ef.activity_type_id = t.id
      AND ef.source_name = f.source_name
      AND ef.source_version = f.source_version
      AND ef.unit = f.unit
      AND ef.is_active = TRUE
  );

-- 4) Repair existing demo activity rows by resolving the factor from the
-- activity type, not from a hardcoded emission_factor_id. Units and emissions
-- are recalculated from the selected active factor. This fixes the V3 electricity
-- factor references and chicken/meal/shopping unit mismatches where a compatible
-- factor exists. Logs without a compatible factor are left unchanged for review.
WITH factor_candidates AS (
  SELECT ef.id AS factor_id, ef.activity_type_id, ef.factor_value, ef.unit,
         ef.valid_from,
         ROW_NUMBER() OVER (
           PARTITION BY ef.activity_type_id, ef.unit
           ORDER BY ef.valid_from DESC, ef.id DESC
         ) AS rn
  FROM emission_factors ef
  WHERE ef.is_active = TRUE
), expected_units AS (
  SELECT t.id AS activity_type_id,
         CASE t.unit_type
           WHEN 'distance' THEN 'km'
           WHEN 'kwh' THEN 'kWh'
           WHEN 'kg' THEN 'kg'
           WHEN 'quantity' THEN 'quantity'
           WHEN 'items' THEN 'items'
           WHEN 'hours' THEN 'hours'
           WHEN 'cost' THEN 'cost'
         END AS expected_unit
  FROM activity_types t
)
UPDATE activity_logs al
SET emission_factor_id = fc.factor_id,
    unit = eu.expected_unit,
    co2e_kg = ROUND((al.quantity * fc.factor_value)::numeric, 4),
    updated_at = NOW()
FROM expected_units eu
JOIN factor_candidates fc
  ON fc.activity_type_id = eu.activity_type_id
 AND fc.unit = eu.expected_unit
 AND fc.rn = 1
WHERE al.activity_type_id = eu.activity_type_id
  AND al.emission_factor_id IS DISTINCT FROM fc.factor_id
   OR (al.activity_type_id = eu.activity_type_id AND al.unit IS DISTINCT FROM eu.expected_unit);

-- Ensure all existing matching logs are recalculated even if the factor ID was
-- already correct but its value/unit changed during this migration.
WITH expected_units AS (
  SELECT t.id AS activity_type_id,
         CASE t.unit_type
           WHEN 'distance' THEN 'km'
           WHEN 'kwh' THEN 'kWh'
           WHEN 'kg' THEN 'kg'
           WHEN 'quantity' THEN 'quantity'
           WHEN 'items' THEN 'items'
           WHEN 'hours' THEN 'hours'
           WHEN 'cost' THEN 'cost'
         END AS expected_unit
  FROM activity_types t
), chosen_factors AS (
  SELECT DISTINCT ON (ef.activity_type_id, ef.unit)
         ef.id, ef.activity_type_id, ef.factor_value, ef.unit
  FROM emission_factors ef
  WHERE ef.is_active = TRUE
  ORDER BY ef.activity_type_id, ef.unit, ef.valid_from DESC, ef.id DESC
)
UPDATE activity_logs al
SET emission_factor_id = cf.id,
    unit = eu.expected_unit,
    co2e_kg = ROUND((al.quantity * cf.factor_value)::numeric, 4),
    updated_at = NOW()
FROM expected_units eu
JOIN chosen_factors cf
  ON cf.activity_type_id = eu.activity_type_id
 AND cf.unit = eu.expected_unit
WHERE al.activity_type_id = eu.activity_type_id;

-- 6) Ensure a usable test user exists. Password: CarbonTrackTest!2026
-- pgcrypto's crypt(..., gen_salt('bf')) creates a bcrypt hash compatible with
-- common bcrypt password verifiers. If the backend uses a different algorithm,
-- generate the hash with the backend's own password-hashing utility instead.
CREATE EXTENSION IF NOT EXISTS pgcrypto;
INSERT INTO users (email, password_hash, first_name, last_name, display_name, role,
                   timezone, preferred_unit, is_active)
VALUES ('carbontrack.test@example.com', crypt('CarbonTrackTest!2026', gen_salt('bf')),
        'CarbonTrack', 'Test', 'CarbonTrack API Test', 'USER', 'Asia/Kolkata', 'kgCO2e', TRUE)
ON CONFLICT (email) DO UPDATE
SET is_active = TRUE,
    updated_at = NOW();

-- 7) Create a profile without relying on a fixed user ID.
INSERT INTO user_profiles (user_id, country, city, region, household_size,
                           electricity_source, lifestyle_type, monthly_target_kgco2e)
SELECT u.id, 'India', 'Durgapur', 'West Bengal', 1, 'GRID', 'STANDARD', 100.00
FROM users u
WHERE u.email = 'carbontrack.test@example.com'
ON CONFLICT (user_id) DO UPDATE
SET country = EXCLUDED.country,
    city = EXCLUDED.city,
    region = EXCLUDED.region,
    updated_at = NOW();

-- 8) Add one API-test activity log with a factor selected by names and units.
-- Idempotent: the same test log is not inserted twice.
WITH test_user AS (
  SELECT id FROM users WHERE email = 'carbontrack.test@example.com'
), selected_factor AS (
  SELECT ef.id AS factor_id, ef.activity_type_id, ef.factor_value, ef.unit,
         t.category_id
  FROM emission_factors ef
  JOIN activity_types t ON t.id = ef.activity_type_id
  JOIN activity_categories c ON c.id = t.category_id
  WHERE t.name = 'home_electricity'
    AND c.name = 'electricity'
    AND ef.is_active = TRUE
    AND ef.unit = 'kWh'
  ORDER BY ef.valid_from DESC, ef.id DESC
  LIMIT 1
)
INSERT INTO activity_logs
  (user_id, category_id, activity_type_id, emission_factor_id, log_date,
   quantity, unit, notes, source, co2e_kg)
SELECT u.id, f.category_id, f.activity_type_id, f.factor_id, CURRENT_DATE,
       10.0, f.unit, 'CarbonTrack API integration smoke test', 'API',
       ROUND((10.0 * f.factor_value)::numeric, 4)
FROM test_user u CROSS JOIN selected_factor f
WHERE NOT EXISTS (
  SELECT 1 FROM activity_logs al
  WHERE al.user_id = u.id
    AND al.notes = 'CarbonTrack API integration smoke test'
    AND al.log_date = CURRENT_DATE
);

COMMIT;


