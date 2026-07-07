import { motion } from 'framer-motion';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { EditableCard } from '@/components/ui/EditableCard';
import { EditRecordModal } from '@/components/ui/EditRecordModal';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton';
import { CUSTOMER_EDIT_FIELDS, customerToFormValues, parseCustomerFormValues } from '@/config/edit-fields';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useCanEdit } from '@/hooks/useCanEdit';
import { store } from '@/data/store';
import type { CustomerType } from '@/types';
import { formatCNIC, formatDate, formatPKR, getInitials } from '@/utils/format';
import { PageTransition } from './PageTransition';
import { usePageLoading } from './hooks/usePageLoading';

const TYPE_LABEL: Record<CustomerType, string> = {
  individual: 'Individual',
  dealer: 'Dealer',
  corporate: 'Corporate',
};

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const loading = usePageLoading();
  const { user } = useAuth();
  const canEdit = useCanEdit();
  const { success, error } = useToast();
  const [refreshKey, setRefreshKey] = useState(0);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const profile = id ? store.getCustomerProfile(id) : null;
  void refreshKey;

  const handleSave = async (values: Record<string, string>) => {
    if (!profile) return;
    setSaving(true);
    try {
      const updated = await store.updateCustomer(profile.customer.customer_id, parseCustomerFormValues(values));
      if (!updated) {
        error('Update failed', 'Could not save customer changes.');
        return;
      }
      store.addAuditLog({
        user_id: user?.user_id ?? 'usr_001',
        action: 'UPDATE',
        table_name: 'customers',
        record_id: profile.customer.customer_id,
        ip_address: '127.0.0.1',
      });
      success('Customer updated', 'Contact information saved successfully.');
      setEditOpen(false);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      error('Update failed', err instanceof Error ? err.message : 'An error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PageTransition>
        <Skeleton className="mb-6 h-10 w-64" />
        <SkeletonCard />
      </PageTransition>
    );
  }

  if (!profile) {
    return (
      <PageTransition>
        <EmptyState
          title="Customer not found"
          description="This customer may not exist or was removed."
          action={{ label: 'Back to customers', onClick: () => window.history.back() }}
        />
      </PageTransition>
    );
  }

  const { customer, purchasesAsSeller, sales, vehiclesPurchased, totalSpent, outstandingBalance } =
    profile;

  return (
    <PageTransition>
      <PageHeader
        title={customer.full_name}
        subtitle={`${TYPE_LABEL[customer.customer_type]} · ${customer.city}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {canEdit && (
              <Button type="button" onClick={() => setEditOpen(true)}>
                Edit contact
              </Button>
            )}
            <Link to="/customers">
              <Button variant="secondary">Back to customers</Button>
            </Link>
          </div>
        }
      />

      <div className="mb-6 flex items-start gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-accent/10 text-xl font-bold text-accent">
          {getInitials(customer.full_name)}
        </div>
        <div className="grid flex-1 gap-4 sm:grid-cols-3">
          <StatCard label="Total spent" value={formatPKR(totalSpent)} />
          <StatCard
            label="Outstanding balance"
            value={formatPKR(outstandingBalance)}
            highlight={outstandingBalance > 0 ? 'warning' : 'success'}
          />
          <StatCard label="Purchases as seller" value={String(purchasesAsSeller.length)} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <EditableCard
          title="Contact Information"
          onEdit={() => setEditOpen(true)}
        >
          <dl className="space-y-3">
            <ProfileField label="CNIC" value={formatCNIC(customer.cnic) || '—'} />
            <ProfileField label="Mobile" value={customer.mobile || '—'} />
            <ProfileField label="WhatsApp" value={customer.whatsapp || '—'} />
            <ProfileField label="Email" value={customer.email || '—'} />
            <ProfileField label="Address" value={customer.address || '—'} />
            <ProfileField label="Member since" value={formatDate(customer.created_at)} />
            {customer.remarks && <ProfileField label="Remarks" value={customer.remarks} />}
          </dl>
        </EditableCard>

        <Card padding="none" className="overflow-hidden">
          <div className="border-b border-[var(--border-secondary)] px-5 py-4">
            <h3 className="font-semibold text-[var(--text-primary)]">Sales History</h3>
          </div>
          <div className="p-0">
            {sales.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-[var(--text-tertiary)]">
                No purchases from showroom
              </p>
            ) : (
              <ul className="divide-y divide-[var(--border-secondary)]">
                {sales.map((sale, i) => {
                  const vehicle = vehiclesPurchased.find((v) => v.vehicle_id === sale.vehicle_id);
                  return (
                    <motion.li
                      key={sale.sale_id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.04 }}
                      className="px-5 py-4"
                    >
                      <Link to={`/sales/${sale.sale_id}`} className="group">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium text-[var(--text-primary)] group-hover:text-accent">
                              {vehicle
                                ? `${vehicle.make} ${vehicle.model} ${vehicle.model_year}`
                                : sale.sale_id}
                            </p>
                            <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">
                              {formatDate(sale.sale_date)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-[var(--text-primary)]">
                              {formatPKR(sale.sale_price - sale.discount)}
                            </p>
                            {sale.balance > 0 && (
                              <Badge variant="warning" className="mt-1">
                                {formatPKR(sale.balance)} due
                              </Badge>
                            )}
                          </div>
                        </div>
                      </Link>
                    </motion.li>
                  );
                })}
              </ul>
            )}
          </div>
        </Card>

        <Card padding="none" className="overflow-hidden lg:col-span-2">
          <div className="border-b border-[var(--border-secondary)] px-5 py-4">
            <h3 className="font-semibold text-[var(--text-primary)]">Vehicles Sold to Showroom</h3>
          </div>
          <div className="p-0">
            {purchasesAsSeller.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-[var(--text-tertiary)]">
                No vehicles sold to the showroom
              </p>
            ) : (
              <ul className="divide-y divide-[var(--border-secondary)]">
                {purchasesAsSeller.map((purchase, i) => {
                  const vehicle = store.getVehicles().find((v) => v.purchase_id === purchase.purchase_id);
                  return (
                    <motion.li
                      key={purchase.purchase_id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.04 }}
                      className="flex items-center justify-between px-5 py-4"
                    >
                      <div>
                        {vehicle ? (
                          <Link
                            to={`/inventory/${vehicle.vehicle_id}`}
                            className="font-medium text-accent hover:underline"
                          >
                            {vehicle.make} {vehicle.model} {vehicle.model_year}
                          </Link>
                        ) : (
                          <span className="font-medium">{purchase.purchase_id}</span>
                        )}
                        <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">
                          {formatDate(purchase.purchase_date)}
                        </p>
                      </div>
                      <Badge variant="accent">{formatPKR(purchase.purchase_price)}</Badge>
                    </motion.li>
                  );
                })}
              </ul>
            )}
          </div>
        </Card>
      </div>

      <EditRecordModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit customer"
        description="Update contact details for this customer."
        fields={CUSTOMER_EDIT_FIELDS}
        values={customerToFormValues(customer)}
        onSave={handleSave}
        saving={saving}
      />
    </PageTransition>
  );
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: 'success' | 'warning';
}) {
  const color =
    highlight === 'warning'
      ? 'text-amber-600'
      : highlight === 'success'
        ? 'text-emerald-600'
        : 'text-[var(--text-primary)]';

  return (
    <Card padding="sm">
      <p className="text-xs text-[var(--text-tertiary)]">{label}</p>
      <p className={`mt-1 text-lg font-bold ${color}`}>{value}</p>
    </Card>
  );
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm text-[var(--text-primary)]">{value}</dd>
    </div>
  );
}
