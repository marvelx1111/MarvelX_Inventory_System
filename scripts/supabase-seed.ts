/**
 * Seeds Marvel X mock data into Supabase.
 * Run: npm run db:seed
 */
import { createClient } from '@supabase/supabase-js';
import { createSeedData } from '../src/data/seed.ts';
import type { AppData } from '../src/types/index.ts';
import { getSupabaseEnv, loadEnvFile } from './env.ts';

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
};

const INSERT_ORDER: (keyof AppData)[] = [
  'roles',
  'permissions',
  'rolePermissions',
  'users',
  'customers',
  'expenseCategories',
  'purchases',
  'vehicles',
  'vehicleDocuments',
  'vehicleExpenses',
  'showroomExpenses',
  'sales',
  'salePayments',
  'deliveryRecords',
  'investors',
  'investments',
  'investorReturns',
  'ppfCustomers',
  'ppfVehicles',
  'ppfBrands',
  'ppfRolls',
  'ppfStockTransactions',
  'ppfPackages',
  'ppfJobCards',
  'ppfJobMaterials',
  'ppfJobLabor',
  'ppfSales',
  'ppfPayments',
  'ppfWarranties',
  'auditLogs',
];

function mapUsersForDb(users: AppData['users']) {
  return users.map(({ auth_user_id, ...user }) => ({
    ...user,
    auth_user_id,
  }));
}

async function main() {
  const fileEnv = loadEnvFile();
  const merged = { ...fileEnv, ...process.env };
  const { url, anonKey } = getSupabaseEnv(fileEnv);
  const serviceRoleKey = merged.SUPABASE_SERVICE_ROLE_KEY ?? '';

  if (!url || !anonKey) {
    console.error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY in .env.local');
    process.exit(1);
  }
  if (!serviceRoleKey) {
    console.error('Missing SUPABASE_SERVICE_ROLE_KEY in .env.local (required after auth migration)');
    process.exit(1);
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const seed = createSeedData();

  console.log('Clearing existing Marvel X data (truncate via delete)...');
  for (const key of [...INSERT_ORDER].reverse()) {
    const table = TABLE_MAP[key];
    const pk =
      key === 'users'
        ? 'user_id'
        : key === 'rolePermissions'
          ? 'role_id'
          : Object.keys((seed[key] as Record<string, unknown>[])[0] ?? {})[0];
    if (!pk) continue;
    const { error } = await supabase.from(table).delete().not(pk, 'is', null);
    if (error) console.warn(`  clear ${table}: ${error.message}`);
  }

  console.log('Seeding tables...');
  for (const key of INSERT_ORDER) {
    const table = TABLE_MAP[key];
    const rows = key === 'users' ? mapUsersForDb(seed.users) : seed[key];
    if (!rows.length) continue;

    const { error } = await supabase.from(table).insert(rows);
    if (error) {
      console.error(`FAILED seeding ${table}: ${error.message}`);
      process.exit(1);
    }
    console.log(`  ✓ ${table}: ${rows.length} rows`);
  }

  console.log('\nSeed complete.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
