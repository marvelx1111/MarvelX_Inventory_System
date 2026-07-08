import type { BiometricStatus, PaymentMethod, PPFJobStatus, PermissionModule, VehicleStatus } from '@/types';

export interface NavItem {
  label: string;
  href: string;
  module: PermissionModule;
  icon: 'dashboard' | 'inventory' | 'purchases' | 'sales' | 'customers' | 'expenses' | 'investors' | 'ppf' | 'users' | 'audit';
  description?: string;
}

export const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/',
    module: 'dashboard',
    icon: 'dashboard',
    description: 'Overview and analytics',
  },
  {
    label: 'Inventory',
    href: '/inventory',
    module: 'inventory',
    icon: 'inventory',
    description: 'Vehicle stock management',
  },
  {
    label: 'Purchases',
    href: '/purchases',
    module: 'purchases',
    icon: 'purchases',
    description: 'Vehicle acquisitions',
  },
  {
    label: 'Sales',
    href: '/sales',
    module: 'sales',
    icon: 'sales',
    description: 'Sales and deliveries',
  },
  {
    label: 'Customers',
    href: '/customers',
    module: 'customers',
    icon: 'customers',
    description: 'Customer directory',
  },
  {
    label: 'Expenses',
    href: '/expenses',
    module: 'expenses',
    icon: 'expenses',
    description: 'Showroom and vehicle costs',
  },
  {
    label: 'Investors',
    href: '/investors',
    module: 'investors',
    icon: 'investors',
    description: 'Investor management',
  },
  {
    label: 'PPF Studio',
    href: '/ppf',
    module: 'ppf',
    icon: 'ppf',
    description: 'Paint protection film jobs',
  },
  {
    label: 'Users',
    href: '/users',
    module: 'users',
    icon: 'users',
    description: 'Team and roles',
  },
  {
    label: 'User Activity',
    href: '/audit',
    module: 'audit',
    icon: 'audit',
    description: 'User activity trail',
  },
];

export const VEHICLE_STATUS_CONFIG: Record<
  VehicleStatus,
  { label: string; color: string; bgColor: string; dotColor: string }
> = {
  in_stock: {
    label: 'In Stock',
    color: 'text-emerald-700 dark:text-emerald-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/40',
    dotColor: 'bg-emerald-500',
  },
  booked: {
    label: 'Booked',
    color: 'text-amber-700 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-950/40',
    dotColor: 'bg-amber-500',
  },
  sold: {
    label: 'Sold',
    color: 'text-zinc-600 dark:text-zinc-400',
    bgColor: 'bg-zinc-100 dark:bg-zinc-800/60',
    dotColor: 'bg-zinc-400',
  },
};

export const PPF_STATUS_CONFIG: Record<
  PPFJobStatus,
  { label: string; color: string; bgColor: string; dotColor: string }
> = {
  booked: {
    label: 'Booked',
    color: 'text-blue-700 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/40',
    dotColor: 'bg-blue-500',
  },
  in_progress: {
    label: 'In Progress',
    color: 'text-amber-700 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-950/40',
    dotColor: 'bg-amber-500',
  },
  completed: {
    label: 'Completed',
    color: 'text-emerald-700 dark:text-emerald-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/40',
    dotColor: 'bg-emerald-500',
  },
  delivered: {
    label: 'Delivered',
    color: 'text-red-700 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-950/40',
    dotColor: 'bg-red-600',
  },
};

export const BIOMETRIC_OPTIONS: { value: BiometricStatus; label: string }[] = [
  { value: 'not_taken', label: 'Not Taken' },
  { value: 'done', label: 'Done' },
  { value: 'open_bio', label: 'Open Bio' },
  { value: 'isb_no_bio', label: 'ISB — No Bio Before Inspection' },
];

export const BIOMETRIC_STATUS_CONFIG: Record<
  BiometricStatus,
  { label: string; color: string; bgColor: string; dotColor: string }
> = {
  done: {
    label: 'Biometric Done',
    color: 'text-emerald-700 dark:text-emerald-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/40',
    dotColor: 'bg-emerald-500',
  },
  not_taken: {
    label: 'Not Taken',
    color: 'text-zinc-600 dark:text-zinc-400',
    bgColor: 'bg-zinc-100 dark:bg-zinc-800/60',
    dotColor: 'bg-zinc-400',
  },
  open_bio: {
    label: 'Open Bio',
    color: 'text-amber-700 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-950/40',
    dotColor: 'bg-amber-500',
  },
  isb_no_bio: {
    label: 'ISB — No Bio Before Inspection',
    color: 'text-blue-700 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/40',
    dotColor: 'bg-blue-500',
  },
};

export const DOCUMENT_CHECKLIST_ITEMS: { key: string; label: string }[] = [
  { key: 'original_file', label: 'Original File' },
  { key: 'registration_book', label: 'Registration Book' },
  { key: 'tax_token', label: 'Tax Token' },
  { key: 'spare_key', label: 'Spare Key' },
  { key: 'spare_wheel', label: 'Spare Wheel' },
  { key: 'tool_kit', label: 'Tool Kit' },
  { key: 'user_manual', label: 'User Manual' },
  { key: 'insurance', label: 'Insurance' },
];

export const BRAND = {
  name: 'Marvel X',
  tagline: 'Dealership ERP',
  accent: '#CD1719',
} as const;

export const PAYMENT_METHOD_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cheque', label: 'Check/PO' },
  { value: 'online', label: 'Online' },
];

export function formatPaymentMethod(method: PaymentMethod | string): string {
  if (method === 'cheque') return 'Check/PO';
  return method
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
