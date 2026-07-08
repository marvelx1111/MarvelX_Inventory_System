import type { EditFieldConfig } from '@/components/ui/EditRecordModal';

export const CUSTOMER_EDIT_FIELDS: EditFieldConfig[] = [
  { key: 'full_name', label: 'Full name', required: true },
  {
    key: 'customer_type',
    label: 'Customer type',
    type: 'select',
    required: true,
    options: [
      { value: 'individual', label: 'Individual' },
      { value: 'dealer', label: 'Dealer' },
      { value: 'corporate', label: 'Corporate' },
    ],
  },
  { key: 'cnic', label: 'CNIC', placeholder: '35202-1234567-1' },
  { key: 'mobile', label: 'Mobile', type: 'tel', required: true },
  { key: '_contact_heading', label: 'WhatsApp & address', type: 'heading' },
  { key: 'whatsapp', label: 'WhatsApp', type: 'tel', placeholder: '03xx-xxxxxxx' },
  { key: 'address', label: 'Address', type: 'textarea', rows: 2, placeholder: 'Street, area, city' },
  { key: 'email', label: 'Email', type: 'email' },
  { key: 'city', label: 'City', required: true },
  { key: 'remarks', label: 'Remarks', type: 'textarea', rows: 2 },
];

export const VEHICLE_EDIT_FIELDS: EditFieldConfig[] = [
  { key: 'make', label: 'Make', required: true },
  { key: 'model', label: 'Model', required: true },
  { key: 'variant', label: 'Variant' },
  { key: 'model_year', label: 'Model year', type: 'number', required: true },
  { key: 'registration_number', label: 'Registration number' },
  { key: 'registration_city', label: 'Registration city' },
  { key: 'color', label: 'Color' },
  { key: 'mileage', label: 'Mileage (km)', type: 'number' },
  { key: 'fuel_type', label: 'Fuel type' },
  { key: 'transmission', label: 'Transmission' },
  { key: 'engine_number', label: 'Engine number' },
  { key: 'chassis_number', label: 'Chassis number' },
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { value: 'in_stock', label: 'In Stock' },
      { value: 'booked', label: 'Booked' },
      { value: 'sold', label: 'Sold' },
    ],
  },
];

export const SALE_EDIT_FIELDS: EditFieldConfig[] = [
  { key: 'sale_date', label: 'Sale date', type: 'date', required: true },
  { key: 'sale_price', label: 'Selling price (PKR)', type: 'number', required: true },
  { key: 'discount', label: 'Discount (PKR)', type: 'number' },
  { key: 'advance', label: 'Token / advance (PKR)', type: 'number' },
  { key: 'salesperson', label: 'Salesperson', required: true },
  {
    key: 'payment_method',
    label: 'Payment method',
    type: 'select',
    options: [
      { value: 'cash', label: 'Cash' },
      { value: 'bank_transfer', label: 'Bank Transfer' },
      { value: 'cheque', label: 'Cheque' },
      { value: 'online', label: 'Online' },
    ],
  },
  { key: 'remarks', label: 'Remarks', type: 'textarea', rows: 2, fullWidth: true },
];

export const DELIVERY_EDIT_FIELDS: EditFieldConfig[] = [
  { key: 'delivery_date', label: 'Delivery date', type: 'date', required: true },
  { key: 'delivered_by', label: 'Delivered by', required: true },
  { key: 'receiver_name', label: 'Receiver name', required: true },
  { key: 'receiver_cnic', label: 'Receiver CNIC', placeholder: '35202-1234567-1' },
  { key: 'remarks', label: 'Remarks', type: 'textarea', rows: 2 },
];

export const INVESTOR_EDIT_FIELDS: EditFieldConfig[] = [
  { key: 'full_name', label: 'Full name', required: true },
  { key: 'cnic', label: 'CNIC' },
  { key: 'mobile', label: 'Mobile', type: 'tel' },
  { key: 'email', label: 'Email', type: 'email' },
  { key: 'address', label: 'Address', type: 'textarea', rows: 2 },
  { key: 'join_date', label: 'Join date', type: 'date', required: true },
];

export const PPF_CUSTOMER_EDIT_FIELDS: EditFieldConfig[] = [
  { key: 'full_name', label: 'Full name', required: true },
  { key: 'mobile', label: 'Mobile', type: 'tel', required: true },
  { key: 'whatsapp', label: 'WhatsApp', type: 'tel' },
  { key: 'email', label: 'Email', type: 'email' },
  { key: 'address', label: 'Address', type: 'textarea', rows: 2 },
  { key: 'city', label: 'City', required: true },
];

export const PPF_JOB_EDIT_FIELDS: EditFieldConfig[] = [
  { key: 'installer_name', label: 'Installer name', required: true },
  { key: 'booked_date', label: 'Booked date', type: 'date', required: true },
  { key: 'completion_date', label: 'Completion date', type: 'date' },
  { key: 'warranty_period', label: 'Warranty (months)', type: 'number' },
  { key: 'notes', label: 'Notes', type: 'textarea', rows: 3 },
];

export function customerToFormValues(customer: {
  full_name: string;
  customer_type: string;
  cnic: string;
  mobile: string;
  whatsapp: string;
  email: string;
  address: string;
  city: string;
  remarks: string;
}): Record<string, string> {
  return {
    full_name: customer.full_name,
    customer_type: customer.customer_type,
    cnic: customer.cnic,
    mobile: customer.mobile,
    whatsapp: customer.whatsapp,
    email: customer.email,
    address: customer.address,
    city: customer.city,
    remarks: customer.remarks,
  };
}

export const CUSTOMER_CREATE_DEFAULT_VALUES: Record<string, string> = {
  full_name: '',
  customer_type: 'individual',
  cnic: '',
  mobile: '',
  whatsapp: '',
  email: '',
  address: '',
  city: 'Lahore',
  remarks: '',
};

export const CUSTOMER_DEALER_DEFAULT_VALUES: Record<string, string> = {
  ...CUSTOMER_CREATE_DEFAULT_VALUES,
  customer_type: 'dealer',
};

export function parseCustomerFormValues(values: Record<string, string>) {
  return {
    full_name: values.full_name.trim(),
    customer_type: values.customer_type.trim() as 'individual' | 'dealer' | 'corporate',
    cnic: values.cnic.trim(),
    mobile: values.mobile.trim(),
    whatsapp: values.whatsapp.trim(),
    email: values.email.trim(),
    address: values.address.trim(),
    city: values.city.trim(),
    remarks: values.remarks.trim(),
  };
}
