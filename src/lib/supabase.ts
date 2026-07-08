import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getViteSupabaseEnv } from './env';

let browserClient: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  return getViteSupabaseEnv().isConfigured;
}

export function getSupabaseBrowserClient(): SupabaseClient | null {
  const { url, anonKey, isConfigured } = getViteSupabaseEnv();
  if (!isConfigured) return null;

  if (!browserClient) {
    browserClient = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }

  return browserClient;
}

export async function signOutSupabase(): Promise<void> {
  const client = getSupabaseBrowserClient();
  if (client) {
    await client.auth.signOut();
  }
}
