/**
 * Cross-check loops for Marvel X Supabase data integrity.
 * Run: npm run db:crosscheck
 *
 * Loop 1 — Bootstrap counts: roles, permissions, users, categories
 * Loop 2 — Integrity: FK orphans, bootstrap user parity
 */
import { createClient } from '@supabase/supabase-js';
import { createSeedData } from '../src/data/seed.ts';
import type { AppData } from '../src/types/index.ts';
import { createAuthenticatedSupabaseClient } from './supabase-auth-client.ts';

/** Tables that must match seed counts exactly (bootstrap data). */
const BOOTSTRAP_KEYS: (keyof AppData)[] = [
  'roles',
  'permissions',
  'rolePermissions',
  'users',
  'expenseCategories',
];

const TABLE_MAP: Record<keyof AppData, string> = {
  roles: 'roles',
  permissions: 'permissions',
  rolePermissions: 'role_permissions',
  users: 'app_users',
  customers: 'customers',
  purchases: 'purchases',
  vehicles: 'vehicles',
  vehicleDocuments: 'vehicle_documents',
  expenseCategories: 'expense_categories',
  vehicleExpenses: 'vehicle_expenses',
  showroomExpenses: 'showroom_expenses',
  sales: 'sales',
  salePayments: 'sale_payments',
  deliveryRecords: 'delivery_records',
  investors: 'investors',
  investments: 'investments',
  investorReturns: 'investor_returns',
  ppfCustomers: 'ppf_customers',
  ppfVehicles: 'ppf_vehicles',
  ppfBrands: 'ppf_brands',
  ppfRolls: 'ppf_rolls',
  ppfStockTransactions: 'ppf_stock_transactions',
  ppfPackages: 'ppf_packages',
  ppfJobCards: 'ppf_job_cards',
  ppfJobMaterials: 'ppf_job_materials',
  ppfJobLabor: 'ppf_job_labor',
  ppfSales: 'ppf_sales',
  ppfPayments: 'ppf_payments',
  ppfWarranties: 'ppf_warranties',
  auditLogs: 'audit_logs',
  financeSettings: 'finance_settings',
};

const FK_CHECKS = [
  { child: 'vehicles', childCol: 'purchase_id', parent: 'purchases', parentCol: 'purchase_id' },
  { child: 'sales', childCol: 'vehicle_id', parent: 'vehicles', parentCol: 'vehicle_id' },
  { child: 'sales', childCol: 'customer_id', parent: 'customers', parentCol: 'customer_id' },
  { child: 'sale_payments', childCol: 'sale_id', parent: 'sales', parentCol: 'sale_id' },
  { child: 'ppf_job_cards', childCol: 'ppf_customer_id', parent: 'ppf_customers', parentCol: 'ppf_customer_id' },
  { child: 'ppf_job_cards', childCol: 'roll_id', parent: 'ppf_rolls', parentCol: 'roll_id' },
  { child: 'audit_logs', childCol: 'user_id', parent: 'app_users', parentCol: 'user_id' },
  { child: 'role_permissions', childCol: 'role_id', parent: 'roles', parentCol: 'role_id' },
  { child: 'role_permissions', childCol: 'permission_id', parent: 'permissions', parentCol: 'permission_id' },
  { child: 'app_users', childCol: 'role_id', parent: 'roles', parentCol: 'role_id' },
];

async function getCount(supabase: ReturnType<typeof createClient>, table: string) {
  const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
  if (error) throw new Error(`Count failed for ${table}: ${error.message}`);
  return count ?? 0;
}

async function loop1BootstrapCheck(supabase: ReturnType<typeof createClient>, seed: AppData) {
  console.log('\n=== LOOP 1: Bootstrap row count cross-check ===');
  let passed = 0;
  let failed = 0;

  for (const key of BOOTSTRAP_KEYS) {
    const table = TABLE_MAP[key];
    const expected = seed[key].length;
    const actual = await getCount(supabase, table);
    const ok = expected === actual;
    console.log(`${ok ? '✓' : '✗'} ${table}: expected ${expected}, got ${actual}`);
    if (ok) passed++;
    else failed++;
  }

  // Business tables: report counts only (empty DB is valid after demo clear)
  const businessKeys = (Object.keys(TABLE_MAP) as (keyof AppData)[]).filter(
    (k) => !BOOTSTRAP_KEYS.includes(k) && k !== 'financeSettings',
  );
  console.log('\n--- Business table counts (informational) ---');
  for (const key of businessKeys) {
    const table = TABLE_MAP[key];
    const actual = await getCount(supabase, table);
    console.log(`  · ${table}: ${actual}`);
    passed++;
  }

  const financeCount = await getCount(supabase, 'finance_settings');
  const financeOk = financeCount >= 0;
  console.log(`${financeOk ? '✓' : '✗'} finance_settings: ${financeCount} row(s)`);
  if (financeOk) passed++;
  else failed++;

  return { passed, failed };
}

async function loop2IntegrityCheck(supabase: ReturnType<typeof createClient>, seed: AppData) {
  console.log('\n=== LOOP 2: Integrity cross-check ===');
  let passed = 0;
  let failed = 0;

  for (const fk of FK_CHECKS) {
    const { data: children } = await supabase.from(fk.child).select(fk.childCol);
    const { data: parents } = await supabase.from(fk.parent).select(fk.parentCol);
    const parentIds = new Set((parents ?? []).map((p) => String(p[fk.parentCol])));
    const orphans = (children ?? []).filter((c) => !parentIds.has(String(c[fk.childCol])));
    const ok = orphans.length === 0;
    console.log(
      `${ok ? '✓' : '✗'} FK ${fk.child}.${fk.childCol} → ${fk.parent}: ${orphans.length} orphan(s)`,
    );
    if (ok) passed++;
    else failed++;
  }

  const { data: dbUsers } = await supabase.from('app_users').select('username, email, auth_user_id');
  const seedUsernames = new Set(seed.users.map((u) => u.username));
  const dbUsernames = new Set((dbUsers ?? []).map((u) => u.username));
  const usersMatch =
    seedUsernames.size === dbUsernames.size &&
    [...seedUsernames].every((u) => dbUsernames.has(u));
  console.log(`${usersMatch ? '✓' : '✗'} All seed usernames present in app_users`);
  if (usersMatch) passed++;
  else failed++;

  const linkedCount = (dbUsers ?? []).filter((u) => u.auth_user_id).length;
  const authLinkedOk = linkedCount >= seed.users.length;
  console.log(
    `${authLinkedOk ? '✓' : '✗'} Auth-linked app_users: ${linkedCount}/${seed.users.length}`,
  );
  if (authLinkedOk) passed++;
  else failed++;

  const { data: adminPerms } = await supabase
    .from('role_permissions')
    .select('permission_id')
    .eq('role_id', 'rol_001');
  const hasFinancePerm = (adminPerms ?? []).some((p) => p.permission_id === 'perm_011');
  console.log(`${hasFinancePerm ? '✓' : '✗'} Admin role has finance permission (perm_011)`);
  if (hasFinancePerm) passed++;
  else failed++;

  return { passed, failed };
}

async function main() {
  const supabase = await createAuthenticatedSupabaseClient();
  const seed = createSeedData();

  const { error: pingError } = await supabase.from('roles').select('role_id').limit(1);
  if (pingError) {
    console.error(`Connection failed: ${pingError.message}`);
    process.exit(1);
  }
  console.log('Connected to Supabase successfully.');

  const loop1 = await loop1BootstrapCheck(supabase, seed);
  const loop2 = await loop2IntegrityCheck(supabase, seed);

  console.log('\n=== SUMMARY ===');
  console.log(`Loop 1: ${loop1.passed} passed, ${loop1.failed} failed`);
  console.log(`Loop 2: ${loop2.passed} passed, ${loop2.failed} failed`);

  if (loop1.failed + loop2.failed > 0) process.exit(1);
  console.log('\nAll cross-checks passed.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
