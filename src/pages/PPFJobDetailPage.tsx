import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { EditableCard } from '@/components/ui/EditableCard';
import { EditRecordModal } from '@/components/ui/EditRecordModal';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton';
import { PPF_CUSTOMER_EDIT_FIELDS, PPF_JOB_EDIT_FIELDS } from '@/config/edit-fields';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { store } from '@/data/store';
import type { PPFJobStatus } from '@/types';
import { PPF_STATUS_CONFIG, formatPaymentMethod } from '@/utils/constants';
import { cn, formatDate, formatPKR } from '@/utils/format';

const STATUS_FLOW: Record<PPFJobStatus, PPFJobStatus[]> = {
  booked: ['in_progress'],
  in_progress: ['completed'],
  completed: ['delivered'],
  delivered: [],
};

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <dt className="text-sm text-[var(--text-secondary)]">{label}</dt>
      <dd className="text-sm font-medium text-[var(--text-primary)] sm:text-right">{value}</dd>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid gap-4 lg:grid-cols-2">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}

export function PPFJobDetailPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error } = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [updating, setUpdating] = useState(false);
  const [editCustomerOpen, setEditCustomerOpen] = useState(false);
  const [editJobOpen, setEditJobOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const details = useMemo(() => {
    void refreshKey;
    if (!jobId) return null;
    return store.getPPFJobWithDetails(jobId);
  }, [jobId, refreshKey]);

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 350);
    return () => window.clearTimeout(timer);
  }, []);

  const handleStatusUpdate = useCallback(
    async (nextStatus: PPFJobStatus) => {
      if (!jobId || !user) return;
      setUpdating(true);
      await new Promise((r) => window.setTimeout(r, 200));

      const updated = await store.updatePPFJobStatus(jobId, nextStatus);
      if (!updated) {
        error('Update failed', 'Could not change job status.');
        setUpdating(false);
        return;
      }

      store.addAuditLog({
        user_id: user.user_id,
        action: 'UPDATE',
        table_name: 'ppf_job_cards',
        record_id: jobId,
        ip_address: '127.0.0.1',
      });

      success(
        'Status updated',
        `Job moved to ${PPF_STATUS_CONFIG[nextStatus].label}.`,
      );
      setRefreshKey((k) => k + 1);
      setUpdating(false);
    },
    [jobId, user, success, error],
  );

  const handleSaveCustomer = async (values: Record<string, string>) => {
    if (!details?.customer) return;
    setSaving(true);
    try {
      const updated = await store.updatePPFCustomer(details.customer.ppf_customer_id, {
        full_name: values.full_name.trim(),
        mobile: values.mobile.trim(),
        whatsapp: values.whatsapp.trim(),
        email: values.email.trim(),
        address: values.address.trim(),
        city: values.city.trim(),
      });
      if (!updated) {
        error('Update failed', 'Could not save customer changes.');
        return;
      }
      store.addAuditLog({
        user_id: user?.user_id ?? 'usr_001',
        action: 'UPDATE',
        table_name: 'ppf_customers',
        record_id: details.customer.ppf_customer_id,
        ip_address: '127.0.0.1',
      });
      success('Customer updated', 'PPF customer details saved.');
      setEditCustomerOpen(false);
      setRefreshKey((k) => k + 1);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveJob = async (values: Record<string, string>) => {
    if (!jobId) return;
    setSaving(true);
    try {
      const updated = await store.updatePPFJob(jobId, {
        installer_name: values.installer_name.trim(),
        booked_date: values.booked_date,
        completion_date: values.completion_date.trim() || null,
        warranty_period: Number(values.warranty_period) || 12,
        notes: values.notes.trim(),
      });
      if (!updated) {
        error('Update failed', 'Could not save job changes.');
        return;
      }
      store.addAuditLog({
        user_id: user?.user_id ?? 'usr_001',
        action: 'UPDATE',
        table_name: 'ppf_job_cards',
        record_id: jobId,
        ip_address: '127.0.0.1',
      });
      success('Job updated', 'Job details saved successfully.');
      setEditJobOpen(false);
      setRefreshKey((k) => k + 1);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Job Details" subtitle="Loading job information..." />
        <DetailSkeleton />
      </div>
    );
  }

  if (!details) {
    return (
      <div>
        <PageHeader
          title="Job Not Found"
          actions={
            <Button variant="secondary" onClick={() => navigate('/ppf')}>
              Back to Jobs
            </Button>
          }
        />
        <Card padding="none">
          <EmptyState
            title="Job card not found"
            description="This job may have been removed or the link is invalid."
            action={{ label: 'Return to PPF Studio', onClick: () => navigate('/ppf') }}
          />
        </Card>
      </div>
    );
  }

  const { job, customer, vehicle, package: pkg, roll, brand, materials, labor, sale, payments, warranty } =
    details;
  const statusConfig = PPF_STATUS_CONFIG[job.status];
  const nextStatuses = STATUS_FLOW[job.status];
  const totalMaterialCost = materials.reduce((sum, m) => sum + m.material_cost, 0);
  const totalLaborCost = labor
    ? labor.application_cost + labor.polishing_cost + labor.washing_cost + labor.misc_cost
    : 0;
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const balanceDue = sale ? Math.max(0, sale.final_price - totalPaid) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <PageHeader
        title={`Job ${job.job_id}`}
        subtitle={
          customer
            ? `${customer.full_name} · ${vehicle ? `${vehicle.make} ${vehicle.model}` : 'No vehicle'}`
            : 'PPF job details'
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="accent" dot pulse={job.status === 'in_progress'}>
              {statusConfig.label}
            </Badge>
            <Button variant="secondary" size="sm" onClick={() => navigate('/ppf')}>
              Back
            </Button>
          </div>
        }
      />

      {nextStatuses.length > 0 && (
        <Card className="no-print mb-6 border-accent/20 bg-accent/5" padding="md">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">Update job status</p>
              <p className="text-xs text-[var(--text-secondary)]">
                Move this job to the next stage in the pipeline
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {nextStatuses.map((next) => (
                <Button
                  key={next}
                  size="sm"
                  loading={updating}
                  onClick={() => handleStatusUpdate(next)}
                >
                  Mark as {PPF_STATUS_CONFIG[next].label}
                </Button>
              ))}
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <EditableCard
          title="Customer"
          subtitle="PPF customer profile"
          onEdit={customer ? () => setEditCustomerOpen(true) : undefined}
        >
          <dl className="space-y-3">
            <DetailRow label="Name" value={customer?.full_name ?? '—'} />
            <DetailRow label="Mobile" value={customer?.mobile ?? '—'} />
            <DetailRow label="WhatsApp" value={customer?.whatsapp ?? '—'} />
            <DetailRow label="Email" value={customer?.email || '—'} />
            <DetailRow
              label="Location"
              value={
                customer?.city
                  ? `${customer.address ? `${customer.address}, ` : ''}${customer.city}`
                  : '—'
              }
            />
          </dl>
        </EditableCard>

        <Card>
          <CardHeader>
            <CardTitle>Vehicle</CardTitle>
            <CardDescription>Vehicle being protected</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3">
              <DetailRow
                label="Make & Model"
                value={
                  vehicle ? `${vehicle.make} ${vehicle.model} ${vehicle.variant}` : '—'
                }
              />
              <DetailRow label="Year" value={vehicle?.model_year ?? '—'} />
              <DetailRow label="Registration" value={vehicle?.registration_number ?? '—'} />
              <DetailRow label="Color" value={vehicle?.color ?? '—'} />
            </dl>
          </CardContent>
        </Card>

        <EditableCard
          title="Package & Assignment"
          subtitle="Service package and installer"
          onEdit={() => setEditJobOpen(true)}
        >
          <dl className="space-y-3">
            <DetailRow label="Package" value={pkg?.package_name ?? '—'} />
            <DetailRow
              label="Est. film usage"
              value={pkg ? `${pkg.estimated_film_usage} m` : '—'}
            />
            <DetailRow
              label="Est. labor"
              value={pkg ? formatPKR(pkg.estimated_labor_cost) : '—'}
            />
            <DetailRow label="Installer" value={job.installer_name} />
            <DetailRow label="Booked" value={formatDate(job.booked_date)} />
            <DetailRow
              label="Completed"
              value={job.completion_date ? formatDate(job.completion_date) : 'Pending'}
            />
            <DetailRow label="Warranty period" value={`${job.warranty_period} years`} />
            {job.notes && <DetailRow label="Notes" value={job.notes} />}
          </dl>
        </EditableCard>

        <Card>
          <CardHeader>
            <CardTitle>Roll used on this job</CardTitle>
            <CardDescription>One full roll dedicated to this vehicle</CardDescription>
          </CardHeader>
          <CardContent>
            {roll ? (
              <dl className="space-y-3">
                <DetailRow label="Roll ID" value={roll.roll_id} />
                <DetailRow label="Brand" value={brand?.brand_name ?? '—'} />
                <DetailRow label="Film type" value={roll.film_type} />
                <DetailRow label="Purchase cost" value={formatPKR(roll.purchase_cost)} />
                <DetailRow label="Supplier" value={roll.supplier || '—'} />
                <div className="rounded-lg border border-blue-200/60 bg-blue-50/60 px-3 py-2 text-xs dark:border-blue-900/40 dark:bg-blue-950/20">
                  <p className="font-medium text-blue-800 dark:text-blue-300">
                    This roll left inventory when the job was booked
                  </p>
                </div>
              </dl>
            ) : (
              <EmptyState
                title="No roll assigned"
                description="This job does not have a film roll linked."
                className="py-8"
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Materials</CardTitle>
            <CardDescription>Film usage and material cost</CardDescription>
          </CardHeader>
          <CardContent>
            {materials.length === 0 ? (
              <EmptyState
                title="No material usage recorded"
                description="Material entries appear when film is applied."
                className="py-8"
              />
            ) : (
              <div className="space-y-3">
                {materials.map((material) => {
                  const materialRoll = store.getPPFRolls().find((r) => r.roll_id === material.roll_id);
                  return (
                    <div
                      key={material.material_id}
                      className="rounded-lg border border-[var(--border-secondary)] p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-[var(--text-primary)]">
                          {materialRoll?.film_type ?? material.roll_id}
                        </span>
                        <Badge variant="warning">{material.meters_used} m</Badge>
                      </div>
                      <p className="mt-1 text-xs text-[var(--text-secondary)]">
                        Material cost: {formatPKR(material.material_cost)}
                      </p>
                    </div>
                  );
                })}
                <div className="flex justify-between border-t border-[var(--border-secondary)] pt-3 text-sm font-semibold">
                  <span>Total material cost</span>
                  <span>{formatPKR(totalMaterialCost)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Labor Cost Breakdown</CardTitle>
            <CardDescription>Application and prep costs</CardDescription>
          </CardHeader>
          <CardContent>
            {labor ? (
              <dl className="space-y-3">
                <DetailRow label="Application" value={formatPKR(labor.application_cost)} />
                <DetailRow label="Polishing" value={formatPKR(labor.polishing_cost)} />
                <DetailRow label="Washing" value={formatPKR(labor.washing_cost)} />
                <DetailRow label="Miscellaneous" value={formatPKR(labor.misc_cost)} />
                <div className="flex justify-between border-t border-[var(--border-secondary)] pt-3 text-sm font-semibold">
                  <span>Total labor</span>
                  <span>{formatPKR(totalLaborCost)}</span>
                </div>
              </dl>
            ) : (
              <EmptyState
                title="No labor costs recorded"
                description="Labor breakdown will appear once work begins."
                className="py-8"
              />
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Invoice & Payments</CardTitle>
            <CardDescription>Billing summary and payment history</CardDescription>
          </CardHeader>
          <CardContent>
            {sale ? (
              <div className="grid gap-6 lg:grid-cols-2">
                <dl className="space-y-3">
                  <DetailRow label="Invoice" value={sale.invoice_number} />
                  <DetailRow label="Sale date" value={formatDate(sale.sale_date)} />
                  <DetailRow label="Total cost" value={formatPKR(sale.total_cost)} />
                  <DetailRow label="Discount" value={formatPKR(sale.discount)} />
                  <DetailRow
                    label="Final price"
                    value={
                      <span className="text-base font-bold text-[var(--text-primary)]">
                        {formatPKR(sale.final_price)}
                      </span>
                    }
                  />
                  <DetailRow
                    label="Balance due"
                    value={
                      <span
                        className={cn(
                          'font-semibold',
                          balanceDue > 0
                            ? 'text-amber-700 dark:text-amber-400'
                            : 'text-emerald-700 dark:text-emerald-400',
                        )}
                      >
                        {balanceDue > 0 ? formatPKR(balanceDue) : 'Paid in full'}
                      </span>
                    }
                  />
                </dl>

                <div>
                  <p className="mb-3 text-sm font-medium text-[var(--text-primary)]">Payments</p>
                  {payments.length === 0 ? (
                    <p className="text-sm text-[var(--text-secondary)]">No payments recorded yet.</p>
                  ) : (
                    <div className="space-y-2">
                      <AnimatePresence>
                        {payments.map((payment, index) => (
                          <motion.div
                            key={payment.payment_id}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="flex flex-col gap-1 rounded-lg border border-[var(--border-secondary)] p-3 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div>
                              <p className="text-sm font-medium text-[var(--text-primary)]">
                                {formatPKR(payment.amount)}
                              </p>
                              <p className="text-xs text-[var(--text-secondary)]">
                                {formatPaymentMethod(payment.payment_method)} ·{' '}
                                {payment.reference_number}
                              </p>
                            </div>
                            <span className="text-xs text-[var(--text-tertiary)]">
                              {formatDate(payment.payment_date)}
                            </span>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                      <div className="flex justify-between pt-2 text-sm font-semibold">
                        <span>Total paid</span>
                        <span className="text-emerald-700 dark:text-emerald-400">
                          {formatPKR(totalPaid)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <EmptyState
                title="No invoice yet"
                description="An invoice is generated when the job is completed and priced."
                className="py-8"
              />
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Warranty</CardTitle>
            <CardDescription>Coverage and terms</CardDescription>
          </CardHeader>
          <CardContent>
            {warranty ? (
              <dl className="space-y-3">
                <DetailRow label="Warranty number" value={warranty.warranty_number} />
                <DetailRow label="Expiry date" value={formatDate(warranty.expiry_date)} />
                <DetailRow label="Terms" value={warranty.terms} />
              </dl>
            ) : (
              <EmptyState
                title="Warranty not issued"
                description={
                  job.status === 'completed' || job.status === 'delivered'
                    ? 'Warranty details will be added upon delivery.'
                    : 'Warranty is issued when the job is completed.'
                }
                className="py-8"
              />
            )}
          </CardContent>
        </Card>
      </div>

      {customer && (
        <EditRecordModal
          open={editCustomerOpen}
          onClose={() => setEditCustomerOpen(false)}
          title="Edit PPF customer"
          fields={PPF_CUSTOMER_EDIT_FIELDS}
          values={{
            full_name: customer.full_name,
            mobile: customer.mobile,
            whatsapp: customer.whatsapp,
            email: customer.email,
            address: customer.address,
            city: customer.city,
          }}
          onSave={handleSaveCustomer}
          saving={saving}
        />
      )}

      <EditRecordModal
        open={editJobOpen}
        onClose={() => setEditJobOpen(false)}
        title="Edit job details"
        fields={PPF_JOB_EDIT_FIELDS}
        values={{
          installer_name: job.installer_name,
          booked_date: job.booked_date,
          completion_date: job.completion_date ?? '',
          warranty_period: String(job.warranty_period),
          notes: job.notes,
        }}
        onSave={handleSaveJob}
        saving={saving}
      />
    </motion.div>
  );
}
