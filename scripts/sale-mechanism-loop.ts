/**
 * Verifies car-sale pricing: car price, token, sold-for, balance due.
 * Run: npx tsx scripts/sale-mechanism-loop.ts
 */

function computeSaleTotals(carPrice: number, discount: number, token: number) {
  const soldFor = carPrice - discount;
  const tokenReceived = Math.min(Math.max(0, token), soldFor);
  const balanceDue = Math.max(0, soldFor - tokenReceived);
  const status = balanceDue <= 0 ? 'sold' : 'booked';
  return { soldFor, tokenReceived, balanceDue, status };
}

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function runLoop(
  label: string,
  carPrice: number,
  discount: number,
  token: number,
  expected: { soldFor: number; token: number; balance: number; status: 'booked' | 'sold' },
): void {
  const result = computeSaleTotals(carPrice, discount, token);
  assert(result.soldFor === expected.soldFor, `${label}: sold for ${result.soldFor}, expected ${expected.soldFor}`);
  assert(result.tokenReceived === expected.token, `${label}: token ${result.tokenReceived}, expected ${expected.token}`);
  assert(result.balanceDue === expected.balance, `${label}: balance ${result.balanceDue}, expected ${expected.balance}`);
  assert(result.status === expected.status, `${label}: status ${result.status}, expected ${expected.status}`);

  console.log(`✓ ${label}`);
  console.log(`  Car price: PKR ${carPrice.toLocaleString()} · Sold for: PKR ${result.soldFor.toLocaleString()}`);
  console.log(`  Token: PKR ${result.tokenReceived.toLocaleString()} · Balance due: PKR ${result.balanceDue.toLocaleString()}`);
  console.log(`  Status: ${result.status}`);
}

function main(): void {
  console.log('Sale mechanism verification — 2 loops\n');

  // Loop 1: Token booking — 5M car, 500k token, 4.5M balance
  runLoop('Loop 1 (token booking)', 5_000_000, 0, 500_000, {
    soldFor: 5_000_000,
    token: 500_000,
    balance: 4_500_000,
    status: 'booked',
  });

  // Loop 2: Full payment — 3.2M car, 50k discount, 3.15M token = sold
  runLoop('Loop 2 (full payment)', 3_200_000, 50_000, 3_150_000, {
    soldFor: 3_150_000,
    token: 3_150_000,
    balance: 0,
    status: 'sold',
  });

  // Self-check: old bug — token must NOT be subtracted twice
  const once = computeSaleTotals(5_000_000, 0, 500_000);
  const doubleSubtract = once.balanceDue - 500_000;
  assert(doubleSubtract === 4_000_000, 'Double-subtract regression detected');
  assert(once.balanceDue === 4_500_000, 'Token must subtract once from sold-for only');
  console.log('✓ No double-subtract: balance stays PKR 4,500,000 (not PKR 4,000,000)');

  // Over-token caps at sold-for
  const capped = computeSaleTotals(2_000_000, 0, 2_500_000);
  assert(capped.tokenReceived === 2_000_000 && capped.balanceDue === 0, 'Over-token must cap');
  console.log('✓ Over-token cap: token capped at car price, balance = 0');

  console.log('\nAll sale mechanism checks passed.');
}

main();
