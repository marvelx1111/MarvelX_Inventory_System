import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton';
import { Textarea } from '@/components/ui/Textarea';
import { EditRecordModal } from '@/components/ui/EditRecordModal';
import {
  CUSTOMER_DEALER_DEFAULT_VALUES,
  CUSTOMER_EDIT_FIELDS,
  parseCustomerFormValues,
} from '@/config/edit-fields';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { store } from '@/data/store';
import type { BiometricStatus, CustomerType, PaymentMethod } from '@/types';
import { BIOMETRIC_OPTIONS, DOCUMENT_CHECKLIST_ITEMS, PAYMENT_METHOD_OPTIONS } from '@/utils/constants';
import { cn, formatDate, formatPKR } from '@/utils/format';
import { PageTransition } from './PageTransition';
import { usePageLoading } from './hooks/usePageLoading';

const FUEL_OPTIONS = [
  { value: 'Petrol', label: 'Petrol' },
  { value: 'Diesel', label: 'Diesel' },
  { value: 'Hybrid', label: 'Hybrid' },
  { value: 'Electric', label: 'Electric' },
];

const TRANSMISSION_OPTIONS = [
  { value: 'Automatic', label: 'Automatic' },
  { value: 'Manual', label: 'Manual' },
  { value: 'CVT', label: 'CVT' },
];

const TYPE_LABEL: Record<CustomerType, string> = {
  individual: 'Individual',
  dealer: 'Dealer',
  corporate: 'Corporate',
};

const initialForm = {
  seller_customer_id: '',
  purchase_date: new Date().toISOString().slice(0, 10),
  purchase_price: '',
  payment_method: 'bank_transfer' as PaymentMethod,
  reference_number: '',
  notes: '',
  make: '',
  model: '',
  variant: '',
  model_year: String(new Date().getFullYear()),
  registration_number: '',
  registration_city: 'Lahore',
  engine_number: '',
  chassis_number: '',
  color: '',
  mileage: '',
  fuel_type: 'Petrol',
  transmission: 'Automatic',
};

const initialDocForm = {
  biometric_status: 'not_taken' as BiometricStatus,
  original_file: false,
  registration_book: false,
  tax_token: false,
  spare_key: false,
  spare_wheel: false,
  tool_kit: false,
  user_manual: false,
  insurance: false,
};

export function PurchasesPage() {
  const loading = usePageLoading();
  const { user } = useAuth();
  const { success, error } = useToast();
  const [form, setForm] = useState(initialForm);
  const [docForm, setDocForm] = useState(initialDocForm);
  const [submitting, setSubmitting] = useState(false);
  const [createSellerOpen, setCreateSellerOpen] = useState(false);
  const [creatingSeller, setCreatingSeller] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  void refreshKey;

  useEffect(() => store.subscribe(() => setRefreshKey((n) => n + 1)), []);

  const customers = store.getSelectableCustomers();
  const purchases = [...store.getPurchases()]
    .sort((a, b) => new Date(b.purchase_date).getTime() - new Date(a.purchase_date).getTime())
    .slice(0, 10);

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateSeller = async (values: Record<string, string>) => {
    setCreatingSeller(true);
    try {
      const created = await store.createCustomer(parseCustomerFormValues(values));
      store.addAuditLog({
        user_id: user?.user_id ?? 'usr_001',
        action: 'CREATE',
        table_name: 'customers',
        record_id: created.customer_id,
        ip_address: '127.0.0.1',
      });
      update('seller_customer_id', created.customer_id);
      setCreateSellerOpen(false);
      success('Seller added', `${created.full_name} is ready to select as seller.`);
      setRefreshKey((n) => n + 1);
    } catch (err) {
      error('Could not add seller', err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setCreatingSeller(false);
    }
  };

  const toggleDoc = (key: keyof typeof initialDocForm) => {
    setDocForm((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.seller_customer_id || !form.make || !form.model || !form.purchase_price) {
      if (!form.seller_customer_id && customers.length === 0) {
        error('Add a seller first', 'Click “Add your first seller/dealer” before recording a purchase.');
        setCreateSellerOpen(true);
        return;
      }
      error('Missing fields', 'Please fill in seller, make, model, and purchase price.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await store.createPurchase({
        seller_customer_id: form.seller_customer_id,
        purchase_date: form.purchase_date,
        purchase_price: Number(form.purchase_price),
        payment_method: form.payment_method,
        reference_number: form.reference_number,
        notes: form.notes,
        vehicle: {
          make: form.make,
          model: form.model,
          variant: form.variant,
          model_year: Number(form.model_year),
          registration_number: form.registration_number,
          registration_city: form.registration_city,
          engine_number: form.engine_number,
          chassis_number: form.chassis_number,
          color: form.color,
          mileage: Number(form.mileage) || 0,
          fuel_type: form.fuel_type,
          transmission: form.transmission,
          purchase_price: Number(form.purchase_price),
          purchase_date: form.purchase_date,
        },
        document: {
          biometric_status: docForm.biometric_status,
          original_file: docForm.original_file,
          registration_book: docForm.registration_book,
          tax_token: docForm.tax_token,
          spare_key: docForm.spare_key,
          spare_wheel: docForm.spare_wheel,
          tool_kit: docForm.tool_kit,
          user_manual: docForm.user_manual,
          insurance: docForm.insurance,
        },
      });

      store.addAuditLog({
        user_id: user?.user_id ?? 'usr_001',
        action: 'CREATE',
        table_name: 'purchases',
        record_id: result.purchase.purchase_id,
        ip_address: '127.0.0.1',
      });

      success(
        'Purchase recorded',
        `${result.vehicle.make} ${result.vehicle.model} added as ${result.vehicle.stock_number}`,
      );
      setForm(initialForm);
      setDocForm(initialDocForm);
      setRefreshKey((n) => n + 1);
    } catch (err) {
      error('Could not save purchase', err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <PageTransition>
        <Skeleton className="mb-6 h-10 w-48" />
        <SkeletonCard />
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <PageHeader
        title="Purchases"
        subtitle="Record vehicle acquisitions from sellers"
        actions={
          <Link to="/inventory">
            <Button variant="secondary">View inventory</Button>
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <Card padding="md" className="no-print lg:col-span-3">
          <CardHeader>
            <CardTitle>New Purchase</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  Seller (Customer / Dealer)
                </p>
                {customers.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-[var(--border-primary)] bg-[var(--bg-secondary)] px-4 py-5 text-center">
                    <p className="text-sm text-[var(--text-secondary)]">
                      No sellers or dealers yet. Add one to record a purchase.
                    </p>
                    <Button
                      type="button"
                      className="mt-3"
                      onClick={() => setCreateSellerOpen(true)}
                    >
                      + Add your first seller/dealer
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                    <div className="flex-1">
                      <Select
                        label=""
                        value={form.seller_customer_id}
                        onChange={(e) => update('seller_customer_id', e.target.value)}
                        placeholder="Select seller"
                        hint="Choose who you bought this vehicle from"
                        options={customers.map((c) => ({
                          value: c.customer_id,
                          label: `${c.full_name} · ${TYPE_LABEL[c.customer_type] ?? c.customer_type} · ${c.city}`,
                        }))}
                      />
                    </div>
                    <Button type="button" variant="secondary" onClick={() => setCreateSellerOpen(true)}>
                      + Add seller/dealer
                    </Button>
                  </div>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Purchase date"
                  type="date"
                  value={form.purchase_date}
                  onChange={(e) => update('purchase_date', e.target.value)}
                />
                <Input
                  label="Purchase price (PKR)"
                  type="number"
                  min={0}
                  value={form.purchase_price}
                  onChange={(e) => update('purchase_price', e.target.value)}
                />
                <Select
                  label="Payment method"
                  value={form.payment_method}
                  onChange={(e) => update('payment_method', e.target.value)}
                  options={PAYMENT_METHOD_OPTIONS}
                />
                <Input
                  label="Reference number"
                  value={form.reference_number}
                  onChange={(e) => update('reference_number', e.target.value)}
                />
              </div>

              <div className="border-t border-[var(--border-secondary)] pt-4">
                <p className="mb-3 text-sm font-medium text-[var(--text-primary)]">Vehicle details</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input label="Make" value={form.make} onChange={(e) => update('make', e.target.value)} />
                  <Input label="Model" value={form.model} onChange={(e) => update('model', e.target.value)} />
                  <Input label="Variant" value={form.variant} onChange={(e) => update('variant', e.target.value)} />
                  <Input
                    label="Model year"
                    type="number"
                    value={form.model_year}
                    onChange={(e) => update('model_year', e.target.value)}
                  />
                  <Input
                    label="Registration number"
                    value={form.registration_number}
                    onChange={(e) => update('registration_number', e.target.value)}
                  />
                  <Input
                    label="Registration city"
                    value={form.registration_city}
                    onChange={(e) => update('registration_city', e.target.value)}
                  />
                  <Input label="Color" value={form.color} onChange={(e) => update('color', e.target.value)} />
                  <Input
                    label="Mileage (km)"
                    type="number"
                    value={form.mileage}
                    onChange={(e) => update('mileage', e.target.value)}
                  />
                  <Select
                    label="Fuel type"
                    value={form.fuel_type}
                    onChange={(e) => update('fuel_type', e.target.value)}
                    options={FUEL_OPTIONS}
                  />
                  <Select
                    label="Transmission"
                    value={form.transmission}
                    onChange={(e) => update('transmission', e.target.value)}
                    options={TRANSMISSION_OPTIONS}
                  />
                  <Input
                    label="Engine number"
                    value={form.engine_number}
                    onChange={(e) => update('engine_number', e.target.value)}
                  />
                  <Input
                    label="Chassis number"
                    value={form.chassis_number}
                    onChange={(e) => update('chassis_number', e.target.value)}
                  />
                </div>
              </div>

              <div className="border-t border-[var(--border-secondary)] pt-4">
                <p className="mb-1 text-sm font-medium text-[var(--text-primary)]">
                  Document checklist
                </p>
                <p className="mb-3 text-xs text-[var(--text-tertiary)]">
                  Mark items received with the vehicle. You can update these later from the vehicle
                  page.
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {DOCUMENT_CHECKLIST_ITEMS.map((item) => {
                    const checked = docForm[item.key as keyof typeof initialDocForm] as boolean;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => toggleDoc(item.key as keyof typeof initialDocForm)}
                        aria-pressed={checked}
                        className={cn(
                          'flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors',
                          checked
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : 'border-[var(--border-primary)] bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:border-[var(--border-secondary)]',
                        )}
                      >
                        <span
                          className={cn(
                            'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold text-white',
                            checked
                              ? 'border-emerald-500 bg-emerald-500'
                              : 'border-[var(--border-primary)] bg-transparent',
                          )}
                        >
                          {checked ? '✓' : ''}
                        </span>
                        {item.label}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 max-w-xs">
                  <Select
                    label="Biometric"
                    value={docForm.biometric_status}
                    onChange={(e) =>
                      setDocForm((prev) => ({
                        ...prev,
                        biometric_status: e.target.value as BiometricStatus,
                      }))
                    }
                    options={BIOMETRIC_OPTIONS}
                  />
                </div>
              </div>

              <Textarea
                label="Notes"
                value={form.notes}
                onChange={(e) => update('notes', e.target.value)}
                rows={2}
              />

              <Button type="submit" loading={submitting}>
                Record purchase
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card padding="none" className="lg:col-span-2 overflow-hidden">
          <CardHeader className="border-b border-[var(--border-secondary)] px-5 py-4">
            <CardTitle>Recent Purchases</CardTitle>
          </CardHeader>
          <CardContent className="max-h-[600px] overflow-y-auto p-0">
            {purchases.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-[var(--text-tertiary)]">
                No purchases yet
              </p>
            ) : (
              <ul className="divide-y divide-[var(--border-secondary)]">
                {purchases.map((purchase, i) => {
                  const vehicle = store.getVehicles().find((v) => v.purchase_id === purchase.purchase_id);
                  const seller = store.getCustomerById(purchase.seller_customer_id);
                  return (
                    <motion.li
                      key={purchase.purchase_id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="px-5 py-4"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          {vehicle ? (
                            <Link
                              to={`/inventory/${vehicle.vehicle_id}`}
                              className="font-medium text-[var(--text-primary)] hover:text-accent"
                            >
                              {vehicle.make} {vehicle.model}
                            </Link>
                          ) : (
                            <span className="font-medium">{purchase.purchase_id}</span>
                          )}
                          <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">
                            {formatDate(purchase.purchase_date)} · {seller?.full_name ?? 'Unknown'}
                          </p>
                        </div>
                        <Badge variant="accent">{formatPKR(purchase.purchase_price)}</Badge>
                      </div>
                      {vehicle && (
                        <p className="mt-1 font-mono text-xs text-[var(--text-tertiary)]">
                          {vehicle.stock_number}
                        </p>
                      )}
                    </motion.li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <EditRecordModal
        open={createSellerOpen}
        onClose={() => setCreateSellerOpen(false)}
        title="Add seller / dealer"
        description="Enter dealer contact details — WhatsApp and address are below Mobile."
        fields={CUSTOMER_EDIT_FIELDS}
        values={CUSTOMER_DEALER_DEFAULT_VALUES}
        onSave={handleCreateSeller}
        saving={creatingSeller}
        size="xl"
        saveLabel="Add seller"
      />
    </PageTransition>
  );
}
