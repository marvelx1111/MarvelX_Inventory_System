import { getSupabaseBrowserClient } from '@/lib/supabase';

export async function persistRowUpdate(
  table: string,
  idColumn: string,
  id: string,
  updates: Record<string, unknown>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const client = getSupabaseBrowserClient();
  if (!client) return { ok: true };

  const { error } = await client.from(table).update(updates).eq(idColumn, id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function persistRowInsert(
  table: string,
  row: Record<string, unknown>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const client = getSupabaseBrowserClient();
  if (!client) return { ok: true };

  const { error } = await client.from(table).insert(row);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
