-- Revoke anonymous database access and tighten sensitive-table policies.

CREATE OR REPLACE FUNCTION public.has_marvel_permission(p_module text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM app_users u
    JOIN role_permissions rp ON rp.role_id = u.role_id
    JOIN permissions p ON p.permission_id = rp.permission_id
    WHERE u.auth_user_id = auth.uid()
      AND u.status = 'active'
      AND p.module = p_module
  );
$$;

-- Remove every policy that grants access to the anon role.
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND 'anon' = ANY(roles)
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
  END LOOP;
END $$;

-- Investors: investors module only
DO $$
DECLARE
  t TEXT;
  pol RECORD;
BEGIN
  FOREACH t IN ARRAY ARRAY['investors', 'investments', 'investor_returns'] LOOP
    FOR pol IN
      SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = t
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, t);
    END LOOP;

    EXECUTE format(
      'CREATE POLICY %I ON %I FOR SELECT TO authenticated USING (public.has_marvel_permission(''investors''))',
      t || '_select_investors', t
    );
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR INSERT TO authenticated WITH CHECK (public.has_marvel_permission(''investors''))',
      t || '_insert_investors', t
    );
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR UPDATE TO authenticated USING (public.has_marvel_permission(''investors'')) WITH CHECK (public.has_marvel_permission(''investors''))',
      t || '_update_investors', t
    );
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR DELETE TO authenticated USING (public.has_marvel_permission(''investors''))',
      t || '_delete_investors', t
    );
  END LOOP;
END $$;

-- Audit log: read restricted; any signed-in user may append entries
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'audit_logs'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON audit_logs', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY audit_logs_select ON audit_logs
  FOR SELECT TO authenticated
  USING (public.has_marvel_permission('audit'));

CREATE POLICY audit_logs_insert ON audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY audit_logs_update ON audit_logs
  FOR UPDATE TO authenticated
  USING (public.is_marvel_admin())
  WITH CHECK (public.is_marvel_admin());

CREATE POLICY audit_logs_delete ON audit_logs
  FOR DELETE TO authenticated
  USING (public.is_marvel_admin());

-- Showroom expenses: expenses module only
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'showroom_expenses'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON showroom_expenses', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY showroom_expenses_select ON showroom_expenses
  FOR SELECT TO authenticated
  USING (public.has_marvel_permission('expenses'));

CREATE POLICY showroom_expenses_insert ON showroom_expenses
  FOR INSERT TO authenticated
  WITH CHECK (public.has_marvel_permission('expenses'));

CREATE POLICY showroom_expenses_update ON showroom_expenses
  FOR UPDATE TO authenticated
  USING (public.has_marvel_permission('expenses'))
  WITH CHECK (public.has_marvel_permission('expenses'));

CREATE POLICY showroom_expenses_delete ON showroom_expenses
  FOR DELETE TO authenticated
  USING (public.has_marvel_permission('expenses'));

-- RBAC metadata: read for signed-in users, writes admin-only
DO $$
DECLARE
  t TEXT;
  pol RECORD;
BEGIN
  FOREACH t IN ARRAY ARRAY['roles', 'permissions', 'role_permissions'] LOOP
    FOR pol IN
      SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = t
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, t);
    END LOOP;
  END LOOP;
END $$;

CREATE POLICY roles_select ON roles FOR SELECT TO authenticated USING (true);
CREATE POLICY permissions_select ON permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY role_permissions_select ON role_permissions FOR SELECT TO authenticated USING (true);

CREATE POLICY roles_admin_insert ON roles FOR INSERT TO authenticated
  WITH CHECK (public.is_marvel_admin());
CREATE POLICY roles_admin_update ON roles FOR UPDATE TO authenticated
  USING (public.is_marvel_admin()) WITH CHECK (public.is_marvel_admin());
CREATE POLICY roles_admin_delete ON roles FOR DELETE TO authenticated
  USING (public.is_marvel_admin());

CREATE POLICY permissions_admin_insert ON permissions FOR INSERT TO authenticated
  WITH CHECK (public.is_marvel_admin());
CREATE POLICY permissions_admin_update ON permissions FOR UPDATE TO authenticated
  USING (public.is_marvel_admin()) WITH CHECK (public.is_marvel_admin());
CREATE POLICY permissions_admin_delete ON permissions FOR DELETE TO authenticated
  USING (public.is_marvel_admin());

CREATE POLICY role_permissions_admin_insert ON role_permissions FOR INSERT TO authenticated
  WITH CHECK (public.is_marvel_admin());
CREATE POLICY role_permissions_admin_update ON role_permissions FOR UPDATE TO authenticated
  USING (public.is_marvel_admin()) WITH CHECK (public.is_marvel_admin());
CREATE POLICY role_permissions_admin_delete ON role_permissions FOR DELETE TO authenticated
  USING (public.is_marvel_admin());
