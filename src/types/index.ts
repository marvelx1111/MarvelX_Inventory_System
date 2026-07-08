export type UserStatus = 'active' | 'inactive';
export type CustomerType = 'individual' | 'dealer' | 'corporate';
export type VehicleStatus = 'in_stock' | 'booked' | 'sold';
export type PaymentMethod = 'cash' | 'bank_transfer' | 'cheque' | 'online';
export type PPFJobStatus = 'booked' | 'in_progress' | 'completed' | 'delivered';
export type PPFStockTxnType = 'purchase' | 'usage' | 'adjustment';
export type BiometricStatus = 'done' | 'not_taken' | 'open_bio' | 'isb_no_bio';

export interface Role {
  role_id: string;
  role_name: string;
  description: string;
}

export interface Permission {
  permission_id: string;
  permission_name: string;
  module: string;
}

export interface RolePermission {
  role_id: string;
  permission_id: string;
}

export interface User {
  user_id: string;
  role_id: string;
  full_name: string;
  username: string;
  email: string;
  phone: string;
  status: UserStatus;
  auth_user_id: string | null;
}

export interface Customer {
  customer_id: string;
  customer_type: CustomerType;
  full_name: string;
  cnic: string;
  mobile: string;
  whatsapp: string;
  email: string;
  address: string;
  city: string;
  remarks: string;
  created_at: string;
}

export interface Purchase {
  purchase_id: string;
  seller_customer_id: string;
  purchase_date: string;
  purchase_price: number;
  payment_method: PaymentMethod;
  reference_number: string;
  notes: string;
}

export interface Vehicle {
  vehicle_id: string;
  stock_number: string;
  purchase_id: string;
  make: string;
  model: string;
  variant: string;
  model_year: number;
  registration_number: string;
  registration_city: string;
  engine_number: string;
  chassis_number: string;
  color: string;
  mileage: number;
  fuel_type: string;
  transmission: string;
  purchase_price: number;
  total_cost: number;
  status: VehicleStatus;
  purchase_date: string;
}

export interface VehicleDocument {
  document_id: string;
  vehicle_id: string;
  smart_card_status: string;
  smart_card_count: number;
  biometric_required: boolean;
  biometric_completed: boolean;
  biometric_status: BiometricStatus;
  original_file: boolean;
  registration_book: boolean;
  tax_token: boolean;
  spare_key: boolean;
  spare_wheel: boolean;
  tool_kit: boolean;
  user_manual: boolean;
  insurance: boolean;
  remarks: string;
}

export interface ExpenseCategory {
  category_id: string;
  category_name: string;
  description: string;
}

export interface VehicleExpense {
  expense_id: string;
  vehicle_id: string;
  category_id: string;
  expense_date: string;
  description: string;
  amount: number;
}

export interface ShowroomExpense {
  expense_id: string;
  category_id: string;
  expense_date: string;
  description: string;
  amount: number;
}

export interface Sale {
  sale_id: string;
  vehicle_id: string;
  customer_id: string;
  sale_date: string;
  sale_price: number;
  discount: number;
  advance: number;
  balance: number;
  payment_method: PaymentMethod;
  salesperson: string;
  profit: number;
  remarks: string;
}

export interface SalePayment {
  payment_id: string;
  sale_id: string;
  payment_date: string;
  amount: number;
  payment_method: PaymentMethod;
  reference_number: string;
  notes: string;
}

export interface DeliveryRecord {
  delivery_id: string;
  sale_id: string;
  delivery_date: string;
  delivered_by: string;
  receiver_name: string;
  receiver_cnic: string;
  remarks: string;
}

export interface Investor {
  investor_id: string;
  full_name: string;
  cnic: string;
  mobile: string;
  email: string;
  address: string;
  join_date: string;
}

export interface Investment {
  investment_id: string;
  investor_id: string;
  amount: number;
  investment_date: string;
  percentage_share: number;
  notes: string;
}

export interface InvestorReturn {
  return_id: string;
  investor_id: string;
  month: number;
  year: number;
  total_profit: number;
  percentage_share: number;
  return_amount: number;
  payment_date: string;
}

export interface PPFCustomer {
  ppf_customer_id: string;
  full_name: string;
  mobile: string;
  whatsapp: string;
  email: string;
  address: string;
  city: string;
}

export interface PPFVehicle {
  ppf_vehicle_id: string;
  ppf_customer_id: string;
  make: string;
  model: string;
  variant: string;
  model_year: number;
  registration_number: string;
  color: string;
}

export interface PPFBrand {
  brand_id: string;
  brand_name: string;
  country: string;
}

export interface PPFRoll {
  roll_id: string;
  brand_id: string;
  film_type: string;
  width: number;
  total_length: number;
  remaining_length: number;
  purchase_cost: number;
  supplier: string;
  purchase_date: string;
}

export interface PPFStockTransaction {
  transaction_id: string;
  roll_id: string;
  transaction_type: PPFStockTxnType;
  length_change: number;
  transaction_date: string;
  reference: string;
  notes: string;
}

export interface PPFPackage {
  package_id: string;
  package_name: string;
  estimated_film_usage: number;
  estimated_labor_cost: number;
  description: string;
}

export interface PPFJobCard {
  job_id: string;
  ppf_customer_id: string;
  ppf_vehicle_id: string;
  package_id: string;
  roll_id: string;
  installer_name: string;
  booked_date: string;
  completion_date: string | null;
  warranty_period: number;
  status: PPFJobStatus;
  notes: string;
}

export interface PPFJobMaterial {
  material_id: string;
  job_id: string;
  roll_id: string;
  meters_used: number;
  material_cost: number;
}

export interface PPFJobLabor {
  labor_id: string;
  job_id: string;
  application_cost: number;
  polishing_cost: number;
  washing_cost: number;
  misc_cost: number;
}

export interface PPFSale {
  ppf_sale_id: string;
  job_id: string;
  invoice_number: string;
  total_cost: number;
  discount: number;
  final_price: number;
  sale_date: string;
}

export interface PPFPayment {
  payment_id: string;
  ppf_sale_id: string;
  payment_date: string;
  amount: number;
  payment_method: PaymentMethod;
  reference_number: string;
}

export interface PPFWarranty {
  warranty_id: string;
  job_id: string;
  warranty_number: string;
  expiry_date: string;
  terms: string;
}

export interface AuditLog {
  log_id: string;
  user_id: string;
  action: string;
  table_name: string;
  record_id: string;
  timestamp: string;
  ip_address: string;
}

export interface AppData {
  roles: Role[];
  permissions: Permission[];
  rolePermissions: RolePermission[];
  users: User[];
  customers: Customer[];
  purchases: Purchase[];
  vehicles: Vehicle[];
  vehicleDocuments: VehicleDocument[];
  expenseCategories: ExpenseCategory[];
  vehicleExpenses: VehicleExpense[];
  showroomExpenses: ShowroomExpense[];
  sales: Sale[];
  salePayments: SalePayment[];
  deliveryRecords: DeliveryRecord[];
  investors: Investor[];
  investments: Investment[];
  investorReturns: InvestorReturn[];
  ppfCustomers: PPFCustomer[];
  ppfVehicles: PPFVehicle[];
  ppfBrands: PPFBrand[];
  ppfRolls: PPFRoll[];
  ppfStockTransactions: PPFStockTransaction[];
  ppfPackages: PPFPackage[];
  ppfJobCards: PPFJobCard[];
  ppfJobMaterials: PPFJobMaterial[];
  ppfJobLabor: PPFJobLabor[];
  ppfSales: PPFSale[];
  ppfPayments: PPFPayment[];
  ppfWarranties: PPFWarranty[];
  auditLogs: AuditLog[];
}

export type PurchaseDocumentInput = {
  biometric_status: BiometricStatus;
  original_file: boolean;
  registration_book: boolean;
  tax_token: boolean;
  spare_key: boolean;
  spare_wheel: boolean;
  tool_kit: boolean;
  user_manual: boolean;
  insurance: boolean;
  smart_card_status?: string;
  remarks?: string;
};

export type CreatePurchaseInput = Omit<Purchase, 'purchase_id'> & {
  vehicle: Omit<Vehicle, 'vehicle_id' | 'purchase_id' | 'stock_number' | 'total_cost' | 'status'>;
  document?: PurchaseDocumentInput;
};

export type CreateUserInput = {
  full_name: string;
  username: string;
  email: string;
  phone: string;
  role_id: string;
  status: UserStatus;
};

export type CreateSaleInput = {
  vehicle_id: string;
  customer_id: string;
  sale_date: string;
  sale_price: number;
  discount: number;
  advance: number;
  payment_method: PaymentMethod;
  salesperson: string;
  remarks?: string;
};

export type CreateVehicleExpenseInput = Omit<VehicleExpense, 'expense_id'>;

export type CreateShowroomExpenseInput = Omit<ShowroomExpense, 'expense_id'>;

export type CreateCustomerInput = Omit<Customer, 'customer_id' | 'created_at'>;

export type CreatePPFJobInput = Omit<PPFJobCard, 'job_id' | 'completion_date' | 'status'> & {
  status?: PPFJobStatus;
};

export type CreatePPFCustomerInput = Omit<PPFCustomer, 'ppf_customer_id'>;

export type CreatePPFVehicleInput = Omit<PPFVehicle, 'ppf_vehicle_id'>;

export const PERMISSION_MODULES = [
  'dashboard',
  'inventory',
  'purchases',
  'sales',
  'customers',
  'expenses',
  'investors',
  'ppf',
  'users',
  'audit',
] as const;

export type PermissionModule = (typeof PERMISSION_MODULES)[number];
