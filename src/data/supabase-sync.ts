import { getSupabaseBrowserClient } from '@/lib/supabase';

export type PersistResult =
  | { ok: true; persisted: boolean }
  | { ok: false; error: string };

function requireClient(): PersistResult | { client: NonNullable<ReturnType<typeof getSupabaseBrowserClient>> } {
  const client = getSupabaseBrowserClient();
  if (!client) {
    return {
      ok: false,
      error: 'Database is not connected. Sign in again or check Supabase configuration.',
    };
  }
  return { client };
}

export async function persistRowUpdate(
  table: string,
  idColumn: string,
  id: string,
  updates: Record<string, unknown>,
): Promise<PersistResult> {
  const resolved = requireClient();
  if ('ok' in resolved) return resolved;

  const { error } = await resolved.client.from(table).update(updates).eq(idColumn, id);
  if (error) return { ok: false, error: error.message };
  return { ok: true, persisted: true };
}

export async function persistRowInsert(
  table: string,
  row: Record<string, unknown>,
): Promise<PersistResult> {
  const resolved = requireClient();
  if ('ok' in resolved) return resolved;

  const { error } = await resolved.client.from(table).insert(row);
  if (error) return { ok: false, error: error.message };
  return { ok: true, persisted: true };
}

export async function persistRowDelete(
  table: string,
  idColumn: string,
  id: string,
): Promise<PersistResult> {
  const resolved = requireClient();
  if ('ok' in resolved) return resolved;

  const { error } = await resolved.client.from(table).delete().eq(idColumn, id);
  if (error) return { ok: false, error: error.message };
  return { ok: true, persisted: true };
}

export async function persistRowsInsert(
  table: string,
  rows: Record<string, unknown>[],
): Promise<PersistResult> {
  const resolved = requireClient();
  if ('ok' in resolved) return resolved;
  if (rows.length === 0) return { ok: true, persisted: true };

  const { error } = await resolved.client.from(table).insert(rows);
  if (error) return { ok: false, error: error.message };
  return { ok: true, persisted: true };
}

export async function persistRowsDeleteByColumn(
  table: string,
  column: string,
  value: string,
): Promise<PersistResult> {
  const resolved = requireClient();
  if ('ok' in resolved) return resolved;

  const { error } = await resolved.client.from(table).delete().eq(column, value);
  if (error) return { ok: false, error: error.message };
  return { ok: true, persisted: true };
}

export async function persistRowUpsert(
  table: string,
  row: Record<string, unknown>,
  onConflict: string,
): Promise<PersistResult> {
  const resolved = requireClient();
  if ('ok' in resolved) return resolved;

  const { error } = await resolved.client.from(table).upsert(row, { onConflict });
  if (error) return { ok: false, error: error.message };
  return { ok: true, persisted: true };
}

/** Seed any missing default expense categories (e.g. Miscellaneous) into Supabase. */
export async function ensureDefaultExpenseCategories(
  categories: readonly { category_id: string; category_name: string; description: string }[],
): Promise<PersistResult> {
  const resolved = requireClient();
  if ('ok' in resolved) return resolved;

  const { data: existing, error: readError } = await resolved.client
    .from('expense_categories')
    .select('category_id');
  if (readError) return { ok: false, error: readError.message };

  const have = new Set((existing ?? []).map((row) => row.category_id as string));
  const missing = categories.filter((category) => !have.has(category.category_id));
  if (missing.length === 0) return { ok: true, persisted: true };

  const { error } = await resolved.client
    .from('expense_categories')
    .upsert([...missing], { onConflict: 'category_id' });
  if (error) return { ok: false, error: error.message };
  return { ok: true, persisted: true };
}

export function persistErrorMessage(result: PersistResult): string | null {
  if (!result.ok) return result.error;
  if (!result.persisted) {
    return 'Saved in this browser session only. Configure Supabase on Vercel to keep changes permanently.';
  }
  return null;
}
