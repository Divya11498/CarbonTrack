
-- 1. ACTIVITY CATEGORIES (SEED DATA)

INSERT INTO activity_categories (name, description) VALUES
                                                        ('transport', 'Travel and commuting activities including car, bus, train, and flights'),
                                                        ('electricity', 'Home and workplace electricity consumption and energy usage'),
                                                        ('food', 'Food and dietary choices including meat, dairy, and meals'),
                                                        ('shopping', 'Consumer purchases including clothing, electronics, and goods'),
                                                        ('waste', 'Waste disposal, recycling, and material consumption management');


-- 2. ACTIVITY TYPES (SEED DATA)


-- TRANSPORT ACTIVITIES
INSERT INTO activity_types (category_id, name, unit_type, description, is_active) VALUES
                                                                                      (1, 'car', 'distance', 'Private vehicle travel (gasoline or diesel)', TRUE),
                                                                                      (1, 'bus', 'distance', 'Public bus transportation', TRUE),
                                                                                      (1, 'train', 'distance', 'Train or rail commute', TRUE),
                                                                                      (1, 'flight', 'distance', 'Air travel (passenger distance)', TRUE),
                                                                                      (1, 'motorcycle', 'distance', 'Motorcycle travel', TRUE),
                                                                                      (1, 'bicycle', 'distance', 'Bicycle travel (zero emissions)', TRUE),
                                                                                      (1, 'walking', 'distance', 'Walking (zero emissions)', TRUE);

-- ELECTRICITY ACTIVITIES
INSERT INTO activity_types (category_id, name, unit_type, description, is_active) VALUES
                                                                                      (2, 'home_electricity', 'kwh', 'Electricity consumed at home', TRUE),
                                                                                      (2, 'office_electricity', 'kwh', 'Electricity consumed at workplace', TRUE),
                                                                                      (2, 'renewable_electricity', 'kwh', 'Renewable energy consumption', TRUE);

-- FOOD ACTIVITIES
INSERT INTO activity_types (category_id, name, unit_type, description, is_active) VALUES
                                                                                      (3, 'beef', 'kg', 'Beef consumption', TRUE),
                                                                                      (3, 'chicken', 'kg', 'Chicken consumption', TRUE),
                                                                                      (3, 'pork', 'kg', 'Pork consumption', TRUE),
                                                                                      (3, 'fish', 'kg', 'Fish consumption', TRUE),
                                                                                      (3, 'dairy', 'kg', 'Milk and dairy consumption', TRUE),
                                                                                      (3, 'vegetarian_meal', 'quantity', 'Vegetarian meal', TRUE),
                                                                                      (3, 'vegan_meal', 'quantity', 'Vegan meal', TRUE);

-- SHOPPING ACTIVITIES
INSERT INTO activity_types (category_id, name, unit_type, description, is_active) VALUES
                                                                                      (4, 'clothing', 'items', 'New clothing item purchase', TRUE),
                                                                                      (4, 'electronics', 'items', 'Electronic devices and gadgets', TRUE),
                                                                                      (4, 'furniture', 'items', 'Furniture purchase', TRUE),
                                                                                      (4, 'household_goods', 'kg', 'Household items and supplies', TRUE);

-- WASTE ACTIVITIES
INSERT INTO activity_types (category_id, name, unit_type, description, is_active) VALUES
                                                                                      (5, 'landfill_waste', 'kg', 'Waste sent to landfill', TRUE),
                                                                                      (5, 'recycling', 'kg', 'Recyclable material', TRUE),
                                                                                      (5, 'composting', 'kg', 'Organic waste composting', TRUE);

-- ==========================================
-- 3. EMISSION FACTORS (SEED DATA)
-- ==========================================

-- TRANSPORT EMISSION FACTORS (kg CO2e per km)
INSERT INTO emission_factors (activity_type_id, source_name, source_version, factor_value, unit, region, scope, valid_from, valid_to, is_active, notes) VALUES
                                                                                                                                                            (1, 'EPA', '2024', 0.192, 'km', 'global', 'DIRECT', '2024-01-01'::TIMESTAMPTZ, NULL, TRUE, 'Passenger car - average gasoline/diesel mix'),
                                                                                                                                                            (2, 'EPA', '2024', 0.105, 'km', 'global', 'DIRECT', '2024-01-01'::TIMESTAMPTZ, NULL, TRUE, 'Public bus - per passenger'),
                                                                                                                                                            (3, 'EPA', '2024', 0.065, 'km', 'global', 'DIRECT', '2024-01-01'::TIMESTAMPTZ, NULL, TRUE, 'Rail transport - per passenger'),
                                                                                                                                                            (4, 'EPA', '2024', 0.00018, 'km', 'global', 'DIRECT', '2024-01-01'::TIMESTAMPTZ, NULL, TRUE, 'Flight - commercial passenger aircraft per km'),
                                                                                                                                                            (5, 'EPA', '2024', 0.168, 'km', 'global', 'DIRECT', '2024-01-01'::TIMESTAMPTZ, NULL, TRUE, 'Motorcycle - lighter vehicle'),
                                                                                                                                                            (6, 'EPA', '2024', 0.0, 'km', 'global', 'DIRECT', '2024-01-01'::TIMESTAMPTZ, NULL, TRUE, 'Bicycle - zero direct emissions'),
                                                                                                                                                            (7, 'EPA', '2024', 0.0, 'km', 'global', 'DIRECT', '2024-01-01'::TIMESTAMPTZ, NULL, TRUE, 'Walking - zero direct emissions');

-- ELECTRICITY EMISSION FACTORS (kg CO2e per kWh)
INSERT INTO emission_factors (activity_type_id, source_name, source_version, factor_value, unit, region, scope, valid_from, valid_to, is_active, notes) VALUES
                                                                                                                                                            (8, 'EPA', '2024', 0.00042, 'kWh', 'global', 'INDIRECT', '2024-01-01'::TIMESTAMPTZ, NULL, TRUE, 'Grid electricity - average global mix'),
                                                                                                                                                            (9, 'EPA', '2024', 0.00038, 'kWh', 'global', 'INDIRECT', '2024-01-01'::TIMESTAMPTZ, NULL, TRUE, 'Office electricity - assumed commercial grid'),
                                                                                                                                                            (10, 'EPA', '2024', 0.00001, 'kWh', 'global', 'INDIRECT', '2024-01-01'::TIMESTAMPTZ, NULL, TRUE, 'Renewable electricity - solar, wind, hydro');

-- FOOD EMISSION FACTORS (kg CO2e per kg consumed)
INSERT INTO emission_factors (activity_type_id, source_name, source_version, factor_value, unit, region, scope, valid_from, valid_to, is_active, notes) VALUES
                                                                                                                                                            (11, 'IPCC', '2023', 27.0, 'kg', 'global', 'DIRECT', '2023-01-01'::TIMESTAMPTZ, NULL, TRUE, 'Beef - highest emissions among meats'),
                                                                                                                                                            (12, 'IPCC', '2023', 6.9, 'kg', 'global', 'DIRECT', '2023-01-01'::TIMESTAMPTZ, NULL, TRUE, 'Chicken - lower emissions than red meat'),
                                                                                                                                                            (13, 'IPCC', '2023', 12.1, 'kg', 'global', 'DIRECT', '2023-01-01'::TIMESTAMPTZ, NULL, TRUE, 'Pork - moderate emissions'),
                                                                                                                                                            (14, 'IPCC', '2023', 12.5, 'kg', 'global', 'DIRECT', '2023-01-01'::TIMESTAMPTZ, NULL, TRUE, 'Fish - varies, moderate emissions'),
                                                                                                                                                            (15, 'IPCC', '2023', 1.5, 'kg', 'global', 'DIRECT', '2023-01-01'::TIMESTAMPTZ, NULL, TRUE, 'Dairy products - milk, cheese, yogurt'),
                                                                                                                                                            (16, 'IPCC', '2023', 2.0, 'item', 'global', 'DIRECT', '2023-01-01'::TIMESTAMPTZ, NULL, TRUE, 'Vegetarian meal - average estimate'),
                                                                                                                                                            (17, 'IPCC', '2023', 1.2, 'item', 'global', 'DIRECT', '2023-01-01'::TIMESTAMPTZ, NULL, TRUE, 'Vegan meal - lowest emissions');

-- SHOPPING EMISSION FACTORS (kg CO2e per item)
INSERT INTO emission_factors (activity_type_id, source_name, source_version, factor_value, unit, region, scope, valid_from, valid_to, is_active, notes) VALUES
                                                                                                                                                            (18, 'Custom', '2024', 3.5, 'item', 'global', 'DIRECT', '2024-01-01'::TIMESTAMPTZ, NULL, TRUE, 'Clothing item - average apparel'),
                                                                                                                                                            (19, 'Custom', '2024', 12.0, 'item', 'global', 'DIRECT', '2024-01-01'::TIMESTAMPTZ, NULL, TRUE, 'Electronics - computers, phones, etc.'),
                                                                                                                                                            (20, 'Custom', '2024', 25.0, 'item', 'global', 'DIRECT', '2024-01-01'::TIMESTAMPTZ, NULL, TRUE, 'Furniture item - average estimate'),
                                                                                                                                                            (21, 'Custom', '2024', 0.5, 'kg', 'global', 'DIRECT', '2024-01-01'::TIMESTAMPTZ, NULL, TRUE, 'Household goods - average per kg');

-- WASTE EMISSION FACTORS (kg CO2e per kg)
INSERT INTO emission_factors (activity_type_id, source_name, source_version, factor_value, unit, region, scope, valid_from, valid_to, is_active, notes) VALUES
                                                                                                                                                            (22, 'IPCC', '2023', 0.8, 'kg', 'global', 'DIRECT', '2023-01-01'::TIMESTAMPTZ, NULL, TRUE, 'Landfill waste - methane emissions'),
                                                                                                                                                            (23, 'IPCC', '2023', 0.15, 'kg', 'global', 'DIRECT', '2023-01-01'::TIMESTAMPTZ, NULL, TRUE, 'Recycling - reduced emissions vs landfill'),
                                                                                                                                                            (24, 'IPCC', '2023', 0.05, 'kg', 'global', 'DIRECT', '2023-01-01'::TIMESTAMPTZ, NULL, TRUE, 'Composting - minimal emissions');

-- ==========================================
-- 4. BADGES (SEED DATA)
-- ==========================================
INSERT INTO badges (code, name, description, icon_url, badge_type) VALUES
                                                                       ('eco_pioneer', 'Eco Pioneer', 'Logged first activity', '/icons/badges/eco_pioneer.png', 'COMMUNITY'),
                                                                       ('week_warrior', '7-Day Warrior', 'Logged activities for 7 consecutive days', '/icons/badges/week_warrior.png', 'CONSISTENCY'),
                                                                       ('carbon_cutter', 'Carbon Cutter', 'Reduced emissions by 20% in a month', '/icons/badges/carbon_cutter.png', 'REDUCTION'),
                                                                       ('month_master', 'Monthly Master', 'Logged 30+ days in a calendar month', '/icons/badges/month_master.png', 'MONTHLY'),
                                                                       ('bike_buddy', 'Bike Buddy', 'Cycled or walked for 100+ km in a month', '/icons/badges/bike_buddy.png', 'REDUCTION'),
                                                                       ('vegetarian_victor', 'Vegetarian Victor', 'Had 20+ vegetarian/vegan meals in a month', '/icons/badges/vegetarian.png', 'REDUCTION'),
                                                                       ('green_leader', 'Green Leader', 'Ranked in top 10% of community leaderboard', '/icons/badges/green_leader.png', 'LEADERBOARD'),
                                                                       ('sustainability_champion', 'Sustainability Champion', 'Maintained low footprint for 3 consecutive months', '/icons/badges/champion.png', 'SPECIAL');

