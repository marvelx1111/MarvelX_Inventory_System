import type { SupabaseClient } from '@supabase/supabase-js';
import type { AppData, User } from '@/types';

const TABLES: { key: keyof AppData; table: string }[] = [
  { key: 'roles', table: 'roles' },
  { key: 'permissions', table: 'permissions' },
  { key: 'rolePermissions', table: 'role_permissions' },
  { key: 'customers', table: 'customers' },
  { key: 'purchases', table: 'purchases' },
  { key: 'vehicles', table: 'vehicles' },
  { key: 'vehicleDocuments', table: 'vehicle_documents' },
  { key: 'expenseCategories', table: 'expense_categories' },
  { key: 'vehicleExpenses', table: 'vehicle_expenses' },
  { key: 'showroomExpenses', table: 'showroom_expenses' },
  { key: 'sales', table: 'sales' },
  { key: 'salePayments', table: 'sale_payments' },
  { key: 'deliveryRecords', table: 'delivery_records' },
  { key: 'investors', table: 'investors' },
  { key: 'investments', table: 'investments' },
  { key: 'investorReturns', table: 'investor_returns' },
  { key: 'ppfCustomers', table: 'ppf_customers' },
  { key: 'ppfVehicles', table: 'ppf_vehicles' },
  { key: 'ppfBrands', table: 'ppf_brands' },
  { key: 'ppfRolls', table: 'ppf_rolls' },
  { key: 'ppfStockTransactions', table: 'ppf_stock_transactions' },
  { key: 'ppfPackages', table: 'ppf_packages' },
  { key: 'ppfJobCards', table: 'ppf_job_cards' },
  { key: 'ppfJobMaterials', table: 'ppf_job_materials' },
  { key: 'ppfJobLabor', table: 'ppf_job_labor' },
  { key: 'ppfSales', table: 'ppf_sales' },
  { key: 'ppfPayments', table: 'ppf_payments' },
  { key: 'ppfWarranties', table: 'ppf_warranties' },
  { key: 'auditLogs', table: 'audit_logs' },
];

function num(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Number.parseFloat(value) || 0;
  return 0;
}

function mapUsers(rows: Record<string, unknown>[]): User[] {
  return rows.map((row) => ({
    user_id: String(row.user_id),
    role_id: String(row.role_id),
    full_name: String(row.full_name),
    username: String(row.username),
    email: String(row.email ?? ''),
    phone: String(row.phone ?? ''),
    status: row.status as User['status'],
    auth_user_id: row.auth_user_id ? String(row.auth_user_id) : null,
  }));
}

export async function fetchAllFromSupabase(client: SupabaseClient): Promise<AppData> {
  const result = {} as AppData;

  for (const { key, table } of TABLES) {
    const { data, error } = await client.from(table).select('*');
    if (error) {
      throw new Error(`Failed to load ${table}: ${error.message}`);
    }
    (result as unknown as Record<string, unknown>)[key] = data ?? [];
  }

  const { data: userRows, error: userError } = await client
    .from('app_users')
    .select('user_id, role_id, full_name, username, email, phone, status, auth_user_id');
  if (userError) {
    throw new Error(`Failed to load app_users: ${userError.message}`);
  }
  result.users = mapUsers((userRows ?? []) as Record<string, unknown>[]);

  // Normalize numeric fields that Postgres may return as strings
  result.vehicles = result.vehicles.map((v) => ({
    ...v,
    model_year: num(v.model_year),
    mileage: num(v.mileage),
    purchase_price: num(v.purchase_price),
    total_cost: num(v.total_cost),
  }));

  result.sales = result.sales.map((s) => ({
    ...s,
    sale_price: num(s.sale_price),
    discount: num(s.discount),
    advance: num(s.advance),
    balance: num(s.balance),
    profit: num(s.profit),
  }));

  result.ppfRolls = result.ppfRolls.map((r) => ({
    ...r,
    width: num(r.width),
    total_length: num(r.total_length),
    remaining_length: num(r.remaining_length),
    purchase_cost: num(r.purchase_cost),
  }));

  return result;
}

export async function testSupabaseConnection(client: SupabaseClient): Promise<void> {
  const { error } = await client.from('roles').select('role_id').limit(1);
  if (error) throw new Error(`Connection test failed: ${error.message}`);
}
