import { createSeedData } from '@/data/seed';
import { persistRowInsert, persistRowUpdate, type PersistResult } from '@/data/supabase-sync';

function ensurePersisted(result: PersistResult): void {
  if (!result.ok) throw new Error(result.error);
}
import type {
  AppData,
  AuditLog,
  CreateCustomerInput,
  CreatePPFJobInput,
  CreatePurchaseInput,
  CreateSaleInput,
  Customer,
  DeliveryRecord,
  ExpenseCategory,
  Investment,
  Investor,
  InvestorReturn,
  Permission,
  PPFBrand,
  PPFCustomer,
  PPFJobCard,
  PPFJobLabor,
  PPFJobMaterial,
  PPFPayment,
  PPFPackage,
  PPFRoll,
  PPFSale,
  PPFStockTransaction,
  PPFVehicle,
  PPFWarranty,
  Purchase,
  Role,
  RolePermission,
  Sale,
  SalePayment,
  ShowroomExpense,
  User,
  Vehicle,
  VehicleDocument,
  VehicleExpense,
} from '@/types';

export function formatPKR(amount: number): string {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPKRCompact(amount: number): string {
  if (amount >= 1_000_000) {
    return `PKR ${(amount / 1_000_000).toFixed(2)}M`;
  }
  if (amount >= 1_000) {
    return `PKR ${(amount / 1_000).toFixed(0)}K`;
  }
  return formatPKR(amount);
}

export function parsePKR(value: string): number {
  const cleaned = value.replace(/[^\d.-]/g, '');
  return Number.parseFloat(cleaned) || 0;
}

export interface DashboardKPIs {
  vehiclesInStock: number;
  vehiclesBooked: number;
  vehiclesSold: number;
  totalInventoryValue: number;
  totalSalesRevenue: number;
  pendingReceivables: number;
  totalProfit: number;
  ppfJobsActive: number;
  ppfLowStockRolls: number;
  monthlyShowroomExpenses: number;
}

export interface SalesTrendPoint {
  month: string;
  year: number;
  salesCount: number;
  revenue: number;
  profit: number;
}

export interface VehicleWithDetails {
  vehicle: Vehicle;
  purchase: Purchase | null;
  seller: Customer | null;
  document: VehicleDocument | null;
  expenses: VehicleExpense[];
  sale: Sale | null;
  buyer: Customer | null;
  payments: SalePayment[];
  delivery: DeliveryRecord | null;
}

export interface CustomerProfile {
  customer: Customer;
  purchasesAsSeller: Purchase[];
  sales: Sale[];
  vehiclesPurchased: Vehicle[];
  totalSpent: number;
  outstandingBalance: number;
}

export interface PPFJobWithDetails {
  job: PPFJobCard;
  customer: PPFCustomer | null;
  vehicle: PPFVehicle | null;
  package: PPFPackage | null;
  roll: PPFRoll | null;
  brand: PPFBrand | null;
  materials: PPFJobMaterial[];
  labor: PPFJobLabor | null;
  sale: PPFSale | null;
  payments: PPFPayment[];
  warranty: PPFWarranty | null;
}

export interface GlobalSearchResult {
  type: string;
  id: string;
  title: string;
  subtitle: string;
  module: string;
}

class DataStore {
  private data: AppData;
  private idCounters: Record<string, number>;

  constructor() {
    this.data = createSeedData();
    this.idCounters = this.buildIdCounters();
  }

  hydrate(data: AppData): void {
    this.data = data;
    this.idCounters = this.buildIdCounters();
  }

  isHydratedFromSupabase(): boolean {
    return this.data.roles.length > 0 && this.data.vehicles.length > 0;
  }

  private buildIdCounters(): Record<string, number> {
    const counters: Record<string, number> = {};
    const track = (prefix: string, id: string) => {
      const num = Number.parseInt(id.replace(`${prefix}_`, ''), 10);
      if (!Number.isNaN(num)) {
        counters[prefix] = Math.max(counters[prefix] ?? 0, num);
      }
    };

    this.data.users.forEach((u) => track('usr', u.user_id));
    this.data.customers.forEach((c) => track('cus', c.customer_id));
    this.data.purchases.forEach((p) => track('pur', p.purchase_id));
    this.data.vehicles.forEach((v) => track('veh', v.vehicle_id));
    this.data.vehicleDocuments.forEach((d) => track('doc', d.document_id));
    this.data.vehicleExpenses.forEach((e) => track('vex', e.expense_id));
    this.data.sales.forEach((s) => track('sal', s.sale_id));
    this.data.salePayments.forEach((p) => track('spay', p.payment_id));
    this.data.deliveryRecords.forEach((d) => track('del', d.delivery_id));
    this.data.ppfJobCards.forEach((j) => track('job', j.job_id));
    this.data.ppfStockTransactions.forEach((t) => track('ppftx', t.transaction_id));
    this.data.auditLogs.forEach((l) => track('aud', l.log_id));

    return counters;
  }

  private nextId(prefix: string): string {
    const next = (this.idCounters[prefix] ?? 0) + 1;
    this.idCounters[prefix] = next;
    return `${prefix}_${String(next).padStart(3, '0')}`;
  }

  getData(): AppData {
    return this.data;
  }

  reset(): void {
    this.data = createSeedData();
    this.idCounters = this.buildIdCounters();
  }

  authenticate(username: string, password: string): User | null {
    const user = this.data.users.find(
      (u) => u.username === username && u.password === password && u.status === 'active',
    );
    return user ?? null;
  }

  getUserPermissions(userId: string): string[] {
    const user = this.data.users.find((u) => u.user_id === userId);
    if (!user) return [];

    const permissionIds = this.data.rolePermissions
      .filter((rp) => rp.role_id === user.role_id)
      .map((rp) => rp.permission_id);

    return this.data.permissions
      .filter((p) => permissionIds.includes(p.permission_id))
      .map((p) => p.module);
  }

  getRoles(): Role[] {
    return this.data.roles;
  }

  getPermissions(): Permission[] {
    return this.data.permissions;
  }

  getRolePermissions(): RolePermission[] {
    return this.data.rolePermissions;
  }

  getUsers(): User[] {
    return this.data.users;
  }

  getCustomers(): Customer[] {
    return this.data.customers;
  }

  getPurchases(): Purchase[] {
    return this.data.purchases;
  }

  getVehicles(): Vehicle[] {
    return this.data.vehicles;
  }

  getVehicleDocuments(): VehicleDocument[] {
    return this.data.vehicleDocuments;
  }

  getExpenseCategories(): ExpenseCategory[] {
    return this.data.expenseCategories;
  }

  getVehicleExpenses(): VehicleExpense[] {
    return this.data.vehicleExpenses;
  }

  getShowroomExpenses(): ShowroomExpense[] {
    return this.data.showroomExpenses;
  }

  getSales(): Sale[] {
    return this.data.sales;
  }

  getSalePayments(): SalePayment[] {
    return this.data.salePayments;
  }

  getDeliveryRecords(): DeliveryRecord[] {
    return this.data.deliveryRecords;
  }

  getInvestors(): Investor[] {
    return this.data.investors;
  }

  getInvestments(): Investment[] {
    return this.data.investments;
  }

  getInvestorReturns(): InvestorReturn[] {
    return this.data.investorReturns;
  }

  getPPFCustomers(): PPFCustomer[] {
    return this.data.ppfCustomers;
  }

  getPPFVehicles(): PPFVehicle[] {
    return this.data.ppfVehicles;
  }

  getPPFBrands(): PPFBrand[] {
    return this.data.ppfBrands;
  }

  getPPFRolls(): PPFRoll[] {
    return this.data.ppfRolls;
  }

  getPPFStockTransactions(): PPFStockTransaction[] {
    return this.data.ppfStockTransactions;
  }

  getPPFPackages(): PPFPackage[] {
    return this.data.ppfPackages;
  }

  getPPFJobCards(): PPFJobCard[] {
    return this.data.ppfJobCards;
  }

  getPPFJobMaterials(): PPFJobMaterial[] {
    return this.data.ppfJobMaterials;
  }

  getPPFJobLabor(): PPFJobLabor[] {
    return this.data.ppfJobLabor;
  }

  getPPFSales(): PPFSale[] {
    return this.data.ppfSales;
  }

  getPPFPayments(): PPFPayment[] {
    return this.data.ppfPayments;
  }

  getPPFWarranties(): PPFWarranty[] {
    return this.data.ppfWarranties;
  }

  getAuditLogs(): AuditLog[] {
    return this.data.auditLogs;
  }

  getUserById(id: string): User | undefined {
    return this.data.users.find((u) => u.user_id === id);
  }

  getCustomerById(id: string): Customer | undefined {
    return this.data.customers.find((c) => c.customer_id === id);
  }

  getVehicleById(id: string): Vehicle | undefined {
    return this.data.vehicles.find((v) => v.vehicle_id === id);
  }

  getPurchaseById(id: string): Purchase | undefined {
    return this.data.purchases.find((p) => p.purchase_id === id);
  }

  getSaleById(id: string): Sale | undefined {
    return this.data.sales.find((s) => s.sale_id === id);
  }

  getPPFJobById(id: string): PPFJobCard | undefined {
    return this.data.ppfJobCards.find((j) => j.job_id === id);
  }

  createPurchase(input: CreatePurchaseInput): { purchase: Purchase; vehicle: Vehicle; document: VehicleDocument } {
    const purchaseId = this.nextId('pur');
    const vehicleId = this.nextId('veh');
    const documentId = this.nextId('doc');
    const stockNumber = `MX-${new Date().getFullYear()}-${String(this.data.vehicles.length + 1).padStart(3, '0')}`;

    const purchase: Purchase = {
      purchase_id: purchaseId,
      seller_customer_id: input.seller_customer_id,
      purchase_date: input.purchase_date,
      purchase_price: input.purchase_price,
      payment_method: input.payment_method,
      reference_number: input.reference_number,
      notes: input.notes,
    };

    const vehicle: Vehicle = {
      vehicle_id: vehicleId,
      stock_number: stockNumber,
      purchase_id: purchaseId,
      make: input.vehicle.make,
      model: input.vehicle.model,
      variant: input.vehicle.variant,
      model_year: input.vehicle.model_year,
      registration_number: input.vehicle.registration_number,
      registration_city: input.vehicle.registration_city,
      engine_number: input.vehicle.engine_number,
      chassis_number: input.vehicle.chassis_number,
      color: input.vehicle.color,
      mileage: input.vehicle.mileage,
      fuel_type: input.vehicle.fuel_type,
      transmission: input.vehicle.transmission,
      purchase_price: input.purchase_price,
      total_cost: input.purchase_price,
      status: 'in_stock',
      purchase_date: input.purchase_date,
    };

    const document: VehicleDocument = {
      document_id: documentId,
      vehicle_id: vehicleId,
      smart_card_status: 'pending',
      smart_card_count: 0,
      biometric_required: false,
      biometric_completed: false,
      original_file: false,
      registration_book: false,
      tax_token: false,
      spare_key: false,
      spare_wheel: false,
      tool_kit: false,
      user_manual: false,
      insurance: false,
      remarks: '',
    };

    this.data.purchases.push(purchase);
    this.data.vehicles.push(vehicle);
    this.data.vehicleDocuments.push(document);

    return { purchase, vehicle, document };
  }

  createSale(input: CreateSaleInput): Sale | null {
    const vehicle = this.data.vehicles.find((v) => v.vehicle_id === input.vehicle_id);
    const customer = this.data.customers.find((c) => c.customer_id === input.customer_id);

    if (!vehicle || !customer) return null;
    if (vehicle.status === 'sold') return null;

    const balance = input.sale_price - input.discount - input.advance;
    const profit = input.sale_price - input.discount - vehicle.total_cost;

    const sale: Sale = {
      sale_id: this.nextId('sal'),
      vehicle_id: input.vehicle_id,
      customer_id: input.customer_id,
      sale_date: input.sale_date,
      sale_price: input.sale_price,
      discount: input.discount,
      advance: input.advance,
      balance: Math.max(0, balance),
      payment_method: input.payment_method,
      salesperson: input.salesperson,
      profit,
    };

    vehicle.status = balance <= 0 ? 'sold' : 'booked';
    this.data.sales.push(sale);

    if (input.advance > 0) {
      this.addSalePayment(sale.sale_id, {
        payment_date: input.sale_date,
        amount: input.advance,
        payment_method: input.payment_method,
        reference_number: `ADV-${sale.sale_id}`,
        notes: 'Advance payment at booking',
      });
    }

    return sale;
  }

  addSalePayment(
    saleId: string,
    payment: Omit<SalePayment, 'payment_id' | 'sale_id'>,
  ): SalePayment | null {
    const sale = this.data.sales.find((s) => s.sale_id === saleId);
    if (!sale) return null;

    const record: SalePayment = {
      payment_id: this.nextId('spay'),
      sale_id: saleId,
      ...payment,
    };

    sale.balance = Math.max(0, sale.balance - payment.amount);
    if (sale.balance === 0) {
      const vehicle = this.data.vehicles.find((v) => v.vehicle_id === sale.vehicle_id);
      if (vehicle) vehicle.status = 'sold';
    }

    this.data.salePayments.push(record);
    return record;
  }

  async createCustomer(input: CreateCustomerInput): Promise<Customer> {
    const customer: Customer = {
      customer_id: this.nextId('cus'),
      ...input,
      created_at: new Date().toISOString(),
    };

    this.data.customers.push(customer);
    const persist = await persistRowInsert('customers', customer as unknown as Record<string, unknown>);
    ensurePersisted(persist);
    return customer;
  }

  async updateCustomer(
    customerId: string,
    updates: Partial<Omit<Customer, 'customer_id' | 'created_at'>>,
  ): Promise<Customer | null> {
    const index = this.data.customers.findIndex((c) => c.customer_id === customerId);
    if (index === -1) return null;

    this.data.customers[index] = { ...this.data.customers[index], ...updates };
    const customer = this.data.customers[index];
    ensurePersisted(await persistRowUpdate('customers', 'customer_id', customerId, updates));
    return customer;
  }

  async updateVehicle(
    vehicleId: string,
    updates: Partial<Omit<Vehicle, 'vehicle_id' | 'purchase_id' | 'stock_number'>>,
  ): Promise<Vehicle | null> {
    const index = this.data.vehicles.findIndex((v) => v.vehicle_id === vehicleId);
    if (index === -1) return null;

    const normalized = { ...updates };
    if (normalized.model_year !== undefined) normalized.model_year = Number(normalized.model_year);
    if (normalized.mileage !== undefined) normalized.mileage = Number(normalized.mileage);
    if (normalized.purchase_price !== undefined) normalized.purchase_price = Number(normalized.purchase_price);
    if (normalized.total_cost !== undefined) normalized.total_cost = Number(normalized.total_cost);

    this.data.vehicles[index] = { ...this.data.vehicles[index], ...normalized };
    ensurePersisted(await persistRowUpdate('vehicles', 'vehicle_id', vehicleId, normalized));
    return this.data.vehicles[index];
  }

  async updateSale(
    saleId: string,
    updates: Partial<Omit<Sale, 'sale_id' | 'vehicle_id' | 'customer_id'>>,
  ): Promise<Sale | null> {
    const index = this.data.sales.findIndex((s) => s.sale_id === saleId);
    if (index === -1) return null;

    const normalized = { ...updates };
    if (normalized.sale_price !== undefined) normalized.sale_price = Number(normalized.sale_price);
    if (normalized.discount !== undefined) normalized.discount = Number(normalized.discount);
    if (normalized.advance !== undefined) normalized.advance = Number(normalized.advance);
    if (normalized.balance !== undefined) normalized.balance = Number(normalized.balance);
    if (normalized.profit !== undefined) normalized.profit = Number(normalized.profit);

    const sale = { ...this.data.sales[index], ...normalized };
    if (updates.sale_price !== undefined || updates.discount !== undefined) {
      const vehicle = this.data.vehicles.find((v) => v.vehicle_id === sale.vehicle_id);
      if (vehicle && updates.sale_price !== undefined) {
        sale.profit = sale.sale_price - sale.discount - vehicle.total_cost;
      }
    }
    if (updates.sale_price !== undefined || updates.discount !== undefined || updates.advance !== undefined) {
      const net = sale.sale_price - sale.discount;
      const paid = this.data.salePayments
        .filter((p) => p.sale_id === saleId)
        .reduce((sum, p) => sum + p.amount, 0);
      sale.balance = Math.max(0, net - paid);
    }

    this.data.sales[index] = sale;
    ensurePersisted(await persistRowUpdate('sales', 'sale_id', saleId, {
      sale_date: sale.sale_date,
      sale_price: sale.sale_price,
      discount: sale.discount,
      advance: sale.advance,
      balance: sale.balance,
      payment_method: sale.payment_method,
      salesperson: sale.salesperson,
      profit: sale.profit,
    }));
    return sale;
  }

  async updateDeliveryRecord(
    deliveryId: string,
    updates: Partial<Omit<DeliveryRecord, 'delivery_id' | 'sale_id'>>,
  ): Promise<DeliveryRecord | null> {
    const index = this.data.deliveryRecords.findIndex((d) => d.delivery_id === deliveryId);
    if (index === -1) return null;

    this.data.deliveryRecords[index] = { ...this.data.deliveryRecords[index], ...updates };
    ensurePersisted(await persistRowUpdate('delivery_records', 'delivery_id', deliveryId, updates));
    return this.data.deliveryRecords[index];
  }

  async createDeliveryRecord(
    saleId: string,
    input: Omit<DeliveryRecord, 'delivery_id' | 'sale_id'>,
  ): Promise<DeliveryRecord> {
    const record: DeliveryRecord = {
      delivery_id: this.nextId('del'),
      sale_id: saleId,
      ...input,
    };
    this.data.deliveryRecords.push(record);
    ensurePersisted(await persistRowInsert('delivery_records', record as unknown as Record<string, unknown>));
    return record;
  }

  async updateInvestor(
    investorId: string,
    updates: Partial<Omit<Investor, 'investor_id'>>,
  ): Promise<Investor | null> {
    const index = this.data.investors.findIndex((i) => i.investor_id === investorId);
    if (index === -1) return null;

    this.data.investors[index] = { ...this.data.investors[index], ...updates };
    ensurePersisted(await persistRowUpdate('investors', 'investor_id', investorId, updates));
    return this.data.investors[index];
  }

  async updatePPFCustomer(
    ppfCustomerId: string,
    updates: Partial<Omit<PPFCustomer, 'ppf_customer_id'>>,
  ): Promise<PPFCustomer | null> {
    const index = this.data.ppfCustomers.findIndex((c) => c.ppf_customer_id === ppfCustomerId);
    if (index === -1) return null;

    this.data.ppfCustomers[index] = { ...this.data.ppfCustomers[index], ...updates };
    ensurePersisted(await persistRowUpdate('ppf_customers', 'ppf_customer_id', ppfCustomerId, updates));
    return this.data.ppfCustomers[index];
  }

  async updatePPFJob(
    jobId: string,
    updates: Partial<Omit<PPFJobCard, 'job_id'>>,
  ): Promise<PPFJobCard | null> {
    const index = this.data.ppfJobCards.findIndex((j) => j.job_id === jobId);
    if (index === -1) return null;

    const normalized = { ...updates };
    if (normalized.warranty_period !== undefined) {
      normalized.warranty_period = Number(normalized.warranty_period);
    }

    this.data.ppfJobCards[index] = { ...this.data.ppfJobCards[index], ...normalized };
    ensurePersisted(await persistRowUpdate('ppf_job_cards', 'job_id', jobId, {
      ...normalized,
      completion_date: this.data.ppfJobCards[index].completion_date,
    }));
    return this.data.ppfJobCards[index];
  }

  async updateVehicleDocument(
    documentId: string,
    updates: Partial<Omit<VehicleDocument, 'document_id' | 'vehicle_id'>>,
  ): Promise<VehicleDocument | null> {
    const index = this.data.vehicleDocuments.findIndex((d) => d.document_id === documentId);
    if (index === -1) return null;

    this.data.vehicleDocuments[index] = {
      ...this.data.vehicleDocuments[index],
      ...updates,
    };

    ensurePersisted(await persistRowUpdate('vehicle_documents', 'document_id', documentId, updates));
    return this.data.vehicleDocuments[index];
  }

  updatePPFJobStatus(jobId: string, status: PPFJobCard['status']): PPFJobCard | null {
    const job = this.data.ppfJobCards.find((j) => j.job_id === jobId);
    if (!job) return null;

    job.status = status;
    if (status === 'completed' || status === 'delivered') {
      job.completion_date = new Date().toISOString().slice(0, 10);
    }

    return job;
  }

  createPPFJob(input: CreatePPFJobInput): PPFJobCard {
    const job: PPFJobCard = {
      job_id: this.nextId('job'),
      ppf_customer_id: input.ppf_customer_id,
      ppf_vehicle_id: input.ppf_vehicle_id,
      package_id: input.package_id,
      roll_id: input.roll_id,
      installer_name: input.installer_name,
      booked_date: input.booked_date,
      completion_date: null,
      warranty_period: input.warranty_period,
      status: input.status ?? 'booked',
      notes: input.notes,
    };

    this.data.ppfJobCards.push(job);
    return job;
  }

  usePPFRoll(
    rollId: string,
    metersUsed: number,
    reference: string,
    notes = '',
  ): { roll: PPFRoll; transaction: PPFStockTransaction } | null {
    const roll = this.data.ppfRolls.find((r) => r.roll_id === rollId);
    if (!roll || metersUsed <= 0 || roll.remaining_length < metersUsed) return null;

    roll.remaining_length = Math.round((roll.remaining_length - metersUsed) * 10) / 10;

    const transaction: PPFStockTransaction = {
      transaction_id: this.nextId('ppftx'),
      roll_id: rollId,
      transaction_type: 'usage',
      length_change: -metersUsed,
      transaction_date: new Date().toISOString().slice(0, 10),
      reference,
      notes,
    };

    this.data.ppfStockTransactions.push(transaction);
    return { roll, transaction };
  }

  addAuditLog(
    entry: Omit<AuditLog, 'log_id' | 'timestamp'>,
  ): AuditLog {
    const log: AuditLog = {
      log_id: this.nextId('aud'),
      ...entry,
      timestamp: new Date().toISOString(),
    };

    this.data.auditLogs.unshift(log);
    return log;
  }

  getDashboardKPIs(): DashboardKPIs {
    const vehiclesInStock = this.data.vehicles.filter((v) => v.status === 'in_stock').length;
    const vehiclesBooked = this.data.vehicles.filter((v) => v.status === 'booked').length;
    const vehiclesSold = this.data.vehicles.filter((v) => v.status === 'sold').length;
    const totalInventoryValue = this.data.vehicles
      .filter((v) => v.status !== 'sold')
      .reduce((sum, v) => sum + v.total_cost, 0);
    const totalSalesRevenue = this.data.sales.reduce(
      (sum, s) => sum + s.sale_price - s.discount,
      0,
    );
    const pendingReceivables = this.data.sales.reduce((sum, s) => sum + s.balance, 0);
    const totalProfit = this.data.sales.reduce((sum, s) => sum + s.profit, 0);
    const ppfJobsActive = this.data.ppfJobCards.filter(
      (j) => j.status === 'booked' || j.status === 'in_progress',
    ).length;
    const ppfLowStockRolls = this.data.ppfRolls.filter((r) => r.remaining_length < 20).length;

    const now = new Date();
    const monthlyShowroomExpenses = this.data.showroomExpenses
      .filter((e) => {
        const d = new Date(e.expense_date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((sum, e) => sum + e.amount, 0);

    return {
      vehiclesInStock,
      vehiclesBooked,
      vehiclesSold,
      totalInventoryValue,
      totalSalesRevenue,
      pendingReceivables,
      totalProfit,
      ppfJobsActive,
      ppfLowStockRolls,
      monthlyShowroomExpenses,
    };
  }

  getSalesTrend(months: number): SalesTrendPoint[] {
    const points: SalesTrendPoint[] = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = date.getMonth();
      const year = date.getFullYear();
      const monthLabel = date.toLocaleString('en-PK', { month: 'short' });

      const monthSales = this.data.sales.filter((s) => {
        const d = new Date(s.sale_date);
        return d.getMonth() === month && d.getFullYear() === year;
      });

      points.push({
        month: monthLabel,
        year,
        salesCount: monthSales.length,
        revenue: monthSales.reduce((sum, s) => sum + s.sale_price - s.discount, 0),
        profit: monthSales.reduce((sum, s) => sum + s.profit, 0),
      });
    }

    return points;
  }

  getVehicleWithDetails(id: string): VehicleWithDetails | null {
    const vehicle = this.data.vehicles.find((v) => v.vehicle_id === id);
    if (!vehicle) return null;

    const purchase = this.data.purchases.find((p) => p.purchase_id === vehicle.purchase_id) ?? null;
    const seller = purchase
      ? this.data.customers.find((c) => c.customer_id === purchase.seller_customer_id) ?? null
      : null;
    const document = this.data.vehicleDocuments.find((d) => d.vehicle_id === id) ?? null;
    const expenses = this.data.vehicleExpenses.filter((e) => e.vehicle_id === id);
    const sale = this.data.sales.find((s) => s.vehicle_id === id) ?? null;
    const buyer = sale
      ? this.data.customers.find((c) => c.customer_id === sale.customer_id) ?? null
      : null;
    const payments = sale
      ? this.data.salePayments.filter((p) => p.sale_id === sale.sale_id)
      : [];
    const delivery = sale
      ? this.data.deliveryRecords.find((d) => d.sale_id === sale.sale_id) ?? null
      : null;

    return { vehicle, purchase, seller, document, expenses, sale, buyer, payments, delivery };
  }

  getCustomerProfile(id: string): CustomerProfile | null {
    const customer = this.data.customers.find((c) => c.customer_id === id);
    if (!customer) return null;

    const purchasesAsSeller = this.data.purchases.filter(
      (p) => p.seller_customer_id === id,
    );
    const sales = this.data.sales.filter((s) => s.customer_id === id);
    const vehiclesPurchased = sales
      .map((s) => this.data.vehicles.find((v) => v.vehicle_id === s.vehicle_id))
      .filter((v): v is Vehicle => v !== undefined);
    const totalSpent = sales.reduce((sum, s) => sum + s.sale_price - s.discount, 0);
    const outstandingBalance = sales.reduce((sum, s) => sum + s.balance, 0);

    return {
      customer,
      purchasesAsSeller,
      sales,
      vehiclesPurchased,
      totalSpent,
      outstandingBalance,
    };
  }

  getPPFJobWithDetails(id: string): PPFJobWithDetails | null {
    const job = this.data.ppfJobCards.find((j) => j.job_id === id);
    if (!job) return null;

    const customer =
      this.data.ppfCustomers.find((c) => c.ppf_customer_id === job.ppf_customer_id) ?? null;
    const vehicle =
      this.data.ppfVehicles.find((v) => v.ppf_vehicle_id === job.ppf_vehicle_id) ?? null;
    const pkg = this.data.ppfPackages.find((p) => p.package_id === job.package_id) ?? null;
    const roll = this.data.ppfRolls.find((r) => r.roll_id === job.roll_id) ?? null;
    const brand = roll
      ? this.data.ppfBrands.find((b) => b.brand_id === roll.brand_id) ?? null
      : null;
    const materials = this.data.ppfJobMaterials.filter((m) => m.job_id === id);
    const labor = this.data.ppfJobLabor.find((l) => l.job_id === id) ?? null;
    const sale = this.data.ppfSales.find((s) => s.job_id === id) ?? null;
    const payments = sale
      ? this.data.ppfPayments.filter((p) => p.ppf_sale_id === sale.ppf_sale_id)
      : [];
    const warranty = this.data.ppfWarranties.find((w) => w.job_id === id) ?? null;

    return { job, customer, vehicle, package: pkg, roll, brand, materials, labor, sale, payments, warranty };
  }

  searchGlobal(query: string): GlobalSearchResult[] {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const results: GlobalSearchResult[] = [];

    for (const customer of this.data.customers) {
      if (
        customer.full_name.toLowerCase().includes(q) ||
        customer.cnic.includes(q) ||
        customer.mobile.includes(q) ||
        customer.city.toLowerCase().includes(q)
      ) {
        results.push({
          type: 'customer',
          id: customer.customer_id,
          title: customer.full_name,
          subtitle: `${customer.city} · ${customer.cnic}`,
          module: 'customers',
        });
      }
    }

    for (const vehicle of this.data.vehicles) {
      if (
        vehicle.stock_number.toLowerCase().includes(q) ||
        vehicle.make.toLowerCase().includes(q) ||
        vehicle.model.toLowerCase().includes(q) ||
        vehicle.registration_number.toLowerCase().includes(q)
      ) {
        results.push({
          type: 'vehicle',
          id: vehicle.vehicle_id,
          title: `${vehicle.make} ${vehicle.model} ${vehicle.model_year}`,
          subtitle: `${vehicle.stock_number} · ${formatPKRCompact(vehicle.total_cost)} · ${vehicle.status}`,
          module: 'inventory',
        });
      }
    }

    for (const sale of this.data.sales) {
      if (sale.sale_id.toLowerCase().includes(q) || sale.salesperson.toLowerCase().includes(q)) {
        const vehicle = this.data.vehicles.find((v) => v.vehicle_id === sale.vehicle_id);
        results.push({
          type: 'sale',
          id: sale.sale_id,
          title: `Sale ${sale.sale_id}`,
          subtitle: vehicle
            ? `${vehicle.make} ${vehicle.model} · ${formatPKRCompact(sale.sale_price)}`
            : formatPKRCompact(sale.sale_price),
          module: 'sales',
        });
      }
    }

    for (const job of this.data.ppfJobCards) {
      const customer = this.data.ppfCustomers.find((c) => c.ppf_customer_id === job.ppf_customer_id);
      if (
        job.job_id.toLowerCase().includes(q) ||
        job.installer_name.toLowerCase().includes(q) ||
        customer?.full_name.toLowerCase().includes(q)
      ) {
        results.push({
          type: 'ppf_job',
          id: job.job_id,
          title: `PPF Job ${job.job_id}`,
          subtitle: customer ? `${customer.full_name} · ${job.status}` : job.status,
          module: 'ppf',
        });
      }
    }

    for (const investor of this.data.investors) {
      if (
        investor.full_name.toLowerCase().includes(q) ||
        investor.cnic.includes(q)
      ) {
        results.push({
          type: 'investor',
          id: investor.investor_id,
          title: investor.full_name,
          subtitle: investor.mobile,
          module: 'investors',
        });
      }
    }

    return results.slice(0, 25);
  }
}

export const store = new DataStore();
