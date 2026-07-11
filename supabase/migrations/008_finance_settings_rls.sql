-- Restrict finance_settings to authenticated users (remove anonymous read/write)
DROP POLICY IF EXISTS finance_settings_select ON finance_settings;
DROP POLICY IF EXISTS finance_settings_insert ON finance_settings;
DROP POLICY IF EXISTS finance_settings_update ON finance_settings;
DROP POLICY IF EXISTS finance_settings_delete ON finance_settings;

CREATE POLICY finance_settings_select ON finance_settings
  FOR SELECT TO authenticated USING (true);

CREATE POLICY finance_settings_insert ON finance_settings
  FOR INSERT TO authenticated WITH CHECK (public.is_marvel_admin());

CREATE POLICY finance_settings_update ON finance_settings
  FOR UPDATE TO authenticated
  USING (public.is_marvel_admin())
  WITH CHECK (public.is_marvel_admin());

CREATE POLICY finance_settings_delete ON finance_settings
  FOR DELETE TO authenticated USING (public.is_marvel_admin());
