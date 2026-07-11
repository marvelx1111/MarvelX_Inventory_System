import { getSupabaseBrowserClient } from '@/lib/supabase';

export type PersistResult =
  | { ok: true; persisted: boolean }
  | { ok: false; error: string };

export async function persistRowUpdate(
  table: string,
  idColumn: string,
  id: string,
  updates: Record<string, unknown>,
): Promise<PersistResult> {
  const client = getSupabaseBrowserClient();
  if (!client) return { ok: true, persisted: false };

  const { error } = await client.from(table).update(updates).eq(idColumn, id);
  if (error) return { ok: false, error: error.message };
  return { ok: true, persisted: true };
}

export async function persistRowInsert(
  table: string,
  row: Record<string, unknown>,
): Promise<PersistResult> {
  const client = getSupabaseBrowserClient();
  if (!client) return { ok: true, persisted: false };

  const { error } = await client.from(table).insert(row);
  if (error) return { ok: false, error: error.message };
  return { ok: true, persisted: true };
}

export async function persistRowDelete(
  table: string,
  idColumn: string,
  id: string,
): Promise<PersistResult> {
  const client = getSupabaseBrowserClient();
  if (!client) return { ok: true, persisted: false };

  const { error } = await client.from(table).delete().eq(idColumn, id);
  if (error) return { ok: false, error: error.message };
  return { ok: true, persisted: true };
}

export async function persistRowsInsert(
  table: string,
  rows: Record<string, unknown>[],
): Promise<PersistResult> {
  const client = getSupabaseBrowserClient();
  if (!client) return { ok: true, persisted: false };
  if (rows.length === 0) return { ok: true, persisted: true };

  const { error } = await client.from(table).insert(rows);
  if (error) return { ok: false, error: error.message };
  return { ok: true, persisted: true };
}

export async function persistRowsDeleteByColumn(
  table: string,
  column: string,
  value: string,
): Promise<PersistResult> {
  const client = getSupabaseBrowserClient();
  if (!client) return { ok: true, persisted: false };

  const { error } = await client.from(table).delete().eq(column, value);
  if (error) return { ok: false, error: error.message };
  return { ok: true, persisted: true };
}

export async function persistRowUpsert(
  table: string,
  row: Record<string, unknown>,
  onConflict: string,
): Promise<PersistResult> {
  const client = getSupabaseBrowserClient();
  if (!client) return { ok: true, persisted: false };

  const { error } = await client.from(table).upsert(row, { onConflict });
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
