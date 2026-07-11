import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';
import { resolve } from 'node:path';

const BASE = process.env.SCREENSHOT_BASE_URL ?? 'http://localhost:5173';

function loadEnvFile(path = '.env.local') {
  const parsed = {};
  try {
    const content = readFileSync(resolve(process.cwd(), path), 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      parsed[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
    }
  } catch {
    // optional
  }
  return parsed;
}

async function login(page, email, password) {
  await page.goto(`${BASE}/login`);
  await page.waitForLoadState('networkidle');
  await page.getByLabel(/email|username/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL(`${BASE}/`);
}

async function screenshot(page, name, width) {
  await page.setViewportSize({ width, height: 900 });
  await page.waitForTimeout(800);
  await page.screenshot({ path: `screenshots/${name}.png`, fullPage: false });
}

async function main() {
  const env = { ...loadEnvFile(), ...process.env };
  const email = env.AUTH_ADMIN_EMAIL ?? 'admin@marvelx.pk';
  const password = env.AUTH_PASSWORD_ADMIN ?? env.VITE_DEMO_PASSWORD_ADMIN ?? '';
  if (!password) {
    throw new Error('Set AUTH_PASSWORD_ADMIN or VITE_DEMO_PASSWORD_ADMIN in .env.local');
  }

  const browser = await chromium.launch();
  const page = await browser.newPage();

  await login(page, email, password);

  await screenshot(page, 'dashboard-desktop', 1280);
  await page.goto(`${BASE}/inventory`);
  await page.waitForLoadState('networkidle');
  await screenshot(page, 'inventory-desktop', 1280);

  await page.goto(`${BASE}/sales/new`);
  await page.waitForLoadState('networkidle');
  await screenshot(page, 'sales-flow-desktop', 1280);

  await page.goto(`${BASE}/ppf`);
  await page.waitForLoadState('networkidle');
  await screenshot(page, 'ppf-board-desktop', 1280);

  await screenshot(page, 'dashboard-mobile', 390);
  await page.goto(`${BASE}/inventory`);
  await page.waitForLoadState('networkidle');
  await screenshot(page, 'inventory-mobile', 390);

  await page.goto(`${BASE}/ppf`);
  await page.waitForLoadState('networkidle');
  await screenshot(page, 'ppf-board-mobile', 390);

  await browser.close();
  console.log('Screenshots saved to screenshots/');
}

main().catch(console.error);
