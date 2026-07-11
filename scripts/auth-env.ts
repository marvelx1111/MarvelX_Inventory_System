import { loadEnvFile } from './env.ts';

export function getTestAuthCredentials() {
  const fileEnv = loadEnvFile();
  const merged = { ...fileEnv, ...process.env };

  const adminEmail = merged.AUTH_ADMIN_EMAIL ?? 'admin@marvelx.pk';
  const adminPassword = merged.AUTH_PASSWORD_ADMIN ?? '';
  const salesEmail = merged.AUTH_SALES_EMAIL ?? 'sales@marvelx.pk';
  const salesPassword = merged.AUTH_PASSWORD_SALES ?? '';
  const ppfEmail = merged.AUTH_PPF_EMAIL ?? 'ppf@marvelx.pk';
  const ppfPassword = merged.AUTH_PASSWORD_PPF ?? '';

  return { adminEmail, adminPassword, salesEmail, salesPassword, ppfEmail, ppfPassword };
}

export function requireAdminTestCredentials() {
  const creds = getTestAuthCredentials();
  if (!creds.adminPassword) {
    throw new Error('Set AUTH_PASSWORD_ADMIN in .env.local for UI test scripts.');
  }
  return creds;
}
