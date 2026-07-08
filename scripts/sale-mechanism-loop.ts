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
    customerOwed: number;
    remainingBalance: number;
    profit: number;
    fullyPaid: boolean;
    isLossSale: boolean;
  },
): void {
  const result = computeSaleFinancials(sale, totalCost);
  assert(result.sellingPrice === expected.sellingPrice, `${label}: selling price mismatch`);
  assert(result.paymentReceived === expected.payment, `${label}: payment mismatch`);
  assert(result.customerOwed === expected.customerOwed, `${label}: customer owed mismatch`);
  assert(result.remainingBalance === expected.remainingBalance, `${label}: remaining mismatch`);
  assert(result.profit === expected.profit, `${label}: profit mismatch`);
  assert(result.isFullyPaid === expected.fullyPaid, `${label}: fully paid flag mismatch`);
  assert(result.isLossSale === expected.isLossSale, `${label}: loss sale flag mismatch`);

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
      customerOwed: 4_500_000,
      remainingBalance: 4_500_000,
      profit: 800_000,
      fullyPaid: false,
      isLossSale: false,
    },
  );

  runLoop(
    'Profitable full payment',
    { sale_price: 4_000_000, discount: 0, advance: 4_000_000, balance: 0 },
    3_985_000,
    {
      sellingPrice: 4_000_000,
      payment: 4_000_000,
      customerOwed: 0,
      remainingBalance: 0,
      profit: 15_000,
      fullyPaid: true,
      isLossSale: false,
    },
  );

  runLoop(
    'Loss sale fully paid — break-even remaining matches loss',
    { sale_price: 3_000_000, discount: 0, advance: 3_000_000, balance: 0 },
    4_920_000,
    {
      sellingPrice: 3_000_000,
      payment: 3_000_000,
      customerOwed: 0,
      remainingBalance: 1_920_000,
      profit: -1_920_000,
      fullyPaid: true,
      isLossSale: true,
    },
  );

  const lossSale = computeSaleFinancials(
    { sale_price: 3_000_000, discount: 0, advance: 3_000_000, balance: 0 },
    4_920_000,
  );
  assert(
    lossSale.remainingBalance + lossSale.profit === 0,
    'Loss sale: remaining to break even equals absolute profit',
  );
  console.log('✓ Loss sale: remaining to break even equals absolute profit');

  runLoop(
    'Loss sale partial payment',
    { sale_price: 3_000_000, discount: 0, advance: 1_000_000, balance: 2_000_000 },
    4_920_000,
    {
      sellingPrice: 3_000_000,
      payment: 1_000_000,
      customerOwed: 2_000_000,
      remainingBalance: 3_920_000,
      profit: -1_920_000,
      fullyPaid: false,
      isLossSale: true,
    },
  );

  const stale = computeSaleFinancials(
    { sale_price: 4_000_000, discount: 0, advance: 4_000_000, balance: 4_000_000 },
    3_985_000,
  );
  assert(stale.customerOwed === 0, 'Stale balance must reconcile customer owed to zero when fully paid');
  console.log('✓ Stale balance row reconciles customer owed to zero');

  const legacy = computeSaleFinancials(
    { sale_price: 4_000_000, discount: 0, advance: 0, balance: 0 },
    3_985_000,
  );
  assert(legacy.customerOwed === 0 && legacy.paymentReceived === 4_000_000, 'Legacy full-pay row');
  console.log('✓ Legacy balance-only payment reconciles to full payment received');

  console.log('\nAll sale mechanism checks passed.');
}

main();
