import { chromium } from 'playwright';

const BASE = 'http://localhost:5173';

async function login(page, username, password) {
  await page.goto(`${BASE}/login`);
  await page.waitForLoadState('networkidle');
  await page.getByLabel(/username/i).fill(username);
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
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await login(page, 'admin', 'admin123');

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
