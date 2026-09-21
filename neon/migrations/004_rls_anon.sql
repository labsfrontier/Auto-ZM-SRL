-- Auto ZM 004 — citire publica via rolul anonymous (JWT anonim, fara login)
GRANT USAGE ON SCHEMA public TO anonymous;
GRANT SELECT ON cars TO anonymous;
DROP POLICY IF EXISTS cars_anon_read ON cars;
CREATE POLICY cars_anon_read ON cars FOR SELECT TO anonymous USING (true);
