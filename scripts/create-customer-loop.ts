/**
 * Validates Add Customer modal includes WhatsApp + Address fields.
 * Run: npx tsx scripts/create-customer-loop.ts [baseUrl]
 */
import { chromium } from 'playwright';
import { requireAdminTestCredentials } from './auth-env.ts';

const BASE = process.argv[2] ?? 'http://localhost:5173';

type Result = { label: string; ok: boolean; detail: string };

async function login(page: import('playwright').Page) {
  const { adminEmail, adminPassword } = requireAdminTestCredentials();
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.getByLabel(/email|username/i).fill(adminEmail);
  await page.getByLabel(/password/i).fill(adminPassword);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL(`${BASE}/`, { timeout: 15000 });
}

async function fieldVisible(page: import('playwright').Page, label: string) {
  const dialog = page.getByRole('dialog');
  return (await dialog.getByLabel(new RegExp(`^${label}$`, 'i')).count()) > 0;
}

async function testCustomersPageModal(page: import('playwright').Page, results: Result[]) {
  await page.goto(`${BASE}/customers`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  const addBtn = page.getByRole('button', { name: /\+?\s*Add customer/i });
  const addCount = await addBtn.count();
  results.push({
    label: 'Customers page has Add customer button',
    ok: addCount > 0,
    detail: addCount > 0 ? 'Button found' : 'No Add customer button',
  });
  if (addCount === 0) return;

  await addBtn.first().click();
  await page.waitForTimeout(500);

  const dialog = page.getByRole('dialog');
  const dialogOpen = (await dialog.count()) > 0;
  results.push({
    label: 'Add customer modal opens',
    ok: dialogOpen,
    detail: dialogOpen ? 'Modal open' : 'Modal missing',
  });
  if (!dialogOpen) return;

  for (const field of ['Full name', 'Customer type', 'CNIC', 'Mobile', 'WhatsApp & address', 'WhatsApp', 'Email', 'Address', 'City', 'Remarks']) {
    const dialog = page.getByRole('dialog');
    const visible =
      field === 'WhatsApp & address'
        ? (await dialog.getByText(/WhatsApp & address/i).count()) > 0
        : await fieldVisible(page, field);
    results.push({
      label: `Add modal shows ${field}`,
      ok: visible,
      detail: visible ? 'visible' : 'NOT FOUND',
    });
  }

  // Dealer type + save with whatsapp/address
  await dialog.getByLabel(/^Customer type$/i).selectOption('dealer');
  await dialog.getByLabel(/^Full name$/i).fill(`Dealer Loop ${Date.now().toString().slice(-5)}`);
  await dialog.getByLabel(/^Mobile$/i).fill('0300-1111111');
  await dialog.getByLabel(/^WhatsApp$/i).fill('0300-2222222');
  await dialog.getByLabel(/^Address$/i).fill('123 Test Street, Lahore');
  await dialog.getByLabel(/^City$/i).fill('Lahore');
  await dialog.getByRole('button', { name: /^Add customer$/i }).click();
  await page.waitForTimeout(2500);

  const body = await page.locator('body').innerText();
  const saved = /customer added|saved successfully/i.test(body);
  const hasAddress = body.includes('123 Test Street');
  results.push({
    label: 'Dealer create saves with WhatsApp/Address',
    ok: saved,
    detail: saved ? 'Create succeeded' : 'Create may have failed',
  });
  results.push({
    label: 'Created dealer detail shows address',
    ok: hasAddress,
    detail: hasAddress ? 'Address on page' : 'Address not visible after create',
  });
}

async function testSalesInlineForm(page: import('playwright').Page, results: Result[]) {
  await page.goto(`${BASE}/sales/new`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  const vehicle = page.locator('button.rounded-lg.border.p-3').first();
  if ((await vehicle.count()) > 0) await vehicle.click();

  await page.getByRole('button', { name: /^Continue$/i }).click();
  await page.waitForTimeout(600);

  const newBtn = page.getByRole('button', { name: /\+?\s*New customer/i });
  results.push({
    label: 'Sales flow has New customer toggle',
    ok: (await newBtn.count()) > 0,
    detail: (await newBtn.count()) > 0 ? 'Button found' : 'No button',
  });
  if ((await newBtn.count()) === 0) return;

  await newBtn.first().click();
  await page.waitForTimeout(400);

  const wa = (await page.getByLabel(/^WhatsApp$/i).count()) > 0;
  const addr = (await page.getByLabel(/^Address$/i).count()) > 0;
  const chooseExisting = (await page.getByRole('button', { name: /choose existing/i }).count()) > 0;

  results.push({
    label: 'Sales inline form shows Choose existing',
    ok: chooseExisting,
    detail: chooseExisting ? 'inline mode' : 'not inline',
  });
  results.push({
    label: 'Sales inline form shows WhatsApp',
    ok: wa,
    detail: wa ? 'visible in box' : 'NOT FOUND',
  });
  results.push({
    label: 'Sales inline form shows Address',
    ok: addr,
    detail: addr ? 'visible in box' : 'NOT FOUND',
  });
}

async function testPurchasesDealerModal(page: import('playwright').Page, results: Result[]) {
  await page.goto(`${BASE}/purchases`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  const addBtn = page.getByRole('button', { name: /\+?\s*Add seller\/dealer/i });
  const addCount = await addBtn.count();
  results.push({
    label: 'Purchases page has Add seller/dealer button',
    ok: addCount > 0,
    detail: addCount > 0 ? 'Button found' : 'No button',
  });
  if (addCount === 0) return;

  await addBtn.first().click();
  await page.waitForTimeout(500);

  const wa = await fieldVisible(page, 'WhatsApp');
  const addr = await fieldVisible(page, 'Address');
  const heading = (await page.getByRole('dialog').getByText(/WhatsApp & address/i).count()) > 0;
  results.push({
    label: 'Purchases modal shows WhatsApp & address heading',
    ok: heading,
    detail: heading ? 'visible' : 'NOT FOUND',
  });
  results.push({
    label: 'Purchases add-dealer modal shows WhatsApp',
    ok: wa,
    detail: wa ? 'visible' : 'NOT FOUND',
  });
  results.push({
    label: 'Purchases add-dealer modal shows Address',
    ok: addr,
    detail: addr ? 'visible' : 'NOT FOUND',
  });
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const results: Result[] = [];

  try {
    await login(page);
    await testCustomersPageModal(page, results);
    await testSalesInlineForm(page, results);
    await testPurchasesDealerModal(page, results);
  } catch (err) {
    results.push({
      label: 'Runtime',
      ok: false,
      detail: err instanceof Error ? err.message : String(err),
    });
  } finally {
    await browser.close();
  }

  console.log(`=== CREATE CUSTOMER LOOP (${BASE}) ===\n`);
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
