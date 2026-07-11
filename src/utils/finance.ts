import type {
  AppData,
  ExpenseCategory,
  FinanceSettings,
  PPFSale,
  Sale,
  ShowroomExpense,
  VehicleExpense,
} from '@/types';
import { roundPKR } from '@/utils/format';
import {
  PPF_RENT_SALARY_CATEGORY_IDS,
  SHOWROOM_RENT_SALARY_CATEGORY_IDS,
} from '@/utils/expense-categories';

export interface FinanceTrendPoint {
  month: string;
  year: number;
  revenue: number;
  expenses: number;
  profit: number;
}

export interface FinanceExpenseBreakdown {
  name: string;
  total: number;
  count: number;
}

export interface FinanceAuditRow {
  id: string;
  date: string;
  label: string;
  category: 'revenue' | 'profit' | 'loss' | 'expense' | 'receivable' | 'capital';
  amount: number;
  detail: string;
}

export interface FinanceSummary {
  capital: number;
  cashInHand: number;
  totalRevenue: number;
  vehicleSalesRevenue: number;
  ppfRevenue: number;
  totalExpenses: number;
  vehiclePrepExpenses: number;
  showroomExpenses: number;
  showroomOverhead: number;
  ppfOverhead: number;
  purchaseSpend: number;
  vehicleSalesProfit: number;
  vehicleSalesLoss: number;
  vehicleProfitCount: number;
  vehicleLossCount: number;
  ppfProfit: number;
  ppfReceivables: number;
  vehicleReceivables: number;
  totalReceivables: number;
  inventoryAtCost: number;
  totalCapitalInvested: number;
  investorReturnsPaid: number;
  netProfit: number;
  monthlyTrend: FinanceTrendPoint[];
  expenseBreakdown: FinanceExpenseBreakdown[];
  auditRows: FinanceAuditRow[];
}

const DEFAULT_SETTINGS: FinanceSettings = {
  setting_id: 'fin_001',
  capital: 0,
  cash_in_hand: 0,
  notes: '',
  updated_at: new Date().toISOString(),
  updated_by: null,
};

function sumAmount<T extends { amount: number }>(items: T[]): number {
  return roundPKR(items.reduce((sum, item) => sum + item.amount, 0));
}

function sellingPrice(sale: Sale): number {
  return roundPKR(sale.sale_price - sale.discount);
}

function ppfPaymentsForSale(data: AppData, ppfSaleId: string): number {
  return roundPKR(
    data.ppfPayments
      .filter((payment) => payment.ppf_sale_id === ppfSaleId)
      .reduce((sum, payment) => sum + payment.amount, 0),
  );
}

function groupExpenses(
  expenses: ShowroomExpense[] | VehicleExpense[],
  categories: ExpenseCategory[],
): FinanceExpenseBreakdown[] {
  const map = new Map<string, FinanceExpenseBreakdown>();

  for (const expense of expenses) {
    const category = categories.find((item) => item.category_id === expense.category_id);
    const name = category?.category_name ?? 'Uncategorized';
    const existing = map.get(expense.category_id) ?? { name, total: 0, count: 0 };
    existing.total = roundPKR(existing.total + expense.amount);
    existing.count += 1;
    map.set(expense.category_id, existing);
  }

  return [...map.values()].sort((a, b) => b.total - a.total);
}

function buildMonthlyTrend(data: AppData, months: number): FinanceTrendPoint[] {
  const points: FinanceTrendPoint[] = [];
  const now = new Date();

  for (let offset = months - 1; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const month = date.getMonth();
    const year = date.getFullYear();
    const label = date.toLocaleString('en-PK', { month: 'short' });

    const vehicleSales = data.sales.filter((sale) => {
      const saleDate = new Date(sale.sale_date);
      return saleDate.getMonth() === month && saleDate.getFullYear() === year;
    });
    const vehicleRevenue = roundPKR(vehicleSales.reduce((sum, sale) => sum + sellingPrice(sale), 0));
    const vehicleProfit = roundPKR(vehicleSales.reduce((sum, sale) => sum + sale.profit, 0));

    const ppfRevenue = roundPKR(
      data.ppfSales
        .filter((sale) => {
          const saleDate = new Date(sale.sale_date);
          return saleDate.getMonth() === month && saleDate.getFullYear() === year;
        })
        .reduce((sum, sale) => sum + sale.final_price, 0),
    );

    const showroomExpenses = roundPKR(
      data.showroomExpenses
        .filter((expense) => {
          const expenseDate = new Date(expense.expense_date);
          return expenseDate.getMonth() === month && expenseDate.getFullYear() === year;
        })
        .reduce((sum, expense) => sum + expense.amount, 0),
    );

    const vehiclePrepExpenses = roundPKR(
      data.vehicleExpenses
        .filter((expense) => {
          const expenseDate = new Date(expense.expense_date);
          return expenseDate.getMonth() === month && expenseDate.getFullYear() === year;
        })
        .reduce((sum, expense) => sum + expense.amount, 0),
    );

    const ppfProfit = roundPKR(
      data.ppfSales
        .filter((sale) => {
          const saleDate = new Date(sale.sale_date);
          return saleDate.getMonth() === month && saleDate.getFullYear() === year;
        })
        .reduce((sum, sale) => sum + (sale.final_price - sale.total_cost), 0),
    );

    const expenses = roundPKR(showroomExpenses + vehiclePrepExpenses);
    const revenue = roundPKR(vehicleRevenue + ppfRevenue);
    const profit = roundPKR(vehicleProfit + ppfProfit - showroomExpenses);

    points.push({ month: label, year, revenue, expenses, profit });
  }

  return points;
}

function buildAuditRows(data: AppData, categories: ExpenseCategory[]): FinanceAuditRow[] {
  const rows: FinanceAuditRow[] = [];

  for (const sale of data.sales) {
    const vehicle = data.vehicles.find((item) => item.vehicle_id === sale.vehicle_id);
    const label = vehicle
      ? `${vehicle.stock_number} — ${vehicle.make} ${vehicle.model}`
      : `Sale ${sale.sale_id}`;
    const amount = sale.profit;
    rows.push({
      id: sale.sale_id,
      date: sale.sale_date,
      label,
      category: amount >= 0 ? 'profit' : 'loss',
      amount,
      detail: amount >= 0 ? 'Vehicle sale profit' : 'Vehicle sale loss',
    });

    if (sale.balance > 0) {
      rows.push({
        id: `${sale.sale_id}-recv`,
        date: sale.sale_date,
        label,
        category: 'receivable',
        amount: sale.balance,
        detail: 'Outstanding vehicle sale balance',
      });
    }
  }

  for (const sale of data.ppfSales) {
    const job = data.ppfJobCards.find((item) => item.job_id === sale.job_id);
    const profit = roundPKR(sale.final_price - sale.total_cost);
    rows.push({
      id: sale.ppf_sale_id,
      date: sale.sale_date,
      label: sale.invoice_number,
      category: profit >= 0 ? 'profit' : 'loss',
      amount: profit,
      detail: job ? `PPF job ${job.job_id}` : 'PPF studio sale',
    });

    const paid = ppfPaymentsForSale(data, sale.ppf_sale_id);
    const balance = roundPKR(sale.final_price - paid);
    if (balance > 0) {
      rows.push({
        id: `${sale.ppf_sale_id}-recv`,
        date: sale.sale_date,
        label: sale.invoice_number,
        category: 'receivable',
        amount: balance,
        detail: 'Outstanding PPF invoice balance',
      });
    }
  }

  for (const expense of data.showroomExpenses) {
    const category = categories.find((item) => item.category_id === expense.category_id);
    rows.push({
      id: expense.expense_id,
      date: expense.expense_date,
      label: category?.category_name ?? 'Showroom expense',
      category: 'expense',
      amount: -expense.amount,
      detail: expense.description,
    });
  }

  for (const expense of data.vehicleExpenses) {
    const vehicle = data.vehicles.find((item) => item.vehicle_id === expense.vehicle_id);
    const category = categories.find((item) => item.category_id === expense.category_id);
    rows.push({
      id: expense.expense_id,
      date: expense.expense_date,
      label: vehicle?.stock_number ?? 'Vehicle expense',
      category: 'expense',
      amount: -expense.amount,
      detail: `${category?.category_name ?? 'Expense'} — ${expense.description}`,
    });
  }

  for (const investment of data.investments) {
    const investor = data.investors.find((item) => item.investor_id === investment.investor_id);
    rows.push({
      id: investment.investment_id,
      date: investment.investment_date,
      label: investor?.full_name ?? 'Investor',
      category: 'capital',
      amount: investment.amount,
      detail: investment.notes || 'Capital investment',
    });
  }

  return rows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function resolveFinanceSettings(settings: FinanceSettings | null | undefined): FinanceSettings {
  return settings ?? DEFAULT_SETTINGS;
}

export function computeFinanceSummary(data: AppData): FinanceSummary {
  const settings = resolveFinanceSettings(data.financeSettings);
  const categories = data.expenseCategories;

  const vehicleSalesRevenue = roundPKR(data.sales.reduce((sum, sale) => sum + sellingPrice(sale), 0));
  const ppfRevenue = roundPKR(data.ppfSales.reduce((sum, sale) => sum + sale.final_price, 0));
  const totalRevenue = roundPKR(vehicleSalesRevenue + ppfRevenue);

  const vehiclePrepExpenses = sumAmount(data.vehicleExpenses);
  const showroomExpenses = sumAmount(data.showroomExpenses);
  const showroomOverhead = roundPKR(
    data.showroomExpenses
      .filter((expense) => SHOWROOM_RENT_SALARY_CATEGORY_IDS.has(expense.category_id))
      .reduce((sum, expense) => sum + expense.amount, 0),
  );
  const ppfOverhead = roundPKR(
    data.showroomExpenses
      .filter((expense) => PPF_RENT_SALARY_CATEGORY_IDS.has(expense.category_id))
      .reduce((sum, expense) => sum + expense.amount, 0),
  );
  const totalExpenses = roundPKR(vehiclePrepExpenses + showroomExpenses);
  const purchaseSpend = roundPKR(data.purchases.reduce((sum, purchase) => sum + purchase.purchase_price, 0));

  const profitableSales = data.sales.filter((sale) => sale.profit >= 0);
  const lossSales = data.sales.filter((sale) => sale.profit < 0);
  const vehicleSalesProfit = roundPKR(profitableSales.reduce((sum, sale) => sum + sale.profit, 0));
  const vehicleSalesLoss = roundPKR(
    lossSales.reduce((sum, sale) => sum + Math.abs(sale.profit), 0),
  );

  const ppfProfit = roundPKR(
    data.ppfSales.reduce((sum, sale: PPFSale) => sum + (sale.final_price - sale.total_cost), 0),
  );

  const vehicleReceivables = roundPKR(data.sales.reduce((sum, sale) => sum + sale.balance, 0));
  const ppfReceivables = roundPKR(
    data.ppfSales.reduce((sum, sale) => {
      const paid = ppfPaymentsForSale(data, sale.ppf_sale_id);
      return sum + Math.max(0, sale.final_price - paid);
    }, 0),
  );
  const totalReceivables = roundPKR(vehicleReceivables + ppfReceivables);

  const inventoryAtCost = roundPKR(
    data.vehicles
      .filter((vehicle) => vehicle.status !== 'sold')
      .reduce((sum, vehicle) => sum + vehicle.total_cost, 0),
  );

  const totalCapitalInvested = roundPKR(
    data.investments.reduce((sum, investment) => sum + investment.amount, 0),
  );
  const investorReturnsPaid = roundPKR(
    data.investorReturns.reduce((sum, item) => sum + item.return_amount, 0),
  );

  const netProfit = roundPKR(
    data.sales.reduce((sum, sale) => sum + sale.profit, 0) + ppfProfit - showroomExpenses,
  );

  const expenseBreakdown = [
    ...groupExpenses(data.showroomExpenses, categories),
    ...groupExpenses(data.vehicleExpenses, categories),
  ].sort((a, b) => b.total - a.total);

  return {
    capital: settings.capital,
    cashInHand: settings.cash_in_hand,
    totalRevenue,
    vehicleSalesRevenue,
    ppfRevenue,
    totalExpenses,
    vehiclePrepExpenses,
    showroomExpenses,
    showroomOverhead,
    ppfOverhead,
    purchaseSpend,
    vehicleSalesProfit,
    vehicleSalesLoss,
    vehicleProfitCount: profitableSales.length,
    vehicleLossCount: lossSales.length,
    ppfProfit,
    ppfReceivables,
    vehicleReceivables,
    totalReceivables,
    inventoryAtCost,
    totalCapitalInvested,
    investorReturnsPaid,
    netProfit,
    monthlyTrend: buildMonthlyTrend(data, 6),
    expenseBreakdown,
    auditRows: buildAuditRows(data, categories),
  };
}

export function estimateCashInHand(data: AppData): number {
  const cashInflows = roundPKR(
    data.salePayments
      .filter((payment) => payment.payment_method === 'cash')
      .reduce((sum, payment) => sum + payment.amount, 0) +
      data.ppfPayments
        .filter((payment) => payment.payment_method === 'cash')
        .reduce((sum, payment) => sum + payment.amount, 0) +
      data.sales.reduce((sum, sale) => (sale.payment_method === 'cash' ? sum + sale.advance : sum), 0),
  );

  const cashOutflows = roundPKR(
    data.showroomExpenses.reduce((sum, expense) => sum + expense.amount, 0) +
      data.purchases
        .filter((purchase) => purchase.payment_method === 'cash')
        .reduce((sum, purchase) => sum + purchase.purchase_price, 0),
  );

  return roundPKR(Math.max(0, cashInflows - cashOutflows));
}
