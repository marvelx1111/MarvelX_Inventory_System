import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { EditableCard } from '@/components/ui/EditableCard';
import { EditRecordModal } from '@/components/ui/EditRecordModal';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Select } from '@/components/ui/Select';
import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton';
import { VEHICLE_EDIT_FIELDS } from '@/config/edit-fields';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { store } from '@/data/store';
import type { BiometricStatus, VehicleDocument, VehicleStatus } from '@/types';
import { BIOMETRIC_OPTIONS, BIOMETRIC_STATUS_CONFIG, VEHICLE_STATUS_CONFIG, formatPaymentMethod } from '@/utils/constants';
import { formatCNIC, formatDate, formatPKR, cn } from '@/utils/format';
import { PageTransition } from './PageTransition';
import { usePageLoading } from './hooks/usePageLoading';

const DOCUMENT_CHECKLIST: {
  key: keyof Pick<
    VehicleDocument,
    | 'original_file'
    | 'registration_book'
    | 'tax_token'
    | 'spare_key'
    | 'spare_wheel'
    | 'tool_kit'
    | 'user_manual'
    | 'insurance'
  >;
  label: string;
}[] = [
  { key: 'original_file', label: 'Original File' },
  { key: 'registration_book', label: 'Registration Book' },
  { key: 'tax_token', label: 'Tax Token' },
  { key: 'spare_key', label: 'Spare Key' },
  { key: 'spare_wheel', label: 'Spare Wheel' },
  { key: 'tool_kit', label: 'Tool Kit' },
  { key: 'user_manual', label: 'User Manual' },
  { key: 'insurance', label: 'Insurance' },
];

export function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const loading = usePageLoading();
  const { user } = useAuth();
  const { success, error } = useToast();
  const [refreshKey, setRefreshKey] = useState(0);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const details = id ? store.getVehicleWithDetails(id) : null;
  void refreshKey;
  const categories = store.getExpenseCategories();

  const expenseRows = useMemo(() => {
    if (!details) return [];
    let running = details.vehicle.purchase_price;
    const rows = [
      {
        id: 'purchase',
        date: details.vehicle.purchase_date,
        description: 'Purchase price',
        category: 'Acquisition',
        amount: details.vehicle.purchase_price,
        running,
      },
    ];
    const sorted = [...details.expenses].sort(
      (a, b) => new Date(a.expense_date).getTime() - new Date(b.expense_date).getTime(),
    );
    for (const exp of sorted) {
      running += exp.amount;
      const cat = categories.find((c) => c.category_id === exp.category_id);
      rows.push({
        id: exp.expense_id,
        date: exp.expense_date,
        description: exp.description,
        category: cat?.category_name ?? 'Expense',
        amount: exp.amount,
        running,
      });
    }
    return rows;
  }, [details, categories]);

  const toggleDocument = async (key: (typeof DOCUMENT_CHECKLIST)[number]['key']) => {
    if (!details?.document) return;
    const current = details.document[key];
    await store.updateVehicleDocument(details.document.document_id, { [key]: !current });
    success('Document updated', `${DOCUMENT_CHECKLIST.find((d) => d.key === key)?.label} marked ${!current ? 'received' : 'pending'}`);
    setRefreshKey((n) => n + 1);
  };

  const handleBiometricChange = async (value: BiometricStatus) => {
    if (!details?.document) return;
    await store.updateVehicleDocument(details.document.document_id, {
      biometric_status: value,
      biometric_required: value !== 'not_taken',
      biometric_completed: value === 'done',
    });
    success('Biometric updated', BIOMETRIC_STATUS_CONFIG[value].label);
    setRefreshKey((n) => n + 1);
  };

  const handleSaveVehicle = async (values: Record<string, string>) => {
    if (!details) return;
    setSaving(true);
    try {
      const updated = await store.updateVehicle(details.vehicle.vehicle_id, {
        make: values.make.trim(),
        model: values.model.trim(),
        variant: values.variant.trim(),
        model_year: Number(values.model_year),
        registration_number: values.registration_number.trim(),
        registration_city: values.registration_city.trim(),
        color: values.color.trim(),
        mileage: Number(values.mileage) || 0,
        fuel_type: values.fuel_type.trim(),
        transmission: values.transmission.trim(),
        engine_number: values.engine_number.trim(),
        chassis_number: values.chassis_number.trim(),
        status: values.status as VehicleStatus,
      });
      if (!updated) {
        error('Update failed', 'Could not save vehicle changes.');
        return;
      }
      store.addAuditLog({
        user_id: user?.user_id ?? 'usr_001',
        action: 'UPDATE',
        table_name: 'vehicles',
        record_id: details.vehicle.vehicle_id,
        ip_address: '127.0.0.1',
      });
      success('Vehicle updated', 'Vehicle details saved successfully.');
      setEditOpen(false);
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
        <Skeleton className="mb-6 h-10 w-64" />
        <div className="grid gap-6 lg:grid-cols-2">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </PageTransition>
    );
  }

  if (!details) {
    return (
      <PageTransition>
        <EmptyState
          title="Vehicle not found"
          description="This vehicle may have been removed or the link is invalid."
          action={{ label: 'Back to inventory', onClick: () => window.history.back() }}
        />
      </PageTransition>
    );
  }

  const { vehicle, purchase, seller, document, sale, buyer } = details;
  const statusCfg = VEHICLE_STATUS_CONFIG[vehicle.status];
  const completedDocs = document
    ? DOCUMENT_CHECKLIST.filter((d) => document[d.key]).length
    : 0;

  return (
    <PageTransition>
      <PageHeader
        title={`${vehicle.make} ${vehicle.model}`}
        subtitle={`${vehicle.stock_number} · ${vehicle.variant} · ${vehicle.model_year}`}
        actions={
          <Link to="/inventory">
            <Button variant="secondary">Back to inventory</Button>
          </Link>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Badge variant={vehicle.status === 'in_stock' ? 'success' : vehicle.status === 'booked' ? 'warning' : 'default'} dot>
          {statusCfg.label}
        </Badge>
        {sale && (
          <Link to={`/sales/${sale.sale_id}`}>
            <Badge variant="info">View sale →</Badge>
          </Link>
        )}
        <span className="text-sm text-[var(--text-secondary)]">
          Total cost: <strong className="text-[var(--text-primary)]">{formatPKR(vehicle.total_cost)}</strong>
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <EditableCard title="Vehicle Details" onEdit={() => setEditOpen(true)}>
          <dl className="grid gap-3 sm:grid-cols-2">
            <DetailItem label="Registration" value={vehicle.registration_number} />
            <DetailItem label="City" value={vehicle.registration_city} />
            <DetailItem label="Color" value={vehicle.color} />
            <DetailItem label="Mileage" value={`${vehicle.mileage.toLocaleString()} km`} />
            <DetailItem label="Fuel" value={vehicle.fuel_type} />
            <DetailItem label="Transmission" value={vehicle.transmission} />
            <DetailItem label="Engine No." value={vehicle.engine_number} />
            <DetailItem label="Chassis No." value={vehicle.chassis_number} />
          </dl>
        </EditableCard>

        <Card padding="md">
          <CardHeader>
            <CardTitle>Purchase Information</CardTitle>
          </CardHeader>
          <CardContent>
            {purchase ? (
              <dl className="space-y-3">
                <DetailItem label="Purchase date" value={formatDate(purchase.purchase_date)} />
                <DetailItem label="Purchase price" value={formatPKR(purchase.purchase_price)} />
                <DetailItem label="Payment method" value={formatPaymentMethod(purchase.payment_method)} />
                <DetailItem label="Reference" value={purchase.reference_number || '—'} />
                {seller && (
                  <>
                    <DetailItem label="Seller" value={seller.full_name} />
                    <DetailItem label="Seller CNIC" value={formatCNIC(seller.cnic)} />
                  </>
                )}
                {purchase.notes && (
                  <DetailItem label="Notes" value={purchase.notes} className="sm:col-span-2" />
                )}
              </dl>
            ) : (
              <p className="text-sm text-[var(--text-tertiary)]">No purchase record</p>
            )}
            {buyer && sale && (
              <div className="mt-4 border-t border-[var(--border-secondary)] pt-4">
                <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
                  Buyer
                </p>
                <p className="mt-1 font-medium text-[var(--text-primary)]">{buyer.full_name}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card padding="md" className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Document Checklist</CardTitle>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                {completedDocs} of {DOCUMENT_CHECKLIST.length} items received
              </p>
            </div>
            {document && (
              <div className="h-2 w-24 overflow-hidden rounded-full bg-[var(--bg-tertiary)]">
                <motion.div
                  className="h-full rounded-full bg-accent"
                  initial={{ width: 0 }}
                  animate={{ width: `${(completedDocs / DOCUMENT_CHECKLIST.length) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            )}
          </CardHeader>
          <CardContent>
            {document ? (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {DOCUMENT_CHECKLIST.map((item) => {
                  const checked = document[item.key];
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => toggleDocument(item.key)}
                      className={cn(
                        'flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-all',
                        checked
                          ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-950/30'
                          : 'border-[var(--border-primary)] bg-[var(--bg-tertiary)] hover:border-accent/30',
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors',
                          checked
                            ? 'border-emerald-500 bg-emerald-500 text-white'
                            : 'border-[var(--border-primary)]',
                        )}
                      >
                        {checked && (
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </span>
                      {item.label}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-[var(--text-tertiary)]">No document record</p>
            )}

            {document && (
              <div className="mt-4 flex flex-col gap-3 border-t border-[var(--border-secondary)] pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
                    Biometric
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <span
                      className={cn(
                        'h-2 w-2 rounded-full',
                        BIOMETRIC_STATUS_CONFIG[document.biometric_status].dotColor,
                      )}
                    />
                    <span
                      className={cn(
                        'text-sm font-medium',
                        BIOMETRIC_STATUS_CONFIG[document.biometric_status].color,
                      )}
                    >
                      {BIOMETRIC_STATUS_CONFIG[document.biometric_status].label}
                    </span>
                  </div>
                </div>
                <div className="no-print w-full sm:w-64">
                  <Select
                    value={document.biometric_status}
                    onChange={(e) => handleBiometricChange(e.target.value as BiometricStatus)}
                    options={BIOMETRIC_OPTIONS}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card padding="none" className="lg:col-span-2 overflow-hidden">
          <CardHeader className="border-b border-[var(--border-secondary)] px-5 py-4">
            <CardTitle>Expense History</CardTitle>
          </CardHeader>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-secondary)] bg-[var(--bg-tertiary)]">
                  <th className="px-5 py-3 text-left font-medium text-[var(--text-secondary)]">Date</th>
                  <th className="px-5 py-3 text-left font-medium text-[var(--text-secondary)]">Description</th>
                  <th className="px-5 py-3 text-left font-medium text-[var(--text-secondary)]">Category</th>
                  <th className="px-5 py-3 text-right font-medium text-[var(--text-secondary)]">Amount</th>
                  <th className="px-5 py-3 text-right font-medium text-[var(--text-secondary)]">Running Total</th>
                </tr>
              </thead>
              <tbody>
                {expenseRows.map((row) => (
                  <tr key={row.id} className="border-b border-[var(--border-secondary)] last:border-0">
                    <td className="px-5 py-3 text-[var(--text-secondary)]">{formatDate(row.date)}</td>
                    <td className="px-5 py-3 text-[var(--text-primary)]">{row.description}</td>
                    <td className="px-5 py-3 text-[var(--text-secondary)]">{row.category}</td>
                    <td className="px-5 py-3 text-right font-medium text-[var(--text-primary)]">
                      {formatPKR(row.amount)}
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-accent">
                      {formatPKR(row.running)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="space-y-3 p-4 md:hidden">
            {expenseRows.map((row) => (
              <Card key={row.id} padding="sm">
                <p className="font-medium text-[var(--text-primary)]">{row.description}</p>
                <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                  {formatDate(row.date)} · {row.category}
                </p>
                <div className="mt-2 flex justify-between text-sm">
                  <span className="text-[var(--text-secondary)]">{formatPKR(row.amount)}</span>
                  <span className="font-semibold text-accent">{formatPKR(row.running)}</span>
                </div>
              </Card>
            ))}
          </div>
        </Card>
      </div>

      <EditRecordModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit vehicle"
        description="Update vehicle specifications and status."
        fields={VEHICLE_EDIT_FIELDS}
        values={{
          make: vehicle.make,
          model: vehicle.model,
          variant: vehicle.variant,
          model_year: String(vehicle.model_year),
          registration_number: vehicle.registration_number,
          registration_city: vehicle.registration_city,
          color: vehicle.color,
          mileage: String(vehicle.mileage),
          fuel_type: vehicle.fuel_type,
          transmission: vehicle.transmission,
          engine_number: vehicle.engine_number,
          chassis_number: vehicle.chassis_number,
          status: vehicle.status,
        }}
        onSave={handleSaveVehicle}
        saving={saving}
      />
    </PageTransition>
  );
}

function DetailItem({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm font-medium text-[var(--text-primary)]">{value}</dd>
    </div>
  );
}
