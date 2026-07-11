/**
 * Updates Supabase Auth passwords for linked app_users from env vars.
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local.
 *
 * Run: npm run db:update-passwords
 */
import { createClient } from '@supabase/supabase-js';
import { getSupabaseEnv, loadEnvFile } from './env.ts';

const PASSWORD_ENV_KEYS: Record<string, string> = {
  usr_001: 'AUTH_PASSWORD_ADMIN',
  usr_002: 'AUTH_PASSWORD_SALES',
  usr_003: 'AUTH_PASSWORD_PPF',
};

async function main() {
  const fileEnv = loadEnvFile();
  const merged = { ...fileEnv, ...process.env };
  const { url } = getSupabaseEnv(fileEnv);
  const serviceRoleKey = merged.SUPABASE_SERVICE_ROLE_KEY ?? '';

  if (!url) {
    console.error('Missing VITE_SUPABASE_URL in .env.local');
    process.exit(1);
  }
  if (!serviceRoleKey) {
    console.error('Missing SUPABASE_SERVICE_ROLE_KEY in .env.local');
    console.error('Uncomment or add it from Supabase Dashboard → Project Settings → API');
    process.exit(1);
  }

  const admin = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: appUsers, error: loadError } = await admin
    .from('app_users')
    .select('user_id, email, auth_user_id')
    .order('user_id');

  if (loadError) {
    console.error(`Failed to load app_users: ${loadError.message}`);
    process.exit(1);
  }

  console.log('Updating Supabase Auth passwords...\n');
  let updated = 0;
  let skipped = 0;

  for (const appUser of appUsers ?? []) {
    const passwordEnvKey = PASSWORD_ENV_KEYS[appUser.user_id];
    const password = passwordEnvKey ? merged[passwordEnvKey] : '';
    if (!password) {
      console.log(`  ↷ ${appUser.email ?? appUser.user_id}: no ${passwordEnvKey ?? 'password env'}`);
      skipped++;
      continue;
    }
    if (!appUser.auth_user_id) {
      console.log(`  ↷ ${appUser.email}: not linked to auth — run npm run db:auth-bootstrap first`);
      skipped++;
      continue;
    }
    if (password.length < 6) {
      console.error(`  ✗ ${passwordEnvKey} must be at least 6 characters`);
      process.exit(1);
    }

    const { error } = await admin.auth.admin.updateUserById(appUser.auth_user_id, {
      password,
    });
    if (error) {
      console.error(`  ✗ ${appUser.email}: ${error.message}`);
      process.exit(1);
    }
    console.log(`  ✓ ${appUser.email}`);
    updated++;
  }

  console.log(`\nDone. Updated ${updated}, skipped ${skipped}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
