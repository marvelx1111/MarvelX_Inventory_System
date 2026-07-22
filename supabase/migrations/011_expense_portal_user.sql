-- Convert former sales portal user into expense portal
UPDATE roles
SET role_name = 'Expense Clerk',
    description = 'Showroom and vehicle expense entry'
WHERE role_id = 'rol_002';

DELETE FROM role_permissions
WHERE role_id = 'rol_002'
  AND permission_id NOT IN ('perm_001', 'perm_006');

INSERT INTO role_permissions (role_id, permission_id)
VALUES
  ('rol_002', 'perm_001'),
  ('rol_002', 'perm_006')
ON CONFLICT (role_id, permission_id) DO NOTHING;

UPDATE app_users
SET email = 'expense@marvelx.pk',
    username = 'expense',
    full_name = CASE WHEN full_name IN ('Sales', 'Salesperson') THEN 'Expense' ELSE full_name END
WHERE user_id = 'usr_002'
   OR email IN ('sales@marvelx.pk', 'sale@marvelx.pk');
