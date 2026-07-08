/**
 * Verifies sale prices stay exact (no -2/-3 drift).
 * Run: npx tsx scripts/sale-price-roundtrip.ts
 */

import { computeSaleFinancials } from '../src/utils/sale';
import { parseMoneyInput, roundPKR } from '../src/utils/format';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function main(): void {
  const amounts = [3_000_000, 4_999_998, 5_000_000, 2_850_000];
  for (const amount of amounts) {
    const financials = computeSaleFinancials(
      { sale_price: amount, discount: 0, advance: amount, balance: 0 },
      1_985_000,
    );
    assert(financials.sellingPrice === amount, `compute drift at ${amount}: ${financials.sellingPrice}`);
    assert(parseMoneyInput(String(amount)) === amount, `parse drift at ${amount}`);
    console.log(`✓ ${amount.toLocaleString()} PKR — math and parse exact`);
  }

  assert(roundPKR(2999999.999999999) === 3000000, 'roundPKR must snap float artifacts');
  assert(parseMoneyInput('3,000,000') === 3000000, 'parseMoneyInput must handle commas');

  const capped = computeSaleFinancials(
    { sale_price: 3_000_000, discount: 0, advance: 3_000_000, balance: 0 },
    1_985_000,
  );
  assert(capped.sellingPrice === 3_000_000 && capped.paymentReceived === 3_000_000, 'full pay exact');

  console.log('\nAll sale price roundtrip checks passed.');
}

main();
