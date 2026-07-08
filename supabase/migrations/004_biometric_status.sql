-- Marvel X: Add biometric verification status to vehicle documents,
-- and allow admins to edit role access (role_permissions) with RLS.
-- Biometric options: done | not_taken | open_bio | isb_no_bio

ALTER TABLE vehicle_documents
  ADD COLUMN IF NOT EXISTS biometric_status TEXT NOT NULL DEFAULT 'not_taken';

-- Admins can modify role -> permission mappings (access control).
-- SELECT for authenticated already exists from migration 003.
DROP POLICY IF EXISTS role_permissions_admin_insert ON role_permissions;
CREATE POLICY role_permissions_admin_insert ON role_permissions
  FOR INSERT TO authenticated
  WITH CHECK (public.is_marvel_admin());

DROP POLICY IF EXISTS role_permissions_admin_update ON role_permissions;
CREATE POLICY role_permissions_admin_update ON role_permissions
  FOR UPDATE TO authenticated
  USING (public.is_marvel_admin())
  WITH CHECK (public.is_marvel_admin());

DROP POLICY IF EXISTS role_permissions_admin_delete ON role_permissions;
CREATE POLICY role_permissions_admin_delete ON role_permissions
  FOR DELETE TO authenticated
  USING (public.is_marvel_admin());

-- Admins can create/rename roles too.
DROP POLICY IF EXISTS roles_admin_insert ON roles;
CREATE POLICY roles_admin_insert ON roles
  FOR INSERT TO authenticated
  WITH CHECK (public.is_marvel_admin());

DROP POLICY IF EXISTS roles_admin_update ON roles;
CREATE POLICY roles_admin_update ON roles
  FOR UPDATE TO authenticated
  USING (public.is_marvel_admin())
  WITH CHECK (public.is_marvel_admin());
