import { motion } from 'framer-motion';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { EditableCard } from '@/components/ui/EditableCard';
import { EditRecordModal } from '@/components/ui/EditRecordModal';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton';
import { DELIVERY_EDIT_FIELDS, SALE_EDIT_FIELDS } from '@/config/edit-fields';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { store } from '@/data/store';
import type { PaymentMethod } from '@/types';
import { formatCNIC, formatDate, formatPKR } from '@/utils/format';
import { PageTransition } from './PageTransition';
import { usePageLoading } from './hooks/usePageLoading';

const PAYMENT_OPTIONS = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'online', label: 'Online' },
];

export function SaleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const loading = usePageLoading();
  const { user } = useAuth();
  const { success, error } = useToast();
  const [refreshKey, setRefreshKey] = useState(0);
  const [editSaleOpen, setEditSaleOpen] = useState(false);
  const [editDeliveryOpen, setEditDeliveryOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const sale = id ? store.getSaleById(id) : undefined;
  void refreshKey;
  const vehicle = sale ? store.getVehicleById(sale.vehicle_id) : undefined;
  const customer = sale ? store.getCustomerById(sale.customer_id) : undefined;
  const payments = sale
    ? store.getSalePayments().filter((p) => p.sale_id === sale.sale_id)
    : [];
  const delivery = sale
    ? store.getDeliveryRecords().find((d) => d.sale_id === sale.sale_id)
    : undefined;

  const [paymentForm, setPaymentForm] = useState({
    payment_date: new Date().toISOString().slice(0, 10),
    amount: '',
    payment_method: 'bank_transfer' as PaymentMethod,
    reference_number: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleAddPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sale) return;

    const amount = Number(paymentForm.amount);
    if (!amount || amount <= 0) {
      error('Invalid amount', 'Enter a valid payment amount');
      return;
    }
    if (amount > sale.balance) {
      error('Amount too high', `Maximum payment is ${formatPKR(sale.balance)}`);
      return;
    }

    setSubmitting(true);
    window.setTimeout(() => {
      store.addSalePayment(sale.sale_id, {
        payment_date: paymentForm.payment_date,
        amount,
        payment_method: paymentForm.payment_method,
        reference_number: paymentForm.reference_number,
        notes: paymentForm.notes,
      });

      store.addAuditLog({
        user_id: user?.user_id ?? 'usr_001',
        action: 'CREATE',
        table_name: 'sale_payments',
        record_id: sale.sale_id,
        ip_address: '127.0.0.1',
      });

      success('Payment recorded', `${formatPKR(amount)} applied to balance`);
      setPaymentForm({
        payment_date: new Date().toISOString().slice(0, 10),
        amount: '',
        payment_method: 'bank_transfer',
        reference_number: '',
        notes: '',
      });
      setSubmitting(false);
      setRefreshKey((n) => n + 1);
    }, 300);
  };

  const handleSaveSale = async (values: Record<string, string>) => {
    if (!sale) return;
    setSaving(true);
    try {
      const updated = await store.updateSale(sale.sale_id, {
        sale_date: values.sale_date,
        sale_price: Number(values.sale_price),
        discount: Number(values.discount) || 0,
        advance: Number(values.advance) || 0,
        salesperson: values.salesperson.trim(),
        payment_method: values.payment_method as PaymentMethod,
      });
      if (!updated) {
        error('Update failed', 'Could not save sale changes.');
        return;
      }
      store.addAuditLog({
        user_id: user?.user_id ?? 'usr_001',
        action: 'UPDATE',
        table_name: 'sales',
        record_id: sale.sale_id,
        ip_address: '127.0.0.1',
      });
      success('Sale updated', 'Sale details saved successfully.');
      setEditSaleOpen(false);
      setRefreshKey((n) => n + 1);
    } catch {
      error('Update failed', 'An error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDelivery = async (values: Record<string, string>) => {
    if (!sale) return;
    setSaving(true);
    try {
      if (delivery) {
        const updated = await store.updateDeliveryRecord(delivery.delivery_id, {
          delivery_date: values.delivery_date,
          delivered_by: values.delivered_by.trim(),
          receiver_name: values.receiver_name.trim(),
          receiver_cnic: values.receiver_cnic.trim(),
          remarks: values.remarks.trim(),
        });
        if (!updated) {
          error('Update failed', 'Could not save delivery record.');
          return;
        }
      } else {
        await store.createDeliveryRecord(sale.sale_id, {
          delivery_date: values.delivery_date,
          delivered_by: values.delivered_by.trim(),
          receiver_name: values.receiver_name.trim(),
          receiver_cnic: values.receiver_cnic.trim(),
          remarks: values.remarks.trim(),
        });
      }
      store.addAuditLog({
        user_id: user?.user_id ?? 'usr_001',
        action: delivery ? 'UPDATE' : 'CREATE',
        table_name: 'delivery_records',
        record_id: sale.sale_id,
        ip_address: '127.0.0.1',
      });
      success('Delivery saved', 'Delivery record updated successfully.');
      setEditDeliveryOpen(false);
      setRefreshKey((n) => n + 1);
    } catch {
      error('Update failed', 'An error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  const sortedPayments = [...payments].sort(
    (a, b) => new Date(a.payment_date).getTime() - new Date(b.payment_date).getTime(),
  );

  const totalPaid = sortedPayments.reduce((sum, p) => sum + p.amount, 0);
  const netPrice = sale ? sale.sale_price - sale.discount : 0;

  if (loading) {
    return (
      <PageTransition>
        <Skeleton className="mb-6 h-10 w-48" />
        <SkeletonCard />
      </PageTransition>
    );
  }

  if (!sale) {
    return (
      <PageTransition>
        <EmptyState
          title="Sale not found"
          description="This sale record may not exist or was removed."
          action={{ label: 'Back to sales', onClick: () => window.history.back() }}
        />
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <PageHeader
        title={`Sale ${sale.sale_id}`}
        subtitle={vehicle ? `${vehicle.make} ${vehicle.model} · ${vehicle.stock_number}` : undefined}
        actions={
          <Link to="/sales">
            <Button variant="secondary">Back to sales</Button>
          </Link>
        }
      />

      <div className="mb-6 flex flex-wrap gap-2">
        <Badge variant={sale.balance <= 0 ? 'success' : 'warning'} dot>
          {sale.balance <= 0 ? 'Fully paid' : `${formatPKR(sale.balance)} remaining`}
        </Badge>
        <Badge variant="accent">Profit: {formatPKR(sale.profit)}</Badge>
        {vehicle && (
          <Link to={`/inventory/${vehicle.vehicle_id}`}>
            <Badge variant="info">View vehicle</Badge>
          </Link>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <EditableCard title="Sale Details" onEdit={() => setEditSaleOpen(true)} className="lg:col-span-2">
          <dl className="grid gap-4 sm:grid-cols-2">
              <InfoItem label="Sale date" value={formatDate(sale.sale_date)} />
              <InfoItem label="Salesperson" value={sale.salesperson} />
              <InfoItem label="Sale price" value={formatPKR(sale.sale_price)} />
              <InfoItem label="Discount" value={formatPKR(sale.discount)} />
              <InfoItem label="Net price" value={formatPKR(netPrice)} />
              <InfoItem label="Advance" value={formatPKR(sale.advance)} />
              <InfoItem label="Balance" value={formatPKR(sale.balance)} />
              <InfoItem label="Payment method" value={sale.payment_method.replace('_', ' ')} />
            </dl>

            {customer && (
              <div className="mt-6 border-t border-[var(--border-secondary)] pt-4">
                <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
                  Buyer
                </p>
                <Link
                  to={`/customers/${customer.customer_id}`}
                  className="mt-1 block font-medium text-accent hover:underline"
                >
                  {customer.full_name}
                </Link>
                <p className="text-sm text-[var(--text-secondary)]">
                  {customer.mobile} · {customer.city}
                </p>
              </div>
            )}
        </EditableCard>

        <Card padding="md">
          <CardHeader>
            <CardTitle>Payment Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <SummaryRow label="Net price" value={formatPKR(netPrice)} />
            <SummaryRow label="Total paid" value={formatPKR(totalPaid)} highlight="success" />
            <SummaryRow
              label="Remaining"
              value={formatPKR(sale.balance)}
              highlight={sale.balance > 0 ? 'warning' : 'success'}
            />
          </CardContent>
        </Card>

        <Card padding="md" className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Installment Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            {sortedPayments.length === 0 ? (
              <p className="text-sm text-[var(--text-tertiary)]">No payments recorded yet</p>
            ) : (
              <div className="relative space-y-0">
                <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-[var(--border-primary)]" />
                {sortedPayments.map((payment, i) => (
                  <motion.div
                    key={payment.payment_id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="relative flex gap-4 pb-6 last:pb-0"
                  >
                    <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">
                      {i + 1}
                    </div>
                    <div className="min-w-0 flex-1 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-tertiary)] p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-semibold text-[var(--text-primary)]">
                          {formatPKR(payment.amount)}
                        </span>
                        <span className="text-xs text-[var(--text-tertiary)]">
                          {formatDate(payment.payment_date)}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-[var(--text-secondary)]">
                        {payment.payment_method.replace('_', ' ')}
                        {payment.reference_number && ` · Ref: ${payment.reference_number}`}
                      </p>
                      {payment.notes && (
                        <p className="mt-1 text-xs text-[var(--text-tertiary)]">{payment.notes}</p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {sale.balance > 0 && (
          <Card padding="md" className="no-print">
            <CardHeader>
              <CardTitle>Add Payment</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddPayment} className="space-y-3">
                <Input
                  label="Amount (PKR)"
                  type="number"
                  required
                  min={1}
                  max={sale.balance}
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm((p) => ({ ...p, amount: e.target.value }))}
                  hint={`Max: ${formatPKR(sale.balance)}`}
                />
                <Input
                  label="Payment date"
                  type="date"
                  value={paymentForm.payment_date}
                  onChange={(e) => setPaymentForm((p) => ({ ...p, payment_date: e.target.value }))}
                />
                <Select
                  label="Method"
                  value={paymentForm.payment_method}
                  onChange={(e) =>
                    setPaymentForm((p) => ({ ...p, payment_method: e.target.value as PaymentMethod }))
                  }
                  options={PAYMENT_OPTIONS}
                />
                <Input
                  label="Reference"
                  value={paymentForm.reference_number}
                  onChange={(e) => setPaymentForm((p) => ({ ...p, reference_number: e.target.value }))}
                />
                <Button type="submit" className="w-full" loading={submitting}>
                  Record payment
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        <EditableCard
          title="Delivery Record"
          onEdit={() => setEditDeliveryOpen(true)}
          editLabel={delivery ? 'Edit' : 'Add'}
          className="lg:col-span-3"
        >
          {delivery ? (
            <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <InfoItem label="Delivery date" value={formatDate(delivery.delivery_date)} />
              <InfoItem label="Delivered by" value={delivery.delivered_by} />
              <InfoItem label="Receiver" value={delivery.receiver_name} />
              <InfoItem label="Receiver CNIC" value={formatCNIC(delivery.receiver_cnic)} />
              {delivery.remarks && (
                <div className="sm:col-span-2">
                  <InfoItem label="Remarks" value={delivery.remarks} />
                </div>
              )}
            </dl>
          ) : (
            <p className="text-sm text-[var(--text-tertiary)]">
              No delivery record on file. Click Add to record vehicle handover.
            </p>
          )}
        </EditableCard>
      </div>

      <EditRecordModal
        open={editSaleOpen}
        onClose={() => setEditSaleOpen(false)}
        title="Edit sale"
        fields={SALE_EDIT_FIELDS}
        values={{
          sale_date: sale.sale_date,
          sale_price: String(sale.sale_price),
          discount: String(sale.discount),
          advance: String(sale.advance),
          salesperson: sale.salesperson,
          payment_method: sale.payment_method,
        }}
        onSave={handleSaveSale}
        saving={saving}
      />

      <EditRecordModal
        open={editDeliveryOpen}
        onClose={() => setEditDeliveryOpen(false)}
        title={delivery ? 'Edit delivery record' : 'Add delivery record'}
        fields={DELIVERY_EDIT_FIELDS}
        values={{
          delivery_date: delivery?.delivery_date ?? new Date().toISOString().slice(0, 10),
          delivered_by: delivery?.delivered_by ?? user?.full_name ?? '',
          receiver_name: delivery?.receiver_name ?? customer?.full_name ?? '',
          receiver_cnic: delivery?.receiver_cnic ?? customer?.cnic ?? '',
          remarks: delivery?.remarks ?? '',
        }}
        onSave={handleSaveDelivery}
        saving={saving}
      />
    </PageTransition>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-[var(--text-primary)]">{value}</dd>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: 'success' | 'warning';
}) {
  const color =
    highlight === 'success'
      ? 'text-emerald-600'
      : highlight === 'warning'
        ? 'text-amber-600'
        : 'text-[var(--text-primary)]';

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-[var(--text-secondary)]">{label}</span>
      <span className={`font-semibold ${color}`}>{value}</span>
    </div>
  );
}
