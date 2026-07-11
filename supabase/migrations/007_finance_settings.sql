CREATE TABLE IF NOT EXISTS finance_settings (
  setting_id TEXT PRIMARY KEY DEFAULT 'fin_001',
  capital NUMERIC NOT NULL DEFAULT 0,
  cash_in_hand NUMERIC NOT NULL DEFAULT 0,
  notes TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by TEXT REFERENCES app_users(user_id)
);

INSERT INTO finance_settings (setting_id, capital, cash_in_hand)
VALUES ('fin_001', 0, 0)
ON CONFLICT (setting_id) DO NOTHING;

ALTER TABLE finance_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY finance_settings_select ON finance_settings
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY finance_settings_insert ON finance_settings
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY finance_settings_update ON finance_settings
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY finance_settings_delete ON finance_settings
  FOR DELETE TO anon, authenticated USING (true);

INSERT INTO permissions (permission_id, permission_name, module)
VALUES ('perm_011', 'View Finance', 'finance')
ON CONFLICT (permission_id) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT 'rol_001', 'perm_011'
WHERE NOT EXISTS (
  SELECT 1 FROM role_permissions WHERE role_id = 'rol_001' AND permission_id = 'perm_011'
);
