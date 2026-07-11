import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PPFStudioNav } from '@/components/ppf/PPFStudioNav';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Textarea } from '@/components/ui/Textarea';
import { store } from '@/data/store';
import type { PPFJobStatus, PPFJobCard } from '@/types';
import { PPF_STATUS_CONFIG } from '@/utils/constants';
import { cn, formatDate } from '@/utils/format';

const STATUSES: PPFJobStatus[] = ['booked', 'in_progress', 'completed', 'delivered'];

const STATUS_OPTIONS = STATUSES.map((status) => ({
  value: status,
  label: PPF_STATUS_CONFIG[status].label,
}));

const todayISO = () => new Date().toISOString().slice(0, 10);

interface NewJobForm {
  full_name: string;
  mobile: string;
  whatsapp: string;
  email: string;
  city: string;
  address: string;
  make: string;
  model: string;
  variant: string;
  model_year: string;
  registration_number: string;
  color: string;
  package_id: string;
  roll_id: string;
  installer_name: string;
  booked_date: string;
  warranty_period: string;
  status: PPFJobStatus;
  notes: string;
}

const emptyForm = (): NewJobForm => ({
  full_name: '',
  mobile: '',
  whatsapp: '',
  email: '',
  city: '',
  address: '',
  make: '',
  model: '',
  variant: '',
  model_year: String(new Date().getFullYear()),
  registration_number: '',
  color: '',
  package_id: '',
  roll_id: '',
  installer_name: '',
  booked_date: todayISO(),
  warranty_period: '12',
  status: 'booked',
  notes: '',
});

function NewJobModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState<NewJobForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const packageOptions = useMemo(
    () =>
      store.getPPFPackages().map((pkg) => ({
        value: pkg.package_id,
        label: pkg.package_name,
      })),
    [open],
  );

  const rollOptions = useMemo(() => {
    const brands = store.getPPFBrands();
    return store.getAvailablePPFRolls().map((roll) => {
      const brand = brands.find((b) => b.brand_id === roll.brand_id);
      const meters = Math.round(roll.remaining_length);
      return {
        value: roll.roll_id,
        label: `${brand?.brand_name ?? 'Roll'} · ${roll.film_type} (${meters}m · in stock)`,
      };
    });
  }, [open]);

  useEffect(() => {
    if (open) {
      setForm(emptyForm());
      setError(null);
    }
  }, [open]);

  const update = <K extends keyof NewJobForm>(key: K, value: NewJobForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const canSubmit =
    form.full_name.trim() !== '' &&
    form.make.trim() !== '' &&
    form.model.trim() !== '' &&
    form.package_id !== '' &&
    form.roll_id !== '' &&
    form.installer_name.trim() !== '' &&
    form.booked_date !== '';

  const handleSubmit = async () => {
    if (!canSubmit || saving) return;
    setSaving(true);
    setError(null);
    try {
      const customer = await store.createPPFCustomer({
        full_name: form.full_name,
        mobile: form.mobile,
        whatsapp: form.whatsapp || form.mobile,
        email: form.email,
        address: form.address,
        city: form.city,
      });

      const vehicle = await store.createPPFVehicle({
        ppf_customer_id: customer.ppf_customer_id,
        make: form.make,
        model: form.model,
        variant: form.variant,
        model_year: Number(form.model_year) || new Date().getFullYear(),
        registration_number: form.registration_number,
        color: form.color,
      });

      const job = await store.createPPFJob({
        ppf_customer_id: customer.ppf_customer_id,
        ppf_vehicle_id: vehicle.ppf_vehicle_id,
        package_id: form.package_id,
        roll_id: form.roll_id,
        installer_name: form.installer_name,
        booked_date: form.booked_date,
        warranty_period: Number(form.warranty_period) || 12,
        status: form.status,
        notes: form.notes,
      });

      if (!job) {
        setError('That roll is already assigned to another vehicle. Pick an in-stock roll.');
        return;
      }

      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create job. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={saving ? () => undefined : onClose}
      title="New PPF Job"
      description="Add a customer, their vehicle, and book a paint protection film job."
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit} loading={saving}>
            Create job
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
            Customer
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              label="Full name"
              value={form.full_name}
              onChange={(e) => update('full_name', e.target.value)}
              placeholder="e.g. Ali Raza"
            />
            <Input
              label="Mobile"
              value={form.mobile}
              onChange={(e) => update('mobile', e.target.value)}
              placeholder="03xx-xxxxxxx"
            />
            <Input
              label="WhatsApp"
              value={form.whatsapp}
              onChange={(e) => update('whatsapp', e.target.value)}
              placeholder="Optional (defaults to mobile)"
            />
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              placeholder="Optional"
            />
            <Input
              label="City"
              value={form.city}
              onChange={(e) => update('city', e.target.value)}
              placeholder="e.g. Islamabad"
            />
            <Input
              label="Address"
              value={form.address}
              onChange={(e) => update('address', e.target.value)}
              placeholder="Optional"
            />
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
            Vehicle
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              label="Make"
              value={form.make}
              onChange={(e) => update('make', e.target.value)}
              placeholder="e.g. Toyota"
            />
            <Input
              label="Model"
              value={form.model}
              onChange={(e) => update('model', e.target.value)}
              placeholder="e.g. Fortuner"
            />
            <Input
              label="Variant"
              value={form.variant}
              onChange={(e) => update('variant', e.target.value)}
              placeholder="Optional"
            />
            <Input
              label="Model year"
              type="number"
              value={form.model_year}
              onChange={(e) => update('model_year', e.target.value)}
            />
            <Input
              label="Registration #"
              value={form.registration_number}
              onChange={(e) => update('registration_number', e.target.value)}
              placeholder="Optional"
            />
            <Input
              label="Color"
              value={form.color}
              onChange={(e) => update('color', e.target.value)}
              placeholder="Optional"
            />
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
            Job details
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Select
              label="Package"
              options={packageOptions}
              placeholder="Select package"
              value={form.package_id}
              onChange={(e) => update('package_id', e.target.value)}
            />
            <Select
              label="Roll / film"
              options={rollOptions}
              placeholder={rollOptions.length > 0 ? 'Select in-stock roll' : 'No rolls in stock'}
              value={form.roll_id}
              onChange={(e) => update('roll_id', e.target.value)}
              hint="One roll is dedicated to one vehicle job"
            />
            <Input
              label="Installer"
              value={form.installer_name}
              onChange={(e) => update('installer_name', e.target.value)}
              placeholder="e.g. Tariq Installer"
            />
            <Input
              label="Booked date"
              type="date"
              value={form.booked_date}
              onChange={(e) => update('booked_date', e.target.value)}
            />
            <Input
              label="Warranty (months)"
              type="number"
              value={form.warranty_period}
              onChange={(e) => update('warranty_period', e.target.value)}
            />
            <Select
              label="Status"
              options={STATUS_OPTIONS}
              value={form.status}
              onChange={(e) => update('status', e.target.value as PPFJobStatus)}
            />
          </div>
          <Textarea
            label="Notes"
            value={form.notes}
            onChange={(e) => update('notes', e.target.value)}
            placeholder="Optional notes about the job"
          />
        </section>

        {error && (
          <p className="rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-500">
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}

function useJobsData(refreshKey: number) {
  return useMemo(() => {
    void refreshKey;
    const jobs = store.getPPFJobCards();
    const customers = store.getPPFCustomers();
    const vehicles = store.getPPFVehicles();
    const packages = store.getPPFPackages();

    const enriched = jobs.map((job) => {
      const customer = customers.find((c) => c.ppf_customer_id === job.ppf_customer_id);
      const vehicle = vehicles.find((v) => v.ppf_vehicle_id === job.ppf_vehicle_id);
      const pkg = packages.find((p) => p.package_id === job.package_id);
      return { job, customer, vehicle, package: pkg };
    });

    const byStatus = STATUSES.reduce(
      (acc, status) => {
        acc[status] = enriched.filter(({ job }) => job.status === status);
        return acc;
      },
      {} as Record<PPFJobStatus, typeof enriched>,
    );

    return { jobs: enriched, byStatus, total: jobs.length };
  }, [refreshKey]);
}

function JobCard({
  job,
  customerName,
  vehicleLabel,
  packageName,
  onNavigate,
}: {
  job: PPFJobCard;
  customerName: string;
  vehicleLabel: string;
  packageName: string;
  onNavigate: () => void;
}) {
  const config = PPF_STATUS_CONFIG[job.status];

  return (
    <motion.button
      type="button"
      layout
      layoutId={`job-card-${job.job_id}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
      onClick={onNavigate}
      className="w-full rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-4 text-left shadow-[var(--shadow-soft)] transition-shadow hover:border-accent/30 hover:shadow-[var(--shadow-card)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-mono text-xs text-[var(--text-tertiary)]">{job.job_id}</span>
        <Badge variant="default" dot className={cn(config.bgColor, config.color)}>
          {config.label}
        </Badge>
      </div>
      <p className="mt-2 truncate text-sm font-semibold text-[var(--text-primary)]">{customerName}</p>
      <p className="mt-0.5 truncate text-xs text-[var(--text-secondary)]">{vehicleLabel}</p>
      <p className="mt-2 truncate text-xs text-[var(--text-tertiary)]">{packageName}</p>
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-[var(--border-secondary)] pt-3">
        <span className="truncate text-xs text-[var(--text-secondary)]">{job.installer_name}</span>
        <span className="shrink-0 text-xs text-[var(--text-tertiary)]">{formatDate(job.booked_date)}</span>
      </div>
    </motion.button>
  );
}

function KanbanColumn({
  status,
  items,
  onNavigate,
}: {
  status: PPFJobStatus;
  items: ReturnType<typeof useJobsData>['byStatus'][PPFJobStatus];
  onNavigate: (jobId: string) => void;
}) {
  const config = PPF_STATUS_CONFIG[status];

  return (
    <motion.div
      layout
      className="flex h-full min-h-[320px] w-[280px] shrink-0 flex-col rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)]/50 md:w-auto md:min-w-0 md:flex-1"
    >
      <div className="flex items-center gap-2 border-b border-[var(--border-primary)] px-4 py-3">
        <span className={cn('h-2 w-2 rounded-full', config.dotColor)} />
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">{config.label}</h3>
        <Badge variant="default" className="ml-auto">
          {items.length}
        </Badge>
      </div>
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
        <AnimatePresence mode="popLayout">
          {items.length === 0 ? (
            <motion.p
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-8 text-center text-xs text-[var(--text-tertiary)]"
            >
              No jobs in this stage
            </motion.p>
          ) : (
            items.map(({ job, customer, vehicle, package: pkg }) => (
              <JobCard
                key={job.job_id}
                job={job}
                customerName={customer?.full_name ?? 'Unknown customer'}
                vehicleLabel={
                  vehicle
                    ? `${vehicle.make} ${vehicle.model} ${vehicle.model_year}`
                    : 'Unknown vehicle'
                }
                packageName={pkg?.package_name ?? 'Unknown package'}
                onNavigate={() => onNavigate(job.job_id)}
              />
            ))
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function JobsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="min-w-[280px] flex-1 space-y-3 rounded-xl border border-[var(--border-primary)] p-4">
            <Skeleton className="h-5 w-1/2" />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ))}
      </div>
    </div>
  );
}

export function PPFJobsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [newJobOpen, setNewJobOpen] = useState(false);
  const { byStatus, total } = useJobsData(refreshKey);

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 350);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const onFocus = () => setRefreshKey((k) => k + 1);
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  const handleNavigate = useCallback(
    (jobId: string) => {
      navigate(`/ppf/jobs/${jobId}`);
    },
    [navigate],
  );

  const activeCount = byStatus.booked.length + byStatus.in_progress.length;

  const handleJobCreated = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  if (loading) {
    return (
      <div>
        <PageHeader title="PPF Studio" subtitle="Track paint protection film jobs by stage" />
        <JobsSkeleton />
      </div>
    );
  }

  if (total === 0) {
    return (
      <div>
        <PageHeader
          title="PPF Studio"
          subtitle="Track paint protection film jobs by stage"
          actions={
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => navigate('/ppf/rolls')}>
                View Rolls
              </Button>
              <Button onClick={() => setNewJobOpen(true)}>New Job</Button>
            </div>
          }
        />
        <PPFStudioNav />
        <Card padding="none">
          <EmptyState
            title="No PPF jobs yet"
            description="Book your first paint protection film job to get started."
            action={{ label: 'New Job', onClick: () => setNewJobOpen(true) }}
          />
        </Card>
        <NewJobModal open={newJobOpen} onClose={() => setNewJobOpen(false)} onCreated={handleJobCreated} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="PPF Studio"
        subtitle={`${activeCount} active job${activeCount === 1 ? '' : 's'} across the pipeline`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link to="/ppf/rolls">
              <Button variant="secondary" size="sm">
                Roll Inventory
              </Button>
            </Link>
            <Button size="sm" onClick={() => setNewJobOpen(true)}>
              New Job
            </Button>
          </div>
        }
      />

      <PPFStudioNav />

      {/* Mobile: tabbed kanban */}
      <div className="lg:hidden">
        <Tabs defaultValue="booked">
          <TabsList className="w-full overflow-x-auto">
            {STATUSES.map((status) => (
              <TabsTrigger key={status} value={status} className="shrink-0">
                {PPF_STATUS_CONFIG[status].label}
                <Badge variant="default" className="ml-1.5 px-1.5 py-0 text-[10px]">
                  {byStatus[status].length}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>
          {STATUSES.map((status) => (
            <TabsContent key={status} value={status}>
              <LayoutGroup>
                <div className="flex flex-col gap-3">
                  <AnimatePresence mode="popLayout">
                    {byStatus[status].map(({ job, customer, vehicle, package: pkg }) => (
                      <JobCard
                        key={job.job_id}
                        job={job}
                        customerName={customer?.full_name ?? 'Unknown customer'}
                        vehicleLabel={
                          vehicle
                            ? `${vehicle.make} ${vehicle.model} ${vehicle.model_year}`
                            : 'Unknown vehicle'
                        }
                        packageName={pkg?.package_name ?? 'Unknown package'}
                        onNavigate={() => handleNavigate(job.job_id)}
                      />
                    ))}
                  </AnimatePresence>
                  {byStatus[status].length === 0 && (
                    <EmptyState
                      title={`No ${PPF_STATUS_CONFIG[status].label.toLowerCase()} jobs`}
                      description="Jobs will show up here as they move through the pipeline."
                      className="py-10"
                    />
                  )}
                </div>
              </LayoutGroup>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Desktop: horizontal scroll / grid kanban */}
      <div className="hidden lg:block">
        <LayoutGroup>
          <motion.div
            layout
            className="flex gap-4 overflow-x-auto pb-2 xl:grid xl:grid-cols-4 xl:overflow-visible"
          >
            {STATUSES.map((status) => (
              <KanbanColumn
                key={status}
                status={status}
                items={byStatus[status]}
                onNavigate={handleNavigate}
              />
            ))}
          </motion.div>
        </LayoutGroup>
      </div>

      <NewJobModal open={newJobOpen} onClose={() => setNewJobOpen(false)} onCreated={handleJobCreated} />
    </div>
  );
}
