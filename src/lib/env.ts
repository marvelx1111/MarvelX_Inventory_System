import { SUPABASE_ANON_KEY, SUPABASE_PROJECT_URL } from '@/config/supabase';

export function getViteSupabaseEnv() {
  const url =
    import.meta.env.VITE_SUPABASE_URL ??
    import.meta.env.NEXT_PUBLIC_SUPABASE_URL ??
    SUPABASE_PROJECT_URL;
  const anonKey =
    import.meta.env.VITE_SUPABASE_ANON_KEY ??
    import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    SUPABASE_ANON_KEY;
  return { url, anonKey, isConfigured: Boolean(url && anonKey) };
}
