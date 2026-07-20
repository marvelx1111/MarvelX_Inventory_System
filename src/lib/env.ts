import { SUPABASE_ANON_KEY, SUPABASE_PROJECT_URL } from '@/config/supabase';

function pickEnv(...values: Array<string | undefined>): string {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }
  return '';
}

export function getViteSupabaseEnv() {
  const url = pickEnv(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_PROJECT_URL,
  );
  const anonKey = pickEnv(
    import.meta.env.VITE_SUPABASE_ANON_KEY,
    import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_ANON_KEY,
  );
  return { url, anonKey, isConfigured: Boolean(url && anonKey) };
}
