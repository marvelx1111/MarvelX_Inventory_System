/**
 * Comprehensive UI edit validation loop.
 * Run: npx tsx scripts/ui-edit-loop.ts [baseUrl]
 */
import { chromium, type Page } from 'playwright';

const BASE = process.argv[2] ?? 'http://localhost:5173';

type Result = { label: string; ok: boolean; detail: string };

async function login(page: Page, username: string, password: string) {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.getByLabel(/username/i).fill(username);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL(`${BASE}/`, { timeout: 15000 });
}

async function countEditButtons(page: Page) {
  return page.getByRole('button', { name: /^Edit$/i }).count();
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const results: Result[] = [];

  try {
    // --- Admin via customer list navigation ---
    await login(page, 'admin', 'admin123');

    const demoBanner = await page.getByText(/Demo mode|Database connection failed/i).count();
    results.push({
      label: 'Supabase connected (no demo banner)',
      ok: demoBanner === 0,
      detail: demoBanner ? 'Demo/error banner visible' : 'Connected',
    });

    await page.goto(`${BASE}/customers`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    const listEditCount = await countEditButtons(page);
    results.push({
      label: 'Customers list has no Edit (detail-only)',
      ok: listEditCount === 0,
      detail: `Edit buttons on list: ${listEditCount}`,
    });

    const firstCustomerLink = page.locator('a[href^="/customers/"]').first();
    const href = await firstCustomerLink.getAttribute('href');
    await firstCustomerLink.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(800);

    const navEditCount = await countEditButtons(page);
    results.push({
      label: 'Edit visible after list → customer navigation',
      ok: navEditCount > 0,
      detail: navEditCount > 0 ? `Edit on ${href}` : `No Edit on ${href}`,
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

    // --- Sales account should not edit ---
    await page.evaluate(() => localStorage.removeItem('marvel-x-session'));
    await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
    await page.getByLabel(/username/i).fill('sales');
    await page.getByLabel(/password/i).fill('sales123');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL(`${BASE}/`, { timeout: 15000 });
    await page.goto(`${BASE}/customers/cus_001`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    const salesEditCount = await countEditButtons(page);
    results.push({
      label: 'Salesperson cannot see Edit',
      ok: salesEditCount === 0,
      detail: `Edit buttons: ${salesEditCount}`,
    });

    // --- Mobile admin ---
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => localStorage.removeItem('marvel-x-session'));
    await login(page, 'admin', 'admin123');
    await page.goto(`${BASE}/customers/cus_001`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    const mobileEditCount = await countEditButtons(page);
    results.push({
      label: 'Admin sees Edit on mobile viewport',
      ok: mobileEditCount > 0,
      detail: `Edit buttons: ${mobileEditCount}`,
    });

    // --- Vehicle detail edit ---
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(`${BASE}/inventory/veh_001`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    const vehicleEditCount = await countEditButtons(page);
    results.push({
      label: 'Edit visible on vehicle detail',
      ok: vehicleEditCount > 0,
      detail: `Edit buttons: ${vehicleEditCount}`,
    });
  } catch (err) {
    results.push({
      label: 'UI loop runtime',
      ok: false,
      detail: err instanceof Error ? err.message : String(err),
    });
  } finally {
    await browser.close();
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
