-- Marvel X ERP initial schema
-- Applied via Supabase MCP migration: initial_marvel_x_schema

CREATE TYPE user_status AS ENUM ('active', 'inactive');
CREATE TYPE customer_type AS ENUM ('individual', 'dealer', 'corporate');
CREATE TYPE vehicle_status AS ENUM ('in_stock', 'booked', 'sold');
CREATE TYPE payment_method AS ENUM ('cash', 'bank_transfer', 'cheque', 'online');
CREATE TYPE ppf_job_status AS ENUM ('booked', 'in_progress', 'completed', 'delivered');
CREATE TYPE ppf_stock_txn_type AS ENUM ('purchase', 'usage', 'adjustment');

CREATE TABLE roles (
  role_id TEXT PRIMARY KEY,
  role_name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT ''
);

CREATE TABLE permissions (
  permission_id TEXT PRIMARY KEY,
  permission_name TEXT NOT NULL,
  module TEXT NOT NULL
);

CREATE TABLE role_permissions (
  role_id TEXT NOT NULL REFERENCES roles(role_id) ON DELETE CASCADE,
  permission_id TEXT NOT NULL REFERENCES permissions(permission_id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE app_users (
  user_id TEXT PRIMARY KEY,
  role_id TEXT NOT NULL REFERENCES roles(role_id),
  full_name TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  status user_status NOT NULL DEFAULT 'active',
  password_hash TEXT NOT NULL
);

CREATE TABLE customers (
  customer_id TEXT PRIMARY KEY,
  customer_type customer_type NOT NULL DEFAULT 'individual',
  full_name TEXT NOT NULL,
  cnic TEXT NOT NULL DEFAULT '',
  mobile TEXT NOT NULL DEFAULT '',
  whatsapp TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  remarks TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE expense_categories (
  category_id TEXT PRIMARY KEY,
  category_name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT ''
);

CREATE TABLE purchases (
  purchase_id TEXT PRIMARY KEY,
  seller_customer_id TEXT NOT NULL REFERENCES customers(customer_id),
  purchase_date DATE NOT NULL,
  purchase_price NUMERIC(14,2) NOT NULL,
  payment_method payment_method NOT NULL,
  reference_number TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT ''
);

CREATE TABLE vehicles (
  vehicle_id TEXT PRIMARY KEY,
  stock_number TEXT NOT NULL UNIQUE,
  purchase_id TEXT NOT NULL REFERENCES purchases(purchase_id),
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  variant TEXT NOT NULL DEFAULT '',
  model_year INTEGER NOT NULL,
  registration_number TEXT NOT NULL DEFAULT '',
  registration_city TEXT NOT NULL DEFAULT '',
  engine_number TEXT NOT NULL DEFAULT '',
  chassis_number TEXT NOT NULL DEFAULT '',
  color TEXT NOT NULL DEFAULT '',
  mileage INTEGER NOT NULL DEFAULT 0,
  fuel_type TEXT NOT NULL DEFAULT '',
  transmission TEXT NOT NULL DEFAULT '',
  purchase_price NUMERIC(14,2) NOT NULL,
  total_cost NUMERIC(14,2) NOT NULL,
  status vehicle_status NOT NULL DEFAULT 'in_stock',
  purchase_date DATE NOT NULL
);

CREATE TABLE vehicle_documents (
  document_id TEXT PRIMARY KEY,
  vehicle_id TEXT NOT NULL UNIQUE REFERENCES vehicles(vehicle_id) ON DELETE CASCADE,
  smart_card_status TEXT NOT NULL DEFAULT 'pending',
  smart_card_count INTEGER NOT NULL DEFAULT 0,
  biometric_required BOOLEAN NOT NULL DEFAULT FALSE,
  biometric_completed BOOLEAN NOT NULL DEFAULT FALSE,
  original_file BOOLEAN NOT NULL DEFAULT FALSE,
  registration_book BOOLEAN NOT NULL DEFAULT FALSE,
  tax_token BOOLEAN NOT NULL DEFAULT FALSE,
  spare_key BOOLEAN NOT NULL DEFAULT FALSE,
  spare_wheel BOOLEAN NOT NULL DEFAULT FALSE,
  tool_kit BOOLEAN NOT NULL DEFAULT FALSE,
  user_manual BOOLEAN NOT NULL DEFAULT FALSE,
  insurance BOOLEAN NOT NULL DEFAULT FALSE,
  remarks TEXT NOT NULL DEFAULT ''
);

CREATE TABLE vehicle_expenses (
  expense_id TEXT PRIMARY KEY,
  vehicle_id TEXT NOT NULL REFERENCES vehicles(vehicle_id) ON DELETE CASCADE,
  category_id TEXT NOT NULL REFERENCES expense_categories(category_id),
  expense_date DATE NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  amount NUMERIC(14,2) NOT NULL
);

CREATE TABLE showroom_expenses (
  expense_id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL REFERENCES expense_categories(category_id),
  expense_date DATE NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  amount NUMERIC(14,2) NOT NULL
);

CREATE TABLE sales (
  sale_id TEXT PRIMARY KEY,
  vehicle_id TEXT NOT NULL REFERENCES vehicles(vehicle_id),
  customer_id TEXT NOT NULL REFERENCES customers(customer_id),
  sale_date DATE NOT NULL,
  sale_price NUMERIC(14,2) NOT NULL,
  discount NUMERIC(14,2) NOT NULL DEFAULT 0,
  advance NUMERIC(14,2) NOT NULL DEFAULT 0,
  balance NUMERIC(14,2) NOT NULL DEFAULT 0,
  payment_method payment_method NOT NULL,
  salesperson TEXT NOT NULL DEFAULT '',
  profit NUMERIC(14,2) NOT NULL DEFAULT 0
);

CREATE TABLE sale_payments (
  payment_id TEXT PRIMARY KEY,
  sale_id TEXT NOT NULL REFERENCES sales(sale_id) ON DELETE CASCADE,
  payment_date DATE NOT NULL,
  amount NUMERIC(14,2) NOT NULL,
  payment_method payment_method NOT NULL,
  reference_number TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT ''
);

CREATE TABLE delivery_records (
  delivery_id TEXT PRIMARY KEY,
  sale_id TEXT NOT NULL UNIQUE REFERENCES sales(sale_id) ON DELETE CASCADE,
  delivery_date DATE NOT NULL,
  delivered_by TEXT NOT NULL DEFAULT '',
  receiver_name TEXT NOT NULL DEFAULT '',
  receiver_cnic TEXT NOT NULL DEFAULT '',
  remarks TEXT NOT NULL DEFAULT ''
);

CREATE TABLE investors (
  investor_id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  cnic TEXT NOT NULL DEFAULT '',
  mobile TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  join_date DATE NOT NULL
);

CREATE TABLE investments (
  investment_id TEXT PRIMARY KEY,
  investor_id TEXT NOT NULL REFERENCES investors(investor_id) ON DELETE CASCADE,
  amount NUMERIC(14,2) NOT NULL,
  investment_date DATE NOT NULL,
  percentage_share NUMERIC(6,2) NOT NULL,
  notes TEXT NOT NULL DEFAULT ''
);

CREATE TABLE investor_returns (
  return_id TEXT PRIMARY KEY,
  investor_id TEXT NOT NULL REFERENCES investors(investor_id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL,
  total_profit NUMERIC(14,2) NOT NULL,
  percentage_share NUMERIC(6,2) NOT NULL,
  return_amount NUMERIC(14,2) NOT NULL,
  payment_date DATE NOT NULL
);

CREATE TABLE ppf_customers (
  ppf_customer_id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  mobile TEXT NOT NULL DEFAULT '',
  whatsapp TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT ''
);

CREATE TABLE ppf_vehicles (
  ppf_vehicle_id TEXT PRIMARY KEY,
  ppf_customer_id TEXT NOT NULL REFERENCES ppf_customers(ppf_customer_id) ON DELETE CASCADE,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  variant TEXT NOT NULL DEFAULT '',
  model_year INTEGER NOT NULL,
  registration_number TEXT NOT NULL DEFAULT '',
  color TEXT NOT NULL DEFAULT ''
);

CREATE TABLE ppf_brands (
  brand_id TEXT PRIMARY KEY,
  brand_name TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT ''
);

CREATE TABLE ppf_rolls (
  roll_id TEXT PRIMARY KEY,
  brand_id TEXT NOT NULL REFERENCES ppf_brands(brand_id),
  film_type TEXT NOT NULL,
  width NUMERIC(6,2) NOT NULL,
  total_length NUMERIC(8,2) NOT NULL,
  remaining_length NUMERIC(8,2) NOT NULL,
  purchase_cost NUMERIC(14,2) NOT NULL,
  supplier TEXT NOT NULL DEFAULT '',
  purchase_date DATE NOT NULL
);

CREATE TABLE ppf_stock_transactions (
  transaction_id TEXT PRIMARY KEY,
  roll_id TEXT NOT NULL REFERENCES ppf_rolls(roll_id) ON DELETE CASCADE,
  transaction_type ppf_stock_txn_type NOT NULL,
  length_change NUMERIC(8,2) NOT NULL,
  transaction_date DATE NOT NULL,
  reference TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT ''
);

CREATE TABLE ppf_packages (
  package_id TEXT PRIMARY KEY,
  package_name TEXT NOT NULL,
  estimated_film_usage NUMERIC(8,2) NOT NULL,
  estimated_labor_cost NUMERIC(14,2) NOT NULL,
  description TEXT NOT NULL DEFAULT ''
);

CREATE TABLE ppf_job_cards (
  job_id TEXT PRIMARY KEY,
  ppf_customer_id TEXT NOT NULL REFERENCES ppf_customers(ppf_customer_id),
  ppf_vehicle_id TEXT NOT NULL REFERENCES ppf_vehicles(ppf_vehicle_id),
  package_id TEXT NOT NULL REFERENCES ppf_packages(package_id),
  roll_id TEXT NOT NULL REFERENCES ppf_rolls(roll_id),
  installer_name TEXT NOT NULL DEFAULT '',
  booked_date DATE NOT NULL,
  completion_date DATE,
  warranty_period INTEGER NOT NULL DEFAULT 12,
  status ppf_job_status NOT NULL DEFAULT 'booked',
  notes TEXT NOT NULL DEFAULT ''
);

CREATE TABLE ppf_job_materials (
  material_id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL REFERENCES ppf_job_cards(job_id) ON DELETE CASCADE,
  roll_id TEXT NOT NULL REFERENCES ppf_rolls(roll_id),
  meters_used NUMERIC(8,2) NOT NULL,
  material_cost NUMERIC(14,2) NOT NULL
);

CREATE TABLE ppf_job_labor (
  labor_id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL UNIQUE REFERENCES ppf_job_cards(job_id) ON DELETE CASCADE,
  application_cost NUMERIC(14,2) NOT NULL DEFAULT 0,
  polishing_cost NUMERIC(14,2) NOT NULL DEFAULT 0,
  washing_cost NUMERIC(14,2) NOT NULL DEFAULT 0,
  misc_cost NUMERIC(14,2) NOT NULL DEFAULT 0
);

CREATE TABLE ppf_sales (
  ppf_sale_id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL UNIQUE REFERENCES ppf_job_cards(job_id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  total_cost NUMERIC(14,2) NOT NULL,
  discount NUMERIC(14,2) NOT NULL DEFAULT 0,
  final_price NUMERIC(14,2) NOT NULL,
  sale_date DATE NOT NULL
);

CREATE TABLE ppf_payments (
  payment_id TEXT PRIMARY KEY,
  ppf_sale_id TEXT NOT NULL REFERENCES ppf_sales(ppf_sale_id) ON DELETE CASCADE,
  payment_date DATE NOT NULL,
  amount NUMERIC(14,2) NOT NULL,
  payment_method payment_method NOT NULL,
  reference_number TEXT NOT NULL DEFAULT ''
);

CREATE TABLE ppf_warranties (
  warranty_id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL UNIQUE REFERENCES ppf_job_cards(job_id) ON DELETE CASCADE,
  warranty_number TEXT NOT NULL,
  expiry_date DATE NOT NULL,
  terms TEXT NOT NULL DEFAULT ''
);

CREATE TABLE audit_logs (
  log_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES app_users(user_id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address TEXT NOT NULL DEFAULT ''
);

CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_vehicles_make ON vehicles(make);
CREATE INDEX idx_sales_customer ON sales(customer_id);
CREATE INDEX idx_sales_vehicle ON sales(vehicle_id);
CREATE INDEX idx_ppf_jobs_status ON ppf_job_cards(status);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
