/**
 * Links app_users rows to Supabase Auth accounts.
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local (never commit this key).
 *
 * Set passwords via env before running:
 *   AUTH_PASSWORD_ADMIN=...
 *   AUTH_PASSWORD_SALES=...
 *   AUTH_PASSWORD_PPF=...
 *
 * Run: npm run db:auth-bootstrap
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
  const { url, anonKey } = getSupabaseEnv(fileEnv);
  const serviceRoleKey = merged.SUPABASE_SERVICE_ROLE_KEY ?? '';

  if (!url || !anonKey) {
    console.error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY in .env.local');
    process.exit(1);
  }
  if (!serviceRoleKey) {
    console.error('Missing SUPABASE_SERVICE_ROLE_KEY in .env.local');
    console.error('Get it from Supabase Dashboard → Project Settings → API → service_role');
    process.exit(1);
  }

  const admin = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: appUsers, error: loadError } = await admin
    .from('app_users')
    .select('user_id, full_name, username, email, role_id, status, auth_user_id')
    .order('user_id');

  if (loadError) {
    console.error(`Failed to load app_users: ${loadError.message}`);
    process.exit(1);
  }

  if (!appUsers?.length) {
    console.error('No app_users found. Run npm run db:seed first.');
    process.exit(1);
  }

  console.log(`Bootstrapping Supabase Auth for ${appUsers.length} app user(s)...`);

  for (const appUser of appUsers) {
    if (appUser.auth_user_id) {
      console.log(`  ↷ ${appUser.email} already linked (${appUser.auth_user_id})`);
      continue;
    }

    if (!appUser.email) {
      console.error(`  ✗ ${appUser.user_id} has no email — skipping`);
      continue;
    }

    const passwordEnvKey = PASSWORD_ENV_KEYS[appUser.user_id];
    const password = passwordEnvKey ? merged[passwordEnvKey] : '';
    if (!password) {
      console.log(`  ↷ ${appUser.email} skipped (no ${passwordEnvKey ?? 'AUTH_PASSWORD_*'} set)`);
      continue;
    }
    if (password.length < 6) {
      console.error(`  ✗ ${passwordEnvKey} must be at least 6 characters for ${appUser.email}`);
      process.exit(1);
    }

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email: appUser.email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: appUser.full_name,
        username: appUser.username,
        app_user_id: appUser.user_id,
      },
      app_metadata: {
        role_id: appUser.role_id,
        app_user_id: appUser.user_id,
      },
    });

    if (createError) {
      const message = createError.message.toLowerCase();
      if (message.includes('already') || message.includes('registered')) {
        const { data: listed, error: listError } = await admin.auth.admin.listUsers();
        if (listError) {
          console.error(`  ✗ ${appUser.email}: ${createError.message}`);
          process.exit(1);
        }
        const existing = listed.users.find(
          (u) => u.email?.toLowerCase() === appUser.email.toLowerCase(),
        );
        if (!existing) {
          console.error(`  ✗ ${appUser.email}: auth user exists but could not be resolved`);
          process.exit(1);
        }
        const { error: linkError } = await admin
          .from('app_users')
          .update({ auth_user_id: existing.id })
          .eq('user_id', appUser.user_id);
        if (linkError) {
          console.error(`  ✗ link ${appUser.email}: ${linkError.message}`);
          process.exit(1);
        }
        console.log(`  ✓ linked existing auth user for ${appUser.email}`);
        continue;
      }
      console.error(`  ✗ ${appUser.email}: ${createError.message}`);
      process.exit(1);
    }

    const authUserId = created.user?.id;
    if (!authUserId) {
      console.error(`  ✗ ${appUser.email}: createUser returned no id`);
      process.exit(1);
    }

    const { error: updateError } = await admin
      .from('app_users')
      .update({ auth_user_id: authUserId })
      .eq('user_id', appUser.user_id);

    if (updateError) {
      console.error(`  ✗ link ${appUser.email}: ${updateError.message}`);
      process.exit(1);
    }

    console.log(`  ✓ ${appUser.email} → auth user ${authUserId}`);
  }

  console.log('\nAuth bootstrap complete. Users can sign in with their email + env password.');
  console.log('Rotate passwords in Supabase Dashboard after first login if needed.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
