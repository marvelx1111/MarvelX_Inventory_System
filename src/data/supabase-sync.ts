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

export function persistErrorMessage(result: PersistResult): string | null {
  if (!result.ok) return result.error;
  if (!result.persisted) {
    return 'Saved in this browser session only. Configure Supabase on Vercel to keep changes permanently.';
  }
  return null;
}
