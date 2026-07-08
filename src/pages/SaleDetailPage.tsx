import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { EditableCard } from '@/components/ui/EditableCard';
import { EditRecordModal } from '@/components/ui/EditRecordModal';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton';
import { DELIVERY_EDIT_FIELDS, SALE_EDIT_FIELDS } from '@/config/edit-fields';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { store } from '@/data/store';
import type { PaymentMethod } from '@/types';
import { formatCNIC, formatDate, formatPKR } from '@/utils/format';
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

  const sellingPrice = sale ? sale.sale_price - sale.discount : 0;
  const actualPrice = vehicle?.purchase_price ?? 0;
  const isFullPayment = sale ? sale.balance <= 0 && sale.advance > 0 : false;

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
          {sale.balance <= 0 ? (isFullPayment ? 'Full payment' : 'Settled') : `${formatPKR(sale.balance)} due`}
        </Badge>
        <Badge variant="accent">Selling price: {formatPKR(sellingPrice)}</Badge>
        <Badge variant="info">Profit: {formatPKR(sale.profit)}</Badge>
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
                <InfoItem label="Actual price (bought for)" value={formatPKR(actualPrice)} />
              )}
              <InfoItem label="Selling price" value={formatPKR(sellingPrice)} highlight="accent" />
              {sale.discount > 0 && (
                <InfoItem label="Discount" value={formatPKR(sale.discount)} />
              )}
              <InfoItem
                label="Token / advance"
                value={sale.advance > 0 ? formatPKR(sale.advance) : 'None'}
              />
              <InfoItem label="Balance due" value={formatPKR(sale.balance)} />
              <InfoItem label="Payment method" value={sale.payment_method.replace('_', ' ')} />
              {vehicle && vehicle.total_cost > actualPrice && (
                <InfoItem label="Total cost (incl. expenses)" value={formatPKR(vehicle.total_cost)} />
              )}
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
              <SummaryRow label="Actual price (bought for)" value={formatPKR(actualPrice)} />
            )}
            <SummaryRow label="Selling price" value={formatPKR(sellingPrice)} highlight="accent" />
            {sale.discount > 0 && (
              <SummaryRow label="Discount" value={`− ${formatPKR(sale.discount)}`} />
            )}
            <SummaryRow
              label="Token / advance"
              value={sale.advance > 0 ? formatPKR(sale.advance) : 'None'}
              highlight={sale.advance > 0 ? 'success' : undefined}
            />
            <SummaryRow
              label="Balance due"
              value={formatPKR(sale.balance)}
              highlight={sale.balance > 0 ? 'warning' : 'success'}
            />
          </CardContent>
        </Card>

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
  highlight?: 'accent';
}) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">{label}</dt>
      <dd
        className={`mt-0.5 text-sm font-medium ${
          highlight === 'accent' ? 'text-accent' : 'text-[var(--text-primary)]'
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
  highlight?: 'success' | 'warning' | 'accent';
}) {
  const color =
    highlight === 'success'
      ? 'text-emerald-600'
      : highlight === 'warning'
        ? 'text-amber-600'
        : highlight === 'accent'
          ? 'text-accent'
          : 'text-[var(--text-primary)]';

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-[var(--text-secondary)]">{label}</span>
      <span className={`font-semibold ${color}`}>{value}</span>
    </div>
  );
}
