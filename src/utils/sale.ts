import type { Sale } from '@/types';

export interface SaleFinancials {
  sellingPrice: number;
  paymentReceived: number;
  remainingBalance: number;
  profit: number;
  isFullyPaid: boolean;
}

/** Canonical sale math — always use this for display and balance updates. */
export function computeSaleFinancials(
  sale: Pick<Sale, 'sale_price' | 'discount' | 'advance'> & { balance?: number },
  totalCost = 0,
): SaleFinancials {
  const sellingPrice = Math.max(0, sale.sale_price - sale.discount);
  let paymentReceived = Math.min(Math.max(0, sale.advance), sellingPrice);
  let remainingBalance = Math.max(0, sellingPrice - paymentReceived);

  // Legacy rows: payments were decremented on balance without syncing advance
  const storedBalance = Math.max(0, sale.balance ?? 0);
  if (storedBalance < remainingBalance) {
    remainingBalance = storedBalance;
    paymentReceived = Math.min(sellingPrice, sellingPrice - remainingBalance);
  }

  const profit = sellingPrice - totalCost;
  const isFullyPaid = sellingPrice > 0 && paymentReceived >= sellingPrice;

  return {
    sellingPrice,
    paymentReceived,
    remainingBalance,
    profit,
    isFullyPaid,
  };
}

export function normalizeSaleRecord(sale: Sale, totalCost = 0): Sale {
  const { sellingPrice, paymentReceived, remainingBalance, profit } = computeSaleFinancials(
    sale,
    totalCost,
  );
  return {
    ...sale,
    advance: paymentReceived,
    balance: remainingBalance,
    profit,
    sale_price: sellingPrice + sale.discount,
  };
}
