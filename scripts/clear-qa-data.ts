/**
 * Removes QA/automation test records from Supabase.
 * Run: npm run db:clear-qa
 */
import { createAuthenticatedSupabaseClient } from './supabase-auth-client.ts';

async function deleteQaCustomers(supabase: Awaited<ReturnType<typeof createAuthenticatedSupabaseClient>>) {
  const { data: allCustomers, error: loadError } = await supabase
    .from('customers')
    .select('customer_id, full_name');

  if (loadError) {
    throw new Error(`Failed to load customers: ${loadError.message}`);
  }

  const qaCustomers = (allCustomers ?? []).filter(
    (c) => c.full_name.startsWith('QA Loop') || c.full_name.startsWith('Dealer Loop'),
  );

  if (!qaCustomers.length) {
    console.log('No QA test customers found.');
    return 0;
  }

  const ids = qaCustomers.map((c) => c.customer_id);
  console.log(`Removing ${ids.length} QA customer(s):`);
  for (const c of qaCustomers) {
    console.log(`  · ${c.customer_id} — ${c.full_name}`);
  }

  const { error: auditError } = await supabase
    .from('audit_logs')
    .delete()
    .eq('table_name', 'customers')
    .in('record_id', ids);
  if (auditError) {
    throw new Error(`Failed to clear QA audit logs: ${auditError.message}`);
  }

  const { error: deleteError } = await supabase.from('customers').delete().in('customer_id', ids);
  if (deleteError) {
    throw new Error(`Failed to delete QA customers: ${deleteError.message}`);
  }

  return ids.length;
}

export async function clearQaTestData(): Promise<number> {
  const supabase = await createAuthenticatedSupabaseClient();
  return deleteQaCustomers(supabase);
}

async function main() {
  console.log('Clearing QA test data from Supabase...\n');
  const removed = await clearQaTestData();
  console.log(`\nDone. Removed ${removed} QA customer record(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
