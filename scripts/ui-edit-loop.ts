/**
 * Comprehensive UI edit validation loop.
 * Run: npx tsx scripts/ui-edit-loop.ts [baseUrl]
 */
import { chromium, type Page } from 'playwright';
import { clearQaTestData } from './clear-qa-data.ts';
import { requireAdminTestCredentials } from './auth-env.ts';

const BASE = process.argv[2] ?? 'http://localhost:5173';

type Result = { label: string; ok: boolean; detail: string };

async function login(page: Page, email: string, password: string) {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.getByLabel(/email|username/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL(`${BASE}/`, { timeout: 15000 });
}

async function signOut(page: Page) {
  await page.evaluate(() => {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('sb-')) localStorage.removeItem(key);
    }
  });
}

async function countEditButtons(page: Page) {
  return page.getByRole('button', { name: /^Edit$/i }).count();
}

async function ensureTestCustomer(page: Page): Promise<string | null> {
  await page.goto(`${BASE}/customers`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  const existingLink = page.locator('a[href^="/customers/"]').first();
  if ((await existingLink.count()) > 0) {
    return existingLink.getAttribute('href').then((h) => h?.replace('/customers/', '') ?? null);
  }

  const addBtn = page.getByRole('button', { name: /\+?\s*Add customer/i });
  if ((await addBtn.count()) === 0) return null;

  await addBtn.first().click();
  await page.waitForTimeout(400);
  const dialog = page.getByRole('dialog');
  const name = `QA Loop ${Date.now().toString().slice(-6)}`;
  await dialog.getByLabel(/^Full name$/i).fill(name);
  await dialog.getByLabel(/^Mobile$/i).fill('0300-9998888');
  await dialog.getByRole('button', { name: /^Add customer$/i }).click();

  try {
    await page.waitForURL(/\/customers\/[^/?#]+/, { timeout: 15000 });
  } catch {
    return null;
  }

  const match = page.url().match(/\/customers\/([^/?#]+)/);
  return match?.[1] ?? null;
}

async function main() {
  const { adminEmail, adminPassword, salesEmail, salesPassword } = requireAdminTestCredentials();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const results: Result[] = [];

  try {
    await login(page, adminEmail, adminPassword);

    const demoBanner = await page.getByText(/Demo mode|Database connection failed/i).count();
    results.push({
      label: 'Supabase connected (no demo banner)',
      ok: demoBanner === 0,
      detail: demoBanner ? 'Demo/error banner visible' : 'Connected',
    });

    const customerId = await ensureTestCustomer(page);
    results.push({
      label: 'Test customer available',
      ok: customerId !== null,
      detail: customerId ? `Using ${customerId}` : 'Could not create or find customer',
    });

    if (customerId) {
      await page.goto(`${BASE}/customers`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(800);
      const listEditCount = await countEditButtons(page);
      results.push({
        label: 'Customers list has no Edit (detail-only)',
        ok: listEditCount === 0,
        detail: `Edit buttons on list: ${listEditCount}`,
      });

      await page.goto(`${BASE}/customers/${customerId}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(800);

      const navEditCount = await countEditButtons(page);
      results.push({
        label: 'Edit visible on customer detail',
        ok: navEditCount > 0,
        detail: navEditCount > 0 ? `Edit on /customers/${customerId}` : 'No Edit button',
      });

      if (navEditCount > 0) {
        const testMobile = `0399-LOOP-${Date.now().toString().slice(-6)}`;
        await page.getByRole('button', { name: /^Edit$/i }).first().click();
        await page.waitForTimeout(400);
        await page.getByLabel(/^Mobile$/i).fill(testMobile);
        await page.getByRole('button', { name: /save changes/i }).click();
        await page.waitForTimeout(2000);

        await page.reload({ waitUntil: 'networkidle' });
        await page.waitForTimeout(1500);
        const afterRefresh = await page.locator('body').innerText();
        const persisted = afterRefresh.includes(testMobile);
        results.push({
          label: 'Customer edit persists after page refresh',
          ok: persisted,
          detail: persisted ? `Still shows ${testMobile}` : `Lost ${testMobile} after refresh`,
        });
      }
    }

    await signOut(page);
    await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
    if (!salesPassword) throw new Error('Set AUTH_PASSWORD_SALES in .env.local');
    await login(page, salesEmail, salesPassword);

    if (customerId) {
      await page.goto(`${BASE}/customers/${customerId}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(800);
      const salesEditCount = await countEditButtons(page);
      results.push({
        label: 'Salesperson cannot see Edit',
        ok: salesEditCount === 0,
        detail: `Edit buttons: ${salesEditCount}`,
      });
    }

    await page.setViewportSize({ width: 390, height: 844 });
    await signOut(page);
    await login(page, adminEmail, adminPassword);

    if (customerId) {
      await page.goto(`${BASE}/customers/${customerId}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(800);
      const mobileEditCount = await countEditButtons(page);
      results.push({
        label: 'Admin sees Edit on mobile viewport',
        ok: mobileEditCount > 0,
        detail: `Edit buttons: ${mobileEditCount}`,
      });
    }

    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(`${BASE}/inventory`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    const vehicleLink = page.locator('a[href^="/inventory/"]').first();
    if ((await vehicleLink.count()) > 0) {
      await vehicleLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(800);
      const vehicleEditCount = await countEditButtons(page);
      results.push({
        label: 'Edit visible on vehicle detail (when inventory exists)',
        ok: vehicleEditCount > 0,
        detail: `Edit buttons: ${vehicleEditCount}`,
      });
    } else {
      results.push({
        label: 'Edit visible on vehicle detail (when inventory exists)',
        ok: true,
        detail: 'Skipped — no vehicles in inventory',
      });
    }

    // Admin route smoke tests
    await signOut(page);
    await login(page, adminEmail, adminPassword);
    for (const path of ['/', '/finance', '/expenses', '/ppf/expenses', '/audit']) {
      await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle', timeout: 20000 });
      await page.waitForTimeout(600);
      const url = page.url();
      const onLogin = url.includes('/login');
      results.push({
        label: `Admin can access ${path}`,
        ok: !onLogin,
        detail: onLogin ? 'Redirected to login' : 'OK',
      });
    }
  } catch (err) {
    results.push({
      label: 'UI loop runtime',
      ok: false,
      detail: err instanceof Error ? err.message : String(err),
    });
  } finally {
    await browser.close();
    try {
      const removed = await clearQaTestData();
      if (removed > 0) {
        console.log(`\nCleaned up ${removed} QA test customer(s) from database.`);
      }
    } catch (cleanupErr) {
      console.warn(
        'QA cleanup skipped:',
        cleanupErr instanceof Error ? cleanupErr.message : String(cleanupErr),
      );
    }
  }

  console.log(`=== UI EDIT LOOP (${BASE}) ===\n`);
  let passed = 0;
  let failed = 0;
  for (const r of results) {
    console.log(`${r.ok ? '✓' : '✗'} ${r.label}: ${r.detail}`);
    if (r.ok) passed++;
    else failed++;
  }
  console.log(`\nPassed: ${passed}, Failed: ${failed}`);
  if (failed > 0) process.exit(1);
}

main();
