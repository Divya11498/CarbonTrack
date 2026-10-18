
-- 1. DEMO USERS

INSERT INTO users (email, password_hash, first_name, last_name, display_name, role, timezone, preferred_unit, is_active) VALUES
                                                                                                                             ('alice@carbontrack.local', '$2a$10$demo_hash_alice_12345678', 'Alice', 'Johnson', 'Alice J', 'USER', 'Europe/London', 'kgCO2e', TRUE),
                                                                                                                             ('bob@carbontrack.local', '$2a$10$demo_hash_bob_123456789', 'Bob', 'Smith', 'Bob S', 'USER', 'America/New_York', 'kgCO2e', TRUE),
                                                                                                                             ('charlie@carbontrack.local', '$2a$10$demo_hash_charlie_1234567', 'Charlie', 'Brown', 'Charlie B', 'USER', 'Asia/Tokyo', 'kgCO2e', TRUE),
                                                                                                                             ('diana@carbontrack.local', '$2a$10$demo_hash_diana_12345678', 'Diana', 'Prince', 'Diana P', 'ADMIN', 'Australia/Sydney', 'kgCO2e', TRUE);


-- 2. USER PROFILES

INSERT INTO user_profiles (user_id, country, city, region, household_size, electricity_source, lifestyle_type, monthly_target_kgco2e) VALUES
                                                                                                                                          (1, 'United Kingdom', 'London', 'England', 2, 'GRID', 'STANDARD', 75.00),
                                                                                                                                          (2, 'United States', 'New York', 'New York', 1, 'GRID', 'STANDARD', 80.00),
                                                                                                                                          (3, 'Japan', 'Tokyo', 'Tokyo', 3, 'RENEWABLE', 'LOW_IMPACT', 50.00),
                                                                                                                                          (4, 'Australia', 'Sydney', 'New South Wales', 2, 'GRID', 'HIGH_IMPACT', 100.00);


-- 3. ORGANIZATIONS

INSERT INTO organizations (name, organization_type, description, is_active) VALUES
                                                                                ('Green Tech Company', 'COMPANY', 'Technology company committed to sustainability', TRUE),
                                                                                ('University of Sustainability', 'UNIVERSITY', 'Leading university in environmental research', TRUE),
                                                                                ('Global NGO Alliance', 'NGO', 'Non-profit focused on climate action', TRUE);


-- 4. ORGANIZATION MEMBERS

INSERT INTO organization_members (organization_id, user_id, role, joined_at) VALUES
                                                                                 (1, 1, 'MEMBER', NOW()),
                                                                                 (1, 2, 'ADMIN', NOW()),
                                                                                 (2, 3, 'MEMBER', NOW()),
                                                                                 (2, 4, 'OWNER', NOW()),
                                                                                 (3, 1, 'MEMBER', NOW());


-- 5. SAMPLE ACTIVITY LOGS - ALICE (2026-10-08 to 2026-10-10)


-- October 8, 2026 - Alice's activities
INSERT INTO activity_logs (user_id, category_id, activity_type_id, emission_factor_id, log_date, quantity, unit, notes, source, co2e_kg) VALUES
                                                                                                                                             (1, 1, 1, 1, '2026-10-08'::DATE, 25.5, 'km', 'Commute to office by car', 'MANUAL', 4.896),
                                                                                                                                             (1, 2, 8, 5, '2026-10-08'::DATE, 18.5, 'kWh', 'Household electricity usage', 'MANUAL', 0.00777),
                                                                                                                                             (1, 3, 12, 12, '2026-10-08'::DATE, 1.0, 'quantity', 'Chicken dinner', 'MANUAL', 6.9);

-- October 9, 2026 - Alice's activities
INSERT INTO activity_logs (user_id, category_id, activity_type_id, emission_factor_id, log_date, quantity, unit, notes, source, co2e_kg) VALUES
                                                                                                                                             (1, 1, 2, 2, '2026-10-09'::DATE, 15.0, 'km', 'Public bus to work', 'MANUAL', 1.575),
                                                                                                                                             (1, 2, 8, 5, '2026-10-09'::DATE, 22.0, 'kWh', 'Household electricity usage', 'MANUAL', 0.00924),
                                                                                                                                             (1, 4, 18, 18, '2026-10-09'::DATE, 1.0, 'item', 'Bought new sweater', 'MANUAL', 3.5);

-- October 10, 2026 - Alice's activities
INSERT INTO activity_logs (user_id, category_id, activity_type_id, emission_factor_id, log_date, quantity, unit, notes, source, co2e_kg) VALUES
                                                                                                                                             (1, 1, 3, 3, '2026-10-10'::DATE, 12.0, 'km', 'Train commute', 'MANUAL', 0.78),
                                                                                                                                             (1, 2, 8, 5, '2026-10-10'::DATE, 20.5, 'kWh', 'Household electricity usage', 'MANUAL', 0.00861),
                                                                                                                                             (1, 3, 17, 17, '2026-10-10'::DATE, 1.0, 'item', 'Vegan lunch', 'MANUAL', 1.2);

-- 6. SAMPLE ACTIVITY LOGS - BOB (2026-10-08 to 2026-10-10)


-- October 8, 2026 - Bob's activities
INSERT INTO activity_logs (user_id, category_id, activity_type_id, emission_factor_id, log_date, quantity, unit, notes, source, co2e_kg) VALUES
                                                                                                                                             (2, 1, 1, 1, '2026-10-08'::DATE, 50.0, 'km', 'Drove to suburb', 'MANUAL', 9.6),
                                                                                                                                             (2, 2, 9, 6, '2026-10-08'::DATE, 30.0, 'kWh', 'Office electricity', 'MANUAL', 0.0114),
                                                                                                                                             (2, 3, 11, 11, '2026-10-08'::DATE, 0.5, 'kg', 'Beef steak dinner', 'MANUAL', 13.5);

-- October 9, 2026 - Bob's activities
INSERT INTO activity_logs (user_id, category_id, activity_type_id, emission_factor_id, log_date, quantity, unit, notes, source, co2e_kg) VALUES
                                                                                                                                             (2, 1, 1, 1, '2026-10-09'::DATE, 48.0, 'km', 'Drove to suburb', 'MANUAL', 9.216),
                                                                                                                                             (2, 2, 9, 6, '2026-10-09'::DATE, 28.5, 'kWh', 'Office electricity', 'MANUAL', 0.01083),
                                                                                                                                             (2, 5, 22, 22, '2026-10-09'::DATE, 5.0, 'kg', 'Household waste to landfill', 'MANUAL', 4.0);

-- October 10, 2026 - Bob's activities
INSERT INTO activity_logs (user_id, category_id, activity_type_id, emission_factor_id, log_date, quantity, unit, notes, source, co2e_kg) VALUES
                                                                                                                                             (2, 1, 1, 1, '2026-10-10'::DATE, 52.0, 'km', 'Drove to city', 'MANUAL', 9.984),
                                                                                                                                             (2, 2, 9, 6, '2026-10-10'::DATE, 32.0, 'kWh', 'Office electricity', 'MANUAL', 0.01216),
                                                                                                                                             (2, 4, 19, 19, '2026-10-10'::DATE, 1.0, 'item', 'Bought smartphone', 'MANUAL', 12.0);

-- ==========================================
-- 7. SAMPLE ACTIVITY LOGS - CHARLIE (2026-10-08 to 2026-10-10)
-- ==========================================

-- October 8, 2026 - Charlie's activities
INSERT INTO activity_logs (user_id, category_id, activity_type_id, emission_factor_id, log_date, quantity, unit, notes, source, co2e_kg) VALUES
                                                                                                                                             (3, 1, 6, 6, '2026-10-08'::DATE, 20.0, 'km', 'Cycled to office', 'MANUAL', 0.0),
                                                                                                                                             (3, 2, 10, 7, '2026-10-08'::DATE, 12.0, 'kWh', 'Renewable electricity', 'MANUAL', 0.00012),
                                                                                                                                             (3, 3, 17, 17, '2026-10-08'::DATE, 1.0, 'item', 'Vegan meal', 'MANUAL', 1.2);

-- October 9, 2026 - Charlie's activities
INSERT INTO activity_logs (user_id, category_id, activity_type_id, emission_factor_id, log_date, quantity, unit, notes, source, co2e_kg) VALUES
                                                                                                                                             (3, 1, 6, 6, '2026-10-09'::DATE, 22.0, 'km', 'Cycled to office', 'MANUAL', 0.0),
                                                                                                                                             (3, 2, 10, 7, '2026-10-09'::DATE, 14.0, 'kWh', 'Renewable electricity', 'MANUAL', 0.00014),
                                                                                                                                             (3, 3, 16, 16, '2026-10-09'::DATE, 1.0, 'item', 'Vegetarian meal', 'MANUAL', 2.0);

-- October 10, 2026 - Charlie's activities
INSERT INTO activity_logs (user_id, category_id, activity_type_id, emission_factor_id, log_date, quantity, unit, notes, source, co2e_kg) VALUES
                                                                                                                                             (3, 1, 3, 3, '2026-10-10'::DATE, 18.0, 'km', 'Train to meeting', 'MANUAL', 1.17),
                                                                                                                                             (3, 2, 10, 7, '2026-10-10'::DATE, 13.0, 'kWh', 'Renewable electricity', 'MANUAL', 0.00013),
                                                                                                                                             (3, 5, 24, 24, '2026-10-10'::DATE, 8.0, 'kg', 'Organic waste composting', 'MANUAL', 0.4);

-- ==========================================
-- 8. SAMPLE GOALS
-- ==========================================

-- Alice's goals
INSERT INTO goals (user_id, organization_id, category_id, title, goal_type, target_value, target_unit, period_type, start_date, end_date, status) VALUES
                                                                                                                                                      (1, 1, 1, 'Reduce car usage by 50%', 'REDUCE_CATEGORY', 50.0, 'percent', 'MONTHLY', '2026-10-01'::DATE, NULL, 'ACTIVE'),
                                                                                                                                                      (1, 1, NULL, 'Keep monthly footprint under 75 kg CO2e', 'REDUCE_CO2E', 75.0, 'kgCO2e', 'MONTHLY', '2026-10-01'::DATE, NULL, 'ACTIVE'),
                                                                                                                                                      (1, NULL, 3, 'Eat vegetarian 50% of meals', 'REDUCE_CATEGORY', 50.0, 'percent', 'MONTHLY', '2026-10-01'::DATE, NULL, 'ACTIVE');

-- Bob's goals
INSERT INTO goals (user_id, organization_id, category_id, title, goal_type, target_value, target_unit, period_type, start_date, end_date, status) VALUES
                                                                                                                                                      (2, 1, 1, 'Reduce driving distance by 100 km', 'ENERGY_SAVINGS', 100.0, 'km', 'WEEKLY', '2026-10-08'::DATE, NULL, 'ACTIVE'),
                                                                                                                                                      (2, 1, 5, 'Increase recycling to 90% of waste', 'WASTE_REDUCTION', 90.0, 'percent', 'MONTHLY', '2026-10-01'::DATE, NULL, 'ACTIVE');

-- Charlie's goals
INSERT INTO goals (user_id, organization_id, category_id, title, goal_type, target_value, target_unit, period_type, start_date, end_date, status) VALUES
                                                                                                                                                      (3, 2, 1, 'Maintain zero-car week streak', 'STREAK', 4.0, 'weeks', 'MONTHLY', '2026-10-01'::DATE, NULL, 'ACTIVE'),
                                                                                                                                                      (3, 2, NULL, 'Achieve lowest footprint in organization', 'REDUCE_CO2E', 40.0, 'kgCO2e', 'MONTHLY', '2026-10-01'::DATE, NULL, 'ACTIVE');

-- ==========================================
-- 9. SAMPLE GOAL PROGRESS
-- ==========================================

-- Alice's goal progress (as of Oct 10)
INSERT INTO goal_progress (goal_id, period_start, period_end, actual_value, target_value, percent_achieved) VALUES
                                                                                                                (1, '2026-10-01'::DATE, '2026-10-31'::DATE, 35.0, 50.0, 70.0),
                                                                                                                (2, '2026-10-01'::DATE, '2026-10-31'::DATE, 68.5, 75.0, 91.33),
                                                                                                                (3, '2026-10-01'::DATE, '2026-10-31'::DATE, 45.0, 50.0, 90.0);

-- Bob's goal progress (weekly)
INSERT INTO goal_progress (goal_id, period_start, period_end, actual_value, target_value, percent_achieved) VALUES
                                                                                                                (4, '2026-10-08'::DATE, '2026-10-14'::DATE, 150.0, 100.0, 150.0),
                                                                                                                (5, '2026-10-01'::DATE, '2026-10-31'::DATE, 75.0, 90.0, 83.33);

-- Charlie's goal progress (monthly)
INSERT INTO goal_progress (goal_id, period_start, period_end, actual_value, target_value, percent_achieved) VALUES
                                                                                                                (6, '2026-10-01'::DATE, '2026-10-31'::DATE, 2.0, 4.0, 50.0),
                                                                                                                (7, '2026-10-01'::DATE, '2026-10-31'::DATE, 42.5, 40.0, 106.25);

-- ==========================================
-- 10. SAMPLE USER BADGES EARNED
-- ==========================================

INSERT INTO user_badges (user_id, badge_id, earned_at, source_event) VALUES
                                                                         (1, 1, '2026-10-08'::TIMESTAMPTZ, 'first_activity_logged'),
                                                                         (1, 2, '2026-10-08'::TIMESTAMPTZ, '7_day_streak'),
                                                                         (3, 1, '2026-10-08'::TIMESTAMPTZ, 'first_activity_logged'),
                                                                         (3, 3, '2026-10-10'::TIMESTAMPTZ, '20_percent_reduction_achieved'),
                                                                         (3, 6, '2026-10-09'::TIMESTAMPTZ, '20_vegetarian_meals_monthly');
