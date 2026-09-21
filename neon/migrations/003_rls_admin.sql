-- Auto ZM 003 — granturi rol provisioner + RLS scriere doar admin
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON cars TO authenticated;
DROP POLICY IF EXISTS cars_public_read ON cars;
CREATE POLICY cars_public_read ON cars FOR SELECT TO app_reader, authenticated USING (true);
DROP POLICY IF EXISTS cars_admin_write ON cars;
CREATE POLICY cars_admin_write ON cars FOR ALL TO authenticated
  USING (auth.user_id() = '7c550979-1bf0-4862-b5ac-aa548880b13d')
  WITH CHECK (auth.user_id() = '7c550979-1bf0-4862-b5ac-aa548880b13d');
