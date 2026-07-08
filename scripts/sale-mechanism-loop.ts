/**
 * Verifies sale pricing: selling price, payment received, remaining balance, profit.
 * Run: npx tsx scripts/sale-mechanism-loop.ts
 */

import { computeSaleFinancials } from '../src/utils/sale';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function runLoop(
  label: string,
  sale: { sale_price: number; discount: number; advance: number; balance?: number },
  totalCost: number,
  expected: {
    sellingPrice: number;
    payment: number;
    balance: number;
    profit: number;
    fullyPaid: boolean;
  },
): void {
  const result = computeSaleFinancials(sale, totalCost);
  assert(result.sellingPrice === expected.sellingPrice, `${label}: selling price mismatch`);
  assert(result.paymentReceived === expected.payment, `${label}: payment mismatch`);
  assert(result.remainingBalance === expected.balance, `${label}: balance mismatch`);
  assert(result.profit === expected.profit, `${label}: profit mismatch`);
  assert(result.isFullyPaid === expected.fullyPaid, `${label}: fully paid flag mismatch`);

  console.log(`✓ ${label}`);
  console.log(`  Selling: PKR ${result.sellingPrice.toLocaleString()} · Payment: PKR ${result.paymentReceived.toLocaleString()}`);
  console.log(`  Remaining: PKR ${result.remainingBalance.toLocaleString()} · Profit: PKR ${result.profit.toLocaleString()}`);
}

function main(): void {
  console.log('Sale mechanism verification\n');

  runLoop(
    'Partial payment booking',
    { sale_price: 5_000_000, discount: 0, advance: 500_000, balance: 4_500_000 },
    4_200_000,
    {
      sellingPrice: 5_000_000,
      payment: 500_000,
      balance: 4_500_000,
      profit: 800_000,
      fullyPaid: false,
    },
  );

  runLoop(
    'Full payment',
    { sale_price: 4_000_000, discount: 0, advance: 4_000_000, balance: 0 },
    3_985_000,
    {
      sellingPrice: 4_000_000,
      payment: 4_000_000,
      balance: 0,
      profit: 15_000,
      fullyPaid: true,
    },
  );

  // Stale DB: advance recorded but balance not zeroed
  const stale = computeSaleFinancials(
    { sale_price: 4_000_000, discount: 0, advance: 4_000_000, balance: 4_000_000 },
    3_985_000,
  );
  assert(stale.remainingBalance === 0, 'Stale balance must reconcile to zero when fully paid');
  assert(stale.paymentReceived === 4_000_000, 'Payment received must match advance');
  console.log('✓ Stale balance row reconciles to zero remaining');

  // Legacy: payments decremented balance only (advance still 0)
  const legacy = computeSaleFinancials(
    { sale_price: 4_000_000, discount: 0, advance: 0, balance: 0 },
    3_985_000,
  );
  assert(legacy.remainingBalance === 0 && legacy.paymentReceived === 4_000_000, 'Legacy full-pay row');
  console.log('✓ Legacy balance-only payment reconciles to full payment received');

  const capped = computeSaleFinancials(
    { sale_price: 2_000_000, discount: 0, advance: 2_500_000, balance: 0 },
    1_800_000,
  );
  assert(capped.paymentReceived === 2_000_000 && capped.remainingBalance === 0, 'Over-payment must cap');
  console.log('✓ Over-payment capped at selling price');

  const loss = computeSaleFinancials(
    { sale_price: 1_500_000, discount: 0, advance: 1_500_000, balance: 0 },
    1_985_000,
  );
  assert(loss.profit === -485_000, 'Loss sale shows negative profit');
  console.log('✓ Below-cost sale shows negative profit');

  console.log('\nAll sale mechanism checks passed.');
}

main();
