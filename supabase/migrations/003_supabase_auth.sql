-- Marvel X: Supabase Auth integration
-- Links app_users to auth.users and removes plaintext passwords.

ALTER TABLE app_users
  ADD COLUMN IF NOT EXISTS auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE app_users DROP COLUMN IF EXISTS password_hash;

CREATE OR REPLACE FUNCTION public.is_marvel_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM app_users u
    JOIN roles r ON r.role_id = u.role_id
    WHERE u.auth_user_id = auth.uid()
      AND u.status = 'active'
      AND (u.role_id = 'rol_001' OR r.role_name = 'Admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.current_app_user_id()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.user_id
  FROM app_users u
  WHERE u.auth_user_id = auth.uid()
    AND u.status = 'active'
  LIMIT 1;
$$;

-- Drop permissive dev policies (anon + authenticated wide open)
DO $$
DECLARE
  t TEXT;
  pol RECORD;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'roles','permissions','role_permissions','app_users','customers','expense_categories',
    'purchases','vehicles','vehicle_documents','vehicle_expenses','showroom_expenses',
    'sales','sale_payments','delivery_records','investors','investments','investor_returns',
    'ppf_customers','ppf_vehicles','ppf_brands','ppf_rolls','ppf_stock_transactions',
    'ppf_packages','ppf_job_cards','ppf_job_materials','ppf_job_labor','ppf_sales',
    'ppf_payments','ppf_warranties','audit_logs'
  ] LOOP
    FOR pol IN
      SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = t
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, t);
    END LOOP;
  END LOOP;
END $$;

-- app_users: no anonymous access; users read own profile, admins read all
CREATE POLICY app_users_select ON app_users
  FOR SELECT TO authenticated
  USING (auth_user_id = auth.uid() OR public.is_marvel_admin());

CREATE POLICY app_users_insert ON app_users
  FOR INSERT TO authenticated
  WITH CHECK (public.is_marvel_admin());

CREATE POLICY app_users_update ON app_users
  FOR UPDATE TO authenticated
  USING (public.is_marvel_admin())
  WITH CHECK (public.is_marvel_admin());

CREATE POLICY app_users_delete ON app_users
  FOR DELETE TO authenticated
  USING (public.is_marvel_admin());

-- RBAC metadata: authenticated read-only (needed for permission checks)
CREATE POLICY roles_select ON roles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY permissions_select ON permissions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY role_permissions_select ON role_permissions
  FOR SELECT TO authenticated USING (true);

-- Business data: authenticated users only (role-based policies come in a later step)
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'customers','expense_categories','purchases','vehicles','vehicle_documents',
    'vehicle_expenses','showroom_expenses','sales','sale_payments','delivery_records',
    'investors','investments','investor_returns','ppf_customers','ppf_vehicles',
    'ppf_brands','ppf_rolls','ppf_stock_transactions','ppf_packages','ppf_job_cards',
    'ppf_job_materials','ppf_job_labor','ppf_sales','ppf_payments','ppf_warranties',
    'audit_logs'
  ] LOOP
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR SELECT TO authenticated USING (true)',
      t || '_select_auth', t
    );
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR INSERT TO authenticated WITH CHECK (true)',
      t || '_insert_auth', t
    );
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR UPDATE TO authenticated USING (true) WITH CHECK (true)',
      t || '_update_auth', t
    );
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR DELETE TO authenticated USING (true)',
      t || '_delete_auth', t
    );
  END LOOP;
END $$;
