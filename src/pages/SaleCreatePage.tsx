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
  const [newCustomer, setNewCustomer] = useState({
    customer_type: 'individual' as CustomerType,
    full_name: '',
    cnic: '',
    mobile: '',
    whatsapp: '',
    email: '',
    address: '',
    city: 'Lahore',
    remarks: '',
  });

  const [saleDate, setSaleDate] = useState(new Date().toISOString().slice(0, 10));
  const [salePrice, setSalePrice] = useState('');
  const [discount, setDiscount] = useState('0');
  const [advance, setAdvance] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer');

  const availableVehicles = store.getVehicles().filter((v) => v.status === 'in_stock');
  const customers = store.getCustomers();
  const selectedVehicle = store.getVehicleById(vehicleId);
  const selectedCustomer = store.getCustomerById(customerId);

  const netPrice = Number(salePrice) - Number(discount);
  const balance = Math.max(0, netPrice - Number(advance));
  const profit = selectedVehicle ? netPrice - selectedVehicle.total_cost : 0;

  const canProceed = useMemo(() => {
    if (step === 0) return !!vehicleId;
    if (step === 1) return showNewCustomer ? !!newCustomer.full_name && !!newCustomer.mobile : !!customerId;
    return !!salePrice && Number(salePrice) > 0;
  }, [step, vehicleId, customerId, showNewCustomer, newCustomer, salePrice]);

  const handleNext = () => {
    if (!canProceed) {
      error('Incomplete step', 'Please complete the current step before continuing');
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const handleSubmit = () => {
    if (!selectedVehicle) return;

    setSubmitting(true);
    void (async () => {
      try {
        let finalCustomerId = customerId;

        if (showNewCustomer) {
          const created = await store.createCustomer(newCustomer);
          finalCustomerId = created.customer_id;
        }

        const sale = store.createSale({
          vehicle_id: vehicleId,
          customer_id: finalCustomerId,
          sale_date: saleDate,
          sale_price: Number(salePrice),
          discount: Number(discount),
          advance: Number(advance),
          payment_method: paymentMethod,
          salesperson: user?.full_name ?? 'Staff',
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
                        <p className="mt-1 text-sm text-accent">{formatPKR(v.total_cost)}</p>
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
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNewCustomer(!showNewCustomer)}
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
                  <div className="rounded-lg bg-[var(--bg-tertiary)] p-3 text-sm">
                    <span className="text-[var(--text-secondary)]">Vehicle cost: </span>
                    <strong>{formatPKR(selectedVehicle.total_cost)}</strong>
                    {selectedCustomer && (
                      <>
                        {' · '}
                        <span className="text-[var(--text-secondary)]">Buyer: </span>
                        <strong>{selectedCustomer.full_name}</strong>
                      </>
                    )}
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
                    label="Sale price (PKR)"
                    type="number"
                    required
                    min={0}
                    value={salePrice}
                    onChange={(e) => setSalePrice(e.target.value)}
                  />
                  <Input
                    label="Discount (PKR)"
                    type="number"
                    min={0}
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                  />
                  <Input
                    label="Advance (PKR)"
                    type="number"
                    min={0}
                    value={advance}
                    onChange={(e) => setAdvance(e.target.value)}
                  />
                </div>

                <div className="grid gap-3 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] p-4 sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-[var(--text-tertiary)]">Net price</p>
                    <p className="text-lg font-bold text-[var(--text-primary)]">{formatPKR(netPrice)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-tertiary)]">Balance due</p>
                    <p className={`text-lg font-bold ${balance > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {formatPKR(balance)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-tertiary)]">Estimated profit</p>
                    <p className={`text-lg font-bold ${profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {formatPKR(profit)}
                    </p>
                  </div>
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
            <Button onClick={handleNext} disabled={!canProceed}>
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
