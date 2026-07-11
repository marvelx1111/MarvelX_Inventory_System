import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getTestAuthCredentials } from './auth-env.ts';
import { getSupabaseEnv, loadEnvFile } from './env.ts';

export async function createAuthenticatedSupabaseClient(): Promise<SupabaseClient> {
  const fileEnv = loadEnvFile();
  const { url, anonKey } = getSupabaseEnv(fileEnv);
  if (!url || !anonKey) {
    throw new Error('Missing Supabase env vars in .env.local');
  }

  const { adminEmail, adminPassword } = getTestAuthCredentials();
  if (!adminPassword) {
    throw new Error('Set AUTH_PASSWORD_ADMIN in .env.local');
  }

  const supabase = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error } = await supabase.auth.signInWithPassword({
    email: adminEmail,
    password: adminPassword,
  });
  if (error) {
    throw new Error(`Admin login failed: ${error.message}`);
  }

  return supabase;
}
