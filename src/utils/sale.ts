import type { Sale } from '@/types';

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
  const sellingPrice = Math.max(0, sale.sale_price - sale.discount);
  let paymentReceived = Math.min(Math.max(0, sale.advance), sellingPrice);
  let customerOwed = Math.max(0, sellingPrice - paymentReceived);

  // Legacy rows: payments were decremented on balance without syncing advance
  const storedBalance = Math.max(0, sale.balance ?? 0);
  if (storedBalance < customerOwed) {
    customerOwed = storedBalance;
    paymentReceived = Math.min(sellingPrice, sellingPrice - customerOwed);
  }

  const isLossSale = sellingPrice > 0 && sellingPrice < totalCost;
  const breakEvenRemaining = isLossSale ? Math.max(0, totalCost - paymentReceived) : 0;
  const remainingBalance = isLossSale ? breakEvenRemaining : customerOwed;
  const profit = sellingPrice - totalCost;
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
    advance: paymentReceived,
    balance: customerOwed,
    profit,
  };
}
