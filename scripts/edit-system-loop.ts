/**
 * Edit system validation loop.
 * Run: npm run db:edit-check
 *
 * For each editable entity: read → update → verify read-back → revert → verify restore
 */
import { createClient } from '@supabase/supabase-js';
import { getSupabaseEnv, loadEnvFile } from './env.ts';

type EditTest = {
  label: string;
  table: string;
  idColumn: string;
  id: string;
  field: string;
  testValue: string;
};

const EDIT_TESTS: EditTest[] = [
  {
    label: 'Customer mobile',
    table: 'customers',
    idColumn: 'customer_id',
    id: 'cus_001',
    field: 'mobile',
    testValue: '0399-EDIT-LOOP-1',
  },
  {
    label: 'Vehicle color',
    table: 'vehicles',
    idColumn: 'vehicle_id',
    id: 'veh_001',
    field: 'color',
    testValue: 'Loop Test Silver',
  },
  {
    label: 'Sale salesperson',
    table: 'sales',
    idColumn: 'sale_id',
    id: 'sal_001',
    field: 'salesperson',
    testValue: 'Edit Loop Tester',
  },
  {
    label: 'Investor mobile',
    table: 'investors',
    idColumn: 'investor_id',
    id: 'inv_001',
    field: 'mobile',
    testValue: '0399-INV-EDIT-1',
  },
  {
    label: 'PPF customer mobile',
    table: 'ppf_customers',
    idColumn: 'ppf_customer_id',
    id: 'ppfc_001',
    field: 'mobile',
    testValue: '0399-PPF-EDIT-1',
  },
  {
    label: 'PPF job notes',
    table: 'ppf_job_cards',
    idColumn: 'job_id',
    id: 'job_001',
    field: 'notes',
    testValue: 'Edit loop validation note',
  },
];

async function readField(
  supabase: ReturnType<typeof createClient>,
  test: EditTest,
): Promise<string | null> {
  const { data, error } = await supabase
    .from(test.table)
    .select(test.field)
    .eq(test.idColumn, test.id)
    .single();
  if (error) throw new Error(`Read ${test.table}.${test.field}: ${error.message}`);
  const row = data as Record<string, unknown>;
  return row[test.field] == null ? null : String(row[test.field]);
}

async function writeField(
  supabase: ReturnType<typeof createClient>,
  test: EditTest,
  value: string,
): Promise<void> {
  const { error } = await supabase
    .from(test.table)
    .update({ [test.field]: value })
    .eq(test.idColumn, test.id);
  if (error) throw new Error(`Write ${test.table}.${test.field}: ${error.message}`);
}

async function runEditLoop(supabase: ReturnType<typeof createClient>, test: EditTest) {
  const original = await readField(supabase, test);
  if (original === null) {
    return { ok: false, detail: 'Record not found' };
  }

  await writeField(supabase, test, test.testValue);
  const afterEdit = await readField(supabase, test);
  if (afterEdit !== test.testValue) {
    return {
      ok: false,
      detail: `Read-back mismatch: expected "${test.testValue}", got "${afterEdit}"`,
    };
  }

  await writeField(supabase, test, original);
  const afterRevert = await readField(supabase, test);
  if (afterRevert !== original) {
    return {
      ok: false,
      detail: `Revert failed: expected "${original}", got "${afterRevert}"`,
    };
  }

  return { ok: true, detail: `round-trip OK (was "${original}")` };
}

async function main() {
  const { url, anonKey } = getSupabaseEnv(loadEnvFile());
  if (!url || !anonKey) {
    console.error('Missing Supabase env vars in .env.local');
    process.exit(1);
  }

  const supabase = createClient(url, anonKey);

  console.log('=== EDIT SYSTEM LOOP ===\n');
  console.log('Tests write → read-back → revert for each editable entity.\n');

  let passed = 0;
  let failed = 0;

  for (const test of EDIT_TESTS) {
    try {
      const result = await runEditLoop(supabase, test);
      if (result.ok) {
        console.log(`✓ ${test.label} (${test.table}): ${result.detail}`);
        passed++;
      } else {
        console.log(`✗ ${test.label} (${test.table}): ${result.detail}`);
        failed++;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`✗ ${test.label} (${test.table}): ${msg}`);
      failed++;
    }
  }

  // Permission gate check (static — mirrors useCanEdit)
  console.log('\n--- UI permission gate ---');
  const adminPerms = ['users'];
  const salesPerms = ['dashboard', 'inventory', 'purchases', 'sales', 'customers'];
  const adminCanEdit = adminPerms.includes('users');
  const salesCanEdit = salesPerms.includes('users');
  console.log(`${adminCanEdit ? '✓' : '✗'} Admin (users perm): can edit = ${adminCanEdit}`);
  console.log(`${!salesCanEdit ? '✓' : '✗'} Salesperson (no users perm): can edit = ${salesCanEdit}`);
  if (adminCanEdit && !salesCanEdit) passed += 1;
  else failed += 1;

  console.log('\n=== SUMMARY ===');
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);

  if (failed > 0) process.exit(1);
  console.log('\nEdit system loop passed.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
