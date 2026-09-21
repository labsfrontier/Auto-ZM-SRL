-- Auto ZM 002 — roluri + RLS citire publica
DO $$ BEGIN CREATE ROLE app_reader NOLOGIN; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE ROLE authenticated NOLOGIN; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
GRANT USAGE ON SCHEMA public TO app_reader, authenticated;
GRANT SELECT ON cars TO app_reader;
GRANT SELECT, INSERT, UPDATE, DELETE ON cars TO authenticated;
ALTER TABLE cars ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cars_public_read ON cars;
CREATE POLICY cars_public_read ON cars FOR SELECT TO app_reader, authenticated USING (true);
