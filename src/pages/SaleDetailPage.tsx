import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { EditableCard } from '@/components/ui/EditableCard';
import { EditRecordModal } from '@/components/ui/EditRecordModal';
import { VehicleCostBreakdown } from '@/components/sales/VehicleCostBreakdown';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton';
import { DELIVERY_EDIT_FIELDS, SALE_EDIT_FIELDS } from '@/config/edit-fields';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { store } from '@/data/store';
import type { PaymentMethod } from '@/types';
import { formatCNIC, formatDate, formatPKR } from '@/utils/format';
import { computeSaleFinancials } from '@/utils/sale';
import { PageTransition } from './PageTransition';
import { usePageLoading } from './hooks/usePageLoading';

export function SaleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const loading = usePageLoading();
  const { user } = useAuth();
  const { success, error } = useToast();
  const [refreshKey, setRefreshKey] = useState(0);
  const [editSaleOpen, setEditSaleOpen] = useState(false);
  const [editDeliveryOpen, setEditDeliveryOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [paymentInput, setPaymentInput] = useState('');
  const [recordingPayment, setRecordingPayment] = useState(false);

  const sale = id ? store.getSaleById(id) : undefined;
  void refreshKey;
  const vehicle = sale ? store.getVehicleById(sale.vehicle_id) : undefined;
  const customer = sale ? store.getCustomerById(sale.customer_id) : undefined;
  const delivery = sale
    ? store.getDeliveryRecords().find((d) => d.sale_id === sale.sale_id)
    : undefined;
  const acquisition = vehicle ? store.getPurchaseById(vehicle.purchase_id) : undefined;
  const acquisitionSeller = acquisition
    ? store.getCustomerById(acquisition.seller_customer_id)
    : undefined;

  const financials = useMemo(() => {
    if (!sale) return null;
    return computeSaleFinancials(sale, vehicle?.total_cost ?? 0);
  }, [sale, vehicle, refreshKey]);

  const sellingPrice = financials?.sellingPrice ?? 0;
  const paymentReceived = financials?.paymentReceived ?? 0;
  const customerOwed = financials?.customerOwed ?? 0;
  const remainingBalance = financials?.remainingBalance ?? 0;
  const profit = financials?.profit ?? 0;
  const isFullPayment = financials?.isFullyPaid ?? false;
  const isLossSale = financials?.isLossSale ?? false;
  const totalCost = vehicle?.total_cost ?? 0;
  const purchasePrice = vehicle?.purchase_price ?? 0;
  const remainingLabel = isLossSale ? 'Remaining to break even' : 'Remaining balance';

  const handleSaveSale = async (values: Record<string, string>) => {
    if (!sale) return;
    const newPayment = Number(values.advance) || 0;
    if (newPayment > sellingPrice) {
      error('Payment too high', `Payment received cannot exceed selling price of ${formatPKR(sellingPrice)}`);
      return;
    }
    setSaving(true);
    try {
      const updated = await store.updateSale(sale.sale_id, {
        sale_date: values.sale_date,
        sale_price: Number(values.sale_price),
        advance: newPayment,
        salesperson: values.salesperson.trim(),
        payment_method: values.payment_method as PaymentMethod,
        remarks: values.remarks.trim(),
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

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sale) return;

    const totalReceived = Number(paymentInput);
    if (!totalReceived || totalReceived < 0) {
      error('Invalid amount', 'Enter the total payment received so far');
      return;
    }
    if (totalReceived < paymentReceived) {
      error('Cannot reduce payment', 'Payment received cannot be less than what was already recorded');
      return;
    }
    if (totalReceived > sellingPrice) {
      error('Payment too high', `Cannot exceed selling price of ${formatPKR(sellingPrice)}`);
      return;
    }

    setRecordingPayment(true);
    try {
      const updated = await store.updateSale(sale.sale_id, { advance: totalReceived });
      if (!updated) {
        error('Update failed', 'Could not record payment.');
        return;
      }
      store.addAuditLog({
        user_id: user?.user_id ?? 'usr_001',
        action: 'UPDATE',
        table_name: 'sales',
        record_id: sale.sale_id,
        ip_address: '127.0.0.1',
      });
      const remaining = updated.balance;
      success(
        remaining <= 0 ? 'Fully paid' : 'Payment recorded',
        remaining <= 0
          ? 'Customer has paid the full selling price.'
          : `${formatPKR(remaining)} remaining balance.`,
      );
      setPaymentInput('');
      setRefreshKey((n) => n + 1);
    } catch {
      error('Update failed', 'Could not record payment.');
    } finally {
      setRecordingPayment(false);
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
        <Badge variant={remainingBalance <= 0 ? 'success' : 'warning'} dot>
          {remainingBalance <= 0
            ? isFullPayment
              ? 'Fully paid'
              : 'Settled'
            : isLossSale
              ? `${formatPKR(remainingBalance)} to break even`
              : `${formatPKR(remainingBalance)} remaining`}
        </Badge>
        <Badge variant="success">Selling price: {formatPKR(sellingPrice)}</Badge>
        <Badge variant={profit >= 0 ? 'success' : 'accent'}>
          Profit: {formatPKR(profit)}
        </Badge>
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
              {vehicle && (
                <div className="sm:col-span-2">
                  <VehicleCostBreakdown totalCost={totalCost} purchasePrice={purchasePrice} />
                </div>
              )}
              <InfoItem label="Selling price" value={formatPKR(sellingPrice)} highlight="success" />
              <InfoItem
                label="Payment received"
                value={paymentReceived > 0 ? formatPKR(paymentReceived) : 'None yet'}
              />
              <InfoItem
                label={remainingLabel}
                value={formatPKR(remainingBalance)}
                highlight={remainingBalance > 0 ? 'warning' : 'success'}
              />
              <InfoItem label="Payment method" value={sale.payment_method.replace('_', ' ')} />
              {sale.remarks && (
                <div className="sm:col-span-2">
                  <InfoItem label="Remarks" value={sale.remarks} />
                </div>
              )}
            </dl>

            <div className="mt-6 grid gap-4 border-t border-[var(--border-secondary)] pt-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
                  Sold by
                </p>
                <p className="mt-1 font-medium text-[var(--text-primary)]">
                  {sale.salesperson || 'Not recorded'}
                </p>
                <p className="text-sm text-[var(--text-secondary)]">Salesperson</p>
              </div>
              {customer && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
                    Purchased by
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
              {acquisitionSeller && (
                <div className="sm:col-span-2">
                  <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
                    Originally acquired from
                  </p>
                  <Link
                    to={`/customers/${acquisitionSeller.customer_id}`}
                    className="mt-1 block font-medium text-accent hover:underline"
                  >
                    {acquisitionSeller.full_name}
                  </Link>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {acquisitionSeller.mobile} · {acquisitionSeller.city}
                  </p>
                </div>
              )}
            </div>
        </EditableCard>

        <Card padding="md">
          <CardHeader>
            <CardTitle>Payment Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {vehicle && (
              <VehicleCostBreakdown
                totalCost={totalCost}
                purchasePrice={purchasePrice}
                compact
              />
            )}
            {vehicle && <div className="border-t border-[var(--border-secondary)] pt-3" />}
            <SummaryRow label="Selling price" value={formatPKR(sellingPrice)} highlight="success" />
            <SummaryRow
              label="Payment received"
              value={paymentReceived > 0 ? formatPKR(paymentReceived) : 'None yet'}
              highlight={paymentReceived > 0 ? 'success' : undefined}
            />
            <SummaryRow
              label={remainingLabel}
              value={formatPKR(remainingBalance)}
              highlight={remainingBalance > 0 ? 'warning' : 'success'}
            />
            {vehicle && (
              <SummaryRow
                label="Profit"
                value={formatPKR(profit)}
                highlight={profit >= 0 ? 'success' : 'loss'}
              />
            )}
          </CardContent>
        </Card>

        {customerOwed > 0 && (
          <Card padding="md" className="no-print lg:col-span-3">
            <CardHeader>
              <CardTitle>Record payment</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-[var(--text-secondary)]">
                Customer still owes <strong className="text-amber-600">{formatPKR(customerOwed)}</strong>.
                Enter the <strong>total payment received so far</strong> (including any token paid earlier).
              </p>
              <form onSubmit={handleRecordPayment} className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <Input
                    label="Total payment received (PKR)"
                    type="number"
                    required
                    min={paymentReceived}
                    max={sellingPrice}
                    value={paymentInput}
                    onChange={(e) => setPaymentInput(e.target.value)}
                    placeholder={String(paymentReceived || '')}
                    hint={`Currently recorded: ${formatPKR(paymentReceived)} · Selling price: ${formatPKR(sellingPrice)}`}
                  />
                </div>
                <Button type="submit" loading={recordingPayment} className="sm:mb-0.5">
                  Update payment
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
          advance: String(sale.advance),
          salesperson: sale.salesperson,
          payment_method: sale.payment_method,
          remarks: sale.remarks,
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

function InfoItem({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: 'accent' | 'warning' | 'success';
}) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">{label}</dt>
      <dd
        className={`mt-0.5 text-sm font-medium ${
          highlight === 'accent'
            ? 'text-accent'
            : highlight === 'warning'
              ? 'text-amber-600'
              : highlight === 'success'
                ? 'text-emerald-600'
                : 'text-[var(--text-primary)]'
        }`}
      >
        {value}
      </dd>
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
  highlight?: 'success' | 'warning' | 'accent' | 'loss';
}) {
  const color =
    highlight === 'success'
      ? 'text-emerald-600'
      : highlight === 'warning'
        ? 'text-amber-600'
        : highlight === 'accent'
          ? 'text-accent'
          : highlight === 'loss'
            ? 'text-red-600'
            : 'text-[var(--text-primary)]';

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-[var(--text-secondary)]">{label}</span>
      <span className={`font-semibold ${color}`}>{value}</span>
    </div>
  );
}
