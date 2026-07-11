/**
 * Removes all sample business data from Supabase.
 * Keeps roles, permissions, app_users, and expense categories intact.
 *
 * Run: npm run db:clear-demo
 */
import { createClient } from '@supabase/supabase-js';
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

const TABLE_PRIMARY_KEYS: Record<(typeof DEMO_TABLES)[number], string> = {
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
  customers: 'customer_id',
};

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
    console.error('Missing SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log('Clearing demo business data from Supabase...');

  for (const table of DEMO_TABLES) {
    const pk = TABLE_PRIMARY_KEYS[table];
    const { error } = await supabase.from(table).delete().not(pk, 'is', null);
    if (error) {
      console.error(`FAILED clearing ${table}: ${error.message}`);
      process.exit(1);
    }
    console.log(`  ✓ cleared ${table}`);
  }

  console.log('\nDemo data cleared. Roles, users, permissions, and expense categories were kept.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
