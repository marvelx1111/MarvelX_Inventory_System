import type { Session, SupabaseClient } from '@supabase/supabase-js';
import type { User } from '@/types';

const APP_USER_COLUMNS =
  'user_id, role_id, full_name, username, email, phone, status, auth_user_id';

export async function fetchAppUserByAuthId(
  client: SupabaseClient,
  authUserId: string,
): Promise<User | null> {
  const { data, error } = await client
    .from('app_users')
    .select(APP_USER_COLUMNS)
    .eq('auth_user_id', authUserId)
    .eq('status', 'active')
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load app profile: ${error.message}`);
  }

  if (!data) return null;

  return mapAppUserRow(data);
}

export async function resolveAppUserFromSession(
  client: SupabaseClient,
  session: Session | null,
): Promise<User | null> {
  if (!session?.user?.id) return null;
  return fetchAppUserByAuthId(client, session.user.id);
}

function mapAppUserRow(row: Record<string, unknown>): User {
  return {
    user_id: String(row.user_id),
    role_id: String(row.role_id),
    full_name: String(row.full_name),
    username: String(row.username),
    email: String(row.email ?? ''),
    phone: String(row.phone ?? ''),
    status: row.status as User['status'],
    auth_user_id: row.auth_user_id ? String(row.auth_user_id) : null,
  };
}

export function isDemoAuthEnabled(): boolean {
  return import.meta.env.DEV && import.meta.env.VITE_ALLOW_DEMO_AUTH === 'true';
}
