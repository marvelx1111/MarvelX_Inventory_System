/**
 * Seeds Marvel X bootstrap data into Supabase (roles, permissions, categories).
 * Clears all sample business records first. Does not remove or overwrite app_users.
 *
 * Run: npm run db:seed
 */
import { createClient } from '@supabase/supabase-js';
import { createSeedData } from '../src/data/seed.ts';
import type { AppData } from '../src/types/index.ts';
import { getSupabaseEnv, loadEnvFile } from './env.ts';

const DEMO_TABLES = [
  'audit_logs',
  'ppf_warranties',
  'ppf_payments',
  'ppf_sales',
  'ppf_job_labor',
  'ppf_job_materials',
  'ppf_job_cards',
  'ppf_stock_transactions',
  'ppf_rolls',
  'ppf_packages',
  'ppf_vehicles',
  'ppf_customers',
  'ppf_brands',
  'investor_returns',
  'investments',
  'investors',
  'delivery_records',
  'sale_payments',
  'sales',
  'vehicle_expenses',
  'showroom_expenses',
  'vehicle_documents',
  'vehicles',
  'purchases',
  'customers',
] as const;

const BOOTSTRAP_TABLES: { key: keyof AppData; table: string; pk: string }[] = [
  { key: 'roles', table: 'roles', pk: 'role_id' },
  { key: 'permissions', table: 'permissions', pk: 'permission_id' },
  { key: 'rolePermissions', table: 'role_permissions', pk: 'role_id' },
  { key: 'expenseCategories', table: 'expense_categories', pk: 'category_id' },
];

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

  console.log('Clearing demo business data...');
  for (const table of DEMO_TABLES) {
    const pk = table === 'customers' ? 'customer_id' : undefined;
    const primaryKey =
      pk ??
      ({
        audit_logs: 'log_id',
        ppf_warranties: 'warranty_id',
        ppf_payments: 'payment_id',
        ppf_sales: 'ppf_sale_id',
        ppf_job_labor: 'labor_id',
        ppf_job_materials: 'material_id',
        ppf_job_cards: 'job_id',
        ppf_stock_transactions: 'transaction_id',
        ppf_rolls: 'roll_id',
        ppf_packages: 'package_id',
        ppf_vehicles: 'ppf_vehicle_id',
        ppf_customers: 'ppf_customer_id',
        ppf_brands: 'brand_id',
        investor_returns: 'return_id',
        investments: 'investment_id',
        investors: 'investor_id',
        delivery_records: 'delivery_id',
        sale_payments: 'payment_id',
        sales: 'sale_id',
        vehicle_expenses: 'expense_id',
        showroom_expenses: 'expense_id',
        vehicle_documents: 'document_id',
        vehicles: 'vehicle_id',
        purchases: 'purchase_id',
      } as Record<(typeof DEMO_TABLES)[number], string>)[table];

    const { error } = await supabase.from(table).delete().not(primaryKey, 'is', null);
    if (error) console.warn(`  clear ${table}: ${error.message}`);
  }

  console.log('Seeding bootstrap tables...');
  for (const { key, table, pk } of BOOTSTRAP_TABLES) {
    const { error: clearError } = await supabase.from(table).delete().not(pk, 'is', null);
    if (clearError) console.warn(`  clear ${table}: ${clearError.message}`);

    const rows = seed[key];
    if (!rows.length) continue;

    const { error } = await supabase.from(table).insert(rows);
    if (error) {
      console.error(`FAILED seeding ${table}: ${error.message}`);
      process.exit(1);
    }
    console.log(`  ✓ ${table}: ${rows.length} rows`);
  }

  console.log('\nBootstrap seed complete (app_users unchanged).');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
