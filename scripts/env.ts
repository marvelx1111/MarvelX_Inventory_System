import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export function loadEnvFile(path = '.env.local'): Record<string, string> {
  const parsed: Record<string, string> = {};
  try {
    const content = readFileSync(resolve(process.cwd(), path), 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      parsed[key] = value;
    }
  } catch {
    // optional file
  }
  return parsed;
}

export function getSupabaseEnv(
  fileEnv: Record<string, string> = loadEnvFile(),
  runtimeEnv: Record<string, string | undefined> = process.env,
) {
  const merged = { ...fileEnv, ...runtimeEnv };
  const url =
    merged.VITE_SUPABASE_URL ??
    merged.NEXT_PUBLIC_SUPABASE_URL ??
    '';
  const anonKey =
    merged.VITE_SUPABASE_ANON_KEY ??
    merged.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    '';
  return { url, anonKey };
}
