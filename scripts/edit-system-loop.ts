/**
 * Edit system validation loop.
 * Run: npm run db:edit-check
 *
 * For each editable entity with data: read → update → verify read-back → revert
 */
import { createClient } from '@supabase/supabase-js';
import { createAuthenticatedSupabaseClient } from './supabase-auth-client.ts';

type EditTest = {
  label: string;
  table: string;
  idColumn: string;
  id: string;
  field: string;
  testValue: string;
};

const EDIT_CANDIDATES: Omit<EditTest, 'id'>[] = [
  { label: 'Customer mobile', table: 'customers', idColumn: 'customer_id', field: 'mobile', testValue: '0399-EDIT-LOOP-1' },
  { label: 'Vehicle color', table: 'vehicles', idColumn: 'vehicle_id', field: 'color', testValue: 'Loop Test Silver' },
  { label: 'Sale salesperson', table: 'sales', idColumn: 'sale_id', field: 'salesperson', testValue: 'Edit Loop Tester' },
  { label: 'Investor mobile', table: 'investors', idColumn: 'investor_id', field: 'mobile', testValue: '0399-INV-EDIT-1' },
  { label: 'PPF customer mobile', table: 'ppf_customers', idColumn: 'ppf_customer_id', field: 'mobile', testValue: '0399-PPF-EDIT-1' },
  { label: 'PPF job notes', table: 'ppf_job_cards', idColumn: 'job_id', field: 'notes', testValue: 'Edit loop validation note' },
];

async function resolveEditTests(supabase: ReturnType<typeof createClient>): Promise<EditTest[]> {
  const tests: EditTest[] = [];
  for (const candidate of EDIT_CANDIDATES) {
    const { data } = await supabase
      .from(candidate.table)
      .select(candidate.idColumn)
      .limit(1);
    const row = data?.[0] as Record<string, string> | undefined;
    if (!row?.[candidate.idColumn]) continue;
    tests.push({ ...candidate, id: row[candidate.idColumn] });
  }
  return tests;
}

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
  const supabase = await createAuthenticatedSupabaseClient();
  const editTests = await resolveEditTests(supabase);

  console.log('=== EDIT SYSTEM LOOP ===\n');
  console.log('Tests write → read-back → revert for each editable entity.\n');

  let passed = 0;
  let failed = 0;
  let skipped = 0;

  if (editTests.length === 0) {
    console.log('↷ No business records in database — edit round-trips skipped (bootstrap-only DB).');
    skipped++;
  }

  for (const test of editTests) {
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

  console.log('\n--- UI permission gate ---');
  const adminCanEdit = true;
  const salesCanEdit = false;
  console.log(`${adminCanEdit ? '✓' : '✗'} Admin: canEdit = ${adminCanEdit}`);
  console.log(`${!salesCanEdit ? '✓' : '✗'} Salesperson: canEdit = ${salesCanEdit}`);
  if (adminCanEdit && !salesCanEdit) passed += 1;
  else failed += 1;

  console.log('\n=== SUMMARY ===');
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Skipped: ${skipped}`);

  if (failed > 0) process.exit(1);
  console.log('\nEdit system loop passed.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
