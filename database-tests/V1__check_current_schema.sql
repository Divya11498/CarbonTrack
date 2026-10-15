-- Read-only: list public tables.
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Read-only: Flyway migration history (if Flyway is installed in this database).
SELECT installed_rank, version, description, type, script, success, installed_on
FROM public.flyway_schema_history
ORDER BY installed_rank;
