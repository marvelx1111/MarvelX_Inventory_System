import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { parseCustomerFormValues } from '@/config/edit-fields';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { store } from '@/data/store';
import type { CustomerType, PaymentMethod } from '@/types';
import { formatPKR } from '@/utils/format';
import { PageTransition } from './PageTransition';
import { usePageLoading } from './hooks/usePageLoading';

const STEPS = ['Select vehicle', 'Select customer', 'Pricing & payment'] as const;

const PAYMENT_OPTIONS = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'online', label: 'Online' },
];

const CUSTOMER_TYPE_OPTIONS = [
  { value: 'individual', label: 'Individual' },
  { value: 'dealer', label: 'Dealer' },
  { value: 'corporate', label: 'Corporate' },
];

const EMPTY_NEW_CUSTOMER = {
  customer_type: 'individual' as CustomerType,
  full_name: '',
  cnic: '',
  mobile: '',
  whatsapp: '',
  email: '',
  address: '',
  city: 'Lahore',
  remarks: '',
};

export function SaleCreatePage() {
  const loading = usePageLoading();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error } = useToast();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const [vehicleId, setVehicleId] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState(EMPTY_NEW_CUSTOMER);

  const [saleDate, setSaleDate] = useState(new Date().toISOString().slice(0, 10));
  const [sellingPrice, setSellingPrice] = useState('');
  const [paymentReceived, setPaymentReceived] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer');
  const [saleRemarks, setSaleRemarks] = useState('');

  const availableVehicles = store.getVehicles().filter((v) => v.status === 'in_stock');
  const customers = store.getCustomers();
  const selectedVehicle = store.getVehicleById(vehicleId);
  const selectedCustomer = store.getCustomerById(customerId);

  const totalCost = selectedVehicle?.total_cost ?? 0;
  const sellingAmount = Number(sellingPrice) || 0;
  const paymentAmount = Math.min(Number(paymentReceived) || 0, sellingAmount);
  const customerOwed = Math.max(0, sellingAmount - paymentAmount);
  const isLossSale = sellingAmount > 0 && sellingAmount < totalCost;
  const remainingBalance = isLossSale
    ? Math.max(0, totalCost - paymentAmount)
    : customerOwed;
  const profit = selectedVehicle ? sellingAmount - totalCost : 0;
  const isFullPayment = sellingAmount > 0 && paymentAmount >= sellingAmount;
  const remainingLabel = isLossSale ? 'Remaining to break even' : 'Remaining balance';

  const canProceed = useMemo(() => {
    if (step === 0) return !!vehicleId;
    if (step === 1) {
      return showNewCustomer
        ? !!newCustomer.full_name.trim() && !!newCustomer.mobile.trim()
        : !!customerId;
    }
    return !!sellingPrice && Number(sellingPrice) > 0;
  }, [step, vehicleId, customerId, showNewCustomer, newCustomer, sellingPrice]);

  const handleNext = async () => {
    if (!canProceed) {
      error('Incomplete step', 'Please complete the current step before continuing');
      return;
    }

    if (step === 1 && showNewCustomer) {
      try {
        const created = await store.createCustomer(parseCustomerFormValues(newCustomer));
        store.addAuditLog({
          user_id: user?.user_id ?? 'usr_001',
          action: 'CREATE',
          table_name: 'customers',
          record_id: created.customer_id,
          ip_address: '127.0.0.1',
        });
        setCustomerId(created.customer_id);
        setShowNewCustomer(false);
        setNewCustomer(EMPTY_NEW_CUSTOMER);
        success('Customer added', `${created.full_name} selected for this sale.`);
      } catch (err) {
        error('Could not add customer', err instanceof Error ? err.message : 'Save failed.');
        return;
      }
    }

    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const handleSubmit = () => {
    if (!selectedVehicle || !customerId) return;

    if (paymentAmount > sellingAmount) {
      error('Payment too high', `Payment received cannot exceed selling price of ${formatPKR(sellingAmount)}`);
      return;
    }

    setSubmitting(true);
    void (async () => {
      try {
        const sale = store.createSale({
          vehicle_id: vehicleId,
          customer_id: customerId,
          sale_date: saleDate,
          sale_price: sellingAmount,
          discount: 0,
          advance: paymentAmount,
          payment_method: paymentMethod,
          salesperson: user?.full_name ?? 'Staff',
          remarks: saleRemarks,
        });

        if (!sale) {
          error('Sale failed', 'Unable to create sale. Vehicle may already be sold.');
          return;
        }

        store.addAuditLog({
          user_id: user?.user_id ?? 'usr_001',
          action: 'CREATE',
          table_name: 'sales',
          record_id: sale.sale_id,
          ip_address: '127.0.0.1',
        });

        success('Sale created', `Sale ${sale.sale_id} recorded successfully`);
        navigate(`/sales/${sale.sale_id}`);
      } catch (err) {
        error('Sale failed', err instanceof Error ? err.message : 'Could not save sale.');
      } finally {
        setSubmitting(false);
      }
    })();
  };

  if (loading) {
    return (
      <PageTransition>
        <SkeletonCard />
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <PageHeader
        title="New Sale"
        subtitle="Create a vehicle sale in three simple steps"
        printable={false}
        actions={
          <Button variant="secondary" onClick={() => navigate('/sales')}>
            Cancel
          </Button>
        }
      />

      <div className="mb-8 flex items-center gap-2 sm:gap-4">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 items-center gap-2">
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                i <= step
                  ? 'bg-accent text-white'
                  : 'bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]'
              }`}
            >
              {i + 1}
            </div>
            <span
              className={`hidden text-sm font-medium sm:inline ${
                i <= step ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'
              }`}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <div
                className={`hidden h-0.5 flex-1 sm:block ${
                  i < step ? 'bg-accent' : 'bg-[var(--border-primary)]'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <Card padding="md" className="max-w-3xl">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="step-0"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <CardHeader>
                <CardTitle>Select a vehicle</CardTitle>
              </CardHeader>
              <CardContent>
                {availableVehicles.length === 0 ? (
                  <p className="text-sm text-[var(--text-tertiary)]">
                    No vehicles in stock. Record a purchase first.
                  </p>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {availableVehicles.map((v) => (
                      <button
                        key={v.vehicle_id}
                        type="button"
                        onClick={() => setVehicleId(v.vehicle_id)}
                        className={`rounded-lg border p-3 text-left transition-all ${
                          vehicleId === v.vehicle_id
                            ? 'border-accent bg-[var(--bg-active)] ring-2 ring-accent/20'
                            : 'border-[var(--border-primary)] hover:border-accent/40'
                        }`}
                      >
                        <p className="font-mono text-xs text-[var(--text-tertiary)]">{v.stock_number}</p>
                        <p className="font-medium text-[var(--text-primary)]">
                          {v.make} {v.model} {v.model_year}
                        </p>
                        <p className="mt-1 text-sm text-[var(--text-secondary)]">
                          Total cost (incl. expenses) {formatPKR(v.total_cost)}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Select customer</CardTitle>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowNewCustomer((prev) => !prev);
                    if (showNewCustomer) setCustomerId('');
                  }}
                >
                  {showNewCustomer ? 'Choose existing' : '+ New customer'}
                </Button>
              </CardHeader>
              <CardContent>
                {showNewCustomer ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Select
                      label="Type"
                      value={newCustomer.customer_type}
                      onChange={(e) =>
                        setNewCustomer((p) => ({ ...p, customer_type: e.target.value as CustomerType }))
                      }
                      options={CUSTOMER_TYPE_OPTIONS}
                    />
                    <Input
                      label="Full name"
                      required
                      value={newCustomer.full_name}
                      onChange={(e) => setNewCustomer((p) => ({ ...p, full_name: e.target.value }))}
                    />
                    <Input
                      label="CNIC"
                      value={newCustomer.cnic}
                      onChange={(e) => setNewCustomer((p) => ({ ...p, cnic: e.target.value }))}
                    />
                    <Input
                      label="Mobile"
                      required
                      value={newCustomer.mobile}
                      onChange={(e) => setNewCustomer((p) => ({ ...p, mobile: e.target.value }))}
                    />
                    <Input
                      label="WhatsApp"
                      type="tel"
                      value={newCustomer.whatsapp}
                      onChange={(e) => setNewCustomer((p) => ({ ...p, whatsapp: e.target.value }))}
                    />
                    <Input
                      label="Email"
                      type="email"
                      value={newCustomer.email}
                      onChange={(e) => setNewCustomer((p) => ({ ...p, email: e.target.value }))}
                    />
                    <Input
                      label="City"
                      value={newCustomer.city}
                      onChange={(e) => setNewCustomer((p) => ({ ...p, city: e.target.value }))}
                    />
                    <div className="sm:col-span-2">
                      <Textarea
                        label="Address"
                        rows={2}
                        value={newCustomer.address}
                        onChange={(e) => setNewCustomer((p) => ({ ...p, address: e.target.value }))}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Textarea
                        label="Remarks"
                        rows={2}
                        value={newCustomer.remarks}
                        onChange={(e) => setNewCustomer((p) => ({ ...p, remarks: e.target.value }))}
                        placeholder="Notes about this customer"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {customers.map((c) => (
                      <button
                        key={c.customer_id}
                        type="button"
                        onClick={() => setCustomerId(c.customer_id)}
                        className={`rounded-lg border p-3 text-left transition-all ${
                          customerId === c.customer_id
                            ? 'border-accent bg-[var(--bg-active)] ring-2 ring-accent/20'
                            : 'border-[var(--border-primary)] hover:border-accent/40'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-[var(--text-primary)]">{c.full_name}</span>
                          <Badge variant="default">{c.customer_type}</Badge>
                        </div>
                        <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">
                          {c.mobile} · {c.city}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <CardHeader>
                <CardTitle>Pricing & payment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedVehicle && (
                  <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-tertiary)] p-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
                          Total cost (incl. expenses)
                        </p>
                        <p className="mt-1 text-lg font-bold text-[var(--text-primary)]">
                          {formatPKR(totalCost)}
                        </p>
                      </div>
                      {selectedCustomer && (
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
                            Buyer
                          </p>
                          <p className="mt-1 text-lg font-bold text-[var(--text-primary)]">
                            {selectedCustomer.full_name}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Sale date"
                    type="date"
                    value={saleDate}
                    onChange={(e) => setSaleDate(e.target.value)}
                  />
                  <Select
                    label="Payment method"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    options={PAYMENT_OPTIONS}
                  />
                  <Input
                    label="Selling price (PKR)"
                    type="number"
                    required
                    min={0}
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    hint="Price you are selling the car for"
                  />
                  <Input
                    label="Payment received (PKR)"
                    type="number"
                    min={0}
                    value={paymentReceived}
                    onChange={(e) => setPaymentReceived(e.target.value)}
                    placeholder="Optional"
                    hint={
                      paymentReceived === ''
                        ? 'Leave empty if no payment yet — you can update this later'
                        : isFullPayment
                          ? 'Full payment received'
                          : `Remaining after this payment: ${formatPKR(customerOwed)}`
                    }
                  />
                </div>

                <Textarea
                  label="Remarks"
                  rows={2}
                  value={saleRemarks}
                  onChange={(e) => setSaleRemarks(e.target.value)}
                  placeholder="Notes about this sale"
                />

                <div className="grid gap-3 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] p-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-[var(--text-tertiary)]">Total cost (incl. expenses)</p>
                    <p className="text-lg font-bold text-[var(--text-primary)]">{formatPKR(totalCost)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-tertiary)]">Selling price</p>
                    <p className="text-lg font-bold text-emerald-600">{formatPKR(sellingAmount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-tertiary)]">Payment received</p>
                    <p className="text-lg font-bold text-emerald-600">
                      {paymentAmount > 0 ? formatPKR(paymentAmount) : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-tertiary)]">{remainingLabel}</p>
                    <p className={`text-lg font-bold ${remainingBalance > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {formatPKR(remainingBalance)}
                    </p>
                  </div>
                  {sellingAmount > 0 && (
                    <div className="sm:col-span-2 border-t border-[var(--border-secondary)] pt-3">
                      <p className="text-xs text-[var(--text-tertiary)]">Estimated profit</p>
                      <p className={`text-lg font-bold ${profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {formatPKR(profit)}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-6 flex justify-between border-t border-[var(--border-secondary)] pt-4">
          <Button
            variant="secondary"
            onClick={() => setStep((s) => Math.max(s - 1, 0))}
            disabled={step === 0}
          >
            Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={() => void handleNext()} disabled={!canProceed}>
              Continue
            </Button>
          ) : (
            <Button onClick={handleSubmit} loading={submitting} disabled={!canProceed}>
              Create sale
            </Button>
          )}
        </div>
      </Card>
    </PageTransition>
  );
}
