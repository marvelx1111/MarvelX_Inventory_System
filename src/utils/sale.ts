import type { Sale } from '@/types';
import { roundPKR } from './format';

export interface SaleFinancials {
  sellingPrice: number;
  paymentReceived: number;
  /** Amount the customer still owes on the agreed selling price */
  customerOwed: number;
  /** Shortfall vs total cost (incl. expenses) when sold below cost */
  breakEvenRemaining: number;
  /** Shown in UI: break-even gap on loss sales, otherwise customer owed */
  remainingBalance: number;
  /** Selling price minus total cost (incl. expenses) */
  profit: number;
  isFullyPaid: boolean;
  isLossSale: boolean;
}

/** Canonical sale math — always use this for display and balance updates. */
export function computeSaleFinancials(
  sale: Pick<Sale, 'sale_price' | 'discount' | 'advance'> & { balance?: number },
  totalCost = 0,
): SaleFinancials {
  const salePrice = roundPKR(sale.sale_price);
  const discount = roundPKR(sale.discount);
  const advance = roundPKR(sale.advance);
  const sellingPrice = Math.max(0, salePrice - discount);
  let paymentReceived = Math.min(Math.max(0, advance), sellingPrice);
  let customerOwed = Math.max(0, sellingPrice - paymentReceived);

  // Legacy rows: balance was decremented without syncing advance (advance still 0)
  const storedBalance = roundPKR(sale.balance ?? 0);
  if (advance === 0 && storedBalance > 0 && storedBalance < sellingPrice) {
    customerOwed = storedBalance;
    paymentReceived = sellingPrice - storedBalance;
  }

  const cost = roundPKR(totalCost);
  const isLossSale = sellingPrice > 0 && sellingPrice < cost;
  const breakEvenRemaining = isLossSale ? Math.max(0, cost - paymentReceived) : 0;
  const remainingBalance = isLossSale ? breakEvenRemaining : customerOwed;
  const profit = sellingPrice - cost;
  const isFullyPaid = sellingPrice > 0 && paymentReceived >= sellingPrice;

  return {
    sellingPrice,
    paymentReceived,
    customerOwed,
    breakEvenRemaining,
    remainingBalance,
    profit,
    isFullyPaid,
    isLossSale,
  };
}

export function normalizeSaleRecord(sale: Sale, totalCost = 0): Sale {
  const { paymentReceived, customerOwed, profit } = computeSaleFinancials(sale, totalCost);
  return {
    ...sale,
    sale_price: roundPKR(sale.sale_price),
    discount: roundPKR(sale.discount),
    advance: paymentReceived,
    balance: customerOwed,
    profit,
  };
}

export function normalizeSaleInput(
  input: Pick<Sale, 'sale_price' | 'discount' | 'advance'>,
): Pick<Sale, 'sale_price' | 'discount' | 'advance'> {
  return {
    sale_price: roundPKR(input.sale_price),
    discount: roundPKR(input.discount),
    advance: roundPKR(input.advance),
  };
}
